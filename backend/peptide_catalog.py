async def sync_pdf_catalog(db):
    """No default catalog seed; each deployment brings its own product catalog
    (via CSV import or the admin panel). Previously this destructively
    replaced the products/categories collections with a hardcoded peptide
    catalog on every fresh database - removed since a new client's first
    boot should start with an empty catalog, not another client's inventory.
    """
    return {
        "updated": False,
        "products": await db.products.count_documents({}),
        "categories": await db.categories.count_documents({}),
    }
