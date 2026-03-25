"""
User Management & Wholesale Pricing Module
Handles user roles, customer tiers, and dynamic pricing
"""

import os
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field, EmailStr
from motor.motor_asyncio import AsyncIOMotorDatabase
from booking_provisioning import ensure_user_booking_calendar_setup

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["user-management"])

# Database reference (set by server.py)
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ============== User Role Definitions ==============

class StaffRole:
    """Staff roles for internal users"""
    STORE_OWNER = "store_owner"      # Full admin access
    SALES = "sales"                   # POS + customer management
    SHIPPER = "shipper"               # Orders + labels + tracking
    
    @classmethod
    def all_roles(cls):
        return [cls.STORE_OWNER, cls.SALES, cls.SHIPPER]


class CustomerTier:
    """Customer pricing tiers"""
    RETAIL = "retail"
    WHOLESALE = "wholesale"


# ============== Pydantic Models ==============

class StaffMemberCreate(BaseModel):
    """Create a new staff member"""
    email: EmailStr
    name: str
    password: str
    role: str = StaffRole.SALES  # Default to sales
    phone: Optional[str] = None


class StaffMemberUpdate(BaseModel):
    """Update staff member"""
    name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class StaffMemberResponse(BaseModel):
    """Staff member response"""
    id: str
    email: str
    name: str
    role: str
    phone: Optional[str] = None
    is_active: bool
    created_at: str
    last_login: Optional[str] = None


class CustomerTierUpdate(BaseModel):
    """Update customer tier and settings"""
    customer_type: str = CustomerTier.RETAIL  # retail or wholesale
    custom_discount_percentage: Optional[float] = None  # Override global wholesale discount
    minimum_order_amount: float = 0.0  # Minimum order for this customer
    notes: Optional[str] = None


class CustomerResponse(BaseModel):
    """Customer response with tier info"""
    id: str
    email: str
    name: str
    customer_type: str
    custom_discount_percentage: Optional[float] = None
    minimum_order_amount: float = 0.0
    total_orders: int = 0
    total_spent: float = 0.0
    created_at: str
    notes: Optional[str] = None


class WholesaleSettingsUpdate(BaseModel):
    """Global wholesale settings"""
    default_discount_percentage: float = 20.0  # Default 20% off retail
    quantity_tiers: List[Dict[str, Any]] = []  # [{min_qty: 10, discount_pct: 25}, ...]
    wholesale_registration_enabled: bool = False  # Allow self-registration as wholesale
    wholesale_approval_required: bool = True  # Require admin approval for wholesale


class WholesaleSettingsResponse(BaseModel):
    """Wholesale settings response"""
    default_discount_percentage: float
    quantity_tiers: List[Dict[str, Any]]
    wholesale_registration_enabled: bool
    wholesale_approval_required: bool


class ProductWholesalePriceUpdate(BaseModel):
    """Update wholesale price for a specific product"""
    product_id: str
    wholesale_price: Optional[float] = None  # If None, uses global discount


# ============== Role Permission Helpers ==============

def get_role_permissions(role: str) -> Dict[str, bool]:
    """Get permissions for a role"""
    permissions = {
        "view_dashboard": False,
        "manage_settings": False,
        "manage_users": False,
        "manage_customers": False,
        "view_orders": False,
        "manage_orders": False,
        "process_payments": False,
        "manage_inventory": False,
        "manage_products": False,
        "manage_shipping": False,
        "print_labels": False,
        "update_tracking": False,
        "view_reports": False,
        "view_analytics": False,
    }
    
    if role == StaffRole.STORE_OWNER:
        # Full access
        return {k: True for k in permissions}
    
    elif role == StaffRole.SALES:
        # POS + customer management
        permissions.update({
            "view_dashboard": True,
            "manage_customers": True,
            "view_orders": True,
            "manage_orders": True,
            "process_payments": True,
            "manage_inventory": True,
            "manage_products": True,
            "view_reports": True,
        })
    
    elif role == StaffRole.SHIPPER:
        # Orders + labels + tracking only
        permissions.update({
            "view_orders": True,
            "manage_shipping": True,
            "print_labels": True,
            "update_tracking": True,
        })
    
    return permissions


def can_access(user_role: str, permission: str) -> bool:
    """Check if user role has specific permission"""
    permissions = get_role_permissions(user_role)
    return permissions.get(permission, False)


# ============== Staff Management Endpoints ==============

@router.get("/staff", response_model=List[StaffMemberResponse])
async def list_staff_members():
    """List all staff members (Store Owner only)"""
    staff = await db.staff_members.find({"is_deleted": {"$ne": True}}).to_list(200)
    admin_users = await db.users.find(
        {"role": {"$in": ["admin", "super_admin"]}},
        {"_id": 0, "id": 1, "email": 1, "name": 1, "phone": 1, "is_active": 1, "created_at": 1, "last_login": 1, "role": 1},
    ).to_list(50)

    existing_staff_emails = {member.get("email") for member in staff if member.get("email")}
    for user in admin_users:
        email = user.get("email")
        if not email or email in existing_staff_emails:
            continue
        staff.append({
            "id": user.get("id"),
            "email": email,
            "name": user.get("name") or email,
            "role": StaffRole.STORE_OWNER,
            "phone": user.get("phone"),
            "is_active": user.get("is_active", True),
            "created_at": user.get("created_at") or datetime.now(timezone.utc).isoformat(),
            "last_login": user.get("last_login"),
        })
    
    result = []
    for member in staff:
        result.append(StaffMemberResponse(
            id=member.get("id"),
            email=member.get("email"),
            name=member.get("name"),
            role=member.get("role"),
            phone=member.get("phone"),
            is_active=member.get("is_active", True),
            created_at=member.get("created_at"),
            last_login=member.get("last_login")
        ))
    
    return result


@router.post("/staff", response_model=StaffMemberResponse)
async def create_staff_member(data: StaffMemberCreate):
    """Create a new staff member (Store Owner only)"""
    from auth import get_password_hash
    
    # Validate role
    if data.role not in StaffRole.all_roles():
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {StaffRole.all_roles()}")
    
    # Check for existing email
    existing = await db.staff_members.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Also check users collection
    existing_user = await db.users.find_one({"email": data.email.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered as a customer")
    
    staff_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    staff_member = {
        "id": staff_id,
        "email": data.email.lower(),
        "name": data.name,
        "hashed_password": get_password_hash(data.password),
        "role": data.role,
        "phone": data.phone,
        "is_active": True,
        "is_deleted": False,
        "created_at": now,
        "updated_at": now
    }
    
    await db.staff_members.insert_one(staff_member)

    # Create a linked auth user so each staff account has booking/calendar workspace
    linked_user = {
        "id": staff_id,
        "email": data.email.lower(),
        "name": data.name,
        "hashed_password": staff_member["hashed_password"],
        "role": "admin",
        "staff_role": data.role,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    await db.users.insert_one(linked_user)
    await ensure_user_booking_calendar_setup(db, linked_user)
    staff_member.pop("_id", None)
    staff_member.pop("hashed_password", None)
    
    return StaffMemberResponse(
        id=staff_id,
        email=data.email.lower(),
        name=data.name,
        role=data.role,
        phone=data.phone,
        is_active=True,
        created_at=now
    )


@router.put("/staff/{staff_id}", response_model=StaffMemberResponse)
async def update_staff_member(staff_id: str, data: StaffMemberUpdate):
    """Update a staff member (Store Owner only)"""
    staff = await db.staff_members.find_one({"id": staff_id, "is_deleted": {"$ne": True}})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.role is not None:
        if data.role not in StaffRole.all_roles():
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {StaffRole.all_roles()}")
        update_data["role"] = data.role
    if data.phone is not None:
        update_data["phone"] = data.phone
    if data.is_active is not None:
        update_data["is_active"] = data.is_active
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.staff_members.update_one({"id": staff_id}, {"$set": update_data})
        linked_updates = {}
        if "name" in update_data:
            linked_updates["name"] = update_data["name"]
        if "role" in update_data:
            linked_updates["staff_role"] = update_data["role"]
        if "is_active" in update_data:
            linked_updates["is_active"] = update_data["is_active"]
        if linked_updates:
            linked_updates["updated_at"] = update_data["updated_at"]
            await db.users.update_one({"id": staff_id}, {"$set": linked_updates})
    
    # Fetch updated
    staff = await db.staff_members.find_one({"id": staff_id})
    
    return StaffMemberResponse(
        id=staff.get("id"),
        email=staff.get("email"),
        name=staff.get("name"),
        role=staff.get("role"),
        phone=staff.get("phone"),
        is_active=staff.get("is_active", True),
        created_at=staff.get("created_at"),
        last_login=staff.get("last_login")
    )


@router.delete("/staff/{staff_id}")
async def delete_staff_member(staff_id: str):
    """Soft delete a staff member (Store Owner only)"""
    result = await db.staff_members.update_one(
        {"id": staff_id},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Staff member not found")

    await db.users.update_one(
        {"id": staff_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    
    return {"message": "Staff member deleted"}


@router.get("/staff/{staff_id}/permissions")
async def get_staff_permissions(staff_id: str):
    """Get permissions for a staff member"""
    staff = await db.staff_members.find_one({"id": staff_id, "is_deleted": {"$ne": True}})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    return {
        "role": staff.get("role"),
        "permissions": get_role_permissions(staff.get("role"))
    }


# ============== Customer Tier Management ==============

@router.get("/customers", response_model=List[CustomerResponse])
async def list_customers(
    tier: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50
):
    """List all customers with optional filtering"""
    query = {"role": "user"}
    
    if tier and tier in [CustomerTier.RETAIL, CustomerTier.WHOLESALE]:
        query["customer_type"] = tier
    
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    customers = await db.users.find(query).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for customer in customers:
        # Get customer settings if exists
        settings = await db.customer_settings.find_one({"customer_id": customer.get("id")})
        
        result.append(CustomerResponse(
            id=customer.get("id"),
            email=customer.get("email"),
            name=customer.get("name"),
            customer_type=settings.get("customer_type", CustomerTier.RETAIL) if settings else CustomerTier.RETAIL,
            custom_discount_percentage=settings.get("custom_discount_percentage") if settings else None,
            minimum_order_amount=settings.get("minimum_order_amount", 0.0) if settings else 0.0,
            total_orders=customer.get("total_orders", 0),
            total_spent=customer.get("total_spent", 0.0),
            created_at=customer.get("created_at", ""),
            notes=settings.get("notes") if settings else None
        ))
    
    return result


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str):
    """Get customer details"""
    customer = await db.users.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    settings = await db.customer_settings.find_one({"customer_id": customer_id})
    
    return CustomerResponse(
        id=customer.get("id"),
        email=customer.get("email"),
        name=customer.get("name"),
        customer_type=settings.get("customer_type", CustomerTier.RETAIL) if settings else CustomerTier.RETAIL,
        custom_discount_percentage=settings.get("custom_discount_percentage") if settings else None,
        minimum_order_amount=settings.get("minimum_order_amount", 0.0) if settings else 0.0,
        total_orders=customer.get("total_orders", 0),
        total_spent=customer.get("total_spent", 0.0),
        created_at=customer.get("created_at", ""),
        notes=settings.get("notes") if settings else None
    )


@router.put("/customers/{customer_id}/tier", response_model=CustomerResponse)
async def update_customer_tier(customer_id: str, data: CustomerTierUpdate):
    """Update customer tier and settings (Store Owner/Sales)"""
    customer = await db.users.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if data.customer_type not in [CustomerTier.RETAIL, CustomerTier.WHOLESALE]:
        raise HTTPException(status_code=400, detail="Invalid customer type")
    
    now = datetime.now(timezone.utc).isoformat()
    
    settings_data = {
        "customer_id": customer_id,
        "customer_type": data.customer_type,
        "custom_discount_percentage": data.custom_discount_percentage,
        "minimum_order_amount": data.minimum_order_amount,
        "notes": data.notes,
        "updated_at": now
    }
    
    await db.customer_settings.update_one(
        {"customer_id": customer_id},
        {"$set": settings_data, "$setOnInsert": {"created_at": now}},
        upsert=True
    )
    
    # Also update the user document for quick filtering
    await db.users.update_one(
        {"id": customer_id},
        {"$set": {"customer_type": data.customer_type, "updated_at": now}}
    )
    
    settings = await db.customer_settings.find_one({"customer_id": customer_id})
    
    return CustomerResponse(
        id=customer.get("id"),
        email=customer.get("email"),
        name=customer.get("name"),
        customer_type=settings.get("customer_type", CustomerTier.RETAIL),
        custom_discount_percentage=settings.get("custom_discount_percentage"),
        minimum_order_amount=settings.get("minimum_order_amount", 0.0),
        total_orders=customer.get("total_orders", 0),
        total_spent=customer.get("total_spent", 0.0),
        created_at=customer.get("created_at", ""),
        notes=settings.get("notes")
    )


# ============== Wholesale Settings ==============

@router.get("/wholesale/settings", response_model=WholesaleSettingsResponse)
async def get_wholesale_settings():
    """Get global wholesale settings"""
    settings = await db.wholesale_settings.find_one({"type": "wholesale"})
    
    if not settings:
        # Return defaults
        return WholesaleSettingsResponse(
            default_discount_percentage=20.0,
            quantity_tiers=[],
            wholesale_registration_enabled=False,
            wholesale_approval_required=True
        )
    
    return WholesaleSettingsResponse(
        default_discount_percentage=settings.get("default_discount_percentage", 20.0),
        quantity_tiers=settings.get("quantity_tiers", []),
        wholesale_registration_enabled=settings.get("wholesale_registration_enabled", False),
        wholesale_approval_required=settings.get("wholesale_approval_required", True)
    )


@router.put("/wholesale/settings", response_model=WholesaleSettingsResponse)
async def update_wholesale_settings(data: WholesaleSettingsUpdate):
    """Update global wholesale settings (Store Owner only)"""
    now = datetime.now(timezone.utc).isoformat()
    
    settings_data = {
        "type": "wholesale",
        "default_discount_percentage": data.default_discount_percentage,
        "quantity_tiers": data.quantity_tiers,
        "wholesale_registration_enabled": data.wholesale_registration_enabled,
        "wholesale_approval_required": data.wholesale_approval_required,
        "updated_at": now
    }
    
    await db.wholesale_settings.update_one(
        {"type": "wholesale"},
        {"$set": settings_data, "$setOnInsert": {"created_at": now}},
        upsert=True
    )
    
    return WholesaleSettingsResponse(**{k: v for k, v in settings_data.items() if k not in ["type", "updated_at", "created_at"]})


# ============== Product Wholesale Pricing ==============

@router.get("/products/{product_id}/wholesale-price")
async def get_product_wholesale_price(product_id: str):
    """Get wholesale price for a specific product"""
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    wholesale_settings = await db.wholesale_settings.find_one({"type": "wholesale"})
    default_discount = wholesale_settings.get("default_discount_percentage", 20.0) if wholesale_settings else 20.0
    
    retail_price = product.get("price", 0)
    manual_wholesale_price = product.get("wholesale_price")
    
    if manual_wholesale_price is not None:
        calculated_price = manual_wholesale_price
        price_source = "manual"
    else:
        calculated_price = round(retail_price * (1 - default_discount / 100), 2)
        price_source = "global_discount"
    
    return {
        "product_id": product_id,
        "retail_price": retail_price,
        "wholesale_price": calculated_price,
        "price_source": price_source,
        "global_discount_percentage": default_discount,
        "manual_wholesale_price": manual_wholesale_price
    }


@router.put("/products/{product_id}/wholesale-price")
async def update_product_wholesale_price(product_id: str, data: ProductWholesalePriceUpdate):
    """Set manual wholesale price for a product (Store Owner only)"""
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": {
            "wholesale_price": data.wholesale_price,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Wholesale price updated", "wholesale_price": data.wholesale_price}


@router.delete("/products/{product_id}/wholesale-price")
async def remove_product_wholesale_price(product_id: str):
    """Remove manual wholesale price (revert to global discount)"""
    result = await db.products.update_one(
        {"id": product_id},
        {"$unset": {"wholesale_price": ""}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Manual wholesale price removed, using global discount"}


# ============== Pricing Calculation ==============

async def calculate_customer_price(
    product_id: str,
    customer_id: Optional[str] = None,
    quantity: int = 1,
    option_strength: Optional[str] = None,
    option_package: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calculate price for a customer based on their tier and quantity
    Returns retail price if no customer or retail customer
    Returns wholesale price with applicable discounts for wholesale customers
    Supports option-level wholesale pricing when strength/package are provided
    """
    product = await db.products.find_one({"id": product_id})
    if not product:
        return None
    
    retail_price = product.get("price", 0)
    
    # If options are specified, get option-level retail price
    if option_strength and option_package:
        custom_data = product.get("custom_fields_data") or {}
        pricing_matrix = custom_data.get("pricing_matrix") or {}
        strength_prices = pricing_matrix.get(option_strength) or {}
        if option_package in strength_prices:
            retail_price = strength_prices.get(option_package, retail_price)
    
    # Default to retail
    if not customer_id:
        return {
            "unit_price": retail_price,
            "price_type": "retail",
            "discount_applied": 0,
            "quantity": quantity,
            "total": retail_price * quantity
        }
    
    # Get customer settings
    customer = await db.users.find_one({"id": customer_id})
    customer_settings = await db.customer_settings.find_one({"customer_id": customer_id})
    
    if not customer:
        return {
            "unit_price": retail_price,
            "price_type": "retail",
            "discount_applied": 0,
            "quantity": quantity,
            "total": retail_price * quantity
        }
    
    customer_type = customer_settings.get("customer_type", CustomerTier.RETAIL) if customer_settings else CustomerTier.RETAIL
    
    if customer_type == CustomerTier.RETAIL:
        return {
            "unit_price": retail_price,
            "price_type": "retail",
            "discount_applied": 0,
            "quantity": quantity,
            "total": retail_price * quantity
        }
    
    # Wholesale customer - calculate price
    wholesale_settings = await db.wholesale_settings.find_one({"type": "wholesale"})
    default_discount = wholesale_settings.get("default_discount_percentage", 20.0) if wholesale_settings else 20.0
    quantity_tiers = wholesale_settings.get("quantity_tiers", []) if wholesale_settings else []
    
    # Check for manual wholesale price - option-level first, then product-level
    manual_price = None
    if option_strength and option_package:
        custom_data = product.get("custom_fields_data") or {}
        option_stock = custom_data.get("option_stock") or {}
        strength_stock = option_stock.get(option_strength) or {}
        package_stock = strength_stock.get(option_package) or {}
        option_wholesale = package_stock.get("wholesale_price")
        if option_wholesale:
            manual_price = option_wholesale
    
    # Fall back to product-level wholesale price
    if manual_price is None:
        manual_price = product.get("wholesale_price")
    
    # Check for custom discount for this customer
    custom_discount = customer_settings.get("custom_discount_percentage") if customer_settings else None
    
    # Determine discount to apply
    discount_percentage = custom_discount if custom_discount is not None else default_discount
    discount_source = "customer_override" if custom_discount is not None else "global"
    
    # Check quantity tiers (higher quantity = higher discount)
    if quantity_tiers:
        # Sort by min_qty descending to find highest applicable tier
        sorted_tiers = sorted(quantity_tiers, key=lambda x: x.get("min_qty", 0), reverse=True)
        for tier in sorted_tiers:
            if quantity >= tier.get("min_qty", 0):
                tier_discount = tier.get("discount_pct", 0)
                if tier_discount > discount_percentage:
                    discount_percentage = tier_discount
                    discount_source = f"quantity_tier_{tier.get('min_qty')}"
                break
    
    # Calculate final price
    if manual_price is not None:
        unit_price = manual_price
        price_source = "manual_product_price"
    else:
        unit_price = round(retail_price * (1 - discount_percentage / 100), 2)
        price_source = discount_source
    
    return {
        "unit_price": unit_price,
        "price_type": "wholesale",
        "discount_applied": discount_percentage,
        "discount_source": price_source,
        "quantity": quantity,
        "total": round(unit_price * quantity, 2),
        "retail_price": retail_price,
        "savings": round((retail_price - unit_price) * quantity, 2)
    }


@router.post("/calculate-price")
async def calculate_price_endpoint(
    product_id: str,
    customer_id: Optional[str] = None,
    quantity: int = 1,
    option_strength: Optional[str] = None,
    option_package: Optional[str] = None
):
    """Calculate price for a product based on customer tier, with optional variant support"""
    result = await calculate_customer_price(product_id, customer_id, quantity, option_strength, option_package)
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    return result


# ============== Bulk Pricing for Cart ==============

class CartItem(BaseModel):
    product_id: str
    quantity: int = 1


class CartPricingRequest(BaseModel):
    items: List[CartItem]
    customer_id: Optional[str] = None


@router.post("/calculate-cart")
async def calculate_cart_pricing(data: CartPricingRequest):
    """Calculate prices for entire cart based on customer tier"""
    items_pricing = []
    subtotal = 0.0
    total_savings = 0.0
    
    # Get customer tier
    customer_type = CustomerTier.RETAIL
    minimum_order = 0.0
    
    if data.customer_id:
        customer_settings = await db.customer_settings.find_one({"customer_id": data.customer_id})
        if customer_settings:
            customer_type = customer_settings.get("customer_type", CustomerTier.RETAIL)
            minimum_order = customer_settings.get("minimum_order_amount", 0.0)
    
    for item in data.items:
        pricing = await calculate_customer_price(
            item.product_id,
            data.customer_id,
            item.quantity
        )
        
        if pricing:
            items_pricing.append({
                "product_id": item.product_id,
                **pricing
            })
            subtotal += pricing.get("total", 0)
            total_savings += pricing.get("savings", 0)
    
    # Check minimum order requirement
    meets_minimum = subtotal >= minimum_order
    
    return {
        "items": items_pricing,
        "subtotal": round(subtotal, 2),
        "total_savings": round(total_savings, 2),
        "customer_type": customer_type,
        "minimum_order_amount": minimum_order,
        "meets_minimum_order": meets_minimum,
        "amount_to_minimum": round(max(0, minimum_order - subtotal), 2)
    }


# ============== Role Verification for Routes ==============

@router.get("/verify-role")
async def verify_user_role(user_id: str):
    """Verify user role and return permissions"""
    # Check staff members first
    staff = await db.staff_members.find_one({"id": user_id, "is_deleted": {"$ne": True}})
    if staff:
        return {
            "user_type": "staff",
            "role": staff.get("role"),
            "permissions": get_role_permissions(staff.get("role")),
            "is_active": staff.get("is_active", True)
        }
    
    # Check regular users (super_admin from old system)
    user = await db.users.find_one({"id": user_id})
    if user:
        role = user.get("role", "user")
        if role in ["super_admin", "admin"]:
            return {
                "user_type": "staff",
                "role": StaffRole.STORE_OWNER,  # Map old super_admin to store_owner
                "permissions": get_role_permissions(StaffRole.STORE_OWNER),
                "is_active": user.get("is_active", True)
            }
        else:
            # Regular customer
            customer_settings = await db.customer_settings.find_one({"customer_id": user_id})
            return {
                "user_type": "customer",
                "customer_tier": customer_settings.get("customer_type", CustomerTier.RETAIL) if customer_settings else CustomerTier.RETAIL,
                "is_active": user.get("is_active", True)
            }
    
    raise HTTPException(status_code=404, detail="User not found")



# ============== Customer Shipping Addresses ==============

class ShippingAddressCreate(BaseModel):
    """Create a shipping address"""
    label: str = "Home"  # Home, Work, Custom name
    first_name: str
    last_name: str
    address1: str
    address2: Optional[str] = None
    city: str
    state: str
    zip_code: str
    country: str = "US"
    phone: Optional[str] = None
    is_default: bool = False


class ShippingAddressUpdate(BaseModel):
    """Update a shipping address"""
    label: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    is_default: Optional[bool] = None


class ShippingAddressResponse(BaseModel):
    """Shipping address response"""
    id: str
    customer_id: str
    label: str
    first_name: str
    last_name: str
    address1: str
    address2: Optional[str] = None
    city: str
    state: str
    zip_code: str
    country: str
    phone: Optional[str] = None
    is_default: bool
    created_at: str


@router.get("/customers/{customer_id}/addresses", response_model=List[ShippingAddressResponse])
async def list_customer_addresses(customer_id: str):
    """Get all shipping addresses for a customer"""
    addresses = await db.customer_addresses.find(
        {"customer_id": customer_id, "is_deleted": {"$ne": True}}
    ).to_list(50)
    
    result = []
    for addr in addresses:
        result.append(ShippingAddressResponse(
            id=addr.get("id"),
            customer_id=addr.get("customer_id"),
            label=addr.get("label", "Address"),
            first_name=addr.get("first_name", ""),
            last_name=addr.get("last_name", ""),
            address1=addr.get("address1", ""),
            address2=addr.get("address2"),
            city=addr.get("city", ""),
            state=addr.get("state", ""),
            zip_code=addr.get("zip_code", ""),
            country=addr.get("country", "US"),
            phone=addr.get("phone"),
            is_default=addr.get("is_default", False),
            created_at=addr.get("created_at", "")
        ))
    
    return result


@router.post("/customers/{customer_id}/addresses", response_model=ShippingAddressResponse)
async def create_customer_address(customer_id: str, data: ShippingAddressCreate):
    """Add a shipping address for a customer"""
    customer = await db.users.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    now = datetime.now(timezone.utc).isoformat()
    address_id = str(uuid.uuid4())
    
    # If this is set as default, unset others
    if data.is_default:
        await db.customer_addresses.update_many(
            {"customer_id": customer_id},
            {"$set": {"is_default": False}}
        )
    
    address_data = {
        "id": address_id,
        "customer_id": customer_id,
        "label": data.label,
        "first_name": data.first_name,
        "last_name": data.last_name,
        "address1": data.address1,
        "address2": data.address2,
        "city": data.city,
        "state": data.state,
        "zip_code": data.zip_code,
        "country": data.country,
        "phone": data.phone,
        "is_default": data.is_default,
        "is_deleted": False,
        "created_at": now,
        "updated_at": now
    }
    
    await db.customer_addresses.insert_one(address_data)
    address_data.pop("_id", None)
    
    return ShippingAddressResponse(**{k: v for k, v in address_data.items() if k not in ["is_deleted", "updated_at"]})


@router.put("/customers/{customer_id}/addresses/{address_id}", response_model=ShippingAddressResponse)
async def update_customer_address(customer_id: str, address_id: str, data: ShippingAddressUpdate):
    """Update a shipping address"""
    address = await db.customer_addresses.find_one({
        "id": address_id, 
        "customer_id": customer_id,
        "is_deleted": {"$ne": True}
    })
    
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    
    update_data = {}
    for field, value in data.dict(exclude_unset=True).items():
        if value is not None:
            update_data[field] = value
    
    # If setting as default, unset others
    if data.is_default:
        await db.customer_addresses.update_many(
            {"customer_id": customer_id, "id": {"$ne": address_id}},
            {"$set": {"is_default": False}}
        )
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.customer_addresses.update_one({"id": address_id}, {"$set": update_data})
    
    # Fetch updated
    address = await db.customer_addresses.find_one({"id": address_id})
    
    return ShippingAddressResponse(
        id=address.get("id"),
        customer_id=address.get("customer_id"),
        label=address.get("label", "Address"),
        first_name=address.get("first_name", ""),
        last_name=address.get("last_name", ""),
        address1=address.get("address1", ""),
        address2=address.get("address2"),
        city=address.get("city", ""),
        state=address.get("state", ""),
        zip_code=address.get("zip_code", ""),
        country=address.get("country", "US"),
        phone=address.get("phone"),
        is_default=address.get("is_default", False),
        created_at=address.get("created_at", "")
    )


@router.delete("/customers/{customer_id}/addresses/{address_id}")
async def delete_customer_address(customer_id: str, address_id: str):
    """Soft delete a shipping address"""
    result = await db.customer_addresses.update_one(
        {"id": address_id, "customer_id": customer_id},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    
    return {"message": "Address deleted"}


# ============== Customer Dashboard Data ==============

@router.get("/customers/{customer_id}/dashboard")
async def get_customer_dashboard(customer_id: str):
    """Get comprehensive customer dashboard data"""
    # First try to find in users collection
    customer = await db.users.find_one({"id": customer_id})
    
    # If not found, try the customers collection (order-derived customers)
    if not customer:
        customer = await db.customers.find_one({"id": customer_id})
    
    # If still not found, try to find by looking up customer_id in orders
    if not customer:
        order_with_customer = await db.orders.find_one({"customer_id": customer_id})
        if order_with_customer:
            customer = {
                "id": customer_id,
                "name": order_with_customer.get("customer_name", "Unknown"),
                "email": order_with_customer.get("customer_email", ""),
                "phone": order_with_customer.get("shipping", {}).get("phone"),
                "created_at": order_with_customer.get("created_at")
            }
        else:
            raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get customer settings (tier, discount)
    settings = await db.customer_settings.find_one({"customer_id": customer_id})
    
    # Get addresses
    addresses = await db.customer_addresses.find(
        {"customer_id": customer_id, "is_deleted": {"$ne": True}}
    ).to_list(50)
    
    # Get orders
    orders = await db.orders.find(
        {"$or": [
            {"customer_id": customer_id},
            {"customer_email": customer.get("email")}
        ]}
    ).sort("created_at", -1).to_list(100)
    
    # Calculate stats
    total_orders = len(orders)
    total_spent = sum(o.get("total", 0) for o in orders)
    avg_order = total_spent / total_orders if total_orders > 0 else 0
    
    # Format orders for response
    formatted_orders = []
    for order in orders:
        formatted_orders.append({
            "id": order.get("id"),
            "order_number": order.get("order_number"),
            "status": order.get("status"),
            "total": order.get("total", 0),
            "subtotal": order.get("subtotal", 0),
            "tax": order.get("tax", 0),
            "shipping_cost": order.get("shipping_cost", 0),
            "payment_method": order.get("payment_method"),
            "items_count": len(order.get("items", [])),
            "items": order.get("items", []),
            "shipping_address": order.get("shipping"),
            "created_at": order.get("created_at"),
            "tracking_number": order.get("tracking_number"),
            "shipping_carrier": order.get("shipping_carrier")
        })
    
    # Format addresses
    formatted_addresses = []
    for addr in addresses:
        formatted_addresses.append({
            "id": addr.get("id"),
            "label": addr.get("label", "Address"),
            "first_name": addr.get("first_name", ""),
            "last_name": addr.get("last_name", ""),
            "address1": addr.get("address1", ""),
            "address2": addr.get("address2"),
            "city": addr.get("city", ""),
            "state": addr.get("state", ""),
            "zip_code": addr.get("zip_code", ""),
            "country": addr.get("country", "US"),
            "phone": addr.get("phone"),
            "is_default": addr.get("is_default", False)
        })
    
    return {
        "customer": {
            "id": customer.get("id"),
            "name": customer.get("name"),
            "email": customer.get("email"),
            "phone": customer.get("phone"),
            "created_at": customer.get("created_at"),
            "customer_type": settings.get("customer_type", "retail") if settings else "retail",
            "custom_discount_percentage": settings.get("custom_discount_percentage") if settings else None,
            "notes": settings.get("notes") if settings else None
        },
        "stats": {
            "total_orders": total_orders,
            "total_spent": round(total_spent, 2),
            "avg_order_value": round(avg_order, 2)
        },
        "addresses": formatted_addresses,
        "orders": formatted_orders
    }


@router.put("/customers/{customer_id}/profile")
async def update_customer_profile(customer_id: str, data: dict):
    """Update customer profile info"""
    customer = await db.users.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    allowed_fields = ["name", "phone", "notes"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields and v is not None}
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"id": customer_id}, {"$set": update_data})
    
    # Update notes in customer_settings
    if "notes" in data:
        await db.customer_settings.update_one(
            {"customer_id": customer_id},
            {"$set": {"notes": data["notes"], "updated_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
    
    return {"message": "Profile updated"}
