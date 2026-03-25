async def update_lead_positions(updates: List[Dict[str, Any]], current_user: dict = Depends(get_current_user)):
    """Update multiple lead positions for kanban drag & drop"""
    for update in updates:
        await db.leads.update_one(
            {"id": update["id"]},
            {"$set": {"status": update.get("status"), "kanban_position": update.get("position", 0)}}
        )
    return {"success": True}


# ============ Lead Quotes (Calculator) ============

class QuoteLineItem(BaseModel):
    description: str
    quantity: float = 1
    unit_price: float = 0
    billing_type: str = "onetime"  # onetime, monthly, yearly
    item_type: Optional[str] = "custom"  # custom, product, service
    item_id: Optional[str] = None  # Reference to product/service ID
    sku: Optional[str] = None
    category: Optional[str] = None
    price_onetime: Optional[float] = None
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
