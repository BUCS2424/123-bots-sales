from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
import uuid

from auth import decode_token, is_admin_or_above, get_password_hash, UserRole

router = APIRouter(prefix="/api/leads", tags=["leads"])

_db = None

def set_database(database):
    global _db
    _db = database

async def get_db():
    return _db


def _require_admin_token(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")
    token = authorization.split("Bearer ", 1)[1].strip()
    token_data = decode_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    if not is_admin_or_above(token_data.role or ""):
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"user_id": token_data.user_id, "email": token_data.email, "role": token_data.role}


class LeadCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = ""
    subject: Optional[str] = ""
    message: str
    source: str = "contact_form"
    attachments: Optional[List[dict]] = None
    primary_contact_name: Optional[str] = ""
    primary_email: Optional[str] = ""
    primary_phone: Optional[str] = ""
    additional_contacts: Optional[List[str]] = None
    opportunity_name: Optional[str] = ""
    pipeline: Optional[str] = "001. Main Leads Pipeline"
    stage: Optional[str] = "3. Contacted Lead"
    opportunity_status: Optional[str] = "Open"
    opportunity_value: Optional[float] = None
    owner_id: Optional[str] = ""
    followers: Optional[List[str]] = None
    business_name: Optional[str] = ""
    opportunity_source: Optional[str] = ""
    tags: Optional[List[str]] = None
    appointments: Optional[List[dict]] = None
    tasks: Optional[List[dict]] = None
    notes_timeline: Optional[List[dict]] = None
    payments: Optional[List[dict]] = None
    associated_objects: Optional[List[dict]] = None


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    primary_contact_name: Optional[str] = None
    primary_email: Optional[str] = None
    primary_phone: Optional[str] = None
    additional_contacts: Optional[List[str]] = None
    opportunity_name: Optional[str] = None
    pipeline: Optional[str] = None
    stage: Optional[str] = None
    opportunity_status: Optional[str] = None
    opportunity_value: Optional[float] = None
    owner_id: Optional[str] = None
    followers: Optional[List[str]] = None
    business_name: Optional[str] = None
    opportunity_source: Optional[str] = None
    tags: Optional[List[str]] = None
    appointments: Optional[List[dict]] = None
    tasks: Optional[List[dict]] = None
    notes_timeline: Optional[List[dict]] = None
    payments: Optional[List[dict]] = None
    associated_objects: Optional[List[dict]] = None


class ConvertLeadToClientResponse(BaseModel):
    success: bool
    message: str
    user_id: str
    customer_id: str
    user_created: bool
    temporary_password: Optional[str] = None


class LeadStatusUpdate(BaseModel):
    status: str


class LeadNotesUpdate(BaseModel):
    notes: str


# Valid statuses for the kanban
VALID_STATUSES = ["opportunity", "needs_order", "needs_support", "miscellaneous"]


@router.post("/")
async def create_lead(lead: LeadCreate, db=Depends(get_db)):
    """Create a new lead from contact form - public endpoint"""
    lead_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    lead_doc = {
        "id": lead_id,
        "name": lead.name,
        "email": lead.email,
        "phone": lead.phone or "",
        "subject": lead.subject or "",
        "message": lead.message,
        "source": lead.source,
        "status": "opportunity",  # All new leads go to Opportunity
        "notes": "",
        "attachments": lead.attachments or [],
        "primary_contact_name": lead.primary_contact_name or lead.name,
        "primary_email": lead.primary_email or lead.email,
        "primary_phone": lead.primary_phone or lead.phone or "",
        "additional_contacts": lead.additional_contacts or [],
        "opportunity_name": lead.opportunity_name or lead.name,
        "pipeline": lead.pipeline or "001. Main Leads Pipeline",
        "stage": lead.stage or "3. Contacted Lead",
        "opportunity_status": lead.opportunity_status or "Open",
        "opportunity_value": lead.opportunity_value,
        "owner_id": lead.owner_id or "",
        "followers": lead.followers or [],
        "business_name": lead.business_name or "",
        "opportunity_source": lead.opportunity_source or lead.source,
        "tags": lead.tags or [],
        "appointments": lead.appointments or [],
        "tasks": lead.tasks or [],
        "notes_timeline": lead.notes_timeline or [],
        "payments": lead.payments or [],
        "associated_objects": lead.associated_objects or [],
        "converted_to_client": False,
        "converted_customer_id": None,
        "converted_at": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.leads.insert_one(lead_doc)
    
    return {"success": True, "message": "Lead created", "lead_id": lead_id}


@router.get("/")
async def get_all_leads(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Get all leads grouped by status for kanban view"""
    _require_admin_token(authorization)
    
    leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=1000)
    
    # Group by status
    grouped = {
        "opportunity": [],
        "needs_order": [],
        "needs_support": [],
        "miscellaneous": []
    }
    
    for lead in leads:
        status = lead.get("status", "opportunity")
        if status in grouped:
            grouped[status].append(lead)
        else:
            grouped["opportunity"].append(lead)
    
    return grouped


@router.get("/list")
async def get_leads_list(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Get all leads as a flat list"""
    _require_admin_token(authorization)
    
    leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=1000)
    return leads


@router.get("/{lead_id}")
async def get_lead(
    lead_id: str,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Get a single lead by ID"""
    _require_admin_token(authorization)
    
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return lead


@router.put("/{lead_id}")
async def update_lead(
    lead_id: str,
    update: LeadUpdate,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Update a lead"""
    _require_admin_token(authorization)
    
    lead = await db.leads.find_one({"id": lead_id})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.leads.update_one({"id": lead_id}, {"$set": update_data})
    
    return {"success": True, "message": "Lead updated"}


@router.patch("/{lead_id}/status")
async def update_lead_status(
    lead_id: str,
    update: LeadStatusUpdate,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Update lead status (for drag and drop)"""
    _require_admin_token(authorization)
    
    if update.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {VALID_STATUSES}")
    
    lead = await db.leads.find_one({"id": lead_id})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    await db.leads.update_one(
        {"id": lead_id},
        {"$set": {"status": update.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": "Status updated", "new_status": update.status}


@router.patch("/{lead_id}/notes")
async def update_lead_notes(
    lead_id: str,
    update: LeadNotesUpdate,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Update lead notes"""
    _require_admin_token(authorization)
    
    lead = await db.leads.find_one({"id": lead_id})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    await db.leads.update_one(
        {"id": lead_id},
        {"$set": {"notes": update.notes, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": "Notes updated"}


@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: str,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Delete a lead"""
    _require_admin_token(authorization)
    
    result = await db.leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {"success": True, "message": "Lead deleted"}


@router.post("/{lead_id}/convert-to-client", response_model=ConvertLeadToClientResponse)
async def convert_lead_to_client(
    lead_id: str,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    """Convert opportunity lead into a customer/user record while retaining collected data."""
    _require_admin_token(authorization)

    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    email = (lead.get("primary_email") or lead.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Lead email is required to convert to client")

    display_name = (
        lead.get("primary_contact_name")
        or lead.get("name")
        or lead.get("opportunity_name")
        or "Client"
    )
    now = datetime.now(timezone.utc).isoformat()

    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    user_created = False
    temporary_password = None

    if existing_user:
        if existing_user.get("role") != UserRole.USER:
            raise HTTPException(status_code=400, detail="Email belongs to staff/admin account and cannot be converted to client")
        user_id = existing_user.get("id")
    else:
        user_id = str(uuid.uuid4())
        temporary_password = f"Client{uuid.uuid4().hex[:8]}!"
        user_doc = {
            "id": user_id,
            "email": email,
            "name": display_name,
            "hashed_password": get_password_hash(temporary_password),
            "role": UserRole.USER,
            "is_active": True,
            "email_verified": False,
            "phone": lead.get("primary_phone") or lead.get("phone") or None,
            "created_at": now,
            "updated_at": now,
            "lead_metadata": {
                "lead_id": lead_id,
                "source": lead.get("source"),
                "opportunity_source": lead.get("opportunity_source"),
                "converted_at": now,
            },
        }
        await db.users.insert_one(user_doc)
        user_created = True

    existing_customer = await db.customers.find_one({"email": email}, {"_id": 0, "id": 1})
    customer_id = existing_customer.get("id") if existing_customer else user_id

    customer_doc = {
        "id": customer_id,
        "email": email,
        "name": display_name,
        "phone": lead.get("primary_phone") or lead.get("phone") or None,
        "city": lead.get("city") or None,
        "state": lead.get("state") or None,
        "total_orders": 0,
        "total_spent": 0.0,
        "created_at": existing_customer.get("created_at") if existing_customer else now,
        "last_order_at": None,
        "converted_from_lead": True,
        "lead_id": lead_id,
        "lead_snapshot": lead,
    }
    await db.customers.update_one({"email": email}, {"$set": customer_doc}, upsert=True)

    await db.customer_settings.update_one(
        {"customer_id": customer_id},
        {
            "$set": {
                "customer_id": customer_id,
                "customer_type": "retail",
                "notes": lead.get("notes") or lead.get("message") or "",
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )

    await db.leads.update_one(
        {"id": lead_id},
        {
            "$set": {
                "converted_to_client": True,
                "converted_customer_id": customer_id,
                "converted_at": now,
                "updated_at": now,
            }
        },
    )

    return ConvertLeadToClientResponse(
        success=True,
        message="Opportunity converted to client",
        user_id=user_id,
        customer_id=customer_id,
        user_created=user_created,
        temporary_password=temporary_password,
    )
