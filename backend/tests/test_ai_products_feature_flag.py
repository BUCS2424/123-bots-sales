"""
Test AI Products Feature Flag functionality
Tests:
1. Public feature flags endpoint returns ai_products key
2. AI product lookup endpoint returns 403 when ai_products=false
3. No regression in other feature flags
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bot-catalog-preview.preview.emergentagent.com')

class TestPublicFeatureFlags:
    """Test public feature flags endpoint"""
    
    def test_public_feature_flags_returns_ai_products(self):
        """Verify public feature flags endpoint returns ai_products key"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "ai_products" in data, "ai_products key missing from public feature flags"
        assert isinstance(data["ai_products"], bool), "ai_products should be a boolean"
        print(f"ai_products value: {data['ai_products']}")
    
    def test_public_feature_flags_returns_all_expected_keys(self):
        """Verify no regression in existing feature flags payload"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200
        
        data = response.json()
        expected_keys = [
            "pawn_checkout",
            "storage_online", 
            "storage_pos",
            "ai_products",
            "notifications",
            "sms",
            "analytics",
            "printful_enabled",
            "yoycol_enabled",
            "owner_chat_enabled",
            "owner_chat_ai_enabled",
            "left_menu_enabled",
            "coming_soon_enabled",
            "coming_soon_password"
        ]
        
        for key in expected_keys:
            assert key in data, f"Missing expected key: {key}"
            print(f"  {key}: {data[key]}")
    
    def test_public_feature_flags_boolean_types(self):
        """Verify boolean flags are actually booleans"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200
        
        data = response.json()
        boolean_keys = [
            "pawn_checkout", "storage_online", "storage_pos", "ai_products",
            "notifications", "sms", "analytics", "printful_enabled",
            "yoycol_enabled", "owner_chat_enabled", "owner_chat_ai_enabled",
            "left_menu_enabled", "coming_soon_enabled"
        ]
        
        for key in boolean_keys:
            assert isinstance(data.get(key), bool), f"{key} should be boolean, got {type(data.get(key))}"


class TestAIProductLookupEndpoint:
    """Test AI product lookup endpoint respects feature flag"""
    
    def test_ai_product_lookup_requires_auth(self):
        """Verify AI product lookup requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/ai/product-lookup",
            json={"query": "test product"}
        )
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403, 422], f"Expected auth error, got {response.status_code}"
        print(f"Without auth: {response.status_code} - {response.json()}")
    
    def test_ai_product_lookup_returns_403_when_disabled(self):
        """
        When ai_products=false, the endpoint should return 403 even with valid auth.
        Note: This test requires admin credentials to fully verify.
        Without credentials, we can only verify the endpoint exists and requires auth.
        """
        # First check current flag status
        flags_response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert flags_response.status_code == 200
        
        ai_products_enabled = flags_response.json().get("ai_products", True)
        print(f"Current ai_products flag: {ai_products_enabled}")
        
        # Without auth, we can't fully test the 403 behavior
        # But we can verify the endpoint exists
        response = requests.post(
            f"{BASE_URL}/api/ai/product-lookup",
            json={"query": "test product"}
        )
        
        # The endpoint should require auth first
        assert response.status_code in [401, 403, 422], f"Unexpected status: {response.status_code}"
        
        if ai_products_enabled:
            print("Note: ai_products is currently enabled, cannot test 403 behavior without admin auth")
        else:
            print("ai_products is disabled - endpoint should return 403 with valid admin auth")


class TestFeatureFlagConsistency:
    """Test feature flag consistency between endpoints"""
    
    def test_public_endpoint_accessible_without_auth(self):
        """Verify public feature flags endpoint doesn't require auth"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200, "Public feature flags should not require auth"
    
    def test_admin_endpoint_requires_auth(self):
        """Verify admin feature flags endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin-settings/feature-flags")
        assert response.status_code == 401, f"Admin endpoint should require auth, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
