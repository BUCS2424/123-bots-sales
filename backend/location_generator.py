from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
import json
import logging
import re
import uuid

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from templates.location_page_123bots_main import generate_location_page_html

logger = logging.getLogger(__name__)

dev_router = APIRouter(prefix="/dev", tags=["Location Generator"])
preview_router = APIRouter(prefix="/dev", tags=["Location Preview"])
public_router = APIRouter(prefix="/locations", tags=["Location Pages"])

_db = None

US_LOCATIONS_PATH = Path("/app/backend/us_locations_data.json")
OUTPUT_DIR = Path("/app/frontend/public/locations")
DEFAULT_LOCATION_PREFIX = "commercial-cleaning-robots"
LOCATION_PREFIX_ALIASES = (
    DEFAULT_LOCATION_PREFIX,
    "commercial-cleaning-robots",
    "cleaning-robots",
    "custom-sublimation",
    "123bots",
    "peptide-research-supply",
)

STATE_ABBR_MAP = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
    "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
    "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
    "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO",
    "montana": "MT", "nebraska": "NE", "nevada": "NV", "new-hampshire": "NH", "new-jersey": "NJ",
    "new-mexico": "NM", "new-york": "NY", "north-carolina": "NC", "north-dakota": "ND", "ohio": "OH",
    "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode-island": "RI", "south-carolina": "SC",
    "south-dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT",
    "virginia": "VA", "washington": "WA", "west-virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
}


class GenerateStateRequest(BaseModel):
    include_counties: bool = True
    include_cities: bool = True


class LocationSlugSettingsRequest(BaseModel):
    location_slug_prefix: str


def set_database(database):
    global _db
    _db = database


def _slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    value = re.sub(r"\s+", "-", value)
    value = re.sub(r"-+", "-", value)
    return value.strip("-")


def _get_state_abbr(state_slug: str) -> str:
    return STATE_ABBR_MAP.get(state_slug, state_slug[:2].upper())


def _load_us_locations() -> dict:
    try:
        with US_LOCATIONS_PATH.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError:
        return {}


def _sanitize_location_prefix(prefix: Optional[str]) -> str:
    sanitized = _slugify(prefix or "")
    if not sanitized:
        return DEFAULT_LOCATION_PREFIX
    return sanitized


def _known_location_prefixes(active_prefix: str) -> tuple[str, ...]:
    ordered = [active_prefix, *LOCATION_PREFIX_ALIASES]
    unique_prefixes = []
    for prefix in ordered:
        normalized = _sanitize_location_prefix(prefix)
        if normalized not in unique_prefixes:
            unique_prefixes.append(normalized)
    return tuple(unique_prefixes)


def _build_filename(location_slug: str, prefix: str) -> str:
    return f"{prefix}-{location_slug}"


def _parse_location_request(filename: str, active_prefix: str) -> tuple[Optional[str], Optional[str]]:
    normalized = filename.strip().lower()
    if not normalized:
        return None, None

    if normalized.endswith(".html"):
        normalized = normalized[:-5]

    if "." in normalized:
        return None, None

    for prefix in _known_location_prefixes(active_prefix):
        prefix_token = f"{prefix.lower()}-"
        if normalized.startswith(prefix_token):
            slug = normalized[len(prefix_token):]
            return (slug or None), prefix

    return normalized, None


async def _save_generated_page(
    location_name: str,
    location_slug: str,
    location_type: str,
    parent_state: str,
    file_path: Path,
    location_prefix: str,
):
    if _db is None:
        return

    await _db.generated_pages.update_one(
        {"location_slug": location_slug},
        {
            "$set": {
                "id": str(uuid.uuid4()),
                "location_name": location_name,
                "location_slug": location_slug,
                "location_type": location_type,
                "parent_state": parent_state,
                "file_path": str(file_path),
                "location_prefix": location_prefix,
                "generated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
        upsert=True,
    )


async def _get_location_slug_prefix() -> str:
    if _db is None:
        return DEFAULT_LOCATION_PREFIX

    try:
        settings = await _db.admin_settings.find_one(
            {"type": "location_slug_settings"},
            {"_id": 0, "location_slug_prefix": 1},
        )
        return _sanitize_location_prefix((settings or {}).get("location_slug_prefix"))
    except Exception:
        return DEFAULT_LOCATION_PREFIX


async def _get_hero_settings():
    """Fetch hero settings from the database"""
    if _db is None:
        return {}
    try:
        settings = await _db.admin_settings.find_one(
            {"type": "hero_display"},
            {"_id": 0}
        )
        return settings or {}
    except Exception:
        return {}


async def _get_site_settings():
    """Fetch site settings (logo, favicon, site name) from the database"""
    if _db is None:
        return {}
    try:
        settings = await _db.admin_settings.find_one(
            {"type": "site"},
            {"_id": 0}
        )
        return settings or {}
    except Exception:
        return {}


@preview_router.get("/location-preview")
async def location_preview():
    data = _load_us_locations()
    sample_slug = "florida" if "florida" in data else next(iter(data.keys()), None)
    if not sample_slug:
        raise HTTPException(status_code=404, detail="No location data available")

    hero_settings = await _get_hero_settings()
    site_settings = await _get_site_settings()
    location_prefix = await _get_location_slug_prefix()
    state_data = data[sample_slug]
    html = generate_location_page_html(
        location_name=state_data.get("name", sample_slug.title()),
        location_type="state",
        state_name=state_data.get("name", sample_slug.title()),
        state_slug=sample_slug,
        county_count=len(state_data.get("counties", [])),
        city_count=len(state_data.get("cities", [])),
        counties=state_data.get("counties", [])[:30],
        cities=state_data.get("cities", [])[:100],
        hero_settings=hero_settings,
        site_settings=site_settings,
        location_url_prefix=location_prefix,
    )
    return HTMLResponse(content=html)


@dev_router.get("/location-slug-settings")
async def get_location_slug_settings():
    location_slug_prefix = await _get_location_slug_prefix()
    return {
        "location_slug_prefix": location_slug_prefix,
        "prefix_preview_example": f"{location_slug_prefix}-missouri",
    }


@dev_router.put("/location-slug-settings")
async def update_location_slug_settings(payload: LocationSlugSettingsRequest):
    if _db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    location_slug_prefix = _sanitize_location_prefix(payload.location_slug_prefix)
    now = datetime.now(timezone.utc).isoformat()
    await _db.admin_settings.update_one(
        {"type": "location_slug_settings"},
        {
            "$set": {
                "type": "location_slug_settings",
                "location_slug_prefix": location_slug_prefix,
                "updated_at": now,
            }
        },
        upsert=True,
    )

    return {
        "success": True,
        "location_slug_prefix": location_slug_prefix,
        "prefix_preview_example": f"{location_slug_prefix}-missouri",
        "message": "Location slug prefix updated",
    }


@public_router.get("/{filename}")
async def serve_generated_page(filename: str):
    raw_filename = filename.strip()
    if not raw_filename:
        raise HTTPException(status_code=404, detail="Page not found")

    normalized_filename = raw_filename.lower()
    location_prefix = await _get_location_slug_prefix()
    location_slug, requested_prefix = _parse_location_request(raw_filename, location_prefix)

    file_candidates = [
        OUTPUT_DIR / raw_filename,
        OUTPUT_DIR / normalized_filename,
    ]

    if normalized_filename.endswith(".html"):
        file_candidates.append(OUTPUT_DIR / normalized_filename[:-5])

    if location_slug:
        for known_prefix in _known_location_prefixes(location_prefix):
            file_candidates.append(OUTPUT_DIR / _build_filename(location_slug, known_prefix))

    seen_paths = set()
    deduped_candidates = []
    for path in file_candidates:
        path_key = str(path)
        if path_key in seen_paths:
            continue
        seen_paths.add(path_key)
        deduped_candidates.append(path)

    for file_path in deduped_candidates:
        if file_path.exists():
            return HTMLResponse(content=file_path.read_text(encoding="utf-8"))

    if not location_slug:
        raise HTTPException(status_code=404, detail="Page not found")

    page_prefix = requested_prefix or location_prefix

    data = _load_us_locations()
    hero_settings = await _get_hero_settings()
    site_settings = await _get_site_settings()

    if location_slug in data:
        state_data = data[location_slug]
        html = generate_location_page_html(
            location_name=state_data.get("name", location_slug.title()),
            location_type="state",
            state_name=state_data.get("name", location_slug.title()),
            state_slug=location_slug,
            county_count=len(state_data.get("counties", [])),
            city_count=len(state_data.get("cities", [])),
            counties=state_data.get("counties", [])[:30],
            cities=state_data.get("cities", [])[:100],
            hero_settings=hero_settings,
            site_settings=site_settings,
            location_url_prefix=page_prefix,
        )
        return HTMLResponse(content=html)

    parts = location_slug.rsplit("-", 1)
    state_slug = None
    if len(parts) == 2:
        abbr = parts[1].upper()
        state_slug = next((slug for slug, code in STATE_ABBR_MAP.items() if code == abbr), None)
    if not state_slug or state_slug not in data:
        raise HTTPException(status_code=404, detail="Location page not found")

    state_data = data[state_slug]
    state_name = state_data.get("name", state_slug.title())
    counties = state_data.get("counties", [])
    cities = state_data.get("cities", [])
    raw_slug = parts[0]

    city_match = next((city for city in cities if _slugify(city) == raw_slug), None)
    if city_match:
        html = generate_location_page_html(
            location_name=city_match,
            location_type="city",
            state_name=state_name,
            state_slug=state_slug,
            county_count=len(counties),
            city_count=len(cities),
            hero_settings=hero_settings,
            site_settings=site_settings,
            location_url_prefix=page_prefix,
        )
        return HTMLResponse(content=html)

    county_match = next((county for county in counties if _slugify(county.replace(" County", "")) == raw_slug), None)
    if county_match:
        # For county pages, show a subset of cities from the state
        # In a real scenario, you'd filter cities by county
        html = generate_location_page_html(
            location_name=county_match,
            location_type="county",
            state_name=state_name,
            state_slug=state_slug,
            county_count=len(counties),
            city_count=len(cities),
            counties=[],  # Counties don't have sub-counties
            cities=cities[:50],  # Show cities from the state
            hero_settings=hero_settings,
            site_settings=site_settings,
            location_url_prefix=page_prefix,
        )
        return HTMLResponse(content=html)

    raise HTTPException(status_code=404, detail="Location page not found")


@dev_router.get("/us-states")
async def us_states():
    data = _load_us_locations()
    states = []
    for slug, state_data in data.items():
        if not isinstance(state_data, dict):
            continue
        county_count = len(state_data.get("counties", []))
        city_count = len(state_data.get("cities", []))
        states.append(
            {
                "name": state_data.get("name", slug.title()),
                "slug": slug,
                "abbr": _get_state_abbr(slug),
                "county_count": county_count,
                "city_count": city_count,
                "total_pages": 1 + county_count + city_count,
            }
        )
    return sorted(states, key=lambda item: item["name"])


@dev_router.get("/location-data/{state_slug}")
async def state_data(state_slug: str):
    data = _load_us_locations()
    if state_slug not in data:
        raise HTTPException(status_code=404, detail="State not found")
    state = data[state_slug]
    return {
        "name": state.get("name", state_slug.title()),
        "slug": state_slug,
        "counties": state.get("counties", []),
        "cities": state.get("cities", []),
    }


@dev_router.get("/stats")
async def generation_stats():
    data = _load_us_locations()
    total_states = len([value for value in data.values() if isinstance(value, dict)])
    total_counties = sum(len(value.get("counties", [])) for value in data.values() if isinstance(value, dict))
    total_cities = sum(len(value.get("cities", [])) for value in data.values() if isinstance(value, dict))
    generated = await _db.generated_pages.count_documents({}) if _db is not None else 0

    return {
        "states": total_states,
        "counties": total_counties,
        "cities": total_cities,
        "generated_pages": generated,
        "total_locations": total_states + total_counties + total_cities,
    }


@dev_router.get("/generated-pages-grouped")
async def grouped_generated_pages():
    if _db is None:
        return {"states": []}

    pipeline = [
        {"$group": {"_id": "$parent_state", "count": {"$sum": 1}, "types": {"$push": "$location_type"}}},
        {"$sort": {"_id": 1}},
    ]

    result = []
    async for doc in _db.generated_pages.aggregate(pipeline):
        result.append(
            {
                "slug": doc["_id"],
                "total_pages": doc["count"],
                "states": doc["types"].count("state"),
                "counties": doc["types"].count("county"),
                "cities": doc["types"].count("city"),
            }
        )
    return {"states": result}


@dev_router.post("/generate-state/{state_slug}")
async def generate_state_pages(state_slug: str, request: Optional[GenerateStateRequest] = None):
    data = _load_us_locations()
    if state_slug not in data:
        raise HTTPException(status_code=404, detail="State not found")

    state_data = data[state_slug]
    state_name = state_data.get("name", state_slug.title())
    counties = state_data.get("counties", [])
    cities = state_data.get("cities", [])
    state_abbr = _get_state_abbr(state_slug).lower()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    generated = 0
    errors = 0
    
    # Fetch settings once for all pages
    hero_settings = await _get_hero_settings()
    site_settings = await _get_site_settings()
    location_prefix = await _get_location_slug_prefix()

    try:
        state_location_slug = state_slug
        state_filename = _build_filename(state_location_slug, location_prefix)
        state_path = OUTPUT_DIR / state_filename
        state_html = generate_location_page_html(
            location_name=state_name,
            location_type="state",
            state_name=state_name,
            state_slug=state_slug,
            county_count=len(counties),
            city_count=len(cities),
            counties=counties[:30],
            cities=cities[:100],
            hero_settings=hero_settings,
            site_settings=site_settings,
            location_url_prefix=location_prefix,
        )
        state_path.write_text(state_html, encoding="utf-8")
        await _save_generated_page(state_name, state_location_slug, "state", state_slug, state_path, location_prefix)
        generated += 1
    except Exception as error:
        logger.error("Failed to generate state page for %s: %s", state_slug, error)
        errors += 1

    include_counties = True if request is None else request.include_counties
    include_cities = True if request is None else request.include_cities

    if include_counties:
        for county in counties:
            try:
                county_slug = _slugify(county.replace(" County", ""))
                location_slug = f"{county_slug}-{state_abbr}"
                file_path = OUTPUT_DIR / _build_filename(location_slug, location_prefix)
                html = generate_location_page_html(
                    location_name=county,
                    location_type="county",
                    state_name=state_name,
                    state_slug=state_slug,
                    county_count=len(counties),
                    city_count=len(cities),
                    hero_settings=hero_settings,
                    site_settings=site_settings,
                    location_url_prefix=location_prefix,
                )
                file_path.write_text(html, encoding="utf-8")
                await _save_generated_page(county, location_slug, "county", state_slug, file_path, location_prefix)
                generated += 1
            except Exception as error:
                logger.error("Failed county page generation (%s): %s", county, error)
                errors += 1

    if include_cities:
        for city in cities:
            try:
                city_slug = _slugify(city)
                location_slug = f"{city_slug}-{state_abbr}"
                file_path = OUTPUT_DIR / _build_filename(location_slug, location_prefix)
                html = generate_location_page_html(
                    location_name=city,
                    location_type="city",
                    state_name=state_name,
                    state_slug=state_slug,
                    county_count=len(counties),
                    city_count=len(cities),
                    hero_settings=hero_settings,
                    site_settings=site_settings,
                    location_url_prefix=location_prefix,
                )
                file_path.write_text(html, encoding="utf-8")
                await _save_generated_page(city, location_slug, "city", state_slug, file_path, location_prefix)
                generated += 1
            except Exception as error:
                logger.error("Failed city page generation (%s): %s", city, error)
                errors += 1

    return {
        "message": f"Generated {generated} pages for {state_name}",
        "generated": generated,
        "errors": errors,
        "state": state_name,
        "prefix": location_prefix,
    }


@dev_router.delete("/generated-pages/bulk/state/{state_slug}")
async def delete_state_generated_pages(state_slug: str):
    if _db is None:
        return {"message": "Database unavailable", "deleted_count": 0}

    pages = await _db.generated_pages.find({"parent_state": state_slug}, {"_id": 0}).to_list(100000)
    deleted_files = 0
    for page in pages:
        path_value = page.get("file_path")
        if not path_value:
            continue
        path = Path(path_value)
        if path.exists():
            try:
                path.unlink()
                deleted_files += 1
            except Exception as error:
                logger.error("Unable to delete generated file %s: %s", path, error)

    delete_result = await _db.generated_pages.delete_many({"parent_state": state_slug})
    return {
        "message": f"Deleted generated pages for {state_slug}",
        "deleted_count": delete_result.deleted_count,
        "files_deleted": deleted_files,
    }



# Analytics script to inject into all pages
A2G_ANALYTICS_SCRIPT = '<script data-host="https://a2ganalytics.com" data-dnt="false" src="https://a2ganalytics.com/js/script.js" id="ZwSg9rf6GA" async defer></script>'


@dev_router.post("/inject-analytics")
async def inject_analytics_into_all_pages():
    """Inject A2G Analytics script into all existing generated pages"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    updated_count = 0
    skipped_count = 0
    errors = []
    
    # Get all generated pages
    pages = await _db.generated_pages.find({}).to_list(length=10000)
    
    for page in pages:
        try:
            file_path = page.get("file_path")
            if not file_path:
                continue
                
            full_path = Path(file_path)
            if not full_path.exists():
                errors.append(f"{page.get('location_slug', 'unknown')}: file not found")
                continue
            
            # Read the file
            with open(full_path, "r", encoding="utf-8") as f:
                html = f.read()
            
            # Check if analytics already present
            if "a2ganalytics.com" in html:
                skipped_count += 1
                continue
            
            # Inject script right after opening <head> tag
            if "<head>" in html:
                new_html = html.replace(
                    "<head>",
                    f"<head>\n  <!-- A2G Analytics -->\n  {A2G_ANALYTICS_SCRIPT}",
                    1
                )
                
                # Write back to file
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(new_html)
                updated_count += 1
                        
        except Exception as e:
            errors.append(f"{page.get('location_slug', 'unknown')}: {str(e)}")
    
    return {
        "message": "Analytics injection complete",
        "pages_updated": updated_count,
        "pages_skipped_already_has_analytics": skipped_count,
        "total_pages": len(pages),
        "errors": errors[:10] if errors else []
    }



# Hero video HTML to inject
HERO_VIDEO_HTML = '''<video class="hero-video" autoplay muted loop playsinline>
      <source src="/hero-video.mp4" type="video/mp4">
    </video>'''

# Updated hero CSS (replaces old ::before pseudo-element)
HERO_VIDEO_CSS = '''.hero-video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.35;
      z-index: 0;
    }'''


@dev_router.post("/inject-hero-video")
async def inject_hero_video_into_all_pages():
    """Inject hero video into all existing generated location pages"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    updated_count = 0
    skipped_count = 0
    errors = []
    
    # Get all generated pages
    pages = await _db.generated_pages.find({}).to_list(length=10000)
    
    for page in pages:
        try:
            file_path = page.get("file_path")
            if not file_path:
                continue
                
            full_path = Path(file_path)
            if not full_path.exists():
                errors.append(f"{page.get('location_slug', 'unknown')}: file not found")
                continue
            
            # Read the file
            with open(full_path, "r", encoding="utf-8") as f:
                html = f.read()
            
            # Check if video already present
            if "hero-video" in html:
                skipped_count += 1
                continue
            
            modified = False
            
            # 1. Add video CSS - replace the old ::before style or add new
            if ".hero::before" in html:
                # Remove the old ::before pseudo-element and add video CSS
                import re
                # Remove .hero::before { ... } block
                html = re.sub(
                    r'\.hero::before\s*\{[^}]+\}',
                    HERO_VIDEO_CSS,
                    html,
                    count=1
                )
                modified = True
            elif ".hero {" in html and ".hero-video" not in html:
                # Add video CSS after .hero { ... } block
                html = html.replace(
                    ".hero::after {",
                    HERO_VIDEO_CSS + "\n    .hero::after {",
                    1
                )
                modified = True
            
            # 2. Add video element right after <section class="hero">
            if '<section class="hero">' in html and '<video class="hero-video"' not in html:
                html = html.replace(
                    '<section class="hero">',
                    f'<section class="hero">\n    {HERO_VIDEO_HTML}',
                    1
                )
                modified = True
            
            if modified:
                # Write back to file
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(html)
                updated_count += 1
                        
        except Exception as e:
            errors.append(f"{page.get('location_slug', 'unknown')}: {str(e)}")
    
    return {
        "message": "Hero video injection complete",
        "pages_updated": updated_count,
        "pages_skipped_already_has_video": skipped_count,
        "total_pages": len(pages),
        "errors": errors[:10] if errors else []
    }



@dev_router.post("/regenerate-all-pages")
async def regenerate_all_pages():
    """Regenerate all existing location pages with the latest template"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Get all unique states that have generated pages
    pages = await _db.generated_pages.find({}).to_list(length=10000)
    states_with_pages = set()
    for page in pages:
        state_slug = page.get("parent_state")
        if state_slug:
            states_with_pages.add(state_slug)
    
    if not states_with_pages:
        return {"message": "No pages to regenerate", "states": 0, "total_regenerated": 0}
    
    total_regenerated = 0
    total_errors = 0
    state_results = []
    
    data = _load_us_locations()
    
    # Fetch settings once for all pages
    hero_settings = await _get_hero_settings()
    site_settings = await _get_site_settings()
    default_location_prefix = await _get_location_slug_prefix()
    
    for state_slug in states_with_pages:
        if state_slug not in data:
            state_results.append({"state": state_slug, "status": "skipped", "reason": "state data not found"})
            continue
            
        state_data = data[state_slug]
        state_name = state_data.get("name", state_slug.title())
        counties = state_data.get("counties", [])
        cities = state_data.get("cities", [])
        
        generated = 0
        errors = 0
        
        # Get existing pages for this state
        state_pages = await _db.generated_pages.find({"parent_state": state_slug}).to_list(length=5000)
        
        for page in state_pages:
            try:
                location_type = page.get("location_type")
                location_name = page.get("location_name")
                file_path = page.get("file_path")
                
                if not file_path or not location_name:
                    continue
                
                # Regenerate the page with the new template
                html = generate_location_page_html(
                    location_name=location_name,
                    location_type=location_type,
                    state_name=state_name,
                    state_slug=state_slug,
                    county_count=len(counties),
                    city_count=len(cities),
                    counties=counties[:30] if location_type == "state" else None,
                    cities=cities[:100] if location_type == "state" else None,
                    hero_settings=hero_settings,
                    site_settings=site_settings,
                    location_url_prefix=_sanitize_location_prefix(page.get("location_prefix") or default_location_prefix),
                )
                
                # Write to file
                Path(file_path).write_text(html, encoding="utf-8")
                generated += 1
                
            except Exception as e:
                logger.error(f"Error regenerating {page.get('location_slug', 'unknown')}: {e}")
                errors += 1
        
        total_regenerated += generated
        total_errors += errors
        state_results.append({
            "state": state_name,
            "regenerated": generated,
            "errors": errors
        })
    
    return {
        "message": f"Regenerated {total_regenerated} pages across {len(states_with_pages)} states",
        "total_regenerated": total_regenerated,
        "total_errors": total_errors,
        "states_processed": len(states_with_pages),
        "state_results": state_results
    }
