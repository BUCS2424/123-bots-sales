"""
CashApp/Venmo Payment Integration Tests
Tests for AMINO-CHAIN peptides e-commerce platform payment functionality:
- CashApp/Venmo settings API (public and admin)
- Order creation with CashApp/Venmo payment methods
- Order status verification (awaiting_payment)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bot-erp-platform.preview.emergentagent.com').rstrip('/')


class TestCashAppVenmoPublicSettings:
    """Test public CashApp/Venmo settings endpoint"""

    def test_get_public_settings_returns_200(self):
        """GET /api/payments/settings/cashapp-venmo/public should return 200"""
        response = requests.get(f"{BASE_URL}/api/payments/settings/cashapp-venmo/public")
        assert response.status_code == 200
        print("✅ Public settings endpoint returns 200")

    def test_public_settings_has_required_fields(self):
        """Public settings should include is_enabled, cashapp_available, venmo_available"""
        response = requests.get(f"{BASE_URL}/api/payments/settings/cashapp-venmo/public")
        assert response.status_code == 200
        data = response.json()
        
        assert "is_enabled" in data, "is_enabled field missing"
        assert "cashapp_available" in data, "cashapp_available field missing"
        assert "venmo_available" in data, "venmo_available field missing"
        print(f"✅ Public settings has required fields: is_enabled={data['is_enabled']}, cashapp_available={data['cashapp_available']}, venmo_available={data['venmo_available']}")

    def test_cashapp_and_venmo_are_enabled(self):
        """Verify CashApp and Venmo are enabled and available"""
        response = requests.get(f"{BASE_URL}/api/payments/settings/cashapp-venmo/public")
        assert response.status_code == 200
        data = response.json()
        
        assert data["is_enabled"] == True, "CashApp/Venmo should be enabled"
        assert data["cashapp_available"] == True, "CashApp should be available"
        assert data["venmo_available"] == True, "Venmo should be available"
        print("✅ CashApp and Venmo are both enabled and available")

    def test_public_settings_does_not_expose_ids(self):
        """Public settings should NOT expose cashapp_id or venmo_id for security"""
        response = requests.get(f"{BASE_URL}/api/payments/settings/cashapp-venmo/public")
        assert response.status_code == 200
        data = response.json()
        
        # Public endpoint should not expose actual payment IDs
        assert "cashapp_id" not in data or data.get("cashapp_id") is None, "Public settings should not expose cashapp_id"
        assert "venmo_id" not in data or data.get("venmo_id") is None, "Public settings should not expose venmo_id"
        print("✅ Public settings does not expose payment IDs (secure)")


class TestCashAppVenmoAdminSettings:
    """Test admin CashApp/Venmo settings endpoints"""

    def test_get_admin_settings_returns_200(self):
        """GET /api/payments/settings/cashapp-venmo returns full settings"""
        response = requests.get(f"{BASE_URL}/api/payments/settings/cashapp-venmo")
        assert response.status_code == 200
        data = response.json()
        
        assert "cashapp_id" in data, "Admin settings should include cashapp_id"
        assert "venmo_id" in data, "Admin settings should include venmo_id"
        assert "is_enabled" in data, "Admin settings should include is_enabled"
        print(f"✅ Admin settings returns: cashapp_id={data['cashapp_id']}, venmo_id={data['venmo_id']}")

    def test_admin_settings_has_configured_ids(self):
        """Admin settings should have AminoChain and AminoChain-Research IDs"""
        response = requests.get(f"{BASE_URL}/api/payments/settings/cashapp-venmo")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("cashapp_id") == "AminoChain", f"Expected cashapp_id='AminoChain', got {data.get('cashapp_id')}"
        assert data.get("venmo_id") == "AminoChain-Research", f"Expected venmo_id='AminoChain-Research', got {data.get('venmo_id')}"
        print("✅ CashApp ID='AminoChain', Venmo ID='AminoChain-Research' configured")

    def test_update_settings_returns_200(self):
        """PUT /api/payments/settings/cashapp-venmo should update settings"""
        update_data = {
            "cashapp_id": "AminoChain",
            "venmo_id": "AminoChain-Research",
            "is_enabled": True,
            "instructions": "Test instructions for payment"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/payments/settings/cashapp-venmo",
            json=update_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data, "Response should include message"
        assert data["message"] == "Settings updated successfully"
        print("✅ PUT settings update returns 200 with success message")

    def test_update_settings_persists_changes(self):
        """Verify PUT updates are persisted"""
        # Update with new instructions
        test_instructions = f"Test instructions {uuid.uuid4().hex[:8]}"
        update_data = {
            "instructions": test_instructions
        }
        
        response = requests.put(
            f"{BASE_URL}/api/payments/settings/cashapp-venmo",
            json=update_data
        )
        assert response.status_code == 200
        
        # Verify changes persisted
        get_response = requests.get(f"{BASE_URL}/api/payments/settings/cashapp-venmo")
        assert get_response.status_code == 200
        data = get_response.json()
        
        assert data["instructions"] == test_instructions, f"Instructions not persisted correctly"
        print("✅ Settings updates are persisted correctly")
        
        # Restore original instructions
        requests.put(
            f"{BASE_URL}/api/payments/settings/cashapp-venmo",
            json={"instructions": "Please send payment with your order number in the note. Orders ship within 24 hours of payment confirmation."}
        )


class TestCashAppOrderCreation:
    """Test order creation with CashApp payment method"""

    def test_create_order_with_cashapp_returns_success(self):
        """POST /api/payments/orders with payment_method='cashapp' should succeed"""
        order_data = {
            "items": [{
                "product_id": "test-product-123",
                "name": "BPC-157",
                "price": 40,
                "quantity": 1,
                "selected_strength": "10 mg",
                "selected_package": "Single Vial"
            }],
            "shipping": {
                "firstName": "Test",
                "lastName": "CashApp",
                "email": "test.cashapp@test.com",
                "phone": "5551234567",
                "address1": "123 Test St",
                "city": "Miami",
                "state": "FL",
                "zipCode": "33101",
                "country": "US"
            },
            "subtotal": 40,
            "shipping_cost": 15,
            "tax": 4.54,
            "total": 59.54,
            "customer_email": "test.cashapp@test.com",
            "customer_name": "Test CashApp",
            "payment_method": "cashapp"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/payments/orders",
            json=order_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True, "Order creation should succeed"
        assert "order" in data, "Response should include order"
        assert "payment" in data, "Response should include payment info"
        print(f"✅ CashApp order created successfully: {data['order']['order_number']}")
        return data

    def test_cashapp_order_has_awaiting_payment_status(self):
        """CashApp orders should have 'awaiting_payment' status"""
        order_data = {
            "items": [{"product_id": "test-123", "name": "Test", "price": 40, "quantity": 1}],
            "shipping": {"firstName": "Test", "lastName": "User", "email": "test@test.com", "phone": "5551234567", "address1": "123 Test St", "city": "Miami", "state": "FL", "zipCode": "33101", "country": "US"},
            "subtotal": 40, "shipping_cost": 15, "tax": 4.54, "total": 59.54,
            "customer_email": "test@test.com", "customer_name": "Test User",
            "payment_method": "cashapp"
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/orders", json=order_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["order"]["status"] == "awaiting_payment", f"Expected status='awaiting_payment', got {data['order']['status']}"
        assert data["order"]["payment_status"] == "pending", f"Expected payment_status='pending', got {data['order']['payment_status']}"
        print("✅ CashApp order has correct awaiting_payment status")

    def test_cashapp_order_includes_payment_id(self):
        """CashApp order response should include the payment ID"""
        order_data = {
            "items": [{"product_id": "test-123", "name": "Test", "price": 40, "quantity": 1}],
            "shipping": {"firstName": "Test", "lastName": "User", "email": "test@test.com", "phone": "5551234567", "address1": "123 Test St", "city": "Miami", "state": "FL", "zipCode": "33101", "country": "US"},
            "subtotal": 40, "shipping_cost": 15, "tax": 4.54, "total": 59.54,
            "customer_email": "test@test.com", "customer_name": "Test User",
            "payment_method": "cashapp"
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/orders", json=order_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["payment"]["method"] == "cashapp", f"Payment method should be cashapp"
        assert data["payment"]["payment_id"] == "AminoChain", f"Payment ID should be AminoChain"
        assert data["payment"]["status"] == "awaiting_payment", f"Payment status should be awaiting_payment"
        print(f"✅ CashApp order includes payment_id='AminoChain'")


class TestVenmoOrderCreation:
    """Test order creation with Venmo payment method"""

    def test_create_order_with_venmo_returns_success(self):
        """POST /api/payments/orders with payment_method='venmo' should succeed"""
        order_data = {
            "items": [{
                "product_id": "test-product-456",
                "name": "TB-500",
                "price": 85,
                "quantity": 1,
                "selected_strength": "10 mg",
                "selected_package": "Single Vial"
            }],
            "shipping": {
                "firstName": "Test",
                "lastName": "Venmo",
                "email": "test.venmo@test.com",
                "phone": "5559876543",
                "address1": "456 Test Ave",
                "city": "Orlando",
                "state": "FL",
                "zipCode": "32801",
                "country": "US"
            },
            "subtotal": 85,
            "shipping_cost": 0,
            "tax": 7.01,
            "total": 92.01,
            "customer_email": "test.venmo@test.com",
            "customer_name": "Test Venmo",
            "payment_method": "venmo"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/payments/orders",
            json=order_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True, "Order creation should succeed"
        assert "order" in data, "Response should include order"
        print(f"✅ Venmo order created successfully: {data['order']['order_number']}")
        return data

    def test_venmo_order_has_awaiting_payment_status(self):
        """Venmo orders should have 'awaiting_payment' status"""
        order_data = {
            "items": [{"product_id": "test-456", "name": "Test", "price": 85, "quantity": 1}],
            "shipping": {"firstName": "Test", "lastName": "User", "email": "test@test.com", "phone": "5551234567", "address1": "456 Test Ave", "city": "Orlando", "state": "FL", "zipCode": "32801", "country": "US"},
            "subtotal": 85, "shipping_cost": 0, "tax": 7.01, "total": 92.01,
            "customer_email": "test@test.com", "customer_name": "Test User",
            "payment_method": "venmo"
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/orders", json=order_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["order"]["status"] == "awaiting_payment", f"Expected status='awaiting_payment', got {data['order']['status']}"
        assert data["order"]["payment_status"] == "pending", f"Expected payment_status='pending', got {data['order']['payment_status']}"
        print("✅ Venmo order has correct awaiting_payment status")

    def test_venmo_order_includes_payment_id(self):
        """Venmo order response should include the payment ID"""
        order_data = {
            "items": [{"product_id": "test-456", "name": "Test", "price": 85, "quantity": 1}],
            "shipping": {"firstName": "Test", "lastName": "User", "email": "test@test.com", "phone": "5551234567", "address1": "456 Test Ave", "city": "Orlando", "state": "FL", "zipCode": "32801", "country": "US"},
            "subtotal": 85, "shipping_cost": 0, "tax": 7.01, "total": 92.01,
            "customer_email": "test@test.com", "customer_name": "Test User",
            "payment_method": "venmo"
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/orders", json=order_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["payment"]["method"] == "venmo", f"Payment method should be venmo"
        assert data["payment"]["payment_id"] == "AminoChain-Research", f"Payment ID should be AminoChain-Research"
        assert data["payment"]["status"] == "awaiting_payment", f"Payment status should be awaiting_payment"
        print(f"✅ Venmo order includes payment_id='AminoChain-Research'")


class TestOrderRetrieval:
    """Test order retrieval APIs"""

    def test_get_order_by_id(self):
        """GET /api/payments/orders/{order_id} returns order details"""
        # First create an order
        order_data = {
            "items": [{"product_id": "test", "name": "Test", "price": 40, "quantity": 1}],
            "shipping": {"firstName": "Test", "lastName": "User", "email": "test@test.com", "phone": "5551234567", "address1": "123 Test St", "city": "Miami", "state": "FL", "zipCode": "33101", "country": "US"},
            "subtotal": 40, "shipping_cost": 15, "tax": 4.54, "total": 59.54,
            "customer_email": "test@test.com", "customer_name": "Test User",
            "payment_method": "cashapp"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/payments/orders", json=order_data)
        assert create_response.status_code == 200
        created_order = create_response.json()["order"]
        order_number = created_order["order_number"]
        
        # Now retrieve it
        get_response = requests.get(f"{BASE_URL}/api/payments/orders/{order_number}")
        assert get_response.status_code == 200
        
        retrieved_order = get_response.json()
        assert retrieved_order["order_number"] == order_number
        assert retrieved_order["payment_method"] == "cashapp"
        print(f"✅ Order {order_number} retrieved successfully")

    def test_get_orders_list(self):
        """GET /api/payments/orders returns list of orders"""
        response = requests.get(f"{BASE_URL}/api/payments/orders")
        assert response.status_code == 200
        data = response.json()
        
        assert "orders" in data, "Response should include orders list"
        assert "total" in data, "Response should include total count"
        assert isinstance(data["orders"], list), "Orders should be a list"
        print(f"✅ Orders list retrieved: {data['total']} total orders")


class TestProductsAPI:
    """Test products API needed for checkout"""

    def test_get_products_returns_200(self):
        """GET /api/store/products should return 200"""
        response = requests.get(f"{BASE_URL}/api/store/products")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Products should be a list"
        assert len(data) > 0, "Should have at least one product"
        print(f"✅ Products API returns {len(data)} products")

    def test_products_have_required_fields(self):
        """Products should have required fields for checkout"""
        response = requests.get(f"{BASE_URL}/api/store/products")
        assert response.status_code == 200
        products = response.json()
        
        product = products[0]
        required_fields = ["id", "name", "price", "category", "in_stock"]
        for field in required_fields:
            assert field in product, f"Product missing field: {field}"
        
        print(f"✅ Products have required fields: {', '.join(required_fields)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
