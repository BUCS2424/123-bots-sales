"""
Peptides Settings Module
Handles peptide interest rates, category-specific rates, and other pawn configuration
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, timezone
from bson import ObjectId

router = APIRouter(prefix="/pawn-settings", tags=["Peptides Settings"])

# Database reference
db = None

def set_database(database):
    global db
    db = database

# ============ MODELS ============

class CategoryInterestRate(BaseModel):
    category: str
    interest_rate: float  # Monthly percentage
    loan_term_days: int = 30

class PeptidesSettingsUpdate(BaseModel):
    default_interest_rate: float = 20.0  # 20% default
    default_loan_term_days: int = 30
    grace_period_days: int = 30
    category_rates: List[CategoryInterestRate] = []
    min_loan_amount: float = 5.0
    max_loan_amount: float = 10000.0
    require_id_verification: bool = True
    allow_online_payments: bool = True
    auto_default_after_days: int = 60  # Days after due date to auto-default

class WarehouseLocation(BaseModel):
    aisle: str
    shelf: str
    bin: str
    description: Optional[str] = ""
    capacity: int = 100
    current_count: int = 0

class WarehouseSettings(BaseModel):
    aisles: List[str] = []  # e.g., ["A", "B", "C"]
    shelves_per_aisle: int = 10
    bins_per_shelf: int = 5
    locations: List[WarehouseLocation] = []

# ============ HELPERS ============

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

# ============ PAWN SETTINGS ROUTES ============

@router.get("")
async def get_pawn_settings():
    """Get current peptides settings"""
    settings = await db.pawn_settings.find_one({"type": "pawn_config"})
    
    if not settings:
        # Return defaults
        return {
            "default_interest_rate": 20.0,
            "default_loan_term_days": 30,
            "grace_period_days": 30,
            "category_rates": [],
            "min_loan_amount": 5.0,
            "max_loan_amount": 10000.0,
            "require_id_verification": True,
            "allow_online_payments": True,
            "auto_default_after_days": 60
        }
    
    return serialize_doc(settings)

@router.post("")
async def update_pawn_settings(settings: PeptidesSettingsUpdate):
    """Update peptides settings"""
    settings_data = settings.dict()
    settings_data["type"] = "pawn_config"
    settings_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.pawn_settings.update_one(
        {"type": "pawn_config"},
        {"$set": settings_data},
        upsert=True
    )
    
    return {"success": True, "message": "Product settings updated"}

@router.get("/interest-rate/{category}")
async def get_category_interest_rate(category: str):
    """Get interest rate for a specific category"""
    settings = await db.pawn_settings.find_one({"type": "pawn_config"})
    
    if settings and settings.get("category_rates"):
        for rate in settings["category_rates"]:
            if rate["category"].lower() == category.lower():
                return {
                    "category": category,
                    "interest_rate": rate["interest_rate"],
                    "loan_term_days": rate.get("loan_term_days", 30)
                }
    
    # Return default rate
    default_rate = settings.get("default_interest_rate", 20.0) if settings else 20.0
    default_term = settings.get("default_loan_term_days", 30) if settings else 30
    
    return {
        "category": category,
        "interest_rate": default_rate,
        "loan_term_days": default_term,
        "is_default": True
    }

@router.post("/category-rate")
async def set_category_interest_rate(rate: CategoryInterestRate):
    """Set or update interest rate for a category"""
    settings = await db.pawn_settings.find_one({"type": "pawn_config"})
    
    if not settings:
        settings = {
            "type": "pawn_config",
            "default_interest_rate": 20.0,
            "default_loan_term_days": 30,
            "category_rates": []
        }
    
    # Update or add category rate
    category_rates = settings.get("category_rates", [])
    updated = False
    
    for i, existing in enumerate(category_rates):
        if existing["category"].lower() == rate.category.lower():
            category_rates[i] = rate.dict()
            updated = True
            break
    
    if not updated:
        category_rates.append(rate.dict())
    
    await db.pawn_settings.update_one(
        {"type": "pawn_config"},
        {
            "$set": {
                "category_rates": category_rates,
                "updated_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )
    
    return {"success": True, "message": f"Interest rate for {rate.category} updated to {rate.interest_rate}%"}

@router.delete("/category-rate/{category}")
async def delete_category_interest_rate(category: str):
    """Remove custom interest rate for a category (will use default)"""
    await db.pawn_settings.update_one(
        {"type": "pawn_config"},
        {
            "$pull": {"category_rates": {"category": {"$regex": f"^{category}$", "$options": "i"}}},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    return {"success": True, "message": f"Custom rate for {category} removed, will use default"}

# ============ WAREHOUSE SETTINGS ROUTES ============

@router.get("/warehouse")
async def get_warehouse_settings():
    """Get warehouse/shelving configuration"""
    settings = await db.pawn_settings.find_one({"type": "warehouse_config"})
    
    if not settings:
        # Return defaults
        return {
            "aisles": ["A", "B", "C", "D"],
            "shelves_per_aisle": 5,
            "bins_per_shelf": 4,
            "locations": [],
            "naming_format": "Aisle-Shelf-Bin (e.g., A-1-01)"
        }
    
    return serialize_doc(settings)

@router.post("/warehouse")
async def update_warehouse_settings(settings: WarehouseSettings):
    """Update warehouse configuration"""
    settings_data = settings.dict()
    settings_data["type"] = "warehouse_config"
    settings_data["updated_at"] = datetime.now(timezone.utc)
    
    # Generate all location codes if aisles are provided
    if settings.aisles:
        locations = []
        for aisle in settings.aisles:
            for shelf in range(1, settings.shelves_per_aisle + 1):
                for bin_num in range(1, settings.bins_per_shelf + 1):
                    location_code = f"{aisle}-{shelf}-{bin_num:02d}"
                    locations.append({
                        "code": location_code,
                        "aisle": aisle,
                        "shelf": str(shelf),
                        "bin": f"{bin_num:02d}",
                        "capacity": 10,
                        "current_count": 0
                    })
        settings_data["locations"] = locations
    
    await db.pawn_settings.update_one(
        {"type": "warehouse_config"},
        {"$set": settings_data},
        upsert=True
    )
    
    return {"success": True, "message": "Warehouse settings updated", "locations_generated": len(settings_data.get("locations", []))}

@router.get("/warehouse/locations")
async def get_warehouse_locations():
    """Get all warehouse locations with item counts"""
    settings = await db.pawn_settings.find_one({"type": "warehouse_config"})
    
    if not settings or not settings.get("locations"):
        # Generate default locations
        default_aisles = ["A", "B", "C", "D"]
        locations = []
        for aisle in default_aisles:
            for shelf in range(1, 6):
                for bin_num in range(1, 5):
                    location_code = f"{aisle}-{shelf}-{bin_num:02d}"
                    locations.append({
                        "code": location_code,
                        "aisle": aisle,
                        "shelf": str(shelf),
                        "bin": f"{bin_num:02d}",
                        "capacity": 10,
                        "current_count": 0
                    })
        return {"locations": locations, "total": len(locations)}
    
    # Get actual counts from products
    locations = settings.get("locations", [])
    
    # Count products in each location
    pipeline = [
        {"$match": {"warehouse_location.code": {"$exists": True}}},
        {"$group": {"_id": "$warehouse_location.code", "count": {"$sum": 1}}}
    ]
    
    counts = {}
    async for item in db.products.aggregate(pipeline):
        counts[item["_id"]] = item["count"]
    
    # Update counts in locations
    for loc in locations:
        loc["current_count"] = counts.get(loc.get("code"), 0)
    
    return {"locations": locations, "total": len(locations)}

@router.get("/warehouse/location/{code}")
async def get_location_items(code: str):
    """Get all items in a specific warehouse location"""
    products = await db.products.find(
        {"warehouse_location.code": code},
        {"_id": 1, "name": 1, "sku": 1, "price": 1, "quantity": 1, "category": 1, "condition": 1, "image": 1}
    ).to_list(length=100)
    
    items = []
    for product in products:
        product["id"] = str(product.pop("_id"))
        items.append(product)
    
    return {"location": code, "items": items, "count": len(items)}

class ProductLocationAssignment(BaseModel):
    product_id: str
    location_code: str
    notes: Optional[str] = ""

@router.post("/warehouse/assign")
async def assign_product_to_location(assignment: ProductLocationAssignment):
    """Assign a product to a warehouse location"""
    # Parse location code (e.g., "A-1-01")
    parts = assignment.location_code.split("-")
    if len(parts) != 3:
        raise HTTPException(status_code=400, detail="Invalid location code format. Use Aisle-Shelf-Bin (e.g., A-1-01)")
    
    aisle, shelf, bin_num = parts
    
    result = await db.products.update_one(
        {"_id": ObjectId(assignment.product_id)},
        {
            "$set": {
                "warehouse_location": {
                    "code": assignment.location_code,
                    "aisle": aisle,
                    "shelf": shelf,
                    "bin": bin_num,
                    "notes": assignment.notes,
                    "assigned_at": datetime.now(timezone.utc)
                },
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True, "message": f"Product assigned to location {assignment.location_code}"}

@router.delete("/warehouse/unassign/{product_id}")
async def unassign_product_location(product_id: str):
    """Remove product from warehouse location"""
    result = await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {
            "$unset": {"warehouse_location": ""},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True, "message": "Product removed from location"}

@router.get("/warehouse/search")
async def search_locations(q: str = "", aisle: str = ""):
    """Search warehouse locations"""
    settings = await db.pawn_settings.find_one({"type": "warehouse_config"})
    locations = settings.get("locations", []) if settings else []
    
    results = []
    for loc in locations:
        if aisle and loc.get("aisle", "").upper() != aisle.upper():
            continue
        if q and q.upper() not in loc.get("code", "").upper():
            continue
        results.append(loc)
    
    return {"locations": results, "total": len(results)}
