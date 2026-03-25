from datetime import datetime, timezone, timedelta
from typing import Optional, List
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


class PublicBookingCreate(BaseModel):
    guest_name: str
    guest_email: str
    guest_phone: str = ""
    topic: str = ""
    notes: str = ""
    starts_at: str
    duration_minutes: int = 30


class BookingStatusUpdate(BaseModel):
    status: str


def _booking_slug(user: dict) -> str:
    safe_email = (user.get("email") or "booking").split("@")[0].lower().replace(".", "-")
    return safe_email


def _to_iso(dt: datetime) -> str:
    return dt.replace(tzinfo=timezone.utc).isoformat()


@router.get("/settings")
async def get_booking_settings(current_user=Depends(get_current_user)):
    settings = await db.booking_settings.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if settings:
        return settings
    now = datetime.now(timezone.utc).isoformat()
    default = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "slug": _booking_slug(current_user),
        "enabled": True,
        "title": "Book a Meeting",
        "description": "Choose an available time slot.",
        "meeting_duration": 30,
        "timezone": "UTC",
        "daily_start_hour": 9,
        "daily_end_hour": 17,
        "max_days_ahead": 30,
        "created_at": now,
        "updated_at": now,
    }
    await db.booking_settings.insert_one(default)
    default.pop("_id", None)
    return default


@router.put("/settings")
async def update_booking_settings(payload: BookingSettingsUpdate, current_user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    base = {
        **payload.model_dump(),
        "updated_at": now,
    }
    await db.booking_settings.update_one(
        {"user_id": current_user["id"]},
        {
            "$set": {
                **base,
                "user_id": current_user["id"],
                "slug": _booking_slug(current_user),
            },
            "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": now},
        },
        upsert=True,
    )
    settings = await db.booking_settings.find_one({"user_id": current_user["id"]}, {"_id": 0})
    return settings


@router.get("/link")
async def get_booking_link(current_user=Depends(get_current_user)):
    settings = await get_booking_settings(current_user)
    return {
        "slug": settings["slug"],
        "public_url": f"/booking/{settings['slug']}",
        "enabled": settings.get("enabled", True),
    }


@router.get("/public/{slug}")
async def get_public_booking(slug: str):
    settings = await db.booking_settings.find_one({"slug": slug}, {"_id": 0})
    if not settings or not settings.get("enabled", True):
        raise HTTPException(status_code=404, detail="Booking page not found")

    host = await db.users.find_one({"id": settings["user_id"]}, {"_id": 0, "id": 1, "name": 1, "email": 1})
    if not host:
        raise HTTPException(status_code=404, detail="Host not found")

    now = datetime.now(timezone.utc)
    slots = []
    for day in range(min(settings.get("max_days_ahead", 30), 30)):
        date_base = now + timedelta(days=day)
        for hour in range(settings.get("daily_start_hour", 9), settings.get("daily_end_hour", 17)):
            dt = date_base.replace(hour=hour, minute=0, second=0, microsecond=0)
            if dt <= now:
                continue
            slots.append(_to_iso(dt))
    return {
        "settings": settings,
        "host": host,
        "available_slots": slots[:200],
    }


@router.post("/public/{slug}/book")
async def create_public_booking(slug: str, payload: PublicBookingCreate):
    settings = await db.booking_settings.find_one({"slug": slug}, {"_id": 0})
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
        subject = f"Booking Confirmed: {payload.topic or settings.get('title', 'Meeting')}"
        text_guest = (
            f"Hi {payload.guest_name},\n\n"
            f"Your meeting is confirmed with {host.get('name')} on {starts_at}.\n"
            f"Topic: {payload.topic or 'General meeting'}\n\n"
            f"Thanks."
        )
        text_host = (
            f"New booking scheduled.\n\n"
            f"Guest: {payload.guest_name} ({payload.guest_email})\n"
            f"Starts: {starts_at}\n"
            f"Topic: {payload.topic or 'General meeting'}"
        )
        await send_email(payload.guest_email, subject, f"<p>{text_guest.replace(chr(10), '<br>')}</p>", text_guest)
        await send_email(host.get("email"), subject, f"<p>{text_host.replace(chr(10), '<br>')}</p>", text_host)

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
