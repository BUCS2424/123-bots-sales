"""
Test cases for Test Customer Creation and Customer Impersonation features.

Features tested:
- POST /api/admin/customers/create-test - creates default test customer once, no duplicates
- POST /api/admin/customers/{customer_id}/impersonate - impersonate customer user
- Access control: admin/super admin can impersonate; non-admin cannot
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestCustomerImpersonation:
    """Tests for test customer creation and impersonation features."""
    
    @pytest.fixture(scope="class")
    def super_admin_token(self):
        """Authenticate as super admin."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "super@amino.com",
            "password": "peptides"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Super admin authentication failed")

    @pytest.fixture(scope="class")
    def admin_token(self):
        """Try to authenticate as test admin, fallback to super admin."""
        # Try test admin first
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@emergent.dev",
            "password": "TestAdmin123!"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        # Fallback to super admin
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "super@amino.com",
            "password": "peptides"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin authentication failed")
    
    @pytest.fixture(scope="class")
    def headers(self, super_admin_token):
        """Auth headers using super admin token."""
        return {"Authorization": f"Bearer {super_admin_token}"}

    # ============ Test Customer Creation ============
    
    def test_create_test_customer_first_time(self, headers):
        """Test creating test customer - should succeed."""
        response = requests.post(f"{BASE_URL}/api/admin/customers/create-test", json={}, headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] is True
        assert data["email"] == "customer.test@emergent.dev"
        assert data["name"] == "Test Customer"
        assert data["password"] == "TestCustomer123!"
        assert "user_id" in data
        assert "customer_id" in data
        print(f"✓ Test customer created/exists: {data['email']}, created={data['created']}")

    def test_create_test_customer_no_duplicate(self, headers):
        """Test creating test customer again - should return existing without duplicate."""
        # First call
        response1 = requests.post(f"{BASE_URL}/api/admin/customers/create-test", json={}, headers=headers)
        assert response1.status_code == 200
        data1 = response1.json()
        user_id1 = data1["user_id"]
        customer_id1 = data1["customer_id"]
        
        # Second call - should NOT create duplicate
        response2 = requests.post(f"{BASE_URL}/api/admin/customers/create-test", json={}, headers=headers)
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Verify same IDs
        assert data2["user_id"] == user_id1, "User ID should be the same (no duplicate)"
        assert data2["customer_id"] == customer_id1, "Customer ID should be the same (no duplicate)"
        assert data2["created"] is False, "Should indicate existing, not newly created"
        print(f"✓ No duplicate created on second call: user_id={user_id1}")

    def test_test_customer_appears_in_customers_list(self, headers):
        """Test that test customer appears in customers list."""
        # Ensure test customer exists
        requests.post(f"{BASE_URL}/api/admin/customers/create-test", json={}, headers=headers)
        
        # Get customers list
        response = requests.get(f"{BASE_URL}/api/store/customers", headers=headers)
        assert response.status_code == 200
        
        customers = response.json()
        test_customer = next((c for c in customers if c.get("email") == "customer.test@emergent.dev"), None)
        
        assert test_customer is not None, "Test customer should appear in customers list"
        assert test_customer["name"] == "Test Customer"
        print(f"✓ Test customer found in customers list: {test_customer['id']}")

    # ============ Impersonation ============
    
    def test_impersonate_customer_success(self, headers):
        """Test impersonating a customer returns token and user payload."""
        # Ensure test customer exists
        create_response = requests.post(f"{BASE_URL}/api/admin/customers/create-test", json={}, headers=headers)
        assert create_response.status_code == 200
        customer_id = create_response.json()["customer_id"]
        
        # Impersonate
        response = requests.post(f"{BASE_URL}/api/admin/customers/{customer_id}/impersonate", json={}, headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Response should include access_token"
        assert "user" in data, "Response should include user payload"
        assert data["user"]["email"] == "customer.test@emergent.dev"
        assert data["user"]["role"] == "user"
        print(f"✓ Impersonation successful: received token for {data['user']['email']}")

    def test_impersonate_customer_token_works(self, headers):
        """Test that impersonated token works for /auth/me."""
        # Ensure test customer exists
        create_response = requests.post(f"{BASE_URL}/api/admin/customers/create-test", json={}, headers=headers)
        customer_id = create_response.json()["customer_id"]
        
        # Impersonate
        imp_response = requests.post(f"{BASE_URL}/api/admin/customers/{customer_id}/impersonate", json={}, headers=headers)
        imp_token = imp_response.json()["access_token"]
        
        # Use impersonated token
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {imp_token}"})
        
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["email"] == "customer.test@emergent.dev"
        print(f"✓ Impersonated token verified via /auth/me")

    def test_impersonate_nonexistent_customer_404(self, headers):
        """Test impersonating nonexistent customer returns 404."""
        response = requests.post(f"{BASE_URL}/api/admin/customers/nonexistent-id-12345/impersonate", json={}, headers=headers)
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Nonexistent customer returns 404")

    # ============ Access Control ============
    
    def test_create_test_customer_requires_admin(self):
        """Test that create-test endpoint requires admin auth."""
        # No auth
        response = requests.post(f"{BASE_URL}/api/admin/customers/create-test", json={})
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Create test customer blocked without auth")

    def test_impersonate_requires_admin(self):
        """Test that impersonate endpoint requires admin auth."""
        response = requests.post(f"{BASE_URL}/api/admin/customers/some-id/impersonate", json={})
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Impersonate blocked without auth")

    def test_non_admin_cannot_impersonate(self, headers):
        """Test that regular user cannot impersonate (if we have a regular user token)."""
        # Ensure test customer exists first
        create_response = requests.post(f"{BASE_URL}/api/admin/customers/create-test", json={}, headers=headers)
        customer_id = create_response.json()["customer_id"]
        
        # Get test customer token (regular user)
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer.test@emergent.dev",
            "password": "TestCustomer123!"
        })
        
        if login_response.status_code != 200:
            pytest.skip("Could not login as test customer to verify access control")
        
        user_token = login_response.json()["access_token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        # Try to impersonate - should fail
        response = requests.post(f"{BASE_URL}/api/admin/customers/{customer_id}/impersonate", json={}, headers=user_headers)
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}"
        print(f"✓ Regular user cannot impersonate (403 forbidden)")

    def test_non_admin_cannot_create_test_customer(self, headers):
        """Test that regular user cannot create test customer."""
        # Ensure test customer exists first
        requests.post(f"{BASE_URL}/api/admin/customers/create-test", json={}, headers=headers)
        
        # Get test customer token (regular user)
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer.test@emergent.dev",
            "password": "TestCustomer123!"
        })
        
        if login_response.status_code != 200:
            pytest.skip("Could not login as test customer to verify access control")
        
        user_token = login_response.json()["access_token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        # Try to create test customer - should fail
        response = requests.post(f"{BASE_URL}/api/admin/customers/create-test", json={}, headers=user_headers)
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}"
        print(f"✓ Regular user cannot create test customer (403 forbidden)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
