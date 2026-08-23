"""
User Portal API Tests
Tests for: My Orders, My Profile, Addresses, Pricing endpoints
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
DEMO_USER = {
    "email": "demo@123bots.com",
    "password": "demo123"
}

ADMIN_USER = {
    "email": "mel@a2gdesigns.com",
    "password": "BigDaddy2016!!"
}


class TestUserPortalAPIs:
    """User Portal endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for demo user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as demo user
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEMO_USER["email"],
            "password": DEMO_USER["password"]
        })
        
        if response.status_code == 200:
            self.token = response.json().get("access_token")
            self.user = response.json().get("user")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            print(f"Logged in as demo user: {self.user}")
        else:
            pytest.skip(f"Demo user login failed: {response.status_code} - {response.text}")
    
    # ============== My Orders Tests ==============
    
    def test_get_my_orders(self):
        """Test GET /api/portal/my-orders returns order list"""
        response = self.session.get(f"{BASE_URL}/api/portal/my-orders")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of orders"
        print(f"Retrieved {len(data)} orders for demo user")
        
        # If orders exist, validate structure
        if len(data) > 0:
            order = data[0]
            assert "id" in order, "Order should have id"
            assert "status" in order or "total" in order, "Order should have status or total"
    
    def test_get_my_orders_unauthenticated(self):
        """Test GET /api/portal/my-orders without auth returns 401/403"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.get(f"{BASE_URL}/api/portal/my-orders")
        
        # Should return 401 or 403 for unauthenticated request
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("Unauthenticated access correctly blocked")
    
    # ============== My Account Tests ==============
    
    def test_get_my_account(self):
        """Test GET /api/portal/my-account returns user info"""
        response = self.session.get(f"{BASE_URL}/api/portal/my-account")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "name" in data or "email" in data, "Account should have name or email"
        assert "customer_type" in data, "Account should have customer_type (tier)"
        
        print(f"Account info: name={data.get('name')}, email={data.get('email')}, tier={data.get('customer_type')}")
        
        # Demo user should be wholesale with 20% discount according to requirements
        if data.get("customer_type") == "wholesale":
            print(f"Wholesale customer - discount: {data.get('custom_discount_percentage')}%")
    
    def test_update_my_account(self):
        """Test PUT /api/portal/my-account updates profile"""
        # Get current profile
        current = self.session.get(f"{BASE_URL}/api/portal/my-account").json()
        original_name = current.get("name")
        
        # Update name
        test_name = f"Test Update {os.urandom(4).hex()}"
        response = self.session.put(f"{BASE_URL}/api/portal/my-account", json={
            "name": test_name
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"Profile update response: {response.json()}")
        
        # Verify change was persisted
        verify = self.session.get(f"{BASE_URL}/api/portal/my-account")
        assert verify.status_code == 200
        assert verify.json().get("name") == test_name, "Name should be updated"
        print(f"Name updated from '{original_name}' to '{test_name}'")
        
        # Revert back to original
        self.session.put(f"{BASE_URL}/api/portal/my-account", json={
            "name": original_name or "Demo User"
        })
    
    # ============== Addresses Tests ==============
    
    def test_get_addresses(self):
        """Test GET /api/portal/addresses returns address list"""
        response = self.session.get(f"{BASE_URL}/api/portal/addresses")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of addresses"
        print(f"Retrieved {len(data)} addresses for demo user")
    
    def test_add_address(self):
        """Test POST /api/portal/addresses creates new address"""
        test_address = {
            "name": "TEST_PortalTestAddress",
            "street": "123 Test Portal Street",
            "street2": "Suite 100",
            "city": "Test City",
            "state": "TX",
            "zip": "75001",
            "country": "USA",
            "phone": "555-123-4567",
            "is_default": False
        }
        
        response = self.session.post(f"{BASE_URL}/api/portal/addresses", json=test_address)
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Created address should have id"
        assert data.get("street") == test_address["street"], "Street should match"
        
        address_id = data.get("id")
        print(f"Created address with id: {address_id}")
        
        # Verify address appears in list
        addresses = self.session.get(f"{BASE_URL}/api/portal/addresses").json()
        found = any(a.get("id") == address_id for a in addresses)
        assert found, "Created address should appear in list"
        
        # Cleanup - delete the test address
        delete_resp = self.session.delete(f"{BASE_URL}/api/portal/addresses/{address_id}")
        print(f"Cleanup: deleted test address, status={delete_resp.status_code}")
    
    def test_update_address(self):
        """Test PUT /api/portal/addresses/{id} updates address"""
        # First create an address to update
        test_address = {
            "name": "TEST_UpdateAddress",
            "street": "456 Original Street",
            "city": "Original City",
            "state": "CA",
            "zip": "90001",
            "country": "USA",
            "is_default": False
        }
        
        create_resp = self.session.post(f"{BASE_URL}/api/portal/addresses", json=test_address)
        assert create_resp.status_code in [200, 201]
        address_id = create_resp.json().get("id")
        
        # Update the address
        updated_address = {
            "name": "TEST_UpdatedAddress",
            "street": "789 Updated Street",
            "city": "Updated City",
            "state": "NY",
            "zip": "10001",
            "country": "USA",
            "is_default": False
        }
        
        response = self.session.put(f"{BASE_URL}/api/portal/addresses/{address_id}", json=updated_address)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"Address update response: {response.json()}")
        
        # Verify update persisted
        addresses = self.session.get(f"{BASE_URL}/api/portal/addresses").json()
        found = next((a for a in addresses if a.get("id") == address_id), None)
        assert found is not None, "Updated address should exist"
        assert found.get("city") == "Updated City", "City should be updated"
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/portal/addresses/{address_id}")
    
    def test_delete_address(self):
        """Test DELETE /api/portal/addresses/{id} removes address"""
        # Create address to delete
        test_address = {
            "name": "TEST_DeleteAddress",
            "street": "Delete Me Street",
            "city": "Delete City",
            "state": "FL",
            "zip": "33001",
            "country": "USA",
            "is_default": False
        }
        
        create_resp = self.session.post(f"{BASE_URL}/api/portal/addresses", json=test_address)
        assert create_resp.status_code in [200, 201]
        address_id = create_resp.json().get("id")
        
        # Delete the address
        response = self.session.delete(f"{BASE_URL}/api/portal/addresses/{address_id}")
        
        assert response.status_code in [200, 204], f"Expected 200/204, got {response.status_code}"
        print(f"Deleted address {address_id}")
        
        # Verify deletion
        addresses = self.session.get(f"{BASE_URL}/api/portal/addresses").json()
        found = any(a.get("id") == address_id for a in addresses)
        assert not found, "Deleted address should not appear in list"
    
    def test_delete_nonexistent_address(self):
        """Test DELETE /api/portal/addresses/{id} with invalid id returns 404"""
        response = self.session.delete(f"{BASE_URL}/api/portal/addresses/invalid-address-id-12345")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Correctly returned 404 for nonexistent address")
    
    # ============== Change Password Tests ==============
    
    def test_change_password_validation(self):
        """Test POST /api/portal/change-password validates new password length"""
        response = self.session.post(f"{BASE_URL}/api/portal/change-password", json={
            "current_password": DEMO_USER["password"],
            "new_password": "short"  # Less than 8 characters
        })
        
        # Should return 400 for password too short
        assert response.status_code == 400, f"Expected 400 for short password, got {response.status_code}"
        print(f"Password validation working: {response.json()}")
    
    def test_change_password_wrong_current(self):
        """Test POST /api/portal/change-password with wrong current password"""
        response = self.session.post(f"{BASE_URL}/api/portal/change-password", json={
            "current_password": "wrongpassword123",
            "new_password": "newpassword123"
        })
        
        # Should return 400 for wrong current password
        assert response.status_code == 400, f"Expected 400 for wrong password, got {response.status_code}"
        print(f"Wrong password validation working: {response.json()}")


class TestAdminNotSeeMyAccountLink:
    """Test that admin users don't see My Account in nav (backend perspective)"""
    
    def test_admin_login(self):
        """Admin user should be able to login but role should be admin"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_USER["email"],
            "password": ADMIN_USER["password"]
        })
        
        assert response.status_code == 200, f"Admin login failed: {response.status_code}"
        
        data = response.json()
        user = data.get("user", {})
        role = user.get("role")
        
        print(f"Admin user role: {role}")
        assert role in ["admin", "super_admin"], "Admin should have admin role"
        
        # Admin should still be able to access portal endpoints
        token = data.get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        account_resp = session.get(f"{BASE_URL}/api/portal/my-account")
        assert account_resp.status_code == 200, "Admin should be able to access portal endpoint"
        print("Admin can access portal endpoint (but UI should not show My Account nav link)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
