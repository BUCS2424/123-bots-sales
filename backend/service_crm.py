"""
Service CRM Module
Tracks product-servicing/repair requests as their own pipeline, parallel to
the Sales CRM (leads.py) but scoped to service intake rather than sales
opportunities. Kept brandable to whatever product the site sells via
FeatureFlags.service_crm_product_name (see admin_settings.py).
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from auth import decode_token, is_admin_or_above

router = APIRouter(prefix="/api/service-crm", tags=["service-crm"])

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


# Kanban pipeline stages, distinct from the Sales CRM's stages (leads.py)
VALID_STATUSES = ["new_request", "scheduled", "diagnosed", "awaiting_parts", "in_repair", "completed", "cancelled"]


class ServiceRequestCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = ""
    make: str
    model: str
    serial_number: Optional[str] = ""
    purchase_date: Optional[str] = ""
    warranty_status: Optional[str] = ""  # in_warranty, out_of_warranty, unknown
    warranty_expiration: Optional[str] = ""
    service_contract: Optional[str] = ""
    service_contract_expiration: Optional[str] = ""
    firmware_version: Optional[str] = ""
    last_service_date: Optional[str] = ""
    issue_description: str
    urgency: str = "normal"  # low, normal, high, urgent
    service_method: str = ""  # ship_in, on_site
    preferred_service_date: Optional[str] = ""
    site_address: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    zip_code: Optional[str] = ""
    notes: Optional[str] = ""
    attachments: Optional[List[dict]] = None
    source: str = "service_request_form"


class ServiceRequestUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[str] = None
    warranty_status: Optional[str] = None
    warranty_expiration: Optional[str] = None
    service_contract: Optional[str] = None
    service_contract_expiration: Optional[str] = None
    firmware_version: Optional[str] = None
    last_service_date: Optional[str] = None
    issue_description: Optional[str] = None
    urgency: Optional[str] = None
    service_method: Optional[str] = None
    preferred_service_date: Optional[str] = None
    site_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    notes: Optional[str] = None
    technician_notes: Optional[str] = None
    status: Optional[str] = None


class ServiceRequestStatusUpdate(BaseModel):
    status: str


class ServiceRequestNotesUpdate(BaseModel):
    notes: str


@router.post("/")
async def create_service_request(payload: ServiceRequestCreate, db=Depends(get_db)):
    """Create a new service request from the public intake form."""
    request_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "id": request_id,
        **payload.model_dump(),
        "status": "new_request",
        "technician_notes": "",
        "created_at": now,
        "updated_at": now,
    }
    await db.service_requests.insert_one(doc)
    return {"success": True, "message": "Service request submitted", "request_id": request_id}


@router.get("/")
async def get_all_service_requests(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    """Get all service requests grouped by pipeline stage for kanban view."""
    _require_admin_token(authorization)

    requests = await db.service_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=1000)

    grouped = {}
    for req in requests:
        status = req.get("status") or "new_request"
        if status not in VALID_STATUSES:
            status = "new_request"
        grouped.setdefault(status, []).append(req)
    return grouped


@router.get("/list")
async def get_service_requests_list(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    """Get all service requests as a flat list."""
    _require_admin_token(authorization)
    return await db.service_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=1000)


@router.get("/{request_id}")
async def get_service_request(
    request_id: str,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    req = await db.service_requests.find_one({"id": request_id}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")
    return req


@router.put("/{request_id}")
async def update_service_request(
    request_id: str,
    payload: ServiceRequestUpdate,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    req = await db.service_requests.find_one({"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update_data.get("status") and update_data["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {VALID_STATUSES}")
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.service_requests.update_one({"id": request_id}, {"$set": update_data})
    return {"success": True, "message": "Service request updated"}


@router.patch("/{request_id}/status")
async def update_service_request_status(
    request_id: str,
    update: ServiceRequestStatusUpdate,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    """Update status (for drag and drop)."""
    _require_admin_token(authorization)
    if update.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {VALID_STATUSES}")

    req = await db.service_requests.find_one({"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    await db.service_requests.update_one(
        {"id": request_id},
        {"$set": {"status": update.status, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"success": True}


@router.patch("/{request_id}/notes")
async def update_service_request_notes(
    request_id: str,
    update: ServiceRequestNotesUpdate,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    req = await db.service_requests.find_one({"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")
    await db.service_requests.update_one(
        {"id": request_id},
        {"$set": {"notes": update.notes, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"success": True}


@router.delete("/{request_id}")
async def delete_service_request(
    request_id: str,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    result = await db.service_requests.delete_one({"id": request_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service request not found")
    return {"success": True, "message": "Service request deleted"}
