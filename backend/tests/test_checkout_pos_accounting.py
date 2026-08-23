"""
Test Checkout, POS Checkout, and Accounting Integration
Tests:
- POST /api/store/orders creates orders with correct fields
- POST /api/pawn-pos/checkout creates both pos_transaction AND order records
- GET /api/accounting/daily-snapshot reflects retail_sales from orders
- GET /api/accounting/monthly-summary includes retail_revenue from orders
- GET /api/accounting/sales-tax includes tax from orders
- POS checkout decrements product inventory
- POS checkout updates customer purchase history
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "http://localhost:8001"

API_URL = f"{BASE_URL}/api"


class TestAuthentication:
    """Authentication tests for admin access"""
    
    def test_login_admin(self):
        """Test admin login to get token"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": "mel@a2gdesigns.com",
            "password": "BigDaddy2016!!"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert "user" in data, "No user in response"
        return data["access_token"]


class TestStoreOrderCreation:
    """Tests for POST /api/store/orders endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": "mel@a2gdesigns.com",
            "password": "BigDaddy2016!!"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def test_product(self, auth_token):
        """Get or create a test product"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        # List products
        response = requests.get(f"{API_URL}/store/products", headers=headers)
        if response.status_code == 200:
            products = response.json()
            for p in products:
                if p.get("in_stock") and p.get("quantity", 0) > 0:
                    return p
        pytest.skip("No in-stock product available")
    
    def test_create_online_order_success(self, auth_token, test_product):
        """Test POST /api/store/orders creates an order with correct fields"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        test_email = f"TEST_checkout_{uuid.uuid4().hex[:8]}@test.com"
        subtotal = test_product["price"]
        tax_rate = 0.06  # 6% as per frontend
        tax = round(subtotal * tax_rate, 2)
        total = round(subtotal + tax, 2)
        
        order_payload = {
            "customer_email": test_email,
            "customer_name": "Test Customer",
            "items": [{
                "product_id": test_product["id"],
                "product_name": test_product["name"],
                "price": test_product["price"],
                "quantity": 1,
                "item_type": "product"
            }],
            "shipping_address": {
                "first_name": "Test",
                "last_name": "Customer",
                "address": "123 Test Street",
                "city": "Test City",
                "state": "AL",
                "zip_code": "36101",
                "phone": "555-123-4567"
            },
            "subtotal": subtotal,
            "tax": tax,
            "total": total,
            "payment_method": "card",
            "notes": "TEST order - delete after testing"
        }
        
        response = requests.post(f"{API_URL}/store/orders", json=order_payload)
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        
        data = response.json()
        # Verify required fields exist
        assert "id" in data, "Order missing 'id'"
        assert "order_number" in data, "Order missing 'order_number'"
        assert data["order_number"].startswith("APS-"), f"Order number format wrong: {data['order_number']}"
        assert "subtotal" in data, "Order missing 'subtotal'"
        assert "tax" in data, "Order missing 'tax'"
        assert "total" in data, "Order missing 'total'"
        assert "items" in data, "Order missing 'items'"
        assert "status" in data, "Order missing 'status'"
        assert data["status"] == "pending", f"Order status should be pending, got {data['status']}"
        
        # Verify values match
        assert data["subtotal"] == subtotal, f"Subtotal mismatch: {data['subtotal']} vs {subtotal}"
        assert abs(data["tax"] - tax) < 0.01, f"Tax mismatch: {data['tax']} vs {tax}"
        assert abs(data["total"] - total) < 0.01, f"Total mismatch: {data['total']} vs {total}"
        
        print(f"✓ Online order created successfully: {data['order_number']}")
        return data
    
    def test_order_has_created_at(self, auth_token, test_product):
        """Test that order has created_at timestamp"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        test_email = f"TEST_timestamp_{uuid.uuid4().hex[:8]}@test.com"
        order_payload = {
            "customer_email": test_email,
            "customer_name": "Test Timestamp",
            "items": [{
                "product_id": test_product["id"],
                "product_name": test_product["name"],
                "price": test_product["price"],
                "quantity": 1,
                "item_type": "product"
            }],
            "shipping_address": {
                "first_name": "Test",
                "last_name": "Timestamp",
                "address": "123 Test Street",
                "city": "Test City",
                "state": "AL",
                "zip_code": "36101",
                "phone": "555-123-4567"
            },
            "subtotal": test_product["price"],
            "tax": round(test_product["price"] * 0.06, 2),
            "total": round(test_product["price"] * 1.06, 2),
            "payment_method": "card",
            "notes": "TEST order - delete after testing"
        }
        
        response = requests.post(f"{API_URL}/store/orders", json=order_payload)
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        
        data = response.json()
        assert "created_at" in data, "Order missing 'created_at'"
        print(f"✓ Order has created_at: {data['created_at']}")


class TestPOSCheckout:
    """Tests for POST /api/pawn-pos/checkout endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": "mel@a2gdesigns.com",
            "password": "BigDaddy2016!!"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def test_product_for_pos(self, auth_token):
        """Get or create a test product with inventory for POS"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{API_URL}/store/products", headers=headers)
        if response.status_code == 200:
            products = response.json()
            for p in products:
                if p.get("in_stock") and p.get("quantity", 0) >= 2:
                    return p
        pytest.skip("No product with sufficient inventory for POS testing")
    
    def test_pos_checkout_creates_transaction_and_order(self, test_product_for_pos):
        """Test POS checkout creates both pos_transaction AND order records"""
        
        test_phone = f"555-TEST-{uuid.uuid4().hex[:4]}"
        subtotal = test_product_for_pos["price"]
        tax_rate = 0.10  # POS default 10%
        tax_amount = round(subtotal * tax_rate, 2)
        total = round(subtotal + tax_amount, 2)
        
        checkout_payload = {
            "items": [{
                "product_id": test_product_for_pos["id"],
                "name": test_product_for_pos["name"],
                "sku": test_product_for_pos.get("sku", ""),
                "price": test_product_for_pos["price"],
                "quantity": 1,
                "discount": 0,
                "is_custom": False
            }],
            "customer": {
                "first_name": "TEST_POS",
                "last_name": "Customer",
                "email": "",
                "phone": test_phone,
                "address": "123 POS Test",
                "city": "Montgomery",
                "state": "AL",
                "zip_code": "36101"
            },
            "payment_method": "cash",
            "subtotal": subtotal,
            "tax_rate": tax_rate,
            "tax_amount": tax_amount,
            "discount_total": 0,
            "total": total,
            "notes": "TEST POS transaction - delete after testing",
            "cash_received": total + 5,
            "change_due": 5
        }
        
        response = requests.post(f"{API_URL}/pawn-pos/checkout", json=checkout_payload)
        assert response.status_code == 200, f"POS checkout failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "POS checkout success flag not True"
        assert "receipt_number" in data, "Missing receipt_number"
        assert data["receipt_number"].startswith("POS-"), f"Receipt format wrong: {data['receipt_number']}"
        assert "transaction_id" in data, "Missing transaction_id"
        assert "total" in data, "Missing total in response"
        assert abs(data["total"] - total) < 0.01, f"Total mismatch: {data['total']} vs {total}"
        
        print(f"✓ POS checkout successful: {data['receipt_number']}")
        return data
    
    def test_pos_checkout_decrements_inventory(self, auth_token, test_product_for_pos):
        """Test POS checkout decrements product inventory"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get current quantity
        response = requests.get(f"{API_URL}/store/products/{test_product_for_pos['id']}", headers=headers)
        assert response.status_code == 200, f"Failed to get product: {response.text}"
        original_quantity = response.json().get("quantity", 0)
        
        if original_quantity < 1:
            pytest.skip("Product has no inventory to test decrement")
        
        test_phone = f"555-INV-{uuid.uuid4().hex[:4]}"
        checkout_payload = {
            "items": [{
                "product_id": test_product_for_pos["id"],
                "name": test_product_for_pos["name"],
                "sku": test_product_for_pos.get("sku", ""),
                "price": test_product_for_pos["price"],
                "quantity": 1,
                "discount": 0,
                "is_custom": False
            }],
            "customer": {
                "first_name": "TEST_Inventory",
                "last_name": "Check",
                "email": "",
                "phone": test_phone
            },
            "payment_method": "cash",
            "subtotal": test_product_for_pos["price"],
            "tax_rate": 0.10,
            "tax_amount": round(test_product_for_pos["price"] * 0.10, 2),
            "discount_total": 0,
            "total": round(test_product_for_pos["price"] * 1.10, 2),
            "notes": "TEST inventory decrement",
            "cash_received": round(test_product_for_pos["price"] * 1.10, 2) + 10,
            "change_due": 10
        }
        
        checkout_response = requests.post(f"{API_URL}/pawn-pos/checkout", json=checkout_payload)
        assert checkout_response.status_code == 200, f"POS checkout failed: {checkout_response.text}"
        
        # Check new quantity
        response = requests.get(f"{API_URL}/store/products/{test_product_for_pos['id']}", headers=headers)
        assert response.status_code == 200
        new_quantity = response.json().get("quantity", 0)
        
        assert new_quantity == original_quantity - 1, f"Inventory not decremented: {original_quantity} -> {new_quantity}"
        print(f"✓ Inventory decremented: {original_quantity} -> {new_quantity}")
    
    def test_pos_checkout_updates_customer_history(self):
        """Test POS checkout updates customer purchase history"""
        
        test_phone = f"555-HIST-{uuid.uuid4().hex[:4]}"
        
        # First checkout
        checkout_payload = {
            "items": [{
                "product_id": None,
                "name": "TEST Custom Item",
                "sku": "",
                "price": 50.00,
                "quantity": 1,
                "discount": 0,
                "is_custom": True
            }],
            "customer": {
                "first_name": "TEST_History",
                "last_name": "Customer",
                "email": "",
                "phone": test_phone
            },
            "payment_method": "cash",
            "subtotal": 50.00,
            "tax_rate": 0.10,
            "tax_amount": 5.00,
            "discount_total": 0,
            "total": 55.00,
            "notes": "TEST customer history",
            "cash_received": 60,
            "change_due": 5
        }
        
        response1 = requests.post(f"{API_URL}/pawn-pos/checkout", json=checkout_payload)
        assert response1.status_code == 200, f"First checkout failed: {response1.text}"
        
        # Check customer was created with purchase history
        search_response = requests.get(f"{API_URL}/pawn-pos/customers/search?q={test_phone}")
        assert search_response.status_code == 200, f"Customer search failed: {search_response.text}"
        
        customers = search_response.json()
        assert len(customers) >= 1, "Customer not created after checkout"
        
        customer = customers[0]
        assert customer.get("total_purchases", 0) >= 1, f"total_purchases not updated: {customer}"
        assert customer.get("total_spent", 0) >= 55.00, f"total_spent not updated: {customer}"
        
        print(f"✓ Customer purchase history updated: purchases={customer.get('total_purchases')}, spent={customer.get('total_spent')}")


class TestAccountingIntegration:
    """Tests for accounting endpoints reflecting order data"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": "mel@a2gdesigns.com",
            "password": "BigDaddy2016!!"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_daily_snapshot_includes_retail_sales(self, auth_token):
        """Test GET /api/accounting/daily-snapshot includes retail_sales from orders"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get today's date for the report
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        response = requests.get(f"{API_URL}/accounting/daily-snapshot?report_date={today}", headers=headers)
        assert response.status_code == 200, f"Daily snapshot failed: {response.text}"
        
        data = response.json()
        
        # Check required fields exist
        assert "retail_sales" in data, "Missing 'retail_sales' in daily snapshot"
        assert "retail_orders_count" in data, "Missing 'retail_orders_count' in daily snapshot"
        assert "sales_tax_collected" in data, "Missing 'sales_tax_collected' in daily snapshot"
        assert "report_date" in data, "Missing 'report_date' in daily snapshot"
        
        print(f"✓ Daily snapshot includes retail_sales: ${data['retail_sales']}, orders: {data['retail_orders_count']}, tax: ${data['sales_tax_collected']}")
        return data
    
    def test_monthly_summary_includes_retail_revenue(self, auth_token):
        """Test GET /api/accounting/monthly-summary includes retail_revenue from orders"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get current month
        now = datetime.now(timezone.utc)
        report_month = now.strftime("%Y-%m")
        
        response = requests.get(f"{API_URL}/accounting/monthly-summary?report_month={report_month}", headers=headers)
        assert response.status_code == 200, f"Monthly summary failed: {response.text}"
        
        data = response.json()
        
        # Check required fields exist
        assert "retail_revenue" in data, "Missing 'retail_revenue' in monthly summary"
        assert "sales_tax_collected" in data, "Missing 'sales_tax_collected' in monthly summary"
        assert "total_revenue" in data, "Missing 'total_revenue' in monthly summary"
        assert "report_period" in data, "Missing 'report_period' in monthly summary"
        
        print(f"✓ Monthly summary includes retail_revenue: ${data['retail_revenue']}, tax: ${data['sales_tax_collected']}")
        return data
    
    def test_sales_tax_includes_order_tax(self, auth_token):
        """Test GET /api/accounting/sales-tax includes tax from orders"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get current month
        now = datetime.now(timezone.utc)
        report_month = now.strftime("%Y-%m")
        
        response = requests.get(f"{API_URL}/accounting/sales-tax?report_month={report_month}", headers=headers)
        assert response.status_code == 200, f"Sales tax report failed: {response.text}"
        
        data = response.json()
        
        # Check required fields exist
        assert "taxable_retail_sales" in data, "Missing 'taxable_retail_sales' in sales tax"
        assert "tax_collected" in data, "Missing 'tax_collected' in sales tax"
        assert "total_orders" in data, "Missing 'total_orders' in sales tax"
        assert "report_period" in data, "Missing 'report_period' in sales tax"
        
        print(f"✓ Sales tax report: taxable=${data['taxable_retail_sales']}, collected=${data['tax_collected']}, orders={data['total_orders']}")
        return data


class TestOrderAndAccountingEndToEnd:
    """End-to-end tests verifying order data flows to accounting"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": "mel@a2gdesigns.com",
            "password": "BigDaddy2016!!"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_new_order_reflects_in_daily_snapshot(self, auth_token):
        """Test that a new order's revenue and tax appear in daily snapshot"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        # Get current daily snapshot
        response = requests.get(f"{API_URL}/accounting/daily-snapshot?report_date={today}", headers=headers)
        assert response.status_code == 200
        before_data = response.json()
        before_retail = before_data.get("retail_sales", 0)
        before_tax = before_data.get("sales_tax_collected", 0)
        before_count = before_data.get("retail_orders_count", 0)
        
        # Create a new order
        test_email = f"TEST_e2e_{uuid.uuid4().hex[:8]}@test.com"
        subtotal = 100.00
        tax = 6.00
        total = 106.00
        
        order_payload = {
            "customer_email": test_email,
            "customer_name": "E2E Test",
            "items": [{
                "product_id": "test-e2e-item",
                "product_name": "E2E Test Item",
                "price": 100.00,
                "quantity": 1,
                "item_type": "product"
            }],
            "shipping_address": {
                "first_name": "E2E",
                "last_name": "Test",
                "address": "123 E2E Street",
                "city": "Test City",
                "state": "AL",
                "zip_code": "36101",
                "phone": "555-E2E-TEST"
            },
            "subtotal": subtotal,
            "tax": tax,
            "total": total,
            "payment_method": "card",
            "notes": "E2E test order"
        }
        
        order_response = requests.post(f"{API_URL}/store/orders", json=order_payload)
        assert order_response.status_code == 200, f"Order creation failed: {order_response.text}"
        
        # Get updated daily snapshot
        response = requests.get(f"{API_URL}/accounting/daily-snapshot?report_date={today}", headers=headers)
        assert response.status_code == 200
        after_data = response.json()
        after_retail = after_data.get("retail_sales", 0)
        after_tax = after_data.get("sales_tax_collected", 0)
        after_count = after_data.get("retail_orders_count", 0)
        
        # Verify changes
        assert after_count == before_count + 1, f"Order count didn't increase: {before_count} -> {after_count}"
        assert abs(after_retail - before_retail - subtotal) < 0.01, f"Retail sales didn't increase by {subtotal}: {before_retail} -> {after_retail}"
        assert abs(after_tax - before_tax - tax) < 0.01, f"Tax didn't increase by {tax}: {before_tax} -> {after_tax}"
        
        print(f"✓ Order reflected in daily snapshot: retail +${subtotal}, tax +${tax}, count +1")
    
    def test_pos_order_reflects_in_accounting(self, auth_token):
        """Test that POS checkout order appears in accounting reports"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        # Get current daily snapshot
        response = requests.get(f"{API_URL}/accounting/daily-snapshot?report_date={today}", headers=headers)
        assert response.status_code == 200
        before_data = response.json()
        before_count = before_data.get("retail_orders_count", 0)
        
        # Create POS checkout
        test_phone = f"555-ACC-{uuid.uuid4().hex[:4]}"
        checkout_payload = {
            "items": [{
                "product_id": None,
                "name": "TEST Accounting Item",
                "sku": "",
                "price": 75.00,
                "quantity": 1,
                "discount": 0,
                "is_custom": True
            }],
            "customer": {
                "first_name": "TEST_Accounting",
                "last_name": "POS",
                "email": "",
                "phone": test_phone
            },
            "payment_method": "cash",
            "subtotal": 75.00,
            "tax_rate": 0.10,
            "tax_amount": 7.50,
            "discount_total": 0,
            "total": 82.50,
            "notes": "TEST accounting integration",
            "cash_received": 90,
            "change_due": 7.50
        }
        
        pos_response = requests.post(f"{API_URL}/pawn-pos/checkout", json=checkout_payload)
        assert pos_response.status_code == 200, f"POS checkout failed: {pos_response.text}"
        
        # Get updated daily snapshot
        response = requests.get(f"{API_URL}/accounting/daily-snapshot?report_date={today}", headers=headers)
        assert response.status_code == 200
        after_data = response.json()
        after_count = after_data.get("retail_orders_count", 0)
        
        # POS should create an order record too
        assert after_count >= before_count + 1, f"POS order not reflected in accounting: {before_count} -> {after_count}"
        
        print(f"✓ POS order reflected in accounting: orders {before_count} -> {after_count}")


class TestPOSTransactionVerification:
    """Verify POS transactions can be retrieved and have correct structure"""
    
    def test_get_pos_transactions(self):
        """Test GET /api/pawn-pos/transactions returns list"""
        response = requests.get(f"{API_URL}/pawn-pos/transactions?limit=5")
        assert response.status_code == 200, f"Get transactions failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Transactions should be a list"
        
        if len(data) > 0:
            tx = data[0]
            assert "receipt_number" in tx, "Transaction missing receipt_number"
            assert "items" in tx, "Transaction missing items"
            assert "total" in tx, "Transaction missing total"
            print(f"✓ Retrieved {len(data)} POS transactions")
        else:
            print("✓ POS transactions endpoint works (no transactions yet)")
    
    def test_get_pos_stats(self):
        """Test GET /api/pawn-pos/stats returns statistics"""
        response = requests.get(f"{API_URL}/pawn-pos/stats")
        assert response.status_code == 200, f"Get stats failed: {response.text}"
        
        data = response.json()
        assert "today_revenue" in data, "Stats missing today_revenue"
        assert "today_transactions" in data, "Stats missing today_transactions"
        assert "all_time_revenue" in data, "Stats missing all_time_revenue"
        assert "total_customers" in data, "Stats missing total_customers"
        
        print(f"✓ POS stats: today=${data['today_revenue']}, all_time=${data['all_time_revenue']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
