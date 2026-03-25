# ── A2G Booking Backend Routes ──────────────────────────────────────────────
# FastAPI + Motor (async MongoDB) + Pydantic v2

async def send_booking_email(to_email: str, subject: str, body: str, html_body: str = None):
    """Send email using configured SMTP settings"""
    import aiosmtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    settings = await db.system_settings.find_one({"type": "textbelt_smtp"}, {"_id": 0})
    if not settings:
        logger.warning("SMTP not configured for email notifications")
        return {"success": False, "error": "SMTP not configured"}
    
    smtp_pass = settings.get("pass", "") or settings.get("pass_", "")
    if smtp_pass:
        try:
            smtp_pass = CredentialEncryption.decrypt(smtp_pass)
        except:
            pass
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.get("from_email", settings.get("user", ""))
        msg["To"] = to_email
        
        msg.attach(MIMEText(body, "plain"))
        if html_body:
            msg.attach(MIMEText(html_body, "html"))
        
        await aiosmtplib.send(
            msg,
            hostname=settings.get("host", "smtp.gmail.com"),
            port=settings.get("port", 587),
            username=settings.get("user", ""),
            password=smtp_pass,
            start_tls=True
        )
        return {"success": True}
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return {"success": False, "error": str(e)}

# SMS sending helper using active provider
async def send_booking_sms(phone: str, message: str, user_id: str = None):
    """Send SMS using the active provider"""
    sms_settings = await db.system_settings.find_one({"type": "sms_provider"}, {"_id": 0})
    active_provider = sms_settings.get("active_provider", "python_gateway") if sms_settings else "python_gateway"
    
    if active_provider == "python_gateway":
        settings = await db.system_settings.find_one({"type": "textbelt_smtp"}, {"_id": 0})
        if not settings:
            return {"success": False, "error": "SMS gateway not configured"}
        
        smtp_pass = settings.get("pass", "") or settings.get("pass_", "")
        if smtp_pass:
            try:
                smtp_pass = CredentialEncryption.decrypt(smtp_pass)
            except:
                pass
        
        result = await send_sms_via_email(
            phone=phone,
            message=message,
            smtp_host=settings.get("host", "smtp.gmail.com"),
            smtp_port=settings.get("port", 587),
            smtp_user=settings.get("user", ""),
            smtp_pass=smtp_pass,
            smtp_secure=settings.get("secure", False),
            from_email=settings.get("from_email", ""),
            carrier=None
        )
        return result
    else:
        # Use other providers via the main send_message logic
        # For simplicity, we'll use python gateway as default
        return {"success": False, "error": f"Provider {active_provider} not supported for booking SMS"}

# Booking Models
class AvailabilitySlot(BaseModel):
    day: int  # 0=Sunday, 1=Monday, etc.
    start_time: str  # "09:00"
    end_time: str  # "17:00"
    enabled: bool = True

class BookingSettings(BaseModel):
    enabled: bool = True
    availability: List[AvailabilitySlot] = []
    meeting_lengths: List[int] = [15, 30, 45, 60]  # minutes
    default_length: int = 30
    buffer_minutes: int = 15
    advance_days: int = 30  # How far in advance can book
    timezone: str = "America/New_York"
    video_meet_enabled: bool = True
    video_meet_base_url: str = "https://meet.saysme.org"

class BookingRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    date: str  # "2026-02-15"
    time: str  # "09:00"
    duration: int = 30  # minutes
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
    invitees: List[dict] = []  # [{"type": "email/sms/contact", "value": "..."}]

# Get user's booking settings
@api_router.get("/booking/settings")
async def get_booking_settings(current_user: dict = Depends(get_current_user)):
    """Get user's booking availability settings"""
    settings = await db.booking_settings.find_one({"user_id": current_user["id"]}, {"_id": 0})
    
    if not settings:
        # Return default settings
        default_availability = [
            {"day": 1, "start_time": "09:00", "end_time": "17:00", "enabled": True},
            {"day": 2, "start_time": "09:00", "end_time": "17:00", "enabled": True},
            {"day": 3, "start_time": "09:00", "end_time": "17:00", "enabled": True},
            {"day": 4, "start_time": "09:00", "end_time": "17:00", "enabled": True},
            {"day": 5, "start_time": "09:00", "end_time": "17:00", "enabled": True},
            {"day": 6, "start_time": "10:00", "end_time": "14:00", "enabled": False},
            {"day": 0, "start_time": "10:00", "end_time": "14:00", "enabled": False},
        ]
        return {
            "enabled": True,
            "availability": default_availability,
            "meeting_lengths": [15, 30, 45, 60],
            "default_length": 30,
            "buffer_minutes": 15,
            "advance_days": 30,
            "timezone": "America/New_York",
            "video_meet_enabled": True,
            "video_meet_base_url": "https://meet.saysme.org"
        }
    
    return settings

# Save booking settings
@api_router.post("/booking/settings")
async def save_booking_settings(settings: BookingSettings, current_user: dict = Depends(get_current_user)):
    """Save user's booking availability settings"""
    settings_doc = {
        "user_id": current_user["id"],
        "enabled": settings.enabled,
        "availability": [s.model_dump() for s in settings.availability],
        "meeting_lengths": settings.meeting_lengths,
        "default_length": settings.default_length,
        "buffer_minutes": settings.buffer_minutes,
        "advance_days": settings.advance_days,
        "timezone": settings.timezone,
        "video_meet_enabled": settings.video_meet_enabled,
        "video_meet_base_url": settings.video_meet_base_url,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.booking_settings.update_one(
        {"user_id": current_user["id"]},
        {"$set": settings_doc},
        upsert=True
    )
    
    return {"status": "success", "message": "Booking settings saved"}

# Get shareable booking link
@api_router.get("/booking/link")
async def get_booking_link(current_user: dict = Depends(get_current_user)):
    """Get the shareable booking link for this user"""
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    # Generate booking slug from user's name (firstname-lastname format)
    user_name = user.get("name", user.get("email", "user"))
    # Clean and format: "Mel Admin" -> "mel-admin", "John Smith Jr." -> "john-smith-jr"
    import re
    booking_slug = re.sub(r'[^a-z0-9]+', '-', user_name.lower()).strip('-')
    
    # Check if slug already exists for another user
    existing = await db.booking_settings.find_one({
        "booking_slug": booking_slug, 
        "user_id": {"$ne": current_user["id"]}
    })
    if existing:
        # Append a short unique suffix if name collision
        booking_slug = f"{booking_slug}-{current_user['id'][:4]}"
    
    # Update or create booking slug
    settings = await db.booking_settings.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not settings or not settings.get("booking_slug") or settings.get("booking_slug") != booking_slug:
        await db.booking_settings.update_one(
            {"user_id": current_user["id"]},
            {"$set": {"booking_slug": booking_slug}},
            upsert=True
        )
    
    # Use production domain for booking links
    frontend_url = "https://my.a2goffice.com"
    
    booking_url = f"{frontend_url}/book/{booking_slug}"
    
    return {
        "booking_slug": booking_slug,
        "booking_url": booking_url,
        "user_name": user.get("name", user.get("email", ""))
    }

# Public endpoint - Get available slots (NO AUTH)
@api_router.get("/booking/public/{booking_slug}")
async def get_public_booking_info(booking_slug: str):
    """Public endpoint to get user's booking availability (no auth required)"""
    # Find user by booking slug
    settings = await db.booking_settings.find_one({"booking_slug": booking_slug}, {"_id": 0})
    if not settings:
        raise HTTPException(status_code=404, detail="Booking page not found")
    
    if not settings.get("enabled", True):
        raise HTTPException(status_code=400, detail="Booking is currently disabled")
    
    # Get user info
    user = await db.users.find_one({"id": settings["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_name": user.get("name", user.get("email", "")),
        "user_email": user.get("email", ""),
        "availability": settings.get("availability", []),
        "meeting_lengths": settings.get("meeting_lengths", [15, 30, 45, 60]),
        "default_length": settings.get("default_length", 30),
        "buffer_minutes": settings.get("buffer_minutes", 15),
        "advance_days": settings.get("advance_days", 30),
        "timezone": settings.get("timezone", "America/New_York"),
        "video_meet_enabled": settings.get("video_meet_enabled", True)
    }

# Public endpoint - Get available time slots for a specific date (NO AUTH)
@api_router.get("/booking/public/{booking_slug}/slots/{date}")
async def get_available_slots(booking_slug: str, date: str):
    """Get available time slots for a specific date"""
    settings = await db.booking_settings.find_one({"booking_slug": booking_slug}, {"_id": 0})
    if not settings:
        raise HTTPException(status_code=404, detail="Booking page not found")
    
    # Parse the date
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    day_of_week = target_date.weekday()
    # Convert Python weekday (0=Mon) to our format (0=Sun)
    day_of_week = (day_of_week + 1) % 7
    
    # Find availability for this day
    day_availability = None
    for slot in settings.get("availability", []):
        if slot["day"] == day_of_week and slot.get("enabled", True):
            day_availability = slot
            break
    
    if not day_availability:
        return {"date": date, "slots": [], "message": "Not available on this day"}
    
    # Generate time slots
    start_time = datetime.strptime(day_availability["start_time"], "%H:%M")
    end_time = datetime.strptime(day_availability["end_time"], "%H:%M")
    buffer = settings.get("buffer_minutes", 15)
    default_length = settings.get("default_length", 30)
    
    # Get existing bookings for this date
    existing_bookings = await db.bookings.find({
        "host_user_id": settings["user_id"],
        "date": date,
        "status": {"$ne": "cancelled"}
    }, {"_id": 0}).to_list(100)
    
    # Build list of busy times
    busy_times = []
    for booking in existing_bookings:
        booking_start = datetime.strptime(booking["time"], "%H:%M")
        booking_end = booking_start + timedelta(minutes=booking["duration"] + buffer)
        busy_times.append((booking_start.time(), booking_end.time()))
    
    # Generate available slots
    slots = []
    current_time = start_time
    while current_time + timedelta(minutes=default_length) <= end_time:
        slot_start = current_time.time()
        slot_end = (current_time + timedelta(minutes=default_length)).time()
        
        # Check if slot conflicts with existing bookings
        is_available = True
        for busy_start, busy_end in busy_times:
            if not (slot_end <= busy_start or slot_start >= busy_end):
                is_available = False
                break
        
        if is_available:
            slots.append({
                "time": current_time.strftime("%H:%M"),
                "display": current_time.strftime("%I:%M %p")
            })
        
        current_time += timedelta(minutes=default_length + buffer)
    
    return {"date": date, "slots": slots}

# Public endpoint - Book a meeting (NO AUTH)
@api_router.post("/booking/public/{booking_slug}")
async def create_public_booking(booking_slug: str, request: BookingRequest):
    """Public endpoint to book a meeting"""
    settings = await db.booking_settings.find_one({"booking_slug": booking_slug}, {"_id": 0})
    if not settings:
        raise HTTPException(status_code=404, detail="Booking page not found")
    
    if not settings.get("enabled", True):
        raise HTTPException(status_code=400, detail="Booking is currently disabled")
    
    # Get host user
    host_user = await db.users.find_one({"id": settings["user_id"]}, {"_id": 0, "password_hash": 0})
    if not host_user:
        raise HTTPException(status_code=404, detail="Host not found")
    
    # Generate video meeting link
    video_link = None
    if settings.get("video_meet_enabled", True):
        base_url = settings.get("video_meet_base_url", "https://meet.saysme.org")
        username = host_user.get("name", host_user.get("email", "user")).lower().replace(" ", "-")
        
        if request.custom_room_name:
            room_name = request.custom_room_name.lower().replace(" ", "-")
        else:
            # Generate room name: {username}-{meeting-title or timestamp}
            room_name = f"{username}-meeting-{int(datetime.now().timestamp())}"
        
        video_link = f"{base_url}/{room_name}"
    
    # Create booking
    booking_id = str(uuid.uuid4())
    booking_doc = {
        "id": booking_id,
        "host_user_id": settings["user_id"],
        "guest_name": request.name,
        "guest_email": request.email,
        "guest_phone": request.phone,
        "date": request.date,
        "time": request.time,
        "duration": request.duration,
        "notes": request.notes,
        "video_link": video_link,
        "status": "confirmed",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bookings.insert_one(booking_doc)
    
    # Create notification for host about new booking
    try:
        await create_notification(
            user_id=settings["user_id"],
            notification_type="booking_new",
            title="New Meeting Booked",
            message=f"{request.name} booked a meeting for {request.date} at {request.time}",
            metadata={
                "booking_id": booking_id,
                "guest_name": request.name,
                "guest_email": request.email,
                "date": request.date,
                "time": request.time,
                "duration": request.duration,
                "video_link": video_link
            },
            action_url="/booking"
        )
    except Exception as e:
        logger.error(f"Failed to create booking notification: {e}")
    
    # Create calendar event for host
    try:
        # Find default calendar
        default_calendar = await db.calendars.find_one(
            {"user_id": settings["user_id"], "is_default": True},
            {"_id": 0}
        )
        if not default_calendar:
            default_calendar = await db.calendars.find_one(
                {"user_id": settings["user_id"]},
                {"_id": 0}
            )
        
        if default_calendar:
            event_start = datetime.strptime(f"{request.date} {request.time}", "%Y-%m-%d %H:%M")
            event_end = event_start + timedelta(minutes=request.duration)
            
            event_doc = {
                "id": str(uuid.uuid4()),
                "user_id": settings["user_id"],
                "calendar_id": default_calendar["id"],
                "title": f"Meeting with {request.name}",
                "description": f"Booking from: {request.email}\n{request.notes or ''}\n\nVideo: {video_link or 'N/A'}",
                "start_time": event_start.isoformat(),
                "end_time": event_end.isoformat(),
                "all_day": False,
                "location": video_link or "",
                "category_id": None,
                "is_recurring": False,
                "recurrence": None,
                "reminder_minutes": 15,
                "priority": "normal",
                "notes": f"Guest: {request.name} ({request.email})",
                "booking_id": booking_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.calendar_events.insert_one(event_doc)
    except Exception as e:
        logger.error(f"Failed to create calendar event: {e}")
    
    # Send confirmation emails
    try:
        # Email to guest
