"""
Custom Workflows Module
A small, generic no-code step-builder: admins define an ordered set of
steps (with optional branching conditions) that fire at a named trigger
event, and the relevant part of the app walks a staff member through
those steps one at a time instead of a static form.

Not tied to any one feature - a workflow just declares which
`trigger_event` it responds to (e.g. "service_repair.unit_received").
The caller (e.g. service_repair.py) is responsible for looking up the
active workflow for its trigger, collecting answers via the step
wizard, and re-validating them here before acting on them.
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from auth import decode_token, is_admin_or_above

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

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


FIELD_TYPES = ["text", "textarea", "number", "date", "select", "photo", "checkbox"]
CONDITION_OPERATORS = ["equals", "not_equals", "contains"]

# Registry of trigger events any module can fire a workflow against.
# Kept as a flat list (not enforced strictly server-side) so new
# consumers can register events without a schema migration - the admin
# UI uses this list to populate the trigger picker.
KNOWN_TRIGGER_EVENTS = [
    {"value": "service_repair.unit_received", "label": "Service Scan: Unit Received"},
    {"value": "service_repair.unit_returned", "label": "Service Scan: Unit Returned"},
]


class WorkflowStepCondition(BaseModel):
    step_id: str  # id of the earlier step whose answer this condition checks
    operator: str  # equals, not_equals, contains
    value: str


class WorkflowStep(BaseModel):
    id: str
    order: int
    label: str
    field_type: str  # text, textarea, number, date, select, photo, checkbox
    options: Optional[List[str]] = None  # for "select"
    required: bool = True
    condition: Optional[WorkflowStepCondition] = None


class WorkflowCreate(BaseModel):
    name: str
    trigger_event: str
    is_active: bool = True
    steps: List[WorkflowStep] = []


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    trigger_event: Optional[str] = None
    is_active: Optional[bool] = None
    steps: Optional[List[WorkflowStep]] = None


def _condition_met(condition: Optional[WorkflowStepCondition], answers: dict) -> bool:
    if not condition:
        return True
    actual = answers.get(condition.step_id)
    if actual is None:
        return False
    actual_str = str(actual).strip().lower()
    expected_str = str(condition.value).strip().lower()
    if condition.operator == "equals":
        return actual_str == expected_str
    if condition.operator == "not_equals":
        return actual_str != expected_str
    if condition.operator == "contains":
        return expected_str in actual_str
    return False


def evaluate_workflow(steps: List[dict], answers: dict):
    """
    Given a workflow's steps (as plain dicts, sorted by `order`) and a
    dict of {step_id: answer_value}, return (visible_steps, missing).
    `visible_steps` are the steps whose condition currently evaluates
    true (i.e. should actually be shown/required); `missing` is the
    subset of those that are required but have no answer yet.
    """
    ordered = sorted(steps, key=lambda s: s.get("order", 0))
    visible_steps = []
    missing = []
    for step in ordered:
        condition = step.get("condition")
        condition_obj = WorkflowStepCondition(**condition) if condition else None
        if not _condition_met(condition_obj, answers):
            continue
        visible_steps.append(step)
        step_id = step.get("id")
        answer = answers.get(step_id)
        is_blank = answer is None or (isinstance(answer, str) and not answer.strip())
        if step.get("required", True) and is_blank:
            missing.append(step)
    return visible_steps, missing


@router.get("/trigger-events")
async def list_trigger_events(authorization: Optional[str] = Header(None)):
    _require_admin_token(authorization)
    return KNOWN_TRIGGER_EVENTS


@router.get("/for-trigger/{trigger_event}")
async def get_active_workflow_for_trigger(
    trigger_event: str,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    """Returns the active workflow for a trigger, or null if none configured -
    callers should fall back to their normal (non-guided) behavior in that case."""
    _require_admin_token(authorization)
    workflow = await db.workflows.find_one(
        {"trigger_event": trigger_event, "is_active": True}, {"_id": 0}
    )
    return workflow


@router.post("/")
async def create_workflow(
    payload: WorkflowCreate,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    await db.workflows.insert_one(doc)
    return {"success": True, "message": "Workflow created", "id": doc["id"]}


@router.get("/")
async def list_workflows(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    return await db.workflows.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=200)


@router.get("/{workflow_id}")
async def get_workflow(
    workflow_id: str,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    workflow = await db.workflows.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.put("/{workflow_id}")
async def update_workflow(
    workflow_id: str,
    payload: WorkflowUpdate,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    workflow = await db.workflows.find_one({"id": workflow_id})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # model_dump() already recurses into the nested WorkflowStep list and
    # produces plain dicts, so no extra handling is needed for `steps` here.
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.workflows.update_one({"id": workflow_id}, {"$set": update_data})
    return {"success": True, "message": "Workflow updated"}


@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    result = await db.workflows.delete_one({"id": workflow_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"success": True, "message": "Workflow deleted"}
