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
- "sold": terminal state, normally set by the quote-sign flow, but can also
  be set directly (manual create, or CSV import) to backfill a unit that was
  already sold before this system existed.
"""

import json
import re
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from pydantic import BaseModel

from auth import decode_token, is_admin_or_above
from csv_utils import normalize_header, build_header_map, get_csv_value, read_csv_rows

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
    connectivity: Optional[dict] = None
    # destination is intentionally excluded here - reassigning a unit's
    # destination always goes through /units/{id}/move, never a plain edit.
    # location_id is intentionally excluded here too - owned units manage
    # their location through the customer-portal endpoints in user_portal.py,
    # which also validate the location belongs to the same customer.


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
        # Customer-portal "My Robots" fields - which saved location (see
        # customer_locations in user_portal.py) this unit is deployed at,
        # and a place to hold network/connection info for the future
        # device-connectivity work (IP, status, last-seen - populated
        # manually for now, not live-polled).
        "location_id": None,
        "connectivity": {},
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
    if payload.destination not in FLEET_DESTINATIONS:
        raise HTTPException(status_code=400, detail=f"destination must be one of {FLEET_DESTINATIONS} (use /loaners for loaner units)")

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

# One-column-per-target_field alias guesses - the knowledge that used to be
# scattered as inline get_csv_value(...) calls, now shared by both the
# no-mapping import fallback and the preview endpoint's auto-guesser so
# there's exactly one place this lives. "model"/"manufacturer_name"/"notes"
# aren't here - they involve derivation/fallback-chains/composition that
# only make sense in the legacy (no explicit mapping) path; see
# import_fleet_csv's branch for that logic.
ALIAS_TABLE = {
    "serial_number": ("sn_pid", "sn", "serial_number", "pid"),
    "model": ("product_model", "model"),
    "mac_address": ("mac_address", "mac"),
    "affiliated_store": ("affiliated_store",),
    "affiliated_client": ("affiliated_client",),
    "warranty_remaining_days": ("remaining_warranty_days",),
    "usage_remaining_days": ("remaining_usage_days",),
    "software_version": ("software_version",),
    "firmware_version": ("firmware_version",),
    "country": ("country_where_the_store_is_located", "country"),
    "province": ("province_where_the_store_is_located", "province"),
    "destination": ROUTING_ALIASES,
}

TARGET_FIELDS = [
    "serial_number", "destination", "model", "manufacturer_name", "mac_address",
    "affiliated_store", "affiliated_client", "warranty_remaining_days",
    "usage_remaining_days", "software_version", "firmware_version",
    "country", "province", "notes", "ignore",
]


class FleetImportProfileCreate(BaseModel):
    name: str
    mapping: dict  # normalized_header -> target_field
    source_headers: List[str]


class FleetImportProfileUpdate(BaseModel):
    name: Optional[str] = None
    mapping: Optional[dict] = None
    source_headers: Optional[List[str]] = None


def _validate_mapping(mapping: dict):
    seen_targets = {}
    for header, target in mapping.items():
        if target not in TARGET_FIELDS:
            raise HTTPException(status_code=400, detail=f"Unknown target field '{target}' for column '{header}'")
        if target != "ignore":
            if target in seen_targets:
                raise HTTPException(
                    status_code=400,
                    detail=f"Both '{seen_targets[target]}' and '{header}' map to '{target}' - map only one column per field",
                )
            seen_targets[target] = header


# ============ IMPORT PROFILE CRUD ============

@router.get("/import/profiles")
async def list_import_profiles(authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    return await db.fleet_import_profiles.find({}, {"_id": 0}).sort("updated_at", -1).to_list(length=200)


@router.post("/import/profiles")
async def create_import_profile(
    payload: FleetImportProfileCreate,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    _validate_mapping(payload.mapping)
    now = _now_iso()
    doc = {"id": str(uuid.uuid4()), **payload.model_dump(), "created_at": now, "updated_at": now}
    await db.fleet_import_profiles.insert_one(doc)
    return {"success": True, "id": doc["id"]}


@router.put("/import/profiles/{profile_id}")
async def update_import_profile(
    profile_id: str,
    payload: FleetImportProfileUpdate,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    existing = await db.fleet_import_profiles.find_one({"id": profile_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Import profile not found")
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "mapping" in update_data:
        _validate_mapping(update_data["mapping"])
    update_data["updated_at"] = _now_iso()
    await db.fleet_import_profiles.update_one({"id": profile_id}, {"$set": update_data})
    return {"success": True}


@router.delete("/import/profiles/{profile_id}")
async def delete_import_profile(
    profile_id: str,
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    _require_admin_token(authorization)
    result = await db.fleet_import_profiles.delete_one({"id": profile_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Import profile not found")
    return {"success": True}


def _header_overlap_score(file_headers: set, profile_headers: set) -> float:
    if not file_headers or not profile_headers:
        return 0.0
    union = file_headers | profile_headers
    if not union:
        return 0.0
    return len(file_headers & profile_headers) / len(union)


def _guess_mapping(normalized_headers: List[str]) -> dict:
    """One-time alias-based guess for a file with no matching saved profile -
    the same knowledge the no-mapping import path falls back to, so leaving
    this guess untouched and importing reproduces identical legacy behavior."""
    mapping = {}
    for header in normalized_headers:
        matched_target = "ignore"
        for target, aliases in ALIAS_TABLE.items():
            if any(normalize_header(alias) == header for alias in aliases):
                matched_target = target
                break
        mapping[header] = matched_target
    return mapping


@router.post("/import/csv/preview")
async def preview_fleet_csv(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    """Reads a fleet CSV's headers + a few sample rows and suggests a
    column mapping - either a saved profile whose header set overlaps
    heavily with this file, or a one-time alias guess. Never writes
    anything; the real import is a separate call to /import/csv."""
    _require_admin_token(authorization)

    filename = (file.filename or "").lower()
    if not filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are allowed")

    raw_bytes = await file.read()
    try:
        fieldnames, rows = read_csv_rows(raw_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    normalized_headers = [normalize_header(h) for h in fieldnames if h]
    header_pairs = [{"normalized": normalize_header(h), "original": h} for h in fieldnames if h]

    profiles = await db.fleet_import_profiles.find({}, {"_id": 0}).to_list(length=200)
    file_header_set = set(normalized_headers)
    best_profile = None
    best_score = 0.0
    for profile in profiles:
        score = _header_overlap_score(file_header_set, set(profile.get("source_headers") or []))
        if score > best_score:
            best_score = score
            best_profile = profile

    if best_profile and best_score >= 0.6:
        suggested_mapping = {h: (best_profile.get("mapping") or {}).get(h, "ignore") for h in normalized_headers}
        matched_profile_id = best_profile["id"]
    else:
        suggested_mapping = _guess_mapping(normalized_headers)
        matched_profile_id = None

    return {
        "headers": header_pairs,
        "suggested_mapping": suggested_mapping,
        "matched_profile_id": matched_profile_id,
        "sample_rows": rows[:5],
        "total_rows": len(rows),
    }


@router.post("/import/csv")
async def import_fleet_csv(
    file: UploadFile = File(...),
    mapping: Optional[str] = Form(None),
    default_destination: Optional[str] = Form(None),
    authorization: Optional[str] = Header(None),
    db=Depends(get_db),
):
    """Import a fleet export spreadsheet.

    With no `mapping`, column recognition falls back to ALIAS_TABLE (the
    original hardcoded guesses) - unchanged from before the column-mapper
    UI existed, so nothing that already worked breaks.

    With a `mapping` (JSON: {normalized_header: target_field}, from the
    preview+map flow), each field is resolved via that explicit mapping
    instead of alias guessing.

    Either way, each row needs a destination (New/Parts/Loaner/Service/Sold)
    - from a mapped/guessed column, or from `default_destination` applied to
    every row in the file (skips needing a per-row column entirely, for
    files where every row is genuinely the same thing). New/Service/Sold ->
    fleet_units, Loaner -> loaner_units, Parts -> skipped (parts are catalog
    products, not serialized units - use the product CSV importer in
    ecommerce.py for those)."""
    _require_admin_token(authorization)

    filename = (file.filename or "").lower()
    if not filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are allowed")

    raw_bytes = await file.read()
    try:
        fieldnames, rows = read_csv_rows(raw_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    header_map = build_header_map(fieldnames)

    parsed_mapping = None
    if mapping:
        try:
            parsed_mapping = json.loads(mapping)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="Invalid mapping payload")
        _validate_mapping(parsed_mapping)

    if default_destination:
        default_destination = default_destination.strip().lower()
        if default_destination not in ("new", "parts", "loaner", "service", "sold"):
            raise HTTPException(status_code=400, detail="default_destination must be New, Parts, Loaner, Service, or Sold")

    if not default_destination:
        has_destination_column = (
            "destination" in (parsed_mapping or {}).values()
            if parsed_mapping
            else any(normalize_header(alias) in header_map for alias in ROUTING_ALIASES)
        )
        if not has_destination_column:
            raise HTTPException(
                status_code=400,
                detail="Map a column to Destination, add a column named 'Destination' (New/Parts/Loaner/Service/Sold), or choose a default destination for the whole file",
            )

    reverse_mapping = {}
    if parsed_mapping:
        for normalized_header, target in parsed_mapping.items():
            if target != "ignore":
                original = header_map.get(normalized_header)
                if original:
                    reverse_mapping[target] = original

    def resolve(row: dict, target: str, *legacy_aliases: str) -> str:
        """Resolve one target field's value for this row - via the explicit
        mapping if one was given, else the legacy alias guesses."""
        if parsed_mapping:
            original_header = reverse_mapping.get(target)
            if not original_header:
                return ""
            value = row.get(original_header)
            return str(value).strip() if value is not None else ""
        return get_csv_value(row, header_map, *legacy_aliases)

    created_count = 0
    skipped_count = 0
    total_rows = 0
    errors = []

    for row_index, row in enumerate(rows, start=2):
        total_rows += 1
        row_snapshot = {
            normalize_header(key): (value if value is not None else "")
            for key, value in row.items()
            if key is not None
        }

        serial_number = resolve(row, "serial_number", *ALIAS_TABLE["serial_number"])
        if not serial_number:
            skipped_count += 1
            errors.append({"row": row_index, "serial_number": "", "error": "Missing serial number", "row_data": row_snapshot})
            continue

        if default_destination:
            routing_raw = default_destination
        else:
            routing_raw = resolve(row, "destination", *ALIAS_TABLE["destination"]).strip().lower()
        if routing_raw not in ("new", "parts", "loaner", "service", "sold"):
            skipped_count += 1
            errors.append({
                "row": row_index,
                "serial_number": serial_number,
                "error": f"Invalid or missing destination value: '{routing_raw}' (must be New, Parts, Loaner, Service, or Sold)",
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

        if parsed_mapping:
            model = resolve(row, "model")
            manufacturer_name = resolve(row, "manufacturer_name")
            notes = resolve(row, "notes")
        else:
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

        affiliated_store = resolve(row, "affiliated_store", *ALIAS_TABLE["affiliated_store"])
        affiliated_client = resolve(row, "affiliated_client", *ALIAS_TABLE["affiliated_client"])
        mac_address = resolve(row, "mac_address", *ALIAS_TABLE["mac_address"])
        warranty_remaining_days = resolve(row, "warranty_remaining_days", *ALIAS_TABLE["warranty_remaining_days"])
        usage_remaining_days = resolve(row, "usage_remaining_days", *ALIAS_TABLE["usage_remaining_days"])
        software_version = resolve(row, "software_version", *ALIAS_TABLE["software_version"])
        firmware_version = resolve(row, "firmware_version", *ALIAS_TABLE["firmware_version"])
        country = resolve(row, "country", *ALIAS_TABLE["country"])
        province = resolve(row, "province", *ALIAS_TABLE["province"])

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
                "mac_address": mac_address,
                "destination": routing_raw,  # "new", "service", or "sold"
                "notes": notes,
                "warranty_remaining_days": warranty_remaining_days,
                "usage_remaining_days": usage_remaining_days,
                "software_version": software_version,
                "firmware_version": firmware_version,
                "affiliated_store": affiliated_store,
                "affiliated_client": affiliated_client,
                "country": country,
                "province": province,
                **_unit_doc_defaults(),
                "created_at": now,
                "updated_at": now,
            }
            if routing_raw == "sold":
                # Backfilling an already-existing sale from before this system
                # existed - there's no real lead/quote behind it, just whatever
                # ownership info the sheet carries. "Affiliated Store" is the
                # real per-unit identifier in this data (Affiliated Client is
                # often just the same company-wide account name, not per-owner).
                doc["sold_owner_name"] = affiliated_store or None
                doc["sold_at"] = now
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
