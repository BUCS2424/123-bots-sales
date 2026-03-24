"""
Sitemap Generator & Search Engine Submission
Generates comprehensive sitemaps and submits to major search engines
"""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel
import httpx
import asyncio
import logging
import re
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

sitemap_generator_router = APIRouter(prefix="/sitemap-generator", tags=["SEO"])

_db = None
DEFAULT_LOCATION_PREFIX = "commercial-cleaning-robots"


def _request_base_url(request: Request) -> str:
    forwarded_proto = ((request.headers.get("x-forwarded-proto") or "").split(",")[0]).strip()
    forwarded_host = ((request.headers.get("x-forwarded-host") or "").split(",")[0]).strip()
    host = (request.headers.get("host") or "").strip() or request.url.netloc
    scheme = forwarded_proto or request.url.scheme
    return f"{scheme}://{host or forwarded_host}"


async def _base_url(request: Request) -> str:
    if _db is not None:
        try:
            settings = await _db.admin_settings.find_one({"type": "site_settings"}, {"_id": 0, "site_url": 1})
            raw_site_url = ((settings or {}).get("site_url") or "").strip()
            if raw_site_url:
                candidate = raw_site_url if "://" in raw_site_url else f"https://{raw_site_url}"
                parsed = urlparse(candidate)
                if parsed.scheme and parsed.netloc:
                    return f"{parsed.scheme}://{parsed.netloc}"
        except Exception:
            pass

    return _request_base_url(request)

# Search engine ping endpoints
SEARCH_ENGINES = {
    "google": {
        "name": "Google",
        "ping_url": "https://www.google.com/ping?sitemap=",
        "webmaster_url": "https://search.google.com/search-console"
    },
    "bing": {
        "name": "Bing",
        "ping_url": "https://www.bing.com/ping?sitemap=",
        "webmaster_url": "https://www.bing.com/webmasters"
    },
    "yandex": {
        "name": "Yandex",
        "ping_url": "https://webmaster.yandex.com/ping?sitemap=",
        "webmaster_url": "https://webmaster.yandex.com"
    },
    "indexnow": {
        "name": "IndexNow (Bing/Yandex)",
        "ping_url": "https://api.indexnow.org/indexnow?url=",
        "webmaster_url": "https://www.indexnow.org"
    }
}


def set_database(database):
    global _db
    _db = database


class SitemapConfig(BaseModel):
    include_products: bool = True
    include_categories: bool = True
    include_research: bool = True
    include_locations: bool = True
    include_static_pages: bool = True


class SubmissionResult(BaseModel):
    engine: str
    success: bool
    message: str
    timestamp: str


def _format_date(dt=None):
    if dt is None:
        dt = datetime.now(timezone.utc)
    if isinstance(dt, str):
        return dt[:10]
    return dt.strftime("%Y-%m-%d")


def _slugify(value: str) -> str:
    text = (value or "").lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def _sanitize_location_prefix(prefix_value):
    raw = (prefix_value or "").strip().lower()
    cleaned = "-".join(part for part in raw.split("-") if part)
    return cleaned or DEFAULT_LOCATION_PREFIX


@sitemap_generator_router.get("/stats")
async def get_sitemap_stats():
    """Get statistics for sitemap generation"""
    stats = {
        "products": 0,
        "categories": 0,
        "research_articles": 0,
        "location_pages": 0,
        "static_pages": 10,
        "total_urls": 10,
        "last_generated": None,
        "last_submitted": None
    }
    
    if _db is not None:
        try:
            stats["products"] = await _db.products.count_documents({})
            stats["categories"] = await _db.categories.count_documents({})
            stats["research_articles"] = await _db.research_articles.count_documents({
                "$or": [
                    {"status": "published"},
                    {"status": {"$exists": False}},
                    {"status": ""},
                ]
            })
            stats["location_pages"] = await _db.generated_pages.count_documents({})
            
            stats["total_urls"] = (
                stats["static_pages"] + 
                stats["products"] + 
                stats["categories"] + 
                stats["research_articles"] + 
                stats["location_pages"]
            )
            
            # Get last generation/submission times
            sitemap_meta = await _db.sitemap_meta.find_one({"_id": "sitemap_status"})
            if sitemap_meta:
                stats["last_generated"] = sitemap_meta.get("last_generated")
                stats["last_submitted"] = sitemap_meta.get("last_submitted")
                
        except Exception as e:
            logger.error(f"Error fetching sitemap stats: {e}")
    
    return stats


@sitemap_generator_router.post("/generate")
async def generate_sitemap(request: Request, config: SitemapConfig = None):
    """Generate a comprehensive sitemap"""
    if config is None:
        config = SitemapConfig()
    
    urls = []
    today = _format_date()
    base_url = await _base_url(request)
    
    # Static pages
    if config.include_static_pages:
        static_pages = [
            ("/", "weekly", "1.0"),
            ("/shop", "daily", "0.9"),
            ("/research", "weekly", "0.8"),
            ("/about", "monthly", "0.6"),
            ("/contact", "monthly", "0.6"),
            ("/faq", "monthly", "0.5"),
            ("/terms-conditions", "yearly", "0.3"),
            ("/privacy-policy", "yearly", "0.3"),
            ("/shipping-returns", "monthly", "0.5"),
            ("/compliance", "monthly", "0.4"),
        ]
        
        for path, freq, priority in static_pages:
            urls.append({
                "loc": f"{base_url}{path}",
                "lastmod": today,
                "changefreq": freq,
                "priority": priority,
                "type": "static"
            })
    
    if _db is not None:
        # Products
        if config.include_products:
            try:
                products = await _db.products.find(
                    {},
                    {"seo_url": 1, "slug": 1, "id": 1, "name": 1, "category": 1, "updated_at": 1}
                ).to_list(length=1000)
                
                for product in products:
                    category_slug = _slugify(product.get("category", "products"))
                    name_slug = _slugify(product.get("name", ""))
                    generated = f"{category_slug}/{name_slug}" if name_slug else ""
                    existing_seo = product.get("seo_url")
                    product_identifier = (existing_seo if existing_seo and "/" in str(existing_seo) else None) or generated or product.get("slug") or product.get("id")
                    if product_identifier:
                        urls.append({
                            "loc": f"{base_url}/shop/{product_identifier}",
                            "lastmod": _format_date(product.get("updated_at")),
                            "changefreq": "weekly",
                            "priority": "0.7",
                            "type": "product"
                        })
            except Exception as e:
                logger.error(f"Error fetching products: {e}")
        
        # Categories
        if config.include_categories:
            try:
                categories = await _db.categories.find({}, {"slug": 1, "name": 1, "id": 1}).to_list(length=100)
                
                for category in categories:
                    slug = category.get("slug") or _slugify(category.get("name", "")) or category.get("id", "")
                    if slug:
                        urls.append({
                            "loc": f"{base_url}/shop?category={slug}",
                            "lastmod": today,
                            "changefreq": "weekly",
                            "priority": "0.6",
                            "type": "category"
                        })
            except Exception as e:
                logger.error(f"Error fetching categories: {e}")
        
        # Research articles
        if config.include_research:
            try:
                articles = await _db.research_articles.find(
                    {
                        "$or": [
                            {"status": "published"},
                            {"status": {"$exists": False}},
                            {"status": ""},
                        ]
                    },
                    {"slug": 1, "title": 1, "updated_at": 1}
                ).to_list(length=500)
                
                for article in articles:
                    slug = article.get("slug") or _slugify(article.get("title", ""))
                    if slug:
                        urls.append({
                            "loc": f"{base_url}/research/{slug}",
                            "lastmod": _format_date(article.get("updated_at")),
                            "changefreq": "monthly",
                            "priority": "0.6",
                            "type": "research"
                        })
            except Exception as e:
                logger.error(f"Error fetching research articles: {e}")
        
        # Location pages
        if config.include_locations:
            try:
                locations_cursor = _db.generated_pages.find(
                    {},
                    {"location_slug": 1, "location_type": 1, "generated_at": 1, "location_prefix": 1}
                )
                
                async for loc in locations_cursor:
                    slug = loc.get("location_slug", "")
                    loc_type = loc.get("location_type", "city")
                    priority = "0.6" if loc_type == "state" else "0.5" if loc_type == "county" else "0.4"
                    
                    if slug:
                        location_prefix = _sanitize_location_prefix(loc.get("location_prefix"))
                        urls.append({
                            "loc": f"{base_url}/locations/{location_prefix}-{slug}",
                            "lastmod": _format_date(loc.get("generated_at")),
                            "changefreq": "monthly",
                            "priority": priority,
                            "type": "location"
                        })
            except Exception as e:
                logger.error(f"Error fetching location pages: {e}")
        
        # Update generation timestamp
        try:
            await _db.sitemap_meta.update_one(
                {"_id": "sitemap_status"},
                {"$set": {"last_generated": datetime.now(timezone.utc).isoformat()}},
                upsert=True
            )
        except Exception as e:
            logger.error(f"Error updating sitemap meta: {e}")
    
    return {
        "success": True,
        "total_urls": len(urls),
        "breakdown": {
            "static": len([u for u in urls if u["type"] == "static"]),
            "products": len([u for u in urls if u["type"] == "product"]),
            "categories": len([u for u in urls if u["type"] == "category"]),
            "research": len([u for u in urls if u["type"] == "research"]),
            "locations": len([u for u in urls if u["type"] == "location"]),
        },
        "urls": urls[:100],  # Return first 100 for preview
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@sitemap_generator_router.get("/download")
async def download_sitemap(request: Request):
    """Download the complete sitemap.xml"""
    result = await generate_sitemap(request, SitemapConfig())
    
    xml_urls = []
    for url in result.get("urls", []):
        xml_urls.append(f"""  <url>
    <loc>{url['loc']}</loc>
    <lastmod>{url['lastmod']}</lastmod>
    <changefreq>{url['changefreq']}</changefreq>
    <priority>{url['priority']}</priority>
  </url>""")
    
    # For full sitemap, regenerate all URLs
    full_result = await generate_sitemap(request, SitemapConfig())
    all_urls = full_result.get("urls", [])
    
    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join([f'''  <url>
    <loc>{u['loc']}</loc>
    <lastmod>{u['lastmod']}</lastmod>
    <changefreq>{u['changefreq']}</changefreq>
    <priority>{u['priority']}</priority>
  </url>''' for u in all_urls])}
</urlset>"""
    
    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={
            "Content-Disposition": "attachment; filename=sitemap.xml"
        }
    )


@sitemap_generator_router.post("/submit")
async def submit_to_search_engines(request: Request):
    """Submit sitemap to all major search engines"""
    sitemap_url = f"{await _base_url(request)}/sitemap.xml"
    results = []
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        for engine_id, engine_info in SEARCH_ENGINES.items():
            if engine_id == "indexnow":
                # IndexNow requires different handling
                continue
                
            try:
                ping_url = f"{engine_info['ping_url']}{sitemap_url}"
                response = await client.get(ping_url)
                
                success = response.status_code in [200, 201, 202, 204]
                results.append({
                    "engine": engine_info["name"],
                    "engine_id": engine_id,
                    "success": success,
                    "status_code": response.status_code,
                    "message": "Sitemap submitted successfully" if success else f"Failed with status {response.status_code}",
                    "ping_url": ping_url,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                
            except Exception as e:
                results.append({
                    "engine": engine_info["name"],
                    "engine_id": engine_id,
                    "success": False,
                    "status_code": None,
                    "message": str(e),
                    "ping_url": f"{engine_info['ping_url']}{sitemap_url}",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
    
    # Update submission timestamp
    if _db is not None:
        try:
            await _db.sitemap_meta.update_one(
                {"_id": "sitemap_status"},
                {
                    "$set": {
                        "last_submitted": datetime.now(timezone.utc).isoformat(),
                        "submission_results": results
                    }
                },
                upsert=True
            )
        except Exception as e:
            logger.error(f"Error updating submission meta: {e}")
    
    successful = len([r for r in results if r["success"]])
    total = len(results)
    
    return {
        "success": successful > 0,
        "message": f"Submitted to {successful}/{total} search engines",
        "results": results,
        "sitemap_url": sitemap_url
    }


@sitemap_generator_router.get("/submission-history")
async def get_submission_history():
    """Get history of sitemap submissions"""
    if _db is None:
        return {"submissions": []}
    
    try:
        meta = await _db.sitemap_meta.find_one({"_id": "sitemap_status"})
        if meta:
            return {
                "last_generated": meta.get("last_generated"),
                "last_submitted": meta.get("last_submitted"),
                "submission_results": meta.get("submission_results", [])
            }
    except Exception as e:
        logger.error(f"Error fetching submission history: {e}")
    
    return {"submissions": []}


@sitemap_generator_router.get("/search-engines")
async def get_search_engines():
    """Get list of supported search engines"""
    return {
        "engines": [
            {
                "id": engine_id,
                "name": info["name"],
                "webmaster_url": info["webmaster_url"]
            }
            for engine_id, info in SEARCH_ENGINES.items()
            if engine_id != "indexnow"
        ]
    }
