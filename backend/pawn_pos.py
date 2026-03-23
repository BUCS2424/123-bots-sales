"""
Peptides POS (Point of Sale) Module
Handles in-store transactions, product lookup, warehouse locations, and receipts
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
import uuid
import random
import string

router = APIRouter(prefix="/pawn-pos", tags=["Peptides POS"])

# Database reference (will be set from server.py)
db = None

def set_database(database):
    global db
    db = database

# Pydantic Models
class WarehouseLocation(BaseModel):
    aisle: str = ""
    shelf: str = ""
    bin: str = ""
    notes: str = ""

class POSCartItem(BaseModel):
    product_id: Optional[str] = None
    name: str
    sku: Optional[str] = ""
    price: float
    quantity: int = 1
    discount: float = 0
    warehouse_location: Optional[WarehouseLocation] = None
    is_custom: bool = False  # True if manually keyed in

class POSCustomer(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = ""
    phone: str
    address: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = "AL"
    zip_code: Optional[str] = ""
    id_type: Optional[str] = ""  # Driver's License, State ID, etc.
    id_number: Optional[str] = ""

class POSCheckoutRequest(BaseModel):
    items: List[POSCartItem]
    customer: POSCustomer
    payment_method: str = "cash"  # cash, card, layaway
    subtotal: float
    tax_rate: float = 0.10  # 10% default
    tax_amount: float
    discount_total: float = 0
    total: float
    notes: Optional[str] = ""
    cash_received: Optional[float] = None
    change_due: Optional[float] = None

class ProductLocationUpdate(BaseModel):
    aisle: str
    shelf: str
    bin: str
    notes: Optional[str] = ""

# Helper functions
def generate_receipt_number():
    """Generate a unique receipt number"""
    timestamp = datetime.now().strftime("%Y%m%d")
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"POS-{timestamp}-{random_part}"

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc

# Routes

@router.get("/products/search")
async def search_products(q: str = "", category: str = "", limit: int = 20):
    """Search products for POS by name, SKU, or category"""
    query = {"in_stock": True}
    
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"sku": {"$regex": q, "$options": "i"}},
            {"upc": {"$regex": q, "$options": "i"}},
            {"brand": {"$regex": q, "$options": "i"}}
        ]
    
    if category and category != "All":
        query["category"] = category
    
    cursor = db.products.find(query, {
        "_id": 1, "name": 1, "sku": 1, "price": 1, "image": 1, "images": 1,
        "category": 1, "condition": 1, "quantity": 1, "in_stock": 1,
        "warehouse_location": 1, "brand": 1, "upc": 1
    }).limit(limit)
    
    products = []
    async for product in cursor:
        product["id"] = str(product.pop("_id"))
        # Get first image
        if product.get("images") and len(product["images"]) > 0:
            product["image"] = product["images"][0]
        products.append(product)
    
    return products

@router.get("/products/{product_id}")
async def get_product_details(product_id: str):
    """Get full product details including warehouse location"""
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_doc(product)

@router.put("/products/{product_id}/location")
async def update_product_location(product_id: str, location: ProductLocationUpdate):
    """Update product warehouse location"""
    result = await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {
            "warehouse_location": {
                "aisle": location.aisle,
                "shelf": location.shelf,
                "bin": location.bin,
                "notes": location.notes or ""
            },
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True, "message": "Location updated"}

@router.get("/customers/search")
async def search_customers(q: str = "", limit: int = 10):
    """Search existing customers by name, email, or phone"""
    if not q:
        return []
    
    query = {"$or": [
        {"first_name": {"$regex": q, "$options": "i"}},
        {"last_name": {"$regex": q, "$options": "i"}},
        {"email": {"$regex": q, "$options": "i"}},
        {"phone": {"$regex": q, "$options": "i"}}
    ]}
    
    cursor = db.pos_customers.find(query).limit(limit)
    customers = []
    async for customer in cursor:
        customers.append(serialize_doc(customer))
    
    return customers

@router.post("/customers")
async def create_customer(customer: POSCustomer):
    """Create a new POS customer"""
    customer_data = customer.dict()
    customer_data["id"] = str(uuid.uuid4())
    customer_data["created_at"] = datetime.now(timezone.utc)
    customer_data["total_purchases"] = 0
    customer_data["total_spent"] = 0
    
    await db.pos_customers.insert_one(customer_data)
    
    return {"id": customer_data["id"], "message": "Customer created"}

@router.post("/checkout")
async def process_checkout(checkout: POSCheckoutRequest):
    """Process a POS checkout transaction"""
    
    now = datetime.now(timezone.utc)
    receipt_number = generate_receipt_number()
    transaction_id = str(uuid.uuid4())
    
    # Create transaction record in pos_transactions
    transaction = {
        "id": transaction_id,
        "receipt_number": receipt_number,
        "items": [item.dict() for item in checkout.items],
        "customer": checkout.customer.dict(),
        "payment_method": checkout.payment_method,
        "subtotal": checkout.subtotal,
        "tax_rate": checkout.tax_rate,
        "tax_amount": checkout.tax_amount,
        "discount_total": checkout.discount_total,
        "total": checkout.total,
        "cash_received": checkout.cash_received,
        "change_due": checkout.change_due,
        "notes": checkout.notes,
        "status": "completed",
        "created_at": now,
        "created_by": "pos_admin"
    }
    
    await db.pos_transactions.insert_one(transaction)
    
    # Also create an orders record for unified accounting/reporting
    order_record = {
        "id": transaction_id,
        "order_number": receipt_number,
        "source": "pos",
        "customer_email": checkout.customer.email or "",
        "customer_name": f"{checkout.customer.first_name} {checkout.customer.last_name}",
        "items": [
            {
                "product_id": item.product_id or "",
                "product_name": item.name,
                "price": item.price,
                "quantity": item.quantity,
                "item_type": "product"
            }
            for item in checkout.items
        ],
        "shipping_address": {
            "first_name": checkout.customer.first_name,
            "last_name": checkout.customer.last_name,
            "address": checkout.customer.address or "",
            "city": checkout.customer.city or "",
            "state": checkout.customer.state or "AL",
            "zip_code": checkout.customer.zip_code or "",
            "phone": checkout.customer.phone
        },
        "subtotal": checkout.subtotal,
        "tax": checkout.tax_amount,
        "total": checkout.total,
        "payment_method": checkout.payment_method,
        "status": "completed",
        "notes": checkout.notes or "",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    await db.orders.insert_one(order_record)
    
    # Update inventory for each item
    for item in checkout.items:
        if item.product_id and not item.is_custom:
            # Query by 'id' field (UUID string) not MongoDB _id
            await db.products.update_one(
                {"id": item.product_id},
                {
                    "$inc": {"quantity": -item.quantity, "sold_count": item.quantity},
                    "$set": {"updated_at": now}
                }
            )
            product = await db.products.find_one({"id": item.product_id})
            if product and product.get("quantity", 0) <= 0:
                await db.products.update_one(
                    {"id": item.product_id},
                    {"$set": {"in_stock": False}}
                )
    
    # Update or create customer record
    existing_customer = await db.pos_customers.find_one({"phone": checkout.customer.phone})
    if existing_customer:
        await db.pos_customers.update_one(
            {"phone": checkout.customer.phone},
            {
                "$inc": {
                    "total_purchases": 1,
                    "total_spent": checkout.total
                },
                "$set": {"last_purchase": now}
            }
        )
    else:
        await create_customer(checkout.customer)
        await db.pos_customers.update_one(
            {"phone": checkout.customer.phone},
            {
                "$inc": {
                    "total_purchases": 1,
                    "total_spent": checkout.total
                }
            }
        )
    
    return {
        "success": True,
        "receipt_number": receipt_number,
        "transaction_id": transaction_id,
        "total": checkout.total,
        "change_due": checkout.change_due,
        "items_count": len(checkout.items)
    }

@router.get("/transactions")
async def get_transactions(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 50
):
    """Get POS transactions with optional date filtering"""
    query = {}
    
    if start_date:
        query["created_at"] = {"$gte": datetime.fromisoformat(start_date)}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = datetime.fromisoformat(end_date)
        else:
            query["created_at"] = {"$lte": datetime.fromisoformat(end_date)}
    
    cursor = db.pos_transactions.find(query).sort("created_at", -1).limit(limit)
    
    transactions = []
    async for tx in cursor:
        tx["id"] = str(tx.pop("_id", tx.get("id")))
        transactions.append(tx)
    
    return transactions

@router.get("/transactions/{transaction_id}")
async def get_transaction(transaction_id: str):
    """Get a specific transaction by ID"""
    transaction = await db.pos_transactions.find_one({"id": transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    transaction["id"] = str(transaction.pop("_id", transaction.get("id")))
    return transaction

@router.get("/stats")
async def get_pos_stats():
    """Get POS statistics for dashboard"""
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Today's transactions
    today_cursor = db.pos_transactions.find({"created_at": {"$gte": today}})
    today_transactions = await today_cursor.to_list(length=None)
    
    today_total = sum(tx.get("total", 0) for tx in today_transactions)
    today_count = len(today_transactions)
    
    # All time stats
    all_cursor = db.pos_transactions.find({})
    all_transactions = await all_cursor.to_list(length=None)
    
    all_time_total = sum(tx.get("total", 0) for tx in all_transactions)
    all_time_count = len(all_transactions)
    
    # Average transaction value
    avg_transaction = all_time_total / all_time_count if all_time_count > 0 else 0
    
    # Customer count
    customer_count = await db.pos_customers.count_documents({})
    
    return {
        "today_revenue": today_total,
        "today_transactions": today_count,
        "all_time_revenue": all_time_total,
        "all_time_transactions": all_time_count,
        "average_transaction": avg_transaction,
        "total_customers": customer_count
    }

@router.get("/categories")
async def get_categories():
    """Get all product categories for filtering"""
    categories = await db.categories.find({}, {"_id": 0, "name": 1}).to_list(length=None)
    return [cat["name"] for cat in categories]

@router.post("/layaway")
async def create_layaway(checkout: POSCheckoutRequest):
    """Create a layaway transaction (partial payment)"""
    receipt_number = generate_receipt_number()
    
    layaway = {
        "id": str(uuid.uuid4()),
        "receipt_number": receipt_number,
        "items": [item.dict() for item in checkout.items],
        "customer": checkout.customer.dict(),
        "total": checkout.total,
        "amount_paid": checkout.cash_received or 0,
        "balance_due": checkout.total - (checkout.cash_received or 0),
        "payments": [{
            "amount": checkout.cash_received or 0,
            "date": datetime.now(timezone.utc),
            "method": checkout.payment_method
        }],
        "status": "active",
        "created_at": datetime.now(timezone.utc),
        "due_date": None,  # Can be set later
        "notes": checkout.notes
    }
    
    await db.pos_layaways.insert_one(layaway)
    
    # Reserve items (don't remove from inventory yet)
    for item in checkout.items:
        if item.product_id:
            await db.products.update_one(
                {"_id": ObjectId(item.product_id)},
                {"$set": {"reserved": True, "layaway_id": layaway["id"]}}
            )
    
    return {
        "success": True,
        "layaway_id": layaway["id"],
        "receipt_number": receipt_number,
        "balance_due": layaway["balance_due"]
    }

@router.get("/layaways")
async def get_layaways(status: str = "active"):
    """Get layaway transactions"""
    query = {}
    if status:
        query["status"] = status
    
    cursor = db.pos_layaways.find(query).sort("created_at", -1)
    layaways = []
    async for layaway in cursor:
        layaway["id"] = str(layaway.pop("_id", layaway.get("id")))
        layaways.append(layaway)
    
    return layaways


class EmailReceiptRequest(BaseModel):
    receipt_number: str
    transaction_id: str
    email: str
    total: float
    items_count: int

@router.post("/receipt/email")
async def email_receipt(request: EmailReceiptRequest):
    """Email a receipt to the customer (stores email log, actual sending requires SMTP config)"""
    
    # Log the email request
    email_log = {
        "id": str(uuid.uuid4()),
        "type": "pawn_receipt",
        "receipt_number": request.receipt_number,
        "transaction_id": request.transaction_id,
        "recipient": request.email,
        "total": request.total,
        "items_count": request.items_count,
        "status": "queued",  # Would be 'sent' once SMTP is configured
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.email_logs.insert_one(email_log)
    
    # Note: In production, this would send via SMTP/SendGrid/etc.
    # For now, we just log the request
    
    return {
        "success": True,
        "message": f"Receipt queued for delivery to {request.email}",
        "email_id": email_log["id"]
    }
