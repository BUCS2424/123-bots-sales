from datetime import datetime, timedelta, timezone
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from auth import decode_token
from email_utils import send_email


router = APIRouter(prefix="/booking", tags=["Booking"])
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


class BookingSettingsUpdate(BaseModel):
    enabled: bool = True
    title: str = "Book a Meeting"
    description: str = "Choose an available time slot."
    meeting_duration: int = 30
    timezone: str = "UTC"
    daily_start_hour: int = 9
    daily_end_hour: int = 17
    max_days_ahead: int = 30


class AvailabilitySlot(BaseModel):
    day: int
    start_time: str
    end_time: str
    enabled: bool = True


class BookingSettingsExact(BaseModel):
    enabled: bool = True
    availability: List[AvailabilitySlot] = []
    meeting_lengths: List[int] = [15, 30, 45, 60]
    default_length: int = 30
    buffer_minutes: int = 15
    advance_days: int = 30
    timezone: str = "America/New_York"
    video_meet_enabled: bool = True
    video_meet_base_url: str = "https://meet.saysme.org"


class PublicBookingCreate(BaseModel):
    guest_name: str
    guest_email: str
    guest_phone: str = ""
    topic: str = ""
    notes: str = ""
    starts_at: str
    duration_minutes: int = 30


class BookingRequestLegacy(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    date: str
    time: str
    duration: int = 30
    notes: Optional[str] = None
    custom_room_name: Optional[str] = None


class MeetingInvite(BaseModel):
    title: str
    date: str
    time: str
    duration: int = 30
    description: Optional[str] = None
    video_enabled: bool = True
    custom_room_name: Optional[str] = None
    invitees: List[dict] = []


class BookingStatusUpdate(BaseModel):
    status: str


def _booking_slug(user: dict) -> str:
    base = user.get("name") or user.get("email") or "booking"
    slug = "".join(ch.lower() if ch.isalnum() else "-" for ch in base).strip("-")
    return slug or "booking"


def _to_iso(dt: datetime) -> str:
    return dt.replace(tzinfo=timezone.utc).isoformat()


def _default_availability():
    return [
        {"day": 1, "start_time": "09:00", "end_time": "17:00", "enabled": True},
        {"day": 2, "start_time": "09:00", "end_time": "17:00", "enabled": True},
        {"day": 3, "start_time": "09:00", "end_time": "17:00", "enabled": True},
        {"day": 4, "start_time": "09:00", "end_time": "17:00", "enabled": True},
        {"day": 5, "start_time": "09:00", "end_time": "17:00", "enabled": True},
        {"day": 6, "start_time": "10:00", "end_time": "14:00", "enabled": False},
        {"day": 0, "start_time": "10:00", "end_time": "14:00", "enabled": False},
    ]


def _merge_exact_settings(doc: Optional[dict], user: dict):
    merged = {
        "enabled": True,
        "availability": _default_availability(),
        "meeting_lengths": [15, 30, 45, 60],
        "default_length": 30,
        "buffer_minutes": 15,
        "advance_days": 30,
        "timezone": "America/New_York",
        "video_meet_enabled": True,
        "video_meet_base_url": "https://meet.saysme.org",
        **(doc or {}),
    }
    if merged.get("meeting_duration") and not merged.get("default_length"):
        merged["default_length"] = int(merged["meeting_duration"])
    if not merged.get("meeting_lengths"):
        merged["meeting_lengths"] = [15, 30, 45, 60]
    if not merged.get("availability"):
        merged["availability"] = _default_availability()

    merged["booking_slug"] = merged.get("booking_slug") or merged.get("slug") or _booking_slug(user)
    merged["slug"] = merged["booking_slug"]
    return merged


async def _get_settings_by_slug(slug: str):
    return await db.booking_settings.find_one({"$or": [{"slug": slug}, {"booking_slug": slug}]}, {"_id": 0})


@router.get("/settings")
async def get_booking_settings(current_user=Depends(get_current_user)):
    settings = await db.booking_settings.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if settings:
        return _merge_exact_settings(settings, current_user)

    now = datetime.now(timezone.utc).isoformat()
    default_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "booking_slug": _booking_slug(current_user),
        "slug": _booking_slug(current_user),
        "enabled": True,
        "availability": _default_availability(),
        "meeting_lengths": [15, 30, 45, 60],
        "default_length": 30,
        "buffer_minutes": 15,
        "advance_days": 30,
        "timezone": "America/New_York",
        "video_meet_enabled": True,
        "video_meet_base_url": "https://meet.saysme.org",
        "created_at": now,
        "updated_at": now,
    }
    await db.booking_settings.insert_one(default_doc)
    default_doc.pop("_id", None)
    return default_doc


@router.post("/settings")
async def save_booking_settings(payload: BookingSettingsExact, current_user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    slug = _booking_slug(current_user)
    update = {
        "user_id": current_user["id"],
        "booking_slug": slug,
        "slug": slug,
        "enabled": payload.enabled,
        "availability": [s.model_dump() for s in payload.availability],
        "meeting_lengths": payload.meeting_lengths,
        "default_length": payload.default_length,
        "buffer_minutes": payload.buffer_minutes,
        "advance_days": payload.advance_days,
        "timezone": payload.timezone,
        "video_meet_enabled": payload.video_meet_enabled,
        "video_meet_base_url": payload.video_meet_base_url,
        "updated_at": now,
    }
    await db.booking_settings.update_one(
        {"user_id": current_user["id"]},
        {"$set": update, "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": now}},
        upsert=True,
    )
    return {"status": "success", "message": "Booking settings saved"}


@router.put("/settings")
async def update_booking_settings(payload: BookingSettingsUpdate, current_user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    await db.booking_settings.update_one(
        {"user_id": current_user["id"]},
        {
            "$set": {
                **payload.model_dump(),
                "user_id": current_user["id"],
                "slug": _booking_slug(current_user),
                "updated_at": now,
            },
            "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": now},
        },
        upsert=True,
    )
    settings = await db.booking_settings.find_one({"user_id": current_user["id"]}, {"_id": 0})
    return _merge_exact_settings(settings, current_user)


@router.get("/link")
async def get_booking_link(current_user=Depends(get_current_user)):
    settings = await get_booking_settings(current_user)
    slug = settings.get("booking_slug") or settings.get("slug")
    return {
        "slug": slug,
        "booking_slug": slug,
        "booking_url": f"https://my.a2goffice.com/book/{slug}",
        "book_url": f"/book/{slug}",
        "public_url": f"/booking/{slug}",
        "enabled": settings.get("enabled", True),
        "user_name": current_user.get("name", current_user.get("email", "")),
    }


@router.get("/my-bookings")
async def get_my_bookings(current_user=Depends(get_current_user)):
    bookings = await db.bookings.find({"host_user_id": current_user["id"]}, {"_id": 0}).to_list(2000)
    if bookings:
        return sorted(bookings, key=lambda x: (x.get("date", ""), x.get("time", "")), reverse=True)

    meetings = await db.booked_meetings.find({"host_user_id": current_user["id"]}, {"_id": 0}).to_list(2000)
    converted = []
    for m in meetings:
        date = ""
        time = ""
        starts = m.get("starts_at")
        if starts:
            try:
                dt = datetime.fromisoformat(starts.replace("Z", "+00:00"))
                date = dt.strftime("%Y-%m-%d")
                time = dt.strftime("%H:%M")
            except Exception:
                pass
        converted.append(
            {
                "id": m.get("id"),
                "host_user_id": m.get("host_user_id"),
                "guest_name": m.get("guest_name", ""),
                "guest_email": m.get("guest_email", ""),
                "guest_phone": m.get("guest_phone", ""),
                "date": date,
                "time": time,
                "duration": m.get("duration_minutes", 30),
                "notes": m.get("notes", ""),
                "video_link": "",
                "status": m.get("status", "confirmed"),
                "created_at": m.get("created_at"),
            }
        )
    return sorted(converted, key=lambda x: (x.get("date", ""), x.get("time", "")), reverse=True)


@router.delete("/{booking_id}")
async def cancel_booking(booking_id: str, current_user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    result = await db.bookings.update_one(
        {"id": booking_id, "host_user_id": current_user["id"]},
        {"$set": {"status": "cancelled", "updated_at": now}},
    )
    if result.matched_count > 0:
        return {"status": "cancelled"}

    alt = await db.booked_meetings.update_one(
        {"id": booking_id, "host_user_id": current_user["id"]},
        {"$set": {"status": "cancelled", "updated_at": now}},
    )
    if alt.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"status": "cancelled"}


@router.post("/invite")
async def send_invite(payload: MeetingInvite, current_user=Depends(get_current_user)):
    settings = await get_booking_settings(current_user)
    base_url = settings.get("video_meet_base_url", "https://meet.saysme.org")
    video_link = None

    if payload.video_enabled:
        username = (current_user.get("name") or current_user.get("email", "user")).lower().replace(" ", "-")
        room = (payload.custom_room_name or f"{username}-meeting-{int(datetime.now().timestamp())}").lower().replace(" ", "-")
        video_link = f"{base_url}/{room}"

    sent = []
    failed = []
    now = datetime.now(timezone.utc).isoformat()

    for inv in payload.invitees:
        inv_type = inv.get("type")
        inv_value = inv.get("value", "")
        email = None
        phone = None
        name = inv_value

        if inv_type == "contact":
            contact = await db.contacts.find_one({"id": inv_value, "user_id": current_user["id"]}, {"_id": 0})
            if not contact:
                failed.append({"type": inv_type, "value": inv_value, "error": "Contact not found"})
                continue
            email = contact.get("email") or None
            phone = contact.get("phone_number") or contact.get("mobile_phone") or None
            name = contact.get("name", inv_value)
        elif inv_type == "email":
            email = inv_value
        elif inv_type == "sms":
            phone = inv_value

        booking = {
            "id": str(uuid.uuid4()),
            "host_user_id": current_user["id"],
            "guest_name": name,
            "guest_email": email or "",
            "guest_phone": phone or "",
            "date": payload.date,
            "time": payload.time,
            "duration": payload.duration,
            "notes": payload.description or "",
            "video_link": video_link,
            "status": "pending",
            "created_at": now,
            "updated_at": now,
        }
        await db.bookings.insert_one(booking)

        message = (
            f"Meeting: {payload.title}\n"
            f"Date: {payload.date} at {payload.time}\n"
            f"Duration: {payload.duration} minutes\n"
            f"{payload.description or ''}\n"
            f"{('Video: ' + video_link) if video_link else ''}"
        ).strip()

        if email:
            try:
                await send_email(email, f"Meeting Invite: {payload.title}", f"<p>{message.replace(chr(10), '<br>')}</p>", message)
                sent.append({"type": inv_type, "value": email})
            except Exception as exc:
                failed.append({"type": inv_type, "value": email, "error": str(exc)})
        elif phone:
            sent.append({"type": inv_type, "value": phone})
        else:
            failed.append({"type": inv_type, "value": inv_value, "error": "No destination"})

    return {"status": "success", "video_link": video_link, "results": {"sent": sent, "failed": failed}}


@router.get("/public/{slug}")
async def get_public_booking(slug: str):
    settings = await _get_settings_by_slug(slug)
    if not settings or not settings.get("enabled", True):
        raise HTTPException(status_code=404, detail="Booking page not found")

    host = await db.users.find_one({"id": settings["user_id"]}, {"_id": 0, "id": 1, "name": 1, "email": 1})
    if not host:
        raise HTTPException(status_code=404, detail="Host not found")

    merged = _merge_exact_settings(settings, host)
    return {
        "user_name": host.get("name", host.get("email", "")),
        "user_email": host.get("email", ""),
        "availability": merged.get("availability", []),
        "meeting_lengths": merged.get("meeting_lengths", [15, 30, 45, 60]),
        "default_length": merged.get("default_length", 30),
        "buffer_minutes": merged.get("buffer_minutes", 15),
        "advance_days": merged.get("advance_days", 30),
        "timezone": merged.get("timezone", "America/New_York"),
        "video_meet_enabled": merged.get("video_meet_enabled", True),
        "video_meet_base_url": merged.get("video_meet_base_url", "https://meet.saysme.org"),
        # backward compatibility
        "settings": merged,
        "host": host,
        "available_slots": [],
    }


@router.get("/public/{slug}/slots/{date}")
async def get_available_slots(slug: str, date: str):
    settings = await _get_settings_by_slug(slug)
    if not settings:
        raise HTTPException(status_code=404, detail="Booking page not found")

    merged = _merge_exact_settings(settings, {"name": ""})

    try:
        target_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    day_of_week = (target_date.weekday() + 1) % 7
    day_availability = None
    for slot in merged.get("availability", []):
        if slot.get("day") == day_of_week and slot.get("enabled", True):
            day_availability = slot
            break

    if not day_availability:
        return {"date": date, "slots": [], "message": "Not available on this day"}

    start_time = datetime.strptime(day_availability["start_time"], "%H:%M")
    end_time = datetime.strptime(day_availability["end_time"], "%H:%M")
    buffer_minutes = int(merged.get("buffer_minutes", 15))
    default_length = int(merged.get("default_length", 30))

    existing_bookings = await db.bookings.find(
        {"host_user_id": settings["user_id"], "date": date, "status": {"$ne": "cancelled"}},
        {"_id": 0},
    ).to_list(200)

    busy = []
    for b in existing_bookings:
        st = datetime.strptime(b.get("time", "00:00"), "%H:%M")
        en = st + timedelta(minutes=int(b.get("duration", default_length)) + buffer_minutes)
        busy.append((st.time(), en.time()))

    slots = []
    current = start_time
    while current + timedelta(minutes=default_length) <= end_time:
        slot_start = current.time()
        slot_end = (current + timedelta(minutes=default_length)).time()
        available = True
        for busy_start, busy_end in busy:
            if not (slot_end <= busy_start or slot_start >= busy_end):
                available = False
                break
        if available:
            slots.append({"time": current.strftime("%H:%M"), "display": current.strftime("%I:%M %p")})
        current += timedelta(minutes=default_length + buffer_minutes)

    return {"date": date, "slots": slots}


@router.post("/public/{slug}")
async def create_public_booking_legacy(slug: str, payload: BookingRequestLegacy):
    settings = await _get_settings_by_slug(slug)
    if not settings:
        raise HTTPException(status_code=404, detail="Booking page not found")
    if not settings.get("enabled", True):
        raise HTTPException(status_code=400, detail="Booking is currently disabled")

    host = await db.users.find_one({"id": settings["user_id"]}, {"_id": 0, "name": 1, "email": 1})
    if not host:
        raise HTTPException(status_code=404, detail="Host not found")

    merged = _merge_exact_settings(settings, host)
    video_link = None
    if merged.get("video_meet_enabled", True):
        base_url = merged.get("video_meet_base_url", "https://meet.saysme.org")
        username = (host.get("name") or host.get("email", "user")).lower().replace(" ", "-")
        room = (payload.custom_room_name or f"{username}-meeting-{int(datetime.now().timestamp())}").lower().replace(" ", "-")
        video_link = f"{base_url}/{room}"

    now = datetime.now(timezone.utc).isoformat()
    booking = {
        "id": str(uuid.uuid4()),
        "host_user_id": settings["user_id"],
        "guest_name": payload.name,
        "guest_email": payload.email,
        "guest_phone": payload.phone,
        "date": payload.date,
        "time": payload.time,
        "duration": payload.duration,
        "notes": payload.notes,
        "video_link": video_link,
        "status": "confirmed",
        "created_at": now,
        "updated_at": now,
    }
    await db.bookings.insert_one(booking)

    try:
        subject = f"Booking Confirmed: {payload.date} {payload.time}"
        guest_text = f"Hi {payload.name}, your meeting is confirmed for {payload.date} at {payload.time}."
        host_text = f"New booking from {payload.name} ({payload.email}) on {payload.date} at {payload.time}."
        await send_email(payload.email, subject, f"<p>{guest_text}</p>", guest_text)
        if host.get("email"):
            await send_email(host.get("email"), subject, f"<p>{host_text}</p>", host_text)
    except Exception:
        pass

    booking.pop("_id", None)
    return booking


@router.post("/public/{slug}/book")
async def create_public_booking(slug: str, payload: PublicBookingCreate):
    settings = await _get_settings_by_slug(slug)
    if not settings or not settings.get("enabled", True):
        raise HTTPException(status_code=404, detail="Booking page not found")

    starts_at = payload.starts_at
    ends_at = _to_iso(datetime.fromisoformat(starts_at.replace("Z", "+00:00")) + timedelta(minutes=payload.duration_minutes))

    overlap = await db.booked_meetings.find_one(
        {
            "host_user_id": settings["user_id"],
            "status": {"$in": ["scheduled", "confirmed"]},
            "$or": [
                {"starts_at": {"$lte": starts_at}, "ends_at": {"$gt": starts_at}},
                {"starts_at": {"$lt": ends_at}, "ends_at": {"$gte": ends_at}},
            ],
        }
    )
    if overlap:
        raise HTTPException(status_code=409, detail="Selected slot is no longer available")

    now = datetime.now(timezone.utc).isoformat()
    meeting = {
        "id": str(uuid.uuid4()),
        "host_user_id": settings["user_id"],
        "slug": slug,
        "guest_name": payload.guest_name,
        "guest_email": payload.guest_email.lower(),
        "guest_phone": payload.guest_phone,
        "topic": payload.topic,
        "notes": payload.notes,
        "starts_at": starts_at,
        "ends_at": ends_at,
        "duration_minutes": payload.duration_minutes,
        "status": "scheduled",
        "created_at": now,
        "updated_at": now,
    }
    await db.booked_meetings.insert_one(meeting)

    host = await db.users.find_one({"id": settings["user_id"]}, {"_id": 0, "name": 1, "email": 1})
    if host:
        subject = f"Booking Confirmed: {payload.topic or 'Meeting'}"
        guest_text = f"Hi {payload.guest_name}, your meeting is confirmed with {host.get('name')} on {starts_at}."
        host_text = f"New booking: {payload.guest_name} ({payload.guest_email}) starts {starts_at}."
        await send_email(payload.guest_email, subject, f"<p>{guest_text}</p>", guest_text)
        if host.get("email"):
            await send_email(host.get("email"), subject, f"<p>{host_text}</p>", host_text)

    meeting.pop("_id", None)
    return {"success": True, "meeting": meeting}


@router.get("/meetings")
async def list_meetings(current_user=Depends(get_current_user)):
    meetings = await db.booked_meetings.find({"host_user_id": current_user["id"]}, {"_id": 0}).sort("starts_at", 1).to_list(3000)
    return meetings


@router.patch("/meetings/{meeting_id}/status")
async def update_meeting_status(meeting_id: str, payload: BookingStatusUpdate, current_user=Depends(get_current_user)):
    result = await db.booked_meetings.update_one(
        {"id": meeting_id, "host_user_id": current_user["id"]},
        {"$set": {"status": payload.status, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {"success": True}
