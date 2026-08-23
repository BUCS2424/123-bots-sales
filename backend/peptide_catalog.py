from datetime import datetime, timezone
import re
import uuid


CATALOG_VERSION = "peptide_pdf_catalog_v1"

CATALOG_CATEGORIES = [
    "Healing / Recovery",
    "Cognitive / Neuro",
    "Aesthetic / Skin",
    "Semaglutide",
    "Tirzepatide",
    "Retatrutide",
    "Other Metabolic",
    "Performance / Specialty",
    "Other",
]

CATEGORY_DESCRIPTIONS = {
    "Healing / Recovery": "Peptides focused on tissue support, recovery, and restorative research pathways.",
    "Cognitive / Neuro": "Compounds curated for neurological, cognitive, and neuro-signaling research.",
    "Aesthetic / Skin": "Peptide options relevant to dermal and cosmetic science research models.",
    "Semaglutide": "Semaglutide category from source catalog with selectable strengths and kit options.",
    "Tirzepatide": "Tirzepatide category from source catalog with selectable strengths and kit options.",
    "Retatrutide": "Retatrutide category from source catalog with selectable strengths and kit options.",
    "Other Metabolic": "Additional metabolic and mitochondrial-support research compounds.",
    "Performance / Specialty": "Performance-oriented and specialty compounds with configurable options.",
    "Other": "Additional catalog compounds from the source PDF.",
}

IMAGE_POOL = [
    "https://images.unsplash.com/photo-1618015358417-324e6c9a8400?auto=format&fit=crop&w=1200&q=80",
    "https://images.pexels.com/photos/9259964/pexels-photo-9259964.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=1200",
    "https://images.pexels.com/photos/6129873/pexels-photo-6129873.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=1200",
    "https://images.unsplash.com/photo-1655210913810-33acfa96d1e6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1601839215170-6ce5854968d6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1675336753554-5493966a6970?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1562411053-c9ac630a5934?auto=format&fit=crop&w=1200&q=80",
    "https://images.pexels.com/photos/10514991/pexels-photo-10514991.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=1200",
]


def _single_strength_matrix(strength: str, single: float, half: float, full: float):
    return {
        strength: {
            "Single Vial": single,
            "Half Kit": half,
            "Full Kit": full,
        }
    }


CATALOG_SOURCE = [
    {"name": "BPC-157", "category": "Healing / Recovery", "matrix": _single_strength_matrix("10 mg", 40.0, 145.0, 220.0)},
    {"name": "TB-500", "category": "Healing / Recovery", "matrix": _single_strength_matrix("10 mg", 85.0, 340.0, 505.0)},
    {
        "name": "BPC-157 / TB-500 Blend",
        "category": "Healing / Recovery",
        "matrix": {
            "5 mg / 5 mg": {"Single Vial": 75.0, "Half Kit": 300.0, "Full Kit": 450.0},
            "10 mg / 10 mg": {"Single Vial": 120.0, "Half Kit": 480.0, "Full Kit": 720.0},
        },
    },
    {
        "name": "KPV",
        "category": "Healing / Recovery",
        "matrix": {
            "10 mg": {"Single Vial": 40.0, "Half Kit": 145.0, "Full Kit": 220.0},
            "30 mg": {"Single Vial": 75.0, "Half Kit": 300.0, "Full Kit": 450.0},
        },
    },
    {"name": "TA1", "category": "Healing / Recovery", "matrix": _single_strength_matrix("10 mg", 70.0, 280.0, 420.0)},
    {"name": "DSIP", "category": "Healing / Recovery", "matrix": _single_strength_matrix("10 mg", 40.0, 145.0, 220.0)},
    {"name": "VIP", "category": "Healing / Recovery", "matrix": _single_strength_matrix("5 mg", 55.0, 205.0, 310.0)},
    {"name": "Selank", "category": "Cognitive / Neuro", "matrix": _single_strength_matrix("10 mg", 40.0, 145.0, 220.0)},
    {"name": "Semax", "category": "Cognitive / Neuro", "matrix": _single_strength_matrix("10 mg", 40.0, 145.0, 220.0)},
    {"name": "Snap-8", "category": "Cognitive / Neuro", "matrix": _single_strength_matrix("10 mg", 40.0, 145.0, 220.0)},
    {"name": "NA Selank Amidate", "category": "Cognitive / Neuro", "matrix": _single_strength_matrix("30 mg", 105.0, 420.0, 635.0)},
    {"name": "NA Semax Amidate", "category": "Cognitive / Neuro", "matrix": _single_strength_matrix("30 mg", 105.0, 420.0, 635.0)},
    {"name": "GHK-CU", "category": "Aesthetic / Skin", "matrix": _single_strength_matrix("100 mg", 55.0, 205.0, 310.0)},
    {"name": "Sema", "category": "Semaglutide", "matrix": _single_strength_matrix("10 mg", 40.0, 145.0, 220.0)},
    {
        "name": "Tirz",
        "category": "Tirzepatide",
        "matrix": {
            "10 mg": {"Single Vial": 50.0, "Half Kit": 195.0, "Full Kit": 290.0},
            "15 mg": {"Single Vial": 60.0, "Half Kit": 240.0, "Full Kit": 365.0},
            "20 mg": {"Single Vial": 70.0, "Half Kit": 280.0, "Full Kit": 420.0},
            "25 mg": {"Single Vial": 80.0, "Half Kit": 320.0, "Full Kit": 395.0},
            "30 mg": {"Single Vial": 90.0, "Half Kit": 360.0, "Full Kit": 545.0},
            "40 mg": {"Single Vial": 110.0, "Half Kit": 435.0, "Full Kit": 650.0},
            "50 mg": {"Single Vial": 120.0, "Half Kit": 480.0, "Full Kit": 725.0},
            "60 mg": {"Single Vial": 135.0, "Half Kit": 540.0, "Full Kit": 815.0},
        },
    },
    {
        "name": "Reta",
        "category": "Retatrutide",
        "matrix": {
            "18 mg": {"Single Vial": 90.0, "Half Kit": 360.0, "Full Kit": 545.0},
            "20 mg": {"Single Vial": 110.0, "Half Kit": 435.0, "Full Kit": 650.0},
            "30 mg": {"Single Vial": 135.0, "Half Kit": 530.0, "Full Kit": 800.0},
            "40 mg": {"Single Vial": 150.0, "Half Kit": 600.0, "Full Kit": 905.0},
            "48 mg": {"Single Vial": 160.0, "Half Kit": 625.0, "Full Kit": 940.0},
            "60 mg": {"Single Vial": 190.0, "Half Kit": 760.0, "Full Kit": 1140.0},
        },
    },
    {"name": "Cagri", "category": "Other Metabolic", "matrix": _single_strength_matrix("4.5 mg", 55.0, 205.0, 310.0)},
    {"name": "Setmelanotide", "category": "Other Metabolic", "matrix": _single_strength_matrix("10 mg", 70.0, 280.0, 420.0)},
    {
        "name": "Survodutide",
        "category": "Other Metabolic",
        "matrix": {
            "6 mg": {"Single Vial": 70.0, "Half Kit": 280.0, "Full Kit": 420.0},
            "12 mg": {"Single Vial": 105.0, "Half Kit": 420.0, "Full Kit": 635.0},
        },
    },
    {"name": "NAD+", "category": "Other Metabolic", "matrix": _single_strength_matrix("1000 mg", 90.0, 360.0, 545.0)},
    {"name": "Glutathione", "category": "Other Metabolic", "matrix": _single_strength_matrix("1760 mg", 75.0, 300.0, 455.0)},
    {
        "name": "Ipamorelin",
        "category": "Performance / Specialty",
        "matrix": {
            "5 mg": {"Single Vial": 40.0, "Half Kit": 145.0, "Full Kit": 220.0},
            "10 mg": {"Single Vial": 70.0, "Half Kit": 280.0, "Full Kit": 420.0},
        },
    },
    {"name": "Sermorelin", "category": "Performance / Specialty", "matrix": _single_strength_matrix("10 mg", 85.0, 340.0, 510.0)},
    {"name": "CJC-1295 (No DAC)", "category": "Performance / Specialty", "matrix": _single_strength_matrix("10 mg", 70.0, 280.0, 420.0)},
    {"name": "CJC-1295 (w/ DAC)", "category": "Performance / Specialty", "matrix": _single_strength_matrix("5 mg", 70.0, 280.0, 420.0)},
    {"name": "IGF-1 LR3", "category": "Performance / Specialty", "matrix": _single_strength_matrix("1 mg", 90.0, 350.0, 525.0)},
    {"name": "Tesamorelin", "category": "Performance / Specialty", "matrix": _single_strength_matrix("10 mg", 90.0, 350.0, 525.0)},
    {"name": "MOTS-C", "category": "Performance / Specialty", "matrix": _single_strength_matrix("30 mg", 105.0, 420.0, 635.0)},
    {"name": "SS-31", "category": "Performance / Specialty", "matrix": _single_strength_matrix("50 mg", 140.0, 555.0, 835.0)},
    {"name": "Ara-290", "category": "Performance / Specialty", "matrix": _single_strength_matrix("30 mg", 90.0, 350.0, 530.0)},
    {"name": "PT-141", "category": "Performance / Specialty", "matrix": _single_strength_matrix("10 mg", 45.0, 180.0, 275.0)},
    {"name": "KLOW", "category": "Performance / Specialty", "matrix": _single_strength_matrix("80 units", 120.0, 480.0, 725.0)},
    {"name": "Melanotan II", "category": "Other", "matrix": _single_strength_matrix("10 mg", 40.0, 145.0, 220.0)},
    {"name": "GLOW", "category": "Other", "matrix": _single_strength_matrix("70 units", 105.0, 420.0, 635.0)},
]


def _slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    value = re.sub(r"\s+", "-", value)
    return value


def _sku(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9]+", "-", value.upper()).strip("-")
    return f"PEP-{cleaned[:34]}"


def _build_option_data(matrix: dict):
    strengths = list(matrix.keys())
    return {
        "strength_options": strengths,
        "package_options": ["Single Vial", "Half Kit", "Full Kit"],
        "pricing_matrix": matrix,
        "default_strength": strengths[0],
        "default_package": "Single Vial",
    }


def _flatten_prices(matrix: dict):
    values = []
    for package_prices in matrix.values():
        values.extend(package_prices.values())
    return values


def _build_product(entry: dict, index: int):
    now = datetime.now(timezone.utc).isoformat()
    option_data = _build_option_data(entry["matrix"])
    default_strength = option_data["default_strength"]
    default_package = option_data["default_package"]
    base_price = option_data["pricing_matrix"][default_strength][default_package]
    all_prices = _flatten_prices(option_data["pricing_matrix"])
    max_price = max(all_prices)
    image = IMAGE_POOL[index % len(IMAGE_POOL)]
    name = entry["name"]
    category = entry["category"]
    seo_slug = _slugify(name)

    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "description": f"{name} for non-human research use with configurable strengths and kit options. Includes Single Vial, Half Kit, and Full Kit packaging.",
        "category": category,
        "price": float(base_price),
        "original_price": float(max_price),
        "image": image,
        "images": [image],
        "condition": "Lab Grade",
        "in_stock": True,
        "quantity": 125,
        "sku": _sku(name),
        "weight": 0.05,
        "tags": [
            "Research Use Only",
            category,
            "Peptide",
        ],
        "location": "alabama_pawn_storage",
        "brand": "123Bots",
        "manufacturer": "123Bots",
        "track_quantity": True,
        "requires_shipping": True,
        "free_shipping": False,
        "shipping_weight": 0.05,
        "shipping_length": 4.0,
        "shipping_width": 4.0,
        "shipping_height": 1.0,
        "seo_title": f"{name} | {category} | 123Bots",
        "seo_description": f"{name} peptide catalog entry with selectable strengths and vial kit options for research use.",
        "seo_url": seo_slug,
        "related_products": [],
        "has_options": True,
        "custom_fields_data": option_data,
        "sold_count": 0,
        "created_at": now,
        "updated_at": now,
    }


async def sync_pdf_catalog(db):
    marker = await db.admin_settings.find_one({"type": "catalog_seed", "key": "peptide_pdf_catalog"}, {"_id": 0})
    if marker and marker.get("version") == CATALOG_VERSION:
        return {"updated": False, "products": await db.products.count_documents({}), "categories": await db.categories.count_documents({})}

    await db.products.delete_many({})
    await db.categories.delete_many({})

    category_docs = []
    for category in CATALOG_CATEGORIES:
        category_docs.append(
            {
                "id": str(uuid.uuid4()),
                "name": category,
                "description": CATEGORY_DESCRIPTIONS.get(category, "Catalog category"),
                "product_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    if category_docs:
        await db.categories.insert_many(category_docs)

    product_docs = [_build_product(entry, index) for index, entry in enumerate(CATALOG_SOURCE)]
    if product_docs:
        await db.products.insert_many(product_docs)

    for category in CATALOG_CATEGORIES:
        count = sum(1 for product in product_docs if product["category"] == category)
        await db.categories.update_one({"name": category}, {"$set": {"product_count": count}})

    await db.admin_settings.update_one(
        {"type": "catalog_seed", "key": "peptide_pdf_catalog"},
        {
            "$set": {
                "type": "catalog_seed",
                "key": "peptide_pdf_catalog",
                "version": CATALOG_VERSION,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "product_count": len(product_docs),
                "category_count": len(category_docs),
            }
        },
        upsert=True,
    )

    return {"updated": True, "products": len(product_docs), "categories": len(category_docs)}
