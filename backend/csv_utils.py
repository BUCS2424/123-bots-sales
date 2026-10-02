"""
Shared CSV-import helpers.

Originally inline in ecommerce.py's product importer; lifted out once a
second real consumer (the fleet unit importer) needed the same header
normalization / aliasing / typed-parsing conventions rather than a third
copy-paste (leads.py's CSV import predates this and still has its own
looser, per-field inline version).
"""

import csv
import io
import json
import re
from typing import Dict, List, Optional, Tuple


def read_csv_rows(raw_bytes: bytes) -> Tuple[List[str], List[dict]]:
    """Decode + parse a CSV once. Raises ValueError on bad encoding or a
    missing header row - callers translate that into their own HTTPException
    (keeps this module free of any web-framework dependency)."""
    if not raw_bytes:
        raise ValueError("CSV file is empty")
    try:
        decoded = raw_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise ValueError("CSV must be UTF-8 encoded")

    reader = csv.DictReader(io.StringIO(decoded))
    if not reader.fieldnames:
        raise ValueError("CSV header row is missing")

    rows = [row for row in reader if row is not None]
    return list(reader.fieldnames), rows


def normalize_header(value: Optional[str]) -> str:
    return re.sub(r"[^a-z0-9]+", "_", (value or "").strip().lower()).strip("_")


def build_header_map(fieldnames) -> Dict[str, str]:
    """Map a normalized header name back to the CSV's original header text."""
    return {normalize_header(header): header for header in (fieldnames or []) if header}


def get_csv_value(row: dict, header_map: Dict[str, str], *aliases: str) -> str:
    for alias in aliases:
        raw_key = header_map.get(normalize_header(alias))
        if raw_key is None:
            continue
        value = row.get(raw_key)
        if value is None:
            continue
        text = str(value).strip()
        if text == "":
            continue
        return text
    return ""


def parse_bool(value: Optional[str], default: bool) -> bool:
    if value is None:
        return default
    text = str(value).strip().lower()
    if text == "":
        return default
    if text in {"1", "true", "yes", "y", "on"}:
        return True
    if text in {"0", "false", "no", "n", "off"}:
        return False
    return default


def parse_int(value: Optional[str], default: int) -> int:
    if value is None:
        return default
    text = str(value).strip()
    if text == "":
        return default
    try:
        return int(float(text))
    except (TypeError, ValueError):
        return default


def parse_float(value: Optional[str], default: Optional[float] = None) -> Optional[float]:
    if value is None:
        return default
    text = str(value).strip()
    if text == "":
        return default
    try:
        return float(text)
    except (TypeError, ValueError):
        return default


def parse_list(value: Optional[str], prefer_pipe: bool = False) -> List[str]:
    if value is None:
        return []
    text = str(value).strip()
    if not text:
        return []

    if prefer_pipe and "|" in text:
        parts = text.split("|")
    elif "|" in text:
        parts = text.split("|")
    elif "," in text:
        parts = text.split(",")
    elif ";" in text:
        parts = text.split(";")
    else:
        parts = [text]

    return [" ".join(p.split()).strip() for p in parts if " ".join(p.split()).strip()]


def parse_json_object(value: Optional[str]) -> Optional[dict]:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        return None
    return None
