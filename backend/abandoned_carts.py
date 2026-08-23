"""
Abandoned Carts Module
Tracks abandoned shopping carts and generates unique recovery coupons.
Features:
- Automatic cart tracking (24h abandonment threshold)
- Unique one-time user coupons
- Auto-email at 24h and 36h
- 365-day retention with auto-cleanup
- Admin dashboard with search/filter
"""
from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import uuid
import random
import string
import asyncio

router = APIRouter(prefix="/abandoned-carts", tags=["abandoned-carts"])

# Will be set by server.py
db = None
send_email_func = None

def set_db(database):
    global db
    db = database

def set_email_func(func):
    global send_email_func
    send_email_func = func


# ==================== MODELS ====================

class CartItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    image: Optional[str] = None

class AbandonedCartCreate(BaseModel):
    """Create/update abandoned cart tracking"""
    session_id: str
    email: Optional[str] = None
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    items: List[CartItem]
    subtotal: float

class AbandonedCartSettings(BaseModel):
    """Admin settings for abandoned cart recovery"""
    enabled: bool = True
    first_email_hours: int = 24
    second_email_hours: int = 36
    discount_type: str = "fixed"  # "fixed" or "percentage"
    discount_value: float = 10.0  # $10 off or 10% off
    min_cart_value: float = 0  # Minimum cart value to trigger recovery
    coupon_prefix: str = "RECOVER"
    retention_days: int = 365

class ResendEmailRequest(BaseModel):
    cart_id: str


# ==================== HELPER FUNCTIONS ====================

def generate_unique_coupon_code(prefix: str = "RECOVER") -> str:
    """Generate a unique coupon code like RECOVER-ABC123"""
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{random_part}"


async def get_abandoned_cart_settings():
    """Get abandoned cart settings from database"""
    settings = await db.admin_settings.find_one({"type": "abandoned_cart"})
    if not settings:
        # Return defaults
        return AbandonedCartSettings().model_dump()
    return {
        "enabled": settings.get("enabled", True),
        "first_email_hours": settings.get("first_email_hours", 24),
        "second_email_hours": settings.get("second_email_hours", 36),
        "discount_type": settings.get("discount_type", "fixed"),
        "discount_value": settings.get("discount_value", 10.0),
        "min_cart_value": settings.get("min_cart_value", 0),
        "coupon_prefix": settings.get("coupon_prefix", "RECOVER"),
        "retention_days": settings.get("retention_days", 365)
    }


async def create_recovery_coupon(cart_id: str, email: str, cart_value: float) -> dict:
    """Create a unique one-time recovery coupon for an abandoned cart"""
    settings = await get_abandoned_cart_settings()
    
    coupon_code = generate_unique_coupon_code(settings["coupon_prefix"])
    
    # Ensure uniqueness
    while await db.discounts.find_one({"code": coupon_code}):
        coupon_code = generate_unique_coupon_code(settings["coupon_prefix"])
    
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings["retention_days"])
    
    coupon = {
        "id": str(uuid.uuid4()),
        "code": coupon_code,
        "description": f"Cart recovery discount for {email}",
        "discount_type": settings["discount_type"],
        "value": settings["discount_value"],
        "min_order_amount": None,
        "max_uses": 1,  # One-time use
        "times_used": 0,
        "is_active": True,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        # Abandoned cart specific fields
        "is_recovery_coupon": True,
        "abandoned_cart_id": cart_id,
        "recovery_email": email,
        "cart_value_at_creation": cart_value
    }
    
    await db.discounts.insert_one(coupon)
    return coupon


async def send_recovery_email(cart: dict, coupon: dict, is_second_email: bool = False):
    """Send cart recovery email with coupon code"""
    if not send_email_func or not cart.get("email"):
        return False
    
    settings = await get_abandoned_cart_settings()
    discount_text = f"${settings['discount_value']}" if settings["discount_type"] == "fixed" else f"{settings['discount_value']}%"
    
    # Build cart items HTML
    items_html = ""
    for item in cart.get("items", []):
        items_html += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
                <div style="display: flex; align-items: center;">
                    <img src="{item.get('image', 'https://via.placeholder.com/60')}" alt="{item['name']}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 12px;">
                    <div>
                        <strong style="color: #333;">{item['name']}</strong>
                        <br><span style="color: #666; font-size: 14px;">Qty: {item['quantity']}</span>
                    </div>
                </div>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #6e2ea8;">
                ${item['price'] * item['quantity']:.2f}
            </td>
        </tr>
        """
    
    urgency_text = "Don't miss out!" if not is_second_email else "Last chance! Your cart is about to expire."
    
    subject = f"{'🔥 Final Reminder: ' if is_second_email else ''}You left something behind - Here's {discount_text} off!"
    
    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #6e2ea8 0%, #1a0b2e 100%); padding: 30px; text-align: center;">
                <h1 style="color: #f4e4bc; margin: 0; font-size: 28px;">123Bots</h1>
                <p style="color: #d4c4a8; margin: 10px 0 0 0; font-size: 14px;">Commercial Cleaning Robots</p>
            </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
            <td style="padding: 40px 30px;">
                <h2 style="color: #6e2ea8; margin: 0 0 20px 0;">You Left Something Behind!</h2>
                <p style="color: #333; line-height: 1.6; margin: 0 0 20px 0;">
                    Hi{' ' + cart.get('user_name', '') if cart.get('user_name') else ''},
                </p>
                <p style="color: #333; line-height: 1.6; margin: 0 0 20px 0;">
                    We noticed you didn't complete your order. {urgency_text}
                </p>
                
                <!-- Coupon Box -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f8f5ff 0%, #fff 100%); border: 2px dashed #6e2ea8; border-radius: 12px; margin: 25px 0;">
                    <tr>
                        <td style="padding: 25px; text-align: center;">
                            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your exclusive discount code:</p>
                            <p style="color: #6e2ea8; font-size: 32px; font-weight: bold; letter-spacing: 3px; margin: 0 0 10px 0; font-family: monospace;">{coupon['code']}</p>
                            <p style="color: #b9893d; font-size: 18px; font-weight: bold; margin: 0;">Save {discount_text} on your order!</p>
                        </td>
                    </tr>
                </table>
                
                <!-- Cart Items -->
                <h3 style="color: #6e2ea8; margin: 30px 0 15px 0; border-bottom: 2px solid #f4e4bc; padding-bottom: 10px;">Your Cart Items</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                    {items_html}
                    <tr>
                        <td style="padding: 15px 12px; font-weight: bold; color: #333;">Subtotal:</td>
                        <td style="padding: 15px 12px; text-align: right; font-size: 20px; font-weight: bold; color: #6e2ea8;">${cart.get('subtotal', 0):.2f}</td>
                    </tr>
                </table>
                
                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                        <td style="text-align: center;">
                            <a href="https://123bots.com/checkout" style="display: inline-block; background: linear-gradient(135deg, #6e2ea8 0%, #b9893d 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                Complete Your Order
                            </a>
                        </td>
                    </tr>
                </table>
                
                <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px; text-align: center;">
                    This coupon expires in {settings['retention_days']} days and can only be used once.
                </p>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style="background-color: #1a0b2e; padding: 30px; text-align: center;">
                <p style="color: #b9893d; margin: 0 0 10px 0; font-size: 12px;">FOR RESEARCH USE ONLY • NOT FOR HUMAN CONSUMPTION</p>
                <p style="color: #888; margin: 0; font-size: 12px;">
                    © {datetime.now().year} 123Bots. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>"""
    
    text_content = f"""
123Bots - You Left Something Behind!

Hi{' ' + cart.get('user_name', '') if cart.get('user_name') else ''},

We noticed you didn't complete your order. {urgency_text}

Your exclusive discount code: {coupon['code']}
Save {discount_text} on your order!

Visit https://123bots.com/checkout to complete your purchase.

This coupon expires in {settings['retention_days']} days and can only be used once.

FOR RESEARCH USE ONLY - NOT FOR HUMAN CONSUMPTION
© {datetime.now().year} 123Bots
"""
    
    try:
        result = await send_email_func(cart["email"], subject, html_content, text_content)
        return result
    except Exception as e:
        print(f"Failed to send recovery email: {e}")
        return False


# ==================== API ENDPOINTS ====================

@router.get("/settings")
async def get_settings():
    """Get abandoned cart settings"""
    return await get_abandoned_cart_settings()


@router.post("/settings")
async def update_settings(settings: AbandonedCartSettings):
    """Update abandoned cart settings"""
    await db.admin_settings.update_one(
        {"type": "abandoned_cart"},
        {"$set": {
            "type": "abandoned_cart",
            **settings.model_dump(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"success": True, "message": "Settings updated"}


@router.post("/track")
async def track_cart(cart_data: AbandonedCartCreate):
    """Track a cart for potential abandonment"""
    now = datetime.now(timezone.utc)
    
    # Check for existing cart by session_id
    existing = await db.abandoned_carts.find_one({"session_id": cart_data.session_id})
    
    if existing:
        # Update existing cart
        await db.abandoned_carts.update_one(
            {"session_id": cart_data.session_id},
            {"$set": {
                "email": cart_data.email or existing.get("email"),
                "user_id": cart_data.user_id or existing.get("user_id"),
                "user_name": cart_data.user_name or existing.get("user_name"),
                "items": [item.model_dump() for item in cart_data.items],
                "subtotal": cart_data.subtotal,
                "updated_at": now.isoformat(),
                "status": "active" if cart_data.items else "empty"
            }}
        )
        return {"success": True, "message": "Cart updated", "cart_id": str(existing["_id"])}
    else:
        # Create new cart tracking
        cart_doc = {
            "session_id": cart_data.session_id,
            "email": cart_data.email,
            "user_id": cart_data.user_id,
            "user_name": cart_data.user_name,
            "items": [item.model_dump() for item in cart_data.items],
            "subtotal": cart_data.subtotal,
            "status": "active" if cart_data.items else "empty",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "first_email_sent": False,
            "first_email_sent_at": None,
            "second_email_sent": False,
            "second_email_sent_at": None,
            "recovery_coupon_id": None,
            "recovery_coupon_code": None,
            "recovered": False,
            "recovered_at": None,
            "recovered_order_id": None
        }
        result = await db.abandoned_carts.insert_one(cart_doc)
        return {"success": True, "message": "Cart tracking started", "cart_id": str(result.inserted_id)}


@router.post("/mark-completed")
async def mark_cart_completed(session_id: str):
    """Mark a cart as completed (not abandoned)"""
    await db.abandoned_carts.update_one(
        {"session_id": session_id},
        {"$set": {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"success": True}


@router.post("/mark-recovered")
async def mark_cart_recovered(cart_id: str, order_id: str):
    """Mark an abandoned cart as recovered with order"""
    now = datetime.now(timezone.utc)
    
    # Find the cart
    cart = await db.abandoned_carts.find_one({"_id": ObjectId(cart_id)})
    if not cart:
        # Try by coupon code
        cart = await db.abandoned_carts.find_one({"recovery_coupon_code": cart_id})
    
    if cart:
        await db.abandoned_carts.update_one(
            {"_id": cart["_id"]},
            {"$set": {
                "status": "recovered",
                "recovered": True,
                "recovered_at": now.isoformat(),
                "recovered_order_id": order_id
            }}
        )
        
        # Mark the coupon as used
        if cart.get("recovery_coupon_id"):
            await db.discounts.update_one(
                {"id": cart["recovery_coupon_id"]},
                {"$inc": {"times_used": 1}}
            )
    
    return {"success": True}


@router.get("")
async def list_abandoned_carts(
    status: Optional[str] = None,
    search: Optional[str] = None,
    has_email: Optional[bool] = None,
    page: int = 1,
    limit: int = 20
):
    """List abandoned carts with filters"""
    query = {}
    
    if status:
        query["status"] = status
    else:
        # By default, show only abandoned carts (not completed or empty)
        query["status"] = {"$in": ["abandoned", "recovered", "active"]}
    
    if has_email is not None:
        if has_email:
            query["email"] = {"$ne": None, "$exists": True}
        else:
            query["$or"] = [{"email": None}, {"email": {"$exists": False}}]
    
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"user_name": {"$regex": search, "$options": "i"}},
            {"recovery_coupon_code": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    
    # Get total count
    total = await db.abandoned_carts.count_documents(query)
    
    # Get carts
    carts = await db.abandoned_carts.find(query).sort("updated_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Convert ObjectId to string
    for cart in carts:
        cart["id"] = str(cart.pop("_id"))
    
    return {
        "carts": carts,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/stats")
async def get_abandoned_cart_stats():
    """Get abandoned cart statistics"""
    now = datetime.now(timezone.utc)
    
    # Total abandoned
    total_abandoned = await db.abandoned_carts.count_documents({"status": "abandoned"})
    
    # Total recovered
    total_recovered = await db.abandoned_carts.count_documents({"status": "recovered"})
    
    # Total value abandoned (last 30 days)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    abandoned_carts = await db.abandoned_carts.find({
        "status": "abandoned",
        "created_at": {"$gte": thirty_days_ago}
    }).to_list(1000)
    total_abandoned_value = sum(cart.get("subtotal", 0) for cart in abandoned_carts)
    
    # Total value recovered (last 30 days)
    recovered_carts = await db.abandoned_carts.find({
        "status": "recovered",
        "recovered_at": {"$gte": thirty_days_ago}
    }).to_list(1000)
    total_recovered_value = sum(cart.get("subtotal", 0) for cart in recovered_carts)
    
    # Recovery rate
    recovery_rate = (total_recovered / total_abandoned * 100) if total_abandoned > 0 else 0
    
    # Pending emails (carts with email, not yet sent first email, older than threshold)
    settings = await get_abandoned_cart_settings()
    first_email_threshold = (now - timedelta(hours=settings["first_email_hours"])).isoformat()
    pending_first_email = await db.abandoned_carts.count_documents({
        "status": "abandoned",
        "email": {"$ne": None, "$exists": True},
        "first_email_sent": False,
        "updated_at": {"$lte": first_email_threshold}
    })
    
    return {
        "total_abandoned": total_abandoned,
        "total_recovered": total_recovered,
        "recovery_rate": round(recovery_rate, 1),
        "total_abandoned_value_30d": round(total_abandoned_value, 2),
        "total_recovered_value_30d": round(total_recovered_value, 2),
        "pending_first_email": pending_first_email,
        "settings": settings
    }


@router.get("/{cart_id}")
async def get_abandoned_cart(cart_id: str):
    """Get a single abandoned cart"""
    try:
        cart = await db.abandoned_carts.find_one({"_id": ObjectId(cart_id)})
    except Exception:
        cart = None
    
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart["id"] = str(cart.pop("_id"))
    return cart


@router.delete("/{cart_id}")
async def delete_abandoned_cart(cart_id: str):
    """Delete an abandoned cart and its associated coupon"""
    try:
        cart = await db.abandoned_carts.find_one({"_id": ObjectId(cart_id)})
    except Exception:
        cart = None
    
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Delete associated coupon if exists
    if cart.get("recovery_coupon_id"):
        await db.discounts.delete_one({"id": cart["recovery_coupon_id"]})
    
    await db.abandoned_carts.delete_one({"_id": ObjectId(cart_id)})
    return {"success": True, "message": "Cart deleted"}


@router.post("/{cart_id}/resend-email")
async def resend_recovery_email(cart_id: str):
    """Manually resend recovery email for a cart"""
    try:
        cart = await db.abandoned_carts.find_one({"_id": ObjectId(cart_id)})
    except Exception:
        cart = None
    
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    if not cart.get("email"):
        raise HTTPException(status_code=400, detail="Cart has no email address")
    
    # Check if coupon exists, if not create one
    coupon = None
    if cart.get("recovery_coupon_id"):
        coupon = await db.discounts.find_one({"id": cart["recovery_coupon_id"]})
    
    if not coupon:
        coupon = await create_recovery_coupon(
            str(cart["_id"]), 
            cart["email"], 
            cart.get("subtotal", 0)
        )
        await db.abandoned_carts.update_one(
            {"_id": cart["_id"]},
            {"$set": {
                "recovery_coupon_id": coupon["id"],
                "recovery_coupon_code": coupon["code"]
            }}
        )
    
    # Send email
    cart["id"] = str(cart["_id"])
    success = await send_recovery_email(cart, coupon, is_second_email=False)
    
    if success:
        await db.abandoned_carts.update_one(
            {"_id": ObjectId(cart_id)},
            {"$set": {
                "manual_email_sent": True,
                "manual_email_sent_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"success": True, "message": "Recovery email sent"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email")


@router.post("/process-abandoned")
async def process_abandoned_carts():
    """
    Background job to process abandoned carts:
    1. Mark carts as abandoned after inactivity
    2. Send first recovery email at 24h
    3. Send second recovery email at 36h
    4. Clean up carts older than retention period
    """
    now = datetime.now(timezone.utc)
    settings = await get_abandoned_cart_settings()
    
    if not settings.get("enabled", True):
        return {"success": True, "message": "Abandoned cart processing is disabled"}
    
    results = {
        "marked_abandoned": 0,
        "first_emails_sent": 0,
        "second_emails_sent": 0,
        "cleaned_up": 0,
        "errors": []
    }
    
    # 1. Mark active carts as abandoned after 24 hours of inactivity
    abandon_threshold = (now - timedelta(hours=settings["first_email_hours"])).isoformat()
    active_carts = await db.abandoned_carts.find({
        "status": "active",
        "updated_at": {"$lte": abandon_threshold},
        "items": {"$ne": [], "$exists": True}
    }).to_list(100)
    
    for cart in active_carts:
        if cart.get("subtotal", 0) >= settings.get("min_cart_value", 0):
            await db.abandoned_carts.update_one(
                {"_id": cart["_id"]},
                {"$set": {"status": "abandoned", "abandoned_at": now.isoformat()}}
            )
            results["marked_abandoned"] += 1
    
    # 2. Send first recovery email (24h after abandonment)
    first_email_carts = await db.abandoned_carts.find({
        "status": "abandoned",
        "email": {"$ne": None, "$exists": True},
        "first_email_sent": False
    }).to_list(50)
    
    for cart in first_email_carts:
        try:
            # Create coupon if not exists
            if not cart.get("recovery_coupon_id"):
                coupon = await create_recovery_coupon(
                    str(cart["_id"]),
                    cart["email"],
                    cart.get("subtotal", 0)
                )
                await db.abandoned_carts.update_one(
                    {"_id": cart["_id"]},
                    {"$set": {
                        "recovery_coupon_id": coupon["id"],
                        "recovery_coupon_code": coupon["code"]
                    }}
                )
            else:
                coupon = await db.discounts.find_one({"id": cart["recovery_coupon_id"]})
            
            if coupon:
                cart["id"] = str(cart["_id"])
                success = await send_recovery_email(cart, coupon, is_second_email=False)
                if success:
                    await db.abandoned_carts.update_one(
                        {"_id": cart["_id"]},
                        {"$set": {
                            "first_email_sent": True,
                            "first_email_sent_at": now.isoformat()
                        }}
                    )
                    results["first_emails_sent"] += 1
        except Exception as e:
            results["errors"].append(f"First email error for {cart.get('email')}: {str(e)}")
    
    # 3. Send second recovery email (36h after abandonment)
    second_email_threshold = (now - timedelta(hours=settings["second_email_hours"])).isoformat()
    second_email_carts = await db.abandoned_carts.find({
        "status": "abandoned",
        "email": {"$ne": None, "$exists": True},
        "first_email_sent": True,
        "second_email_sent": False,
        "first_email_sent_at": {"$lte": second_email_threshold}
    }).to_list(50)
    
    for cart in second_email_carts:
        try:
            coupon = await db.discounts.find_one({"id": cart.get("recovery_coupon_id")})
            if coupon:
                cart["id"] = str(cart["_id"])
                success = await send_recovery_email(cart, coupon, is_second_email=True)
                if success:
                    await db.abandoned_carts.update_one(
                        {"_id": cart["_id"]},
                        {"$set": {
                            "second_email_sent": True,
                            "second_email_sent_at": now.isoformat()
                        }}
                    )
                    results["second_emails_sent"] += 1
        except Exception as e:
            results["errors"].append(f"Second email error for {cart.get('email')}: {str(e)}")
    
    # 4. Clean up old carts and expired coupons
    retention_threshold = (now - timedelta(days=settings["retention_days"])).isoformat()
    
    # Find old carts to delete
    old_carts = await db.abandoned_carts.find({
        "created_at": {"$lte": retention_threshold}
    }).to_list(100)
    
    for cart in old_carts:
        # Delete associated coupon
        if cart.get("recovery_coupon_id"):
            await db.discounts.delete_one({"id": cart["recovery_coupon_id"]})
        await db.abandoned_carts.delete_one({"_id": cart["_id"]})
        results["cleaned_up"] += 1
    
    # Also clean up expired recovery coupons
    await db.discounts.delete_many({
        "is_recovery_coupon": True,
        "expires_at": {"$lte": now.isoformat()}
    })
    
    return {"success": True, "results": results}


# ==================== RECOVERY COUPON SEARCH (for Discounts module) ====================

@router.get("/recovery-coupons/search")
async def search_recovery_coupons(
    search: Optional[str] = None,
    used: Optional[bool] = None,
    page: int = 1,
    limit: int = 20
):
    """Search recovery coupons (for integration with Discounts module)"""
    query = {"is_recovery_coupon": True}
    
    if search:
        query["$or"] = [
            {"code": {"$regex": search, "$options": "i"}},
            {"recovery_email": {"$regex": search, "$options": "i"}}
        ]
    
    if used is not None:
        if used:
            query["times_used"] = {"$gt": 0}
        else:
            query["times_used"] = 0
    
    skip = (page - 1) * limit
    
    total = await db.discounts.count_documents(query)
    coupons = await db.discounts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "coupons": coupons,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }
