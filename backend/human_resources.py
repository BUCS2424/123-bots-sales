"""
Human Resources Module
Comprehensive HR management including employees, time tracking, scheduling, payroll, and job applications
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, date, timedelta
from bson import ObjectId
import uuid
import math
import csv
import io

router = APIRouter(prefix="/hr", tags=["Human Resources"])

# MongoDB will be injected from server.py
db = None

def init_db(database):
    global db
    db = database

# ============ PYDANTIC MODELS ============

class EmergencyContact(BaseModel):
    name: str
    relationship: str
    phone: str
    email: Optional[str] = None

class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    date_of_birth: Optional[str] = None
    ssn_last_four: Optional[str] = None  # Only store last 4 digits
    department: str = "General"
    position: str = ""
    hire_date: Optional[str] = None
    hourly_rate: float = 0.0
    employment_type: str = "full_time"  # full_time, part_time, contractor
    status: str = "active"  # active, on_leave, terminated
    emergency_contact: Optional[EmergencyContact] = None
    notes: Optional[str] = None
    profile_image: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    date_of_birth: Optional[str] = None
    ssn_last_four: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    hire_date: Optional[str] = None
    hourly_rate: Optional[float] = None
    employment_type: Optional[str] = None
    status: Optional[str] = None
    emergency_contact: Optional[EmergencyContact] = None
    notes: Optional[str] = None
    profile_image: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: str
    created_at: str
    updated_at: Optional[str] = None
    total_hours_this_period: Optional[float] = None

# Time Entry Models
class TimeEntryCreate(BaseModel):
    employee_id: str
    entry_type: str  # clock_in, clock_out
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None

class TimeEntryResponse(BaseModel):
    id: str
    employee_id: str
    entry_type: str
    timestamp: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_verified: bool = False
    notes: Optional[str] = None

class TimeCardEntry(BaseModel):
    date: str
    clock_in: Optional[str] = None
    clock_out: Optional[str] = None
    hours_worked: float = 0.0
    overtime_hours: float = 0.0
    status: str = "complete"  # complete, incomplete, missing

# Schedule Models
class ShiftCreate(BaseModel):
    employee_id: str
    date: str
    start_time: str
    end_time: str
    department: Optional[str] = None
    notes: Optional[str] = None

class ShiftUpdate(BaseModel):
    employee_id: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    department: Optional[str] = None
    notes: Optional[str] = None

class ShiftResponse(BaseModel):
    id: str
    employee_id: str
    employee_name: Optional[str] = None
    date: str
    start_time: str
    end_time: str
    department: Optional[str] = None
    notes: Optional[str] = None
    created_at: str

# Time Off Request Models
class TimeOffRequestCreate(BaseModel):
    employee_id: str
    start_date: str
    end_date: str
    request_type: str  # vacation, sick, personal, bereavement, other
    notes: Optional[str] = None

class TimeOffRequestResponse(BaseModel):
    id: str
    employee_id: str
    employee_name: Optional[str] = None
    start_date: str
    end_date: str
    request_type: str
    status: str  # pending, approved, denied
    notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    created_at: str

# Payroll Models
class PayPeriodCreate(BaseModel):
    start_date: str
    end_date: str
    pay_date: str
    status: str = "open"  # open, closed, paid

class PayrollEntry(BaseModel):
    employee_id: str
    employee_name: str
    regular_hours: float
    overtime_hours: float
    hourly_rate: float
    regular_pay: float
    overtime_pay: float
    gross_pay: float
    deductions: float = 0.0
    net_pay: float

class PayrollSummary(BaseModel):
    pay_period_id: str
    start_date: str
    end_date: str
    pay_date: str
    status: str
    total_employees: int
    total_regular_hours: float
    total_overtime_hours: float
    total_gross_pay: float
    total_deductions: float
    total_net_pay: float
    entries: List[PayrollEntry]

# Document Models
class DocumentCreate(BaseModel):
    employee_id: str
    document_type: str  # w4, i9, contract, certification, license, other
    title: str
    file_url: str
    expiration_date: Optional[str] = None
    notes: Optional[str] = None

class DocumentResponse(BaseModel):
    id: str
    employee_id: str
    document_type: str
    title: str
    file_url: str
    expiration_date: Optional[str] = None
    notes: Optional[str] = None
    uploaded_at: str
    uploaded_by: Optional[str] = None

# Job Application Models
class JobApplicationCreate(BaseModel):
    # Personal Information
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    address: str
    city: str
    state: str
    zip_code: str
    date_of_birth: Optional[str] = None
    
    # Position Applied For
    applying_for_pawn: bool = False
    applying_for_storage: bool = False
    applying_for_rv: bool = False
    desired_position: Optional[str] = None
    desired_pay: Optional[str] = None
    available_start_date: Optional[str] = None
    
    # Availability
    available_monday: bool = True
    available_tuesday: bool = True
    available_wednesday: bool = True
    available_thursday: bool = True
    available_friday: bool = True
    available_saturday: bool = False
    available_sunday: bool = False
    
    # Employment History
    employment_history: Optional[List[Dict[str, Any]]] = None
    
    # Education
    highest_education: Optional[str] = None
    school_name: Optional[str] = None
    graduation_year: Optional[str] = None
    
    # Additional Questions
    felony_conviction: bool = False
    felony_explanation: Optional[str] = None
    authorized_to_work: bool = True
    can_lift_50_lbs: bool = True
    valid_drivers_license: bool = False
    
    # References
    references: Optional[List[Dict[str, Any]]] = None
    
    # Additional Info
    how_heard_about_us: Optional[str] = None
    additional_info: Optional[str] = None
    signature: Optional[str] = None
    signature_date: Optional[str] = None

class JobApplicationResponse(JobApplicationCreate):
    id: str
    status: str  # new, reviewing, interviewed, hired, rejected
    submitted_at: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    notes: Optional[str] = None

# HR Settings Models
class HRSettingsUpdate(BaseModel):
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    business_city: Optional[str] = None
    business_state: Optional[str] = None
    business_zip: Optional[str] = None
    business_latitude: Optional[float] = None
    business_longitude: Optional[float] = None
    geo_fence_radius_meters: Optional[int] = None  # Default 100 meters
    pay_period_type: Optional[str] = None  # weekly, bi_weekly, semi_monthly, monthly
    overtime_threshold_daily: Optional[float] = None  # Hours before overtime (8)
    overtime_threshold_weekly: Optional[float] = None  # Hours before overtime (40)
    overtime_rate_multiplier: Optional[float] = None  # 1.5x
    departments: Optional[List[str]] = None
    positions: Optional[List[str]] = None
    application_email: Optional[str] = None


# ============ HELPER FUNCTIONS ============

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in meters using Haversine formula"""
    R = 6371000  # Earth's radius in meters
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

async def get_hr_settings():
    """Get HR settings from database"""
    settings = await db.admin_settings.find_one({"type": "hr_settings"})
    if not settings:
        # Return defaults
        return {
            "business_name": "123Bots",
            "business_address": "7860 Eddins Road",
            "business_city": "Dothan",
            "business_state": "AL",
            "business_zip": "36301",
            "business_latitude": 31.1845,  # Approximate coordinates for 7860 Eddins Rd, Dothan, AL
            "business_longitude": -85.4280,
            "geo_fence_radius_meters": 150,
            "pay_period_type": "bi_weekly",
            "overtime_threshold_daily": 8,
            "overtime_threshold_weekly": 40,
            "overtime_rate_multiplier": 1.5,
            "departments": ["Management", "Products", "Storage", "RV Restoration", "General"],
            "positions": ["Owner", "Manager", "Assistant Manager", "Sales Associate", "Technician", "Cashier"],
            "application_email": "hr@alabamapawnstorage.com"
        }
    return {k: v for k, v in settings.items() if k != "_id" and k != "type"}

def verify_location(emp_lat: float, emp_lon: float, biz_lat: float, biz_lon: float, radius: int) -> bool:
    """Verify employee is within geo-fence radius of business"""
    distance = calculate_distance(emp_lat, emp_lon, biz_lat, biz_lon)
    return distance <= radius


# ============ EMPLOYEE ENDPOINTS ============

@router.get("/employees", response_model=List[EmployeeResponse])
async def get_employees(
    status: Optional[str] = None,
    department: Optional[str] = None
):
    """Get all employees with optional filters"""
    query = {}
    if status:
        query["status"] = status
    if department:
        query["department"] = department
    
    employees = await db.hr_employees.find(query).to_list(1000)
    return [
        EmployeeResponse(
            id=str(emp.get("id", emp.get("_id"))),
            **{k: v for k, v in emp.items() if k not in ["_id", "id"]}
        )
        for emp in employees
    ]

CSV_FIELDS = [
    "first_name", "last_name", "email", "phone", "address", "city", "state",
    "zip_code", "date_of_birth", "department", "position", "hire_date",
    "hourly_rate", "employment_type", "status",
    "emergency_contact_name", "emergency_contact_phone", "emergency_contact_relationship"
]

@router.get("/employees/export/csv")
async def export_employees_csv(status: Optional[str] = None, department: Optional[str] = None):
    """Export employees as CSV"""
    query = {}
    if status:
        query["status"] = status
    if department:
        query["department"] = department

    employees = await db.hr_employees.find(query).to_list(1000)

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=CSV_FIELDS)
    writer.writeheader()

    for emp in employees:
        ec = emp.get("emergency_contact") or {}
        row = {f: emp.get(f, "") for f in CSV_FIELDS if not f.startswith("emergency_contact_")}
        row["emergency_contact_name"] = ec.get("name", "")
        row["emergency_contact_phone"] = ec.get("phone", "")
        row["emergency_contact_relationship"] = ec.get("relationship", "")
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=employees_{date.today().isoformat()}.csv"}
    )


@router.post("/employees/import/csv")
async def import_employees_csv(file: UploadFile = File(...)):
    """Import employees from CSV"""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = await file.read()
    decoded = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded))

    created = 0
    skipped = 0
    errors = []

    for i, row in enumerate(reader, start=2):
        first_name = row.get("first_name", "").strip()
        last_name = row.get("last_name", "").strip()
        email = row.get("email", "").strip()

        if not first_name or not last_name or not email:
            errors.append(f"Row {i}: Missing required fields (first_name, last_name, email)")
            skipped += 1
            continue

        existing = await db.hr_employees.find_one({"email": email})
        if existing:
            errors.append(f"Row {i}: Email {email} already exists")
            skipped += 1
            continue

        ec_name = row.get("emergency_contact_name", "").strip()
        emergency_contact = None
        if ec_name:
            emergency_contact = {
                "name": ec_name,
                "phone": row.get("emergency_contact_phone", "").strip(),
                "relationship": row.get("emergency_contact_relationship", "").strip()
            }

        hourly_rate = 0.0
        try:
            hourly_rate = float(row.get("hourly_rate", 0))
        except (ValueError, TypeError):
            pass

        emp = {
            "id": str(uuid.uuid4()),
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "phone": row.get("phone", "").strip() or None,
            "address": row.get("address", "").strip() or None,
            "city": row.get("city", "").strip() or None,
            "state": row.get("state", "").strip() or None,
            "zip_code": row.get("zip_code", "").strip() or None,
            "date_of_birth": row.get("date_of_birth", "").strip() or None,
            "department": row.get("department", "").strip() or "General",
            "position": row.get("position", "").strip() or "",
            "hire_date": row.get("hire_date", "").strip() or date.today().isoformat(),
            "hourly_rate": hourly_rate,
            "employment_type": row.get("employment_type", "").strip() or "full_time",
            "status": row.get("status", "").strip() or "active",
            "emergency_contact": emergency_contact,
            "notes": None,
            "profile_image": None,
            "ssn_last_four": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.hr_employees.insert_one(emp)
        created += 1

    return {"created": created, "skipped": skipped, "errors": errors}


@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: str):
    """Get single employee by ID"""
    employee = await db.hr_employees.find_one({"id": employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return EmployeeResponse(
        id=str(employee.get("id")),
        **{k: v for k, v in employee.items() if k not in ["_id", "id"]}
    )

@router.post("/employees", response_model=EmployeeResponse)
async def create_employee(employee: EmployeeCreate):
    """Create new employee"""
    employee_dict = employee.model_dump()
    employee_dict["id"] = str(uuid.uuid4())
    employee_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    if not employee_dict.get("hire_date"):
        employee_dict["hire_date"] = date.today().isoformat()
    
    await db.hr_employees.insert_one(employee_dict)
    
    return EmployeeResponse(**employee_dict)

@router.put("/employees/{employee_id}", response_model=EmployeeResponse)
async def update_employee(employee_id: str, updates: EmployeeUpdate):
    """Update employee"""
    employee = await db.hr_employees.find_one({"id": employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.hr_employees.update_one({"id": employee_id}, {"$set": update_data})
    
    updated = await db.hr_employees.find_one({"id": employee_id})
    return EmployeeResponse(
        id=str(updated.get("id")),
        **{k: v for k, v in updated.items() if k not in ["_id", "id"]}
    )

@router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str):
    """Delete employee (soft delete - sets status to terminated)"""
    result = await db.hr_employees.update_one(
        {"id": employee_id},
        {"$set": {"status": "terminated", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee terminated successfully"}


# ============ TIME TRACKING ENDPOINTS ============

@router.post("/time/clock", response_model=TimeEntryResponse)
async def clock_in_out(entry: TimeEntryCreate):
    """Clock in or out - validates geolocation"""
    # Verify employee exists
    employee = await db.hr_employees.find_one({"id": entry.employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get HR settings for geo-fence
    settings = await get_hr_settings()
    
    location_verified = False
    if entry.latitude and entry.longitude:
        location_verified = verify_location(
            entry.latitude,
            entry.longitude,
            settings["business_latitude"],
            settings["business_longitude"],
            settings["geo_fence_radius_meters"]
        )
        
        if not location_verified:
            raise HTTPException(
                status_code=400,
                detail=f"You must be at the business location to clock {entry.entry_type.replace('clock_', '')}. "
                       f"Please ensure you are within {settings['geo_fence_radius_meters']} meters of the business."
            )
    
    time_entry = {
        "id": str(uuid.uuid4()),
        "employee_id": entry.employee_id,
        "entry_type": entry.entry_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "latitude": entry.latitude,
        "longitude": entry.longitude,
        "location_verified": location_verified,
        "notes": entry.notes
    }
    
    await db.hr_time_entries.insert_one(time_entry)
    
    return TimeEntryResponse(**time_entry)

@router.get("/time/status/{employee_id}")
async def get_clock_status(employee_id: str):
    """Get current clock status for employee"""
    # Get the most recent time entry for this employee today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    entries = await db.hr_time_entries.find({
        "employee_id": employee_id,
        "timestamp": {"$gte": today_start.isoformat()}
    }).sort("timestamp", -1).to_list(100)
    
    if not entries:
        return {"clocked_in": False, "last_entry": None}
    
    last_entry = entries[0]
    clocked_in = last_entry["entry_type"] == "clock_in"
    
    return {
        "clocked_in": clocked_in,
        "last_entry": TimeEntryResponse(**last_entry)
    }

@router.get("/time/entries/{employee_id}")
async def get_time_entries(
    employee_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get time entries for employee within date range"""
    query = {"employee_id": employee_id}
    
    if start_date:
        query["timestamp"] = {"$gte": start_date}
    if end_date:
        if "timestamp" in query:
            query["timestamp"]["$lte"] = end_date + "T23:59:59Z"
        else:
            query["timestamp"] = {"$lte": end_date + "T23:59:59Z"}
    
    entries = await db.hr_time_entries.find(query).sort("timestamp", 1).to_list(1000)
    return [TimeEntryResponse(**e) for e in entries]

@router.get("/time/timecard/{employee_id}")
async def get_timecard(
    employee_id: str,
    start_date: str,
    end_date: str
):
    """Get timecard summary for employee"""
    entries = await db.hr_time_entries.find({
        "employee_id": employee_id,
        "timestamp": {"$gte": start_date, "$lte": end_date + "T23:59:59Z"}
    }).sort("timestamp", 1).to_list(1000)
    
    settings = await get_hr_settings()
    
    # Group entries by date and calculate hours
    timecard = {}
    for entry in entries:
        entry_date = entry["timestamp"][:10]
        if entry_date not in timecard:
            timecard[entry_date] = {"clock_in": None, "clock_out": None, "entries": []}
        
        timecard[entry_date]["entries"].append(entry)
        
        if entry["entry_type"] == "clock_in" and not timecard[entry_date]["clock_in"]:
            timecard[entry_date]["clock_in"] = entry["timestamp"]
        elif entry["entry_type"] == "clock_out":
            timecard[entry_date]["clock_out"] = entry["timestamp"]
    
    # Calculate hours for each day
    result = []
    total_regular = 0
    total_overtime = 0
    
    for date_str, data in sorted(timecard.items()):
        hours_worked = 0
        if data["clock_in"] and data["clock_out"]:
            clock_in = datetime.fromisoformat(data["clock_in"].replace("Z", "+00:00"))
            clock_out = datetime.fromisoformat(data["clock_out"].replace("Z", "+00:00"))
            hours_worked = (clock_out - clock_in).total_seconds() / 3600
        
        # Calculate overtime (daily)
        regular_hours = min(hours_worked, settings["overtime_threshold_daily"])
        overtime_hours = max(0, hours_worked - settings["overtime_threshold_daily"])
        
        total_regular += regular_hours
        total_overtime += overtime_hours
        
        result.append(TimeCardEntry(
            date=date_str,
            clock_in=data["clock_in"],
            clock_out=data["clock_out"],
            hours_worked=round(hours_worked, 2),
            overtime_hours=round(overtime_hours, 2),
            status="complete" if data["clock_in"] and data["clock_out"] else "incomplete"
        ))
    
    return {
        "entries": result,
        "total_regular_hours": round(total_regular, 2),
        "total_overtime_hours": round(total_overtime, 2),
        "total_hours": round(total_regular + total_overtime, 2)
    }


# ============ SCHEDULE ENDPOINTS ============

@router.get("/schedules")
async def get_schedules(
    start_date: str,
    end_date: str,
    employee_id: Optional[str] = None,
    department: Optional[str] = None
):
    """Get schedules for date range"""
    query = {
        "date": {"$gte": start_date, "$lte": end_date}
    }
    if employee_id:
        query["employee_id"] = employee_id
    if department:
        query["department"] = department
    
    schedules = await db.hr_schedules.find(query).sort("date", 1).to_list(1000)
    
    # Enrich with employee names
    result = []
    for schedule in schedules:
        employee = await db.hr_employees.find_one({"id": schedule["employee_id"]})
        employee_name = f"{employee['first_name']} {employee['last_name']}" if employee else "Unknown"
        result.append(ShiftResponse(
            id=str(schedule.get("id")),
            employee_name=employee_name,
            **{k: v for k, v in schedule.items() if k not in ["_id", "id"]}
        ))
    
    return result

@router.post("/schedules", response_model=ShiftResponse)
async def create_schedule(shift: ShiftCreate):
    """Create a schedule/shift"""
    shift_dict = shift.model_dump()
    shift_dict["id"] = str(uuid.uuid4())
    shift_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.hr_schedules.insert_one(shift_dict)
    
    employee = await db.hr_employees.find_one({"id": shift.employee_id})
    employee_name = f"{employee['first_name']} {employee['last_name']}" if employee else "Unknown"
    
    return ShiftResponse(employee_name=employee_name, **shift_dict)

@router.put("/schedules/{shift_id}", response_model=ShiftResponse)
async def update_schedule(shift_id: str, updates: ShiftUpdate):
    """Update a schedule/shift"""
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    
    result = await db.hr_schedules.update_one({"id": shift_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    shift = await db.hr_schedules.find_one({"id": shift_id})
    employee = await db.hr_employees.find_one({"id": shift["employee_id"]})
    employee_name = f"{employee['first_name']} {employee['last_name']}" if employee else "Unknown"
    
    return ShiftResponse(
        id=str(shift.get("id")),
        employee_name=employee_name,
        **{k: v for k, v in shift.items() if k not in ["_id", "id"]}
    )

@router.delete("/schedules/{shift_id}")
async def delete_schedule(shift_id: str):
    """Delete a schedule/shift"""
    result = await db.hr_schedules.delete_one({"id": shift_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found")
    return {"message": "Shift deleted successfully"}


# ============ TIME OFF REQUEST ENDPOINTS ============

@router.get("/time-off")
async def get_time_off_requests(
    status: Optional[str] = None,
    employee_id: Optional[str] = None
):
    """Get time off requests"""
    query = {}
    if status:
        query["status"] = status
    if employee_id:
        query["employee_id"] = employee_id
    
    requests = await db.hr_time_off.find(query).sort("created_at", -1).to_list(1000)
    
    result = []
    for req in requests:
        employee = await db.hr_employees.find_one({"id": req["employee_id"]})
        employee_name = f"{employee['first_name']} {employee['last_name']}" if employee else "Unknown"
        result.append(TimeOffRequestResponse(
            id=str(req.get("id")),
            employee_name=employee_name,
            **{k: v for k, v in req.items() if k not in ["_id", "id"]}
        ))
    
    return result

@router.post("/time-off", response_model=TimeOffRequestResponse)
async def create_time_off_request(request: TimeOffRequestCreate):
    """Submit time off request"""
    req_dict = request.model_dump()
    req_dict["id"] = str(uuid.uuid4())
    req_dict["status"] = "pending"
    req_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.hr_time_off.insert_one(req_dict)
    
    employee = await db.hr_employees.find_one({"id": request.employee_id})
    employee_name = f"{employee['first_name']} {employee['last_name']}" if employee else "Unknown"
    
    return TimeOffRequestResponse(employee_name=employee_name, **req_dict)

@router.put("/time-off/{request_id}/approve")
async def approve_time_off(request_id: str, reviewer_id: str):
    """Approve time off request"""
    result = await db.hr_time_off.update_one(
        {"id": request_id},
        {"$set": {
            "status": "approved",
            "reviewed_by": reviewer_id,
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"message": "Time off request approved"}

@router.put("/time-off/{request_id}/deny")
async def deny_time_off(request_id: str, reviewer_id: str, reason: Optional[str] = None):
    """Deny time off request"""
    update_data = {
        "status": "denied",
        "reviewed_by": reviewer_id,
        "reviewed_at": datetime.now(timezone.utc).isoformat()
    }
    if reason:
        update_data["denial_reason"] = reason
    
    result = await db.hr_time_off.update_one({"id": request_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"message": "Time off request denied"}


# ============ PAYROLL ENDPOINTS ============

@router.get("/payroll/periods")
async def get_pay_periods(status: Optional[str] = None):
    """Get all pay periods"""
    query = {}
    if status:
        query["status"] = status
    
    periods = await db.hr_pay_periods.find(query).sort("start_date", -1).to_list(100)
    return [{**p, "id": str(p.get("id")), "_id": None} for p in periods]

@router.post("/payroll/periods")
async def create_pay_period(period: PayPeriodCreate):
    """Create a new pay period"""
    period_dict = period.model_dump()
    period_dict["id"] = str(uuid.uuid4())
    period_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.hr_pay_periods.insert_one(period_dict)
    # Remove MongoDB's _id before returning
    period_dict.pop("_id", None)
    return period_dict

@router.get("/payroll/calculate/{period_id}", response_model=PayrollSummary)
async def calculate_payroll(period_id: str):
    """Calculate payroll for a pay period"""
    period = await db.hr_pay_periods.find_one({"id": period_id})
    if not period:
        raise HTTPException(status_code=404, detail="Pay period not found")
    
    settings = await get_hr_settings()
    employees = await db.hr_employees.find({"status": "active"}).to_list(1000)
    
    entries = []
    total_regular = 0
    total_overtime = 0
    total_gross = 0
    total_deductions = 0
    total_net = 0
    
    for emp in employees:
        # Get timecard for this period
        timecard = await get_timecard(
            emp["id"],
            period["start_date"],
            period["end_date"]
        )
        
        regular_hours = timecard["total_regular_hours"]
        overtime_hours = timecard["total_overtime_hours"]
        hourly_rate = emp.get("hourly_rate", 0)
        
        regular_pay = regular_hours * hourly_rate
        overtime_pay = overtime_hours * hourly_rate * settings["overtime_rate_multiplier"]
        gross_pay = regular_pay + overtime_pay
        deductions = 0  # Can be expanded later
        net_pay = gross_pay - deductions
        
        total_regular += regular_hours
        total_overtime += overtime_hours
        total_gross += gross_pay
        total_deductions += deductions
        total_net += net_pay
        
        entries.append(PayrollEntry(
            employee_id=emp["id"],
            employee_name=f"{emp['first_name']} {emp['last_name']}",
            regular_hours=regular_hours,
            overtime_hours=overtime_hours,
            hourly_rate=hourly_rate,
            regular_pay=round(regular_pay, 2),
            overtime_pay=round(overtime_pay, 2),
            gross_pay=round(gross_pay, 2),
            deductions=round(deductions, 2),
            net_pay=round(net_pay, 2)
        ))
    
    return PayrollSummary(
        pay_period_id=period_id,
        start_date=period["start_date"],
        end_date=period["end_date"],
        pay_date=period["pay_date"],
        status=period["status"],
        total_employees=len(entries),
        total_regular_hours=round(total_regular, 2),
        total_overtime_hours=round(total_overtime, 2),
        total_gross_pay=round(total_gross, 2),
        total_deductions=round(total_deductions, 2),
        total_net_pay=round(total_net, 2),
        entries=entries
    )

@router.put("/payroll/periods/{period_id}/close")
async def close_pay_period(period_id: str):
    """Close a pay period"""
    result = await db.hr_pay_periods.update_one(
        {"id": period_id},
        {"$set": {"status": "closed"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Pay period not found")
    return {"message": "Pay period closed"}


# ============ DOCUMENT ENDPOINTS ============

@router.get("/documents/{employee_id}")
async def get_employee_documents(employee_id: str):
    """Get all documents for an employee"""
    documents = await db.hr_documents.find({"employee_id": employee_id}).to_list(100)
    return [DocumentResponse(**{**d, "id": str(d.get("id")), "_id": None}) for d in documents]

@router.post("/documents", response_model=DocumentResponse)
async def upload_document(document: DocumentCreate):
    """Upload a document for an employee"""
    doc_dict = document.model_dump()
    doc_dict["id"] = str(uuid.uuid4())
    doc_dict["uploaded_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.hr_documents.insert_one(doc_dict)
    return DocumentResponse(**doc_dict)

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document"""
    result = await db.hr_documents.delete_one({"id": document_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted"}


# ============ JOB APPLICATION ENDPOINTS ============

@router.get("/applications")
async def get_job_applications(status: Optional[str] = None):
    """Get all job applications"""
    query = {}
    if status:
        query["status"] = status
    
    applications = await db.hr_applications.find(query).sort("submitted_at", -1).to_list(1000)
    return [JobApplicationResponse(**{**a, "id": str(a.get("id")), "_id": None}) for a in applications]

@router.get("/applications/{application_id}")
async def get_job_application(application_id: str):
    """Get single job application"""
    app = await db.hr_applications.find_one({"id": application_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return JobApplicationResponse(**{**app, "id": str(app.get("id")), "_id": None})

@router.post("/applications", response_model=JobApplicationResponse)
async def submit_job_application(application: JobApplicationCreate):
    """Submit a job application (public endpoint)"""
    app_dict = application.model_dump()
    app_dict["id"] = str(uuid.uuid4())
    app_dict["status"] = "new"
    app_dict["submitted_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.hr_applications.insert_one(app_dict)
    
    # TODO: Send email notification to HR
    
    return JobApplicationResponse(**app_dict)

@router.put("/applications/{application_id}/status")
async def update_application_status(
    application_id: str,
    status: str,
    reviewer_id: str,
    notes: Optional[str] = None
):
    """Update job application status"""
    update_data = {
        "status": status,
        "reviewed_by": reviewer_id,
        "reviewed_at": datetime.now(timezone.utc).isoformat()
    }
    if notes:
        update_data["notes"] = notes
    
    result = await db.hr_applications.update_one({"id": application_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": f"Application status updated to {status}"}


# ============ HR SETTINGS ENDPOINTS ============

@router.get("/settings")
async def get_settings():
    """Get HR settings"""
    return await get_hr_settings()

@router.put("/settings")
async def update_settings(settings: HRSettingsUpdate):
    """Update HR settings"""
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    
    await db.admin_settings.update_one(
        {"type": "hr_settings"},
        {"$set": {**update_data, "type": "hr_settings"}},
        upsert=True
    )
    
    return await get_hr_settings()


# ============ PUBLIC HR PORTAL MODELS ============

class JobPostingBase(BaseModel):
    title: str
    department: str  # pawn, storage, rv, general
    location: str = "Dothan, AL"
    employment_type: str = "full_time"  # full_time, part_time, seasonal, contractor
    description: str
    requirements: List[str] = []
    benefits: List[str] = []
    pay_range_min: Optional[float] = None
    pay_range_max: Optional[float] = None
    pay_type: str = "hourly"  # hourly, salary
    is_active: bool = True
    featured: bool = False

class JobPostingCreate(JobPostingBase):
    pass

class JobPostingUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    pay_range_min: Optional[float] = None
    pay_range_max: Optional[float] = None
    pay_type: Optional[str] = None
    is_active: Optional[bool] = None
    featured: Optional[bool] = None

class JobPostingResponse(JobPostingBase):
    id: str
    created_at: str
    updated_at: Optional[str] = None

class FAQBase(BaseModel):
    question: str
    answer: str
    category: str = "general"  # general, benefits, policies, application, culture
    order: int = 0
    is_active: bool = True

class FAQCreate(FAQBase):
    pass

class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None

class FAQResponse(FAQBase):
    id: str
    created_at: str

class KnowledgeBaseArticleBase(BaseModel):
    title: str
    content: str
    category: str = "general"  # general, policies, procedures, safety, benefits
    tags: List[str] = []
    order: int = 0
    is_published: bool = True

class KnowledgeBaseArticleCreate(KnowledgeBaseArticleBase):
    pass

class KnowledgeBaseArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    order: Optional[int] = None
    is_published: Optional[bool] = None

class KnowledgeBaseArticleResponse(KnowledgeBaseArticleBase):
    id: str
    created_at: str
    updated_at: Optional[str] = None

class EmployeeManualBase(BaseModel):
    title: str
    version: str = "1.0"
    effective_date: str
    content: str  # HTML/Markdown content
    pdf_url: Optional[str] = None
    is_current: bool = True

class EmployeeManualCreate(EmployeeManualBase):
    pass

class EmployeeManualUpdate(BaseModel):
    title: Optional[str] = None
    version: Optional[str] = None
    effective_date: Optional[str] = None
    content: Optional[str] = None
    pdf_url: Optional[str] = None
    is_current: Optional[bool] = None

class EmployeeManualResponse(EmployeeManualBase):
    id: str
    created_at: str
    updated_at: Optional[str] = None

class HRPortalSettingsBase(BaseModel):
    welcome_title: str = "Join Our Team"
    welcome_subtitle: str = "Build your career with 123Bots"
    welcome_description: str = "We're always looking for talented individuals to join our growing team. Explore opportunities across our product catalog, storage facility, and RV repair center."
    hero_image_url: Optional[str] = None
    company_culture_text: Optional[str] = None
    benefits_intro: Optional[str] = None
    application_instructions: Optional[str] = None

class HRPortalSettingsUpdate(BaseModel):
    welcome_title: Optional[str] = None
    welcome_subtitle: Optional[str] = None
    welcome_description: Optional[str] = None
    hero_image_url: Optional[str] = None
    company_culture_text: Optional[str] = None
    benefits_intro: Optional[str] = None
    application_instructions: Optional[str] = None


# ============ JOB POSTINGS ENDPOINTS ============

@router.get("/portal/jobs")
async def get_public_job_postings(department: Optional[str] = None, active_only: bool = True):
    """Get job postings (public endpoint)"""
    query = {}
    if active_only:
        query["is_active"] = True
    if department:
        query["department"] = department
    
    jobs = await db.hr_job_postings.find(query).sort([("featured", -1), ("created_at", -1)]).to_list(100)
    return [JobPostingResponse(**{**j, "id": str(j.get("id")), "_id": None}) for j in jobs]

@router.get("/portal/jobs/{job_id}")
async def get_job_posting(job_id: str):
    """Get single job posting"""
    job = await db.hr_job_postings.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found")
    return JobPostingResponse(**{**job, "id": str(job.get("id")), "_id": None})

@router.post("/jobs", response_model=JobPostingResponse)
async def create_job_posting(job: JobPostingCreate):
    """Create job posting (admin only)"""
    job_dict = job.model_dump()
    job_dict["id"] = str(uuid.uuid4())
    job_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.hr_job_postings.insert_one(job_dict)
    job_dict.pop("_id", None)
    return JobPostingResponse(**job_dict)

@router.put("/jobs/{job_id}", response_model=JobPostingResponse)
async def update_job_posting(job_id: str, job: JobPostingUpdate):
    """Update job posting (admin only)"""
    update_data = {k: v for k, v in job.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.hr_job_postings.update_one({"id": job_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Job posting not found")
    
    updated = await db.hr_job_postings.find_one({"id": job_id})
    return JobPostingResponse(**{**updated, "id": str(updated.get("id")), "_id": None})

@router.delete("/jobs/{job_id}")
async def delete_job_posting(job_id: str):
    """Delete job posting (admin only)"""
    result = await db.hr_job_postings.delete_one({"id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job posting not found")
    return {"message": "Job posting deleted"}


# ============ FAQ ENDPOINTS ============

@router.get("/portal/faqs")
async def get_public_faqs(category: Optional[str] = None):
    """Get FAQs (public endpoint)"""
    query = {"is_active": True}
    if category:
        query["category"] = category
    
    faqs = await db.hr_faqs.find(query).sort("order", 1).to_list(100)
    return [FAQResponse(**{**f, "id": str(f.get("id")), "_id": None}) for f in faqs]

@router.get("/faqs")
async def get_all_faqs(category: Optional[str] = None):
    """Get all FAQs (admin only)"""
    query = {}
    if category:
        query["category"] = category
    
    faqs = await db.hr_faqs.find(query).sort("order", 1).to_list(100)
    return [FAQResponse(**{**f, "id": str(f.get("id")), "_id": None}) for f in faqs]

@router.post("/faqs", response_model=FAQResponse)
async def create_faq(faq: FAQCreate):
    """Create FAQ (admin only)"""
    faq_dict = faq.model_dump()
    faq_dict["id"] = str(uuid.uuid4())
    faq_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.hr_faqs.insert_one(faq_dict)
    faq_dict.pop("_id", None)
    return FAQResponse(**faq_dict)

@router.put("/faqs/{faq_id}", response_model=FAQResponse)
async def update_faq(faq_id: str, faq: FAQUpdate):
    """Update FAQ (admin only)"""
    update_data = {k: v for k, v in faq.model_dump().items() if v is not None}
    
    result = await db.hr_faqs.update_one({"id": faq_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    
    updated = await db.hr_faqs.find_one({"id": faq_id})
    return FAQResponse(**{**updated, "id": str(updated.get("id")), "_id": None})

@router.delete("/faqs/{faq_id}")
async def delete_faq(faq_id: str):
    """Delete FAQ (admin only)"""
    result = await db.hr_faqs.delete_one({"id": faq_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"message": "FAQ deleted"}


# ============ KNOWLEDGE BASE ENDPOINTS ============

@router.get("/portal/knowledge")
async def get_public_knowledge_base(category: Optional[str] = None):
    """Get knowledge base articles (public endpoint)"""
    query = {"is_published": True}
    if category:
        query["category"] = category
    
    articles = await db.hr_knowledge_base.find(query).sort("order", 1).to_list(100)
    return [KnowledgeBaseArticleResponse(**{**a, "id": str(a.get("id")), "_id": None}) for a in articles]

@router.get("/portal/knowledge/{article_id}")
async def get_knowledge_article(article_id: str):
    """Get single knowledge base article"""
    article = await db.hr_knowledge_base.find_one({"id": article_id})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return KnowledgeBaseArticleResponse(**{**article, "id": str(article.get("id")), "_id": None})

@router.get("/knowledge")
async def get_all_knowledge_base(category: Optional[str] = None):
    """Get all knowledge base articles (admin only)"""
    query = {}
    if category:
        query["category"] = category
    
    articles = await db.hr_knowledge_base.find(query).sort("order", 1).to_list(100)
    return [KnowledgeBaseArticleResponse(**{**a, "id": str(a.get("id")), "_id": None}) for a in articles]

@router.post("/knowledge", response_model=KnowledgeBaseArticleResponse)
async def create_knowledge_article(article: KnowledgeBaseArticleCreate):
    """Create knowledge base article (admin only)"""
    article_dict = article.model_dump()
    article_dict["id"] = str(uuid.uuid4())
    article_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.hr_knowledge_base.insert_one(article_dict)
    article_dict.pop("_id", None)
    return KnowledgeBaseArticleResponse(**article_dict)

@router.put("/knowledge/{article_id}", response_model=KnowledgeBaseArticleResponse)
async def update_knowledge_article(article_id: str, article: KnowledgeBaseArticleUpdate):
    """Update knowledge base article (admin only)"""
    update_data = {k: v for k, v in article.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.hr_knowledge_base.update_one({"id": article_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    
    updated = await db.hr_knowledge_base.find_one({"id": article_id})
    return KnowledgeBaseArticleResponse(**{**updated, "id": str(updated.get("id")), "_id": None})

@router.delete("/knowledge/{article_id}")
async def delete_knowledge_article(article_id: str):
    """Delete knowledge base article (admin only)"""
    result = await db.hr_knowledge_base.delete_one({"id": article_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"message": "Article deleted"}


# ============ EMPLOYEE MANUAL ENDPOINTS ============

@router.get("/portal/manual")
async def get_current_employee_manual():
    """Get current employee manual (public endpoint)"""
    manual = await db.hr_employee_manual.find_one({"is_current": True})
    if not manual:
        return None
    return EmployeeManualResponse(**{**manual, "id": str(manual.get("id")), "_id": None})

@router.get("/manuals")
async def get_all_employee_manuals():
    """Get all employee manual versions (admin only)"""
    manuals = await db.hr_employee_manual.find().sort("created_at", -1).to_list(50)
    return [EmployeeManualResponse(**{**m, "id": str(m.get("id")), "_id": None}) for m in manuals]

@router.post("/manuals", response_model=EmployeeManualResponse)
async def create_employee_manual(manual: EmployeeManualCreate):
    """Create new employee manual version (admin only)"""
    # If this is current, mark others as not current
    if manual.is_current:
        await db.hr_employee_manual.update_many({}, {"$set": {"is_current": False}})
    
    manual_dict = manual.model_dump()
    manual_dict["id"] = str(uuid.uuid4())
    manual_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.hr_employee_manual.insert_one(manual_dict)
    manual_dict.pop("_id", None)
    return EmployeeManualResponse(**manual_dict)

@router.put("/manuals/{manual_id}", response_model=EmployeeManualResponse)
async def update_employee_manual(manual_id: str, manual: EmployeeManualUpdate):
    """Update employee manual (admin only)"""
    update_data = {k: v for k, v in manual.model_dump().items() if v is not None}
    
    # If setting as current, mark others as not current
    if update_data.get("is_current"):
        await db.hr_employee_manual.update_many({"id": {"$ne": manual_id}}, {"$set": {"is_current": False}})
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.hr_employee_manual.update_one({"id": manual_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Manual not found")
    
    updated = await db.hr_employee_manual.find_one({"id": manual_id})
    return EmployeeManualResponse(**{**updated, "id": str(updated.get("id")), "_id": None})

@router.delete("/manuals/{manual_id}")
async def delete_employee_manual(manual_id: str):
    """Delete employee manual (admin only)"""
    result = await db.hr_employee_manual.delete_one({"id": manual_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Manual not found")
    return {"message": "Manual deleted"}


# ============ HR PORTAL SETTINGS ENDPOINTS ============

async def get_hr_portal_settings():
    """Get HR portal settings with defaults"""
    settings = await db.admin_settings.find_one({"type": "hr_portal_settings"})
    if not settings:
        return HRPortalSettingsBase().model_dump()
    
    defaults = HRPortalSettingsBase().model_dump()
    for key in defaults:
        if key not in settings:
            settings[key] = defaults[key]
    
    settings.pop("_id", None)
    settings.pop("type", None)
    return settings

@router.get("/portal/settings")
async def get_portal_settings():
    """Get HR portal settings (public endpoint)"""
    return await get_hr_portal_settings()

@router.put("/portal-settings")
async def update_portal_settings(settings: HRPortalSettingsUpdate):
    """Update HR portal settings (admin only)"""
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    
    await db.admin_settings.update_one(
        {"type": "hr_portal_settings"},
        {"$set": {**update_data, "type": "hr_portal_settings"}},
        upsert=True
    )
    
    return await get_hr_portal_settings()
