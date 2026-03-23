"""
RV Restoration Module
Comprehensive RV repair and restoration management with jobs, estimates, and invoices
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, date
from bson import ObjectId
import uuid

router = APIRouter(prefix="/rv", tags=["RV Restoration"])

# MongoDB will be injected from server.py
db = None

def init_db(database):
    global db
    db = database


# ============ PYDANTIC MODELS ============

# Service/Labor Item
class ServiceItem(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    category: str = "General"  # General, Electrical, Plumbing, HVAC, Exterior, Interior, Appliances
    labor_hours: float = 0
    labor_rate: float = 75.0  # Default hourly rate
    parts_cost: float = 0
    parts_description: Optional[str] = None
    total: float = 0

class ServiceItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "General"
    labor_hours: float = 0
    labor_rate: float = 75.0
    parts_cost: float = 0
    parts_description: Optional[str] = None

# Customer Info
class CustomerInfo(BaseModel):
    name: str
    email: Optional[str] = None
    phone: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None

# RV Info
class RVInfo(BaseModel):
    year: Optional[str] = None
    make: str
    model: str
    vin: Optional[str] = None
    license_plate: Optional[str] = None
    length: Optional[str] = None
    rv_type: str = "Travel Trailer"  # Travel Trailer, Fifth Wheel, Class A, Class B, Class C, Toy Hauler

# Estimate Models
class EstimateCreate(BaseModel):
    customer: CustomerInfo
    rv: RVInfo
    services: List[ServiceItemCreate]
    notes: Optional[str] = None
    discount_percent: float = 0
    tax_rate: float = 9.0  # Alabama tax rate

class EstimateUpdate(BaseModel):
    customer: Optional[CustomerInfo] = None
    rv: Optional[RVInfo] = None
    services: Optional[List[ServiceItemCreate]] = None
    notes: Optional[str] = None
    discount_percent: Optional[float] = None
    tax_rate: Optional[float] = None
    status: Optional[str] = None

class EstimateResponse(BaseModel):
    id: str
    estimate_number: str
    customer: CustomerInfo
    rv: RVInfo
    services: List[ServiceItem]
    subtotal: float
    discount_amount: float
    tax_amount: float
    total: float
    notes: Optional[str] = None
    status: str  # draft, sent, approved, declined, converted
    created_at: str
    updated_at: Optional[str] = None
    valid_until: Optional[str] = None

# Job/Work Order Models
class JobCreate(BaseModel):
    customer: CustomerInfo
    rv: RVInfo
    services: List[ServiceItemCreate]
    estimate_id: Optional[str] = None
    scheduled_date: Optional[str] = None
    notes: Optional[str] = None
    priority: str = "normal"  # low, normal, high, urgent
    discount_percent: float = 0
    tax_rate: float = 9.0

class JobUpdate(BaseModel):
    customer: Optional[CustomerInfo] = None
    rv: Optional[RVInfo] = None
    services: Optional[List[ServiceItemCreate]] = None
    scheduled_date: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    discount_percent: Optional[float] = None
    tax_rate: Optional[float] = None
    technician_notes: Optional[str] = None

class JobResponse(BaseModel):
    id: str
    job_number: str
    customer: CustomerInfo
    rv: RVInfo
    services: List[ServiceItem]
    estimate_id: Optional[str] = None
    subtotal: float
    discount_amount: float
    tax_amount: float
    total: float
    notes: Optional[str] = None
    technician_notes: Optional[str] = None
    status: str  # pending, in_progress, on_hold, completed, cancelled
    priority: str
    scheduled_date: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

# Invoice Models
class InvoiceCreate(BaseModel):
    job_id: str
    due_date: Optional[str] = None
    notes: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    job_id: str
    job_number: str
    customer: CustomerInfo
    rv: RVInfo
    services: List[ServiceItem]
    subtotal: float
    discount_amount: float
    tax_amount: float
    total: float
    amount_paid: float
    balance_due: float
    status: str  # draft, sent, partial, paid, overdue, cancelled
    due_date: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    paid_at: Optional[str] = None

# Service Catalog Models
class ServiceCatalogItem(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    category: str
    default_labor_hours: float
    default_labor_rate: float
    default_parts_cost: float
    is_active: bool = True

class ServiceCatalogCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "General"
    default_labor_hours: float = 1.0
    default_labor_rate: float = 75.0
    default_parts_cost: float = 0


# Inventory/Parts Models
class InventoryItemCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    category: str = "General"
    description: Optional[str] = None
    quantity: int = 0
    min_quantity: int = 5  # Alert when below this
    cost_price: float = 0
    sell_price: float = 0
    location: Optional[str] = None  # Shelf/bin location
    supplier: Optional[str] = None

class InventoryItemResponse(BaseModel):
    id: str
    name: str
    sku: Optional[str] = None
    category: str
    description: Optional[str] = None
    quantity: int
    min_quantity: int
    cost_price: float
    sell_price: float
    location: Optional[str] = None
    supplier: Optional[str] = None
    is_low_stock: bool = False
    created_at: str
    updated_at: Optional[str] = None

# Calendar/Schedule Models
class ScheduleEventCreate(BaseModel):
    title: str
    job_id: Optional[str] = None
    estimate_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    rv_info: Optional[str] = None
    start_datetime: str
    end_datetime: str
    all_day: bool = False
    event_type: str = "job"  # job, estimate_review, pickup, delivery, consultation
    notes: Optional[str] = None
    color: Optional[str] = None
    send_customer_reminder: bool = True
    send_admin_reminder: bool = True
    reminder_hours_before: int = 24

class ScheduleEventResponse(BaseModel):
    id: str
    title: str
    job_id: Optional[str] = None
    job_number: Optional[str] = None
    estimate_id: Optional[str] = None
    estimate_number: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    rv_info: Optional[str] = None
    start_datetime: str
    end_datetime: str
    all_day: bool
    event_type: str
    notes: Optional[str] = None
    color: Optional[str] = None
    status: str  # scheduled, in_progress, completed, cancelled
    send_customer_reminder: bool
    send_admin_reminder: bool
    reminder_hours_before: int
    reminder_sent: bool = False
    created_at: str

# Reminder Models
class ReminderCreate(BaseModel):
    event_id: str
    recipient_type: str  # customer, admin
    recipient_email: str
    recipient_name: str
    send_at: str
    subject: str
    message: str


# ============ HELPER FUNCTIONS ============

def calculate_service_total(service: dict) -> float:
    """Calculate total for a single service item"""
    labor_total = service.get('labor_hours', 0) * service.get('labor_rate', 75)
    parts_total = service.get('parts_cost', 0)
    return round(labor_total + parts_total, 2)

def calculate_totals(services: List[dict], discount_percent: float, tax_rate: float) -> dict:
    """Calculate subtotal, discount, tax, and total"""
    subtotal = sum(calculate_service_total(s) for s in services)
    discount_amount = round(subtotal * (discount_percent / 100), 2)
    taxable = subtotal - discount_amount
    tax_amount = round(taxable * (tax_rate / 100), 2)
    total = round(taxable + tax_amount, 2)
    
    return {
        "subtotal": round(subtotal, 2),
        "discount_amount": discount_amount,
        "tax_amount": tax_amount,
        "total": total
    }

async def get_next_number(prefix: str, collection_name: str) -> str:
    """Generate next sequential number for estimates, jobs, invoices"""
    # Find the highest number
    pipeline = [
        {"$match": {f"{prefix.lower()}_number": {"$regex": f"^{prefix}-"}}},
        {"$project": {
            "num": {"$toInt": {"$substr": [f"${prefix.lower()}_number", len(prefix) + 1, -1]}}
        }},
        {"$sort": {"num": -1}},
        {"$limit": 1}
    ]
    
    result = await db[collection_name].aggregate(pipeline).to_list(1)
    next_num = (result[0]["num"] + 1) if result else 1001
    return f"{prefix}-{next_num}"

async def get_rv_settings():
    """Get RV settings from database"""
    settings = await db.admin_settings.find_one({"type": "rv_settings"})
    if not settings:
        return {
            "default_labor_rate": 75.0,
            "tax_rate": 9.0,
            "estimate_validity_days": 30,
            "categories": ["General", "Electrical", "Plumbing", "HVAC", "Exterior", "Interior", "Appliances", "Structural", "Flooring", "Windows & Doors"],
            "rv_types": ["Travel Trailer", "Fifth Wheel", "Class A", "Class B", "Class C", "Toy Hauler", "Pop-Up", "Truck Camper"]
        }
    return {k: v for k, v in settings.items() if k not in ["_id", "type"]}


# ============ SERVICE CATALOG ENDPOINTS ============

@router.get("/services/catalog")
async def get_service_catalog(category: Optional[str] = None, active_only: bool = True):
    """Get service catalog items"""
    query = {}
    if category:
        query["category"] = category
    if active_only:
        query["is_active"] = True
    
    services = await db.rv_service_catalog.find(query).sort("name", 1).to_list(500)
    return [ServiceCatalogItem(**{**s, "id": str(s.get("id")), "_id": None}) for s in services]

@router.post("/services/catalog", response_model=ServiceCatalogItem)
async def create_catalog_service(service: ServiceCatalogCreate):
    """Add a service to the catalog"""
    service_dict = service.model_dump()
    service_dict["id"] = str(uuid.uuid4())
    service_dict["is_active"] = True
    service_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.rv_service_catalog.insert_one(service_dict)
    service_dict.pop("_id", None)
    return ServiceCatalogItem(**service_dict)

@router.put("/services/catalog/{service_id}")
async def update_catalog_service(service_id: str, service: ServiceCatalogCreate):
    """Update a catalog service"""
    update_data = service.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.rv_service_catalog.update_one({"id": service_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service updated"}

@router.delete("/services/catalog/{service_id}")
async def delete_catalog_service(service_id: str):
    """Soft delete a catalog service"""
    result = await db.rv_service_catalog.update_one(
        {"id": service_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service removed from catalog"}


# ============ ESTIMATE ENDPOINTS ============

@router.get("/estimates")
async def get_estimates(status: Optional[str] = None, limit: int = 100):
    """Get all estimates"""
    query = {}
    if status:
        query["status"] = status
    
    estimates = await db.rv_estimates.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [EstimateResponse(**{**e, "id": str(e.get("id")), "_id": None}) for e in estimates]

@router.get("/estimates/{estimate_id}", response_model=EstimateResponse)
async def get_estimate(estimate_id: str):
    """Get single estimate"""
    estimate = await db.rv_estimates.find_one({"id": estimate_id})
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")
    return EstimateResponse(**{**estimate, "id": str(estimate.get("id")), "_id": None})

@router.post("/estimates", response_model=EstimateResponse)
async def create_estimate(estimate: EstimateCreate):
    """Create a new estimate"""
    settings = await get_rv_settings()
    
    # Process services and calculate totals
    services = []
    for s in estimate.services:
        service_dict = s.model_dump()
        service_dict["id"] = str(uuid.uuid4())
        service_dict["total"] = calculate_service_total(service_dict)
        services.append(service_dict)
    
    totals = calculate_totals(services, estimate.discount_percent, estimate.tax_rate)
    
    # Calculate valid until date
    valid_until = (datetime.now(timezone.utc) + 
                   __import__('datetime').timedelta(days=settings.get("estimate_validity_days", 30))).isoformat()
    
    estimate_dict = {
        "id": str(uuid.uuid4()),
        "estimate_number": await get_next_number("EST", "rv_estimates"),
        "customer": estimate.customer.model_dump(),
        "rv": estimate.rv.model_dump(),
        "services": services,
        "notes": estimate.notes,
        "discount_percent": estimate.discount_percent,
        "tax_rate": estimate.tax_rate,
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "valid_until": valid_until,
        **totals
    }
    
    await db.rv_estimates.insert_one(estimate_dict)
    estimate_dict.pop("_id", None)
    return EstimateResponse(**estimate_dict)

@router.put("/estimates/{estimate_id}", response_model=EstimateResponse)
async def update_estimate(estimate_id: str, updates: EstimateUpdate):
    """Update an estimate"""
    estimate = await db.rv_estimates.find_one({"id": estimate_id})
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")
    
    update_data = {}
    
    if updates.customer:
        update_data["customer"] = updates.customer.model_dump()
    if updates.rv:
        update_data["rv"] = updates.rv.model_dump()
    if updates.services is not None:
        services = []
        for s in updates.services:
            service_dict = s.model_dump()
            service_dict["id"] = str(uuid.uuid4())
            service_dict["total"] = calculate_service_total(service_dict)
            services.append(service_dict)
        update_data["services"] = services
    if updates.notes is not None:
        update_data["notes"] = updates.notes
    if updates.discount_percent is not None:
        update_data["discount_percent"] = updates.discount_percent
    if updates.tax_rate is not None:
        update_data["tax_rate"] = updates.tax_rate
    if updates.status:
        update_data["status"] = updates.status
    
    # Recalculate totals if services or discounts changed
    if "services" in update_data or "discount_percent" in update_data or "tax_rate" in update_data:
        services = update_data.get("services", estimate["services"])
        discount = update_data.get("discount_percent", estimate.get("discount_percent", 0))
        tax = update_data.get("tax_rate", estimate.get("tax_rate", 9))
        totals = calculate_totals(services, discount, tax)
        update_data.update(totals)
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.rv_estimates.update_one({"id": estimate_id}, {"$set": update_data})
    
    updated = await db.rv_estimates.find_one({"id": estimate_id})
    return EstimateResponse(**{**updated, "id": str(updated.get("id")), "_id": None})

@router.post("/estimates/{estimate_id}/convert-to-job", response_model=JobResponse)
async def convert_estimate_to_job(estimate_id: str):
    """Convert an approved estimate to a job/work order"""
    estimate = await db.rv_estimates.find_one({"id": estimate_id})
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")
    
    # Create job from estimate
    job_dict = {
        "id": str(uuid.uuid4()),
        "job_number": await get_next_number("JOB", "rv_jobs"),
        "estimate_id": estimate_id,
        "customer": estimate["customer"],
        "rv": estimate["rv"],
        "services": estimate["services"],
        "notes": estimate.get("notes"),
        "discount_percent": estimate.get("discount_percent", 0),
        "tax_rate": estimate.get("tax_rate", 9),
        "subtotal": estimate["subtotal"],
        "discount_amount": estimate["discount_amount"],
        "tax_amount": estimate["tax_amount"],
        "total": estimate["total"],
        "status": "pending",
        "priority": "normal",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.rv_jobs.insert_one(job_dict)
    
    # Update estimate status
    await db.rv_estimates.update_one(
        {"id": estimate_id},
        {"$set": {"status": "converted", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    job_dict.pop("_id", None)
    return JobResponse(**job_dict)

@router.delete("/estimates/{estimate_id}")
async def delete_estimate(estimate_id: str):
    """Delete an estimate"""
    result = await db.rv_estimates.delete_one({"id": estimate_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Estimate not found")
    return {"message": "Estimate deleted"}


# ============ JOB/WORK ORDER ENDPOINTS ============

@router.get("/jobs")
async def get_jobs(status: Optional[str] = None, priority: Optional[str] = None, limit: int = 100):
    """Get all jobs"""
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    
    jobs = await db.rv_jobs.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [JobResponse(**{**j, "id": str(j.get("id")), "_id": None}) for j in jobs]

@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """Get single job"""
    job = await db.rv_jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse(**{**job, "id": str(job.get("id")), "_id": None})

@router.post("/jobs", response_model=JobResponse)
async def create_job(job: JobCreate):
    """Create a new job/work order"""
    # Process services and calculate totals
    services = []
    for s in job.services:
        service_dict = s.model_dump()
        service_dict["id"] = str(uuid.uuid4())
        service_dict["total"] = calculate_service_total(service_dict)
        services.append(service_dict)
    
    totals = calculate_totals(services, job.discount_percent, job.tax_rate)
    
    job_dict = {
        "id": str(uuid.uuid4()),
        "job_number": await get_next_number("JOB", "rv_jobs"),
        "customer": job.customer.model_dump(),
        "rv": job.rv.model_dump(),
        "services": services,
        "estimate_id": job.estimate_id,
        "notes": job.notes,
        "discount_percent": job.discount_percent,
        "tax_rate": job.tax_rate,
        "status": "pending",
        "priority": job.priority,
        "scheduled_date": job.scheduled_date,
        "created_at": datetime.now(timezone.utc).isoformat(),
        **totals
    }
    
    await db.rv_jobs.insert_one(job_dict)
    job_dict.pop("_id", None)
    return JobResponse(**job_dict)

@router.put("/jobs/{job_id}", response_model=JobResponse)
async def update_job(job_id: str, updates: JobUpdate):
    """Update a job"""
    job = await db.rv_jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    update_data = {}
    
    if updates.customer:
        update_data["customer"] = updates.customer.model_dump()
    if updates.rv:
        update_data["rv"] = updates.rv.model_dump()
    if updates.services is not None:
        services = []
        for s in updates.services:
            service_dict = s.model_dump()
            service_dict["id"] = str(uuid.uuid4())
            service_dict["total"] = calculate_service_total(service_dict)
            services.append(service_dict)
        update_data["services"] = services
    if updates.scheduled_date is not None:
        update_data["scheduled_date"] = updates.scheduled_date
    if updates.notes is not None:
        update_data["notes"] = updates.notes
    if updates.technician_notes is not None:
        update_data["technician_notes"] = updates.technician_notes
    if updates.priority:
        update_data["priority"] = updates.priority
    if updates.status:
        update_data["status"] = updates.status
        if updates.status == "in_progress" and not job.get("started_at"):
            update_data["started_at"] = datetime.now(timezone.utc).isoformat()
        elif updates.status == "completed":
            update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    if updates.discount_percent is not None:
        update_data["discount_percent"] = updates.discount_percent
    if updates.tax_rate is not None:
        update_data["tax_rate"] = updates.tax_rate
    
    # Recalculate totals if needed
    if "services" in update_data or "discount_percent" in update_data or "tax_rate" in update_data:
        services = update_data.get("services", job["services"])
        discount = update_data.get("discount_percent", job.get("discount_percent", 0))
        tax = update_data.get("tax_rate", job.get("tax_rate", 9))
        totals = calculate_totals(services, discount, tax)
        update_data.update(totals)
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.rv_jobs.update_one({"id": job_id}, {"$set": update_data})
    
    updated = await db.rv_jobs.find_one({"id": job_id})
    return JobResponse(**{**updated, "id": str(updated.get("id")), "_id": None})

@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a job"""
    result = await db.rv_jobs.delete_one({"id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job deleted"}


# ============ INVOICE ENDPOINTS ============

@router.get("/invoices")
async def get_invoices(status: Optional[str] = None, limit: int = 100):
    """Get all invoices"""
    query = {}
    if status:
        query["status"] = status
    
    invoices = await db.rv_invoices.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [InvoiceResponse(**{**i, "id": str(i.get("id")), "_id": None}) for i in invoices]

@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: str):
    """Get single invoice"""
    invoice = await db.rv_invoices.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return InvoiceResponse(**{**invoice, "id": str(invoice.get("id")), "_id": None})

@router.post("/invoices", response_model=InvoiceResponse)
async def create_invoice(invoice: InvoiceCreate):
    """Create invoice from a completed job"""
    job = await db.rv_jobs.find_one({"id": invoice.job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Set due date (default 30 days)
    due_date = invoice.due_date or (datetime.now(timezone.utc) + 
                                     __import__('datetime').timedelta(days=30)).isoformat()[:10]
    
    invoice_dict = {
        "id": str(uuid.uuid4()),
        "invoice_number": await get_next_number("INV", "rv_invoices"),
        "job_id": job["id"],
        "job_number": job["job_number"],
        "customer": job["customer"],
        "rv": job["rv"],
        "services": job["services"],
        "subtotal": job["subtotal"],
        "discount_amount": job["discount_amount"],
        "tax_amount": job["tax_amount"],
        "total": job["total"],
        "amount_paid": 0,
        "balance_due": job["total"],
        "status": "draft",
        "due_date": due_date,
        "notes": invoice.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.rv_invoices.insert_one(invoice_dict)
    invoice_dict.pop("_id", None)
    return InvoiceResponse(**invoice_dict)

@router.post("/invoices/{invoice_id}/payment")
async def record_payment(invoice_id: str, amount: float):
    """Record a payment on an invoice"""
    invoice = await db.rv_invoices.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    new_amount_paid = invoice.get("amount_paid", 0) + amount
    new_balance = invoice["total"] - new_amount_paid
    
    status = "paid" if new_balance <= 0 else "partial"
    
    update_data = {
        "amount_paid": round(new_amount_paid, 2),
        "balance_due": round(max(0, new_balance), 2),
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if status == "paid":
        update_data["paid_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.rv_invoices.update_one({"id": invoice_id}, {"$set": update_data})
    
    return {"message": f"Payment of ${amount:.2f} recorded", "balance_due": round(max(0, new_balance), 2)}


# ============ SETTINGS ENDPOINTS ============

@router.get("/settings")
async def get_settings():
    """Get RV settings"""
    return await get_rv_settings()

@router.put("/settings")
async def update_settings(settings: dict):
    """Update RV settings"""
    await db.admin_settings.update_one(
        {"type": "rv_settings"},
        {"$set": {**settings, "type": "rv_settings"}},
        upsert=True
    )
    return await get_rv_settings()


# ============ STATS ENDPOINTS ============

@router.get("/stats")
async def get_stats():
    """Get RV dashboard statistics"""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Count jobs by status
    active_jobs = await db.rv_jobs.count_documents({"status": {"$in": ["pending", "in_progress", "on_hold"]}})
    pending_estimates = await db.rv_estimates.count_documents({"status": {"$in": ["draft", "sent"]}})
    
    # Completed this month
    completed_this_month = await db.rv_jobs.count_documents({
        "status": "completed",
        "completed_at": {"$gte": month_start.isoformat()}
    })
    
    # Total revenue this month (from paid invoices)
    pipeline = [
        {"$match": {
            "status": "paid",
            "paid_at": {"$gte": month_start.isoformat()}
        }},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.rv_invoices.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "active_jobs": active_jobs,
        "pending_estimates": pending_estimates,
        "completed_this_month": completed_this_month,
        "total_revenue": round(total_revenue, 2)
    }


# ============ INVENTORY ENDPOINTS ============

@router.get("/inventory")
async def get_inventory(category: Optional[str] = None, low_stock_only: bool = False):
    """Get all inventory items"""
    query = {}
    if category:
        query["category"] = category
    
    items = await db.rv_inventory.find(query).sort("name", 1).to_list(1000)
    
    result = []
    for item in items:
        is_low_stock = item.get("quantity", 0) <= item.get("min_quantity", 5)
        if low_stock_only and not is_low_stock:
            continue
        result.append(InventoryItemResponse(
            id=str(item.get("id")),
            is_low_stock=is_low_stock,
            **{k: v for k, v in item.items() if k not in ["_id", "id", "is_low_stock"]}
        ))
    
    return result

@router.get("/inventory/{item_id}", response_model=InventoryItemResponse)
async def get_inventory_item(item_id: str):
    """Get single inventory item"""
    item = await db.rv_inventory.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    is_low_stock = item.get("quantity", 0) <= item.get("min_quantity", 5)
    return InventoryItemResponse(
        id=str(item.get("id")),
        is_low_stock=is_low_stock,
        **{k: v for k, v in item.items() if k not in ["_id", "id"]}
    )

@router.post("/inventory", response_model=InventoryItemResponse)
async def create_inventory_item(item: InventoryItemCreate):
    """Add new inventory item"""
    item_dict = item.model_dump()
    item_dict["id"] = str(uuid.uuid4())
    item_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    # Generate SKU if not provided
    if not item_dict.get("sku"):
        count = await db.rv_inventory.count_documents({})
        item_dict["sku"] = f"RV-{count + 1001}"
    
    await db.rv_inventory.insert_one(item_dict)
    item_dict.pop("_id", None)
    
    is_low_stock = item_dict.get("quantity", 0) <= item_dict.get("min_quantity", 5)
    return InventoryItemResponse(is_low_stock=is_low_stock, **item_dict)

@router.put("/inventory/{item_id}", response_model=InventoryItemResponse)
async def update_inventory_item(item_id: str, item: InventoryItemCreate):
    """Update inventory item"""
    update_data = item.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.rv_inventory.update_one({"id": item_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    updated = await db.rv_inventory.find_one({"id": item_id})
    is_low_stock = updated.get("quantity", 0) <= updated.get("min_quantity", 5)
    return InventoryItemResponse(
        id=str(updated.get("id")),
        is_low_stock=is_low_stock,
        **{k: v for k, v in updated.items() if k not in ["_id", "id"]}
    )

@router.put("/inventory/{item_id}/adjust")
async def adjust_inventory(item_id: str, quantity_change: int, reason: str = ""):
    """Adjust inventory quantity (positive or negative)"""
    item = await db.rv_inventory.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    new_quantity = item.get("quantity", 0) + quantity_change
    if new_quantity < 0:
        raise HTTPException(status_code=400, detail="Cannot have negative inventory")
    
    # Log the adjustment
    adjustment = {
        "id": str(uuid.uuid4()),
        "item_id": item_id,
        "previous_quantity": item.get("quantity", 0),
        "change": quantity_change,
        "new_quantity": new_quantity,
        "reason": reason,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.rv_inventory_adjustments.insert_one(adjustment)
    
    # Update the quantity
    await db.rv_inventory.update_one(
        {"id": item_id},
        {"$set": {"quantity": new_quantity, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": f"Quantity adjusted by {quantity_change}", "new_quantity": new_quantity}

@router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: str):
    """Delete inventory item"""
    result = await db.rv_inventory.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}


# ============ CALENDAR/SCHEDULE ENDPOINTS ============

@router.get("/calendar/events")
async def get_calendar_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    event_type: Optional[str] = None
):
    """Get calendar events within date range"""
    query = {}
    
    if start_date:
        query["start_datetime"] = {"$gte": start_date}
    if end_date:
        if "start_datetime" in query:
            query["start_datetime"]["$lte"] = end_date + "T23:59:59Z"
        else:
            query["start_datetime"] = {"$lte": end_date + "T23:59:59Z"}
    if event_type:
        query["event_type"] = event_type
    
    events = await db.rv_calendar.find(query).sort("start_datetime", 1).to_list(500)
    
    result = []
    for event in events:
        # Get job/estimate numbers if linked
        job_number = None
        estimate_number = None
        if event.get("job_id"):
            job = await db.rv_jobs.find_one({"id": event["job_id"]})
            if job:
                job_number = job.get("job_number")
        if event.get("estimate_id"):
            estimate = await db.rv_estimates.find_one({"id": event["estimate_id"]})
            if estimate:
                estimate_number = estimate.get("estimate_number")
        
        result.append(ScheduleEventResponse(
            id=str(event.get("id")),
            job_number=job_number,
            estimate_number=estimate_number,
            **{k: v for k, v in event.items() if k not in ["_id", "id"]}
        ))
    
    return result

@router.get("/calendar/events/{event_id}", response_model=ScheduleEventResponse)
async def get_calendar_event(event_id: str):
    """Get single calendar event"""
    event = await db.rv_calendar.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    job_number = None
    estimate_number = None
    if event.get("job_id"):
        job = await db.rv_jobs.find_one({"id": event["job_id"]})
        if job:
            job_number = job.get("job_number")
    if event.get("estimate_id"):
        estimate = await db.rv_estimates.find_one({"id": event["estimate_id"]})
        if estimate:
            estimate_number = estimate.get("estimate_number")
    
    return ScheduleEventResponse(
        id=str(event.get("id")),
        job_number=job_number,
        estimate_number=estimate_number,
        **{k: v for k, v in event.items() if k not in ["_id", "id"]}
    )

@router.post("/calendar/events", response_model=ScheduleEventResponse)
async def create_calendar_event(event: ScheduleEventCreate):
    """Create a new calendar event/scheduled appointment"""
    event_dict = event.model_dump()
    event_dict["id"] = str(uuid.uuid4())
    event_dict["status"] = "scheduled"
    event_dict["reminder_sent"] = False
    event_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    # Set default color based on event type
    if not event_dict.get("color"):
        colors = {
            "job": "#1e3a5f",
            "estimate_review": "#f59e0b",
            "pickup": "#10b981",
            "delivery": "#8b5cf6",
            "consultation": "#6366f1"
        }
        event_dict["color"] = colors.get(event_dict["event_type"], "#6b7280")
    
    await db.rv_calendar.insert_one(event_dict)
    event_dict.pop("_id", None)
    
    # Create reminders if enabled
    if event.send_customer_reminder and event.customer_email:
        await create_reminder(
            event_dict["id"],
            "customer",
            event.customer_email,
            event.customer_name or "Customer",
            event.start_datetime,
            event.reminder_hours_before,
            event_dict
        )
    
    if event.send_admin_reminder:
        # Get admin email from settings or use default
        settings = await get_rv_settings()
        admin_email = settings.get("notification_email", "admin@alabamapawnstorage.com")
        await create_reminder(
            event_dict["id"],
            "admin",
            admin_email,
            "Admin",
            event.start_datetime,
            event.reminder_hours_before,
            event_dict
        )
    
    return ScheduleEventResponse(**event_dict)

async def create_reminder(event_id: str, recipient_type: str, email: str, name: str, 
                          event_datetime: str, hours_before: int, event_data: dict):
    """Create a reminder for an event"""
    from datetime import timedelta
    
    event_dt = datetime.fromisoformat(event_datetime.replace("Z", "+00:00"))
    send_at = event_dt - timedelta(hours=hours_before)
    
    if recipient_type == "customer":
        subject = f"Reminder: Your RV Service Appointment"
        message = f"""
Hello {name},

This is a reminder about your upcoming RV service appointment:

Date & Time: {event_dt.strftime('%B %d, %Y at %I:%M %p')}
Service: {event_data.get('title', 'RV Service')}
{f"RV: {event_data.get('rv_info')}" if event_data.get('rv_info') else ""}

Location: Gingerkare Custom Emporium
7860 Eddins Road, Dothan, AL 36301

If you need to reschedule, please call us at (334) XXX-XXXX.

Thank you for choosing Gingerkare Custom Emporium!
"""
    else:
        subject = f"Admin Reminder: {event_data.get('title', 'Scheduled Event')}"
        message = f"""
Upcoming scheduled event:

Event: {event_data.get('title', 'RV Service')}
Customer: {event_data.get('customer_name', 'N/A')} - {event_data.get('customer_phone', 'N/A')}
Date & Time: {event_dt.strftime('%B %d, %Y at %I:%M %p')}
{f"RV: {event_data.get('rv_info')}" if event_data.get('rv_info') else ""}
{f"Notes: {event_data.get('notes')}" if event_data.get('notes') else ""}
"""
    
    reminder = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "recipient_type": recipient_type,
        "recipient_email": email,
        "recipient_name": name,
        "send_at": send_at.isoformat(),
        "subject": subject,
        "message": message,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.rv_reminders.insert_one(reminder)

@router.put("/calendar/events/{event_id}")
async def update_calendar_event(event_id: str, event: ScheduleEventCreate):
    """Update a calendar event"""
    update_data = event.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.rv_calendar.update_one({"id": event_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    updated = await db.rv_calendar.find_one({"id": event_id})
    return ScheduleEventResponse(**{**updated, "id": str(updated.get("id")), "_id": None})

@router.put("/calendar/events/{event_id}/status")
async def update_event_status(event_id: str, status: str):
    """Update event status"""
    result = await db.rv_calendar.update_one(
        {"id": event_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": f"Event status updated to {status}"}

@router.delete("/calendar/events/{event_id}")
async def delete_calendar_event(event_id: str):
    """Delete a calendar event"""
    result = await db.rv_calendar.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Also delete associated reminders
    await db.rv_reminders.delete_many({"event_id": event_id})
    
    return {"message": "Event deleted"}

@router.post("/jobs/{job_id}/schedule")
async def schedule_job(job_id: str, start_datetime: str, end_datetime: str, notes: Optional[str] = None):
    """Schedule a job on the calendar"""
    job = await db.rv_jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Create calendar event
    event = ScheduleEventCreate(
        title=f"{job['job_number']} - {job['customer']['name']}",
        job_id=job_id,
        customer_name=job["customer"].get("name"),
        customer_phone=job["customer"].get("phone"),
        customer_email=job["customer"].get("email"),
        rv_info=f"{job['rv'].get('year', '')} {job['rv'].get('make', '')} {job['rv'].get('model', '')}".strip(),
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        event_type="job",
        notes=notes
    )
    
    created_event = await create_calendar_event(event)
    
    # Update job with scheduled date
    await db.rv_jobs.update_one(
        {"id": job_id},
        {"$set": {"scheduled_date": start_datetime[:10], "calendar_event_id": created_event.id}}
    )
    
    return created_event

@router.post("/estimates/{estimate_id}/schedule-review")
async def schedule_estimate_review(estimate_id: str, start_datetime: str, end_datetime: str, notes: Optional[str] = None):
    """Schedule an estimate review appointment"""
    estimate = await db.rv_estimates.find_one({"id": estimate_id})
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")
    
    # Create calendar event
    event = ScheduleEventCreate(
        title=f"Estimate Review: {estimate['estimate_number']}",
        estimate_id=estimate_id,
        customer_name=estimate["customer"].get("name"),
        customer_phone=estimate["customer"].get("phone"),
        customer_email=estimate["customer"].get("email"),
        rv_info=f"{estimate['rv'].get('year', '')} {estimate['rv'].get('make', '')} {estimate['rv'].get('model', '')}".strip(),
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        event_type="estimate_review",
        notes=notes
    )
    
    return await create_calendar_event(event)


# ============ ESTIMATE TO INVOICE CONVERSION ============

@router.post("/estimates/{estimate_id}/create-invoice", response_model=InvoiceResponse)
async def create_invoice_from_estimate(estimate_id: str):
    """Create an invoice directly from an estimate (skipping job creation)"""
    estimate = await db.rv_estimates.find_one({"id": estimate_id})
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")
    
    # Create a job first (invoices are linked to jobs)
    job_dict = {
        "id": str(uuid.uuid4()),
        "job_number": await get_next_number("JOB", "rv_jobs"),
        "estimate_id": estimate_id,
        "customer": estimate["customer"],
        "rv": estimate["rv"],
        "services": estimate["services"],
        "notes": estimate.get("notes"),
        "discount_percent": estimate.get("discount_percent", 0),
        "tax_rate": estimate.get("tax_rate", 9),
        "subtotal": estimate["subtotal"],
        "discount_amount": estimate["discount_amount"],
        "tax_amount": estimate["tax_amount"],
        "total": estimate["total"],
        "status": "completed",  # Mark as completed since we're invoicing
        "priority": "normal",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.rv_jobs.insert_one(job_dict)
    
    # Create the invoice
    due_date = (datetime.now(timezone.utc) + __import__('datetime').timedelta(days=30)).isoformat()[:10]
    
    invoice_dict = {
        "id": str(uuid.uuid4()),
        "invoice_number": await get_next_number("INV", "rv_invoices"),
        "job_id": job_dict["id"],
        "job_number": job_dict["job_number"],
        "customer": estimate["customer"],
        "rv": estimate["rv"],
        "services": estimate["services"],
        "subtotal": estimate["subtotal"],
        "discount_amount": estimate["discount_amount"],
        "tax_amount": estimate["tax_amount"],
        "total": estimate["total"],
        "amount_paid": 0,
        "balance_due": estimate["total"],
        "status": "draft",
        "due_date": due_date,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.rv_invoices.insert_one(invoice_dict)
    
    # Update estimate status
    await db.rv_estimates.update_one(
        {"id": estimate_id},
        {"$set": {"status": "converted", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    invoice_dict.pop("_id", None)
    return InvoiceResponse(**invoice_dict)


# ============ PENDING REMINDERS CHECK ============

@router.get("/reminders/pending")
async def get_pending_reminders():
    """Get reminders that need to be sent (for background job processing)"""
    now = datetime.now(timezone.utc).isoformat()
    
    reminders = await db.rv_reminders.find({
        "status": "pending",
        "send_at": {"$lte": now}
    }).to_list(100)
    
    return [{**r, "id": str(r.get("id")), "_id": None} for r in reminders]

@router.put("/reminders/{reminder_id}/mark-sent")
async def mark_reminder_sent(reminder_id: str):
    """Mark a reminder as sent"""
    await db.rv_reminders.update_one(
        {"id": reminder_id},
        {"$set": {"status": "sent", "sent_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Reminder marked as sent"}
