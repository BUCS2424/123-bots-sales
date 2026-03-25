# ── A2G Radio Backend Routes ──────────────────────────────────────────────
# FastAPI + Motor (async MongoDB) + Pydantic v2

# ── Radio / TuneIn Proxy ──────────────────────────────────────────────────────

@api_router.get("/radio/search")
async def radio_search(q: str, current_user: dict = Depends(get_current_user)):
    """Search TuneIn stations by name or keyword."""
    try:
        url = f"https://opml.radiotime.com/Search.ashx?query={q}&render=json&type=station"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                data = await resp.json(content_type=None)
        stations = []
        for item in data.get("body", []):
            if item.get("type") == "audio" and item.get("element") == "outline":
                stations.append({
                    "id": item.get("guide_id", ""),
                    "name": item.get("text", ""),
                    "formats": item.get("formats", ""),
                    "bitrate": item.get("bitrate", ""),
                    "logo": item.get("logo", ""),
                    "subtext": item.get("subtext", ""),
                    "url": item.get("URL", ""),
                })
        return stations
    except Exception as e:
        logger.error(f"TuneIn search error: {e}")
        return []

@api_router.get("/radio/featured")
async def radio_featured(category: str = "popular", current_user: dict = Depends(get_current_user)):
    """Get featured TuneIn stations by category."""
    # Map categories to TuneIn browse params
    cat_map = {
        "popular": "c=popular",
        "music":   "id=c57943",
        "country": "id=c57940",
        "news":    "c=news",
        "sports":  "c=sports",
        "talk":    "c=talk",
        "local":   "c=local",
        "jazz":    "id=g7",
        "rock":    "id=g227",
        "hiphop":  "id=g75",
    }

    # 80s uses search endpoint
    if category == "80s":
        try:
            url = "https://opml.radiotime.com/Search.ashx?query=80s+hits+radio&render=json&type=station&limit=30"
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    data = await resp.json(content_type=None)
            stations = []
            for item in (data.get("body") or []):
                if item.get("type") == "audio" and item.get("guide_id"):
                    stations.append({
                        "id": item.get("guide_id", ""),
                        "name": item.get("text", ""),
                        "subtext": item.get("subtext", ""),
                        "logo": item.get("image", item.get("logo", "")),
                        "formats": item.get("formats", ""),
                        "bitrate": item.get("bitrate", ""),
                        "url": item.get("URL", ""),
                        "current_track": item.get("current_track", ""),
                    })
            return stations[:30]
        except Exception as e:
            logger.error(f"TuneIn 80s error: {e}")
            return []

    param = cat_map.get(category, "c=popular")
    try:
        url = f"https://opml.radiotime.com/Browse.ashx?{param}&render=json"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                data = await resp.json(content_type=None)
        stations = []
        def extract(items):
            for item in (items or []):
                if item.get("type") == "audio" and item.get("guide_id"):
                    stations.append({
                        "id": item.get("guide_id", ""),
                        "name": item.get("text", ""),
                        "subtext": item.get("subtext", ""),
                        "logo": item.get("image", item.get("logo", "")),
                        "formats": item.get("formats", ""),
                        "bitrate": item.get("bitrate", ""),
                        "url": item.get("URL", ""),
                        "current_track": item.get("current_track", ""),
                    })
                elif item.get("children"):
                    extract(item["children"])
        extract(data.get("body", []))
        return stations[:40]
    except Exception as e:
        logger.error(f"TuneIn featured error: {e}")
        return []

@api_router.get("/radio/tune")
async def radio_tune(id: str, current_user: dict = Depends(get_current_user)):
    """Get the direct stream URL for a TuneIn station."""
    try:
        url = f"https://opml.radiotime.com/Tune.ashx?id={id}&render=json"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                data = await resp.json(content_type=None)
        streams = []
        for item in (data.get("body") or []):
            if item.get("url"):
                streams.append({
                    "url": item["url"],
                    "media_type": item.get("media_type", ""),
                    "bitrate": item.get("bitrate", ""),
                    "reliability": item.get("reliability", 0),
                })
        # Sort by reliability descending
        streams.sort(key=lambda x: x.get("reliability", 0), reverse=True)
        return {"streams": streams, "best": streams[0]["url"] if streams else None}
    except Exception as e:
        logger.error(f"TuneIn tune error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========================
# WEBRTC TOKEN
# ========================
@api_router.get("/webrtc/token")
async def get_webrtc_token(current_user: dict = Depends(get_current_user)):
    """Get WebRTC connection info for the user"""
    creds = await db.credentials.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not creds:
        return {"sip_username": "", "sip_password": "", "configured": False}
    
    # Normalize phone number to E.164 format
    phone_number = creds.get("phone_number", "")
    if phone_number:
        # Remove any non-digit characters except +
        phone_number = ''.join(c for c in phone_number if c.isdigit() or c == '+')
        if not phone_number.startswith('+'):
            phone_number = '+' + phone_number
    
    # Get outbound caller ID, default to phone_number if not set
    outbound_caller_id = creds.get("outbound_caller_id", "") or phone_number
    
    return {
        "sip_username": CredentialEncryption.decrypt(creds.get("sip_username", "")) if creds.get("sip_username") else "",
        "sip_password": CredentialEncryption.decrypt(creds.get("sip_password", "")) if creds.get("sip_password") else "",
        "phone_number": phone_number,
