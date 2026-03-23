# Chat System Complete Package

Full chat system with AI assistant (Joffry), human agent handoff, admin dashboard, round-robin distribution, and agent profile management.

## Contents

```
chat-system-complete/
├── frontend/
│   ├── components/
│   │   ├── ChatWidget.js          # Customer-facing chat bubble + AI bot
│   │   └── ChatDashboard.js       # Admin chat overview & stats
│   └── pages/
│       ├── AdminChatWindowPage.js  # Pop-out agent chat window
│       ├── RoundRobinSettingsPage.js # Round-robin agent rotation config
│       └── UserProfilePage.js      # Agent profile & availability
├── backend/
│   └── routes/
│       └── chat_routes.py          # All chat APIs (extracted from server.py)
├── docs/
│   └── integration.md
└── README.md
```

## Features

### Customer Side (ChatWidget.js)
- AI assistant "Joffry" powered by GPT
- Human agent handoff with queue position
- File upload & paste (images, PDFs, docs)
- Typing indicators
- Callback request form
- HIPAA-compliant consent capture
- Mobile responsive floating bubble

### Admin/Sales Side
- **ChatDashboard.js** — Overview stats, active/pending chats, agent status
- **AdminChatWindowPage.js** — Full agent chat window (opens in popup)
  - Real-time messaging with customers
  - Whisper messages (agent-to-agent, invisible to customer)
  - File sharing
  - Assign chat to lead
  - Create lead from chat
  - Close/transfer chats
  - Chat transcript export
- **RoundRobinSettingsPage.js** — Configure agent rotation, weights, fallback
- **UserProfilePage.js** — Agent availability toggle, profile settings

### Backend APIs
- `POST /api/chat/start` — Start new chat session
- `POST /api/chat/message` — Send message (customer or AI)
- `GET /api/chat/history/{session_id}` — Chat history
- `POST /api/chat/upload` — File uploads
- `GET /api/chat/admin/pending` — Pending chats queue
- `GET /api/chat/admin/active` — Active chats
- `GET /api/chat/admin/my-chats` — Agent's assigned chats
- `POST /api/chat/admin/join/{chat_id}` — Agent joins chat
- `POST /api/chat/admin/message/{chat_id}` — Agent sends message
- `POST /api/chat/admin/whisper/{chat_id}` — Whisper message
- `POST /api/chat/admin/close/{chat_id}` — Close chat
- `POST /api/chat/admin/supervise/{chat_id}` — Supervise chat
- `GET /api/chat/admin/notifications` — Unread notifications
- `GET /api/chat/admin/dashboard` — Dashboard stats
- `POST /api/chat/admin/assign-to-lead/{chat_id}` — Link chat to lead
- `POST /api/chat/admin/create-lead-from-chat` — Create lead from chat data
- Round-robin settings CRUD

## Dependencies

### Frontend
- React 18+
- axios
- lucide-react
- sonner (toast notifications)
- Shadcn UI components (Button, Card, Badge, Input, Dialog, etc.)

### Backend
- FastAPI
- Motor (MongoDB async driver)
- emergentintegrations (for GPT AI chat)
- python-multipart (file uploads)

## Integration Steps

1. Copy frontend components to your `src/components/` and `src/pages/`
2. Add routes in your App.js for AdminChatWindowPage, RoundRobinSettingsPage, UserProfilePage
3. Copy backend routes to your `backend/routes/` directory
4. Register the chat routes in your main server file
5. Set up MongoDB collections: `chat_sessions`, `chat_messages`, `chat_round_robin`
6. Configure your LLM API key for the AI assistant
7. Add the `<ChatWidget />` component to your public-facing pages

## Environment Variables

- `REACT_APP_BACKEND_URL` — Backend API URL
- `EMERGENT_LLM_KEY` — For GPT-powered AI assistant (or your OpenAI key)

## MongoDB Collections

- `chat_sessions` — Active/closed chat sessions
- `chat_messages` — All messages (customer, agent, AI, whisper)
- `chat_round_robin` — Round-robin settings and agent order
- `users` — Agent profiles with `chat_available` and `chat_status` fields
