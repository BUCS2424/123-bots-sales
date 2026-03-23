# Integration Guide

## Quick Start

### 1. Frontend Setup

Add the chat widget to your main layout or any public page:

```jsx
import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <div>
      {/* Your app content */}
      <ChatWidget />
    </div>
  );
}
```

### 2. Admin Routes

Add these routes to your React Router:

```jsx
import AdminChatWindowPage from './pages/AdminChatWindowPage';
import RoundRobinSettingsPage from './pages/RoundRobinSettingsPage';
import UserProfilePage from './pages/UserProfilePage';

<Route path="/admin-chat/:chatId" element={<AdminChatWindowPage />} />
<Route path="/chat-round-robin" element={<RoundRobinSettingsPage />} />
<Route path="/profile" element={<UserProfilePage />} />
```

### 3. Backend Setup

Register the chat routes in your FastAPI server:

```python
# In your main server.py
from routes.chat_routes import chat_router, set_database, set_llm_key

set_database(db)  # Your Motor MongoDB database instance
set_llm_key(os.environ.get('EMERGENT_LLM_KEY'))

app.include_router(chat_router, prefix="/api")
```

### 4. Static HTML Embedding

For static sites (non-React), add this script tag:

```html
<script>
  window.CHAT_API_URL = 'https://yourdomain.com/api';
</script>
<script src="https://yourdomain.com/chat-widget.js"></script>
```

### 5. Admin Dashboard Component

Add the ChatDashboard to your admin settings:

```jsx
import ChatDashboard from './components/ChatDashboard';

// In your admin settings page
<ChatDashboard />
```
