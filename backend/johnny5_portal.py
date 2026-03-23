"""
Johnny 5 Portal - Multi-Store Fulfillment Hub
Connects multiple store clones, aggregates orders, handles fulfillment, and pushes tracking back
"""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request, Header, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
import uuid
import hashlib
import hmac
import httpx
import logging
import csv
import io
from auth import decode_token, is_admin_or_above

logger = logging.getLogger(__name__)

johnny5_router = APIRouter(prefix="/johnny5", tags=["Johnny 5 Portal"])

_db = None


def set_database(database):
    global _db
    _db = database


# ============== MODELS ==============

class StoreStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"


class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class ConnectedStore(BaseModel):
    name: str
    url: str
    description: Optional[str] = None
    store_api_key: Optional[str] = None  # API key FROM the external store (for pushing tracking back)
    shipping_enabled: bool = False
    shipping_provider: str = "active"  # active | shippo | easypost | shipstation
    shipping_markup_type: str = "none"  # none | flat | percentage
    shipping_markup_amount: float = 0.0
    stock_sync_enabled: bool = True
    billing_markup_type: str = "none"  # none | flat | percentage
    billing_markup_amount: float = 0.0


class StoreUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    status: Optional[StoreStatus] = None
    store_api_key: Optional[str] = None  # API key from the external store for pushing tracking
    shipping_enabled: Optional[bool] = None
    shipping_provider: Optional[str] = None
    shipping_markup_type: Optional[str] = None
    shipping_markup_amount: Optional[float] = None
    stock_sync_enabled: Optional[bool] = None
    billing_markup_type: Optional[str] = None
    billing_markup_amount: Optional[float] = None


class IncomingOrder(BaseModel):
    store_id: str
    store_order_id: str
    customer_name: str
    customer_email: str
    shipping_address: dict
    items: List[dict]
    total: float
    subtotal: float
    shipping_cost: float = 0
    tax: float = 0
    notes: Optional[str] = None


class TrackingUpdate(BaseModel):
    order_id: str
    tracking_number: str
    carrier: str
    tracking_url: Optional[str] = None


class FulfillmentAction(BaseModel):
    order_ids: List[str]
    action: str  # "purchase_label", "mark_shipped", "push_tracking"
    carrier: Optional[str] = None
    service: Optional[str] = None


class ConnectedShippingRateRequest(BaseModel):
    to_address: Dict[str, Any]
    weight_oz: float = 8.0
    order_subtotal: float = 0.0
    product_upcharge: float = 0.0


class BillingInvoiceCreateRequest(BaseModel):
    store_id: str
    order_ids: List[str]
    notes: Optional[str] = None


class StockCheckItem(BaseModel):
    sku: Optional[str] = None
    product_id: Optional[str] = None
    selected_strength: Optional[str] = None
    selected_package: Optional[str] = None
    quantity: int = 1


class StockCheckRequest(BaseModel):
    items: List[StockCheckItem]


class PricingStockRowUpdate(BaseModel):
    stock_quantity: Optional[int] = None
    in_stock: Optional[bool] = None
    estimated_restock: Optional[str] = None
    allow_preorder: Optional[bool] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None


class PricingStockRowCreate(BaseModel):
    sku: Optional[str] = None
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    option_strength: Optional[str] = None
    option_package: Optional[str] = None
    price: float = 0.0
    cost_price: float = 0.0
    stock_quantity: int = 0
    in_stock: bool = False
    estimated_restock: Optional[str] = None
    allow_preorder: bool = False


class PricingStockSettingsUpdate(BaseModel):
    global_markup_percent: Optional[float] = None


# ============== HELPER FUNCTIONS ==============

def generate_api_key():
    """Generate a unique API key for store connection"""
    return f"j5_{uuid.uuid4().hex}"


def generate_api_secret():
    """Generate a secret for webhook validation"""
    return hashlib.sha256(uuid.uuid4().bytes).hexdigest()


def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verify incoming webhook signature"""
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


async def get_store_by_api_key(api_key: str):
    """Get store by API key"""
    if _db is None:
        return None
    return await _db.johnny5_stores.find_one({"api_key": api_key, "status": "active"})


def require_admin_user(request: Request):
    auth_header = request.headers.get("authorization", "")
    if not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = auth_header.split(" ", 1)[1].strip()
    token_data = decode_token(token)
    if not is_admin_or_above(token_data.role):
        raise HTTPException(status_code=403, detail="Admin access required")
    return token_data


def _calculate_markup(base_amount: float, markup_type: str, markup_amount: float) -> float:
    if base_amount <= 0:
        return 0.0
    if markup_type == "flat":
        return round(float(markup_amount or 0), 2)
    if markup_type == "percentage":
        return round(base_amount * (float(markup_amount or 0) / 100), 2)
    return 0.0


def _extract_item_reference(item: Dict[str, Any]) -> Dict[str, Optional[str]]:
    return {
        "sku": (item.get("sku") or item.get("product_sku") or "").strip() or None,
        "product_id": item.get("product_id") or item.get("id") or None,
    }


def _extract_item_quantity(item: Dict[str, Any]) -> int:
    raw_qty = item.get("quantity", 1)
    try:
        qty = int(raw_qty)
        return qty if qty > 0 else 1
    except Exception:
        return 1


def _extract_item_unit_price(item: Dict[str, Any]) -> float:
    for key in ["cost_price", "cost", "unit_cost", "price"]:
        if item.get(key) is not None:
            try:
                return float(item.get(key))
            except Exception:
                continue
    return 0.0


def _build_order_billing_breakdown(order: Dict[str, Any], _store: Dict[str, Any]) -> Dict[str, float]:
    items = order.get("items", []) or []
    product_cost = 0.0
    for item in items:
        qty = _extract_item_quantity(item)
        product_cost += _extract_item_unit_price(item) * qty

    # Connected-store owner invoices are cost-only
    shipping_cost = 0.0
    markup_value = 0.0
    invoice_total = round(product_cost, 2)

    return {
        "product_cost": round(product_cost, 2),
        "markup": round(markup_value, 2),
        "shipping_cost": round(shipping_cost, 2),
        "invoice_total": invoice_total,
    }


PRICING_STOCK_CSV_FIELDS = [
    "sku",
    "product_id",
    "product_name",
    "option_strength",
    "option_package",
    "price",
    "wholesale_price",
    "cost_price",
    "stock_quantity",
    "in_stock",
    "estimated_restock",
    "allow_preorder",
]


def _to_bool(value: Any, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in ["1", "true", "yes", "y", "on"]:
        return True
    if text in ["0", "false", "no", "n", "off"]:
        return False
    return default


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None or value == "":
            return float(default)
        return float(value)
    except Exception:
        return float(default)


def _to_int(value: Any, default: int = 0) -> int:
    try:
        if value is None or value == "":
            return int(default)
        return int(float(value))
    except Exception:
        return int(default)


def _normalize_option_value(value: Optional[str]) -> str:
    return (value or "").strip()


def _build_sheet_row_key(
    sku: Optional[str],
    product_id: Optional[str],
    option_strength: Optional[str],
    option_package: Optional[str],
) -> str:
    normalized_sku = (sku or "").strip()
    normalized_pid = (product_id or "").strip()
    strength = _normalize_option_value(option_strength)
    package = _normalize_option_value(option_package)

    if normalized_sku:
        return f"sku::{normalized_sku.lower()}::{strength.lower()}::{package.lower()}"
    return f"pid::{normalized_pid.lower()}::{strength.lower()}::{package.lower()}"


async def _get_pricing_stock_settings() -> Dict[str, Any]:
    settings = await _db.johnny5_pricing_stock_settings.find_one({"type": "global"}, {"_id": 0})
    if not settings:
        return {
            "type": "global",
            "global_markup_percent": 0.0,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    return settings


def _serialize_sheet_row_for_store(row: Dict[str, Any], global_markup_percent: float) -> Dict[str, Any]:
    base_cost = _to_float(row.get("cost_price"), 0.0)
    adjusted_cost = round(base_cost * (1 + (float(global_markup_percent or 0) / 100.0)), 2)
    stock_qty = _to_int(row.get("stock_quantity"), 0)
    in_stock = bool(row.get("in_stock", False)) and stock_qty > 0
    estimated_restock = (row.get("estimated_restock") or "").strip()
    allow_preorder = bool(row.get("allow_preorder", False))

    return {
        "id": row.get("id"),
        "row_key": row.get("row_key"),
        "sku": row.get("sku"),
        "product_id": row.get("product_id"),
        "product_name": row.get("product_name"),
        "option_strength": row.get("option_strength") or "",
        "option_package": row.get("option_package") or "",
        "price": _to_float(row.get("price"), 0.0),
        "cost_price": base_cost,
        "connected_store_cost": adjusted_cost,
        "global_markup_percent": float(global_markup_percent or 0),
        "stock_quantity": stock_qty,
        "in_stock": in_stock,
        "status_icon": "green_check" if in_stock else "red_x",
        "estimated_restock": estimated_restock,
        "allow_preorder": allow_preorder,
        "preorder_without_exact_restock_prompt": bool((not in_stock) and allow_preorder and not estimated_restock),
        "updated_at": row.get("updated_at"),
    }


async def _find_best_sheet_row_for_item(item: StockCheckItem) -> Optional[Dict[str, Any]]:
    if _db is None:
        return None

    strength = _normalize_option_value(item.selected_strength)
    package = _normalize_option_value(item.selected_package)
    candidates = []

    if item.sku:
        candidates.append({"sku": item.sku, "option_strength": strength, "option_package": package})
        candidates.append({"sku": item.sku, "option_strength": "", "option_package": ""})
        candidates.append({"sku": item.sku})

    if item.product_id:
        candidates.append({"product_id": item.product_id, "option_strength": strength, "option_package": package})
        candidates.append({"product_id": item.product_id, "option_strength": "", "option_package": ""})
        candidates.append({"product_id": item.product_id})

    for query in candidates:
        row = await _db.johnny5_pricing_stock_rows.find_one(query, {"_id": 0})
        if row:
            return row

    return None


async def _build_fallback_row_from_product(item: StockCheckItem) -> Optional[Dict[str, Any]]:
    if _db is None:
        return None

    query = None
    if item.sku:
        query = {"sku": item.sku}
    elif item.product_id:
        query = {"id": item.product_id}

    if not query:
        return None

    product = await _db.products.find_one(
        query,
        {"_id": 0, "id": 1, "sku": 1, "name": 1, "price": 1, "cost_price": 1, "quantity": 1, "in_stock": 1, "updated_at": 1},
    )
    if not product:
        return None

    return {
        "id": f"fallback-{product.get('id')}",
        "row_key": _build_sheet_row_key(product.get("sku"), product.get("id"), item.selected_strength, item.selected_package),
        "sku": product.get("sku"),
        "product_id": product.get("id"),
        "product_name": product.get("name"),
        "option_strength": _normalize_option_value(item.selected_strength),
        "option_package": _normalize_option_value(item.selected_package),
        "price": _to_float(product.get("price"), 0.0),
        "cost_price": _to_float(product.get("cost_price"), 0.0),
        "stock_quantity": _to_int(product.get("quantity"), 0),
        "in_stock": bool(product.get("in_stock", False)),
        "estimated_restock": "",
        "allow_preorder": False,
        "updated_at": product.get("updated_at"),
    }


async def _sync_products_from_pricing_rows():
    if _db is None:
        return

    rows = await _db.johnny5_pricing_stock_rows.find({}, {"_id": 0}).to_list(length=20000)
    if not rows:
        return

    products = await _db.products.find({}, {"_id": 0, "id": 1, "sku": 1, "custom_fields_data": 1, "price": 1, "cost_price": 1, "quantity": 1, "in_stock": 1}).to_list(length=10000)
    by_id = {p.get("id"): p for p in products if p.get("id")}
    by_sku = {str(p.get("sku", "")).strip().lower(): p for p in products if p.get("sku")}

    grouped: Dict[str, List[Dict[str, Any]]] = {}
    for row in rows:
        matched_product = None
        if row.get("product_id") and by_id.get(row.get("product_id")):
            matched_product = by_id[row.get("product_id")]
        elif row.get("sku") and by_sku.get(str(row.get("sku", "")).strip().lower()):
            matched_product = by_sku[str(row.get("sku", "")).strip().lower()]

        if not matched_product:
            continue

        grouped.setdefault(matched_product.get("id"), []).append(row)

    now_iso = datetime.now(timezone.utc).isoformat()

    for product_id, product_rows in grouped.items():
        product = by_id.get(product_id)
        if not product:
            continue

        custom_data = dict(product.get("custom_fields_data") or {})
        pricing_matrix = dict(custom_data.get("pricing_matrix") or {})
        option_stock = dict(custom_data.get("option_stock") or {})
        default_strength = custom_data.get("default_strength") or ""
        default_package = custom_data.get("default_package") or ""

        total_qty = 0
        any_in_stock = False
        default_option_price = None
        default_option_cost = None

        for row in product_rows:
            strength = _normalize_option_value(row.get("option_strength")) or default_strength
            package = _normalize_option_value(row.get("option_package")) or default_package

            stock_qty = max(_to_int(row.get("stock_quantity"), 0), 0)
            row_in_stock = bool(row.get("in_stock", False)) and stock_qty > 0
            total_qty += stock_qty
            if row_in_stock:
                any_in_stock = True

            if strength and package:
                strength_prices = dict(pricing_matrix.get(strength) or {})
                if row.get("price") is not None:
                    strength_prices[package] = _to_float(row.get("price"), 0.0)
                pricing_matrix[strength] = strength_prices

                strength_stock = dict(option_stock.get(strength) or {})
                strength_stock[package] = {
                    "stock_quantity": stock_qty,
                    "in_stock": row_in_stock,
                    "estimated_restock": (row.get("estimated_restock") or "").strip(),
                    "allow_preorder": bool(row.get("allow_preorder", False)),
                    "price": _to_float(row.get("price"), 0.0),
                    "wholesale_price": _to_float(row.get("wholesale_price"), 0.0) if row.get("wholesale_price") else None,
                    "cost_price": _to_float(row.get("cost_price"), 0.0),
                    "updated_at": now_iso,
                }
                option_stock[strength] = strength_stock

            if (
                strength == (default_strength or strength)
                and package == (default_package or package)
            ):
                default_option_price = _to_float(row.get("price"), product.get("price", 0.0))
                default_option_cost = _to_float(row.get("cost_price"), product.get("cost_price", 0.0))

        custom_data["pricing_matrix"] = pricing_matrix
        custom_data["option_stock"] = option_stock

        update_fields = {
            "custom_fields_data": custom_data,
            "quantity": total_qty,
            "in_stock": bool(any_in_stock),
            "updated_at": now_iso,
        }
        if default_option_price is not None:
            update_fields["price"] = default_option_price
        if default_option_cost is not None:
            update_fields["cost_price"] = default_option_cost

        await _db.products.update_one({"id": product_id}, {"$set": update_fields})


# ============== STORE MANAGEMENT ==============

@johnny5_router.get("/stores")
async def list_connected_stores():
    """List all connected stores"""
    if _db is None:
        return {"stores": []}
    
    stores = await _db.johnny5_stores.find(
        {},
        {"_id": 0, "api_secret": 0}  # Don't expose secrets
    ).to_list(length=100)
    
    # Add order counts for each store
    for store in stores:
        store["pending_orders"] = await _db.johnny5_orders.count_documents({
            "store_id": store["id"],
            "status": "pending"
        })
        store["total_orders"] = await _db.johnny5_orders.count_documents({
            "store_id": store["id"]
        })
    
    return {"stores": stores}


@johnny5_router.post("/stores")
async def add_connected_store(store: ConnectedStore):
    """Add a new connected store"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    store_id = str(uuid.uuid4())
    # Generate keys for the store to send orders TO Johnny 5
    api_key = generate_api_key()
    api_secret = generate_api_secret()
    
    store_doc = {
        "id": store_id,
        "name": store.name,
        "url": store.url.rstrip("/"),
        "description": store.description,
        # Keys for store -> Johnny 5 communication (store uses these to send orders)
        "api_key": api_key,
        "api_secret": api_secret,
        # Key for Johnny 5 -> store communication (Johnny 5 uses this to push tracking)
        "store_api_key": store.store_api_key or "",
        "shipping_enabled": store.shipping_enabled,
        "shipping_provider": store.shipping_provider,
        "shipping_markup_type": store.shipping_markup_type,
        "shipping_markup_amount": float(store.shipping_markup_amount or 0),
        "stock_sync_enabled": store.stock_sync_enabled,
        "billing_markup_type": store.billing_markup_type,
        "billing_markup_amount": float(store.billing_markup_amount or 0),
        "status": StoreStatus.ACTIVE,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_sync": None,
        "orders_received": 0,
        "orders_fulfilled": 0
    }
    
    await _db.johnny5_stores.insert_one(store_doc)
    
    # Return the credentials (only shown once)
    return {
        "success": True,
        "message": "Store connected successfully",
        "store": {
            "id": store_id,
            "name": store.name,
            "url": store.url,
            "api_key": api_key,
            "api_secret": api_secret,  # Only shown on creation
            "store_api_key": store.store_api_key or "",
            "shipping_enabled": store.shipping_enabled,
            "shipping_provider": store.shipping_provider,
            "shipping_markup_type": store.shipping_markup_type,
            "shipping_markup_amount": float(store.shipping_markup_amount or 0),
            "stock_sync_enabled": store.stock_sync_enabled,
            "billing_markup_type": store.billing_markup_type,
            "billing_markup_amount": float(store.billing_markup_amount or 0),
            "webhook_url": "/api/johnny5/webhook/order"
        },
        "instructions": {
            "step1": "Set JOHNNY5_HUB_URL to this hub URL and add JOHNNY5_API_KEY in the connected store environment",
            "step1b": "Add JOHNNY5_API_SECRET for signed webhook validation (recommended)",
            "step2": "Configure the webhook URL in the connected store",
            "step3": "If the store has Johnny 5 integration enabled, add its API key above to allow tracking pushback"
        }
    }


@johnny5_router.get("/stores/{store_id}")
async def get_store(store_id: str):
    """Get store details"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    store = await _db.johnny5_stores.find_one(
        {"id": store_id},
        {"_id": 0, "api_secret": 0}
    )
    
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Get order stats
    store["stats"] = {
        "pending": await _db.johnny5_orders.count_documents({"store_id": store_id, "status": "pending"}),
        "processing": await _db.johnny5_orders.count_documents({"store_id": store_id, "status": "processing"}),
        "shipped": await _db.johnny5_orders.count_documents({"store_id": store_id, "status": "shipped"}),
        "total": await _db.johnny5_orders.count_documents({"store_id": store_id})
    }
    
    return store


@johnny5_router.put("/stores/{store_id}")
async def update_store(store_id: str, update: StoreUpdate):
    """Update store details"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await _db.johnny5_stores.update_one(
        {"id": store_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Store not found")
    
    return {"success": True, "message": "Store updated"}


@johnny5_router.delete("/stores/{store_id}")
async def delete_store(store_id: str):
    """Remove a connected store"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    result = await _db.johnny5_stores.delete_one({"id": store_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Store not found")
    
    return {"success": True, "message": "Store disconnected"}


@johnny5_router.post("/stores/{store_id}/regenerate-keys")
async def regenerate_store_keys(store_id: str):
    """Regenerate API keys for a store"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    new_api_key = generate_api_key()
    new_api_secret = generate_api_secret()
    
    result = await _db.johnny5_stores.update_one(
        {"id": store_id},
        {"$set": {
            "api_key": new_api_key,
            "api_secret": new_api_secret,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Store not found")
    
    return {
        "success": True,
        "api_key": new_api_key,
        "api_secret": new_api_secret,
        "message": "Keys regenerated. Update the connected store configuration."
    }


# ============== WEBHOOK RECEIVER ==============

@johnny5_router.post("/webhook/order")
async def receive_order_webhook(
    request: Request,
    x_store_api_key: str = Header(None, alias="X-Store-API-Key"),
    x_webhook_signature: str = Header(None, alias="X-Webhook-Signature")
):
    """Receive order from connected store"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Validate API key
    if not x_store_api_key:
        raise HTTPException(status_code=401, detail="Missing API key")
    
    store = await get_store_by_api_key(x_store_api_key)
    if not store:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Parse order data
    try:
        body = await request.body()
        order_data = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    
    # Verify signature if provided
    if x_webhook_signature and store.get("api_secret"):
        if not verify_webhook_signature(body, x_webhook_signature, store["api_secret"]):
            raise HTTPException(status_code=401, detail="Invalid webhook signature")
    
    # Check for duplicate order
    existing = await _db.johnny5_orders.find_one({
        "store_id": store["id"],
        "store_order_id": order_data.get("order_id") or order_data.get("store_order_id")
    })
    
    if existing:
        return {"success": True, "message": "Order already exists", "order_id": existing["id"]}
    
    # Create order in hub
    order_id = str(uuid.uuid4())
    hub_order = {
        "id": order_id,
        "store_id": store["id"],
        "store_name": store["name"],
        "store_order_id": order_data.get("order_id") or order_data.get("store_order_id"),
        "store_order_number": order_data.get("order_number"),
        "customer": {
            "name": order_data.get("customer_name") or order_data.get("customer", {}).get("name"),
            "email": order_data.get("customer_email") or order_data.get("customer", {}).get("email"),
            "phone": order_data.get("customer_phone") or order_data.get("customer", {}).get("phone")
        },
        "shipping_address": order_data.get("shipping_address") or order_data.get("address"),
        "items": order_data.get("items") or order_data.get("line_items", []),
        "totals": {
            "subtotal": float(order_data.get("subtotal", 0)),
            "shipping": float(order_data.get("shipping_cost") or order_data.get("shipping", 0)),
            "tax": float(order_data.get("tax", 0)),
            "total": float(order_data.get("total", 0))
        },
        "status": OrderStatus.PENDING,
        "billing_status": "unbilled",
        "billing_invoice_id": None,
        "tracking": None,
        "notes": order_data.get("notes"),
        "received_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "shipped_at": None,
        "raw_data": order_data  # Store original for reference
    }
    
    await _db.johnny5_orders.insert_one(hub_order)

    # Optional stock sync: Johnny 5 is source of truth for connected stores
    if store.get("stock_sync_enabled", True):
        stock_updates = []
        for item in hub_order.get("items", []):
            ref = _extract_item_reference(item)
            qty = _extract_item_quantity(item)
            if qty <= 0:
                continue

            product_query = None
            if ref.get("sku"):
                product_query = {"sku": ref["sku"]}
            elif ref.get("product_id"):
                product_query = {"id": ref["product_id"]}

            if not product_query:
                continue

            product = await _db.products.find_one(product_query, {"_id": 0, "id": 1, "sku": 1, "quantity": 1})
            if not product:
                stock_updates.append({
                    "sku": ref.get("sku"),
                    "product_id": ref.get("product_id"),
                    "quantity_requested": qty,
                    "status": "not_found",
                })
                continue

            current_qty = int(product.get("quantity", 0) or 0)
            new_qty = max(current_qty - qty, 0)
            await _db.products.update_one(
                {"id": product.get("id")},
                {"$set": {
                    "quantity": new_qty,
                    "in_stock": new_qty > 0,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }}
            )
            stock_updates.append({
                "sku": product.get("sku"),
                "product_id": product.get("id"),
                "quantity_requested": qty,
                "quantity_before": current_qty,
                "quantity_after": new_qty,
                "status": "updated",
            })

        if stock_updates:
            await _db.johnny5_orders.update_one(
                {"id": order_id},
                {"$set": {"stock_sync": {
                    "enabled": True,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "items": stock_updates,
                }}}
            )
    
    # Update store stats
    await _db.johnny5_stores.update_one(
        {"id": store["id"]},
        {
            "$inc": {"orders_received": 1},
            "$set": {"last_sync": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    logger.info(f"Johnny 5: Received order {order_id} from {store['name']}")
    
    return {
        "success": True,
        "message": "Order received",
        "order_id": order_id,
        "hub_order_id": order_id
    }


# ============== ORDER MANAGEMENT ==============

@johnny5_router.get("/orders")
async def list_orders(
    store_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """List all orders from connected stores"""
    if _db is None:
        return {"orders": [], "total": 0}
    
    query = {}
    if store_id:
        query["store_id"] = store_id
    if status:
        query["status"] = status
    
    total = await _db.johnny5_orders.count_documents(query)
    orders = await _db.johnny5_orders.find(
        query,
        {"_id": 0, "raw_data": 0}
    ).sort("received_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    return {
        "orders": orders,
        "total": total,
        "limit": limit,
        "skip": skip
    }


@johnny5_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order details"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    order = await _db.johnny5_orders.find_one({"id": order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order


@johnny5_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    """Update order status"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if status == "shipped":
        update_data["shipped_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await _db.johnny5_orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"success": True, "message": f"Order status updated to {status}"}


# ============== FULFILLMENT ==============

@johnny5_router.post("/orders/{order_id}/add-tracking")
async def add_tracking(order_id: str, tracking: TrackingUpdate):
    """Add tracking information to an order"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    tracking_data = {
        "tracking_number": tracking.tracking_number,
        "carrier": tracking.carrier,
        "tracking_url": tracking.tracking_url or f"https://track.aftership.com/{tracking.carrier}/{tracking.tracking_number}",
        "added_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await _db.johnny5_orders.update_one(
        {"id": order_id},
        {"$set": {
            "tracking": tracking_data,
            "status": OrderStatus.SHIPPED,
            "shipped_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"success": True, "message": "Tracking added", "tracking": tracking_data}


@johnny5_router.post("/orders/{order_id}/push-tracking")
async def push_tracking_to_store(order_id: str):
    """Push tracking information back to the source store"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Get the order
    order = await _db.johnny5_orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if not order.get("tracking"):
        raise HTTPException(status_code=400, detail="No tracking information to push")
    
    # Get the store
    store = await _db.johnny5_stores.find_one({"id": order["store_id"]})
    if not store:
        raise HTTPException(status_code=404, detail="Source store not found")
    
    # Push tracking to the store's webhook endpoint
    tracking_payload = {
        "order_id": order["store_order_id"],
        "tracking_number": order["tracking"]["tracking_number"],
        "carrier": order["tracking"]["carrier"],
        "tracking_url": order["tracking"]["tracking_url"],
        "shipped_at": order.get("shipped_at")
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Call the store's tracking update endpoint
            response = await client.post(
                f"{store['url']}/api/johnny5/receive-tracking",
                json=tracking_payload,
                headers={
                    "X-Hub-API-Key": store["api_key"],
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code in [200, 201]:
                # Mark tracking as pushed
                await _db.johnny5_orders.update_one(
                    {"id": order_id},
                    {"$set": {
                        "tracking.pushed_at": datetime.now(timezone.utc).isoformat(),
                        "tracking.push_status": "success"
                    }}
                )
                
                # Update store stats
                await _db.johnny5_stores.update_one(
                    {"id": store["id"]},
                    {"$inc": {"orders_fulfilled": 1}}
                )
                
                return {"success": True, "message": "Tracking pushed to store"}
            else:
                return {
                    "success": False,
                    "message": f"Store returned status {response.status_code}",
                    "response": response.text[:500]
                }
                
    except Exception as e:
        logger.error(f"Failed to push tracking: {e}")
        return {"success": False, "message": str(e)}


@johnny5_router.post("/orders/batch-push-tracking")
async def batch_push_tracking(order_ids: List[str]):
    """Push tracking for multiple orders"""
    results = []
    for order_id in order_ids:
        try:
            result = await push_tracking_to_store(order_id)
            results.append({"order_id": order_id, **result})
        except Exception as e:
            results.append({"order_id": order_id, "success": False, "message": str(e)})
    
    successful = len([r for r in results if r.get("success")])
    return {
        "message": f"Pushed tracking for {successful}/{len(order_ids)} orders",
        "results": results
    }


# ============== DASHBOARD STATS ==============

@johnny5_router.get("/dashboard")
async def get_dashboard_stats():
    """Get dashboard overview statistics"""
    if _db is None:
        return {
            "stores": {"total": 0, "active": 0},
            "orders": {"pending": 0, "processing": 0, "shipped": 0, "total": 0},
            "today": {"received": 0, "shipped": 0}
        }
    
    # Store stats
    total_stores = await _db.johnny5_stores.count_documents({})
    active_stores = await _db.johnny5_stores.count_documents({"status": "active"})
    
    # Order stats
    pending = await _db.johnny5_orders.count_documents({"status": "pending"})
    processing = await _db.johnny5_orders.count_documents({"status": "processing"})
    shipped = await _db.johnny5_orders.count_documents({"status": "shipped"})
    total_orders = await _db.johnny5_orders.count_documents({})
    
    # Today's stats
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_received = await _db.johnny5_orders.count_documents({
        "received_at": {"$regex": f"^{today}"}
    })
    today_shipped = await _db.johnny5_orders.count_documents({
        "shipped_at": {"$regex": f"^{today}"}
    })
    
    # Recent orders
    recent_orders = await _db.johnny5_orders.find(
        {},
        {"_id": 0, "raw_data": 0}
    ).sort("received_at", -1).limit(5).to_list(length=5)
    
    return {
        "stores": {
            "total": total_stores,
            "active": active_stores
        },
        "orders": {
            "pending": pending,
            "processing": processing,
            "shipped": shipped,
            "total": total_orders
        },
        "today": {
            "received": today_received,
            "shipped": today_shipped
        },
        "recent_orders": recent_orders
    }


# ============== PRICING + STOCK SHEET (PHASE 2) ==============

@johnny5_router.get("/pricing-stock/settings")
async def get_pricing_stock_settings(current_user=Depends(require_admin_user)):
    settings = await _get_pricing_stock_settings()
    return {
        "success": True,
        "settings": {
            "global_markup_percent": _to_float(settings.get("global_markup_percent"), 0.0),
            "updated_at": settings.get("updated_at"),
        },
    }


@johnny5_router.put("/pricing-stock/settings")
async def update_pricing_stock_settings(payload: PricingStockSettingsUpdate, current_user=Depends(require_admin_user)):
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    update_data = {
        "type": "global",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if payload.global_markup_percent is not None:
        update_data["global_markup_percent"] = round(float(payload.global_markup_percent), 4)

    await _db.johnny5_pricing_stock_settings.update_one(
        {"type": "global"},
        {"$set": update_data},
        upsert=True,
    )

    settings = await _get_pricing_stock_settings()
    return {
        "success": True,
        "settings": {
            "global_markup_percent": _to_float(settings.get("global_markup_percent"), 0.0),
            "updated_at": settings.get("updated_at"),
        },
    }


@johnny5_router.get("/pricing-stock/rows")
async def list_pricing_stock_rows(current_user=Depends(require_admin_user)):
    if _db is None:
        return {"success": True, "rows": [], "total": 0}

    rows = await _db.johnny5_pricing_stock_rows.find({}, {"_id": 0}).sort("updated_at", -1).to_list(length=20000)
    settings = await _get_pricing_stock_settings()
    markup = _to_float(settings.get("global_markup_percent"), 0.0)
    serialized = [_serialize_sheet_row_for_store(row, markup) for row in rows]
    return {
        "success": True,
        "rows": serialized,
        "total": len(serialized),
        "global_markup_percent": markup,
    }


@johnny5_router.post("/pricing-stock/rows")
async def create_pricing_stock_row(payload: PricingStockRowCreate, current_user=Depends(require_admin_user)):
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    sku = (payload.sku or "").strip()
    product_id = (payload.product_id or "").strip()
    if not sku and not product_id:
        raise HTTPException(status_code=400, detail="sku or product_id is required")

    option_strength = _normalize_option_value(payload.option_strength)
    option_package = _normalize_option_value(payload.option_package)
    now_iso = datetime.now(timezone.utc).isoformat()
    row_key = _build_sheet_row_key(sku, product_id, option_strength, option_package)

    row_doc = {
        "id": str(uuid.uuid4()),
        "row_key": row_key,
        "sku": sku or None,
        "product_id": product_id or None,
        "product_name": (payload.product_name or "").strip() or None,
        "option_strength": option_strength,
        "option_package": option_package,
        "price": round(float(payload.price or 0.0), 2),
        "cost_price": round(float(payload.cost_price or 0.0), 2),
        "stock_quantity": max(int(payload.stock_quantity or 0), 0),
        "in_stock": bool(payload.in_stock) and int(payload.stock_quantity or 0) > 0,
        "estimated_restock": (payload.estimated_restock or "").strip(),
        "allow_preorder": bool(payload.allow_preorder),
        "updated_source": "manual",
        "updated_at": now_iso,
        "created_at": now_iso,
    }

    await _db.johnny5_pricing_stock_rows.update_one(
        {"row_key": row_key},
        {"$set": row_doc},
        upsert=True,
    )
    await _sync_products_from_pricing_rows()

    settings = await _get_pricing_stock_settings()
    markup = _to_float(settings.get("global_markup_percent"), 0.0)
    return {
        "success": True,
        "row": _serialize_sheet_row_for_store(row_doc, markup),
    }


@johnny5_router.put("/pricing-stock/rows/{row_id}")
async def update_pricing_stock_row(row_id: str, payload: PricingStockRowUpdate, current_user=Depends(require_admin_user)):
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    row = await _db.johnny5_pricing_stock_rows.find_one({"id": row_id}, {"_id": 0})
    if not row:
        raise HTTPException(status_code=404, detail="Row not found")

    update_data: Dict[str, Any] = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_source": "manual",
    }
    if payload.stock_quantity is not None:
        update_data["stock_quantity"] = max(int(payload.stock_quantity), 0)
    if payload.in_stock is not None:
        update_data["in_stock"] = bool(payload.in_stock)
    if payload.estimated_restock is not None:
        update_data["estimated_restock"] = (payload.estimated_restock or "").strip()
    if payload.allow_preorder is not None:
        update_data["allow_preorder"] = bool(payload.allow_preorder)
    if payload.price is not None:
        update_data["price"] = round(float(payload.price), 2)
    if payload.cost_price is not None:
        update_data["cost_price"] = round(float(payload.cost_price), 2)

    await _db.johnny5_pricing_stock_rows.update_one({"id": row_id}, {"$set": update_data})
    await _sync_products_from_pricing_rows()

    updated = await _db.johnny5_pricing_stock_rows.find_one({"id": row_id}, {"_id": 0})
    settings = await _get_pricing_stock_settings()
    markup = _to_float(settings.get("global_markup_percent"), 0.0)
    return {
        "success": True,
        "row": _serialize_sheet_row_for_store(updated, markup),
    }


@johnny5_router.get("/pricing-stock/export.csv")
async def export_pricing_stock_csv(current_user=Depends(require_admin_user)):
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    rows = await _db.johnny5_pricing_stock_rows.find({}, {"_id": 0}).sort("sku", 1).to_list(length=50000)
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=PRICING_STOCK_CSV_FIELDS)
    writer.writeheader()

    for row in rows:
        writer.writerow({
            "sku": row.get("sku") or "",
            "product_id": row.get("product_id") or "",
            "product_name": row.get("product_name") or "",
            "option_strength": row.get("option_strength") or "",
            "option_package": row.get("option_package") or "",
            "price": _to_float(row.get("price"), 0.0),
            "wholesale_price": _to_float(row.get("wholesale_price"), 0.0) if row.get("wholesale_price") else "",
            "cost_price": _to_float(row.get("cost_price"), 0.0),
            "stock_quantity": _to_int(row.get("stock_quantity"), 0),
            "in_stock": "true" if bool(row.get("in_stock", False)) else "false",
            "estimated_restock": row.get("estimated_restock") or "",
            "allow_preorder": "true" if bool(row.get("allow_preorder", False)) else "false",
        })

    csv_content = output.getvalue()
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=johnny5_pricing_stock_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"},
    )


@johnny5_router.post("/pricing-stock/sync-from-products")
async def sync_pricing_stock_from_products(current_user=Depends(require_admin_user)):
    """
    Sync all live store products (with their options) into the Johnny 5 pricing/stock sheet.
    This pulls products from the store catalog and creates rows for each option combination.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    # Fetch all products from the store
    products = await _db.products.find(
        {"status": {"$ne": "draft"}},
        {"_id": 0}
    ).to_list(length=10000)

    now_iso = datetime.now(timezone.utc).isoformat()
    synced_count = 0
    created_count = 0
    updated_count = 0

    for product in products:
        product_id = product.get("id")
        sku = product.get("sku") or ""
        name = product.get("name") or ""
        base_price = _to_float(product.get("price"), 0.0)
        cost_price = _to_float(product.get("cost_price"), 0.0)
        base_quantity = _to_int(product.get("quantity"), 0)
        base_in_stock = bool(product.get("in_stock", False))

        custom_data = product.get("custom_fields_data") or {}
        strength_options = custom_data.get("strength_options") or []
        package_options = custom_data.get("package_options") or []
        pricing_matrix = custom_data.get("pricing_matrix") or {}
        option_stock = custom_data.get("option_stock") or {}

        # If product has options, create a row for each combination
        if strength_options and package_options:
            for strength in strength_options:
                strength_prices = pricing_matrix.get(strength) or {}
                strength_stock = option_stock.get(strength) or {}

                for package in package_options:
                    option_price = _to_float(strength_prices.get(package), base_price)
                    stock_info = strength_stock.get(package) or {}
                    option_quantity = _to_int(stock_info.get("stock_quantity"), base_quantity)
                    option_in_stock = bool(stock_info.get("in_stock", base_in_stock))
                    option_cost = _to_float(stock_info.get("cost_price"), cost_price)
                    option_wholesale = _to_float(stock_info.get("wholesale_price"), 0.0)
                    estimated_restock = (stock_info.get("estimated_restock") or "").strip()
                    allow_preorder = bool(stock_info.get("allow_preorder", False))

                    row_key = _build_sheet_row_key(sku, product_id, strength, package)

                    # Check if row exists
                    existing = await _db.johnny5_pricing_stock_rows.find_one({"row_key": row_key})

                    row_doc = {
                        "row_key": row_key,
                        "sku": sku or None,
                        "product_id": product_id,
                        "product_name": name,
                        "option_strength": _normalize_option_value(strength),
                        "option_package": _normalize_option_value(package),
                        "price": round(option_price, 2),
                        "wholesale_price": round(option_wholesale, 2) if option_wholesale else None,
                        "cost_price": round(option_cost, 2),
                        "stock_quantity": option_quantity,
                        "in_stock": option_in_stock and option_quantity > 0,
                        "estimated_restock": estimated_restock,
                        "allow_preorder": allow_preorder,
                        "updated_source": "product_sync",
                        "updated_at": now_iso,
                    }

                    if existing:
                        await _db.johnny5_pricing_stock_rows.update_one(
                            {"row_key": row_key},
                            {"$set": row_doc}
                        )
                        updated_count += 1
                    else:
                        row_doc["id"] = str(uuid.uuid4())
                        row_doc["created_at"] = now_iso
                        await _db.johnny5_pricing_stock_rows.insert_one(row_doc)
                        created_count += 1

                    synced_count += 1
        else:
            # Product has no options - create a single row
            row_key = _build_sheet_row_key(sku, product_id, "", "")

            existing = await _db.johnny5_pricing_stock_rows.find_one({"row_key": row_key})
            
            # Get base wholesale price from product level
            base_wholesale = _to_float(product.get("wholesale_price"), 0.0)

            row_doc = {
                "row_key": row_key,
                "sku": sku or None,
                "product_id": product_id,
                "product_name": name,
                "option_strength": "",
                "option_package": "",
                "price": round(base_price, 2),
                "wholesale_price": round(base_wholesale, 2) if base_wholesale else None,
                "cost_price": round(cost_price, 2),
                "stock_quantity": base_quantity,
                "in_stock": base_in_stock and base_quantity > 0,
                "estimated_restock": "",
                "allow_preorder": False,
                "updated_source": "product_sync",
                "updated_at": now_iso,
            }

            if existing:
                await _db.johnny5_pricing_stock_rows.update_one(
                    {"row_key": row_key},
                    {"$set": row_doc}
                )
                updated_count += 1
            else:
                row_doc["id"] = str(uuid.uuid4())
                row_doc["created_at"] = now_iso
                await _db.johnny5_pricing_stock_rows.insert_one(row_doc)
                created_count += 1

            synced_count += 1

    return {
        "success": True,
        "message": f"Synced {synced_count} product rows from live catalog",
        "synced": synced_count,
        "created": created_count,
        "updated": updated_count,
        "products_processed": len(products),
    }


@johnny5_router.get("/products")
async def list_johnny5_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    in_stock: Optional[bool] = None,
    limit: int = 50,
    skip: int = 0,
    current_user=Depends(require_admin_user)
):
    """
    List all products with their full option details for Johnny 5 dashboard.
    This is a clone of the store products list with additional inventory info.
    """
    if _db is None:
        return {"products": [], "total": 0}

    # Build query
    query: Dict[str, Any] = {"status": {"$ne": "draft"}}

    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}},
        ]

    if category:
        query["category"] = category

    if in_stock is not None:
        query["in_stock"] = in_stock

    total = await _db.products.count_documents(query)
    products = await _db.products.find(
        query,
        {"_id": 0}
    ).sort("name", 1).skip(skip).limit(limit).to_list(length=limit)

    # Enrich products with option breakdown and stock status
    enriched_products = []
    for product in products:
        custom_data = product.get("custom_fields_data") or {}
        strength_options = custom_data.get("strength_options") or []
        package_options = custom_data.get("package_options") or []
        pricing_matrix = custom_data.get("pricing_matrix") or {}
        option_stock = custom_data.get("option_stock") or {}

        # Build option combinations with stock info
        options_breakdown = []
        total_stock = 0
        any_in_stock = False

        if strength_options and package_options:
            for strength in strength_options:
                strength_prices = pricing_matrix.get(strength) or {}
                strength_stock = option_stock.get(strength) or {}

                for package in package_options:
                    stock_info = strength_stock.get(package) or {}
                    qty = _to_int(stock_info.get("stock_quantity"), 0)
                    is_in_stock = bool(stock_info.get("in_stock", False)) and qty > 0
                    price = _to_float(strength_prices.get(package), product.get("price", 0))

                    total_stock += qty
                    if is_in_stock:
                        any_in_stock = True

                    options_breakdown.append({
                        "strength": strength,
                        "package": package,
                        "price": price,
                        "stock_quantity": qty,
                        "in_stock": is_in_stock,
                        "estimated_restock": stock_info.get("estimated_restock") or "",
                        "allow_preorder": bool(stock_info.get("allow_preorder", False)),
                    })
        else:
            # No options - use base product info
            total_stock = _to_int(product.get("quantity"), 0)
            any_in_stock = bool(product.get("in_stock", False)) and total_stock > 0

        enriched_products.append({
            "id": product.get("id"),
            "name": product.get("name"),
            "sku": product.get("sku"),
            "category": product.get("category"),
            "image": product.get("image"),
            "price": _to_float(product.get("price"), 0.0),
            "cost_price": _to_float(product.get("cost_price"), 0.0),
            "has_options": bool(strength_options and package_options),
            "strength_options": strength_options,
            "package_options": package_options,
            "options_breakdown": options_breakdown,
            "total_stock": total_stock,
            "in_stock": any_in_stock,
            "sold_count": _to_int(product.get("sold_count"), 0),
            "updated_at": product.get("updated_at"),
        })

    # Get categories for filter
    categories = await _db.products.distinct("category", {"status": {"$ne": "draft"}})

    return {
        "products": enriched_products,
        "total": total,
        "limit": limit,
        "skip": skip,
        "categories": sorted([c for c in categories if c]),
    }


# Enhanced CSV Export - Direct from live products
LIVE_PRODUCTS_CSV_FIELDS = [
    "product_id",
    "sku",
    "product_name",
    "category",
    "strength",
    "package",
    "price",
    "cost_price",
    "stock_quantity",
    "in_stock",
    "description",
    "image_url",
    "updated_at",
]


@johnny5_router.get("/products/export.csv")
async def export_live_products_csv(current_user=Depends(require_admin_user)):
    """
    Export all live products with their full option matrices directly from the products collection.
    This includes all strength × package combinations with their respective pricing.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    # Fetch all live products
    products = await _db.products.find(
        {"status": {"$ne": "draft"}},
        {"_id": 0}
    ).sort("name", 1).to_list(length=10000)

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=LIVE_PRODUCTS_CSV_FIELDS)
    writer.writeheader()

    for product in products:
        product_id = product.get("id") or ""
        sku = product.get("sku") or ""
        name = product.get("name") or ""
        category = product.get("category") or ""
        base_price = _to_float(product.get("price"), 0.0)
        cost_price = _to_float(product.get("cost_price"), 0.0)
        base_quantity = _to_int(product.get("quantity"), 0)
        base_in_stock = bool(product.get("in_stock", False))
        description = (product.get("description") or "").replace("\n", " ").replace("\r", " ")[:500]
        image = product.get("image") or ""
        updated_at = product.get("updated_at") or ""

        custom_data = product.get("custom_fields_data") or {}
        strength_options = custom_data.get("strength_options") or []
        package_options = custom_data.get("package_options") or []
        pricing_matrix = custom_data.get("pricing_matrix") or {}
        option_stock = custom_data.get("option_stock") or {}

        # If product has options, create a row for each combination
        if strength_options and package_options:
            for strength in strength_options:
                strength_prices = pricing_matrix.get(strength) or {}
                strength_stock = option_stock.get(strength) or {}

                for package in package_options:
                    option_price = _to_float(strength_prices.get(package), base_price)
                    stock_info = strength_stock.get(package) or {}
                    option_quantity = _to_int(stock_info.get("stock_quantity"), base_quantity)
                    option_in_stock = bool(stock_info.get("in_stock", base_in_stock)) and option_quantity > 0
                    option_cost = _to_float(stock_info.get("cost_price"), cost_price)

                    writer.writerow({
                        "product_id": product_id,
                        "sku": sku,
                        "product_name": name,
                        "category": category,
                        "strength": strength,
                        "package": package,
                        "price": round(option_price, 2),
                        "cost_price": round(option_cost, 2),
                        "stock_quantity": option_quantity,
                        "in_stock": "true" if option_in_stock else "false",
                        "description": description,
                        "image_url": image,
                        "updated_at": updated_at,
                    })
        else:
            # Product has no options - create a single row
            writer.writerow({
                "product_id": product_id,
                "sku": sku,
                "product_name": name,
                "category": category,
                "strength": "",
                "package": "",
                "price": round(base_price, 2),
                "cost_price": round(cost_price, 2),
                "stock_quantity": base_quantity,
                "in_stock": "true" if (base_in_stock and base_quantity > 0) else "false",
                "description": description,
                "image_url": image,
                "updated_at": updated_at,
            })

    csv_content = output.getvalue()
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=amino_chain_products_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"},
    )


@johnny5_router.post("/pricing-stock/import.csv")
async def import_pricing_stock_csv(file: UploadFile = File(...), current_user=Depends(require_admin_user)):
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    filename = (file.filename or "").lower()
    if not filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV is supported")

    content = await file.read()
    try:
        decoded = content.decode("utf-8-sig")
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to decode CSV file")

    reader = csv.DictReader(io.StringIO(decoded))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV is missing headers")

    missing = [field for field in PRICING_STOCK_CSV_FIELDS if field not in reader.fieldnames]
    if missing:
        raise HTTPException(status_code=400, detail=f"CSV is missing required columns: {', '.join(missing)}")

    imported_rows: List[Dict[str, Any]] = []
    errors: List[str] = []
    now_iso = datetime.now(timezone.utc).isoformat()

    for index, row in enumerate(reader, start=2):
        sku = (row.get("sku") or "").strip()
        product_id = (row.get("product_id") or "").strip()
        if not sku and not product_id:
            errors.append(f"Row {index}: sku or product_id is required")
            continue

        option_strength = _normalize_option_value(row.get("option_strength"))
        option_package = _normalize_option_value(row.get("option_package"))
        stock_qty = max(_to_int(row.get("stock_quantity"), 0), 0)
        in_stock = _to_bool(row.get("in_stock"), default=(stock_qty > 0)) and stock_qty > 0

        imported_rows.append({
            "id": str(uuid.uuid4()),
            "row_key": _build_sheet_row_key(sku, product_id, option_strength, option_package),
            "sku": sku or None,
            "product_id": product_id or None,
            "product_name": (row.get("product_name") or "").strip() or None,
            "option_strength": option_strength,
            "option_package": option_package,
            "price": round(_to_float(row.get("price"), 0.0), 2),
            "wholesale_price": round(_to_float(row.get("wholesale_price"), 0.0), 2) if row.get("wholesale_price") else None,
            "cost_price": round(_to_float(row.get("cost_price"), 0.0), 2),
            "stock_quantity": stock_qty,
            "in_stock": in_stock,
            "estimated_restock": (row.get("estimated_restock") or "").strip(),
            "allow_preorder": _to_bool(row.get("allow_preorder"), False),
            "updated_source": "import",
            "updated_at": now_iso,
            "created_at": now_iso,
        })

    # Last row wins on duplicate row_key (deterministic overwrite within same CSV)
    deduped: Dict[str, Dict[str, Any]] = {}
    for row in imported_rows:
        deduped[row["row_key"]] = row
    imported_rows = list(deduped.values())

    if errors:
        raise HTTPException(status_code=400, detail={"message": "Import failed", "errors": errors})

    await _db.johnny5_pricing_stock_rows.delete_many({})
    if imported_rows:
        await _db.johnny5_pricing_stock_rows.insert_many(imported_rows)

    await _sync_products_from_pricing_rows()

    return {
        "success": True,
        "imported": len(imported_rows),
        "errors": [],
        "message": "Pricing and stock sheet imported successfully",
    }


@johnny5_router.post("/local/stock/check")
async def check_local_cart_stock(payload: StockCheckRequest):
    """Local storefront cart check against Johnny 5 pricing + stock sheet."""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    settings = await _get_pricing_stock_settings()
    markup = _to_float(settings.get("global_markup_percent"), 0.0)
    results = []
    all_available = True

    for item in payload.items:
        row = await _find_best_sheet_row_for_item(item)
        if not row:
            row = await _build_fallback_row_from_product(item)
        if not row:
            all_available = False
            results.append({
                "sku": item.sku,
                "product_id": item.product_id,
                "requested": item.quantity,
                "available": 0,
                "in_stock": False,
                "status": "not_found",
                "status_icon": "red_x",
                "estimated_restock": "",
                "allow_preorder": False,
                "preorder_without_exact_restock_prompt": False,
            })
            continue

        serialized = _serialize_sheet_row_for_store(row, markup)
        available_qty = _to_int(serialized.get("stock_quantity"), 0)
        is_available = bool(serialized.get("in_stock")) and available_qty >= max(int(item.quantity), 1)
        allow_preorder = bool(serialized.get("allow_preorder", False))
        if not is_available and not allow_preorder:
            all_available = False

        results.append({
            **serialized,
            "requested": max(int(item.quantity), 1),
            "available": available_qty,
            "status": "ok" if is_available else ("preorder_allowed" if allow_preorder else "insufficient"),
        })

    return {
        "success": True,
        "all_available": all_available,
        "results": results,
    }


# ============== CONNECTED STORE INTEGRATION (Shipping + Stock) ==============

@johnny5_router.post("/integration/shipping/rates")
async def get_connected_store_shipping_rates(
    payload: ConnectedShippingRateRequest,
    x_store_api_key: str = Header(None, alias="X-Store-API-Key")
):
    """Connected store endpoint: get checkout shipping rates from Johnny 5 based on per-store config."""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    if not x_store_api_key:
        raise HTTPException(status_code=401, detail="Missing API key")

    store = await get_store_by_api_key(x_store_api_key)
    if not store:
        raise HTTPException(status_code=401, detail="Invalid API key")

    if not store.get("shipping_enabled", False):
        raise HTTPException(status_code=403, detail="Shipping calculator is disabled for this store")

    from shipping import (
        AddressModel,
        ShippingRateRequest,
        ShippoClient,
        EasyPostClient,
        ShipStationClient,
        get_shipping_settings,
        apply_upcharge,
    )

    settings = await get_shipping_settings()
    provider = (store.get("shipping_provider") or "active").lower()
    if provider == "active":
        provider = (settings.get("active_provider") or "").lower()

    if provider not in {"shippo", "easypost", "shipstation"}:
        raise HTTPException(status_code=400, detail="No valid shipping provider configured for this store")

    provider_enabled = bool(settings.get(f"{provider}_enabled"))
    if not provider_enabled:
        raise HTTPException(status_code=400, detail=f"{provider} is not enabled in Johnny 5 shipping settings")

    to_addr = payload.to_address or {}
    to_address = AddressModel(
        name=to_addr.get("name") or "Customer",
        company=to_addr.get("company"),
        street1=to_addr.get("street1") or to_addr.get("address1") or "",
        street2=to_addr.get("street2") or to_addr.get("address2"),
        city=to_addr.get("city") or "",
        state=to_addr.get("state") or "",
        zip_code=to_addr.get("zip_code") or to_addr.get("zip") or "",
        country=to_addr.get("country") or "US",
        phone=to_addr.get("phone"),
        email=to_addr.get("email"),
    )

    from_address = AddressModel(
        name=settings.get("origin_name", "Gingerkare"),
        company=None,
        street1=settings.get("origin_street1", "7860 Eddins Road"),
        street2=settings.get("origin_street2"),
        city=settings.get("origin_city", "Dothan"),
        state=settings.get("origin_state", "AL"),
        zip_code=settings.get("origin_zip", "36301"),
        country=settings.get("origin_country", "US"),
        phone=settings.get("origin_phone"),
        email=None,
    )

    rate_request = ShippingRateRequest(
        from_address=from_address,
        to_address=to_address,
        weight_oz=payload.weight_oz,
    )

    if provider == "shippo":
        client = ShippoClient(settings.get("shippo_api_key"))
    elif provider == "easypost":
        client = EasyPostClient(settings.get("easypost_api_key"))
    else:
        client = ShipStationClient(settings.get("shipstation_api_key"), settings.get("shipstation_api_secret"))

    raw_rates = await client.get_rates(rate_request)
    shipping_markup_type = store.get("shipping_markup_type", "none")
    shipping_markup_amount = float(store.get("shipping_markup_amount", 0) or 0)

    free_shipping_eligible = (
        settings.get("free_shipping_enabled", False)
        and payload.order_subtotal >= float(settings.get("free_shipping_threshold", 0) or 0)
    )

    rates = []
    if free_shipping_eligible:
        rates.append({
            "provider": "store",
            "carrier": "FREE",
            "service": "Free Ground Shipping",
            "rate": 0,
            "rate_with_upcharge": 0,
            "estimated_days": 5,
            "rate_id": "free_shipping",
            "is_free": True,
        })

    for raw in raw_rates:
        base_rate = float(raw.get("rate", 0) or 0)
        global_adjusted = apply_upcharge(base_rate, settings, payload.product_upcharge)
        store_markup = _calculate_markup(global_adjusted, shipping_markup_type, shipping_markup_amount)
        rates.append({
            "provider": raw.get("provider", provider),
            "carrier": raw.get("carrier", ""),
            "service": raw.get("service", ""),
            "rate": round(base_rate, 2),
            "rate_with_upcharge": round(global_adjusted + store_markup, 2),
            "estimated_days": raw.get("estimated_days"),
            "rate_id": raw.get("rate_id", ""),
        })

    rates.sort(key=lambda r: r.get("rate_with_upcharge", 0))
    return {
        "success": True,
        "store_id": store.get("id"),
        "provider": provider,
        "rates": rates,
    }


@johnny5_router.get("/integration/stock")
async def get_connected_store_stock(
    skus: Optional[str] = None,
    product_ids: Optional[str] = None,
    x_store_api_key: str = Header(None, alias="X-Store-API-Key")
):
    """Connected store endpoint: pull stock availability from Johnny 5 source-of-truth inventory."""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    if not x_store_api_key:
        raise HTTPException(status_code=401, detail="Missing API key")

    store = await get_store_by_api_key(x_store_api_key)
    if not store:
        raise HTTPException(status_code=401, detail="Invalid API key")

    if not store.get("stock_sync_enabled", True):
        raise HTTPException(status_code=403, detail="Stock sync is disabled for this store")

    query: Dict[str, Any] = {}
    sku_list = [s.strip() for s in (skus or "").split(",") if s.strip()]
    id_list = [s.strip() for s in (product_ids or "").split(",") if s.strip()]
    filters = []
    if sku_list:
        filters.append({"sku": {"$in": sku_list}})
    if id_list:
        filters.append({"product_id": {"$in": id_list}})
    if filters:
        query = {"$or": filters}

    rows = await _db.johnny5_pricing_stock_rows.find(query, {"_id": 0}).to_list(length=50000)
    if not rows:
        legacy_query: Dict[str, Any] = {}
        legacy_filters = []
        if sku_list:
            legacy_filters.append({"sku": {"$in": sku_list}})
        if id_list:
            legacy_filters.append({"id": {"$in": id_list}})
        if legacy_filters:
            legacy_query = {"$or": legacy_filters}

        legacy_products = await _db.products.find(
            legacy_query,
            {"_id": 0, "id": 1, "sku": 1, "name": 1, "price": 1, "cost_price": 1, "quantity": 1, "in_stock": 1, "updated_at": 1},
        ).to_list(length=50000)

        rows = [
            {
                "id": f"fallback-{p.get('id')}",
                "row_key": _build_sheet_row_key(p.get("sku"), p.get("id"), "", ""),
                "sku": p.get("sku"),
                "product_id": p.get("id"),
                "product_name": p.get("name"),
                "option_strength": "",
                "option_package": "",
                "price": _to_float(p.get("price"), 0.0),
                "cost_price": _to_float(p.get("cost_price"), 0.0),
                "stock_quantity": _to_int(p.get("quantity"), 0),
                "in_stock": bool(p.get("in_stock", False)),
                "estimated_restock": "",
                "allow_preorder": False,
                "updated_at": p.get("updated_at"),
            }
            for p in legacy_products
        ]
    settings = await _get_pricing_stock_settings()
    markup = _to_float(settings.get("global_markup_percent"), 0.0)
    products = [_serialize_sheet_row_for_store(row, markup) for row in rows]

    return {
        "success": True,
        "store_id": store.get("id"),
        "count": len(products),
        "products": products,
    }


@johnny5_router.post("/integration/stock/check")
async def check_connected_store_stock(
    payload: StockCheckRequest,
    x_store_api_key: str = Header(None, alias="X-Store-API-Key")
):
    """Connected store endpoint: validate item quantities against Johnny 5 inventory before checkout."""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    if not x_store_api_key:
        raise HTTPException(status_code=401, detail="Missing API key")

    store = await get_store_by_api_key(x_store_api_key)
    if not store:
        raise HTTPException(status_code=401, detail="Invalid API key")

    if not store.get("stock_sync_enabled", True):
        raise HTTPException(status_code=403, detail="Stock sync is disabled for this store")

    settings = await _get_pricing_stock_settings()
    markup = _to_float(settings.get("global_markup_percent"), 0.0)
    results = []
    all_available = True
    for item in payload.items:
        if not item.sku and not item.product_id:
            all_available = False
            results.append({
                "sku": item.sku,
                "product_id": item.product_id,
                "requested": item.quantity,
                "available": 0,
                "in_stock": False,
                "status": "missing_reference",
            })
            continue

        row = await _find_best_sheet_row_for_item(item)
        if not row:
            row = await _build_fallback_row_from_product(item)
        if not row:
            all_available = False
            results.append({
                "sku": item.sku,
                "product_id": item.product_id,
                "requested": item.quantity,
                "available": 0,
                "in_stock": False,
                "status": "not_found",
                "status_icon": "red_x",
                "estimated_restock": "",
                "allow_preorder": False,
                "preorder_without_exact_restock_prompt": False,
            })
            continue

        serialized = _serialize_sheet_row_for_store(row, markup)
        available_qty = _to_int(serialized.get("stock_quantity"), 0)
        requested_qty = max(int(item.quantity), 1)
        is_available = bool(serialized.get("in_stock", False)) and available_qty >= requested_qty
        allow_preorder = bool(serialized.get("allow_preorder", False))

        if not is_available and not allow_preorder:
            all_available = False

        results.append({
            **serialized,
            "requested": requested_qty,
            "available": available_qty,
            "status": "ok" if is_available else ("preorder_allowed" if allow_preorder else "insufficient"),
        })

    return {
        "success": True,
        "all_available": all_available,
        "results": results,
    }


@johnny5_router.get("/integration/billing/invoices")
async def get_connected_store_billing_invoices(
    status: Optional[str] = None,
    x_store_api_key: str = Header(None, alias="X-Store-API-Key")
):
    """Connected store owner endpoint: view invoices issued by Johnny 5 for this store."""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    if not x_store_api_key:
        raise HTTPException(status_code=401, detail="Missing API key")

    store = await get_store_by_api_key(x_store_api_key)
    if not store:
        raise HTTPException(status_code=401, detail="Invalid API key")

    query: Dict[str, Any] = {"store_id": store.get("id")}
    if status:
        query["status"] = status

    invoices = await _db.johnny5_billing_invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(length=500)
    return {
        "success": True,
        "store_id": store.get("id"),
        "store_name": store.get("name"),
        "invoices": invoices,
        "total": len(invoices),
    }


# ============== BILLING SYSTEM (Johnny 5 ↔ Connected Store Owner) ==============

@johnny5_router.get("/billing/orders")
async def list_orders_for_billing(
    store_id: Optional[str] = None,
    billing_status: str = "unbilled",
    current_user=Depends(require_admin_user)
):
    if _db is None:
        return {"orders": [], "total": 0}

    query: Dict[str, Any] = {}
    if store_id:
        query["store_id"] = store_id

    if billing_status == "all":
        pass
    elif billing_status == "unbilled":
        query["$or"] = [{"billing_status": "unbilled"}, {"billing_status": {"$exists": False}}]
    else:
        query["billing_status"] = billing_status

    orders = await _db.johnny5_orders.find(query, {"_id": 0, "raw_data": 0}).sort("received_at", -1).to_list(length=500)
    stores = {
        s["id"]: s for s in await _db.johnny5_stores.find({}, {"_id": 0}).to_list(length=200)
    }

    enriched = []
    for order in orders:
        store = stores.get(order.get("store_id"), {})
        breakdown = _build_order_billing_breakdown(order, store)
        enriched.append({
            **order,
            "billing_breakdown": breakdown,
        })

    return {"orders": enriched, "total": len(enriched)}


@johnny5_router.post("/billing/invoices")
async def create_store_billing_invoice(payload: BillingInvoiceCreateRequest, current_user=Depends(require_admin_user)):
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    if not payload.order_ids:
        raise HTTPException(status_code=400, detail="No orders selected")

    orders = await _db.johnny5_orders.find(
        {
            "id": {"$in": payload.order_ids},
            "store_id": payload.store_id,
        },
        {"_id": 0, "raw_data": 0}
    ).to_list(length=500)

    if not orders:
        raise HTTPException(status_code=404, detail="No matching orders found")

    store = await _db.johnny5_stores.find_one({"id": payload.store_id}, {"_id": 0})
    if not store:
        # Backward compatibility for legacy synced orders from disconnected/deleted stores
        store = {
            "id": payload.store_id,
            "name": orders[0].get("store_name") or payload.store_id,
            "billing_markup_type": "none",
            "billing_markup_amount": 0,
        }

    invoice_id = str(uuid.uuid4())
    invoice_number = f"J5-BILL-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{invoice_id[:6].upper()}"
    line_items = []
    totals = {
        "product_cost": 0.0,
        "markup": 0.0,
        "shipping_cost": 0.0,
        "invoice_total": 0.0,
    }

    for order in orders:
        breakdown = _build_order_billing_breakdown(order, store)
        line_items.append({
            "order_id": order.get("id"),
            "store_order_id": order.get("store_order_id"),
            "store_order_number": order.get("store_order_number"),
            "received_at": order.get("received_at"),
            **breakdown,
        })
        for key in totals:
            totals[key] += breakdown.get(key, 0)

    totals = {k: round(v, 2) for k, v in totals.items()}

    invoice_doc = {
        "id": invoice_id,
        "invoice_number": invoice_number,
        "store_id": payload.store_id,
        "store_name": store.get("name"),
        "status": "pending",
        "line_items": line_items,
        "totals": totals,
        "order_ids": [o.get("id") for o in orders],
        "notes": payload.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "paid_at": None,
    }

    await _db.johnny5_billing_invoices.insert_one(dict(invoice_doc))
    await _db.johnny5_orders.update_many(
        {"id": {"$in": invoice_doc["order_ids"]}},
        {"$set": {
            "billing_status": "invoiced",
            "billing_invoice_id": invoice_id,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )

    return {"success": True, "invoice": invoice_doc}


@johnny5_router.get("/billing/invoices")
async def list_store_billing_invoices(
    store_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user=Depends(require_admin_user)
):
    if _db is None:
        return {"invoices": [], "total": 0}

    query: Dict[str, Any] = {}
    if store_id:
        query["store_id"] = store_id
    if status:
        query["status"] = status

    invoices = await _db.johnny5_billing_invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(length=500)
    return {"invoices": invoices, "total": len(invoices)}


@johnny5_router.put("/billing/invoices/{invoice_id}/mark-paid")
async def mark_store_invoice_paid(invoice_id: str, current_user=Depends(require_admin_user)):
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    invoice = await _db.johnny5_billing_invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    paid_at = datetime.now(timezone.utc).isoformat()
    await _db.johnny5_billing_invoices.update_one(
        {"id": invoice_id},
        {"$set": {"status": "paid", "paid_at": paid_at, "updated_at": paid_at}}
    )
    await _db.johnny5_orders.update_many(
        {"id": {"$in": invoice.get("order_ids", [])}},
        {"$set": {"billing_status": "paid", "updated_at": paid_at}}
    )

    return {"success": True, "message": "Invoice marked paid"}


# ============== CONNECTED STORE ENDPOINT (for clones to implement) ==============

@johnny5_router.post("/receive-tracking")
async def receive_tracking_from_hub(
    request: Request,
    x_hub_api_key: str = Header(None, alias="X-Hub-API-Key")
):
    """
    Endpoint for receiving tracking updates from hub.
    This is implemented on clone stores to receive tracking pushback.
    """
    # This endpoint is what clone stores implement to receive tracking
    # For this hub, we just acknowledge it
    try:
        data = await request.json()
        order_id = data.get("order_id")
        tracking_number = data.get("tracking_number")
        carrier = data.get("carrier")
        
        # Update the local order with tracking
        if _db and order_id:
            await _db.orders.update_one(
                {"id": order_id},
                {"$set": {
                    "tracking_number": tracking_number,
                    "carrier": carrier,
                    "tracking_url": data.get("tracking_url"),
                    "status": "shipped",
                    "shipped_at": data.get("shipped_at") or datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return {"success": True, "message": "Tracking received"}
    except Exception as e:
        logger.error(f"Error receiving tracking: {e}")
        raise HTTPException(status_code=400, detail=str(e))



# ============== LABEL PURCHASING & INVOICE ==============

class LabelPurchaseRequest(BaseModel):
    order_id: str
    provider: str = "shippo"  # shippo, easypost, shipstation
    service: str = "usps_priority"  # Service code
    weight_oz: float = 8.0  # Default weight in ounces


class BatchLabelRequest(BaseModel):
    order_ids: List[str]
    provider: str = "shippo"
    service: str = "usps_priority"
    weight_oz: float = 8.0


@johnny5_router.post("/orders/{order_id}/purchase-label")
async def purchase_label(order_id: str, request: LabelPurchaseRequest):
    """Purchase shipping label for an order using configured shipping provider"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Get the order
    order = await _db.johnny5_orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get shipping settings (optional - use defaults if not configured)
    shipping_settings = await _db.shipping_settings.find_one({"type": "shipping"})
    
    # Use shipping settings if available, otherwise use defaults
    origin_name = (shipping_settings or {}).get("origin_name", "Gingerkare Custom Emporium")
    origin_street1 = (shipping_settings or {}).get("origin_street1", "7860 Eddins Road")
    origin_city = (shipping_settings or {}).get("origin_city", "Dothan")
    origin_state = (shipping_settings or {}).get("origin_state", "AL")
    origin_zip = (shipping_settings or {}).get("origin_zip", "36301")
    
    # Build addresses
    shipping_address = order.get("shipping_address", {})
    customer = order.get("customer", {})
    
    from_address = {
        "name": origin_name,
        "street1": origin_street1,
        "city": origin_city,
        "state": origin_state,
        "zip_code": origin_zip,
        "country": "US"
    }
    
    to_address = {
        "name": customer.get("name", ""),
        "street1": shipping_address.get("address1", shipping_address.get("street1", "")),
        "street2": shipping_address.get("address2", shipping_address.get("street2")),
        "city": shipping_address.get("city", ""),
        "state": shipping_address.get("state", ""),
        "zip_code": shipping_address.get("zip", shipping_address.get("zip_code", "")),
        "country": shipping_address.get("country", "US"),
        "phone": customer.get("phone"),
        "email": customer.get("email")
    }
    
    # For now, create a mock label (in production, this would call the shipping provider)
    # The actual integration would use the shipping.py module
    label_id = str(uuid.uuid4())
    tracking_number = f"J5{uuid.uuid4().hex[:16].upper()}"
    
    label_data = {
        "label_id": label_id,
        "order_id": order_id,
        "provider": request.provider,
        "carrier": "USPS",
        "service": request.service,
        "tracking_number": tracking_number,
        "tracking_url": f"https://track.aftership.com/usps/{tracking_number}",
        "label_url": f"/api/johnny5/labels/{label_id}/pdf",  # We'll generate this
        "cost": 8.50,  # Mock cost
        "created_at": datetime.now(timezone.utc).isoformat(),
        "from_address": from_address,
        "to_address": to_address
    }
    
    # Create response data before DB insert (to avoid _id in response)
    response_label = {**label_data}
    
    # Save label to database
    await _db.johnny5_labels.insert_one(label_data)
    
    # Update order with tracking
    await _db.johnny5_orders.update_one(
        {"id": order_id},
        {"$set": {
            "tracking": {
                "tracking_number": tracking_number,
                "carrier": "USPS",
                "tracking_url": label_data["tracking_url"],
                "label_id": label_id,
                "added_at": datetime.now(timezone.utc).isoformat()
            },
            "status": OrderStatus.SHIPPED,
            "shipped_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update store stats
    await _db.johnny5_stores.update_one(
        {"id": order["store_id"]},
        {"$inc": {"orders_fulfilled": 1}}
    )
    
    return {
        "success": True,
        "message": "Label purchased successfully",
        "label": response_label
    }


@johnny5_router.post("/orders/batch-purchase-labels")
async def batch_purchase_labels(request: BatchLabelRequest):
    """Purchase labels for multiple orders at once"""
    results = []
    for order_id in request.order_ids:
        try:
            label_request = LabelPurchaseRequest(
                order_id=order_id,
                provider=request.provider,
                service=request.service,
                weight_oz=request.weight_oz
            )
            result = await purchase_label(order_id, label_request)
            results.append({"order_id": order_id, **result})
        except Exception as e:
            results.append({"order_id": order_id, "success": False, "error": str(e)})
    
    successful = len([r for r in results if r.get("success")])
    return {
        "message": f"Purchased {successful}/{len(request.order_ids)} labels",
        "results": results
    }


@johnny5_router.get("/orders/{order_id}/invoice")
async def get_order_invoice(order_id: str):
    """Get invoice/packing slip data for an order"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    order = await _db.johnny5_orders.find_one({"id": order_id}, {"_id": 0, "raw_data": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get business settings
    business_settings = await _db.admin_settings.find_one({"type": "business"})
    business_info = {
        "name": business_settings.get("business_name", "Gingerkare Custom Emporium") if business_settings else "Gingerkare Custom Emporium",
        "logo_url": business_settings.get("logo_url", "") if business_settings else "",
        "address": business_settings.get("address", "") if business_settings else "",
        "city": business_settings.get("city", "") if business_settings else "",
        "state": business_settings.get("state", "") if business_settings else "",
        "zip_code": business_settings.get("zip_code", "") if business_settings else "",
        "phone": business_settings.get("phone", "") if business_settings else "",
        "email": business_settings.get("email", "") if business_settings else "",
        "website": business_settings.get("website", "") if business_settings else ""
    }
    
    # Get shipping origin settings
    shipping_settings = await _db.shipping_settings.find_one({"type": "shipping"})
    origin_address = {
        "name": shipping_settings.get("origin_name", "Gingerkare Custom Emporium") if shipping_settings else "Gingerkare Custom Emporium",
        "street1": shipping_settings.get("origin_street1", "7860 Eddins Road") if shipping_settings else "7860 Eddins Road",
        "city": shipping_settings.get("origin_city", "Dothan") if shipping_settings else "Dothan",
        "state": shipping_settings.get("origin_state", "AL") if shipping_settings else "AL",
        "zip": shipping_settings.get("origin_zip", "36301") if shipping_settings else "36301"
    }
    
    return {
        "order": order,
        "business": business_info,
        "origin_address": origin_address,
        "invoice_number": f"INV-{order.get('store_order_number', order_id[:8])}",
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@johnny5_router.get("/labels/{label_id}")
async def get_label(label_id: str):
    """Get label details"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    label = await _db.johnny5_labels.find_one({"label_id": label_id}, {"_id": 0})
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    
    return label
