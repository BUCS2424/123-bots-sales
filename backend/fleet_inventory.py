"""
Fleet / Inventory Center Console

A per-serial-number registry for individual, physical units - the thing
`inventory_items` (inventory_management.py) was never shaped for, since
that model requires a real catalog `product_id` and tracks quantity-of-a-SKU,
not one-serial-is-one-asset. `inventory_items`/reorder-points/purchase-orders
stay untouched and parts-focused.

Four destinations a unit can be in:
- "new": unsold, available to be added to a quote. Adding it to a quote
  reserves that exact serial immediately (see quote_contract_esign_routes.py's
  _sync_fleet_reservations); it auto-releases if the quote is cancelled,
  expires, or is deleted. Signing the quote flips it to "sold" (permanently
  records who bought it).
- "service": a pure status tag, set here or via the /move endpoint. Creates
  nothing in Service CRM automatically - a real service_requests ticket is
  a separate, manual action.
- "loaner": NOT a value of this collection's `destination` field - loaners
  live in the existing `loaner_units` collection (service_repair.py),
  reused as-is. Moving a unit across that boundary is a cross-collection
  operation (see /units/{id}/move).
- "sold": terminal state, set only by the quote-sign flow.
"""

import csv
import io
import re
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from pydantic import BaseModel

from auth import decode_token, is_admin_or_above
from csv_utils import normalize_header, build_header_map, get_csv_value

router = APIRouter(prefix="/api/fleet", tags=["fleet-inventory"])

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
    return {"user_id": token_data.user_id, "email": token_data.email, "role": token_data.role}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


FLEET_DESTINATIONS = ["new", "service", "sold"]
MOVE_TARGETS = ["new", "loaner", "service"]


class FleetUnitCreate(BaseModel):
    manufacturer_id: Optional[str] = ""
    manufacturer_name: Optional[str] = ""
    model: str
    serial_number: str
    mac_address: Optional[str] = ""
    destination: str = "new"
    notes: Optional[str] = ""
    warranty_remaining_days: Optional[str] = ""
    usage_remaining_days: Optional[str] = ""
    software_version: Optional[str] = ""
    firmware_version: Optional[str] = ""
    affiliated_store: Optional[str] = ""
    affiliated_client: Optional[str] = ""
    country: Optional[str] = ""
    province: Optional[str] = ""


class FleetUnitUpdate(BaseModel):
    manufacturer_id: Optional[str] = None
    manufacturer_name: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    mac_address: Optional[str] = None
    notes: Optional[str] = None
    warranty_remaining_days: Optional[str] = None
    usage_remaining_days: Optional[str] = None
    software_version: Optional[str] = None
    firmware_version: Optional[str] = None
    affiliated_store: Optional[str] = None
    affiliated_client: Optional[str] = None
    country: Optional[str] = None
    province: Optional[str] = None
    # destination is intentionally excluded here - reassigning a unit's
    # destination always goes through /units/{id}/move, never a plain edit.


class FleetUnitMoveRequest(BaseModel):
    to: str  # "new" | "loaner" | "service"


def _unit_doc_defaults() -> dict:
    """The internal tracking fields every fleet_units doc carries, never
    exposed on FleetUnitCreate/Update - managed only by the reservation/
    sign/move flows."""
    return {
        "reserved_by_quote_id": None,
        "reserved_at": None,
        "sold_owner_name": None,
        "sold_owner_email": None,
        "sold_lead_id": None,
        "sold_quote_id": None,
        "sold_at": None,
    }


async def _find_serial_conflict(db, serial_number: str, exclude_id: Optional[str] = None) -> Optional[str]:
    """A serial should only ever live in one of fleet_units / loaner_units /
    service_requests at a time - mirrors the same invariant service_repair.py's
    lookup endpoint already relies on. Returns a human description of the
    conflict, or None if the serial is free."""
    if not serial_number:
        return None
    query = {"serial_number": {"$regex": f"^{re.escape(serial_number)}$", "$options": "i"}}

    fleet_match = await db.fleet_units.find_one(query, {"_id": 0, "id": 1})
    if fleet_match and fleet_match.get("id") != exclude_id:
        return "fleet units"

    loaner_match = await db.loaner_units.find_one(query, {"_id": 0, "id": 1})
    if loaner_match and loaner_match.get("id") != exclude_id:
        return "loaner units"

    service_match = await db.service_requests.find_one(query, {"_id": 0, "id": 1})
    if service_match:
        return "an existing service request"

    return None


# ============ FLEET UNIT CRUD ============

@router.post("/units")
async def create_fleet_unit(
    payload: FleetUnitCreate,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    if payload.destination not in ("new", "service"):
        raise HTTPException(status_code=400, detail="destination must be 'new' or 'service' (use /loaners for loaner units)")

    conflict = await _find_serial_conflict(db, payload.serial_number)
    if conflict:
        raise HTTPException(status_code=400, detail=f"Serial number already exists in {conflict}")

    now = _now_iso()
    doc = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        **_unit_doc_defaults(),
        "created_at": now,
        "updated_at": now,
    }
    await db.fleet_units.insert_one(doc)
    return {"success": True, "message": "Fleet unit created", "id": doc["id"]}


@router.get("/units")
async def list_fleet_units(
    destination: Optional[str] = None,
    available_only: bool = False,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    query = {}
    if destination:
        query["destination"] = destination
    if available_only:
        query["reserved_by_quote_id"] = None
    return await db.fleet_units.find(query, {"_id": 0}).sort("created_at", -1).to_list(length=1000)


@router.get("/units/available-for-quote")
async def list_units_available_for_quote(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    """What the Quote Builder's "Units" tab calls - kept separate from the
    general admin listing so pagination/filtering there can evolve independently."""
    _require_admin_token(authorization)
    return await db.fleet_units.find(
        {"destination": "new", "reserved_by_quote_id": None},
        {"_id": 0},
    ).sort("created_at", -1).to_list(length=500)


@router.get("/units/dashboard")
async def fleet_units_dashboard(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    return {
        "new_available": await db.fleet_units.count_documents({"destination": "new", "reserved_by_quote_id": None}),
        "new_reserved": await db.fleet_units.count_documents({"destination": "new", "reserved_by_quote_id": {"$ne": None}}),
        "service_count": await db.fleet_units.count_documents({"destination": "service"}),
        "sold_count": await db.fleet_units.count_documents({"destination": "sold"}),
        "loaner_available": await db.loaner_units.count_documents({"status": "available"}),
        "loaner_checked_out": await db.loaner_units.count_documents({"status": "checked_out"}),
    }


@router.get("/units/{unit_id}")
async def get_fleet_unit(
    unit_id: str,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    unit = await db.fleet_units.find_one({"id": unit_id}, {"_id": 0})
    if not unit:
        raise HTTPException(status_code=404, detail="Fleet unit not found")
    return unit


@router.put("/units/{unit_id}")
async def update_fleet_unit(
    unit_id: str,
    payload: FleetUnitUpdate,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    unit = await db.fleet_units.find_one({"id": unit_id})
    if not unit:
        raise HTTPException(status_code=404, detail="Fleet unit not found")

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update_data.get("serial_number"):
        conflict = await _find_serial_conflict(db, update_data["serial_number"], exclude_id=unit_id)
        if conflict:
            raise HTTPException(status_code=400, detail=f"Serial number already exists in {conflict}")

    update_data["updated_at"] = _now_iso()
    await db.fleet_units.update_one({"id": unit_id}, {"$set": update_data})
    return {"success": True, "message": "Fleet unit updated"}


@router.delete("/units/{unit_id}")
async def delete_fleet_unit(
    unit_id: str,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    unit = await db.fleet_units.find_one({"id": unit_id})
    if not unit:
        raise HTTPException(status_code=404, detail="Fleet unit not found")
    if unit.get("reserved_by_quote_id"):
        raise HTTPException(status_code=400, detail="Unit is reserved on an open quote - release it there first")
    if unit.get("destination") == "sold":
        raise HTTPException(status_code=400, detail="Cannot delete a sold unit")

    await db.fleet_units.delete_one({"id": unit_id})
    return {"success": True, "message": "Fleet unit deleted"}


# ============ CROSS-COLLECTION MOVE (fleet_units <-> loaner_units) ============

@router.post("/units/{unit_id}/move")
async def move_unit(
    unit_id: str,
    payload: FleetUnitMoveRequest,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    if payload.to not in MOVE_TARGETS:
        raise HTTPException(status_code=400, detail=f"'to' must be one of {MOVE_TARGETS}")

    now = _now_iso()
    fleet_doc = await db.fleet_units.find_one({"id": unit_id})
    loaner_doc = None if fleet_doc else await db.loaner_units.find_one({"id": unit_id})

    if not fleet_doc and not loaner_doc:
        raise HTTPException(status_code=404, detail="Unit not found")

    if fleet_doc:
        if fleet_doc.get("reserved_by_quote_id"):
            raise HTTPException(status_code=400, detail="Unit is reserved on an open quote - release it there first")
        if fleet_doc.get("destination") == "sold":
            raise HTTPException(status_code=400, detail="Cannot move a sold unit")

        if payload.to in ("new", "service"):
            if payload.to == fleet_doc.get("destination"):
                raise HTTPException(status_code=400, detail=f"Unit is already {payload.to}")
            await db.fleet_units.update_one({"id": unit_id}, {"$set": {"destination": payload.to, "updated_at": now}})
            updated = await db.fleet_units.find_one({"id": unit_id}, {"_id": 0})
            return {"success": True, "collection": "fleet_units", "unit": updated}

        # fleet -> loaner: migrate the document, reuse the same id
        await db.fleet_units.delete_one({"id": unit_id})
        loaner_insert = {
            "id": unit_id,
            "manufacturer_id": fleet_doc.get("manufacturer_id") or "",
            "manufacturer_name": fleet_doc.get("manufacturer_name") or "",
            "model": fleet_doc.get("model") or "",
            "serial_number": fleet_doc.get("serial_number"),
            "notes": fleet_doc.get("notes") or "",
            "status": "available",
            "current_service_request_id": None,
            "created_at": fleet_doc.get("created_at") or now,
            "updated_at": now,
        }
        await db.loaner_units.insert_one(loaner_insert)
        loaner_insert.pop("_id", None)
        return {"success": True, "collection": "loaner_units", "unit": loaner_insert}

    # loaner_doc path
    if loaner_doc.get("status") == "checked_out":
        raise HTTPException(status_code=400, detail="Loaner is currently checked out to a customer - check it in first")
    if payload.to == "loaner":
        raise HTTPException(status_code=400, detail="Unit is already a loaner")

    await db.loaner_units.delete_one({"id": unit_id})
    fleet_insert = {
        "id": unit_id,
        "manufacturer_id": loaner_doc.get("manufacturer_id") or "",
        "manufacturer_name": loaner_doc.get("manufacturer_name") or "",
        "model": loaner_doc.get("model") or "",
        "serial_number": loaner_doc.get("serial_number"),
        "mac_address": "",
        "destination": payload.to,
        "notes": loaner_doc.get("notes") or "",
        "warranty_remaining_days": "",
        "usage_remaining_days": "",
        "software_version": "",
        "firmware_version": "",
        "affiliated_store": "",
        "affiliated_client": "",
        "country": "",
        "province": "",
        **_unit_doc_defaults(),
        "created_at": loaner_doc.get("created_at") or now,
        "updated_at": now,
    }
    await db.fleet_units.insert_one(fleet_insert)
    fleet_insert.pop("_id", None)
    return {"success": True, "collection": "fleet_units", "unit": fleet_insert}


# ============ FLEET CSV IMPORT ============

ROUTING_ALIASES = ("destination", "category", "routing", "new_parts_loaner_service", "type", "assignment")


@router.post("/import/csv")
async def import_fleet_csv(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    """Import a fleet export spreadsheet. Expects a destination column
    (New/Parts/Loaner/Service, case-insensitive) that routes each row:
    New/Service -> fleet_units, Loaner -> loaner_units, Parts -> skipped
    (parts are catalog products, not serialized units - use the product
    CSV importer in ecommerce.py for those)."""
    _require_admin_token(authorization)

    filename = (file.filename or "").lower()
    if not filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are allowed")

    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    try:
        decoded = raw_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="CSV must be UTF-8 encoded")

    reader = csv.DictReader(io.StringIO(decoded))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV header row is missing")

    header_map = build_header_map(reader.fieldnames)
    if not any(normalize_header(alias) in header_map for alias in ROUTING_ALIASES):
        raise HTTPException(
            status_code=400,
            detail="CSV must include a destination column (New/Parts/Loaner/Service) - add a column named 'Destination'",
        )

    created_count = 0
    skipped_count = 0
    total_rows = 0
    errors = []

    for row_index, row in enumerate(reader, start=2):
        if row is None:
            continue
        total_rows += 1
        row_snapshot = {
            normalize_header(key): (value if value is not None else "")
            for key, value in row.items()
            if key is not None
        }

        serial_number = get_csv_value(row, header_map, "sn_pid", "sn", "serial_number", "pid")
        if not serial_number:
            skipped_count += 1
            errors.append({"row": row_index, "serial_number": "", "error": "Missing serial number (SN(PID))", "row_data": row_snapshot})
            continue

        routing_raw = get_csv_value(row, header_map, *ROUTING_ALIASES).strip().lower()
        if routing_raw not in ("new", "parts", "loaner", "service"):
            skipped_count += 1
            errors.append({
                "row": row_index,
                "serial_number": serial_number,
                "error": f"Invalid or missing destination value: '{routing_raw}' (must be New, Parts, Loaner, or Service)",
                "row_data": row_snapshot,
            })
            continue

        if routing_raw == "parts":
            skipped_count += 1
            errors.append({
                "row": row_index,
                "serial_number": serial_number,
                "error": "Parts rows aren't imported here - use the Products CSV importer for catalog items",
                "row_data": row_snapshot,
            })
            continue

        conflict = await _find_serial_conflict(db, serial_number)
        if conflict:
            skipped_count += 1
            errors.append({"row": row_index, "serial_number": serial_number, "error": f"Serial number already exists in {conflict}", "row_data": row_snapshot})
            continue

        product_name = get_csv_value(row, header_map, "product_name")
        model = get_csv_value(row, header_map, "product_model") or product_name
        manufacturer_name = product_name.split()[0] if product_name else ""

        notes_parts = []
        nickname = get_csv_value(row, header_map, "machine_nickname", "nickname")
        if nickname:
            notes_parts.append(f"Nickname: {nickname}")
        source_status = get_csv_value(row, header_map, "status")
        if source_status:
            notes_parts.append(f"Source status: {source_status}")
        notes = "; ".join(notes_parts)

        now = _now_iso()

        if routing_raw == "loaner":
            doc = {
                "id": str(uuid.uuid4()),
                "manufacturer_id": "",
                "manufacturer_name": manufacturer_name,
                "model": model,
                "serial_number": serial_number,
                "notes": notes,
                "status": "available",
                "current_service_request_id": None,
                "created_at": now,
                "updated_at": now,
            }
            await db.loaner_units.insert_one(doc)
        else:
            doc = {
                "id": str(uuid.uuid4()),
                "manufacturer_id": "",
                "manufacturer_name": manufacturer_name,
                "model": model,
                "serial_number": serial_number,
                "mac_address": get_csv_value(row, header_map, "mac_address", "mac"),
                "destination": routing_raw,  # "new" or "service"
                "notes": notes,
                "warranty_remaining_days": get_csv_value(row, header_map, "remaining_warranty_days"),
                "usage_remaining_days": get_csv_value(row, header_map, "remaining_usage_days"),
                "software_version": get_csv_value(row, header_map, "software_version"),
                "firmware_version": get_csv_value(row, header_map, "firmware_version"),
                "affiliated_store": get_csv_value(row, header_map, "affiliated_store"),
                "affiliated_client": get_csv_value(row, header_map, "affiliated_client"),
                "country": get_csv_value(row, header_map, "country_where_the_store_is_located", "country"),
                "province": get_csv_value(row, header_map, "province_where_the_store_is_located", "province"),
                **_unit_doc_defaults(),
                "created_at": now,
                "updated_at": now,
            }
            await db.fleet_units.insert_one(doc)

        created_count += 1

    return {
        "success": True,
        "created_count": created_count,
        "skipped_count": skipped_count,
        "errors": errors[:50],
        "total_errors": len(errors),
        "total_rows": total_rows,
    }


# ============ MIGRATION HELPER (read-only, no auto-write) ============

ROBOT_KEYWORD_PATTERN = re.compile(r"robot|pudu|avidbots|gausium|flashbot|cc1|mt1|scrubber|sweeper", re.IGNORECASE)


@router.get("/migration/candidate-products")
async def list_migration_candidate_products(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    """Read-only checklist of existing `products` catalog rows that might
    actually be whole robots (and so should have product_kind flipped to
    "unit" so they stop being cart-sellable). There's no reliable signal to
    auto-detect this (no dedicated field, only free-text name/category), so
    this never writes anything - it's just a worklist for the admin to
    manually curate in the product editor."""
    _require_admin_token(authorization)

    candidates = await db.products.find(
        {"product_kind": {"$ne": "unit"}},
        {"_id": 0, "id": 1, "name": 1, "category": 1, "sku": 1, "price": 1},
    ).to_list(length=2000)

    matches = [
        p for p in candidates
        if ROBOT_KEYWORD_PATTERN.search(p.get("name") or "") or ROBOT_KEYWORD_PATTERN.search(p.get("category") or "")
    ]
    return {"candidates": matches, "total": len(matches)}


# ============ EXPIRY SWEEP (called by scheduler.py) ============

async def sweep_expired_quote_reservations(db) -> dict:
    """Releases any fleet unit reserved on a quote whose valid_until date has
    passed without being signed/converted, and marks that quote expired.
    Registered as an hourly cron job in scheduler.py."""
    now = datetime.now(timezone.utc)
    candidates = await db.quotes.find(
        {"status": {"$in": ["draft", "sent"]}, "valid_until": {"$nin": [None, ""]}},
        {"_id": 0, "id": 1, "valid_until": 1},
    ).to_list(length=1000)

    expired_quote_ids = []
    for quote in candidates:
        raw = quote.get("valid_until")
        try:
            valid_until = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
            if valid_until.tzinfo is None:
                valid_until = valid_until.replace(tzinfo=timezone.utc)
        except (TypeError, ValueError):
            continue
        if valid_until < now:
            expired_quote_ids.append(quote["id"])

    released_count = 0
    for quote_id in expired_quote_ids:
        result = await db.fleet_units.update_many(
            {"reserved_by_quote_id": quote_id},
            {"$set": {"reserved_by_quote_id": None, "reserved_at": None, "updated_at": now.isoformat()}},
        )
        released_count += result.modified_count
        await db.quotes.update_one(
            {"id": quote_id},
            {"$set": {"status": "expired", "updated_at": now.isoformat()}},
        )

    return {"expired_quotes": len(expired_quote_ids), "released_units": released_count}
