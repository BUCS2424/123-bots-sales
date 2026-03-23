"""
Peptides Contracts Module
Handles peptide loans, buy transactions, payments, and customer portal
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import uuid
import random
import string

router = APIRouter(prefix="/pawn-contracts", tags=["Peptides Contracts"])

# Database reference
db = None

def set_database(database):
    global db
    db = database

# ============ MODELS ============

class PeptidesCustomerCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = ""
    phone: str
    address: str = ""
    city: str = ""
    state: str = "AL"
    zip_code: str = ""
    drivers_license: str  # Required for pawn
    dl_state: str = "AL"
    dl_expiration: Optional[str] = None
    date_of_birth: Optional[str] = None

class PeptidesCustomerResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    phone: str
    address: str
    city: str
    state: str
    zip_code: str
    drivers_license: str
    dl_state: str
    total_contracts: int = 0
    active_contracts: int = 0
    created_at: datetime

class PeptidesItemCreate(BaseModel):
    description: str
    category: str
    brand: Optional[str] = ""
    model: Optional[str] = ""
    serial_number: Optional[str] = ""
    condition: str = "Good"  # Excellent, Good, Fair, Poor
    color: Optional[str] = ""
    notes: Optional[str] = ""
    images: List[str] = []
    estimated_value: float = 0  # Appraised value

class PeptidesContractCreate(BaseModel):
    customer_id: str
    items: List[PeptidesItemCreate]
    loan_amount: float
    interest_rate: Optional[float] = None  # If None, will use settings
    loan_term_days: Optional[int] = None  # If None, will use settings
    notes: Optional[str] = ""

class BuyContractCreate(BaseModel):
    customer_id: str
    items: List[PeptidesItemCreate]
    purchase_amount: float  # Amount paid to customer
    add_to_inventory: bool = True
    notes: Optional[str] = ""

class PaymentCreate(BaseModel):
    contract_id: str
    amount: float
    payment_method: str = "cash"  # cash, card, online
    notes: Optional[str] = ""

class CustomerLookup(BaseModel):
    drivers_license: str
    last_name: str

class CustomerRegister(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    drivers_license: str
    dl_state: str = "AL"
    password: str  # For online portal access
    address: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = "AL"
    zip_code: Optional[str] = ""
    date_of_birth: Optional[str] = None

# ============ HELPERS ============

def generate_contract_number(prefix="PWN"):
    """Generate unique contract number"""
    timestamp = datetime.now().strftime("%y%m%d")
    random_part = ''.join(random.choices(string.digits, k=4))
    return f"{prefix}-{timestamp}-{random_part}"

def generate_ticket_number():
    """Generate pawn ticket number"""
    return ''.join(random.choices(string.digits, k=8))

def calculate_payoff(loan_amount: float, interest_rate: float, days_elapsed: int, loan_term_days: int) -> dict:
    """Calculate current payoff amount with interest"""
    # Monthly interest rate
    monthly_rate = interest_rate / 100
    
    # Calculate periods (each period is the loan term, typically 30 days)
    periods = max(1, (days_elapsed // loan_term_days) + 1)
    
    # Simple interest calculation
    interest_amount = loan_amount * monthly_rate * periods
    total_payoff = loan_amount + interest_amount
    
    return {
        "principal": loan_amount,
        "interest_rate": interest_rate,
        "periods": periods,
        "interest_amount": round(interest_amount, 2),
        "total_payoff": round(total_payoff, 2)
    }

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    # Handle datetime serialization
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
    return doc

def ensure_tz_aware(dt):
    """Ensure datetime is timezone-aware (UTC)"""
    if dt is None:
        return datetime.now(timezone.utc)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

async def get_interest_rate_for_category(category: str):
    """Get interest rate and loan term for a category from settings"""
    settings = await db.pawn_settings.find_one({"type": "pawn_config"})
    
    if settings and settings.get("category_rates"):
        for rate in settings["category_rates"]:
            if rate["category"].lower() == category.lower():
                return {
                    "interest_rate": rate["interest_rate"],
                    "loan_term_days": rate.get("loan_term_days", 30)
                }
    
    # Return default rates
    default_rate = settings.get("default_interest_rate", 20.0) if settings else 20.0
    default_term = settings.get("default_loan_term_days", 30) if settings else 30
    
    return {
        "interest_rate": default_rate,
        "loan_term_days": default_term
    }

async def get_pawn_settings():
    """Get peptides settings from database"""
    settings = await db.pawn_settings.find_one({"type": "pawn_config"})
    if not settings:
        return {
            "default_interest_rate": 20.0,
            "default_loan_term_days": 30,
            "grace_period_days": 30
        }
    return settings

# ============ CUSTOMER ROUTES ============

@router.post("/customers")
async def create_customer(customer: PeptidesCustomerCreate):
    """Create a new pawn customer"""
    # Check if customer exists by DL
    existing = await db.pawn_customers.find_one({
        "drivers_license": customer.drivers_license.upper()
    })
    
    if existing:
        return {"id": str(existing["_id"]), "message": "Customer already exists", "existing": True}
    
    customer_data = customer.dict()
    customer_data["drivers_license"] = customer_data["drivers_license"].upper()
    customer_data["created_at"] = datetime.now(timezone.utc)
    customer_data["updated_at"] = datetime.now(timezone.utc)
    customer_data["total_contracts"] = 0
    customer_data["active_contracts"] = 0
    customer_data["total_loaned"] = 0
    customer_data["total_paid"] = 0
    
    result = await db.pawn_customers.insert_one(customer_data)
    
    return {"id": str(result.inserted_id), "message": "Customer created", "existing": False}

@router.get("/customers/search")
async def search_customers(q: str = "", limit: int = 20):
    """Search customers by name, phone, or DL"""
    if not q:
        cursor = db.pawn_customers.find({}).sort("created_at", -1).limit(limit)
    else:
        query = {"$or": [
            {"first_name": {"$regex": q, "$options": "i"}},
            {"last_name": {"$regex": q, "$options": "i"}},
            {"phone": {"$regex": q, "$options": "i"}},
            {"drivers_license": {"$regex": q.upper(), "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}}
        ]}
        cursor = db.pawn_customers.find(query).limit(limit)
    
    customers = []
    async for customer in cursor:
        customers.append(serialize_doc(customer))
    
    return customers

@router.get("/customers/{customer_id}")
async def get_customer(customer_id: str):
    """Get customer details with their contracts"""
    customer = await db.pawn_customers.find_one({"_id": ObjectId(customer_id)})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get customer's contracts
    contracts_cursor = db.pawn_contracts.find({"customer_id": customer_id}).sort("created_at", -1)
    contracts = []
    async for contract in contracts_cursor:
        contracts.append(serialize_doc(contract))
    
    customer_data = serialize_doc(customer)
    customer_data["contracts"] = contracts
    
    return customer_data

@router.put("/customers/{customer_id}")
async def update_customer(customer_id: str, customer: PeptidesCustomerCreate):
    """Update customer information"""
    update_data = customer.dict()
    update_data["drivers_license"] = update_data["drivers_license"].upper()
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.pawn_customers.update_one(
        {"_id": ObjectId(customer_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return {"success": True, "message": "Customer updated"}

# ============ PAWN CONTRACT ROUTES ============

@router.post("/pawn")
async def create_pawn_contract(contract: PeptidesContractCreate):
    """Create a new peptide contract (loan)"""
    # Verify customer exists
    customer = await db.pawn_customers.find_one({"_id": ObjectId(contract.customer_id)})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    contract_number = generate_contract_number("PWN")
    ticket_number = generate_ticket_number()
    
    # Get interest rate from settings if not provided
    # Use the first item's category for rate lookup
    primary_category = contract.items[0].category if contract.items else "Other"
    rate_settings = await get_interest_rate_for_category(primary_category)
    
    interest_rate = contract.interest_rate if contract.interest_rate is not None else rate_settings["interest_rate"]
    loan_term_days = contract.loan_term_days if contract.loan_term_days is not None else rate_settings["loan_term_days"]
    
    now = datetime.now(timezone.utc)
    due_date = now + timedelta(days=loan_term_days)
    
    # Calculate initial payoff
    payoff = calculate_payoff(contract.loan_amount, interest_rate, 0, loan_term_days)
    
    contract_data = {
        "contract_number": contract_number,
        "ticket_number": ticket_number,
        "type": "pawn",
        "customer_id": contract.customer_id,
        "customer_name": f"{customer['first_name']} {customer['last_name']}",
        "customer_dl": customer["drivers_license"],
        "items": [item.dict() for item in contract.items],
        "loan_amount": contract.loan_amount,
        "interest_rate": interest_rate,
        "loan_term_days": loan_term_days,
        "category": primary_category,
        "current_payoff": payoff["total_payoff"],
        "amount_paid": 0,
        "balance_due": payoff["total_payoff"],
        "status": "active",  # active, paid, defaulted, extended
        "created_at": now,
        "due_date": due_date,
        "last_payment_date": None,
        "paid_date": None,
        "default_date": None,
        "payments": [],
        "notes": contract.notes,
        "created_by": "admin"
    }
    
    result = await db.pawn_contracts.insert_one(contract_data)
    contract_id = str(result.inserted_id)
    
    # Update customer stats
    await db.pawn_customers.update_one(
        {"_id": ObjectId(contract.customer_id)},
        {
            "$inc": {
                "total_contracts": 1,
                "active_contracts": 1,
                "total_loaned": contract.loan_amount
            },
            "$set": {"updated_at": now}
        }
    )
    
    return {
        "success": True,
        "contract_id": contract_id,
        "contract_number": contract_number,
        "ticket_number": ticket_number,
        "loan_amount": contract.loan_amount,
        "due_date": due_date.isoformat(),
        "payoff_amount": payoff["total_payoff"]
    }

@router.get("/pawn")
async def get_pawn_contracts(
    status: str = "",
    customer_id: str = "",
    limit: int = 50
):
    """Get peptide contracts with optional filtering"""
    query = {"type": "pawn"}
    
    if status:
        query["status"] = status
    if customer_id:
        query["customer_id"] = customer_id
    
    cursor = db.pawn_contracts.find(query).sort("created_at", -1).limit(limit)
    
    contracts = []
    async for contract in cursor:
        # Recalculate current payoff based on elapsed time
        if contract["status"] == "active":
            days_elapsed = (datetime.now(timezone.utc) - ensure_tz_aware(contract["created_at"])).days
            payoff = calculate_payoff(
                contract["loan_amount"],
                contract["interest_rate"],
                days_elapsed,
                contract["loan_term_days"]
            )
            contract["current_payoff"] = payoff["total_payoff"]
            contract["balance_due"] = payoff["total_payoff"] - contract["amount_paid"]
            contract["interest_accrued"] = payoff["interest_amount"]
        
        contracts.append(serialize_doc(contract))
    
    return contracts

@router.get("/pawn/{contract_id}")
async def get_pawn_contract(contract_id: str):
    """Get a specific peptide contract"""
    contract = await db.pawn_contracts.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Recalculate payoff
    if contract["status"] == "active":
        days_elapsed = (datetime.now(timezone.utc) - ensure_tz_aware(contract["created_at"])).days
        payoff = calculate_payoff(
            contract["loan_amount"],
            contract["interest_rate"],
            days_elapsed,
            contract["loan_term_days"]
        )
        contract["current_payoff"] = payoff["total_payoff"]
        contract["balance_due"] = payoff["total_payoff"] - contract["amount_paid"]
        contract["interest_accrued"] = payoff["interest_amount"]
        contract["payoff_details"] = payoff
    
    return serialize_doc(contract)

# ============ BUY CONTRACT ROUTES ============

@router.post("/buy")
async def create_buy_contract(contract: BuyContractCreate):
    """Create a buy contract (shop buys from customer)"""
    # Verify customer exists
    customer = await db.pawn_customers.find_one({"_id": ObjectId(contract.customer_id)})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    contract_number = generate_contract_number("BUY")
    now = datetime.now(timezone.utc)
    
    contract_data = {
        "contract_number": contract_number,
        "type": "buy",
        "customer_id": contract.customer_id,
        "customer_name": f"{customer['first_name']} {customer['last_name']}",
        "customer_dl": customer["drivers_license"],
        "items": [item.dict() for item in contract.items],
        "purchase_amount": contract.purchase_amount,
        "status": "completed",
        "created_at": now,
        "notes": contract.notes,
        "created_by": "admin",
        "added_to_inventory": contract.add_to_inventory
    }
    
    result = await db.pawn_contracts.insert_one(contract_data)
    contract_id = str(result.inserted_id)
    
    # Add items to inventory if requested
    if contract.add_to_inventory:
        for item in contract.items:
            product_data = {
                "name": item.description,
                "description": f"Purchased from customer. {item.notes or ''}",
                "category": item.category,
                "brand": item.brand or "",
                "price": item.estimated_value if item.estimated_value > 0 else contract.purchase_amount / len(contract.items),
                "cost_price": contract.purchase_amount / len(contract.items),
                "condition": item.condition,
                "in_stock": True,
                "quantity": 1,
                "sku": f"BUY-{contract_number}-{random.randint(100,999)}",
                "serial_number": item.serial_number,
                "images": item.images,
                "source": "buy_contract",
                "source_contract": contract_number,
                "location": "123Bots",
                "created_at": now,
                "updated_at": now
            }
            await db.products.insert_one(product_data)
    
    # Update customer stats
    await db.pawn_customers.update_one(
        {"_id": ObjectId(contract.customer_id)},
        {
            "$inc": {"total_contracts": 1},
            "$set": {"updated_at": now}
        }
    )
    
    return {
        "success": True,
        "contract_id": contract_id,
        "contract_number": contract_number,
        "purchase_amount": contract.purchase_amount,
        "items_added": len(contract.items) if contract.add_to_inventory else 0
    }

@router.get("/buy")
async def get_buy_contracts(customer_id: str = "", limit: int = 50):
    """Get buy contracts"""
    query = {"type": "buy"}
    if customer_id:
        query["customer_id"] = customer_id
    
    cursor = db.pawn_contracts.find(query).sort("created_at", -1).limit(limit)
    
    contracts = []
    async for contract in cursor:
        contracts.append(serialize_doc(contract))
    
    return contracts

# ============ PAYMENT ROUTES ============

@router.post("/payments")
async def make_payment(payment: PaymentCreate):
    """Make a payment on a peptide contract"""
    contract = await db.pawn_contracts.find_one({"_id": ObjectId(payment.contract_id)})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract["status"] != "active":
        raise HTTPException(status_code=400, detail=f"Contract is {contract['status']}, cannot accept payment")
    
    now = datetime.now(timezone.utc)
    
    # Recalculate current payoff
    days_elapsed = (now - ensure_tz_aware(contract["created_at"])).days
    payoff = calculate_payoff(
        contract["loan_amount"],
        contract["interest_rate"],
        days_elapsed,
        contract["loan_term_days"]
    )
    
    current_balance = payoff["total_payoff"] - contract["amount_paid"]
    new_amount_paid = contract["amount_paid"] + payment.amount
    new_balance = payoff["total_payoff"] - new_amount_paid
    
    # Create payment record
    payment_record = {
        "id": str(uuid.uuid4()),
        "amount": payment.amount,
        "method": payment.payment_method,
        "date": now,
        "balance_before": current_balance,
        "balance_after": max(0, new_balance),
        "notes": payment.notes
    }
    
    # Determine new status
    new_status = "active"
    paid_date = None
    if new_balance <= 0:
        new_status = "paid"
        paid_date = now
    
    # Update contract
    update_data = {
        "$push": {"payments": payment_record},
        "$set": {
            "amount_paid": new_amount_paid,
            "balance_due": max(0, new_balance),
            "current_payoff": payoff["total_payoff"],
            "status": new_status,
            "last_payment_date": now
        }
    }
    
    if paid_date:
        update_data["$set"]["paid_date"] = paid_date
        # Decrease active contracts for customer
        await db.pawn_customers.update_one(
            {"_id": ObjectId(contract["customer_id"])},
            {
                "$inc": {"active_contracts": -1, "total_paid": payment.amount},
                "$set": {"updated_at": now}
            }
        )
    else:
        await db.pawn_customers.update_one(
            {"_id": ObjectId(contract["customer_id"])},
            {
                "$inc": {"total_paid": payment.amount},
                "$set": {"updated_at": now}
            }
        )
    
    await db.pawn_contracts.update_one(
        {"_id": ObjectId(payment.contract_id)},
        update_data
    )
    
    return {
        "success": True,
        "payment_id": payment_record["id"],
        "amount_paid": payment.amount,
        "previous_balance": round(current_balance, 2),
        "new_balance": round(max(0, new_balance), 2),
        "status": new_status,
        "fully_paid": new_status == "paid"
    }

@router.get("/payments/{contract_id}")
async def get_payment_history(contract_id: str):
    """Get payment history for a contract"""
    contract = await db.pawn_contracts.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    return {
        "contract_number": contract["contract_number"],
        "loan_amount": contract["loan_amount"],
        "total_paid": contract["amount_paid"],
        "balance_due": contract.get("balance_due", 0),
        "status": contract["status"],
        "payments": contract.get("payments", [])
    }

# ============ CUSTOMER PORTAL ROUTES (PUBLIC) ============

@router.post("/portal/register")
async def portal_register(customer: CustomerRegister):
    """Register a customer for online portal access"""
    import bcrypt
    
    # Check if DL already registered
    existing = await db.pawn_customers.find_one({
        "drivers_license": customer.drivers_license.upper()
    })
    
    if existing:
        if existing.get("portal_password"):
            raise HTTPException(status_code=400, detail="Account already registered. Please login.")
        
        # Update existing customer with portal access
        hashed_password = bcrypt.hashpw(customer.password.encode('utf-8'), bcrypt.gensalt())
        await db.pawn_customers.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "portal_password": hashed_password.decode('utf-8'),
                    "portal_email": customer.email,
                    "portal_registered_at": datetime.now(timezone.utc)
                }
            }
        )
        return {"success": True, "message": "Portal access enabled for existing customer", "customer_id": str(existing["_id"])}
    
    # Create new customer with portal access
    hashed_password = bcrypt.hashpw(customer.password.encode('utf-8'), bcrypt.gensalt())
    
    customer_data = {
        "first_name": customer.first_name,
        "last_name": customer.last_name.upper(),
        "email": customer.email,
        "phone": customer.phone,
        "address": customer.address or "",
        "city": customer.city or "",
        "state": customer.state or "AL",
        "zip_code": customer.zip_code or "",
        "drivers_license": customer.drivers_license.upper(),
        "dl_state": customer.dl_state,
        "date_of_birth": customer.date_of_birth,
        "portal_password": hashed_password.decode('utf-8'),
        "portal_email": customer.email,
        "portal_registered_at": datetime.now(timezone.utc),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "total_contracts": 0,
        "active_contracts": 0,
        "total_loaned": 0,
        "total_paid": 0
    }
    
    result = await db.pawn_customers.insert_one(customer_data)
    
    return {"success": True, "message": "Account created", "customer_id": str(result.inserted_id)}

@router.post("/portal/login")
async def portal_login(lookup: CustomerLookup):
    """Login to customer portal using DL and last name"""
    customer = await db.pawn_customers.find_one({
        "drivers_license": lookup.drivers_license.upper(),
        "last_name": {"$regex": f"^{lookup.last_name}$", "$options": "i"}
    })
    
    if not customer:
        raise HTTPException(status_code=404, detail="No account found with this Driver's License and Last Name")
    
    # Get active contracts
    contracts_cursor = db.pawn_contracts.find({
        "customer_id": str(customer["_id"]),
        "type": "pawn"
    }).sort("created_at", -1)
    
    contracts = []
    async for contract in contracts_cursor:
        # Recalculate payoff for active contracts
        if contract["status"] == "active":
            days_elapsed = (datetime.now(timezone.utc) - ensure_tz_aware(contract["created_at"])).days
            payoff = calculate_payoff(
                contract["loan_amount"],
                contract["interest_rate"],
                days_elapsed,
                contract["loan_term_days"]
            )
            contract["current_payoff"] = payoff["total_payoff"]
            contract["balance_due"] = payoff["total_payoff"] - contract["amount_paid"]
        contracts.append(serialize_doc(contract))
    
    customer_data = serialize_doc(customer)
    # Remove sensitive data
    customer_data.pop("portal_password", None)
    customer_data["contracts"] = contracts
    
    return customer_data

@router.post("/portal/payment")
async def portal_make_payment(payment: PaymentCreate):
    """Make an online payment (from customer portal)"""
    # Mark as online payment
    payment.payment_method = "online"
    return await make_payment(payment)

# ============ STATS & REPORTS ============

@router.get("/stats")
async def get_pawn_stats():
    """Get peptides catalog statistics"""
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Active contracts
    active_count = await db.pawn_contracts.count_documents({"type": "pawn", "status": "active"})
    
    # Total outstanding
    active_contracts = await db.pawn_contracts.find({"type": "pawn", "status": "active"}).to_list(length=None)
    total_outstanding = sum(c.get("balance_due", 0) for c in active_contracts)
    total_loaned = sum(c.get("loan_amount", 0) for c in active_contracts)
    
    # Today's new contracts
    today_contracts = await db.pawn_contracts.count_documents({
        "type": "pawn",
        "created_at": {"$gte": today}
    })
    
    # Today's payments
    today_payments = 0
    for contract in active_contracts:
        for payment in contract.get("payments", []):
            payment_date = payment.get("date")
            if isinstance(payment_date, datetime):
                payment_date = ensure_tz_aware(payment_date)
                if payment_date >= today:
                    today_payments += payment.get("amount", 0)
    
    # Defaulted contracts
    defaulted_count = await db.pawn_contracts.count_documents({"type": "pawn", "status": "defaulted"})
    
    # Paid this month
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    paid_this_month = await db.pawn_contracts.count_documents({
        "type": "pawn",
        "status": "paid",
        "paid_date": {"$gte": month_start}
    })
    
    # Buy transactions today
    buy_today = await db.pawn_contracts.count_documents({
        "type": "buy",
        "created_at": {"$gte": today}
    })
    
    # Total customers
    total_customers = await db.pawn_customers.count_documents({})
    
    return {
        "active_contracts": active_count,
        "total_outstanding": round(total_outstanding, 2),
        "total_loaned_active": round(total_loaned, 2),
        "today_new_contracts": today_contracts,
        "today_payments": round(today_payments, 2),
        "defaulted_contracts": defaulted_count,
        "paid_this_month": paid_this_month,
        "buy_transactions_today": buy_today,
        "total_customers": total_customers
    }

@router.get("/overdue")
async def get_overdue_contracts():
    """Get contracts that are past due"""
    now = datetime.now(timezone.utc)
    
    contracts = await db.pawn_contracts.find({
        "type": "pawn",
        "status": "active",
        "due_date": {"$lt": now}
    }).sort("due_date", 1).to_list(length=None)
    
    result = []
    for contract in contracts:
        days_overdue = (now - ensure_tz_aware(contract["due_date"])).days
        contract["days_overdue"] = days_overdue
        
        # Recalculate payoff
        days_elapsed = (now - ensure_tz_aware(contract["created_at"])).days
        payoff = calculate_payoff(
            contract["loan_amount"],
            contract["interest_rate"],
            days_elapsed,
            contract["loan_term_days"]
        )
        contract["current_payoff"] = payoff["total_payoff"]
        contract["balance_due"] = payoff["total_payoff"] - contract["amount_paid"]
        
        result.append(serialize_doc(contract))
    
    return result

@router.put("/pawn/{contract_id}/default")
async def mark_contract_defaulted(contract_id: str):
    """Mark a contract as defaulted (items forfeited)"""
    contract = await db.pawn_contracts.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract["status"] != "active":
        raise HTTPException(status_code=400, detail=f"Contract is already {contract['status']}")
    
    now = datetime.now(timezone.utc)
    
    # Update contract
    await db.pawn_contracts.update_one(
        {"_id": ObjectId(contract_id)},
        {
            "$set": {
                "status": "defaulted",
                "default_date": now
            }
        }
    )
    
    # Update customer stats
    await db.pawn_customers.update_one(
        {"_id": ObjectId(contract["customer_id"])},
        {"$inc": {"active_contracts": -1}}
    )
    
    # Add items to inventory for sale
    for item in contract.get("items", []):
        product_data = {
            "name": item["description"],
            "description": f"Forfeited peptide item. {item.get('notes', '')}",
            "category": item.get("category", "Uncategorized"),
            "brand": item.get("brand", ""),
            "price": item.get("estimated_value", contract["loan_amount"] / len(contract["items"])),
            "condition": item.get("condition", "Good"),
            "in_stock": True,
            "quantity": 1,
            "sku": f"FRF-{contract['contract_number']}-{random.randint(100,999)}",
            "serial_number": item.get("serial_number", ""),
            "images": item.get("images", []),
            "source": "forfeited_pawn",
            "source_contract": contract["contract_number"],
            "location": "123Bots",
            "created_at": now,
            "updated_at": now
        }
        await db.products.insert_one(product_data)
    
    return {
        "success": True,
        "message": "Contract marked as defaulted, items added to inventory",
        "items_added": len(contract.get("items", []))
    }

@router.put("/pawn/{contract_id}/extend")
async def extend_contract(contract_id: str, days: int = 30):
    """Extend a peptide contract due date"""
    contract = await db.pawn_contracts.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract["status"] != "active":
        raise HTTPException(status_code=400, detail=f"Contract is {contract['status']}, cannot extend")
    
    new_due_date = ensure_tz_aware(contract["due_date"]) + timedelta(days=days)
    
    await db.pawn_contracts.update_one(
        {"_id": ObjectId(contract_id)},
        {
            "$set": {"due_date": new_due_date},
            "$push": {
                "extensions": {
                    "date": datetime.now(timezone.utc),
                    "days_added": days,
                    "new_due_date": new_due_date
                }
            }
        }
    )
    
    return {
        "success": True,
        "new_due_date": new_due_date.isoformat(),
        "days_extended": days
    }
