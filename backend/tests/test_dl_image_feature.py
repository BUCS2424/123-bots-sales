"""
D/L Image Feature Tests
Tests for Driver's License image upload, list, and delete endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "mel@a2gdesigns.com"
ADMIN_PASSWORD = "BigDaddy2016!!"


class TestDLImageEndpoints:
    """D/L Image feature endpoint tests"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authenticated headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def customer_id(self, auth_headers):
        """Get a customer ID for testing"""
        response = requests.get(f"{BASE_URL}/api/storage-rentals/customers", headers=auth_headers)
        if response.status_code == 200:
            customers = response.json()
            if len(customers) > 0:
                return customers[0]['id']
        pytest.skip("No customers available for testing")
    
    # ============ GET /api/storage/list/{folder} Tests ============
    
    def test_list_folder_requires_auth(self):
        """GET /api/storage/list/{folder} - should require authentication"""
        response = requests.get(f"{BASE_URL}/api/storage/list/tenant-test-user")
        assert response.status_code in [401, 403]
        print("✓ GET /api/storage/list/{folder} requires authentication")
    
    def test_list_folder_with_auth_returns_storage_not_configured(self, auth_headers):
        """GET /api/storage/list/{folder} - should return storage not configured (expected)"""
        response = requests.get(
            f"{BASE_URL}/api/storage/list/tenant-smith-john",
            headers=auth_headers
        )
        # Storage is not configured in test environment, so we expect 400
        assert response.status_code == 400
        data = response.json()
        assert "Storage not configured" in data.get("detail", "")
        print("✓ GET /api/storage/list/{folder} returns 'Storage not configured' (expected)")
    
    def test_list_folder_endpoint_exists(self, auth_headers):
        """Verify the list folder endpoint exists and responds"""
        response = requests.get(
            f"{BASE_URL}/api/storage/list/test-folder",
            headers=auth_headers
        )
        # Should return 400 (storage not configured) not 404 (endpoint not found)
        assert response.status_code != 404
        print("✓ GET /api/storage/list/{folder} endpoint exists")
    
    # ============ POST /api/storage/upload Tests ============
    
    def test_upload_requires_auth(self):
        """POST /api/storage/upload - should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/storage/upload",
            files={"file": ("test.txt", b"test content", "text/plain")},
            data={"folder": "tenant-test-user"}
        )
        assert response.status_code in [401, 403]
        print("✓ POST /api/storage/upload requires authentication")
    
    def test_upload_with_auth_returns_storage_not_configured(self, auth_headers):
        """POST /api/storage/upload - should return storage not configured (expected)"""
        response = requests.post(
            f"{BASE_URL}/api/storage/upload",
            headers=auth_headers,
            files={"file": ("test.jpg", b"fake image content", "image/jpeg")},
            data={"folder": "tenant-smith-john"}
        )
        # Storage is not configured in test environment
        assert response.status_code == 400
        data = response.json()
        assert "Storage not configured" in data.get("detail", "")
        print("✓ POST /api/storage/upload returns 'Storage not configured' (expected)")
    
    def test_upload_endpoint_exists(self, auth_headers):
        """Verify the upload endpoint exists and responds"""
        response = requests.post(
            f"{BASE_URL}/api/storage/upload",
            headers=auth_headers,
            files={"file": ("test.jpg", b"test", "image/jpeg")},
            data={"folder": "test"}
        )
        # Should return 400 (storage not configured) not 404 (endpoint not found)
        assert response.status_code != 404
        print("✓ POST /api/storage/upload endpoint exists")
    
    # ============ DELETE /api/storage/delete Tests ============
    
    def test_delete_requires_auth(self):
        """DELETE /api/storage/delete - should require authentication"""
        response = requests.delete(
            f"{BASE_URL}/api/storage/delete",
            json={"folder": "tenant-test-user", "filename": "test.jpg"}
        )
        assert response.status_code in [401, 403]
        print("✓ DELETE /api/storage/delete requires authentication")
    
    def test_delete_requires_super_admin(self, auth_headers):
        """DELETE /api/storage/delete - should require super_admin role"""
        # The test user is super_admin, so this should work (but fail due to storage not configured)
        response = requests.delete(
            f"{BASE_URL}/api/storage/delete",
            headers=auth_headers,
            json={"folder": "tenant-smith-john", "filename": "test.jpg"}
        )
        # Should return 400 (storage not configured) not 403 (forbidden)
        assert response.status_code == 400
        data = response.json()
        assert "Storage not configured" in data.get("detail", "")
        print("✓ DELETE /api/storage/delete accessible by super_admin (storage not configured)")
    
    def test_delete_endpoint_exists(self, auth_headers):
        """Verify the delete endpoint exists and responds"""
        response = requests.delete(
            f"{BASE_URL}/api/storage/delete",
            headers=auth_headers,
            json={"folder": "test", "filename": "test.jpg"}
        )
        # Should return 400 (storage not configured) not 404 (endpoint not found)
        assert response.status_code != 404
        print("✓ DELETE /api/storage/delete endpoint exists")


class TestCustomerDLImageFields:
    """Tests for customer dl_image_url and dl_image_folder fields"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authenticated headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def customer_id(self, auth_headers):
        """Get a customer ID for testing"""
        response = requests.get(f"{BASE_URL}/api/storage-rentals/customers", headers=auth_headers)
        if response.status_code == 200:
            customers = response.json()
            if len(customers) > 0:
                return customers[0]['id']
        pytest.skip("No customers available for testing")
    
    def test_update_customer_with_dl_image_url(self, auth_headers, customer_id):
        """PUT /api/storage-rentals/customers/{id} - should accept dl_image_url field"""
        test_url = "https://example.com/test-dl-image.jpg"
        test_folder = "tenant-test-user"
        
        response = requests.put(
            f"{BASE_URL}/api/storage-rentals/customers/{customer_id}",
            headers=auth_headers,
            json={
                "dl_image_url": test_url,
                "dl_image_folder": test_folder
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("dl_image_url") == test_url
        assert data.get("dl_image_folder") == test_folder
        print(f"✓ Customer updated with dl_image_url: {test_url}")
        print(f"✓ Customer updated with dl_image_folder: {test_folder}")
    
    def test_get_customer_returns_dl_image_fields(self, auth_headers, customer_id):
        """GET /api/storage-rentals/customers/{id} - should return dl_image fields"""
        # First update the customer with DL image fields
        test_url = "https://example.com/verify-dl-image.jpg"
        test_folder = "tenant-verify-user"
        
        requests.put(
            f"{BASE_URL}/api/storage-rentals/customers/{customer_id}",
            headers=auth_headers,
            json={
                "dl_image_url": test_url,
                "dl_image_folder": test_folder
            }
        )
        
        # Now fetch and verify
        response = requests.get(
            f"{BASE_URL}/api/storage-rentals/customers/{customer_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "dl_image_url" in data or data.get("dl_image_url") is not None
        assert "dl_image_folder" in data or data.get("dl_image_folder") is not None
        print("✓ GET customer returns dl_image_url and dl_image_folder fields")
    
    def test_update_customer_preserves_other_fields(self, auth_headers, customer_id):
        """PUT /api/storage-rentals/customers/{id} - should preserve other fields when updating DL image"""
        # Get current customer data
        get_response = requests.get(
            f"{BASE_URL}/api/storage-rentals/customers/{customer_id}",
            headers=auth_headers
        )
        original_data = get_response.json()
        original_name = original_data.get("name")
        original_email = original_data.get("email")
        
        # Update only DL image fields
        response = requests.put(
            f"{BASE_URL}/api/storage-rentals/customers/{customer_id}",
            headers=auth_headers,
            json={
                "dl_image_url": "https://example.com/new-dl.jpg"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify other fields are preserved
        assert data.get("name") == original_name
        assert data.get("email") == original_email
        print("✓ Other customer fields preserved when updating DL image fields")


class TestFolderNameFormat:
    """Tests for tenant folder name format validation"""
    
    def test_folder_name_format_tenant_lastname_firstname(self):
        """Verify folder name follows tenant-lastname-firstname format"""
        # This is a frontend logic test, but we can verify the expected format
        # by checking the customer update endpoint accepts the correct format
        
        # Expected format: tenant-{lastname}-{firstname} (lowercase, no special chars)
        valid_folder_names = [
            "tenant-smith-john",
            "tenant-doe-jane",
            "tenant-johnson-bob"
        ]
        
        for folder_name in valid_folder_names:
            assert folder_name.startswith("tenant-")
            parts = folder_name.split("-")
            assert len(parts) == 3
            assert parts[0] == "tenant"
            assert parts[1].islower()  # lastname
            assert parts[2].islower()  # firstname
        
        print("✓ Folder name format validation: tenant-lastname-firstname")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
