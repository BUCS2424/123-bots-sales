"""
Dynamic Sitemap Generator
Generates comprehensive sitemaps including products, categories, and location pages
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Request
from fastapi.responses import Response
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

sitemap_router = APIRouter(tags=["SEO"])

_db = None


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


def set_database(database):
    global _db
    _db = database


def _format_date(dt=None):
    """Format date for sitemap"""
    if dt is None:
        dt = datetime.now(timezone.utc)
    if isinstance(dt, str):
        return dt[:10]
    return dt.strftime("%Y-%m-%d")


@sitemap_router.get("/sitemap.xml", response_class=Response)
async def get_sitemap(request: Request):
    """Generate dynamic XML sitemap"""
    urls = []
    today = _format_date()
    
    base_url = await _base_url(request)

    # Static pages
    static_pages = [
        ("/", "weekly", "1.0"),
        ("/shop", "daily", "0.9"),
        ("/research", "weekly", "0.8"),
        ("/about", "monthly", "0.6"),
        ("/contact", "monthly", "0.6"),
        ("/faq", "monthly", "0.5"),
        ("/terms", "yearly", "0.3"),
        ("/privacy", "yearly", "0.3"),
        ("/shipping", "monthly", "0.5"),
        ("/returns", "monthly", "0.5"),
    ]
    
    for path, freq, priority in static_pages:
        urls.append(f"""  <url>
    <loc>{base_url}{path}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>{freq}</changefreq>
    <priority>{priority}</priority>
  </url>""")
    
    # Product pages
    if _db is not None:
        try:
            products = await _db.products.find(
                {"is_active": {"$ne": False}},
                {"seo_url": 1, "slug": 1, "name": 1, "category": 1, "updated_at": 1}
            ).to_list(length=500)
            
            for product in products:
                category = (product.get("category") or "products").lower().strip().replace(" ", "-")
                name_slug = (product.get("name") or "").lower().strip().replace(" ", "-")
                existing_seo = product.get("seo_url")
                slug = (existing_seo if existing_seo and "/" in str(existing_seo) else None) or (f"{category}/{name_slug}" if name_slug else "") or product.get("slug")
                if slug:
                    lastmod = _format_date(product.get("updated_at"))
                    urls.append(f"""  <url>
    <loc>{base_url}/shop/{slug}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>""")
        except Exception as e:
            logger.error(f"Error fetching products for sitemap: {e}")
    
    # Category pages
    if _db is not None:
        try:
            categories = await _db.categories.find(
                {},
                {"slug": 1}
            ).to_list(length=100)
            
            for category in categories:
                slug = category.get("slug", "")
                if slug:
                    urls.append(f"""  <url>
    <loc>{base_url}/shop?category={slug}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>""")
        except Exception as e:
            logger.error(f"Error fetching categories for sitemap: {e}")
    
    # Research articles
    if _db is not None:
        try:
            articles = await _db.research_articles.find(
                {"status": "published"},
                {"slug": 1, "updated_at": 1}
            ).to_list(length=200)
            
            for article in articles:
                slug = article.get("slug", "")
                if slug:
                    lastmod = _format_date(article.get("updated_at"))
                    urls.append(f"""  <url>
    <loc>{base_url}/research/{slug}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>""")
        except Exception as e:
            logger.error(f"Error fetching research articles for sitemap: {e}")
    
    # Generated location pages
    if _db is not None:
        try:
            locations = await _db.generated_pages.find(
                {},
                {"location_slug": 1, "generated_at": 1}
            ).to_list(length=5000)
            
            for loc in locations:
                slug = loc.get("location_slug", "")
                if slug:
                    lastmod = _format_date(loc.get("generated_at"))
                    urls.append(f"""  <url>
    <loc>{base_url}/locations/custom-sublimation-{slug}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>""")
        except Exception as e:
            logger.error(f"Error fetching location pages for sitemap: {e}")
    
    # Build XML
    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(urls)}
</urlset>"""
    
    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={"Cache-Control": "public, max-age=3600"}
    )


@sitemap_router.get("/sitemap-locations.xml", response_class=Response)
async def get_locations_sitemap(request: Request):
    """Generate sitemap specifically for location pages"""
    urls = []
    
    base_url = await _base_url(request)

    if _db is not None:
        try:
            locations = await _db.generated_pages.find(
                {},
                {"location_slug": 1, "location_type": 1, "generated_at": 1}
            ).to_list(length=10000)
            
            for loc in locations:
                slug = loc.get("location_slug", "")
                loc_type = loc.get("location_type", "city")
                
                # Prioritize states higher than counties/cities
                priority = "0.6" if loc_type == "state" else "0.5" if loc_type == "county" else "0.4"
                
                if slug:
                    lastmod = _format_date(loc.get("generated_at"))
                    urls.append(f"""  <url>
    <loc>{base_url}/locations/custom-sublimation-{slug}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>{priority}</priority>
  </url>""")
        except Exception as e:
            logger.error(f"Error fetching location pages for sitemap: {e}")
    
    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(urls)}
</urlset>"""
    
    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={"Cache-Control": "public, max-age=3600"}
    )


@sitemap_router.get("/robots.txt", response_class=Response)
async def get_robots(request: Request):
    """Serve robots.txt dynamically"""
    base_url = await _base_url(request)

    content = f"""# 123Bots - robots.txt
User-agent: *
Allow: /
Allow: /shop
Allow: /research
Allow: /locations/

# Disallow admin and dev areas
Disallow: /admin
Disallow: /dev
Disallow: /cart
Disallow: /checkout
Disallow: /account

# Sitemaps
Sitemap: {base_url}/sitemap.xml
Sitemap: {base_url}/sitemap-locations.xml
"""
    return Response(
        content=content,
        media_type="text/plain",
        headers={"Cache-Control": "public, max-age=86400"}
    )
