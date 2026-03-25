# ── A2G Tasks Backend Routes ──────────────────────────────────────────────
# FastAPI + Motor (async MongoDB) + Pydantic v2

class TaskCreate(BaseModel):
    title: str
    description: str = ""
    due_date: Optional[str] = None
    priority: str = "normal"  # low, normal, high, urgent
    status: str = "pending"   # pending, in_progress, completed
    source: str = ""
    external_id: str = ""

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

async def verify_external_api_key(
    x_api_key: str = Header(None),
    x_api_secret: str = Header(None)
) -> str:
    """Authenticate external apps via X-API-Key + X-API-Secret headers. Returns user_id."""
    if not x_api_key or not x_api_secret:
        raise HTTPException(status_code=403, detail="Missing X-API-Key or X-API-Secret headers")
    key_doc = await db.external_api_keys.find_one({"key_id": x_api_key}, {"_id": 0})
    if not key_doc or key_doc.get("secret") != x_api_secret:
        raise HTTPException(status_code=403, detail="Invalid API credentials")
    await db.external_api_keys.update_one(
        {"key_id": x_api_key},
        {"$set": {"last_used_at": datetime.now(timezone.utc).isoformat()}}
    )
    return key_doc["user_id"]

@api_router.get("/integrations/keys")
async def list_api_keys(current_user: dict = Depends(get_current_user)):
    keys = await db.external_api_keys.find(
        {"user_id": current_user["id"]}, {"_id": 0, "secret": 0}
    ).to_list(None)
    return keys

@api_router.post("/integrations/keys")
async def create_api_key(data: ExternalApiKeyCreate, current_user: dict = Depends(get_current_user)):
    key_id = "a2g_" + uuid.uuid4().hex[:16]
    secret = "sk_" + uuid.uuid4().hex + uuid.uuid4().hex[:16]
    doc = {
        "key_id": key_id,
        "secret": secret,
        "name": data.name,
        "user_id": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_used_at": None,
    }
    await db.external_api_keys.insert_one(doc)
    return {"key_id": key_id, "secret": secret, "name": data.name, "created_at": doc["created_at"]}

@api_router.delete("/integrations/keys/{key_id}")
async def delete_api_key(key_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.external_api_keys.delete_one({"key_id": key_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Key not found")
    return {"status": "revoked"}

@api_router.get("/integrations/sources")
async def list_connected_sources(current_user: dict = Depends(get_current_user)):
    sources = await db.external_sources.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(None)
    # Mask push_api_secret — only show last 4 chars
    for s in sources:
        if s.get("push_api_secret"):
            s["push_api_secret_masked"] = "sk_..." + s["push_api_secret"][-4:]
            del s["push_api_secret"]
    return sources

@api_router.put("/integrations/sources/{source_id}")
async def update_source(source_id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    """Update source metadata — callback_url, push credentials."""
    allowed = {k: v for k, v in payload.items() if k in ("callback_url", "name", "push_url", "push_api_key", "push_api_secret")}
    if not allowed:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    result = await db.external_sources.update_one(
        {"id": source_id, "user_id": current_user["id"]},
        {"$set": allowed}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Source not found")
    return {"status": "updated"}

@api_router.delete("/integrations/sources/{source_id}")
async def delete_source(source_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.external_sources.delete_one({"id": source_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Source not found")
    return {"status": "deleted"}

@api_router.post("/integrations/sources/{source_id}/sync")
async def sync_single_source(source_id: str, current_user: dict = Depends(get_current_user)):
    """Trigger a single source to re-push its data by calling its registered callback_url."""
    source = await db.external_sources.find_one({"id": source_id, "user_id": current_user["id"]})
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    callback_url = source.get("callback_url")
    if not callback_url:
        return {"status": "skipped", "reason": "No callback URL configured for this source"}
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                callback_url,
                json={"action": "sync", "source_id": source_id, "requested_at": datetime.now(timezone.utc).isoformat()},
                timeout=aiohttp.ClientTimeout(total=10)
            ) as resp:
                return {"status": "triggered", "http_status": resp.status, "source": source.get("name")}
    except Exception as e:
        return {"status": "error", "reason": str(e), "source": source.get("name")}

@api_router.post("/integrations/sync-all")
async def sync_all_sources(current_user: dict = Depends(get_current_user)):
    """Trigger all connected sources with a callback_url to re-push their data."""
    sources = await db.external_sources.find(
        {"user_id": current_user["id"], "callback_url": {"$exists": True, "$ne": ""}},
        {"_id": 0}
    ).to_list(None)
    results = []
    async with aiohttp.ClientSession() as session:
        for source in sources:
            try:
                async with session.post(
                    source["callback_url"],
                    json={"action": "sync", "source_id": source["id"], "requested_at": datetime.now(timezone.utc).isoformat()},
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as resp:
                    results.append({"source": source["name"], "status": "triggered", "http_status": resp.status})
            except Exception as e:
                results.append({"source": source["name"], "status": "error", "reason": str(e)})
    return {"synced": len(results), "results": results}

# ── External Push Endpoints (API Key auth — no JWT required) ─────────────────

@api_router.post("/external/events")
async def external_push_events(
    payload: dict,
    user_id: str = Depends(verify_external_api_key)
):
    """Push calendar events from an external app. Authenticate with X-API-Key + X-API-Secret headers."""
    events = payload.get("events", [])
    source_name = payload.get("source_name", "External App")
    upserted = 0
    for event in events:
        if "external_id" not in event:
            continue
        await db.synced_calendar_events.update_one(
            {"external_id": event["external_id"], "user_id": user_id},
            {"$set": {**event, "user_id": user_id, "synced_from": source_name,
                      "synced_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
        upserted += 1
    # Track source
    src = await db.external_sources.find_one({"user_id": user_id, "name": source_name, "type": "calendar"})
    if src:
        await db.external_sources.update_one(
            {"user_id": user_id, "name": source_name, "type": "calendar"},
            {"$set": {"last_sync_at": datetime.now(timezone.utc).isoformat()},
             "$inc": {"total_events": upserted}}
        )
    else:
        await db.external_sources.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "name": source_name,
            "type": "calendar", "last_sync_at": datetime.now(timezone.utc).isoformat(),
            "total_events": upserted, "total_tasks": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    return {"received": upserted, "status": "ok"}

@api_router.post("/external/tasks")
async def external_push_tasks(
    payload: dict,
    user_id: str = Depends(verify_external_api_key)
):
    """Push tasks from an external app. Authenticate with X-API-Key + X-API-Secret headers."""
    tasks = payload.get("tasks", [])
    source_name = payload.get("source_name", "External App")
    upserted = 0
    for task in tasks:
        task_id = task.get("external_id") or task.get("id")
        if not task_id:
            continue
        await db.tasks.update_one(
            {"external_id": task_id, "user_id": user_id},
            {"$set": {
                "external_id": task_id, "user_id": user_id,
                "title": task.get("title", "Untitled"),
                "description": task.get("description", ""),
                "due_date": task.get("due_date"),
                "priority": task.get("priority", "normal"),
                "status": task.get("status", "pending"),
                "source": source_name,
                "synced_at": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True
        )
        upserted += 1
    # Ensure tasks have an internal id
    async for t in db.tasks.find({"user_id": user_id, "id": {"$exists": False}}):
        await db.tasks.update_one({"_id": t["_id"]}, {"$set": {"id": str(uuid.uuid4())}})
    # Track source
    src = await db.external_sources.find_one({"user_id": user_id, "name": source_name, "type": "tasks"})
    if src:
        await db.external_sources.update_one(
            {"user_id": user_id, "name": source_name, "type": "tasks"},
            {"$set": {"last_sync_at": datetime.now(timezone.utc).isoformat()},
             "$inc": {"total_tasks": upserted}}
        )
    else:
        await db.external_sources.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "name": source_name,
            "type": "tasks", "last_sync_at": datetime.now(timezone.utc).isoformat(),
            "total_events": 0, "total_tasks": upserted,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    return {"received": upserted, "status": "ok"}

# ── Tasks CRUD ────────────────────────────────────────────────────────────────

@api_router.get("/tasks")
async def list_tasks(current_user: dict = Depends(get_current_user)):
    tasks = await db.tasks.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(None)
    return tasks

@api_router.post("/tasks")
async def create_task(task: TaskCreate, current_user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "title": task.title,
        "description": task.description,
        "due_date": task.due_date,
        "priority": task.priority,
        "status": task.status,
        "source": task.source or "manual",
        "external_id": task.external_id or str(uuid.uuid4()),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "synced_at": None,
    }
    await db.tasks.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, task: TaskUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in task.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.tasks.update_one(
        {"id": task_id, "user_id": current_user["id"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "updated"}

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.tasks.delete_one({"id": task_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "deleted"}


