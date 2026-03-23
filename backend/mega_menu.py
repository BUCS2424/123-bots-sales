from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
import uuid

from auth import decode_token, is_admin_or_above

router = APIRouter(prefix="/api/mega-menu", tags=["mega-menu"])
public_router = APIRouter(prefix="/api/public/mega-menu", tags=["mega-menu-public"])

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
    return {
        "user_id": token_data.user_id,
        "email": token_data.email,
        "role": token_data.role,
    }

# ============ MODELS ============

class SEOSettings(BaseModel):
    page_title: Optional[str] = None
    slug: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    canonical_url: Optional[str] = None
    og_title: Optional[str] = None
    og_image_url: Optional[str] = None
    og_description: Optional[str] = None
    robots_directive: str = "index, follow"

class MenuItemBase(BaseModel):
    label: str
    icon: str = "Link"  # Lucide icon name
    url: str
    description: Optional[str] = None
    parent_id: Optional[str] = None  # For sub-menus
    column: int = 0  # For multi-column mega menus
    open_in_new_tab: bool = False
    is_active: bool = True
    sort_order: int = 0
    seo: Optional[SEOSettings] = None
    # Dynamic linking
    link_type: str = "custom"  # custom, category, page, article
    linked_entity_id: Optional[str] = None  # ID of category/page/article
    # Visual
    image_url: Optional[str] = None
    badge_text: Optional[str] = None
    badge_color: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(BaseModel):
    label: Optional[str] = None
    icon: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[str] = None
    column: Optional[int] = None
    open_in_new_tab: Optional[bool] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    seo: Optional[SEOSettings] = None
    link_type: Optional[str] = None
    linked_entity_id: Optional[str] = None
    image_url: Optional[str] = None
    badge_text: Optional[str] = None
    badge_color: Optional[str] = None

class MenuItem(MenuItemBase):
    id: str
    created_at: str
    updated_at: str
    children: Optional[List['MenuItem']] = None

# ============ ADMIN ENDPOINTS ============

@router.get("/items")
async def get_all_menu_items(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Get all menu items (flat list for admin)"""
    _require_admin_token(authorization)
    
    items = await db.mega_menu_items.find({}, {"_id": 0}).sort("sort_order", 1).to_list(length=500)
    return {"items": items}

@router.post("/items")
async def create_menu_item(
    item: MenuItemCreate,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Create a new menu item"""
    _require_admin_token(authorization)
    
    now = datetime.now(timezone.utc).isoformat()
    item_id = str(uuid.uuid4())
    
    # Get max sort order
    max_order = await db.mega_menu_items.find_one(
        {"parent_id": item.parent_id},
        sort=[("sort_order", -1)]
    )
    next_order = (max_order.get("sort_order", 0) + 1) if max_order else 0
    
    item_data = {
        "id": item_id,
        **item.model_dump(),
        "sort_order": next_order if item.sort_order == 0 else item.sort_order,
        "created_at": now,
        "updated_at": now,
    }
    
    # Convert SEO to dict if present
    if item_data.get("seo"):
        item_data["seo"] = item_data["seo"] if isinstance(item_data["seo"], dict) else item_data["seo"]
    
    await db.mega_menu_items.insert_one(item_data)
    
    # Remove _id from response
    item_data.pop("_id", None)
    
    return {"success": True, "item": item_data}

@router.put("/items/{item_id}")
async def update_menu_item(
    item_id: str,
    item: MenuItemUpdate,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Update a menu item"""
    _require_admin_token(authorization)
    
    existing = await db.mega_menu_items.find_one({"id": item_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    update_data = {k: v for k, v in item.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.mega_menu_items.update_one(
        {"id": item_id},
        {"$set": update_data}
    )
    
    updated = await db.mega_menu_items.find_one({"id": item_id}, {"_id": 0})
    return {"success": True, "item": updated}

@router.delete("/items/{item_id}")
async def delete_menu_item(
    item_id: str,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Delete a menu item and all its children"""
    _require_admin_token(authorization)
    
    existing = await db.mega_menu_items.find_one({"id": item_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Delete all children recursively
    async def delete_children(parent_id: str):
        children = await db.mega_menu_items.find({"parent_id": parent_id}).to_list(length=500)
        for child in children:
            await delete_children(child["id"])
        await db.mega_menu_items.delete_many({"parent_id": parent_id})
    
    await delete_children(item_id)
    await db.mega_menu_items.delete_one({"id": item_id})
    
    return {"success": True, "message": "Menu item deleted"}

@router.put("/items/reorder")
async def reorder_menu_items(
    item_ids: List[str],
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Reorder menu items"""
    _require_admin_token(authorization)
    
    for i, item_id in enumerate(item_ids):
        await db.mega_menu_items.update_one(
            {"id": item_id},
            {"$set": {"sort_order": i, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    return {"success": True, "message": "Items reordered"}

@router.put("/items/{item_id}/move")
async def move_menu_item(
    item_id: str,
    new_parent_id: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Move a menu item to a new parent"""
    _require_admin_token(authorization)
    
    existing = await db.mega_menu_items.find_one({"id": item_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # If moving to a parent, verify parent exists
    if new_parent_id:
        parent = await db.mega_menu_items.find_one({"id": new_parent_id})
        if not parent:
            raise HTTPException(status_code=404, detail="Parent menu item not found")
        
        # Prevent circular references
        if new_parent_id == item_id:
            raise HTTPException(status_code=400, detail="Cannot set item as its own parent")
    
    await db.mega_menu_items.update_one(
        {"id": item_id},
        {"$set": {"parent_id": new_parent_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": "Item moved"}

# ============ HELPER ENDPOINTS ============

@router.get("/categories")
async def get_categories_for_linking(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Get categories available for linking"""
    _require_admin_token(authorization)
    
    # Fetch from the store categories collection
    categories = await db.categories.find(
        {"is_enabled": True},
        {"_id": 0, "id": 1, "name": 1, "seo_url": 1}
    ).sort("name", 1).to_list(length=500)
    
    return {"categories": categories}

@router.get("/pages")
async def get_pages_for_linking(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Get static pages available for linking"""
    _require_admin_token(authorization)
    
    # Return commonly available pages
    pages = [
        {"id": "home", "name": "Home", "url": "/"},
        {"id": "shop", "name": "Shop", "url": "/shop"},
        {"id": "about", "name": "About Us", "url": "/about"},
        {"id": "contact", "name": "Contact", "url": "/contact"},
        {"id": "faq", "name": "FAQ", "url": "/faq"},
        {"id": "research", "name": "Research Library", "url": "/research"},
        {"id": "privacy", "name": "Privacy Policy", "url": "/privacy-policy"},
        {"id": "terms", "name": "Terms & Conditions", "url": "/terms-conditions"},
        {"id": "shipping", "name": "Shipping & Returns", "url": "/shipping-returns"},
        {"id": "accessibility", "name": "Accessibility", "url": "/accessibility"},
    ]
    
    return {"pages": pages}

# ============ PUBLIC ENDPOINTS ============

def build_menu_tree(items: List[dict], parent_id: Optional[str] = None) -> List[dict]:
    """Build hierarchical menu tree from flat list"""
    tree = []
    for item in items:
        if item.get("parent_id") == parent_id and item.get("is_active", True):
            children = build_menu_tree(items, item["id"])
            item_copy = {k: v for k, v in item.items() if k != "_id"}
            if children:
                item_copy["children"] = children
            tree.append(item_copy)
    return sorted(tree, key=lambda x: x.get("sort_order", 0))

@public_router.get("/navigation")
async def get_public_navigation(db=Depends(get_db)):
    """Get the public navigation menu (hierarchical structure) with resolved category names"""
    items = await db.mega_menu_items.find(
        {"is_active": True},
        {"_id": 0}
    ).sort("sort_order", 1).to_list(length=500)
    
    # Resolve category names for items with link_type='category'
    category_ids = [item["linked_entity_id"] for item in items if item.get("link_type") == "category" and item.get("linked_entity_id")]
    categories_map = {}
    if category_ids:
        categories = await db.categories.find(
            {"id": {"$in": category_ids}},
            {"_id": 0, "id": 1, "name": 1, "seo_url": 1}
        ).to_list(length=500)
        categories_map = {cat["id"]: cat for cat in categories}
    
    # Add resolved category info to items
    for item in items:
        if item.get("link_type") == "category" and item.get("linked_entity_id"):
            cat = categories_map.get(item["linked_entity_id"])
            if cat:
                item["linked_category_name"] = cat["name"]
                item["linked_category_seo_url"] = cat.get("seo_url", "")
    
    # Build tree structure
    menu_tree = build_menu_tree(items)
    
    return {"menu": menu_tree}
