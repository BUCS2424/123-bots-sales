"""
Printful Order Eligibility and Submit Backend Tests
Tests for new endpoints: GET /api/printful/orders/{order_id}/eligibility 
and POST /api/printful/orders/{order_id}/submit

These endpoints enable Send to Printful functionality from Admin Orders detail dialog.
Expected behavior when Printful not connected: return 404 "Printful account not connected"
"""

import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_EMAIL = "super@amino.com"
SUPER_ADMIN_PASSWORD = "peptides"


class TestPrintfulOrderEndpoints:
    """Test suite for Printful order eligibility and submit endpoints"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as super admin
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": SUPER_ADMIN_EMAIL, "password": SUPER_ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Super admin login failed: {response.text}"
        self.super_admin_token = response.json().get("access_token")
        self.super_admin_headers = {"Authorization": f"Bearer {self.super_admin_token}"}
        
        # Get an existing order id for testing
        orders_response = self.session.get(f"{BASE_URL}/api/payments/orders")
        orders_data = orders_response.json() if orders_response.status_code == 200 else {}
        orders = orders_data.get("orders", [])
        self.test_order_id = orders[0].get("id") if orders else None

    # ==================== Eligibility Endpoint Tests ====================

    def test_eligibility_endpoint_requires_auth(self):
        """Test GET /api/printful/orders/{order_id}/eligibility requires authentication"""
        unauthenticated_session = requests.Session()
        unauthenticated_session.headers.update({"Content-Type": "application/json"})
        
        response = unauthenticated_session.get(
            f"{BASE_URL}/api/printful/orders/test-order-id/eligibility"
        )
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        assert "Missing authorization token" in response.json().get("detail", "")
        print("Eligibility endpoint auth check: PASS")

    def test_eligibility_endpoint_returns_not_connected_error(self):
        """Test eligibility endpoint returns appropriate error when Printful not connected"""
        if not self.test_order_id:
            pytest.skip("No orders available for testing")
        
        response = self.session.get(
            f"{BASE_URL}/api/printful/orders/{self.test_order_id}/eligibility",
            headers=self.super_admin_headers
        )
        # Expected: 404 "Printful account not connected" since we don't have OAuth connection
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        assert "Printful account not connected" in response.json().get("detail", "")
        print("Eligibility returns 'not connected' error: PASS")

    def test_eligibility_endpoint_structure(self):
        """Test eligibility endpoint returns proper error structure"""
        response = self.session.get(
            f"{BASE_URL}/api/printful/orders/any-order-id/eligibility",
            headers=self.super_admin_headers
        )
        # Should return 404 with JSON detail
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        print("Eligibility error structure: PASS")

    # ==================== Submit Endpoint Tests ====================

    def test_submit_endpoint_requires_auth(self):
        """Test POST /api/printful/orders/{order_id}/submit requires authentication"""
        unauthenticated_session = requests.Session()
        unauthenticated_session.headers.update({"Content-Type": "application/json"})
        
        response = unauthenticated_session.post(
            f"{BASE_URL}/api/printful/orders/test-order-id/submit"
        )
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        assert "Missing authorization token" in response.json().get("detail", "")
        print("Submit endpoint auth check: PASS")

    def test_submit_endpoint_returns_not_connected_error(self):
        """Test submit endpoint returns appropriate error when Printful not connected"""
        if not self.test_order_id:
            pytest.skip("No orders available for testing")
        
        response = self.session.post(
            f"{BASE_URL}/api/printful/orders/{self.test_order_id}/submit",
            headers=self.super_admin_headers
        )
        # Expected: 404 "Printful account not connected" since we don't have OAuth connection
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        assert "Printful account not connected" in response.json().get("detail", "")
        print("Submit returns 'not connected' error: PASS")

    def test_submit_endpoint_clear_error_message(self):
        """Test that submit endpoint returns a clear error message when Printful not connected"""
        response = self.session.post(
            f"{BASE_URL}/api/printful/orders/any-order-id/submit",
            headers=self.super_admin_headers
        )
        data = response.json()
        # Verify the error message is clear and user-friendly
        error_detail = data.get("detail", "")
        assert error_detail, "Error detail should not be empty"
        assert "Printful" in error_detail, "Error should mention Printful"
        print(f"Submit clear error message: '{error_detail}' - PASS")

    # ==================== Orders Table Regression Tests ====================

    def test_orders_list_endpoint_still_works(self):
        """Test GET /api/payments/orders still returns orders (regression check)"""
        response = self.session.get(f"{BASE_URL}/api/payments/orders")
        assert response.status_code == 200, f"Orders list failed: {response.text}"
        
        data = response.json()
        assert "orders" in data, "Response should contain 'orders' field"
        assert isinstance(data["orders"], list), "Orders should be a list"
        print(f"Orders list returns {len(data['orders'])} orders: PASS")

    def test_orders_list_response_structure(self):
        """Test orders list response has proper structure"""
        response = self.session.get(f"{BASE_URL}/api/payments/orders")
        assert response.status_code == 200
        
        data = response.json()
        assert "orders" in data
        assert "total" in data
        
        if data["orders"]:
            order = data["orders"][0]
            # Verify order has expected fields
            expected_fields = ["id", "order_number", "customer_name", "customer_email", "status", "total"]
            for field in expected_fields:
                assert field in order, f"Order should have '{field}' field"
        print("Orders list structure: PASS")

    # ==================== Feature Flag Tests ====================

    def test_printful_feature_flag_accessible(self):
        """Test that printful_enabled feature flag is accessible"""
        response = self.session.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200
        
        data = response.json()
        assert "printful_enabled" in data, "printful_enabled flag should be in feature flags"
        print(f"Printful feature flag: printful_enabled={data['printful_enabled']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
