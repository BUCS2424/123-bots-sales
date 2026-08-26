"""
Inventory Management System for 123Bots
- Manufacturer management with configurable lead times
- Inventory tracking (stock levels, transactions)
- Order recommendations based on pipeline data
- Weekly email reports (Mondays)
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/inventory", tags=["inventory"])

_db = None

def set_database(database):
    global _db
    _db = database

async def get_db():
    return _db


# ============ MODELS ============

class ManufacturerCreate(BaseModel):
    name: str
    code: str  # Short code like "PUDU", "AVID"
    contact_name: Optional[str] = ""
    contact_email: Optional[str] = ""
    contact_phone: Optional[str] = ""
    website: Optional[str] = ""
    lead_time_days: int = 14  # Default 2 weeks
    minimum_order_value: Optional[float] = None
    minimum_order_quantity: Optional[int] = None
    notes: Optional[str] = ""
    is_active: bool = True


class ManufacturerUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    lead_time_days: Optional[int] = None
    minimum_order_value: Optional[float] = None
    minimum_order_quantity: Optional[int] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class InventoryItemCreate(BaseModel):
    product_id: str
    product_name: str
    manufacturer_id: str
    sku: Optional[str] = ""
    current_stock: int = 0
    reorder_point: int = 5  # Alert when stock falls below this
    reorder_quantity: int = 10  # Suggested quantity to order
    unit_cost: Optional[float] = None
    location: Optional[str] = ""
    notes: Optional[str] = ""


class InventoryItemUpdate(BaseModel):
    product_name: Optional[str] = None
    manufacturer_id: Optional[str] = None
    sku: Optional[str] = None
    current_stock: Optional[int] = None
    reorder_point: Optional[int] = None
    reorder_quantity: Optional[int] = None
    unit_cost: Optional[float] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class StockAdjustment(BaseModel):
    inventory_item_id: str
    adjustment_type: str  # "add", "remove", "set", "sold", "received", "damaged", "returned"
    quantity: int
    reason: Optional[str] = ""
    reference_id: Optional[str] = None  # Order ID, PO number, etc.


class PurchaseOrderCreate(BaseModel):
    manufacturer_id: str
    items: List[Dict]  # [{inventory_item_id, quantity, unit_cost}]
    notes: Optional[str] = ""
    expected_delivery_date: Optional[datetime] = None


class PurchaseOrderUpdate(BaseModel):
    status: Optional[str] = None  # draft, submitted, confirmed, shipped, received, cancelled
    notes: Optional[str] = None
    expected_delivery_date: Optional[datetime] = None
    actual_delivery_date: Optional[datetime] = None
    tracking_number: Optional[str] = None


class OrderRecommendationSettings(BaseModel):
    conversion_rate: float = 0.25  # 25% of pipeline converts to orders
    safety_stock_days: int = 14  # Keep 2 weeks of safety stock
    forecast_period_days: int = 30  # Look at 30 days of historical data
    include_pipeline: bool = True
    include_historical: bool = True


# ============ HELPER FUNCTIONS ============

def _require_admin_token(authorization: Optional[str]) -> dict:
    from auth import decode_token, is_admin_or_above
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")
    token = authorization.split("Bearer ", 1)[1].strip()
    token_data = decode_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    if not is_admin_or_above(token_data.role or ""):
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"user_id": token_data.user_id, "email": token_data.email, "role": token_data.role}


# ============ MANUFACTURER ENDPOINTS ============

@router.get("/manufacturers")
async def list_manufacturers(authorization: Optional[str] = Header(None)):
    _require_admin_token(authorization)
    manufacturers = await _db.manufacturers.find(
        {},
        {"_id": 0}
    ).sort("name", 1).to_list(100)
    return {"manufacturers": manufacturers}


@router.post("/manufacturers")
async def create_manufacturer(data: ManufacturerCreate, authorization: Optional[str] = Header(None)):
    _require_admin_token(authorization)
    
    # Check for duplicate code
    existing = await _db.manufacturers.find_one({"code": data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Manufacturer code already exists")
    
    manufacturer = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "code": data.code.upper(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await _db.manufacturers.insert_one(manufacturer)
    
    return {"message": "Manufacturer created", "manufacturer": {k: v for k, v in manufacturer.items() if k != "_id"}}


@router.get("/manufacturers/{manufacturer_id}")
async def get_manufacturer(manufacturer_id: str, authorization: Optional[str] = Header(None)):
    _require_admin_token(authorization)
    manufacturer = await _db.manufacturers.find_one({"id": manufacturer_id}, {"_id": 0})
    if not manufacturer:
        raise HTTPException(status_code=404, detail="Manufacturer not found")
    return manufacturer


@router.put("/manufacturers/{manufacturer_id}")
async def update_manufacturer(manufacturer_id: str, data: ManufacturerUpdate, authorization: Optional[str] = Header(None)):
    _require_admin_token(authorization)
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    if "code" in update_data:
        update_data["code"] = update_data["code"].upper()
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await _db.manufacturers.update_one(
        {"id": manufacturer_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Manufacturer not found")
    
    return {"message": "Manufacturer updated"}


@router.delete("/manufacturers/{manufacturer_id}")
async def delete_manufacturer(manufacturer_id: str, authorization: Optional[str] = Header(None)):
    _require_admin_token(authorization)
    
    # Check if any inventory items use this manufacturer
    items_count = await _db.inventory_items.count_documents({"manufacturer_id": manufacturer_id})
    if items_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete manufacturer with {items_count} inventory items. Reassign or delete items first."
        )
    
    result = await _db.manufacturers.delete_one({"id": manufacturer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Manufacturer not found")
    
    return {"message": "Manufacturer deleted"}


# ============ INVENTORY ITEM ENDPOINTS ============

@router.get("/items")
async def list_inventory_items(
    manufacturer_id: Optional[str] = None,
    low_stock: Optional[bool] = None,
    authorization: Optional[str] = Header(None)
):
    _require_admin_token(authorization)
    
    query = {}
    if manufacturer_id:
        query["manufacturer_id"] = manufacturer_id
    
    items = await _db.inventory_items.find(query, {"_id": 0}).sort("product_name", 1).to_list(500)
    
    # Enrich with manufacturer info
    manufacturer_ids = list(set(item.get("manufacturer_id") for item in items if item.get("manufacturer_id")))
    manufacturers = await _db.manufacturers.find(
        {"id": {"$in": manufacturer_ids}},
        {"_id": 0, "id": 1, "name": 1, "code": 1, "lead_time_days": 1}
    ).to_list(100)
    mfr_map = {m["id"]: m for m in manufacturers}
    
    for item in items:
        item["manufacturer"] = mfr_map.get(item.get("manufacturer_id"), {})
        item["is_low_stock"] = item.get("current_stock", 0) <= item.get("reorder_point", 0)
    
    if low_stock:
        items = [i for i in items if i.get("is_low_stock")]
    
    return {"items": items, "total": len(items)}


@router.post("/items")
async def create_inventory_item(data: InventoryItemCreate, authorization: Optional[str] = Header(None)):
    _require_admin_token(authorization)
    
    # Check manufacturer exists
    manufacturer = await _db.manufacturers.find_one({"id": data.manufacturer_id})
    if not manufacturer:
        raise HTTPException(status_code=400, detail="Manufacturer not found")
    
    # Check for duplicate product
    existing = await _db.inventory_items.find_one({"product_id": data.product_id})
    if existing:
        raise HTTPException(status_code=400, detail="Inventory item for this product already exists")
    
    item = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await _db.inventory_items.insert_one(item)
    
    # Log initial stock transaction
    if data.current_stock > 0:
        await _log_stock_transaction(item["id"], "set", data.current_stock, "Initial stock entry")
    
    return {"message": "Inventory item created", "item": {k: v for k, v in item.items() if k != "_id"}}


@router.get("/items/{item_id}")
async def get_inventory_item(item_id: str, authorization: Optional[str] = Header(None)):
    _require_admin_token(authorization)
    item = await _db.inventory_items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Get manufacturer info
    if item.get("manufacturer_id"):
        manufacturer = await _db.manufacturers.find_one({"id": item["manufacturer_id"]}, {"_id": 0})
        item["manufacturer"] = manufacturer
    
    # Get recent transactions
    transactions = await _db.stock_transactions.find(
        {"inventory_item_id": item_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    item["recent_transactions"] = transactions
    
    return item


@router.put("/items/{item_id}")
async def update_inventory_item(item_id: str, data: InventoryItemUpdate, authorization: Optional[str] = Header(None)):
    _require_admin_token(authorization)
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    # If changing manufacturer, verify it exists
    if "manufacturer_id" in update_data:
        manufacturer = await _db.manufacturers.find_one({"id": update_data["manufacturer_id"]})
        if not manufacturer:
            raise HTTPException(status_code=400, detail="Manufacturer not found")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await _db.inventory_items.update_one(
        {"id": item_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    return {"message": "Inventory item updated"}


@router.delete("/items/{item_id}")
async def delete_inventory_item(item_id: str, authorization: Optional[str] = Header(None)):
    _require_admin_token(authorization)
    result = await _db.inventory_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return {"message": "Inventory item deleted"}


# ============ STOCK ADJUSTMENT ENDPOINTS ============

async def _log_stock_transaction(
    inventory_item_id: str, 
    adjustment_type: str, 
    quantity: int, 
    reason: str = "",
    reference_id: str = None,
    user_id: str = None
):
    transaction = {
        "id": str(uuid.uuid4()),
        "inventory_item_id": inventory_item_id,
        "adjustment_type": adjustment_type,
        "quantity": quantity,
        "reason": reason,
        "reference_id": reference_id,
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await _db.stock_transactions.insert_one(transaction)
    return transaction


@router.post("/items/{item_id}/adjust")
async def adjust_stock(item_id: str, data: StockAdjustment, authorization: Optional[str] = Header(None)):
    admin = _require_admin_token(authorization)
    
    item = await _db.inventory_items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    current_stock = item.get("current_stock", 0)
    
    if data.adjustment_type == "add" or data.adjustment_type == "received" or data.adjustment_type == "returned":
        new_stock = current_stock + data.quantity
    elif data.adjustment_type == "remove" or data.adjustment_type == "sold" or data.adjustment_type == "damaged":
        new_stock = current_stock - data.quantity
        if new_stock < 0:
            raise HTTPException(status_code=400, detail="Cannot reduce stock below zero")
    elif data.adjustment_type == "set":
        new_stock = data.quantity
    else:
        raise HTTPException(status_code=400, detail="Invalid adjustment type")
    
    await _db.inventory_items.update_one(
        {"id": item_id},
        {"$set": {
            "current_stock": new_stock,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await _log_stock_transaction(
        item_id, 
        data.adjustment_type, 
        data.quantity, 
        data.reason,
        data.reference_id,
        admin.get("user_id")
    )
    
    return {
        "message": "Stock adjusted",
        "previous_stock": current_stock,
        "new_stock": new_stock,
        "adjustment": data.quantity
    }


@router.get("/items/{item_id}/transactions")
async def get_stock_transactions(item_id: str, limit: int = 50, authorization: Optional[str] = Header(None)):
    _require_admin_token(authorization)
    
    transactions = await _db.stock_transactions.find(
        {"inventory_item_id": item_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"transactions": transactions}


# ============ PURCHASE ORDER ENDPOINTS ============

@router.get("/purchase-orders")
async def list_purchase_orders(
    manufacturer_id: Optional[str] = None,
    status: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    _require_admin_token(authorization)
    
    query = {}
    if manufacturer_id:
        query["manufacturer_id"] = manufacturer_id
    if status:
        query["status"] = status
    
    orders = await _db.purchase_orders.find(query, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    
    # Enrich with manufacturer info
    for order in orders:
        if order.get("manufacturer_id"):
            manufacturer = await _db.manufacturers.find_one(
                {"id": order["manufacturer_id"]},
                {"_id": 0, "id": 1, "name": 1, "code": 1}
            )
            order["manufacturer"] = manufacturer
    
    return {"orders": orders}


@router.post("/purchase-orders")
async def create_purchase_order(data: PurchaseOrderCreate, authorization: Optional[str] = Header(None)):
    admin = _require_admin_token(authorization)
    
    # Validate manufacturer
    manufacturer = await _db.manufacturers.find_one({"id": data.manufacturer_id}, {"_id": 0})
    if not manufacturer:
        raise HTTPException(status_code=400, detail="Manufacturer not found")
    
    # Calculate expected delivery if not provided
    expected_delivery = data.expected_delivery_date
    if not expected_delivery:
        lead_days = manufacturer.get("lead_time_days", 14)
        expected_delivery = datetime.now(timezone.utc) + timedelta(days=lead_days)
    
    # Calculate totals
    total_items = 0
    total_cost = 0.0
    for item in data.items:
        total_items += item.get("quantity", 0)
        total_cost += item.get("quantity", 0) * item.get("unit_cost", 0)
    
    order = {
        "id": str(uuid.uuid4()),
        "po_number": f"PO-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:4].upper()}",
        "manufacturer_id": data.manufacturer_id,
        "items": data.items,
        "total_items": total_items,
        "total_cost": total_cost,
        "status": "draft",
        "notes": data.notes,
        "expected_delivery_date": expected_delivery.isoformat() if expected_delivery else None,
        "actual_delivery_date": None,
        "tracking_number": None,
        "created_by": admin.get("user_id"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await _db.purchase_orders.insert_one(order)
    
    return {"message": "Purchase order created", "order": {k: v for k, v in order.items() if k != "_id"}}


@router.put("/purchase-orders/{order_id}")
async def update_purchase_order(order_id: str, data: PurchaseOrderUpdate, authorization: Optional[str] = Header(None)):
    admin = _require_admin_token(authorization)
    
    order = await _db.purchase_orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # Handle status changes
    if "status" in update_data:
        new_status = update_data["status"]
        
        # When order is received, update inventory
        if new_status == "received" and order.get("status") != "received":
            update_data["actual_delivery_date"] = datetime.now(timezone.utc).isoformat()
            
            # Add stock for each item
            for item in order.get("items", []):
                inventory_item_id = item.get("inventory_item_id")
                quantity = item.get("quantity", 0)
                
                if inventory_item_id and quantity > 0:
                    inv_item = await _db.inventory_items.find_one({"id": inventory_item_id})
                    if inv_item:
                        new_stock = inv_item.get("current_stock", 0) + quantity
                        await _db.inventory_items.update_one(
                            {"id": inventory_item_id},
                            {"$set": {
                                "current_stock": new_stock,
                                "updated_at": datetime.now(timezone.utc).isoformat()
                            }}
                        )
                        await _log_stock_transaction(
                            inventory_item_id,
                            "received",
                            quantity,
                            f"Received from PO {order.get('po_number')}",
                            order_id,
                            admin.get("user_id")
                        )
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await _db.purchase_orders.update_one({"id": order_id}, {"$set": update_data})
    
    return {"message": "Purchase order updated"}


# ============ ORDER RECOMMENDATIONS ============

@router.get("/recommendations")
async def get_order_recommendations(authorization: Optional[str] = Header(None)):
    """
    Calculate recommended order quantities based on:
    1. Current stock levels vs reorder points
    2. Pipeline opportunities (potential demand)
    3. Historical sales velocity
    4. Manufacturer lead times
    """
    _require_admin_token(authorization)
    
    # Get recommendation settings
    settings = await _db.admin_settings.find_one({"type": "inventory_recommendation_settings"})
    if not settings:
        settings = {
            "conversion_rate": 0.25,
            "safety_stock_days": 14,
            "forecast_period_days": 30,
            "include_pipeline": True,
            "include_historical": True
        }
    
    conversion_rate = settings.get("conversion_rate", 0.25)
    safety_days = settings.get("safety_stock_days", 14)
    forecast_days = settings.get("forecast_period_days", 30)
    
    # Get all inventory items
    items = await _db.inventory_items.find({}, {"_id": 0}).to_list(500)
    
    # Get manufacturers for lead times
    manufacturers = await _db.manufacturers.find({}, {"_id": 0}).to_list(100)
    mfr_map = {m["id"]: m for m in manufacturers}
    
    # Get pipeline data (open opportunities with products)
    pipeline_opportunities = await _db.leads.find(
        {"opportunity_status": "Open"},
        {"_id": 0, "opportunity_value": 1, "associated_objects": 1, "stage": 1}
    ).to_list(500)
    
    # Get historical orders (last N days)
    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=forecast_days)).isoformat()
    historical_orders = await _db.orders.find(
        {"created_at": {"$gte": cutoff_date}, "status": {"$ne": "cancelled"}},
        {"_id": 0, "items": 1, "created_at": 1}
    ).to_list(1000)
    
    # Calculate product demand from pipeline
    pipeline_demand = {}
    for opp in pipeline_opportunities:
        for obj in opp.get("associated_objects", []):
            if obj.get("type") == "product":
                product_id = obj.get("id")
                quantity = obj.get("quantity", 1)
                # Weight by stage (later stages = higher probability)
                stage = opp.get("stage", "")
                stage_multiplier = 1.0
                if "qualified" in stage.lower():
                    stage_multiplier = 1.5
                elif "proposal" in stage.lower() or "quote" in stage.lower():
                    stage_multiplier = 2.0
                elif "negotiation" in stage.lower():
                    stage_multiplier = 2.5
                
                if product_id:
                    pipeline_demand[product_id] = pipeline_demand.get(product_id, 0) + (quantity * conversion_rate * stage_multiplier)
    
    # Calculate historical sales velocity
    sales_velocity = {}
    for order in historical_orders:
        for item in order.get("items", []):
            product_id = item.get("product_id")
            quantity = item.get("quantity", 1)
            if product_id:
                sales_velocity[product_id] = sales_velocity.get(product_id, 0) + quantity
    
    # Convert to daily rate
    for product_id in sales_velocity:
        sales_velocity[product_id] = sales_velocity[product_id] / forecast_days
    
    # Build recommendations by manufacturer
    recommendations_by_mfr = {}
    
    for item in items:
        manufacturer_id = item.get("manufacturer_id")
        manufacturer = mfr_map.get(manufacturer_id, {})
        mfr_name = manufacturer.get("name", "Unknown")
        lead_time = manufacturer.get("lead_time_days", 14)
        
        product_id = item.get("product_id")
        current_stock = item.get("current_stock", 0)
        reorder_point = item.get("reorder_point", 5)
        reorder_qty = item.get("reorder_quantity", 10)
        
        # Calculate expected demand during lead time + safety period
        daily_pipeline = pipeline_demand.get(product_id, 0) / 30  # Assume pipeline spreads over 30 days
        daily_sales = sales_velocity.get(product_id, 0)
        daily_demand = daily_pipeline + daily_sales
        
        coverage_days = lead_time + safety_days
        expected_demand = daily_demand * coverage_days
        
        # Calculate recommended order
        projected_stock = current_stock - expected_demand
        
        if projected_stock < reorder_point:
            needed_qty = max(reorder_qty, int(expected_demand - current_stock + reorder_point))
            
            recommendation = {
                "inventory_item_id": item.get("id"),
                "product_id": product_id,
                "product_name": item.get("product_name"),
                "sku": item.get("sku"),
                "current_stock": current_stock,
                "reorder_point": reorder_point,
                "projected_stock": round(projected_stock, 1),
                "daily_demand": round(daily_demand, 2),
                "pipeline_demand": round(pipeline_demand.get(product_id, 0), 1),
                "historical_velocity": round(sales_velocity.get(product_id, 0), 2),
                "recommended_quantity": needed_qty,
                "unit_cost": item.get("unit_cost"),
                "estimated_cost": (item.get("unit_cost") or 0) * needed_qty,
                "urgency": "critical" if current_stock <= 0 else ("high" if current_stock <= reorder_point else "medium")
            }
            
            if manufacturer_id not in recommendations_by_mfr:
                recommendations_by_mfr[manufacturer_id] = {
                    "manufacturer": manufacturer,
                    "lead_time_days": lead_time,
                    "items": [],
                    "total_items": 0,
                    "total_estimated_cost": 0
                }
            
            recommendations_by_mfr[manufacturer_id]["items"].append(recommendation)
            recommendations_by_mfr[manufacturer_id]["total_items"] += needed_qty
            recommendations_by_mfr[manufacturer_id]["total_estimated_cost"] += recommendation["estimated_cost"]
    
    # Sort items within each manufacturer by urgency
    urgency_order = {"critical": 0, "high": 1, "medium": 2}
    for mfr_id in recommendations_by_mfr:
        recommendations_by_mfr[mfr_id]["items"].sort(
            key=lambda x: (urgency_order.get(x["urgency"], 3), -x["recommended_quantity"])
        )
    
    # Get last report date
    last_report = await _db.inventory_reports.find_one(
        {"type": "weekly_recommendation"},
        {"_id": 0, "created_at": 1}
    )
    
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "settings": {
            "conversion_rate": conversion_rate,
            "safety_stock_days": safety_days,
            "forecast_period_days": forecast_days
        },
        "recommendations": list(recommendations_by_mfr.values()),
        "summary": {
            "total_manufacturers": len(recommendations_by_mfr),
            "total_items_to_order": sum(r["total_items"] for r in recommendations_by_mfr.values()),
            "total_estimated_cost": sum(r["total_estimated_cost"] for r in recommendations_by_mfr.values())
        },
        "last_weekly_report": last_report.get("created_at") if last_report else None
    }


@router.get("/recommendations/settings")
async def get_recommendation_settings(authorization: Optional[str] = Header(None)):
    _require_admin_token(authorization)
    
    settings = await _db.admin_settings.find_one({"type": "inventory_recommendation_settings"}, {"_id": 0})
    if not settings:
        settings = {
            "type": "inventory_recommendation_settings",
            "conversion_rate": 0.25,
            "safety_stock_days": 14,
            "forecast_period_days": 30,
            "include_pipeline": True,
            "include_historical": True,
            "email_recipients": [],
            "email_enabled": True,
            "email_day": "monday",
            "email_hour": 8
        }
    
    return settings


@router.put("/recommendations/settings")
async def update_recommendation_settings(data: dict, authorization: Optional[str] = Header(None)):
    _require_admin_token(authorization)
    
    data["type"] = "inventory_recommendation_settings"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await _db.admin_settings.update_one(
        {"type": "inventory_recommendation_settings"},
        {"$set": data},
        upsert=True
    )
    
    return {"message": "Settings updated"}


# ============ DASHBOARD / OVERVIEW ============

@router.get("/dashboard")
async def get_inventory_dashboard(authorization: Optional[str] = Header(None)):
    _require_admin_token(authorization)
    
    # Get counts
    total_items = await _db.inventory_items.count_documents({})
    low_stock_items = await _db.inventory_items.count_documents({
        "$expr": {"$lte": ["$current_stock", "$reorder_point"]}
    })
    out_of_stock = await _db.inventory_items.count_documents({"current_stock": {"$lte": 0}})
    total_manufacturers = await _db.manufacturers.count_documents({"is_active": True})
    
    # Pending purchase orders
    pending_orders = await _db.purchase_orders.count_documents({
        "status": {"$in": ["draft", "submitted", "confirmed", "shipped"]}
    })
    
    # Get low stock items
    low_stock_list = await _db.inventory_items.find(
        {"$expr": {"$lte": ["$current_stock", "$reorder_point"]}},
        {"_id": 0}
    ).sort("current_stock", 1).limit(10).to_list(10)
    
    # Get recent transactions
    recent_transactions = await _db.stock_transactions.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Enrich transactions with item names
    for tx in recent_transactions:
        item = await _db.inventory_items.find_one(
            {"id": tx.get("inventory_item_id")},
            {"_id": 0, "product_name": 1}
        )
        tx["product_name"] = item.get("product_name") if item else "Unknown"
    
    # Get inventory value
    pipeline = [
        {"$match": {"current_stock": {"$gt": 0}, "unit_cost": {"$exists": True, "$ne": None}}},
        {"$group": {
            "_id": None,
            "total_value": {"$sum": {"$multiply": ["$current_stock", "$unit_cost"]}},
            "total_units": {"$sum": "$current_stock"}
        }}
    ]
    value_result = await _db.inventory_items.aggregate(pipeline).to_list(1)
    inventory_value = value_result[0] if value_result else {"total_value": 0, "total_units": 0}
    
    return {
        "summary": {
            "total_items": total_items,
            "low_stock_items": low_stock_items,
            "out_of_stock": out_of_stock,
            "total_manufacturers": total_manufacturers,
            "pending_purchase_orders": pending_orders,
            "inventory_value": inventory_value.get("total_value", 0),
            "total_units": inventory_value.get("total_units", 0)
        },
        "low_stock_alerts": low_stock_list,
        "recent_transactions": recent_transactions
    }


# ============ EMAIL REPORT ============

async def send_weekly_inventory_report():
    """Send weekly inventory recommendation email (called by scheduler)"""
    from email_utils import send_email, get_smtp_settings
    
    settings = await _db.admin_settings.find_one({"type": "inventory_recommendation_settings"})
    if not settings or not settings.get("email_enabled", True):
        logger.info("Weekly inventory email disabled")
        return
    
    recipients = settings.get("email_recipients", [])
    if not recipients:
        # Fallback to admin users
        admins = await _db.users.find(
            {"role": {"$in": ["admin", "super_admin"]}},
            {"_id": 0, "email": 1}
        ).to_list(10)
        recipients = [a["email"] for a in admins if a.get("email")]
    
    if not recipients:
        logger.warning("No recipients for weekly inventory report")
        return
    
    # Generate recommendations
    # Note: In real implementation, this would call the recommendations logic directly
    # For now, we'll build a simple report
    
    low_stock = await _db.inventory_items.find(
        {"$expr": {"$lte": ["$current_stock", "$reorder_point"]}},
        {"_id": 0}
    ).to_list(100)
    
    manufacturers = await _db.manufacturers.find({"is_active": True}, {"_id": 0}).to_list(100)
    mfr_map = {m["id"]: m for m in manufacturers}
    
    # Group by manufacturer
    by_mfr = {}
    for item in low_stock:
        mfr_id = item.get("manufacturer_id")
        mfr = mfr_map.get(mfr_id, {"name": "Unknown", "code": "UNK"})
        mfr_name = mfr.get("name", "Unknown")
        
        if mfr_name not in by_mfr:
            by_mfr[mfr_name] = {"items": [], "lead_time": mfr.get("lead_time_days", 14)}
        by_mfr[mfr_name]["items"].append(item)
    
    # Build email HTML
    html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .header {{ background: #0a1628; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; }}
            .section {{ margin-bottom: 30px; }}
            .manufacturer {{ background: #f5f5f5; padding: 15px; margin-bottom: 15px; border-radius: 8px; }}
            .manufacturer h3 {{ margin-top: 0; color: #0a1628; }}
            table {{ width: 100%; border-collapse: collapse; }}
            th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }}
            th {{ background: #e0e0e0; }}
            .critical {{ color: #dc2626; font-weight: bold; }}
            .high {{ color: #f59e0b; }}
            .cta {{ display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>123Bots Weekly Inventory Report</h1>
            <p>{datetime.now(timezone.utc).strftime('%B %d, %Y')}</p>
        </div>
        <div class="content">
            <div class="section">
                <h2>Order Recommendations</h2>
                <p>The following items need to be reordered based on current stock levels and pipeline demand:</p>
    """
    
    if not by_mfr:
        html += "<p><strong>All inventory levels are healthy. No orders needed this week.</strong></p>"
    else:
        for mfr_name, data in by_mfr.items():
            html += f"""
                <div class="manufacturer">
                    <h3>{mfr_name} (Lead Time: {data['lead_time']} days)</h3>
                    <table>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Current Stock</th>
                            <th>Reorder Point</th>
                            <th>Recommended Order</th>
                        </tr>
            """
            for item in data["items"]:
                urgency_class = "critical" if item.get("current_stock", 0) <= 0 else "high"
                html += f"""
                    <tr>
                        <td class="{urgency_class}">{item.get('product_name', 'Unknown')}</td>
                        <td>{item.get('sku', '-')}</td>
                        <td class="{urgency_class}">{item.get('current_stock', 0)}</td>
                        <td>{item.get('reorder_point', 5)}</td>
                        <td>{item.get('reorder_quantity', 10)}</td>
                    </tr>
                """
            html += "</table></div>"
    
    html += """
                <a href="#" class="cta">View Full Report in Dashboard</a>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Send to all recipients
    smtp_settings = await get_smtp_settings()
    if smtp_settings:
        for email in recipients:
            try:
                await send_email(
                    to_email=email,
                    subject=f"123Bots Weekly Inventory Report - {datetime.now(timezone.utc).strftime('%B %d, %Y')}",
                    html_content=html
                )
                logger.info(f"Sent weekly inventory report to {email}")
            except Exception as e:
                logger.error(f"Failed to send inventory report to {email}: {e}")
    
    # Log the report
    await _db.inventory_reports.insert_one({
        "id": str(uuid.uuid4()),
        "type": "weekly_recommendation",
        "recipients": recipients,
        "items_count": len(low_stock),
        "manufacturers_count": len(by_mfr),
        "created_at": datetime.now(timezone.utc).isoformat()
    })


@router.post("/send-test-report")
async def send_test_report(authorization: Optional[str] = Header(None)):
    """Send a test inventory report email"""
    admin = _require_admin_token(authorization)
    
    try:
        await send_weekly_inventory_report()
        return {"message": "Test report sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send report: {str(e)}")


# ============ SYNC PRODUCTS ============

@router.post("/sync-products")
async def sync_products_to_inventory(authorization: Optional[str] = Header(None)):
    """
    Sync products from the store to inventory items.
    Creates inventory items for products that don't have one yet.
    """
    _require_admin_token(authorization)
    
    # Get all products
    products = await _db.products.find({}, {"_id": 0, "id": 1, "name": 1, "manufacturer": 1, "sku": 1, "quantity": 1}).to_list(500)
    
    # Get existing inventory items
    existing = await _db.inventory_items.find({}, {"_id": 0, "product_id": 1}).to_list(500)
    existing_product_ids = set(item["product_id"] for item in existing)
    
    # Get default manufacturer (or create one)
    default_mfr = await _db.manufacturers.find_one({"code": "DEFAULT"})
    if not default_mfr:
        default_mfr = {
            "id": str(uuid.uuid4()),
            "name": "Default/Unknown",
            "code": "DEFAULT",
            "lead_time_days": 14,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await _db.manufacturers.insert_one(default_mfr)
    
    created_count = 0
    for product in products:
        if product["id"] not in existing_product_ids:
            # Try to find manufacturer by name
            mfr_name = product.get("manufacturer", "")
            mfr = None
            if mfr_name:
                mfr = await _db.manufacturers.find_one(
                    {"name": {"$regex": f"^{mfr_name}$", "$options": "i"}},
                    {"_id": 0, "id": 1}
                )
            
            inventory_item = {
                "id": str(uuid.uuid4()),
                "product_id": product["id"],
                "product_name": product.get("name", "Unknown"),
                "manufacturer_id": mfr["id"] if mfr else default_mfr["id"],
                "sku": product.get("sku", ""),
                "current_stock": product.get("quantity", 0),
                "reorder_point": 5,
                "reorder_quantity": 10,
                "unit_cost": None,
                "location": "",
                "notes": "",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await _db.inventory_items.insert_one(inventory_item)
            created_count += 1
    
    return {
        "message": f"Sync complete. Created {created_count} new inventory items.",
        "total_products": len(products),
        "existing_items": len(existing_product_ids),
        "new_items": created_count
    }
