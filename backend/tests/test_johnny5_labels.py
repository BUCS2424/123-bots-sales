"""
Johnny 5 Portal - Label Purchasing & Invoice Tests
Tests batch label purchasing and invoice generation features
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestLabelPurchasing:
    """Test label purchase and invoice endpoints"""
    
    def test_get_orders_list(self, api_client):
        """GET /api/johnny5/orders - List orders"""
        response = api_client.get(f"{BASE_URL}/api/johnny5/orders")
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        assert "total" in data
        print(f"PASS: Found {len(data['orders'])} orders")
    
    def test_purchase_label_creates_tracking(self, api_client):
        """POST /api/johnny5/orders/{id}/purchase-label - Creates tracking and marks shipped"""
        # First get an order
        response = api_client.get(f"{BASE_URL}/api/johnny5/orders")
        orders = response.json()["orders"]
        
        if not orders:
            pytest.skip("No orders available for testing")
        
        order_id = orders[0]["id"]
        
        # Purchase label
        payload = {
            "order_id": order_id,
            "provider": "shippo",
            "service": "usps_priority",
            "weight_oz": 8.0
        }
        response = api_client.post(f"{BASE_URL}/api/johnny5/orders/{order_id}/purchase-label", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "label" in data
        
        # Data assertions - validate response structure and values
        label = data["label"]
        assert "label_id" in label
        assert "tracking_number" in label
        assert label["tracking_number"].startswith("J5")  # Mock tracking format
        assert "tracking_url" in label
        assert label["carrier"] == "USPS"
        assert label["provider"] == "shippo"
        assert "from_address" in label
        assert "to_address" in label
        assert "cost" in label
        
        print(f"PASS: Label purchased - Tracking: {label['tracking_number']}")
        
        # Verify order was updated - GET to verify persistence
        verify_response = api_client.get(f"{BASE_URL}/api/johnny5/orders/{order_id}")
        assert verify_response.status_code == 200
        order = verify_response.json()
        assert order["status"] == "shipped"
        assert order["tracking"] is not None
        assert order["tracking"]["tracking_number"] == label["tracking_number"]
        print(f"PASS: Order {order_id} status updated to shipped with tracking")
    
    def test_batch_purchase_labels(self, api_client):
        """POST /api/johnny5/orders/batch-purchase-labels - Batch label purchase"""
        # Get all orders
        response = api_client.get(f"{BASE_URL}/api/johnny5/orders")
        orders = response.json()["orders"]
        
        if len(orders) < 1:
            pytest.skip("Not enough orders for batch testing")
        
        order_ids = [orders[0]["id"]]
        
        payload = {
            "order_ids": order_ids,
            "provider": "shippo",
            "service": "usps_first_class",
            "weight_oz": 6.0
        }
        response = api_client.post(f"{BASE_URL}/api/johnny5/orders/batch-purchase-labels", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "results" in data
        assert "message" in data
        assert len(data["results"]) == len(order_ids)
        
        # Verify results
        for result in data["results"]:
            assert "order_id" in result
            assert "success" in result
            if result["success"]:
                assert "label" in result
                print(f"PASS: Batch label for order {result['order_id']} - Success")
            else:
                print(f"INFO: Batch label for order {result['order_id']} - {result.get('error', 'Failed')}")
    
    def test_purchase_label_invalid_order(self, api_client):
        """POST /api/johnny5/orders/{id}/purchase-label - Invalid order returns 404"""
        fake_order_id = str(uuid.uuid4())
        payload = {
            "order_id": fake_order_id,
            "provider": "shippo",
            "service": "usps_priority",
            "weight_oz": 8.0
        }
        response = api_client.post(f"{BASE_URL}/api/johnny5/orders/{fake_order_id}/purchase-label", json=payload)
        assert response.status_code == 404
        print("PASS: Invalid order correctly returns 404")


class TestInvoiceAPI:
    """Test invoice generation endpoints"""
    
    def test_get_invoice(self, api_client):
        """GET /api/johnny5/orders/{id}/invoice - Returns invoice data"""
        # Get an order
        response = api_client.get(f"{BASE_URL}/api/johnny5/orders")
        orders = response.json()["orders"]
        
        if not orders:
            pytest.skip("No orders available for testing")
        
        order_id = orders[0]["id"]
        
        # Get invoice
        response = api_client.get(f"{BASE_URL}/api/johnny5/orders/{order_id}/invoice")
        assert response.status_code == 200
        
        data = response.json()
        
        # Validate invoice structure
        assert "order" in data
        assert "business" in data
        assert "origin_address" in data
        assert "invoice_number" in data
        assert "generated_at" in data
        
        # Validate order data in invoice
        order = data["order"]
        assert "customer" in order
        assert "shipping_address" in order
        assert "items" in order
        assert "totals" in order
        
        # Validate business info
        business = data["business"]
        assert "name" in business
        assert "logo_url" in business
        
        # Validate origin address
        origin = data["origin_address"]
        assert "name" in origin
        assert "street1" in origin
        assert "city" in origin
        assert "state" in origin
        assert "zip" in origin
        
        print(f"PASS: Invoice {data['invoice_number']} generated successfully")
        print(f"  - Business: {business['name']}")
        print(f"  - Origin: {origin['name']}, {origin['city']}, {origin['state']}")
    
    def test_invoice_contains_order_details(self, api_client):
        """Verify invoice contains complete order details"""
        # Get an order
        response = api_client.get(f"{BASE_URL}/api/johnny5/orders")
        orders = response.json()["orders"]
        
        if not orders:
            pytest.skip("No orders available for testing")
        
        order_id = orders[0]["id"]
        
        # Get invoice
        response = api_client.get(f"{BASE_URL}/api/johnny5/orders/{order_id}/invoice")
        data = response.json()
        
        order = data["order"]
        
        # Verify customer info
        assert order["customer"]["name"] is not None
        assert order["customer"]["email"] is not None
        
        # Verify items
        assert isinstance(order["items"], list)
        if order["items"]:
            item = order["items"][0]
            assert "name" in item or "title" in item
            assert "quantity" in item
            assert "price" in item
        
        # Verify totals
        totals = order["totals"]
        assert "subtotal" in totals
        assert "shipping" in totals
        assert "total" in totals
        
        # If order is shipped, verify tracking in invoice
        if order.get("tracking"):
            assert "tracking_number" in order["tracking"]
            assert "carrier" in order["tracking"]
            print(f"PASS: Invoice includes tracking info: {order['tracking']['tracking_number']}")
        
        print(f"PASS: Invoice contains complete order details")
        print(f"  - Customer: {order['customer']['name']}")
        print(f"  - Items: {len(order['items'])}")
        print(f"  - Total: ${totals['total']}")
    
    def test_invoice_invalid_order(self, api_client):
        """GET /api/johnny5/orders/{id}/invoice - Invalid order returns 404"""
        fake_order_id = str(uuid.uuid4())
        response = api_client.get(f"{BASE_URL}/api/johnny5/orders/{fake_order_id}/invoice")
        assert response.status_code == 404
        print("PASS: Invalid order invoice correctly returns 404")


class TestLabelEndpoint:
    """Test label retrieval endpoint"""
    
    def test_get_label(self, api_client):
        """GET /api/johnny5/labels/{label_id} - Returns label details"""
        # First purchase a label to get a label_id
        response = api_client.get(f"{BASE_URL}/api/johnny5/orders")
        orders = response.json()["orders"]
        
        if not orders:
            pytest.skip("No orders available for testing")
        
        # Find an order with tracking/label
        order_with_label = None
        for order in orders:
            if order.get("tracking") and order["tracking"].get("label_id"):
                order_with_label = order
                break
        
        if not order_with_label:
            # Purchase a label
            order_id = orders[0]["id"]
            payload = {
                "order_id": order_id,
                "provider": "shippo",
                "service": "usps_priority",
                "weight_oz": 8.0
            }
            label_response = api_client.post(f"{BASE_URL}/api/johnny5/orders/{order_id}/purchase-label", json=payload)
            if label_response.status_code != 200:
                pytest.skip("Could not create label for testing")
            label_id = label_response.json()["label"]["label_id"]
        else:
            label_id = order_with_label["tracking"]["label_id"]
        
        # Get label
        response = api_client.get(f"{BASE_URL}/api/johnny5/labels/{label_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "label_id" in data
        assert "tracking_number" in data
        assert "carrier" in data
        assert "from_address" in data
        assert "to_address" in data
        
        print(f"PASS: Label {label_id} retrieved successfully")
    
    def test_get_label_invalid(self, api_client):
        """GET /api/johnny5/labels/{label_id} - Invalid label returns 404"""
        fake_label_id = str(uuid.uuid4())
        response = api_client.get(f"{BASE_URL}/api/johnny5/labels/{fake_label_id}")
        assert response.status_code == 404
        print("PASS: Invalid label correctly returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
