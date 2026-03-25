# ── A2G Calendar Backend Routes ──────────────────────────────────────────────
# FastAPI + Motor (async MongoDB) + Pydantic v2

class RecurrenceRule(BaseModel):
    frequency: str  # daily, weekly, monthly, yearly
    interval: int = 1  # Every X days/weeks/months/years
    days_of_week: List[str] = []  # For weekly: ["monday", "wednesday"]
    day_of_month: Optional[int] = None  # For monthly: 15
    month_of_year: Optional[int] = None  # For yearly: 1-12
    end_type: str = "never"  # never, after, on_date
    end_after_occurrences: Optional[int] = None
    end_date: Optional[str] = None

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
    recurrence: Optional[RecurrenceRule] = None
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
    recurrence: Optional[RecurrenceRule] = None
    attendees: Optional[List[str]] = None
    notes: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    is_bill: Optional[bool] = None
    bill_amount: Optional[float] = None
    bill_paid: Optional[bool] = None

# Calendar Endpoints
@api_router.get("/calendars")
async def get_user_calendars(current_user: dict = Depends(get_current_user)):
    """Get all calendars for the current user"""
    calendars = await db.calendars.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    # If no calendars exist, create a default one
    if not calendars:
        default_calendar = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "name": "My Calendar",
            "color": "#3b82f6",
            "description": "Default calendar",
            "is_default": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.calendars.insert_one(default_calendar)
        calendars = [default_calendar]
    
    return calendars

@api_router.post("/calendars")
async def create_calendar(calendar: CalendarCreate, current_user: dict = Depends(get_current_user)):
    """Create a new calendar"""
    # If this is set as default, unset other defaults
    if calendar.is_default:
        await db.calendars.update_many(
            {"user_id": current_user["id"]},
            {"$set": {"is_default": False}}
        )
    
    calendar_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "name": calendar.name,
        "color": calendar.color,
        "description": calendar.description,
        "is_default": calendar.is_default,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    await db.calendars.insert_one(calendar_doc)
    if "_id" in calendar_doc:
        del calendar_doc["_id"]
    
    return calendar_doc

@api_router.put("/calendars/{calendar_id}")
async def update_calendar(calendar_id: str, calendar: CalendarUpdate, current_user: dict = Depends(get_current_user)):
    """Update a calendar"""
    existing = await db.calendars.find_one({"id": calendar_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Calendar not found")
    
    update_data = {k: v for k, v in calendar.model_dump().items() if v is not None}
    
    # If setting as default, unset other defaults
    if update_data.get("is_default"):
        await db.calendars.update_many(
            {"user_id": current_user["id"], "id": {"$ne": calendar_id}},
            {"$set": {"is_default": False}}
        )
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.calendars.update_one(
            {"id": calendar_id, "user_id": current_user["id"]},
            {"$set": update_data}
        )
    
    updated = await db.calendars.find_one({"id": calendar_id}, {"_id": 0})
    return updated

@api_router.delete("/calendars/{calendar_id}")
async def delete_calendar(calendar_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a calendar and all its events"""
    existing = await db.calendars.find_one({"id": calendar_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Calendar not found")
    
    # Don't allow deleting the last calendar
    count = await db.calendars.count_documents({"user_id": current_user["id"]})
    if count <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last calendar")
    
    # Delete all events in this calendar
    await db.calendar_events.delete_many({"calendar_id": calendar_id, "user_id": current_user["id"]})
    
    # Delete the calendar
    await db.calendars.delete_one({"id": calendar_id, "user_id": current_user["id"]})
    
    return {"status": "deleted"}

# Category Endpoints
@api_router.get("/calendars/categories")
async def get_categories(current_user: dict = Depends(get_current_user)):
    """Get all categories for the current user"""
    categories = await db.calendar_categories.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    # Create default categories if none exist
    if not categories:
        default_categories = [
            {"id": str(uuid.uuid4()), "user_id": current_user["id"], "name": "Work", "color": "#3b82f6"},
            {"id": str(uuid.uuid4()), "user_id": current_user["id"], "name": "Personal", "color": "#10b981"},
            {"id": str(uuid.uuid4()), "user_id": current_user["id"], "name": "Meeting", "color": "#f59e0b"},
            {"id": str(uuid.uuid4()), "user_id": current_user["id"], "name": "Important", "color": "#ef4444"},
        ]
        await db.calendar_categories.insert_many(default_categories)
        categories = default_categories
    
    return categories

@api_router.post("/calendars/categories")
async def create_category(category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    """Create a new category"""
    category_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "name": category.name,
        "color": category.color,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    await db.calendar_categories.insert_one(category_doc)
    
    return {"id": category_doc["id"], "name": category_doc["name"], "color": category_doc["color"]}

@api_router.delete("/calendars/categories/{category_id}")
async def delete_category(category_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a category"""
    result = await db.calendar_categories.delete_one({"id": category_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Remove category from events
    await db.calendar_events.update_many(
        {"category_id": category_id, "user_id": current_user["id"]},
        {"$set": {"category_id": None}}
    )
    
    return {"status": "deleted"}

# Event Endpoints
@api_router.post("/calendars/fix-recurring-intervals")
async def fix_recurring_intervals(current_user: dict = Depends(get_current_user)):
    """Fix recurring events: reset interval to 1 for monthly/yearly (common data entry mistake)."""
    events = await db.calendar_events.find(
        {"user_id": current_user["id"], "is_recurring": True},
        {"_id": 0}
    ).to_list(100)
    
    fixed = []
    for e in events:
        rec = e.get("recurrence") or {}
        freq = str(rec.get("frequency", "")).lower()
        try:
            interval = int(rec.get("interval", 1))
        except (TypeError, ValueError):
            interval = 1
        
        # For monthly: anything > 12 is almost certainly "day of month" mistake
        # For yearly: anything > 5 is suspicious  
        needs_fix = (
            (freq == "monthly" and interval > 12) or
            (freq == "yearly" and interval > 5)
        )
        if needs_fix:
            await db.calendar_events.update_one(
                {"id": e["id"]},
                {"$set": {"recurrence.interval": 1}}
            )
            fixed.append({"id": e["id"], "title": e.get("title"), "was": interval, "now": 1, "frequency": freq})
    
    return {
        "checked": len(events),
        "fixed": len(fixed),
        "events": fixed,
        "all_events": [{"title": e.get("title"), "freq": str(e.get("recurrence",{}).get("frequency")), "interval": e.get("recurrence",{}).get("interval")} for e in events]
    }

@api_router.get("/calendars/recurring-debug")
async def debug_recurring_events(current_user: dict = Depends(get_current_user)):
    """Debug endpoint — shows ALL recurring events and their recurrence structure."""
    events = await db.calendar_events.find(
        {"user_id": current_user["id"], "is_recurring": True},
        {"_id": 0}
    ).to_list(100)
    
    results = []
    for e in events:
        results.append({
            "id": e.get("id"),
            "title": e.get("title"),
            "start_time": e.get("start_time"),
            "is_recurring": e.get("is_recurring"),
            "recurrence": e.get("recurrence"),
            "recurrence_type": type(e.get("recurrence")).__name__,
            "recurrence_keys": list(e.get("recurrence", {}).keys()) if isinstance(e.get("recurrence"), dict) else "NOT_A_DICT",
        })
    
    return {
        "total_recurring": len(events),
        "events": results
    }

@api_router.get("/calendars/events")
async def get_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    calendar_ids: Optional[str] = None,
    # legacy param names (keep for compatibility)
    start: Optional[str] = None,
    end: Optional[str] = None,
    calendar_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get events within a date range, including synced events from external apps"""
    # Normalise param names
    range_start = start_date or start
    range_end = end_date or end

    query = {"user_id": current_user["id"]}

    if calendar_id:
        query["calendar_id"] = calendar_id
    elif calendar_ids:
        ids = [i.strip() for i in calendar_ids.split(",") if i.strip()]
        if ids:
            query["calendar_id"] = {"$in": ids}

    if range_start and range_end:
        query["$or"] = [
            {"start_time": {"$gte": range_start, "$lte": range_end}},
            {"end_time":   {"$gte": range_start, "$lte": range_end}},
            {"$and": [{"start_time": {"$lte": range_start}}, {"end_time": {"$gte": range_end}}]}
        ]

    events = await db.calendar_events.find(query, {"_id": 0}).to_list(1000)

    # Also fetch ALL recurring events for this user — their original start_time may be
    # BEFORE the view range but they still produce occurrences within it.
    recurring_query = {"user_id": current_user["id"], "is_recurring": True}
    if calendar_id:
        recurring_query["calendar_id"] = calendar_id
    elif calendar_ids:
        ids = [i.strip() for i in calendar_ids.split(",") if i.strip()]
        if ids:
            recurring_query["calendar_id"] = {"$in": ids}

    recurring_events = await db.calendar_events.find(recurring_query, {"_id": 0}).to_list(500)

    # Merge: add recurring events not already in the result set
    seen_ids = {e["id"] for e in events}
    for re in recurring_events:
        if re["id"] not in seen_ids:
            events.append(re)
            seen_ids.add(re["id"])

    # Expand recurring events within the date range
    expanded_events = []
    for event in events:
        if event.get("is_recurring") and range_start and range_end:
            recurrence = event.get("recurrence") or {}
            if not recurrence.get("frequency"):
                # No frequency stored — show on original date only
                expanded_events.append(event)
                continue
            occurrences = generate_recurring_occurrences(event, range_start, range_end)
            if occurrences:
                expanded_events.extend(occurrences)
            else:
                expanded_events.append(event)
        else:
            expanded_events.append(event)

    # ── Include synced events from external apps (e.g. My Client PM) ─────────
    # Match by user_id (new API) OR user_email (legacy webhook) for backwards compat
    sync_query = {
        "$or": [
            {"user_id": current_user["id"]},
            {"user_email": current_user["email"]},
        ]
    }
    if range_start and range_end:
        date_filter = {
            "$or": [
                {"start": {"$gte": range_start, "$lte": range_end}},
                {"end":   {"$gte": range_start, "$lte": range_end}},
            ]
        }
        sync_query = {"$and": [sync_query, date_filter]}
    synced = await db.synced_calendar_events.find(sync_query, {"_id": 0}).to_list(500)
    for s in synced:
        expanded_events.append({
            "id":          s.get("external_id", s.get("id", "")),
            "title":       s.get("title", "Synced Event"),
            "start_time":  s.get("start", s.get("start_time", "")),
            "end_time":    s.get("end", s.get("end_time", "")),
            "color":       s.get("color", "#6366f1"),
            "description": s.get("description", ""),
            "synced_from": s.get("synced_from", "external"),
            "is_synced":   True,
        })

    return expanded_events

def generate_recurring_occurrences(event: dict, range_start: str, range_end: str) -> List[dict]:
    """Generate occurrences of a recurring event within a date range."""
    occurrences = []
    recurrence = event.get("recurrence", {})
    if not recurrence:
        return [event]

    frequency = recurrence.get("frequency") or "weekly"  # never default to daily
    interval = recurrence.get("interval", 1)
    end_type = recurrence.get("end_type", "never")

    def parse_dt(s: str) -> datetime:
        """Parse ISO datetime and strip timezone → naive UTC for uniform comparison."""
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return dt.replace(tzinfo=None) if dt.tzinfo else dt

    try:
        event_start = parse_dt(event["start_time"])
        event_end   = parse_dt(event["end_time"])
        duration    = event_end - event_start
        range_start_dt = parse_dt(range_start)
        range_end_dt   = parse_dt(range_end)
    except Exception:
        return [event]

    current_start = event_start
    occurrence_count = 0
    max_occurrences = 730  # up to 2 years of daily events

    recurrence_end = None
    if end_type == "after" and recurrence.get("end_after_occurrences"):
        max_occurrences = min(int(recurrence["end_after_occurrences"]), max_occurrences)
    elif end_type == "on_date" and recurrence.get("end_date"):
        try:
            recurrence_end = parse_dt(recurrence["end_date"])
        except Exception:
            pass

    while occurrence_count < max_occurrences:
        if recurrence_end and current_start > recurrence_end:
            break
        if current_start > range_end_dt:
            break

        current_end = current_start + duration
        if current_end >= range_start_dt and current_start <= range_end_dt:
            occurrence = event.copy()
            occurrence["start_time"] = current_start.isoformat()
            occurrence["end_time"]   = current_end.isoformat()
            occurrence["occurrence_id"] = f"{event['id']}_{occurrence_count}"
            occurrence["is_occurrence"] = True
            occurrences.append(occurrence)

        # Advance to next occurrence
        if frequency == "daily":
            current_start += timedelta(days=interval)
        elif frequency == "weekly":
            current_start += timedelta(weeks=interval)
        elif frequency == "monthly":
            month = current_start.month + interval
            year  = current_start.year + (month - 1) // 12
            month = ((month - 1) % 12) + 1
            days_in_month = [31, 29 if (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)) else 28,
                             31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
            day = min(current_start.day, days_in_month)
            current_start = current_start.replace(year=year, month=month, day=day)
        elif frequency == "yearly":
            try:
                current_start = current_start.replace(year=current_start.year + interval)
            except ValueError:  # Feb 29 on non-leap year
                current_start = current_start.replace(year=current_start.year + interval, day=28)

        occurrence_count += 1

    return occurrences

@api_router.post("/calendars/events")
async def create_event(event: EventCreate, current_user: dict = Depends(get_current_user)):
    """Create a new event"""
    # Verify calendar exists and belongs to user
    calendar = await db.calendars.find_one({"id": event.calendar_id, "user_id": current_user["id"]})
    if not calendar:
        raise HTTPException(status_code=404, detail="Calendar not found")
    
    event_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "title": event.title,
        "description": event.description,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "all_day": event.all_day,
        "calendar_id": event.calendar_id,
        "category_id": event.category_id,
        "location": event.location,
        "reminder_minutes": event.reminder_minutes,
        "is_recurring": event.is_recurring,
        "recurrence": event.recurrence.model_dump() if event.recurrence else None,
        "attendees": event.attendees,
        "notes": event.notes,
        "priority": event.priority,
        "status": event.status,
        "is_bill": event.is_bill,
        "bill_amount": event.bill_amount,
        "bill_paid": event.bill_paid,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    await db.calendar_events.insert_one(event_doc)
    
    return {k: v for k, v in event_doc.items() if k != "_id"}

@api_router.put("/calendars/events/{event_id}")
async def update_event(event_id: str, event: EventUpdate, current_user: dict = Depends(get_current_user)):
    """Update an event"""
    existing = await db.calendar_events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = {}
    for k, v in event.model_dump().items():
        if v is not None:
            if k == "recurrence" and v:
                update_data[k] = v
            elif k != "recurrence":
                update_data[k] = v
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.calendar_events.update_one(
            {"id": event_id, "user_id": current_user["id"]},
            {"$set": update_data}
        )
    
    updated = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    return updated

@api_router.delete("/calendars/events/{event_id}")
async def delete_event(event_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an event"""
    result = await db.calendar_events.delete_one({"id": event_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {"status": "deleted"}


# ── Accounting ─────────────────────────────────────────────────────────────────

@api_router.get("/accounting/bills")
async def get_bills(current_user: dict = Depends(get_current_user)):
    """Get all calendar events marked as bills, grouped by month with totals."""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    bills = await db.calendar_events.find(
        {"user_id": current_user["id"], "is_bill": True},
        {"_id": 0}
    ).sort("start_time", 1).to_list(1000)

    from collections import defaultdict
    months: dict = defaultdict(list)
    for b in bills:
        try:
            dt = datetime.fromisoformat(b["start_time"].replace("Z", "+00:00"))
            key = dt.strftime("%Y-%m")
            label = dt.strftime("%B %Y")
        except Exception:
            key = "unknown"; label = "Unknown"
        months[key].append({
            "id": b.get("id"), "title": b.get("title", ""),
            "amount": b.get("bill_amount") or 0, "paid": b.get("bill_paid", False),
            "date": b.get("start_time", ""), "month_label": label,
            "is_recurring": b.get("is_recurring", False),
            "recurrence_freq": (b.get("recurrence") or {}).get("frequency", ""),
        })

    result = []
    grand_total = grand_paid = 0.0
    for key in sorted(months.keys()):
        items = months[key]
        mt = sum(i["amount"] for i in items)
        mp = sum(i["amount"] for i in items if i["paid"])
        grand_total += mt; grand_paid += mp
        result.append({"month": key, "label": items[0]["month_label"], "bills": items,
                        "total": round(mt, 2), "paid": round(mp, 2), "unpaid": round(mt - mp, 2)})

    return {"months": result, "grand_total": round(grand_total, 2),
            "grand_paid": round(grand_paid, 2), "grand_unpaid": round(grand_total - grand_paid, 2),
            "bill_count": len(bills)}

@api_router.patch("/accounting/bills/{event_id}/paid")
async def toggle_bill_paid(event_id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    paid = payload.get("paid", False)
    await db.calendar_events.update_one(
        {"id": event_id, "user_id": current_user["id"]}, {"$set": {"bill_paid": paid}})
    return {"status": "updated", "paid": paid}


@api_router.get("/calendars/events/{event_id}")
async def get_event(event_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single event by ID"""
    event = await db.calendar_events.find_one({"id": event_id, "user_id": current_user["id"]}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

# ========================
# HEALTH CHECK
# ========================
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "e1-communicator-api"}

# ========================
# PYTHON SMS GATEWAY (Email-to-SMS)
# ========================
from sms_gateway import send_sms_via_email, get_supported_carriers, lookup_carrier_free, normalize_phone_number as sms_normalize_phone

class PythonSMSSendRequest(BaseModel):
    phone: str
    message: str
    carrier: Optional[str] = None

@api_router.post("/sms/gateway/send")
async def send_sms_python_gateway(request: PythonSMSSendRequest, current_user: dict = Depends(get_current_user)):
    """Send SMS via Python email-to-SMS gateway"""
    
    # Get SMTP config from database
    settings = await db.system_settings.find_one({"type": "textbelt_smtp"}, {"_id": 0})
    
    if not settings:
        raise HTTPException(status_code=400, detail="SMTP not configured. Go to Super Admin > Textbelt Server to configure.")
    
    # Decrypt password if encrypted - check both 'pass' and 'pass_' fields
    smtp_pass = settings.get("pass", "") or settings.get("pass_", "")
    if smtp_pass:
        try:
            smtp_pass = CredentialEncryption.decrypt(smtp_pass)
        except Exception as e:
            logger.warning(f"Password decryption failed (may be plain text): {e}")
            # Keep as-is if decryption fails
    
    result = await send_sms_via_email(
        phone=request.phone,
        message=request.message,
        smtp_host=settings.get("host", "smtp.gmail.com"),
        smtp_port=settings.get("port", 587),
        smtp_user=settings.get("user", ""),
        smtp_pass=smtp_pass,
        smtp_secure=settings.get("secure", False),
        from_email=settings.get("from_email", ""),
        carrier=request.carrier
    )
    
    # Log the SMS
    try:
        await db.messages.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "from": settings.get("from_email", "system"),
            "to": request.phone,
            "body": request.message,
            "direction": "outbound",
            "status": "sent" if result["success"] else "failed",
            "provider": "python_gateway",
            "carrier": result.get("carrier", "unknown"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        logger.error(f"Failed to log SMS: {e}")
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "SMS send failed"))
    
    return result

@api_router.get("/sms/gateway/carriers")
async def get_sms_carriers(current_user: dict = Depends(get_current_user)):
    """Get list of supported SMS carriers"""
    return get_supported_carriers()

@api_router.get("/sms/gateway/lookup/{phone}")
async def lookup_phone_carrier(phone: str, current_user: dict = Depends(get_current_user)):
    """Lookup carrier for a phone number"""
    try:
        normalized = sms_normalize_phone(phone)
        carrier = await lookup_carrier_free(normalized)
        
        if carrier:
            from sms_gateway import CARRIER_NAMES
            return {
                "phone": normalized,
                "carrier_key": carrier,
                "carrier_name": CARRIER_NAMES.get(carrier, carrier)
            }
        else:
            return {
                "phone": normalized,
                "carrier_key": None,
                "carrier_name": "Unknown",
                "message": "Carrier not detected - will try multiple gateways"
            }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/sms/gateway/test")
async def test_python_sms_gateway(current_user: dict = Depends(get_current_user)):
    """Test the Python SMS gateway configuration"""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get SMTP config
    settings = await db.system_settings.find_one({"type": "textbelt_smtp"}, {"_id": 0})
    
    if not settings:
        return {"success": False, "error": "SMTP not configured"}
    
    # Test SMTP connection
    try:
        import aiosmtplib
        
        smtp_pass = settings.get("pass_", "")
        if smtp_pass:
            try:
                smtp_pass = CredentialEncryption.decrypt(smtp_pass)
            except:
                pass
        
        if settings.get("secure", False):
            smtp = aiosmtplib.SMTP(
                hostname=settings.get("host"),
                port=settings.get("port"),
                use_tls=True
            )
        else:
            smtp = aiosmtplib.SMTP(
                hostname=settings.get("host"),
                port=settings.get("port"),
                start_tls=True
            )
        
        await smtp.connect()
        await smtp.login(settings.get("user"), smtp_pass)
        await smtp.quit()
        
        return {"success": True, "message": "SMTP connection successful"}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

# ========================
# PLATFORM SMTP SETTINGS
# ========================
@api_router.get("/admin/smtp")
async def get_smtp_settings(current_user: dict = Depends(get_current_user)):
    """Get platform SMTP settings (admin only)"""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get SMTP config from textbelt_smtp settings (reusing existing storage)
    smtp_settings = await db.system_settings.find_one({"type": "textbelt_smtp"}, {"_id": 0})
    
    if smtp_settings:
        # Decrypt password if encrypted
        smtp_pass = smtp_settings.get("pass_", "")
        if smtp_pass:
            try:
                smtp_pass = CredentialEncryption.decrypt(smtp_pass)
            except:
                pass  # Already decrypted or plain text
        
        return {
            "host": smtp_settings.get("host", ""),
            "port": smtp_settings.get("port", 587),
            "user": smtp_settings.get("user", ""),
            "pass": smtp_pass,
            "secure": smtp_settings.get("secure", False),
            "from_email": smtp_settings.get("from_email", ""),
        }
    
    return {
        "host": "",
        "port": 587,
        "user": "",
        "pass": "",
        "secure": False,
        "from_email": "",
    }

class SmtpSettingsModel(BaseModel):
    host: str = ""
    port: int = 587
    user: str = ""
    pass_: str = Field("", alias="pass")
    secure: bool = False
    from_email: str = ""
    
    class Config:
        populate_by_name = True

@api_router.post("/admin/smtp")
async def save_smtp_settings(settings: SmtpSettingsModel, current_user: dict = Depends(get_current_user)):
    """Save platform SMTP settings (admin only)"""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Encrypt password before storing
    encrypted_pass = CredentialEncryption.encrypt(settings.pass_) if settings.pass_ else ""
    
    smtp_doc = {
        "type": "textbelt_smtp",
        "host": settings.host,
        "port": settings.port,
        "user": settings.user,
        "pass_": encrypted_pass,
        "secure": settings.secure,
        "from_email": settings.from_email,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": current_user["id"]
    }
    
    await db.system_settings.update_one(
        {"type": "textbelt_smtp"},
        {"$set": smtp_doc},
        upsert=True
    )
    
    return {"status": "success", "message": "SMTP settings saved"}

class TestEmailModel(BaseModel):
    email: str

@api_router.post("/admin/smtp/test")
async def test_smtp_settings(data: TestEmailModel, current_user: dict = Depends(get_current_user)):
    """Test SMTP settings by sending a test email (admin only)"""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get SMTP settings
    smtp_settings = await db.system_settings.find_one({"type": "textbelt_smtp"}, {"_id": 0})
    
    if not smtp_settings:
        return {"success": False, "error": "SMTP settings not configured"}
    
    # Decrypt password
    smtp_pass = smtp_settings.get("pass_", "")
    if smtp_pass:
        try:
            smtp_pass = CredentialEncryption.decrypt(smtp_pass)
        except:
            pass
    
    try:
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        # Create test email
        msg = MIMEMultipart()
        msg['Subject'] = 'Test Email from MY Communicator'
        msg['From'] = smtp_settings.get("from_email", smtp_settings.get("user", ""))
        msg['To'] = data.email
        
        body = """
This is a test email from MY Communicator.

If you're receiving this, your SMTP settings are configured correctly!

Platform Settings:
- Host: {host}
- Port: {port}
- From: {from_email}

Time: {time}
        """.format(
            host=smtp_settings.get("host", ""),
            port=smtp_settings.get("port", 587),
            from_email=smtp_settings.get("from_email", ""),
            time=datetime.now(timezone.utc).isoformat()
        )
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        smtp_port = smtp_settings.get("port", 587)
        smtp_secure = smtp_settings.get("secure", False)
        
        # Port 465 always uses direct SSL/TLS
        # Port 587 with TLS enabled uses STARTTLS
        # Port 587 without TLS uses no encryption (not recommended)
        if smtp_port == 465:
            # Direct SSL/TLS for port 465
            await aiosmtplib.send(
                msg,
                hostname=smtp_settings.get("host", ""),
                port=smtp_port,
                username=smtp_settings.get("user", ""),
                password=smtp_pass,
                use_tls=True,
            )
        elif smtp_secure:
            # STARTTLS for port 587 (or other ports) with TLS enabled
            await aiosmtplib.send(
                msg,
                hostname=smtp_settings.get("host", ""),
                port=smtp_port,
                username=smtp_settings.get("user", ""),
                password=smtp_pass,
                start_tls=True,
            )
        else:
            # No encryption (not recommended)
            await aiosmtplib.send(
                msg,
                hostname=smtp_settings.get("host", ""),
                port=smtp_port,
                username=smtp_settings.get("user", ""),
                password=smtp_pass,
            )
        
        logger.info(f"Test email sent to {data.email}")
        return {"success": True, "message": "Test email sent successfully"}
        
