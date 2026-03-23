"""
Peptides Extended Features Module
Handles: Payday/Title Loans, ATF Hold, Check Cashing, Layaways, LEADS Reporting,
Cash Drawers, Receipt Printers, and more
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, date, timedelta
from bson import ObjectId
from enum import Enum
import uuid
import random
import string

router = APIRouter(prefix="/pawn-extended", tags=["Peptides Extended Features"])

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


# ============ ENUMS ============

class LoanType(str, Enum):
    PAYDAY = "payday"
    TITLE = "title"
    PAWN = "pawn"

class ATFHoldStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    EXPIRED = "expired"

class LayawayStatus(str, Enum):
    ACTIVE = "active"
    PAID_OFF = "paid_off"
    DEFAULTED = "defaulted"
    CANCELLED = "cancelled"

class TransactionType(str, Enum):
    PAWN_LOAN = "pawn_loan"
    BUY_OUTRIGHT = "buy_outright"
    RESALE = "resale"
    PAYDAY_LOAN = "payday_loan"
    TITLE_LOAN = "title_loan"
    CHECK_CASH = "check_cash"
    LAYAWAY_PAYMENT = "layaway_payment"
    REDEMPTION = "redemption"
    INTEREST_PAYMENT = "interest_payment"


# ============ PAYDAY & TITLE LOANS MODELS ============

class PaydayLoanCreate(BaseModel):
    customer_id: str
    loan_amount: float
    pay_date: str  # Expected payback date
    employer_name: Optional[str] = None
    employer_phone: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None  # Last 4 digits
    check_number: Optional[str] = None
    fee_amount: Optional[float] = None  # If None, calculated from settings
    notes: Optional[str] = ""

class TitleLoanCreate(BaseModel):
    customer_id: str
    loan_amount: float
    vehicle_make: str
    vehicle_model: str
    vehicle_year: int
    vehicle_vin: str
    vehicle_color: Optional[str] = None
    vehicle_mileage: Optional[int] = None
    title_number: str
    lien_holder: Optional[str] = None
    interest_rate: Optional[float] = None
    loan_term_days: int = 30
    notes: Optional[str] = ""

class PaydayTitleLoanResponse(BaseModel):
    id: str
    loan_type: str
    customer_id: str
    customer_name: str
    loan_number: str
    loan_amount: float
    fee_amount: float
    total_due: float
    pay_date: str
    status: str
    created_at: str


# ============ ATF HOLD MODELS ============

class ATFHoldCreate(BaseModel):
    contract_id: str  # Related pawn or buy contract
    item_id: str
    firearm_type: str  # Handgun, Long Gun, Other
    firearm_make: str
    firearm_model: str
    firearm_caliber: str
    serial_number: str
    hold_start_date: str
    hold_days: int = 3  # Default 3-day hold for firearms
    notes: Optional[str] = ""

class ATFHoldResponse(BaseModel):
    id: str
    contract_id: str
    item_id: str
    firearm_type: str
    firearm_make: str
    firearm_model: str
    firearm_caliber: str
    serial_number: str
    hold_start_date: str
    hold_end_date: str
    status: str
    released_at: Optional[str] = None
    released_by: Optional[str] = None
    notes: Optional[str] = None


# ============ CHECK CASHING MODELS ============

class CheckCashCreate(BaseModel):
    customer_id: str
    check_type: str  # payroll, personal, government, money_order, cashiers
    check_amount: float
    check_maker: str  # Who wrote the check
    check_number: Optional[str] = None
    check_date: str
    bank_name: Optional[str] = None
    routing_number: Optional[str] = None  # Last 4
    fee_percentage: Optional[float] = None  # If None, use settings
    notes: Optional[str] = ""

class CheckCashResponse(BaseModel):
    id: str
    customer_id: str
    customer_name: str
    transaction_number: str
    check_type: str
    check_amount: float
    fee_amount: float
    cash_given: float
    check_maker: str
    status: str
    created_at: str


# ============ INVENTORY CATEGORY MODELS ============

class InventoryCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    parent_category_id: Optional[str] = None  # For subcategories
    interest_rate: Optional[float] = None  # Category-specific rate
    loan_term_days: Optional[int] = None
    requires_atf_hold: bool = False  # For firearms
    requires_serial: bool = False
    default_markup: float = 50.0  # Percentage markup for resale
    icon: Optional[str] = None
    color: Optional[str] = None
    order: int = 0
    is_active: bool = True

class InventoryCategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    parent_category_id: Optional[str] = None
    interest_rate: Optional[float] = None
    loan_term_days: Optional[int] = None
    requires_atf_hold: bool
    requires_serial: bool
    default_markup: float
    item_count: int = 0
    is_active: bool


# ============ LAYAWAY MODELS ============

class LayawayCreate(BaseModel):
    customer_id: str
    items: List[Dict[str, Any]]  # Items being put on layaway
    total_price: float
    down_payment: float
    payment_schedule: str = "weekly"  # weekly, biweekly, monthly
    number_of_payments: int = 4
    notes: Optional[str] = ""

class LayawayPaymentCreate(BaseModel):
    layaway_id: str
    amount: float
    payment_method: str = "cash"
    notes: Optional[str] = ""

class LayawayResponse(BaseModel):
    id: str
    layaway_number: str
    customer_id: str
    customer_name: str
    items: List[Dict[str, Any]]
    total_price: float
    down_payment: float
    amount_paid: float
    balance_due: float
    payment_schedule: str
    next_payment_date: str
    next_payment_amount: float
    status: str
    created_at: str


# ============ LEADS REPORTING MODELS ============

class LEADSReportCreate(BaseModel):
    report_date: str
    report_type: str  # daily, weekly, monthly
    transactions: List[Dict[str, Any]]
    submitted_by: str
    notes: Optional[str] = ""

class LEADSReportResponse(BaseModel):
    id: str
    report_number: str
    report_date: str
    report_type: str
    transaction_count: int
    status: str  # draft, submitted, confirmed
    submitted_at: Optional[str] = None
    submitted_by: Optional[str] = None


# ============ CASH DRAWER MODELS ============

class CashDrawerCreate(BaseModel):
    name: str
    location: Optional[str] = None
    assigned_user_id: Optional[str] = None

class CashDrawerSessionStart(BaseModel):
    drawer_id: str
    user_id: str
    opening_balance: float
    denominations: Dict[str, int] = {}  # {"$100": 5, "$50": 10, ...}

class CashDrawerSessionEnd(BaseModel):
    session_id: str
    closing_balance: float
    denominations: Dict[str, int] = {}
    notes: Optional[str] = ""

class CashDrawerTransaction(BaseModel):
    session_id: str
    transaction_type: str  # sale, pawn, redemption, payout, etc.
    amount: float
    reference_id: Optional[str] = None  # Contract/order ID
    notes: Optional[str] = ""


# ============ RECEIPT PRINTER MODELS ============

class ReceiptPrinterCreate(BaseModel):
    name: str
    printer_type: str  # thermal, impact, inkjet
    connection_type: str  # usb, network, bluetooth
    ip_address: Optional[str] = None
    port: Optional[int] = None
    location: str
    is_default: bool = False

class PrintReceiptRequest(BaseModel):
    printer_id: str
    receipt_type: str  # pawn, buy, layaway, check_cash, etc.
    transaction_id: str
    copies: int = 1


# ============ RESALE (BUY OUTRIGHT) MODELS ============

class ResalePurchaseCreate(BaseModel):
    customer_id: str
    items: List[Dict[str, Any]]
    total_purchase_amount: float  # Amount paid to seller
    payment_method: str = "cash"
    add_to_inventory: bool = True
    notes: Optional[str] = ""

class ResaleItemPricing(BaseModel):
    item_id: str
    purchase_price: float
    markup_percentage: float = 50.0
    selling_price: float
    condition_adjustment: float = 0.0  # Positive or negative adjustment


# ============ FEES CONFIGURATION MODELS ============

class FeeConfigCreate(BaseModel):
    fee_type: str  # storage, late, processing, check_cashing, etc.
    category: Optional[str] = None  # Category-specific fee
    fee_amount: Optional[float] = None  # Fixed amount
    fee_percentage: Optional[float] = None  # Percentage of transaction
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    description: Optional[str] = ""
    is_active: bool = True

class ProratedInterestConfig(BaseModel):
    enabled: bool = True
    calculation_method: str = "daily"  # daily, weekly
    minimum_days: int = 1
    round_to_nearest: float = 0.01  # Round to nearest cent


# ============ HELPER FUNCTIONS ============

def generate_number(prefix: str) -> str:
    """Generate a unique number with prefix"""
    timestamp = datetime.now().strftime("%y%m%d")
    random_part = ''.join(random.choices(string.digits, k=4))
    return f"{prefix}-{timestamp}-{random_part}"


# ============ PAYDAY & TITLE LOANS ENDPOINTS ============

@router.post("/loans/payday")
async def create_payday_loan(loan: PaydayLoanCreate):
    """Create a new payday loan"""
    # Get customer
    customer = await db.pawn_customers.find_one({"_id": ObjectId(loan.customer_id)})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get fee settings
    settings = await db.pawn_settings.find_one({"type": "payday_loan_settings"}) or {}
    fee_percentage = settings.get("fee_percentage", 15.0)  # Default 15%
    
    fee_amount = loan.fee_amount or round(loan.loan_amount * (fee_percentage / 100), 2)
    
    loan_data = {
        "id": str(uuid.uuid4()),
        "loan_type": "payday",
        "loan_number": generate_number("PDL"),
        "customer_id": loan.customer_id,
        "customer_name": f"{customer.get('first_name', '')} {customer.get('last_name', '')}",
        "loan_amount": loan.loan_amount,
        "fee_amount": fee_amount,
        "total_due": loan.loan_amount + fee_amount,
        "pay_date": loan.pay_date,
        "employer_name": loan.employer_name,
        "employer_phone": loan.employer_phone,
        "bank_name": loan.bank_name,
        "bank_account": loan.bank_account,
        "check_number": loan.check_number,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "notes": loan.notes
    }
    
    await db.pawn_loans.insert_one(loan_data)
    loan_data.pop("_id", None)
    return loan_data

@router.post("/loans/title")
async def create_title_loan(loan: TitleLoanCreate):
    """Create a new title loan"""
    customer = await db.pawn_customers.find_one({"_id": ObjectId(loan.customer_id)})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get settings for interest rate
    settings = await db.pawn_settings.find_one({"type": "title_loan_settings"}) or {}
    interest_rate = loan.interest_rate or settings.get("default_interest_rate", 25.0)
    
    loan_data = {
        "id": str(uuid.uuid4()),
        "loan_type": "title",
        "loan_number": generate_number("TTL"),
        "customer_id": loan.customer_id,
        "customer_name": f"{customer.get('first_name', '')} {customer.get('last_name', '')}",
        "loan_amount": loan.loan_amount,
        "interest_rate": interest_rate,
        "loan_term_days": loan.loan_term_days,
        "vehicle": {
            "make": loan.vehicle_make,
            "model": loan.vehicle_model,
            "year": loan.vehicle_year,
            "vin": loan.vehicle_vin,
            "color": loan.vehicle_color,
            "mileage": loan.vehicle_mileage,
            "title_number": loan.title_number,
            "lien_holder": loan.lien_holder
        },
        "due_date": (datetime.now() + timedelta(days=loan.loan_term_days)).strftime("%Y-%m-%d"),
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "notes": loan.notes
    }
    
    await db.pawn_loans.insert_one(loan_data)
    loan_data.pop("_id", None)
    return loan_data

@router.get("/loans")
async def get_loans(
    loan_type: Optional[str] = None,
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    limit: int = 50
):
    """Get all loans with optional filters"""
    query = {}
    if loan_type:
        query["loan_type"] = loan_type
    if status:
        query["status"] = status
    if customer_id:
        query["customer_id"] = customer_id
    
    loans = await db.pawn_loans.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [serialize_doc(loan) for loan in loans]

@router.get("/loans/{loan_id}")
async def get_loan(loan_id: str):
    """Get loan details"""
    loan = await db.pawn_loans.find_one({"id": loan_id})
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return serialize_doc(loan)

@router.put("/loans/{loan_id}/pay")
async def pay_off_loan(loan_id: str, amount: float, payment_method: str = "cash"):
    """Pay off or make payment on a loan"""
    loan = await db.pawn_loans.find_one({"id": loan_id})
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    payments = loan.get("payments", [])
    total_paid = sum(p.get("amount", 0) for p in payments) + amount
    
    payment = {
        "id": str(uuid.uuid4()),
        "amount": amount,
        "payment_method": payment_method,
        "paid_at": datetime.now(timezone.utc).isoformat()
    }
    
    update_data = {
        "$push": {"payments": payment},
        "$set": {"total_paid": total_paid}
    }
    
    if total_paid >= loan.get("total_due", 0):
        update_data["$set"]["status"] = "paid_off"
        update_data["$set"]["paid_off_date"] = datetime.now(timezone.utc).isoformat()
    
    await db.pawn_loans.update_one({"id": loan_id}, update_data)
    return {"success": True, "message": "Payment recorded", "total_paid": total_paid}


# ============ ATF HOLD ENDPOINTS ============

@router.post("/atf-holds")
async def create_atf_hold(hold: ATFHoldCreate):
    """Create an ATF hold for a firearm"""
    hold_data = hold.dict()
    hold_data["id"] = str(uuid.uuid4())
    hold_data["hold_number"] = generate_number("ATF")
    hold_data["status"] = "pending"
    
    # Calculate hold end date
    start_date = datetime.strptime(hold.hold_start_date, "%Y-%m-%d")
    end_date = start_date + timedelta(days=hold.hold_days)
    hold_data["hold_end_date"] = end_date.strftime("%Y-%m-%d")
    hold_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.atf_holds.insert_one(hold_data)
    hold_data.pop("_id", None)
    return hold_data

@router.get("/atf-holds")
async def get_atf_holds(status: Optional[str] = None, limit: int = 50):
    """Get all ATF holds"""
    query = {}
    if status:
        query["status"] = status
    
    holds = await db.atf_holds.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [serialize_doc(hold) for hold in holds]

@router.put("/atf-holds/{hold_id}/release")
async def release_atf_hold(hold_id: str, released_by: str):
    """Release an ATF hold (mark as approved)"""
    result = await db.atf_holds.update_one(
        {"id": hold_id},
        {"$set": {
            "status": "approved",
            "released_at": datetime.now(timezone.utc).isoformat(),
            "released_by": released_by
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Hold not found")
    return {"success": True, "message": "ATF hold released"}

@router.put("/atf-holds/{hold_id}/deny")
async def deny_atf_hold(hold_id: str, denied_by: str, reason: str = ""):
    """Deny an ATF hold"""
    result = await db.atf_holds.update_one(
        {"id": hold_id},
        {"$set": {
            "status": "denied",
            "denied_at": datetime.now(timezone.utc).isoformat(),
            "denied_by": denied_by,
            "denial_reason": reason
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Hold not found")
    return {"success": True, "message": "ATF hold denied"}


# ============ CHECK CASHING ENDPOINTS ============

@router.post("/check-cashing")
async def cash_check(check: CheckCashCreate):
    """Process a check cashing transaction"""
    customer = await db.pawn_customers.find_one({"_id": ObjectId(check.customer_id)})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get fee settings by check type
    settings = await db.pawn_settings.find_one({"type": "check_cashing_settings"}) or {}
    fee_rates = settings.get("fee_rates", {})
    
    default_fee = fee_rates.get(check.check_type, settings.get("default_fee_percentage", 3.0))
    fee_percentage = check.fee_percentage or default_fee
    
    fee_amount = round(check.check_amount * (fee_percentage / 100), 2)
    
    # Apply minimum fee if configured
    min_fee = settings.get("minimum_fee", 2.0)
    fee_amount = max(fee_amount, min_fee)
    
    cash_given = check.check_amount - fee_amount
    
    transaction = {
        "id": str(uuid.uuid4()),
        "transaction_number": generate_number("CHK"),
        "customer_id": check.customer_id,
        "customer_name": f"{customer.get('first_name', '')} {customer.get('last_name', '')}",
        "check_type": check.check_type,
        "check_amount": check.check_amount,
        "fee_percentage": fee_percentage,
        "fee_amount": fee_amount,
        "cash_given": cash_given,
        "check_maker": check.check_maker,
        "check_number": check.check_number,
        "check_date": check.check_date,
        "bank_name": check.bank_name,
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "notes": check.notes
    }
    
    await db.check_cashing.insert_one(transaction)
    transaction.pop("_id", None)
    return transaction

@router.get("/check-cashing")
async def get_check_transactions(
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 50
):
    """Get check cashing transactions"""
    query = {}
    if status:
        query["status"] = status
    if customer_id:
        query["customer_id"] = customer_id
    
    transactions = await db.check_cashing.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [serialize_doc(t) for t in transactions]


# ============ INVENTORY CATEGORIES ENDPOINTS ============

@router.post("/categories")
async def create_category(category: InventoryCategoryCreate):
    """Create an inventory category"""
    category_data = category.dict()
    category_data["id"] = str(uuid.uuid4())
    category_data["created_at"] = datetime.now(timezone.utc).isoformat()
    category_data["item_count"] = 0
    
    await db.inventory_categories.insert_one(category_data)
    category_data.pop("_id", None)
    return category_data

@router.get("/categories")
async def get_categories(include_inactive: bool = False):
    """Get all inventory categories"""
    query = {} if include_inactive else {"is_active": True}
    categories = await db.inventory_categories.find(query).sort("order", 1).to_list(100)
    return [serialize_doc(c) for c in categories]

@router.get("/categories/{category_id}")
async def get_category(category_id: str):
    """Get category details"""
    category = await db.inventory_categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return serialize_doc(category)

@router.put("/categories/{category_id}")
async def update_category(category_id: str, category: InventoryCategoryCreate):
    """Update an inventory category"""
    update_data = category.dict()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.inventory_categories.update_one(
        {"id": category_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True, "message": "Category updated"}

@router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    """Delete (deactivate) a category"""
    result = await db.inventory_categories.update_one(
        {"id": category_id},
        {"$set": {"is_active": False, "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True, "message": "Category deactivated"}


# ============ LAYAWAY ENDPOINTS ============

@router.post("/layaways")
async def create_layaway(layaway: LayawayCreate):
    """Create a new layaway"""
    customer = await db.pawn_customers.find_one({"_id": ObjectId(layaway.customer_id)})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    balance_after_down = layaway.total_price - layaway.down_payment
    payment_amount = round(balance_after_down / layaway.number_of_payments, 2)
    
    # Calculate next payment date based on schedule
    today = datetime.now()
    if layaway.payment_schedule == "weekly":
        next_payment = today + timedelta(days=7)
    elif layaway.payment_schedule == "biweekly":
        next_payment = today + timedelta(days=14)
    else:  # monthly
        next_payment = today + timedelta(days=30)
    
    layaway_data = {
        "id": str(uuid.uuid4()),
        "layaway_number": generate_number("LAY"),
        "customer_id": layaway.customer_id,
        "customer_name": f"{customer.get('first_name', '')} {customer.get('last_name', '')}",
        "items": layaway.items,
        "total_price": layaway.total_price,
        "down_payment": layaway.down_payment,
        "amount_paid": layaway.down_payment,
        "balance_due": balance_after_down,
        "payment_schedule": layaway.payment_schedule,
        "number_of_payments": layaway.number_of_payments,
        "payment_amount": payment_amount,
        "next_payment_date": next_payment.strftime("%Y-%m-%d"),
        "payments": [{
            "id": str(uuid.uuid4()),
            "amount": layaway.down_payment,
            "type": "down_payment",
            "paid_at": datetime.now(timezone.utc).isoformat()
        }],
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "notes": layaway.notes
    }
    
    await db.layaways.insert_one(layaway_data)
    layaway_data.pop("_id", None)
    return layaway_data

@router.post("/layaways/{layaway_id}/payment")
async def make_layaway_payment(layaway_id: str, payment: LayawayPaymentCreate):
    """Make a payment on a layaway"""
    layaway = await db.layaways.find_one({"id": layaway_id})
    if not layaway:
        raise HTTPException(status_code=404, detail="Layaway not found")
    
    new_amount_paid = layaway.get("amount_paid", 0) + payment.amount
    new_balance = layaway.get("total_price", 0) - new_amount_paid
    
    payment_data = {
        "id": str(uuid.uuid4()),
        "amount": payment.amount,
        "type": "payment",
        "payment_method": payment.payment_method,
        "paid_at": datetime.now(timezone.utc).isoformat(),
        "notes": payment.notes
    }
    
    # Calculate next payment date
    schedule = layaway.get("payment_schedule", "monthly")
    if schedule == "weekly":
        next_date = datetime.now() + timedelta(days=7)
    elif schedule == "biweekly":
        next_date = datetime.now() + timedelta(days=14)
    else:
        next_date = datetime.now() + timedelta(days=30)
    
    update_data = {
        "$push": {"payments": payment_data},
        "$set": {
            "amount_paid": new_amount_paid,
            "balance_due": max(0, new_balance),
            "next_payment_date": next_date.strftime("%Y-%m-%d")
        }
    }
    
    # Check if paid off
    if new_balance <= 0:
        update_data["$set"]["status"] = "paid_off"
        update_data["$set"]["paid_off_date"] = datetime.now(timezone.utc).isoformat()
    
    await db.layaways.update_one({"id": layaway_id}, update_data)
    return {"success": True, "amount_paid": new_amount_paid, "balance_due": max(0, new_balance)}

@router.get("/layaways")
async def get_layaways(
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    limit: int = 50
):
    """Get all layaways"""
    query = {}
    if status:
        query["status"] = status
    if customer_id:
        query["customer_id"] = customer_id
    
    layaways = await db.layaways.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [serialize_doc(l) for l in layaways]

@router.get("/layaways/{layaway_id}")
async def get_layaway(layaway_id: str):
    """Get layaway details"""
    layaway = await db.layaways.find_one({"id": layaway_id})
    if not layaway:
        raise HTTPException(status_code=404, detail="Layaway not found")
    return serialize_doc(layaway)


# ============ LEADS REPORTING ENDPOINTS ============

@router.post("/leads-reports")
async def create_leads_report(report: LEADSReportCreate):
    """Create a LEADS report"""
    report_data = report.dict()
    report_data["id"] = str(uuid.uuid4())
    report_data["report_number"] = generate_number("LEADS")
    report_data["transaction_count"] = len(report.transactions)
    report_data["status"] = "draft"
    report_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.leads_reports.insert_one(report_data)
    report_data.pop("_id", None)
    return report_data

@router.get("/leads-reports")
async def get_leads_reports(status: Optional[str] = None, limit: int = 50):
    """Get all LEADS reports"""
    query = {}
    if status:
        query["status"] = status
    
    reports = await db.leads_reports.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [serialize_doc(r) for r in reports]

@router.put("/leads-reports/{report_id}/submit")
async def submit_leads_report(report_id: str, submitted_by: str):
    """Mark a LEADS report as submitted"""
    result = await db.leads_reports.update_one(
        {"id": report_id},
        {"$set": {
            "status": "submitted",
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "submitted_by": submitted_by
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True, "message": "LEADS report marked as submitted"}

@router.get("/leads-reports/generate")
async def generate_leads_report(
    start_date: str,
    end_date: str,
    report_type: str = "daily"
):
    """Generate LEADS report data for a date range"""
    # Get all pawn and buy transactions in date range
    query = {
        "created_at": {
            "$gte": f"{start_date}T00:00:00",
            "$lte": f"{end_date}T23:59:59"
        }
    }
    
    contracts = await db.pawn_contracts.find(query).to_list(1000)
    
    report_items = []
    for contract in contracts:
        for item in contract.get("items", []):
            report_items.append({
                "contract_number": contract.get("contract_number"),
                "transaction_type": contract.get("contract_type"),
                "customer_name": contract.get("customer_name"),
                "item_description": item.get("description"),
                "serial_number": item.get("serial_number"),
                "brand": item.get("brand"),
                "model": item.get("model"),
                "category": item.get("category"),
                "transaction_date": contract.get("created_at"),
                "amount": contract.get("loan_amount") or contract.get("purchase_amount")
            })
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "report_type": report_type,
        "transaction_count": len(report_items),
        "transactions": report_items
    }


# ============ CASH DRAWER ENDPOINTS ============

@router.post("/cash-drawers")
async def create_cash_drawer(drawer: CashDrawerCreate):
    """Create a new cash drawer"""
    drawer_data = drawer.dict()
    drawer_data["id"] = str(uuid.uuid4())
    drawer_data["created_at"] = datetime.now(timezone.utc).isoformat()
    drawer_data["status"] = "closed"
    drawer_data["current_session_id"] = None
    
    await db.cash_drawers.insert_one(drawer_data)
    drawer_data.pop("_id", None)
    return drawer_data

@router.get("/cash-drawers")
async def get_cash_drawers():
    """Get all cash drawers"""
    drawers = await db.cash_drawers.find({}).to_list(50)
    return [serialize_doc(d) for d in drawers]

@router.post("/cash-drawers/sessions/start")
async def start_drawer_session(session: CashDrawerSessionStart):
    """Start a cash drawer session (opening count)"""
    session_data = {
        "id": str(uuid.uuid4()),
        "drawer_id": session.drawer_id,
        "user_id": session.user_id,
        "opening_balance": session.opening_balance,
        "opening_denominations": session.denominations,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "transactions": [],
        "status": "open"
    }
    
    await db.cash_drawer_sessions.insert_one(session_data)
    
    # Update drawer status
    await db.cash_drawers.update_one(
        {"id": session.drawer_id},
        {"$set": {"status": "open", "current_session_id": session_data["id"]}}
    )
    
    session_data.pop("_id", None)
    return session_data

@router.post("/cash-drawers/sessions/end")
async def end_drawer_session(session: CashDrawerSessionEnd):
    """End a cash drawer session (closing count)"""
    existing_session = await db.cash_drawer_sessions.find_one({"id": session.session_id})
    if not existing_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Calculate expected vs actual
    transactions = existing_session.get("transactions", [])
    total_in = sum(t.get("amount", 0) for t in transactions if t.get("amount", 0) > 0)
    total_out = abs(sum(t.get("amount", 0) for t in transactions if t.get("amount", 0) < 0))
    expected_balance = existing_session.get("opening_balance", 0) + total_in - total_out
    difference = session.closing_balance - expected_balance
    
    update_data = {
        "closing_balance": session.closing_balance,
        "closing_denominations": session.denominations,
        "ended_at": datetime.now(timezone.utc).isoformat(),
        "expected_balance": expected_balance,
        "difference": difference,
        "status": "closed",
        "notes": session.notes
    }
    
    await db.cash_drawer_sessions.update_one(
        {"id": session.session_id},
        {"$set": update_data}
    )
    
    # Update drawer status
    await db.cash_drawers.update_one(
        {"id": existing_session.get("drawer_id")},
        {"$set": {"status": "closed", "current_session_id": None}}
    )
    
    return {
        "success": True,
        "expected_balance": expected_balance,
        "actual_balance": session.closing_balance,
        "difference": difference
    }

@router.post("/cash-drawers/sessions/transaction")
async def record_drawer_transaction(transaction: CashDrawerTransaction):
    """Record a transaction in the current drawer session"""
    transaction_data = {
        "id": str(uuid.uuid4()),
        "type": transaction.transaction_type,
        "amount": transaction.amount,
        "reference_id": transaction.reference_id,
        "notes": transaction.notes,
        "recorded_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.cash_drawer_sessions.update_one(
        {"id": transaction.session_id, "status": "open"},
        {"$push": {"transactions": transaction_data}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Session not found or already closed")
    
    return {"success": True, "transaction_id": transaction_data["id"]}


# ============ RECEIPT PRINTER ENDPOINTS ============

@router.post("/printers")
async def create_printer(printer: ReceiptPrinterCreate):
    """Add a receipt printer configuration"""
    printer_data = printer.dict()
    printer_data["id"] = str(uuid.uuid4())
    printer_data["created_at"] = datetime.now(timezone.utc).isoformat()
    printer_data["status"] = "active"
    
    # If this is default, unset other defaults
    if printer.is_default:
        await db.receipt_printers.update_many(
            {"location": printer.location},
            {"$set": {"is_default": False}}
        )
    
    await db.receipt_printers.insert_one(printer_data)
    printer_data.pop("_id", None)
    return printer_data

@router.get("/printers")
async def get_printers(location: Optional[str] = None):
    """Get all configured printers"""
    query = {}
    if location:
        query["location"] = location
    
    printers = await db.receipt_printers.find(query).to_list(50)
    return [serialize_doc(p) for p in printers]

@router.delete("/printers/{printer_id}")
async def delete_printer(printer_id: str):
    """Delete a printer configuration"""
    result = await db.receipt_printers.delete_one({"id": printer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Printer not found")
    return {"success": True, "message": "Printer removed"}


# ============ RESALE (BUY OUTRIGHT) ENDPOINTS ============

@router.post("/resale")
async def create_resale_purchase(purchase: ResalePurchaseCreate):
    """Create a buy outright / resale purchase"""
    customer = await db.pawn_customers.find_one({"_id": ObjectId(purchase.customer_id)})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    transaction = {
        "id": str(uuid.uuid4()),
        "transaction_number": generate_number("BUY"),
        "transaction_type": "buy_outright",
        "customer_id": purchase.customer_id,
        "customer_name": f"{customer.get('first_name', '')} {customer.get('last_name', '')}",
        "items": purchase.items,
        "total_purchase_amount": purchase.total_purchase_amount,
        "payment_method": purchase.payment_method,
        "added_to_inventory": purchase.add_to_inventory,
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "notes": purchase.notes
    }
    
    await db.resale_purchases.insert_one(transaction)
    
    # Add items to inventory if requested
    if purchase.add_to_inventory:
        for item in purchase.items:
            inventory_item = {
                "id": str(uuid.uuid4()),
                "source_transaction_id": transaction["id"],
                "source_type": "buy_outright",
                "purchase_price": item.get("purchase_price", purchase.total_purchase_amount / len(purchase.items)),
                **item,
                "status": "available",
                "added_at": datetime.now(timezone.utc).isoformat()
            }
            await db.pawn_inventory.insert_one(inventory_item)
    
    transaction.pop("_id", None)
    return transaction

@router.get("/resale")
async def get_resale_purchases(
    customer_id: Optional[str] = None,
    start_date: Optional[str] = None,
    limit: int = 50
):
    """Get resale/buy purchases"""
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    
    purchases = await db.resale_purchases.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [serialize_doc(p) for p in purchases]


# ============ FEES CONFIGURATION ENDPOINTS ============

@router.post("/fees")
async def create_fee_config(fee: FeeConfigCreate):
    """Create a fee configuration"""
    fee_data = fee.dict()
    fee_data["id"] = str(uuid.uuid4())
    fee_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.fee_configurations.insert_one(fee_data)
    fee_data.pop("_id", None)
    return fee_data

@router.get("/fees")
async def get_fee_configs(fee_type: Optional[str] = None, category: Optional[str] = None):
    """Get fee configurations"""
    query = {"is_active": True}
    if fee_type:
        query["fee_type"] = fee_type
    if category:
        query["category"] = category
    
    fees = await db.fee_configurations.find(query).to_list(100)
    return [serialize_doc(f) for f in fees]

@router.put("/fees/{fee_id}")
async def update_fee_config(fee_id: str, fee: FeeConfigCreate):
    """Update a fee configuration"""
    update_data = fee.dict()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.fee_configurations.update_one(
        {"id": fee_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Fee config not found")
    return {"success": True, "message": "Fee configuration updated"}


# ============ PRORATED INTEREST ENDPOINTS ============

@router.get("/prorated-interest/settings")
async def get_prorated_interest_settings():
    """Get prorated interest settings"""
    settings = await db.pawn_settings.find_one({"type": "prorated_interest"})
    if not settings:
        return {
            "enabled": False,
            "calculation_method": "daily",
            "minimum_days": 1,
            "round_to_nearest": 0.01
        }
    return serialize_doc(settings)

@router.post("/prorated-interest/settings")
async def update_prorated_interest_settings(settings: ProratedInterestConfig):
    """Update prorated interest settings"""
    settings_data = settings.dict()
    settings_data["type"] = "prorated_interest"
    settings_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.pawn_settings.update_one(
        {"type": "prorated_interest"},
        {"$set": settings_data},
        upsert=True
    )
    return {"success": True, "message": "Prorated interest settings updated"}

@router.get("/prorated-interest/calculate")
async def calculate_prorated_interest(
    principal: float,
    annual_rate: float,
    days: int
):
    """Calculate prorated interest for a given period"""
    settings = await db.pawn_settings.find_one({"type": "prorated_interest"}) or {}
    
    method = settings.get("calculation_method", "daily")
    min_days = settings.get("minimum_days", 1)
    round_to = settings.get("round_to_nearest", 0.01)
    
    actual_days = max(days, min_days)
    
    if method == "daily":
        daily_rate = annual_rate / 365 / 100
        interest = principal * daily_rate * actual_days
    else:  # weekly
        weekly_rate = annual_rate / 52 / 100
        weeks = actual_days / 7
        interest = principal * weekly_rate * weeks
    
    # Round to nearest
    interest = round(interest / round_to) * round_to
    
    return {
        "principal": principal,
        "annual_rate": annual_rate,
        "days": actual_days,
        "calculation_method": method,
        "interest": round(interest, 2),
        "total_due": round(principal + interest, 2)
    }


# ============ SETTINGS ENDPOINTS ============

@router.get("/settings/payday-loans")
async def get_payday_loan_settings():
    """Get payday loan settings"""
    settings = await db.pawn_settings.find_one({"type": "payday_loan_settings"})
    if not settings:
        return {
            "fee_percentage": 15.0,
            "max_loan_amount": 500.0,
            "min_loan_amount": 50.0,
            "require_employer_verification": False,
            "require_bank_account": True
        }
    return serialize_doc(settings)

@router.post("/settings/payday-loans")
async def update_payday_loan_settings(settings: Dict[str, Any]):
    """Update payday loan settings"""
    settings["type"] = "payday_loan_settings"
    settings["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.pawn_settings.update_one(
        {"type": "payday_loan_settings"},
        {"$set": settings},
        upsert=True
    )
    return {"success": True, "message": "Payday loan settings updated"}

@router.get("/settings/title-loans")
async def get_title_loan_settings():
    """Get title loan settings"""
    settings = await db.pawn_settings.find_one({"type": "title_loan_settings"})
    if not settings:
        return {
            "default_interest_rate": 25.0,
            "max_loan_to_value": 50.0,  # 50% of vehicle value
            "min_loan_amount": 500.0,
            "max_loan_amount": 10000.0,
            "default_term_days": 30
        }
    return serialize_doc(settings)

@router.post("/settings/title-loans")
async def update_title_loan_settings(settings: Dict[str, Any]):
    """Update title loan settings"""
    settings["type"] = "title_loan_settings"
    settings["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.pawn_settings.update_one(
        {"type": "title_loan_settings"},
        {"$set": settings},
        upsert=True
    )
    return {"success": True, "message": "Title loan settings updated"}

@router.get("/settings/check-cashing")
async def get_check_cashing_settings():
    """Get check cashing settings"""
    settings = await db.pawn_settings.find_one({"type": "check_cashing_settings"})
    if not settings:
        return {
            "default_fee_percentage": 3.0,
            "minimum_fee": 2.0,
            "fee_rates": {
                "payroll": 2.0,
                "personal": 5.0,
                "government": 1.0,
                "money_order": 1.5,
                "cashiers": 1.0
            },
            "max_check_amount": 5000.0,
            "require_id": True
        }
    return serialize_doc(settings)

@router.post("/settings/check-cashing")
async def update_check_cashing_settings(settings: Dict[str, Any]):
    """Update check cashing settings"""
    settings["type"] = "check_cashing_settings"
    settings["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.pawn_settings.update_one(
        {"type": "check_cashing_settings"},
        {"$set": settings},
        upsert=True
    )
    return {"success": True, "message": "Check cashing settings updated"}

@router.get("/settings/layaway")
async def get_layaway_settings():
    """Get layaway settings"""
    settings = await db.pawn_settings.find_one({"type": "layaway_settings"})
    if not settings:
        return {
            "min_down_payment_percentage": 10.0,
            "max_term_weeks": 12,
            "cancellation_fee_percentage": 10.0,
            "restocking_fee_percentage": 15.0,
            "allow_partial_pickup": False,
            "grace_period_days": 7
        }
    return serialize_doc(settings)

@router.post("/settings/layaway")
async def update_layaway_settings(settings: Dict[str, Any]):
    """Update layaway settings"""
    settings["type"] = "layaway_settings"
    settings["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.pawn_settings.update_one(
        {"type": "layaway_settings"},
        {"$set": settings},
        upsert=True
    )
    return {"success": True, "message": "Layaway settings updated"}
