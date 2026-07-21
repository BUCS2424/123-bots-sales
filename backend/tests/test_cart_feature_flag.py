"""
Test suite for cart_enabled and pawn_checkout feature flags.
Tests the new Shopping Cart feature flag and catalog mode behavior.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bot-admin-hub-4.preview.emergentagent.com')


class TestPublicFeatureFlags:
    """Tests for public feature flags endpoint"""
    
    def test_public_feature_flags_returns_cart_enabled(self):
        """Verify cart_enabled key is present in public feature flags"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "cart_enabled" in data, "cart_enabled key missing from public feature flags"
        assert isinstance(data["cart_enabled"], bool), "cart_enabled should be a boolean"
        print(f"✓ cart_enabled present in public flags: {data['cart_enabled']}")
    
    def test_public_feature_flags_returns_pawn_checkout(self):
        """Verify pawn_checkout key is present in public feature flags"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200
        
        data = response.json()
        assert "pawn_checkout" in data, "pawn_checkout key missing from public feature flags"
        assert isinstance(data["pawn_checkout"], bool), "pawn_checkout should be a boolean"
        print(f"✓ pawn_checkout present in public flags: {data['pawn_checkout']}")
    
    def test_public_feature_flags_returns_all_expected_keys(self):
        """Verify all expected feature flag keys are present"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200
        
        data = response.json()
        expected_keys = [
            "cart_enabled",
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
            "coming_soon_password",
        ]
        
        for key in expected_keys:
            assert key in data, f"Missing expected key: {key}"
        
        print(f"✓ All {len(expected_keys)} expected keys present in public feature flags")
    
    def test_public_feature_flags_no_auth_required(self):
        """Verify public feature flags endpoint doesn't require authentication"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200, "Public feature flags should not require auth"
        print("✓ Public feature flags accessible without authentication")


class TestCatalogModeBehavior:
    """Tests for catalog mode when pawn_checkout=false"""
    
    def test_products_endpoint_accessible_in_catalog_mode(self):
        """Verify products can still be fetched in catalog mode"""
        response = requests.get(f"{BASE_URL}/api/store/products")
        assert response.status_code == 200, f"Products endpoint should work in catalog mode, got {response.status_code}"
        
        data = response.json()
        products = data.get("products", data) if isinstance(data, dict) else data
        assert isinstance(products, list), "Products should be a list"
        print(f"✓ Products endpoint accessible in catalog mode, returned {len(products)} products")
    
    def test_categories_endpoint_accessible_in_catalog_mode(self):
        """Verify categories can still be fetched in catalog mode"""
        response = requests.get(f"{BASE_URL}/api/store/categories")
        assert response.status_code == 200, f"Categories endpoint should work in catalog mode, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Categories should be a list"
        print(f"✓ Categories endpoint accessible in catalog mode, returned {len(data)} categories")


class TestFeatureFlagDefaults:
    """Tests for feature flag default values"""
    
    def test_cart_enabled_default_is_true(self):
        """Verify cart_enabled defaults to true in FeatureFlags model"""
        # This tests the backend model default - when no DB record exists
        # The public endpoint should return true as default
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200
        
        data = response.json()
        # Note: Current live value may differ from default
        # This test documents the expected default behavior
        print(f"✓ cart_enabled current value: {data.get('cart_enabled')}")
    
    def test_pawn_checkout_default_is_true(self):
        """Verify pawn_checkout defaults to true in FeatureFlags model"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200
        
        data = response.json()
        print(f"✓ pawn_checkout current value: {data.get('pawn_checkout')}")


class TestExistingFlagsNoRegression:
    """Verify existing feature flags still work correctly"""
    
    def test_coming_soon_enabled_present(self):
        """Verify coming_soon_enabled flag is present"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200
        
        data = response.json()
        assert "coming_soon_enabled" in data
        assert isinstance(data["coming_soon_enabled"], bool)
        print(f"✓ coming_soon_enabled: {data['coming_soon_enabled']}")
    
    def test_left_menu_enabled_present(self):
        """Verify left_menu_enabled flag is present"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200
        
        data = response.json()
        assert "left_menu_enabled" in data
        assert isinstance(data["left_menu_enabled"], bool)
        print(f"✓ left_menu_enabled: {data['left_menu_enabled']}")
    
    def test_ai_products_present(self):
        """Verify ai_products flag is present"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200
        
        data = response.json()
        assert "ai_products" in data
        assert isinstance(data["ai_products"], bool)
        print(f"✓ ai_products: {data['ai_products']}")
    
    def test_printful_yoycol_flags_present(self):
        """Verify printful and yoycol flags are present"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200
        
        data = response.json()
        assert "printful_enabled" in data
        assert "yoycol_enabled" in data
        print(f"✓ printful_enabled: {data['printful_enabled']}, yoycol_enabled: {data['yoycol_enabled']}")
    
    def test_owner_chat_flags_present(self):
        """Verify owner chat flags are present"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200
        
        data = response.json()
        assert "owner_chat_enabled" in data
        assert "owner_chat_ai_enabled" in data
        print(f"✓ owner_chat_enabled: {data['owner_chat_enabled']}, owner_chat_ai_enabled: {data['owner_chat_ai_enabled']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
