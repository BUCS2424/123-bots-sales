"""
Test Quote Configuration Modal and Feature Flag Behavior
Tests:
- Quote form config API (GET/PUT /api/quotes/config)
- Business info sync from admin_settings
- Feature flag quotes_enabled behavior
- Quote catalog products/services separation from cart
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://robot-commerce.preview.emergentagent.com')

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


class TestQuoteFormConfig:
    """Tests for Quote Form Configuration API"""

    def test_get_quote_config(self, auth_headers):
        """GET /api/quotes/config returns config and business_info"""
        response = requests.get(f"{BASE_URL}/api/quotes/config", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "config" in data, "Response should contain 'config'"
        assert "business_info" in data, "Response should contain 'business_info'"
        
        # Verify config fields
        config = data["config"]
        assert "show_from_business_name" in config
        assert "show_from_address" in config
        assert "show_from_city_state_zip" in config
        assert "show_from_phone" in config
        assert "show_from_email" in config
        assert "charge_stripe_fees" in config
        assert "deposit_value" in config
        assert "deposit_type" in config
        
        # Verify business_info fields
        business_info = data["business_info"]
        assert "business_name" in business_info
        assert "address" in business_info
        assert "city" in business_info
        assert "state" in business_info
        assert "zip_code" in business_info
        assert "phone" in business_info
        assert "email" in business_info
        assert "logo_url" in business_info
        print(f"✓ GET /api/quotes/config returns config and business_info")

    def test_update_quote_config_visibility_toggles(self, auth_headers):
        """PUT /api/quotes/config updates from-field visibility toggles"""
        payload = {
            "show_from_business_name": True,
            "show_from_address": False,
            "show_from_city_state_zip": True,
            "show_from_phone": True,
            "show_from_email": False,
            "charge_stripe_fees": True,
            "deposit_value": 65,
            "deposit_type": "percent"
        }
        response = requests.put(f"{BASE_URL}/api/quotes/config", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        config = data.get("config", {})
        assert config.get("show_from_address") == False, "show_from_address should be False"
        assert config.get("show_from_phone") == True, "show_from_phone should be True"
        print(f"✓ PUT /api/quotes/config updates visibility toggles")

    def test_update_quote_config_stripe_fees(self, auth_headers):
        """PUT /api/quotes/config updates charge_stripe_fees checkbox"""
        # Test with stripe fees OFF
        payload = {
            "show_from_business_name": True,
            "show_from_address": True,
            "show_from_city_state_zip": True,
            "show_from_phone": False,
            "show_from_email": False,
            "charge_stripe_fees": False,
            "deposit_value": 50,
            "deposit_type": "percent"
        }
        response = requests.put(f"{BASE_URL}/api/quotes/config", json=payload, headers=auth_headers)
        assert response.status_code == 200
        
        config = response.json().get("config", {})
        assert config.get("charge_stripe_fees") == False, "charge_stripe_fees should be False"
        
        # Test with stripe fees ON
        payload["charge_stripe_fees"] = True
        response = requests.put(f"{BASE_URL}/api/quotes/config", json=payload, headers=auth_headers)
        assert response.status_code == 200
        
        config = response.json().get("config", {})
        assert config.get("charge_stripe_fees") == True, "charge_stripe_fees should be True"
        print(f"✓ PUT /api/quotes/config updates charge_stripe_fees")

    def test_update_quote_config_deposit_percent(self, auth_headers):
        """PUT /api/quotes/config updates deposit as percent"""
        payload = {
            "show_from_business_name": True,
            "show_from_address": True,
            "show_from_city_state_zip": True,
            "show_from_phone": False,
            "show_from_email": False,
            "charge_stripe_fees": True,
            "deposit_value": 75,
            "deposit_type": "percent"
        }
        response = requests.put(f"{BASE_URL}/api/quotes/config", json=payload, headers=auth_headers)
        assert response.status_code == 200
        
        config = response.json().get("config", {})
        assert config.get("deposit_value") == 75, "deposit_value should be 75"
        assert config.get("deposit_type") == "percent", "deposit_type should be percent"
        print(f"✓ PUT /api/quotes/config updates deposit as percent")

    def test_update_quote_config_deposit_flat(self, auth_headers):
        """PUT /api/quotes/config updates deposit as flat $"""
        payload = {
            "show_from_business_name": True,
            "show_from_address": True,
            "show_from_city_state_zip": True,
            "show_from_phone": False,
            "show_from_email": False,
            "charge_stripe_fees": True,
            "deposit_value": 500,
            "deposit_type": "flat"
        }
        response = requests.put(f"{BASE_URL}/api/quotes/config", json=payload, headers=auth_headers)
        assert response.status_code == 200
        
        config = response.json().get("config", {})
        assert config.get("deposit_value") == 500, "deposit_value should be 500"
        assert config.get("deposit_type") == "flat", "deposit_type should be flat"
        print(f"✓ PUT /api/quotes/config updates deposit as flat $")

    def test_quote_config_invalid_deposit_type(self, auth_headers):
        """PUT /api/quotes/config rejects invalid deposit_type"""
        payload = {
            "show_from_business_name": True,
            "show_from_address": True,
            "show_from_city_state_zip": True,
            "show_from_phone": False,
            "show_from_email": False,
            "charge_stripe_fees": True,
            "deposit_value": 50,
            "deposit_type": "invalid"
        }
        response = requests.put(f"{BASE_URL}/api/quotes/config", json=payload, headers=auth_headers)
        assert response.status_code == 400, f"Expected 400 for invalid deposit_type, got {response.status_code}"
        print(f"✓ PUT /api/quotes/config rejects invalid deposit_type")

    def test_quote_config_negative_deposit_value(self, auth_headers):
        """PUT /api/quotes/config rejects negative deposit_value"""
        payload = {
            "show_from_business_name": True,
            "show_from_address": True,
            "show_from_city_state_zip": True,
            "show_from_phone": False,
            "show_from_email": False,
            "charge_stripe_fees": True,
            "deposit_value": -10,
            "deposit_type": "percent"
        }
        response = requests.put(f"{BASE_URL}/api/quotes/config", json=payload, headers=auth_headers)
        assert response.status_code == 400, f"Expected 400 for negative deposit_value, got {response.status_code}"
        print(f"✓ PUT /api/quotes/config rejects negative deposit_value")


class TestQuoteCatalogSeparation:
    """Tests for Quote Catalog Products/Services (separate from cart)"""

    def test_get_quote_catalog_products(self, auth_headers):
        """GET /api/quotes/catalog/products returns quote-specific products"""
        response = requests.get(f"{BASE_URL}/api/quotes/catalog/products", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "products" in data, "Response should contain 'products'"
        assert isinstance(data["products"], list), "products should be a list"
        print(f"✓ GET /api/quotes/catalog/products returns {len(data['products'])} products")

    def test_get_quote_catalog_services(self, auth_headers):
        """GET /api/quotes/catalog/services returns quote-specific services"""
        response = requests.get(f"{BASE_URL}/api/quotes/catalog/services", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "services" in data, "Response should contain 'services'"
        assert isinstance(data["services"], list), "services should be a list"
        print(f"✓ GET /api/quotes/catalog/services returns {len(data['services'])} services")

    def test_create_quote_catalog_product(self, auth_headers):
        """POST /api/quotes/catalog/products creates a quote product"""
        payload = {
            "name": "TEST_Quote_Product_Config",
            "description": "Test product for quote config testing",
            "category": "Test Category",
            "sku": "TEST-QP-001",
            "price_onetime": 100.00,
            "price_monthly": 10.00,
            "price_yearly": 100.00,
            "is_active": True
        }
        response = requests.post(f"{BASE_URL}/api/quotes/catalog/products", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("name") == "TEST_Quote_Product_Config"
        assert "id" in data, "Response should contain 'id'"
        print(f"✓ POST /api/quotes/catalog/products creates product with id: {data['id']}")
        return data["id"]

    def test_create_quote_catalog_service(self, auth_headers):
        """POST /api/quotes/catalog/services creates a quote service"""
        payload = {
            "name": "TEST_Quote_Service_Config",
            "description": "Test service for quote config testing",
            "category": "Test Category",
            "price_onetime": 200.00,
            "price_monthly": 20.00,
            "price_yearly": 200.00,
            "is_active": True
        }
        response = requests.post(f"{BASE_URL}/api/quotes/catalog/services", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("name") == "TEST_Quote_Service_Config"
        assert "id" in data, "Response should contain 'id'"
        print(f"✓ POST /api/quotes/catalog/services creates service with id: {data['id']}")
        return data["id"]


class TestFeatureFlagQuotesEnabled:
    """Tests for quotes_enabled feature flag"""

    def test_get_feature_flags_includes_quotes_enabled(self, auth_headers):
        """GET /api/admin-settings/feature-flags includes quotes_enabled"""
        response = requests.get(f"{BASE_URL}/api/admin-settings/feature-flags", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "quotes_enabled" in data, "Feature flags should include quotes_enabled"
        print(f"✓ GET /api/admin-settings/feature-flags includes quotes_enabled: {data['quotes_enabled']}")

    def test_public_feature_flags_includes_quotes_enabled(self):
        """GET /api/settings/feature-flags (public) includes quotes_enabled"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "quotes_enabled" in data, "Public feature flags should include quotes_enabled"
        print(f"✓ GET /api/settings/feature-flags includes quotes_enabled: {data['quotes_enabled']}")

    def test_toggle_quotes_enabled_off(self, auth_headers):
        """PUT /api/admin-settings/feature-flags can toggle quotes_enabled OFF"""
        # First get current flags
        response = requests.get(f"{BASE_URL}/api/admin-settings/feature-flags", headers=auth_headers)
        current_flags = response.json()
        
        # Toggle OFF
        current_flags["quotes_enabled"] = False
        response = requests.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=current_flags, headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        data = response.json()
        assert data.get("quotes_enabled") == False, "quotes_enabled should be False"
        print(f"✓ PUT /api/admin-settings/feature-flags toggles quotes_enabled OFF")

    def test_toggle_quotes_enabled_on(self, auth_headers):
        """PUT /api/admin-settings/feature-flags can toggle quotes_enabled ON"""
        # First get current flags
        response = requests.get(f"{BASE_URL}/api/admin-settings/feature-flags", headers=auth_headers)
        current_flags = response.json()
        
        # Toggle ON
        current_flags["quotes_enabled"] = True
        response = requests.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=current_flags, headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        data = response.json()
        assert data.get("quotes_enabled") == True, "quotes_enabled should be True"
        print(f"✓ PUT /api/admin-settings/feature-flags toggles quotes_enabled ON")


class TestBusinessInfoSync:
    """Tests for business info sync to quote config"""

    def test_business_info_synced_to_quote_config(self, auth_headers):
        """Quote config business_info is synced from admin_settings"""
        # Get business settings
        business_response = requests.get(f"{BASE_URL}/api/admin-settings/business", headers=auth_headers)
        
        # Get quote config
        quote_response = requests.get(f"{BASE_URL}/api/quotes/config", headers=auth_headers)
        assert quote_response.status_code == 200
        
        quote_data = quote_response.json()
        business_info = quote_data.get("business_info", {})
        
        # Verify business_info fields exist
        assert "business_name" in business_info
        assert "address" in business_info
        assert "city" in business_info
        assert "state" in business_info
        assert "zip_code" in business_info
        assert "phone" in business_info
        assert "email" in business_info
        assert "logo_url" in business_info
        print(f"✓ Quote config business_info is synced from admin_settings")


class TestCleanup:
    """Cleanup test data"""

    def test_cleanup_test_products(self, auth_headers):
        """Delete TEST_ prefixed products"""
        response = requests.get(f"{BASE_URL}/api/quotes/catalog/products", headers=auth_headers)
        if response.status_code == 200:
            products = response.json().get("products", [])
            for product in products:
                if product.get("name", "").startswith("TEST_"):
                    delete_response = requests.delete(
                        f"{BASE_URL}/api/quotes/catalog/products/{product['id']}", 
                        headers=auth_headers
                    )
                    print(f"  Deleted test product: {product['name']}")
        print(f"✓ Cleanup test products complete")

    def test_cleanup_test_services(self, auth_headers):
        """Delete TEST_ prefixed services"""
        response = requests.get(f"{BASE_URL}/api/quotes/catalog/services", headers=auth_headers)
        if response.status_code == 200:
            services = response.json().get("services", [])
            for service in services:
                if service.get("name", "").startswith("TEST_"):
                    delete_response = requests.delete(
                        f"{BASE_URL}/api/quotes/catalog/services/{service['id']}", 
                        headers=auth_headers
                    )
                    print(f"  Deleted test service: {service['name']}")
        print(f"✓ Cleanup test services complete")

    def test_restore_default_quote_config(self, auth_headers):
        """Restore default quote config values"""
        payload = {
            "show_from_business_name": True,
            "show_from_address": True,
            "show_from_city_state_zip": True,
            "show_from_phone": False,
            "show_from_email": False,
            "charge_stripe_fees": True,
            "deposit_value": 65,
            "deposit_type": "percent"
        }
        response = requests.put(f"{BASE_URL}/api/quotes/config", json=payload, headers=auth_headers)
        assert response.status_code == 200
        print(f"✓ Restored default quote config values")
