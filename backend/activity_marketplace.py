"""
Activity & Charter Marketplace Module ("Tours / Charters")
- Activity Categories CRUD
- Seller Tenants (charter companies) CRUD
- Activities ("articles" listed under a seller tenant) CRUD
- Dashboard stats
- Public endpoints for the storefront ACTIVITIES directory (all activities grid + by charter company grid)

Built as a self-contained, portable module so it can be lifted into another client's
codebase later. Gated entirely by the `activity_marketplace_enabled` feature flag on
the frontend - when OFF, nothing here is reachable from the UI (admin sidebar or
public nav).

Booking model: each Activity carries a `booking_type` of either `external_link`
(Book Now points to the seller's own booking engine, e.g. FareHarbor) or
`native_checkout` (reserved for a future in-app cart/checkout flow).

Follows existing module conventions (uuid ids, set_database, dict storage,
Bearer-token admin auth via decode_token/is_admin_or_above).
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import re

from auth import decode_token, is_admin_or_above

router = APIRouter(prefix="/api/tours-charters", tags=["Activity Marketplace"])
public_router = APIRouter(prefix="/api/public/tours-charters", tags=["Activity Marketplace Public"])

_db = None


def set_database(database):
    global _db
    _db = database


async def get_db():
    return _db


def _require_admin_token(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")
    token = authorization.split("Bearer ", 1)[1].strip()
    token_data = decode_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    if not is_admin_or_above(token_data.role or ""):
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"user_id": token_data.user_id, "email": token_data.email, "role": token_data.role}


def slugify(text: str) -> str:
    text = (text or "").lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s-]+", "-", text)
    return text.strip("-")[:80] or uuid.uuid4().hex[:8]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _unique_slug(db, collection: str, base: str, exclude_id: Optional[str] = None) -> str:
    slug = slugify(base)
    candidate = slug
    i = 1
    while True:
        query = {"slug": candidate}
        if exclude_id:
            query["id"] = {"$ne": exclude_id}
        existing = await db[collection].find_one(query, {"_id": 0, "id": 1})
        if not existing:
            return candidate
        i += 1
        candidate = f"{slug}-{i}"


# =============== MODELS ===============

class CategoryCreate(BaseModel):
    name: str
    description: str = ""
    image_url: str = ""
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class SellerCreate(BaseModel):
    name: str
    description: str = ""
    logo_url: str = ""
    contact_email: str = ""
    contact_phone: str = ""
    website: str = ""
    commission_rate: float = 0.0  # % commission owed to the platform on this seller's bookings


class SellerUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    commission_rate: Optional[float] = None
    is_active: Optional[bool] = None


class ActivityCreate(BaseModel):
    name: str
    seller_id: str
    category_ids: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    images: List[str] = Field(default_factory=list)
    description: str = ""
    price_display: str = ""  # free-text e.g. "$150 / person" until native pricing exists
    duration: str = ""
    booking_type: str = "external_link"  # external_link | native_checkout
    booking_url: str = ""


class ActivityUpdate(BaseModel):
    name: Optional[str] = None
    seller_id: Optional[str] = None
    category_ids: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    images: Optional[List[str]] = None
    description: Optional[str] = None
    price_display: Optional[str] = None
    duration: Optional[str] = None
    booking_type: Optional[str] = None
    booking_url: Optional[str] = None
    is_active: Optional[bool] = None


# =============== CATEGORIES ===============

@router.get("/categories")
async def list_categories(authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    cats = await db.activity_categories.find({}, {"_id": 0}).sort("sort_order", 1).to_list(500)
    return cats


@router.post("/categories")
async def create_category(payload: CategoryCreate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["slug"] = await _unique_slug(db, "activity_categories", payload.name)
    doc["is_active"] = True
    doc["created_at"] = _now_iso()
    doc["updated_at"] = doc["created_at"]
    await db.activity_categories.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/categories/{category_id}")
async def update_category(category_id: str, payload: CategoryUpdate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = _now_iso()
    result = await db.activity_categories.update_one({"id": category_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return await db.activity_categories.find_one({"id": category_id}, {"_id": 0})


@router.delete("/categories/{category_id}")
async def delete_category(category_id: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    await db.activities.update_many({"category_ids": category_id}, {"$pull": {"category_ids": category_id}})
    result = await db.activity_categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True}


# =============== SELLER TENANTS (CHARTER COMPANIES) ===============

@router.get("/sellers")
async def list_sellers(authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    sellers = await db.activity_sellers.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    return sellers


@router.post("/sellers")
async def create_seller(payload: SellerCreate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["slug"] = await _unique_slug(db, "activity_sellers", payload.name)
    doc["is_active"] = True
    doc["created_at"] = _now_iso()
    doc["updated_at"] = doc["created_at"]
    await db.activity_sellers.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/sellers/{seller_id}")
async def update_seller(seller_id: str, payload: SellerUpdate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = _now_iso()
    result = await db.activity_sellers.update_one({"id": seller_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Seller not found")
    return await db.activity_sellers.find_one({"id": seller_id}, {"_id": 0})


@router.delete("/sellers/{seller_id}")
async def delete_seller(seller_id: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    activity_count = await db.activities.count_documents({"seller_id": seller_id})
    if activity_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete: {activity_count} activity(ies) still belong to this seller")
    result = await db.activity_sellers.delete_one({"id": seller_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Seller not found")
    return {"success": True}


# =============== ACTIVITIES ===============

@router.get("/activities")
async def list_activities(
    seller_id: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    query = {}
    if seller_id:
        query["seller_id"] = seller_id
    if category_id:
        query["category_ids"] = category_id
    activities = await db.activities.find(query, {"_id": 0}).sort("created_at", -1).to_list(2000)
    sellers = {s["id"]: s for s in await db.activity_sellers.find({}, {"_id": 0}).to_list(1000)}
    for a in activities:
        seller = sellers.get(a.get("seller_id"))
        a["seller_name"] = seller.get("name") if seller else "Unknown"
    return activities


@router.post("/activities")
async def create_activity(payload: ActivityCreate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    seller = await db.activity_sellers.find_one({"id": payload.seller_id}, {"_id": 0, "id": 1})
    if not seller:
        raise HTTPException(status_code=400, detail="Seller tenant not found")
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["slug"] = await _unique_slug(db, "activities", payload.name)
    doc["is_active"] = True
    doc["created_at"] = _now_iso()
    doc["updated_at"] = doc["created_at"]
    await db.activities.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/activities/{activity_id}")
async def update_activity(activity_id: str, payload: ActivityUpdate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = _now_iso()
    result = await db.activities.update_one({"id": activity_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    return await db.activities.find_one({"id": activity_id}, {"_id": 0})


@router.delete("/activities/{activity_id}")
async def delete_activity(activity_id: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    result = await db.activities.delete_one({"id": activity_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"success": True}


# =============== DASHBOARD ===============

@router.get("/dashboard/stats")
async def dashboard_stats(authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    total_activities = await db.activities.count_documents({})
    active_activities = await db.activities.count_documents({"is_active": True})
    total_categories = await db.activity_categories.count_documents({})
    total_sellers = await db.activity_sellers.count_documents({})
    active_sellers = await db.activity_sellers.count_documents({"is_active": True})
    return {
        "total_activities": total_activities,
        "active_activities": active_activities,
        "total_categories": total_categories,
        "total_sellers": total_sellers,
        "active_sellers": active_sellers,
        # Placeholders until booking-click tracking + commission ledger are built (Phase 2)
        "total_bookings": 0,
        "commission_revenue": 0.0,
    }


# =============== PUBLIC (STOREFRONT DIRECTORY) ===============

@public_router.get("/categories")
async def public_list_categories(db=Depends(get_db)):
    cats = await db.activity_categories.find({"is_active": True}, {"_id": 0}).sort("sort_order", 1).to_list(500)
    for c in cats:
        c["activity_count"] = await db.activities.count_documents({"category_ids": c["id"], "is_active": True})
    return cats


@public_router.get("/sellers")
async def public_list_sellers(db=Depends(get_db)):
    sellers = await db.activity_sellers.find({"is_active": True}, {"_id": 0}).sort("name", 1).to_list(1000)
    for s in sellers:
        s["activity_count"] = await db.activities.count_documents({"seller_id": s["id"], "is_active": True})
    return sellers


@public_router.get("/activities")
async def public_list_activities(
    seller_slug: Optional[str] = Query(None),
    category_slug: Optional[str] = Query(None),
    db=Depends(get_db),
):
    query = {"is_active": True}
    if seller_slug:
        seller = await db.activity_sellers.find_one({"slug": seller_slug}, {"_id": 0, "id": 1})
        if not seller:
            return []
        query["seller_id"] = seller["id"]
    if category_slug:
        category = await db.activity_categories.find_one({"slug": category_slug}, {"_id": 0, "id": 1})
        if not category:
            return []
        query["category_ids"] = category["id"]
    activities = await db.activities.find(query, {"_id": 0}).sort("created_at", -1).to_list(2000)
    sellers = {s["id"]: s for s in await db.activity_sellers.find({}, {"_id": 0}).to_list(1000)}
    for a in activities:
        seller = sellers.get(a.get("seller_id"))
        a["seller_name"] = seller.get("name") if seller else ""
        a["seller_slug"] = seller.get("slug") if seller else ""
    return activities


@public_router.get("/activities/{slug}")
async def public_get_activity(slug: str, db=Depends(get_db)):
    activity = await db.activities.find_one({"slug": slug, "is_active": True}, {"_id": 0})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    seller = await db.activity_sellers.find_one({"id": activity.get("seller_id")}, {"_id": 0})
    activity["seller"] = seller
    categories = await db.activity_categories.find({"id": {"$in": activity.get("category_ids", [])}}, {"_id": 0}).to_list(50)
    activity["categories"] = categories
    return activity
