import re
import uuid
from datetime import datetime, timezone


DEFAULT_BOOKING_AVAILABILITY = [
    {"day": 1, "start_time": "09:00", "end_time": "17:00", "enabled": True},
    {"day": 2, "start_time": "09:00", "end_time": "17:00", "enabled": True},
    {"day": 3, "start_time": "09:00", "end_time": "17:00", "enabled": True},
    {"day": 4, "start_time": "09:00", "end_time": "17:00", "enabled": True},
    {"day": 5, "start_time": "09:00", "end_time": "17:00", "enabled": True},
    {"day": 6, "start_time": "10:00", "end_time": "14:00", "enabled": False},
    {"day": 0, "start_time": "10:00", "end_time": "14:00", "enabled": False},
]


def _slug_tokens(value: str):
    return [part for part in re.split(r"[^a-zA-Z0-9]+", (value or "").lower()) if part]


def build_first_last_slug(name: str, email: str, user_id: str):
    name_tokens = _slug_tokens(name)
    if len(name_tokens) >= 2:
        return f"{name_tokens[0]}-{name_tokens[-1]}"
    if len(name_tokens) == 1:
        return f"{name_tokens[0]}-{name_tokens[0]}"

    email_tokens = _slug_tokens((email or "").split("@")[0])
    if len(email_tokens) >= 2:
        return f"{email_tokens[0]}-{email_tokens[-1]}"
    if len(email_tokens) == 1:
        return f"{email_tokens[0]}-{email_tokens[0]}"

    return f"user-{(user_id or 'staff')[:8]}"


async def build_unique_booking_slug(db, *, name: str, email: str, user_id: str):
    base_slug = build_first_last_slug(name, email, user_id)
    candidate = base_slug
    suffix = 2
    while True:
        existing = await db.booking_settings.find_one(
            {"$or": [{"booking_slug": candidate}, {"slug": candidate}]},
            {"_id": 0, "user_id": 1},
        )
        if not existing or existing.get("user_id") == user_id:
            return candidate
        candidate = f"{base_slug}-{suffix}"
        suffix += 1


async def ensure_booking_profile_for_user(db, user_doc: dict):
    user_id = user_doc.get("id")
    if not user_id:
        return None

    now = datetime.now(timezone.utc).isoformat()
    existing = await db.booking_settings.find_one({"user_id": user_id}, {"_id": 0})
    slug = await build_unique_booking_slug(
        db,
        name=user_doc.get("name", ""),
        email=user_doc.get("email", ""),
        user_id=user_id,
    )

    defaults = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "booking_slug": slug,
        "slug": slug,
        "enabled": True,
        "availability": DEFAULT_BOOKING_AVAILABILITY,
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
        "created_at": now,
        "updated_at": now,
    }

    if not existing:
        await db.booking_settings.insert_one(defaults)
        return defaults

    update_payload = {
        "booking_slug": existing.get("booking_slug") or existing.get("slug") or slug,
        "slug": existing.get("slug") or existing.get("booking_slug") or slug,
        "availability": existing.get("availability") or DEFAULT_BOOKING_AVAILABILITY,
        "meeting_lengths": existing.get("meeting_lengths") or [15, 30, 45, 60],
        "default_length": existing.get("default_length") or existing.get("meeting_duration") or 30,
        "buffer_minutes": existing.get("buffer_minutes", 15),
        "advance_days": existing.get("advance_days") or existing.get("max_days_ahead") or 30,
        "timezone": existing.get("timezone") or "America/New_York",
        "video_meet_enabled": existing.get("video_meet_enabled", True),
        "video_meet_base_url": existing.get("video_meet_base_url") or "https://meet.saysme.org",
        "default_location_type": existing.get("default_location_type") or "online",
        "physical_address": existing.get("physical_address") or "",
        "other_meeting_url": existing.get("other_meeting_url") or "",
        "updated_at": now,
    }
    await db.booking_settings.update_one(
        {"user_id": user_id},
        {"$set": update_payload},
    )
    return {**existing, **update_payload}


async def ensure_calendar_workspace_for_user(db, user_doc: dict):
    user_id = user_doc.get("id")
    if not user_id:
        return

    now = datetime.now(timezone.utc).isoformat()
    existing_count = await db.calendars.count_documents({"user_id": user_id})
    if existing_count == 0:
        await db.calendars.insert_one(
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "name": f"{(user_doc.get('name') or 'User').strip()} Calendar",
                "description": "Auto-created user calendar",
                "color": "#3b82f6",
                "is_default": True,
                "created_at": now,
                "updated_at": now,
            }
        )

    category_defaults = [
        ("Work", "#3b82f6"),
        ("Meeting", "#f59e0b"),
        ("Booking Meetings", "#10b981"),
    ]
    for name, color in category_defaults:
        existing = await db.event_categories.find_one({"user_id": user_id, "name": name})
        if not existing:
            await db.event_categories.insert_one(
                {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "name": name,
                    "color": color,
                    "created_at": now,
                    "updated_at": now,
                }
            )


async def ensure_user_booking_calendar_setup(db, user_doc: dict):
    await ensure_booking_profile_for_user(db, user_doc)
    await ensure_calendar_workspace_for_user(db, user_doc)
