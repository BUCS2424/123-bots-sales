# ── A2G And...Go Backend Routes ──────────────────────────────────────────────
# FastAPI + Motor (async MongoDB) + Pydantic v2

# AND...GO SHORTCUTS
# ========================
class GoLink(BaseModel):
    title: str
    url: str
    color: str = "#3b82f6"

class GoLinkReorder(BaseModel):
    ordered_ids: List[str]

@api_router.get("/goto-links")
async def get_goto_links(current_user: dict = Depends(get_current_user)):
    links = await db.goto_links.find(
        {"user_id": current_user["id"]}, {"_id": 0, "user_id": 0}
    ).sort("position", 1).to_list(100)
    return links

@api_router.post("/goto-links")
async def add_goto_link(link: GoLink, current_user: dict = Depends(get_current_user)):
    count = await db.goto_links.count_documents({"user_id": current_user["id"]})
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "title": link.title,
        "url": link.url,
        "color": link.color,
        "position": count,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.goto_links.insert_one(doc)
    doc.pop("user_id", None)
    doc.pop("_id", None)
    return doc

@api_router.put("/goto-links/reorder")
async def reorder_goto_links(body: GoLinkReorder, current_user: dict = Depends(get_current_user)):
    for i, link_id in enumerate(body.ordered_ids):
        await db.goto_links.update_one(
            {"id": link_id, "user_id": current_user["id"]},
            {"$set": {"position": i}}
        )
    return {"status": "success"}

@api_router.put("/goto-links/{link_id}")
async def update_goto_link(link_id: str, link: GoLink, current_user: dict = Depends(get_current_user)):
    result = await db.goto_links.update_one(
        {"id": link_id, "user_id": current_user["id"]},
        {"$set": {"title": link.title, "url": link.url, "color": link.color}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Link not found")
    return {"status": "success"}

@api_router.delete("/goto-links/{link_id}")
async def delete_goto_link(link_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.goto_links.delete_one({"id": link_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Link not found")
    return {"status": "success"}

# ========================
# FAVORITE DIALS
# ========================
class FavoriteDial(BaseModel):
    name: str
    number: str

@api_router.get("/favorite-dials")
async def get_favorite_dials(current_user: dict = Depends(get_current_user)):
    dials = await db.favorite_dials.find({"user_id": current_user["id"]}, {"_id": 0, "user_id": 0}).to_list(50)
    return dials

@api_router.post("/favorite-dials")
async def add_favorite_dial(dial: FavoriteDial, current_user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "name": dial.name,
        "number": dial.number,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.favorite_dials.insert_one(doc)
    return {"id": doc["id"], "name": doc["name"], "number": doc["number"], "created_at": doc["created_at"]}

@api_router.put("/favorite-dials/{dial_id}")
async def update_favorite_dial(dial_id: str, dial: FavoriteDial, current_user: dict = Depends(get_current_user)):
    result = await db.favorite_dials.update_one(
        {"id": dial_id, "user_id": current_user["id"]},
        {"$set": {"name": dial.name, "number": dial.number}}
    )
