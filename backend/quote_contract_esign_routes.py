from datetime import datetime, timezone
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from auth import decode_token
from email_utils import send_email


router = APIRouter(tags=["QuoteContractESign"])
security = HTTPBearer()
db = None


def set_database(database):
    global db
    db = database


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token_data = decode_token(credentials.credentials)
    if not token_data or not token_data.user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await db.users.find_one({"id": token_data.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


class QuoteItem(BaseModel):
    description: str
    quantity: int = 1
    unit_price: float = 0.0
    item_type: str = "custom"
    billing_type: str = "onetime"
    price_onetime: Optional[float] = None
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    sku: Optional[str] = ""
    category: Optional[str] = ""


class QuoteCreate(BaseModel):
    name: str
    notes: Optional[str] = ""
    valid_until: Optional[str] = ""
    contract_template_id: Optional[str] = ""
    contract_template_name: Optional[str] = ""
    contract_document_ids: List[str] = []
    items: List[QuoteItem]
    total: float = 0.0
    total_onetime: float = 0.0
    total_monthly: float = 0.0
    total_yearly: float = 0.0


class ContractTemplateCreate(BaseModel):
    name: str
    content: str
    description: Optional[str] = ""
    category: Optional[str] = "general"
    is_active: bool = True
    is_default: bool = False
    is_required: bool = False


class SignaturePayload(BaseModel):
    signer_name: str
    signer_email: str
    document_signatures: List[dict]


DEFAULT_TEMPLATES = [
    {
        "name": "Mutual NDA",
        "description": "Mutual non-disclosure agreement",
        "category": "nda",
        "content": "<h2>Mutual NDA</h2><p>This agreement is between {{client_name}} and {{business_name}}.</p>",
        "is_default": False,
        "is_required": False,
    },
    {
        "name": "MSA",
        "description": "Master service agreement",
        "category": "msa",
        "content": "<h2>Master Service Agreement</h2><p>Services are provided to {{client_name}}.</p>",
        "is_default": True,
        "is_required": True,
    },
    {
        "name": "SOW",
        "description": "Statement of work",
        "category": "sow",
        "content": "<h2>Statement of Work</h2><p>Quote: {{quote_name}} | Total: {{quote_total}}</p>",
        "is_default": False,
        "is_required": True,
    },
]


async def _ensure_default_templates(user_id: str):
    count = await db.contract_templates.count_documents({"user_id": user_id})
    if count > 0:
        return
    now = datetime.now(timezone.utc).isoformat()
    docs = []
    for template in DEFAULT_TEMPLATES:
        docs.append(
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "name": template["name"],
                "description": template["description"],
                "category": template["category"],
                "content": template["content"],
                "is_active": True,
                "is_default": template["is_default"],
                "is_required": template["is_required"],
                "created_at": now,
                "updated_at": now,
            }
        )
    await db.contract_templates.insert_many(docs)


@router.get("/contract-templates")
async def list_contract_templates(current_user=Depends(get_current_user)):
    await _ensure_default_templates(current_user["id"])
    templates = await db.contract_templates.find({"user_id": current_user["id"]}, {"_id": 0}).sort("name", 1).to_list(200)
    return {"templates": templates}


@router.post("/contract-templates")
async def create_contract_template(payload: ContractTemplateCreate, current_user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    doc.update(
        {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "created_at": now,
            "updated_at": now,
        }
    )
    if doc.get("is_default"):
        await db.contract_templates.update_many({"user_id": current_user["id"]}, {"$set": {"is_default": False}})
    await db.contract_templates.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/contract-templates/{template_id}")
async def update_contract_template(template_id: str, payload: ContractTemplateCreate, current_user=Depends(get_current_user)):
    update = payload.model_dump()
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    if update.get("is_default"):
        await db.contract_templates.update_many({"user_id": current_user["id"]}, {"$set": {"is_default": False}})
    result = await db.contract_templates.update_one(
        {"id": template_id, "user_id": current_user["id"]},
        {"$set": update},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    template = await db.contract_templates.find_one({"id": template_id, "user_id": current_user["id"]}, {"_id": 0})
    return template


@router.delete("/contract-templates/{template_id}")
async def delete_contract_template(template_id: str, current_user=Depends(get_current_user)):
    result = await db.contract_templates.delete_one({"id": template_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"success": True}


@router.get("/billing/products")
async def list_quote_products(current_user=Depends(get_current_user)):
    products = await db.products.find({}, {"_id": 0}).limit(500).to_list(500)
    return {"products": products}


@router.get("/billing/services")
async def list_quote_services(current_user=Depends(get_current_user)):
    services = await db.services.find({}, {"_id": 0}).limit(500).to_list(500)
    return {"services": services}


@router.get("/leads/{lead_id}/quotes")
async def list_lead_quotes(lead_id: str, current_user=Depends(get_current_user)):
    quotes = await db.quotes.find({"lead_id": lead_id, "user_id": current_user["id"]}, {"_id": 0}).sort("updated_at", -1).to_list(500)
    return {"quotes": quotes}


@router.post("/leads/{lead_id}/quotes")
async def create_lead_quote(lead_id: str, payload: QuoteCreate, current_user=Depends(get_current_user)):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    now = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    doc.update(
        {
            "id": str(uuid.uuid4()),
            "lead_id": lead_id,
            "user_id": current_user["id"],
            "status": "draft",
            "is_locked": False,
            "sent_at": None,
            "signed_at": None,
            "signatures": [],
            "created_at": now,
            "updated_at": now,
        }
    )
    await db.quotes.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/leads/{lead_id}/quotes/{quote_id}")
async def update_lead_quote(lead_id: str, quote_id: str, payload: QuoteCreate, current_user=Depends(get_current_user)):
    update = payload.model_dump()
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.quotes.update_one(
        {"id": quote_id, "lead_id": lead_id, "user_id": current_user["id"]},
        {"$set": update},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    quote = await db.quotes.find_one({"id": quote_id, "lead_id": lead_id, "user_id": current_user["id"]}, {"_id": 0})
    return quote


@router.delete("/leads/{lead_id}/quotes/{quote_id}")
async def delete_lead_quote(lead_id: str, quote_id: str, current_user=Depends(get_current_user)):
    result = await db.quotes.delete_one({"id": quote_id, "lead_id": lead_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"success": True}


@router.post("/leads/{lead_id}/quotes/{quote_id}/send-email")
async def send_quote_email(lead_id: str, quote_id: str, current_user=Depends(get_current_user)):
    quote = await db.quotes.find_one({"id": quote_id, "lead_id": lead_id, "user_id": current_user["id"]}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    recipient = lead.get("primary_email") or lead.get("email")
    if not recipient:
        raise HTTPException(status_code=400, detail="Lead has no email")

    sign_url = f"/sign/{quote_id}"
    subject = f"Quote: {quote.get('name', 'New Quote')}"
    text_body = f"Please review and sign your quote here: {sign_url}"
    html_body = f"<p>Please review and sign your quote here: <a href='{sign_url}'>{sign_url}</a></p>"
    try:
        await send_email(recipient, subject, html_body, text_body)
    except Exception:
        pass

    await db.quotes.update_one(
        {"id": quote_id, "lead_id": lead_id, "user_id": current_user["id"]},
        {"$set": {"status": "sent", "sent_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"success": True, "sign_url": sign_url}


@router.post("/leads/{lead_id}/quotes/{quote_id}/unlock")
async def unlock_quote(lead_id: str, quote_id: str, current_user=Depends(get_current_user)):
    await db.quotes.update_one(
        {"id": quote_id, "lead_id": lead_id, "user_id": current_user["id"]},
        {"$set": {"is_locked": False, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"success": True}


@router.post("/leads/{lead_id}/quotes/{quote_id}/convert-to-invoice")
async def convert_quote_to_invoice(lead_id: str, quote_id: str, current_user=Depends(get_current_user)):
    quote = await db.quotes.find_one({"id": quote_id, "lead_id": lead_id, "user_id": current_user["id"]}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    invoice = {
        "id": str(uuid.uuid4()),
        "quote_id": quote_id,
        "lead_id": lead_id,
        "user_id": current_user["id"],
        "invoice_number": f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}",
        "status": "draft",
        "items": quote.get("items", []),
        "total": quote.get("total", 0),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.invoices.insert_one(invoice)
    invoice.pop("_id", None)
    return {"success": True, "invoice": invoice}


@router.get("/public/quote/{quote_id}")
async def get_public_quote(quote_id: str):
    quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    lead = await db.leads.find_one({"id": quote.get("lead_id")}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    documents = []
    selected_ids = quote.get("contract_document_ids", [])
    if selected_ids:
        templates = await db.contract_templates.find({"id": {"$in": selected_ids}}, {"_id": 0}).to_list(200)
        for t in templates:
            documents.append({"id": t.get("id"), "name": t.get("name"), "content": t.get("content", "")})
    if not documents and quote.get("contract_template_id"):
        template = await db.contract_templates.find_one({"id": quote.get("contract_template_id")}, {"_id": 0})
        if template:
            documents.append({"id": template.get("id"), "name": template.get("name"), "content": template.get("content", "")})

    already_signed = quote.get("status") == "signed"
    return {
        "quote": quote,
        "lead": lead,
        "documents": documents,
        "already_signed": already_signed,
    }


@router.post("/public/quote/{quote_id}/sign")
async def sign_public_quote(quote_id: str, payload: SignaturePayload):
    quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    if quote.get("status") == "signed":
        raise HTTPException(status_code=400, detail="Quote already signed")

    now = datetime.now(timezone.utc).isoformat()
    signatures = []
    for doc_signature in payload.document_signatures:
        signatures.append(
            {
                "id": str(uuid.uuid4()),
                "document_id": doc_signature.get("document_id"),
                "signature_data": doc_signature.get("signature_data"),
                "signer_name": payload.signer_name,
                "signer_email": payload.signer_email,
                "signed_at": now,
            }
        )

    await db.quotes.update_one(
        {"id": quote_id},
        {
            "$set": {
                "status": "signed",
                "is_locked": True,
                "signed_at": now,
                "signatures": signatures,
                "updated_at": now,
            }
        },
    )

    deposit_amount = (quote.get("total") or 0) * 0.65
    balance_amount = (quote.get("total") or 0) - deposit_amount
    return {
        "success": True,
        "documents_signed": len(signatures),
        "deposit_amount": round(deposit_amount, 2),
        "balance_amount": round(balance_amount, 2),
        "contract_book_id": str(uuid.uuid4()),
    }


@router.get("/customers/{customer_id}/quote-lead-link")
async def resolve_customer_lead_link(customer_id: str, current_user=Depends(get_current_user)):
    customer = await db.users.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if customer.get("original_lead_id"):
        return {"lead_id": customer.get("original_lead_id")}

    email = customer.get("email")
    if email:
        lead = await db.leads.find_one({"$or": [{"primary_email": email}, {"email": email}]}, {"_id": 0, "id": 1})
        if lead:
            return {"lead_id": lead.get("id")}

    # Auto-provision a lead so quote builder is always available on client page
    now = datetime.now(timezone.utc).isoformat()
    lead_id = str(uuid.uuid4())
    lead_doc = {
        "id": lead_id,
        "name": customer.get("name") or customer.get("email", "Client"),
        "email": customer.get("email", ""),
        "phone": customer.get("phone", ""),
        "subject": "Client Quote Workspace",
        "message": "Auto-created from client page for quote/contract/esign",
        "source": "client_quote_workspace",
        "status": "opportunity",
        "primary_contact_name": customer.get("name") or customer.get("email", "Client"),
        "primary_email": customer.get("email", ""),
        "primary_phone": customer.get("phone", ""),
        "opportunity_name": f"{customer.get('name') or customer.get('email') or 'Client'} Quote Workspace",
        "pipeline": "001. Main Leads Pipeline",
        "stage": "1. New Inquiry",
        "opportunity_status": "Open",
        "opportunity_value": None,
        "owner_id": current_user.get("id", ""),
        "followers": [],
        "business_name": "",
        "opportunity_source": "Client Workspace",
        "tags": ["client", "quote-workspace"],
        "appointments": [],
        "tasks": [],
        "notes_timeline": [],
        "payments": [],
        "associated_objects": [],
        "converted_to_client": True,
        "created_at": now,
        "updated_at": now,
    }
    await db.leads.insert_one(lead_doc)
    await db.users.update_one(
        {"id": customer_id},
        {"$set": {"original_lead_id": lead_id, "updated_at": now}},
    )
    return {"lead_id": lead_id}


@router.get("/quotes/workspace-lead")
async def get_or_create_quote_workspace_lead(current_user=Depends(get_current_user)):
    existing = await db.leads.find_one(
        {
            "owner_id": current_user.get("id", ""),
            "source": "quote_workspace",
        },
        {"_id": 0, "id": 1},
        sort=[("updated_at", -1)],
    )
    if existing:
        return {"lead_id": existing.get("id")}

    now = datetime.now(timezone.utc).isoformat()
    lead_id = str(uuid.uuid4())
    lead_doc = {
        "id": lead_id,
        "name": current_user.get("name") or current_user.get("email", "Quote Workspace"),
        "email": current_user.get("email", ""),
        "phone": current_user.get("phone", ""),
        "subject": "Quote Workspace",
        "message": "Auto-created workspace lead for full quote builder",
        "source": "quote_workspace",
        "status": "opportunity",
        "primary_contact_name": current_user.get("name") or current_user.get("email", "Quote Workspace"),
        "primary_email": current_user.get("email", ""),
        "primary_phone": current_user.get("phone", ""),
        "opportunity_name": "Quote Workspace",
        "pipeline": "001. Main Leads Pipeline",
        "stage": "1. New Inquiry",
        "opportunity_status": "Open",
        "opportunity_value": None,
        "owner_id": current_user.get("id", ""),
        "followers": [],
        "business_name": "",
        "opportunity_source": "Quote Workspace",
        "tags": ["quote-workspace"],
        "appointments": [],
        "tasks": [],
        "notes_timeline": [],
        "payments": [],
        "associated_objects": [],
        "converted_to_client": False,
        "created_at": now,
        "updated_at": now,
    }
    await db.leads.insert_one(lead_doc)
    return {"lead_id": lead_id}
