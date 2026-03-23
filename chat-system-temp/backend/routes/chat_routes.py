# ========================================
# ==================== JOFFRY AI CHAT SYSTEM ====================
# ========================================

from emergentintegrations.llm.chat import LlmChat, UserMessage

# Chat status enum
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
    WHISPER = "whisper"  # Private message from supervisor to agent

# Pydantic models for chat
class ChatMessageCreate(BaseModel):
    text: str
    session_id: str

class AgentAvailability(BaseModel):
    is_available: bool
    available_from: Optional[str] = None  # HH:MM format
    available_to: Optional[str] = None    # HH:MM format

class WhisperMessage(BaseModel):
    chat_id: str
    agent_id: str
    text: str

# Knowledge base for Joffry
JOFFRY_SYSTEM_PROMPT = """You are Joffry, a friendly and professional AI assistant for Mastech Med, a Medicare-certified Durable Medical Equipment (DME) supplier based in Newport News, Virginia.

**About Mastech Med:**
- Medicare-accredited DME supplier serving all 50 US states
- Phone: (757) 831-7908
- Address: 1405 Kiln Creek Parkway, Suite O, Newport News, VA 23602
- Email: info@mastechmed.com
- HIPAA compliant, dedicated to patient privacy and care

**Our Products:**
- Back Braces (lumbar support, posture correctors)
- Knee Braces (stabilizers, compression sleeves, hinged braces)
- Wheelchairs (manual, power, lightweight, transport)
- Walkers (standard, rollators, knee walkers)
- Hospital Beds (semi-electric, full-electric, low beds)
- CPAP Machines and supplies
- Oxygen concentrators
- Mobility scooters
- Bath safety equipment
- Diabetic supplies
- Wound care supplies
- Compression stockings

**Insurance & Coverage:**
- We work with Medicare Part B
- We handle insurance verification and paperwork
- We coordinate with doctors for prescriptions
- Most equipment is covered with little to no out-of-pocket cost

**Your Personality:**
- Friendly and warm, but professional
- Helpful and knowledgeable about DME products
- Patient and understanding, especially with elderly patients
- Always offer to connect users with a human representative if they need more help
- Never provide medical advice - recommend consulting with their doctor

**Important Guidelines:**
- If asked about specific medical conditions, recommend consulting their doctor
- If asked about pricing, explain that costs depend on insurance coverage
- If user seems frustrated or has complex questions, offer to connect them with a human
- Always be respectful of patient privacy (HIPAA)
- Keep responses concise but helpful

If the user wants to speak with a human representative, let them know you'll connect them right away."""

# Store active chat sessions in memory (for real-time features)
active_chats = {}  # chat_id -> {session_id, agent_id, supervisor_ids, typing_text, etc.}
agent_availability = {}  # user_id -> availability settings


@api_router.post("/chat/start")
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
        "supervisor_ids": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "summary": None,
        "converted_to_lead": False,
        "lead_id": None
    }
    
    await db.chats.insert_one(chat_data)
    
    # Add to active chats
    active_chats[chat_id] = {
        "session_id": session_id,
        "agent_id": None,
        "supervisor_ids": [],
        "typing_text": "",
        "status": ChatStatus.ACTIVE
    }
    
    # Send welcome message from Joffry
    welcome_message = {
        "id": str(uuid.uuid4()),
        "type": ChatMessageType.AI,
        "text": "Hi there! 👋 I'm Joffry, your virtual assistant at Mastech Med. I'm here to help you learn about our Medicare-covered medical equipment. How can I assist you today?",
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


@api_router.post("/chat/message")
async def send_chat_message(message: ChatMessageCreate):
    """Send a message in a chat session"""
    chat = await db.chats.find_one({"session_id": message.session_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    chat_id = chat["id"]
    
    # Store user message
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
    
    # Update typing indicator in active chats
    if chat_id in active_chats:
        active_chats[chat_id]["typing_text"] = ""
    
    # If chat is with human agent, don't generate AI response
    if chat["status"] == ChatStatus.WITH_HUMAN:
        return {"message": user_message, "ai_response": None}
    
    # Generate AI response using Joffry
    try:
        llm_key = os.environ.get("EMERGENT_LLM_KEY")
        
        # Build conversation history for context
        history_messages = chat.get("messages", [])[-10:]  # Last 10 messages for context
        conversation_context = "\n".join([
            f"{'User' if m['type'] == 'user' else 'Joffry'}: {m['text']}"
            for m in history_messages
        ])
        
        enhanced_prompt = f"{JOFFRY_SYSTEM_PROMPT}\n\nConversation so far:\n{conversation_context}\n\nUser's latest message: {message.text}"
        
        chat_llm = LlmChat(
            api_key=llm_key,
            session_id=f"joffry-{chat_id}",
            system_message=JOFFRY_SYSTEM_PROMPT
        ).with_model("openai", "gpt-5.2")
        
        user_msg = UserMessage(text=message.text)
        ai_response_text = await chat_llm.send_message(user_msg)
        
        # Store AI response
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
        # Fallback response
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


@api_router.post("/chat/request-human")
async def request_human_agent(session_id: str):
    """Request to speak with a human agent"""
    chat = await db.chats.find_one({"session_id": session_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    chat_id = chat["id"]
    
    # Update chat status
    await db.chats.update_one(
        {"id": chat_id},
        {
            "$set": {
                "status": ChatStatus.WAITING_HUMAN,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Update active chat status
    if chat_id in active_chats:
        active_chats[chat_id]["status"] = ChatStatus.WAITING_HUMAN
    
    # Add system message
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
    
    # Create notification for available agents
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


@api_router.post("/chat/typing")
async def update_typing_status(session_id: str, text: str = ""):
    """Update typing indicator (what user is typing in real-time)"""
    chat = await db.chats.find_one({"session_id": session_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    chat_id = chat["id"]
    
    # Update typing text in active chats
    if chat_id in active_chats:
        active_chats[chat_id]["typing_text"] = text
    
    return {"status": "ok"}


@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    chat = await db.chats.find_one({"session_id": session_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    return chat


@api_router.post("/chat/upload")
async def upload_chat_attachment(
    file: UploadFile = File(...),
    session_id: str = Form(...),
    is_agent: str = Form(default="false")
):
    """Upload a file attachment in a chat"""
    import os
    import base64
    
    chat = await db.chats.find_one({"session_id": session_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    chat_id = chat["id"]
    
    # Read file content
    file_content = await file.read()
    
    # Validate file size (max 10MB)
    if len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 10MB")
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_filename = f"chat_{chat_id}_{uuid.uuid4()}{file_ext}"
    
    # Store file in uploads directory
    upload_dir = Path("/app/uploads/chat")
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / unique_filename
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Create attachment record
    attachment = {
        "id": str(uuid.uuid4()),
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(file_content),
        "url": f"/api/uploads/chat/{unique_filename}",
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Create message with attachment
    message_type = "agent" if is_agent.lower() == "true" else "user"
    message = {
        "id": str(uuid.uuid4()),
        "type": message_type,
        "text": file.filename,
        "attachment": attachment,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Add message to chat
    await db.chats.update_one(
        {"id": chat_id},
        {
            "$push": {"messages": message},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"message": "File uploaded", "attachment": attachment}


# Serve uploaded chat files
@app.get("/api/uploads/chat/{filename}", include_in_schema=False)
async def serve_chat_upload(filename: str):
    """Serve uploaded chat files"""
    from fastapi.responses import FileResponse
    
    file_path = Path(f"/app/uploads/chat/{filename}")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path)


@api_router.post("/chat/convert-to-lead")
async def convert_chat_to_lead(session_id: str):
    """Convert a chat to a lead"""
    chat = await db.chats.find_one({"session_id": session_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    if chat.get("converted_to_lead"):
        return {"message": "Already converted to lead", "lead_id": chat.get("lead_id")}
    
    # Create lead from chat
    lead_data = {
        "id": str(uuid.uuid4()),
        "first_name": chat.get("visitor_name", "").split()[0] if chat.get("visitor_name") else "Chat",
        "last_name": " ".join(chat.get("visitor_name", "").split()[1:]) if chat.get("visitor_name") else "Visitor",
        "email": chat.get("visitor_email"),
        "phone": "",
        "source": "Chat - Joffry AI",
        "status": LeadStatus.NEW,
        "notes": f"Lead created from chat conversation. Chat ID: {chat['id']}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.leads.insert_one(lead_data)
    
    # Update chat with lead reference
    await db.chats.update_one(
        {"id": chat["id"]},
        {
            "$set": {
                "converted_to_lead": True,
                "lead_id": lead_data["id"],
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Converted to lead", "lead_id": lead_data["id"]}


# --- Admin/Sales Chat Endpoints ---

@api_router.get("/chat/admin/pending")
async def get_pending_chats(
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SALES_REP))
):
    """Get chats waiting for human agent"""
    chats = await db.chats.find(
        {"status": ChatStatus.WAITING_HUMAN},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(length=50)
    
    return {"chats": chats}


@api_router.get("/chat/admin/active")
async def get_active_chats(
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SALES_REP))
):
    """Get all active chats (for admin to monitor)"""
    chats = await db.chats.find(
        {"status": {"$in": [ChatStatus.ACTIVE, ChatStatus.WAITING_HUMAN, ChatStatus.WITH_HUMAN]}},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(length=100)
    
    # Add real-time typing info
    for chat in chats:
        if chat["id"] in active_chats:
            chat["typing_text"] = active_chats[chat["id"]].get("typing_text", "")
    
    return {"chats": chats}


@api_router.get("/chat/admin/my-chats")
async def get_my_assigned_chats(
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SALES_REP))
):
    """Get chats assigned to current agent"""
    chats = await db.chats.find(
        {"agent_id": current_user["id"], "status": ChatStatus.WITH_HUMAN},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(length=50)
    
    return {"chats": chats}


@api_router.post("/chat/admin/join/{chat_id}")
async def join_chat_as_agent(
    chat_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SALES_REP))
):
    """Agent joins a chat to assist customer"""
    chat = await db.chats.find_one({"id": chat_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Update chat with agent
    await db.chats.update_one(
        {"id": chat_id},
        {
            "$set": {
                "agent_id": current_user["id"],
                "agent_name": f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or current_user.get('email'),
                "status": ChatStatus.WITH_HUMAN,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Update active chat
    if chat_id in active_chats:
        active_chats[chat_id]["agent_id"] = current_user["id"]
        active_chats[chat_id]["status"] = ChatStatus.WITH_HUMAN
    
    # Add system message
    agent_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or "A representative"
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
    
    # Mark notification as read
    await db.chat_notifications.update_many(
        {"chat_id": chat_id},
        {"$set": {"read": True}}
    )
    
    return {"message": "Joined chat", "system_message": system_message}


@api_router.post("/chat/admin/message/{chat_id}")
async def send_agent_message(
    chat_id: str,
    text: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SALES_REP))
):
    """Agent sends a message to customer"""
    chat = await db.chats.find_one({"id": chat_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    if chat.get("agent_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="You are not assigned to this chat")
    
    agent_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or "Agent"
    
    agent_message = {
        "id": str(uuid.uuid4()),
        "type": ChatMessageType.AGENT,
        "text": text,
        "agent_id": current_user["id"],
        "agent_name": agent_name,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chats.update_one(
        {"id": chat_id},
        {
            "$push": {"messages": agent_message},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"message": agent_message}


@api_router.post("/chat/admin/whisper/{chat_id}")
async def send_whisper_message(
    chat_id: str,
    agent_id: str,
    text: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN))
):
    """Supervisor sends a private whisper to agent (customer can't see)"""
    chat = await db.chats.find_one({"id": chat_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    supervisor_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or "Supervisor"
    
    whisper_message = {
        "id": str(uuid.uuid4()),
        "type": ChatMessageType.WHISPER,
        "text": text,
        "from_id": current_user["id"],
        "from_name": supervisor_name,
        "to_agent_id": agent_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chats.update_one(
        {"id": chat_id},
        {"$push": {"messages": whisper_message}}
    )
    
    return {"message": whisper_message}


@api_router.post("/chat/admin/supervise/{chat_id}")
async def start_supervising_chat(
    chat_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN))
):
    """Admin starts supervising a chat (can see everything, whisper to agent)"""
    chat = await db.chats.find_one({"id": chat_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Add supervisor to chat
    await db.chats.update_one(
        {"id": chat_id},
        {"$addToSet": {"supervisor_ids": current_user["id"]}}
    )
    
    # Update active chat
    if chat_id in active_chats:
        if current_user["id"] not in active_chats[chat_id].get("supervisor_ids", []):
            active_chats[chat_id].setdefault("supervisor_ids", []).append(current_user["id"])
    
    return {"message": "Now supervising chat"}


@api_router.get("/chat/admin/typing/{chat_id}")
async def get_user_typing(
    chat_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SALES_REP))
):
    """Get what user is currently typing (real-time)"""
    if chat_id in active_chats:
        return {"typing_text": active_chats[chat_id].get("typing_text", "")}
    return {"typing_text": ""}


@api_router.post("/chat/admin/close/{chat_id}")
async def close_chat(
    chat_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SALES_REP))
):
    """Close a chat session"""
    chat = await db.chats.find_one({"id": chat_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Generate summary using AI
    summary = None
    try:
        llm_key = os.environ.get("EMERGENT_LLM_KEY")
        messages = chat.get("messages", [])
        conversation = "\n".join([f"{m['type']}: {m['text']}" for m in messages if m['type'] != 'whisper'])
        
        summary_chat = LlmChat(
            api_key=llm_key,
            session_id=f"summary-{chat_id}",
            system_message="You are a helpful assistant that summarizes customer service conversations. Provide a brief summary of the key points, customer needs, and outcomes."
        ).with_model("openai", "gpt-5.2")
        
        summary_prompt = UserMessage(text=f"Please summarize this customer service conversation:\n\n{conversation}")
        summary = await summary_chat.send_message(summary_prompt)
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        summary = "Summary generation failed"
    
    # Update chat
    await db.chats.update_one(
        {"id": chat_id},
        {
            "$set": {
                "status": ChatStatus.CLOSED,
                "summary": summary,
                "closed_at": datetime.now(timezone.utc).isoformat(),
                "closed_by": current_user["id"],
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Remove from active chats
    if chat_id in active_chats:
        del active_chats[chat_id]
    
    # Add closing message
    system_message = {
        "id": str(uuid.uuid4()),
        "type": ChatMessageType.SYSTEM,
        "text": "This chat session has been closed. Thank you for contacting Mastech Med!",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chats.update_one(
        {"id": chat_id},
        {"$push": {"messages": system_message}}
    )
    
    return {"message": "Chat closed", "summary": summary}


@api_router.get("/chat/admin/notifications")
async def get_chat_notifications(
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SALES_REP))
):
    """Get unread chat notifications"""
    notifications = await db.chat_notifications.find(
        {"read": False},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=50)
    
    return {"notifications": notifications, "count": len(notifications)}


@api_router.post("/chat/admin/availability")
async def set_agent_availability(
    availability: AgentAvailability,
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SALES_REP))
):
    """Set agent availability status"""
    await db.agent_availability.update_one(
        {"user_id": current_user["id"]},
        {
            "$set": {
                "user_id": current_user["id"],
                "is_available": availability.is_available,
                "available_from": availability.available_from,
                "available_to": availability.available_to,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    # Update in-memory store
    agent_availability[current_user["id"]] = {
        "is_available": availability.is_available,
        "available_from": availability.available_from,
        "available_to": availability.available_to
    }
    
    return {"message": "Availability updated"}


@api_router.get("/chat/admin/availability")
async def get_agent_availability(
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SALES_REP))
):
    """Get current agent availability"""
    availability = await db.agent_availability.find_one(
        {"user_id": current_user["id"]},
        {"_id": 0}
    )
    
    return availability or {"is_available": False, "available_from": None, "available_to": None}


@api_router.get("/chat/admin/stats")
async def get_chat_stats(
    current_user: dict = Depends(require_roles(UserRole.ADMIN))
):
    """Get chat statistics"""
    total = await db.chats.count_documents({})
    active = await db.chats.count_documents({"status": {"$in": [ChatStatus.ACTIVE, ChatStatus.WAITING_HUMAN, ChatStatus.WITH_HUMAN]}})
    waiting = await db.chats.count_documents({"status": ChatStatus.WAITING_HUMAN})
    with_human = await db.chats.count_documents({"status": ChatStatus.WITH_HUMAN})
    closed = await db.chats.count_documents({"status": ChatStatus.CLOSED})
    converted = await db.chats.count_documents({"converted_to_lead": True})
    
    # Get available agents
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


# ==================== CHAT ADMIN DASHBOARD ROUTES ====================

@api_router.get("/chat/admin/dashboard")
async def get_chat_admin_dashboard(
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SALES_REP, UserRole.SUPER_ADMIN))
):
    """Get complete chat dashboard data - stats, pending chats, and active chats"""
    # Get stats
    total = await db.chats.count_documents({})
    waiting = await db.chats.count_documents({"status": ChatStatus.WAITING_HUMAN})
    with_human = await db.chats.count_documents({"status": ChatStatus.WITH_HUMAN})
    
    stats = {
        "total": total,
        "waiting_for_agent": waiting,
        "with_agent": with_human
    }
    
    # Get pending chats (waiting for human)
    pending_chats = await db.chats.find(
        {"status": ChatStatus.WAITING_HUMAN},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(length=50)
    
    # Get active chats (with human agent)
    active_chats = await db.chats.find(
        {"status": ChatStatus.WITH_HUMAN},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(length=50)
    
    # Add typing indicators for active chats
    for chat in active_chats:
        if chat["id"] in active_chats:
            chat["typing_text"] = active_chats[chat["id"]].get("typing_text", "")
    
    return {
        "stats": stats,
        "pending_chats": pending_chats,
        "active_chats": active_chats
    }


@api_router.get("/chat/admin/chat/{chat_id}")
async def get_chat_details(
    chat_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SALES_REP, UserRole.SUPER_ADMIN))
):
    """Get detailed chat information including messages"""
    chat = await db.chats.find_one({"id": chat_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return chat


@api_router.delete("/chat/admin/chat/{chat_id}")
async def delete_chat(
    chat_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))
):
    """Delete a chat and its attachments"""
    import shutil
    
    chat = await db.chats.find_one({"id": chat_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Delete associated files
    messages = chat.get("messages", [])
    for msg in messages:
        attachment = msg.get("attachment")
        if attachment and attachment.get("url"):
            # Extract filename from URL
            url = attachment["url"]
            if "/api/uploads/chat/" in url:
                filename = url.split("/api/uploads/chat/")[-1]
                file_path = Path(f"/app/uploads/chat/{filename}")
                if file_path.exists():
                    try:
                        file_path.unlink()
                    except Exception as e:
                        logger.warning(f"Failed to delete attachment file: {e}")
    
    # Delete chat from database
    await db.chats.delete_one({"id": chat_id})
    
    # Delete related notifications
    await db.chat_notifications.delete_many({"chat_id": chat_id})
    
    # Remove from active chats if present
    if chat_id in active_chats:
        del active_chats[chat_id]
    
    return {"message": "Chat deleted successfully"}


@api_router.post("/chat/admin/set-availability")
async def set_agent_availability_simple(
    is_available: bool = Query(...),
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SALES_REP, UserRole.SUPER_ADMIN))
):
    """Simple endpoint to set agent availability via query param"""
    await db.agent_availability.update_one(
        {"user_id": current_user["id"]},
        {
            "$set": {
                "user_id": current_user["id"],
                "is_available": is_available,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    # Update in-memory store
    agent_availability[current_user["id"]] = {
        "is_available": is_available,
        "available_from": None,
        "available_to": None
    }
    
    return {"message": "Availability updated", "is_available": is_available}


@api_router.post("/chat/admin/message")
async def send_agent_message_simple(
    request: dict,
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SALES_REP, UserRole.SUPER_ADMIN))
):
    """Send a message as an agent - accepts session_id in body"""
    session_id = request.get("session_id")
    text = request.get("text")
    
    if not session_id or not text:
        raise HTTPException(status_code=400, detail="session_id and text are required")
    
    chat = await db.chats.find_one({"session_id": session_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    chat_id = chat["id"]
    agent_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or "Agent"
    
    agent_message = {
        "id": str(uuid.uuid4()),
        "type": "agent",
        "text": text,
        "agent_id": current_user["id"],
        "agent_name": agent_name,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chats.update_one(
        {"id": chat_id},
        {"$push": {"messages": agent_message}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Message sent", "agent_message": agent_message}


# ==================== CHAT ROUND ROBIN ROUTES ====================

@api_router.get("/chat/round-robin/settings")
async def get_round_robin_settings(current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))):
    """Get round robin settings including agent order and opt-out status"""
    settings = await db.chat_round_robin.find_one({"type": "settings"}, {"_id": 0})
    
    if not settings:
        # Initialize with super admin in rotation by default
        super_admins = await db.users.find({"role": "super_admin"}, {"_id": 0, "id": 1, "first_name": 1, "last_name": 1, "email": 1, "role": 1}).to_list(length=100)
        admins = await db.users.find({"role": {"$in": ["admin", "sales_manager", "sales_rep"]}}, {"_id": 0, "id": 1, "first_name": 1, "last_name": 1, "email": 1, "role": 1}).to_list(length=100)
        
        all_agents = super_admins + admins
        agent_order = [{"user_id": a["id"], "order": i, "opted_out": False} for i, a in enumerate(all_agents)]
        
        settings = {
            "type": "settings",
            "agent_order": agent_order,
            "current_index": 0,
            "enabled": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_round_robin.insert_one(settings)
    
    # Enrich with user details
    user_ids = [a["user_id"] for a in settings.get("agent_order", [])]
    users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "password_hash": 0}).to_list(length=100)
    user_map = {u["id"]: u for u in users}
    
    # Get availability status for each agent
    availabilities = await db.agent_availability.find({"user_id": {"$in": user_ids}}, {"_id": 0}).to_list(length=100)
    avail_map = {a["user_id"]: a.get("is_available", False) for a in availabilities}
    
    enriched_order = []
    for agent in settings.get("agent_order", []):
        user = user_map.get(agent["user_id"], {})
        enriched_order.append({
            **agent,
            "first_name": user.get("first_name", "Unknown"),
            "last_name": user.get("last_name", ""),
            "email": user.get("email", ""),
            "role": user.get("role", ""),
            "is_available": avail_map.get(agent["user_id"], False)
        })
    
    return {
        "agent_order": enriched_order,
        "current_index": settings.get("current_index", 0),
        "enabled": settings.get("enabled", True)
    }

@api_router.put("/chat/round-robin/settings")
async def update_round_robin_settings(data: dict, current_user: dict = Depends(require_roles(UserRole.SUPER_ADMIN))):
    """Update round robin settings - reorder agents or enable/disable"""
    updates = {
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if "agent_order" in data:
        # Validate and update agent order
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

@api_router.post("/chat/round-robin/opt-out")
async def opt_out_round_robin(current_user: dict = Depends(get_current_user)):
    """Opt out of round robin rotation"""
    await db.chat_round_robin.update_one(
        {"type": "settings", "agent_order.user_id": current_user["id"]},
        {"$set": {"agent_order.$.opted_out": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Opted out of round robin"}

@api_router.post("/chat/round-robin/opt-in")
async def opt_in_round_robin(current_user: dict = Depends(get_current_user)):
    """Opt back into round robin rotation"""
    await db.chat_round_robin.update_one(
        {"type": "settings", "agent_order.user_id": current_user["id"]},
        {"$set": {"agent_order.$.opted_out": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Opted into round robin"}

@api_router.get("/chat/round-robin/next-agent")
async def get_next_round_robin_agent():
    """Get the next available agent in the round robin rotation"""
    settings = await db.chat_round_robin.find_one({"type": "settings"}, {"_id": 0})
    
    if not settings or not settings.get("enabled"):
        return {"agent_id": None, "message": "Round robin disabled"}
    
    agent_order = settings.get("agent_order", [])
    current_index = settings.get("current_index", 0)
    
    # Find next available agent
    checked = 0
    while checked < len(agent_order):
        idx = (current_index + checked) % len(agent_order)
        agent = agent_order[idx]
        
        if not agent.get("opted_out"):
            # Check if agent is available
            avail = await db.agent_availability.find_one({"user_id": agent["user_id"]})
            if avail and avail.get("is_available"):
                # Update index for next time
                next_idx = (idx + 1) % len(agent_order)
                await db.chat_round_robin.update_one(
                    {"type": "settings"},
                    {"$set": {"current_index": next_idx}}
                )
                
                # Get agent details
                user = await db.users.find_one({"id": agent["user_id"]}, {"_id": 0, "password_hash": 0})
                return {
                    "agent_id": agent["user_id"],
                    "agent_name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() if user else "Agent",
                    "agent_email": user.get("email") if user else None
                }
        
        checked += 1
    
    return {"agent_id": None, "message": "No available agents"}

@api_router.get("/chat/round-robin/available-agents")
async def get_available_agents_for_rotation(current_user: dict = Depends(require_roles(UserRole.SUPER_ADMIN))):
    """Get all users eligible for round robin rotation"""
    eligible_roles = ["super_admin", "admin", "sales_manager", "sales_rep"]
    users = await db.users.find(
        {"role": {"$in": eligible_roles}},
        {"_id": 0, "password_hash": 0}
    ).to_list(length=200)
    
    # Get current rotation list
    settings = await db.chat_round_robin.find_one({"type": "settings"}, {"_id": 0})
    current_ids = [a["user_id"] for a in settings.get("agent_order", [])] if settings else []
    
    # Mark which users are already in rotation
    for user in users:
        user["in_rotation"] = user["id"] in current_ids
    
    return {"users": users}

@api_router.post("/chat/round-robin/add-agent")
async def add_agent_to_rotation(data: dict, current_user: dict = Depends(require_roles(UserRole.SUPER_ADMIN))):
    """Add an agent to the round robin rotation"""
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    # Verify user exists and has eligible role
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    settings = await db.chat_round_robin.find_one({"type": "settings"})
    agent_order = settings.get("agent_order", []) if settings else []
    
    # Check if already in rotation
    if any(a["user_id"] == user_id for a in agent_order):
        raise HTTPException(status_code=400, detail="User already in rotation")
    
    # Add to end of rotation
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

@api_router.delete("/chat/round-robin/remove-agent/{user_id}")
async def remove_agent_from_rotation(user_id: str, current_user: dict = Depends(require_roles(UserRole.SUPER_ADMIN))):
    """Remove an agent from the round robin rotation"""
    settings = await db.chat_round_robin.find_one({"type": "settings"})
    if not settings:
        raise HTTPException(status_code=404, detail="Round robin not configured")
    
    agent_order = [a for a in settings.get("agent_order", []) if a["user_id"] != user_id]
    
    # Re-index orders
    for i, agent in enumerate(agent_order):
        agent["order"] = i
    
    await db.chat_round_robin.update_one(
        {"type": "settings"},
        {"$set": {"agent_order": agent_order, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Agent removed from rotation"}

