from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
import re
import uuid


class KnowledgeArticleBase(BaseModel):
    title: str
    category: str
    summary: str
    content: str
    tags: List[str] = []
    visibility_roles: List[str] = ["super_admin", "admin", "staff"]


class KnowledgeArticleCreate(KnowledgeArticleBase):
    slug: Optional[str] = None


class KnowledgeArticleUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    visibility_roles: Optional[List[str]] = None


def _slugify(value: str) -> str:
    text = (value or "").lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def _can_view(role: str, article_roles: List[str]) -> bool:
    if role == "super_admin":
        return True
    allowed = set(article_roles or ["super_admin", "admin", "staff"])
    return role in allowed


SEED_ARTICLES = [
    {
        "title": "How to Use the POS Section",
        "category": "Operations Guide",
        "summary": "Step-by-step process to run in-store checkout quickly and correctly.",
        "content": "1) Open Admin > POS.\n2) Search products and add them to cart.\n3) Confirm quantity and pricing.\n4) Select payment method and complete sale.\n5) Verify the order appears in Orders.\nTip: Use this for walk-in transactions and rapid checkout flow.",
        "tags": ["pos", "checkout", "in-store", "sales"],
        "visibility_roles": ["super_admin", "admin", "staff"],
    },
    {
        "title": "How to Use Orders",
        "category": "Operations Guide",
        "summary": "Manage incoming orders from pending to completed.",
        "content": "1) Go to Admin > Orders.\n2) Filter by status (pending, processing, shipped, completed).\n3) Open an order to review customer + item details.\n4) Update fulfillment status and save.\n5) Confirm updates are reflected in customer order history.",
        "tags": ["orders", "fulfillment", "status"],
        "visibility_roles": ["super_admin", "admin", "staff"],
    },
    {
        "title": "How to Use Abandoned Carts",
        "category": "Operations Guide",
        "summary": "Recover unfinished checkouts with automated follow-up.",
        "content": "1) Open Admin > Abandoned Carts.\n2) Review cart value, customer email, and last activity.\n3) Trigger or verify follow-up email recovery flow.\n4) Track conversion status and recovered revenue.\nUse this daily to improve checkout completion rate.",
        "tags": ["abandoned carts", "recovery", "email", "conversion"],
        "visibility_roles": ["super_admin", "admin"],
    },
    {
        "title": "How to Use Customers",
        "category": "Operations Guide",
        "summary": "Review customer profiles, order activity, and account context.",
        "content": "1) Open Admin > Customers.\n2) Search by name/email.\n3) Open customer profile for order history and account details.\n4) Use customer context for support and fulfillment decisions.",
        "tags": ["customers", "crm", "accounts"],
        "visibility_roles": ["super_admin", "admin", "staff"],
    },
    {
        "title": "How to Use Products",
        "category": "Operations Guide",
        "summary": "Create and maintain catalog products correctly.",
        "content": "1) Go to Admin > Products.\n2) Use Add New Product for new items.\n3) Use Edit Product dropdown for options, attributes, images, files, shipping, and taxes.\n4) Drag/drop upload images and drag existing images to reorder.\n5) Save and verify storefront rendering.",
        "tags": ["products", "catalog", "images", "editor"],
        "visibility_roles": ["super_admin", "admin", "staff"],
    },
    {
        "title": "How to Use Categories",
        "category": "Operations Guide",
        "summary": "Organize category tree, subcategories, and category SEO.",
        "content": "1) Open Admin > Categories.\n2) Use Add Root Category or Add Subcategory.\n3) Drag and drop categories in the left tree to reorder.\n4) Edit name, image, description on General tab.\n5) Fill SEO tab (title, description, URL) and save.",
        "tags": ["categories", "taxonomy", "seo", "tree"],
        "visibility_roles": ["super_admin", "admin", "staff"],
    },
    {
        "title": "How to Use Inventory",
        "category": "Operations Guide",
        "summary": "Track stock levels and avoid out-of-stock mistakes.",
        "content": "1) Open Admin > Inventory.\n2) Review low stock alerts first.\n3) Adjust product quantities as inventory changes.\n4) Confirm in-stock/out-of-stock status before promotions.",
        "tags": ["inventory", "stock", "alerts"],
        "visibility_roles": ["super_admin", "admin", "staff"],
    },
    {
        "title": "How to Use Gift Cards",
        "category": "Operations Guide",
        "summary": "Issue and track gift card balances.",
        "content": "1) Open Admin > Gift Cards.\n2) Create new card values and assign recipients if needed.\n3) Track redemption and remaining balances.\n4) Resolve support requests by checking card status and history.",
        "tags": ["gift cards", "balance", "redemption"],
        "visibility_roles": ["super_admin", "admin", "staff"],
    },
    {
        "title": "How to Use Shipping",
        "category": "Operations Guide",
        "summary": "Configure shipping providers and verify live rates.",
        "content": "1) Open Admin > Shipping.\n2) Enable provider toggles (Shippo/EasyPost/ShipStation) as needed.\n3) Enter API credentials.\n4) Test connection per provider before going live.\n5) Confirm checkout rates populate correctly.",
        "tags": ["shipping", "providers", "rates"],
        "visibility_roles": ["super_admin", "admin"],
    },
    {
        "title": "How to Use Discounts",
        "category": "Operations Guide",
        "summary": "Create offers and coupon rules safely.",
        "content": "1) Open Admin > Discounts.\n2) Create percentage or fixed discounts.\n3) Set start/end dates and eligibility rules.\n4) Test with a cart before publishing campaign links.",
        "tags": ["discounts", "coupons", "promotions"],
        "visibility_roles": ["super_admin", "admin"],
    },
    {
        "title": "How to Use Reviews",
        "category": "Operations Guide",
        "summary": "Moderate customer reviews and maintain trust.",
        "content": "1) Open Admin > Reviews.\n2) Review pending submissions.\n3) Approve or reject based on policy.\n4) Monitor flagged content and update responses where needed.",
        "tags": ["reviews", "moderation", "trust"],
        "visibility_roles": ["super_admin", "admin", "staff"],
    },
    {
        "title": "How to Use System Emails",
        "category": "Operations Guide",
        "summary": "Manage template-driven emails used by storefront flows.",
        "content": "1) Open Admin > System Emails.\n2) Edit templates (order updates, notifications, recovery flows).\n3) Keep variables intact while changing copy.\n4) Send test email before publishing edits.",
        "tags": ["emails", "templates", "notifications"],
        "visibility_roles": ["super_admin", "admin"],
    },
    {
        "title": "How to Use Analytics",
        "category": "Operations Guide",
        "summary": "Read traffic and conversion metrics for business decisions.",
        "content": "1) Open Admin > Marketing > Analytics.\n2) Review traffic, conversion, and campaign performance.\n3) Compare revenue impact after product or pricing changes.\n4) Export/report key trends weekly.",
        "tags": ["analytics", "reporting", "marketing"],
        "visibility_roles": ["super_admin", "admin"],
    },
    {
        "title": "How to Use User Management",
        "category": "Operations Guide",
        "summary": "Create and manage admin/staff access correctly.",
        "content": "1) Open Admin > User Management.\n2) Add user with proper role.\n3) Keep least-privilege access by role.\n4) Disable/remove users no longer needing access.",
        "tags": ["users", "roles", "permissions"],
        "visibility_roles": ["super_admin", "admin"],
    },
    {
        "title": "How to Use Accounting",
        "category": "Operations Guide",
        "summary": "Track financial summaries and profitability.",
        "content": "1) Open Admin > Accounting.\n2) Review profit, payout, and order cost views.\n3) Validate transaction consistency with Orders and Billing.\n4) Use reports for reconciliation workflows.",
        "tags": ["accounting", "finance", "reports"],
        "visibility_roles": ["super_admin", "admin"],
    },
    {
        "title": "How to Use Johnny 5 Portal",
        "category": "Operations Guide",
        "summary": "Manage connected stores, fulfillment, billing, and stock sync.",
        "content": "1) Open Johnny 5 Dashboard for hub metrics.\n2) Connected Stores: add clone stores, API keys, shipping and stock-sync toggles.\n3) All Orders/Fulfillment: process labels and tracking.\n4) Store Billing: select unbilled orders, generate combined invoice, mark paid.\n5) Connected-store invoices are cost-price only.",
        "tags": ["johnny5", "connected stores", "fulfillment", "billing"],
        "visibility_roles": ["super_admin", "admin", "staff"],
    },
    {
        "title": "How to Use Live Chat",
        "category": "Operations Guide",
        "summary": "Handle support conversations from admin dashboard.",
        "content": "1) Open Admin > Live Chat.\n2) Pick active conversation from queue.\n3) Respond directly or escalate if needed.\n4) Keep notes concise and close resolved conversations properly.",
        "tags": ["live chat", "support", "messages"],
        "visibility_roles": ["super_admin", "admin", "staff"],
    },
    {
        "title": "Wholesale Pricing & Cost Handling",
        "category": "Operations Guide",
        "summary": "Understanding wholesale price hierarchy and how costs are calculated for wholesale customers.",
        "content": """Wholesale Pricing Hierarchy:

The system uses a 3-tier priority for wholesale pricing:

1) OPTION-LEVEL WHOLESALE PRICE (Highest Priority)
   - Set per strength × package combination in Product Editor > Options tab
   - If set, this price is used for that specific variant

2) PRODUCT-LEVEL WHOLESALE PRICE (Second Priority)
   - Set in Product Editor > Manage Pricing Options > Wholesale Price field
   - Used when no option-level price is set

3) GLOBAL WHOLESALE DISCOUNT % (Fallback)
   - Set in User Management > Wholesale Settings > Default Discount Percentage
   - Applied as percentage off retail price when no manual wholesale price exists

How It Works:
- If you enter a wholesale price at option or product level, it OVERRIDES the global discount
- If you leave wholesale price fields EMPTY, the system automatically applies the global discount percentage
- This allows you to set specific prices for certain products while using the default discount for everything else

Example:
- Global discount: 20% off retail
- Product A: No wholesale price set → Customer pays retail minus 20%
- Product B: Wholesale price $50 set → Customer pays exactly $50 regardless of retail price
- Product C, Option "10mg + Single": Wholesale $30 set → That specific variant is $30

Johnny 5 CSV Export/Import:
- The wholesale_price column is included in pricing stock CSV exports
- You can bulk-update wholesale prices via CSV import
- Empty values in CSV preserve the global discount behavior""",
        "tags": ["wholesale", "pricing", "costs", "discount", "b2b"],
        "visibility_roles": ["super_admin", "admin"],
    },
    {
        "title": "Getting Started Checklist for New Employees",
        "category": "Getting Started",
        "summary": "Guided onboarding page for first-day system usage.",
        "content": "Day-1 checklist:\n1) Sign in and verify role access.\n2) Learn POS and Orders flow.\n3) Review Products, Categories, and Inventory basics.\n4) Understand Shipping and customer communication templates.\n5) Practice Live Chat and support handoff.\n6) Ask Admin for any restricted module training (Accounting/User Management/Johnny 5).",
        "tags": ["onboarding", "checklist", "training", "employees"],
        "visibility_roles": ["super_admin", "admin", "staff"],
    },
]


def get_knowledgebase_router(db, require_auth, require_admin):
    router = APIRouter(prefix="/api/knowledgebase", tags=["Knowledgebase"])

    async def ensure_seeded():
        count = await db.knowledgebase_articles.count_documents({})
        if count > 0:
            return

        now = datetime.now(timezone.utc).isoformat()
        docs = []
        for seed in SEED_ARTICLES:
            slug = _slugify(seed["title"])
            docs.append({
                "id": str(uuid.uuid4()),
                "slug": slug,
                "title": seed["title"],
                "category": seed["category"],
                "summary": seed["summary"],
                "content": seed["content"],
                "tags": seed.get("tags", []),
                "visibility_roles": seed.get("visibility_roles", ["super_admin", "admin", "staff"]),
                "created_at": now,
                "updated_at": now,
            })
        if docs:
            await db.knowledgebase_articles.insert_many(docs)

    @router.get("/articles")
    async def list_articles(
        search: str = Query(default=""),
        category: str = Query(default="all"),
        current_user=Depends(require_auth),
    ):
        await ensure_seeded()

        query = {}
        if category != "all":
            query["category"] = category

        if search.strip():
            term = search.strip()
            query["$or"] = [
                {"title": {"$regex": term, "$options": "i"}},
                {"content": {"$regex": term, "$options": "i"}},
                {"summary": {"$regex": term, "$options": "i"}},
                {"tags": {"$elemMatch": {"$regex": term, "$options": "i"}}},
            ]

        docs = await db.knowledgebase_articles.find(query, {"_id": 0}).sort("title", 1).to_list(length=1000)
        visible_docs = [doc for doc in docs if _can_view(current_user.role, doc.get("visibility_roles", []))]
        return {"articles": visible_docs, "total": len(visible_docs)}

    @router.get("/articles/{article_id_or_slug}")
    async def get_article(article_id_or_slug: str, current_user=Depends(require_auth)):
        await ensure_seeded()

        doc = await db.knowledgebase_articles.find_one(
            {"$or": [{"id": article_id_or_slug}, {"slug": article_id_or_slug}]},
            {"_id": 0}
        )
        if not doc:
            raise HTTPException(status_code=404, detail="Article not found")

        if not _can_view(current_user.role, doc.get("visibility_roles", [])):
            raise HTTPException(status_code=403, detail="Not authorized to view this article")

        return doc

    @router.get("/categories")
    async def list_categories(current_user=Depends(require_auth)):
        await ensure_seeded()
        docs = await db.knowledgebase_articles.find({}, {"_id": 0, "category": 1, "visibility_roles": 1}).to_list(length=2000)

        counts = {}
        for doc in docs:
            if not _can_view(current_user.role, doc.get("visibility_roles", [])):
                continue
            category = doc.get("category", "General")
            counts[category] = counts.get(category, 0) + 1

        categories = [{"name": name, "count": count} for name, count in sorted(counts.items())]
        return {"categories": categories}

    @router.post("/articles")
    async def create_article(payload: KnowledgeArticleCreate, current_user=Depends(require_admin)):
        slug = payload.slug or _slugify(payload.title)
        existing = await db.knowledgebase_articles.find_one({"slug": slug}, {"_id": 0, "id": 1})
        if existing:
            raise HTTPException(status_code=400, detail="Article slug already exists")

        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "id": str(uuid.uuid4()),
            "slug": slug,
            **payload.model_dump(),
            "created_at": now,
            "updated_at": now,
            "created_by": current_user.user_id,
        }
        await db.knowledgebase_articles.insert_one(dict(doc))
        doc.pop("_id", None)
        doc.pop("created_by", None)
        return doc

    @router.put("/articles/{article_id}")
    async def update_article(article_id: str, payload: KnowledgeArticleUpdate, current_user=Depends(require_admin)):
        existing = await db.knowledgebase_articles.find_one({"id": article_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Article not found")

        updates = {k: v for k, v in payload.model_dump().items() if v is not None}
        if "title" in updates and "slug" not in updates:
            updates["slug"] = _slugify(updates["title"])

        if not updates:
            return existing

        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        updates["updated_by"] = current_user.user_id
        await db.knowledgebase_articles.update_one({"id": article_id}, {"$set": updates})

        doc = await db.knowledgebase_articles.find_one({"id": article_id}, {"_id": 0})
        doc.pop("updated_by", None)
        doc.pop("created_by", None)
        return doc

    @router.delete("/articles/{article_id}")
    async def delete_article(article_id: str, current_user=Depends(require_admin)):
        result = await db.knowledgebase_articles.delete_one({"id": article_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Article not found")
        return {"message": "Article deleted"}

    @router.post("/seed")
    async def reseed_articles(current_user=Depends(require_admin)):
        await db.knowledgebase_articles.delete_many({})
        await ensure_seeded()
        count = await db.knowledgebase_articles.count_documents({})
        return {"message": "Knowledgebase reseeded", "count": count}

    return router
