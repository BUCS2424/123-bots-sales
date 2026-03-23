from datetime import datetime, timezone
from typing import Optional, Dict
import base64
import hmac
import hashlib
import uuid
import random
import string

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from auth import decode_token

router = APIRouter(prefix="/api/yoycol", tags=["yoycol"])

_db = None


def set_database(database):
    global _db
    _db = database


async def get_db():
    return _db


ALLOWED_ROLES = {"super_admin", "admin", "store_owner"}
YOYCOL_BASE_URL = "https://www.yoycol.com"
YOYCOL_DEFAULT_PATH = "/api/2025/open/v4/catalog/products"


def _require_owner_or_admin(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")

    token = authorization.split("Bearer ", 1)[1].strip()
    token_data = decode_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    role = (token_data.role or "").strip()
    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=403, detail="Store owner or admin access required")

    return {
        "user_id": token_data.user_id,
        "email": token_data.email,
        "role": role,
    }


async def _assert_yoycol_enabled(db, role: str):
    if role == "super_admin":
        return

    feature_flags = await db.admin_settings.find_one(
        {"type": "feature_flags"},
        {"_id": 0, "yoycol_enabled": 1},
    )
    is_enabled = bool(feature_flags.get("yoycol_enabled", False)) if feature_flags else False
    if not is_enabled:
        raise HTTPException(status_code=403, detail="YOYCOL is currently disabled by feature flag")


def _mask_secret(secret_value: Optional[str]) -> str:
    value = (secret_value or "").strip()
    if not value:
        return ""
    if len(value) <= 8:
        return "*" * len(value)
    return f"{value[:4]}{'*' * (len(value) - 8)}{value[-4:]}"


def _generate_nonce(length: int = 32) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choice(chars) for _ in range(length))


def _build_sorted_param_string(params: Dict[str, str]) -> str:
    items = sorted((str(k), str(v)) for k, v in params.items())
    return "&".join(f"{key}={value}" for key, value in items)


def _build_signature(
    method: str,
    path: str,
    params: Dict[str, str],
    access_key: str,
    secret_key: str,
    timestamp_ms: str,
    nonce: str,
    algorithm: str,
    version: str,
) -> str:
    param_str = _build_sorted_param_string(params)

    signature_data = (
        f"method={method.upper()}\n"
        f"path={path}\n"
        f"timestamp={timestamp_ms}\n"
        f"nonce={nonce}\n"
        f"accessKey={access_key}\n"
        f"algorithm={algorithm}\n"
        f"version={version}"
    )
    if param_str:
        signature_data += f"\nparams={param_str}"

    digest = hmac.new(
        secret_key.encode("utf-8"),
        signature_data.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return base64.b64encode(digest).decode("utf-8")


class YoocolCredentialInput(BaseModel):
    access_key: str = Field(..., min_length=6)
    secret_key: str = Field(..., min_length=10)


class YoocolValidationRequest(BaseModel):
    use_stored: bool = False
    access_key: Optional[str] = None
    secret_key: Optional[str] = None


@router.get("/credentials")
async def get_yoycol_credentials(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    auth_user = _require_owner_or_admin(authorization)
    await _assert_yoycol_enabled(db, auth_user["role"])

    doc = await db.yoycol_credentials.find_one({"user_id": auth_user["user_id"]}, {"_id": 0})
    if not doc:
        return {
            "configured": False,
            "access_key_masked": "",
            "secret_key_masked": "",
            "updated_at": None,
            "last_validation_status": None,
            "last_validated_at": None,
        }

    return {
        "configured": True,
        "access_key_masked": _mask_secret(doc.get("access_key", "")),
        "secret_key_masked": _mask_secret(doc.get("secret_key", "")),
        "updated_at": doc.get("updated_at"),
        "last_validation_status": doc.get("last_validation_status"),
        "last_validated_at": doc.get("last_validated_at"),
    }


@router.put("/credentials")
async def upsert_yoycol_credentials(
    payload: YoocolCredentialInput,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    auth_user = _require_owner_or_admin(authorization)
    await _assert_yoycol_enabled(db, auth_user["role"])

    now_iso = datetime.now(timezone.utc).isoformat()
    existing = await db.yoycol_credentials.find_one({"user_id": auth_user["user_id"]}, {"_id": 0, "id": 1})
    credential_id = existing.get("id") if existing else str(uuid.uuid4())

    await db.yoycol_credentials.update_one(
        {"user_id": auth_user["user_id"]},
        {
            "$set": {
                "id": credential_id,
                "user_id": auth_user["user_id"],
                "user_email": auth_user["email"],
                "access_key": payload.access_key.strip(),
                "secret_key": payload.secret_key.strip(),
                "updated_at": now_iso,
            },
            "$setOnInsert": {"created_at": now_iso},
        },
        upsert=True,
    )

    return {
        "success": True,
        "message": "YOYCOL credentials saved",
    }


async def _validate_yoycol_access(access_key: str, secret_key: str) -> tuple[bool, str]:
    method = "GET"
    path = YOYCOL_DEFAULT_PATH
    params = {"page": "1", "size": "1"}
    timestamp_ms = str(int(datetime.now(timezone.utc).timestamp() * 1000))
    nonce = _generate_nonce(32)
    algorithm = "HmacSHA256"
    version = "4.0"

    signature = _build_signature(
        method=method,
        path=path,
        params=params,
        access_key=access_key,
        secret_key=secret_key,
        timestamp_ms=timestamp_ms,
        nonce=nonce,
        algorithm=algorithm,
        version=version,
    )

    headers = {
        "X-API-Access-Key": access_key,
        "X-API-Timestamp": timestamp_ms,
        "X-API-Nonce": nonce,
        "X-API-Algorithm": algorithm,
        "X-API-Version": version,
        "X-API-Signature": signature,
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(f"{YOYCOL_BASE_URL}{path}", params=params, headers=headers)
    except Exception:
        return False, "Could not reach YOYCOL API"

    if response.status_code != 200:
        return False, f"YOYCOL rejected credentials (status {response.status_code})"

    body = response.json() if response.content else {}
    code = str(body.get("code", ""))
    msg = body.get("msg") or body.get("message") or "Unknown response"

    if code != "100000":
        return False, f"YOYCOL authentication failed: {msg}"

    return True, "YOYCOL credentials validated successfully"


@router.post("/validate")
async def validate_yoycol_credentials(
    payload: YoocolValidationRequest,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    auth_user = _require_owner_or_admin(authorization)
    await _assert_yoycol_enabled(db, auth_user["role"])

    access_key = (payload.access_key or "").strip()
    secret_key = (payload.secret_key or "").strip()

    if payload.use_stored:
        stored = await db.yoycol_credentials.find_one({"user_id": auth_user["user_id"]}, {"_id": 0})
        if not stored:
            raise HTTPException(status_code=404, detail="No saved YOYCOL credentials found")
        access_key = stored.get("access_key", "")
        secret_key = stored.get("secret_key", "")

    if not access_key or not secret_key:
        raise HTTPException(status_code=400, detail="access_key and secret_key are required")

    is_valid, message = await _validate_yoycol_access(access_key, secret_key)

    now_iso = datetime.now(timezone.utc).isoformat()
    await db.yoycol_credentials.update_one(
        {"user_id": auth_user["user_id"]},
        {
            "$set": {
                "user_email": auth_user["email"],
                "access_key": access_key,
                "secret_key": secret_key,
                "updated_at": now_iso,
                "last_validated_at": now_iso,
                "last_validation_status": "valid" if is_valid else "invalid",
            },
            "$setOnInsert": {
                "id": str(uuid.uuid4()),
                "user_id": auth_user["user_id"],
                "created_at": now_iso,
            },
        },
        upsert=True,
    )

    return {
        "valid": is_valid,
        "message": message,
        "last_validation_status": "valid" if is_valid else "invalid",
    }