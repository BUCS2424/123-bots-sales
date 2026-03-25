from datetime import datetime, timezone
from typing import Optional, List
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from auth import decode_token


router = APIRouter(tags=["Tasks"])
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


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    due_date: Optional[str] = None
    priority: str = "normal"
    status: str = "pending"
    source: str = "manual"
    external_id: str = ""


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None


class TaskCommentCreate(BaseModel):
    comment: str


class PushStatusUpdate(BaseModel):
    source: str
    success: bool
    message: str = ""


@router.get("/tasks")
async def list_tasks(current_user=Depends(get_current_user)):
    tasks = await db.tasks.find({"user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(3000)
    return tasks


@router.post("/tasks")
async def create_task(payload: TaskCreate, current_user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.user_id,
        "title": payload.title,
        "description": payload.description,
        "due_date": payload.due_date,
        "priority": payload.priority,
        "status": payload.status,
        "source": payload.source,
        "external_id": payload.external_id or str(uuid.uuid4()),
        "created_at": now,
        "updated_at": now,
    }
    await db.tasks.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/tasks/{task_id}")
async def update_task(task_id: str, payload: TaskUpdate, current_user=Depends(get_current_user)):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.tasks.update_one({"id": task_id, "user_id": current_user.user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    updated = await db.tasks.find_one({"id": task_id, "user_id": current_user.user_id}, {"_id": 0})
    return updated


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user=Depends(get_current_user)):
    result = await db.tasks.delete_one({"id": task_id, "user_id": current_user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.task_comments.delete_many({"task_id": task_id, "user_id": current_user.user_id})
    return {"status": "deleted"}


@router.get("/tasks/{task_id}/comments")
async def list_task_comments(task_id: str, current_user=Depends(get_current_user)):
    comments = await db.task_comments.find({"task_id": task_id, "user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return comments


@router.post("/tasks/{task_id}/comments")
async def add_task_comment(task_id: str, payload: TaskCommentCreate, current_user=Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id, "user_id": current_user.user_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    now = datetime.now(timezone.utc).isoformat()
    comment_doc = {
        "id": str(uuid.uuid4()),
        "task_id": task_id,
        "user_id": current_user.user_id,
        "comment": payload.comment,
        "created_at": now,
    }
    await db.task_comments.insert_one(comment_doc)
    comment_doc.pop("_id", None)
    return comment_doc


@router.post("/tasks/{task_id}/push-status")
async def push_task_status(task_id: str, payload: PushStatusUpdate, current_user=Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id, "user_id": current_user.user_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    update_data = {
        "last_push_source": payload.source,
        "last_push_success": payload.success,
        "last_push_message": payload.message,
        "last_push_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.tasks.update_one({"id": task_id, "user_id": current_user.user_id}, {"$set": update_data})
    return {"status": "ok", **update_data}
