async def update_lead_positions(updates: List[Dict[str, Any]], current_user: dict = Depends(get_current_user)):
    """Update multiple lead positions for kanban drag & drop"""
    for update in updates:
        await db.leads.update_one(
            {"id": update["id"]},
            {"$set": {"status": update.get("status"), "kanban_position": update.get("position", 0)}}
        )
    return {"success": True}


# ============ Lead Quotes (Calculator) ============

class QuoteLineItem(BaseModel):
    description: str
    quantity: float = 1
    unit_price: float = 0
    billing_type: str = "onetime"  # onetime, monthly, yearly
    item_type: Optional[str] = "custom"  # custom, product, service
    item_id: Optional[str] = None  # Reference to product/service ID
    sku: Optional[str] = None
    category: Optional[str] = None
    price_onetime: Optional[float] = None
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    is_changed: bool = False  # Track if item was modified after being sent

class QuoteCreate(BaseModel):
    name: str
    items: List[QuoteLineItem] = []
    notes: Optional[str] = None
    valid_until: Optional[str] = None
    total: Optional[float] = None
    total_onetime: Optional[float] = None
    total_monthly: Optional[float] = None
    total_yearly: Optional[float] = None
    contract_template_id: Optional[str] = None  # Primary contract document
    contract_template_name: Optional[str] = None
    contract_document_ids: List[str] = []  # Additional contract documents

class QuoteUpdate(BaseModel):
    name: Optional[str] = None
    items: Optional[List[QuoteLineItem]] = None
    notes: Optional[str] = None
    valid_until: Optional[str] = None
    total: Optional[float] = None
    total_onetime: Optional[float] = None
    total_monthly: Optional[float] = None
    total_yearly: Optional[float] = None
    contract_template_id: Optional[str] = None
    contract_template_name: Optional[str] = None
    contract_document_ids: Optional[List[str]] = None

class UnlockQuoteRequest(BaseModel):
    pin: str

class EmailQuoteRequest(BaseModel):
    to_email: EmailStr
    lead_name: str

@api_router.get("/leads/{lead_id}/quotes")
async def get_lead_quotes(lead_id: str, current_user: dict = Depends(get_current_user)):
    """Get all quotes for a lead"""
    quotes = await db.lead_quotes.find({"lead_id": lead_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"quotes": quotes}

@api_router.post("/leads/{lead_id}/quotes")
async def create_lead_quote(lead_id: str, data: QuoteCreate, current_user: dict = Depends(get_current_user)):
    """Create a quote for a lead with line items"""
    lead = await db.leads.find_one({"id": lead_id})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Calculate totals from line items by billing type
    items_data = [item.model_dump() for item in data.items]
    total_onetime = sum(item["quantity"] * item["unit_price"] for item in items_data if item.get("billing_type", "onetime") == "onetime")
    total_monthly = sum(item["quantity"] * item["unit_price"] for item in items_data if item.get("billing_type") == "monthly")
    total_yearly = sum(item["quantity"] * item["unit_price"] for item in items_data if item.get("billing_type") == "yearly")
    total = total_onetime + total_monthly + total_yearly
    
    quote = {
        "id": str(uuid.uuid4()),
        "lead_id": lead_id,
        "name": data.name,
        "items": items_data,
        "notes": data.notes,
        "valid_until": data.valid_until,
        "total": total,
        "total_onetime": total_onetime,
        "total_monthly": total_monthly,
        "total_yearly": total_yearly,
        "contract_template_id": data.contract_template_id,
        "contract_template_name": data.contract_template_name,
        "contract_document_ids": data.contract_document_ids or [],
        "status": "draft",
        "version": 1,
        "is_locked": False,
        "sent_at": None,
        "sent_to": None,
        "unlocked_at": None,
        "unlocked_by": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["id"]
    }
    
    await db.lead_quotes.insert_one(quote)
    return {"success": True, "quote": {k: v for k, v in quote.items() if k != "_id"}}

@api_router.put("/leads/{lead_id}/quotes/{quote_id}")
async def update_lead_quote(lead_id: str, quote_id: str, data: QuoteUpdate, current_user: dict = Depends(get_current_user)):
    """Update a quote - fails if locked unless unlocked first"""
    quote = await db.lead_quotes.find_one({"id": quote_id, "lead_id": lead_id})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Check if quote is locked
    if quote.get("is_locked"):
        raise HTTPException(status_code=403, detail="Quote is locked. Unlock it first using admin PIN.")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # Recalculate total if items changed
    if "items" in update_data:
        items_data = [item if isinstance(item, dict) else item.model_dump() for item in update_data["items"]]
        update_data["items"] = items_data
        update_data["total"] = sum(item["quantity"] * item["unit_price"] for item in items_data)
        
        # If quote was previously sent, mark items as changed for tracking
        if quote.get("sent_at"):
            old_items = quote.get("items", [])
            for new_item in items_data:
                # Check if this item was changed
                matching_old = next((o for o in old_items if o.get("description") == new_item.get("description")), None)
                if matching_old:
                    if matching_old.get("quantity") != new_item.get("quantity") or matching_old.get("unit_price") != new_item.get("unit_price"):
                        new_item["is_changed"] = True
                else:
                    new_item["is_changed"] = True  # New item
            update_data["items"] = items_data
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.lead_quotes.update_one({"id": quote_id}, {"$set": update_data})
    
    updated = await db.lead_quotes.find_one({"id": quote_id}, {"_id": 0})
    return {"success": True, "quote": updated}

@api_router.delete("/leads/{lead_id}/quotes/{quote_id}")
async def delete_lead_quote(lead_id: str, quote_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a quote - cannot delete locked quotes"""
    quote = await db.lead_quotes.find_one({"id": quote_id, "lead_id": lead_id})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    if quote.get("is_locked"):
        raise HTTPException(status_code=403, detail="Cannot delete a locked quote. Unlock it first.")
    
    await db.lead_quotes.delete_one({"id": quote_id})
    return {"success": True}

@api_router.post("/leads/{lead_id}/quotes/{quote_id}/unlock")
async def unlock_quote(lead_id: str, quote_id: str, data: UnlockQuoteRequest, current_user: dict = Depends(get_current_user)):
    """Unlock a locked quote using admin PIN"""
    quote = await db.lead_quotes.find_one({"id": quote_id, "lead_id": lead_id})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    if not quote.get("is_locked"):
        return {"success": True, "message": "Quote is already unlocked"}
    
    # Verify user is admin or super_admin
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required to unlock quotes")
    
    # Get admin PIN from user profile
    user = await db.users.find_one({"id": current_user["id"]})
    stored_pin = user.get("admin_pin")
    
    if not stored_pin:
        raise HTTPException(status_code=400, detail="Admin PIN not set. Please set your PIN in your profile settings.")
    
    if data.pin != stored_pin:
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    # Unlock the quote and increment version
    await db.lead_quotes.update_one(
        {"id": quote_id},
        {"$set": {
            "is_locked": False,
            "unlocked_at": datetime.now(timezone.utc).isoformat(),
            "unlocked_by": current_user["id"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        "$inc": {"version": 1}}
    )
    
    # Log the unlock action
    logger.info(f"Quote {quote_id} unlocked by {current_user['email']}")
    
    return {"success": True, "message": "Quote unlocked for editing"}

@api_router.post("/leads/{lead_id}/quotes/{quote_id}/send-email")
async def send_quote_email(lead_id: str, quote_id: str, data: EmailQuoteRequest, current_user: dict = Depends(get_current_user)):
    """Send a quote via email with signing link - locks the quote after sending"""
    quote = await db.lead_quotes.find_one({"id": quote_id, "lead_id": lead_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Get company settings for email template
    settings = await db.settings.find_one({"type": "general"}, {"_id": 0})
    company_name = settings.get("company_name", "DME R'US") if settings else "DME R'US"
    company_phone = settings.get("phone", "(941) 466-4-DME") if settings else "(941) 466-4-DME"
    
    # Get frontend URL for signing link
    frontend_url = os.environ.get("FRONTEND_URL", "https://bot-admin-hub-4.preview.emergentagent.com")
    signing_link = f"{frontend_url}/sign/{quote_id}"
    
    # Format line items for email
    items = quote.get("items", [])
    items_table = ""
    total_onetime = 0
    total_monthly = 0
    total_yearly = 0
    
    for item in items:
        qty = item.get("quantity", 1)
        price = item.get("unit_price", 0)
        line_total = qty * price
        billing_type = item.get("billing_type", "onetime")
        changed_marker = " [UPDATED]" if item.get("is_changed") else ""
        
        # Track totals by type
        if billing_type == "monthly":
            total_monthly += line_total
            billing_suffix = "/mo"
        elif billing_type == "yearly":
            total_yearly += line_total
            billing_suffix = "/yr"
        else:
            total_onetime += line_total
            billing_suffix = ""
        
        items_table += f"  • {item.get('description', 'Item')}{changed_marker}\n"
        items_table += f"    Qty: {qty} × ${price:,.2f} = ${line_total:,.2f}{billing_suffix}\n"
    
    total = quote.get("total", 0)
    valid_until = quote.get("valid_until", "")
    version = quote.get("version", 1)
    
    # Get contract template if attached
    contract_section = ""
    if quote.get("contract_template_id"):
        contract_template = await db.contract_templates.find_one(
            {"id": quote.get("contract_template_id")}, {"_id": 0}
        )
        if contract_template:
            contract_section = f"""

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTRACT: {contract_template.get('name', 'Service Agreement')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{contract_template.get('content', '')}
"""
    
    # Build totals section
    totals_section = ""
    if total_onetime > 0:
        totals_section += f"One-Time Charges: ${total_onetime:,.2f}\n"
    if total_monthly > 0:
        totals_section += f"Monthly Recurring: ${total_monthly:,.2f}/mo\n"
    if total_yearly > 0:
        totals_section += f"Yearly Recurring: ${total_yearly:,.2f}/yr\n"
    if total_onetime > 0 or total_monthly > 0 or total_yearly > 0:
        totals_section += f"\nFIRST INVOICE TOTAL: ${total:,.2f}"
    else:
        totals_section = f"TOTAL: ${total:,.2f}"
    
    # Calculate deposit info
    deposit_amount = total * 0.65
    balance_amount = total * 0.35
    
    # Build email content
    email_subject = f"Your Quote: {quote.get('name', 'Custom Quote')} from {company_name}"
    if version > 1:
        email_subject = f"[REVISED v{version}] " + email_subject
    
    email_body = f"""
Dear {data.lead_name},

Thank you for your interest in {company_name}! Here's your {'revised ' if version > 1 else ''}quote:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ⭐ VIEW & SIGN YOUR QUOTE ⭐
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Click here to review and sign: {signing_link}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUOTE: {quote.get('name', 'Custom Quote')}
Quote Version: {version}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LINE ITEMS:
{items_table or '  • Contact us for details'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{totals_section}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{f"Valid Until: {valid_until}" if valid_until else ""}
{f"Notes: {quote.get('notes')}" if quote.get('notes') else ""}
{contract_section}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAYMENT TERMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• 65% Deposit Due Upon Signing: ${deposit_amount:,.2f}
• Balance Due at Project Go-Live: ${balance_amount:,.2f}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ready to get started? Click the link above to review, sign, and begin your project!

Questions? Reply to this email or call us at {company_phone}.

Best regards,
The {company_name} Team
    """.strip()
    
    # ACTUALLY SEND THE EMAIL using configured provider
    email_result = await send_email(db, data.to_email, email_subject, email_body)
    
    if not email_result.get("success"):
        logger.warning(f"Email sending failed: {email_result.get('message')} - but continuing with quote lock")
    else:
        logger.info(f"Quote email sent successfully to {data.to_email}")
    
    # Store email record
    email_record = {
        "id": str(uuid.uuid4()),
        "type": "quote",
        "to_email": data.to_email,
        "lead_id": lead_id,
        "quote_id": quote_id,
        "subject": email_subject,
        "body": email_body,
        "signing_link": signing_link,
        "status": "sent" if email_result.get("success") else "failed",
        "error": email_result.get("message") if not email_result.get("success") else None,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "sent_by": current_user["id"]
    }
    await db.email_logs.insert_one(email_record)
    
    # Clear any changed markers and LOCK the quote after sending
    clean_items = quote.get("items", [])
    for item in clean_items:
        item["is_changed"] = False
    
    await db.lead_quotes.update_one(
        {"id": quote_id},
        {"$set": {
            "status": "sent",
            "is_locked": True,  # Lock the quote after emailing
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "sent_to": data.to_email,
            "items": clean_items,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "success": True, 
        "message": f"Quote emailed to {data.to_email}. Quote is now locked.",
        "email_id": email_record["id"],
        "signing_link": signing_link
    }

@api_router.post("/leads/{lead_id}/quotes/{quote_id}/convert-to-invoice")
async def convert_quote_to_invoice(lead_id: str, quote_id: str, current_user: dict = Depends(get_current_user)):
    """Convert a quote to an invoice - requires the lead to be converted to client first"""
    quote = await db.lead_quotes.find_one({"id": quote_id, "lead_id": lead_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Check if lead has been converted to client (lead is deleted after conversion, so check client)
    client = await db.clients.find_one({"original_lead_id": lead_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=400, detail="Lead must be converted to client before creating an invoice. Use 'Convert to Client' first.")
    
    # Get next invoice number
    settings = await db.settings.find_one({"type": "system"})
    if not settings:
        settings = {"invoice_prefix": "INV", "invoice_next_number": 1001}
    invoice_number = f"{settings.get('invoice_prefix', 'INV')}-{settings.get('invoice_next_number', 1001)}"
    
    # Convert quote items to invoice items
    invoice_items = []
    for item in quote.get("items", []):
        invoice_items.append({
            "name": item.get("description", ""),
            "description": "",
            "quantity": item.get("quantity", 1),
            "unit_price": item.get("unit_price", 0),
            "total": item.get("quantity", 1) * item.get("unit_price", 0)
        })
    
    subtotal = quote.get("total", 0)
    
    invoice = {
        "id": str(uuid.uuid4()),
        "invoice_number": invoice_number,
        "client_id": client["id"],
        "client_name": client.get("company_name") or f"{client.get('first_name', '')} {client.get('last_name', '')}".strip(),
        "client_email": client.get("email"),
        "items": invoice_items,
        "subtotal": subtotal,
        "tax_rate": 0,
        "tax_amount": 0,
        "total": subtotal,
        "notes": f"Converted from Quote: {quote.get('name', 'Quote')}",
        "due_date": quote.get("valid_until"),
        "status": "pending",
        "quote_id": quote_id,  # Reference to original quote
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["id"],
        "paid_at": None,
        "paid_amount": 0
    }
    
    await db.invoices.insert_one(invoice)
