from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from urllib.parse import urlencode
import re
import uuid

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Request, BackgroundTasks
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel

from auth import decode_token
from admin_settings import _normalize_printful_callback_url

router = APIRouter(prefix="/api/printful", tags=["printful"])

_db = None

PRINTFUL_AUTH_URL = "https://www.printful.com/oauth/authorize"
PRINTFUL_TOKEN_URL = "https://www.printful.com/oauth/token"
PRINTFUL_API_BASE = "https://api.printful.com"
PRINTFUL_SCOPES = "stores sync_products orders webhooks file_library"
STATE_COLLECTION = "printful_oauth_states"
CONNECTION_COLLECTION = "printful_oauth_connections"
WEBHOOK_EVENT_COLLECTION = "printful_webhook_events"
SYNC_BATCH_LIMIT = 100
SHARED_CONNECTION_USER_ID = "__shared_printful_connection__"


def set_database(database):
    global _db
    _db = database


async def get_db():
    return _db


ALLOWED_ROLES = {"super_admin", "admin", "store_owner"}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _now_iso() -> str:
    return utc_now().isoformat()


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, (int, float)):
        try:
            return datetime.fromtimestamp(float(value), tz=timezone.utc)
        except Exception:
            return None
    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return None
        if raw.isdigit():
            try:
                return datetime.fromtimestamp(float(raw), tz=timezone.utc)
            except Exception:
                return None
        candidate = raw.replace("Z", "+00:00")
    else:
        candidate = str(value)
    try:
        parsed = datetime.fromisoformat(candidate)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except Exception:
        return None


def _slugify(value: str) -> str:
    text = (value or "").lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or "printful-item"


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


async def _assert_printful_enabled(db, role: str):
    if role == "super_admin":
        return

    feature_flags = await db.admin_settings.find_one(
        {"type": "feature_flags"},
        {"_id": 0, "printful_enabled": 1},
    )
    is_enabled = bool(feature_flags.get("printful_enabled", False)) if feature_flags else False
    if not is_enabled:
        raise HTTPException(status_code=403, detail="Printful is currently disabled by feature flag")


def _absolute_url(request: Request, path: str) -> str:
    # Never trust Origin/Referer for server-side callback URL construction.
    # During OAuth callbacks those headers may point to printful.com and create invalid webhook URLs.
    forwarded_proto = ((request.headers.get("x-forwarded-proto") or "").split(",")[0]).strip()
    forwarded_host = ((request.headers.get("x-forwarded-host") or "").split(",")[0]).strip()
    host = (request.headers.get("host") or "").strip()

    scheme = forwarded_proto or request.url.scheme
    netloc = forwarded_host or host or request.url.netloc
    return f"{scheme}://{netloc}{path}"


def _admin_redirect_url(request: Request, status: str, message: Optional[str] = None) -> str:
    query = {"printful": status}
    if message:
        query["message"] = message
    return f"{_absolute_url(request, '/admin/fulfillment/printful')}?{urlencode(query)}"


def _popup_callback_response(request: Request, status: str, message: Optional[str] = None) -> HTMLResponse:
    redirect_url = _admin_redirect_url(request, status, message)
    escaped_status = status.replace("'", "\\'")
    escaped_message = (message or "").replace("\\", "\\\\").replace("'", "\\'")
    html = f"""
    <!doctype html>
    <html>
      <head>
        <meta charset=\"utf-8\" />
        <title>Printful Connection</title>
        <style>
          body {{ font-family: Arial, sans-serif; background: #fff7f1; color: #3b1f12; display:flex; min-height:100vh; align-items:center; justify-content:center; margin:0; }}
          .card {{ max-width: 520px; padding: 32px; background: white; border: 1px solid #ffd7c2; border-radius: 18px; box-shadow: 0 12px 40px rgba(59,31,18,0.08); text-align:center; }}
          h1 {{ margin:0 0 12px 0; font-size:28px; }}
          p {{ margin:0 0 18px 0; line-height:1.6; color:#6e4b38; }}
          a {{ display:inline-block; padding:12px 18px; border-radius: 12px; background:#ff8c42; color:white; text-decoration:none; font-weight:600; }}
        </style>
      </head>
      <body>
        <div class=\"card\">
          <h1>{'Printful connected' if status == 'connected' else 'Printful connection issue'}</h1>
          <p>{message or ('You can return to your admin panel now.' if status == 'connected' else 'Return to the admin panel and try again.')}</p>
          <a href=\"{redirect_url}\">Return to Printful settings</a>
        </div>
        <script>
          try {{
            if (window.opener && !window.opener.closed) {{
              window.opener.postMessage({{ type: 'printful-oauth-result', status: '{escaped_status}', message: '{escaped_message}' }}, window.location.origin);
              setTimeout(() => window.close(), 1200);
            }} else {{
              setTimeout(() => window.location.replace('{redirect_url}'), 1400);
            }}
          }} catch (error) {{
            setTimeout(() => window.location.replace('{redirect_url}'), 1400);
          }}
        </script>
      </body>
    </html>
    """
    return HTMLResponse(content=html)


async def _get_app_credentials(db) -> dict:
    settings = await db.admin_settings.find_one({"type": "printful_oauth"}, {"_id": 0})
    client_id = (settings or {}).get("client_id", "").strip()
    client_secret = (settings or {}).get("client_secret", "").strip()
    callback_url = _normalize_printful_callback_url((settings or {}).get("callback_url", ""))
    return {
        "configured": bool(client_id and client_secret),
        "client_id": client_id,
        "client_secret": client_secret,
        "callback_url": callback_url,
    }


async def _get_connection(db, user_id: str) -> Optional[dict]:
    user_specific = await db[CONNECTION_COLLECTION].find_one({"user_id": user_id}, {"_id": 0})
    if user_specific and str(user_specific.get("access_token") or "").strip():
        return user_specific

    shared = await db[CONNECTION_COLLECTION].find_one({"user_id": SHARED_CONNECTION_USER_ID}, {"_id": 0})
    return shared


async def _save_connection(db, user_id: str, payload: dict):
    user_payload = {
        **payload,
        "user_id": user_id,
        "source_user_id": payload.get("source_user_id") or user_id,
        "updated_at": _now_iso(),
    }
    await db[CONNECTION_COLLECTION].update_one(
        {"user_id": user_id},
        {"$set": user_payload, "$setOnInsert": {"created_at": _now_iso()}},
        upsert=True,
    )

    shared_payload = {
        **payload,
        "user_id": SHARED_CONNECTION_USER_ID,
        "source_user_id": payload.get("source_user_id") or user_id,
        "updated_at": _now_iso(),
    }
    await db[CONNECTION_COLLECTION].update_one(
        {"user_id": SHARED_CONNECTION_USER_ID},
        {"$set": shared_payload, "$setOnInsert": {"created_at": _now_iso()}},
        upsert=True,
    )


async def _update_connection_fields(db, user_id: str, fields: dict):
    now_iso = _now_iso()
    await db[CONNECTION_COLLECTION].update_one(
        {"user_id": user_id},
        {"$set": {**fields, "updated_at": now_iso}},
        upsert=False,
    )

    await db[CONNECTION_COLLECTION].update_one(
        {"user_id": SHARED_CONNECTION_USER_ID},
        {"$set": {**fields, "updated_at": now_iso, "source_user_id": user_id}, "$setOnInsert": {"created_at": now_iso}},
        upsert=True,
    )


def _extract_store_record(body: dict) -> Optional[dict]:
    result = body.get("result")
    if isinstance(result, dict):
        return result
    if isinstance(result, list) and result:
        return result[0]
    return None


async def _exchange_code_for_tokens(client_id: str, client_secret: str, code: str) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            PRINTFUL_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Printful token exchange failed ({response.status_code})")
    return response.json() if response.content else {}


async def _refresh_access_token(db, connection: dict, app_settings: dict) -> dict:
    refresh_token = (connection.get("refresh_token") or "").strip()
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Printful connection needs to be reconnected")

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            PRINTFUL_TOKEN_URL,
            data={
                "grant_type": "refresh_token",
                "client_id": app_settings["client_id"],
                "client_secret": app_settings["client_secret"],
                "refresh_token": refresh_token,
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Printful connection expired. Please reconnect your account.")

    token_data = response.json() if response.content else {}
    expires_in = int(token_data.get("expires_in") or 3600)
    updated = {
        **connection,
        "access_token": token_data.get("access_token", connection.get("access_token", "")),
        "refresh_token": token_data.get("refresh_token", refresh_token),
        "scope": token_data.get("scope", connection.get("scope", "")),
        "token_expires_at": (utc_now() + timedelta(seconds=expires_in)).isoformat(),
        "updated_at": _now_iso(),
    }
    await _save_connection(db, connection["user_id"], updated)
    return updated


async def _get_valid_connection(db, user_id: str) -> dict:
    connection = await _get_connection(db, user_id)
    if not connection or not (connection.get("access_token") or "").strip():
        raise HTTPException(status_code=404, detail="Printful account not connected")

    app_settings = await _get_app_credentials(db)
    if not app_settings["configured"]:
        raise HTTPException(status_code=400, detail="Printful OAuth app settings are missing in dev settings")

    expires_at = _parse_datetime(connection.get("token_expires_at"))
    refresh_token = str(connection.get("refresh_token") or "").strip()
    refresh_needed = False

    if expires_at:
        try:
            refresh_needed = expires_at <= utc_now() + timedelta(minutes=5)
        except Exception:
            refresh_needed = bool(refresh_token)
    elif refresh_token:
        # Legacy records may miss token_expires_at; refresh only if token is available.
        refresh_needed = True

    if refresh_needed:
        connection = await _refresh_access_token(db, connection, app_settings)

    return connection


async def _printful_api_request(connection: dict, method: str, path: str, *, params=None, json=None) -> dict:
    headers = {
        "Authorization": f"Bearer {connection['access_token']}",
        "Content-Type": "application/json",
    }
    store_id = str(connection.get("store_id") or "").strip()
    if store_id:
        headers["X-PF-Store-Id"] = store_id

    try:
        async with httpx.AsyncClient(timeout=40.0) as client:
            response = await client.request(method, f"{PRINTFUL_API_BASE}{path}", headers=headers, params=params, json=json)
    except httpx.TimeoutException:
        raise HTTPException(status_code=400, detail=f"Printful API timeout on {method} {path}")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=400, detail=f"Printful API request failed on {method} {path}: {str(exc)}")

    if response.status_code >= 400:
        detail = None
        try:
            payload = response.json()
            detail = payload.get("error") or payload.get("message") or payload
        except Exception:
            detail = response.text
        raise HTTPException(status_code=400, detail=f"Printful API error ({response.status_code}): {detail}")

    if not response.content:
        return {}
    try:
        return response.json()
    except ValueError:
        return {"raw_text": response.text}


async def _fetch_sync_products_page(connection: dict, offset: int, limit: int) -> dict:
    """Try current + legacy Printful sync-product list endpoints."""
    candidate_calls = [
        ("/sync/products", {"offset": offset, "limit": limit}),
        ("/store/products", {"offset": offset, "limit": limit}),
        ("/sync_products", {"offset": offset, "limit": limit}),
    ]

    last_error: Optional[HTTPException] = None
    for path, params in candidate_calls:
        try:
            return await _printful_api_request(connection, "GET", path, params=params)
        except HTTPException as exc:
            detail_text = str(exc.detail or "").lower()
            if "404" in detail_text or "notfound" in detail_text or "not found" in detail_text:
                last_error = exc
                continue
            raise

    if last_error:
        raise last_error

    raise HTTPException(status_code=400, detail="Unable to fetch Printful sync products")


async def _fetch_store_details(connection: dict) -> dict:
    for path in ("/store", "/stores"):
        try:
            body = await _printful_api_request(connection, "GET", path)
            store = _extract_store_record(body)
            if store:
                return store
        except HTTPException:
            continue
    return {}


async def _register_webhook(connection: dict, request: Request) -> tuple[bool, Optional[str]]:
    webhook_url = _absolute_url(request, "/api/printful/webhook/events")
    payload = {
        "url": webhook_url,
        "types": [
            "package_shipped",
            "package_returned",
            "order_created",
            "order_failed",
            "order_put_hold",
            "order_remove_hold",
        ],
    }

    try:
        await _printful_api_request(connection, "POST", "/webhooks", json=payload)
        return True, None
    except HTTPException as exc:
        return False, str(exc.detail)


def _normalize_sync_products_result(body: dict) -> list:
    if isinstance(body, list):
        return [item for item in body if isinstance(item, dict)]
    if not isinstance(body, dict):
        return []

    result = body.get("result") or []
    if isinstance(result, dict):
        if isinstance(result.get("items"), list):
            result = result.get("items")
        elif isinstance(result.get("data"), list):
            result = result.get("data")

    if isinstance(result, list):
        normalized = []
        for item in result:
            if isinstance(item, dict) and isinstance(item.get("sync_product"), dict):
                merged = {**item, **item.get("sync_product", {})}
                if "sync_variants" not in merged and isinstance(item.get("sync_variants"), list):
                    merged["sync_variants"] = item.get("sync_variants")
                normalized.append(merged)
            elif isinstance(item, dict):
                normalized.append(item)
        return normalized
    if isinstance(result, dict):
        if isinstance(result.get("items"), list):
            return result.get("items") or []
        if isinstance(result.get("products"), list):
            return result.get("products") or []
    return []


async def _ensure_category(db, category_name: str):
    normalized = (category_name or "Printful").strip() or "Printful"
    existing = await db.categories.find_one({"name": {"$regex": f"^{re.escape(normalized)}$", "$options": "i"}}, {"_id": 0, "id": 1})
    if existing:
        return

    now_iso = _now_iso()
    category_doc = {
        "id": str(uuid.uuid4()),
        "name": normalized,
        "description": "Products synced from Printful",
        "image": None,
        "parent_id": None,
        "sort_order": 999,
        "is_enabled": True,
        "seo_title": None,
        "seo_description": None,
        "seo_url": _slugify(normalized),
        "custom_fields": [],
        "product_count": 0,
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    await db.categories.insert_one(category_doc)


def _extract_images(sync_product: dict, variants: list) -> list:
    images = []
    for candidate in [
        sync_product.get("thumbnail_url"),
        sync_product.get("thumbnail"),
        sync_product.get("image"),
    ]:
        if candidate and candidate not in images:
            images.append(candidate)

    for variant in variants:
        if not isinstance(variant, dict):
            continue
        for file_obj in variant.get("files") or []:
            if not isinstance(file_obj, dict):
                continue
            candidate = file_obj.get("preview_url") or file_obj.get("url")
            if candidate and candidate not in images:
                images.append(candidate)

    return images[:8]


def _normalize_variants(value) -> list:
    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]

    if isinstance(value, dict):
        if isinstance(value.get("items"), list):
            return [item for item in value.get("items") if isinstance(item, dict)]
        if isinstance(value.get("data"), list):
            return [item for item in value.get("data") if isinstance(item, dict)]
        if isinstance(value.get("variants"), list):
            return [item for item in value.get("variants") if isinstance(item, dict)]

    return []


async def _upsert_local_product(db, sync_product: dict, connection: dict) -> dict:
    if isinstance(sync_product.get("sync_product"), dict):
        sync_product = {
            **sync_product,
            **sync_product.get("sync_product", {}),
        }

    sync_id = str(sync_product.get("id") or sync_product.get("sync_product_id") or "").strip()
    if not sync_id:
        raise HTTPException(status_code=400, detail="Printful product payload is missing an id")

    variants = _normalize_variants(sync_product.get("sync_variants"))
    if not variants:
        variants = _normalize_variants(sync_product.get("variants"))
    first_variant = variants[0] if variants else {}
    sync_variant_ids = [str(v.get("id") or v.get("sync_variant_id") or "").strip() for v in variants if isinstance(v, dict)]
    sync_variant_ids = [value for value in sync_variant_ids if value]
    variant_ids = [str(v.get("variant_id") or "").strip() for v in variants if isinstance(v, dict)]
    variant_ids = [value for value in variant_ids if value]
    category = (sync_product.get("main_category_name") or sync_product.get("type") or "Printful").strip() or "Printful"
    await _ensure_category(db, category)

    name = (sync_product.get("name") or first_variant.get("name") or f"Printful Product {sync_id}").strip()
    description = (sync_product.get("description") or f"Synced from Printful store {connection.get('store_name') or connection.get('store_id')}").strip()
    images = _extract_images(sync_product, variants)
    image = images[0] if images else ""
    price_raw = first_variant.get("retail_price") or first_variant.get("price") or sync_product.get("retail_price") or sync_product.get("price") or 0
    try:
        price = float(price_raw or 0)
    except Exception:
        price = 0.0

    sku = (first_variant.get("sku") or sync_product.get("external_id") or f"PF-{sync_id}").strip() or f"PF-{sync_id}"
    query = {
        "custom_fields_data.printful.sync_product_id": sync_id,
        "custom_fields_data.printful.connected_user_id": connection["user_id"],
    }
    existing = await db.products.find_one(query, {"_id": 0})
    now_iso = _now_iso()

    product_doc = {
        "id": existing.get("id") if existing else str(uuid.uuid4()),
        "name": name,
        "description": description,
        "category": category,
        "categories": [category],
        "price": price,
        "original_price": existing.get("original_price") if existing else None,
        "image": image,
        "images": images,
        "condition": existing.get("condition") if existing else "New",
        "in_stock": True,
        "is_visible": True,
        "quantity": existing.get("quantity") if existing else 999,
        "sku": sku,
        "weight": existing.get("weight") if existing else None,
        "tags": sorted(set((existing.get("tags") if existing else []) + ["printful"])),
        "location": existing.get("location") if existing else "alabama_pawn_storage",
        "brand": existing.get("brand") if existing else "Printful",
        "manufacturer": existing.get("manufacturer") if existing else "Printful",
        "upc": existing.get("upc") if existing else None,
        "mpn": existing.get("mpn") if existing else None,
        "cost_price": existing.get("cost_price") if existing else None,
        "track_quantity": existing.get("track_quantity") if existing else False,
        "requires_shipping": True,
        "free_shipping": existing.get("free_shipping") if existing else False,
        "shipping_weight": existing.get("shipping_weight") if existing else None,
        "shipping_length": existing.get("shipping_length") if existing else None,
        "shipping_width": existing.get("shipping_width") if existing else None,
        "shipping_height": existing.get("shipping_height") if existing else None,
        "seo_title": existing.get("seo_title") if existing else None,
        "seo_description": existing.get("seo_description") if existing else None,
        "seo_url": existing.get("seo_url") if existing else f"printful/{_slugify(name)}-{sync_id.lower()}",
        "related_products": existing.get("related_products") if existing else [],
        "has_options": False,
        "custom_fields_data": {
            **(existing.get("custom_fields_data") if existing else {}),
            "printful": {
                "sync_product_id": sync_id,
                "connected_user_id": connection["user_id"],
                "store_id": connection.get("store_id", ""),
                "store_name": connection.get("store_name", ""),
                "external_id": sync_product.get("external_id"),
                "variant_count": len(variants),
                "default_sync_variant_id": str(first_variant.get("id") or first_variant.get("sync_variant_id") or "").strip() or None,
                "default_variant_id": str(first_variant.get("variant_id") or "").strip() or None,
                "sync_variant_ids": sync_variant_ids,
                "variant_ids": variant_ids,
                "raw_sync_snapshot": {
                    "id": sync_product.get("id"),
                    "sync_product_id": sync_product.get("sync_product_id"),
                    "external_id": sync_product.get("external_id"),
                    "name": sync_product.get("name"),
                    "thumbnail_url": sync_product.get("thumbnail_url"),
                    "variants": len(variants),
                },
                "last_synced_at": now_iso,
            },
        },
        "created_at": existing.get("created_at") if existing else now_iso,
        "updated_at": now_iso,
        "sold_count": existing.get("sold_count") if existing else 0,
    }

    await db.products.update_one({"id": product_doc["id"]}, {"$set": product_doc}, upsert=True)
    return product_doc


async def _run_sync_products_job(
    db,
    user_id: str,
    webhook_registered: bool,
    webhook_error: Optional[str],
):
    connection = await _get_valid_connection(db, user_id)
    imported = []
    offset = 0
    failed_count = 0
    first_error: Optional[str] = None
    seen_count = 0

    try:
        while True:
            body = await _fetch_sync_products_page(connection, offset=offset, limit=SYNC_BATCH_LIMIT)
            products = _normalize_sync_products_result(body)
            if not products:
                break

            seen_count += len(products)

            for sync_product in products:
                try:
                    imported.append(await _upsert_local_product(db, sync_product, connection))
                except Exception as exc:
                    failed_count += 1
                    if not first_error:
                        first_error = str(exc)
                    continue

            paging = body.get("paging") if isinstance(body, dict) else {}
            if not isinstance(paging, dict):
                paging = {}
            total = paging.get("total")
            offset += len(products)

            if isinstance(total, int) and offset >= total:
                break
            if len(products) < SYNC_BATCH_LIMIT:
                break

        sync_error = None
        if len(imported) == 0 and failed_count > 0:
            sync_error = f"Imported 0 products. Failed {failed_count} item(s). First error: {first_error}"
        elif len(imported) == 0 and seen_count == 0:
            sync_error = "No products were returned by Printful for this store."
        elif failed_count > 0:
            sync_error = f"Imported {len(imported)} product(s), skipped {failed_count} item(s). First error: {first_error}"

        await _update_connection_fields(
            db,
            user_id,
            {
                "last_synced_at": _now_iso(),
                "last_sync_count": len(imported),
                "last_error": sync_error,
                "webhook_registered": webhook_registered,
                "last_webhook_error": webhook_error,
                "sync_in_progress": False,
                "sync_has_more": False,
            },
        )
    except HTTPException as exc:
        await _update_connection_fields(
            db,
            user_id,
            {
                "last_error": str(exc.detail),
                "webhook_registered": webhook_registered,
                "last_webhook_error": webhook_error,
                "sync_in_progress": False,
            },
        )
    except Exception as exc:
        await _update_connection_fields(
            db,
            user_id,
            {
                "last_error": f"Unhandled sync error: {str(exc)}",
                "webhook_registered": webhook_registered,
                "last_webhook_error": webhook_error,
                "sync_in_progress": False,
            },
        )


def _coerce_int(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        text = str(value).strip()
        if not text:
            return None
        return int(float(text))
    except Exception:
        return None


def _extract_shipping_recipient(order: dict) -> dict:
    shipping = order.get("shipping") if isinstance(order.get("shipping"), dict) else {}
    shipping_address = order.get("shipping_address") if isinstance(order.get("shipping_address"), dict) else {}

    def _pick(*keys: str, default: str = "") -> str:
        for key in keys:
            value = shipping.get(key)
            if value is None:
                value = shipping_address.get(key)
            if value is not None and str(value).strip():
                return str(value).strip()
        return default

    first_name = _pick("first_name", "firstName")
    last_name = _pick("last_name", "lastName")
    full_name = " ".join(part for part in [first_name, last_name] if part).strip() or str(order.get("customer_name") or "").strip()

    recipient = {
        "name": full_name,
        "address1": _pick("address1", "address"),
        "address2": _pick("address2"),
        "city": _pick("city"),
        "state_code": _pick("state", "state_code"),
        "country_code": (_pick("country", "country_code", default="US") or "US").upper(),
        "zip": _pick("zipCode", "zip_code", "zip"),
        "email": str(order.get("customer_email") or _pick("email") or "").strip(),
        "phone": _pick("phone"),
    }

    required_fields = ["name", "address1", "city", "state_code", "zip"]
    missing = [field for field in required_fields if not recipient.get(field)]
    if missing:
        raise HTTPException(status_code=400, detail=f"Order shipping address missing required fields: {', '.join(missing)}")

    return recipient


async def _find_order_for_printful(db, order_id: str) -> dict:
    order = await db.orders.find_one(
        {"$or": [{"id": order_id}, {"order_number": order_id}]},
        {"_id": 0},
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


async def _resolve_variant_from_printful(connection: dict, sync_product_id: str) -> dict:
    offset = 0
    limit = 100

    while True:
        body = await _fetch_sync_products_page(connection, offset=offset, limit=limit)
        products = _normalize_sync_products_result(body)
        if not products:
            break

        for product in products:
            if not isinstance(product, dict):
                continue

            candidate_id = str(
                product.get("id")
                or product.get("sync_product_id")
                or ((product.get("sync_product") or {}).get("id") if isinstance(product.get("sync_product"), dict) else "")
                or ""
            ).strip()
            if candidate_id != sync_product_id:
                continue

            variants = _normalize_variants(product.get("sync_variants"))
            if not variants:
                variants = _normalize_variants(product.get("variants"))
            if not variants:
                return {}

            first_variant = variants[0]
            return {
                "sync_variant_id": _coerce_int(first_variant.get("id") or first_variant.get("sync_variant_id")),
                "variant_id": _coerce_int(first_variant.get("variant_id")),
            }

        paging = body.get("paging") if isinstance(body, dict) else {}
        total = paging.get("total") if isinstance(paging, dict) else None
        offset += len(products)

        if isinstance(total, int) and offset >= total:
            break
        if len(products) < limit:
            break

    return {}


async def _build_printful_order_items(db, connection: dict, order: dict) -> dict:
    order_items = order.get("items") if isinstance(order.get("items"), list) else []
    if not order_items:
        raise HTTPException(status_code=400, detail="Order has no items")

    product_ids = []
    for item in order_items:
        if not isinstance(item, dict):
            continue
        product_id = str(item.get("product_id") or "").strip()
        if product_id:
            product_ids.append(product_id)

    products = []
    if product_ids:
        products = await db.products.find({"id": {"$in": product_ids}}, {"_id": 0, "id": 1, "name": 1, "custom_fields_data": 1}).to_list(500)

    product_by_id = {str(product.get("id")): product for product in products if isinstance(product, dict)}
    unresolved = []
    sendable_items = []

    for item in order_items:
        if not isinstance(item, dict):
            continue
        if str(item.get("item_type") or "product").strip().lower() != "product":
            continue

        product_id = str(item.get("product_id") or "").strip()
        product = product_by_id.get(product_id)
        product_name = str(item.get("name") or item.get("product_name") or (product or {}).get("name") or "Product").strip()

        if not product:
            unresolved.append(f"{product_name} (missing local product)")
            continue

        custom_fields_data = product.get("custom_fields_data") if isinstance(product.get("custom_fields_data"), dict) else {}
        printful_meta = custom_fields_data.get("printful") if isinstance(custom_fields_data.get("printful"), dict) else {}
        sync_product_id = str(printful_meta.get("sync_product_id") or "").strip()
        if not sync_product_id:
            unresolved.append(f"{product_name} (not synced to Printful)")
            continue

        sync_variant_id = _coerce_int(printful_meta.get("default_sync_variant_id"))
        variant_id = _coerce_int(printful_meta.get("default_variant_id"))
        if not sync_variant_id and not variant_id:
            resolved = await _resolve_variant_from_printful(connection, sync_product_id)
            sync_variant_id = resolved.get("sync_variant_id")
            variant_id = resolved.get("variant_id")

            if sync_variant_id:
                await db.products.update_one(
                    {"id": product_id},
                    {"$set": {"custom_fields_data.printful.default_sync_variant_id": str(sync_variant_id), "updated_at": _now_iso()}},
                )
            if variant_id:
                await db.products.update_one(
                    {"id": product_id},
                    {"$set": {"custom_fields_data.printful.default_variant_id": str(variant_id), "updated_at": _now_iso()}},
                )

        if not sync_variant_id and not variant_id:
            unresolved.append(f"{product_name} (missing variant mapping)")
            continue

        quantity = _coerce_int(item.get("quantity")) or 1
        try:
            price = float(item.get("price") or 0)
        except Exception:
            price = 0.0

        printful_item = {
            "quantity": max(1, quantity),
            "name": product_name,
            "retail_price": round(price, 2),
        }
        if sync_variant_id:
            printful_item["sync_variant_id"] = sync_variant_id
        elif variant_id:
            printful_item["variant_id"] = variant_id

        sendable_items.append(printful_item)

    return {
        "sendable_items": sendable_items,
        "unresolved": unresolved,
    }


class PrintfulValidationRequest(BaseModel):
    use_stored: bool = True


@router.get("/orders/{order_id}/eligibility")
async def get_printful_order_eligibility(
    order_id: str,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    auth_user = _require_owner_or_admin(authorization)
    await _assert_printful_enabled(db, auth_user["role"])
    connection = await _get_valid_connection(db, auth_user["user_id"])
    order = await _find_order_for_printful(db, order_id)

    item_context = await _build_printful_order_items(db, connection, order)
    sendable_items = item_context["sendable_items"]
    unresolved = item_context["unresolved"]

    return {
        "order_id": order.get("id") or order_id,
        "order_number": order.get("order_number", ""),
        "eligible": len(sendable_items) > 0 and len(unresolved) == 0,
        "sendable_items_count": len(sendable_items),
        "unresolved_items": unresolved,
        "already_submitted": bool((order.get("printful") or {}).get("order_id")) if isinstance(order.get("printful"), dict) else False,
        "current_printful_order_id": str(((order.get("printful") or {}).get("order_id") if isinstance(order.get("printful"), dict) else "") or "").strip(),
    }


@router.post("/orders/{order_id}/submit")
async def submit_order_to_printful(
    order_id: str,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    auth_user = _require_owner_or_admin(authorization)
    await _assert_printful_enabled(db, auth_user["role"])
    connection = await _get_valid_connection(db, auth_user["user_id"])
    order = await _find_order_for_printful(db, order_id)

    existing_printful = order.get("printful") if isinstance(order.get("printful"), dict) else {}
    if existing_printful.get("order_id"):
        return {
            "success": True,
            "already_submitted": True,
            "message": "Order was already sent to Printful",
            "printful_order_id": str(existing_printful.get("order_id")),
            "printful_status": existing_printful.get("status") or "submitted",
        }

    recipient = _extract_shipping_recipient(order)
    item_context = await _build_printful_order_items(db, connection, order)
    sendable_items = item_context["sendable_items"]
    unresolved = item_context["unresolved"]

    if not sendable_items:
        raise HTTPException(status_code=400, detail="No synced Printful items found on this order")
    if unresolved:
        unresolved_text = "; ".join(unresolved[:6])
        raise HTTPException(status_code=400, detail=f"Order cannot be submitted. Unsynced items: {unresolved_text}")

    try:
        shipping_cost = float(order.get("shipping_cost") or 0)
    except Exception:
        shipping_cost = 0.0

    payload = {
        "external_id": str(order.get("id") or order.get("order_number") or order_id),
        "confirm": True,
        "recipient": recipient,
        "items": sendable_items,
        "retail_costs": {
            "shipping": round(max(0.0, shipping_cost), 2),
        },
    }

    body = await _printful_api_request(connection, "POST", "/orders", json=payload)
    result = body.get("result") if isinstance(body, dict) and isinstance(body.get("result"), dict) else body
    if not isinstance(result, dict):
        result = {}

    printful_order_id = str(result.get("id") or result.get("order_id") or "").strip()
    printful_status = str(result.get("status") or "submitted").strip() or "submitted"

    printful_tracking = ""
    shipments = result.get("shipments") if isinstance(result.get("shipments"), list) else []
    if shipments:
        first_shipment = shipments[0] if isinstance(shipments[0], dict) else {}
        printful_tracking = str(first_shipment.get("tracking_number") or first_shipment.get("tracking") or "").strip()

    await db.orders.update_one(
        {"id": order.get("id")},
        {
            "$set": {
                "printful": {
                    "order_id": printful_order_id,
                    "status": printful_status,
                    "external_id": payload["external_id"],
                    "submitted_at": _now_iso(),
                    "submitted_by": auth_user["user_id"],
                    "connected_user_id": connection.get("user_id"),
                    "item_count": len(sendable_items),
                },
                "tracking_number": printful_tracking or order.get("tracking_number"),
                "updated_at": _now_iso(),
                "status": "processing" if str(order.get("status") or "").lower() in {"pending", "paid", "awaiting_payment"} else order.get("status"),
            },
            "$inc": {"printful_submission_count": 1},
        },
    )

    return {
        "success": True,
        "message": "Order sent to Printful for fulfillment",
        "printful_order_id": printful_order_id,
        "printful_status": printful_status,
        "tracking_number": printful_tracking or None,
        "item_count": len(sendable_items),
    }


@router.get("/status")
async def get_printful_status(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    auth_user = _require_owner_or_admin(authorization)
    await _assert_printful_enabled(db, auth_user["role"])

    app_settings = await _get_app_credentials(db)
    connection = await _get_connection(db, auth_user["user_id"])

    return {
        "feature_enabled": True,
        "app_configured": app_settings["configured"],
        "client_id": app_settings["client_id"],
        "connected": bool(connection and (connection.get("access_token") or "").strip()),
        "store_id": (connection or {}).get("store_id", ""),
        "store_name": (connection or {}).get("store_name", ""),
        "connected_at": (connection or {}).get("connected_at"),
        "last_synced_at": (connection or {}).get("last_synced_at"),
        "last_sync_count": (connection or {}).get("last_sync_count", 0),
        "webhook_registered": bool((connection or {}).get("webhook_registered", False)),
        "last_webhook_error": (connection or {}).get("last_webhook_error"),
        "last_error": (connection or {}).get("last_error"),
        "sync_in_progress": bool((connection or {}).get("sync_in_progress", False)),
        "sync_has_more": bool((connection or {}).get("sync_has_more", False)),
    }


@router.get("/connect-url")
async def get_printful_connect_url(
    request: Request,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    auth_user = _require_owner_or_admin(authorization)
    await _assert_printful_enabled(db, auth_user["role"])

    app_settings = await _get_app_credentials(db)
    if not app_settings["configured"]:
        raise HTTPException(status_code=400, detail="Printful Client ID / Secret are missing in dev settings")

    state_id = str(uuid.uuid4())
    await db[STATE_COLLECTION].insert_one(
        {
            "id": state_id,
            "user_id": auth_user["user_id"],
            "user_email": auth_user["email"],
            "created_at": _now_iso(),
            "expires_at": (utc_now() + timedelta(minutes=10)).isoformat(),
            "return_path": "/admin/fulfillment/printful",
        }
    )

    redirect_uri = app_settings.get("callback_url") or _absolute_url(request, "/api/printful/callback")
    auth_params = {
        "client_id": app_settings["client_id"],
        "state": state_id,
        "redirect_url": redirect_uri,
    }
    auth_url = f"{PRINTFUL_AUTH_URL}?{urlencode(auth_params)}"

    return {
        "success": True,
        "auth_url": auth_url,
        "redirect_uri": redirect_uri,
    }


@router.get("/callback")
async def handle_printful_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
    db=Depends(get_db),
):
    if error:
        return _popup_callback_response(request, "error", error_description or error)
    if not code or not state:
        return _popup_callback_response(request, "error", "Missing Printful authorization response")

    state_doc = await db[STATE_COLLECTION].find_one({"id": state}, {"_id": 0})
    if not state_doc:
        return _popup_callback_response(request, "error", "This Printful login session has expired")

    expires_at = _parse_datetime(state_doc.get("expires_at"))
    if not expires_at or expires_at <= utc_now():
        await db[STATE_COLLECTION].delete_one({"id": state})
        return _popup_callback_response(request, "error", "This Printful login session has expired")

    app_settings = await _get_app_credentials(db)
    if not app_settings["configured"]:
        return _popup_callback_response(request, "error", "Printful Client ID / Secret are missing in dev settings")

    try:
        token_data = await _exchange_code_for_tokens(
            app_settings["client_id"],
            app_settings["client_secret"],
            code,
        )
        expires_in = int(token_data.get("expires_in") or 3600)
        connection = {
            "id": str(uuid.uuid4()),
            "user_id": state_doc["user_id"],
            "user_email": state_doc.get("user_email", ""),
            "access_token": token_data.get("access_token", ""),
            "refresh_token": token_data.get("refresh_token", ""),
            "scope": token_data.get("scope", PRINTFUL_SCOPES),
            "token_expires_at": (utc_now() + timedelta(seconds=expires_in)).isoformat(),
            "connected_at": _now_iso(),
            "updated_at": _now_iso(),
            "last_error": None,
        }
        store = await _fetch_store_details(connection)
        connection["store_id"] = str(store.get("id") or store.get("store_id") or "")
        connection["store_name"] = store.get("name") or store.get("store_name") or "Printful Store"
        webhook_registered, webhook_error = await _register_webhook(connection, request)
        connection["webhook_registered"] = webhook_registered
        connection["last_webhook_error"] = webhook_error
        await _save_connection(db, state_doc["user_id"], connection)
        await db[STATE_COLLECTION].delete_one({"id": state})
        return _popup_callback_response(request, "connected", "Printful connected successfully. Refreshing your admin panel now.")
    except HTTPException as exc:
        await db[STATE_COLLECTION].delete_one({"id": state})
        return _popup_callback_response(request, "error", str(exc.detail))


@router.post("/disconnect")
async def disconnect_printful(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    auth_user = _require_owner_or_admin(authorization)
    await _assert_printful_enabled(db, auth_user["role"])
    await db[CONNECTION_COLLECTION].delete_many({"user_id": {"$in": [auth_user["user_id"], SHARED_CONNECTION_USER_ID]}})
    return {"success": True, "message": "Printful account disconnected"}


@router.post("/sync-products")
async def sync_printful_products(
    background_tasks: BackgroundTasks,
    request: Request,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    auth_user = None
    connection = None
    try:
        auth_user = _require_owner_or_admin(authorization)
        await _assert_printful_enabled(db, auth_user["role"])
        connection = await _get_valid_connection(db, auth_user["user_id"])

        webhook_registered = bool(connection.get("webhook_registered", False))
        webhook_error = connection.get("last_webhook_error")

        if connection.get("sync_in_progress"):
            return {
                "success": True,
                "message": "Printful sync is already running.",
                "sync_in_progress": True,
            }

        if not webhook_registered:
            webhook_registered, webhook_error = await _register_webhook(connection, request)

        await _update_connection_fields(
            db,
            auth_user["user_id"],
            {
                "last_error": None,
                "webhook_registered": webhook_registered,
                "last_webhook_error": webhook_error,
                "sync_in_progress": True,
                "sync_has_more": False,
            },
        )

        background_tasks.add_task(
            _run_sync_products_job,
            db,
            auth_user["user_id"],
            webhook_registered,
            webhook_error,
        )

        return {
            "success": True,
            "message": "Printful sync started. Please wait a few moments and refresh status.",
            "sync_in_progress": True,
        }
    except HTTPException as exc:
        if auth_user and auth_user.get("user_id"):
            await _update_connection_fields(
                db,
                auth_user["user_id"],
                {
                    "last_error": str(exc.detail),
                    "sync_in_progress": False,
                },
            )
        raise
    except Exception as exc:
        if auth_user and auth_user.get("user_id"):
            await _update_connection_fields(
                db,
                auth_user["user_id"],
                {
                    "last_error": f"Sync init failure: {str(exc)}",
                    "sync_in_progress": False,
                },
            )
        raise HTTPException(status_code=500, detail=f"Sync init failure: {str(exc)}")


@router.post("/webhook/events")
async def receive_printful_webhook(request: Request, db=Depends(get_db)):
    payload = await request.json()
    event_type = str(payload.get("type") or payload.get("event") or payload.get("event_type") or "").strip().lower()
    data = payload.get("data") if isinstance(payload.get("data"), dict) else payload

    external_id = ""
    printful_order_id = ""
    tracking_number = ""

    if isinstance(data, dict):
        external_id = str(
            data.get("external_id")
            or ((data.get("order") or {}).get("external_id") if isinstance(data.get("order"), dict) else "")
            or ""
        ).strip()
        printful_order_id = str(
            data.get("order_id")
            or data.get("id")
            or ((data.get("order") or {}).get("id") if isinstance(data.get("order"), dict) else "")
            or ""
        ).strip()
        tracking_number = str(
            data.get("tracking_number")
            or data.get("tracking")
            or ((data.get("shipment") or {}).get("tracking_number") if isinstance(data.get("shipment"), dict) else "")
            or ""
        ).strip()

    update_fields: Dict[str, Any] = {
        "updated_at": _now_iso(),
    }
    if event_type:
        update_fields["printful.status"] = event_type
        update_fields["printful.last_event"] = event_type
        update_fields["printful.last_event_at"] = _now_iso()
    if tracking_number:
        update_fields["tracking_number"] = tracking_number
        update_fields["printful.tracking_number"] = tracking_number

    order_query = None
    if external_id:
        order_query = {"$or": [{"id": external_id}, {"order_number": external_id}, {"printful.external_id": external_id}]}
    elif printful_order_id:
        order_query = {"printful.order_id": printful_order_id}

    if order_query:
        if event_type in {"package_shipped", "shipment_created"}:
            update_fields["status"] = "shipped"
            update_fields["shipped_at"] = _now_iso()
        elif event_type in {"package_delivered", "shipment_delivered"}:
            update_fields["status"] = "delivered"
            update_fields["delivered_at"] = _now_iso()

        await db.orders.update_one(order_query, {"$set": update_fields})

    await db[WEBHOOK_EVENT_COLLECTION].insert_one(
        {
            "id": str(uuid.uuid4()),
            "received_at": _now_iso(),
            "headers": dict(request.headers),
            "payload": payload,
        }
    )
    return {"success": True}


# Legacy endpoints kept for backward compatibility while the UI moves to OAuth.
@router.get("/credentials")
async def get_printful_credentials(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    auth_user = _require_owner_or_admin(authorization)
    await _assert_printful_enabled(db, auth_user["role"])
    connection = await _get_connection(db, auth_user["user_id"])
    return {
        "configured": bool(connection and (connection.get("access_token") or "").strip()),
        "store_id": (connection or {}).get("store_id", ""),
        "api_key_masked": "OAuth connection active" if connection else "",
        "webhook_secret_masked": "Auto-registered" if connection and connection.get("webhook_registered") else "",
        "updated_at": (connection or {}).get("updated_at"),
        "last_validation_status": "valid" if connection else None,
        "last_validated_at": (connection or {}).get("connected_at"),
    }


@router.post("/validate")
async def validate_printful_credentials(
    payload: PrintfulValidationRequest,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    auth_user = _require_owner_or_admin(authorization)
    await _assert_printful_enabled(db, auth_user["role"])
    connection = await _get_valid_connection(db, auth_user["user_id"])
    store = await _fetch_store_details(connection)
    return {
        "valid": bool(store),
        "message": "Connected through Printful OAuth" if store else "Connected token is missing store access",
        "store_id": str(store.get("id") or connection.get("store_id") or ""),
        "last_validation_status": "valid" if store else "invalid",
    }