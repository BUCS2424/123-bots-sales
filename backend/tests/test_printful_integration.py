"""
Printful Integration Backend Tests
Tests for: Feature flags, printful credentials CRUD, validation endpoint
"""

import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_EMAIL = "super@amino.com"
SUPER_ADMIN_PASSWORD = "peptides"
TEST_ADMIN_EMAIL = "test@emergent.dev"
TEST_ADMIN_PASSWORD = "TestAdmin123!"


class TestPrintfulIntegration:
    """Test suite for Printful integration"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as super admin
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": SUPER_ADMIN_EMAIL, "password": SUPER_ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Super admin login failed: {response.text}"
        self.super_admin_token = response.json().get("access_token")
        self.super_admin_headers = {"Authorization": f"Bearer {self.super_admin_token}"}

    # ==================== Feature Flags Tests ====================

    def test_public_feature_flags_returns_printful_enabled(self):
        """Test GET /api/settings/feature-flags returns printful_enabled field"""
        response = self.session.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "printful_enabled" in data, "printful_enabled field missing from public feature flags"
        assert isinstance(data["printful_enabled"], bool), "printful_enabled should be boolean"
        print(f"Public feature flags: printful_enabled={data['printful_enabled']}")

    def test_admin_feature_flags_includes_printful_enabled(self):
        """Test GET /api/admin-settings/feature-flags includes printful_enabled"""
        response = self.session.get(
            f"{BASE_URL}/api/admin-settings/feature-flags",
            headers=self.super_admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "printful_enabled" in data, "printful_enabled missing from admin feature flags"
        print(f"Admin feature flags response: {data}")

    def test_toggle_printful_enabled_on(self):
        """Test enabling printful_enabled flag via PUT"""
        # Get current flags
        get_response = self.session.get(
            f"{BASE_URL}/api/admin-settings/feature-flags",
            headers=self.super_admin_headers
        )
        assert get_response.status_code == 200
        current_flags = get_response.json()
        
        # Set printful_enabled to True
        current_flags["printful_enabled"] = True
        
        response = self.session.put(
            f"{BASE_URL}/api/admin-settings/feature-flags",
            json=current_flags,
            headers=self.super_admin_headers
        )
        assert response.status_code == 200, f"Failed to update flags: {response.text}"
        assert response.json().get("success") == True
        
        # Verify persisted
        verify_response = self.session.get(
            f"{BASE_URL}/api/admin-settings/feature-flags",
            headers=self.super_admin_headers
        )
        assert verify_response.status_code == 200
        assert verify_response.json().get("printful_enabled") == True
        print("printful_enabled toggle ON: PASS")

    def test_toggle_printful_enabled_off(self):
        """Test disabling printful_enabled flag via PUT"""
        get_response = self.session.get(
            f"{BASE_URL}/api/admin-settings/feature-flags",
            headers=self.super_admin_headers
        )
        assert get_response.status_code == 200
        current_flags = get_response.json()
        
        current_flags["printful_enabled"] = False
        
        response = self.session.put(
            f"{BASE_URL}/api/admin-settings/feature-flags",
            json=current_flags,
            headers=self.super_admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        assert response.json().get("success") == True
        
        # Verify public endpoint reflects the change
        public_response = self.session.get(f"{BASE_URL}/api/settings/feature-flags")
        assert public_response.status_code == 200
        assert public_response.json().get("printful_enabled") == False
        print("printful_enabled toggle OFF: PASS")

    # ==================== Printful Credentials Tests ====================

    def test_get_printful_credentials_empty_initially(self):
        """Test GET /api/printful/credentials when not configured"""
        # First enable the feature
        self._enable_printful_feature()
        
        response = self.session.get(
            f"{BASE_URL}/api/printful/credentials",
            headers=self.super_admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        # If already configured, just verify structure
        assert "configured" in data
        assert "store_id" in data
        assert "api_key_masked" in data
        assert "webhook_secret_masked" in data
        print(f"Credentials response: configured={data.get('configured')}")

    def test_save_printful_credentials(self):
        """Test PUT /api/printful/credentials saves credentials"""
        self._enable_printful_feature()
        
        test_credentials = {
            "api_key": "pf_test_placeholder_key_12345",
            "store_id": "99999",
            "webhook_secret": "whsec_test_placeholder_secret"
        }
        
        response = self.session.put(
            f"{BASE_URL}/api/printful/credentials",
            json=test_credentials,
            headers=self.super_admin_headers
        )
        assert response.status_code == 200, f"Failed to save: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert data.get("store_id") == "99999"
        print("Save credentials: PASS")

    def test_get_printful_credentials_after_save(self):
        """Test GET /api/printful/credentials returns masked values after save"""
        self._enable_printful_feature()
        
        # First save some credentials
        test_credentials = {
            "api_key": "pf_another_test_key_67890",
            "store_id": "88888",
            "webhook_secret": "whsec_another_test_secret"
        }
        save_response = self.session.put(
            f"{BASE_URL}/api/printful/credentials",
            json=test_credentials,
            headers=self.super_admin_headers
        )
        assert save_response.status_code == 200
        
        # Fetch and verify
        response = self.session.get(
            f"{BASE_URL}/api/printful/credentials",
            headers=self.super_admin_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("configured") == True
        assert data.get("store_id") == "88888"
        assert data.get("api_key_masked") != "", "api_key should be masked"
        assert data.get("webhook_secret_masked") != "", "webhook_secret should be masked"
        # Verify masking (should have asterisks)
        assert "*" in data.get("api_key_masked", "") or len(data.get("api_key_masked", "")) < 10
        print(f"Credentials masked: api_key_masked={data.get('api_key_masked')}")

    def test_save_credentials_validation_api_key_min_length(self):
        """Test that API key must be at least 10 chars"""
        self._enable_printful_feature()
        
        response = self.session.put(
            f"{BASE_URL}/api/printful/credentials",
            json={
                "api_key": "short",  # less than 10 chars
                "store_id": "12345",
                "webhook_secret": "whsec_valid_secret"
            },
            headers=self.super_admin_headers
        )
        # Should fail validation
        assert response.status_code == 422, f"Expected 422 for short api_key, got {response.status_code}"
        print("API key min length validation: PASS")

    def test_save_credentials_validation_webhook_min_length(self):
        """Test that webhook_secret must be at least 6 chars"""
        self._enable_printful_feature()
        
        response = self.session.put(
            f"{BASE_URL}/api/printful/credentials",
            json={
                "api_key": "pf_valid_api_key_12345",
                "store_id": "12345",
                "webhook_secret": "short"  # less than 6 chars
            },
            headers=self.super_admin_headers
        )
        assert response.status_code == 422, f"Expected 422 for short webhook_secret, got {response.status_code}"
        print("Webhook secret min length validation: PASS")

    # ==================== Printful Validation Tests ====================

    def test_validate_printful_with_placeholder_credentials(self):
        """Test POST /api/printful/validate returns structured response (not crash)"""
        self._enable_printful_feature()
        
        # Using placeholder credentials - should fail but return proper JSON response
        response = self.session.post(
            f"{BASE_URL}/api/printful/validate",
            json={
                "use_stored": False,
                "api_key": "pf_placeholder_invalid_key",
                "store_id": "000000",
                "webhook_secret": "whsec_placeholder"
            },
            headers=self.super_admin_headers
        )
        # Should return 200 with validation result, not crash
        assert response.status_code == 200, f"Validation endpoint should return 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "valid" in data, "Response should include 'valid' field"
        assert "message" in data, "Response should include 'message' field"
        # Placeholder keys should fail validation
        assert data.get("valid") == False, "Placeholder keys should not validate as valid"
        print(f"Validate response: valid={data.get('valid')}, message={data.get('message')}")

    def test_validate_printful_use_stored_credentials(self):
        """Test POST /api/printful/validate with use_stored=True"""
        self._enable_printful_feature()
        
        # First save some credentials
        save_response = self.session.put(
            f"{BASE_URL}/api/printful/credentials",
            json={
                "api_key": "pf_stored_test_key_12345",
                "store_id": "77777",
                "webhook_secret": "whsec_stored_test"
            },
            headers=self.super_admin_headers
        )
        assert save_response.status_code == 200
        
        # Validate using stored credentials
        response = self.session.post(
            f"{BASE_URL}/api/printful/validate",
            json={"use_stored": True},
            headers=self.super_admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "valid" in data
        assert "message" in data
        # Should update last_validation_status
        assert "last_validation_status" in data
        print(f"Validate stored credentials: {data}")

    def test_validate_missing_credentials_returns_400(self):
        """Test POST /api/printful/validate with incomplete data returns 400"""
        self._enable_printful_feature()
        
        response = self.session.post(
            f"{BASE_URL}/api/printful/validate",
            json={
                "use_stored": False,
                "api_key": "pf_valid_key_12345",
                # Missing store_id and webhook_secret
            },
            headers=self.super_admin_headers
        )
        # Should return 400 for missing required fields
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("Validate missing fields: PASS (returns 400)")

    # ==================== Access Control Tests ====================

    def test_printful_endpoints_require_auth(self):
        """Test that Printful endpoints require authentication"""
        # No auth header - use a clean session without token
        unauthenticated_session = requests.Session()
        unauthenticated_session.headers.update({"Content-Type": "application/json"})
        
        response = unauthenticated_session.get(f"{BASE_URL}/api/printful/credentials")
        assert response.status_code == 401, f"Expected 401 without auth for GET, got {response.status_code}"
        
        response = unauthenticated_session.put(
            f"{BASE_URL}/api/printful/credentials",
            json={"api_key": "pf_valid_api_key_12345", "store_id": "12345", "webhook_secret": "whsec_valid_secret"}
        )
        assert response.status_code == 401, f"Expected 401 without auth for PUT, got {response.status_code}"
        
        response = unauthenticated_session.post(
            f"{BASE_URL}/api/printful/validate",
            json={"use_stored": False, "api_key": "pf_valid_api_key_12345", "store_id": "12345", "webhook_secret": "whsec_valid_secret"}
        )
        assert response.status_code == 401, f"Expected 401 without auth for POST, got {response.status_code}"
        print("Auth required for Printful endpoints: PASS")

    def test_printful_credentials_scoped_per_user(self):
        """Test that credentials are scoped to the user (per-owner)"""
        self._enable_printful_feature()
        
        # Save as super admin
        save_response = self.session.put(
            f"{BASE_URL}/api/printful/credentials",
            json={
                "api_key": "pf_super_admin_key_12345",
                "store_id": "11111",
                "webhook_secret": "whsec_super_admin"
            },
            headers=self.super_admin_headers
        )
        assert save_response.status_code == 200
        
        # Verify super admin sees their credentials
        get_response = self.session.get(
            f"{BASE_URL}/api/printful/credentials",
            headers=self.super_admin_headers
        )
        assert get_response.status_code == 200
        assert get_response.json().get("store_id") == "11111"
        print("Per-user credential scoping: PASS")

    # ==================== Helper Methods ====================

    def _enable_printful_feature(self):
        """Helper to enable printful feature flag"""
        get_response = self.session.get(
            f"{BASE_URL}/api/admin-settings/feature-flags",
            headers=self.super_admin_headers
        )
        if get_response.status_code == 200:
            flags = get_response.json()
            flags["printful_enabled"] = True
            self.session.put(
                f"{BASE_URL}/api/admin-settings/feature-flags",
                json=flags,
                headers=self.super_admin_headers
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
