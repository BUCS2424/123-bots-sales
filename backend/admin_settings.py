from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId, json_util
import os
import io
import json
import asyncio
import zipfile
import tempfile
import shutil
import subprocess
from pathlib import Path
from urllib.parse import urlparse, urlunparse

from auth import decode_token, is_admin_or_above

router = APIRouter(prefix="/api/admin-settings", tags=["admin-settings"])

# Public router for settings that don't require auth
public_router = APIRouter(prefix="/api/settings", tags=["public-settings"])

# Database will be injected
_db = None

def set_database(database):
    global _db
    _db = database

async def get_db():
    return _db


BACKUP_STORAGE_ROOT = Path("/app/storage/backups")
BACKUP_RETENTION_COUNT = 5


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


def _ensure_backup_folder():
    BACKUP_STORAGE_ROOT.mkdir(parents=True, exist_ok=True)


def _iter_backup_file_paths(base_path: Path):
    excluded_prefixes = [BACKUP_STORAGE_ROOT.resolve()]
    excluded_names = {".git", "__pycache__", ".pytest_cache", "node_modules"}

    for root, dirs, files in os.walk(base_path, topdown=True):
        root_path = Path(root).resolve()
        if any(str(root_path).startswith(str(prefix)) for prefix in excluded_prefixes):
            dirs[:] = []
            continue

        dirs[:] = [
            d for d in dirs
            if d not in excluded_names
            and not str((root_path / d).resolve()).startswith(str(BACKUP_STORAGE_ROOT.resolve()))
        ]

        for file_name in files:
            file_path = root_path / file_name
            if str(file_path).startswith(str(BACKUP_STORAGE_ROOT.resolve())):
                continue
            yield file_path


async def _export_db_json_dump(db, output_root: Path):
    """Portable MongoDB export fallback that does not require mongodump binary."""
    output_root.mkdir(parents=True, exist_ok=True)
    collections = await db.list_collection_names()

    for collection_name in collections:
        collection = db[collection_name]
        output_file = output_root / f"{collection_name}.jsonl"
        count = 0
        with output_file.open("w", encoding="utf-8") as f:
            async for doc in collection.find({}):
                f.write(json_util.dumps(doc))
                f.write("\n")
                count += 1

        meta_file = output_root / f"{collection_name}.meta.json"
        meta_file.write_text(
            json.dumps({"collection": collection_name, "documents": count}, indent=2),
            encoding="utf-8",
        )


async def _restore_db_from_json_dump(db, dump_root: Path):
    """Restore DB from portable JSON dump created by _export_db_json_dump."""
    jsonl_files = list(dump_root.glob("*.jsonl"))
    if not jsonl_files:
        return

    existing_collections = await db.list_collection_names()
    for collection_name in existing_collections:
        await db[collection_name].drop()

    for jsonl_file in jsonl_files:
        collection_name = jsonl_file.stem
        collection = db[collection_name]
        buffer = []
        with jsonl_file.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                buffer.append(json_util.loads(line))
                if len(buffer) >= 500:
                    await collection.insert_many(buffer)
                    buffer = []
        if buffer:
            await collection.insert_many(buffer)


async def _enforce_backup_retention(db):
    backups = await db.system_backups.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=500)
    stale_backups = backups[BACKUP_RETENTION_COUNT:]
    for stale in stale_backups:
        file_path = stale.get("file_path")
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        if stale.get("id"):
            await db.system_backups.delete_one({"id": stale.get("id")})

    # Cleanup orphaned ZIP files that are no longer tracked in DB
    if BACKUP_STORAGE_ROOT.exists() and BACKUP_STORAGE_ROOT.is_dir():
        tracked_paths = {
            str(Path(item.get("file_path")).resolve())
            for item in backups[:BACKUP_RETENTION_COUNT]
            if item.get("file_path")
        }
        for zip_path in BACKUP_STORAGE_ROOT.glob("*.zip"):
            resolved = str(zip_path.resolve())
            if resolved not in tracked_paths:
                try:
                    zip_path.unlink(missing_ok=True)
                except Exception:
                    pass


class BackupRestoreResponse(BaseModel):
    success: bool
    message: str
    backup_id: Optional[str] = None
    file_name: Optional[str] = None
    created_at: Optional[str] = None


class BackupBulkDeleteRequest(BaseModel):
    backup_ids: List[str]


async def _execute_backup_job(db, backup_id: str, file_name: str, admin_email: str, mongo_url: str, db_name: str):
    backup_path = BACKUP_STORAGE_ROOT / file_name
    try:
        with tempfile.TemporaryDirectory(prefix="system_backup_") as temp_dir:
            temp_path = Path(temp_dir)
            mongo_dump_root = temp_path / "mongodb_dump"
            mongo_json_dump_root = temp_path / "mongodb_json_dump"
            mongo_dump_root.mkdir(parents=True, exist_ok=True)

            db_dump_mode = "portable_json"
            mongodump_available = shutil.which("mongodump") is not None
            if mongodump_available:
                dump_cmd = [
                    "mongodump",
                    f"--uri={mongo_url}",
                    f"--db={db_name}",
                    f"--out={str(mongo_dump_root)}",
                ]
                dump_proc = subprocess.run(dump_cmd, capture_output=True, text=True)
                if dump_proc.returncode == 0:
                    db_dump_mode = "mongodump+portable_json"

            await _export_db_json_dump(db, mongo_json_dump_root)

            uploads_root = Path("/app/uploads")

            with zipfile.ZipFile(backup_path, "w", compression=zipfile.ZIP_DEFLATED) as zipf:
                if mongodump_available:
                    for dump_file in mongo_dump_root.rglob("*"):
                        if dump_file.is_file():
                            arcname = Path("mongodb_dump") / dump_file.relative_to(mongo_dump_root)
                            zipf.write(dump_file, arcname.as_posix())

                for dump_file in mongo_json_dump_root.rglob("*"):
                    if dump_file.is_file():
                        arcname = Path("mongodb_json_dump") / dump_file.relative_to(mongo_json_dump_root)
                        zipf.write(dump_file, arcname.as_posix())

                contains_uploads = uploads_root.is_dir()
                if contains_uploads:
                    for file_path in _iter_backup_file_paths(uploads_root):
                        arcname = Path("uploads") / file_path.relative_to(uploads_root)
                        zipf.write(file_path, arcname.as_posix())

                metadata = {
                    "backup_id": backup_id,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "created_by": admin_email,
                    "db_name": db_name,
                    "contains_env": False,
                    "contains_project_files": False,
                    "contains_uploads": contains_uploads,
                    "contains_db_dump": True,
                    "db_dump_mode": db_dump_mode,
                }
                zipf.writestr("backup_metadata.json", json.dumps(metadata, indent=2))

        file_size = backup_path.stat().st_size if backup_path.exists() else 0
        await db.system_backups.update_one(
            {"id": backup_id},
            {
                "$set": {
                    "file_path": str(backup_path),
                    "file_size": file_size,
                    "status": "ready",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )
        await _enforce_backup_retention(db)
    except Exception as e:
        await db.system_backups.update_one(
            {"id": backup_id},
            {
                "$set": {
                    "status": "failed",
                    "error": str(e)[:1000],
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )

class SessionSettings(BaseModel):
    inactivity_timeout: int = 3  # minutes
    screensaver_timeout: int = 2  # minutes

class SessionSettingsResponse(BaseModel):
    inactivity_timeout: int
    screensaver_timeout: int
    updated_at: Optional[str] = None

class Johnny5Settings(BaseModel):
    """Settings for Johnny 5 Portal feature"""
    show_menu: bool = False  # Show/hide Johnny 5 menu item in admin sidebar
    integration_enabled: bool = False  # Enable Johnny 5 integration for orders/shipping
    api_key: str = ""  # API key for Johnny 5 system (auto-generated)
    webhook_url: str = ""  # Webhook URL for receiving updates from Johnny 5


class PrintfulOAuthSettings(BaseModel):
    """Shared Printful OAuth app credentials configured in dev settings."""
    client_id: str = ""
    client_secret: str = ""
    callback_url: str = ""

class SiteSettings(BaseModel):
    """Global site settings for logo, favicon, maintenance mode, etc."""
    site_name: str = "123Bots"
    site_url: str = "https://123bots.com"
    logo_url: str = "/images/legacy-logo-placeholder.png"
    favicon_url: str = ""
    chatbot_icon_url: str = ""
    admin_email: str = ""
    support_email: str = "support@123bots.com"
    maintenance_mode: bool = False
    debug_mode: bool = False
    require_account_for_checkout: bool = False
    require_email_verification_for_registration: bool = True


def _mask_secret(secret_value: Optional[str]) -> str:
    value = (secret_value or "").strip()
    if not value:
        return ""
    if len(value) <= 8:
        return "*" * len(value)
    return f"{value[:4]}{'*' * (len(value) - 8)}{value[-4:]}"


def _normalize_printful_callback_url(callback_url: Optional[str]) -> str:
    raw_value = (callback_url or "").strip()
    if not raw_value:
        return ""

    candidate = raw_value if "://" in raw_value else f"https://{raw_value}"
    parsed = urlparse(candidate)
    if not parsed.scheme or not parsed.netloc:
        return raw_value

    normalized_path = parsed.path or ""
    if normalized_path in {"", "/"}:
        normalized_path = "/api/printful/callback"

    return urlunparse((parsed.scheme, parsed.netloc, normalized_path, "", "", ""))


def _normalized_site_settings(settings: Optional[dict] = None) -> dict:
    default_logo = "/images/legacy-logo-placeholder.png"
    default_site_name = "123Bots"
    default_site_url = "https://123bots.com"
    data = settings or {}

    raw_site_name = (data.get("site_name") or "").strip()
    raw_site_url = (data.get("site_url") or "").strip()
    raw_logo_url = (data.get("logo_url") or "").strip()
    raw_support_email = (data.get("support_email") or "").strip()

    legacy_names = {"", "AMINO-CHAIN Peptides", "AMINO-CHAIN", "AMINO-CHAIN PEPTIDES"}

    return {
        "site_name": default_site_name if raw_site_name in legacy_names else raw_site_name,
        "site_url": raw_site_url or default_site_url,
        "logo_url": raw_logo_url or default_logo,
        "favicon_url": (data.get("favicon_url") or "").strip(),
        "chatbot_icon_url": (data.get("chatbot_icon_url") or "").strip(),
        "admin_email": (data.get("admin_email") or "").strip(),
        "support_email": raw_support_email or "support@123bots.com",
        "maintenance_mode": bool(data.get("maintenance_mode", False)),
        "debug_mode": bool(data.get("debug_mode", False)),
        "require_account_for_checkout": bool(data.get("require_account_for_checkout", False)),
        "require_email_verification_for_registration": data.get("require_email_verification_for_registration", True) is not False,
    }

class BusinessSettings(BaseModel):
    business_name: str = "123Bots"
    logo_url: str = ""  # URL to business logo for invoices/packing slips
    description: str = ""
    address: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    phone: str = "(844) 589-7377"
    email: str = "support@123bots.com"
    website: str = ""
    monday_hours: str = "9:00 AM - 6:00 PM"
    tuesday_hours: str = "9:00 AM - 6:00 PM"
    wednesday_hours: str = "9:00 AM - 6:00 PM"
    thursday_hours: str = "9:00 AM - 6:00 PM"
    friday_hours: str = "9:00 AM - 6:00 PM"
    saturday_hours: str = "10:00 AM - 4:00 PM"
    sunday_hours: str = "Closed"
    # Display toggles
    show_address_on_contact: bool = True
    show_hours_on_contact: bool = True

class TaxRate(BaseModel):
    name: str
    rate: float
    type: str  # state, county, city, other
    active: bool = True

class TaxSettings(BaseModel):
    tax_enabled: bool = True
    tax_calculation: str = "exclusive"  # inclusive or exclusive
    tax_rates: list[TaxRate] = []

class NotificationSettings(BaseModel):
    email_enabled: bool = True
    from_email: str = ""
    from_name: str = ""
    new_order_notify: bool = True
    low_stock_notify: bool = True
    new_customer_notify: bool = False
    daily_report_enabled: bool = True
    daily_report_time: str = "08:00"
    sms_enabled: bool = False
    sms_provider: str = "twilio"
    sms_phone: str = ""


class GalaxyAISettings(BaseModel):
    enabled: bool = False
    api_key: str = ""
    model: str = "gpt-4"
    max_tokens: int = 2000
    temperature: float = 0.7


class HomeBanner(BaseModel):
    id: Optional[str] = None
    image_url: str
    alt_text: str = ""
    link_url: str = ""
    order: int = 0
    active: bool = True


class HomeBannerSettings(BaseModel):
    enabled: bool = True
    auto_scroll: bool = True
    scroll_interval: int = 5  # seconds
    banners: List[HomeBanner] = []


class HeroDisplaySettings(BaseModel):
    """Settings for the hero section promotional card"""
    hero_background_image_url: str = "/legacy-assets/legacy-hero-background.png"
    hero_video_url: str = "/videos/butterfly_alpha.webm"
    hero_card_image_url: str = ""
    hero_card_title: str = "AI-Powered"
    hero_card_subtitle: str = "Commercial Cleaning"
    hero_card_description: str = "Cutting-Edge Cleaning Technology"


class ScreensaverSettings(BaseModel):
    image_a_url: str = "/legacy-assets/2mxzmwy8_logo-bubble-for-sleep-screen.png"
    image_b_url: str = "/legacy-assets/71zcw0f9_logo-bubble-for-sleep-screen-2.png"
    image_a_count: int = 15
    image_b_count: int = 15
    video_url: str = "https://cdn.coverr.co/videos/coverr-waves-in-slow-motion-1579/1080p.mp4"


def _normalize_screensaver_settings(settings: Optional[dict] = None) -> dict:
    defaults = ScreensaverSettings().model_dump()
    data = settings or {}

    image_a_count_raw = data.get("image_a_count", defaults["image_a_count"])
    image_b_count_raw = data.get("image_b_count", defaults["image_b_count"])

    try:
        image_a_count = max(0, min(60, int(image_a_count_raw)))
    except (TypeError, ValueError):
        image_a_count = defaults["image_a_count"]

    try:
        image_b_count = max(0, min(60, int(image_b_count_raw)))
    except (TypeError, ValueError):
        image_b_count = defaults["image_b_count"]

    return {
        "image_a_url": (data.get("image_a_url") or "").strip() or defaults["image_a_url"],
        "image_b_url": (data.get("image_b_url") or "").strip() or defaults["image_b_url"],
        "image_a_count": image_a_count,
        "image_b_count": image_b_count,
        "video_url": (data.get("video_url") or "").strip() or defaults["video_url"],
    }


class CommissionSettings(BaseModel):
    enabled: bool = False  # Toggle to show commission card
    percentage: float = 10.0  # Default 10%
    visible_to_roles: List[str] = ["admin", "store_owner"]  # Who can see it


# ============== Local Pickup Models ==============

class PickupLocation(BaseModel):
    """A single local pickup location"""
    id: Optional[str] = None
    name: str  # e.g., "Main Store", "Warehouse"
    address: str
    city: str
    state: str
    zip_code: str
    phone: Optional[str] = None
    hours: Optional[str] = None  # e.g., "Mon-Fri: 9am-5pm"
    notes: Optional[str] = None  # Special instructions
    active: bool = True


class LocalPickupSettings(BaseModel):
    """Settings for local pickup shipping option"""
    enabled: bool = False
    locations: List[PickupLocation] = []


@router.get("/commission")
async def get_commission_settings(db=Depends(get_db)):
    """Get commission settings (for profit sharing display)"""
    settings = await db.admin_settings.find_one({"type": "commission"})
    if not settings:
        return {
            "enabled": False,
            "percentage": 10.0,
            "visible_to_roles": ["admin", "store_owner"],
            "updated_at": None
        }
    return {
        "enabled": settings.get("enabled", False),
        "percentage": settings.get("percentage", 10.0),
        "visible_to_roles": settings.get("visible_to_roles", ["admin", "store_owner"]),
        "updated_at": settings.get("updated_at")
    }


@router.put("/commission")
async def update_commission_settings(settings: CommissionSettings, db=Depends(get_db)):
    """Update commission settings (super admin only)"""
    now = datetime.now(timezone.utc)
    await db.admin_settings.update_one(
        {"type": "commission"},
        {"$set": {
            "type": "commission",
            "enabled": settings.enabled,
            "percentage": settings.percentage,
            "visible_to_roles": settings.visible_to_roles,
            "updated_at": now.isoformat()
        }},
        upsert=True
    )
    return {"success": True, "message": "Commission settings updated"}


@router.get("/session")
async def get_session_settings(db=Depends(get_db)):
    """Get session timeout settings"""
    settings = await db.admin_settings.find_one({"type": "session"})
    if not settings:
        return SessionSettingsResponse(inactivity_timeout=3, screensaver_timeout=2)
    
    return SessionSettingsResponse(
        inactivity_timeout=settings.get("inactivity_timeout", 3),
        screensaver_timeout=settings.get("screensaver_timeout", 2),
        updated_at=settings.get("updated_at")
    )


@router.put("/session")
async def update_session_settings(settings: SessionSettings, db=Depends(get_db)):
    """Update session timeout settings"""
    await db.admin_settings.update_one(
        {"type": "session"},
        {
            "$set": {
                "type": "session",
                "inactivity_timeout": settings.inactivity_timeout,
                "screensaver_timeout": settings.screensaver_timeout,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    return {
        "success": True,
        "message": "Session settings updated",
        "inactivity_timeout": settings.inactivity_timeout,
        "screensaver_timeout": settings.screensaver_timeout
    }


@router.get("/business")
async def get_business_settings(db=Depends(get_db)):
    """Get business information settings"""
    settings = await db.admin_settings.find_one({"type": "business"})
    if not settings:
        return BusinessSettings()
    
    # Remove MongoDB _id field
    settings.pop("_id", None)
    settings.pop("type", None)
    return settings


@router.put("/business")
async def update_business_settings(settings: BusinessSettings, db=Depends(get_db)):
    """Update business information settings"""
    data = settings.model_dump()
    data["type"] = "business"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.admin_settings.update_one(
        {"type": "business"},
        {"$set": data},
        upsert=True
    )
    
    return {"success": True, "message": "Business settings updated"}


# ============== Johnny 5 Settings Endpoints ==============

@router.get("/johnny5")
async def get_johnny5_settings(db=Depends(get_db)):
    """Get Johnny 5 Portal settings"""
    settings = await db.admin_settings.find_one({"type": "johnny5"})
    if not settings:
        return Johnny5Settings()
    
    settings.pop("_id", None)
    settings.pop("type", None)
    return settings


@router.put("/johnny5")
async def update_johnny5_settings(settings: Johnny5Settings, db=Depends(get_db)):
    """Update Johnny 5 Portal settings"""
    import secrets
    
    data = settings.model_dump()
    data["type"] = "johnny5"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Get existing settings to check if key exists
    existing = await db.admin_settings.find_one({"type": "johnny5"})
    existing_key = existing.get("api_key", "") if existing else ""
    
    # Auto-generate API key if integration is enabled and no key exists
    new_key_generated = False
    if settings.integration_enabled and not settings.api_key and not existing_key:
        data["api_key"] = f"j5_{secrets.token_hex(16)}"
        new_key_generated = True
    elif settings.api_key:
        data["api_key"] = settings.api_key
    else:
        data["api_key"] = existing_key
    
    await db.admin_settings.update_one(
        {"type": "johnny5"},
        {"$set": data},
        upsert=True
    )
    
    # Auto-save API key to .env file
    if data["api_key"] and (new_key_generated or settings.api_key != existing_key):
        _update_env_johnny5_key(data["api_key"])
    
    return {
        "success": True, 
        "message": "Johnny 5 settings updated",
        "api_key": data.get("api_key", "")
    }


@router.post("/johnny5/regenerate-key")
async def regenerate_johnny5_key(db=Depends(get_db)):
    """Regenerate the Johnny 5 API key"""
    import secrets
    
    new_key = f"j5_{secrets.token_hex(16)}"
    
    await db.admin_settings.update_one(
        {"type": "johnny5"},
        {"$set": {"api_key": new_key, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    # Update .env file with new key
    _update_env_johnny5_key(new_key)
    
    return {
        "success": True,
        "message": "API key regenerated and saved to .env",
        "api_key": new_key
    }


def _update_env_johnny5_key(api_key: str):
    """Update JOHNNY5_API_KEY in backend .env file"""
    env_path = "/app/backend/.env"
    
    try:
        # Read existing .env
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                content = f.read()
                lines = content.splitlines(keepends=True)
                # Ensure last line has newline
                if lines and not lines[-1].endswith('\n'):
                    lines[-1] += '\n'
        else:
            lines = []
        
        # Check if JOHNNY5_API_KEY exists
        key_found = False
        new_lines = []
        for line in lines:
            if line.startswith('JOHNNY5_API_KEY='):
                new_lines.append(f'JOHNNY5_API_KEY={api_key}\n')
                key_found = True
            else:
                new_lines.append(line)
        
        # Add if not found
        if not key_found:
            new_lines.append(f'JOHNNY5_API_KEY={api_key}\n')
        
        # Write back
        with open(env_path, 'w') as f:
            f.writelines(new_lines)
            
    except Exception as e:
        print(f"Error updating .env with Johnny 5 key: {e}")


# ============== Printful OAuth App Settings ==============

@router.get("/printful-oauth")
async def get_printful_oauth_settings(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Get shared Printful OAuth app credentials configured in dev settings."""
    _require_admin_token(authorization)

    settings = await db.admin_settings.find_one({"type": "printful_oauth"}, {"_id": 0})
    if not settings:
        return {
            "configured": False,
            "client_id": "",
            "client_secret_masked": "",
            "callback_url": "",
        }

    return {
        "configured": bool((settings.get("client_id") or "").strip() and (settings.get("client_secret") or "").strip()),
        "client_id": settings.get("client_id", ""),
        "client_secret_masked": _mask_secret(settings.get("client_secret", "")),
        "callback_url": _normalize_printful_callback_url(settings.get("callback_url", "")),
        "updated_at": settings.get("updated_at"),
    }


@router.put("/printful-oauth")
async def update_printful_oauth_settings(
    settings: PrintfulOAuthSettings,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Update shared Printful OAuth app credentials."""
    _require_admin_token(authorization)

    existing = await db.admin_settings.find_one({"type": "printful_oauth"}, {"_id": 0}) or {}
    client_id = (settings.client_id or "").strip()
    client_secret = (settings.client_secret or "").strip() or (existing.get("client_secret") or "").strip()
    callback_url = _normalize_printful_callback_url(settings.callback_url)

    if not client_id:
        raise HTTPException(status_code=400, detail="Printful Client ID is required")
    if not client_secret:
        raise HTTPException(status_code=400, detail="Printful Client Secret is required")

    payload = {
        "type": "printful_oauth",
        "client_id": client_id,
        "client_secret": client_secret,
        "callback_url": callback_url,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.admin_settings.update_one(
        {"type": "printful_oauth"},
        {"$set": payload, "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )

    return {
        "success": True,
        "message": "Printful OAuth app settings updated",
        "configured": True,
        "client_id": client_id,
        "client_secret_masked": _mask_secret(client_secret),
        "callback_url": callback_url,
    }


# ============== Site Settings Endpoints ==============

@router.get("/site")
async def get_site_settings(db=Depends(get_db)):
    """Get site settings (logo, favicon, maintenance mode, etc.)"""
    settings = await db.admin_settings.find_one({"type": "site"})
    if not settings:
        return SiteSettings()
    
    settings.pop("_id", None)
    settings.pop("type", None)
    return SiteSettings(**_normalized_site_settings(settings))


@router.put("/site")
async def update_site_settings(settings: SiteSettings, db=Depends(get_db)):
    """Update site settings"""
    data = settings.model_dump()
    data["type"] = "site"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.admin_settings.update_one(
        {"type": "site"},
        {"$set": data},
        upsert=True
    )
    
    return {"success": True, "message": "Site settings updated"}


# ============== Feature Flags ==============

class FeatureFlags(BaseModel):
    cart_enabled: bool = True
    pawn_checkout: bool = True
    storage_online: bool = False
    storage_pos: bool = False
    ai_products: bool = True
    notifications: bool = False
    sms: bool = False
    analytics: bool = True
    printful_enabled: bool = False
    yoycol_enabled: bool = False
    owner_chat_enabled: bool = False
    owner_chat_ai_enabled: bool = False
    left_menu_enabled: bool = True  # Show/hide left accordion menu on product pages
    coming_soon_enabled: bool = True  # Show coming soon password gate
    coming_soon_password: str = "8487"  # Password to bypass coming soon gate
    quotes_enabled: bool = True  # Show/hide quote system UI everywhere
    external_api_enabled: bool = True  # Show/hide External Stack API Delivery features
    inventory_enabled: bool = False  # Show/hide Inventory Management sidebar
    events_enabled: bool = False  # Show/hide Event Center (admin + storefront)
    events_landing_enabled: bool = False  # /events uses the custom landing page instead of the site-template list
    events_center_name: str = "Event Center"  # Configurable display name for the Event Center
    activity_marketplace_enabled: bool = False  # Show/hide Tours / Charters activity directory (admin + storefront)
    fareharbor_api_app: str = ""  # FareHarbor partner API "X-FareHarbor-API-App" header value
    fareharbor_api_user: str = ""  # FareHarbor partner API "X-FareHarbor-API-User" header value


def _mask_secret(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 4:
        return "••••"
    return f"••••{value[-4:]}"


@router.get("/feature-flags")
async def get_feature_flags(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Get feature flags"""
    _require_admin_token(authorization)
    
    settings = await db.admin_settings.find_one({"type": "feature_flags"})
    if not settings:
        return FeatureFlags().model_dump()
    
    settings.pop("_id", None)
    settings.pop("type", None)
    settings.pop("updated_at", None)
    for secret_field in ("fareharbor_api_app", "fareharbor_api_user"):
        if settings.get(secret_field):
            settings[secret_field] = _mask_secret(settings[secret_field])
    return settings


@router.put("/feature-flags")
async def update_feature_flags(
    flags: FeatureFlags,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Update feature flags"""
    _require_admin_token(authorization)
    
    data = flags.model_dump()
    existing = await db.admin_settings.find_one({"type": "feature_flags"}, {"_id": 0}) or {}
    for secret_field in ("fareharbor_api_app", "fareharbor_api_user"):
        if data.get(secret_field, "").startswith("••••"):
            data[secret_field] = existing.get(secret_field, "")
    data["type"] = "feature_flags"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.admin_settings.update_one(
        {"type": "feature_flags"},
        {"$set": data},
        upsert=True
    )
    
    return {"success": True, "message": "Feature flags updated"}


@public_router.get("/feature-flags")
async def get_public_feature_flags(db=Depends(get_db)):
    """Get public-safe feature flag values for client UI gating"""
    settings = await db.admin_settings.find_one(
        {"type": "feature_flags"},
        {
            "_id": 0,
            "cart_enabled": 1,
            "pawn_checkout": 1,
            "storage_online": 1,
            "storage_pos": 1,
            "ai_products": 1,
            "notifications": 1,
            "sms": 1,
            "analytics": 1,
            "printful_enabled": 1,
            "yoycol_enabled": 1,
            "owner_chat_enabled": 1,
            "owner_chat_ai_enabled": 1,
            "left_menu_enabled": 1,
            "coming_soon_enabled": 1,
            "coming_soon_password": 1,
            "quotes_enabled": 1,
            "external_api_enabled": 1,
            "inventory_enabled": 1,
            "events_enabled": 1,
            "events_landing_enabled": 1,
            "events_center_name": 1,
            "activity_marketplace_enabled": 1,
        },
    )
    return {
        "cart_enabled": bool(settings.get("cart_enabled", True)) if settings else True,
        "pawn_checkout": bool(settings.get("pawn_checkout", True)) if settings else True,
        "storage_online": bool(settings.get("storage_online", False)) if settings else False,
        "storage_pos": bool(settings.get("storage_pos", False)) if settings else False,
        "ai_products": bool(settings.get("ai_products", True)) if settings else True,
        "notifications": bool(settings.get("notifications", False)) if settings else False,
        "sms": bool(settings.get("sms", False)) if settings else False,
        "analytics": bool(settings.get("analytics", True)) if settings else True,
        "printful_enabled": bool(settings.get("printful_enabled", False)) if settings else False,
        "yoycol_enabled": bool(settings.get("yoycol_enabled", False)) if settings else False,
        "owner_chat_enabled": bool(settings.get("owner_chat_enabled", False)) if settings else False,
        "owner_chat_ai_enabled": bool(settings.get("owner_chat_ai_enabled", False)) if settings else False,
        "left_menu_enabled": bool(settings.get("left_menu_enabled", True)) if settings else True,
        "coming_soon_enabled": bool(settings.get("coming_soon_enabled", True)) if settings else True,
        "coming_soon_password": settings.get("coming_soon_password", "8487") if settings else "8487",
        "quotes_enabled": bool(settings.get("quotes_enabled", True)) if settings else True,
        "external_api_enabled": bool(settings.get("external_api_enabled", True)) if settings else True,
        "inventory_enabled": bool(settings.get("inventory_enabled", False)) if settings else False,
        "events_enabled": bool(settings.get("events_enabled", False)) if settings else False,
        "events_landing_enabled": bool(settings.get("events_landing_enabled", False)) if settings else False,
        "events_center_name": (settings.get("events_center_name") if settings else None) or "Event Center",
        "activity_marketplace_enabled": bool(settings.get("activity_marketplace_enabled", False)) if settings else False,
    }


# ============== AI Keys ==============

class AIKeyConfig(BaseModel):
    enabled: bool = False
    api_key: str = ""


@router.get("/ai-keys")
async def get_ai_keys(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Get all AI keys configuration"""
    _require_admin_token(authorization)
    
    settings = await db.admin_settings.find_one({"type": "ai_keys"})
    if not settings:
        return {
            "openai": {"enabled": False, "api_key": ""},
            "elevenlabs": {"enabled": False, "api_key": ""},
            "apifree": {"enabled": False, "api_key": ""},
            "anthropic": {"enabled": False, "api_key": ""}
        }
    
    settings.pop("_id", None)
    settings.pop("type", None)
    settings.pop("updated_at", None)
    return settings


@router.put("/ai-keys/{provider_id}")
async def update_ai_key(
    provider_id: str,
    config: AIKeyConfig,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Update a specific AI provider key"""
    _require_admin_token(authorization)
    
    valid_providers = ["openai", "elevenlabs", "apifree", "anthropic"]
    if provider_id not in valid_providers:
        raise HTTPException(status_code=400, detail=f"Invalid provider. Must be one of: {valid_providers}")
    
    # Get existing settings
    settings = await db.admin_settings.find_one({"type": "ai_keys"}) or {"type": "ai_keys"}
    settings.pop("_id", None)
    
    # Update the specific provider
    settings[provider_id] = config.model_dump()
    settings["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.admin_settings.update_one(
        {"type": "ai_keys"},
        {"$set": settings},
        upsert=True
    )
    
    return {"success": True, "message": f"{provider_id} API key updated"}


@router.delete("/ai-keys/{provider_id}")
async def delete_ai_key(
    provider_id: str,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Delete a specific AI provider key"""
    _require_admin_token(authorization)
    
    valid_providers = ["openai", "elevenlabs", "apifree", "anthropic"]
    if provider_id not in valid_providers:
        raise HTTPException(status_code=400, detail=f"Invalid provider. Must be one of: {valid_providers}")
    
    # Get existing settings
    settings = await db.admin_settings.find_one({"type": "ai_keys"}) or {"type": "ai_keys"}
    settings.pop("_id", None)
    
    # Clear the specific provider
    settings[provider_id] = {"enabled": False, "api_key": ""}
    settings["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.admin_settings.update_one(
        {"type": "ai_keys"},
        {"$set": settings},
        upsert=True
    )
    
    return {"success": True, "message": f"{provider_id} API key removed"}


@router.get("/tax")
async def get_tax_settings(db=Depends(get_db)):
    """Get tax settings"""
    settings = await db.admin_settings.find_one({"type": "tax"})
    if not settings:
        # Return default Alabama tax rates
        return TaxSettings(
            tax_enabled=True,
            tax_calculation="exclusive",
            tax_rates=[
                TaxRate(name="Alabama State Tax", rate=4.0, type="state", active=True),
                TaxRate(name="Houston County", rate=3.0, type="county", active=True),
                TaxRate(name="Dothan City", rate=2.0, type="city", active=True),
            ]
        )
    
    settings.pop("_id", None)
    settings.pop("type", None)
    return settings


@router.put("/tax")
async def update_tax_settings(settings: TaxSettings, db=Depends(get_db)):
    """Update tax settings"""
    data = settings.model_dump()
    data["type"] = "tax"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.admin_settings.update_one(
        {"type": "tax"},
        {"$set": data},
        upsert=True
    )
    
    return {"success": True, "message": "Tax settings updated"}


@router.get("/notifications")
async def get_notification_settings(db=Depends(get_db)):
    """Get notification settings"""
    settings = await db.admin_settings.find_one({"type": "notifications"})
    if not settings:
        return NotificationSettings()
    
    settings.pop("_id", None)
    settings.pop("type", None)
    return settings


@router.put("/notifications")
async def update_notification_settings(settings: NotificationSettings, db=Depends(get_db)):
    """Update notification settings"""
    data = settings.model_dump()
    data["type"] = "notifications"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.admin_settings.update_one(
        {"type": "notifications"},
        {"$set": data},
        upsert=True
    )
    
    return {"success": True, "message": "Notification settings updated"}


# ============ HOME BANNER SETTINGS ============

@router.get("/home-banners")
async def get_home_banner_settings(db=Depends(get_db)):
    """Get home page banner settings"""
    settings = await db.admin_settings.find_one({"type": "home_banners"})
    if not settings:
        return HomeBannerSettings()
    
    settings.pop("_id", None)
    settings.pop("type", None)
    return settings


@router.put("/home-banners")
async def update_home_banner_settings(settings: HomeBannerSettings, db=Depends(get_db)):
    """Update home page banner settings"""
    data = settings.model_dump()
    data["type"] = "home_banners"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.admin_settings.update_one(
        {"type": "home_banners"},
        {"$set": data},
        upsert=True
    )
    
    return {"success": True, "message": "Home banner settings updated"}


@router.post("/home-banners/add")
async def add_home_banner(banner: HomeBanner, db=Depends(get_db)):
    """Add a new banner to home page"""
    import uuid
    
    settings = await db.admin_settings.find_one({"type": "home_banners"})
    if not settings:
        settings = {"type": "home_banners", "enabled": True, "auto_scroll": True, "scroll_interval": 5, "banners": []}
    
    banners = settings.get("banners", [])
    
    # Generate unique ID for banner
    new_banner = banner.model_dump()
    new_banner["id"] = str(uuid.uuid4())
    new_banner["order"] = len(banners)
    
    banners.append(new_banner)
    
    await db.admin_settings.update_one(
        {"type": "home_banners"},
        {"$set": {"banners": banners, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"success": True, "message": "Banner added", "banner": new_banner}


@router.delete("/home-banners/{banner_id}")
async def delete_home_banner(banner_id: str, db=Depends(get_db)):
    """Delete a banner from home page"""
    settings = await db.admin_settings.find_one({"type": "home_banners"})
    if not settings:
        raise HTTPException(status_code=404, detail="No banner settings found")
    
    banners = settings.get("banners", [])
    banners = [b for b in banners if b.get("id") != banner_id]
    
    # Re-order remaining banners
    for i, b in enumerate(banners):
        b["order"] = i
    
    await db.admin_settings.update_one(
        {"type": "home_banners"},
        {"$set": {"banners": banners, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": "Banner deleted"}


@router.put("/home-banners/reorder")
async def reorder_home_banners(banner_ids: List[str], db=Depends(get_db)):
    """Reorder banners by providing new order of IDs"""
    settings = await db.admin_settings.find_one({"type": "home_banners"})
    if not settings:
        raise HTTPException(status_code=404, detail="No banner settings found")
    
    banners = settings.get("banners", [])
    banner_map = {b["id"]: b for b in banners}
    
    reordered = []
    for i, bid in enumerate(banner_ids):
        if bid in banner_map:
            banner_map[bid]["order"] = i
            reordered.append(banner_map[bid])
    
    await db.admin_settings.update_one(
        {"type": "home_banners"},
        {"$set": {"banners": reordered, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": "Banners reordered"}


# ============ GALAXY AI SETTINGS ============

@router.get("/galaxy-ai")
async def get_galaxy_ai_settings(db=Depends(get_db)):
    """Get Galaxy AI settings"""
    settings = await db.admin_settings.find_one({"type": "galaxy_ai"})
    if not settings:
        return GalaxyAISettings()
    
    settings.pop("_id", None)
    settings.pop("type", None)
    return settings


@router.put("/galaxy-ai")
async def update_galaxy_ai_settings(settings: GalaxyAISettings, db=Depends(get_db)):
    """Update Galaxy AI settings"""
    data = settings.model_dump()
    data["type"] = "galaxy_ai"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.admin_settings.update_one(
        {"type": "galaxy_ai"},
        {"$set": data},
        upsert=True
    )
    
    return {"success": True, "message": "Galaxy AI settings updated"}


# ============ HERO DISPLAY SETTINGS ============

@router.get("/hero-display")
async def get_hero_display_settings(db=Depends(get_db)):
    """Get hero section display settings"""
    settings = await db.admin_settings.find_one({"type": "hero_display"})
    default_bg = "/legacy-assets/legacy-hero-background.png"
    default_video = "/videos/butterfly_alpha.webm"
    default_card = "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&w=1000&q=80"

    if not settings:
        return HeroDisplaySettings(hero_card_image_url=default_card)
    
    settings.pop("_id", None)
    settings.pop("type", None)
    return {
        "hero_background_image_url": settings.get("hero_background_image_url") or default_bg,
        "hero_video_url": settings.get("hero_video_url") or default_video,
        "hero_card_image_url": settings.get("hero_card_image_url") or default_card,
        "hero_card_title": settings.get("hero_card_title", "AI-Powered"),
        "hero_card_subtitle": settings.get("hero_card_subtitle", "Commercial Cleaning"),
        "hero_card_description": settings.get("hero_card_description", "Cutting-Edge Cleaning Technology"),
    }


@router.put("/hero-display")
async def update_hero_display_settings(settings: HeroDisplaySettings, db=Depends(get_db)):
    """Update hero section display settings"""
    data = settings.model_dump()
    data["type"] = "hero_display"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.admin_settings.update_one(
        {"type": "hero_display"},
        {"$set": data},
        upsert=True
    )
    
    return {"success": True, "message": "Hero display settings updated"}


# ============ SCREENSAVER SETTINGS ============

@router.get("/screensaver")
async def get_screensaver_settings(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Get admin screensaver asset and quantity settings"""
    _require_admin_token(authorization)

    settings = await db.admin_settings.find_one({"type": "screensaver_settings"}, {"_id": 0})
    normalized = _normalize_screensaver_settings(settings)
    return {
        **normalized,
        "updated_at": settings.get("updated_at") if settings else None,
    }


@router.put("/screensaver")
async def update_screensaver_settings(
    settings: ScreensaverSettings,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    """Update admin screensaver asset and quantity settings"""
    _require_admin_token(authorization)

    normalized = _normalize_screensaver_settings(settings.model_dump())
    payload = {
        "type": "screensaver_settings",
        **normalized,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.admin_settings.update_one(
        {"type": "screensaver_settings"},
        {"$set": payload, "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )

    return {
        "success": True,
        "message": "Screensaver settings updated",
        **normalized,
    }


# ============== System Backup & Restore Endpoints ==============

@router.get("/system-backup/list")
async def list_system_backups(authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)

    backups = await db.system_backups.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=100)
    return {
        "success": True,
        "backups": backups,
        "retention_count": BACKUP_RETENTION_COUNT,
    }


@router.post("/system-backup/create", response_model=BackupRestoreResponse)
async def create_system_backup(authorization: Optional[str] = Header(None), db=Depends(get_db)):
    admin_user = _require_admin_token(authorization)
    _ensure_backup_folder()

    backup_id = str(ObjectId())
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    file_name = f"full_system_backup_{timestamp}_{backup_id[-6:]}.zip"
    backup_path = BACKUP_STORAGE_ROOT / file_name

    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        raise HTTPException(status_code=500, detail="Missing MONGO_URL or DB_NAME")

    try:
        created_at = datetime.now(timezone.utc).isoformat()

        await db.system_backups.insert_one({
            "id": backup_id,
            "file_name": file_name,
            "file_path": str(backup_path),
            "file_size": 0,
            "created_at": created_at,
            "created_by": admin_user.get("email"),
            "contains_env": False,
            "status": "processing",
        })

        asyncio.create_task(
            _execute_backup_job(
                db=db,
                backup_id=backup_id,
                file_name=file_name,
                admin_email=admin_user.get("email", "system"),
                mongo_url=mongo_url,
                db_name=db_name,
            )
        )

        return BackupRestoreResponse(
            success=True,
            message="Backup creation started",
            backup_id=backup_id,
            file_name=file_name,
            created_at=created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup creation failed: {str(e)}")


@router.get("/system-backup/download/{backup_id}")
async def download_system_backup(backup_id: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)

    backup = await db.system_backups.find_one({"id": backup_id}, {"_id": 0})
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")

    if backup.get("status") == "processing":
        raise HTTPException(status_code=409, detail="Backup is still processing")
    if backup.get("status") == "failed":
        raise HTTPException(status_code=500, detail=backup.get("error", "Backup failed"))

    file_path = backup.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Backup file no longer exists")

    return FileResponse(
        path=file_path,
        media_type="application/zip",
        filename=backup.get("file_name", "system_backup.zip"),
    )


@router.delete("/system-backup/{backup_id}")
async def delete_system_backup(backup_id: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)

    backup = await db.system_backups.find_one({"id": backup_id}, {"_id": 0})
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")

    if backup.get("status") == "processing":
        raise HTTPException(status_code=409, detail="Cannot delete backup while it is still processing")

    file_path = backup.get("file_path")
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete backup file: {str(e)}")

    await db.system_backups.delete_one({"id": backup_id})

    return {
        "success": True,
        "message": "Backup deleted",
        "backup_id": backup_id,
    }


@router.post("/system-backup/delete-bulk")
async def delete_backups_bulk(payload: BackupBulkDeleteRequest, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)

    backup_ids = [bid for bid in (payload.backup_ids or []) if bid]
    if not backup_ids:
        raise HTTPException(status_code=400, detail="No backup IDs provided")

    deleted = []
    skipped = []

    backups = await db.system_backups.find({"id": {"$in": backup_ids}}, {"_id": 0}).to_list(length=500)
    backup_map = {b.get("id"): b for b in backups}

    for backup_id in backup_ids:
        backup = backup_map.get(backup_id)
        if not backup:
            skipped.append({"backup_id": backup_id, "reason": "not_found"})
            continue

        if backup.get("status") == "processing":
            skipped.append({"backup_id": backup_id, "reason": "processing"})
            continue

        file_path = backup.get("file_path")
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                skipped.append({"backup_id": backup_id, "reason": "file_delete_failed"})
                continue

        await db.system_backups.delete_one({"id": backup_id})
        deleted.append(backup_id)

    return {
        "success": True,
        "deleted": deleted,
        "skipped": skipped,
    }


@router.post("/system-backup/restore", response_model=BackupRestoreResponse)
async def restore_system_backup(
    backup_file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
):
    admin_user = _require_admin_token(authorization)

    file_name = (backup_file.filename or "").lower()
    if not file_name.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip backup files are supported")

    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        raise HTTPException(status_code=500, detail="Missing MONGO_URL or DB_NAME")

    restore_id = str(ObjectId())
    try:
        with tempfile.TemporaryDirectory(prefix="system_restore_") as temp_dir:
            temp_path = Path(temp_dir)
            zip_path = temp_path / "restore_upload.zip"
            zip_path.write_bytes(await backup_file.read())

            extract_path = temp_path / "extract"
            extract_path.mkdir(parents=True, exist_ok=True)

            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                zip_ref.extractall(extract_path)

            # Restore uploaded files (product images, tax certs, chat attachments, etc.)
            # Deliberately does NOT restore app code from the zip: this container's
            # code comes from the deployed git image, and overwriting it on disk
            # from an uploaded backup would desync the running process from what's
            # actually deployed - safe to skip since the source is in git, not here.
            source_uploads = extract_path / "uploads"
            if source_uploads.exists() and source_uploads.is_dir():
                shutil.copytree(source_uploads, Path("/app/uploads"), dirs_exist_ok=True)

            restored_db = False

            # Preferred portable restore path (works even when mongorestore is unavailable)
            json_dump_root = extract_path / "mongodb_json_dump"
            if json_dump_root.exists() and json_dump_root.is_dir():
                await _restore_db_from_json_dump(db, json_dump_root)
                restored_db = True

            # Legacy mongodump/mongorestore path fallback
            if not restored_db:
                dump_root = extract_path / "mongodb_dump"
                if dump_root.exists() and dump_root.is_dir():
                    db_dump_path = dump_root / db_name
                    if not db_dump_path.exists():
                        subdirs = [p for p in dump_root.iterdir() if p.is_dir()]
                        if subdirs:
                            db_dump_path = subdirs[0]

                    if db_dump_path.exists():
                        if shutil.which("mongorestore") is None:
                            raise HTTPException(
                                status_code=500,
                                detail="Backup contains only mongodump format but mongorestore is unavailable on this server",
                            )

                        restore_cmd = [
                            "mongorestore",
                            f"--uri={mongo_url}",
                            "--drop",
                            f"--db={db_name}",
                            str(db_dump_path),
                        ]
                        restore_proc = subprocess.run(restore_cmd, capture_output=True, text=True)
                        if restore_proc.returncode != 0:
                            raise HTTPException(status_code=500, detail=f"mongorestore failed: {restore_proc.stderr[:500]}")
                        restored_db = True

            if not restored_db:
                raise HTTPException(status_code=400, detail="No database dump found inside backup ZIP")

        await db.system_backup_restores.insert_one({
            "id": restore_id,
            "file_name": backup_file.filename,
            "restored_at": datetime.now(timezone.utc).isoformat(),
            "restored_by": admin_user.get("email"),
            "status": "completed",
        })

        return BackupRestoreResponse(
            success=True,
            message="Backup restored successfully",
            backup_id=restore_id,
            file_name=backup_file.filename,
            created_at=datetime.now(timezone.utc).isoformat(),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")



# ============== Public Settings Endpoints (No Auth Required) ==============

@public_router.get("/business")
async def get_public_business_settings(db=Depends(get_db)):
    """Get business information for public display (no auth required)"""
    settings = await db.admin_settings.find_one({"type": "business"})
    
    # Return default values if no settings exist
    if not settings:
        return {
            "business_name": "123Bots",
            "phone": "",
            "email": "support@123bots.com",
            "website": "https://123bots.com",
            "address": "",
            "city": "",
            "state": "",
            "zip_code": "",
            "monday_hours": "9:00 AM - 6:00 PM",
            "tuesday_hours": "9:00 AM - 6:00 PM",
            "wednesday_hours": "9:00 AM - 6:00 PM",
            "thursday_hours": "9:00 AM - 6:00 PM",
            "friday_hours": "9:00 AM - 6:00 PM",
            "saturday_hours": "10:00 AM - 4:00 PM",
            "sunday_hours": "Closed",
            "show_address_on_contact": True,
            "show_hours_on_contact": True
        }
    
    # Return only public-safe fields
    return {
        "business_name": settings.get("business_name", "123Bots"),
        "phone": settings.get("phone", ""),
        "email": settings.get("email", "support@123bots.com"),
        "website": settings.get("website", "https://123bots.com"),
        "address": settings.get("address", ""),
        "city": settings.get("city", ""),
        "state": settings.get("state", ""),
        "zip_code": settings.get("zip_code", ""),
        "monday_hours": settings.get("monday_hours", "9:00 AM - 6:00 PM"),
        "tuesday_hours": settings.get("tuesday_hours", "9:00 AM - 6:00 PM"),
        "wednesday_hours": settings.get("wednesday_hours", "9:00 AM - 6:00 PM"),
        "thursday_hours": settings.get("thursday_hours", "9:00 AM - 6:00 PM"),
        "friday_hours": settings.get("friday_hours", "9:00 AM - 6:00 PM"),
        "saturday_hours": settings.get("saturday_hours", "10:00 AM - 4:00 PM"),
        "sunday_hours": settings.get("sunday_hours", "Closed"),
        "show_address_on_contact": settings.get("show_address_on_contact", True),
        "show_hours_on_contact": settings.get("show_hours_on_contact", True)
    }



@public_router.get("/johnny5")
async def get_public_johnny5_settings(db=Depends(get_db)):
    """Get Johnny 5 settings for public display (menu visibility)"""
    settings = await db.admin_settings.find_one({"type": "johnny5"})
    
    if not settings:
        return {
            "show_menu": False,
            "integration_enabled": False
        }
    
    return {
        "show_menu": settings.get("show_menu", False),
        "integration_enabled": settings.get("integration_enabled", False)
    }


# ============== Local Pickup Endpoints ==============

@router.get("/local-pickup")
async def get_local_pickup_settings(db=Depends(get_db)):
    """Get local pickup settings"""
    settings = await db.admin_settings.find_one({"type": "local_pickup"})
    if not settings:
        return LocalPickupSettings()
    
    settings.pop("_id", None)
    settings.pop("type", None)
    return settings


@router.put("/local-pickup")
async def update_local_pickup_settings(settings: LocalPickupSettings, db=Depends(get_db)):
    """Update local pickup settings (enable/disable and manage locations)"""
    import uuid
    
    data = settings.model_dump()
    data["type"] = "local_pickup"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Ensure each location has an ID
    for loc in data.get("locations", []):
        if not loc.get("id"):
            loc["id"] = str(uuid.uuid4())
    
    await db.admin_settings.update_one(
        {"type": "local_pickup"},
        {"$set": data},
        upsert=True
    )
    
    return {"success": True, "message": "Local pickup settings updated"}


@router.post("/local-pickup/locations")
async def add_pickup_location(location: PickupLocation, db=Depends(get_db)):
    """Add a new pickup location"""
    import uuid
    
    settings = await db.admin_settings.find_one({"type": "local_pickup"})
    if not settings:
        settings = {"type": "local_pickup", "enabled": False, "locations": []}
    
    locations = settings.get("locations", [])
    
    # Generate unique ID for location
    new_location = location.model_dump()
    new_location["id"] = str(uuid.uuid4())
    
    locations.append(new_location)
    
    await db.admin_settings.update_one(
        {"type": "local_pickup"},
        {"$set": {"locations": locations, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"success": True, "message": "Location added", "location": new_location}


@router.put("/local-pickup/locations/{location_id}")
async def update_pickup_location(location_id: str, location: PickupLocation, db=Depends(get_db)):
    """Update a pickup location"""
    settings = await db.admin_settings.find_one({"type": "local_pickup"})
    if not settings:
        raise HTTPException(status_code=404, detail="No local pickup settings found")
    
    locations = settings.get("locations", [])
    found = False
    
    for i, loc in enumerate(locations):
        if loc.get("id") == location_id:
            updated_loc = location.model_dump()
            updated_loc["id"] = location_id  # Preserve the ID
            locations[i] = updated_loc
            found = True
            break
    
    if not found:
        raise HTTPException(status_code=404, detail="Location not found")
    
    await db.admin_settings.update_one(
        {"type": "local_pickup"},
        {"$set": {"locations": locations, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": "Location updated"}


@router.delete("/local-pickup/locations/{location_id}")
async def delete_pickup_location(location_id: str, db=Depends(get_db)):
    """Delete a pickup location"""
    settings = await db.admin_settings.find_one({"type": "local_pickup"})
    if not settings:
        raise HTTPException(status_code=404, detail="No local pickup settings found")
    
    locations = settings.get("locations", [])
    original_count = len(locations)
    locations = [loc for loc in locations if loc.get("id") != location_id]
    
    if len(locations) == original_count:
        raise HTTPException(status_code=404, detail="Location not found")
    
    await db.admin_settings.update_one(
        {"type": "local_pickup"},
        {"$set": {"locations": locations, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": "Location deleted"}


@public_router.get("/local-pickup")
async def get_public_local_pickup_settings(db=Depends(get_db)):
    """Get local pickup settings for checkout (public, no auth required)"""
    settings = await db.admin_settings.find_one({"type": "local_pickup"})
    
    if not settings or not settings.get("enabled"):
        return {
            "enabled": False,
            "locations": []
        }
    
    # Return only active locations for public use
    active_locations = [
        {
            "id": loc.get("id"),
            "name": loc.get("name"),
            "address": loc.get("address"),
            "city": loc.get("city"),
            "state": loc.get("state"),
            "zip_code": loc.get("zip_code"),
            "phone": loc.get("phone"),
            "hours": loc.get("hours"),
            "notes": loc.get("notes")
        }
        for loc in settings.get("locations", [])
        if loc.get("active", True)
    ]
    
    return {
        "enabled": True,
        "locations": active_locations
    }



@public_router.get("/site")
async def get_public_site_settings(db=Depends(get_db)):
    """Get site settings for public display (logo, favicon, site name, maintenance mode)"""
    settings = await db.admin_settings.find_one({"type": "site"})

    return _normalized_site_settings(settings)


@public_router.get("/hero-display")
async def get_public_hero_display_settings(db=Depends(get_db)):
    """Get hero display settings for public display (no auth required)"""
    settings = await db.admin_settings.find_one({"type": "hero_display"})
    
    default_bg = "/legacy-assets/legacy-hero-background.png"
    default_video = "/videos/butterfly_alpha.webm"
    default_image = "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&w=1000&q=80"
    
    if not settings:
        return {
            "hero_background_image_url": default_bg,
            "hero_video_url": default_video,
            "hero_card_image_url": default_image,
            "hero_card_title": "AI-Powered",
            "hero_card_subtitle": "Commercial Cleaning",
            "hero_card_description": "Cutting-Edge Cleaning Technology"
        }
    
    return {
        "hero_background_image_url": settings.get("hero_background_image_url") or default_bg,
        "hero_video_url": settings.get("hero_video_url") or default_video,
        "hero_card_image_url": settings.get("hero_card_image_url") or default_image,
        "hero_card_title": settings.get("hero_card_title", "AI-Powered"),
        "hero_card_subtitle": settings.get("hero_card_subtitle", "Commercial Cleaning"),
        "hero_card_description": settings.get("hero_card_description", "Cutting-Edge Cleaning Technology")
    }
