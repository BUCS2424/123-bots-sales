"""
Johnny 5 Portal API Tests
Tests for the multi-store fulfillment hub - stores, orders, webhooks, and tracking management
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestJohnny5Dashboard:
    """Johnny 5 Dashboard stats endpoint tests"""

    def test_get_dashboard_stats(self):
        """Test dashboard stats endpoint returns valid structure"""
        response = requests.get(f"{BASE_URL}/api/johnny5/dashboard")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "stores" in data
        assert "orders" in data
        assert "today" in data
        assert "total" in data["stores"]
        assert "active" in data["stores"]
        assert "pending" in data["orders"]
        assert "shipped" in data["orders"]
        print("✅ Dashboard stats endpoint working correctly")


class TestJohnny5StoresCRUD:
    """Connected Stores CRUD tests"""
    
    created_store_id = None
    created_api_key = None

    def test_01_list_stores(self):
        """Test listing all connected stores"""
        response = requests.get(f"{BASE_URL}/api/johnny5/stores")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "stores" in data
        assert isinstance(data["stores"], list)
        print(f"✅ Stores list endpoint working - {len(data['stores'])} stores found")

    def test_02_create_store(self):
        """Test adding a new connected store"""
        store_data = {
            "name": "TEST_Pytest Store",
            "url": "https://test-store.pytest.local",
            "description": "Store created by pytest"
        }
        
        response = requests.post(f"{BASE_URL}/api/johnny5/stores", json=store_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "store" in data
        assert "api_key" in data["store"]
        assert "api_secret" in data["store"]
        assert data["store"]["name"] == store_data["name"]
        assert data["store"]["api_key"].startswith("j5_")
        
        TestJohnny5StoresCRUD.created_store_id = data["store"]["id"]
        TestJohnny5StoresCRUD.created_api_key = data["store"]["api_key"]
        print(f"✅ Store created successfully with ID: {TestJohnny5StoresCRUD.created_store_id}")

    def test_03_get_store_by_id(self):
        """Test retrieving a specific store"""
        if not TestJohnny5StoresCRUD.created_store_id:
            pytest.skip("No store created in previous test")
        
        response = requests.get(f"{BASE_URL}/api/johnny5/stores/{TestJohnny5StoresCRUD.created_store_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["id"] == TestJohnny5StoresCRUD.created_store_id
        assert data["name"] == "TEST_Pytest Store"
        assert "stats" in data
        print("✅ Store details endpoint working correctly")

    def test_04_update_store(self):
        """Test updating a connected store"""
        if not TestJohnny5StoresCRUD.created_store_id:
            pytest.skip("No store created in previous test")
        
        update_data = {
            "description": "Updated by pytest"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/johnny5/stores/{TestJohnny5StoresCRUD.created_store_id}",
            json=update_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        print("✅ Store update endpoint working correctly")

    def test_05_regenerate_store_keys(self):
        """Test regenerating API keys for a store"""
        if not TestJohnny5StoresCRUD.created_store_id:
            pytest.skip("No store created in previous test")
        
        response = requests.post(
            f"{BASE_URL}/api/johnny5/stores/{TestJohnny5StoresCRUD.created_store_id}/regenerate-keys"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "api_key" in data
        assert "api_secret" in data
        assert data["api_key"].startswith("j5_")
        # Update the API key for further tests
        TestJohnny5StoresCRUD.created_api_key = data["api_key"]
        print("✅ Key regeneration endpoint working correctly")


class TestJohnny5WebhookReceiver:
    """Webhook order receiver tests"""
    
    test_order_id = None

    def test_01_webhook_without_api_key(self):
        """Test webhook fails without API key"""
        response = requests.post(
            f"{BASE_URL}/api/johnny5/webhook/order",
            json={"test": "data"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Webhook correctly rejects requests without API key")

    def test_02_webhook_with_invalid_api_key(self):
        """Test webhook fails with invalid API key"""
        response = requests.post(
            f"{BASE_URL}/api/johnny5/webhook/order",
            json={"test": "data"},
            headers={"X-Store-API-Key": "invalid_key"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Webhook correctly rejects invalid API keys")

    def test_03_webhook_with_valid_api_key(self):
        """Test webhook accepts order with valid API key"""
        if not TestJohnny5StoresCRUD.created_api_key:
            pytest.skip("No store API key available")
        
        order_data = {
            "order_id": "TEST_pytest_order_001",
            "order_number": "PO-TEST-001",
            "customer_name": "Pytest Customer",
            "customer_email": "pytest@test.local",
            "shipping_address": {
                "address1": "123 Test St",
                "city": "Testville",
                "state": "TS",
                "zip": "12345"
            },
            "items": [
                {"name": "Test Peptide", "quantity": 1, "price": 99.99}
            ],
            "subtotal": 99.99,
            "shipping": 10.00,
            "tax": 8.00,
            "total": 117.99
        }
        
        response = requests.post(
            f"{BASE_URL}/api/johnny5/webhook/order",
            json=order_data,
            headers={"X-Store-API-Key": TestJohnny5StoresCRUD.created_api_key}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "order_id" in data
        TestJohnny5WebhookReceiver.test_order_id = data["order_id"]
        print(f"✅ Webhook order received successfully: {TestJohnny5WebhookReceiver.test_order_id}")


class TestJohnny5OrdersManagement:
    """Orders list and filtering tests"""

    def test_01_list_all_orders(self):
        """Test listing all orders"""
        response = requests.get(f"{BASE_URL}/api/johnny5/orders")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "orders" in data
        assert "total" in data
        assert isinstance(data["orders"], list)
        print(f"✅ Orders list endpoint working - {data['total']} orders found")

    def test_02_filter_orders_by_status(self):
        """Test filtering orders by status"""
        response = requests.get(f"{BASE_URL}/api/johnny5/orders?status=pending")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify all returned orders have pending status
        for order in data["orders"]:
            assert order["status"] == "pending", f"Expected pending status, got {order['status']}"
        print(f"✅ Status filter working - {len(data['orders'])} pending orders")

    def test_03_get_order_details(self):
        """Test getting specific order details"""
        if not TestJohnny5WebhookReceiver.test_order_id:
            pytest.skip("No test order available")
        
        response = requests.get(f"{BASE_URL}/api/johnny5/orders/{TestJohnny5WebhookReceiver.test_order_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["id"] == TestJohnny5WebhookReceiver.test_order_id
        assert "customer" in data
        assert "items" in data
        assert "totals" in data
        print("✅ Order details endpoint working correctly")

    def test_04_update_order_status(self):
        """Test updating order status"""
        if not TestJohnny5WebhookReceiver.test_order_id:
            pytest.skip("No test order available")
        
        response = requests.put(
            f"{BASE_URL}/api/johnny5/orders/{TestJohnny5WebhookReceiver.test_order_id}/status?status=processing"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        print("✅ Order status update working correctly")


class TestJohnny5Fulfillment:
    """Fulfillment center and tracking tests"""

    def test_01_add_tracking_to_order(self):
        """Test adding tracking information to an order"""
        if not TestJohnny5WebhookReceiver.test_order_id:
            pytest.skip("No test order available")
        
        tracking_data = {
            "order_id": TestJohnny5WebhookReceiver.test_order_id,
            "tracking_number": "TEST_TRACKING_123456789",
            "carrier": "usps"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/johnny5/orders/{TestJohnny5WebhookReceiver.test_order_id}/add-tracking",
            json=tracking_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "tracking" in data
        assert data["tracking"]["tracking_number"] == "TEST_TRACKING_123456789"
        print("✅ Add tracking endpoint working correctly")

    def test_02_verify_order_now_shipped(self):
        """Verify order status changed to shipped after tracking"""
        if not TestJohnny5WebhookReceiver.test_order_id:
            pytest.skip("No test order available")
        
        response = requests.get(f"{BASE_URL}/api/johnny5/orders/{TestJohnny5WebhookReceiver.test_order_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["status"] == "shipped", f"Expected shipped, got {data['status']}"
        assert data["tracking"]["tracking_number"] == "TEST_TRACKING_123456789"
        print("✅ Order status correctly changed to shipped")

    def test_03_push_tracking_to_store(self):
        """Test pushing tracking back to source store"""
        if not TestJohnny5WebhookReceiver.test_order_id:
            pytest.skip("No test order available")
        
        response = requests.post(
            f"{BASE_URL}/api/johnny5/orders/{TestJohnny5WebhookReceiver.test_order_id}/push-tracking"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # May fail if store URL is not reachable, but API should work
        assert "success" in data or "message" in data
        print(f"✅ Push tracking endpoint working - success: {data.get('success', 'N/A')}")


class TestJohnny5Cleanup:
    """Cleanup test data created during testing"""

    def test_cleanup_test_store(self):
        """Delete test store created during tests"""
        if not TestJohnny5StoresCRUD.created_store_id:
            pytest.skip("No test store to clean up")
        
        response = requests.delete(
            f"{BASE_URL}/api/johnny5/stores/{TestJohnny5StoresCRUD.created_store_id}"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        print("✅ Test store cleaned up successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
