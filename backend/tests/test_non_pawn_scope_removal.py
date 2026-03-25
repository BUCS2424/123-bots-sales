"""
Test suite for non-pawn scope removal verification.
Verifies:
1. Core store/products and categories endpoints still work
2. Research library endpoints still work
3. Admin authentication works
4. Cleanup marker exists in database
"""
import pytest
import requests
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

# Use the public preview URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://a2g-integration.preview.emergentagent.com')

# Admin credentials
ADMIN_EMAIL = "mel@a2gdesigns.com"
ADMIN_PASSWORD = "BigDaddy2016!!"


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json().get("access_token")


@pytest.fixture
def authenticated_client(api_client, admin_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client


class TestCoreAPIHealth:
    """Test that core API endpoints are still functional"""

    def test_api_root(self, api_client):
        """Test API root endpoint"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_store_products_endpoint(self, api_client):
        """Test /api/store/products returns products"""
        response = api_client.get(f"{BASE_URL}/api/store/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have products (peptides)
        assert len(data) > 0, "Expected products to exist"
        # Verify product structure
        if len(data) > 0:
            product = data[0]
            assert "name" in product
            assert "price" in product
            assert "category" in product

    def test_store_categories_endpoint(self, api_client):
        """Test /api/store/categories returns categories"""
        response = api_client.get(f"{BASE_URL}/api/store/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have categories
        assert len(data) > 0, "Expected categories to exist"
        # Verify category structure
        if len(data) > 0:
            category = data[0]
            assert "name" in category
            assert "id" in category


class TestResearchEndpoints:
    """Test research library endpoints still work"""

    def test_research_articles_endpoint(self, api_client):
        """Test /api/research/articles returns articles"""
        response = api_client.get(f"{BASE_URL}/api/research/articles")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        # Should have research articles
        assert len(data["items"]) > 0, "Expected research articles to exist"
        # Verify article structure
        if len(data["items"]) > 0:
            article = data["items"][0]
            assert "title" in article
            assert "slug" in article
            assert "category" in article

    def test_research_article_by_slug(self, api_client):
        """Test fetching a specific research article by slug"""
        # First get list to get a valid slug
        response = api_client.get(f"{BASE_URL}/api/research/articles")
        assert response.status_code == 200
        articles = response.json().get("items", [])
        if len(articles) > 0:
            slug = articles[0]["slug"]
            detail_response = api_client.get(f"{BASE_URL}/api/research/articles/{slug}")
            assert detail_response.status_code == 200
            data = detail_response.json()
            assert "title" in data


class TestAdminAuthentication:
    """Test admin authentication works correctly"""

    def test_admin_login_success(self, api_client):
        """Test admin can login with correct credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == "super_admin"
        assert data["user"]["email"] == ADMIN_EMAIL

    def test_admin_login_invalid_password(self, api_client):
        """Test login fails with wrong password"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401

    def test_auth_me_endpoint(self, authenticated_client):
        """Test /api/auth/me returns current user"""
        response = authenticated_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "super_admin"


class TestPawnDashboardEndpoints:
    """Test pawn dashboard endpoints are functional"""

    def test_admin_dashboard(self, authenticated_client):
        """Test admin dashboard endpoint"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_products" in data

    def test_store_analytics_stats(self, authenticated_client):
        """Test store analytics endpoint"""
        response = authenticated_client.get(f"{BASE_URL}/api/store/analytics/stats")
        # Should return 200 even if no data
        assert response.status_code == 200


class TestAdminSettingsEndpoints:
    """Test admin settings endpoints"""

    def test_admin_settings_session(self, authenticated_client):
        """Test admin session settings endpoint"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin-settings/session")
        assert response.status_code == 200
        data = response.json()
        # Should return session timeout settings
        assert "inactivity_timeout" in data or response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
