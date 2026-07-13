"""
External Stack API Delivery Module
- Custom Pipelines CRUD (create/edit/delete pipelines with stages)
- External API Sources CRUD (each with unique auth credentials)
- Lead Ingestion Endpoint (accepts full 25+ field set)
- Optional email forwarding on lead arrival
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import re
import secrets

from auth import decode_token, is_admin_or_above

router = APIRouter(prefix="/api/external-api", tags=["External API"])
pipelines_router = APIRouter(prefix="/api/pipelines", tags=["Pipelines"])

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

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '_', text)
    return text[:60]

# =============== MODELS ===============

class PipelineStage(BaseModel):
    id: str = ""
    label: str
    color: str = "bg-slate-500"
    bar_color: str = "bg-slate-500"

class PipelineCreate(BaseModel):
    name: str
    stages: List[PipelineStage]

class PipelineUpdate(BaseModel):
    name: Optional[str] = None
    stages: Optional[List[PipelineStage]] = None

class ExternalSourceCreate(BaseModel):
    name: str
    auth_header_name: str = "X-API-Key"
    default_pipeline_id: Optional[str] = ""
    default_stage_id: Optional[str] = ""
    email_forward_enabled: bool = False
    forward_email: Optional[str] = ""

class ExternalSourceUpdate(BaseModel):
    name: Optional[str] = None
    auth_header_name: Optional[str] = None
    default_pipeline_id: Optional[str] = None
    default_stage_id: Optional[str] = None
    email_forward_enabled: Optional[bool] = None
    forward_email: Optional[str] = None
    is_active: Optional[bool] = None

class ExternalLeadPayload(BaseModel):
    name: str
    email: str
    phone: Optional[str] = ""
    opportunity_name: Optional[str] = ""
    business_name: Optional[str] = ""
    opportunity_value: Optional[float] = None
    opportunity_source: Optional[str] = ""
    notes: Optional[str] = ""
    pipeline: Optional[str] = ""
    stage: Optional[str] = ""
    opportunity_status: Optional[str] = "Open"
    owner_id: Optional[str] = ""
    assigned: Optional[str] = ""
    tags: Optional[List[str]] = None
    followers: Optional[List[str]] = None
    primary_contact_name: Optional[str] = ""
    primary_email: Optional[str] = ""
    primary_phone: Optional[str] = ""
    subject: Optional[str] = ""
    message: Optional[str] = ""
    lost_reason_id: Optional[str] = ""
    lost_reason_name: Optional[str] = ""
    engagement_score: Optional[float] = None
    external_opportunity_id: Optional[str] = ""
    external_contact_id: Optional[str] = ""
    pipeline_stage_id: Optional[str] = ""
    pipeline_id: Optional[str] = ""
    days_since_stage_change: Optional[str] = ""
    days_since_status_change: Optional[str] = ""
    days_since_updated: Optional[str] = ""


# =============== PIPELINES CRUD ===============

DEFAULT_PIPELINE = {
    "name": "Main Leads Pipeline",
    "is_default": True,
    "stages": [
        {"id": "cold_call", "label": "Cold Call", "color": "bg-red-500", "bar_color": "bg-red-500"},
        {"id": "build_interest", "label": "Build Interest", "color": "bg-orange-500", "bar_color": "bg-orange-500"},
        {"id": "interested_waiting", "label": "Interested/Waiting", "color": "bg-amber-400", "bar_color": "bg-amber-400"},
        {"id": "demo", "label": "Demo", "color": "bg-slate-400", "bar_color": "bg-slate-400"},
        {"id": "proposal_sent", "label": "Proposal Sent", "color": "bg-green-500", "bar_color": "bg-green-500"},
        {"id": "waiting_leadership", "label": "Waiting on Leadership", "color": "bg-blue-500", "bar_color": "bg-blue-500"},
        {"id": "closed", "label": "Closed", "color": "bg-emerald-600", "bar_color": "bg-emerald-600"},
    ],
}

async def ensure_default_pipeline():
    """Seed the default pipeline if none exists, and backfill existing leads with pipeline_id"""
    if _db is None:
        return
    count = await _db.pipelines.count_documents({})
    if count == 0:
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "id": str(uuid.uuid4()),
            **DEFAULT_PIPELINE,
            "created_at": now,
            "updated_at": now,
        }
        await _db.pipelines.insert_one(doc)

    # Backfill: assign existing leads without pipeline_id to the default pipeline
    default_pipeline = await _db.pipelines.find_one({"is_default": True}, {"_id": 0, "id": 1})
    if default_pipeline:
        result = await _db.leads.update_many(
            {"$or": [{"pipeline_id": {"$exists": False}}, {"pipeline_id": ""}, {"pipeline_id": None}]},
            {"$set": {"pipeline_id": default_pipeline["id"]}}
        )
        if result.modified_count > 0:
            import logging
            logging.getLogger("external_api").info(f"Backfilled {result.modified_count} leads with default pipeline_id")


@pipelines_router.get("/")
async def list_pipelines(authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    pipelines = await db.pipelines.find({}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return pipelines


@pipelines_router.post("/")
async def create_pipeline(payload: PipelineCreate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    now = datetime.now(timezone.utc).isoformat()
    stages = []
    for s in payload.stages:
        stage_id = s.id or slugify(s.label)
        stages.append({"id": stage_id, "label": s.label, "color": s.color, "bar_color": s.bar_color})
    doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "is_default": False,
        "stages": stages,
        "created_at": now,
        "updated_at": now,
    }
    await db.pipelines.insert_one(doc)
    doc.pop("_id", None)
    return doc


@pipelines_router.put("/{pipeline_id}")
async def update_pipeline(pipeline_id: str, payload: PipelineUpdate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    pipeline = await db.pipelines.find_one({"id": pipeline_id})
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    update_data = {}
    if payload.name is not None:
        update_data["name"] = payload.name
    if payload.stages is not None:
        stages = []
        for s in payload.stages:
            stage_id = s.id or slugify(s.label)
            stages.append({"id": stage_id, "label": s.label, "color": s.color, "bar_color": s.bar_color})
        update_data["stages"] = stages
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.pipelines.update_one({"id": pipeline_id}, {"$set": update_data})
    return {"success": True, "message": "Pipeline updated"}


@pipelines_router.delete("/{pipeline_id}")
async def delete_pipeline(pipeline_id: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    pipeline = await db.pipelines.find_one({"id": pipeline_id})
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    if pipeline.get("is_default"):
        raise HTTPException(status_code=400, detail="Cannot delete the default pipeline")
    await db.pipelines.delete_one({"id": pipeline_id})
    return {"success": True, "message": "Pipeline deleted"}


# =============== EXTERNAL API SOURCES CRUD ===============

@router.get("/sources")
async def list_sources(authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    sources = await db.external_api_sources.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return sources


@router.post("/sources")
async def create_source(payload: ExternalSourceCreate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    now = datetime.now(timezone.utc).isoformat()
    token = secrets.token_urlsafe(48)
    doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "auth_header_name": payload.auth_header_name or "X-API-Key",
        "auth_token": token,
        "default_pipeline_id": payload.default_pipeline_id or "",
        "default_stage_id": payload.default_stage_id or "",
        "email_forward_enabled": payload.email_forward_enabled,
        "forward_email": payload.forward_email or "",
        "is_active": True,
        "leads_received": 0,
        "created_at": now,
        "updated_at": now,
    }
    await db.external_api_sources.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/sources/{source_id}")
async def update_source(source_id: str, payload: ExternalSourceUpdate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    source = await db.external_api_sources.find_one({"id": source_id})
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.external_api_sources.update_one({"id": source_id}, {"$set": update_data})
    return {"success": True, "message": "Source updated"}


@router.delete("/sources/{source_id}")
async def delete_source(source_id: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    result = await db.external_api_sources.delete_one({"id": source_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Source not found")
    return {"success": True, "message": "Source deleted"}


@router.post("/sources/{source_id}/regenerate-token")
async def regenerate_token(source_id: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    source = await db.external_api_sources.find_one({"id": source_id})
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    new_token = secrets.token_urlsafe(48)
    await db.external_api_sources.update_one(
        {"id": source_id},
        {"$set": {"auth_token": new_token, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "auth_token": new_token}


# =============== LEAD INGESTION ENDPOINT ===============

@router.post("/leads")
async def ingest_external_lead(payload: ExternalLeadPayload, request: Request, db=Depends(get_db)):
    """
    Public endpoint for external CRMs to push leads.
    Authenticates via the source's auth_header_name + auth_token.
    """
    # Find matching source by checking all active sources' auth headers
    sources = await db.external_api_sources.find({"is_active": True}, {"_id": 0}).to_list(100)
    matched_source = None
    for source in sources:
        header_name = source.get("auth_header_name", "X-API-Key")
        expected_token = source.get("auth_token", "")
        provided_token = request.headers.get(header_name, "")
        if provided_token and provided_token == expected_token:
            matched_source = source
            break

    if not matched_source:
        raise HTTPException(status_code=401, detail="Invalid or missing API credentials")

    now = datetime.now(timezone.utc).isoformat()
    lead_id = str(uuid.uuid4())

    # Determine pipeline and stage
    default_pipeline_id = matched_source.get("default_pipeline_id", "")
    default_stage_id = matched_source.get("default_stage_id", "")

    # Build lead document with all 25+ fields
    lead_doc = {
        "id": lead_id,
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone or "",
        "subject": payload.subject or payload.opportunity_name or "",
        "message": payload.message or payload.notes or f"Lead from {matched_source['name']}",
        "source": f"external_api:{matched_source['name']}",
        "status": default_stage_id or "cold_call",
        "notes": payload.notes or "",
        "primary_contact_name": payload.primary_contact_name or payload.name,
        "primary_email": payload.primary_email or payload.email,
        "primary_phone": payload.primary_phone or payload.phone or "",
        "additional_contacts": [],
        "opportunity_name": payload.opportunity_name or payload.name,
        "pipeline": payload.pipeline or default_pipeline_id or "001. Main Leads Pipeline",
        "stage": payload.stage or default_stage_id or "Cold Call",
        "opportunity_status": payload.opportunity_status or "Open",
        "opportunity_value": payload.opportunity_value,
        "owner_id": payload.owner_id or "",
        "followers": payload.followers or [],
        "business_name": payload.business_name or "",
        "opportunity_source": payload.opportunity_source or matched_source["name"],
        "tags": payload.tags or [],
        "appointments": [],
        "tasks": [],
        "notes_timeline": [],
        "payments": [],
        "associated_objects": [],
        "converted_to_client": False,
        "converted_customer_id": None,
        "converted_at": None,
        "assigned": payload.assigned or "",
        "lost_reason_id": payload.lost_reason_id or "",
        "lost_reason_name": payload.lost_reason_name or "",
        "engagement_score": payload.engagement_score,
        "external_opportunity_id": payload.external_opportunity_id or "",
        "external_contact_id": payload.external_contact_id or "",
        "pipeline_stage_id": payload.pipeline_stage_id or "",
        "pipeline_id": payload.pipeline_id or "",
        "days_since_stage_change": payload.days_since_stage_change or "",
        "days_since_status_change": payload.days_since_status_change or "",
        "days_since_updated": payload.days_since_updated or "",
        "external_source_id": matched_source["id"],
        "external_source_name": matched_source["name"],
        "created_at": now,
        "updated_at": now,
    }

    await db.leads.insert_one(lead_doc)

    # Increment lead count on source
    await db.external_api_sources.update_one(
        {"id": matched_source["id"]},
        {"$inc": {"leads_received": 1}, "$set": {"last_lead_at": now}}
    )

    # Optional email forwarding
    if matched_source.get("email_forward_enabled") and matched_source.get("forward_email"):
        try:
            from email_utils import send_email
            subject = f"New Lead from {matched_source['name']}: {payload.opportunity_name or payload.name}"
            value_str = f"${payload.opportunity_value:,.2f}" if payload.opportunity_value else "N/A"
            html = f"""
            <html><body style="font-family:Arial,sans-serif;color:#1f2937;">
            <h2 style="color:#2563eb;">New External Lead Received</h2>
            <p><strong>Source:</strong> {matched_source['name']}</p>
            <p><strong>Name:</strong> {payload.name}</p>
            <p><strong>Email:</strong> {payload.email}</p>
            <p><strong>Phone:</strong> {payload.phone or 'N/A'}</p>
            <p><strong>Business:</strong> {payload.business_name or 'N/A'}</p>
            <p><strong>Opportunity:</strong> {payload.opportunity_name or 'N/A'}</p>
            <p><strong>Value:</strong> {value_str}</p>
            <p><strong>Notes:</strong> {payload.notes or 'N/A'}</p>
            <hr><p style="font-size:12px;color:#6b7280;">Sent by 123Bots External Stack API</p>
            </body></html>
            """
            text = f"New lead from {matched_source['name']}: {payload.name} ({payload.email})"
            await send_email(matched_source["forward_email"], subject, html, text)
        except Exception:
            pass  # Don't fail the lead creation if email fails

    return {
        "success": True,
        "message": "Lead created successfully",
        "lead_id": lead_id,
        "source": matched_source["name"],
    }
