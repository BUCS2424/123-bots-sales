from datetime import datetime, timedelta, timezone
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from auth import decode_token
from email_utils import send_email, build_meeting_invite_email
from booking_provisioning import (
    DEFAULT_BOOKING_AVAILABILITY,
    ensure_booking_profile_for_user,
    build_unique_booking_slug,
)


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
    default_location_type: str = "online"
    physical_address: str = ""
    other_meeting_url: str = ""


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
    location_type: Optional[str] = "online"
    physical_address: Optional[str] = ""
    use_saysme: Optional[bool] = True
    use_other: Optional[bool] = False
    other_meeting_text: Optional[str] = ""
    custom_room_name: Optional[str] = None


class MeetingInvite(BaseModel):
    title: str
    date: str
    time: str
    duration: int = 30
    description: Optional[str] = None
    location_type: str = "online"
    use_saysme: bool = True
    use_other: bool = False
    other_meeting_text: str = ""
    physical_address: str = ""
    custom_room_name: Optional[str] = None
    invitees: List[dict] = []


class BookingStatusUpdate(BaseModel):
    status: str


def _booking_slug(user: dict) -> str:
    base = user.get("name") or user.get("email") or "booking"
    slug = "".join(ch.lower() if ch.isalnum() else "-" for ch in base).strip("-")
    return slug or "booking"


def _is_admin(user: dict) -> bool:
    return user.get("role") in ["admin", "super_admin"]


async def _resolve_target_user(current_user: dict, user_id: Optional[str]) -> dict:
    if not user_id or user_id == current_user.get("id"):
        return current_user
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    target_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
    return target_user


def _to_iso(dt: datetime) -> str:
    return dt.replace(tzinfo=timezone.utc).isoformat()


def _default_availability():
    return DEFAULT_BOOKING_AVAILABILITY


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
        "default_location_type": "online",
        "physical_address": "",
        "other_meeting_url": "",
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
async def get_booking_settings(
    user_id: Optional[str] = Query(default=None),
    current_user=Depends(get_current_user),
):
    target_user = await _resolve_target_user(current_user, user_id)
    settings = await db.booking_settings.find_one({"user_id": target_user["id"]}, {"_id": 0})
    if settings:
        return _merge_exact_settings(settings, target_user)

    ensured = await ensure_booking_profile_for_user(db, target_user)
    ensured.pop("_id", None)
    return ensured


@router.post("/settings")
async def save_booking_settings(
    payload: BookingSettingsExact,
    user_id: Optional[str] = Query(default=None),
    current_user=Depends(get_current_user),
):
    target_user = await _resolve_target_user(current_user, user_id)
    now = datetime.now(timezone.utc).isoformat()
    existing = await db.booking_settings.find_one({"user_id": target_user["id"]}, {"_id": 0})
    slug = (existing or {}).get("booking_slug") or (existing or {}).get("slug")
    if not slug:
        slug = await build_unique_booking_slug(
            db,
            name=target_user.get("name", ""),
            email=target_user.get("email", ""),
            user_id=target_user.get("id"),
        )
    update = {
        "user_id": target_user["id"],
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
        "default_location_type": payload.default_location_type,
        "physical_address": payload.physical_address,
        "other_meeting_url": payload.other_meeting_url,
        "updated_at": now,
    }
    await db.booking_settings.update_one(
        {"user_id": target_user["id"]},
        {"$set": update, "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": now}},
        upsert=True,
    )
    return {"status": "success", "message": "Booking settings saved"}


@router.put("/settings")
async def update_booking_settings(
    payload: BookingSettingsUpdate,
    user_id: Optional[str] = Query(default=None),
    current_user=Depends(get_current_user),
):
    target_user = await _resolve_target_user(current_user, user_id)
    now = datetime.now(timezone.utc).isoformat()
    await db.booking_settings.update_one(
        {"user_id": target_user["id"]},
        {
            "$set": {
                **payload.model_dump(),
                "user_id": target_user["id"],
                "slug": _booking_slug(target_user),
                "updated_at": now,
            },
            "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": now},
        },
        upsert=True,
    )
    settings = await db.booking_settings.find_one({"user_id": target_user["id"]}, {"_id": 0})
    return _merge_exact_settings(settings, target_user)


@router.get("/link")
async def get_booking_link(
    user_id: Optional[str] = Query(default=None),
    current_user=Depends(get_current_user),
):
    target_user = await _resolve_target_user(current_user, user_id)
    settings = await get_booking_settings(target_user.get("id"), current_user)
    slug = settings.get("booking_slug") or settings.get("slug")
    return {
        "slug": slug,
        "booking_slug": slug,
        "booking_url": f"https://my.a2goffice.com/book/{slug}",
        "book_url": f"/book/{slug}",
        "public_url": f"/booking/{slug}",
        "enabled": settings.get("enabled", True),
        "user_name": target_user.get("name", target_user.get("email", "")),
        "user_id": target_user.get("id"),
    }


@router.get("/my-bookings")
async def get_my_bookings(
    user_id: Optional[str] = Query(default=None),
    current_user=Depends(get_current_user),
):
    target_user = await _resolve_target_user(current_user, user_id)
    bookings = await db.bookings.find({"host_user_id": target_user["id"]}, {"_id": 0}).to_list(2000)
    if bookings:
        return sorted(bookings, key=lambda x: (x.get("date", ""), x.get("time", "")), reverse=True)

    meetings = await db.booked_meetings.find({"host_user_id": target_user["id"]}, {"_id": 0}).to_list(2000)
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
    base_query = {"id": booking_id}
    if not _is_admin(current_user):
        base_query["host_user_id"] = current_user["id"]
    result = await db.bookings.update_one(
        base_query,
        {"$set": {"status": "cancelled", "updated_at": now}},
    )
    if result.matched_count > 0:
        return {"status": "cancelled"}

    alt = await db.booked_meetings.update_one(
        base_query,
        {"$set": {"status": "cancelled", "updated_at": now}},
    )
    if alt.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"status": "cancelled"}


@router.post("/invite")
async def send_invite(
    payload: MeetingInvite,
    user_id: Optional[str] = Query(default=None),
    current_user=Depends(get_current_user),
):
    target_user = await _resolve_target_user(current_user, user_id)
    settings = await get_booking_settings(target_user.get("id"), current_user)
    base_url = settings.get("video_meet_base_url", "https://meet.saysme.org")
    video_link = None
    room_path = ""
    is_saysme_room = False

    location_type = payload.location_type or settings.get("default_location_type", "online")
    if location_type == "online" and payload.use_other and payload.other_meeting_text:
        video_link = payload.other_meeting_text
    elif location_type == "online" and payload.use_saysme:
        username = (target_user.get("name") or target_user.get("email", "user")).lower().replace(" ", "-")
        room = (payload.custom_room_name or f"{username}-meeting-{int(datetime.now().timestamp())}").lower().replace(" ", "-")
        video_link = f"{base_url}/{room}"
        room_path = f"/{room}"
        is_saysme_room = True

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
            contact = await db.contacts.find_one({"id": inv_value, "user_id": target_user["id"]}, {"_id": 0})
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
            "host_user_id": target_user["id"],
            "guest_name": name,
            "guest_email": email or "",
            "guest_phone": phone or "",
            "date": payload.date,
            "time": payload.time,
            "duration": payload.duration,
            "notes": payload.description or "",
            "video_link": video_link,
            "location_type": location_type,
            "physical_address": payload.physical_address or settings.get("physical_address", ""),
            "other_meeting_url": payload.other_meeting_text or settings.get("other_meeting_url", ""),
            "status": "pending",
            "created_at": now,
            "updated_at": now,
        }
        await db.bookings.insert_one(booking)

        if email:
            try:
                invite_html, invite_text = build_meeting_invite_email(
                    guest_name=name,
                    title=payload.title,
                    date_str=payload.date,
                    time_str=payload.time,
                    duration_minutes=payload.duration,
                    host_email=target_user.get("email", ""),
                    video_link=video_link or "",
                    room_path=room_path,
                    timezone_name=settings.get("timezone", ""),
                    is_saysme_room=is_saysme_room,
                )
                await send_email(email, f"Meeting Invite: {payload.title}", invite_html, invite_text)
                sent.append({"type": inv_type, "value": email})
            except Exception as exc:
                failed.append({"type": inv_type, "value": email, "error": str(exc)})
        elif phone:
            sent.append({"type": inv_type, "value": phone})
        else:
            failed.append({"type": inv_type, "value": inv_value, "error": "No destination"})

    return {"status": "success", "video_link": video_link, "results": {"sent": sent, "failed": failed}}


@router.get("/admin/users")
async def get_booking_users(current_user=Depends(get_current_user)):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")

    users = await db.users.find(
        {"role": {"$in": ["admin", "super_admin"]}, "is_active": {"$ne": False}},
        {"_id": 0, "id": 1, "name": 1, "email": 1, "role": 1},
    ).to_list(500)
    settings = await db.booking_settings.find({}, {"_id": 0, "user_id": 1, "booking_slug": 1, "slug": 1}).to_list(1000)
    settings_map = {item.get("user_id"): item for item in settings}

    results = []
    for user in users:
        slug = (settings_map.get(user.get("id")) or {}).get("booking_slug") or (settings_map.get(user.get("id")) or {}).get("slug")
        results.append(
            {
                "id": user.get("id"),
                "name": user.get("name") or user.get("email"),
                "email": user.get("email"),
                "role": user.get("role"),
                "booking_slug": slug,
                "booking_url": f"https://my.a2goffice.com/book/{slug}" if slug else "",
            }
        )
    return results


@router.get("/admin/meetings")
async def get_admin_meetings(
    user_ids: str = Query(default=""),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    current_user=Depends(get_current_user),
):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")

    selected_ids = [item.strip() for item in user_ids.split(",") if item.strip()]
    if not selected_ids:
        return []

    users = await db.users.find({"id": {"$in": selected_ids}}, {"_id": 0, "id": 1, "name": 1, "email": 1}).to_list(1000)
    users_map = {u.get("id"): u for u in users}

    bookings_query = {"host_user_id": {"$in": selected_ids}}
    if start_date and end_date:
        bookings_query["date"] = {"$gte": start_date[:10], "$lte": end_date[:10]}

    bookings = await db.bookings.find(bookings_query, {"_id": 0}).to_list(5000)

    legacy_query = {"host_user_id": {"$in": selected_ids}}
    if start_date and end_date:
        legacy_query["starts_at"] = {"$gte": start_date, "$lte": end_date}
    legacy_meetings = await db.booked_meetings.find(legacy_query, {"_id": 0}).to_list(5000)

    combined = []
    for item in bookings:
        host = users_map.get(item.get("host_user_id"), {})
        date_value = item.get("date")
        time_value = item.get("time", "00:00")
        start_iso = f"{date_value}T{time_value}:00"
        duration = int(item.get("duration", 30) or 30)
        start_dt = datetime.fromisoformat(start_iso)
        end_dt = start_dt + timedelta(minutes=duration)
        combined.append(
            {
                "id": item.get("id"),
                "host_user_id": item.get("host_user_id"),
                "host_name": host.get("name") or host.get("email") or "Staff",
                "guest_name": item.get("guest_name", ""),
                "guest_email": item.get("guest_email", ""),
                "status": item.get("status", "pending"),
                "location_type": item.get("location_type", "online"),
                "physical_address": item.get("physical_address", ""),
                "video_link": item.get("video_link", ""),
                "other_meeting_url": item.get("other_meeting_url", ""),
                "notes": item.get("notes", ""),
                "start_time": start_dt.isoformat(),
                "end_time": end_dt.isoformat(),
                "source": "booking",
            }
        )

    for item in legacy_meetings:
        host = users_map.get(item.get("host_user_id"), {})
        combined.append(
            {
                "id": item.get("id"),
                "host_user_id": item.get("host_user_id"),
                "host_name": host.get("name") or host.get("email") or "Staff",
                "guest_name": item.get("guest_name", ""),
                "guest_email": item.get("guest_email", ""),
                "status": item.get("status", "scheduled"),
                "location_type": "online",
                "physical_address": "",
                "video_link": "",
                "other_meeting_url": "",
                "notes": item.get("notes", ""),
                "start_time": item.get("starts_at"),
                "end_time": item.get("ends_at"),
                "source": "booked_meeting",
            }
        )

    return sorted(combined, key=lambda x: x.get("start_time", ""))


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
    location_type = payload.location_type or merged.get("default_location_type", "online")
    if location_type == "online" and payload.use_other and payload.other_meeting_text:
        video_link = payload.other_meeting_text
    elif location_type == "online" and merged.get("video_meet_enabled", True) and payload.use_saysme:
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
        "location_type": location_type,
        "physical_address": payload.physical_address or merged.get("physical_address", ""),
        "other_meeting_url": payload.other_meeting_text or merged.get("other_meeting_url", ""),
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
    return {
        "status": "success",
        "message": "Meeting booked successfully!",
        "booking_id": booking["id"],
        "video_link": video_link,
        "details": {
            "date": payload.date,
            "time": payload.time,
            "duration": payload.duration,
            "host_name": host.get("name", "Host"),
            "location_type": location_type,
            "physical_address": booking.get("physical_address", ""),
            "other_meeting_url": booking.get("other_meeting_url", ""),
        },
    }


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
