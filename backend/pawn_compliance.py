"""
Peptides Compliance & Operations Module
Handles: Price Labels/Barcodes, Driver License Scanning, Electronic Gun Log,
LEADS Automation, Internal Knowledge Base, Employee Acknowledgments
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import uuid
import base64
import io
import re

# Barcode generation
import barcode
from barcode.writer import ImageWriter

router = APIRouter(prefix="/pawn-compliance", tags=["Peptides Compliance & Operations"])

# Database reference
db = None

def set_database(database):
    global db
    db = database

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
        if isinstance(value, ObjectId):
            doc[key] = str(value)
    return doc


# ============ PRICE LABEL / BARCODE MODELS ============

class LabelTemplate(BaseModel):
    name: str
    width_mm: float = 50.0  # Label width in mm
    height_mm: float = 25.0  # Label height in mm
    barcode_type: str = "code128"  # code128, code39, ean13, upc
    include_price: bool = True
    include_description: bool = True
    include_sku: bool = True
    include_date: bool = False
    font_size: int = 10
    is_default: bool = False

class LabelPrintRequest(BaseModel):
    item_id: str
    sku: str
    description: str
    price: float
    quantity: int = 1
    template_id: Optional[str] = None

class BarcodeGenerateRequest(BaseModel):
    data: str  # The data to encode
    barcode_type: str = "code128"
    width: int = 300
    height: int = 100


# ============ DRIVER LICENSE SCAN MODELS ============

class DriverLicenseData(BaseModel):
    """Parsed driver license data"""
    raw_data: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    license_number: Optional[str] = None
    date_of_birth: Optional[str] = None
    expiration_date: Optional[str] = None
    gender: Optional[str] = None
    eye_color: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    issue_date: Optional[str] = None

class DLScanSettings(BaseModel):
    auto_create_customer: bool = True
    require_valid_license: bool = True
    check_expiration: bool = True
    scanner_type: str = "barcode"  # barcode, ocr, manual


# ============ ELECTRONIC GUN LOG MODELS ============

class GunLogEntry(BaseModel):
    """ATF Acquisition & Disposition Record (A&D Book)"""
    transaction_type: str  # acquisition, disposition
    transaction_date: str
    
    # Firearm details
    manufacturer: str
    importer: Optional[str] = None
    model: str
    serial_number: str
    firearm_type: str  # handgun, rifle, shotgun, other
    caliber_gauge: str
    
    # Acquisition details (for acquisitions)
    acquired_from_name: Optional[str] = None
    acquired_from_address: Optional[str] = None
    acquired_from_license: Optional[str] = None  # FFL number if dealer
    
    # Disposition details (for dispositions)
    disposed_to_name: Optional[str] = None
    disposed_to_address: Optional[str] = None
    disposed_to_license: Optional[str] = None
    disposed_to_dob: Optional[str] = None
    nics_transaction_number: Optional[str] = None  # NICS check number
    form_4473_number: Optional[str] = None
    
    # Internal reference
    contract_id: Optional[str] = None
    pawn_ticket: Optional[str] = None
    notes: Optional[str] = ""

class GunLogEntryResponse(GunLogEntry):
    id: str
    entry_number: int  # Sequential A&D book entry number
    created_at: str
    created_by: str


# ============ LEADS AUTOMATION MODELS ============

class LEADSAutoConfig(BaseModel):
    enabled: bool = False
    report_frequency: str = "daily"  # daily, weekly, monthly
    report_time: str = "23:00"  # Time to generate report
    include_pawns: bool = True
    include_buys: bool = True
    include_sales: bool = False
    email_report: bool = False
    email_recipients: List[str] = []
    auto_submit: bool = False  # Whether to auto-submit or just generate
    
class LEADSTransactionRecord(BaseModel):
    """Standard LEADS transaction format"""
    transaction_id: str
    transaction_type: str
    transaction_date: str
    
    # Customer info
    customer_last_name: str
    customer_first_name: str
    customer_middle_name: Optional[str] = None
    customer_dob: str
    customer_gender: str
    customer_race: Optional[str] = None
    customer_height: Optional[str] = None
    customer_weight: Optional[str] = None
    customer_eye_color: Optional[str] = None
    customer_hair_color: Optional[str] = None
    customer_address: str
    customer_city: str
    customer_state: str
    customer_zip: str
    customer_dl_number: str
    customer_dl_state: str
    
    # Item info
    item_category: str
    item_description: str
    item_serial_number: Optional[str] = None
    item_brand: Optional[str] = None
    item_model: Optional[str] = None
    item_color: Optional[str] = None
    item_value: float


# ============ INTERNAL KNOWLEDGE BASE MODELS ============

class InternalArticle(BaseModel):
    title: str
    content: str  # HTML/Markdown
    category: str  # policies, procedures, compliance, training, legal, operations
    tags: List[str] = []
    access_level: str = "all"  # all, admin, super_admin
    requires_acknowledgment: bool = False
    version: str = "1.0"
    effective_date: Optional[str] = None
    review_date: Optional[str] = None
    author: Optional[str] = None
    is_published: bool = True
    order: int = 0

class InternalArticleResponse(InternalArticle):
    id: str
    created_at: str
    updated_at: Optional[str] = None
    acknowledgment_count: int = 0
    view_count: int = 0


# ============ EMPLOYEE ACKNOWLEDGMENT MODELS ============

class AcknowledgmentForm(BaseModel):
    title: str
    description: str
    content: str  # The full text to acknowledge
    form_type: str  # policy, handbook, training, safety, compliance
    is_required: bool = True
    requires_signature: bool = True
    expires_after_days: Optional[int] = None  # 0 = never expires
    reminder_days_before: int = 7
    is_active: bool = True

class AcknowledgmentFormResponse(AcknowledgmentForm):
    id: str
    created_at: str
    total_required: int = 0
    total_signed: int = 0

class EmployeeAcknowledgment(BaseModel):
    form_id: str
    employee_id: str
    employee_name: str
    signature_data: Optional[str] = None  # Base64 signature image
    signature_typed: Optional[str] = None  # Typed signature
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    notes: Optional[str] = ""

class EmployeeAcknowledgmentResponse(EmployeeAcknowledgment):
    id: str
    acknowledged_at: str
    expires_at: Optional[str] = None
    is_valid: bool = True


# ============ HELPER FUNCTIONS ============

def generate_number(prefix: str) -> str:
    """Generate a unique number with prefix"""
    timestamp = datetime.now().strftime("%y%m%d")
    random_part = ''.join([str(uuid.uuid4().int % 10) for _ in range(4)])
    return f"{prefix}-{timestamp}-{random_part}"

def parse_dl_barcode(raw_data: str) -> Dict[str, Any]:
    """
    Parse AAMVA standard driver license barcode data.
    Most US licenses use PDF417 barcode with AAMVA format.
    """
    parsed = {
        "raw_data": raw_data,
        "first_name": None,
        "last_name": None,
        "middle_name": None,
        "address": None,
        "city": None,
        "state": None,
        "zip_code": None,
        "license_number": None,
        "date_of_birth": None,
        "expiration_date": None,
        "gender": None,
        "eye_color": None,
        "height": None,
        "weight": None,
        "issue_date": None
    }
    
    # AAMVA data element identifiers
    # Format: DAA = Full Name, DCS = Last Name, DAC = First Name, etc.
    patterns = {
        "DCS": "last_name",
        "DCT": "first_name",  # Alternative
        "DAC": "first_name",
        "DAD": "middle_name",
        "DAG": "address",
        "DAI": "city",
        "DAJ": "state",
        "DAK": "zip_code",
        "DAQ": "license_number",
        "DBB": "date_of_birth",
        "DBA": "expiration_date",
        "DBC": "gender",
        "DAY": "eye_color",
        "DAU": "height",
        "DAW": "weight",
        "DBD": "issue_date"
    }
    
    # Try to parse AAMVA format
    for code, field in patterns.items():
        pattern = rf"{code}([^\n\r]+)"
        match = re.search(pattern, raw_data)
        if match:
            value = match.group(1).strip()
            # Format dates from MMDDYYYY to YYYY-MM-DD
            if field in ["date_of_birth", "expiration_date", "issue_date"] and len(value) == 8:
                try:
                    parsed[field] = f"{value[4:8]}-{value[0:2]}-{value[2:4]}"
                except:
                    parsed[field] = value
            # Format gender
            elif field == "gender":
                parsed[field] = "M" if value == "1" else "F" if value == "2" else value
            else:
                parsed[field] = value
    
    return parsed


# ============ BARCODE / PRICE LABEL ENDPOINTS ============

@router.post("/labels/generate-barcode")
async def generate_barcode_image(request: BarcodeGenerateRequest):
    """Generate a barcode image and return as base64"""
    try:
        # Get barcode class
        barcode_class = barcode.get_barcode_class(request.barcode_type)
        
        # Create barcode
        ean = barcode_class(request.data, writer=ImageWriter())
        
        # Write to bytes buffer
        buffer = io.BytesIO()
        ean.write(buffer, options={
            "write_text": True,
            "module_width": 0.3,
            "module_height": 10,
            "font_size": 8,
            "text_distance": 3,
            "quiet_zone": 2
        })
        buffer.seek(0)
        
        # Return as base64
        image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return {
            "barcode_type": request.barcode_type,
            "data": request.data,
            "image_base64": image_base64,
            "mime_type": "image/png"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate barcode: {str(e)}")

@router.get("/labels/barcode/{data}")
async def get_barcode_image(data: str, barcode_type: str = "code128"):
    """Get barcode as image file"""
    try:
        barcode_class = barcode.get_barcode_class(barcode_type)
        ean = barcode_class(data, writer=ImageWriter())
        
        buffer = io.BytesIO()
        ean.write(buffer, options={
            "write_text": True,
            "module_width": 0.3,
            "module_height": 15,
            "font_size": 10,
            "text_distance": 5,
            "quiet_zone": 3
        })
        buffer.seek(0)
        
        return StreamingResponse(buffer, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate barcode: {str(e)}")

@router.post("/labels/templates")
async def create_label_template(template: LabelTemplate):
    """Create a label template"""
    template_data = template.dict()
    template_data["id"] = str(uuid.uuid4())
    template_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    # If default, unset other defaults
    if template.is_default:
        await db.label_templates.update_many({}, {"$set": {"is_default": False}})
    
    await db.label_templates.insert_one(template_data)
    template_data.pop("_id", None)
    return template_data

@router.get("/labels/templates")
async def get_label_templates():
    """Get all label templates"""
    templates = await db.label_templates.find({}).to_list(50)
    return [serialize_doc(t) for t in templates]

@router.post("/labels/print")
async def generate_print_label(request: LabelPrintRequest):
    """Generate label data for printing"""
    # Get template if specified
    template = None
    if request.template_id:
        template = await db.label_templates.find_one({"id": request.template_id})
    else:
        template = await db.label_templates.find_one({"is_default": True})
    
    if not template:
        template = LabelTemplate(name="Default").dict()
    
    # Generate barcode
    barcode_type = template.get("barcode_type", "code128")
    barcode_class = barcode.get_barcode_class(barcode_type)
    ean = barcode_class(request.sku, writer=ImageWriter())
    
    buffer = io.BytesIO()
    ean.write(buffer)
    buffer.seek(0)
    barcode_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    return {
        "sku": request.sku,
        "description": request.description,
        "price": request.price,
        "price_formatted": f"${request.price:.2f}",
        "quantity": request.quantity,
        "barcode_image": barcode_base64,
        "barcode_type": barcode_type,
        "template": template,
        "print_date": datetime.now().strftime("%m/%d/%Y")
    }


# ============ DRIVER LICENSE SCAN ENDPOINTS ============

@router.post("/dl-scan/parse")
async def parse_driver_license(raw_data: str = Form(...)):
    """Parse scanned driver license barcode data"""
    parsed = parse_dl_barcode(raw_data)
    return DriverLicenseData(**parsed)

@router.post("/dl-scan/create-customer")
async def create_customer_from_dl(dl_data: DriverLicenseData):
    """Create a pawn customer from driver license data"""
    # Check if customer already exists
    if dl_data.license_number:
        existing = await db.pawn_customers.find_one({
            "drivers_license": dl_data.license_number.upper()
        })
        if existing:
            return {
                "id": str(existing["_id"]),
                "message": "Customer already exists",
                "existing": True,
                "customer": serialize_doc(existing)
            }
    
    # Create new customer
    customer_data = {
        "first_name": dl_data.first_name or "",
        "last_name": dl_data.last_name or "",
        "middle_name": dl_data.middle_name or "",
        "drivers_license": (dl_data.license_number or "").upper(),
        "dl_state": dl_data.state or "AL",
        "address": dl_data.address or "",
        "city": dl_data.city or "",
        "state": dl_data.state or "AL",
        "zip_code": dl_data.zip_code or "",
        "date_of_birth": dl_data.date_of_birth,
        "gender": dl_data.gender,
        "eye_color": dl_data.eye_color,
        "height": dl_data.height,
        "weight": dl_data.weight,
        "dl_expiration": dl_data.expiration_date,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "total_contracts": 0,
        "active_contracts": 0,
        "total_loaned": 0,
        "total_paid": 0,
        "source": "dl_scan"
    }
    
    result = await db.pawn_customers.insert_one(customer_data)
    customer_data["id"] = str(result.inserted_id)
    customer_data.pop("_id", None)
    
    return {
        "id": customer_data["id"],
        "message": "Customer created from DL scan",
        "existing": False,
        "customer": customer_data
    }

@router.get("/dl-scan/settings")
async def get_dl_scan_settings():
    """Get driver license scan settings"""
    settings = await db.pawn_settings.find_one({"type": "dl_scan_settings"})
    if not settings:
        return DLScanSettings().dict()
    return serialize_doc(settings)

@router.post("/dl-scan/settings")
async def update_dl_scan_settings(settings: DLScanSettings):
    """Update driver license scan settings"""
    settings_data = settings.dict()
    settings_data["type"] = "dl_scan_settings"
    settings_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.pawn_settings.update_one(
        {"type": "dl_scan_settings"},
        {"$set": settings_data},
        upsert=True
    )
    return {"success": True, "message": "DL scan settings updated"}


# ============ ELECTRONIC GUN LOG ENDPOINTS ============

@router.post("/gun-log")
async def create_gun_log_entry(entry: GunLogEntry, created_by: str = "Admin"):
    """Create an entry in the electronic gun log (A&D Book)"""
    # Get next entry number
    last_entry = await db.gun_log.find_one(sort=[("entry_number", -1)])
    next_number = (last_entry.get("entry_number", 0) if last_entry else 0) + 1
    
    entry_data = entry.dict()
    entry_data["id"] = str(uuid.uuid4())
    entry_data["entry_number"] = next_number
    entry_data["created_at"] = datetime.now(timezone.utc).isoformat()
    entry_data["created_by"] = created_by
    
    await db.gun_log.insert_one(entry_data)
    entry_data.pop("_id", None)
    return entry_data

@router.get("/gun-log")
async def get_gun_log(
    transaction_type: Optional[str] = None,
    serial_number: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100
):
    """Get gun log entries with optional filters"""
    query = {}
    if transaction_type:
        query["transaction_type"] = transaction_type
    if serial_number:
        query["serial_number"] = {"$regex": serial_number, "$options": "i"}
    if start_date:
        query["transaction_date"] = {"$gte": start_date}
    if end_date:
        if "transaction_date" in query:
            query["transaction_date"]["$lte"] = end_date
        else:
            query["transaction_date"] = {"$lte": end_date}
    
    entries = await db.gun_log.find(query).sort("entry_number", -1).limit(limit).to_list(limit)
    return [serialize_doc(e) for e in entries]

@router.get("/gun-log/{entry_id}")
async def get_gun_log_entry(entry_id: str):
    """Get a specific gun log entry"""
    entry = await db.gun_log.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return serialize_doc(entry)

@router.get("/gun-log/search/serial/{serial}")
async def search_gun_by_serial(serial: str):
    """Search gun log by serial number - for ATF compliance"""
    entries = await db.gun_log.find({
        "serial_number": {"$regex": serial, "$options": "i"}
    }).sort("entry_number", -1).to_list(100)
    return [serialize_doc(e) for e in entries]

@router.get("/gun-log/report/current-inventory")
async def get_gun_inventory_report():
    """Generate current firearms inventory from A&D book"""
    # Get all acquisitions and dispositions
    pipeline = [
        {"$group": {
            "_id": "$serial_number",
            "acquisitions": {
                "$sum": {"$cond": [{"$eq": ["$transaction_type", "acquisition"]}, 1, 0]}
            },
            "dispositions": {
                "$sum": {"$cond": [{"$eq": ["$transaction_type", "disposition"]}, 1, 0]}
            },
            "last_entry": {"$last": "$$ROOT"}
        }},
        {"$match": {
            "$expr": {"$gt": ["$acquisitions", "$dispositions"]}
        }},
        {"$sort": {"last_entry.entry_number": 1}}
    ]
    
    results = await db.gun_log.aggregate(pipeline).to_list(1000)
    
    inventory = []
    for item in results:
        last = item.get("last_entry", {})
        inventory.append({
            "serial_number": item["_id"],
            "manufacturer": last.get("manufacturer"),
            "model": last.get("model"),
            "firearm_type": last.get("firearm_type"),
            "caliber_gauge": last.get("caliber_gauge"),
            "acquisition_date": last.get("transaction_date"),
            "entry_number": last.get("entry_number")
        })
    
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_firearms": len(inventory),
        "inventory": inventory
    }


# ============ LEADS AUTOMATION ENDPOINTS ============

@router.get("/leads/config")
async def get_leads_auto_config():
    """Get LEADS automation configuration"""
    config = await db.pawn_settings.find_one({"type": "leads_auto_config"})
    if not config:
        return LEADSAutoConfig().dict()
    return serialize_doc(config)

@router.post("/leads/config")
async def update_leads_auto_config(config: LEADSAutoConfig):
    """Update LEADS automation configuration"""
    config_data = config.dict()
    config_data["type"] = "leads_auto_config"
    config_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.pawn_settings.update_one(
        {"type": "leads_auto_config"},
        {"$set": config_data},
        upsert=True
    )
    return {"success": True, "message": "LEADS automation config updated"}

@router.post("/leads/auto-generate")
async def auto_generate_leads_report(date: Optional[str] = None):
    """Auto-generate LEADS report for a specific date or today"""
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    
    # Get all pawn and buy transactions for the date
    query = {
        "created_at": {
            "$gte": f"{target_date}T00:00:00",
            "$lte": f"{target_date}T23:59:59"
        }
    }
    
    contracts = await db.pawn_contracts.find(query).to_list(1000)
    
    transactions = []
    for contract in contracts:
        customer = await db.pawn_customers.find_one({"_id": ObjectId(contract.get("customer_id"))})
        
        for item in contract.get("items", []):
            tx = LEADSTransactionRecord(
                transaction_id=contract.get("contract_number", ""),
                transaction_type=contract.get("contract_type", "pawn"),
                transaction_date=contract.get("created_at", "")[:10],
                customer_last_name=customer.get("last_name", "") if customer else "",
                customer_first_name=customer.get("first_name", "") if customer else "",
                customer_middle_name=customer.get("middle_name"),
                customer_dob=customer.get("date_of_birth", ""),
                customer_gender=customer.get("gender", "U"),
                customer_address=customer.get("address", ""),
                customer_city=customer.get("city", ""),
                customer_state=customer.get("state", "AL"),
                customer_zip=customer.get("zip_code", ""),
                customer_dl_number=customer.get("drivers_license", ""),
                customer_dl_state=customer.get("dl_state", "AL"),
                item_category=item.get("category", "Other"),
                item_description=item.get("description", ""),
                item_serial_number=item.get("serial_number"),
                item_brand=item.get("brand"),
                item_model=item.get("model"),
                item_color=item.get("color"),
                item_value=item.get("loan_value", 0)
            )
            transactions.append(tx.dict())
    
    # Create report record
    report_data = {
        "id": str(uuid.uuid4()),
        "report_number": f"LEADS-{target_date.replace('-', '')}",
        "report_date": target_date,
        "report_type": "auto",
        "transactions": transactions,
        "transaction_count": len(transactions),
        "status": "generated",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generated_by": "system"
    }
    
    await db.leads_reports.insert_one(report_data)
    report_data.pop("_id", None)
    
    return report_data

@router.get("/leads/export/{report_id}")
async def export_leads_report(report_id: str, format: str = "csv"):
    """Export LEADS report in various formats"""
    report = await db.leads_reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if format == "csv":
        # Generate CSV
        import csv
        output = io.StringIO()
        
        if report.get("transactions"):
            fieldnames = list(report["transactions"][0].keys())
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            for tx in report["transactions"]:
                writer.writerow(tx)
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=LEADS_{report['report_date']}.csv"}
        )
    
    return report


# ============ INTERNAL KNOWLEDGE BASE ENDPOINTS ============

@router.post("/knowledge")
async def create_internal_article(article: InternalArticle, created_by: str = "Admin"):
    """Create an internal knowledge base article"""
    article_data = article.dict()
    article_data["id"] = str(uuid.uuid4())
    article_data["created_at"] = datetime.now(timezone.utc).isoformat()
    article_data["created_by"] = created_by
    article_data["acknowledgment_count"] = 0
    article_data["view_count"] = 0
    
    await db.internal_knowledge.insert_one(article_data)
    article_data.pop("_id", None)
    return article_data

@router.get("/knowledge")
async def get_internal_articles(
    category: Optional[str] = None,
    access_level: Optional[str] = None,
    requires_acknowledgment: Optional[bool] = None
):
    """Get internal knowledge base articles"""
    query = {"is_published": True}
    if category:
        query["category"] = category
    if access_level:
        query["access_level"] = access_level
    if requires_acknowledgment is not None:
        query["requires_acknowledgment"] = requires_acknowledgment
    
    articles = await db.internal_knowledge.find(query).sort("order", 1).to_list(100)
    return [serialize_doc(a) for a in articles]

@router.get("/knowledge/{article_id}")
async def get_internal_article(article_id: str, user_id: Optional[str] = None):
    """Get a specific internal article and increment view count"""
    article = await db.internal_knowledge.find_one({"id": article_id})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Increment view count
    await db.internal_knowledge.update_one(
        {"id": article_id},
        {"$inc": {"view_count": 1}}
    )
    
    result = serialize_doc(article)
    result["view_count"] = result.get("view_count", 0) + 1
    
    # Check if user has acknowledged (if requires_acknowledgment)
    if user_id and article.get("requires_acknowledgment"):
        ack = await db.article_acknowledgments.find_one({
            "article_id": article_id,
            "employee_id": user_id
        })
        result["user_acknowledged"] = ack is not None
    
    return result

@router.put("/knowledge/{article_id}")
async def update_internal_article(article_id: str, article: InternalArticle):
    """Update an internal knowledge base article"""
    update_data = article.dict()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.internal_knowledge.update_one(
        {"id": article_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"success": True, "message": "Article updated"}

@router.delete("/knowledge/{article_id}")
async def delete_internal_article(article_id: str):
    """Delete (unpublish) an internal article"""
    result = await db.internal_knowledge.update_one(
        {"id": article_id},
        {"$set": {"is_published": False, "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"success": True, "message": "Article deleted"}

@router.get("/knowledge/categories/list")
async def get_knowledge_categories():
    """Get list of knowledge base categories"""
    return [
        {"value": "policies", "label": "Company Policies"},
        {"value": "procedures", "label": "Standard Procedures"},
        {"value": "compliance", "label": "Compliance & Legal"},
        {"value": "training", "label": "Training Materials"},
        {"value": "operations", "label": "Operations"},
        {"value": "safety", "label": "Safety & Security"},
        {"value": "hr", "label": "Human Resources"},
        {"value": "it", "label": "IT & Technology"}
    ]


# ============ EMPLOYEE ACKNOWLEDGMENT ENDPOINTS ============

@router.post("/acknowledgments/forms")
async def create_acknowledgment_form(form: AcknowledgmentForm):
    """Create an acknowledgment form"""
    form_data = form.dict()
    form_data["id"] = str(uuid.uuid4())
    form_data["created_at"] = datetime.now(timezone.utc).isoformat()
    form_data["total_required"] = 0
    form_data["total_signed"] = 0
    
    await db.acknowledgment_forms.insert_one(form_data)
    form_data.pop("_id", None)
    return form_data

@router.get("/acknowledgments/forms")
async def get_acknowledgment_forms(active_only: bool = True):
    """Get all acknowledgment forms"""
    query = {"is_active": True} if active_only else {}
    forms = await db.acknowledgment_forms.find(query).to_list(100)
    
    # Get signature counts
    for form in forms:
        count = await db.employee_acknowledgments.count_documents({"form_id": form.get("id")})
        form["total_signed"] = count
    
    return [serialize_doc(f) for f in forms]

@router.get("/acknowledgments/forms/{form_id}")
async def get_acknowledgment_form(form_id: str):
    """Get a specific acknowledgment form"""
    form = await db.acknowledgment_forms.find_one({"id": form_id})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return serialize_doc(form)

@router.put("/acknowledgments/forms/{form_id}")
async def update_acknowledgment_form(form_id: str, form: AcknowledgmentForm):
    """Update an acknowledgment form"""
    update_data = form.dict()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.acknowledgment_forms.update_one(
        {"id": form_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Form not found")
    return {"success": True, "message": "Form updated"}

@router.post("/acknowledgments/sign")
async def sign_acknowledgment(ack: EmployeeAcknowledgment):
    """Record an employee signing an acknowledgment"""
    # Check if already signed
    existing = await db.employee_acknowledgments.find_one({
        "form_id": ack.form_id,
        "employee_id": ack.employee_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already acknowledged this form")
    
    # Get form for expiration calculation
    form = await db.acknowledgment_forms.find_one({"id": ack.form_id})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    ack_data = ack.dict()
    ack_data["id"] = str(uuid.uuid4())
    ack_data["acknowledged_at"] = datetime.now(timezone.utc).isoformat()
    ack_data["is_valid"] = True
    
    # Calculate expiration if applicable
    if form.get("expires_after_days"):
        expiry_date = datetime.now(timezone.utc) + timedelta(days=form["expires_after_days"])
        ack_data["expires_at"] = expiry_date.isoformat()
    
    await db.employee_acknowledgments.insert_one(ack_data)
    ack_data.pop("_id", None)
    
    # Update form signature count
    await db.acknowledgment_forms.update_one(
        {"id": ack.form_id},
        {"$inc": {"total_signed": 1}}
    )
    
    return ack_data

@router.get("/acknowledgments/employee/{employee_id}")
async def get_employee_acknowledgments(employee_id: str):
    """Get all acknowledgments for an employee"""
    acks = await db.employee_acknowledgments.find({"employee_id": employee_id}).to_list(100)
    
    result = []
    for ack in acks:
        form = await db.acknowledgment_forms.find_one({"id": ack.get("form_id")})
        ack_data = serialize_doc(ack)
        ack_data["form_title"] = form.get("title") if form else "Unknown"
        ack_data["form_type"] = form.get("form_type") if form else "unknown"
        result.append(ack_data)
    
    return result

@router.get("/acknowledgments/pending/{employee_id}")
async def get_pending_acknowledgments(employee_id: str):
    """Get forms that an employee hasn't signed yet"""
    # Get all active required forms
    forms = await db.acknowledgment_forms.find({
        "is_active": True,
        "is_required": True
    }).to_list(100)
    
    # Get employee's existing acknowledgments
    signed = await db.employee_acknowledgments.find({
        "employee_id": employee_id
    }).to_list(100)
    signed_form_ids = {s.get("form_id") for s in signed}
    
    # Filter to pending
    pending = [serialize_doc(f) for f in forms if f.get("id") not in signed_form_ids]
    return pending

@router.get("/acknowledgments/report")
async def get_acknowledgment_report():
    """Get acknowledgment compliance report"""
    forms = await db.acknowledgment_forms.find({"is_active": True}).to_list(100)
    employees = await db.employees.find({"status": "active"}).to_list(100)
    
    report = []
    for form in forms:
        acks = await db.employee_acknowledgments.find({"form_id": form.get("id")}).to_list(1000)
        signed_employee_ids = {a.get("employee_id") for a in acks}
        
        report.append({
            "form_id": form.get("id"),
            "form_title": form.get("title"),
            "form_type": form.get("form_type"),
            "total_employees": len(employees),
            "total_signed": len(acks),
            "compliance_rate": round(len(acks) / len(employees) * 100, 1) if employees else 0,
            "unsigned_employees": [
                e.get("name") for e in employees 
                if str(e.get("_id")) not in signed_employee_ids
            ][:10]  # Limit to first 10
        })
    
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_employees": len(employees),
        "forms": report
    }
