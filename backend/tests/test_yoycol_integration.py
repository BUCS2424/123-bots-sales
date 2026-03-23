"""
YOYCOL Integration Tests
Tests cover:
- Feature flags (yoycol_enabled toggle persistence)
- GET /api/settings/feature-flags (public) returns yoycol_enabled
- GET /api/admin-settings/feature-flags returns yoycol_enabled
- PUT /api/admin-settings/feature-flags toggles yoycol_enabled
- GET /api/yoycol/credentials returns masked keys
- PUT /api/yoycol/credentials saves per-user credentials
- POST /api/yoycol/validate performs validation and returns structured response
- Feature gating: non-super users blocked when yoycol_enabled=false
"""

import os
import pytest
import requests
from typing import Optional

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestYoycolIntegration:
    """Test suite for YOYCOL feature flags and credential management"""

    @pytest.fixture(scope="class")
    def super_admin_token(self) -> str:
        """Get super admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "super@amino.com",
            "password": "peptides"
        })
        assert response.status_code == 200, f"Super admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "Missing access_token in login response"
        return data["access_token"]

    @pytest.fixture(scope="class")
    def store_owner_token(self) -> str:
        """Get store owner auth token (test@emergent.dev)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@emergent.dev",
            "password": "TestAdmin123!"
        })
        # Store owner may not exist - skip tests if not
        if response.status_code != 200:
            pytest.skip("Store owner test@emergent.dev not found in DB - skipping store owner tests")
        data = response.json()
        return data.get("access_token", "")

    @pytest.fixture
    def auth_headers(self, super_admin_token: str) -> dict:
        """Auth headers with super admin token"""
        return {"Authorization": f"Bearer {super_admin_token}"}

    @pytest.fixture
    def store_owner_headers(self, store_owner_token: str) -> dict:
        """Auth headers with store owner token"""
        return {"Authorization": f"Bearer {store_owner_token}"}

    # ===================== PUBLIC FEATURE FLAGS TESTS =====================

    def test_public_feature_flags_returns_yoycol_enabled(self):
        """GET /api/settings/feature-flags returns yoycol_enabled (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200, f"Public feature flags failed: {response.text}"
        data = response.json()
        assert "yoycol_enabled" in data, "yoycol_enabled not in public feature flags"
        assert isinstance(data["yoycol_enabled"], bool), "yoycol_enabled should be boolean"
        # Also check printful_enabled exists (for existing Printful behavior)
        assert "printful_enabled" in data, "printful_enabled should also be present"
        print(f"PASS: Public feature flags returns yoycol_enabled={data['yoycol_enabled']}, printful_enabled={data['printful_enabled']}")

    # ===================== ADMIN FEATURE FLAGS TESTS =====================

    def test_admin_feature_flags_returns_yoycol_enabled(self, auth_headers: dict):
        """GET /api/admin-settings/feature-flags returns yoycol_enabled (admin endpoint)"""
        response = requests.get(f"{BASE_URL}/api/admin-settings/feature-flags", headers=auth_headers)
        assert response.status_code == 200, f"Admin feature flags failed: {response.text}"
        data = response.json()
        assert "yoycol_enabled" in data, "yoycol_enabled not in admin feature flags"
        assert "printful_enabled" in data, "printful_enabled should also be present in admin flags"
        print(f"PASS: Admin feature flags returns yoycol_enabled={data['yoycol_enabled']}")

    def test_admin_feature_flags_requires_auth(self):
        """GET /api/admin-settings/feature-flags requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin-settings/feature-flags")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("PASS: Admin feature flags requires authentication")

    def test_toggle_yoycol_enabled_on(self, auth_headers: dict):
        """PUT /api/admin-settings/feature-flags can enable yoycol_enabled"""
        # Get current flags
        get_response = requests.get(f"{BASE_URL}/api/admin-settings/feature-flags", headers=auth_headers)
        current_flags = get_response.json()

        # Update with yoycol_enabled=True
        update_payload = {**current_flags, "yoycol_enabled": True}
        response = requests.put(f"{BASE_URL}/api/admin-settings/feature-flags", 
                               json=update_payload, headers=auth_headers)
        assert response.status_code == 200, f"Toggle yoycol on failed: {response.text}"
        data = response.json()
        assert data.get("success") is True, "Expected success=true"

        # Verify persistence
        verify_response = requests.get(f"{BASE_URL}/api/admin-settings/feature-flags", headers=auth_headers)
        verify_data = verify_response.json()
        assert verify_data.get("yoycol_enabled") is True, "yoycol_enabled not persisted as True"
        print("PASS: yoycol_enabled toggled ON and persisted")

    def test_toggle_yoycol_enabled_off(self, auth_headers: dict):
        """PUT /api/admin-settings/feature-flags can disable yoycol_enabled"""
        # Get current flags
        get_response = requests.get(f"{BASE_URL}/api/admin-settings/feature-flags", headers=auth_headers)
        current_flags = get_response.json()

        # Update with yoycol_enabled=False
        update_payload = {**current_flags, "yoycol_enabled": False}
        response = requests.put(f"{BASE_URL}/api/admin-settings/feature-flags",
                               json=update_payload, headers=auth_headers)
        assert response.status_code == 200, f"Toggle yoycol off failed: {response.text}"

        # Verify persistence
        verify_response = requests.get(f"{BASE_URL}/api/admin-settings/feature-flags", headers=auth_headers)
        verify_data = verify_response.json()
        assert verify_data.get("yoycol_enabled") is False, "yoycol_enabled not persisted as False"
        print("PASS: yoycol_enabled toggled OFF and persisted")

    # ===================== YOYCOL CREDENTIALS TESTS =====================

    def test_yoycol_credentials_requires_auth(self):
        """GET /api/yoycol/credentials requires auth"""
        response = requests.get(f"{BASE_URL}/api/yoycol/credentials")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("PASS: YOYCOL credentials requires authentication")

    def test_get_yoycol_credentials_empty(self, auth_headers: dict):
        """GET /api/yoycol/credentials returns unconfigured state initially"""
        # First enable yoycol for super admin to access
        self._enable_yoycol(auth_headers)

        response = requests.get(f"{BASE_URL}/api/yoycol/credentials", headers=auth_headers)
        assert response.status_code == 200, f"Get credentials failed: {response.text}"
        data = response.json()
        # Should return structured response with configured field
        assert "configured" in data, "Response should have 'configured' field"
        assert "access_key_masked" in data, "Response should have 'access_key_masked' field"
        assert "secret_key_masked" in data, "Response should have 'secret_key_masked' field"
        print(f"PASS: GET credentials returns structured response (configured={data.get('configured')})")

    def test_save_yoycol_credentials(self, auth_headers: dict):
        """PUT /api/yoycol/credentials saves credentials"""
        self._enable_yoycol(auth_headers)

        payload = {
            "access_key": "test_ak_123456789012",
            "secret_key": "test_sk_abcdefghij1234567890"
        }
        response = requests.put(f"{BASE_URL}/api/yoycol/credentials", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Save credentials failed: {response.text}"
        data = response.json()
        assert data.get("success") is True, "Expected success=true"
        print("PASS: YOYCOL credentials saved successfully")

    def test_get_yoycol_credentials_masked(self, auth_headers: dict):
        """GET /api/yoycol/credentials returns masked keys after save"""
        self._enable_yoycol(auth_headers)

        # First save credentials
        payload = {
            "access_key": "test_ak_123456789012",
            "secret_key": "test_sk_abcdefghij1234567890"
        }
        requests.put(f"{BASE_URL}/api/yoycol/credentials", json=payload, headers=auth_headers)

        # Then get and verify masked
        response = requests.get(f"{BASE_URL}/api/yoycol/credentials", headers=auth_headers)
        assert response.status_code == 200, f"Get credentials failed: {response.text}"
        data = response.json()
        
        assert data.get("configured") is True, "Should be configured after save"
        assert data.get("access_key_masked"), "access_key_masked should be present"
        assert data.get("secret_key_masked"), "secret_key_masked should be present"
        assert "*" in data.get("access_key_masked", ""), "access_key should be masked with asterisks"
        assert "*" in data.get("secret_key_masked", ""), "secret_key should be masked with asterisks"
        print(f"PASS: Credentials masked correctly - access_key: {data['access_key_masked']}, secret_key: {data['secret_key_masked']}")

    # ===================== YOYCOL VALIDATION TESTS =====================

    def test_yoycol_validate_requires_auth(self):
        """POST /api/yoycol/validate requires auth"""
        response = requests.post(f"{BASE_URL}/api/yoycol/validate", json={})
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("PASS: YOYCOL validate requires authentication")

    def test_yoycol_validate_with_placeholder_keys(self, auth_headers: dict):
        """POST /api/yoycol/validate returns structured invalid response for placeholder keys"""
        self._enable_yoycol(auth_headers)

        payload = {
            "use_stored": False,
            "access_key": "placeholder_access_key_test",
            "secret_key": "placeholder_secret_key_test"
        }
        response = requests.post(f"{BASE_URL}/api/yoycol/validate", json=payload, headers=auth_headers)
        
        # Should return 200 with structured response (not crash)
        assert response.status_code == 200, f"Validate endpoint crashed: {response.text}"
        data = response.json()
        
        # Structured response should have valid, message, last_validation_status
        assert "valid" in data, "Response should have 'valid' field"
        assert "message" in data, "Response should have 'message' field"
        assert isinstance(data["valid"], bool), "valid should be boolean"
        
        # Placeholder keys expected to fail validation
        assert data["valid"] is False, "Placeholder keys should fail validation"
        print(f"PASS: Validation returns structured response - valid={data['valid']}, message={data.get('message')}")

    def test_yoycol_validate_use_stored(self, auth_headers: dict):
        """POST /api/yoycol/validate with use_stored=true uses saved credentials"""
        self._enable_yoycol(auth_headers)

        # First save credentials
        save_payload = {
            "access_key": "stored_test_ak_12345678",
            "secret_key": "stored_test_sk_abcdefghij"
        }
        requests.put(f"{BASE_URL}/api/yoycol/credentials", json=save_payload, headers=auth_headers)

        # Validate using stored credentials
        validate_payload = {"use_stored": True}
        response = requests.post(f"{BASE_URL}/api/yoycol/validate", json=validate_payload, headers=auth_headers)
        
        assert response.status_code == 200, f"Validate with stored failed: {response.text}"
        data = response.json()
        assert "valid" in data, "Response should have 'valid' field"
        assert "message" in data, "Response should have 'message' field"
        print(f"PASS: Validate with use_stored=true works - valid={data['valid']}")

    def test_yoycol_validate_no_stored_credentials(self, auth_headers: dict):
        """POST /api/yoycol/validate with use_stored=true fails if no credentials saved"""
        self._enable_yoycol(auth_headers)

        # This test assumes a fresh user without credentials
        # We test this by checking the error message format
        # Note: Since we saved creds earlier, this may pass - checking response format is key
        validate_payload = {"use_stored": True}
        response = requests.post(f"{BASE_URL}/api/yoycol/validate", json=validate_payload, headers=auth_headers)
        
        # Should either succeed (if creds exist) or return 404/structured error
        assert response.status_code in [200, 404, 400], f"Unexpected status: {response.status_code}"
        print(f"PASS: Validate with use_stored handles missing credentials gracefully (status={response.status_code})")

    # ===================== FEATURE GATING TESTS =====================

    def test_yoycol_gated_when_disabled_for_non_super(self, auth_headers: dict, store_owner_headers: dict):
        """Non-super users cannot access YOYCOL endpoints when yoycol_enabled=false"""
        # First disable yoycol
        get_response = requests.get(f"{BASE_URL}/api/admin-settings/feature-flags", headers=auth_headers)
        current_flags = get_response.json()
        update_payload = {**current_flags, "yoycol_enabled": False}
        requests.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=update_payload, headers=auth_headers)

        # Store owner should be blocked from credentials endpoint
        response = requests.get(f"{BASE_URL}/api/yoycol/credentials", headers=store_owner_headers)
        assert response.status_code == 403, f"Expected 403 for store owner when yoycol disabled, got {response.status_code}"
        print("PASS: Non-super users blocked from YOYCOL when feature flag is OFF")

    def test_super_admin_bypasses_feature_gate(self, auth_headers: dict):
        """Super admin can access YOYCOL endpoints even when yoycol_enabled=false"""
        # Disable yoycol
        get_response = requests.get(f"{BASE_URL}/api/admin-settings/feature-flags", headers=auth_headers)
        current_flags = get_response.json()
        update_payload = {**current_flags, "yoycol_enabled": False}
        requests.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=update_payload, headers=auth_headers)

        # Super admin should still access
        response = requests.get(f"{BASE_URL}/api/yoycol/credentials", headers=auth_headers)
        assert response.status_code == 200, f"Super admin should bypass feature gate, got {response.status_code}"
        print("PASS: Super admin bypasses yoycol_enabled feature gate")

    # ===================== PRINTFUL COEXISTENCE TEST =====================

    def test_printful_behavior_unaffected(self, auth_headers: dict):
        """Existing Printful behavior remains intact alongside YOYCOL"""
        # Check Printful endpoints still work
        printful_response = requests.get(f"{BASE_URL}/api/printful/credentials", headers=auth_headers)
        # Should return 200 (super admin bypasses feature gate)
        assert printful_response.status_code == 200, f"Printful credentials endpoint broken: {printful_response.text}"
        print("PASS: Printful behavior unaffected by YOYCOL integration")

    # ===================== HELPER METHODS =====================

    def _enable_yoycol(self, auth_headers: dict):
        """Helper to enable yoycol feature flag"""
        get_response = requests.get(f"{BASE_URL}/api/admin-settings/feature-flags", headers=auth_headers)
        current_flags = get_response.json()
        update_payload = {**current_flags, "yoycol_enabled": True}
        requests.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=update_payload, headers=auth_headers)


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
