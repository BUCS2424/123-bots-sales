"""
User Portal API Endpoints
Provides authenticated users with access to their orders, profile, and addresses
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import re
import logging

from auth import decode_token, TokenData, verify_password, get_password_hash
from two_factor_auth import normalize_trusted_devices

logger = logging.getLogger(__name__)

portal_router = APIRouter(prefix="/portal", tags=["User Portal"])
security = HTTPBearer()
db = None

def set_database(database):
    global db
    db = database


# ============== Auth Dependency ==============

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    token = credentials.credentials
    token_data = decode_token(token)
    if token_data is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return token_data


# ============== Models ==============

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class AddressCreate(BaseModel):
    name: str
    street: str
    street2: Optional[str] = None
    city: str
    state: str
    zip: str
    country: str = "USA"
    phone: Optional[str] = None
    is_default: bool = False


class CustomerLocationCreate(BaseModel):
    location_name: str
    address_line1: Optional[str] = ""
    address_line2: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    zip_code: Optional[str] = ""
    country: Optional[str] = ""
    site_contact_name: Optional[str] = ""
    site_contact_phone: Optional[str] = ""
    site_contact_email: Optional[str] = ""
    floor_or_area: Optional[str] = ""
    operating_hours: Optional[str] = ""
    wifi_network_name: Optional[str] = ""
    access_notes: Optional[str] = ""


class RobotLocationAssign(BaseModel):
    location_id: Optional[str] = None


# ============== Service Request Endpoints ==============

@portal_router.get("/my-service-requests")
async def get_my_service_requests(current_user: TokenData = Depends(get_current_user)):
    """Get all Service CRM requests submitted under the current user's email."""
    if not current_user.email:
        return []
    requests = await db.service_requests.find(
        {"email": {"$regex": f"^{re.escape(current_user.email)}$", "$options": "i"}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=100)
    return requests


# ============== Order Endpoints ==============

@portal_router.get("/my-orders")
async def get_my_orders(current_user: TokenData = Depends(get_current_user)):
    """Get all orders for the current user"""
    orders = await db.orders.find(
        {"customer_id": current_user.user_id, "is_deleted": {"$ne": True}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=100)
    
    return orders


@portal_router.get("/my-orders/{order_id}")
async def get_order_detail(order_id: str, current_user: TokenData = Depends(get_current_user)):
    """Get specific order details"""
    order = await db.orders.find_one(
        {"id": order_id, "customer_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order


# ============== Account Endpoints ==============

@portal_router.get("/my-account")
async def get_my_account(current_user: TokenData = Depends(get_current_user)):
    """Get current user's account information"""
    user = await db.users.find_one(
        {"id": current_user.user_id},
        {"_id": 0, "hashed_password": 0, "verification_code": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get customer settings (tier info)
    customer_settings = await db.customer_settings.find_one(
        {"customer_id": current_user.user_id},
        {"_id": 0}
    )
    
    # Get addresses
    addresses = await db.user_addresses.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).to_list(length=50)
    
    # Get order stats
    orders = await db.orders.find(
        {"customer_id": current_user.user_id, "is_deleted": {"$ne": True}}
    ).to_list(length=1000)
    
    total_orders = len(orders)
    total_spent = sum(o.get("total", 0) for o in orders)
    
    return {
        "id": user.get("id"),
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role"),
        "email_verified": user.get("email_verified", False),
        "email_2fa_enabled": user.get("email_2fa_enabled", False),
        "trusted_device_count": len(normalize_trusted_devices(user.get("email_2fa_trusted_devices", []))),
        "created_at": user.get("created_at"),
        "customer_type": customer_settings.get("customer_type", "retail") if customer_settings else "retail",
        "custom_discount_percentage": customer_settings.get("custom_discount_percentage") if customer_settings else None,
        "addresses": addresses,
        "total_orders": total_orders,
        "total_spent": total_spent
    }


@portal_router.put("/my-account")
async def update_my_account(data: ProfileUpdate, current_user: TokenData = Depends(get_current_user)):
    """Update current user's profile"""
    update_data = {}
    
    if data.name:
        update_data["name"] = data.name
    
    if data.email:
        # Check if email is already taken
        existing = await db.users.find_one({"email": data.email, "id": {"$ne": current_user.user_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_data["email"] = data.email
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one(
            {"id": current_user.user_id},
            {"$set": update_data}
        )
    
    return {"message": "Profile updated successfully"}


@portal_router.post("/change-password")
async def change_password(data: PasswordChange, current_user: TokenData = Depends(get_current_user)):
    """Change user's password"""
    user = await db.users.find_one({"id": current_user.user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(data.current_password, user.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Validate new password
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    # Update password
    new_hash = get_password_hash(data.new_password)
    await db.users.update_one(
        {"id": current_user.user_id},
        {"$set": {
            "hashed_password": new_hash,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Password changed successfully"}


# ============== Address Endpoints ==============

@portal_router.get("/addresses")
async def get_my_addresses(current_user: TokenData = Depends(get_current_user)):
    """Get all addresses for the current user"""
    addresses = await db.user_addresses.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).to_list(length=50)
    
    return addresses


@portal_router.post("/addresses")
async def add_address(data: AddressCreate, current_user: TokenData = Depends(get_current_user)):
    """Add a new address"""
    address_id = str(uuid.uuid4())
    
    # If this is set as default, unset other defaults
    if data.is_default:
        await db.user_addresses.update_many(
            {"user_id": current_user.user_id},
            {"$set": {"is_default": False}}
        )
    
    address = {
        "id": address_id,
        "user_id": current_user.user_id,
        "name": data.name,
        "street": data.street,
        "street2": data.street2,
        "city": data.city,
        "state": data.state,
        "zip": data.zip,
        "country": data.country,
        "phone": data.phone,
        "is_default": data.is_default,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.user_addresses.insert_one(address)
    
    # Return without _id
    address.pop("_id", None)
    return address


@portal_router.put("/addresses/{address_id}")
async def update_address(address_id: str, data: AddressCreate, current_user: TokenData = Depends(get_current_user)):
    """Update an existing address"""
    address = await db.user_addresses.find_one({
        "id": address_id,
        "user_id": current_user.user_id
    })
    
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    
    # If this is set as default, unset other defaults
    if data.is_default:
        await db.user_addresses.update_many(
            {"user_id": current_user.user_id, "id": {"$ne": address_id}},
            {"$set": {"is_default": False}}
        )
    
    update_data = {
        "name": data.name,
        "street": data.street,
        "street2": data.street2,
        "city": data.city,
        "state": data.state,
        "zip": data.zip,
        "country": data.country,
        "phone": data.phone,
        "is_default": data.is_default,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.user_addresses.update_one(
        {"id": address_id},
        {"$set": update_data}
    )
    
    return {"message": "Address updated", "id": address_id}


@portal_router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, current_user: TokenData = Depends(get_current_user)):
    """Delete an address"""
    result = await db.user_addresses.delete_one({
        "id": address_id,
        "user_id": current_user.user_id
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")

    return {"message": "Address deleted"}


# ============== Robot Deployment Location Endpoints ==============
# A customer-managed list of sites (distinct from checkout addresses above) -
# each owned robot can be assigned to one, carrying site-contact/wifi/access
# details a technician or the customer needs for that deployment.

@portal_router.get("/locations")
async def get_my_locations(current_user: TokenData = Depends(get_current_user)):
    """Get all robot deployment locations saved on the current user's account."""
    if not current_user.email:
        return []
    locations = await db.customer_locations.find(
        {"customer_email": {"$regex": f"^{re.escape(current_user.email)}$", "$options": "i"}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=200)
    return locations


@portal_router.post("/locations")
async def add_location(data: CustomerLocationCreate, current_user: TokenData = Depends(get_current_user)):
    """Add a new robot deployment location."""
    if not current_user.email:
        raise HTTPException(status_code=400, detail="Account has no email on file")
    now = datetime.now(timezone.utc).isoformat()
    location = {
        "id": str(uuid.uuid4()),
        "customer_email": current_user.email,
        **data.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    await db.customer_locations.insert_one(location)
    location.pop("_id", None)
    return location


@portal_router.put("/locations/{location_id}")
async def update_location(location_id: str, data: CustomerLocationCreate, current_user: TokenData = Depends(get_current_user)):
    """Update a robot deployment location."""
    existing = await db.customer_locations.find_one({
        "id": location_id,
        "customer_email": {"$regex": f"^{re.escape(current_user.email or '')}$", "$options": "i"},
    })
    if not existing:
        raise HTTPException(status_code=404, detail="Location not found")

    update_data = {**data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.customer_locations.update_one({"id": location_id}, {"$set": update_data})
    return {"message": "Location updated", "id": location_id}


@portal_router.delete("/locations/{location_id}")
async def delete_location(location_id: str, current_user: TokenData = Depends(get_current_user)):
    """Delete a robot deployment location - unassigns it from any robots that referenced it."""
    result = await db.customer_locations.delete_one({
        "id": location_id,
        "customer_email": {"$regex": f"^{re.escape(current_user.email or '')}$", "$options": "i"},
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")

    await db.fleet_units.update_many({"location_id": location_id}, {"$set": {"location_id": None}})
    return {"message": "Location deleted"}


# ============== My Robots Endpoints ==============
# Owned-robot visibility for the customer portal - matches a unit to its
# owner the same way service_repair.py's scan lookup does (sold_owner_email,
# case-insensitive), since that's the one durable link a sold fleet_units
# doc carries back to an account.

@portal_router.get("/my-robots")
async def get_my_robots(current_user: TokenData = Depends(get_current_user)):
    """Get every fleet unit (robot) sold to the current user's account."""
    if not current_user.email:
        return []
    units = await db.fleet_units.find(
        {
            "destination": "sold",
            "sold_owner_email": {"$regex": f"^{re.escape(current_user.email)}$", "$options": "i"},
        },
        {"_id": 0}
    ).sort("sold_at", -1).to_list(length=200)

    location_ids = [u["location_id"] for u in units if u.get("location_id")]
    locations_by_id = {}
    if location_ids:
        locs = await db.customer_locations.find({"id": {"$in": location_ids}}, {"_id": 0}).to_list(length=200)
        locations_by_id = {loc["id"]: loc for loc in locs}
    for u in units:
        u["location_detail"] = locations_by_id.get(u.get("location_id"))
    return units


@portal_router.get("/my-robots/{unit_id}")
async def get_my_robot_detail(unit_id: str, current_user: TokenData = Depends(get_current_user)):
    """Full detail for one owned robot - backs the per-robot dashboard page."""
    if not current_user.email:
        raise HTTPException(status_code=404, detail="Robot not found")
    unit = await db.fleet_units.find_one(
        {
            "id": unit_id,
            "destination": "sold",
            "sold_owner_email": {"$regex": f"^{re.escape(current_user.email)}$", "$options": "i"},
        },
        {"_id": 0}
    )
    if not unit:
        raise HTTPException(status_code=404, detail="Robot not found")

    unit["location_detail"] = None
    if unit.get("location_id"):
        unit["location_detail"] = await db.customer_locations.find_one({"id": unit["location_id"]}, {"_id": 0})
    return unit


@portal_router.put("/my-robots/{unit_id}/location")
async def assign_robot_location(unit_id: str, data: RobotLocationAssign, current_user: TokenData = Depends(get_current_user)):
    """Assign (or clear, with location_id: null) which saved location an owned robot is deployed at."""
    unit = await db.fleet_units.find_one({
        "id": unit_id,
        "destination": "sold",
        "sold_owner_email": {"$regex": f"^{re.escape(current_user.email or '')}$", "$options": "i"},
    })
    if not unit:
        raise HTTPException(status_code=404, detail="Robot not found")

    if data.location_id:
        location = await db.customer_locations.find_one({
            "id": data.location_id,
            "customer_email": {"$regex": f"^{re.escape(current_user.email or '')}$", "$options": "i"},
        })
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")

    await db.fleet_units.update_one(
        {"id": unit_id},
        {"$set": {"location_id": data.location_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Robot location updated"}
