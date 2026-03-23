"""
Pawn Settings API Tests
Tests for interest rates, category-specific rates, and warehouse configuration
"""

import pytest
import requests
import os
import random
import string

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPawnSettingsAPI:
    """Test pawn settings endpoints"""
    
    def test_get_pawn_settings(self):
        """GET /api/pawn-settings - Get current pawn settings"""
        response = requests.get(f"{BASE_URL}/api/pawn-settings")
        assert response.status_code == 200
        
        data = response.json()
        # Verify required fields exist
        assert "default_interest_rate" in data or "category_rates" in data
        print(f"Pawn settings retrieved: {data}")
    
    def test_get_category_interest_rate_jewelry(self):
        """GET /api/pawn-settings/interest-rate/Jewelry & Watches - Get category-specific rate"""
        response = requests.get(f"{BASE_URL}/api/pawn-settings/interest-rate/Jewelry%20%26%20Watches")
        assert response.status_code == 200
        
        data = response.json()
        assert data["category"] == "Jewelry & Watches"
        assert data["interest_rate"] == 15.0  # As per context
        assert data["loan_term_days"] == 60  # As per context
        print(f"Jewelry & Watches rate: {data['interest_rate']}% / {data['loan_term_days']} days")
    
    def test_get_category_interest_rate_firearms(self):
        """GET /api/pawn-settings/interest-rate/Firearms - Get Firearms rate"""
        response = requests.get(f"{BASE_URL}/api/pawn-settings/interest-rate/Firearms")
        assert response.status_code == 200
        
        data = response.json()
        assert data["category"] == "Firearms"
        assert data["interest_rate"] == 25.0  # As per context
        assert data["loan_term_days"] == 30  # As per context
        print(f"Firearms rate: {data['interest_rate']}% / {data['loan_term_days']} days")
    
    def test_get_category_interest_rate_default(self):
        """GET /api/pawn-settings/interest-rate/Electronics - Get default rate for unconfigured category"""
        response = requests.get(f"{BASE_URL}/api/pawn-settings/interest-rate/Electronics")
        assert response.status_code == 200
        
        data = response.json()
        assert data["category"] == "Electronics"
        # Should return default rate since Electronics is not configured
        assert "interest_rate" in data
        assert "loan_term_days" in data
        print(f"Electronics (default) rate: {data['interest_rate']}% / {data['loan_term_days']} days")
    
    def test_add_category_rate(self):
        """POST /api/pawn-settings/category-rate - Add new category rate"""
        test_category = f"TEST_Category_{random.randint(1000, 9999)}"
        payload = {
            "category": test_category,
            "interest_rate": 18.5,
            "loan_term_days": 45
        }
        
        response = requests.post(f"{BASE_URL}/api/pawn-settings/category-rate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert test_category in data["message"]
        print(f"Added category rate: {test_category} at 18.5%")
        
        # Verify it was added by fetching it
        verify_response = requests.get(f"{BASE_URL}/api/pawn-settings/interest-rate/{test_category}")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data["interest_rate"] == 18.5
        assert verify_data["loan_term_days"] == 45
        
        # Cleanup - delete the test category
        delete_response = requests.delete(f"{BASE_URL}/api/pawn-settings/category-rate/{test_category}")
        assert delete_response.status_code == 200
        print(f"Cleaned up test category: {test_category}")
    
    def test_delete_category_rate(self):
        """DELETE /api/pawn-settings/category-rate/{category} - Remove category rate"""
        # First add a test category
        test_category = f"TEST_Delete_{random.randint(1000, 9999)}"
        add_payload = {
            "category": test_category,
            "interest_rate": 22.0,
            "loan_term_days": 30
        }
        add_response = requests.post(f"{BASE_URL}/api/pawn-settings/category-rate", json=add_payload)
        assert add_response.status_code == 200
        
        # Now delete it
        delete_response = requests.delete(f"{BASE_URL}/api/pawn-settings/category-rate/{test_category}")
        assert delete_response.status_code == 200
        
        data = delete_response.json()
        assert data["success"] == True
        print(f"Deleted category rate: {test_category}")


class TestWarehouseSettingsAPI:
    """Test warehouse/shelving configuration endpoints"""
    
    def test_get_warehouse_settings(self):
        """GET /api/pawn-settings/warehouse - Get warehouse configuration"""
        response = requests.get(f"{BASE_URL}/api/pawn-settings/warehouse")
        assert response.status_code == 200
        
        data = response.json()
        assert "aisles" in data
        assert "shelves_per_aisle" in data
        assert "bins_per_shelf" in data
        
        # Verify default values as per context
        assert data["aisles"] == ["A", "B", "C", "D"]
        assert data["shelves_per_aisle"] == 5
        assert data["bins_per_shelf"] == 4
        print(f"Warehouse config: {len(data['aisles'])} aisles, {data['shelves_per_aisle']} shelves, {data['bins_per_shelf']} bins")
    
    def test_get_warehouse_locations(self):
        """GET /api/pawn-settings/warehouse/locations - Get all warehouse locations"""
        response = requests.get(f"{BASE_URL}/api/pawn-settings/warehouse/locations")
        assert response.status_code == 200
        
        data = response.json()
        assert "locations" in data
        assert "total" in data
        
        # Verify total locations = 4 aisles * 5 shelves * 4 bins = 80
        assert data["total"] == 80
        assert len(data["locations"]) == 80
        
        # Verify location format
        first_loc = data["locations"][0]
        assert "code" in first_loc
        assert "aisle" in first_loc
        assert "shelf" in first_loc
        assert "bin" in first_loc
        assert first_loc["code"] == "A-1-01"
        print(f"Total warehouse locations: {data['total']}")
    
    def test_warehouse_location_format(self):
        """Verify warehouse location code format is Aisle-Shelf-Bin"""
        response = requests.get(f"{BASE_URL}/api/pawn-settings/warehouse/locations")
        assert response.status_code == 200
        
        data = response.json()
        locations = data["locations"]
        
        # Check a few locations for correct format
        expected_codes = ["A-1-01", "A-1-02", "B-3-04", "D-5-04"]
        actual_codes = [loc["code"] for loc in locations]
        
        for expected in expected_codes:
            assert expected in actual_codes, f"Expected location {expected} not found"
        
        print("Location format verified: Aisle-Shelf-Bin (e.g., A-1-01)")
    
    def test_update_warehouse_settings(self):
        """POST /api/pawn-settings/warehouse - Update warehouse configuration"""
        # Get current settings first
        current_response = requests.get(f"{BASE_URL}/api/pawn-settings/warehouse")
        current_data = current_response.json()
        
        # Update with same values to avoid breaking existing config
        payload = {
            "aisles": current_data.get("aisles", ["A", "B", "C", "D"]),
            "shelves_per_aisle": current_data.get("shelves_per_aisle", 5),
            "bins_per_shelf": current_data.get("bins_per_shelf", 4)
        }
        
        response = requests.post(f"{BASE_URL}/api/pawn-settings/warehouse", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "locations_generated" in data
        print(f"Warehouse settings updated, {data['locations_generated']} locations generated")
    
    def test_search_warehouse_locations(self):
        """GET /api/pawn-settings/warehouse/search - Search locations"""
        # Search by aisle
        response = requests.get(f"{BASE_URL}/api/pawn-settings/warehouse/search?aisle=A")
        assert response.status_code == 200
        
        data = response.json()
        assert "locations" in data
        # All returned locations should be in aisle A
        for loc in data["locations"]:
            assert loc["aisle"] == "A"
        
        print(f"Search by aisle A returned {len(data['locations'])} locations")
    
    def test_get_location_items(self):
        """GET /api/pawn-settings/warehouse/location/{code} - Get items in location"""
        response = requests.get(f"{BASE_URL}/api/pawn-settings/warehouse/location/A-1-01")
        assert response.status_code == 200
        
        data = response.json()
        assert data["location"] == "A-1-01"
        assert "items" in data
        assert "count" in data
        print(f"Location A-1-01 has {data['count']} items")


class TestPawnContractWithSettings:
    """Test that pawn contracts use settings for interest rates"""
    
    def test_create_pawn_contract_uses_category_rate(self):
        """Verify pawn contract uses category-specific interest rate from settings"""
        # First, get or create a test customer
        search_response = requests.get(f"{BASE_URL}/api/pawn-contracts/customers/search?q=TEST")
        customers = search_response.json()
        
        if customers:
            customer_id = customers[0]["id"]
        else:
            # Create a test customer
            customer_payload = {
                "first_name": "TEST",
                "last_name": "SettingsTest",
                "phone": "555-TEST-001",
                "drivers_license": f"TEST{random.randint(10000, 99999)}",
                "dl_state": "AL"
            }
            create_response = requests.post(f"{BASE_URL}/api/pawn-contracts/customers", json=customer_payload)
            assert create_response.status_code == 200
            customer_id = create_response.json()["id"]
        
        # Create a pawn contract with Jewelry & Watches category (should use 15% rate)
        contract_payload = {
            "customer_id": customer_id,
            "items": [{
                "description": "TEST Gold Ring for Settings Test",
                "category": "Jewelry & Watches",
                "condition": "Good",
                "estimated_value": 500
            }],
            "loan_amount": 200,
            "notes": "Test contract for settings verification"
        }
        
        response = requests.post(f"{BASE_URL}/api/pawn-contracts/pawn", json=contract_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        contract_id = data["contract_id"]
        
        # Fetch the contract to verify interest rate
        contract_response = requests.get(f"{BASE_URL}/api/pawn-contracts/pawn/{contract_id}")
        assert contract_response.status_code == 200
        
        contract_data = contract_response.json()
        # Should use Jewelry & Watches rate of 15% from settings
        assert contract_data["interest_rate"] == 15.0, f"Expected 15% rate for Jewelry, got {contract_data['interest_rate']}%"
        assert contract_data["loan_term_days"] == 60, f"Expected 60 days term for Jewelry, got {contract_data['loan_term_days']}"
        
        print(f"Contract created with Jewelry rate: {contract_data['interest_rate']}% / {contract_data['loan_term_days']} days")
    
    def test_create_pawn_contract_with_firearms_rate(self):
        """Verify pawn contract uses Firearms interest rate from settings"""
        # Get or create a test customer
        search_response = requests.get(f"{BASE_URL}/api/pawn-contracts/customers/search?q=TEST")
        customers = search_response.json()
        
        if customers:
            customer_id = customers[0]["id"]
        else:
            customer_payload = {
                "first_name": "TEST",
                "last_name": "FirearmsTest",
                "phone": "555-TEST-002",
                "drivers_license": f"TEST{random.randint(10000, 99999)}",
                "dl_state": "AL"
            }
            create_response = requests.post(f"{BASE_URL}/api/pawn-contracts/customers", json=customer_payload)
            customer_id = create_response.json()["id"]
        
        # Create a pawn contract with Firearms category (should use 25% rate)
        contract_payload = {
            "customer_id": customer_id,
            "items": [{
                "description": "TEST Handgun for Settings Test",
                "category": "Firearms",
                "condition": "Good",
                "serial_number": f"TEST{random.randint(10000, 99999)}",
                "estimated_value": 400
            }],
            "loan_amount": 150,
            "notes": "Test contract for Firearms rate verification"
        }
        
        response = requests.post(f"{BASE_URL}/api/pawn-contracts/pawn", json=contract_payload)
        assert response.status_code == 200
        
        data = response.json()
        contract_id = data["contract_id"]
        
        # Fetch the contract to verify interest rate
        contract_response = requests.get(f"{BASE_URL}/api/pawn-contracts/pawn/{contract_id}")
        contract_data = contract_response.json()
        
        # Should use Firearms rate of 25% from settings
        assert contract_data["interest_rate"] == 25.0, f"Expected 25% rate for Firearms, got {contract_data['interest_rate']}%"
        assert contract_data["loan_term_days"] == 30, f"Expected 30 days term for Firearms, got {contract_data['loan_term_days']}"
        
        print(f"Contract created with Firearms rate: {contract_data['interest_rate']}% / {contract_data['loan_term_days']} days")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
