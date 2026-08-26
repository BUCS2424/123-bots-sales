"""
Service Repair Module
QR/barcode scan-driven workflow for the shop floor, layered on top of the
Service CRM (service_crm.py): a mechanic scans a unit's manufacturer serial
to clock in/out on a job, and loaner units can be checked out to a customer
while their original is being serviced, then swapped back on completion.

Every action appends to the owning service_request's `activity_log` - that
same feed is what the customer sees in their account portal and what
status-update emails are built from.

Independently toggleable from Service CRM itself via
FeatureFlags.service_repair_enabled (see admin_settings.py).
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid

from auth import decode_token, is_admin_or_above
from email_utils import send_email, build_service_status_email
from workflows import evaluate_workflow

router = APIRouter(prefix="/api/service-repair", tags=["service-repair"])

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
    return {"user_id": token_data.user_id, "email": token_data.email, "name": getattr(token_data, "name", None) or token_data.email, "role": token_data.role}


LOANER_STATUSES = ["available", "checked_out", "needs_inspection", "retired"]


class LoanerUnitCreate(BaseModel):
    manufacturer_id: Optional[str] = ""
    manufacturer_name: Optional[str] = ""
    model: str
    serial_number: str
    notes: Optional[str] = ""


class LoanerUnitUpdate(BaseModel):
    manufacturer_id: Optional[str] = None
    manufacturer_name: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class ServiceRequestRef(BaseModel):
    service_request_id: str
    workflow_id: Optional[str] = None
    workflow_answers: Optional[dict] = None


class LoanerOutRequest(BaseModel):
    service_request_id: str
    loaner_unit_id: str


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _append_activity(entry_type: str, actor: dict, **extra) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "type": entry_type,
        "actor_id": actor.get("user_id"),
        "actor_name": actor.get("name") or actor.get("email"),
        "timestamp": _now_iso(),
        **extra,
    }


async def _get_service_request_or_404(db, service_request_id: str) -> dict:
    req = await db.service_requests.find_one({"id": service_request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")
    return req


async def _push_activity(db, service_request_id: str, entry: dict):
    await db.service_requests.update_one(
        {"id": service_request_id},
        {"$push": {"activity_log": entry}, "$set": {"updated_at": _now_iso()}},
    )


async def _apply_workflow(db, service_request_id: str, payload: "ServiceRequestRef", actor: dict):
    """
    If a Custom Workflow was attached to this scan action, validate the
    submitted answers server-side (never trust the client alone) and log
    a workflow_completed activity entry with a human-readable summary.
    Raises 400 if required (and currently-visible, per conditions) steps
    are missing an answer. No-ops if no workflow was attached.
    """
    if not payload.workflow_id:
        return

    workflow = await db.workflows.find_one({"id": payload.workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    answers = payload.workflow_answers or {}
    visible_steps, missing = evaluate_workflow(workflow.get("steps", []), answers)
    if missing:
        missing_labels = ", ".join(s.get("label", "") for s in missing)
        raise HTTPException(status_code=400, detail=f"Missing required step(s): {missing_labels}")

    readable_answers = {
        step.get("label"): answers.get(step.get("id"))
        for step in visible_steps
        if answers.get(step.get("id")) not in (None, "")
    }
    entry = _append_activity(
        "workflow_completed",
        actor,
        workflow_id=payload.workflow_id,
        workflow_name=workflow.get("name"),
        answers=readable_answers,
    )
    await _push_activity(db, service_request_id, entry)


CUSTOMER_EVENT_LABELS = {
    "unit_received": "Unit Received at Shop",
    "unit_returned": "Unit Returned to You",
    "loaner_out": "Loaner Unit Issued",
    "loaner_in": "Loaner Unit Returned",
}

CUSTOMER_EVENT_MESSAGES = {
    "unit_received": "We've received your unit and it's now in the shop for service.",
    "unit_returned": "Your repaired unit is on its way back to you (or ready for pickup).",
    "loaner_out": "A loaner unit has been issued to you while yours is being serviced.",
    "loaner_in": "The loaner unit has been checked back in - thanks for returning it!",
}


async def _notify_customer(db, req: dict, entry_type: str):
    """Best-effort customer email for the scan events that matter to them
    (skips clock_in/clock_out, which are internal labor-tracking only)."""
    if entry_type not in CUSTOMER_EVENT_LABELS or not req.get("email"):
        return
    site = await db.admin_settings.find_one({"type": "site"})
    site_url = (site or {}).get("site_url") or "https://123bots.com"
    site_name = (site or {}).get("site_name") or "123Bots"
    product_label = f"{req.get('make', '')} {req.get('model', '')}".strip() or "unit"
    event_label = CUSTOMER_EVENT_LABELS[entry_type]
    html, text = build_service_status_email(
        guest_name=req.get("name", ""),
        product_label=product_label,
        event_label=event_label,
        detail_message=CUSTOMER_EVENT_MESSAGES[entry_type],
        portal_url=f"{site_url}/account?tab=services",
        site_name=site_name,
    )
    try:
        await send_email(req["email"], f"{site_name} Service Update: {event_label}", html, text)
    except Exception:
        pass


# ============ LOOKUP ============

@router.get("/lookup/{serial_number}")
async def lookup_serial(
    serial_number: str,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    """
    Resolve a scanned manufacturer serial to either a customer's service
    request or a loaner unit, with enough linked context for the scan UI
    to decide which actions to offer.
    """
    _require_admin_token(authorization)
    serial = serial_number.strip()
    if not serial:
        raise HTTPException(status_code=400, detail="Empty serial number")

    service_request = await db.service_requests.find_one({"serial_number": serial}, {"_id": 0})
    if service_request:
        active_loaner = None
        if service_request.get("loaner_unit_id"):
            active_loaner = await db.loaner_units.find_one({"id": service_request["loaner_unit_id"]}, {"_id": 0})
        return {"match_type": "customer_unit", "service_request": service_request, "active_loaner": active_loaner}

    loaner = await db.loaner_units.find_one({"serial_number": serial}, {"_id": 0})
    if loaner:
        linked_request = None
        if loaner.get("current_service_request_id"):
            linked_request = await db.service_requests.find_one({"id": loaner["current_service_request_id"]}, {"_id": 0})
        return {"match_type": "loaner_unit", "loaner": loaner, "linked_service_request": linked_request}

    raise HTTPException(status_code=404, detail="No matching unit or service request found for this serial number")


# ============ CLOCK IN / OUT ============

@router.post("/clock-in")
async def clock_in(
    payload: ServiceRequestRef,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    actor = _require_admin_token(authorization)
    await _get_service_request_or_404(db, payload.service_request_id)

    entry = _append_activity("clock_in", actor)
    await _push_activity(db, payload.service_request_id, entry)
    return {"success": True, "entry": entry}


@router.post("/clock-out")
async def clock_out(
    payload: ServiceRequestRef,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    actor = _require_admin_token(authorization)
    req = await _get_service_request_or_404(db, payload.service_request_id)

    # Find this actor's most recent clock_in that hasn't been closed yet.
    open_clock_in = None
    for item in req.get("activity_log", []):
        if item.get("actor_id") != actor["user_id"]:
            continue
        if item.get("type") == "clock_in":
            open_clock_in = item
        elif item.get("type") == "clock_out":
            open_clock_in = None

    if not open_clock_in:
        raise HTTPException(status_code=400, detail="No open clock-in found for this user on this job")

    started = datetime.fromisoformat(open_clock_in["timestamp"])
    now = datetime.now(timezone.utc)
    duration_minutes = round((now - started).total_seconds() / 60)

    entry = _append_activity("clock_out", actor, duration_minutes=duration_minutes, clock_in_id=open_clock_in["id"])
    await _push_activity(db, payload.service_request_id, entry)
    return {"success": True, "entry": entry}


# ============ UNIT RECEIVED / RETURNED ============

@router.post("/unit-received")
async def unit_received(
    payload: ServiceRequestRef,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    """Log that the broken unit has physically arrived at the shop."""
    actor = _require_admin_token(authorization)
    req = await _get_service_request_or_404(db, payload.service_request_id)
    await _apply_workflow(db, payload.service_request_id, payload, actor)

    entry = _append_activity("unit_received", actor)
    await _push_activity(db, payload.service_request_id, entry)

    # Advance status only when it's still sitting at the earliest stages -
    # never rewind a status an admin has already moved further along.
    if req.get("status") in (None, "new_request", "scheduled"):
        await db.service_requests.update_one(
            {"id": payload.service_request_id},
            {"$set": {"status": "in_repair"}},
        )

    await _notify_customer(db, req, "unit_received")
    return {"success": True, "entry": entry}


@router.post("/unit-returned")
async def unit_returned(
    payload: ServiceRequestRef,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    """Log that the repaired unit has been handed back to the customer."""
    actor = _require_admin_token(authorization)
    req = await _get_service_request_or_404(db, payload.service_request_id)
    await _apply_workflow(db, payload.service_request_id, payload, actor)

    entry = _append_activity("unit_returned", actor)
    await _push_activity(db, payload.service_request_id, entry)

    if req.get("status") != "cancelled":
        await db.service_requests.update_one(
            {"id": payload.service_request_id},
            {"$set": {"status": "completed"}},
        )

    await _notify_customer(db, req, "unit_returned")
    return {"success": True, "entry": entry}


# ============ LOANER SWAP ============

@router.post("/loaner-out")
async def loaner_out(
    payload: LoanerOutRequest,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    actor = _require_admin_token(authorization)
    req = await _get_service_request_or_404(db, payload.service_request_id)

    loaner = await db.loaner_units.find_one({"id": payload.loaner_unit_id})
    if not loaner:
        raise HTTPException(status_code=404, detail="Loaner unit not found")
    if loaner.get("status") != "available":
        raise HTTPException(status_code=400, detail=f"Loaner unit is not available (status: {loaner.get('status')})")

    now = _now_iso()
    await db.loaner_units.update_one(
        {"id": payload.loaner_unit_id},
        {"$set": {"status": "checked_out", "current_service_request_id": payload.service_request_id, "updated_at": now}},
    )
    await db.service_requests.update_one(
        {"id": payload.service_request_id},
        {"$set": {"loaner_unit_id": payload.loaner_unit_id}},
    )

    entry = _append_activity("loaner_out", actor, loaner_unit_id=payload.loaner_unit_id, loaner_serial=loaner.get("serial_number"), loaner_model=loaner.get("model"))
    await _push_activity(db, payload.service_request_id, entry)
    await _notify_customer(db, req, "loaner_out")
    return {"success": True, "entry": entry}


@router.post("/loaner-in")
async def loaner_in(
    payload: ServiceRequestRef,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    actor = _require_admin_token(authorization)
    req = await _get_service_request_or_404(db, payload.service_request_id)

    loaner_unit_id = req.get("loaner_unit_id")
    if not loaner_unit_id:
        raise HTTPException(status_code=400, detail="This service request has no loaner currently checked out")

    loaner = await db.loaner_units.find_one({"id": loaner_unit_id})
    now = _now_iso()
    await db.loaner_units.update_one(
        {"id": loaner_unit_id},
        {"$set": {"status": "available", "current_service_request_id": None, "updated_at": now}},
    )
    await db.service_requests.update_one(
        {"id": payload.service_request_id},
        {"$set": {"loaner_unit_id": None}},
    )

    entry = _append_activity("loaner_in", actor, loaner_unit_id=loaner_unit_id, loaner_serial=(loaner or {}).get("serial_number"), loaner_model=(loaner or {}).get("model"))
    await _push_activity(db, payload.service_request_id, entry)
    await _notify_customer(db, req, "loaner_in")
    return {"success": True, "entry": entry}


# ============ LOANER UNIT CRUD (admin management of the loaner pool) ============

@router.post("/loaners")
async def create_loaner(
    payload: LoanerUnitCreate,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    now = _now_iso()
    doc = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        "status": "available",
        "current_service_request_id": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.loaner_units.insert_one(doc)
    return {"success": True, "message": "Loaner unit created", "id": doc["id"]}


@router.get("/loaners")
async def list_loaners(
    status: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    query = {}
    if status:
        query["status"] = status
    return await db.loaner_units.find(query, {"_id": 0}).sort("created_at", -1).to_list(length=500)


@router.put("/loaners/{loaner_id}")
async def update_loaner(
    loaner_id: str,
    payload: LoanerUnitUpdate,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    loaner = await db.loaner_units.find_one({"id": loaner_id})
    if not loaner:
        raise HTTPException(status_code=404, detail="Loaner unit not found")

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update_data.get("status") and update_data["status"] not in LOANER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {LOANER_STATUSES}")
    if update_data.get("status") == "checked_out" and loaner.get("status") != "checked_out":
        raise HTTPException(status_code=400, detail="Use the loaner-out scan action to check out a loaner, not a direct status edit")
    update_data["updated_at"] = _now_iso()

    await db.loaner_units.update_one({"id": loaner_id}, {"$set": update_data})
    return {"success": True, "message": "Loaner unit updated"}


@router.delete("/loaners/{loaner_id}")
async def delete_loaner(
    loaner_id: str,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    loaner = await db.loaner_units.find_one({"id": loaner_id})
    if not loaner:
        raise HTTPException(status_code=404, detail="Loaner unit not found")
    if loaner.get("status") == "checked_out":
        raise HTTPException(status_code=400, detail="Cannot delete a loaner that's currently checked out to a customer")

    await db.loaner_units.delete_one({"id": loaner_id})
    return {"success": True, "message": "Loaner unit deleted"}
