from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import csv
import io

from auth import decode_token, is_admin_or_above, get_password_hash, UserRole
from email_utils import send_email

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
    stage: Optional[str] = "Cold Call"
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
    # New fields from CSV import
    assigned: Optional[str] = ""
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
    # New fields from CSV import
    assigned: Optional[str] = None
    lost_reason_id: Optional[str] = None
    lost_reason_name: Optional[str] = None
    engagement_score: Optional[float] = None
    external_opportunity_id: Optional[str] = None
    external_contact_id: Optional[str] = None
    pipeline_stage_id: Optional[str] = None
    pipeline_id: Optional[str] = None
    days_since_stage_change: Optional[str] = None
    days_since_status_change: Optional[str] = None
    days_since_updated: Optional[str] = None


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


class ResendAppointmentRequest(BaseModel):
    appointment_id: Optional[str] = None
    appointment_index: Optional[int] = None


# Valid statuses/stages for the kanban pipeline
VALID_STATUSES = ["cold_call", "build_interest", "interested_waiting", "demo", "proposal_sent", "waiting_leadership", "closed"]

# Map imported stage names to our column IDs
STAGE_MAPPING = {
    # Exact matches
    "cold call": "cold_call",
    "build interest": "build_interest",
    "interested/waiting": "interested_waiting",
    "interested waiting": "interested_waiting",
    "demo": "demo",
    "proposal sent": "proposal_sent",
    "waiting on leadership": "waiting_leadership",
    "waiting leadership": "waiting_leadership",
    "closed": "closed",
    # Legacy/alternative stage names mapping
    "new lead": "cold_call",
    "new inquiry": "cold_call",
    "1. new inquiry": "cold_call",
    "contacted": "build_interest",
    "contacted lead": "build_interest",
    "3. contacted lead": "build_interest",
    "qualified": "interested_waiting",
    "interested": "interested_waiting",
    "meeting": "demo",
    "meeting scheduled": "demo",
    "proposal": "proposal_sent",
    "negotiation": "waiting_leadership",
    "won": "closed",
    "lost": "closed",
    "opportunity": "cold_call",
    "needs_order": "proposal_sent",
    "needs_support": "demo",
    "miscellaneous": "cold_call",
}

def _map_stage_to_status(stage: str) -> str:
    """Map a stage name to the correct kanban column ID"""
    if not stage:
        return "cold_call"
    stage_lower = stage.lower().strip()
    return STAGE_MAPPING.get(stage_lower, "cold_call")


def _normalize_appointments(value: Optional[List[dict]]) -> List[dict]:
    if not isinstance(value, list):
        return []
    normalized = []
    for appointment in value:
        if not isinstance(appointment, dict):
            continue
        normalized.append({
            "id": appointment.get("id") or "",
            "date": appointment.get("date") or "",
            "title": appointment.get("title") or "",
            "location": appointment.get("location") or "",
            "notes": appointment.get("notes") or "",
            "location_type": appointment.get("location_type") or "",
            "physical_address": appointment.get("physical_address") or "",
            "use_saysme": bool(appointment.get("use_saysme", False)),
            "saysme_room_name": appointment.get("saysme_room_name") or "",
            "saysme_meeting_url": appointment.get("saysme_meeting_url") or "",
            "use_other_meeting": bool(appointment.get("use_other_meeting", False)),
            "other_meeting_url": appointment.get("other_meeting_url") or "",
        })
    return normalized


def _build_appointment_email_content(lead: dict, appointment: dict) -> tuple[str, str]:
    lead_name = lead.get("primary_contact_name") or lead.get("name") or "Client"
    title = appointment.get("title") or "Scheduled appointment"
    date_value = appointment.get("date") or "TBD"
    notes = appointment.get("notes") or ""
    location_type = appointment.get("location_type") or ""
    physical_address = appointment.get("physical_address") or ""
    saysme_url = appointment.get("saysme_meeting_url") or ""
    other_meeting_url = appointment.get("other_meeting_url") or ""

    location_lines = []
    if location_type == "physical" and physical_address:
        location_lines.append(f"Physical Address: {physical_address}")
    if saysme_url:
        location_lines.append(f"Meeting Room (SaySMe): {saysme_url}")
    if other_meeting_url:
        location_lines.append(f"Other Meeting URL: {other_meeting_url}")
    if not location_lines and appointment.get("location"):
        location_lines.append(f"Location: {appointment.get('location')}")

    location_html = "<br>".join(location_lines) if location_lines else "Location details pending"
    location_text = "\n".join(location_lines) if location_lines else "Location details pending"

    subject = f"Appointment Update: {title}"
    html_content = f"""
    <html>
      <body style=\"font-family: Arial, sans-serif; color: #1f2937;\">
        <h2 style=\"margin-bottom: 8px;\">Appointment Updated</h2>
        <p style=\"margin-top: 0;\">Opportunity: <strong>{lead.get('opportunity_name') or lead.get('name') or 'Opportunity'}</strong></p>
        <p><strong>Contact:</strong> {lead_name}</p>
        <p><strong>Title:</strong> {title}</p>
        <p><strong>Date/Time:</strong> {date_value}</p>
        <p><strong>Location Details:</strong><br>{location_html}</p>
        {f'<p><strong>Notes:</strong> {notes}</p>' if notes else ''}
        <hr>
        <p style=\"font-size: 12px; color: #6b7280;\">This update was sent from 123Bots Opportunities.</p>
      </body>
    </html>
    """
    notes_text = f"Notes: {notes}\n" if notes else ""
    text_content = (
        f"Appointment Updated\n"
        f"Opportunity: {lead.get('opportunity_name') or lead.get('name') or 'Opportunity'}\n"
        f"Contact: {lead_name}\n"
        f"Title: {title}\n"
        f"Date/Time: {date_value}\n"
        f"Location Details:\n{location_text}\n"
        f"{notes_text}"
    )
    return subject, html_content, text_content


async def _send_appointment_update_notifications(lead: dict, sender_email: Optional[str]) -> int:
    appointments = _normalize_appointments(lead.get("appointments"))
    if not appointments:
        return 0

    latest_appointment = appointments[-1]
    return await _send_single_appointment_notification(lead, latest_appointment, sender_email)


async def _send_single_appointment_notification(lead: dict, appointment: dict, sender_email: Optional[str]) -> int:
    subject, html_content, text_content = _build_appointment_email_content(lead, appointment)

    recipients = []
    primary_email = (lead.get("primary_email") or lead.get("email") or "").strip().lower()
    if primary_email:
        recipients.append(primary_email)
    sender_clean = (sender_email or "").strip().lower()
    if sender_clean and sender_clean not in recipients:
        recipients.append(sender_clean)

    sent_count = 0
    for recipient in recipients:
        sent = await send_email(recipient, subject, html_content, text_content)
        if sent:
            sent_count += 1
    return sent_count


@router.post("/{lead_id}/appointments/resend")
async def resend_appointment_info(
    lead_id: str,
    payload: ResendAppointmentRequest,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    """Resend appointment info for a specific saved appointment."""
    admin_user = _require_admin_token(authorization)

    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    appointments = _normalize_appointments(lead.get("appointments"))
    if not appointments:
        raise HTTPException(status_code=400, detail="No saved appointments found")

    target_appointment = None
    if payload.appointment_id:
        target_appointment = next((appointment for appointment in appointments if appointment.get("id") == payload.appointment_id), None)

    if target_appointment is None and payload.appointment_index is not None:
        if 0 <= payload.appointment_index < len(appointments):
            target_appointment = appointments[payload.appointment_index]

    if target_appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")

    sent_count = await _send_single_appointment_notification(lead, target_appointment, admin_user.get("email"))

    await db.leads.update_one(
        {"id": lead_id},
        {"$set": {"last_appointment_email_sent_at": datetime.now(timezone.utc).isoformat()}},
    )

    return {
        "success": True,
        "message": "Meeting info resent",
        "appointment_notifications_sent": sent_count,
    }


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
        "status": _map_stage_to_status(lead.stage or "Cold Call"),
        "notes": "",
        "attachments": lead.attachments or [],
        "primary_contact_name": lead.primary_contact_name or lead.name,
        "primary_email": lead.primary_email or lead.email,
        "primary_phone": lead.primary_phone or lead.phone or "",
        "additional_contacts": lead.additional_contacts or [],
        "opportunity_name": lead.opportunity_name or lead.name,
        "pipeline": lead.pipeline or "001. Main Leads Pipeline",
        "stage": lead.stage or "Cold Call",
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
        "pipeline_id": lead.pipeline_id or "",
        "created_at": now,
        "updated_at": now
    }
    
    await db.leads.insert_one(lead_doc)
    
    return {"success": True, "message": "Lead created", "lead_id": lead_id}


@router.get("/")
async def get_all_leads(
    authorization: Optional[str] = Header(None),
    pipeline_id: Optional[str] = None,
    db=Depends(get_db)
):
    """Get all leads grouped by pipeline stage for kanban view. Optionally filter by pipeline_id."""
    _require_admin_token(authorization)
    
    query = {}
    if pipeline_id:
        # Match leads with this pipeline_id OR leads without any pipeline_id (legacy/unassigned)
        from external_api import _db as ext_db
        is_default = False
        if ext_db is not None:
            dp = await ext_db.pipelines.find_one({"id": pipeline_id, "is_default": True})
            is_default = dp is not None
        
        if is_default:
            query["$or"] = [
                {"pipeline_id": pipeline_id},
                {"pipeline_id": {"$exists": False}},
                {"pipeline_id": ""},
                {"pipeline_id": None},
            ]
        else:
            query["pipeline_id"] = pipeline_id
    
    leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).to_list(length=1000)
    
    # Group leads by their column status, mapping legacy statuses to valid column IDs
    grouped = {}
    
    for lead in leads:
        status = lead.get("status", "")
        
        # If status is not a recognized column ID, map it from the stage field
        if status not in VALID_STATUSES:
            stage = lead.get("stage", "")
            status = _map_stage_to_status(stage)
        
        if status not in grouped:
            grouped[status] = []
        grouped[status].append(lead)
    
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
    admin_user = _require_admin_token(authorization)
    
    lead = await db.leads.find_one({"id": lead_id})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    appointment_notifications_sent = 0
    appointments_changed = False

    if "appointments" in update_data:
        new_appointments = _normalize_appointments(update_data.get("appointments"))
        old_appointments = _normalize_appointments(lead.get("appointments"))
        update_data["appointments"] = new_appointments
        appointments_changed = new_appointments != old_appointments

        if appointments_changed and len(new_appointments) > 0:
            update_data["last_appointment_email_sent_at"] = datetime.now(timezone.utc).isoformat()
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.leads.update_one({"id": lead_id}, {"$set": update_data})
        if appointments_changed and len(update_data.get("appointments", [])) > 0:
            updated_lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
            appointment_notifications_sent = await _send_appointment_update_notifications(
                updated_lead or {**lead, **update_data},
                admin_user.get("email"),
            )
    
    return {
        "success": True,
        "message": "Lead updated",
        "appointment_notifications_sent": appointment_notifications_sent,
    }


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



# ============ IMPORT OPPORTUNITIES ============

@router.post("/import")
async def import_opportunities(
    file: UploadFile = File(...),
    skip_duplicates: bool = True,
    authorization: str = Header(None)
):
    """
    Import opportunities from CSV file with ALL fields.
    """
    admin = _require_admin_token(authorization)
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    content = await file.read()
    try:
        decoded = content.decode('utf-8')
    except UnicodeDecodeError:
        decoded = content.decode('latin-1')
    
    reader = csv.DictReader(io.StringIO(decoded))
    
    imported = 0
    skipped = 0
    errors = []
    
    for row_num, row in enumerate(reader, start=2):
        try:
            opportunity_name = (row.get('Opportunity Name') or row.get('opportunity_name') or '').strip()
            if not opportunity_name:
                errors.append(f"Row {row_num}: Missing Opportunity Name")
                continue
            
            # Check for duplicate by name if skip_duplicates is enabled
            if skip_duplicates:
                existing = await _db.leads.find_one({"opportunity_name": opportunity_name})
                if existing:
                    skipped += 1
                    continue
            
            # Parse Lead Value
            lead_value_str = row.get('Lead Value') or row.get('lead_value') or '0'
            try:
                lead_value = float(str(lead_value_str).replace(',', '').replace('$', '').strip() or '0')
            except (ValueError, TypeError):
                lead_value = 0.0
            
            # Parse Engagement Score
            engagement_str = row.get('Engagement Score') or '0'
            try:
                engagement_score = float(str(engagement_str).replace(',', '').strip() or '0')
            except (ValueError, TypeError):
                engagement_score = 0.0
            
            # Parse tags
            tags_str = row.get('tags') or ''
            tags = [t.strip() for t in tags_str.split(',') if t.strip()] if tags_str else []
            
            # Parse followers
            followers_str = row.get('Followers') or ''
            followers = [f.strip() for f in followers_str.split(',') if f.strip()] if followers_str else []
            
            # Get status - map to proper case
            status_raw = (row.get('status') or 'open').strip().lower()
            if status_raw == 'open':
                opportunity_status = 'Open'
            elif status_raw == 'won':
                opportunity_status = 'Won'
            elif status_raw in ['lost', 'closed']:
                opportunity_status = 'Lost'
            else:
                opportunity_status = 'Open'
            
            # Build the lead/opportunity document with ALL fields
            lead = {
                "id": str(uuid.uuid4()),
                # Core contact info
                "name": (row.get('Contact Name') or row.get('contact_name') or opportunity_name).strip(),
                "email": (row.get('email') or '').strip(),
                "phone": (row.get('phone') or '').strip(),
                # Opportunity details
                "opportunity_name": opportunity_name,
                "pipeline": (row.get('pipeline') or '001. Main Leads Pipeline').strip(),
                "stage": (row.get('stage') or 'New Lead').strip(),
                "opportunity_status": opportunity_status,
                "opportunity_value": lead_value,
                "opportunity_source": (row.get('source') or '').strip(),
                # Business/Contact details
                "business_name": opportunity_name,
                "primary_contact_name": (row.get('Contact Name') or row.get('contact_name') or '').strip(),
                "primary_email": (row.get('email') or '').strip(),
                "primary_phone": (row.get('phone') or '').strip(),
                # Assignment & Team
                "assigned": (row.get('assigned') or '').strip(),
                "owner_id": admin.get("user_id", ""),
                "followers": followers,
                # Notes & Tags
                "notes": (row.get('Notes') or '').strip(),
                "tags": tags,
                # Lost reason
                "lost_reason_id": (row.get('lost reason ID') or '').strip(),
                "lost_reason_name": (row.get('lost reason name') or '').strip(),
                # Engagement
                "engagement_score": engagement_score,
                # External IDs (from other systems)
                "external_opportunity_id": (row.get('Opportunity ID') or '').strip(),
                "external_contact_id": (row.get('Contact ID') or '').strip(),
                "pipeline_stage_id": (row.get('Pipeline Stage ID') or '').strip(),
                "pipeline_id": (row.get('Pipeline ID') or '').strip(),
                # Time tracking
                "days_since_stage_change": (row.get('Days Since Last Stage Change Date ') or row.get('Days Since Last Stage Change Date') or '').strip(),
                "days_since_status_change": (row.get('Days Since Last Status Change Date ') or row.get('Days Since Last Status Change Date') or '').strip(),
                "days_since_updated": (row.get('Days Since Last Updated ') or row.get('Days Since Last Updated') or '').strip(),
                # Dates
                "created_at": (row.get('Created on') or datetime.now(timezone.utc).isoformat()).strip(),
                "updated_at": (row.get('Updated on') or datetime.now(timezone.utc).isoformat()).strip(),
                # System fields
                "source": "csv_import",
                "status": "opportunity",
                "additional_contacts": [],
                "appointments": [],
                "tasks": [],
                "notes_timeline": [],
                "payments": [],
                "associated_objects": [],
            }
            
            await _db.leads.insert_one(lead)
            imported += 1
            
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
    
    return {
        "success": True,
        "imported": imported,
        "skipped": skipped,
        "errors": errors[:20],
        "total_errors": len(errors)
    }


@router.get("/export/csv")
async def export_opportunities_csv(authorization: str = Header(None)):
    """Export all opportunities as CSV with ALL fields"""
    _require_admin_token(authorization)
    
    leads = await _db.leads.find(
        {"status": {"$in": VALID_STATUSES + ["opportunity"]}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(5000)
    
    output = io.StringIO()
    fieldnames = [
        "Opportunity Name", "Contact Name", "phone", "email", "pipeline", "stage",
        "Lead Value", "source", "assigned", "Created on", "Updated on",
        "lost reason ID", "lost reason name", "Followers", "Notes", "tags",
        "Engagement Score", "status", "Opportunity ID", "Contact ID",
        "Pipeline Stage ID", "Pipeline ID", "Days Since Last Stage Change Date",
        "Days Since Last Status Change Date", "Days Since Last Updated"
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for lead in leads:
        writer.writerow({
            "Opportunity Name": lead.get("opportunity_name", ""),
            "Contact Name": lead.get("primary_contact_name") or lead.get("name", ""),
            "phone": lead.get("primary_phone") or lead.get("phone", ""),
            "email": lead.get("primary_email") or lead.get("email", ""),
            "pipeline": lead.get("pipeline", ""),
            "stage": lead.get("stage", ""),
            "Lead Value": lead.get("opportunity_value", ""),
            "source": lead.get("opportunity_source", ""),
            "assigned": lead.get("assigned", ""),
            "Created on": lead.get("created_at", ""),
            "Updated on": lead.get("updated_at", ""),
            "lost reason ID": lead.get("lost_reason_id", ""),
            "lost reason name": lead.get("lost_reason_name", ""),
            "Followers": ",".join(lead.get("followers", [])),
            "Notes": lead.get("notes", ""),
            "tags": ",".join(lead.get("tags", [])),
            "Engagement Score": lead.get("engagement_score", ""),
            "status": lead.get("opportunity_status", ""),
            "Opportunity ID": lead.get("external_opportunity_id") or lead.get("id", ""),
            "Contact ID": lead.get("external_contact_id", ""),
            "Pipeline Stage ID": lead.get("pipeline_stage_id", ""),
            "Pipeline ID": lead.get("pipeline_id", ""),
            "Days Since Last Stage Change Date": lead.get("days_since_stage_change", ""),
            "Days Since Last Status Change Date": lead.get("days_since_status_change", ""),
            "Days Since Last Updated": lead.get("days_since_updated", ""),
        })
    
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(content=output.getvalue(), media_type="text/csv")
