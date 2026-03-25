def merge_contract_fields(content: str, lead: dict, quote: dict) -> str:
    """Merge template fields with actual data"""
    if lead:
        content = content.replace("{{client_name}}", f"{lead.get('first_name', '')} {lead.get('last_name', '')}".strip())
        content = content.replace("{{company_name}}", lead.get("company_name") or lead.get("company") or "")
        content = content.replace("{{email}}", lead.get("email") or "")
    content = content.replace("{{business_name}}", "DME R'US")
    content = content.replace("{{provider_name}}", "DME R'US")
    content = content.replace("{{quote_name}}", quote.get("name") or "")
    content = content.replace("{{quote_total}}", f"${quote.get('total', 0):,.2f}")
    content = content.replace("{{date}}", datetime.now().strftime("%B %d, %Y"))
    content = content.replace("{{valid_until}}", quote.get("valid_until") or "")
    return content

@api_router.get("/public/quote/{quote_id}")
async def get_public_quote(quote_id: str):
    """Get quote details for public signing page with multiple documents"""
    quote = await db.lead_quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Check if already signed
    if quote.get("signed_at"):
        return {"quote": quote, "already_signed": True, "documents": []}
    
    # Get lead info
    lead = await db.leads.find_one({"id": quote.get("lead_id")}, {"_id": 0})
    
    # Get all contract documents for this quote
    documents = []
    document_ids = quote.get("contract_document_ids", [])
    
    # Add main contract template if exists (for backward compatibility)
    if quote.get("contract_template_id") and quote.get("contract_template_id") not in document_ids:
        document_ids.insert(0, quote.get("contract_template_id"))
    
    if document_ids:
        # Fetch all templates
        templates = await db.contract_templates.find(
            {"id": {"$in": document_ids}}, {"_id": 0}
        ).to_list(50)
        
        # Create a map for ordering
        template_map = {t["id"]: t for t in templates}
        
        # Process in order
        for doc_id in document_ids:
            template = template_map.get(doc_id)
            if template:
                merged_content = merge_contract_fields(template.get("content", ""), lead, quote)
                documents.append({
                    "id": template["id"],
                    "name": template.get("name"),
                    "document_type": template.get("document_type", "service_agreement"),
                    "content": merged_content,
                    "sort_order": template.get("sort_order", 0),
                    "requires_signature": True
                })
    
    # Get company settings
    settings = await db.settings.find_one({"type": "general"}, {"_id": 0})
    company_name = settings.get("company_name", "DME R'US") if settings else "DME R'US"
    
    # Enrich items with price options from product/service catalog if missing
    enriched_items = []
    for item in quote.get("items", []):
        enriched = dict(item)
        if not enriched.get("price_monthly") and not enriched.get("price_yearly") and enriched.get("item_id"):
            catalog_item = await db.products.find_one({"id": enriched["item_id"]}, {"_id": 0})
            if not catalog_item:
                catalog_item = await db.services.find_one({"id": enriched["item_id"]}, {"_id": 0})
            if catalog_item:
                enriched["price_monthly"] = catalog_item.get("price_monthly", 0)
                enriched["price_yearly"] = catalog_item.get("price_yearly", 0)
                enriched["price_onetime"] = catalog_item.get("price_onetime", 0)
        enriched_items.append(enriched)
    
    enriched_quote = dict(quote)
    enriched_quote["items"] = enriched_items

    return {
        "quote": enriched_quote,
        "lead": {
            "first_name": lead.get("first_name") if lead else "",
            "last_name": lead.get("last_name") if lead else "",
            "company_name": lead.get("company_name") or lead.get("company") if lead else "",
            "email": lead.get("email") if lead else ""
        },
        "documents": documents,
        "total_documents": len(documents),
        "company_name": company_name,
        "already_signed": False
    }

@api_router.post("/public/quote/{quote_id}/sign")
async def sign_quote_public(quote_id: str, data: PublicSignatureRequest, request: Request):
    """Sign a quote with multiple documents - creates immutable contract book"""
    quote = await db.lead_quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    if quote.get("signed_at"):
        raise HTTPException(status_code=400, detail="Quote already signed")
    
    lead_id = quote.get("lead_id")
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Validate that all documents are signed
    document_ids = quote.get("contract_document_ids", [])
    if quote.get("contract_template_id") and quote.get("contract_template_id") not in document_ids:
        document_ids.insert(0, quote.get("contract_template_id"))
    
    if len(data.document_signatures) != len(document_ids):
        raise HTTPException(status_code=400, detail="All documents must be signed")
    
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    signed_at = datetime.now(timezone.utc).isoformat()
    
    # Prepare signed documents for contract book
    signed_documents = []
    signature_ids = []
    
    for doc_sig in data.document_signatures:
        doc_id = doc_sig.get("document_id")
        sig_data = doc_sig.get("signature_data")
        
        # Get the template
        template = await db.contract_templates.find_one({"id": doc_id}, {"_id": 0})
        if not template:
            continue
        
        # Merge fields
        merged_content = merge_contract_fields(template.get("content", ""), lead, quote)
        
        # Store individual signature
        signature = {
            "id": str(uuid.uuid4()),
            "document_id": doc_id,
            "document_name": template.get("name"),
            "document_type": template.get("document_type", "service_agreement"),
            "quote_id": quote_id,
            "signer_name": data.signer_name,
            "signer_email": data.signer_email,
            "signature_data": sig_data,
            "signed_at": signed_at,
            "ip_address": client_ip,
            "verified": True
        }
        await db.signatures.insert_one(signature)
        signature_ids.append(signature["id"])
        
        signed_documents.append({
            "document_id": doc_id,
            "document_name": template.get("name"),
            "document_type": template.get("document_type", "service_agreement"),
            "content": merged_content,
            "signature_id": signature["id"],
            "signature_data": sig_data,
            "signed_at": signed_at
        })
    
    # Update quote with signature info
    await db.lead_quotes.update_one(
        {"id": quote_id},
        {"$set": {
            "signed_at": signed_at,
            "signed_by": data.signer_name,
            "signed_by_email": data.signer_email,
            "signature_ids": signature_ids,
            "documents_signed": len(signed_documents),
            "status": "signed"
        }}
    )
    
    # Convert lead to client (transfer ALL data)
    client_id = str(uuid.uuid4())
    client_name = lead.get("company_name") or lead.get("company") or f"{lead.get('first_name', '')} {lead.get('last_name', '')}".strip()
    
    client = {
        "id": client_id,
        "first_name": lead.get("first_name", ""),
        "last_name": lead.get("last_name", ""),
        "email": lead.get("email", ""),
        "phone": lead.get("phone", ""),
        "company_name": client_name,
        "job_title": lead.get("job_title", ""),
        "company_size": lead.get("company_size"),
        "website": lead.get("website"),
        "address": lead.get("address"),
        "city": lead.get("city"),
        "state": lead.get("state"),
        "zip_code": lead.get("zip_code"),
        "licensed_states": lead.get("licensed_states", []),
        "dme_categories": lead.get("dme_categories", []),
        "npi_number": lead.get("npi_number"),
        "products": [],
        "services": [],
        "status": "active",
        "source": lead.get("source", "quote_conversion"),
        "notes": lead.get("notes", ""),
        "original_lead_id": lead_id,
        "converted_from_quote_id": quote_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "converted_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Extract products and services from quote items
    for item in quote.get("items", []):
        item_data = {
            "name": item.get("description"),
            "quantity": item.get("quantity", 1),
