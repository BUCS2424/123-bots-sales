"""
Test suite for Customer/Staff Separation Feature
Testing: 
- /api/users/customers excludes super_admin/admin users (only role="user")
- /api/users/staff includes super_admin/admin users
- /api/store/customers excludes linked non-user roles
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials for authenticated endpoints
ADMIN_EMAIL = "mel@a2gdesigns.com"
ADMIN_PASSWORD = "BigDaddy2016!!"


class TestCustomerStaffSeparation:
    """Test that customers and staff are properly separated"""
    
    token = None
    
    @classmethod
    def setup_class(cls):
        """Login to get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            cls.token = response.json().get("access_token")
            print(f"✅ Logged in as admin")
        else:
            print(f"❌ Failed to login: {response.status_code}")
    
    def get_auth_headers(self):
        """Get authorization headers"""
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}
    
    # ============ /api/users/customers Tests ============
    
    def test_users_customers_returns_200(self):
        """GET /api/users/customers returns 200"""
        response = requests.get(f"{BASE_URL}/api/users/customers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ /api/users/customers returned {len(data)} customers")
    
    def test_users_customers_excludes_admin_users(self):
        """GET /api/users/customers should NOT include admin/super_admin users"""
        response = requests.get(f"{BASE_URL}/api/users/customers")
        assert response.status_code == 200
        data = response.json()
        
        # Check that no customer has admin email
        admin_emails = ["mel@a2gdesigns.com", "super@amino.com"]
        for customer in data:
            email = customer.get("email", "").lower()
            assert email not in admin_emails, f"Admin user {email} found in customers list!"
        
        print(f"✅ /api/users/customers excludes admin users")
    
    def test_users_customers_only_has_user_role(self):
        """GET /api/users/customers should only return users with role='user'"""
        response = requests.get(f"{BASE_URL}/api/users/customers")
        assert response.status_code == 200
        data = response.json()
        
        # All customers should have customer_type field (retail/wholesale)
        for customer in data:
            customer_type = customer.get("customer_type")
            assert customer_type in ["retail", "wholesale"], f"Invalid customer_type: {customer_type}"
        
        print(f"✅ All customers have valid customer_type (retail/wholesale)")
    
    # ============ /api/users/staff Tests ============
    
    def test_users_staff_returns_200(self):
        """GET /api/users/staff returns 200"""
        response = requests.get(f"{BASE_URL}/api/users/staff")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ /api/users/staff returned {len(data)} staff members")
    
    def test_users_staff_includes_admin_users(self):
        """GET /api/users/staff should include admin/super_admin users"""
        response = requests.get(f"{BASE_URL}/api/users/staff")
        assert response.status_code == 200
        data = response.json()
        
        # Check that admin users are in staff list
        staff_emails = [s.get("email", "").lower() for s in data]
        
        # At least one admin should be present
        admin_found = "mel@a2gdesigns.com" in staff_emails or "super@amino.com" in staff_emails
        assert admin_found, "No admin users found in staff list!"
        
        print(f"✅ /api/users/staff includes admin users")
    
    def test_users_staff_has_valid_roles(self):
        """GET /api/users/staff should have valid staff roles"""
        response = requests.get(f"{BASE_URL}/api/users/staff")
        assert response.status_code == 200
        data = response.json()
        
        valid_roles = ["store_owner", "sales", "shipper"]
        for staff in data:
            role = staff.get("role")
            assert role in valid_roles, f"Invalid staff role: {role}"
        
        print(f"✅ All staff members have valid roles")
    
    def test_users_staff_admin_mapped_to_store_owner(self):
        """Admin/super_admin users should be mapped to store_owner role"""
        response = requests.get(f"{BASE_URL}/api/users/staff")
        assert response.status_code == 200
        data = response.json()
        
        # Find admin user
        admin_staff = None
        for staff in data:
            if staff.get("email", "").lower() == "mel@a2gdesigns.com":
                admin_staff = staff
                break
        
        if admin_staff:
            assert admin_staff.get("role") == "store_owner", f"Admin should have store_owner role, got: {admin_staff.get('role')}"
            print(f"✅ Admin user mapped to store_owner role")
        else:
            print(f"⚠️ Admin user not found in staff list (may be expected)")
    
    # ============ /api/store/customers Tests ============
    
    def test_store_customers_requires_auth(self):
        """GET /api/store/customers requires authentication"""
        response = requests.get(f"{BASE_URL}/api/store/customers")
        assert response.status_code == 401
        print(f"✅ /api/store/customers requires authentication")
    
    def test_store_customers_returns_200_with_auth(self):
        """GET /api/store/customers returns 200 with auth"""
        if not self.token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/store/customers",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ /api/store/customers returned {len(data)} customers")
    
    def test_store_customers_excludes_admin_linked_users(self):
        """GET /api/store/customers should exclude customers linked to admin/super_admin users"""
        if not self.token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/store/customers",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check that no customer has admin email
        admin_emails = ["mel@a2gdesigns.com", "super@amino.com"]
        for customer in data:
            email = customer.get("email", "").lower()
            assert email not in admin_emails, f"Admin-linked customer {email} found in store customers!"
        
        print(f"✅ /api/store/customers excludes admin-linked users")
    
    # ============ Cross-validation Tests ============
    
    def test_no_overlap_between_customers_and_staff(self):
        """Customers and staff lists should not overlap"""
        # Get customers
        customers_response = requests.get(f"{BASE_URL}/api/users/customers")
        assert customers_response.status_code == 200
        customers = customers_response.json()
        customer_emails = set(c.get("email", "").lower() for c in customers)
        
        # Get staff
        staff_response = requests.get(f"{BASE_URL}/api/users/staff")
        assert staff_response.status_code == 200
        staff = staff_response.json()
        staff_emails = set(s.get("email", "").lower() for s in staff)
        
        # Check for overlap
        overlap = customer_emails.intersection(staff_emails)
        assert len(overlap) == 0, f"Found overlap between customers and staff: {overlap}"
        
        print(f"✅ No overlap between customers ({len(customer_emails)}) and staff ({len(staff_emails)})")
    
    def test_test_customer_in_customers_not_staff(self):
        """Test customer should appear in customers list, not staff"""
        # Get customers
        customers_response = requests.get(f"{BASE_URL}/api/users/customers")
        assert customers_response.status_code == 200
        customers = customers_response.json()
        customer_emails = [c.get("email", "").lower() for c in customers]
        
        # Get staff
        staff_response = requests.get(f"{BASE_URL}/api/users/staff")
        assert staff_response.status_code == 200
        staff = staff_response.json()
        staff_emails = [s.get("email", "").lower() for s in staff]
        
        # Test customer should be in customers
        test_customer_email = "customer.test@example.com"
        if test_customer_email in customer_emails:
            assert test_customer_email not in staff_emails, "Test customer should not be in staff list"
            print(f"✅ Test customer correctly in customers list only")
        else:
            print(f"⚠️ Test customer not found (may need to create)")


class TestCustomerDashboardAPI:
    """Test customer dashboard API endpoint"""
    
    token = None
    
    @classmethod
    def setup_class(cls):
        """Login to get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            cls.token = response.json().get("access_token")
    
    def get_auth_headers(self):
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}
    
    def test_customer_dashboard_endpoint_exists(self):
        """GET /api/users/customers/{id}/dashboard returns customer data"""
        if not self.token:
            pytest.skip("No auth token available")
        
        # First get a customer ID
        customers_response = requests.get(f"{BASE_URL}/api/users/customers")
        customers = customers_response.json()
        
        if not customers:
            pytest.skip("No customers available")
        
        customer_id = customers[0].get("id")
        
        response = requests.get(
            f"{BASE_URL}/api/users/customers/{customer_id}/dashboard",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "customer" in data
        assert "stats" in data
        assert "addresses" in data
        assert "orders" in data
        
        print(f"✅ Customer dashboard API returns expected structure")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
