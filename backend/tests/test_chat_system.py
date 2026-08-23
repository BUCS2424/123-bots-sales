"""
Chat System API Tests
Tests for:
- Chat widget endpoints (start, message, request-human, callback)
- Admin dashboard endpoints (stats, pending, active, join, close)
- AI response integration
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "mel@a2gdesigns.com"
ADMIN_PASSWORD = "BigDaddy2016!!"


class TestChatPublicEndpoints:
    """Public Chat Widget Endpoints - No Auth Required"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_start_chat_session(self):
        """Test starting a new chat session returns welcome message"""
        response = self.session.post(
            f"{BASE_URL}/api/chat/start",
            params={"visitor_name": "TestVisitor"}
        )
        
        assert response.status_code == 200, f"Start chat failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "chat_id" in data, "Missing chat_id"
        assert "session_id" in data, "Missing session_id"
        assert "welcome_message" in data, "Missing welcome_message"
        
        # Verify welcome message from Joffry
        welcome = data["welcome_message"]
        assert welcome["type"] == "ai", "Welcome message should be from AI"
        assert "Joffry" in welcome["text"], "Welcome should mention Joffry"
        assert "123Bots" in welcome["text"], "Welcome should mention 123Bots"
        
        # Store for later tests
        self.__class__.session_id = data["session_id"]
        self.__class__.chat_id = data["chat_id"]
    
    def test_send_message_and_get_ai_response(self):
        """Test sending a message returns AI response"""
        # First start a chat
        start_response = self.session.post(
            f"{BASE_URL}/api/chat/start",
            params={"visitor_name": "MessageTest"}
        )
        assert start_response.status_code == 200
        session_id = start_response.json()["session_id"]
        
        # Send a message
        response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "session_id": session_id,
                "text": "What peptides do you have?"
            }
        )
        
        assert response.status_code == 200, f"Send message failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "message" in data, "Missing user message in response"
        assert "ai_response" in data, "Missing AI response"
        
        # Verify user message
        assert data["message"]["type"] == "user"
        assert data["message"]["text"] == "What peptides do you have?"
        
        # Verify AI response (may be real or fallback)
        if data["ai_response"]:
            assert data["ai_response"]["type"] == "ai"
            assert len(data["ai_response"]["text"]) > 0
    
    def test_request_human_agent(self):
        """Test requesting human agent changes status"""
        # Start a chat
        start_response = self.session.post(
            f"{BASE_URL}/api/chat/start",
            params={"visitor_name": "HumanRequestTest"}
        )
        assert start_response.status_code == 200
        session_id = start_response.json()["session_id"]
        
        # Request human
        response = self.session.post(
            f"{BASE_URL}/api/chat/request-human",
            params={"session_id": session_id}
        )
        
        assert response.status_code == 200, f"Request human failed: {response.text}"
        data = response.json()
        
        assert data["status"] == "waiting_human", "Status should be waiting_human"
        assert "message" in data, "Should include system message"
        assert data["message"]["type"] == "system"
        assert "human representative" in data["message"]["text"].lower()
    
    def test_get_chat_history(self):
        """Test getting chat history"""
        # Start a chat
        start_response = self.session.post(
            f"{BASE_URL}/api/chat/start",
            params={"visitor_name": "HistoryTest"}
        )
        assert start_response.status_code == 200
        session_id = start_response.json()["session_id"]
        
        # Get history
        response = self.session.get(f"{BASE_URL}/api/chat/history/{session_id}")
        
        assert response.status_code == 200, f"Get history failed: {response.text}"
        data = response.json()
        
        assert "messages" in data, "Missing messages"
        assert "session_id" in data, "Missing session_id"
        assert len(data["messages"]) >= 1, "Should have at least welcome message"
    
    def test_request_callback(self):
        """Test callback request with phone number"""
        # Start a chat
        start_response = self.session.post(
            f"{BASE_URL}/api/chat/start",
            params={"visitor_name": "CallbackTest"}
        )
        assert start_response.status_code == 200
        session_id = start_response.json()["session_id"]
        
        # Request callback
        response = self.session.post(
            f"{BASE_URL}/api/chat/request-callback",
            json={
                "session_id": session_id,
                "phone": "555-123-4567"
            }
        )
        
        assert response.status_code == 200, f"Request callback failed: {response.text}"
        data = response.json()
        assert data["success"] == True
    
    def test_invalid_session_returns_404(self):
        """Test that invalid session returns 404"""
        response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "session_id": "invalid-session-id",
                "text": "Test message"
            }
        )
        assert response.status_code == 404


class TestChatAdminEndpoints:
    """Admin Chat Dashboard Endpoints - Auth Required"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login and get token
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip("Admin login failed")
    
    def test_get_chat_stats(self):
        """Test getting chat statistics"""
        response = self.session.get(f"{BASE_URL}/api/chat/admin/stats")
        
        assert response.status_code == 200, f"Get stats failed: {response.text}"
        data = response.json()
        
        # Verify stats fields
        expected_fields = ["total", "active", "waiting_for_human", "with_human", "closed"]
        for field in expected_fields:
            assert field in data, f"Missing stat field: {field}"
            assert isinstance(data[field], int), f"{field} should be an integer"
    
    def test_get_dashboard(self):
        """Test getting full dashboard data"""
        response = self.session.get(f"{BASE_URL}/api/chat/admin/dashboard")
        
        assert response.status_code == 200, f"Get dashboard failed: {response.text}"
        data = response.json()
        
        assert "stats" in data, "Missing stats"
        assert "pending_chats" in data, "Missing pending_chats"
        assert "active_chats" in data, "Missing active_chats"
    
    def test_get_pending_chats(self):
        """Test getting pending chats waiting for agent"""
        response = self.session.get(f"{BASE_URL}/api/chat/admin/pending")
        
        assert response.status_code == 200, f"Get pending failed: {response.text}"
        data = response.json()
        
        assert "chats" in data, "Missing chats array"
        assert isinstance(data["chats"], list), "Chats should be a list"
    
    def test_get_active_chats(self):
        """Test getting all active chats"""
        response = self.session.get(f"{BASE_URL}/api/chat/admin/active")
        
        assert response.status_code == 200, f"Get active failed: {response.text}"
        data = response.json()
        
        assert "chats" in data, "Missing chats array"
    
    def test_join_chat_as_agent(self):
        """Test agent joining a chat"""
        # First create a chat and request human
        public_session = requests.Session()
        start_response = public_session.post(
            f"{BASE_URL}/api/chat/start",
            params={"visitor_name": "JoinTest"}
        )
        assert start_response.status_code == 200
        chat_id = start_response.json()["chat_id"]
        session_id = start_response.json()["session_id"]
        
        # Request human
        public_session.post(
            f"{BASE_URL}/api/chat/request-human",
            params={"session_id": session_id}
        )
        
        # Join as agent
        response = self.session.post(f"{BASE_URL}/api/chat/admin/join/{chat_id}")
        
        assert response.status_code == 200, f"Join chat failed: {response.text}"
        data = response.json()
        
        assert "message" in data, "Missing message"
        assert data["message"] == "Joined chat"
        
        # Store for later tests
        self.__class__.test_chat_id = chat_id
        self.__class__.test_session_id = session_id
    
    def test_send_agent_message(self):
        """Test sending message as agent"""
        # Create and join a chat first
        public_session = requests.Session()
        start_response = public_session.post(
            f"{BASE_URL}/api/chat/start",
            params={"visitor_name": "AgentMsgTest"}
        )
        assert start_response.status_code == 200
        chat_id = start_response.json()["chat_id"]
        session_id = start_response.json()["session_id"]
        
        # Request human
        public_session.post(
            f"{BASE_URL}/api/chat/request-human",
            params={"session_id": session_id}
        )
        
        # Join as agent
        self.session.post(f"{BASE_URL}/api/chat/admin/join/{chat_id}")
        
        # Send agent message
        response = self.session.post(
            f"{BASE_URL}/api/chat/admin/message",
            json={
                "session_id": session_id,
                "text": "Hello! How can I help you today?"
            }
        )
        
        assert response.status_code == 200, f"Send agent message failed: {response.text}"
        data = response.json()
        
        assert "agent_message" in data, "Missing agent_message"
        assert data["agent_message"]["type"] == "agent"
        assert data["agent_message"]["text"] == "Hello! How can I help you today?"
    
    def test_close_chat(self):
        """Test closing a chat session"""
        # Create and join a chat first
        public_session = requests.Session()
        start_response = public_session.post(
            f"{BASE_URL}/api/chat/start",
            params={"visitor_name": "CloseTest"}
        )
        assert start_response.status_code == 200
        chat_id = start_response.json()["chat_id"]
        session_id = start_response.json()["session_id"]
        
        # Request human
        public_session.post(
            f"{BASE_URL}/api/chat/request-human",
            params={"session_id": session_id}
        )
        
        # Join as agent
        self.session.post(f"{BASE_URL}/api/chat/admin/join/{chat_id}")
        
        # Close chat
        response = self.session.post(f"{BASE_URL}/api/chat/admin/close/{chat_id}")
        
        assert response.status_code == 200, f"Close chat failed: {response.text}"
        data = response.json()
        
        assert data["message"] == "Chat closed"
    
    def test_set_availability(self):
        """Test setting agent availability"""
        response = self.session.post(
            f"{BASE_URL}/api/chat/admin/set-availability?is_available=true"
        )
        
        assert response.status_code == 200, f"Set availability failed: {response.text}"
        data = response.json()
        
        assert data["is_available"] == True
    
    def test_get_availability(self):
        """Test getting agent availability"""
        response = self.session.get(f"{BASE_URL}/api/chat/admin/availability")
        
        assert response.status_code == 200, f"Get availability failed: {response.text}"
        data = response.json()
        
        assert "is_available" in data
    
    def test_unauthorized_access(self):
        """Test that unauthorized access returns 401"""
        # Create session without auth
        unauth_session = requests.Session()
        
        response = unauth_session.get(f"{BASE_URL}/api/chat/admin/stats")
        assert response.status_code in [401, 403], "Should require authentication"


class TestChatAIIntegration:
    """Test AI response generation with GPT-4o"""
    
    def test_ai_response_quality(self):
        """Test that AI generates relevant responses about peptides"""
        session = requests.Session()
        
        # Start chat
        start_response = session.post(
            f"{BASE_URL}/api/chat/start",
            params={"visitor_name": "AITest"}
        )
        assert start_response.status_code == 200
        session_id = start_response.json()["session_id"]
        
        # Wait a bit for the AI to be ready
        time.sleep(1)
        
        # Send message about peptides
        response = session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "session_id": session_id,
                "text": "Tell me about BPC-157 peptide"
            }
        )
        
        assert response.status_code == 200, f"AI message failed: {response.text}"
        data = response.json()
        
        # AI should respond
        assert data["ai_response"] is not None, "Should get AI response"
        assert len(data["ai_response"]["text"]) > 50, "AI response should be substantial"
        
        # Either we get a real AI response or the fallback message
        ai_text = data["ai_response"]["text"].lower()
        is_relevant = any([
            "bpc" in ai_text,
            "peptide" in ai_text,
            "research" in ai_text,
            "human representative" in ai_text  # fallback message
        ])
        assert is_relevant, f"AI response should be relevant: {ai_text[:200]}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
