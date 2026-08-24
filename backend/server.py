from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from auth import (
    UserCreate, UserInDB, UserResponse, Token, LoginRequest, LoginResponse, TokenData,
    UserRole, get_password_hash, verify_password, create_access_token,
    decode_token, has_permission, is_super_admin, is_admin_or_above
)
from two_factor_auth import (
    create_two_factor_challenge,
    is_trusted_device,
    issue_trusted_device_token,
    normalize_trusted_devices,
    resend_two_factor_challenge,
    touch_trusted_device,
    verify_two_factor_challenge,
)
from peptide_catalog import sync_pdf_catalog
from booking_provisioning import ensure_user_booking_calendar_setup

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Fail loud and specific at boot if required config is missing, instead of a
# bare KeyError traceback that's hard to diagnose from a deploy log viewer.
_REQUIRED_ENV_VARS = ["MONGO_URL", "DB_NAME"]
_missing_env_vars = [key for key in _REQUIRED_ENV_VARS if not os.environ.get(key)]
if _missing_env_vars:
    print(f"[BOOT] FATAL: missing required environment variables: {', '.join(_missing_env_vars)}", file=sys.stderr)
    sys.exit(1)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

NON_PAWN_COLLECTIONS = [
    "storage_units",
    "storage_sizes",
    "storage_rentals",
    "storage_customers",
    "payment_transactions",
    "email_logs",
    "rv_services",
    "rv_calendar",
    "rv_estimates",
    "rv_inventory",
    "rv_inventory_adjustments",
    "rv_invoices",
    "rv_jobs",
    "rv_reminders",
    "rv_service_catalog",
    "hr_applications",
    "hr_documents",
    "hr_employee_manual",
    "hr_employees",
    "hr_faqs",
    "hr_job_postings",
    "hr_knowledge_base",
    "hr_pay_periods",
    "hr_schedules",
    "hr_time_entries",
    "hr_time_off",
]


async def cleanup_non_pawn_data():
    marker = await db.admin_settings.find_one(
        {"type": "cleanup_marker", "key": "non_pawn_scope_cleanup_v1"},
        {"_id": 0},
    )
    if marker and marker.get("completed"):
        return

    cleanup_report = {}
    for collection_name in NON_PAWN_COLLECTIONS:
        delete_result = await db[collection_name].delete_many({})
        cleanup_report[collection_name] = delete_result.deleted_count

    await db.admin_settings.update_one(
        {"type": "cleanup_marker", "key": "non_pawn_scope_cleanup_v1"},
        {
            "$set": {
                "type": "cleanup_marker",
                "key": "non_pawn_scope_cleanup_v1",
                "completed": True,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "collections": NON_PAWN_COLLECTIONS,
                "cleanup_report": cleanup_report,
            }
        },
        upsert=True,
    )

    logger.info("Non-pawn data cleanup completed: %s", cleanup_report)

# Import and configure pawn POS module
from pawn_pos import router as pawn_pos_router, set_database as set_pawn_pos_db
set_pawn_pos_db(db)

# Import and configure peptide contracts module
from pawn_contracts import router as pawn_contracts_router, set_database as set_pawn_contracts_db
set_pawn_contracts_db(db)

# Import and configure peptides settings module
from pawn_settings import router as pawn_settings_router, set_database as set_pawn_settings_db
set_pawn_settings_db(db)

# Import and configure e-signature module
from esignature import router as esignature_router, set_database as set_esignature_db
set_esignature_db(db)

# Import and configure email utilities
from email_utils import set_database as set_email_db, send_two_factor_email, send_verification_email
set_email_db(db)

# Import and configure Durango payments module
from durango_payments import router as durango_payments_router, set_database as set_durango_payments_db
set_durango_payments_db(db)

# Import and configure Shipping module
from shipping import router as shipping_router, set_database as set_shipping_db
set_shipping_db(db)

# Import and configure User Management module
from user_management import router as user_management_router, set_database as set_user_management_db
set_user_management_db(db)

# Import and configure Reviews module
from reviews import router as reviews_router, set_database as set_reviews_db
set_reviews_db(db)

# Import and configure Email Templates module
from email_templates import router as email_templates_router, set_db as set_email_templates_db
set_email_templates_db(db)

# Import and configure Sitemap module
from sitemap import sitemap_router, set_database as set_sitemap_db
set_sitemap_db(db)

# Import and configure Sitemap Generator module
from sitemap_generator import sitemap_generator_router, set_database as set_sitemap_generator_db
set_sitemap_generator_db(db)

# Import and configure Johnny 5 Portal
from johnny5_portal import johnny5_router, set_database as set_johnny5_db
set_johnny5_db(db)

# Import and configure Chat System
from chat_routes import chat_router, set_database as set_chat_db, set_llm_key as set_chat_llm_key
set_chat_db(db)
set_chat_llm_key(os.environ.get('OPENAI_API_KEY'))

# Import and configure User Portal
from user_portal import portal_router, set_database as set_portal_db
set_portal_db(db)

# Import and configure Abandoned Carts module
from abandoned_carts import router as abandoned_carts_router, set_db as set_abandoned_carts_db, set_email_func
from email_utils import send_email as send_email_async
set_abandoned_carts_db(db)
set_email_func(send_email_async)

# Import and configure Mega Menu module
from mega_menu import router as mega_menu_router, public_router as mega_menu_public_router, set_database as set_mega_menu_db
set_mega_menu_db(db)

# Import and configure A2G modules (Step 1 backend wiring)
from contacts_routes import router as contacts_router, set_database as set_contacts_db
set_contacts_db(db)

from calendar_routes import router as calendar_router, set_database as set_calendar_db
set_calendar_db(db)

from tasks_routes import router as tasks_router, set_database as set_tasks_db
set_tasks_db(db)

from radio_routes import router as radio_router

from andgo_routes import router as andgo_router, set_database as set_andgo_db
set_andgo_db(db)

from booking_routes import router as booking_router, set_database as set_booking_db
set_booking_db(db)
from quote_contract_esign_routes import router as quote_contract_esign_router, set_database as set_quote_contract_esign_db
set_quote_contract_esign_db(db)

# Import and configure Inventory Management module
from inventory_management import router as inventory_router, set_database as set_inventory_db
set_inventory_db(db)

# Create the main app without a prefix
app = FastAPI(title="123Bots API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Auth dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[TokenData]:
    if credentials is None:
        return None
    token = credentials.credentials
    token_data = decode_token(token)
    return token_data

async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token_data = decode_token(credentials.credentials)
    if token_data is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    return token_data

async def require_admin(current_user: TokenData = Depends(require_auth)) -> TokenData:
    if not is_admin_or_above(current_user.role):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def require_super_admin(current_user: TokenData = Depends(require_auth)) -> TokenData:
    if not is_super_admin(current_user.role):
        raise HTTPException(status_code=403, detail="Super admin access required")
    return current_user

# Basic routes
@api_router.get("/")
async def root():
    return {"message": "123Bots API"}

@api_router.get("/health")
async def health_check():
    """Health check endpoint for deployment readiness"""
    return {"status": "healthy", "service": "123Bots-api"}

from fastapi.responses import Response

@api_router.get("/sitemap.xml")
async def dynamic_sitemap(request: Request):
    """Generate dynamic sitemap with products and articles"""
    forwarded_host = request.headers.get("x-forwarded-host") or request.headers.get("host") or "localhost"
    base_url = f"https://{forwarded_host}"
    
    # Static pages
    static_pages = [
        {"loc": "/", "changefreq": "weekly", "priority": "1.0"},
        {"loc": "/shop", "changefreq": "daily", "priority": "0.9"},
        {"loc": "/research", "changefreq": "weekly", "priority": "0.8"},
        {"loc": "/about", "changefreq": "monthly", "priority": "0.7"},
        {"loc": "/contact", "changefreq": "monthly", "priority": "0.7"},
        {"loc": "/faq", "changefreq": "monthly", "priority": "0.6"},
        {"loc": "/terms-conditions", "changefreq": "yearly", "priority": "0.3"},
        {"loc": "/privacy-policy", "changefreq": "yearly", "priority": "0.3"},
        {"loc": "/shipping-returns", "changefreq": "monthly", "priority": "0.5"},
        {"loc": "/accessibility", "changefreq": "yearly", "priority": "0.3"},
        # Robot product pages
        {"loc": "/products/pudu-bg1", "changefreq": "monthly", "priority": "0.8"},
        {"loc": "/products/pudu-cc1-pro", "changefreq": "monthly", "priority": "0.8"},
        {"loc": "/products/pudu-sh1", "changefreq": "monthly", "priority": "0.8"},
        {"loc": "/products/pudu-mt1", "changefreq": "monthly", "priority": "0.8"},
        {"loc": "/products/pudu-mt1-vac", "changefreq": "monthly", "priority": "0.8"},
        {"loc": "/products/flashbot-max", "changefreq": "monthly", "priority": "0.8"},
        {"loc": "/products/pudu-t300", "changefreq": "monthly", "priority": "0.8"},
        {"loc": "/products/pudu-t600", "changefreq": "monthly", "priority": "0.8"},
        {"loc": "/products/gausium-mira", "changefreq": "monthly", "priority": "0.8"},
        {"loc": "/products/gausium-marvel", "changefreq": "monthly", "priority": "0.8"},
        {"loc": "/products/ab-kas", "changefreq": "monthly", "priority": "0.8"},
        # Robot feature detail pages
        {"loc": "/explore-all-pudu-bg1-features", "changefreq": "monthly", "priority": "0.7"},
        {"loc": "/explore-all-pudu-cc1-pro-features", "changefreq": "monthly", "priority": "0.7"},
    ]
    
    # Build XML
    xml_parts = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml_parts.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    
    # Add static pages
    for page in static_pages:
        xml_parts.append(f'''  <url>
    <loc>{base_url}{page["loc"]}</loc>
    <changefreq>{page["changefreq"]}</changefreq>
    <priority>{page["priority"]}</priority>
  </url>''')
    
    # Add products
    try:
        products = await db.products.find(
            {"is_active": True}, 
            {"seo_url": 1, "updated_at": 1, "_id": 0}
        ).to_list(500)
        for product in products:
            if product.get("seo_url"):
                xml_parts.append(f'''  <url>
    <loc>{base_url}/shop/{product["seo_url"]}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>''')
    except Exception as e:
        logger.warning(f"Error fetching products for sitemap: {e}")
    
    # Add research articles
    try:
        articles = await db.research_articles.find(
            {}, 
            {"slug": 1, "published_date": 1, "_id": 0}
        ).to_list(200)
        for article in articles:
            if article.get("slug"):
                xml_parts.append(f'''  <url>
    <loc>{base_url}/research/{article["slug"]}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>''')
    except Exception as e:
        logger.warning(f"Error fetching articles for sitemap: {e}")
    
    xml_parts.append('</urlset>')
    
    return Response(
        content="\n".join(xml_parts), 
        media_type="application/xml"
    )

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# ============ AUTH ROUTES ============

def build_user_response(user: dict) -> UserResponse:
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        is_active=user["is_active"],
        created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"],
    )


def build_login_success(user: dict, trusted_device_token: Optional[str] = None) -> LoginResponse:
    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"], "role": user["role"]}
    )
    return LoginResponse(
        access_token=access_token,
        user=build_user_response(user),
        trusted_device_token=trusted_device_token,
    )


@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Login with email and password"""
    user = await db.users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is disabled")

    if user.get("email_2fa_enabled", False):
        trusted_devices = normalize_trusted_devices(user.get("email_2fa_trusted_devices", []))
        trusted_device_token = (request.trusted_device_token or "").strip()

        if trusted_device_token and is_trusted_device(trusted_devices, trusted_device_token):
            await db.users.update_one(
                {"id": user["id"]},
                {
                    "$set": {
                        "email_2fa_trusted_devices": touch_trusted_device(trusted_devices, trusted_device_token),
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }
                },
            )
            return build_login_success(user)

        challenge = await create_two_factor_challenge(db, user, "login")
        email_sent = await send_two_factor_email(user["email"], challenge["code"], user.get("name", ""), purpose="login")
        if not email_sent:
            raise HTTPException(status_code=500, detail="Unable to send your verification code right now")

        await db.users.update_one(
            {"id": user["id"]},
            {
                "$set": {
                    "email_2fa_trusted_devices": trusted_devices,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )

        return LoginResponse(
            requires_two_factor=True,
            challenge_id=challenge["challenge_id"],
            email=user["email"],
            message="Enter the 6-digit code we sent to your email to finish signing in.",
        )

    return build_login_success(user)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: TokenData = Depends(require_auth)):
    """Get current logged in user info"""
    user = await db.users.find_one({"id": current_user.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return build_user_response(user)


class VerifyLoginTwoFactorRequest(BaseModel):
    email: EmailStr
    challenge_id: str
    code: str
    trust_device: bool = False


class ResendLoginTwoFactorRequest(BaseModel):
    email: EmailStr
    challenge_id: str


class TwoFactorPasswordRequest(BaseModel):
    current_password: str


class TwoFactorVerifySetupRequest(BaseModel):
    challenge_id: str
    code: str


@api_router.post("/auth/verify-login-2fa", response_model=LoginResponse)
async def verify_login_two_factor(request: VerifyLoginTwoFactorRequest):
    verification = await verify_two_factor_challenge(db, request.challenge_id, request.email, request.code, "login")
    if not verification.get("ok"):
        reason = verification.get("reason")
        if reason == "expired":
            raise HTTPException(status_code=400, detail="That code has expired. Please request a new one.")
        if reason == "used":
            raise HTTPException(status_code=400, detail="That verification code has already been used.")
        raise HTTPException(status_code=400, detail="Invalid verification code")

    challenge = verification["challenge"]
    user = await db.users.find_one({"id": challenge["user_id"]})
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is unavailable")

    raw_trusted_device_token = None
    if request.trust_device:
        raw_trusted_device_token, updated_devices = issue_trusted_device_token(
            user.get("email_2fa_trusted_devices", []),
            label="Browser trusted for 30 days",
        )
        await db.users.update_one(
            {"id": user["id"]},
            {
                "$set": {
                    "email_2fa_trusted_devices": updated_devices,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )

    return build_login_success(user, trusted_device_token=raw_trusted_device_token)


@api_router.post("/auth/resend-login-2fa")
async def resend_login_two_factor(request: ResendLoginTwoFactorRequest):
    challenge = await db.auth_two_factor_challenges.find_one(
        {"id": request.challenge_id, "email": request.email, "challenge_type": "login"},
        {"_id": 0},
    )
    if not challenge or challenge.get("used_at"):
        raise HTTPException(status_code=400, detail="This sign-in session is no longer valid. Please sign in again.")

    user = await db.users.find_one({"id": challenge["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    resend_result = await resend_two_factor_challenge(db, request.challenge_id, request.email, "login")
    if not resend_result.get("ok"):
        raise HTTPException(status_code=400, detail="Unable to resend the verification code")

    email_sent = await send_two_factor_email(user["email"], resend_result["code"], user.get("name", ""), purpose="login")
    if not email_sent:
        raise HTTPException(status_code=500, detail="Unable to send your verification code right now")

    return {"success": True, "message": "A new verification code has been sent to your email."}


@api_router.get("/auth/2fa/status")
async def get_two_factor_status(current_user: TokenData = Depends(require_auth)):
    user = await db.users.find_one({"id": current_user.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    trusted_devices = normalize_trusted_devices(user.get("email_2fa_trusted_devices", []))
    if trusted_devices != user.get("email_2fa_trusted_devices", []):
        await db.users.update_one(
            {"id": current_user.user_id},
            {"$set": {"email_2fa_trusted_devices": trusted_devices, "updated_at": datetime.now(timezone.utc).isoformat()}},
        )

    return {
        "email_2fa_enabled": user.get("email_2fa_enabled", False),
        "trusted_device_count": len(trusted_devices),
    }


@api_router.post("/auth/2fa/send-setup-code")
async def send_two_factor_setup_code(request: TwoFactorPasswordRequest, current_user: TokenData = Depends(require_auth)):
    user = await db.users.find_one({"id": current_user.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("email_2fa_enabled", False):
        raise HTTPException(status_code=400, detail="Email two-step verification is already enabled")
    if not verify_password(request.current_password, user.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    challenge = await create_two_factor_challenge(db, user, "enable")
    email_sent = await send_two_factor_email(user["email"], challenge["code"], user.get("name", ""), purpose="enable")
    if not email_sent:
        raise HTTPException(status_code=500, detail="Unable to send your verification code right now")

    return {
        "success": True,
        "challenge_id": challenge["challenge_id"],
        "message": "We sent a verification code to your email.",
    }


@api_router.post("/auth/2fa/verify-setup")
async def verify_two_factor_setup(request: TwoFactorVerifySetupRequest, current_user: TokenData = Depends(require_auth)):
    user = await db.users.find_one({"id": current_user.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    verification = await verify_two_factor_challenge(db, request.challenge_id, user["email"], request.code, "enable")
    if not verification.get("ok"):
        reason = verification.get("reason")
        if reason == "expired":
            raise HTTPException(status_code=400, detail="That code has expired. Please request a new one.")
        raise HTTPException(status_code=400, detail="Invalid verification code")

    await db.users.update_one(
        {"id": current_user.user_id},
        {
            "$set": {
                "email_2fa_enabled": True,
                "email_2fa_enabled_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    return {"success": True, "message": "Email two-step verification is now enabled."}


@api_router.post("/auth/2fa/disable")
async def disable_two_factor(request: TwoFactorPasswordRequest, current_user: TokenData = Depends(require_auth)):
    user = await db.users.find_one({"id": current_user.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(request.current_password, user.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    await db.users.update_one(
        {"id": current_user.user_id},
        {
            "$set": {
                "email_2fa_enabled": False,
                "email_2fa_trusted_devices": [],
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    return {"success": True, "message": "Email two-step verification has been turned off."}

# ============ PUBLIC REGISTRATION ============

import random
import string

class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

def generate_verification_code():
    """Generate a 6-digit verification code"""
    return ''.join(random.choices(string.digits, k=6))

@api_router.post("/auth/register")
async def register(request: RegisterRequest):
    """Public registration endpoint - sends verification email"""
    site_settings = await db.admin_settings.find_one({"type": "site"}, {"_id": 0})
    require_email_verification = True
    if site_settings is not None:
        require_email_verification = site_settings.get("require_email_verification_for_registration", True)

    # Check if email already exists and is verified
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        if existing_user.get("email_verified", False):
            raise HTTPException(status_code=400, detail="Email already registered")
        else:
            # User exists but not verified - delete old record and re-register
            await db.users.delete_one({"email": request.email})

    # Create new user (unverified)
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(request.password)

    verification_code = generate_verification_code() if require_email_verification else None
    verification_expires = datetime.now(timezone.utc).isoformat() if require_email_verification else None

    new_user = {
        "id": user_id,
        "email": request.email,
        "name": request.name,
        "hashed_password": hashed_password,
        "role": UserRole.USER,
        "is_active": not require_email_verification,
        "email_verified": not require_email_verification,
        "verification_code": verification_code,
        "verification_expires": verification_expires,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.users.insert_one(new_user)

    if require_email_verification:
        email_sent = await send_verification_email(request.email, verification_code, request.name)
        return {
            "message": "Verification email sent" if email_sent else "Account created. Please check your email for verification code.",
            "email": request.email,
            "email_sent": email_sent,
            "requires_verification": True,
        }

    access_token = create_access_token(
        data={"sub": user_id, "email": request.email, "role": UserRole.USER}
    )

    user_response = UserResponse(
        id=user_id,
        email=request.email,
        name=request.name,
        role=UserRole.USER,
        is_active=True,
        created_at=datetime.fromisoformat(new_user["created_at"]),
    )

    return {
        "message": "Account created successfully.",
        "requires_verification": False,
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response.model_dump(mode="json"),
    }

@api_router.post("/auth/verify-email", response_model=Token)
async def verify_email(request: VerifyEmailRequest):
    """Verify email with code"""
    user = await db.users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("email_verified", False):
        raise HTTPException(status_code=400, detail="Email already verified")
    
    if user.get("verification_code") != request.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Mark user as verified and active
    await db.users.update_one(
        {"email": request.email},
        {"$set": {"email_verified": True, "is_active": True, "verification_code": None}}
    )
    
    # Create access token and log them in
    access_token = create_access_token(
        data={"sub": user["id"], "email": request.email, "role": UserRole.USER}
    )
    
    user_response = UserResponse(
        id=user["id"],
        email=request.email,
        name=user["name"],
        role=UserRole.USER,
        is_active=True,
        created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
    )
    
    return Token(access_token=access_token, user=user_response)

@api_router.post("/auth/resend-verification")
async def resend_verification(request: ResendVerificationRequest):
    """Resend verification email"""
    user = await db.users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("email_verified", False):
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Generate new verification code
    verification_code = generate_verification_code()
    
    await db.users.update_one(
        {"email": request.email},
        {"$set": {"verification_code": verification_code, "verification_expires": datetime.utcnow().isoformat()}}
    )
    
    # Send verification email
    email_sent = await send_verification_email(request.email, verification_code, user.get("name", ""))
    
    return {
        "message": "Verification email sent" if email_sent else "Could not send email. Please try again.",
        "email_sent": email_sent
    }

# ============ SMTP SETTINGS ============

class SMTPSettings(BaseModel):
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    from_email: str = ""
    from_name: str = "123Bots"
    use_tls: bool = True

@api_router.get("/settings/smtp")
async def get_smtp_settings(current_user: TokenData = Depends(require_auth)):
    """Get SMTP settings (super admin only)"""
    user = await db.users.find_one({"id": current_user.user_id})
    if not user or user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    settings = await db.admin_settings.find_one({"type": "smtp"})
    if not settings:
        return SMTPSettings()
    
    # Don't return the actual password, just indicate if it's set
    return {
        "smtp_host": settings.get("smtp_host", ""),
        "smtp_port": settings.get("smtp_port", 587),
        "smtp_username": settings.get("smtp_username", ""),
        "smtp_password_set": bool(settings.get("smtp_password")),
        "from_email": settings.get("from_email", ""),
        "from_name": settings.get("from_name", "123Bots"),
        "use_tls": settings.get("use_tls", True),
        "is_configured": bool(settings.get("smtp_host"))
    }

@api_router.post("/settings/smtp")
async def save_smtp_settings(settings: SMTPSettings, current_user: TokenData = Depends(require_auth)):
    """Save SMTP settings (super admin only)"""
    user = await db.users.find_one({"id": current_user.user_id})
    if not user or user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    # Get existing settings to preserve password if not changed
    existing = await db.admin_settings.find_one({"type": "smtp"})
    
    update_data = {
        "type": "smtp",
        "smtp_host": settings.smtp_host,
        "smtp_port": settings.smtp_port,
        "smtp_username": settings.smtp_username,
        "from_email": settings.from_email,
        "from_name": settings.from_name,
        "use_tls": settings.use_tls,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Only update password if provided (not empty)
    if settings.smtp_password:
        update_data["smtp_password"] = settings.smtp_password
    elif existing:
        update_data["smtp_password"] = existing.get("smtp_password", "")
    
    await db.admin_settings.update_one(
        {"type": "smtp"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"success": True, "message": "SMTP settings saved"}

@api_router.post("/settings/smtp/test")
async def test_smtp_settings(current_user: TokenData = Depends(require_auth)):
    """Send test email to verify SMTP settings"""
    user = await db.users.find_one({"id": current_user.user_id})
    if not user or user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    from email_utils import send_email
    
    success = await send_email(
        user["email"],
        "123Bots SMTP Test",
        "<h1>SMTP Configuration Successful!</h1><p>Your email settings are working correctly.</p>",
        "SMTP Configuration Successful! Your email settings are working correctly."
    )
    
    if success:
        return {"success": True, "message": f"Test email sent to {user['email']}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send test email. Check SMTP settings.")

# ============ ADMIN USER MANAGEMENT ============

class UserCreateAdmin(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = UserRole.USER

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None


class CustomerAdminUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

@api_router.get("/admin/users", response_model=List[UserResponse])
async def list_users(current_user: TokenData = Depends(require_admin)):
    """List all users (admin only)"""
    users = await db.users.find({}, {"_id": 0, "hashed_password": 0}).to_list(1000)
    result = []
    for user in users:
        result.append(UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            is_active=user.get("is_active", True),
            created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
        ))
    return result

@api_router.post("/admin/users", response_model=UserResponse)
async def create_user(user_data: UserCreateAdmin, current_user: TokenData = Depends(require_super_admin)):
    """Create a new user (super admin only)"""
    # Check if email already exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    now = datetime.now(timezone.utc)
    user = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "name": user_data.name,
        "hashed_password": get_password_hash(user_data.password),
        "role": user_data.role,
        "is_active": True,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.users.insert_one(user)
    await ensure_user_booking_calendar_setup(db, user)
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        is_active=user["is_active"],
        created_at=now
    )


@api_router.post("/admin/customers")
async def create_customer(customer_data: CustomerCreate, current_user: TokenData = Depends(require_admin)):
    """Create a real customer account (login + storefront record) that can purchase across all enabled systems."""
    email = customer_data.email.lower().strip()

    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="A customer with this email already exists")

    now_iso = datetime.now(timezone.utc).isoformat()
    user_id = str(uuid.uuid4())

    new_user = {
        "id": user_id,
        "email": email,
        "name": customer_data.name,
        "hashed_password": get_password_hash(customer_data.password),
        "role": UserRole.USER,
        "is_active": True,
        "email_verified": True,
        "phone": customer_data.phone,
        "address": customer_data.address,
        "city": customer_data.city,
        "state": customer_data.state,
        "zip_code": customer_data.zip_code,
        "created_at": now_iso,
        "updated_at": now_iso,
        "total_orders": 0,
        "total_spent": 0.0,
    }
    await db.users.insert_one(new_user)

    customer_doc = {
        "id": user_id,
        "email": email,
        "name": customer_data.name,
        "phone": customer_data.phone,
        "address": customer_data.address,
        "city": customer_data.city,
        "state": customer_data.state,
        "zip_code": customer_data.zip_code,
        "total_orders": 0,
        "total_spent": 0.0,
        "created_at": now_iso,
        "last_order_at": None,
    }
    await db.customers.insert_one(customer_doc)

    return {
        "success": True,
        "id": user_id,
        "email": email,
        "name": customer_data.name,
        "message": "Customer created successfully",
    }


@api_router.post("/admin/customers/{customer_id}/impersonate", response_model=Token)
async def impersonate_customer(customer_id: str, current_user: TokenData = Depends(require_admin)):
    """Impersonate a customer user account (admin/super_admin only)."""
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    target_user = await db.users.find_one({"email": customer.get("email")})
    if not target_user:
        raise HTTPException(status_code=404, detail="This customer does not have a user account to impersonate")

    if target_user.get("role") != UserRole.USER:
        raise HTTPException(status_code=400, detail="Only customer user accounts can be impersonated")

    if not target_user.get("is_active", True):
        raise HTTPException(status_code=400, detail="Target user account is disabled")

    access_token = create_access_token(
        data={
            "sub": target_user["id"],
            "email": target_user["email"],
            "role": target_user["role"],
            "impersonated_by": current_user.user_id,
        }
    )

    user_response = UserResponse(
        id=target_user["id"],
        email=target_user["email"],
        name=target_user["name"],
        role=target_user["role"],
        is_active=target_user.get("is_active", True),
        created_at=datetime.fromisoformat(target_user["created_at"]) if isinstance(target_user.get("created_at"), str) else target_user.get("created_at", datetime.now(timezone.utc)),
    )

    return Token(access_token=access_token, user=user_response)


@api_router.put("/admin/customers/{customer_id}")
async def update_customer(customer_id: str, customer_data: CustomerAdminUpdate, current_user: TokenData = Depends(require_admin)):
    """Edit a customer account (updates both the login user and the storefront record)."""
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    updates = {k: v for k, v in customer_data.model_dump().items() if v is not None and k != "password"}

    if "email" in updates:
        updates["email"] = updates["email"].lower().strip()
        clash = await db.users.find_one({"email": updates["email"], "id": {"$ne": customer_id}})
        if clash:
            raise HTTPException(status_code=400, detail="Another account already uses this email")

    now_iso = datetime.now(timezone.utc).isoformat()

    if updates:
        await db.customers.update_one({"id": customer_id}, {"$set": updates})

    user_updates = dict(updates)
    user_updates["updated_at"] = now_iso
    if customer_data.password:
        if len(customer_data.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        user_updates["hashed_password"] = get_password_hash(customer_data.password)
    await db.users.update_one({"id": customer_id}, {"$set": user_updates})

    updated = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    return {"success": True, "customer": updated, "message": "Customer updated successfully"}


@api_router.delete("/admin/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: TokenData = Depends(require_admin)):
    """Delete a customer account (both the login user and the storefront record)."""
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    user = await db.users.find_one({"id": customer_id}, {"_id": 0})
    if not customer and not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    if user and user.get("role") not in (UserRole.USER, None):
        raise HTTPException(status_code=400, detail="Only customer accounts can be deleted here")

    await db.customers.delete_one({"id": customer_id})
    await db.users.delete_one({"id": customer_id, "role": UserRole.USER})

    return {"success": True, "message": "Customer deleted successfully"}


@api_router.put("/admin/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_data: UserUpdate, current_user: TokenData = Depends(require_super_admin)):
    """Update a user (super admin only)"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {k: v for k, v in user_data.model_dump().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id})
    return UserResponse(
        id=updated_user["id"],
        email=updated_user["email"],
        name=updated_user["name"],
        role=updated_user["role"],
        is_active=updated_user.get("is_active", True),
        created_at=datetime.fromisoformat(updated_user["created_at"]) if isinstance(updated_user["created_at"], str) else updated_user["created_at"]
    )

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: TokenData = Depends(require_super_admin)):
    """Delete a user (super admin only)"""
    # Prevent self-deletion
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

# ============ USER PROFILE ============

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@api_router.put("/auth/profile")
async def update_profile(profile_data: ProfileUpdate, current_user: TokenData = Depends(get_current_user)):
    """Update current user's profile"""
    user = await db.users.find_one({"id": current_user.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"id": current_user.user_id}, {"$set": update_data})
    
    return {"success": True, "message": "Profile updated successfully"}

@api_router.put("/auth/change-password")
async def change_password(password_data: PasswordChange, current_user: TokenData = Depends(get_current_user)):
    """Change current user's password"""
    user = await db.users.find_one({"id": current_user.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(password_data.current_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    new_hashed_password = get_password_hash(password_data.new_password)
    await db.users.update_one(
        {"id": current_user.user_id},
        {"$set": {
            "hashed_password": new_hashed_password,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Password changed successfully"}

# ============ ADMIN DASHBOARD STATS ============

class DashboardStats(BaseModel):
    total_users: int
    total_products: int
    total_storage_units: int
    total_rv_services: int
    recent_activity: List[dict]

@api_router.get("/admin/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(current_user: TokenData = Depends(require_admin)):
    """Get dashboard statistics"""
    total_users = await db.users.count_documents({})
    total_products = await db.products.count_documents({})
    total_storage = await db.storage_units.count_documents({})
    total_services = await db.rv_services.count_documents({})
    
    # Get recent activity (placeholder)
    recent_activity = [
        {"type": "user_login", "message": "Admin logged in", "time": datetime.now(timezone.utc).isoformat()}
    ]
    
    return DashboardStats(
        total_users=total_users,
        total_products=total_products,
        total_storage_units=total_storage,
        total_rv_services=total_services,
        recent_activity=recent_activity
    )

# Include the router in the main app
app.include_router(api_router)

# Include e-commerce router
from ecommerce import get_ecommerce_router
ecommerce_router = get_ecommerce_router(db, require_admin)
app.include_router(ecommerce_router)

# Include storage router
from storage import get_storage_router
storage_router = get_storage_router(db, require_admin, require_super_admin)
app.include_router(storage_router)

# Include tax-exempt router (lead/customer tax exemption + cert upload)
from tax_exempt import get_tax_exempt_router
tax_exempt_router = get_tax_exempt_router(db, require_admin, require_auth)
app.include_router(tax_exempt_router)

# Include AI product generator router
from ai_product import get_ai_product_router
ai_product_router = get_ai_product_router(require_admin)
app.include_router(ai_product_router)

# Include storage rentals router
from storage_rentals import get_storage_rental_router, handle_stripe_webhook
storage_rental_router = get_storage_rental_router(db, require_admin)
app.include_router(storage_rental_router)

# Include pawn POS router
app.include_router(pawn_pos_router, prefix="/api")

# Include peptide contracts router
app.include_router(pawn_contracts_router, prefix="/api")

# Include peptides settings router
app.include_router(pawn_settings_router, prefix="/api")

# Include e-signature router
app.include_router(esignature_router, prefix="/api")

# Include admin settings router
from admin_settings import router as admin_settings_router, public_router as public_settings_router, set_database as set_admin_settings_db
set_admin_settings_db(db)
app.include_router(admin_settings_router)
app.include_router(public_settings_router)

# Include Printful integration router
from printful_integration import router as printful_router, set_database as set_printful_db
set_printful_db(db)
app.include_router(printful_router)

# Include YOYCOL integration router
from yoycol_integration import router as yoycol_router, set_database as set_yoycol_db
set_yoycol_db(db)
app.include_router(yoycol_router)

# Include human resources router
from human_resources import router as hr_router, init_db as init_hr_db
init_hr_db(db)
app.include_router(hr_router, prefix="/api")

# Include RV restoration router
from rv_restoration import router as rv_router, init_db as init_rv_db
init_rv_db(db)
app.include_router(rv_router, prefix="/api")

# Include pawn extended features router
from pawn_extended import router as pawn_extended_router, set_database as set_pawn_extended_db
set_pawn_extended_db(db)
app.include_router(pawn_extended_router, prefix="/api")

# Include pawn compliance router
from pawn_compliance import router as pawn_compliance_router, set_database as set_pawn_compliance_db
set_pawn_compliance_db(db)
app.include_router(pawn_compliance_router, prefix="/api")

# Include accounting router
from accounting import router as accounting_router, set_database as set_accounting_db
set_accounting_db(db)
app.include_router(accounting_router, prefix="/api")

# Include leads kanban router
from leads import router as leads_kanban_router, set_database as set_leads_kanban_db
set_leads_kanban_db(db)
app.include_router(leads_kanban_router)

# Include LEADS settings router
from leads_settings import router as leads_router, set_database as set_leads_db
set_leads_db(db)
app.include_router(leads_router, prefix="/api")

# Include research library router
from research_library import (
    router as research_library_router,
    set_database as set_research_library_db,
    seed_research_articles,
)
set_research_library_db(db)
app.include_router(research_library_router, prefix="/api")

# Include External Stack API and Pipelines routers
from external_api import (
    router as external_api_router,
    pipelines_router,
    set_database as set_external_api_db,
    ensure_default_pipeline,
)
set_external_api_db(db)
app.include_router(external_api_router)
app.include_router(pipelines_router)

# Include Event Center routers
from event_center import (
    router as event_center_router,
    public_router as event_center_public_router,
    set_database as set_event_center_db,
)
set_event_center_db(db)
app.include_router(event_center_router)
app.include_router(event_center_public_router)

# Include Activity & Charter Marketplace ("Tours / Charters") routers
from activity_marketplace import (
    router as activity_marketplace_router,
    public_router as activity_marketplace_public_router,
    set_database as set_activity_marketplace_db,
)
set_activity_marketplace_db(db)
app.include_router(activity_marketplace_router)
app.include_router(activity_marketplace_public_router)

# Include Tours / Charters Billing (charter company invoices + Stripe Pay Now)
from tours_charters_billing import (
    router as tours_charters_billing_router,
    public_router as tours_charters_billing_public_router,
    set_database as set_tours_charters_billing_db,
)
set_tours_charters_billing_db(db)
app.include_router(tours_charters_billing_router)
app.include_router(tours_charters_billing_public_router)


# Include location generator routers
from location_generator import (
    dev_router as location_dev_router,
    preview_router as location_preview_router,
    public_router as location_public_router,
    set_database as set_location_generator_db,
)
set_location_generator_db(db)
app.include_router(location_preview_router, prefix="/api")
app.include_router(location_dev_router, prefix="/api", dependencies=[Depends(require_super_admin)])
app.include_router(location_public_router, prefix="/api")  # Keep /api prefix for backend routing

# Include backend knowledgebase router
from knowledgebase import get_knowledgebase_router
knowledgebase_router = get_knowledgebase_router(db, require_auth, require_admin)
app.include_router(knowledgebase_router)

# Durango Payments router
app.include_router(durango_payments_router, prefix="/api")

# Shipping router
app.include_router(shipping_router, prefix="/api")

# User Management router
app.include_router(user_management_router, prefix="/api")

# Reviews router
app.include_router(reviews_router, prefix="/api")

# Email Templates router
app.include_router(email_templates_router)

# Sitemap router (SEO)
app.include_router(sitemap_router, prefix="/api")

# Sitemap Generator router (Admin)
app.include_router(sitemap_generator_router, prefix="/api")

# Johnny 5 Portal router (Multi-Store Hub)
app.include_router(johnny5_router, prefix="/api")

# Chat System router
app.include_router(chat_router, prefix="/api")

# User Portal router
app.include_router(portal_router, prefix="/api")

# Abandoned Carts router
app.include_router(abandoned_carts_router, prefix="/api")

# Mega Menu router
app.include_router(mega_menu_router)
app.include_router(mega_menu_public_router)

# A2G modules routers
app.include_router(contacts_router, prefix="/api")
app.include_router(calendar_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")
app.include_router(radio_router, prefix="/api")
app.include_router(andgo_router, prefix="/api")
app.include_router(booking_router, prefix="/api")
app.include_router(quote_contract_esign_router, prefix="/api")

# Inventory Management router
app.include_router(inventory_router)

# Serve uploaded chat files
@app.get("/api/uploads/chat/{filename}", include_in_schema=False)
async def serve_chat_upload(filename: str):
    """Serve uploaded chat files"""
    from fastapi.responses import FileResponse
    from pathlib import Path
    
    file_path = Path(f"/app/uploads/chat/{filename}")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path)

# Serve uploaded product images and other files
@app.get("/api/uploads/{folder}/{filename}", include_in_schema=False)
async def serve_uploaded_file(folder: str, filename: str):
    """Serve uploaded files from local storage"""
    from fastapi.responses import FileResponse
    from pathlib import Path
    import mimetypes
    
    # Security: prevent directory traversal
    if ".." in folder or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid path")
    
    file_path = Path(f"/app/uploads/{folder}/{filename}")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine content type
    content_type, _ = mimetypes.guess_type(str(file_path))
    
    return FileResponse(
        file_path, 
        media_type=content_type or "application/octet-stream",
        headers={"Cache-Control": "public, max-age=31536000"}  # Cache for 1 year
    )

# Stripe webhook endpoint
@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    return await handle_stripe_webhook(request, db)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Startup event to create super admin
@app.on_event("startup")
async def startup_event():
    """Create super admin user and seed initial data on startup"""
    try:
        # Create primary super admin
        super_admin_email = "mel@a2gdesigns.com"
        existing = await db.users.find_one({"email": super_admin_email})
        
        if not existing:
            now = datetime.now(timezone.utc)
            super_admin = {
                "id": str(uuid.uuid4()),
                "email": super_admin_email,
                "name": "Mel (Super Admin)",
                "hashed_password": get_password_hash("BigDaddy2016!!"),
                "role": UserRole.SUPER_ADMIN,
                "is_active": True,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
            await db.users.insert_one(super_admin)
            logger.info(f"Super admin user created: {super_admin_email}")
        else:
            logger.info(f"Super admin user already exists: {super_admin_email}")

        # Create secondary super admin for testing
        test_admin_email = "super@amino.com"
        test_existing = await db.users.find_one({"email": test_admin_email})
        
        if not test_existing:
            now = datetime.now(timezone.utc)
            test_admin = {
                "id": str(uuid.uuid4()),
                "email": test_admin_email,
                "name": "Super Admin",
                "hashed_password": get_password_hash("peptides"),
                "role": UserRole.SUPER_ADMIN,
                "is_active": True,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
            await db.users.insert_one(test_admin)
            logger.info(f"Test super admin user created: {test_admin_email}")

        await cleanup_non_pawn_data()
        logger.info("Verified non-pawn data cleanup marker")

        await seed_research_articles()
        logger.info("Research library verified/seeded")

        await ensure_default_pipeline()
        logger.info("Default pipeline verified/seeded")

        # Migrate support email from info@ to support@
        site_settings = await db.admin_settings.find_one({"type": "site"})
        if site_settings and site_settings.get("support_email") == "info@123bots.com":
            await db.admin_settings.update_one(
                {"type": "site"},
                {"$set": {"support_email": "support@123bots.com"}}
            )
            logger.info("Migrated support email to support@123bots.com")

        catalog_sync_result = await sync_pdf_catalog(db)
        logger.info(
            "Catalog sync complete | updated=%s | products=%s | categories=%s",
            catalog_sync_result.get("updated"),
            catalog_sync_result.get("products"),
            catalog_sync_result.get("categories"),
        )
        
        # Initialize background scheduler for periodic tasks
        from scheduler import init_scheduler
        init_scheduler(db)
        
    except Exception as e:
        logger.error(f"Startup initialization error (non-fatal): {e}")
        # Don't fail startup - let the server start and retry later

    logger.info("SERVER IS LIVE AND LISTENING")

@app.on_event("shutdown")
async def shutdown_db_client():
    from scheduler import shutdown_scheduler
    shutdown_scheduler()
    client.close()


# ============== Serve frontend build (single-container deployment) ==============
# Only active when a built frontend is present in the image (see root Dockerfile).
# The split backend/frontend Docker Compose setup has no frontend/build here, so
# this stays inert and nginx serves the frontend instead.
_FRONTEND_BUILD_DIR = (Path("/app/frontend/build")).resolve()

if _FRONTEND_BUILD_DIR.is_dir():
    from fastapi.responses import FileResponse

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        candidate = (_FRONTEND_BUILD_DIR / full_path).resolve()
        if full_path and candidate.is_file() and _FRONTEND_BUILD_DIR in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(_FRONTEND_BUILD_DIR / "index.html")
