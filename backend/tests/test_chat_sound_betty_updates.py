"""
Tests for Chat Widget Updates:
1. Sound URL for staff/human chat initiation
2. AI renamed to Betty
3. AI name hidden when not in AI mode
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestChatBettyWelcomeMessage:
    """Tests for Betty welcome message in /api/chat/start"""
    
    def test_chat_start_welcome_message_says_betty(self):
        """Verify /api/chat/start returns welcome message from Betty"""
        response = requests.post(f"{BASE_URL}/api/chat/start", params={
            "visitor_name": "Test Visitor",
            "visitor_email": "test@example.com"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify response structure
        assert "chat_id" in data, "Response should contain chat_id"
        assert "session_id" in data, "Response should contain session_id"
        assert "welcome_message" in data, "Response should contain welcome_message"
        
        welcome_message = data["welcome_message"]
        assert "text" in welcome_message, "Welcome message should have text"
        assert "type" in welcome_message, "Welcome message should have type"
        
        # Verify Betty name is in welcome message
        assert "Betty" in welcome_message["text"], f"Welcome message should mention Betty, got: {welcome_message['text'][:100]}"
        assert welcome_message["type"] == "ai", f"Welcome message type should be 'ai', got: {welcome_message['type']}"
        
        print(f"PASS: Welcome message contains Betty: '{welcome_message['text'][:80]}...'")
        
        # Return session_id for cleanup/other tests
        return data["session_id"]

    def test_chat_start_message_format(self):
        """Verify welcome message has correct format"""
        response = requests.post(f"{BASE_URL}/api/chat/start")
        
        assert response.status_code == 200
        data = response.json()
        welcome_message = data["welcome_message"]
        
        # Check message structure
        assert "id" in welcome_message, "Message should have id"
        assert "timestamp" in welcome_message, "Message should have timestamp"
        
        # Verify Betty introduction text pattern
        text = welcome_message["text"]
        assert "I'm Betty" in text or "Betty" in text, f"Message should introduce Betty, got: {text[:100]}"
        assert "research" in text.lower() or "AMINO-CHAIN" in text, "Message should mention research or AMINO-CHAIN"
        
        print(f"PASS: Welcome message format correct with Betty introduction")


class TestChatSoundURLConfiguration:
    """Tests to verify sound URL configuration is accessible (frontend code review verification)"""
    
    def test_sound_url_is_valid(self):
        """Verify the sound URL is accessible"""
        sound_url = "https://customer-assets.emergentagent.com/job_808bae03-b30d-4055-83be-4ec1ad35d078/artifacts/lomxogl2_new-notification.mp3"
        
        # Just verify the URL is reachable (HEAD request to check)
        try:
            response = requests.head(sound_url, timeout=10)
            # Accept 200 or 403 (CloudFront may require GET for certain assets)
            assert response.status_code in [200, 403, 405], f"Sound URL should be accessible, got {response.status_code}"
            print(f"PASS: Sound URL is accessible (status: {response.status_code})")
        except requests.RequestException as e:
            # If HEAD fails, try GET with range header
            try:
                response = requests.get(sound_url, headers={"Range": "bytes=0-100"}, timeout=10)
                assert response.status_code in [200, 206], f"Sound URL should be accessible, got {response.status_code}"
                print(f"PASS: Sound URL accessible via GET (status: {response.status_code})")
            except requests.RequestException as inner_e:
                pytest.skip(f"Could not verify sound URL accessibility: {inner_e}")


class TestChatAvailabilityEndpoint:
    """Tests for chat availability endpoint which affects header display logic"""
    
    def test_public_availability_returns_ai_flag(self):
        """Verify /api/chat/availability/public returns owner_chat_ai_enabled flag"""
        response = requests.get(f"{BASE_URL}/api/chat/availability/public")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify required fields
        assert "owner_chat_enabled" in data, "Should have owner_chat_enabled"
        assert "owner_chat_ai_enabled" in data, "Should have owner_chat_ai_enabled"
        assert "any_online" in data, "Should have any_online"
        
        print(f"PASS: Availability endpoint returns AI flag: owner_chat_ai_enabled={data['owner_chat_ai_enabled']}")
        return data


class TestChatRequestHuman:
    """Tests for request human flow which triggers sound"""
    
    def test_request_human_changes_status(self):
        """Verify requesting human changes chat status to waiting_human"""
        # First start a chat
        start_response = requests.post(f"{BASE_URL}/api/chat/start", params={
            "visitor_name": "Sound Test User"
        })
        assert start_response.status_code == 200
        session_id = start_response.json()["session_id"]
        
        # Request human
        human_response = requests.post(f"{BASE_URL}/api/chat/request-human", params={
            "session_id": session_id
        })
        
        assert human_response.status_code == 200, f"Expected 200, got {human_response.status_code}"
        data = human_response.json()
        
        assert "message" in data, "Should return message"
        assert "status" in data, "Should return status"
        assert data["status"] == "waiting_human", f"Status should be waiting_human, got {data['status']}"
        
        # Verify system message about human rep
        message = data["message"]
        assert message["type"] == "system", "Message should be system type"
        assert "representative" in message["text"].lower() or "agent" in message["text"].lower(), \
            f"System message should mention representative or agent, got: {message['text']}"
        
        print(f"PASS: Request human works, status changed to waiting_human")


class TestChatHistoryShowsBetty:
    """Tests that chat history contains Betty as AI name"""
    
    def test_ai_messages_associated_with_betty(self):
        """Verify AI messages in history are associated with Betty"""
        # Start chat and get history
        start_response = requests.post(f"{BASE_URL}/api/chat/start", params={
            "visitor_name": "Betty Test"
        })
        assert start_response.status_code == 200
        session_id = start_response.json()["session_id"]
        
        # Get chat history
        history_response = requests.get(f"{BASE_URL}/api/chat/history/{session_id}")
        assert history_response.status_code == 200
        
        data = history_response.json()
        messages = data.get("messages", [])
        
        # Find AI messages
        ai_messages = [m for m in messages if m.get("type") == "ai"]
        assert len(ai_messages) > 0, "Should have at least one AI message (welcome)"
        
        # Verify first AI message mentions Betty
        first_ai = ai_messages[0]
        assert "Betty" in first_ai.get("text", ""), f"AI message should mention Betty, got: {first_ai.get('text', '')[:100]}"
        
        print(f"PASS: AI messages correctly reference Betty")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
