"""
Test Quote Flow Config Feature
- GET /api/quotes/flow-config - Get flow configuration
- PUT /api/quotes/flow-config - Update flow configuration
- POST /api/quotes/flow-config/reset - Reset to default flow configuration
- Flow rules affect backend behavior (send email, public sign, status transitions, lock/unlock, convert to invoice)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bot-admin-hub-4.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "qa-admin-a2g@example.com"
ADMIN_PASSWORD = "TestPass123!"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get authorization headers"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestQuoteFlowConfig:
    """Quote Flow Config API Tests"""
    
    # ==================== GET /api/quotes/flow-config ====================
    def test_get_flow_config_returns_200(self, auth_headers):
        """GET /api/quotes/flow-config returns 200 with config object"""
        response = requests.get(f"{BASE_URL}/api/quotes/flow-config", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "config" in data, "Response should contain 'config' key"
    
    def test_get_flow_config_has_all_fields(self, auth_headers):
        """GET /api/quotes/flow-config returns all expected flow config fields"""
        response = requests.get(f"{BASE_URL}/api/quotes/flow-config", headers=auth_headers)
        assert response.status_code == 200
        
        config = response.json().get("config", {})
        
        # Check all expected fields exist
        expected_fields = [
            "start_status",
            "allow_save_draft",
            "allow_send_email",
            "status_on_send",
            "allow_public_sign",
            "require_all_documents_signature",
            "status_on_sign",
            "lock_quote_on_sign",
            "allow_unlock_after_sign",
            "allow_convert_to_invoice",
            "auto_send_sign_confirmation_email"
        ]
        
        for field in expected_fields:
            assert field in config, f"Config should contain '{field}' field"
    
    # ==================== PUT /api/quotes/flow-config ====================
    def test_update_flow_config_start_status_draft(self, auth_headers):
        """PUT /api/quotes/flow-config updates start_status to draft"""
        payload = {
            "start_status": "draft",
            "allow_save_draft": True,
            "allow_send_email": True,
            "status_on_send": "sent",
            "allow_public_sign": True,
            "require_all_documents_signature": True,
            "status_on_sign": "signed",
            "lock_quote_on_sign": True,
            "allow_unlock_after_sign": True,
            "allow_convert_to_invoice": True,
            "auto_send_sign_confirmation_email": True
        }
        
        response = requests.put(f"{BASE_URL}/api/quotes/flow-config", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        config = response.json().get("config", {})
        assert config.get("start_status") == "draft"
    
    def test_update_flow_config_start_status_sent(self, auth_headers):
        """PUT /api/quotes/flow-config updates start_status to sent"""
        payload = {
            "start_status": "sent",
            "allow_save_draft": True,
            "allow_send_email": True,
            "status_on_send": "sent",
            "allow_public_sign": True,
            "require_all_documents_signature": True,
            "status_on_sign": "signed",
            "lock_quote_on_sign": True,
            "allow_unlock_after_sign": True,
            "allow_convert_to_invoice": True,
            "auto_send_sign_confirmation_email": True
        }
        
        response = requests.put(f"{BASE_URL}/api/quotes/flow-config", json=payload, headers=auth_headers)
        assert response.status_code == 200
        
        config = response.json().get("config", {})
        assert config.get("start_status") == "sent"
    
    def test_update_flow_config_invalid_start_status(self, auth_headers):
        """PUT /api/quotes/flow-config rejects invalid start_status"""
        payload = {
            "start_status": "invalid_status",
            "allow_save_draft": True,
            "allow_send_email": True,
            "status_on_send": "sent",
            "allow_public_sign": True,
            "require_all_documents_signature": True,
            "status_on_sign": "signed",
            "lock_quote_on_sign": True,
            "allow_unlock_after_sign": True,
            "allow_convert_to_invoice": True,
            "auto_send_sign_confirmation_email": True
        }
        
        response = requests.put(f"{BASE_URL}/api/quotes/flow-config", json=payload, headers=auth_headers)
        assert response.status_code == 400, f"Expected 400 for invalid start_status, got {response.status_code}"
    
    def test_update_flow_config_status_on_send_options(self, auth_headers):
        """PUT /api/quotes/flow-config accepts valid status_on_send values"""
        valid_values = ["sent", "draft", "none"]
        
        for value in valid_values:
            payload = {
                "start_status": "draft",
                "allow_save_draft": True,
                "allow_send_email": True,
                "status_on_send": value,
                "allow_public_sign": True,
                "require_all_documents_signature": True,
                "status_on_sign": "signed",
                "lock_quote_on_sign": True,
                "allow_unlock_after_sign": True,
                "allow_convert_to_invoice": True,
                "auto_send_sign_confirmation_email": True
            }
            
            response = requests.put(f"{BASE_URL}/api/quotes/flow-config", json=payload, headers=auth_headers)
            assert response.status_code == 200, f"Expected 200 for status_on_send={value}, got {response.status_code}"
            
            config = response.json().get("config", {})
            assert config.get("status_on_send") == value
    
    def test_update_flow_config_invalid_status_on_send(self, auth_headers):
        """PUT /api/quotes/flow-config rejects invalid status_on_send"""
        payload = {
            "start_status": "draft",
            "allow_save_draft": True,
            "allow_send_email": True,
            "status_on_send": "invalid",
            "allow_public_sign": True,
            "require_all_documents_signature": True,
            "status_on_sign": "signed",
            "lock_quote_on_sign": True,
            "allow_unlock_after_sign": True,
            "allow_convert_to_invoice": True,
            "auto_send_sign_confirmation_email": True
        }
        
        response = requests.put(f"{BASE_URL}/api/quotes/flow-config", json=payload, headers=auth_headers)
        assert response.status_code == 400, f"Expected 400 for invalid status_on_send, got {response.status_code}"
    
    def test_update_flow_config_status_on_sign_options(self, auth_headers):
        """PUT /api/quotes/flow-config accepts valid status_on_sign values"""
        valid_values = ["signed", "sent", "none"]
        
        for value in valid_values:
            payload = {
                "start_status": "draft",
                "allow_save_draft": True,
                "allow_send_email": True,
                "status_on_send": "sent",
                "allow_public_sign": True,
                "require_all_documents_signature": True,
                "status_on_sign": value,
                "lock_quote_on_sign": True,
                "allow_unlock_after_sign": True,
                "allow_convert_to_invoice": True,
                "auto_send_sign_confirmation_email": True
            }
            
            response = requests.put(f"{BASE_URL}/api/quotes/flow-config", json=payload, headers=auth_headers)
            assert response.status_code == 200, f"Expected 200 for status_on_sign={value}, got {response.status_code}"
            
            config = response.json().get("config", {})
            assert config.get("status_on_sign") == value
    
    def test_update_flow_config_invalid_status_on_sign(self, auth_headers):
        """PUT /api/quotes/flow-config rejects invalid status_on_sign"""
        payload = {
            "start_status": "draft",
            "allow_save_draft": True,
            "allow_send_email": True,
            "status_on_send": "sent",
            "allow_public_sign": True,
            "require_all_documents_signature": True,
            "status_on_sign": "invalid",
            "lock_quote_on_sign": True,
            "allow_unlock_after_sign": True,
            "allow_convert_to_invoice": True,
            "auto_send_sign_confirmation_email": True
        }
        
        response = requests.put(f"{BASE_URL}/api/quotes/flow-config", json=payload, headers=auth_headers)
        assert response.status_code == 400, f"Expected 400 for invalid status_on_sign, got {response.status_code}"
    
    def test_update_flow_config_boolean_fields(self, auth_headers):
        """PUT /api/quotes/flow-config updates boolean fields correctly"""
        # Test with all booleans set to False
        payload = {
            "start_status": "draft",
            "allow_save_draft": False,
            "allow_send_email": False,
            "status_on_send": "sent",
            "allow_public_sign": False,
            "require_all_documents_signature": False,
            "status_on_sign": "signed",
            "lock_quote_on_sign": False,
            "allow_unlock_after_sign": False,
            "allow_convert_to_invoice": False,
            "auto_send_sign_confirmation_email": False
        }
        
        response = requests.put(f"{BASE_URL}/api/quotes/flow-config", json=payload, headers=auth_headers)
        assert response.status_code == 200
        
        config = response.json().get("config", {})
        assert config.get("allow_save_draft") == False
        assert config.get("allow_send_email") == False
        assert config.get("allow_public_sign") == False
        assert config.get("require_all_documents_signature") == False
        assert config.get("lock_quote_on_sign") == False
        assert config.get("allow_unlock_after_sign") == False
        assert config.get("allow_convert_to_invoice") == False
        assert config.get("auto_send_sign_confirmation_email") == False
    
    # ==================== POST /api/quotes/flow-config/reset ====================
    def test_reset_flow_config_returns_200(self, auth_headers):
        """POST /api/quotes/flow-config/reset returns 200"""
        response = requests.post(f"{BASE_URL}/api/quotes/flow-config/reset", json={}, headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_reset_flow_config_restores_defaults(self, auth_headers):
        """POST /api/quotes/flow-config/reset restores default values"""
        # First, modify the config
        modified_payload = {
            "start_status": "sent",
            "allow_save_draft": False,
            "allow_send_email": False,
            "status_on_send": "draft",
            "allow_public_sign": False,
            "require_all_documents_signature": False,
            "status_on_sign": "sent",
            "lock_quote_on_sign": False,
            "allow_unlock_after_sign": False,
            "allow_convert_to_invoice": False,
            "auto_send_sign_confirmation_email": False
        }
        
        requests.put(f"{BASE_URL}/api/quotes/flow-config", json=modified_payload, headers=auth_headers)
        
        # Now reset
        reset_response = requests.post(f"{BASE_URL}/api/quotes/flow-config/reset", json={}, headers=auth_headers)
        assert reset_response.status_code == 200
        
        config = reset_response.json().get("config", {})
        
        # Verify defaults are restored
        assert config.get("start_status") == "draft"
        assert config.get("allow_save_draft") == True
        assert config.get("allow_send_email") == True
        assert config.get("status_on_send") == "sent"
        assert config.get("allow_public_sign") == True
        assert config.get("require_all_documents_signature") == True
        assert config.get("status_on_sign") == "signed"
        assert config.get("lock_quote_on_sign") == True
        assert config.get("allow_unlock_after_sign") == True
        assert config.get("allow_convert_to_invoice") == True
        assert config.get("auto_send_sign_confirmation_email") == True
    
    def test_reset_flow_config_returns_message(self, auth_headers):
        """POST /api/quotes/flow-config/reset returns success message"""
        response = requests.post(f"{BASE_URL}/api/quotes/flow-config/reset", json={}, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data or "config" in data, "Response should contain message or config"
    
    # ==================== Verify GET after reset ====================
    def test_get_flow_config_after_reset(self, auth_headers):
        """GET /api/quotes/flow-config returns defaults after reset"""
        # Reset first
        requests.post(f"{BASE_URL}/api/quotes/flow-config/reset", json={}, headers=auth_headers)
        
        # Then GET
        response = requests.get(f"{BASE_URL}/api/quotes/flow-config", headers=auth_headers)
        assert response.status_code == 200
        
        config = response.json().get("config", {})
        
        # Verify defaults
        assert config.get("start_status") == "draft"
        assert config.get("allow_save_draft") == True
        assert config.get("allow_send_email") == True


class TestQuoteFlowConfigUnauthorized:
    """Test flow config endpoints require authentication"""
    
    def test_get_flow_config_requires_auth(self):
        """GET /api/quotes/flow-config requires authentication"""
        response = requests.get(f"{BASE_URL}/api/quotes/flow-config")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_put_flow_config_requires_auth(self):
        """PUT /api/quotes/flow-config requires authentication"""
        payload = {"start_status": "draft"}
        response = requests.put(f"{BASE_URL}/api/quotes/flow-config", json=payload)
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_reset_flow_config_requires_auth(self):
        """POST /api/quotes/flow-config/reset requires authentication"""
        response = requests.post(f"{BASE_URL}/api/quotes/flow-config/reset", json={})
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
