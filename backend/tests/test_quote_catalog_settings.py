"""
Test Quote Catalog Settings and Feature Flag
Tests:
1. Quote catalog products CRUD (separate from cart products)
2. Quote catalog services CRUD (separate from cart services)
3. Quote catalog lead-sales endpoint
4. Quotes feature flag toggle
5. Settings cog button navigation to /admin/quotes/settings
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://booking-crm-preview-1.preview.emergentagent.com')

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
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestQuoteCatalogProducts:
    """Test quote catalog products CRUD - separate from cart products"""
    
    created_product_id = None
    
    def test_list_quote_products(self, auth_headers):
        """GET /api/quotes/catalog/products - List quote products"""
        response = requests.get(f"{BASE_URL}/api/quotes/catalog/products", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert isinstance(data["products"], list)
        print(f"Found {len(data['products'])} quote products")
    
    def test_create_quote_product(self, auth_headers):
        """POST /api/quotes/catalog/products - Create quote product"""
        product_data = {
            "name": f"TEST_Quote_Product_{uuid.uuid4().hex[:6]}",
            "description": "Test quote product for testing",
            "category": "Test Category",
            "sku": f"QP-{uuid.uuid4().hex[:6]}",
            "price_onetime": 100.00,
            "price_monthly": 10.00,
            "price_yearly": 100.00,
            "is_active": True
        }
        response = requests.post(f"{BASE_URL}/api/quotes/catalog/products", json=product_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == product_data["name"]
        assert data["price_onetime"] == product_data["price_onetime"]
        TestQuoteCatalogProducts.created_product_id = data["id"]
        print(f"Created quote product: {data['id']}")
    
    def test_update_quote_product(self, auth_headers):
        """PUT /api/quotes/catalog/products/{id} - Update quote product"""
        if not TestQuoteCatalogProducts.created_product_id:
            pytest.skip("No product created to update")
        
        update_data = {
            "name": f"TEST_Updated_Quote_Product_{uuid.uuid4().hex[:6]}",
            "description": "Updated description",
            "category": "Updated Category",
            "sku": f"QP-UPD-{uuid.uuid4().hex[:6]}",
            "price_onetime": 150.00,
            "price_monthly": 15.00,
            "price_yearly": 150.00,
            "is_active": True
        }
        response = requests.put(
            f"{BASE_URL}/api/quotes/catalog/products/{TestQuoteCatalogProducts.created_product_id}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["price_onetime"] == update_data["price_onetime"]
        print(f"Updated quote product: {TestQuoteCatalogProducts.created_product_id}")
    
    def test_delete_quote_product(self, auth_headers):
        """DELETE /api/quotes/catalog/products/{id} - Delete quote product"""
        if not TestQuoteCatalogProducts.created_product_id:
            pytest.skip("No product created to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/quotes/catalog/products/{TestQuoteCatalogProducts.created_product_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"Deleted quote product: {TestQuoteCatalogProducts.created_product_id}")


class TestQuoteCatalogServices:
    """Test quote catalog services CRUD - separate from cart services"""
    
    created_service_id = None
    
    def test_list_quote_services(self, auth_headers):
        """GET /api/quotes/catalog/services - List quote services"""
        response = requests.get(f"{BASE_URL}/api/quotes/catalog/services", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "services" in data
        assert isinstance(data["services"], list)
        print(f"Found {len(data['services'])} quote services")
    
    def test_create_quote_service(self, auth_headers):
        """POST /api/quotes/catalog/services - Create quote service"""
        service_data = {
            "name": f"TEST_Quote_Service_{uuid.uuid4().hex[:6]}",
            "description": "Test quote service for testing",
            "category": "Test Service Category",
            "sku": f"QS-{uuid.uuid4().hex[:6]}",
            "price_onetime": 200.00,
            "price_monthly": 20.00,
            "price_yearly": 200.00,
            "is_active": True
        }
        response = requests.post(f"{BASE_URL}/api/quotes/catalog/services", json=service_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == service_data["name"]
        TestQuoteCatalogServices.created_service_id = data["id"]
        print(f"Created quote service: {data['id']}")
    
    def test_update_quote_service(self, auth_headers):
        """PUT /api/quotes/catalog/services/{id} - Update quote service"""
        if not TestQuoteCatalogServices.created_service_id:
            pytest.skip("No service created to update")
        
        update_data = {
            "name": f"TEST_Updated_Quote_Service_{uuid.uuid4().hex[:6]}",
            "description": "Updated service description",
            "category": "Updated Service Category",
            "sku": f"QS-UPD-{uuid.uuid4().hex[:6]}",
            "price_onetime": 250.00,
            "price_monthly": 25.00,
            "price_yearly": 250.00,
            "is_active": True
        }
        response = requests.put(
            f"{BASE_URL}/api/quotes/catalog/services/{TestQuoteCatalogServices.created_service_id}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["price_onetime"] == update_data["price_onetime"]
        print(f"Updated quote service: {TestQuoteCatalogServices.created_service_id}")
    
    def test_delete_quote_service(self, auth_headers):
        """DELETE /api/quotes/catalog/services/{id} - Delete quote service"""
        if not TestQuoteCatalogServices.created_service_id:
            pytest.skip("No service created to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/quotes/catalog/services/{TestQuoteCatalogServices.created_service_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"Deleted quote service: {TestQuoteCatalogServices.created_service_id}")


class TestQuoteLeadSales:
    """Test quote lead sales endpoint"""
    
    def test_get_lead_sales(self, auth_headers):
        """GET /api/quotes/catalog/lead-sales - Get lead sales data"""
        response = requests.get(f"{BASE_URL}/api/quotes/catalog/lead-sales", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "sales" in data
        assert isinstance(data["sales"], list)
        print(f"Found {len(data['sales'])} lead sales records")


class TestQuotesFeatureFlag:
    """Test quotes feature flag toggle"""
    
    original_flag_value = None
    
    def test_get_feature_flags(self, auth_headers):
        """GET /api/admin-settings/feature-flags - Get feature flags including quotes_enabled"""
        response = requests.get(f"{BASE_URL}/api/admin-settings/feature-flags", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "quotes_enabled" in data
        TestQuotesFeatureFlag.original_flag_value = data.get("quotes_enabled", True)
        print(f"Current quotes_enabled flag: {data['quotes_enabled']}")
    
    def test_public_feature_flags_include_quotes(self):
        """GET /api/settings/feature-flags - Public endpoint includes quotes_enabled"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200
        data = response.json()
        assert "quotes_enabled" in data
        print(f"Public quotes_enabled flag: {data['quotes_enabled']}")
    
    def test_toggle_quotes_flag_off(self, auth_headers):
        """PUT /api/admin-settings/feature-flags - Toggle quotes_enabled OFF"""
        # Get current flags
        response = requests.get(f"{BASE_URL}/api/admin-settings/feature-flags", headers=auth_headers)
        current_flags = response.json()
        
        # Set quotes_enabled to False
        current_flags["quotes_enabled"] = False
        response = requests.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=current_flags, headers=auth_headers)
        assert response.status_code == 200
        
        # Verify it's off
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        data = response.json()
        assert data.get("quotes_enabled") == False
        print("Quotes feature flag toggled OFF successfully")
    
    def test_toggle_quotes_flag_on(self, auth_headers):
        """PUT /api/admin-settings/feature-flags - Toggle quotes_enabled ON"""
        # Get current flags
        response = requests.get(f"{BASE_URL}/api/admin-settings/feature-flags", headers=auth_headers)
        current_flags = response.json()
        
        # Set quotes_enabled to True
        current_flags["quotes_enabled"] = True
        response = requests.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=current_flags, headers=auth_headers)
        assert response.status_code == 200
        
        # Verify it's on
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        data = response.json()
        assert data.get("quotes_enabled") == True
        print("Quotes feature flag toggled ON successfully")


class TestBillingEndpointsForQuotes:
    """Test billing endpoints used by quote builder"""
    
    def test_billing_products(self, auth_headers):
        """GET /api/billing/products - Get products for quote builder"""
        response = requests.get(f"{BASE_URL}/api/billing/products", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"Billing products endpoint returns {len(data['products'])} products")
    
    def test_billing_services(self, auth_headers):
        """GET /api/billing/services - Get services for quote builder"""
        response = requests.get(f"{BASE_URL}/api/billing/services", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "services" in data
        print(f"Billing services endpoint returns {len(data['services'])} services")


class TestQuoteWorkspaceLead:
    """Test quote workspace lead endpoint"""
    
    def test_get_or_create_workspace_lead(self, auth_headers):
        """GET /api/quotes/workspace-lead - Get or create workspace lead for full quote builder"""
        response = requests.get(f"{BASE_URL}/api/quotes/workspace-lead", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "lead_id" in data
        print(f"Workspace lead ID: {data['lead_id']}")
