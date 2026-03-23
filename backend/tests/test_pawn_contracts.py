"""
Pawn Contracts API Tests
Tests for pawn loans, buy transactions, payments, and customer portal
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPawnStats:
    """Test pawn shop statistics endpoint"""
    
    def test_get_stats(self):
        """GET /api/pawn-contracts/stats - Returns pawn shop statistics"""
        response = requests.get(f"{BASE_URL}/api/pawn-contracts/stats")
        assert response.status_code == 200
        
        data = response.json()
        # Verify all expected fields are present
        assert "active_contracts" in data
        assert "total_outstanding" in data
        assert "total_loaned_active" in data
        assert "today_new_contracts" in data
        assert "today_payments" in data
        assert "defaulted_contracts" in data
        assert "paid_this_month" in data
        assert "buy_transactions_today" in data
        assert "total_customers" in data
        
        # Verify data types
        assert isinstance(data["active_contracts"], int)
        assert isinstance(data["total_outstanding"], (int, float))
        assert isinstance(data["total_customers"], int)
        print(f"Stats: {data['active_contracts']} active contracts, ${data['total_outstanding']} outstanding")


class TestCustomerPortal:
    """Test customer portal lookup and payment endpoints"""
    
    def test_portal_login_success(self):
        """POST /api/pawn-contracts/portal/login - Successful lookup with DL and last name"""
        response = requests.post(
            f"{BASE_URL}/api/pawn-contracts/portal/login",
            json={"drivers_license": "1234567", "last_name": "Doe"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["first_name"] == "John"
        assert data["last_name"] == "Doe"
        assert data["drivers_license"] == "1234567"
        assert "contracts" in data
        assert isinstance(data["contracts"], list)
        print(f"Portal login successful for {data['first_name']} {data['last_name']}")
    
    def test_portal_login_case_insensitive(self):
        """POST /api/pawn-contracts/portal/login - Case insensitive lookup"""
        response = requests.post(
            f"{BASE_URL}/api/pawn-contracts/portal/login",
            json={"drivers_license": "1234567", "last_name": "doe"}  # lowercase
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["first_name"] == "John"
        print("Case insensitive lookup works correctly")
    
    def test_portal_login_not_found(self):
        """POST /api/pawn-contracts/portal/login - Returns 404 for invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/pawn-contracts/portal/login",
            json={"drivers_license": "9999999", "last_name": "NotExist"}
        )
        assert response.status_code == 404
        
        data = response.json()
        assert "detail" in data
        print("Invalid credentials correctly return 404")
    
    def test_portal_shows_active_contracts(self):
        """Verify portal returns active contracts with balance info"""
        response = requests.post(
            f"{BASE_URL}/api/pawn-contracts/portal/login",
            json={"drivers_license": "1234567", "last_name": "Doe"}
        )
        assert response.status_code == 200
        
        data = response.json()
        contracts = data.get("contracts", [])
        
        # Find active contracts
        active_contracts = [c for c in contracts if c.get("status") == "active"]
        
        if active_contracts:
            contract = active_contracts[0]
            assert "balance_due" in contract
            assert "loan_amount" in contract
            assert "current_payoff" in contract
            assert "due_date" in contract
            assert contract["balance_due"] >= 0
            print(f"Active contract found: {contract['contract_number']}, Balance: ${contract['balance_due']}")


class TestCustomerSearch:
    """Test customer search functionality"""
    
    def test_search_by_name(self):
        """GET /api/pawn-contracts/customers/search - Search by name"""
        response = requests.get(f"{BASE_URL}/api/pawn-contracts/customers/search?q=Doe")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        customer = data[0]
        assert "first_name" in customer
        assert "last_name" in customer
        assert "drivers_license" in customer
        print(f"Found {len(data)} customer(s) matching 'Doe'")
    
    def test_search_by_dl(self):
        """GET /api/pawn-contracts/customers/search - Search by driver's license"""
        response = requests.get(f"{BASE_URL}/api/pawn-contracts/customers/search?q=1234567")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"Found {len(data)} customer(s) matching DL '1234567'")
    
    def test_search_empty_query(self):
        """GET /api/pawn-contracts/customers/search - Empty query returns recent customers"""
        response = requests.get(f"{BASE_URL}/api/pawn-contracts/customers/search?q=")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Empty search returned {len(data)} recent customers")


class TestPawnContracts:
    """Test pawn contract CRUD operations"""
    
    def test_get_pawn_contracts(self):
        """GET /api/pawn-contracts/pawn - Get all pawn contracts"""
        response = requests.get(f"{BASE_URL}/api/pawn-contracts/pawn")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        if data:
            contract = data[0]
            assert "contract_number" in contract
            assert "customer_name" in contract
            assert "loan_amount" in contract
            assert "status" in contract
            assert "items" in contract
            print(f"Found {len(data)} pawn contract(s)")
    
    def test_get_active_contracts(self):
        """GET /api/pawn-contracts/pawn?status=active - Filter by active status"""
        response = requests.get(f"{BASE_URL}/api/pawn-contracts/pawn?status=active")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        for contract in data:
            assert contract["status"] == "active"
        print(f"Found {len(data)} active contract(s)")
    
    def test_get_specific_contract(self):
        """GET /api/pawn-contracts/pawn/{id} - Get specific contract details"""
        # First get list to find a contract ID
        list_response = requests.get(f"{BASE_URL}/api/pawn-contracts/pawn")
        assert list_response.status_code == 200
        
        contracts = list_response.json()
        if contracts:
            contract_id = contracts[0]["id"]
            
            response = requests.get(f"{BASE_URL}/api/pawn-contracts/pawn/{contract_id}")
            assert response.status_code == 200
            
            data = response.json()
            assert data["id"] == contract_id
            assert "payoff_details" in data or data["status"] != "active"
            print(f"Retrieved contract {data['contract_number']}")


class TestCustomerCreation:
    """Test customer creation"""
    
    def test_create_customer(self):
        """POST /api/pawn-contracts/customers - Create new customer"""
        unique_dl = f"TEST{uuid.uuid4().hex[:6].upper()}"
        
        response = requests.post(
            f"{BASE_URL}/api/pawn-contracts/customers",
            json={
                "first_name": "Test",
                "last_name": "Customer",
                "phone": "334-555-9999",
                "email": "test@example.com",
                "drivers_license": unique_dl,
                "dl_state": "AL",
                "address": "456 Test St",
                "city": "Dothan",
                "state": "AL",
                "zip_code": "36301"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["existing"] == False
        print(f"Created customer with ID: {data['id']}")
        
        # Cleanup - store ID for potential cleanup
        return data["id"]
    
    def test_create_duplicate_customer(self):
        """POST /api/pawn-contracts/customers - Returns existing customer if DL exists"""
        response = requests.post(
            f"{BASE_URL}/api/pawn-contracts/customers",
            json={
                "first_name": "John",
                "last_name": "Doe",
                "phone": "334-555-1234",
                "drivers_license": "1234567",
                "dl_state": "AL"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["existing"] == True
        print("Duplicate customer correctly identified as existing")


class TestPawnContractCreation:
    """Test pawn contract creation"""
    
    def test_create_pawn_contract(self):
        """POST /api/pawn-contracts/pawn - Create new pawn contract"""
        # First get customer ID
        search_response = requests.get(f"{BASE_URL}/api/pawn-contracts/customers/search?q=1234567")
        assert search_response.status_code == 200
        customers = search_response.json()
        assert len(customers) > 0
        customer_id = customers[0]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/pawn-contracts/pawn",
            json={
                "customer_id": customer_id,
                "items": [{
                    "description": "Test Item - Samsung Galaxy S23",
                    "category": "Electronics",
                    "brand": "Samsung",
                    "model": "Galaxy S23",
                    "serial_number": f"TEST{uuid.uuid4().hex[:8].upper()}",
                    "condition": "Good",
                    "estimated_value": 400.0
                }],
                "loan_amount": 150.0,
                "interest_rate": 20.0,
                "loan_term_days": 30,
                "notes": "Test pawn contract for automated testing"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "contract_id" in data
        assert "contract_number" in data
        assert data["contract_number"].startswith("PWN-")
        assert "ticket_number" in data
        assert data["loan_amount"] == 150.0
        assert data["payoff_amount"] == 180.0  # 150 + 20% interest
        print(f"Created pawn contract: {data['contract_number']}, Payoff: ${data['payoff_amount']}")
        
        return data["contract_id"]


class TestBuyContract:
    """Test buy contract creation"""
    
    def test_create_buy_contract(self):
        """POST /api/pawn-contracts/buy - Create buy contract (shop buys from customer)"""
        # First get customer ID
        search_response = requests.get(f"{BASE_URL}/api/pawn-contracts/customers/search?q=1234567")
        assert search_response.status_code == 200
        customers = search_response.json()
        assert len(customers) > 0
        customer_id = customers[0]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/pawn-contracts/buy",
            json={
                "customer_id": customer_id,
                "items": [{
                    "description": "Test Buy Item - Vintage Watch",
                    "category": "Jewelry & Watches",
                    "brand": "Seiko",
                    "model": "SKX007",
                    "serial_number": f"BUY{uuid.uuid4().hex[:8].upper()}",
                    "condition": "Good",
                    "estimated_value": 200.0
                }],
                "purchase_amount": 75.0,
                "add_to_inventory": True,
                "notes": "Test buy contract for automated testing"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "contract_id" in data
        assert "contract_number" in data
        assert data["contract_number"].startswith("BUY-")
        assert data["purchase_amount"] == 75.0
        assert data["items_added"] == 1
        print(f"Created buy contract: {data['contract_number']}, Paid customer: ${data['purchase_amount']}")
    
    def test_get_buy_contracts(self):
        """GET /api/pawn-contracts/buy - Get all buy contracts"""
        response = requests.get(f"{BASE_URL}/api/pawn-contracts/buy")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        if data:
            contract = data[0]
            assert contract["type"] == "buy"
            assert "purchase_amount" in contract
            print(f"Found {len(data)} buy contract(s)")


class TestPayments:
    """Test payment functionality"""
    
    def test_make_payment(self):
        """POST /api/pawn-contracts/payments - Make payment on active contract"""
        # Get an active contract
        contracts_response = requests.get(f"{BASE_URL}/api/pawn-contracts/pawn?status=active")
        assert contracts_response.status_code == 200
        contracts = contracts_response.json()
        
        if not contracts:
            pytest.skip("No active contracts to test payment")
        
        contract = contracts[0]
        contract_id = contract["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/pawn-contracts/payments",
            json={
                "contract_id": contract_id,
                "amount": 10.0,
                "payment_method": "cash",
                "notes": "Test payment"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["amount_paid"] == 10.0
        assert "previous_balance" in data
        assert "new_balance" in data
        assert data["new_balance"] < data["previous_balance"]
        print(f"Payment successful: ${data['amount_paid']}, New balance: ${data['new_balance']}")
    
    def test_get_payment_history(self):
        """GET /api/pawn-contracts/payments/{contract_id} - Get payment history"""
        # Get a contract
        contracts_response = requests.get(f"{BASE_URL}/api/pawn-contracts/pawn")
        assert contracts_response.status_code == 200
        contracts = contracts_response.json()
        
        if not contracts:
            pytest.skip("No contracts to test payment history")
        
        contract_id = contracts[0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/pawn-contracts/payments/{contract_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "contract_number" in data
        assert "loan_amount" in data
        assert "total_paid" in data
        assert "payments" in data
        assert isinstance(data["payments"], list)
        print(f"Payment history for {data['contract_number']}: {len(data['payments'])} payment(s)")
    
    def test_portal_payment(self):
        """POST /api/pawn-contracts/portal/payment - Online payment from portal"""
        # Get an active contract via portal login
        login_response = requests.post(
            f"{BASE_URL}/api/pawn-contracts/portal/login",
            json={"drivers_license": "1234567", "last_name": "Doe"}
        )
        assert login_response.status_code == 200
        
        customer_data = login_response.json()
        active_contracts = [c for c in customer_data.get("contracts", []) if c.get("status") == "active"]
        
        if not active_contracts:
            pytest.skip("No active contracts for portal payment test")
        
        contract = active_contracts[0]
        
        response = requests.post(
            f"{BASE_URL}/api/pawn-contracts/portal/payment",
            json={
                "contract_id": contract["id"],
                "amount": 5.0,
                "payment_method": "online",
                "notes": "Online portal test payment"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        print(f"Portal payment successful: ${data['amount_paid']}")


class TestOverdueContracts:
    """Test overdue contracts endpoint"""
    
    def test_get_overdue_contracts(self):
        """GET /api/pawn-contracts/overdue - Get overdue contracts"""
        response = requests.get(f"{BASE_URL}/api/pawn-contracts/overdue")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        for contract in data:
            assert "days_overdue" in contract
            assert contract["days_overdue"] > 0
        print(f"Found {len(data)} overdue contract(s)")


class TestContractNotFound:
    """Test error handling for non-existent contracts"""
    
    def test_get_nonexistent_contract(self):
        """GET /api/pawn-contracts/pawn/{id} - Returns 404 for non-existent contract"""
        response = requests.get(f"{BASE_URL}/api/pawn-contracts/pawn/000000000000000000000000")
        assert response.status_code == 404
        print("Non-existent contract correctly returns 404")
    
    def test_payment_on_nonexistent_contract(self):
        """POST /api/pawn-contracts/payments - Returns 404 for non-existent contract"""
        response = requests.post(
            f"{BASE_URL}/api/pawn-contracts/payments",
            json={
                "contract_id": "000000000000000000000000",
                "amount": 10.0,
                "payment_method": "cash"
            }
        )
        assert response.status_code == 404
        print("Payment on non-existent contract correctly returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
