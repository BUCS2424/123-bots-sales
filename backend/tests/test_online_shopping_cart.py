"""
Online Shopping Cart E-commerce Flow Tests
Tests for:
- POST /api/store/orders - Order creation with state-based tax
- GET /api/store/products - Product listing
- GET /api/store/categories - Category listing
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestStoreProducts:
    """Test product and category endpoints"""
    
    def test_get_products(self):
        """Test GET /api/store/products returns product list"""
        response = requests.get(f"{BASE_URL}/api/store/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Products should be a list"
        
        if len(data) > 0:
            product = data[0]
            assert "id" in product, "Product should have id"
            assert "name" in product, "Product should have name"
            assert "price" in product, "Product should have price"
            print(f"PASS: GET /api/store/products - {len(data)} products returned")
    
    def test_get_categories(self):
        """Test GET /api/store/categories returns category list"""
        response = requests.get(f"{BASE_URL}/api/store/categories")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Categories should be a list"
        print(f"PASS: GET /api/store/categories - {len(data)} categories returned")


class TestOrderCreation:
    """Test order creation with state-based tax calculation"""
    
    @pytest.fixture
    def sample_order_payload(self):
        """Create sample order payload"""
        return {
            "customer_email": "test_cart@example.com",
            "customer_name": "TEST_Cart Customer",
            "items": [
                {
                    "product_id": "test-product-001",
                    "product_name": "TEST DeWalt Power Tool",
                    "price": 349.00,
                    "quantity": 1,
                    "image": "https://example.com/image.jpg",
                    "item_type": "product"
                }
            ],
            "shipping_address": {
                "first_name": "TEST_John",
                "last_name": "Doe",
                "address": "123 Test St",
                "city": "Austin",
                "state": "TX",
                "zip_code": "78701",
                "phone": "555-123-4567"
            },
            "subtotal": 349.00,
            "tax": 28.62,  # TX 8.20% of 349.00
            "total": 377.62,
            "payment_method": "card",
            "notes": "TEST order - delete after testing"
        }
    
    def test_create_order_texas_tax(self, sample_order_payload):
        """Test order creation with Texas tax rate (8.20%)"""
        response = requests.post(
            f"{BASE_URL}/api/store/orders",
            json=sample_order_payload
        )
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data or "order_number" in data, "Response should have id or order_number"
        
        # Verify order number format
        if "order_number" in data:
            assert data["order_number"].startswith("APS-"), f"Order number should start with APS-, got {data['order_number']}"
        
        print(f"PASS: POST /api/store/orders - Texas order created: {data.get('order_number', data.get('id'))}")
        print(f"  Subtotal: ${sample_order_payload['subtotal']:.2f}")
        print(f"  Tax (TX 8.20%): ${sample_order_payload['tax']:.2f}")
        print(f"  Total: ${sample_order_payload['total']:.2f}")
        
        return data
    
    def test_create_order_oregon_zero_tax(self, sample_order_payload):
        """Test order creation with Oregon zero tax rate (0%)"""
        # Modify for Oregon - 0% tax
        sample_order_payload["shipping_address"]["state"] = "OR"
        sample_order_payload["shipping_address"]["city"] = "Portland"
        sample_order_payload["shipping_address"]["zip_code"] = "97201"
        sample_order_payload["tax"] = 0.00  # OR 0% tax
        sample_order_payload["total"] = 349.00  # No tax
        
        response = requests.post(
            f"{BASE_URL}/api/store/orders",
            json=sample_order_payload
        )
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"PASS: POST /api/store/orders - Oregon order created (0% tax): {data.get('order_number', data.get('id'))}")
        print(f"  Tax (OR 0%): $0.00")
        print(f"  Total: ${sample_order_payload['total']:.2f}")
    
    def test_create_order_alabama_tax(self, sample_order_payload):
        """Test order creation with Alabama tax rate (9.22%)"""
        # Modify for Alabama - 9.22% tax
        sample_order_payload["shipping_address"]["state"] = "AL"
        sample_order_payload["shipping_address"]["city"] = "Dothan"
        sample_order_payload["shipping_address"]["zip_code"] = "36301"
        sample_order_payload["tax"] = 32.18  # AL 9.22% of 349.00
        sample_order_payload["total"] = 381.18
        
        response = requests.post(
            f"{BASE_URL}/api/store/orders",
            json=sample_order_payload
        )
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"PASS: POST /api/store/orders - Alabama order created: {data.get('order_number', data.get('id'))}")
        print(f"  Tax (AL 9.22%): ${sample_order_payload['tax']:.2f}")
        print(f"  Total: ${sample_order_payload['total']:.2f}")
    
    def test_create_order_california_tax(self, sample_order_payload):
        """Test order creation with California tax rate (8.82%)"""
        # Modify for California - 8.82% tax
        sample_order_payload["shipping_address"]["state"] = "CA"
        sample_order_payload["shipping_address"]["city"] = "Los Angeles"
        sample_order_payload["shipping_address"]["zip_code"] = "90001"
        sample_order_payload["tax"] = 30.78  # CA 8.82% of 349.00
        sample_order_payload["total"] = 379.78
        
        response = requests.post(
            f"{BASE_URL}/api/store/orders",
            json=sample_order_payload
        )
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"PASS: POST /api/store/orders - California order created: {data.get('order_number', data.get('id'))}")
    
    def test_create_order_new_york_tax(self, sample_order_payload):
        """Test order creation with New York tax rate (8.52%)"""
        # Modify for NY - 8.52% tax
        sample_order_payload["shipping_address"]["state"] = "NY"
        sample_order_payload["shipping_address"]["city"] = "New York"
        sample_order_payload["shipping_address"]["zip_code"] = "10001"
        sample_order_payload["tax"] = 29.73  # NY 8.52% of 349.00
        sample_order_payload["total"] = 378.73
        
        response = requests.post(
            f"{BASE_URL}/api/store/orders",
            json=sample_order_payload
        )
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"PASS: POST /api/store/orders - New York order created: {data.get('order_number', data.get('id'))}")


class TestOrderRetrieval:
    """Test order retrieval endpoints"""
    
    def test_get_orders_list(self):
        """Test GET /api/store/orders returns order list (requires auth)"""
        response = requests.get(f"{BASE_URL}/api/store/orders")
        
        # This endpoint requires authentication - 401 is expected without auth
        if response.status_code == 401:
            print("SKIP: GET /api/store/orders requires authentication (expected behavior)")
            pytest.skip("Requires authentication")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Orders should be a list"
        print(f"PASS: GET /api/store/orders - {len(data)} orders returned")
        
        # Check order structure if any orders exist
        if len(data) > 0:
            order = data[0]
            # Verify essential fields
            assert "id" in order or "order_number" in order, "Order should have id or order_number"
            if "status" in order:
                print(f"  Latest order status: {order['status']}")


class TestShippingCalculation:
    """Test shipping cost calculation"""
    
    def test_order_over_100_free_shipping(self):
        """Test that orders over $100 should have free shipping (calculated frontend side)"""
        # This is a frontend calculation, but we verify the backend accepts orders
        # with appropriate totals
        
        order_payload = {
            "customer_email": "test_shipping@example.com",
            "customer_name": "TEST_Shipping Customer",
            "items": [
                {
                    "product_id": "test-product-002",
                    "product_name": "TEST Expensive Item",
                    "price": 150.00,
                    "quantity": 1,
                    "item_type": "product"
                }
            ],
            "shipping_address": {
                "first_name": "TEST_Jane",
                "last_name": "Smith",
                "address": "456 Test Ave",
                "city": "Chicago",
                "state": "IL",
                "zip_code": "60601",
                "phone": "555-987-6543"
            },
            "subtotal": 150.00,
            "tax": 13.23,  # IL 8.82%
            "total": 163.23,  # No shipping cost - over $100
            "payment_method": "card"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/store/orders",
            json=order_payload
        )
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}"
        print("PASS: Order over $100 accepted (free shipping)")
    
    def test_order_under_100_with_shipping(self):
        """Test that orders under $100 should include $9.99 shipping (frontend calculation)"""
        # This verifies backend accepts orders with shipping included in total
        
        order_payload = {
            "customer_email": "test_shipping2@example.com",
            "customer_name": "TEST_Small Order Customer",
            "items": [
                {
                    "product_id": "test-product-003",
                    "product_name": "TEST Small Item",
                    "price": 50.00,
                    "quantity": 1,
                    "item_type": "product"
                }
            ],
            "shipping_address": {
                "first_name": "TEST_Bob",
                "last_name": "Wilson",
                "address": "789 Test Blvd",
                "city": "Miami",
                "state": "FL",
                "zip_code": "33101",
                "phone": "555-456-7890"
            },
            "subtotal": 50.00,
            "tax": 3.54,  # FL 7.08%
            "total": 63.53,  # 50 + 3.54 + 9.99 shipping
            "payment_method": "card"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/store/orders",
            json=order_payload
        )
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}"
        print("PASS: Order under $100 accepted (with $9.99 shipping in total)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
