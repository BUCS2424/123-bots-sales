from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
import re
import csv
import io
import json
from pydantic import BaseModel

from models import (
    Product, ProductCreate, ProductUpdate,
    Category, CategoryCreate,
    Order, OrderCreate, OrderStatusUpdate, OrderStatus,
    Customer,
    Discount, DiscountCreate,
    SalesStats, SalesByPeriod, TopProduct
)
from auth import TokenData, is_admin_or_above, decode_token

def get_ecommerce_router(db: AsyncIOMotorDatabase, require_admin):
    router = APIRouter(prefix="/api/store")

    class CategoryReorderItem(BaseModel):
        id: str
        parent_id: Optional[str] = None
        sort_order: int

    class CategoryReorderRequest(BaseModel):
        items: List[CategoryReorderItem]

    def _category_parent_filter(parent_id: Optional[str]):
        if parent_id:
            return {"parent_id": parent_id}
        return {"$or": [{"parent_id": None}, {"parent_id": {"$exists": False}}]}

    def _slugify_for_seo(value: str) -> str:
        text = (value or "").lower().strip()
        text = re.sub(r"[^a-z0-9\s-]", "", text)
        text = re.sub(r"[\s_]+", "-", text)
        text = re.sub(r"-+", "-", text).strip("-")
        return text or "item"

    def _build_product_seo_url(name: str, category: str) -> str:
        category_slug = _slugify_for_seo(category or "peptides")
        product_slug = _slugify_for_seo(name or "product")
        return f"{category_slug}/{product_slug}"

    def _normalize_category_name(name: Optional[str]) -> str:
        return " ".join((name or "").split()).strip()

    def _dedupe_preserve_order(values: List[str]) -> List[str]:
        unique: List[str] = []
        seen = set()
        for value in values:
            normalized = _normalize_category_name(value)
            if not normalized:
                continue
            key = normalized.lower()
            if key in seen:
                continue
            seen.add(key)
            unique.append(normalized)
        return unique

    def _normalize_product_categories(primary_category: Optional[str], categories: Optional[List[str]]) -> tuple[str, List[str]]:
        category_list = _dedupe_preserve_order(categories or [])
        primary = _normalize_category_name(primary_category)

        if primary:
            category_list = [c for c in category_list if c.lower() != primary.lower()]
            category_list.insert(0, primary)

        if not category_list:
            category_list = ["General"]

        return category_list[0], category_list

    async def _ensure_top_level_categories(category_names: List[str]) -> List[str]:
        ensured_categories: List[str] = []

        for raw_name in category_names:
            category_name = _normalize_category_name(raw_name)
            if not category_name:
                continue

            escaped_name = re.escape(category_name)
            existing = await db.categories.find_one(
                {"name": {"$regex": f"^{escaped_name}$", "$options": "i"}},
                {"_id": 0, "name": 1},
            )
            if existing:
                ensured_categories.append(existing.get("name", category_name))
                continue

            sibling = await db.categories.find(
                _category_parent_filter(None),
                {"_id": 0, "sort_order": 1},
            ).sort("sort_order", -1).limit(1).to_list(1)

            next_sort = (sibling[0].get("sort_order", 0) + 1) if sibling else 0
            now_iso = datetime.now(timezone.utc).isoformat()
            category_doc = {
                "id": str(uuid.uuid4()),
                "name": category_name,
                "description": None,
                "image": None,
                "parent_id": None,
                "sort_order": next_sort,
                "is_enabled": True,
                "seo_title": None,
                "seo_description": None,
                "seo_url": _slugify_for_seo(category_name),
                "custom_fields": [],
                "product_count": 0,
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            await db.categories.insert_one(category_doc)
            ensured_categories.append(category_name)

        return _dedupe_preserve_order(ensured_categories)

    async def _refresh_category_counts(category_names: List[str]):
        for category_name in _dedupe_preserve_order(category_names):
            escaped_name = re.escape(category_name)
            match_expr = {"$regex": f"^{escaped_name}$", "$options": "i"}
            product_count = await db.products.count_documents(
                {
                    "$or": [
                        {"category": match_expr},
                        {"categories": match_expr},
                    ]
                }
            )
            await db.categories.update_one(
                {"name": match_expr},
                {
                    "$set": {
                        "product_count": product_count,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }
                },
            )

    def _csv_normalize_header(value: Optional[str]) -> str:
        return re.sub(r"[^a-z0-9]+", "_", (value or "").strip().lower()).strip("_")

    def _csv_parse_bool(value: Optional[str], default: bool) -> bool:
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

    def _csv_parse_int(value: Optional[str], default: int) -> int:
        if value is None:
            return default
        text = str(value).strip()
        if text == "":
            return default
        try:
            return int(float(text))
        except (TypeError, ValueError):
            return default

    def _csv_parse_float(value: Optional[str], default: Optional[float] = None) -> Optional[float]:
        if value is None:
            return default
        text = str(value).strip()
        if text == "":
            return default
        try:
            return float(text)
        except (TypeError, ValueError):
            return default

    def _csv_parse_list(value: Optional[str], prefer_pipe: bool = False) -> List[str]:
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

    def _csv_parse_json_object(value: Optional[str]) -> Optional[dict]:
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

    async def _build_unique_product_seo_url(
        *,
        name: str,
        category: str,
        sku: Optional[str] = None,
        exclude_product_id: Optional[str] = None,
    ) -> str:
        base = _build_product_seo_url(name, category)
        category_slug, product_slug = base.split("/", 1)
        sku_slug = _slugify_for_seo(sku or "") if sku else ""

        candidate = base
        attempt = 2
        used_sku_suffix = False

        while True:
            query = {"seo_url": candidate}
            if exclude_product_id:
                query["id"] = {"$ne": exclude_product_id}

            existing = await db.products.find_one(query, {"_id": 0, "id": 1})
            if not existing:
                return candidate

            if sku_slug and not used_sku_suffix:
                candidate = f"{category_slug}/{product_slug}-{sku_slug}"
                used_sku_suffix = True
            else:
                candidate = f"{category_slug}/{product_slug}-{attempt}"
                attempt += 1

    async def _ensure_product_seo_url(product: dict) -> dict:
        current_seo = (product.get("seo_url") or "").strip().lower()
        if current_seo and "/" in current_seo:
            return product

        primary_category, _ = _normalize_product_categories(
            product.get("category", ""),
            product.get("categories", []),
        )

        generated = await _build_unique_product_seo_url(
            name=product.get("name", ""),
            category=primary_category,
            sku=product.get("sku"),
            exclude_product_id=product.get("id"),
        )
        product["seo_url"] = generated
        await db.products.update_one(
            {"id": product.get("id")},
            {"$set": {"seo_url": generated, "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
        return product

    async def _enforce_checkout_access(request: Request):
        site_settings = await db.admin_settings.find_one({"type": "site"}, {"_id": 0}) or {}

        require_account_for_checkout = site_settings.get("require_account_for_checkout", False)
        require_email_verification = site_settings.get("require_email_verification_for_registration", True)

        token_data = None
        auth_header = request.headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            token_data = decode_token(auth_header.split(" ", 1)[1].strip())

        if require_account_for_checkout and not token_data:
            raise HTTPException(status_code=401, detail="Account required for checkout")

        if token_data and require_email_verification:
            user = await db.users.find_one({"id": token_data.user_id}, {"_id": 0, "email_verified": 1})
            if user and not user.get("email_verified", False):
                raise HTTPException(status_code=403, detail="Email verification required before checkout")

        return token_data

    # ============ PRODUCTS ============
    
    @router.get("/products", response_model=List[Product])
    async def list_products(
        request: Request,
        category: Optional[str] = None,
        in_stock: Optional[bool] = None,
        search: Optional[str] = None,
        limit: int = 100,
        include_hidden: bool = False
    ):
        """List all products with optional filters. Hidden products only shown to logged-in users."""
        query = {}
        if category:
            query["$and"] = query.get("$and", [])
            query["$and"].append({
                "$or": [
                    {"category": category},
                    {"categories": category},
                ]
            })
        if in_stock is not None:
            query["in_stock"] = in_stock
        if search:
            query["$and"] = query.get("$and", [])
            query["$and"].append({
                "$or": [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}},
                    {"sku": {"$regex": search, "$options": "i"}}
                ]
            })
        
        # Check if user is authenticated - only show hidden products to logged-in users
        is_authenticated = False
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                decode_token(token)
                is_authenticated = True
            except Exception:
                pass
        
        # Filter hidden products for non-authenticated users (unless explicitly requested by admin)
        if not is_authenticated or not include_hidden:
            # Show only visible products OR all products for authenticated users requesting hidden
            if not is_authenticated:
                query["$and"] = query.get("$and", [])
                query["$and"].append({"$or": [{"is_visible": True}, {"is_visible": {"$exists": False}}]})
                # Disabled products (Product availability toggle) should not appear on the public storefront
                query["$and"].append({"$or": [{"in_stock": True}, {"in_stock": {"$exists": False}}]})
        
        products = await db.products.find(query, {"_id": 0}).limit(limit).to_list(limit)
        for product in products:
            await _ensure_product_seo_url(product)
        return products

    @router.get("/products/priced")
    async def list_products_with_pricing(
        request: Request,
        customer_id: Optional[str] = None,
        category: Optional[str] = None,
        in_stock: Optional[bool] = None,
        search: Optional[str] = None,
        limit: int = 100
    ):
        """List all products with pricing based on customer tier. Hidden products only shown to logged-in users."""
        query = {}
        if category:
            query["$and"] = query.get("$and", [])
            query["$and"].append({
                "$or": [
                    {"category": category},
                    {"categories": category},
                ]
            })
        if in_stock is not None:
            query["in_stock"] = in_stock
        if search:
            query["$and"] = query.get("$and", [])
            query["$and"].append({
                "$or": [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}},
                    {"sku": {"$regex": search, "$options": "i"}}
                ]
            })
        
        # Check if user is authenticated - only show hidden products to logged-in users
        is_authenticated = False
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                decode_token(token)
                is_authenticated = True
            except Exception:
                pass
        
        # Filter hidden products for non-authenticated users
        if not is_authenticated:
            query["$and"] = query.get("$and", [])
            query["$and"].append({"$or": [{"is_visible": True}, {"is_visible": {"$exists": False}}]})
            # Disabled products (Product availability toggle) should not appear on the public storefront
            query["$and"].append({"$or": [{"in_stock": True}, {"in_stock": {"$exists": False}}]})
        
        products = await db.products.find(query, {"_id": 0}).limit(limit).to_list(limit)
        for product in products:
            await _ensure_product_seo_url(product)
        
        # Get customer tier if customer_id provided
        customer_type = "retail"
        custom_discount = None
        
        if customer_id:
            customer_settings = await db.customer_settings.find_one({"customer_id": customer_id})
            if customer_settings:
                customer_type = customer_settings.get("customer_type", "retail")
                custom_discount = customer_settings.get("custom_discount_percentage")
        
        # Get wholesale settings
        wholesale_settings = await db.wholesale_settings.find_one({"type": "wholesale"})
        default_discount = wholesale_settings.get("default_discount_percentage", 20.0) if wholesale_settings else 20.0
        
        # Calculate pricing for each product
        priced_products = []
        for product in products:
            retail_price = product.get("price", 0)
            display_price = retail_price
            
            if customer_type == "wholesale":
                # Check for manual wholesale price on product
                manual_price = product.get("wholesale_price")
                if manual_price is not None:
                    display_price = manual_price
                else:
                    # Use custom discount or global discount
                    discount = custom_discount if custom_discount is not None else default_discount
                    display_price = round(retail_price * (1 - discount / 100), 2)
            
            priced_product = {
                **product,
                "display_price": display_price,
                "customer_type": customer_type
            }
            
            # Only include retail_price for wholesale customers (to show savings)
            if customer_type == "wholesale" and display_price < retail_price:
                priced_product["retail_price"] = retail_price
                priced_product["savings_percentage"] = round((1 - display_price / retail_price) * 100, 1)
            
            priced_products.append(priced_product)
        
        return {
            "products": priced_products,
            "customer_type": customer_type,
            "wholesale_discount": default_discount if customer_type == "wholesale" else None
        }

    @router.post("/products/import/csv")
    async def import_products_csv(file: UploadFile = File(...), current_user: TokenData = Depends(require_admin)):
        """Import products from CSV (admin only).

        Rules:
        - Required columns: name, price, category
        - categories column supports comma OR pipe separators
        - If SKU already exists, row is skipped and reported
        - Missing top-level categories are auto-created
        """
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

        header_map = {_csv_normalize_header(header): header for header in reader.fieldnames if header}
        normalized_headers = set(header_map.keys())
        required_headers = {"name", "price", "category"}
        missing_required = sorted(required_headers - normalized_headers)
        if missing_required:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required CSV columns: {', '.join(missing_required)}",
            )

        def get_csv_value(row: dict, *aliases: str) -> str:
            for alias in aliases:
                normalized_alias = _csv_normalize_header(alias)
                raw_key = header_map.get(normalized_alias)
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

        created_count = 0
        skipped_count = 0
        total_rows = 0
        created_product_ids: List[str] = []
        affected_categories: List[str] = []
        errors: List[dict] = []

        for row_index, row in enumerate(reader, start=2):
            if row is None:
                continue

            total_rows += 1
            row_snapshot = {
                _csv_normalize_header(key): (value if value is not None else "")
                for key, value in row.items()
                if key is not None
            }

            name = get_csv_value(row, "name")
            price_raw = get_csv_value(row, "price")
            category_raw = get_csv_value(row, "category")

            if not name:
                skipped_count += 1
                errors.append({
                    "row": row_index,
                    "name": "",
                    "sku": get_csv_value(row, "sku"),
                    "error": "Missing required value: name",
                    "row_data": row_snapshot,
                })
                continue

            parsed_price = _csv_parse_float(price_raw)
            if parsed_price is None:
                skipped_count += 1
                errors.append({
                    "row": row_index,
                    "name": name,
                    "sku": get_csv_value(row, "sku"),
                    "error": "Invalid or missing required value: price",
                    "row_data": row_snapshot,
                })
                continue

            if not category_raw:
                skipped_count += 1
                errors.append({
                    "row": row_index,
                    "name": name,
                    "sku": get_csv_value(row, "sku"),
                    "error": "Missing required value: category",
                    "row_data": row_snapshot,
                })
                continue

            sku_value = get_csv_value(row, "sku")
            if sku_value:
                existing_with_sku = await db.products.find_one(
                    {"sku": {"$regex": f"^{re.escape(sku_value)}$", "$options": "i"}},
                    {"_id": 0, "id": 1, "name": 1, "sku": 1},
                )
                if existing_with_sku:
                    skipped_count += 1
                    errors.append({
                        "row": row_index,
                        "name": name,
                        "sku": sku_value,
                        "error": f"Skipped duplicate SKU: {sku_value}",
                        "row_data": row_snapshot,
                    })
                    continue

            input_categories = [
                category_raw,
                *_csv_parse_list(get_csv_value(row, "categories", "category_list", "category_lists"), prefer_pipe=True),
            ]
            primary_category, normalized_categories = _normalize_product_categories(category_raw, input_categories)
            ensured_categories = await _ensure_top_level_categories(normalized_categories)
            primary_category, normalized_categories = _normalize_product_categories(primary_category, ensured_categories)

            images_list = _csv_parse_list(get_csv_value(row, "images", "image_urls", "image_list"), prefer_pipe=True)
            image_value = get_csv_value(row, "image", "thumbnail", "thumbnail_url")
            if image_value and image_value not in images_list:
                images_list = [image_value, *images_list]
            if not image_value and images_list:
                image_value = images_list[0]

            quantity_value = _csv_parse_int(get_csv_value(row, "quantity", "stock"), 1)
            in_stock_value = _csv_parse_bool(get_csv_value(row, "in_stock"), quantity_value > 0)

            product_id = str(uuid.uuid4())
            now_iso = datetime.now(timezone.utc).isoformat()

            product_doc = {
                "id": product_id,
                "name": name,
                "description": get_csv_value(row, "description") or "",
                "category": primary_category,
                "categories": normalized_categories,
                "price": parsed_price,
                "wholesale_price": _csv_parse_float(get_csv_value(row, "wholesale_price")),
                "original_price": _csv_parse_float(get_csv_value(row, "original_price", "compare_at_price")),
                "image": image_value or "",
                "images": images_list,
                "condition": get_csv_value(row, "condition") or "Good",
                "in_stock": in_stock_value,
                "is_visible": _csv_parse_bool(get_csv_value(row, "is_visible", "visible"), True),
                "quantity": quantity_value,
                "sku": sku_value or f"SKU-{uuid.uuid4().hex[:8].upper()}",
                "weight": _csv_parse_float(get_csv_value(row, "weight")),
                "tags": _csv_parse_list(get_csv_value(row, "tags", "tag_list")),
                "location": get_csv_value(row, "location") or "alabama_pawn_storage",
                "brand": get_csv_value(row, "brand") or None,
                "manufacturer": get_csv_value(row, "manufacturer") or None,
                "upc": get_csv_value(row, "upc") or None,
                "mpn": get_csv_value(row, "mpn") or None,
                "cost_price": _csv_parse_float(get_csv_value(row, "cost_price")),
                "track_quantity": _csv_parse_bool(get_csv_value(row, "track_quantity"), False),
                "requires_shipping": _csv_parse_bool(get_csv_value(row, "requires_shipping"), True),
                "free_shipping": _csv_parse_bool(get_csv_value(row, "free_shipping"), False),
                "shipping_weight": _csv_parse_float(get_csv_value(row, "shipping_weight")),
                "shipping_length": _csv_parse_float(get_csv_value(row, "shipping_length")),
                "shipping_width": _csv_parse_float(get_csv_value(row, "shipping_width")),
                "shipping_height": _csv_parse_float(get_csv_value(row, "shipping_height")),
                "seo_title": get_csv_value(row, "seo_title") or None,
                "seo_description": get_csv_value(row, "seo_description") or None,
                "seo_url": None,
                "related_products": _csv_parse_list(get_csv_value(row, "related_products")),
                "has_options": _csv_parse_bool(get_csv_value(row, "has_options"), False),
                "custom_fields_data": _csv_parse_json_object(get_csv_value(row, "custom_fields_data")),
                "created_at": now_iso,
                "updated_at": now_iso,
                "sold_count": 0,
            }

            product_doc["seo_url"] = await _build_unique_product_seo_url(
                name=product_doc.get("name", ""),
                category=primary_category,
                sku=product_doc.get("sku"),
                exclude_product_id=product_doc["id"],
            )

            await db.products.insert_one(product_doc)
            created_count += 1
            created_product_ids.append(product_doc["id"])
            affected_categories.extend(normalized_categories)

        await _refresh_category_counts(affected_categories)

        return {
            "message": "CSV import completed",
            "required_columns": ["name", "price", "category"],
            "supported_columns": [
                "name", "description", "category", "categories", "price", "sku", "quantity", "in_stock",
                "is_visible", "condition", "image", "images", "tags", "location", "brand", "manufacturer",
                "upc", "mpn", "weight", "wholesale_price", "original_price", "compare_at_price", "cost_price",
                "track_quantity", "requires_shipping", "free_shipping", "shipping_weight", "shipping_length",
                "shipping_width", "shipping_height", "seo_title", "seo_description", "related_products",
                "has_options", "custom_fields_data"
            ],
            "total_rows": total_rows,
            "created_count": created_count,
            "skipped_count": skipped_count,
            "created_product_ids": created_product_ids,
            "errors": errors,
        }

    @router.get("/products/{product_id}", response_model=Product)
    async def get_product(request: Request, product_id: str):
        """Get a single product. Hidden products only visible to logged-in users."""
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Check if product is hidden and user is not authenticated
        is_visible = product.get("is_visible", True)
        in_stock_enabled = product.get("in_stock", True)
        if not is_visible or not in_stock_enabled:
            is_authenticated = False
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                try:
                    token = auth_header.split(" ")[1]
                    decode_token(token)
                    is_authenticated = True
                except Exception:
                    pass
            
            if not is_authenticated:
                raise HTTPException(status_code=404, detail="Product not found")
        
        return await _ensure_product_seo_url(product)

    # ─── Product Files ─────────────────────────────────────────────────────────

    @router.get("/products/{product_id}/files")
    async def list_product_files(product_id: str, request: Request):
        """List files attached to a product. Public files always shown with URL. Private files show URL only if caller is admin or has purchased the product."""
        product = await db.products.find_one({"id": product_id}, {"_id": 0, "product_files": 1})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        files = product.get("product_files") or []

        # Determine caller access level
        caller_has_access = False
        auth_header = request.headers.get("Authorization", "")
        token_str = auth_header.replace("Bearer ", "").strip() if auth_header.startswith("Bearer ") else ""
        token_str = token_str or request.query_params.get("token", "")
        if token_str:
            try:
                token_data = decode_token(token_str)
                if is_admin_or_above(token_data.role):
                    caller_has_access = True
                else:
                    # Check if user has purchased this product
                    order = await db.orders.find_one({
                        "$or": [{"customer_id": token_data.user_id}],
                        "items.product_id": product_id,
                        "status": {"$nin": ["cancelled", "refunded"]}
                    })
                    if order:
                        caller_has_access = True
            except Exception:
                pass

        public_list = []
        for f in files:
            entry = {k: v for k, v in f.items()}
            if not entry.get("is_public", True) and not caller_has_access:
                entry.pop("url", None)  # URL hidden until purchase verified
            public_list.append(entry)
        return {"files": public_list}

    @router.post("/products/{product_id}/files")
    async def upload_product_file(
        product_id: str,
        is_public: bool = Form(False),
        file: UploadFile = File(...),
        current_user: TokenData = Depends(require_admin),
    ):
        """Upload a file to a product (admin only)."""
        from pathlib import Path as PPath
        product = await db.products.find_one({"id": product_id}, {"_id": 0, "id": 1})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        content = await file.read()
        if len(content) > 100 * 1024 * 1024:  # 100MB limit
            raise HTTPException(status_code=400, detail="File too large (max 100MB)")

        import os as _os
        ext = _os.path.splitext(file.filename or "")[1]
        unique_name = f"{uuid.uuid4()}{ext}"
        upload_dir = PPath(f"/app/uploads/product-files/{product_id}")
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = upload_dir / unique_name
        with open(file_path, "wb") as fh:
            fh.write(content)

        file_record = {
            "id": str(uuid.uuid4()),
            "name": file.filename or unique_name,
            "url": f"/api/store/products/{product_id}/files/download/{unique_name}",
            "internal_path": f"product-files/{product_id}/{unique_name}",
            "size": len(content),
            "content_type": file.content_type or "application/octet-stream",
            "is_public": is_public,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
        }

        await db.products.update_one(
            {"id": product_id},
            {"$push": {"product_files": file_record}, "$set": {"updated_at": datetime.now(timezone.utc)}}
        )
        return {"file": file_record}

    @router.delete("/products/{product_id}/files/{file_id}")
    async def delete_product_file(
        product_id: str,
        file_id: str,
        current_user: TokenData = Depends(require_admin),
    ):
        """Delete a file from a product (admin only)."""
        from pathlib import Path as PPath
        product = await db.products.find_one({"id": product_id}, {"_id": 0, "product_files": 1})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        files = product.get("product_files") or []
        target = next((f for f in files if f.get("id") == file_id), None)
        if not target:
            raise HTTPException(status_code=404, detail="File not found")

        # Delete physical file
        internal_path = target.get("internal_path")
        if internal_path:
            fp = PPath(f"/app/uploads/{internal_path}")
            if fp.exists():
                fp.unlink()

        await db.products.update_one(
            {"id": product_id},
            {"$pull": {"product_files": {"id": file_id}}, "$set": {"updated_at": datetime.now(timezone.utc)}}
        )
        return {"success": True}

    @router.patch("/products/{product_id}/files/{file_id}")
    async def update_product_file(
        product_id: str,
        file_id: str,
        payload: dict,
        current_user: TokenData = Depends(require_admin),
    ):
        """Update file metadata (is_public toggle, rename). Admin only."""
        product = await db.products.find_one({"id": product_id}, {"_id": 0, "product_files": 1})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        files = product.get("product_files") or []
        updated = []
        for f in files:
            if f.get("id") == file_id:
                if "is_public" in payload:
                    f["is_public"] = bool(payload["is_public"])
                if "name" in payload and payload["name"]:
                    f["name"] = str(payload["name"])
            updated.append(f)
        await db.products.update_one(
            {"id": product_id},
            {"$set": {"product_files": updated, "updated_at": datetime.now(timezone.utc)}}
        )
        return {"success": True}

    @router.get("/products/{product_id}/files/download/{filename}")
    async def download_product_file(
        product_id: str,
        filename: str,
        request: Request,
    ):
        """Download a product file. Public files: no auth. Private files: must be logged in + have purchased."""
        from pathlib import Path as PPath
        from fastapi.responses import FileResponse as FRResponse

        product = await db.products.find_one({"id": product_id}, {"_id": 0, "product_files": 1})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        files = product.get("product_files") or []
        target = next((f for f in files if f.get("internal_path", "").endswith(filename)), None)
        if not target:
            raise HTTPException(status_code=404, detail="File not found")

        file_path = PPath(f"/app/uploads/{target['internal_path']}")
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on disk")

        if not target.get("is_public", True):
            # Require authentication
            auth_header = request.headers.get("Authorization", "")
            token_str = auth_header.replace("Bearer ", "").strip() if auth_header.startswith("Bearer ") else ""
            # Also allow query param token for direct download links
            token_str = token_str or request.query_params.get("token", "")
            if not token_str:
                raise HTTPException(status_code=401, detail="Authentication required to download this file")
            try:
                token_data = decode_token(token_str)
                user_id = token_data.user_id
            except Exception:
                raise HTTPException(status_code=401, detail="Invalid or expired token")

            # Check if user is admin (admins can always download)
            if not is_admin_or_above(token_data.role):
                # Check if user has an order containing this product
                order = await db.orders.find_one({
                    "customer_id": user_id,
                    "items.product_id": product_id,
                    "status": {"$nin": ["cancelled", "refunded"]}
                })
                if not order:
                    raise HTTPException(status_code=403, detail="Purchase required to download this file")

        return FRResponse(
            path=str(file_path),
            filename=target.get("name", filename),
            media_type=target.get("content_type", "application/octet-stream"),
        )

    @router.get("/products/{product_id}/related", response_model=List[Product])
    async def get_related_products(product_id: str, limit: int = 5):
        """Get related products by category (max 5 by default)."""
        current = await db.products.find_one({"id": product_id}, {"_id": 0, "id": 1, "category": 1, "categories": 1})
        if not current:
            raise HTTPException(status_code=404, detail="Product not found")

        related_limit = max(1, min(limit, 5))
        query = {
            "id": {"$ne": product_id},
            "status": {"$ne": "draft"},
        }
        _, related_categories = _normalize_product_categories(current.get("category"), current.get("categories"))
        query["$and"] = query.get("$and", [])
        query["$and"].append({
            "$or": [
                {"category": {"$in": related_categories}},
                {"categories": {"$in": related_categories}},
            ]
        })

        related = await db.products.find(query, {"_id": 0}).sort("sold_count", -1).limit(related_limit).to_list(related_limit)

        normalized = []
        for product in related:
            normalized.append(await _ensure_product_seo_url(product))
        return normalized

    @router.get("/products/seo/{seo_path:path}", response_model=Product)
    async def get_product_by_seo(request: Request, seo_path: str):
        """Get a single product by SEO URL path: category/product-name. Hidden products only visible to logged-in users."""
        normalized = (seo_path or "").strip().lower().strip("/")
        if not normalized:
            raise HTTPException(status_code=404, detail="Product not found")

        product = await db.products.find_one({"seo_url": normalized}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Check if product is hidden and user is not authenticated
        is_visible = product.get("is_visible", True)
        in_stock_enabled = product.get("in_stock", True)
        if not is_visible or not in_stock_enabled:
            is_authenticated = False
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                try:
                    token = auth_header.split(" ")[1]
                    decode_token(token)
                    is_authenticated = True
                except Exception:
                    pass
            
            if not is_authenticated:
                raise HTTPException(status_code=404, detail="Product not found")

        return product

    @router.get("/products/legacy-seo/{legacy_slug}", response_model=Product)
    async def get_product_by_legacy_slug(legacy_slug: str):
        normalized = (legacy_slug or "").strip().lower().strip("/")
        if not normalized:
            raise HTTPException(status_code=404, detail="Product not found")

        escaped_slug = re.escape(normalized)
        product = await db.products.find_one(
            {
                "$or": [
                    {"seo_url": normalized},
                    {"seo_url": {"$regex": f"/{escaped_slug}$", "$options": "i"}},
                ]
            },
            {"_id": 0},
        )
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        return await _ensure_product_seo_url(product)

    @router.post("/products", response_model=Product)
    async def create_product(product: ProductCreate, current_user: TokenData = Depends(require_admin)):
        """Create a new product (admin only)"""
        now = datetime.now(timezone.utc)
        product_dict = product.model_dump()

        requested_primary, requested_categories = _normalize_product_categories(
            product_dict.get("category"),
            product_dict.get("categories", []),
        )
        ensured_categories = await _ensure_top_level_categories(requested_categories)
        primary_category, normalized_categories = _normalize_product_categories(
            requested_primary,
            ensured_categories,
        )

        product_dict["category"] = primary_category
        product_dict["categories"] = normalized_categories
        product_dict["id"] = str(uuid.uuid4())
        product_dict["sku"] = product_dict.get("sku") or f"SKU-{uuid.uuid4().hex[:8].upper()}"
        product_dict["seo_url"] = await _build_unique_product_seo_url(
            name=product_dict.get("name", ""),
            category=primary_category,
            sku=product_dict.get("sku"),
            exclude_product_id=product_dict["id"],
        )
        product_dict["created_at"] = now.isoformat()
        product_dict["updated_at"] = now.isoformat()
        product_dict["sold_count"] = 0
        
        await db.products.insert_one(product_dict)

        await _refresh_category_counts(normalized_categories)
        
        return product_dict

    @router.put("/products/{product_id}", response_model=Product)
    async def update_product(product_id: str, product: ProductUpdate, current_user: TokenData = Depends(require_admin)):
        """Update a product (admin only)"""
        existing = await db.products.find_one({"id": product_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Product not found")

        existing_primary, existing_categories = _normalize_product_categories(
            existing.get("category"),
            existing.get("categories", []),
        )
        
        update_data = {k: v for k, v in product.model_dump().items() if v is not None}
        update_data.pop("seo_url", None)
        if update_data:
            if "category" in update_data or "categories" in update_data:
                requested_primary = update_data.get("category", existing_primary)
                requested_categories = update_data.get("categories", existing_categories)
                normalized_primary, normalized_categories = _normalize_product_categories(
                    requested_primary,
                    requested_categories,
                )
                ensured_categories = await _ensure_top_level_categories(normalized_categories)
                normalized_primary, normalized_categories = _normalize_product_categories(
                    normalized_primary,
                    ensured_categories,
                )
                update_data["category"] = normalized_primary
                update_data["categories"] = normalized_categories

            incoming_name = update_data.get("name", existing.get("name", ""))
            incoming_category = update_data.get("category", existing_primary)
            name_changed = "name" in update_data and update_data.get("name") != existing.get("name")
            category_changed = incoming_category != existing_primary

            if name_changed or category_changed or not existing.get("seo_url"):
                update_data["seo_url"] = await _build_unique_product_seo_url(
                    name=incoming_name,
                    category=incoming_category,
                    sku=update_data.get("sku", existing.get("sku")),
                    exclude_product_id=product_id,
                )

            update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            await db.products.update_one({"id": product_id}, {"$set": update_data})

            affected_categories = set(existing_categories)
            updated_categories = update_data.get("categories", existing_categories)
            affected_categories.update(updated_categories)
            await _refresh_category_counts(list(affected_categories))
        
        updated = await db.products.find_one({"id": product_id}, {"_id": 0})
        return updated

    @router.delete("/products/{product_id}")
    async def delete_product(product_id: str, current_user: TokenData = Depends(require_admin)):
        """Delete a product (admin only)"""
        product = await db.products.find_one({"id": product_id})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        _, product_categories = _normalize_product_categories(
            product.get("category"),
            product.get("categories", []),
        )
        
        await db.products.delete_one({"id": product_id})

        await _refresh_category_counts(product_categories)
        
        return {"message": "Product deleted successfully"}

    # ============ CATEGORIES ============
    
    @router.get("/categories", response_model=List[Category])
    async def list_categories():
        """List all categories"""
        categories = await db.categories.find({}, {"_id": 0}).sort([
            ("parent_id", 1),
            ("sort_order", 1),
            ("name", 1),
        ]).to_list(500)
        return categories

    @router.post("/categories", response_model=Category)
    async def create_category(category: CategoryCreate, current_user: TokenData = Depends(require_admin)):
        """Create a new category (admin only)"""
        existing = await db.categories.find_one({"name": category.name})
        if existing:
            raise HTTPException(status_code=400, detail="Category already exists")
        
        category_dict = category.model_dump()
        category_dict["parent_id"] = category_dict.get("parent_id") or None
        category_dict["seo_url"] = category_dict.get("seo_url") or _slugify_for_seo(category.name)

        sibling = await db.categories.find(_category_parent_filter(category_dict.get("parent_id")), {"_id": 0, "sort_order": 1}).sort("sort_order", -1).limit(1).to_list(1)
        if sibling:
            category_dict["sort_order"] = max(category_dict.get("sort_order", 0), sibling[0].get("sort_order", 0) + 1)

        category_dict["id"] = str(uuid.uuid4())
        category_dict["product_count"] = 0
        category_dict["created_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.categories.insert_one(category_dict)
        return category_dict

    @router.put("/categories/{category_id}", response_model=Category)
    async def update_category(category_id: str, category: CategoryCreate, current_user: TokenData = Depends(require_admin)):
        """Update a category (admin only)"""
        existing = await db.categories.find_one({"id": category_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Check if new name conflicts with another category
        if category.name != existing.get("name"):
            name_conflict = await db.categories.find_one({"name": category.name, "id": {"$ne": category_id}})
            if name_conflict:
                raise HTTPException(status_code=400, detail="A category with this name already exists")
        
        update_data = category.model_dump()
        update_data["parent_id"] = update_data.get("parent_id") or None
        update_data["seo_url"] = update_data.get("seo_url") or _slugify_for_seo(update_data.get("name", existing.get("name", "")))
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.categories.update_one({"id": category_id}, {"$set": update_data})
        
        updated = await db.categories.find_one({"id": category_id}, {"_id": 0})
        return updated

    @router.post("/categories/reorder")
    async def reorder_categories(payload: CategoryReorderRequest, current_user: TokenData = Depends(require_admin)):
        """Reorder categories and update parent relationships (admin only)."""
        now = datetime.now(timezone.utc).isoformat()

        for item in payload.items:
            await db.categories.update_one(
                {"id": item.id},
                {"$set": {
                    "parent_id": item.parent_id,
                    "sort_order": item.sort_order,
                    "updated_at": now,
                }}
            )

        return {"message": "Categories reordered", "updated": len(payload.items)}

    @router.delete("/categories/{category_id}")
    async def delete_category(category_id: str, current_user: TokenData = Depends(require_admin)):
        """Delete a category (admin only).

        Also strips the category name from any products that reference it so the
        auto-create logic (_ensure_top_level_categories) can't respawn it on the
        next product save/sync. Products left with no category fall back to "General".
        """
        existing = await db.categories.find_one({"id": category_id}, {"_id": 0, "id": 1, "name": 1, "parent_id": 1})
        if not existing:
            raise HTTPException(status_code=404, detail="Category not found")

        deleted_name = _normalize_category_name(existing.get("name"))

        result = await db.categories.delete_one({"id": category_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Category not found")

        # Re-parent child categories to deleted category's parent
        await db.categories.update_many(
            {"parent_id": category_id},
            {"$set": {
                "parent_id": existing.get("parent_id"),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }}
        )

        # Strip the deleted category name from all products that reference it
        affected_categories: List[str] = []
        if deleted_name:
            escaped_name = re.escape(deleted_name)
            match_expr = {"$regex": f"^{escaped_name}$", "$options": "i"}
            products = await db.products.find(
                {"$or": [{"category": match_expr}, {"categories": match_expr}]},
                {"_id": 0, "id": 1, "category": 1, "categories": 1},
            ).to_list(None)

            now_iso = datetime.now(timezone.utc).isoformat()
            for product in products:
                remaining = [
                    c for c in _dedupe_preserve_order(product.get("categories") or [])
                    if c.lower() != deleted_name.lower()
                ]
                primary_category, normalized_categories = _normalize_product_categories(
                    remaining[0] if remaining else None,
                    remaining,
                )
                await db.products.update_one(
                    {"id": product.get("id")},
                    {"$set": {
                        "category": primary_category,
                        "categories": normalized_categories,
                        "updated_at": now_iso,
                    }},
                )
                affected_categories.extend(normalized_categories)

            await _refresh_category_counts(affected_categories)

        return {"message": "Category deleted successfully"}

    # ============ ORDERS ============
    
    @router.get("/orders", response_model=List[Order])
    async def list_orders(
        status: Optional[str] = None,
        customer_email: Optional[str] = None,
        limit: int = 100,
        current_user: TokenData = Depends(require_admin)
    ):
        """List all orders (admin only)"""
        query = {}
        if status:
            query["status"] = status
        if customer_email:
            query["customer_email"] = customer_email
        
        orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
        return orders

    @router.get("/orders/my")
    async def get_my_orders(request: Request):
        """Get orders for the currently logged-in user."""
        auth_header = request.headers.get("Authorization", "")
        token_str = auth_header.replace("Bearer ", "").strip() if auth_header.startswith("Bearer ") else ""
        if not token_str:
            raise HTTPException(status_code=401, detail="Authentication required")
        try:
            token_data = decode_token(token_str)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user = await db.users.find_one({"id": token_data.user_id}, {"_id": 0, "email": 1})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        orders = await db.orders.find(
            {"$or": [{"customer_id": token_data.user_id}, {"customer_email": user["email"]}]},
            {"_id": 0}
        ).sort("created_at", -1).to_list(200)
        return {"orders": orders}

    @router.get("/orders/{order_id}", response_model=Order)
    async def get_order(order_id: str, current_user: TokenData = Depends(require_admin)):
        """Get a single order (admin only)"""
        order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order

    @router.post("/orders", response_model=Order)
    async def create_order(order: OrderCreate, request: Request):
        """Create a new order (public - from checkout)"""
        _ = await _enforce_checkout_access(request)
        now = datetime.now(timezone.utc)
        order_dict = order.model_dump()
        order_dict["id"] = str(uuid.uuid4())
        order_dict["order_number"] = f"APS-{uuid.uuid4().hex[:8].upper()}"
        order_dict["status"] = OrderStatus.PENDING
        order_dict["created_at"] = now.isoformat()
        order_dict["updated_at"] = now.isoformat()
        
        await db.orders.insert_one(order_dict)
        
        # Update product sold counts and inventory
        for item in order.items:
            if item.item_type == "product":
                await db.products.update_one(
                    {"id": item.product_id},
                    {
                        "$inc": {"sold_count": item.quantity, "quantity": -item.quantity},
                    }
                )
                # Check if out of stock
                product = await db.products.find_one({"id": item.product_id})
                if product and product.get("quantity", 0) <= 0:
                    await db.products.update_one(
                        {"id": item.product_id},
                        {"$set": {"in_stock": False}}
                    )
        
        # Update or create customer
        customer = await db.customers.find_one({"email": order.customer_email})
        if customer:
            await db.customers.update_one(
                {"email": order.customer_email},
                {
                    "$inc": {"total_orders": 1, "total_spent": order.total},
                    "$set": {"last_order_at": now.isoformat()}
                }
            )
        else:
            customer_data = {
                "id": str(uuid.uuid4()),
                "email": order.customer_email,
                "name": order.customer_name,
                "phone": order.shipping_address.phone,
                "address": order.shipping_address.address,
                "city": order.shipping_address.city,
                "state": order.shipping_address.state,
                "zip_code": order.shipping_address.zip_code,
                "total_orders": 1,
                "total_spent": order.total,
                "created_at": now.isoformat(),
                "last_order_at": now.isoformat()
            }
            await db.customers.insert_one(customer_data)
        
        return order_dict

    @router.put("/orders/{order_id}/status", response_model=Order)
    async def update_order_status(order_id: str, status_update: OrderStatusUpdate, current_user: TokenData = Depends(require_admin)):
        """Update order status (admin only)"""
        order = await db.orders.find_one({"id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        now = datetime.now(timezone.utc)
        update_data = {
            "status": status_update.status,
            "updated_at": now.isoformat()
        }
        
        if status_update.tracking_number:
            update_data["tracking_number"] = status_update.tracking_number
        
        if status_update.status == OrderStatus.SHIPPED:
            update_data["shipped_at"] = now.isoformat()
        elif status_update.status == OrderStatus.DELIVERED:
            update_data["delivered_at"] = now.isoformat()
        elif status_update.status == OrderStatus.REFUNDED:
            # Restore inventory
            for item in order.get("items", []):
                if item.get("item_type") == "product":
                    await db.products.update_one(
                        {"id": item["product_id"]},
                        {"$inc": {"quantity": item["quantity"], "sold_count": -item["quantity"]}}
                    )
        
        await db.orders.update_one({"id": order_id}, {"$set": update_data})
        
        updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
        return updated

    @router.put("/orders/{order_id}/recurring")
    async def toggle_recurring_order(order_id: str, is_recurring: bool, interval_days: int = 30, current_user: TokenData = Depends(require_admin)):
        """Toggle recurring status for an order (admin only)"""
        order = await db.orders.find_one({"id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        now = datetime.now(timezone.utc)
        update_data = {
            "is_recurring": is_recurring,
            "recurring_interval_days": interval_days,
            "updated_at": now.isoformat()
        }
        
        await db.orders.update_one({"id": order_id}, {"$set": update_data})
        
        return {"success": True, "is_recurring": is_recurring, "interval_days": interval_days}

    @router.post("/orders/{order_id}/send-recurring-invoice")
    async def send_recurring_invoice(order_id: str, current_user: TokenData = Depends(require_admin)):
        """Send a recurring invoice for an order (creates a new pending order based on original)"""
        order = await db.orders.find_one({"id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if not order.get("is_recurring"):
            raise HTTPException(status_code=400, detail="Order is not set up for recurring")
        
        now = datetime.now(timezone.utc)
        
        # Create a new order based on the original
        new_order_number = f"ORD-{now.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
        new_order_id = str(uuid.uuid4())
        
        new_order = {
            "id": new_order_id,
            "order_number": new_order_number,
            "customer_email": order.get("customer_email"),
            "customer_name": order.get("customer_name"),
            "items": order.get("items", []),
            "shipping_address": order.get("shipping_address"),
            "shipping": order.get("shipping"),
            "billing": order.get("billing"),
            "subtotal": order.get("subtotal", 0),
            "tax": order.get("tax", 0),
            "total": order.get("total", 0),
            "shipping_cost": order.get("shipping_cost", 0),
            "payment_method": order.get("payment_method", "card"),
            "notes": f"Recurring order from {order.get('order_number')}",
            "is_recurring": False,  # New order is not recurring itself
            "recurring_interval_days": None,
            "status": "awaiting_payment",
            "payment_status": "pending",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "source": "recurring",
            "original_order_id": order_id
        }
        
        await db.orders.insert_one(new_order)
        
        # Update original order with last invoice timestamp
        recurring_count = order.get("recurring_invoice_count", 0) + 1
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {
                "last_recurring_invoice_at": now.isoformat(),
                "recurring_invoice_count": recurring_count
            }}
        )
        
        # Remove _id from response
        new_order.pop("_id", None)
        
        return {
            "success": True,
            "message": f"Recurring invoice created: {new_order_number}",
            "new_order": new_order,
            "invoice_count": recurring_count
        }

    # ============ CUSTOMERS ============
    
    @router.get("/customers", response_model=List[Customer])
    async def list_customers(search: Optional[str] = None, limit: int = 100, current_user: TokenData = Depends(require_admin)):
        """List all customers (admin only)"""
        query = {}
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        
        customers = await db.customers.find(query, {"_id": 0}).sort("total_spent", -1).limit(limit * 2).to_list(limit * 2)

        if not customers:
            return []

        customer_emails = [c.get("email") for c in customers if c.get("email")]
        role_by_email = {}
        if customer_emails:
            users = await db.users.find({"email": {"$in": customer_emails}}, {"_id": 0, "email": 1, "role": 1}).to_list(len(customer_emails))
            role_by_email = {u.get("email"): u.get("role") for u in users}

        filtered_customers = []
        for customer in customers:
            customer_email = customer.get("email")
            linked_role = role_by_email.get(customer_email)
            if linked_role and linked_role != "user":
                continue
            filtered_customers.append(customer)
            if len(filtered_customers) >= limit:
                break

        return filtered_customers

    @router.get("/customers/{customer_id}", response_model=Customer)
    async def get_customer(customer_id: str, current_user: TokenData = Depends(require_admin)):
        """Get a single customer (admin only)"""
        customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        return customer

    @router.get("/customers/{customer_id}/orders", response_model=List[Order])
    async def get_customer_orders(customer_id: str, current_user: TokenData = Depends(require_admin)):
        """Get all orders for a customer (admin only)"""
        customer = await db.customers.find_one({"id": customer_id})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        orders = await db.orders.find({"customer_email": customer["email"]}, {"_id": 0}).to_list(100)
        return orders

    # ============ DISCOUNTS ============
    
    @router.get("/discounts", response_model=List[Discount])
    async def list_discounts(current_user: TokenData = Depends(require_admin)):
        """List all discounts (admin only)"""
        discounts = await db.discounts.find({}, {"_id": 0}).to_list(100)
        return discounts

    @router.post("/discounts", response_model=Discount)
    async def create_discount(discount: DiscountCreate, current_user: TokenData = Depends(require_admin)):
        """Create a new discount (admin only)"""
        existing = await db.discounts.find_one({"code": discount.code.upper()})
        if existing:
            raise HTTPException(status_code=400, detail="Discount code already exists")
        
        discount_dict = discount.model_dump()
        discount_dict["id"] = str(uuid.uuid4())
        discount_dict["code"] = discount.code.upper()
        discount_dict["times_used"] = 0
        discount_dict["created_at"] = datetime.now(timezone.utc).isoformat()
        if discount_dict.get("expires_at"):
            discount_dict["expires_at"] = discount_dict["expires_at"].isoformat()
        
        await db.discounts.insert_one(discount_dict)
        return discount_dict

    @router.delete("/discounts/{discount_id}")
    async def delete_discount(discount_id: str, current_user: TokenData = Depends(require_admin)):
        """Delete a discount (admin only)"""
        result = await db.discounts.delete_one({"id": discount_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Discount not found")
        return {"message": "Discount deleted successfully"}

    @router.post("/discounts/validate")
    async def validate_discount(code: str, order_total: float):
        """Validate a discount code (public)"""
        discount = await db.discounts.find_one({"code": code.upper(), "is_active": True}, {"_id": 0})
        if not discount:
            raise HTTPException(status_code=404, detail="Invalid discount code")
        
        # Check expiry
        if discount.get("expires_at"):
            expires = datetime.fromisoformat(discount["expires_at"])
            if datetime.now(timezone.utc) > expires:
                raise HTTPException(status_code=400, detail="Discount code has expired")
        
        # Check max uses
        if discount.get("max_uses") and discount.get("times_used", 0) >= discount["max_uses"]:
            raise HTTPException(status_code=400, detail="Discount code has reached maximum uses")
        
        # Check minimum order
        if discount.get("min_order_amount") and order_total < discount["min_order_amount"]:
            raise HTTPException(status_code=400, detail=f"Minimum order amount is ${discount['min_order_amount']}")
        
        # Calculate discount
        if discount["discount_type"] == "percentage":
            discount_amount = order_total * (discount["value"] / 100)
        else:
            discount_amount = min(discount["value"], order_total)
        
        return {
            "valid": True,
            "discount": discount,
            "discount_amount": round(discount_amount, 2)
        }

    # ============ ANALYTICS ============
    
    @router.get("/analytics/stats", response_model=SalesStats)
    async def get_sales_stats(current_user: TokenData = Depends(require_admin)):
        """Get sales statistics (admin only)"""
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Total revenue (completed orders - include paid status)
        pipeline = [
            {"$match": {"status": {"$in": ["paid", "delivered", "shipped", "processing"]}}},
            {"$group": {"_id": None, "total": {"$sum": "$total"}, "count": {"$sum": 1}}}
        ]
        result = await db.orders.aggregate(pipeline).to_list(1)
        total_revenue = result[0]["total"] if result else 0
        total_orders = result[0]["count"] if result else 0
        
        # Today's stats (all orders today including paid)
        today_pipeline = [
            {"$match": {
                "created_at": {"$gte": today_start.isoformat()},
                "status": {"$in": ["paid", "delivered", "shipped", "processing", "pending", "awaiting_payment"]}
            }},
            {"$group": {"_id": None, "total": {"$sum": "$total"}, "count": {"$sum": 1}}}
        ]
        today_result = await db.orders.aggregate(today_pipeline).to_list(1)
        revenue_today = today_result[0]["total"] if today_result else 0
        orders_today = today_result[0]["count"] if today_result else 0
        
        # Counts
        total_customers = await db.customers.count_documents({})
        total_products = await db.products.count_documents({})
        low_stock = await db.products.count_documents({"quantity": {"$lte": 3}, "in_stock": True})
        
        # Pending includes both "pending" and "awaiting_payment"
        pending_orders = await db.orders.count_documents({"status": {"$in": ["pending", "awaiting_payment"]}})
        
        avg_order = total_revenue / total_orders if total_orders > 0 else 0
        
        return SalesStats(
            total_revenue=round(total_revenue, 2),
            total_orders=total_orders,
            average_order_value=round(avg_order, 2),
            total_customers=total_customers,
            total_products=total_products,
            low_stock_count=low_stock,
            pending_orders=pending_orders,
            revenue_today=round(revenue_today, 2),
            orders_today=orders_today
        )

    @router.get("/analytics/sales-by-day", response_model=List[SalesByPeriod])
    async def get_sales_by_day(days: int = 7, current_user: TokenData = Depends(require_admin)):
        """Get sales grouped by day (admin only)"""
        results = []
        for i in range(days - 1, -1, -1):
            day = datetime.now(timezone.utc) - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            # Include paid orders in revenue
            pipeline = [
                {"$match": {
                    "created_at": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()},
                    "status": {"$in": ["paid", "delivered", "shipped", "processing"]}
                }},
                {"$group": {"_id": None, "total": {"$sum": "$total"}, "count": {"$sum": 1}}}
            ]
            result = await db.orders.aggregate(pipeline).to_list(1)
            
            results.append(SalesByPeriod(
                period=day_start.strftime("%m/%d"),
                revenue=round(result[0]["total"], 2) if result else 0,
                orders=result[0]["count"] if result else 0
            ))
        
        return results

    @router.get("/analytics/top-products", response_model=List[TopProduct])
    async def get_top_products(limit: int = 10, current_user: TokenData = Depends(require_admin)):
        """Get top selling products (admin only)"""
        products = await db.products.find(
            {"sold_count": {"$gt": 0}},
            {"_id": 0, "id": 1, "name": 1, "sold_count": 1, "price": 1, "image": 1}
        ).sort("sold_count", -1).limit(limit).to_list(limit)
        
        return [
            TopProduct(
                id=p["id"],
                name=p["name"],
                sold_count=p["sold_count"],
                revenue=round(p["sold_count"] * p["price"], 2),
                image=p.get("image")
            )
            for p in products
        ]

    # ============ INVENTORY ============
    
    @router.get("/inventory")
    async def get_inventory(low_stock_only: bool = False, current_user: TokenData = Depends(require_admin)):
        """Get inventory status (admin only)"""
        query = {}
        if low_stock_only:
            query["quantity"] = {"$lte": 3}
        
        products = await db.products.find(
            query,
            {"_id": 0, "id": 1, "name": 1, "sku": 1, "quantity": 1, "in_stock": 1, "price": 1, "image": 1, "category": 1}
        ).sort("quantity", 1).to_list(500)
        
        return products

    @router.put("/inventory/{product_id}")
    async def update_inventory(product_id: str, quantity: int, current_user: TokenData = Depends(require_admin)):
        """Update product inventory (admin only)"""
        product = await db.products.find_one({"id": product_id})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        update_data = {
            "quantity": quantity,
            "in_stock": quantity > 0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.products.update_one({"id": product_id}, {"$set": update_data})
        return {"message": "Inventory updated", "quantity": quantity, "in_stock": quantity > 0}

    return router
