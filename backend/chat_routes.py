# ========================================
# ATOM AI CHAT SYSTEM
# ========================================

from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
import os
import time
import uuid
import logging

from auth import TokenData, decode_token, UserRole

logger = logging.getLogger(__name__)

# Router and database reference
chat_router = APIRouter(tags=["Chat"])
db = None
llm_key = None

def set_database(database):
    global db
    db = database

def set_llm_key(key):
    global llm_key
    llm_key = key

# Security
security = HTTPBearer(auto_error=False)

# Enums
class ChatStatus(str, Enum):
    ACTIVE = "active"
    WAITING_HUMAN = "waiting_human"
    WITH_HUMAN = "with_human"
    CLOSED = "closed"

class ChatMessageType(str, Enum):
    USER = "user"
    AI = "ai"
    AGENT = "agent"
    SYSTEM = "system"
    WHISPER = "whisper"
    CALLBACK_REQUEST = "callback_request"

# Pydantic models
class ChatMessageCreate(BaseModel):
    text: str
    session_id: str

class AgentAvailability(BaseModel):
    is_available: bool
    available_from: Optional[str] = None
    available_to: Optional[str] = None

# Auth dependencies
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[TokenData]:
    if credentials is None:
        return None
    token = credentials.credentials
    token_data = decode_token(token)
    return token_data

async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token_data = decode_token(credentials.credentials)
    if token_data is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    return token_data

async def require_admin_or_staff(current_user: TokenData = Depends(require_auth)) -> TokenData:
    allowed_roles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]
    if current_user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Admin access required")

    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        flags = await db.admin_settings.find_one(
            {"type": "feature_flags"},
            {"_id": 0, "owner_chat_enabled": 1},
        )
        owner_chat_enabled = bool(flags.get("owner_chat_enabled", False)) if flags else False
        if not owner_chat_enabled:
            raise HTTPException(status_code=403, detail="Owner chat is disabled by feature flag")

    return current_user

# In-memory stores for real-time features
active_chats = {}
agent_availability = {}
active_visitors = {}  # Track visitors on site: {visitor_id: {page, timestamp, name, etc.}}
visitor_chat_invites = {}  # Track pending chat invites: {visitor_id: {chat_id, agent_name, page}}

# Betty's knowledge is not hardcoded to any one business. It's assembled at
# runtime from this tenant's own admin_settings / categories / products, so the
# same code serves whatever business is configured on a given deployment.
ASSISTANT_NAME = "Betty"

_atom_prompt_cache: Optional[str] = None
_atom_prompt_cache_at = 0.0
_ATOM_PROMPT_CACHE_SECONDS = 300  # rebuild periodically so admin/catalog edits show up promptly


def _weekly_hours_block(business: dict) -> str:
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    lines = []
    for day in days:
        value = (business.get(f"{day}_hours") or "").strip()
        if value:
            lines.append(f"- {day.capitalize()}: {value}")
    return "\n".join(lines)


async def _build_atom_system_prompt() -> str:
    business = await db.admin_settings.find_one({"type": "business"}, {"_id": 0}) or {}
    site = await db.admin_settings.find_one({"type": "site"}, {"_id": 0}) or {}

    business_name = (business.get("business_name") or site.get("site_name") or "our store").strip()
    description = (business.get("description") or "").strip()
    phone = (business.get("phone") or "").strip()
    email = (business.get("email") or site.get("support_email") or "").strip()
    website = (business.get("website") or site.get("site_url") or "").strip()
    hours_block = _weekly_hours_block(business)

    categories = await db.categories.find(
        {"parent_id": None, "is_enabled": True},
        {"_id": 0, "name": 1, "description": 1},
    ).sort("sort_order", 1).limit(12).to_list(length=12)
    category_lines = [
        f"- {c['name']}: {c['description']}" if c.get("description") else f"- {c['name']}"
        for c in categories if c.get("name")
    ]
    category_block = "\n".join(category_lines) if category_lines else "(catalog not yet configured)"

    products = await db.products.find(
        {"is_visible": True, "in_stock": True},
        {"_id": 0, "name": 1, "sold_count": 1},
    ).sort("sold_count", -1).limit(10).to_list(length=10)
    product_names = [p["name"] for p in products if p.get("name")]
    products_block = ", ".join(product_names) if product_names else "(no products listed yet)"

    contact_lines = []
    if phone:
        contact_lines.append(f"- Phone: {phone}")
    if email:
        contact_lines.append(f"- Email: {email}")
    if website:
        contact_lines.append(f"- Website: {website}")
    contact_block = "\n".join(contact_lines) if contact_lines else "(no contact details configured)"

    about_block = f"About {business_name}: {description}\n\n" if description else ""

    return f"""You are {ASSISTANT_NAME}, a friendly and helpful AI assistant for {business_name}.

{about_block}## Contact & Hours
{contact_block}
{hours_block}

## What We Offer
{category_block}

Popular products right now: {products_block}

## Your Behavior
1. Be warm, friendly, and conversational - like talking to a helpful neighbor.
2. Help customers find the right product or service based on what's actually listed above.
3. Only state prices, policies, or product details that were given to you here or by the customer - never invent specifics you don't know.
4. If a question needs information you don't have (exact pricing, order status, a policy not listed here), say so and offer to connect them with a human team member.
5. Keep responses concise and helpful.

If a customer wants to speak with a human, or asks something outside what you know, let them know you'll connect them with the team right away."""


async def _get_atom_system_prompt() -> str:
    global _atom_prompt_cache, _atom_prompt_cache_at
    now = time.monotonic()
    if _atom_prompt_cache is None or (now - _atom_prompt_cache_at) > _ATOM_PROMPT_CACHE_SECONDS:
        _atom_prompt_cache = await _build_atom_system_prompt()
        _atom_prompt_cache_at = now
    return _atom_prompt_cache

# ========================================
# PUBLIC CHAT ENDPOINTS
# ========================================

@chat_router.post("/chat/start")
async def start_chat_session(
    visitor_name: Optional[str] = None,
    visitor_email: Optional[str] = None
):
    """Start a new chat session for a website visitor"""
    chat_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())
    
    chat_data = {
        "id": chat_id,
        "session_id": session_id,
        "visitor_name": visitor_name,
        "visitor_email": visitor_email,
        "status": ChatStatus.ACTIVE,
        "messages": [],
        "agent_id": None,
        "agent_name": None,
        "supervisor_ids": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "summary": None,
        "converted_to_lead": False,
        "lead_id": None
    }
    
    await db.chats.insert_one(chat_data)
    
    active_chats[chat_id] = {
        "session_id": session_id,
        "agent_id": None,
        "supervisor_ids": [],
        "typing_text": "",
        "status": ChatStatus.ACTIVE
    }
    
    business = await db.admin_settings.find_one({"type": "business"}, {"_id": 0, "business_name": 1})
    site = await db.admin_settings.find_one({"type": "site"}, {"_id": 0, "site_name": 1})
    business_name = (
        (business or {}).get("business_name")
        or (site or {}).get("site_name")
        or "our store"
    )

    welcome_message = {
        "id": str(uuid.uuid4()),
        "type": ChatMessageType.AI,
        "text": f"Hi there! I'm {ASSISTANT_NAME}, your assistant at {business_name}! I can help you find what you're looking for or answer questions. What can I help you with today?",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chats.update_one(
        {"id": chat_id},
        {"$push": {"messages": welcome_message}}
    )
    
    return {
        "chat_id": chat_id,
        "session_id": session_id,
        "welcome_message": welcome_message
    }


@chat_router.post("/chat/message")
async def send_chat_message(message: ChatMessageCreate):
    """Send a message in a chat session"""
    chat = await db.chats.find_one({"session_id": message.session_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    chat_id = chat["id"]
    
    user_message = {
        "id": str(uuid.uuid4()),
        "type": ChatMessageType.USER,
        "text": message.text,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chats.update_one(
        {"id": chat_id},
        {
            "$push": {"messages": user_message},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    if chat_id in active_chats:
        active_chats[chat_id]["typing_text"] = ""
    
    # If chat is with human agent, don't generate AI response
    if chat["status"] == ChatStatus.WITH_HUMAN:
        return {"message": user_message, "ai_response": None}
    
    feature_flags = await db.admin_settings.find_one(
        {"type": "feature_flags"},
        {"_id": 0, "owner_chat_ai_enabled": 1},
    )
    owner_chat_ai_enabled = bool(feature_flags.get("owner_chat_ai_enabled", False)) if feature_flags else False

    if not owner_chat_ai_enabled:
        disabled_message = {
            "id": str(uuid.uuid4()),
            "type": ChatMessageType.AI,
            "text": "AI chat is currently disabled. Please request a human agent for assistance.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.chats.update_one(
            {"id": chat_id},
            {"$push": {"messages": disabled_message}}
        )
        return {"message": user_message, "ai_response": disabled_message}

    # Generate AI response using Atom (GPT-4o via litellm)
    try:
        import litellm

        api_key = llm_key or os.environ.get("OPENAI_API_KEY")

        if not api_key:
            raise ValueError("No LLM API key available")

        response = await litellm.acompletion(
            model="openai/gpt-4o",
            api_key=api_key,
            messages=[
                {"role": "system", "content": await _get_atom_system_prompt()},
                {"role": "user", "content": message.text},
            ],
        )
        ai_response_text = response.choices[0].message.content

        ai_message = {
            "id": str(uuid.uuid4()),
            "type": ChatMessageType.AI,
            "text": ai_response_text,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await db.chats.update_one(
            {"id": chat_id},
            {"$push": {"messages": ai_message}}
        )
        
        return {"message": user_message, "ai_response": ai_message}
        
    except Exception as e:
        logger.error(f"Error generating AI response: {e}")
        fallback_message = {
            "id": str(uuid.uuid4()),
            "type": ChatMessageType.AI,
            "text": "I apologize, but I'm having a moment. Would you like me to connect you with a human representative? They can help you right away!",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.chats.update_one(
            {"id": chat_id},
            {"$push": {"messages": fallback_message}}
        )
        return {"message": user_message, "ai_response": fallback_message}


@chat_router.post("/chat/request-human")
async def request_human_agent(session_id: str):
    """Request to speak with a human agent"""
    chat = await db.chats.find_one({"session_id": session_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    chat_id = chat["id"]
    
    await db.chats.update_one(
        {"id": chat_id},
        {
            "$set": {
                "status": ChatStatus.WAITING_HUMAN,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if chat_id in active_chats:
        active_chats[chat_id]["status"] = ChatStatus.WAITING_HUMAN
    
    system_message = {
        "id": str(uuid.uuid4()),
        "type": ChatMessageType.SYSTEM,
        "text": "You've requested to speak with a human representative. Please hold while we connect you with the next available agent.",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chats.update_one(
        {"id": chat_id},
        {"$push": {"messages": system_message}}
    )
    
    notification = {
        "id": str(uuid.uuid4()),
        "type": "chat_request",
        "chat_id": chat_id,
        "visitor_name": chat.get("visitor_name"),
        "message_preview": chat.get("messages", [{}])[-1].get("text", "")[:100] if chat.get("messages") else "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "read": False
    }
    
    await db.chat_notifications.insert_one(notification)
    
    return {"message": system_message, "status": ChatStatus.WAITING_HUMAN}


@chat_router.post("/chat/request-callback")
async def request_callback(data: dict):
    """Request a callback with phone number"""
    session_id = data.get("session_id")
    phone = data.get("phone")
    
    if not session_id or not phone:
        raise HTTPException(status_code=400, detail="session_id and phone are required")
    
    chat = await db.chats.find_one({"session_id": session_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    chat_id = chat["id"]
    
    callback_message = {
        "id": str(uuid.uuid4()),
        "type": ChatMessageType.CALLBACK_REQUEST,
        "text": f"Callback requested: {phone}",
        "phone": phone,
        "visitor_name": chat.get("visitor_name", "Visitor"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chats.update_one(
        {"id": chat_id},
        {
            "$push": {"messages": callback_message},
            "$set": {
                "status": ChatStatus.WAITING_HUMAN,
                "callback_phone": phone,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"success": True, "message": "Callback request submitted"}


@chat_router.post("/chat/typing")
async def update_typing_status(session_id: str, text: str = ""):
    """Update typing indicator"""
    chat = await db.chats.find_one({"session_id": session_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    chat_id = chat["id"]
    
    if chat_id in active_chats:
        active_chats[chat_id]["typing_text"] = text
    
    return {"status": "ok"}


@chat_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    chat = await db.chats.find_one({"session_id": session_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    return chat


@chat_router.post("/chat/upload")
async def upload_chat_attachment(
    file: UploadFile = File(...),
    session_id: str = Form(...),
    is_agent: str = Form(default="false")
):
    """Upload a file attachment in a chat"""
    chat = await db.chats.find_one({"session_id": session_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    chat_id = chat["id"]
    
    file_content = await file.read()
    
    if len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 10MB")
    
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_filename = f"chat_{chat_id}_{uuid.uuid4()}{file_ext}"
    
    upload_dir = Path("/app/uploads/chat")
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / unique_filename
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    attachment = {
        "id": str(uuid.uuid4()),
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(file_content),
        "url": f"/api/uploads/chat/{unique_filename}",
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    message_type = "agent" if is_agent.lower() == "true" else "user"
    message = {
        "id": str(uuid.uuid4()),
        "type": message_type,
        "text": file.filename,
        "attachment": attachment,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chats.update_one(
        {"id": chat_id},
        {
            "$push": {"messages": message},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"message": "File uploaded", "attachment": attachment}


# ========================================
# VISITOR TRACKING ENDPOINTS
# ========================================

class VisitorTrackRequest(BaseModel):
    visitor_id: str
    page_url: str
    page_title: Optional[str] = None
    referrer: Optional[str] = None

@chat_router.post("/chat/visitor/track")
async def track_visitor(data: VisitorTrackRequest):
    """Track a visitor landing on a page"""
    now = datetime.now(timezone.utc)
    
    # Check if this is a new visitor or page change
    is_new = data.visitor_id not in active_visitors
    old_page = active_visitors.get(data.visitor_id, {}).get("page_url", "")
    
    active_visitors[data.visitor_id] = {
        "visitor_id": data.visitor_id,
        "page_url": data.page_url,
        "page_title": data.page_title or data.page_url,
        "referrer": data.referrer,
        "first_seen": active_visitors.get(data.visitor_id, {}).get("first_seen", now.isoformat()),
        "last_seen": now.isoformat(),
        "page_views": active_visitors.get(data.visitor_id, {}).get("page_views", 0) + (1 if data.page_url != old_page else 0),
    }
    
    # Create notification for admins if new visitor or significant page
    if is_new or data.page_url != old_page:
        notification = {
            "id": str(uuid.uuid4()),
            "type": "visitor_landed",
            "visitor_id": data.visitor_id,
            "page_url": data.page_url,
            "page_title": data.page_title,
            "is_new_visitor": is_new,
            "created_at": now.isoformat(),
            "read": False
        }
        await db.visitor_notifications.insert_one(notification)
    
    return {"status": "tracked", "is_new": is_new}


@chat_router.post("/chat/visitor/heartbeat")
async def visitor_heartbeat(visitor_id: str, page_url: str):
    """Keep visitor session alive"""
    if visitor_id in active_visitors:
        active_visitors[visitor_id]["last_seen"] = datetime.now(timezone.utc).isoformat()
        active_visitors[visitor_id]["page_url"] = page_url
    return {"status": "ok"}


@chat_router.get("/chat/visitor/check-invite/{visitor_id}")
async def check_chat_invite(visitor_id: str):
    """Check if admin has initiated a chat with this visitor"""
    if visitor_id in visitor_chat_invites:
        invite = visitor_chat_invites[visitor_id]
        # Don't delete yet - visitor needs to accept
        return {"has_invite": True, "invite": invite}
    return {"has_invite": False}


@chat_router.post("/chat/visitor/accept-invite")
async def accept_chat_invite(visitor_id: str):
    """Visitor accepts admin chat invite"""
    if visitor_id not in visitor_chat_invites:
        raise HTTPException(status_code=404, detail="No pending invite")
    
    invite = visitor_chat_invites.pop(visitor_id)
    chat = await db.chats.find_one({"id": invite["chat_id"]}, {"_id": 0})
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return {
        "chat_id": chat["id"],
        "session_id": chat["session_id"],
        "messages": chat.get("messages", [])
    }


@chat_router.delete("/chat/visitor/leave/{visitor_id}")
async def visitor_leave(visitor_id: str):
    """Remove visitor when they leave the site"""
    if visitor_id in active_visitors:
        del active_visitors[visitor_id]
    if visitor_id in visitor_chat_invites:
        del visitor_chat_invites[visitor_id]
    return {"status": "removed"}


# ========================================
# ADMIN CHAT ENDPOINTS
# ========================================

@chat_router.get("/chat/admin/dashboard")
async def get_chat_admin_dashboard(current_user: TokenData = Depends(require_admin_or_staff)):
    """Get complete chat dashboard data"""
    total = await db.chats.count_documents({})
    waiting = await db.chats.count_documents({"status": ChatStatus.WAITING_HUMAN})
    with_human = await db.chats.count_documents({"status": ChatStatus.WITH_HUMAN})
    
    stats = {
        "total": total,
        "waiting_for_agent": waiting,
        "with_agent": with_human
    }
    
    pending_chats = await db.chats.find(
        {"status": ChatStatus.WAITING_HUMAN},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(length=50)
    
    active_chats_list = await db.chats.find(
        {"status": ChatStatus.WITH_HUMAN},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(length=50)
    
    return {
        "stats": stats,
        "pending_chats": pending_chats,
        "active_chats": active_chats_list
    }


@chat_router.get("/chat/admin/visitors")
async def get_active_visitors(current_user: TokenData = Depends(require_admin_or_staff)):
    """Get list of active visitors on the site"""
    now = datetime.now(timezone.utc)
    
    # Clean up stale visitors (inactive for more than 5 minutes)
    stale_threshold = 5 * 60  # 5 minutes in seconds
    stale_visitors = []
    for vid, visitor in active_visitors.items():
        last_seen = datetime.fromisoformat(visitor["last_seen"].replace('Z', '+00:00'))
        if (now - last_seen).total_seconds() > stale_threshold:
            stale_visitors.append(vid)
    
    for vid in stale_visitors:
        del active_visitors[vid]
    
    # Return active visitors sorted by most recent
    visitors_list = list(active_visitors.values())
    visitors_list.sort(key=lambda x: x["last_seen"], reverse=True)
    
    return {"visitors": visitors_list, "count": len(visitors_list)}


@chat_router.get("/chat/admin/visitor-notifications")
async def get_visitor_notifications(current_user: TokenData = Depends(require_admin_or_staff)):
    """Get unread visitor landing notifications"""
    notifications = await db.visitor_notifications.find(
        {"read": False},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=50)
    
    return {"notifications": notifications, "count": len(notifications)}


@chat_router.post("/chat/admin/visitor-notifications/mark-read")
async def mark_visitor_notifications_read(current_user: TokenData = Depends(require_admin_or_staff)):
    """Mark all visitor notifications as read"""
    await db.visitor_notifications.update_many(
        {"read": False},
        {"$set": {"read": True}}
    )
    return {"status": "ok"}


@chat_router.post("/chat/admin/initiate-chat/{visitor_id}")
async def initiate_chat_with_visitor(
    visitor_id: str,
    current_user: TokenData = Depends(require_admin_or_staff)
):
    """Admin initiates a proactive chat with a visitor"""
    if visitor_id not in active_visitors:
        raise HTTPException(status_code=404, detail="Visitor not found or has left")
    
    visitor = active_visitors[visitor_id]
    
    # Get agent info
    user = await db.users.find_one({"id": current_user.user_id}, {"_id": 0})
    agent_name = user.get("name", current_user.email) if user else current_user.email
    
    # Create a new chat session
    chat_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    # Create welcome message from agent
    welcome_message = {
        "id": str(uuid.uuid4()),
        "type": "agent",
        "text": f"Hi! I noticed you're browsing our {visitor.get('page_title', 'site')}. I'm {agent_name.split()[0]} from 123Bots. Can I help you find something special?",
        "agent_id": current_user.user_id,
        "agent_name": agent_name,
        "timestamp": now.isoformat()
    }
    
    chat_data = {
        "id": chat_id,
        "session_id": session_id,
        "visitor_id": visitor_id,
        "visitor_name": None,
        "visitor_email": None,
        "status": ChatStatus.WITH_HUMAN,
        "messages": [welcome_message],
        "agent_id": current_user.user_id,
        "agent_name": agent_name,
        "initiated_by_agent": True,
        "initiated_on_page": visitor.get("page_url"),
        "supervisor_ids": [],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "summary": None,
        "converted_to_lead": False,
        "lead_id": None
    }
    
    await db.chats.insert_one(chat_data)
    
    # Store invite for visitor to pick up
    visitor_chat_invites[visitor_id] = {
        "chat_id": chat_id,
        "session_id": session_id,
        "agent_name": agent_name,
        "agent_message": welcome_message["text"],
        "page_url": visitor.get("page_url"),
        "created_at": now.isoformat()
    }
    
    # Add to active chats
    active_chats[chat_id] = {
        "session_id": session_id,
        "agent_id": current_user.user_id,
        "visitor_id": visitor_id,
        "status": ChatStatus.WITH_HUMAN
    }
    
    return {
        "chat_id": chat_id,
        "session_id": session_id,
        "visitor": visitor,
        "message": "Chat initiated, waiting for visitor to accept"
    }


@chat_router.get("/chat/admin/stats")
async def get_chat_stats(current_user: TokenData = Depends(require_admin_or_staff)):
    """Get chat statistics"""
    total = await db.chats.count_documents({})
    active = await db.chats.count_documents({"status": {"$in": [ChatStatus.ACTIVE, ChatStatus.WAITING_HUMAN, ChatStatus.WITH_HUMAN]}})
    waiting = await db.chats.count_documents({"status": ChatStatus.WAITING_HUMAN})
    with_human = await db.chats.count_documents({"status": ChatStatus.WITH_HUMAN})
    closed = await db.chats.count_documents({"status": ChatStatus.CLOSED})
    converted = await db.chats.count_documents({"converted_to_lead": True})
    available_agents = await db.agent_availability.count_documents({"is_available": True})
    
    return {
        "total": total,
        "active": active,
        "waiting_for_human": waiting,
        "with_human": with_human,
        "closed": closed,
        "converted_to_leads": converted,
        "available_agents": available_agents
    }


@chat_router.get("/chat/admin/pending")
async def get_pending_chats(current_user: TokenData = Depends(require_admin_or_staff)):
    """Get chats waiting for human agent"""
    chats = await db.chats.find(
        {"status": ChatStatus.WAITING_HUMAN},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(length=50)
    
    return {"chats": chats}


@chat_router.get("/chat/admin/active")
async def get_active_chats(current_user: TokenData = Depends(require_admin_or_staff)):
    """Get all active chats"""
    chats = await db.chats.find(
        {"status": {"$in": [ChatStatus.ACTIVE, ChatStatus.WAITING_HUMAN, ChatStatus.WITH_HUMAN]}},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(length=100)
    
    for chat in chats:
        if chat["id"] in active_chats:
            chat["typing_text"] = active_chats[chat["id"]].get("typing_text", "")
    
    return {"chats": chats}


@chat_router.get("/chat/admin/my-chats")
async def get_my_assigned_chats(current_user: TokenData = Depends(require_admin_or_staff)):
    """Get chats assigned to current agent"""
    chats = await db.chats.find(
        {"agent_id": current_user.user_id, "status": ChatStatus.WITH_HUMAN},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(length=50)
    
    return {"chats": chats}


@chat_router.get("/chat/admin/chat/{chat_id}")
async def get_chat_details(chat_id: str, current_user: TokenData = Depends(require_admin_or_staff)):
    """Get detailed chat information"""
    chat = await db.chats.find_one({"id": chat_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return chat


@chat_router.post("/chat/admin/join/{chat_id}")
async def join_chat_as_agent(chat_id: str, current_user: TokenData = Depends(require_admin_or_staff)):
    """Agent joins a chat to assist customer"""
    chat = await db.chats.find_one({"id": chat_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    user = await db.users.find_one({"id": current_user.user_id}, {"_id": 0})
    agent_name = user.get("name", current_user.email) if user else current_user.email
    
    await db.chats.update_one(
        {"id": chat_id},
        {
            "$set": {
                "agent_id": current_user.user_id,
                "agent_name": agent_name,
                "status": ChatStatus.WITH_HUMAN,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if chat_id in active_chats:
        active_chats[chat_id]["agent_id"] = current_user.user_id
        active_chats[chat_id]["status"] = ChatStatus.WITH_HUMAN
    
    system_message = {
        "id": str(uuid.uuid4()),
        "type": ChatMessageType.SYSTEM,
        "text": f"{agent_name} has joined the chat and is here to help you!",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chats.update_one(
        {"id": chat_id},
        {"$push": {"messages": system_message}}
    )
    
    await db.chat_notifications.update_many(
        {"chat_id": chat_id},
        {"$set": {"read": True}}
    )
    
    return {"message": "Joined chat", "system_message": system_message}


@chat_router.post("/chat/admin/message")
async def send_agent_message_simple(
    request: dict,
    current_user: TokenData = Depends(require_admin_or_staff)
):
    """Send a message as an agent"""
    session_id = request.get("session_id")
    text = request.get("text")
    
    if not session_id or not text:
        raise HTTPException(status_code=400, detail="session_id and text are required")
    
    chat = await db.chats.find_one({"session_id": session_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    chat_id = chat["id"]
    user = await db.users.find_one({"id": current_user.user_id}, {"_id": 0})
    agent_name = user.get("name", "Agent") if user else "Agent"
    
    agent_message = {
        "id": str(uuid.uuid4()),
        "type": "agent",
        "text": text,
        "agent_id": current_user.user_id,
        "agent_name": agent_name,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chats.update_one(
        {"id": chat_id},
        {"$push": {"messages": agent_message}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Message sent", "agent_message": agent_message}


@chat_router.post("/chat/admin/close/{chat_id}")
async def close_chat(chat_id: str, current_user: TokenData = Depends(require_admin_or_staff)):
    """Close a chat session"""
    chat = await db.chats.find_one({"id": chat_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    summary = "Chat closed by agent"
    
    await db.chats.update_one(
        {"id": chat_id},
        {
            "$set": {
                "status": ChatStatus.CLOSED,
                "summary": summary,
                "closed_at": datetime.now(timezone.utc).isoformat(),
                "closed_by": current_user.user_id,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if chat_id in active_chats:
        del active_chats[chat_id]
    
    system_message = {
        "id": str(uuid.uuid4()),
        "type": ChatMessageType.SYSTEM,
        "text": "This chat session has been closed. Thank you for shopping with 123Bots!",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chats.update_one(
        {"id": chat_id},
        {"$push": {"messages": system_message}}
    )
    
    return {"message": "Chat closed", "summary": summary}


@chat_router.delete("/chat/admin/chat/{chat_id}")
async def delete_chat(chat_id: str, current_user: TokenData = Depends(require_admin_or_staff)):
    """Delete a chat and its attachments"""
    chat = await db.chats.find_one({"id": chat_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    messages = chat.get("messages", [])
    for msg in messages:
        attachment = msg.get("attachment")
        if attachment and attachment.get("url"):
            url = attachment["url"]
            if "/api/uploads/chat/" in url:
                filename = url.split("/api/uploads/chat/")[-1]
                file_path = Path(f"/app/uploads/chat/{filename}")
                if file_path.exists():
                    try:
                        file_path.unlink()
                    except Exception as e:
                        logger.warning(f"Failed to delete attachment file: {e}")
    
    await db.chats.delete_one({"id": chat_id})
    await db.chat_notifications.delete_many({"chat_id": chat_id})
    
    if chat_id in active_chats:
        del active_chats[chat_id]
    
    return {"message": "Chat deleted successfully"}


@chat_router.get("/chat/admin/notifications")
async def get_chat_notifications(current_user: TokenData = Depends(require_admin_or_staff)):
    """Get unread chat notifications"""
    notifications = await db.chat_notifications.find(
        {"read": False},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=50)
    
    return {"notifications": notifications, "count": len(notifications)}


@chat_router.get("/chat/admin/typing/{chat_id}")
async def get_user_typing(chat_id: str, current_user: TokenData = Depends(require_admin_or_staff)):
    """Get what user is currently typing"""
    if chat_id in active_chats:
        return {"typing_text": active_chats[chat_id].get("typing_text", "")}
    return {"typing_text": ""}


@chat_router.post("/chat/admin/set-availability")
async def set_agent_availability_simple(
    is_available: bool = Query(...),
    current_user: TokenData = Depends(require_admin_or_staff)
):
    """Set agent availability"""
    await db.agent_availability.update_one(
        {"user_id": current_user.user_id},
        {
            "$set": {
                "user_id": current_user.user_id,
                "is_available": is_available,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    agent_availability[current_user.user_id] = {
        "is_available": is_available,
        "available_from": None,
        "available_to": None
    }
    
    return {"message": "Availability updated", "is_available": is_available}


@chat_router.get("/chat/admin/availability")
async def get_agent_availability(current_user: TokenData = Depends(require_admin_or_staff)):
    """Get current agent availability"""
    availability = await db.agent_availability.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    return availability or {"is_available": False, "available_from": None, "available_to": None}


@chat_router.get("/chat/availability/public")
async def get_public_live_chat_availability():
    """Public endpoint for widget: whether owner/support live reps are online."""
    feature_flags = await db.admin_settings.find_one(
        {"type": "feature_flags"},
        {"_id": 0, "owner_chat_enabled": 1, "owner_chat_ai_enabled": 1},
    )

    owner_chat_enabled = bool(feature_flags.get("owner_chat_enabled", False)) if feature_flags else False
    owner_chat_ai_enabled = bool(feature_flags.get("owner_chat_ai_enabled", False)) if feature_flags else False

    if not owner_chat_enabled:
        return {
            "owner_chat_enabled": False,
            "owner_chat_ai_enabled": owner_chat_ai_enabled,
            "any_online": False,
            "online_agents": 0,
        }

    available_docs = await db.agent_availability.find({"is_available": True}, {"_id": 0, "user_id": 1}).to_list(length=200)
    available_ids = [item.get("user_id") for item in available_docs if item.get("user_id")]

    online_agents = 0
    if available_ids:
        online_agents = await db.users.count_documents(
            {
                "id": {"$in": available_ids},
                "role": {"$in": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]},
                "is_active": {"$ne": False},
            }
        )

    return {
        "owner_chat_enabled": owner_chat_enabled,
        "owner_chat_ai_enabled": owner_chat_ai_enabled,
        "any_online": online_agents > 0,
        "online_agents": online_agents,
    }


# ========================================
# ROUND ROBIN ROUTES
# ========================================

@chat_router.get("/chat/round-robin/settings")
async def get_round_robin_settings(current_user: TokenData = Depends(require_admin_or_staff)):
    """Get round robin settings"""
    settings = await db.chat_round_robin.find_one({"type": "settings"}, {"_id": 0})
    
    if not settings:
        admins = await db.users.find(
            {"role": {"$in": ["super_admin", "admin", "staff"]}},
            {"_id": 0, "id": 1, "name": 1, "email": 1, "role": 1}
        ).to_list(length=100)
        
        agent_order = [{"user_id": a["id"], "order": i, "opted_out": False} for i, a in enumerate(admins)]
        
        settings = {
            "type": "settings",
            "agent_order": agent_order,
            "current_index": 0,
            "enabled": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_round_robin.insert_one(settings)
    
    user_ids = [a["user_id"] for a in settings.get("agent_order", [])]
    users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "hashed_password": 0}).to_list(length=100)
    user_map = {u["id"]: u for u in users}
    
    availabilities = await db.agent_availability.find({"user_id": {"$in": user_ids}}, {"_id": 0}).to_list(length=100)
    avail_map = {a["user_id"]: a.get("is_available", False) for a in availabilities}
    
    enriched_order = []
    for agent in settings.get("agent_order", []):
        user = user_map.get(agent["user_id"], {})
        enriched_order.append({
            **agent,
            "first_name": user.get("name", "Unknown").split()[0] if user.get("name") else "Unknown",
            "last_name": " ".join(user.get("name", "").split()[1:]) if user.get("name") else "",
            "email": user.get("email", ""),
            "role": user.get("role", ""),
            "is_available": avail_map.get(agent["user_id"], False)
        })
    
    return {
        "agent_order": enriched_order,
        "current_index": settings.get("current_index", 0),
        "enabled": settings.get("enabled", True)
    }


@chat_router.put("/chat/round-robin/settings")
async def update_round_robin_settings(data: dict, current_user: TokenData = Depends(require_admin_or_staff)):
    """Update round robin settings"""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    updates = {
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if "agent_order" in data:
        updates["agent_order"] = [
            {"user_id": a["user_id"], "order": i, "opted_out": a.get("opted_out", False)}
            for i, a in enumerate(data["agent_order"])
        ]
    
    if "enabled" in data:
        updates["enabled"] = data["enabled"]
    
    if "current_index" in data:
        updates["current_index"] = data["current_index"]
    
    await db.chat_round_robin.update_one(
        {"type": "settings"},
        {"$set": updates},
        upsert=True
    )
    
    return {"message": "Round robin settings updated"}


@chat_router.get("/chat/round-robin/available-agents")
async def get_available_agents_for_rotation(current_user: TokenData = Depends(require_admin_or_staff)):
    """Get all users eligible for round robin rotation"""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    eligible_roles = ["super_admin", "admin", "staff"]
    users = await db.users.find(
        {"role": {"$in": eligible_roles}},
        {"_id": 0, "hashed_password": 0}
    ).to_list(length=200)
    
    settings = await db.chat_round_robin.find_one({"type": "settings"}, {"_id": 0})
    current_ids = [a["user_id"] for a in settings.get("agent_order", [])] if settings else []
    
    for user in users:
        user["in_rotation"] = user["id"] in current_ids
    
    return {"users": users}


@chat_router.post("/chat/round-robin/add-agent")
async def add_agent_to_rotation(data: dict, current_user: TokenData = Depends(require_admin_or_staff)):
    """Add an agent to the round robin rotation"""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    settings = await db.chat_round_robin.find_one({"type": "settings"})
    agent_order = settings.get("agent_order", []) if settings else []
    
    if any(a["user_id"] == user_id for a in agent_order):
        raise HTTPException(status_code=400, detail="User already in rotation")
    
    agent_order.append({
        "user_id": user_id,
        "order": len(agent_order),
        "opted_out": False
    })
    
    await db.chat_round_robin.update_one(
        {"type": "settings"},
        {"$set": {"agent_order": agent_order, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"message": "Agent added to rotation"}


@chat_router.delete("/chat/round-robin/remove-agent/{user_id}")
async def remove_agent_from_rotation(user_id: str, current_user: TokenData = Depends(require_admin_or_staff)):
    """Remove an agent from the round robin rotation"""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    settings = await db.chat_round_robin.find_one({"type": "settings"})
    if not settings:
        raise HTTPException(status_code=404, detail="Round robin not configured")
    
    agent_order = [a for a in settings.get("agent_order", []) if a["user_id"] != user_id]
    
    for i, agent in enumerate(agent_order):
        agent["order"] = i
    
    await db.chat_round_robin.update_one(
        {"type": "settings"},
        {"$set": {"agent_order": agent_order, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Agent removed from rotation"}
