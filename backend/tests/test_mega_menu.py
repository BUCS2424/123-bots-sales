"""
Test Mega Menu Feature - CRUD operations and public navigation API
Tests admin endpoints and public navigation for mega menu items
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bot-quote-builder.preview.emergentagent.com')

# Test admin credentials
ADMIN_EMAIL = "test@emergent.dev"
ADMIN_PASSWORD = "TestAdmin123!"

class TestMegaMenuPublicAPI:
    """Test public mega menu navigation API (no auth required)"""
    
    def test_public_navigation_returns_200(self):
        """Public navigation endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/public/mega-menu/navigation")
        assert response.status_code == 200
        print(f"Public navigation returned status: {response.status_code}")
    
    def test_public_navigation_returns_menu_array(self):
        """Public navigation should return menu array"""
        response = requests.get(f"{BASE_URL}/api/public/mega-menu/navigation")
        assert response.status_code == 200
        data = response.json()
        assert "menu" in data
        assert isinstance(data["menu"], list)
        print(f"Menu contains {len(data['menu'])} items")
    
    def test_public_navigation_menu_item_structure(self):
        """Menu items should have expected structure"""
        response = requests.get(f"{BASE_URL}/api/public/mega-menu/navigation")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["menu"]) > 0:
            item = data["menu"][0]
            # Check required fields
            assert "id" in item
            assert "label" in item
            assert "url" in item
            assert "is_active" in item
            print(f"First menu item: {item['label']} -> {item['url']}")
        else:
            print("No menu items found - empty menu")


class TestMegaMenuAdminAPI:
    """Test admin mega menu CRUD operations (auth required)"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Auth failed: {response.status_code}")
        token = response.json().get("access_token")
        assert token, "No token received"
        print(f"Admin login successful")
        return token
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Auth headers for API calls"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_get_menu_items_requires_auth(self):
        """GET /api/mega-menu/items should require authentication"""
        response = requests.get(f"{BASE_URL}/api/mega-menu/items")
        assert response.status_code == 401
        print("Correctly requires auth for admin endpoints")
    
    def test_get_menu_items_with_auth(self, auth_headers):
        """GET /api/mega-menu/items should return items with auth"""
        response = requests.get(
            f"{BASE_URL}/api/mega-menu/items",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
        print(f"Admin view: {len(data['items'])} menu items")
    
    def test_create_menu_item(self, auth_headers):
        """POST /api/mega-menu/items should create new menu item"""
        test_item = {
            "label": f"TEST_MenuItem_{uuid.uuid4().hex[:8]}",
            "icon": "Tag",
            "url": "/test-menu-item",
            "description": "Test menu item description",
            "open_in_new_tab": False,
            "is_active": True,
            "column": 0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mega-menu/items",
            headers=auth_headers,
            json=test_item
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "item" in data
        assert data["item"]["label"] == test_item["label"]
        assert data["item"]["url"] == test_item["url"]
        print(f"Created menu item: {data['item']['id']}")
        
        # Store for cleanup
        return data["item"]["id"]
    
    def test_create_menu_item_with_seo(self, auth_headers):
        """POST /api/mega-menu/items with SEO settings"""
        test_item = {
            "label": f"TEST_SEO_{uuid.uuid4().hex[:8]}",
            "icon": "Link",
            "url": "/test-seo-item",
            "description": "Test SEO item",
            "is_active": True,
            "seo": {
                "page_title": "Test Page Title",
                "slug": "test-seo-slug",
                "meta_description": "This is a test meta description",
                "meta_keywords": "test, seo, keywords",
                "robots_directive": "index, follow"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mega-menu/items",
            headers=auth_headers,
            json=test_item
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data["item"]["seo"] is not None
        assert data["item"]["seo"]["page_title"] == "Test Page Title"
        print(f"Created menu item with SEO: {data['item']['id']}")
    
    def test_create_submenu_item(self, auth_headers):
        """Create a submenu item under a parent"""
        # First create parent
        parent_item = {
            "label": f"TEST_Parent_{uuid.uuid4().hex[:8]}",
            "icon": "FolderTree",
            "url": "/test-parent",
            "is_active": True
        }
        parent_resp = requests.post(
            f"{BASE_URL}/api/mega-menu/items",
            headers=auth_headers,
            json=parent_item
        )
        assert parent_resp.status_code == 200
        parent_id = parent_resp.json()["item"]["id"]
        print(f"Created parent: {parent_id}")
        
        # Now create child
        child_item = {
            "label": f"TEST_Child_{uuid.uuid4().hex[:8]}",
            "icon": "Link",
            "url": "/test-child",
            "parent_id": parent_id,
            "is_active": True
        }
        child_resp = requests.post(
            f"{BASE_URL}/api/mega-menu/items",
            headers=auth_headers,
            json=child_item
        )
        assert child_resp.status_code == 200
        assert child_resp.json()["item"]["parent_id"] == parent_id
        print(f"Created child under parent: {child_resp.json()['item']['id']}")
    
    def test_update_menu_item(self, auth_headers):
        """PUT /api/mega-menu/items/{id} should update item"""
        # Create item first
        create_resp = requests.post(
            f"{BASE_URL}/api/mega-menu/items",
            headers=auth_headers,
            json={
                "label": f"TEST_Update_{uuid.uuid4().hex[:8]}",
                "url": "/test-update",
                "is_active": True
            }
        )
        item_id = create_resp.json()["item"]["id"]
        
        # Update it
        update_resp = requests.put(
            f"{BASE_URL}/api/mega-menu/items/{item_id}",
            headers=auth_headers,
            json={
                "label": "UPDATED_Label",
                "description": "Updated description"
            }
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["item"]["label"] == "UPDATED_Label"
        print(f"Updated menu item: {item_id}")
    
    def test_delete_menu_item(self, auth_headers):
        """DELETE /api/mega-menu/items/{id} should delete item"""
        # Create item first
        create_resp = requests.post(
            f"{BASE_URL}/api/mega-menu/items",
            headers=auth_headers,
            json={
                "label": f"TEST_Delete_{uuid.uuid4().hex[:8]}",
                "url": "/test-delete",
                "is_active": True
            }
        )
        item_id = create_resp.json()["item"]["id"]
        
        # Delete it
        delete_resp = requests.delete(
            f"{BASE_URL}/api/mega-menu/items/{item_id}",
            headers=auth_headers
        )
        assert delete_resp.status_code == 200
        assert delete_resp.json()["success"] == True
        print(f"Deleted menu item: {item_id}")
        
        # Verify deletion
        get_resp = requests.get(
            f"{BASE_URL}/api/mega-menu/items",
            headers=auth_headers
        )
        items = get_resp.json()["items"]
        assert not any(i["id"] == item_id for i in items)
        print("Verified item was deleted")
    
    def test_get_categories_for_linking(self, auth_headers):
        """GET /api/mega-menu/categories should return categories"""
        response = requests.get(
            f"{BASE_URL}/api/mega-menu/categories",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert "categories" in response.json()
        print(f"Categories available: {len(response.json()['categories'])}")
    
    def test_get_pages_for_linking(self, auth_headers):
        """GET /api/mega-menu/pages should return static pages"""
        response = requests.get(
            f"{BASE_URL}/api/mega-menu/pages",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "pages" in data
        assert len(data["pages"]) > 0
        print(f"Available pages: {[p['name'] for p in data['pages']]}")


class TestMegaMenuCleanup:
    """Cleanup TEST_ prefixed items after tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Auth failed: {response.status_code}")
        return response.json().get("token")
    
    def test_cleanup_test_items(self, auth_token):
        """Delete all TEST_ prefixed menu items"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get all items
        get_resp = requests.get(f"{BASE_URL}/api/mega-menu/items", headers=headers)
        if get_resp.status_code != 200:
            pytest.skip("Could not fetch items for cleanup")
        
        items = get_resp.json()["items"]
        test_items = [i for i in items if i["label"].startswith("TEST_")]
        
        deleted_count = 0
        for item in test_items:
            del_resp = requests.delete(
                f"{BASE_URL}/api/mega-menu/items/{item['id']}",
                headers=headers
            )
            if del_resp.status_code == 200:
                deleted_count += 1
        
        print(f"Cleanup: Deleted {deleted_count} test items")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
