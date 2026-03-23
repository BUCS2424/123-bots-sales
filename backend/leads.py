from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
import uuid

from auth import decode_token, is_admin_or_above

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


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


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
