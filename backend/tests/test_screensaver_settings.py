"""
Test Suite for Screensaver Settings API
Tests GET/PUT /api/admin-settings/screensaver endpoints
Requires admin authentication
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "super@amino.com"
ADMIN_PASSWORD = "peptides"

class TestScreensaverSettings:
    """Screensaver settings API tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
        data = response.json()
        token = data.get("token") or data.get("access_token")
        if not token:
            pytest.skip("No token in login response")
        return token
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_get_screensaver_settings_requires_auth(self):
        """GET /api/admin-settings/screensaver requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin-settings/screensaver")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET screensaver settings requires auth")
    
    def test_get_screensaver_settings_with_auth(self, auth_headers):
        """GET /api/admin-settings/screensaver returns settings with auth"""
        response = requests.get(
            f"{BASE_URL}/api/admin-settings/screensaver",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "image_a_url" in data, "Missing image_a_url in response"
        assert "image_b_url" in data, "Missing image_b_url in response"
        assert "image_a_count" in data, "Missing image_a_count in response"
        assert "image_b_count" in data, "Missing image_b_count in response"
        assert "video_url" in data, "Missing video_url in response"
        
        # Verify data types
        assert isinstance(data["image_a_count"], int), "image_a_count should be int"
        assert isinstance(data["image_b_count"], int), "image_b_count should be int"
        
        print(f"PASS: GET screensaver settings returns valid data: {data}")
    
    def test_put_screensaver_settings_requires_auth(self):
        """PUT /api/admin-settings/screensaver requires authentication"""
        response = requests.put(
            f"{BASE_URL}/api/admin-settings/screensaver",
            json={"image_a_count": 10}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: PUT screensaver settings requires auth")
    
    def test_put_screensaver_settings_with_auth(self, auth_headers):
        """PUT /api/admin-settings/screensaver updates settings"""
        # Test data
        test_settings = {
            "image_a_url": "https://example.com/test-image-a.png",
            "image_b_url": "https://example.com/test-image-b.png",
            "image_a_count": 20,
            "image_b_count": 25,
            "video_url": "https://example.com/test-video.mp4"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin-settings/screensaver",
            headers=auth_headers,
            json=test_settings
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        
        # Verify saved values in response
        assert data.get("image_a_count") == 20, "image_a_count not saved correctly"
        assert data.get("image_b_count") == 25, "image_b_count not saved correctly"
        
        print(f"PASS: PUT screensaver settings updates and returns: {data}")
    
    def test_put_and_get_persistence(self, auth_headers):
        """Verify PUT changes persist when fetched with GET"""
        # Update settings
        test_settings = {
            "image_a_url": "https://persist-test.com/image-a.png",
            "image_b_url": "https://persist-test.com/image-b.png",
            "image_a_count": 12,
            "image_b_count": 18,
            "video_url": "https://persist-test.com/video.mp4"
        }
        
        put_response = requests.put(
            f"{BASE_URL}/api/admin-settings/screensaver",
            headers=auth_headers,
            json=test_settings
        )
        assert put_response.status_code == 200, f"PUT failed: {put_response.text}"
        
        # Verify with GET
        get_response = requests.get(
            f"{BASE_URL}/api/admin-settings/screensaver",
            headers=auth_headers
        )
        assert get_response.status_code == 200, f"GET failed: {get_response.text}"
        
        data = get_response.json()
        assert data["image_a_url"] == test_settings["image_a_url"], "image_a_url not persisted"
        assert data["image_b_url"] == test_settings["image_b_url"], "image_b_url not persisted"
        assert data["image_a_count"] == test_settings["image_a_count"], "image_a_count not persisted"
        assert data["image_b_count"] == test_settings["image_b_count"], "image_b_count not persisted"
        assert data["video_url"] == test_settings["video_url"], "video_url not persisted"
        
        print(f"PASS: Settings persisted correctly: {data}")
    
    def test_count_clamping_min(self, auth_headers):
        """Verify image counts are clamped to minimum 0"""
        test_settings = {
            "image_a_count": -5,
            "image_b_count": -10,
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin-settings/screensaver",
            headers=auth_headers,
            json=test_settings
        )
        assert response.status_code == 200
        
        data = response.json()
        # Backend should clamp to 0
        assert data.get("image_a_count", 0) >= 0, "image_a_count should be clamped to >= 0"
        assert data.get("image_b_count", 0) >= 0, "image_b_count should be clamped to >= 0"
        
        print(f"PASS: Negative counts clamped correctly")
    
    def test_count_clamping_max(self, auth_headers):
        """Verify image counts are clamped to maximum 60"""
        test_settings = {
            "image_a_count": 100,
            "image_b_count": 150,
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin-settings/screensaver",
            headers=auth_headers,
            json=test_settings
        )
        assert response.status_code == 200
        
        data = response.json()
        # Backend should clamp to 60
        assert data.get("image_a_count", 100) <= 60, "image_a_count should be clamped to <= 60"
        assert data.get("image_b_count", 100) <= 60, "image_b_count should be clamped to <= 60"
        
        print(f"PASS: Excessive counts clamped correctly")
    
    def test_restore_default_settings(self, auth_headers):
        """Restore default settings after tests"""
        default_settings = {
            "image_a_url": "https://customer-assets.emergentagent.com/job_65c71db2-9245-43b1-9627-564f71a23c40/artifacts/2mxzmwy8_logo-bubble-for-sleep-screen.png",
            "image_b_url": "https://customer-assets.emergentagent.com/job_65c71db2-9245-43b1-9627-564f71a23c40/artifacts/71zcw0f9_logo-bubble-for-sleep-screen-2.png",
            "image_a_count": 15,
            "image_b_count": 15,
            "video_url": "https://customer-assets.emergentagent.com/job_35efb418-d957-4303-979f-4e5863096b08/artifacts/kkprzbrk_amino-chain-peptides.mov"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin-settings/screensaver",
            headers=auth_headers,
            json=default_settings
        )
        assert response.status_code == 200, f"Failed to restore defaults: {response.text}"
        print("PASS: Restored default screensaver settings")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
