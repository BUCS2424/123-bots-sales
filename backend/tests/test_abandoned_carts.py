"""
Abandoned Carts Module Tests
Tests cart tracking, settings, process-abandoned, recovery coupons, and admin operations.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bots-ecommerce-hub.preview.emergentagent.com').rstrip('/')
API_URL = f"{BASE_URL}/api"


class TestAbandonedCartsSettings:
    """Tests for abandoned cart settings endpoints"""

    def test_get_settings(self):
        """GET /api/abandoned-carts/settings - Get default settings"""
        response = requests.get(f"{API_URL}/abandoned-carts/settings")
        assert response.status_code == 200
        
        data = response.json()
        assert "enabled" in data
        assert "first_email_hours" in data
        assert "second_email_hours" in data
        assert "discount_type" in data
        assert "discount_value" in data
        assert "retention_days" in data
        
        # Verify default values
        assert data["enabled"] == True
        assert data["first_email_hours"] == 24
        assert data["second_email_hours"] == 36
        assert data["discount_type"] in ["fixed", "percentage"]
        assert data["discount_value"] >= 0
        assert data["retention_days"] == 365
        print(f"✓ Settings retrieved: enabled={data['enabled']}, discount={data['discount_value']}")

    def test_update_settings(self):
        """POST /api/abandoned-carts/settings - Update settings"""
        settings_data = {
            "enabled": True,
            "first_email_hours": 24,
            "second_email_hours": 36,
            "discount_type": "fixed",
            "discount_value": 15.0,
            "min_cart_value": 50,
            "coupon_prefix": "RECOVER",
            "retention_days": 365
        }
        response = requests.post(f"{API_URL}/abandoned-carts/settings", json=settings_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        print("✓ Settings updated successfully")
        
        # Verify update
        response = requests.get(f"{API_URL}/abandoned-carts/settings")
        updated_data = response.json()
        assert updated_data["discount_value"] == 15.0
        assert updated_data["min_cart_value"] == 50
        
        # Reset to default
        settings_data["discount_value"] = 10.0
        settings_data["min_cart_value"] = 0
        requests.post(f"{API_URL}/abandoned-carts/settings", json=settings_data)
        print("✓ Settings restored to default")


class TestAbandonedCartsStats:
    """Tests for abandoned cart statistics endpoint"""

    def test_get_stats(self):
        """GET /api/abandoned-carts/stats - Get statistics"""
        response = requests.get(f"{API_URL}/abandoned-carts/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_abandoned" in data
        assert "total_recovered" in data
        assert "recovery_rate" in data
        assert "total_abandoned_value_30d" in data
        assert "total_recovered_value_30d" in data
        assert "pending_first_email" in data
        assert "settings" in data
        
        # Values should be non-negative
        assert data["total_abandoned"] >= 0
        assert data["total_recovered"] >= 0
        assert data["recovery_rate"] >= 0
        print(f"✓ Stats: abandoned={data['total_abandoned']}, recovered={data['total_recovered']}, rate={data['recovery_rate']}%")


class TestCartTracking:
    """Tests for cart tracking CRUD operations"""

    @pytest.fixture
    def test_session_id(self):
        return f"TEST_session_{uuid.uuid4().hex[:8]}"

    def test_track_new_cart(self, test_session_id):
        """POST /api/abandoned-carts/track - Create new cart tracking"""
        cart_data = {
            "session_id": test_session_id,
            "email": "test@example.com",
            "user_name": "Test User",
            "items": [
                {"product_id": "prod1", "name": "BPC-157", "price": 145.00, "quantity": 1, "image": None}
            ],
            "subtotal": 145.00
        }
        response = requests.post(f"{API_URL}/abandoned-carts/track", json=cart_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "cart_id" in data
        print(f"✓ Cart tracking started: {data['cart_id']}")
        
        # Cleanup
        requests.delete(f"{API_URL}/abandoned-carts/{data['cart_id']}")

    def test_track_cart_update(self, test_session_id):
        """POST /api/abandoned-carts/track - Update existing cart"""
        # Create cart
        cart_data = {
            "session_id": test_session_id,
            "email": "test@example.com",
            "items": [
                {"product_id": "prod1", "name": "BPC-157", "price": 145.00, "quantity": 1, "image": None}
            ],
            "subtotal": 145.00
        }
        response = requests.post(f"{API_URL}/abandoned-carts/track", json=cart_data)
        cart_id = response.json()["cart_id"]
        
        # Update cart with more items
        cart_data["items"].append({"product_id": "prod2", "name": "TB-500", "price": 75.00, "quantity": 2, "image": None})
        cart_data["subtotal"] = 295.00
        response = requests.post(f"{API_URL}/abandoned-carts/track", json=cart_data)
        assert response.status_code == 200
        assert response.json()["message"] == "Cart updated"
        print("✓ Cart updated successfully")
        
        # Verify update
        response = requests.get(f"{API_URL}/abandoned-carts/{cart_id}")
        cart = response.json()
        assert cart["subtotal"] == 295.00
        assert len(cart["items"]) == 2
        
        # Cleanup
        requests.delete(f"{API_URL}/abandoned-carts/{cart_id}")

    def test_list_abandoned_carts(self, test_session_id):
        """GET /api/abandoned-carts - List carts with filters"""
        # Create test cart
        cart_data = {
            "session_id": test_session_id,
            "email": "filter_test@example.com",
            "items": [{"product_id": "prod1", "name": "Test", "price": 50.00, "quantity": 1, "image": None}],
            "subtotal": 50.00
        }
        requests.post(f"{API_URL}/abandoned-carts/track", json=cart_data)
        
        # List all
        response = requests.get(f"{API_URL}/abandoned-carts")
        assert response.status_code == 200
        data = response.json()
        assert "carts" in data
        assert "total" in data
        assert "page" in data
        print(f"✓ Listed {data['total']} carts")
        
        # Filter by search
        response = requests.get(f"{API_URL}/abandoned-carts?search=filter_test")
        data = response.json()
        assert data["total"] >= 1
        print("✓ Search filter works")
        
        # Cleanup
        if data["carts"]:
            requests.delete(f"{API_URL}/abandoned-carts/{data['carts'][0]['id']}")

    def test_get_cart_by_id(self, test_session_id):
        """GET /api/abandoned-carts/{cart_id} - Get single cart"""
        # Create cart
        cart_data = {
            "session_id": test_session_id,
            "email": "single_test@example.com",
            "items": [{"product_id": "prod1", "name": "Test", "price": 50.00, "quantity": 1, "image": None}],
            "subtotal": 50.00
        }
        response = requests.post(f"{API_URL}/abandoned-carts/track", json=cart_data)
        cart_id = response.json()["cart_id"]
        
        # Get by ID
        response = requests.get(f"{API_URL}/abandoned-carts/{cart_id}")
        assert response.status_code == 200
        cart = response.json()
        assert cart["id"] == cart_id
        assert cart["email"] == "single_test@example.com"
        assert len(cart["items"]) == 1
        print(f"✓ Retrieved cart {cart_id}")
        
        # Cleanup
        requests.delete(f"{API_URL}/abandoned-carts/{cart_id}")

    def test_get_nonexistent_cart(self):
        """GET /api/abandoned-carts/{cart_id} - 404 for missing cart"""
        response = requests.get(f"{API_URL}/abandoned-carts/000000000000000000000000")
        assert response.status_code == 404
        print("✓ 404 returned for missing cart")


class TestCartLifecycle:
    """Tests for cart lifecycle operations"""

    @pytest.fixture
    def test_session_id(self):
        return f"TEST_lifecycle_{uuid.uuid4().hex[:8]}"

    def test_mark_cart_completed(self, test_session_id):
        """POST /api/abandoned-carts/mark-completed - Mark cart as completed"""
        # Create cart
        cart_data = {
            "session_id": test_session_id,
            "email": "lifecycle@example.com",
            "items": [{"product_id": "prod1", "name": "Test", "price": 50.00, "quantity": 1, "image": None}],
            "subtotal": 50.00
        }
        response = requests.post(f"{API_URL}/abandoned-carts/track", json=cart_data)
        cart_id = response.json()["cart_id"]
        
        # Mark completed
        response = requests.post(f"{API_URL}/abandoned-carts/mark-completed?session_id={test_session_id}")
        assert response.status_code == 200
        assert response.json()["success"] == True
        print("✓ Cart marked as completed")
        
        # Verify status change by filtering for completed carts
        response = requests.get(f"{API_URL}/abandoned-carts?status=completed")
        carts = response.json()["carts"]
        completed_carts = [c for c in carts if c["id"] == cart_id]
        assert len(completed_carts) == 1
        assert completed_carts[0]["status"] == "completed"
        
        # Cleanup
        requests.delete(f"{API_URL}/abandoned-carts/{cart_id}")

    def test_delete_cart(self, test_session_id):
        """DELETE /api/abandoned-carts/{cart_id} - Delete cart"""
        # Create cart
        cart_data = {
            "session_id": test_session_id,
            "email": "delete_test@example.com",
            "items": [{"product_id": "prod1", "name": "Test", "price": 50.00, "quantity": 1, "image": None}],
            "subtotal": 50.00
        }
        response = requests.post(f"{API_URL}/abandoned-carts/track", json=cart_data)
        cart_id = response.json()["cart_id"]
        
        # Delete
        response = requests.delete(f"{API_URL}/abandoned-carts/{cart_id}")
        assert response.status_code == 200
        assert response.json()["success"] == True
        print(f"✓ Cart {cart_id} deleted")
        
        # Verify deletion
        response = requests.get(f"{API_URL}/abandoned-carts/{cart_id}")
        assert response.status_code == 404


class TestProcessAbandoned:
    """Tests for abandoned cart processing"""

    def test_process_abandoned_carts(self):
        """POST /api/abandoned-carts/process-abandoned - Process abandoned carts"""
        response = requests.post(f"{API_URL}/abandoned-carts/process-abandoned")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "results" in data
        
        results = data["results"]
        assert "marked_abandoned" in results
        assert "first_emails_sent" in results
        assert "second_emails_sent" in results
        assert "cleaned_up" in results
        assert "errors" in results
        print(f"✓ Process results: marked={results['marked_abandoned']}, emails_sent={results['first_emails_sent']}")


class TestRecoveryCoupons:
    """Tests for recovery coupon search endpoint"""

    def test_search_recovery_coupons(self):
        """GET /api/abandoned-carts/recovery-coupons/search - Search coupons"""
        response = requests.get(f"{API_URL}/abandoned-carts/recovery-coupons/search")
        assert response.status_code == 200
        
        data = response.json()
        assert "coupons" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        print(f"✓ Recovery coupons search: {data['total']} found")

    def test_search_recovery_coupons_with_filter(self):
        """GET /api/abandoned-carts/recovery-coupons/search?used=false - Filter unused coupons"""
        response = requests.get(f"{API_URL}/abandoned-carts/recovery-coupons/search?used=false")
        assert response.status_code == 200
        
        data = response.json()
        # All returned coupons should be unused
        for coupon in data["coupons"]:
            assert coupon.get("times_used", 0) == 0
        print("✓ Filter by unused status works")


class TestGuestUserTracking:
    """Tests for guest user (no email) tracking"""

    @pytest.fixture
    def test_session_id(self):
        return f"TEST_guest_{uuid.uuid4().hex[:8]}"

    def test_track_guest_cart(self, test_session_id):
        """Track cart for guest user without email"""
        cart_data = {
            "session_id": test_session_id,
            "email": None,
            "user_name": None,
            "items": [{"product_id": "prod1", "name": "Guest Product", "price": 99.00, "quantity": 1, "image": None}],
            "subtotal": 99.00
        }
        response = requests.post(f"{API_URL}/abandoned-carts/track", json=cart_data)
        assert response.status_code == 200
        
        cart_id = response.json()["cart_id"]
        
        # Verify guest cart created
        response = requests.get(f"{API_URL}/abandoned-carts/{cart_id}")
        cart = response.json()
        assert cart["email"] is None
        assert cart["user_name"] is None
        print("✓ Guest cart tracked successfully")
        
        # Test has_email filter
        response = requests.get(f"{API_URL}/abandoned-carts?has_email=false")
        data = response.json()
        no_email_carts = [c for c in data["carts"] if c["email"] is None]
        assert len(no_email_carts) >= 1
        print("✓ has_email=false filter works")
        
        # Cleanup
        requests.delete(f"{API_URL}/abandoned-carts/{cart_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
