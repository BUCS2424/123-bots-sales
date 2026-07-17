"""
Durango Merchant Services Payment Gateway Integration

This module handles payment processing through Durango's gateway using:
- Collect.js for secure card tokenization (frontend)
- Direct Post API for payment processing (backend)
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import os
import httpx
import logging
import uuid
from urllib.parse import urlencode
from dotenv import load_dotenv
from auth import decode_token
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest, CheckoutStatusResponse

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])

# Database reference (set by main app)
db = None

def set_database(database):
    global db
    db = database


# ============ MODELS ============

class DurangoSettings(BaseModel):
    """Durango Gateway Settings stored in DB"""
    tokenization_key: Optional[str] = None  # Public key for Collect.js
    api_username: Optional[str] = None       # API username for backend
    api_password: Optional[str] = None       # API password for backend
    gateway_url: str = "https://secure.durango-direct.com/api/transact.php"
    is_test_mode: bool = True
    is_enabled: bool = False
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None


class DurangoSettingsUpdate(BaseModel):
    """Request model for updating Durango settings"""
    tokenization_key: Optional[str] = None
    api_username: Optional[str] = None
    api_password: Optional[str] = None
    gateway_url: Optional[str] = None
    is_test_mode: Optional[bool] = None
    is_enabled: Optional[bool] = None


class CashAppVenmoSettings(BaseModel):
    """CashApp & Venmo Settings stored in DB"""
    cashapp_id: Optional[str] = None  # CashApp $cashtag
    venmo_id: Optional[str] = None    # Venmo @username
    is_enabled: bool = False
    instructions: str = "Please send payment to the ID shown and include your order number in the note."
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None


class CashAppVenmoSettingsUpdate(BaseModel):
    """Request model for updating CashApp/Venmo settings"""
    cashapp_id: Optional[str] = None
    venmo_id: Optional[str] = None
    is_enabled: Optional[bool] = None
    instructions: Optional[str] = None


class StripeGatewaySettings(BaseModel):
    """Stripe Gateway Settings stored in DB"""
    publishable_key: Optional[str] = None
    secret_key: Optional[str] = None
    webhook_secret: Optional[str] = None
    is_test_mode: bool = True
    is_enabled: bool = False
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None


class StripeGatewaySettingsUpdate(BaseModel):
    """Request model for updating Stripe gateway settings"""
    publishable_key: Optional[str] = None
    secret_key: Optional[str] = None
    webhook_secret: Optional[str] = None
    is_test_mode: Optional[bool] = None
    is_enabled: Optional[bool] = None


class PayPalSettings(BaseModel):
    """PayPal gateway settings stored in DB"""
    paypal_email: Optional[str] = None
    setup_mode: str = "email"  # email | api_keys
    sandbox_client_id: Optional[str] = None
    sandbox_client_secret: Optional[str] = None
    live_client_id: Optional[str] = None
    live_client_secret: Optional[str] = None
    is_test_mode: bool = True
    is_enabled: bool = False
    instructions: str = "Use your order number in the PayPal note."
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None


class PayPalSettingsUpdate(BaseModel):
    """Request model for updating PayPal settings"""
    paypal_email: Optional[str] = None
    setup_mode: Optional[str] = None
    sandbox_client_id: Optional[str] = None
    sandbox_client_secret: Optional[str] = None
    live_client_id: Optional[str] = None
    live_client_secret: Optional[str] = None
    is_test_mode: Optional[bool] = None
    is_enabled: Optional[bool] = None
    instructions: Optional[str] = None


class PaymentRequest(BaseModel):
    """Request model for processing a payment"""
    payment_token: str  # Token from Collect.js
    amount: float
    order_id: str
    customer_email: str
    customer_name: str
    billing_address: Optional[dict] = None
    shipping_address: Optional[dict] = None
    items: Optional[List[dict]] = None
    metadata: Optional[dict] = None


class PaymentResponse(BaseModel):
    """Response model for payment processing"""
    success: bool
    transaction_id: Optional[str] = None
    authorization_code: Optional[str] = None
    response_code: str
    response_message: str
    amount: float
    order_id: str


class OrderCreate(BaseModel):
    """Request model for creating an order"""
    items: List[dict]
    shipping: dict
    billing: Optional[dict] = None
    subtotal: float
    shipping_cost: float
    tax: float
    total: float
    payment_token: Optional[str] = None  # Optional for non-card methods
    payment_method: str = "card"  # card, stripe, cashapp, venmo, paypal
    customer_email: str
    customer_name: str
    source: Optional[str] = "web"  # web, pos
    selected_shipping: Optional[dict] = None  # Selected shipping rate details
    origin_url: Optional[str] = None  # Frontend origin for building Stripe redirect URLs


class Order(BaseModel):
    """Order model stored in DB"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    items: List[dict]
    shipping: dict
    billing: dict
    subtotal: float
    shipping_cost: float
    tax: float
    total: float
    status: str = "pending"  # pending, paid, shipped, delivered, cancelled, refunded
    payment_status: str = "pending"  # pending, authorized, captured, failed, refunded
    payment_transaction_id: Optional[str] = None
    payment_authorization_code: Optional[str] = None
    payment_method: str = "card"
    payment_last_four: Optional[str] = None
    customer_email: str
    customer_name: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None


# ============ SETTINGS ENDPOINTS ============

@router.get("/settings/durango")
async def get_durango_settings():
    """Get Durango payment gateway settings (admin only)"""
    settings = await db.payment_settings.find_one(
        {"type": "durango"},
        {"_id": 0}
    )
    
    if not settings:
        # Return default settings
        return DurangoSettings().model_dump()
    
    # Mask sensitive data for response
    if settings.get("api_password"):
        settings["api_password"] = "••••••••" if settings["api_password"] else None
    
    return settings


@router.put("/settings/durango")
async def update_durango_settings(settings: DurangoSettingsUpdate, user_id: str = "system"):
    """Update Durango payment gateway settings (super admin only)"""
    # Get existing settings (not used but kept for potential future validation)
    _ = await db.payment_settings.find_one({"type": "durango"})
    
    update_data = {
        "type": "durango",
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user_id
    }
    
    # Only update fields that are provided
    if settings.tokenization_key is not None:
        update_data["tokenization_key"] = settings.tokenization_key
    if settings.api_username is not None:
        update_data["api_username"] = settings.api_username
    if settings.api_password is not None and settings.api_password != "••••••••":
        update_data["api_password"] = settings.api_password
    if settings.gateway_url is not None:
        update_data["gateway_url"] = settings.gateway_url
    if settings.is_test_mode is not None:
        update_data["is_test_mode"] = settings.is_test_mode
    if settings.is_enabled is not None:
        update_data["is_enabled"] = settings.is_enabled
    
    await db.payment_settings.update_one(
        {"type": "durango"},
        {"$set": update_data},
        upsert=True
    )
    
    # Return updated settings (masked)
    updated = await db.payment_settings.find_one({"type": "durango"}, {"_id": 0})
    if updated.get("api_password"):
        updated["api_password"] = "••••••••"
    
    return {"message": "Settings updated successfully", "settings": updated}


@router.get("/settings/durango/public")
async def get_durango_public_settings():
    """Get public Durango settings for frontend (tokenization key only)"""
    settings = await db.payment_settings.find_one(
        {"type": "durango"},
        {"_id": 0, "tokenization_key": 1, "is_enabled": 1, "is_test_mode": 1, "gateway_url": 1}
    )
    
    if not settings or not settings.get("is_enabled"):
        return {
            "is_enabled": False,
            "tokenization_key": None,
            "is_test_mode": True
        }
    
    # Extract just the domain for Collect.js script src
    gateway_url = settings.get("gateway_url", "https://secure.durango-direct.com/api/transact.php")
    # Get base domain from gateway URL
    from urllib.parse import urlparse
    parsed = urlparse(gateway_url)
    collect_js_base = f"{parsed.scheme}://{parsed.netloc}"
    
    return {
        "is_enabled": settings.get("is_enabled", False),
        "tokenization_key": settings.get("tokenization_key"),
        "is_test_mode": settings.get("is_test_mode", True),
        "collect_js_url": f"{collect_js_base}/token/Collect.js"
    }


# ============ CASHAPP & VENMO SETTINGS ============

@router.get("/settings/cashapp-venmo")
async def get_cashapp_venmo_settings():
    """Get CashApp & Venmo settings (admin only)"""
    settings = await db.payment_settings.find_one(
        {"type": "cashapp_venmo"},
        {"_id": 0}
    )
    
    if not settings:
        return CashAppVenmoSettings().model_dump()
    
    return settings


@router.put("/settings/cashapp-venmo")
async def update_cashapp_venmo_settings(settings: CashAppVenmoSettingsUpdate, user_id: str = "system"):
    """Update CashApp & Venmo settings (super admin only)"""
    update_data = {
        "type": "cashapp_venmo",
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user_id
    }
    
    if settings.cashapp_id is not None:
        update_data["cashapp_id"] = settings.cashapp_id
    if settings.venmo_id is not None:
        update_data["venmo_id"] = settings.venmo_id
    if settings.is_enabled is not None:
        update_data["is_enabled"] = settings.is_enabled
    if settings.instructions is not None:
        update_data["instructions"] = settings.instructions
    
    await db.payment_settings.update_one(
        {"type": "cashapp_venmo"},
        {"$set": update_data},
        upsert=True
    )
    
    updated = await db.payment_settings.find_one({"type": "cashapp_venmo"}, {"_id": 0})
    return {"message": "Settings updated successfully", "settings": updated}


@router.get("/settings/cashapp-venmo/public")
async def get_cashapp_venmo_public_settings():
    """Get public CashApp & Venmo settings for checkout"""
    settings = await db.payment_settings.find_one(
        {"type": "cashapp_venmo"},
        {"_id": 0}
    )
    
    if not settings or not settings.get("is_enabled"):
        return {
            "is_enabled": False,
            "cashapp_available": False,
            "venmo_available": False
        }
    
    return {
        "is_enabled": settings.get("is_enabled", False),
        "cashapp_available": bool(settings.get("cashapp_id")),
        "venmo_available": bool(settings.get("venmo_id")),
        "instructions": settings.get("instructions", "")
    }


# ============ STRIPE SETTINGS ============

@router.get("/settings/stripe")
async def get_stripe_settings():
    """Get Stripe gateway settings (admin only)"""
    settings = await db.payment_settings.find_one(
        {"type": "stripe"},
        {"_id": 0}
    )

    if not settings:
        return StripeGatewaySettings().model_dump()

    if settings.get("secret_key"):
        settings["secret_key"] = "••••••••"
    if settings.get("webhook_secret"):
        settings["webhook_secret"] = "••••••••"

    return settings


@router.put("/settings/stripe")
async def update_stripe_settings(settings: StripeGatewaySettingsUpdate, user_id: str = "system"):
    """Update Stripe gateway settings (super admin/admin)"""
    update_data = {
        "type": "stripe",
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user_id
    }

    if settings.publishable_key is not None:
        update_data["publishable_key"] = settings.publishable_key
    if settings.secret_key is not None and settings.secret_key != "••••••••":
        update_data["secret_key"] = settings.secret_key
    if settings.webhook_secret is not None and settings.webhook_secret != "••••••••":
        update_data["webhook_secret"] = settings.webhook_secret
    if settings.is_test_mode is not None:
        update_data["is_test_mode"] = settings.is_test_mode
    if settings.is_enabled is not None:
        update_data["is_enabled"] = settings.is_enabled

    await db.payment_settings.update_one(
        {"type": "stripe"},
        {"$set": update_data},
        upsert=True
    )

    updated = await db.payment_settings.find_one({"type": "stripe"}, {"_id": 0})
    if updated and updated.get("secret_key"):
        updated["secret_key"] = "••••••••"
    if updated and updated.get("webhook_secret"):
        updated["webhook_secret"] = "••••••••"

    return {"message": "Settings updated successfully", "settings": updated}


@router.get("/settings/stripe/public")
async def get_stripe_public_settings():
    """Public Stripe settings for the checkout (publishable key + enabled flag)."""
    settings = await db.payment_settings.find_one({"type": "stripe"}, {"_id": 0})
    if not settings or not settings.get("is_enabled"):
        return {"is_enabled": False, "publishable_key": None, "is_test_mode": True}
    return {
        "is_enabled": True,
        "publishable_key": settings.get("publishable_key"),
        "is_test_mode": settings.get("is_test_mode", True),
    }


async def get_stripe_secret_key() -> str:
    """Resolve the Stripe secret key for the active tenant.

    Prefers the key stored in DB (multi-tenant); falls back to the platform env key.
    """
    settings = await db.payment_settings.find_one({"type": "stripe"}, {"_id": 0}) or {}
    if not settings.get("is_enabled"):
        raise HTTPException(status_code=503, detail="Stripe gateway is not enabled")
    secret = settings.get("secret_key") or os.environ.get("STRIPE_API_KEY")
    if not secret:
        raise HTTPException(status_code=503, detail="Stripe secret key not configured")
    return secret


# ============ PAYPAL SETTINGS ============

@router.get("/settings/paypal")
async def get_paypal_settings():
    """Get PayPal gateway settings (admin only)"""
    settings = await db.payment_settings.find_one(
        {"type": "paypal"},
        {"_id": 0}
    )

    if not settings:
        return PayPalSettings().model_dump()

    for field in ["sandbox_client_secret", "live_client_secret"]:
        if settings.get(field):
            settings[field] = "••••••••"

    return settings


@router.put("/settings/paypal")
async def update_paypal_settings(settings: PayPalSettingsUpdate, user_id: str = "system"):
    """Update PayPal gateway settings"""
    update_data = {
        "type": "paypal",
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user_id
    }

    if settings.paypal_email is not None:
        update_data["paypal_email"] = settings.paypal_email.strip()
    if settings.setup_mode is not None:
        setup_mode = settings.setup_mode.strip().lower()
        if setup_mode not in ["email", "api_keys"]:
            raise HTTPException(status_code=400, detail="setup_mode must be 'email' or 'api_keys'")
        update_data["setup_mode"] = setup_mode
    if settings.sandbox_client_id is not None:
        update_data["sandbox_client_id"] = settings.sandbox_client_id.strip()
    if settings.sandbox_client_secret is not None and settings.sandbox_client_secret != "••••••••":
        update_data["sandbox_client_secret"] = settings.sandbox_client_secret.strip()
    if settings.live_client_id is not None:
        update_data["live_client_id"] = settings.live_client_id.strip()
    if settings.live_client_secret is not None and settings.live_client_secret != "••••••••":
        update_data["live_client_secret"] = settings.live_client_secret.strip()
    if settings.is_test_mode is not None:
        update_data["is_test_mode"] = settings.is_test_mode
    if settings.is_enabled is not None:
        update_data["is_enabled"] = settings.is_enabled
    if settings.instructions is not None:
        update_data["instructions"] = settings.instructions.strip()

    await db.payment_settings.update_one(
        {"type": "paypal"},
        {"$set": update_data},
        upsert=True
    )

    updated = await db.payment_settings.find_one({"type": "paypal"}, {"_id": 0})
    if updated:
        for field in ["sandbox_client_secret", "live_client_secret"]:
            if updated.get(field):
                updated[field] = "••••••••"

    return {"message": "Settings updated successfully", "settings": updated}


@router.get("/settings/paypal/public")
async def get_paypal_public_settings():
    """Get public PayPal settings for checkout"""
    settings = await db.payment_settings.find_one(
        {"type": "paypal"},
        {
            "_id": 0,
            "is_enabled": 1,
            "setup_mode": 1,
            "is_test_mode": 1,
            "paypal_email": 1,
            "sandbox_client_id": 1,
            "sandbox_client_secret": 1,
            "live_client_id": 1,
            "live_client_secret": 1,
            "instructions": 1,
        }
    )

    if not settings or not settings.get("is_enabled"):
        return {
            "is_enabled": False,
            "is_available": False,
            "setup_mode": "email",
            "is_test_mode": True,
            "instructions": "",
        }

    setup_mode = settings.get("setup_mode", "email")
    is_test_mode = settings.get("is_test_mode", True)
    has_api_keys = bool(
        settings.get("sandbox_client_id") and settings.get("sandbox_client_secret")
    ) if is_test_mode else bool(
        settings.get("live_client_id") and settings.get("live_client_secret")
    )
    email_available = bool(settings.get("paypal_email"))
    is_available = email_available if setup_mode == "email" else has_api_keys

    return {
        "is_enabled": settings.get("is_enabled", False),
        "is_available": is_available,
        "setup_mode": setup_mode,
        "is_test_mode": is_test_mode,
        "paypal_email": settings.get("paypal_email") if setup_mode == "email" else None,
        "instructions": settings.get("instructions", ""),
    }


def _get_paypal_base_url(is_test_mode: bool) -> str:
    return "https://api-m.sandbox.paypal.com" if is_test_mode else "https://api-m.paypal.com"


async def _get_paypal_access_token(paypal_settings: dict) -> tuple[str, str]:
    is_test_mode = paypal_settings.get("is_test_mode", True)
    client_id = paypal_settings.get("sandbox_client_id") if is_test_mode else paypal_settings.get("live_client_id")
    client_secret = paypal_settings.get("sandbox_client_secret") if is_test_mode else paypal_settings.get("live_client_secret")

    if not client_id or not client_secret:
        mode_name = "sandbox" if is_test_mode else "live"
        raise HTTPException(status_code=503, detail=f"PayPal {mode_name} API keys are not configured")

    base_url = _get_paypal_base_url(is_test_mode)

    async with httpx.AsyncClient(timeout=30.0) as client:
        token_response = await client.post(
            f"{base_url}/v1/oauth2/token",
            data={"grant_type": "client_credentials"},
            auth=(client_id, client_secret),
            headers={"Accept": "application/json", "Accept-Language": "en_US"},
        )

    if token_response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Unable to authenticate with PayPal API")

    token_payload = token_response.json()
    access_token = token_payload.get("access_token")
    if not access_token:
        raise HTTPException(status_code=502, detail="PayPal API token missing from response")

    return access_token, base_url


async def _create_paypal_order(order: dict, paypal_settings: dict, request: Request) -> dict:
    access_token, base_url = await _get_paypal_access_token(paypal_settings)
    origin = str(request.base_url).rstrip("/")
    order_number = order.get("order_number")

    body = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": order_number,
                "description": f"123Bots order {order_number}",
                "amount": {
                    "currency_code": "USD",
                    "value": f"{order.get('total', 0):.2f}",
                },
            }
        ],
        "application_context": {
            "brand_name": "123Bots",
            "shipping_preference": "NO_SHIPPING",
            "user_action": "PAY_NOW",
            "return_url": f"{origin}/order-confirmation?paypal=success&order={order_number}",
            "cancel_url": f"{origin}/order-confirmation?paypal=cancelled&order={order_number}",
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        paypal_response = await client.post(
            f"{base_url}/v2/checkout/orders",
            json=body,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
        )

    if paypal_response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Failed to create PayPal checkout order")

    payload = paypal_response.json()
    approval_url = None
    for link in payload.get("links", []):
        if link.get("rel") == "approve":
            approval_url = link.get("href")
            break

    if not approval_url:
        raise HTTPException(status_code=502, detail="PayPal approval URL missing from response")

    return {
        "paypal_order_id": payload.get("id"),
        "approval_url": approval_url,
    }


def _build_paypal_email_payment_link(order: dict, paypal_settings: dict) -> str:
    paypal_email = paypal_settings.get("paypal_email")
    if not paypal_email:
        raise HTTPException(status_code=503, detail="PayPal email is not configured")

    web_base = "https://www.sandbox.paypal.com/cgi-bin/webscr" if paypal_settings.get("is_test_mode", True) else "https://www.paypal.com/cgi-bin/webscr"
    params = {
        "cmd": "_xclick",
        "business": paypal_email,
        "item_name": f"123Bots Order {order.get('order_number')}",
        "amount": f"{order.get('total', 0):.2f}",
        "currency_code": "USD",
        "custom": order.get("order_number"),
    }
    return f"{web_base}?{urlencode(params)}"


# ============ PAYMENT PROCESSING ============

async def get_durango_credentials():
    """Get Durango API credentials from database"""
    settings = await db.payment_settings.find_one({"type": "durango"})
    
    if not settings:
        raise HTTPException(
            status_code=503,
            detail="Payment gateway not configured. Please configure Durango settings in admin panel."
        )
    
    if not settings.get("is_enabled"):
        raise HTTPException(
            status_code=503,
            detail="Payment gateway is currently disabled."
        )
    
    if not settings.get("api_username") or not settings.get("api_password"):
        raise HTTPException(
            status_code=503,
            detail="Payment gateway credentials not configured."
        )
    
    return {
        "username": settings["api_username"],
        "password": settings["api_password"],
        "gateway_url": settings.get("gateway_url", "https://secure.durango-direct.com/api/transact.php"),
        "is_test_mode": settings.get("is_test_mode", True)
    }


@router.post("/process", response_model=PaymentResponse)
async def process_payment(payment: PaymentRequest):
    """Process a payment using Durango Gateway"""
    
    try:
        credentials = await get_durango_credentials()
    except HTTPException as e:
        return PaymentResponse(
            success=False,
            response_code="CONFIG_ERROR",
            response_message=str(e.detail),
            amount=payment.amount,
            order_id=payment.order_id
        )
    
    # Build the payment request for Durango Direct Post API
    post_data = {
        "username": credentials["username"],
        "password": credentials["password"],
        "type": "sale",
        "payment_token": payment.payment_token,
        "amount": f"{payment.amount:.2f}",
        "orderid": payment.order_id,
        "email": payment.customer_email,
    }
    
    # Add billing address if provided
    if payment.billing_address:
        post_data.update({
            "first_name": payment.billing_address.get("firstName", ""),
            "last_name": payment.billing_address.get("lastName", ""),
            "address1": payment.billing_address.get("address1", ""),
            "address2": payment.billing_address.get("address2", ""),
            "city": payment.billing_address.get("city", ""),
            "state": payment.billing_address.get("state", ""),
            "zip": payment.billing_address.get("zipCode", ""),
            "country": payment.billing_address.get("country", "US"),
            "phone": payment.billing_address.get("phone", ""),
        })
    
    # Add shipping address if provided
    if payment.shipping_address:
        post_data.update({
            "shipping_firstname": payment.shipping_address.get("firstName", ""),
            "shipping_lastname": payment.shipping_address.get("lastName", ""),
            "shipping_address1": payment.shipping_address.get("address1", ""),
            "shipping_address2": payment.shipping_address.get("address2", ""),
            "shipping_city": payment.shipping_address.get("city", ""),
            "shipping_state": payment.shipping_address.get("state", ""),
            "shipping_zip": payment.shipping_address.get("zipCode", ""),
            "shipping_country": payment.shipping_address.get("country", "US"),
        })
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                credentials["gateway_url"],
                data=post_data
            )
            
            # Parse response (Durango returns URL-encoded response)
            response_text = response.text
            response_data = dict(pair.split("=") for pair in response_text.split("&") if "=" in pair)
            
            logger.info(f"Durango response for order {payment.order_id}: {response_data}")
            
            # Check response
            response_code = response_data.get("response", "")
            response_text = response_data.get("responsetext", "Unknown error")
            transaction_id = response_data.get("transactionid", "")
            auth_code = response_data.get("authcode", "")
            
            success = response_code == "1"
            
            # Store transaction record
            transaction_record = {
                "id": str(uuid.uuid4()),
                "order_id": payment.order_id,
                "transaction_id": transaction_id,
                "authorization_code": auth_code,
                "amount": payment.amount,
                "response_code": response_code,
                "response_message": response_text,
                "success": success,
                "customer_email": payment.customer_email,
                "raw_response": response_data,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.payment_transactions.insert_one(transaction_record)
            
            return PaymentResponse(
                success=success,
                transaction_id=transaction_id if success else None,
                authorization_code=auth_code if success else None,
                response_code=response_code,
                response_message=response_text,
                amount=payment.amount,
                order_id=payment.order_id
            )
            
    except httpx.TimeoutException:
        logger.error(f"Timeout processing payment for order {payment.order_id}")
        return PaymentResponse(
            success=False,
            response_code="TIMEOUT",
            response_message="Payment gateway timeout. Please try again.",
            amount=payment.amount,
            order_id=payment.order_id
        )
    except Exception as e:
        logger.error(f"Error processing payment for order {payment.order_id}: {str(e)}")
        return PaymentResponse(
            success=False,
            response_code="ERROR",
            response_message=f"Payment processing error: {str(e)}",
            amount=payment.amount,
            order_id=payment.order_id
        )


async def _fetch_stripe_payment_intent_id(session_id: str) -> Optional[str]:
    """Read-only lookup of the PaymentIntent id (pi_...) for a Checkout Session.

    emergentintegrations' CheckoutStatusResponse does not expose payment_intent,
    so we retrieve the session directly (read-only) to capture it for admin
    cross-reference in the Stripe Dashboard.
    """
    try:
        stripe_secret = await get_stripe_secret_key()
        if not stripe_secret:
            return None
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"https://api.stripe.com/v1/checkout/sessions/{session_id}",
                headers={"Authorization": f"Bearer {stripe_secret}"},
            )
        if resp.status_code != 200:
            return None
        data = resp.json()
        pi = data.get("payment_intent")
        # payment_intent may be an object when expanded; normally it's a string id
        if isinstance(pi, dict):
            return pi.get("id")
        return pi
    except Exception:
        return None


async def _finalize_stripe_order(session_id: str, checkout_status) -> dict:
    """Idempotently update the transaction + order based on Stripe checkout status."""
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    already_paid = txn and txn.get("payment_status") == "paid"

    new_status = checkout_status.payment_status  # 'paid', 'unpaid', 'no_payment_required'
    session_status = checkout_status.status      # 'open', 'complete', 'expired'

    # Capture the Stripe PaymentIntent id once the payment is confirmed
    payment_intent_id = (txn or {}).get("stripe_payment_intent_id")
    if new_status == "paid" and not payment_intent_id:
        payment_intent_id = await _fetch_stripe_payment_intent_id(session_id)

    txn_update = {
        "payment_status": new_status,
        "session_status": session_status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if payment_intent_id:
        txn_update["stripe_payment_intent_id"] = payment_intent_id

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": txn_update}
    )

    order_id = (txn or {}).get("order_id")
    if order_id and new_status == "paid" and not already_paid:
        order_update = {
            "status": "paid",
            "payment_status": "captured",
            "payment_transaction_id": session_id,
            "stripe_session_id": session_id,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if payment_intent_id:
            order_update["stripe_payment_intent_id"] = payment_intent_id
        await db.orders.update_one(
            {"id": order_id},
            {"$set": order_update}
        )
    elif order_id and payment_intent_id:
        # Backfill ids on an already-paid order that was missing them
        await db.orders.update_one(
            {"id": order_id, "stripe_payment_intent_id": {"$in": [None, ""]}},
            {"$set": {
                "stripe_payment_intent_id": payment_intent_id,
                "stripe_session_id": session_id,
            }}
        )

    order = await db.orders.find_one({"id": order_id}, {"_id": 0}) if order_id else None
    return {
        "session_id": session_id,
        "status": session_status,
        "payment_status": new_status,
        "order": order,
    }


@router.get("/stripe/status/{session_id}")
async def get_stripe_status(session_id: str):
    """Poll Stripe checkout session status and finalize the order (idempotent)."""
    stripe_secret = await get_stripe_secret_key()
    stripe_checkout = StripeCheckout(api_key=stripe_secret, webhook_url="")
    checkout_status = await stripe_checkout.get_checkout_status(session_id)
    return await _finalize_stripe_order(session_id, checkout_status)


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events (secondary to polling)."""
    try:
        stripe_secret = await get_stripe_secret_key()
    except HTTPException:
        return {"received": True}
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    stripe_checkout = StripeCheckout(api_key=stripe_secret, webhook_url="")
    try:
        event = await stripe_checkout.handle_webhook(body, signature)
    except Exception as e:
        logger.error(f"Stripe webhook error: {e}")
        return {"received": True}
    if getattr(event, "session_id", None):
        try:
            status = await stripe_checkout.get_checkout_status(event.session_id)
            await _finalize_stripe_order(event.session_id, status)
        except Exception as e:
            logger.error(f"Stripe webhook finalize error: {e}")
    return {"received": True}


# ============ ORDER MANAGEMENT ============

def generate_order_number():
    """Generate a unique order number"""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    random_suffix = uuid.uuid4().hex[:6].upper()
    return f"ORD-{timestamp}-{random_suffix}"


async def enforce_checkout_feature_flags(request: Request):
    """Enforce checkout access rules from dev feature flags."""
    site_settings = await db.admin_settings.find_one({"type": "site"}, {"_id": 0}) or {}

    require_account_for_checkout = site_settings.get("require_account_for_checkout", False)
    require_email_verification = site_settings.get("require_email_verification_for_registration", True)

    token_data = None
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        token_data = decode_token(auth_header.split(" ", 1)[1].strip())

    if require_account_for_checkout and not token_data:
        raise HTTPException(status_code=401, detail="Account required for checkout")

    if token_data and require_email_verification:
        user = await db.users.find_one({"id": token_data.user_id}, {"_id": 0, "email_verified": 1})
        if user and not user.get("email_verified", False):
            raise HTTPException(status_code=403, detail="Email verification required before checkout")

    return token_data


@router.post("/orders")
async def create_order(order_data: OrderCreate, request: Request):
    """Create a new order and process payment"""
    token_data = await enforce_checkout_feature_flags(request)
    
    # Generate order number
    order_number = generate_order_number()
    order_id = str(uuid.uuid4())
    
    # Create order record
    order = {
        "id": order_id,
        "order_number": order_number,
        "items": order_data.items,
        "shipping": order_data.shipping,
        "billing": order_data.billing or order_data.shipping,
        "subtotal": order_data.subtotal,
        "shipping_cost": order_data.shipping_cost,
        "tax": order_data.tax,
        "total": order_data.total,
        "status": "pending",
        "payment_status": "pending",
        "payment_method": order_data.payment_method,
        "customer_email": order_data.customer_email,
        "customer_name": order_data.customer_name,
        "source": order_data.source or "web",  # Track if from POS or web checkout
        "selected_shipping": order_data.selected_shipping,  # Store shipping rate details
        "created_at": datetime.now(timezone.utc).isoformat(),
        "user_id": token_data.user_id if token_data else None,
    }
    
    # Handle different payment methods
    if order_data.payment_method in ["cashapp", "venmo"]:
        # CashApp/Venmo - order created, awaiting manual payment
        order["status"] = "awaiting_payment"
        order["payment_status"] = "pending"
        
        # Get CashApp/Venmo settings for email
        cashapp_venmo_settings = await db.payment_settings.find_one({"type": "cashapp_venmo"})
        
        # Save order to database
        await db.orders.insert_one(order)
        order.pop("_id", None)
        
        # Send payment instruction email
        payment_id = None
        if order_data.payment_method == "cashapp":
            payment_id = cashapp_venmo_settings.get("cashapp_id") if cashapp_venmo_settings else None
        else:
            payment_id = cashapp_venmo_settings.get("venmo_id") if cashapp_venmo_settings else None
        
        await send_cashapp_venmo_payment_email(
            order=order,
            payment_method=order_data.payment_method,
            payment_id=payment_id,
            instructions=cashapp_venmo_settings.get("instructions", "") if cashapp_venmo_settings else ""
        )
        
        return {
            "success": True,
            "order": order,
            "payment": {
                "method": order_data.payment_method,
                "status": "awaiting_payment",
                "payment_id": payment_id,
                "message": f"Payment instructions sent to {order_data.customer_email}"
            }
        }

    elif order_data.payment_method == "paypal":
        paypal_settings = await db.payment_settings.find_one({"type": "paypal"}, {"_id": 0})
        if not paypal_settings or not paypal_settings.get("is_enabled"):
            raise HTTPException(status_code=503, detail="PayPal gateway is not enabled")

        setup_mode = paypal_settings.get("setup_mode", "email")
        order["status"] = "awaiting_payment"
        order["payment_status"] = "pending"

        payment_payload = {
            "method": "paypal",
            "status": "awaiting_payment",
            "setup_mode": setup_mode,
        }

        if setup_mode == "api_keys":
            paypal_checkout = await _create_paypal_order(order, paypal_settings, request)
            order["payment_transaction_id"] = paypal_checkout.get("paypal_order_id")
            order["payment_status"] = "awaiting_approval"
            payment_payload["status"] = "awaiting_approval"
            payment_payload["approval_url"] = paypal_checkout.get("approval_url")
            payment_payload["paypal_order_id"] = paypal_checkout.get("paypal_order_id")
            payment_payload["message"] = "Redirect customer to PayPal to approve payment"
        else:
            payment_link = _build_paypal_email_payment_link(order, paypal_settings)
            payment_payload["payment_link"] = payment_link
            payment_payload["paypal_email"] = paypal_settings.get("paypal_email")
            payment_payload["message"] = f"PayPal payment link sent to {order_data.customer_email}"

        await db.orders.insert_one(order)
        order.pop("_id", None)

        if setup_mode == "email":
            await send_paypal_payment_email(
                order=order,
                paypal_email=paypal_settings.get("paypal_email", ""),
                payment_link=payment_payload.get("payment_link", ""),
                instructions=paypal_settings.get("instructions", ""),
            )

        return {
            "success": True,
            "order": order,
            "payment": payment_payload,
        }
    
    elif order_data.payment_method == "stripe":
        # Card payment via Stripe hosted checkout (redirect flow)
        stripe_secret = await get_stripe_secret_key()

        origin = (order_data.origin_url or str(request.base_url)).rstrip("/")
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/payments/stripe/webhook"

        order["status"] = "awaiting_payment"
        order["payment_status"] = "pending"
        await db.orders.insert_one(order)
        order.pop("_id", None)

        # Amount is taken from the server-persisted order, never trusted from a separate field
        amount = float(f"{float(order['total']):.2f}")
        success_url = f"{origin}/checkout?stripe_session={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin}/checkout?stripe_cancelled=1"
        metadata = {
            "order_id": order_id,
            "order_number": order_number,
            "customer_email": order_data.customer_email,
            "source": "web_checkout",
        }

        stripe_checkout = StripeCheckout(api_key=stripe_secret, webhook_url=webhook_url)
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata,
        )
        session = await stripe_checkout.create_checkout_session(checkout_request)

        # Record the transaction BEFORE redirect
        await db.payment_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "gateway": "stripe",
            "session_id": session.session_id,
            "order_id": order_id,
            "order_number": order_number,
            "amount": amount,
            "currency": "usd",
            "metadata": metadata,
            "payment_status": "initiated",
            "customer_email": order_data.customer_email,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"payment_session_id": session.session_id}}
        )

        return {
            "success": True,
            "order": order,
            "payment": {
                "method": "stripe",
                "status": "awaiting_payment",
                "redirect_url": session.url,
                "session_id": session.session_id,
                "message": "Redirect customer to Stripe to complete payment",
            }
        }

    elif order_data.payment_token:
        # Card payment via Durango
        payment_request = PaymentRequest(
            payment_token=order_data.payment_token,
            amount=order_data.total,
            order_id=order_number,
            customer_email=order_data.customer_email,
            customer_name=order_data.customer_name,
            billing_address=order_data.billing or order_data.shipping,
            shipping_address=order_data.shipping,
            items=order_data.items
        )
        
        payment_result = await process_payment(payment_request)
        
        # Update order with payment result
        if payment_result.success:
            order["status"] = "paid"
            order["payment_status"] = "captured"
            order["payment_transaction_id"] = payment_result.transaction_id
            order["payment_authorization_code"] = payment_result.authorization_code
        else:
            order["status"] = "payment_failed"
            order["payment_status"] = "failed"
        
        # Save order to database
        await db.orders.insert_one(order)
        order.pop("_id", None)
        
        return {
            "success": payment_result.success,
            "order": order,
            "payment": payment_result.model_dump()
        }
    
    else:
        # No payment method - demo/fallback mode
        order["status"] = "pending"
        order["payment_status"] = "pending"
        order["payment_method"] = "demo"
        
        await db.orders.insert_one(order)
        order.pop("_id", None)
        
        return {
            "success": True,
            "order": order,
            "payment": {
                "method": "demo",
                "status": "pending",
                "message": "Order created in demo mode"
            }
        }


async def send_cashapp_venmo_payment_email(order: dict, payment_method: str, payment_id: str, instructions: str):
    """Send payment instructions email for CashApp/Venmo orders"""
    from email_utils import send_email
    
    method_name = "CashApp" if payment_method == "cashapp" else "Venmo"
    method_prefix = "$" if payment_method == "cashapp" else "@"
    
    subject = f"Payment Instructions for Order {order['order_number']}"
    
    # Create HTML email
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #f59e0b 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">123Bots</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Payment Instructions</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 20px;">Hi {order['customer_name']},</p>
            
            <p style="margin: 0 0 20px;">Thank you for your order! Please complete your payment using {method_name}.</p>
            
            <div style="background: white; border: 2px solid #7c3aed; border-radius: 12px; padding: 25px; text-align: center; margin: 20px 0;">
                <p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">Send payment to:</p>
                <p style="margin: 0; font-size: 28px; font-weight: bold; color: #7c3aed;">{method_prefix}{payment_id}</p>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-weight: bold;">⚠️ IMPORTANT: Include this in your payment note:</p>
                <p style="margin: 10px 0 0; font-size: 20px; font-weight: bold; color: #7c3aed; text-align: center;">{order['order_number']}</p>
            </div>
            
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px; color: #1e293b;">Order Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Order Number:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold;">{order['order_number']}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Subtotal:</td>
                        <td style="padding: 8px 0; text-align: right;">${order['subtotal']:.2f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Shipping:</td>
                        <td style="padding: 8px 0; text-align: right;">{'FREE' if order['shipping_cost'] == 0 else f"${order['shipping_cost']:.2f}"}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Tax:</td>
                        <td style="padding: 8px 0; text-align: right;">${order['tax']:.2f}</td>
                    </tr>
                    <tr style="border-top: 2px solid #e2e8f0;">
                        <td style="padding: 12px 0; font-weight: bold; font-size: 18px;">Total Due:</td>
                        <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 18px; color: #7c3aed;">${order['total']:.2f}</td>
                    </tr>
                </table>
            </div>
            
            {f'<p style="color: #64748b; font-size: 14px; margin: 20px 0;">{instructions}</p>' if instructions else ''}
            
            <p style="color: #64748b; font-size: 14px; margin: 20px 0 0;">Once we confirm your payment, your order will be processed and shipped.</p>
        </div>
        
        <div style="background: #1e1b4b; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
            <p style="color: #a5b4fc; margin: 0; font-size: 12px;">FOR RESEARCH USE ONLY • NOT FOR HUMAN CONSUMPTION</p>
            <p style="color: #64748b; margin: 10px 0 0; font-size: 11px;">© 2026 123Bots. All rights reserved.</p>
        </div>
    </div>
    """
    
    try:
        await send_email(
            to_email=order['customer_email'],
            subject=subject,
            html_content=html_content
        )
        logger.info(f"Sent {payment_method} payment email for order {order['order_number']}")
    except Exception as e:
        logger.error(f"Failed to send payment email for order {order['order_number']}: {str(e)}")


async def send_paypal_payment_email(order: dict, paypal_email: str, payment_link: str, instructions: str):
    """Send payment instruction email for PayPal email-link mode orders"""
    from email_utils import send_email

    subject = f"PayPal Payment Link for Order {order['order_number']}"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #1d4ed8 100%); padding: 28px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">123Bots</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Complete Your PayPal Payment</p>
        </div>

        <div style="background: #f8fafc; padding: 28px; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 16px;">Hi {order['customer_name']},</p>
            <p style="margin: 0 0 16px;">Your order is reserved and awaiting PayPal payment.</p>

            <div style="background: white; border: 1px solid #bfdbfe; border-radius: 10px; padding: 18px; margin: 16px 0;">
                <p style="margin: 0 0 8px; color: #334155; font-size: 14px;">Send payment to PayPal account:</p>
                <p style="margin: 0; font-size: 18px; color: #1d4ed8; font-weight: bold;">{paypal_email}</p>
            </div>

            <p style="margin: 0 0 16px;">Order Number: <strong>{order['order_number']}</strong></p>
            <p style="margin: 0 0 18px;">Total Due: <strong>${order['total']:.2f}</strong></p>

            <a href="{payment_link}" style="display: inline-block; background: #1d4ed8; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">
                Pay with PayPal
            </a>

            <p style="margin: 18px 0 0; color: #64748b; font-size: 14px;">Please include your order number in the PayPal note.</p>
            {f'<p style="margin: 12px 0 0; color: #64748b; font-size: 14px;">{instructions}</p>' if instructions else ''}
        </div>
    </div>
    """

    try:
        await send_email(
            to_email=order['customer_email'],
            subject=subject,
            html_content=html_content
        )
        logger.info(f"Sent PayPal payment email for order {order['order_number']}")
    except Exception as e:
        logger.error(f"Failed to send PayPal payment email for order {order['order_number']}: {str(e)}")


@router.post("/paypal/capture/{paypal_order_id}")
async def capture_paypal_order(paypal_order_id: str):
    """Capture a PayPal order after buyer approval"""
    paypal_settings = await db.payment_settings.find_one({"type": "paypal"}, {"_id": 0})
    if not paypal_settings or not paypal_settings.get("is_enabled"):
        raise HTTPException(status_code=503, detail="PayPal gateway is not enabled")

    if paypal_settings.get("setup_mode", "email") != "api_keys":
        raise HTTPException(status_code=400, detail="PayPal API keys mode is not enabled")

    access_token, base_url = await _get_paypal_access_token(paypal_settings)

    async with httpx.AsyncClient(timeout=30.0) as client:
        capture_response = await client.post(
            f"{base_url}/v2/checkout/orders/{paypal_order_id}/capture",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
        )

    if capture_response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Failed to capture PayPal payment")

    payload = capture_response.json()
    status = payload.get("status")
    if status != "COMPLETED":
        raise HTTPException(status_code=400, detail=f"PayPal order status: {status}")

    await db.orders.update_one(
        {"payment_transaction_id": paypal_order_id},
        {
            "$set": {
                "status": "paid",
                "payment_status": "captured",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        }
    )

    return {
        "success": True,
        "paypal_order_id": paypal_order_id,
        "status": "captured",
    }


@router.get("/orders")
async def get_orders(limit: int = 50, skip: int = 0):
    """Get all orders (admin)"""
    orders = await db.orders.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.orders.count_documents({})
    
    return {
        "orders": orders,
        "total": total,
        "limit": limit,
        "skip": skip
    }


@router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get a specific order by ID or order number"""
    order = await db.orders.find_one(
        {"$or": [{"id": order_id}, {"order_number": order_id}]},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order


@router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    """Update order status (admin) - handles inventory and accounting when order is paid"""
    valid_statuses = ["pending", "awaiting_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]
    
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    # Get the order first
    order = await db.orders.find_one(
        {"$or": [{"id": order_id}, {"order_number": order_id}]}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    previous_status = order.get("status")
    
    # Update order status
    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # If marking as paid, also update payment_status
    if status == "paid":
        update_data["payment_status"] = "captured"
        update_data["paid_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.orders.update_one(
        {"$or": [{"id": order_id}, {"order_number": order_id}]},
        {"$set": update_data}
    )
    
    # If status changed to "paid" (from awaiting_payment or pending), process inventory and accounting
    if status == "paid" and previous_status in ["pending", "awaiting_payment"]:
        await process_paid_order(order)
    
    # If order was cancelled or refunded after being paid, reverse inventory
    if status in ["cancelled", "refunded"] and previous_status == "paid":
        await reverse_order_inventory(order)
    
    return {"message": "Order status updated", "status": status}


async def process_paid_order(order: dict):
    """Process accounting and inventory when order is marked as paid"""
    logger.info(f"Processing paid order: {order.get('order_number')}")
    
    # 1. Reduce inventory for each item
    for item in order.get("items", []):
        product_id = item.get("product_id")
        quantity = item.get("quantity", 1)
        
        if product_id:
            # Find product by ID or name
            product = await db.products.find_one(
                {"$or": [{"id": product_id}, {"name": item.get("name")}]}
            )
            
            if product:
                new_quantity = max(0, product.get("quantity", 0) - quantity)
                sold_count = product.get("sold_count", 0) + quantity
                
                await db.products.update_one(
                    {"$or": [{"id": product_id}, {"name": item.get("name")}]},
                    {
                        "$set": {
                            "quantity": new_quantity,
                            "in_stock": new_quantity > 0,
                            "sold_count": sold_count,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                logger.info(f"Updated product {product.get('name')}: quantity {product.get('quantity')} -> {new_quantity}, sold_count -> {sold_count}")
    
    # 2. Update or create customer record
    customer_email = order.get("customer_email")
    if customer_email:
        existing_customer = await db.customers.find_one({"email": customer_email})
        
        if existing_customer:
            await db.customers.update_one(
                {"email": customer_email},
                {
                    "$inc": {
                        "total_orders": 1,
                        "total_spent": order.get("total", 0)
                    },
                    "$set": {
                        "last_order_at": datetime.now(timezone.utc).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
        else:
            await db.customers.insert_one({
                "id": str(uuid.uuid4()),
                "email": customer_email,
                "name": order.get("customer_name", ""),
                "phone": order.get("shipping", {}).get("phone", ""),
                "total_orders": 1,
                "total_spent": order.get("total", 0),
                "first_order_at": datetime.now(timezone.utc).isoformat(),
                "last_order_at": datetime.now(timezone.utc).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    # 3. Log the transaction for accounting
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "type": "order_payment",
        "order_id": order.get("id"),
        "order_number": order.get("order_number"),
        "amount": order.get("total", 0),
        "subtotal": order.get("subtotal", 0),
        "tax": order.get("tax", 0),
        "shipping_cost": order.get("shipping_cost", 0),
        "payment_method": order.get("payment_method", "unknown"),
        "customer_email": customer_email,
        "customer_name": order.get("customer_name"),
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    logger.info(f"Order {order.get('order_number')} fully processed - inventory updated, customer tracked, transaction logged")


async def reverse_order_inventory(order: dict):
    """Reverse inventory changes when order is cancelled/refunded"""
    logger.info(f"Reversing inventory for cancelled/refunded order: {order.get('order_number')}")
    
    for item in order.get("items", []):
        product_id = item.get("product_id")
        quantity = item.get("quantity", 1)
        
        if product_id:
            product = await db.products.find_one(
                {"$or": [{"id": product_id}, {"name": item.get("name")}]}
            )
            
            if product:
                new_quantity = product.get("quantity", 0) + quantity
                sold_count = max(0, product.get("sold_count", 0) - quantity)
                
                await db.products.update_one(
                    {"$or": [{"id": product_id}, {"name": item.get("name")}]},
                    {
                        "$set": {
                            "quantity": new_quantity,
                            "in_stock": True,
                            "sold_count": sold_count,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
    
    # Update customer stats
    customer_email = order.get("customer_email")
    if customer_email:
        await db.customers.update_one(
            {"email": customer_email},
            {
                "$inc": {
                    "total_orders": -1,
                    "total_spent": -order.get("total", 0)
                }
            }
        )
    
    # Log the reversal
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "type": "order_refund" if order.get("status") == "refunded" else "order_cancelled",
        "order_id": order.get("id"),
        "order_number": order.get("order_number"),
        "amount": -order.get("total", 0),
        "payment_method": order.get("payment_method"),
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
