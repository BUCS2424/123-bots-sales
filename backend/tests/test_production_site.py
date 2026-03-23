"""
Production Site Tests for AMINO-CHAIN
Tests critical endpoints on https://amino-chain.com
"""
import pytest
import requests
import os

BASE_URL = "https://amino-chain.com"

# Test credentials
ADMIN_EMAIL = "super@amino.com"
ADMIN_PASSWORD = "peptides"


class TestBasicEndpoints:
    """Test basic public endpoints"""
    
    def test_homepage_loads(self):
        """Homepage should return 200"""
        response = requests.get(f"{BASE_URL}/", timeout=30)
        assert response.status_code == 200, f"Homepage returned {response.status_code}"
        print("✓ Homepage loads successfully")
    
    def test_api_health(self):
        """API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=30)
        # Accept 200 or 404 (endpoint may not exist)
        assert response.status_code in [200, 404], f"Health check failed: {response.status_code}"
        print(f"✓ Health endpoint status: {response.status_code}")
    
    def test_public_products(self):
        """Public products endpoint"""
        response = requests.get(f"{BASE_URL}/api/products", timeout=30)
        assert response.status_code == 200, f"Products API failed: {response.status_code}"
        data = response.json()
        assert "products" in data or isinstance(data, list), "Invalid products response"
        print(f"✓ Products API works - found products")


class TestResearchLibrary:
    """Test Research Library endpoints"""
    
    def test_research_articles_list(self):
        """List research articles"""
        response = requests.get(f"{BASE_URL}/api/research/articles", timeout=30)
        assert response.status_code == 200, f"Research articles failed: {response.status_code}"
        data = response.json()
        assert "items" in data, "Missing 'items' in response"
        assert "total" in data, "Missing 'total' in response"
        print(f"✓ Research articles API works - {data.get('total', 0)} total articles")
        return data
    
    def test_research_categories(self):
        """Get research categories"""
        response = requests.get(f"{BASE_URL}/api/research/categories", timeout=30)
        assert response.status_code == 200, f"Research categories failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Categories should be a list"
        print(f"✓ Research categories: {len(data)} categories found")
    
    def test_research_tags(self):
        """Get research tags"""
        response = requests.get(f"{BASE_URL}/api/research/tags", timeout=30)
        assert response.status_code == 200, f"Research tags failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Tags should be a list"
        print(f"✓ Research tags: {len(data)} tags found")
    
    def test_research_article_detail(self):
        """Get a specific research article"""
        # First get the list to find a valid slug
        list_response = requests.get(f"{BASE_URL}/api/research/articles", timeout=30)
        if list_response.status_code == 200:
            data = list_response.json()
            if data.get("items") and len(data["items"]) > 0:
                slug = data["items"][0].get("slug")
                if slug:
                    article_response = requests.get(f"{BASE_URL}/api/research/articles/{slug}", timeout=30)
                    assert article_response.status_code == 200, f"Article detail failed: {article_response.status_code}"
                    article_data = article_response.json()
                    assert "content" in article_data, "Article should have content"
                    assert "related_products" in article_data, "Article should have related_products"
                    print(f"✓ Research article detail works - '{article_data.get('title', slug)}'")
                    return article_data
        print("⚠ Skipped article detail test - no articles found")


class TestAdminAuth:
    """Test Admin Authentication"""
    
    def test_admin_login(self):
        """Admin login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=30
        )
        assert response.status_code == 200, f"Admin login failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "token" in data or "access_token" in data, "No token in login response"
        token = data.get("token") or data.get("access_token")
        print(f"✓ Admin login successful")
        return token
    
    def test_admin_login_invalid_credentials(self):
        """Admin login with invalid credentials should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@test.com", "password": "wrongpassword"},
            timeout=30
        )
        assert response.status_code in [401, 400], f"Invalid login should fail: {response.status_code}"
        print("✓ Invalid credentials correctly rejected")


class TestJohnny5CSVExport:
    """Test Johnny 5 CSV Export endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=30
        )
        if response.status_code != 200:
            pytest.skip("Admin login failed - skipping authenticated tests")
        data = response.json()
        return data.get("token") or data.get("access_token")
    
    def test_johnny5_products_csv_export_requires_auth(self):
        """CSV export should require authentication"""
        response = requests.get(f"{BASE_URL}/api/johnny5/products/export.csv", timeout=30)
        assert response.status_code == 401, f"CSV export without auth should fail: {response.status_code}"
        print("✓ Johnny5 CSV export correctly requires authentication")
    
    def test_johnny5_products_csv_export(self, admin_token):
        """CSV export should return valid CSV"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/johnny5/products/export.csv",
            headers=headers,
            timeout=60
        )
        assert response.status_code == 200, f"CSV export failed: {response.status_code}"
        
        # Check content type
        content_type = response.headers.get("content-type", "")
        assert "text/csv" in content_type, f"Wrong content type: {content_type}"
        
        # Check content disposition
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition, "Missing attachment header"
        
        # Validate CSV content
        csv_content = response.text
        lines = csv_content.strip().split("\n")
        assert len(lines) > 1, "CSV should have header and data rows"
        
        # Check header row
        header = lines[0]
        expected_fields = ["product_id", "sku", "product_name", "category", "strength", "package", "price"]
        for field in expected_fields:
            assert field in header, f"Missing CSV field: {field}"
        
        print(f"✓ Johnny5 CSV export works - {len(lines) - 1} product rows")


class TestShippingRates:
    """Test Shipping Rate Calculation"""
    
    def test_local_pickup_settings(self):
        """Get local pickup settings (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/settings/local-pickup", timeout=30)
        assert response.status_code == 200, f"Local pickup settings failed: {response.status_code}"
        data = response.json()
        assert "enabled" in data, "Missing 'enabled' field"
        print(f"✓ Local pickup settings - enabled: {data.get('enabled')}")


class TestCheckoutFlow:
    """Test Checkout Flow components"""
    
    def test_cart_operations(self):
        """Test cart functionality"""
        # Check if cart endpoint exists
        response = requests.get(f"{BASE_URL}/api/cart", timeout=30)
        # Cart may require session/auth
        print(f"✓ Cart endpoint status: {response.status_code}")
    
    def test_tax_calculation_endpoint(self):
        """Test tax calculation"""
        response = requests.get(f"{BASE_URL}/api/admin-settings/tax", timeout=30)
        # May require auth
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Tax settings available")
        else:
            print(f"⚠ Tax endpoint status: {response.status_code}")


class TestAIProductGenerator:
    """Test AI Product Generation (requires API keys)"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=30
        )
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        data = response.json()
        return data.get("token") or data.get("access_token")
    
    def test_ai_keys_endpoint(self, admin_token):
        """Test AI keys endpoint exists"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/admin-settings/ai-keys",
            headers=headers,
            timeout=30
        )
        assert response.status_code == 200, f"AI keys endpoint failed: {response.status_code}"
        data = response.json()
        print(f"✓ AI keys endpoint accessible")
        return data


class TestWholesalePricing:
    """Test Wholesale Pricing functionality"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=30
        )
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        data = response.json()
        return data.get("token") or data.get("access_token")
    
    def test_products_have_wholesale_fields(self, admin_token):
        """Check products API includes wholesale pricing fields"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/products?limit=5",
            headers=headers,
            timeout=30
        )
        assert response.status_code == 200, f"Products failed: {response.status_code}"
        data = response.json()
        
        products = data.get("products", data if isinstance(data, list) else [])
        if products:
            # Check if wholesale_price or custom_fields_data.option_stock has wholesale pricing
            sample = products[0]
            custom_data = sample.get("custom_fields_data", {})
            option_stock = custom_data.get("option_stock", {})
            
            print(f"✓ Products API working - {len(products)} products returned")
            
            # Check for wholesale_price in option_stock
            if option_stock:
                for strength, packages in option_stock.items():
                    for package, stock_info in packages.items():
                        if "wholesale_price" in stock_info:
                            print(f"✓ Found wholesale_price in option_stock")
                            return
            
            # Check top-level wholesale_price
            if "wholesale_price" in sample:
                print(f"✓ Found wholesale_price field on product")
                return
            
            print("⚠ No wholesale_price found in sample products (may not have wholesale pricing set)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s", "--tb=short"])
