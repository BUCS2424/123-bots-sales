"""
Research Library Module
Provides endpoints for peptide research articles with tagging and search
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import re
import uuid

router = APIRouter(prefix="/research", tags=["Research Library"])

_db = None

def set_database(database):
    global _db
    _db = database

def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text

# Models
class ResearchArticle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    title: str
    subtitle: Optional[str] = None
    category: str
    tags: List[str]
    summary: str
    content: str  # HTML content
    related_products: List[str] = []
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None

class RelatedProduct(BaseModel):
    name: str
    slug: str
    category_slug: str

class ArticleResponse(BaseModel):
    id: str
    slug: str
    title: str
    subtitle: Optional[str]
    category: str
    tags: List[str]
    summary: str
    related_products: List[RelatedProduct]

class ArticleDetailResponse(ArticleResponse):
    content: str
    meta_title: Optional[str]
    meta_description: Optional[str]
    meta_keywords: Optional[str]

class ArticleListResponse(BaseModel):
    items: List[ArticleResponse]
    total: int
    page: int
    limit: int
    has_more: bool

class TagCountResponse(BaseModel):
    tag: str
    count: int

SAFE_FILTER_RE = re.compile(r"^[A-Za-z0-9\s\-&+]{1,60}$")
SAFE_SLUG_RE = re.compile(r"^[a-z0-9-]{3,180}$")
SCRIPT_TAG_RE = re.compile(r"<(script|style|iframe|object|embed)[^>]*>.*?</\\1>", re.IGNORECASE | re.DOTALL)
ON_ATTR_RE = re.compile(r"\son[a-z]+\s*=\s*(['\"]).*?\\1", re.IGNORECASE | re.DOTALL)
JS_PROTOCOL_RE = re.compile(r"(href|src)\s*=\s*(['\"])\s*javascript:.*?\\2", re.IGNORECASE | re.DOTALL)

def _collection():
    if _db is None:
        raise HTTPException(status_code=503, detail="Research library service unavailable")
    return _db.research_articles

def sanitize_filter(value: Optional[str], field_name: str) -> Optional[str]:
    if value is None:
        return None
    clean = value.strip()
    if not clean:
        return None
    if len(clean) > 60 or not SAFE_FILTER_RE.fullmatch(clean):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name} filter")
    return clean

def sanitize_search(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    clean = value.strip()
    if not clean:
        return None
    clean = re.sub(r"\s+", " ", clean)
    if len(clean) > 100:
        raise HTTPException(status_code=400, detail="Search query is too long")
    return clean

def sanitize_html_content(content: str) -> str:
    if not isinstance(content, str):
        return ""
    clean = SCRIPT_TAG_RE.sub("", content)
    clean = ON_ATTR_RE.sub(r"\1", clean)
    clean = JS_PROTOCOL_RE.sub(r"\1=\2#\2", clean)
    return clean


def make_product_slug(name: str) -> str:
    """Convert product name to URL slug"""
    import re
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = re.sub(r'^-|-$', '', slug)
    return slug


async def enrich_related_products(product_names: list) -> list:
    """Convert product name strings to objects with slug and category_slug from seo_url"""
    if not product_names or _db is None:
        return []
    
    # Build a mapping of product name variations to actual products
    # This handles cases like "Tirzepatide 10mg" -> "Tirz"
    NAME_MAPPINGS = {
        "tirzepatide": "tirz",
        "semaglutide": "sema",
        "retatrutide": "reta",
        "cagrilintide": "cagri",
        "ghk-cu": "ghk-cu",
        "melanotan ii": "melanotan ii",
        "mots-c": "mots-c",
        "nad+": "nad+",
        "ss-31": "ss-31",
        "pt-141": "pt-141",
        "igf-1 lr3": "igf-1 lr3",
        "bpc-157/tb-500": "bpc-157 / tb-500 blend",
        "bpc-157/tb-500 blend": "bpc-157 / tb-500 blend",
    }
    
    enriched = []
    for name in product_names:
        slug = make_product_slug(name)
        category_slug = "peptides"  # default
        
        # Try to find actual product to get real seo_url
        try:
            # For names with dosage (e.g., "Tirzepatide 10mg"), extract base name
            # But keep compound names like "BPC-157/TB-500 Blend" intact
            name_lower = name.lower()
            
            # Check full name mapping first
            mapped_name = NAME_MAPPINGS.get(name_lower)
            
            # If no full match, try extracting base name (remove dosage like "10mg")
            if not mapped_name:
                # Remove common dosage patterns at the end
                import re as regex_module
                base_name = regex_module.sub(r'\s+\d+\s*mg$', '', name, flags=regex_module.IGNORECASE).strip()
                base_name_lower = base_name.lower()
                mapped_name = NAME_MAPPINGS.get(base_name_lower)
                
                # If still no mapping, use first word only for simple names
                if not mapped_name and ' ' in base_name and '/' not in base_name:
                    first_word = base_name.split()[0]
                    mapped_name = NAME_MAPPINGS.get(first_word.lower())
            
            # Build search patterns - try exact match first, then partial
            search_patterns = []
            
            # Priority 1: Mapped name exact match
            if mapped_name:
                search_patterns.append({"name": {"$regex": f"^{re.escape(mapped_name)}$", "$options": "i"}})
            
            # Priority 2: Full original name exact match  
            search_patterns.append({"name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}})
            
            # Priority 3: Name without dosage
            base_name = re.sub(r'\s+\d+\s*mg$', '', name, flags=re.IGNORECASE).strip()
            if base_name != name:
                search_patterns.append({"name": {"$regex": f"^{re.escape(base_name)}$", "$options": "i"}})
            
            # Priority 4: Partial match on base name
            search_patterns.append({"name": {"$regex": re.escape(base_name), "$options": "i"}})
            
            product = None
            for pattern in search_patterns:
                product = await _db.products.find_one(pattern, {"seo_url": 1, "category": 1, "name": 1})
                if product:
                    break
            
            if product:
                seo_url = product.get("seo_url", "")
                category = product.get("category", "")
                
                # If seo_url already has category prefix
                if "/" in seo_url:
                    seo_parts = seo_url.split("/")
                    category_slug = seo_parts[0]
                    slug = seo_parts[1]
                else:
                    # Build the category slug from category name
                    slug = seo_url or make_product_slug(product.get("name", name))
                    category_slug = make_product_slug(category) if category else "peptides"
        except Exception:
            pass  # Use default slug if lookup fails
        
        enriched.append({
            "name": name,
            "slug": slug,
            "category_slug": category_slug
        })
    
    return enriched


async def serialize_article(article: dict, include_content: bool = False) -> dict:
    related_products = await enrich_related_products(article.get("related_products", []))
    
    serialized = {
        "id": str(article.get("id") or article.get("slug") or uuid.uuid4()),
        "slug": article.get("slug", ""),
        "title": article.get("title", ""),
        "subtitle": article.get("subtitle"),
        "category": article.get("category", "General"),
        "tags": article.get("tags", []),
        "summary": article.get("summary", ""),
        "related_products": related_products,
        "meta_title": article.get("meta_title"),
        "meta_description": article.get("meta_description"),
        "meta_keywords": article.get("meta_keywords"),
    }
    if include_content:
        serialized["content"] = sanitize_html_content(article.get("content", ""))
    return serialized

# Endpoints
@router.get("/articles", response_model=ArticleListResponse)
async def get_articles(
    category: Optional[str] = Query(None, description="Filter by category"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    search: Optional[str] = Query(None, max_length=100, description="Search articles"),
    page: int = Query(1, ge=1, le=1000),
    limit: int = Query(9, ge=1, le=50)
):
    """Get all research articles with optional filtering"""
    collection = _collection()
    query = {}

    safe_category = sanitize_filter(category, "category")
    safe_tag = sanitize_filter(tag, "tag")
    safe_search = sanitize_search(search)

    if safe_category:
        query["category"] = {"$regex": f"^{re.escape(safe_category)}$", "$options": "i"}

    if safe_tag:
        query["tags"] = {"$regex": f"^{re.escape(safe_tag)}$", "$options": "i"}

    if safe_search:
        safe_search_pattern = re.escape(safe_search)
        query["$or"] = [
            {"title": {"$regex": safe_search_pattern, "$options": "i"}},
            {"summary": {"$regex": safe_search_pattern, "$options": "i"}},
            {"tags": {"$regex": safe_search_pattern, "$options": "i"}}
        ]

    skip = (page - 1) * limit
    total = await collection.count_documents(query)
    articles = await collection.find(
        query,
        {"_id": 0, "content": 0}
    ).sort("title", 1).skip(skip).limit(limit).to_list(limit)

    items = []
    for article in articles:
        serialized = await serialize_article(article)
        items.append(ArticleResponse(**serialized))
    
    return ArticleListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_more=(skip + len(items)) < total
    )

@router.get("/articles/{slug}", response_model=ArticleDetailResponse)
async def get_article(slug: str):
    """Get single article by slug"""
    collection = _collection()
    safe_slug = slug.strip().lower()
    if not SAFE_SLUG_RE.fullmatch(safe_slug):
        raise HTTPException(status_code=400, detail="Invalid article slug")

    article = await collection.find_one({"slug": safe_slug}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    return ArticleDetailResponse(**(await serialize_article(article, include_content=True)))

@router.get("/categories", response_model=List[str])
async def get_categories():
    """Get all unique categories"""
    collection = _collection()
    categories = await collection.distinct("category")
    cleaned_categories = [category.strip() for category in categories if isinstance(category, str) and category.strip()]
    return sorted(cleaned_categories, key=lambda value: value.lower())

@router.get("/tags", response_model=List[TagCountResponse])
async def get_tags():
    """Get all unique tags with counts"""
    collection = _collection()
    pipeline = [
        {"$unwind": "$tags"},
        {"$match": {"tags": {"$type": "string", "$ne": ""}}},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1, "_id": 1}}
    ]
    result = await collection.aggregate(pipeline).to_list(200)
    return [TagCountResponse(tag=item["_id"], count=item["count"]) for item in result]

# Seed function
async def seed_research_articles():
    """No default seed content; each deployment populates its own research articles."""
    return

