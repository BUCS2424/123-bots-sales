from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import aiohttp

from auth import decode_token


router = APIRouter(tags=["Radio"])
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token_data = decode_token(credentials.credentials)
    if not token_data or not token_data.user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return token_data


@router.get("/radio/search")
async def radio_search(q: str, current_user=Depends(get_current_user)):
    try:
        url = f"https://opml.radiotime.com/Search.ashx?query={q}&render=json&type=station"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                data = await resp.json(content_type=None)
        stations = []
        for item in data.get("body", []):
            if item.get("type") == "audio" and item.get("element") == "outline":
                stations.append(
                    {
                        "id": item.get("guide_id", ""),
                        "name": item.get("text", ""),
                        "formats": item.get("formats", ""),
                        "bitrate": item.get("bitrate", ""),
                        "logo": item.get("logo", ""),
                        "subtext": item.get("subtext", ""),
                        "url": item.get("URL", ""),
                    }
                )
        return stations
    except Exception:
        return []


@router.get("/radio/featured")
async def radio_featured(category: str = "popular", current_user=Depends(get_current_user)):
    cat_map = {
        "popular": "c=popular",
        "music": "id=c57943",
        "country": "id=c57940",
        "news": "c=news",
        "sports": "c=sports",
        "talk": "c=talk",
        "local": "c=local",
    }
    param = cat_map.get(category, "c=popular")
    try:
        url = f"https://opml.radiotime.com/Browse.ashx?{param}&render=json"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                data = await resp.json(content_type=None)
        stations = []

        def extract(items):
            for item in items or []:
                if item.get("type") == "audio" and item.get("guide_id"):
                    stations.append(
                        {
                            "id": item.get("guide_id", ""),
                            "name": item.get("text", ""),
                            "subtext": item.get("subtext", ""),
                            "logo": item.get("image", item.get("logo", "")),
                            "formats": item.get("formats", ""),
                            "bitrate": item.get("bitrate", ""),
                            "url": item.get("URL", ""),
                        }
                    )
                elif item.get("children"):
                    extract(item["children"])

        extract(data.get("body", []))
        return stations[:40]
    except Exception:
        return []


@router.get("/radio/tune")
async def radio_tune(id: str, current_user=Depends(get_current_user)):
    try:
        url = f"https://opml.radiotime.com/Tune.ashx?id={id}&render=json"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                data = await resp.json(content_type=None)
        streams = []
        for item in data.get("body") or []:
            if item.get("url"):
                streams.append(
                    {
                        "url": item["url"],
                        "media_type": item.get("media_type", ""),
                        "bitrate": item.get("bitrate", ""),
                        "reliability": item.get("reliability", 0),
                    }
                )
        streams.sort(key=lambda s: s.get("reliability", 0), reverse=True)
        return {"streams": streams, "best": streams[0]["url"] if streams else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
