"""
Test Suite: Owner Chat Feature Flags
Tests: owner_chat_enabled, owner_chat_ai_enabled toggles
- Dev Feature Flags includes both toggles with default OFF
- PUT/GET /api/admin-settings/feature-flags persists both new flags  
- GET /api/settings/feature-flags returns both flags
- Admin chat endpoints gated by owner_chat_enabled
- Chat AI message returns disabled response when owner_chat_ai_enabled is OFF
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "test@emergent.dev"
ADMIN_PASSWORD = "TestAdmin123!"
SUPER_ADMIN_EMAIL = "super@amino.com"
SUPER_ADMIN_PASSWORD = "peptides"


class TestOwnerChatFeatureFlags:
    """Tests for owner_chat_enabled and owner_chat_ai_enabled feature flags"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session and get admin token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Try admin login first
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if login_response.status_code == 200:
            self.token = login_response.json().get("access_token")
        else:
            # Try super admin
            login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": SUPER_ADMIN_EMAIL,
                "password": SUPER_ADMIN_PASSWORD
            })
            if login_response.status_code == 200:
                self.token = login_response.json().get("access_token")
            else:
                pytest.skip("Could not authenticate - skipping tests")
        
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        yield
        
        # Cleanup: restore original flag state (both OFF by default)
        try:
            # Get current flags first
            current_flags_response = self.session.get(f"{BASE_URL}/api/admin-settings/feature-flags")
            if current_flags_response.status_code == 200:
                current_flags = current_flags_response.json()
                # Reset only our test flags to OFF
                current_flags["owner_chat_enabled"] = False
                current_flags["owner_chat_ai_enabled"] = False
                self.session.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=current_flags)
        except:
            pass

    # ========== Feature Flags API Tests ==========

    def test_get_feature_flags_includes_owner_chat_flags(self):
        """GET /api/admin-settings/feature-flags returns owner_chat_enabled and owner_chat_ai_enabled"""
        response = self.session.get(f"{BASE_URL}/api/admin-settings/feature-flags")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Both flags should exist in response
        assert "owner_chat_enabled" in data, "owner_chat_enabled flag missing from response"
        assert "owner_chat_ai_enabled" in data, "owner_chat_ai_enabled flag missing from response"
        
        # Both should be boolean
        assert isinstance(data["owner_chat_enabled"], bool), "owner_chat_enabled should be boolean"
        assert isinstance(data["owner_chat_ai_enabled"], bool), "owner_chat_ai_enabled should be boolean"
        print(f"owner_chat_enabled: {data['owner_chat_enabled']}")
        print(f"owner_chat_ai_enabled: {data['owner_chat_ai_enabled']}")

    def test_put_feature_flags_owner_chat_enabled_on(self):
        """PUT /api/admin-settings/feature-flags can enable owner_chat_enabled"""
        # Get current flags to preserve others
        get_response = self.session.get(f"{BASE_URL}/api/admin-settings/feature-flags")
        assert get_response.status_code == 200
        current_flags = get_response.json()
        
        # Enable owner_chat_enabled
        current_flags["owner_chat_enabled"] = True
        
        response = self.session.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=current_flags)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify it persisted
        verify_response = self.session.get(f"{BASE_URL}/api/admin-settings/feature-flags")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data["owner_chat_enabled"] is True, "owner_chat_enabled should be True after update"
        print("owner_chat_enabled successfully set to True")

    def test_put_feature_flags_owner_chat_ai_enabled_on(self):
        """PUT /api/admin-settings/feature-flags can enable owner_chat_ai_enabled"""
        # Get current flags
        get_response = self.session.get(f"{BASE_URL}/api/admin-settings/feature-flags")
        assert get_response.status_code == 200
        current_flags = get_response.json()
        
        # Enable owner_chat_ai_enabled
        current_flags["owner_chat_ai_enabled"] = True
        
        response = self.session.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=current_flags)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify it persisted
        verify_response = self.session.get(f"{BASE_URL}/api/admin-settings/feature-flags")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data["owner_chat_ai_enabled"] is True, "owner_chat_ai_enabled should be True after update"
        print("owner_chat_ai_enabled successfully set to True")

    def test_put_feature_flags_both_toggles(self):
        """PUT /api/admin-settings/feature-flags can set both flags simultaneously"""
        # Get current flags
        get_response = self.session.get(f"{BASE_URL}/api/admin-settings/feature-flags")
        assert get_response.status_code == 200
        current_flags = get_response.json()
        
        # Enable both
        current_flags["owner_chat_enabled"] = True
        current_flags["owner_chat_ai_enabled"] = True
        
        response = self.session.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=current_flags)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify both persisted
        verify_response = self.session.get(f"{BASE_URL}/api/admin-settings/feature-flags")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data["owner_chat_enabled"] is True
        assert verify_data["owner_chat_ai_enabled"] is True
        print("Both flags successfully set to True")

    def test_public_feature_flags_endpoint(self):
        """GET /api/settings/feature-flags (public) returns owner_chat flags"""
        # Public endpoint - no auth needed
        public_session = requests.Session()
        response = public_session.get(f"{BASE_URL}/api/settings/feature-flags")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Both flags should be in public response
        assert "owner_chat_enabled" in data, "owner_chat_enabled missing from public endpoint"
        assert "owner_chat_ai_enabled" in data, "owner_chat_ai_enabled missing from public endpoint"
        print(f"Public flags - owner_chat_enabled: {data['owner_chat_enabled']}, owner_chat_ai_enabled: {data['owner_chat_ai_enabled']}")


class TestChatAdminGating:
    """Tests for chat admin endpoint gating based on owner_chat_enabled flag"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session and get admin token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Try admin login first
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if login_response.status_code == 200:
            self.token = login_response.json().get("access_token")
        else:
            # Try super admin
            login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": SUPER_ADMIN_EMAIL,
                "password": SUPER_ADMIN_PASSWORD
            })
            if login_response.status_code == 200:
                self.token = login_response.json().get("access_token")
            else:
                pytest.skip("Could not authenticate - skipping tests")
        
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        yield
        
        # Cleanup: reset flags
        try:
            get_response = self.session.get(f"{BASE_URL}/api/admin-settings/feature-flags")
            if get_response.status_code == 200:
                current_flags = get_response.json()
                current_flags["owner_chat_enabled"] = False
                current_flags["owner_chat_ai_enabled"] = False
                self.session.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=current_flags)
        except:
            pass

    def _set_feature_flags(self, owner_chat_enabled: bool, owner_chat_ai_enabled: bool):
        """Helper to set feature flag values"""
        get_response = self.session.get(f"{BASE_URL}/api/admin-settings/feature-flags")
        if get_response.status_code == 200:
            current_flags = get_response.json()
            current_flags["owner_chat_enabled"] = owner_chat_enabled
            current_flags["owner_chat_ai_enabled"] = owner_chat_ai_enabled
            self.session.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=current_flags)

    def test_chat_admin_dashboard_blocked_when_flag_off(self):
        """GET /api/chat/admin/dashboard returns 403 when owner_chat_enabled is OFF"""
        # Ensure flag is OFF
        self._set_feature_flags(owner_chat_enabled=False, owner_chat_ai_enabled=False)
        
        response = self.session.get(f"{BASE_URL}/api/chat/admin/dashboard")
        
        assert response.status_code == 403, f"Expected 403 when owner_chat_enabled is OFF, got {response.status_code}: {response.text}"
        print("Chat admin dashboard correctly blocked when owner_chat_enabled is OFF")

    def test_chat_admin_dashboard_allowed_when_flag_on(self):
        """GET /api/chat/admin/dashboard returns 200 when owner_chat_enabled is ON"""
        # Enable flag
        self._set_feature_flags(owner_chat_enabled=True, owner_chat_ai_enabled=False)
        
        response = self.session.get(f"{BASE_URL}/api/chat/admin/dashboard")
        
        assert response.status_code == 200, f"Expected 200 when owner_chat_enabled is ON, got {response.status_code}: {response.text}"
        print("Chat admin dashboard correctly accessible when owner_chat_enabled is ON")

    def test_chat_admin_stats_blocked_when_flag_off(self):
        """GET /api/chat/admin/stats returns 403 when owner_chat_enabled is OFF"""
        self._set_feature_flags(owner_chat_enabled=False, owner_chat_ai_enabled=False)
        
        response = self.session.get(f"{BASE_URL}/api/chat/admin/stats")
        
        assert response.status_code == 403, f"Expected 403 when flag is OFF, got {response.status_code}"
        print("Chat admin stats correctly blocked when owner_chat_enabled is OFF")

    def test_chat_admin_stats_allowed_when_flag_on(self):
        """GET /api/chat/admin/stats returns 200 when owner_chat_enabled is ON"""
        self._set_feature_flags(owner_chat_enabled=True, owner_chat_ai_enabled=False)
        
        response = self.session.get(f"{BASE_URL}/api/chat/admin/stats")
        
        assert response.status_code == 200, f"Expected 200 when flag is ON, got {response.status_code}"
        print("Chat admin stats correctly accessible when owner_chat_enabled is ON")


class TestChatAIGating:
    """Tests for chat AI response gating based on owner_chat_ai_enabled flag"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Get admin token for flag management
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if login_response.status_code == 200:
            self.token = login_response.json().get("access_token")
        else:
            login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": SUPER_ADMIN_EMAIL,
                "password": SUPER_ADMIN_PASSWORD
            })
            if login_response.status_code == 200:
                self.token = login_response.json().get("access_token")
            else:
                pytest.skip("Could not authenticate")
        
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        yield
        
        # Cleanup
        try:
            get_response = self.session.get(f"{BASE_URL}/api/admin-settings/feature-flags")
            if get_response.status_code == 200:
                current_flags = get_response.json()
                current_flags["owner_chat_enabled"] = False
                current_flags["owner_chat_ai_enabled"] = False
                self.session.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=current_flags)
        except:
            pass

    def _set_feature_flags(self, owner_chat_enabled: bool, owner_chat_ai_enabled: bool):
        """Helper to set feature flag values"""
        get_response = self.session.get(f"{BASE_URL}/api/admin-settings/feature-flags")
        if get_response.status_code == 200:
            current_flags = get_response.json()
            current_flags["owner_chat_enabled"] = owner_chat_enabled
            current_flags["owner_chat_ai_enabled"] = owner_chat_ai_enabled
            self.session.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=current_flags)

    def test_chat_ai_disabled_message_when_flag_off(self):
        """POST /api/chat/message returns disabled AI message when owner_chat_ai_enabled is OFF"""
        # Ensure AI flag is OFF
        self._set_feature_flags(owner_chat_enabled=True, owner_chat_ai_enabled=False)
        
        # Start a chat session (public endpoint)
        public_session = requests.Session()
        public_session.headers.update({"Content-Type": "application/json"})
        
        start_response = public_session.post(f"{BASE_URL}/api/chat/start")
        assert start_response.status_code == 200, f"Failed to start chat: {start_response.text}"
        
        chat_data = start_response.json()
        session_id = chat_data.get("session_id")
        
        # Send a message
        message_response = public_session.post(f"{BASE_URL}/api/chat/message", json={
            "text": "Hello, what products do you have?",
            "session_id": session_id
        })
        
        assert message_response.status_code == 200, f"Failed to send message: {message_response.text}"
        
        data = message_response.json()
        ai_response = data.get("ai_response", {})
        
        # AI response should indicate it's disabled
        assert ai_response is not None, "Expected ai_response in response"
        assert "disabled" in ai_response.get("text", "").lower() or "human" in ai_response.get("text", "").lower(), \
            f"Expected disabled AI message, got: {ai_response.get('text', '')}"
        print(f"AI response when disabled: {ai_response.get('text', '')[:100]}")

    def test_chat_ai_responds_when_flag_on(self):
        """POST /api/chat/message returns AI response when owner_chat_ai_enabled is ON"""
        # Enable AI flag
        self._set_feature_flags(owner_chat_enabled=True, owner_chat_ai_enabled=True)
        
        # Start a chat session (public endpoint)
        public_session = requests.Session()
        public_session.headers.update({"Content-Type": "application/json"})
        
        start_response = public_session.post(f"{BASE_URL}/api/chat/start")
        assert start_response.status_code == 200, f"Failed to start chat: {start_response.text}"
        
        chat_data = start_response.json()
        session_id = chat_data.get("session_id")
        
        # Send a message
        message_response = public_session.post(f"{BASE_URL}/api/chat/message", json={
            "text": "What is BPC-157?",
            "session_id": session_id
        })
        
        assert message_response.status_code == 200, f"Failed to send message: {message_response.text}"
        
        data = message_response.json()
        ai_response = data.get("ai_response", {})
        
        # AI response should NOT be the disabled message
        assert ai_response is not None, "Expected ai_response in response"
        response_text = ai_response.get("text", "").lower()
        
        # Should either give a real AI response or fallback (not the disabled message)
        is_disabled_msg = "ai chat is currently disabled" in response_text
        if is_disabled_msg:
            pytest.fail(f"AI should respond when enabled, but got disabled message: {ai_response.get('text', '')}")
        
        print(f"AI responded when enabled: {ai_response.get('text', '')[:150]}...")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
