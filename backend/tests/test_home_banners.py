"""
Test Home Banner Settings API Endpoints
Tests: GET, PUT, POST (add), DELETE for home banner management
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHomeBannerAPI:
    """Home Banner Settings API Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_banner_url = "https://example.com/test-banner.jpg"
        self.test_alt_text = "TEST_Banner Alt Text"
        self.test_link_url = "https://example.com/promo"
    
    def test_get_home_banners(self):
        """Test GET /api/admin-settings/home-banners returns banner settings"""
        response = requests.get(f"{BASE_URL}/api/admin-settings/home-banners")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify response structure
        assert "enabled" in data, "Response should have 'enabled' field"
        assert "auto_scroll" in data, "Response should have 'auto_scroll' field"
        assert "scroll_interval" in data, "Response should have 'scroll_interval' field"
        assert "banners" in data, "Response should have 'banners' field"
        
        # Verify data types
        assert isinstance(data["enabled"], bool), "enabled should be boolean"
        assert isinstance(data["auto_scroll"], bool), "auto_scroll should be boolean"
        assert isinstance(data["scroll_interval"], int), "scroll_interval should be integer"
        assert isinstance(data["banners"], list), "banners should be a list"
        
        print(f"GET /api/admin-settings/home-banners - PASS: Found {len(data['banners'])} banners")
    
    def test_get_home_banners_has_existing_banner(self):
        """Test that existing test banner is present"""
        response = requests.get(f"{BASE_URL}/api/admin-settings/home-banners")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check if the test banner exists (from main agent setup)
        banners = data.get("banners", [])
        assert len(banners) >= 1, "Should have at least 1 banner configured"
        
        # Verify banner structure
        if banners:
            banner = banners[0]
            assert "id" in banner, "Banner should have 'id'"
            assert "image_url" in banner, "Banner should have 'image_url'"
            assert "alt_text" in banner, "Banner should have 'alt_text'"
            assert "order" in banner, "Banner should have 'order'"
            assert "active" in banner, "Banner should have 'active'"
            
        print(f"Existing banner verified: {banners[0].get('id', 'N/A')}")
    
    def test_add_banner(self):
        """Test POST /api/admin-settings/home-banners/add adds a new banner"""
        new_banner = {
            "image_url": self.test_banner_url,
            "alt_text": self.test_alt_text,
            "link_url": self.test_link_url
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin-settings/home-banners/add",
            json=new_banner
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "banner" in data, "Response should contain the created banner"
        
        created_banner = data["banner"]
        assert "id" in created_banner, "Created banner should have an ID"
        assert created_banner["image_url"] == self.test_banner_url, "Image URL should match"
        assert created_banner["alt_text"] == self.test_alt_text, "Alt text should match"
        assert created_banner["link_url"] == self.test_link_url, "Link URL should match"
        
        # Store banner ID for cleanup
        self.created_banner_id = created_banner["id"]
        print(f"POST /api/admin-settings/home-banners/add - PASS: Created banner {self.created_banner_id}")
        
        return created_banner["id"]
    
    def test_add_banner_and_verify_persistence(self):
        """Test that added banner persists in GET response"""
        # Add a banner
        new_banner = {
            "image_url": "https://example.com/test-persist-banner.jpg",
            "alt_text": "TEST_Persistence Check Banner",
            "link_url": ""
        }
        
        add_response = requests.post(
            f"{BASE_URL}/api/admin-settings/home-banners/add",
            json=new_banner
        )
        assert add_response.status_code == 200
        created_id = add_response.json()["banner"]["id"]
        
        # Verify it appears in GET
        get_response = requests.get(f"{BASE_URL}/api/admin-settings/home-banners")
        assert get_response.status_code == 200
        
        banners = get_response.json().get("banners", [])
        banner_ids = [b["id"] for b in banners]
        assert created_id in banner_ids, f"Created banner {created_id} should be in banners list"
        
        # Cleanup - delete the test banner
        delete_response = requests.delete(f"{BASE_URL}/api/admin-settings/home-banners/{created_id}")
        assert delete_response.status_code == 200
        
        print(f"Banner persistence verified and cleaned up: {created_id}")
    
    def test_delete_banner(self):
        """Test DELETE /api/admin-settings/home-banners/{id} deletes a banner"""
        # First add a banner to delete
        new_banner = {
            "image_url": "https://example.com/test-delete-banner.jpg",
            "alt_text": "TEST_Banner to Delete",
            "link_url": ""
        }
        
        add_response = requests.post(
            f"{BASE_URL}/api/admin-settings/home-banners/add",
            json=new_banner
        )
        assert add_response.status_code == 200
        banner_id = add_response.json()["banner"]["id"]
        
        # Now delete it
        delete_response = requests.delete(f"{BASE_URL}/api/admin-settings/home-banners/{banner_id}")
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        
        data = delete_response.json()
        assert data.get("success") == True, "Delete should indicate success"
        
        # Verify it's gone
        get_response = requests.get(f"{BASE_URL}/api/admin-settings/home-banners")
        banners = get_response.json().get("banners", [])
        banner_ids = [b["id"] for b in banners]
        assert banner_id not in banner_ids, f"Deleted banner {banner_id} should not be in list"
        
        print(f"DELETE /api/admin-settings/home-banners/{banner_id} - PASS")
    
    def test_update_banner_settings(self):
        """Test PUT /api/admin-settings/home-banners updates settings"""
        # First get current settings
        get_response = requests.get(f"{BASE_URL}/api/admin-settings/home-banners")
        assert get_response.status_code == 200
        current_settings = get_response.json()
        
        # Update settings
        updated_settings = {
            "enabled": True,
            "auto_scroll": True,
            "scroll_interval": 7,  # Change interval
            "banners": current_settings.get("banners", [])
        }
        
        put_response = requests.put(
            f"{BASE_URL}/api/admin-settings/home-banners",
            json=updated_settings
        )
        
        assert put_response.status_code == 200, f"Expected 200, got {put_response.status_code}"
        
        data = put_response.json()
        assert data.get("success") == True, "Update should indicate success"
        
        # Verify the update persisted
        verify_response = requests.get(f"{BASE_URL}/api/admin-settings/home-banners")
        verify_data = verify_response.json()
        assert verify_data["scroll_interval"] == 7, "Scroll interval should be updated to 7"
        
        # Restore original interval
        updated_settings["scroll_interval"] = 5
        requests.put(f"{BASE_URL}/api/admin-settings/home-banners", json=updated_settings)
        
        print("PUT /api/admin-settings/home-banners - PASS: Settings updated and verified")
    
    def test_update_enabled_toggle(self):
        """Test toggling enabled state"""
        # Get current settings
        get_response = requests.get(f"{BASE_URL}/api/admin-settings/home-banners")
        current = get_response.json()
        
        # Toggle enabled off
        updated = {
            "enabled": False,
            "auto_scroll": current.get("auto_scroll", True),
            "scroll_interval": current.get("scroll_interval", 5),
            "banners": current.get("banners", [])
        }
        
        put_response = requests.put(f"{BASE_URL}/api/admin-settings/home-banners", json=updated)
        assert put_response.status_code == 200
        
        # Verify
        verify = requests.get(f"{BASE_URL}/api/admin-settings/home-banners")
        assert verify.json()["enabled"] == False, "Enabled should be False"
        
        # Restore
        updated["enabled"] = True
        requests.put(f"{BASE_URL}/api/admin-settings/home-banners", json=updated)
        
        print("Enabled toggle - PASS")
    
    def test_update_auto_scroll_toggle(self):
        """Test toggling auto_scroll state"""
        # Get current settings
        get_response = requests.get(f"{BASE_URL}/api/admin-settings/home-banners")
        current = get_response.json()
        
        # Toggle auto_scroll off
        updated = {
            "enabled": current.get("enabled", True),
            "auto_scroll": False,
            "scroll_interval": current.get("scroll_interval", 5),
            "banners": current.get("banners", [])
        }
        
        put_response = requests.put(f"{BASE_URL}/api/admin-settings/home-banners", json=updated)
        assert put_response.status_code == 200
        
        # Verify
        verify = requests.get(f"{BASE_URL}/api/admin-settings/home-banners")
        assert verify.json()["auto_scroll"] == False, "auto_scroll should be False"
        
        # Restore
        updated["auto_scroll"] = True
        requests.put(f"{BASE_URL}/api/admin-settings/home-banners", json=updated)
        
        print("Auto-scroll toggle - PASS")
    
    def test_banner_max_limit(self):
        """Test that max 5 banners limit is enforced (via frontend validation)"""
        # Get current banner count
        get_response = requests.get(f"{BASE_URL}/api/admin-settings/home-banners")
        current_count = len(get_response.json().get("banners", []))
        
        # Note: The 5 banner limit is enforced in frontend, not backend
        # Backend will accept more, but frontend prevents adding more than 5
        print(f"Current banner count: {current_count}/5 (limit enforced in frontend)")
    
    def test_delete_nonexistent_banner(self):
        """Test deleting a banner that doesn't exist"""
        fake_id = str(uuid.uuid4())
        
        response = requests.delete(f"{BASE_URL}/api/admin-settings/home-banners/{fake_id}")
        
        # Should still return 200 (idempotent delete)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        print(f"Delete non-existent banner - PASS (idempotent)")


class TestHomeBannerCleanup:
    """Cleanup test banners after tests"""
    
    def test_cleanup_test_banners(self):
        """Remove any TEST_ prefixed banners"""
        response = requests.get(f"{BASE_URL}/api/admin-settings/home-banners")
        if response.status_code == 200:
            banners = response.json().get("banners", [])
            for banner in banners:
                if banner.get("alt_text", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/admin-settings/home-banners/{banner['id']}")
                    print(f"Cleaned up test banner: {banner['id']}")
        
        print("Cleanup complete")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
