from datetime import datetime, timedelta, timezone
from hashlib import sha256
from typing import Optional, Tuple
import secrets
import string
import uuid


CHALLENGE_COLLECTION = "auth_two_factor_challenges"
CODE_EXPIRY_MINUTES = 10
TRUSTED_DEVICE_DAYS = 30


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def hash_value(raw_value: str) -> str:
    return sha256(raw_value.encode("utf-8")).hexdigest()


def generate_code(length: int = 6) -> str:
    return "".join(secrets.choice(string.digits) for _ in range(length))


def normalize_trusted_devices(devices: Optional[list]) -> list:
    now = utc_now()
    normalized = []
    for device in devices or []:
        token_hash = (device or {}).get("token_hash")
        expires_at = parse_datetime((device or {}).get("expires_at"))
        if token_hash and expires_at and expires_at > now:
            normalized.append(
                {
                    "id": device.get("id") or str(uuid.uuid4()),
                    "label": device.get("label") or "Trusted browser",
                    "token_hash": token_hash,
                    "created_at": device.get("created_at") or now.isoformat(),
                    "last_used_at": device.get("last_used_at") or device.get("created_at") or now.isoformat(),
                    "expires_at": expires_at.isoformat(),
                }
            )
    return normalized[:10]


def is_trusted_device(devices: Optional[list], raw_token: Optional[str]) -> bool:
    if not raw_token:
        return False
    token_hash = hash_value(raw_token)
    return any(device.get("token_hash") == token_hash for device in normalize_trusted_devices(devices))


def issue_trusted_device_token(devices: Optional[list], label: str = "Trusted browser") -> Tuple[str, list]:
    raw_token = secrets.token_urlsafe(32)
    now = utc_now()
    trusted_devices = normalize_trusted_devices(devices)
    trusted_devices.insert(
        0,
        {
            "id": str(uuid.uuid4()),
            "label": label,
            "token_hash": hash_value(raw_token),
            "created_at": now.isoformat(),
            "last_used_at": now.isoformat(),
            "expires_at": (now + timedelta(days=TRUSTED_DEVICE_DAYS)).isoformat(),
        },
    )
    return raw_token, trusted_devices[:10]


def touch_trusted_device(devices: Optional[list], raw_token: Optional[str]) -> list:
    token_hash = hash_value(raw_token) if raw_token else None
    now = utc_now()
    updated = []
    for device in normalize_trusted_devices(devices):
        if device.get("token_hash") == token_hash:
            updated.append(
                {
                    **device,
                    "last_used_at": now.isoformat(),
                    "expires_at": (now + timedelta(days=TRUSTED_DEVICE_DAYS)).isoformat(),
                }
            )
        else:
            updated.append(device)
    return updated[:10]


async def create_two_factor_challenge(db, user: dict, challenge_type: str) -> dict:
    now = utc_now()
    code = generate_code()
    challenge = {
        "id": str(uuid.uuid4()),
        "challenge_type": challenge_type,
        "user_id": user["id"],
        "email": user["email"],
        "code_hash": hash_value(code),
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(minutes=CODE_EXPIRY_MINUTES)).isoformat(),
        "used_at": None,
    }
    await db[CHALLENGE_COLLECTION].insert_one(challenge)
    return {"challenge_id": challenge["id"], "code": code, "expires_at": challenge["expires_at"]}


async def resend_two_factor_challenge(db, challenge_id: str, email: str, challenge_type: str) -> dict:
    challenge = await db[CHALLENGE_COLLECTION].find_one(
        {"id": challenge_id, "email": email, "challenge_type": challenge_type}
    )
    if not challenge or challenge.get("used_at"):
        return {"ok": False, "reason": "invalid"}

    now = utc_now()
    code = generate_code()
    await db[CHALLENGE_COLLECTION].update_one(
        {"id": challenge_id},
        {
            "$set": {
                "code_hash": hash_value(code),
                "created_at": now.isoformat(),
                "expires_at": (now + timedelta(minutes=CODE_EXPIRY_MINUTES)).isoformat(),
            }
        },
    )
    return {"ok": True, "code": code}


async def verify_two_factor_challenge(db, challenge_id: str, email: str, code: str, challenge_type: str) -> dict:
    challenge = await db[CHALLENGE_COLLECTION].find_one(
        {"id": challenge_id, "email": email, "challenge_type": challenge_type}
    )
    if not challenge:
        return {"ok": False, "reason": "invalid"}
    if challenge.get("used_at"):
        return {"ok": False, "reason": "used"}

    expires_at = parse_datetime(challenge.get("expires_at"))
    if not expires_at or expires_at <= utc_now():
        return {"ok": False, "reason": "expired"}

    if challenge.get("code_hash") != hash_value(code):
        return {"ok": False, "reason": "incorrect"}

    await db[CHALLENGE_COLLECTION].update_one(
        {"id": challenge_id},
        {"$set": {"used_at": utc_now().isoformat()}},
    )
    return {"ok": True, "challenge": challenge}