"""
Event Center Module
- Event Categories CRUD
- Venues / Locations CRUD
- Events CRUD (with ticket types + custom registration form fields)
- Attendees (manual add, check-in, ticket verification by code)
- Dashboard stats (upcoming events, tickets sold, revenue, attendance rate, sales trend)
- Public endpoints for the storefront event listing & event detail pages

Gated entirely by the `events_enabled` feature flag on the frontend.
Follows the existing module conventions (uuid ids, set_database, dict storage).
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Query, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
import re
import secrets
import io
import base64

from auth import decode_token, is_admin_or_above

router = APIRouter(prefix="/api/events", tags=["Event Center"])
public_router = APIRouter(prefix="/api/public/events", tags=["Event Center Public"])

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
    text = (text or "").lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s-]+", "-", text)
    return text.strip("-")[:80] or uuid.uuid4().hex[:8]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _gen_ticket_code() -> str:
    return f"EVT-{secrets.token_hex(4).upper()}-{secrets.token_hex(2).upper()}"


# =============== MODELS ===============

class CategoryCreate(BaseModel):
    name: str
    description: str = ""
    color: str = "#7c3aed"
    image_url: str = ""


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    image_url: Optional[str] = None


class VenueCreate(BaseModel):
    name: str
    address: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    country: str = "USA"
    capacity: int = 0
    description: str = ""
    map_url: str = ""
    images: List[str] = Field(default_factory=list)


class VenueUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    capacity: Optional[int] = None
    description: Optional[str] = None
    map_url: Optional[str] = None
    images: Optional[List[str]] = None


class TicketType(BaseModel):
    id: str = ""
    name: str
    price: float = 0.0
    currency: str = "USD"
    quantity: int = 0          # 0 = unlimited
    sold: int = 0
    description: str = ""
    sales_start: Optional[str] = None
    sales_end: Optional[str] = None
    is_active: bool = True


class CustomFormField(BaseModel):
    id: str = ""
    label: str
    type: str = "text"         # text, textarea, email, phone, number, select, checkbox
    required: bool = False
    placeholder: str = ""
    options: List[str] = Field(default_factory=list)


class EventCreate(BaseModel):
    title: str
    short_description: str = ""
    description: str = ""
    category_id: Optional[str] = None
    venue_id: Optional[str] = None
    status: str = "draft"      # draft, on_sale, live, ended, cancelled
    start_datetime: Optional[str] = None
    end_datetime: Optional[str] = None
    timezone: str = "America/Denver"
    banner_url: str = ""
    images: List[str] = Field(default_factory=list)
    ticket_background_url: str = ""   # drag-n-drop background for the printable/emailed ticket
    ticket_tagline: str = "PREPARE YOURSELF"
    ticket_types: List[TicketType] = Field(default_factory=list)
    custom_form_fields: List[CustomFormField] = Field(default_factory=list)
    capacity: int = 0
    is_featured: bool = False
    seo_title: str = ""
    seo_description: str = ""
    age_limit: str = ""
    refund_policy: str = ""
    additional_info: str = ""


class EventUpdate(BaseModel):
    title: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    venue_id: Optional[str] = None
    status: Optional[str] = None
    start_datetime: Optional[str] = None
    end_datetime: Optional[str] = None
    timezone: Optional[str] = None
    banner_url: Optional[str] = None
    images: Optional[List[str]] = None
    ticket_background_url: Optional[str] = None
    ticket_tagline: Optional[str] = None
    ticket_types: Optional[List[TicketType]] = None
    custom_form_fields: Optional[List[CustomFormField]] = None
    capacity: Optional[int] = None
    is_featured: Optional[bool] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    age_limit: Optional[str] = None
    refund_policy: Optional[str] = None
    additional_info: Optional[str] = None


class AttendeeCreate(BaseModel):
    event_id: str
    ticket_type_id: Optional[str] = None
    name: str
    email: str
    phone: str = ""
    quantity: int = 1
    amount_paid: float = 0.0
    custom_form_data: Dict[str, Any] = Field(default_factory=dict)


# =============== CATEGORIES ===============

@router.get("/categories")
async def list_categories(authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    cats = await db.event_categories.find({}, {"_id": 0}).sort("name", 1).to_list(500)
    return cats


@router.post("/categories")
async def create_category(payload: CategoryCreate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    doc = payload.model_dump()
    doc["id"] = uuid.uuid4().hex
    doc["slug"] = slugify(payload.name)
    doc["created_at"] = _now_iso()
    await db.event_categories.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@router.put("/categories/{category_id}")
async def update_category(category_id: str, payload: CategoryUpdate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "name" in update:
        update["slug"] = slugify(update["name"])
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await db.event_categories.update_one({"id": category_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    cat = await db.event_categories.find_one({"id": category_id}, {"_id": 0})
    return cat


@router.delete("/categories/{category_id}")
async def delete_category(category_id: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    await db.event_categories.delete_one({"id": category_id})
    return {"success": True}


# =============== VENUES ===============

@router.get("/venues")
async def list_venues(authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    venues = await db.event_venues.find({}, {"_id": 0}).sort("name", 1).to_list(500)
    return venues


@router.post("/venues")
async def create_venue(payload: VenueCreate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    doc = payload.model_dump()
    doc["id"] = uuid.uuid4().hex
    doc["created_at"] = _now_iso()
    await db.event_venues.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@router.get("/venues/{venue_id}")
async def get_venue(venue_id: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    venue = await db.event_venues.find_one({"id": venue_id}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue


@router.put("/venues/{venue_id}")
async def update_venue(venue_id: str, payload: VenueUpdate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await db.event_venues.update_one({"id": venue_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Venue not found")
    return await db.event_venues.find_one({"id": venue_id}, {"_id": 0})


@router.delete("/venues/{venue_id}")
async def delete_venue(venue_id: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    await db.event_venues.delete_one({"id": venue_id})
    return {"success": True}


# =============== EVENTS ===============

def _normalize_event_subdocs(doc: dict):
    for tt in doc.get("ticket_types", []) or []:
        if not tt.get("id"):
            tt["id"] = uuid.uuid4().hex
        tt.setdefault("sold", 0)
    for f in doc.get("custom_form_fields", []) or []:
        if not f.get("id"):
            f["id"] = uuid.uuid4().hex


async def _unique_slug(db, base: str, exclude_id: Optional[str] = None) -> str:
    slug = base
    i = 2
    while True:
        existing = await db.events.find_one({"slug": slug})
        if not existing or existing.get("id") == exclude_id:
            return slug
        slug = f"{base}-{i}"
        i += 1


@router.get("")
@router.get("/")
async def list_events(
    status: Optional[str] = None,
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    q: Dict[str, Any] = {}
    if status:
        q["status"] = status
    if category_id:
        q["category_id"] = category_id
    if search:
        q["title"] = {"$regex": re.escape(search), "$options": "i"}
    events = await db.events.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    # attach venue + counts
    venue_map = {v["id"]: v for v in await db.event_venues.find({}, {"_id": 0}).to_list(500)}
    for ev in events:
        ev["venue"] = venue_map.get(ev.get("venue_id"))
        ev["tickets_sold"] = sum((tt.get("sold", 0) or 0) for tt in ev.get("ticket_types", []) or [])
    return events


@router.post("")
@router.post("/")
async def create_event(payload: EventCreate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    doc = payload.model_dump()
    doc["id"] = uuid.uuid4().hex
    doc["slug"] = await _unique_slug(db, slugify(payload.title))
    _normalize_event_subdocs(doc)
    doc["created_at"] = _now_iso()
    doc["updated_at"] = _now_iso()
    await db.events.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@router.get("/dashboard/stats")
async def dashboard_stats(authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    now = datetime.now(timezone.utc)
    events = await db.events.find({}, {"_id": 0}).to_list(2000)
    attendees = await db.event_attendees.find({}, {"_id": 0}).to_list(20000)

    def parse_dt(s):
        if not s:
            return None
        try:
            return datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception:
            return None

    upcoming = [e for e in events if (parse_dt(e.get("start_datetime")) or now) >= now and e.get("status") != "cancelled"]
    live_count = len([e for e in events if e.get("status") == "live"])

    tickets_sold = len([a for a in attendees if a.get("status") != "cancelled"])
    total_revenue = sum((a.get("amount_paid", 0) or 0) for a in attendees if a.get("status") != "cancelled")
    checked_in = len([a for a in attendees if a.get("status") == "checked_in"])

    total_capacity = sum((e.get("capacity", 0) or 0) for e in events)
    attendance_rate = round((tickets_sold / total_capacity) * 100, 1) if total_capacity > 0 else 0.0

    # 12-month sales trend
    trend = []
    for i in range(11, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=30 * i))
        label = month_start.strftime("%b")
        count = 0
        for a in attendees:
            c = parse_dt(a.get("created_at"))
            if c and c.year == month_start.year and c.month == month_start.month:
                count += 1
        trend.append({"label": label, "value": count})

    venue_map = {v["id"]: v for v in await db.event_venues.find({}, {"_id": 0}).to_list(500)}
    upcoming_sorted = sorted(upcoming, key=lambda e: parse_dt(e.get("start_datetime")) or now)[:6]
    upcoming_cards = []
    for e in upcoming_sorted:
        sold = sum((tt.get("sold", 0) or 0) for tt in e.get("ticket_types", []) or [])
        cap = e.get("capacity", 0) or 0
        venue = venue_map.get(e.get("venue_id"))
        upcoming_cards.append({
            "id": e["id"],
            "title": e["title"],
            "start_datetime": e.get("start_datetime"),
            "status": e.get("status"),
            "venue_name": venue.get("name") if venue else "",
            "venue_city": venue.get("city") if venue else "",
            "fill_pct": round((sold / cap) * 100) if cap > 0 else 0,
        })

    return {
        "upcoming_events": len(upcoming),
        "live_events": live_count,
        "tickets_sold": tickets_sold,
        "total_revenue": round(total_revenue, 2),
        "checked_in": checked_in,
        "attendance_rate": attendance_rate,
        "total_events": len(events),
        "sales_trend": trend,
        "upcoming_list": upcoming_cards,
    }


@router.get("/{event_id}")
async def get_event(event_id: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    ev = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    if ev.get("venue_id"):
        ev["venue"] = await db.event_venues.find_one({"id": ev["venue_id"]}, {"_id": 0})
    return ev


@router.put("/{event_id}")
async def update_event(event_id: str, payload: EventUpdate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "title" in update:
        update["slug"] = await _unique_slug(db, slugify(update["title"]), exclude_id=event_id)
    _normalize_event_subdocs(update)
    update["updated_at"] = _now_iso()
    res = await db.events.update_one({"id": event_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return await db.events.find_one({"id": event_id}, {"_id": 0})


@router.delete("/{event_id}")
async def delete_event(event_id: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    await db.events.delete_one({"id": event_id})
    await db.event_attendees.delete_many({"event_id": event_id})
    return {"success": True}


# =============== ATTENDEES & CHECK-IN ===============

@router.get("/attendees/list")
async def list_attendees(
    event_id: Optional[str] = Query(None),
    search: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    q: Dict[str, Any] = {}
    if event_id:
        q["event_id"] = event_id
    if search:
        q["$or"] = [
            {"name": {"$regex": re.escape(search), "$options": "i"}},
            {"email": {"$regex": re.escape(search), "$options": "i"}},
            {"ticket_code": {"$regex": re.escape(search), "$options": "i"}},
        ]
    attendees = await db.event_attendees.find(q, {"_id": 0}).sort("created_at", -1).to_list(5000)
    event_map = {e["id"]: e["title"] for e in await db.events.find({}, {"_id": 0, "id": 1, "title": 1}).to_list(2000)}
    for a in attendees:
        a["event_title"] = event_map.get(a.get("event_id"), "")
    return attendees


@router.post("/attendees")
async def create_attendee(payload: AttendeeCreate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    ev = await db.events.find_one({"id": payload.event_id})
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    tt_name = ""
    for tt in ev.get("ticket_types", []) or []:
        if tt.get("id") == payload.ticket_type_id:
            tt_name = tt.get("name", "")
    doc = {
        "id": uuid.uuid4().hex,
        "event_id": payload.event_id,
        "ticket_type_id": payload.ticket_type_id,
        "ticket_type_name": tt_name,
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "quantity": payload.quantity,
        "amount_paid": payload.amount_paid,
        "custom_form_data": payload.custom_form_data,
        "ticket_code": _gen_ticket_code(),
        "status": "valid",
        "checked_in_at": None,
        "source": "manual",
        "created_at": _now_iso(),
    }
    await db.event_attendees.insert_one(dict(doc))
    # increment sold counter
    if payload.ticket_type_id:
        await db.events.update_one(
            {"id": payload.event_id, "ticket_types.id": payload.ticket_type_id},
            {"$inc": {"ticket_types.$.sold": payload.quantity}},
        )
    doc.pop("_id", None)
    return doc


@router.post("/attendees/{attendee_id}/checkin")
async def checkin_attendee(attendee_id: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    att = await db.event_attendees.find_one({"id": attendee_id})
    if not att:
        raise HTTPException(status_code=404, detail="Attendee not found")
    if att.get("status") == "checked_in":
        return {"success": True, "already": True, "message": "Already checked in", "checked_in_at": att.get("checked_in_at")}
    if att.get("status") == "cancelled":
        raise HTTPException(status_code=400, detail="Ticket is cancelled")
    ts = _now_iso()
    await db.event_attendees.update_one({"id": attendee_id}, {"$set": {"status": "checked_in", "checked_in_at": ts}})
    return {"success": True, "already": False, "checked_in_at": ts}


@router.get("/verify/{code}")
async def verify_ticket(code: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    att = await db.event_attendees.find_one({"ticket_code": code.strip()}, {"_id": 0})
    if not att:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ev = await db.events.find_one({"id": att.get("event_id")}, {"_id": 0, "title": 1, "start_datetime": 1})
    att["event_title"] = ev.get("title") if ev else ""
    att["event_start"] = ev.get("start_datetime") if ev else ""
    return att


@router.delete("/attendees/{attendee_id}")
async def delete_attendee(attendee_id: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    await db.event_attendees.delete_one({"id": attendee_id})
    return {"success": True}


# =============== PUBLIC ===============

@public_router.get("")
@public_router.get("/")
async def public_list_events(db=Depends(get_db)):
    events = await db.events.find(
        {"status": {"$in": ["on_sale", "live"]}}, {"_id": 0}
    ).sort("start_datetime", 1).to_list(500)
    venue_map = {v["id"]: v for v in await db.event_venues.find({}, {"_id": 0}).to_list(500)}
    cat_map = {c["id"]: c for c in await db.event_categories.find({}, {"_id": 0}).to_list(500)}
    for ev in events:
        ev["venue"] = venue_map.get(ev.get("venue_id"))
        ev["category"] = cat_map.get(ev.get("category_id"))
    return events


@public_router.get("/meta/categories")
async def public_list_categories(db=Depends(get_db)):
    return await db.event_categories.find({}, {"_id": 0}).sort("name", 1).to_list(500)


@public_router.get("/{slug}")
async def public_get_event(slug: str, preview: bool = False, db=Depends(get_db)):
    query = {"slug": slug}
    if not preview:
        query["status"] = {"$in": ["on_sale", "live"]}
    ev = await db.events.find_one(query, {"_id": 0})
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    if ev.get("venue_id"):
        ev["venue"] = await db.event_venues.find_one({"id": ev["venue_id"]}, {"_id": 0})
    if ev.get("category_id"):
        ev["category"] = await db.event_categories.find_one({"id": ev["category_id"]}, {"_id": 0})
    return ev


# =============== PHASE 2: TICKETS, QR, PAYPAL, EMAIL ===============

def _make_qr_data_uri(text: str) -> str:
    import qrcode
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def _public_origin(request: Request) -> str:
    fwd_host = request.headers.get("x-forwarded-host")
    proto = request.headers.get("x-forwarded-proto", "https")
    if fwd_host:
        return f"{proto}://{fwd_host}".rstrip("/")
    return str(request.base_url).rstrip("/")


def _build_ticket_html(event: dict, attendee: dict, venue: Optional[dict], origin: str) -> str:
    qr = _make_qr_data_uri(attendee["ticket_code"])
    start = event.get("start_datetime")
    date_str = time_str = ""
    if start:
        try:
            d = datetime.fromisoformat(start.replace("Z", "+00:00"))
            date_str = d.strftime("%b %d, %Y")
            time_str = d.strftime("%I:%M %p")
        except Exception:
            pass
    bg = event.get("ticket_background_url") or ""
    bg_style = (f"background-image:linear-gradient(rgba(10,5,18,0.55),rgba(10,5,18,0.85)),url('{bg}');"
                "background-size:cover;background-position:center;") if bg else \
               "background:linear-gradient(135deg,#4c1d95,#a21caf,#0b0712);"
    tagline = event.get("ticket_tagline") or "PREPARE YOURSELF"
    venue_name = (venue or {}).get("name", "")
    ticket_url = f"{origin}/events/ticket/{attendee['ticket_code']}"
    return f"""
    <div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;">
      <div style="border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.4);">
        <div style="{bg_style}padding:28px;color:#fff;position:relative;min-height:230px;">
          <img src="{qr}" alt="QR" width="92" height="92" style="background:#fff;padding:6px;border-radius:8px;"/>
          <div style="text-align:right;margin-top:-92px;">
            <div style="font-size:16px;letter-spacing:4px;">ADMIT ONE</div>
            <div style="font-size:26px;font-weight:bold;">{attendee.get('ticket_type_name') or 'Ticket'}</div>
          </div>
          <div style="margin-top:70px;">
            <div style="font-size:11px;letter-spacing:3px;opacity:.8;">{tagline}</div>
            <div style="font-size:30px;font-weight:900;text-transform:uppercase;line-height:1.1;">{event.get('title','')}</div>
          </div>
          <table style="margin-top:18px;color:#fff;width:100%;font-size:13px;">
            <tr>
              <td><div style="opacity:.6;font-size:10px;text-transform:uppercase;">Date</div>{date_str or '--'}</td>
              <td><div style="opacity:.6;font-size:10px;text-transform:uppercase;">Time</div>{time_str or '--'}</td>
              <td><div style="opacity:.6;font-size:10px;text-transform:uppercase;">Venue</div>{venue_name or '--'}</td>
            </tr>
          </table>
        </div>
        <div style="background:#150f22;color:#fff;padding:18px 28px;border-top:2px dashed rgba(255,255,255,0.2);">
          <div style="font-size:13px;">Attendee: <strong>{attendee.get('name','')}</strong></div>
          <div style="font-size:13px;margin-top:4px;">Ticket No. <strong>{attendee['ticket_code']}</strong></div>
          <div style="margin-top:10px;font-size:12px;opacity:.7;">Present this ticket (QR code) at the door for entry.</div>
          <a href="{ticket_url}" style="display:inline-block;margin-top:12px;background:#7c3aed;color:#fff;text-decoration:none;padding:9px 16px;border-radius:8px;font-size:13px;font-weight:bold;">View My Ticket</a>
        </div>
      </div>
    </div>
    """


async def _issue_tickets_and_email(db, event: dict, order: dict, origin: str):
    """Create attendee rows for a paid/free order and email each their ticket."""
    from email_utils import send_email
    venue = await db.event_venues.find_one({"id": event.get("venue_id")}, {"_id": 0}) if event.get("venue_id") else None
    tt_map = {t.get("id"): t for t in event.get("ticket_types", []) or []}
    created = []
    for item in order.get("items", []):
        tt = tt_map.get(item.get("ticket_type_id"), {})
        for _ in range(int(item.get("quantity", 1))):
            att = {
                "id": uuid.uuid4().hex,
                "event_id": event["id"],
                "ticket_type_id": item.get("ticket_type_id"),
                "ticket_type_name": tt.get("name", ""),
                "name": order.get("buyer_name", ""),
                "email": order.get("buyer_email", ""),
                "phone": order.get("buyer_phone", ""),
                "quantity": 1,
                "amount_paid": float(tt.get("price", 0) or 0),
                "custom_form_data": order.get("custom_form_data", {}),
                "ticket_code": _gen_ticket_code(),
                "status": "valid",
                "checked_in_at": None,
                "order_id": order["id"],
                "source": "online",
                "created_at": _now_iso(),
            }
            await db.event_attendees.insert_one(dict(att))
            att.pop("_id", None)
            created.append(att)
        if item.get("ticket_type_id"):
            await db.events.update_one(
                {"id": event["id"], "ticket_types.id": item["ticket_type_id"]},
                {"$inc": {"ticket_types.$.sold": int(item.get("quantity", 1))}},
            )
    # email each ticket
    for att in created:
        try:
            html = _build_ticket_html(event, att, venue, origin)
            await send_email(att["email"], f"Your ticket for {event.get('title','')}", html)
        except Exception as e:
            print(f"[event_center] ticket email failed: {e}")
    await db.event_orders.update_one({"id": order["id"]}, {"$set": {"attendee_ids": [a["id"] for a in created]}})
    return created


class RegisterItem(BaseModel):
    ticket_type_id: str
    quantity: int = 1


class RegisterRequest(BaseModel):
    buyer_name: str
    buyer_email: str
    buyer_phone: str = ""
    items: List[RegisterItem]
    custom_form_data: Dict[str, Any] = Field(default_factory=dict)


@public_router.get("/config/paypal")
async def public_paypal_config(db=Depends(get_db)):
    s = await db.payment_settings.find_one({"type": "paypal"}, {"_id": 0})
    if not s or not s.get("is_enabled"):
        return {"enabled": False}
    is_test = s.get("is_test_mode", True)
    setup = s.get("setup_mode", "email")
    if setup == "email":
        available = bool(s.get("paypal_email"))
    else:
        available = bool((s.get("sandbox_client_id") and s.get("sandbox_client_secret")) if is_test
                         else (s.get("live_client_id") and s.get("live_client_secret")))
    return {"enabled": True, "available": available, "setup_mode": setup}


@public_router.post("/{slug}/register")
async def public_register(slug: str, payload: RegisterRequest, request: Request, db=Depends(get_db)):
    event = await db.events.find_one({"slug": slug, "status": {"$in": ["on_sale", "live"]}}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not available")
    if not payload.items:
        raise HTTPException(status_code=400, detail="Select at least one ticket")

    tt_map = {t.get("id"): t for t in event.get("ticket_types", []) or []}
    total = 0.0
    line_items = []
    for it in payload.items:
        tt = tt_map.get(it.ticket_type_id)
        if not tt:
            raise HTTPException(status_code=400, detail="Invalid ticket type")
        qty = max(1, int(it.quantity))
        total += float(tt.get("price", 0) or 0) * qty
        line_items.append({"ticket_type_id": it.ticket_type_id, "ticket_type_name": tt.get("name", ""), "quantity": qty, "price": float(tt.get("price", 0) or 0)})

    order = {
        "id": uuid.uuid4().hex,
        "order_number": "EVO-" + secrets.token_hex(4).upper(),
        "event_id": event["id"],
        "event_slug": slug,
        "buyer_name": payload.buyer_name,
        "buyer_email": payload.buyer_email,
        "buyer_phone": payload.buyer_phone,
        "items": line_items,
        "custom_form_data": payload.custom_form_data,
        "total": round(total, 2),
        "payment_status": "pending",
        "payment_method": "paypal" if total > 0 else "free",
        "paypal_order_id": None,
        "attendee_ids": [],
        "created_at": _now_iso(),
    }
    await db.event_orders.insert_one(dict(order))
    order.pop("_id", None)
    origin = _public_origin(request)

    if total <= 0:
        await db.event_orders.update_one({"id": order["id"]}, {"$set": {"payment_status": "completed"}})
        await _issue_tickets_and_email(db, event, order, origin)
        return {"status": "completed", "order_id": order["id"], "order_number": order["order_number"]}

    # paid: PayPal
    paypal_settings = await db.payment_settings.find_one({"type": "paypal"})
    if not paypal_settings or not paypal_settings.get("is_enabled"):
        raise HTTPException(status_code=503, detail="Online payment is not available. Please contact the organizer.")

    setup_mode = paypal_settings.get("setup_mode", "email")

    # ---- Email mode (no API keys): generate a PayPal payment link to the organizer's email ----
    if setup_mode == "email":
        if not paypal_settings.get("paypal_email"):
            raise HTTPException(status_code=503, detail="PayPal is not configured. Please contact the organizer.")
        from durango_payments import _build_paypal_email_payment_link
        payment_link = _build_paypal_email_payment_link({"order_number": order["order_number"], "total": order["total"]}, paypal_settings)
        await db.event_orders.update_one({"id": order["id"]}, {"$set": {"payment_status": "awaiting_payment", "payment_method": "paypal_email"}})
        order["payment_status"] = "awaiting_payment"
        await _issue_tickets_and_email(db, event, order, origin)
        return {
            "status": "completed",
            "order_id": order["id"],
            "order_number": order["order_number"],
            "payment_link": payment_link,
            "instructions": paypal_settings.get("instructions", "Complete your payment via PayPal and include your order number in the note."),
        }

    # ---- API keys mode: full PayPal Orders v2 checkout with capture ----
    from durango_payments import _get_paypal_access_token
    import httpx
    access_token, base_url = await _get_paypal_access_token(paypal_settings)
    body = {
        "intent": "CAPTURE",
        "purchase_units": [{
            "reference_id": order["order_number"],
            "description": f"{event.get('title','Event')} tickets",
            "amount": {"currency_code": "USD", "value": f"{order['total']:.2f}"},
        }],
        "application_context": {
            "brand_name": "123Bots Events",
            "shipping_preference": "NO_SHIPPING",
            "user_action": "PAY_NOW",
            "return_url": f"{origin}/events/confirmation?order={order['id']}&paypal=success",
            "cancel_url": f"{origin}/events/{slug}?paypal=cancelled",
        },
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(f"{base_url}/v2/checkout/orders", json=body,
                                 headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json", "Prefer": "return=representation"})
    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail="Failed to start PayPal checkout")
    data = resp.json()
    approval = next((l.get("href") for l in data.get("links", []) if l.get("rel") == "approve"), None)
    if not approval:
        raise HTTPException(status_code=502, detail="PayPal approval URL missing")
    await db.event_orders.update_one({"id": order["id"]}, {"$set": {"paypal_order_id": data.get("id")}})
    return {"status": "pending_payment", "order_id": order["id"], "approval_url": approval}


@public_router.post("/orders/{order_id}/capture")
async def public_capture_order(order_id: str, paypal_order_id: Optional[str] = Query(None), request: Request = None, db=Depends(get_db)):
    order = await db.event_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get("payment_status") == "completed":
        attendees = await db.event_attendees.find({"order_id": order_id}, {"_id": 0}).to_list(500)
        return {"status": "completed", "order": order, "attendees": attendees}

    pp_id = paypal_order_id or order.get("paypal_order_id")
    if not pp_id:
        raise HTTPException(status_code=400, detail="Missing PayPal order id")
    paypal_settings = await db.payment_settings.find_one({"type": "paypal"})
    from durango_payments import _get_paypal_access_token
    import httpx
    access_token, base_url = await _get_paypal_access_token(paypal_settings)
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(f"{base_url}/v2/checkout/orders/{pp_id}/capture", json={},
                                 headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"})
    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail="Failed to capture PayPal payment")
    payload = resp.json()
    if payload.get("status") != "COMPLETED":
        raise HTTPException(status_code=400, detail=f"Payment not completed: {payload.get('status')}")

    await db.event_orders.update_one({"id": order_id}, {"$set": {"payment_status": "completed", "paypal_order_id": pp_id}})
    event = await db.events.find_one({"id": order["event_id"]}, {"_id": 0})
    origin = _public_origin(request)
    await _issue_tickets_and_email(db, event, {**order, "payment_status": "completed"}, origin)
    attendees = await db.event_attendees.find({"order_id": order_id}, {"_id": 0}).to_list(500)
    return {"status": "completed", "order": {**order, "payment_status": "completed"}, "attendees": attendees}


@public_router.get("/orders/{order_id}")
async def public_get_order(order_id: str, db=Depends(get_db)):
    order = await db.event_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    attendees = await db.event_attendees.find({"order_id": order_id}, {"_id": 0}).to_list(500)
    event = await db.events.find_one({"id": order["event_id"]}, {"_id": 0, "title": 1, "slug": 1})
    return {"order": order, "attendees": attendees, "event": event}


@public_router.get("/ticket/{ticket_code}")
async def public_get_ticket(ticket_code: str, db=Depends(get_db)):
    att = await db.event_attendees.find_one({"ticket_code": ticket_code}, {"_id": 0})
    if not att:
        raise HTTPException(status_code=404, detail="Ticket not found")
    event = await db.events.find_one({"id": att.get("event_id")}, {"_id": 0})
    venue = await db.event_venues.find_one({"id": event.get("venue_id")}, {"_id": 0}) if event and event.get("venue_id") else None
    return {
        "attendee": att,
        "event": {"title": event.get("title"), "start_datetime": event.get("start_datetime"),
                  "ticket_background_url": event.get("ticket_background_url"), "ticket_tagline": event.get("ticket_tagline")} if event else {},
        "venue": {"name": venue.get("name"), "city": venue.get("city")} if venue else None,
        "qr": _make_qr_data_uri(ticket_code),
    }


@router.post("/attendees/{attendee_id}/resend")
async def resend_ticket(attendee_id: str, request: Request, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    att = await db.event_attendees.find_one({"id": attendee_id}, {"_id": 0})
    if not att:
        raise HTTPException(status_code=404, detail="Attendee not found")
    event = await db.events.find_one({"id": att.get("event_id")}, {"_id": 0})
    venue = await db.event_venues.find_one({"id": event.get("venue_id")}, {"_id": 0}) if event and event.get("venue_id") else None
    from email_utils import send_email
    html = _build_ticket_html(event, att, venue, _public_origin(request))
    await send_email(att["email"], f"Your ticket for {event.get('title','')}", html)
    return {"success": True}
