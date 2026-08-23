"""
Test Site Settings Feature (General Settings)
Tests admin site settings API and public settings endpoint for logo, favicon, maintenance mode, debug mode.
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "super@amino.com"
ADMIN_PASSWORD = "peptides"


class TestPublicSiteSettings:
    """Tests for public site settings endpoint (no auth required)"""

    def test_get_public_site_settings(self):
        """GET /api/settings/site - Returns public site settings"""
        response = requests.get(f"{BASE_URL}/api/settings/site")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Check required fields exist
        assert "site_name" in data, "site_name field missing"
        assert "logo_url" in data, "logo_url field missing"
        assert "favicon_url" in data, "favicon_url field missing"
        assert "maintenance_mode" in data, "maintenance_mode field missing"
        assert "debug_mode" in data, "debug_mode field missing"
        
        # Check data types
        assert isinstance(data["site_name"], str), "site_name should be string"
        assert isinstance(data["maintenance_mode"], bool), "maintenance_mode should be boolean"
        assert isinstance(data["debug_mode"], bool), "debug_mode should be boolean"
        print(f"Public site settings: site_name={data['site_name']}, maintenance_mode={data['maintenance_mode']}, debug_mode={data['debug_mode']}")

    def test_public_site_settings_has_default_logo(self):
        """Verify public site settings returns a valid logo URL"""
        response = requests.get(f"{BASE_URL}/api/settings/site")
        assert response.status_code == 200
        
        data = response.json()
        logo_url = data.get("logo_url", "")
        
        # Logo URL should either be empty or a valid URL
        if logo_url:
            assert logo_url.startswith("http"), f"logo_url should be a valid URL, got: {logo_url}"
        print(f"Logo URL: {logo_url or '(not set)'}")


class TestAdminSiteSettings:
    """Tests for admin site settings endpoints (requires auth)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        # Login as admin
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip(f"Admin login failed: {login_response.text}")
        
        self.token = login_response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        print(f"Logged in as {ADMIN_EMAIL}")

    def test_get_admin_site_settings(self):
        """GET /api/admin-settings/site - Returns full site settings for admin"""
        response = requests.get(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Admin endpoint should include all fields
        expected_fields = ["site_name", "site_url", "logo_url", "favicon_url", 
                         "admin_email", "support_email", "maintenance_mode", "debug_mode"]
        
        for field in expected_fields:
            assert field in data, f"Field '{field}' missing from admin response"
        
        print(f"Admin site settings retrieved successfully: {len(data)} fields")

    def test_update_site_name(self):
        """PUT /api/admin-settings/site - Update site name"""
        # Get current settings
        get_response = requests.get(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers
        )
        original_settings = get_response.json()
        
        # Update site name
        test_site_name = "TEST_123 Bots"
        updated_settings = {
            **original_settings,
            "site_name": test_site_name
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers,
            json=updated_settings
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        # Verify change persisted
        verify_response = requests.get(f"{BASE_URL}/api/settings/site")
        assert verify_response.json()["site_name"] == test_site_name
        print(f"Site name updated to: {test_site_name}")
        
        # Restore original
        original_settings["site_name"] = "123 Bots"
        requests.put(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers,
            json=original_settings
        )

    def test_update_logo_url(self):
        """PUT /api/admin-settings/site - Update logo URL"""
        get_response = requests.get(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers
        )
        original_settings = get_response.json()
        
        # Update logo URL
        test_logo = "https://test-logo.example.com/logo.png"
        updated_settings = {
            **original_settings,
            "logo_url": test_logo
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers,
            json=updated_settings
        )
        assert update_response.status_code == 200
        
        # Verify via public endpoint
        verify_response = requests.get(f"{BASE_URL}/api/settings/site")
        assert verify_response.json()["logo_url"] == test_logo
        print(f"Logo URL updated successfully")
        
        # Restore original
        requests.put(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers,
            json=original_settings
        )

    def test_update_favicon_url(self):
        """PUT /api/admin-settings/site - Update favicon URL"""
        get_response = requests.get(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers
        )
        original_settings = get_response.json()
        
        # Update favicon URL
        test_favicon = "https://test-favicon.example.com/favicon.ico"
        updated_settings = {
            **original_settings,
            "favicon_url": test_favicon
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers,
            json=updated_settings
        )
        assert update_response.status_code == 200
        
        # Verify via public endpoint
        verify_response = requests.get(f"{BASE_URL}/api/settings/site")
        assert verify_response.json()["favicon_url"] == test_favicon
        print(f"Favicon URL updated successfully")
        
        # Restore original
        requests.put(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers,
            json=original_settings
        )

    def test_toggle_maintenance_mode(self):
        """PUT /api/admin-settings/site - Toggle maintenance mode"""
        get_response = requests.get(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers
        )
        original_settings = get_response.json()
        original_mode = original_settings.get("maintenance_mode", False)
        
        # Toggle maintenance mode
        updated_settings = {
            **original_settings,
            "maintenance_mode": not original_mode
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers,
            json=updated_settings
        )
        assert update_response.status_code == 200
        
        # Verify via public endpoint
        verify_response = requests.get(f"{BASE_URL}/api/settings/site")
        assert verify_response.json()["maintenance_mode"] == (not original_mode)
        print(f"Maintenance mode toggled: {original_mode} -> {not original_mode}")
        
        # Restore original (IMPORTANT: always restore maintenance_mode to false)
        original_settings["maintenance_mode"] = False
        requests.put(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers,
            json=original_settings
        )
        print("Maintenance mode restored to FALSE")

    def test_toggle_debug_mode(self):
        """PUT /api/admin-settings/site - Toggle debug mode"""
        get_response = requests.get(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers
        )
        original_settings = get_response.json()
        original_mode = original_settings.get("debug_mode", False)
        
        # Toggle debug mode
        updated_settings = {
            **original_settings,
            "debug_mode": not original_mode
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers,
            json=updated_settings
        )
        assert update_response.status_code == 200
        
        # Verify via public endpoint
        verify_response = requests.get(f"{BASE_URL}/api/settings/site")
        assert verify_response.json()["debug_mode"] == (not original_mode)
        print(f"Debug mode toggled: {original_mode} -> {not original_mode}")
        
        # Restore original
        original_settings["debug_mode"] = False
        requests.put(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers,
            json=original_settings
        )

    def test_update_contact_emails(self):
        """PUT /api/admin-settings/site - Update admin and support emails"""
        get_response = requests.get(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers
        )
        original_settings = get_response.json()
        
        # Update emails
        updated_settings = {
            **original_settings,
            "admin_email": "test-admin@123bots.com",
            "support_email": "test-support@123bots.com"
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers,
            json=updated_settings
        )
        assert update_response.status_code == 200
        
        # Verify via admin endpoint
        verify_response = requests.get(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers
        )
        data = verify_response.json()
        assert data["admin_email"] == "test-admin@123bots.com"
        assert data["support_email"] == "test-support@123bots.com"
        print("Contact emails updated successfully")
        
        # Restore original
        requests.put(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers,
            json=original_settings
        )

    def test_settings_persistence(self):
        """Verify settings persist across multiple requests"""
        # Save specific values
        test_settings = {
            "site_name": "TEST_Persistence Check",
            "site_url": "https://test-persistence.com",
            "logo_url": "https://test-persistence.com/logo.png",
            "favicon_url": "https://test-persistence.com/favicon.ico",
            "admin_email": "persist-admin@test.com",
            "support_email": "persist-support@test.com",
            "maintenance_mode": False,
            "debug_mode": False
        }
        
        # Save
        update_response = requests.put(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers,
            json=test_settings
        )
        assert update_response.status_code == 200
        
        # Wait briefly
        time.sleep(0.5)
        
        # Verify all fields persisted
        verify_response = requests.get(f"{BASE_URL}/api/settings/site")
        data = verify_response.json()
        
        assert data["site_name"] == test_settings["site_name"]
        assert data["logo_url"] == test_settings["logo_url"]
        assert data["favicon_url"] == test_settings["favicon_url"]
        assert data["maintenance_mode"] == test_settings["maintenance_mode"]
        assert data["debug_mode"] == test_settings["debug_mode"]
        print("Settings persistence verified successfully")
        
        # Restore defaults
        default_settings = {
            "site_name": "123 Bots",
            "site_url": "https://example.com",
            "logo_url": "https://example.com/test-logo.png",
            "favicon_url": "",
            "admin_email": "",
            "support_email": "",
            "maintenance_mode": False,
            "debug_mode": False
        }
        requests.put(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers,
            json=default_settings
        )


class TestMaintenanceModeEffect:
    """Test maintenance mode behavior on public access"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip(f"Admin login failed: {login_response.text}")
        
        self.token = login_response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_maintenance_mode_flag_returned_correctly(self):
        """Verify maintenance_mode flag is returned correctly from API"""
        # Get current settings
        response = requests.get(f"{BASE_URL}/api/settings/site")
        assert response.status_code == 200
        
        data = response.json()
        maintenance_mode = data.get("maintenance_mode")
        
        assert isinstance(maintenance_mode, bool), "maintenance_mode should be boolean"
        print(f"Current maintenance_mode: {maintenance_mode}")

    def test_admin_can_access_settings_regardless_of_maintenance_mode(self):
        """Admin should always be able to access settings endpoints"""
        # Enable maintenance mode
        get_response = requests.get(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers
        )
        settings = get_response.json()
        
        # Set maintenance mode true
        settings["maintenance_mode"] = True
        requests.put(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers,
            json=settings
        )
        
        # Admin should still access settings
        admin_response = requests.get(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers
        )
        assert admin_response.status_code == 200, "Admin should access settings during maintenance"
        print("Admin can access settings during maintenance mode")
        
        # Restore
        settings["maintenance_mode"] = False
        requests.put(
            f"{BASE_URL}/api/admin-settings/site",
            headers=self.headers,
            json=settings
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
