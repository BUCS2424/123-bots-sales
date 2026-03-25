from datetime import datetime, timezone
from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from auth import decode_token


router = APIRouter(tags=["AndGo"])
security = HTTPBearer()
db = None


def set_database(database):
    global db
    db = database


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token_data = decode_token(credentials.credentials)
    if not token_data or not token_data.user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return token_data


class GoLinkCreate(BaseModel):
    title: str
    url: str
    color: str = "#3b82f6"


class GoLinkReorder(BaseModel):
    ordered_ids: List[str]


@router.get("/goto-links")
async def list_links(current_user=Depends(get_current_user)):
    return await db.goto_links.find({"user_id": current_user.user_id}, {"_id": 0, "user_id": 0}).sort("position", 1).to_list(1000)


@router.post("/goto-links")
async def create_link(payload: GoLinkCreate, current_user=Depends(get_current_user)):
    count = await db.goto_links.count_documents({"user_id": current_user.user_id})
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.user_id,
        "title": payload.title,
        "url": payload.url,
        "color": payload.color,
        "position": count,
        "created_at": now,
        "updated_at": now,
    }
    await db.goto_links.insert_one(doc)
    doc.pop("_id", None)
    doc.pop("user_id", None)
    return doc


# NOTE: reorder must be defined BEFORE {link_id} to avoid route conflict
@router.put("/goto-links/reorder")
async def reorder_links(payload: GoLinkReorder, current_user=Depends(get_current_user)):
    for position, link_id in enumerate(payload.ordered_ids):
        await db.goto_links.update_one(
            {"id": link_id, "user_id": current_user.user_id},
            {"$set": {"position": position, "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
    return {"status": "success"}


@router.put("/goto-links/{link_id}")
async def update_link(link_id: str, payload: GoLinkCreate, current_user=Depends(get_current_user)):
    result = await db.goto_links.update_one(
        {"id": link_id, "user_id": current_user.user_id},
        {"$set": {"title": payload.title, "url": payload.url, "color": payload.color, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Link not found")
    return {"status": "success"}


@router.delete("/goto-links/{link_id}")
async def delete_link(link_id: str, current_user=Depends(get_current_user)):
    result = await db.goto_links.delete_one({"id": link_id, "user_id": current_user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Link not found")
    return {"status": "success"}
