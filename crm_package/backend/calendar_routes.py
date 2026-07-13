from datetime import datetime, timezone, timedelta
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from auth import decode_token


router = APIRouter(tags=["Calendar"])
security = HTTPBearer()
db = None


def set_database(database):
    global db
    db = database


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token_data = decode_token(credentials.credentials)
    if not token_data or not token_data.user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return token_data


class CalendarCreate(BaseModel):
    name: str
    color: str = "#3b82f6"
    description: str = ""
    is_default: bool = False


class CalendarUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    is_default: Optional[bool] = None


class CategoryCreate(BaseModel):
    name: str
    color: str = "#3b82f6"


class EventCreate(BaseModel):
    title: str
    description: str = ""
    start_time: str
    end_time: str
    all_day: bool = False
    calendar_id: str
    category_id: Optional[str] = None
    location: str = ""
    reminder_minutes: int = 15
    is_recurring: bool = False
    recurrence: Optional[dict] = None
    attendees: List[str] = []
    notes: str = ""
    priority: str = "normal"
    status: str = "confirmed"
    is_bill: bool = False
    bill_amount: Optional[float] = None
    bill_paid: bool = False


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    all_day: Optional[bool] = None
    calendar_id: Optional[str] = None
    category_id: Optional[str] = None
    location: Optional[str] = None
    reminder_minutes: Optional[int] = None
    is_recurring: Optional[bool] = None
    recurrence: Optional[dict] = None
    attendees: Optional[List[str]] = None
    notes: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    is_bill: Optional[bool] = None
    bill_amount: Optional[float] = None
    bill_paid: Optional[bool] = None


@router.get("/calendars")
async def get_calendars(current_user=Depends(get_current_user)):
    user_id = current_user.user_id
    calendars = await db.calendars.find({"user_id": user_id}, {"_id": 0}).to_list(200)
    if calendars:
        return calendars

    now = datetime.now(timezone.utc).isoformat()
    default_calendar = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": "My Calendar",
        "color": "#3b82f6",
        "description": "Default calendar",
        "is_default": True,
        "created_at": now,
        "updated_at": now,
    }
    await db.calendars.insert_one(default_calendar)
    default_calendar.pop("_id", None)
    return [default_calendar]


@router.post("/calendars")
async def create_calendar(payload: CalendarCreate, current_user=Depends(get_current_user)):
    user_id = current_user.user_id
    if payload.is_default:
        await db.calendars.update_many({"user_id": user_id}, {"$set": {"is_default": False}})
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": payload.name,
        "color": payload.color,
        "description": payload.description,
        "is_default": payload.is_default,
        "created_at": now,
        "updated_at": now,
    }
    await db.calendars.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/calendars/categories")
async def get_categories(current_user=Depends(get_current_user)):
    categories = await db.event_categories.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(200)
    if categories:
        return categories

    default_categories = [
        {"id": str(uuid.uuid4()), "user_id": current_user.user_id, "name": "Work", "color": "#3b82f6"},
        {"id": str(uuid.uuid4()), "user_id": current_user.user_id, "name": "Personal", "color": "#10b981"},
        {"id": str(uuid.uuid4()), "user_id": current_user.user_id, "name": "Meeting", "color": "#f59e0b"},
        {"id": str(uuid.uuid4()), "user_id": current_user.user_id, "name": "Important", "color": "#ef4444"},
    ]
    now = datetime.now(timezone.utc).isoformat()
    docs = [{**c, "created_at": now, "updated_at": now} for c in default_categories]
    await db.event_categories.insert_many(docs)
    return docs


@router.post("/calendars/categories")
async def create_category(payload: CategoryCreate, current_user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.user_id,
        "name": payload.name,
        "color": payload.color,
        "created_at": now,
        "updated_at": now,
    }
    await db.event_categories.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/calendars/events")
async def get_events(
    start: Optional[str] = None,
    end: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    calendar_ids: Optional[str] = None,
    calendar_id: Optional[str] = None,
    current_user=Depends(get_current_user),
):
    range_start = start_date or start
    range_end = end_date or end
    query = {"user_id": current_user.user_id}

    if calendar_id:
        query["calendar_id"] = calendar_id
    elif calendar_ids:
        parsed_ids = [v.strip() for v in calendar_ids.split(",") if v.strip()]
        if parsed_ids:
            query["calendar_id"] = {"$in": parsed_ids}

    if range_start and range_end:
        query["$or"] = [
            {"start_time": {"$gte": range_start, "$lte": range_end}},
            {"end_time": {"$gte": range_start, "$lte": range_end}},
            {"$and": [{"start_time": {"$lte": range_start}}, {"end_time": {"$gte": range_end}}]},
        ]
    events = await db.calendar_events.find(query, {"_id": 0}).to_list(2000)
    return events


@router.get("/calendar/sync/status")
async def get_sync_status(current_user=Depends(get_current_user)):
    count = await db.calendar_events.count_documents({"user_id": current_user.user_id, "is_synced": True})
    return {"count": count}


@router.post("/calendars/events")
async def create_event(payload: EventCreate, current_user=Depends(get_current_user)):
    calendar = await db.calendars.find_one({"id": payload.calendar_id, "user_id": current_user.user_id})
    if not calendar:
        raise HTTPException(status_code=404, detail="Calendar not found")
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.user_id,
        **payload.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    await db.calendar_events.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.delete("/calendars/{calendar_id}")
async def delete_calendar(calendar_id: str, current_user=Depends(get_current_user)):
    existing = await db.calendars.find_one({"id": calendar_id, "user_id": current_user.user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Calendar not found")

    total = await db.calendars.count_documents({"user_id": current_user.user_id})
    if total <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last calendar")

    await db.calendar_events.delete_many({"calendar_id": calendar_id, "user_id": current_user.user_id})
    await db.calendars.delete_one({"id": calendar_id, "user_id": current_user.user_id})
    return {"status": "deleted"}


@router.put("/calendars/events/{event_id}")
async def update_event(event_id: str, payload: EventUpdate, current_user=Depends(get_current_user)):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.calendar_events.update_one({"id": event_id, "user_id": current_user.user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    updated = await db.calendar_events.find_one({"id": event_id, "user_id": current_user.user_id}, {"_id": 0})
    return updated


@router.delete("/calendars/events/{event_id}")
async def delete_event(event_id: str, current_user=Depends(get_current_user)):
    result = await db.calendar_events.delete_one({"id": event_id, "user_id": current_user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"status": "deleted"}
