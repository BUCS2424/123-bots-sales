"""
Backend tests for discount coupon functionality
Tests: discount validation, creation, deletion, min order amount, fixed amount type
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDiscountValidation:
    """Test discount code validation endpoint (public)"""
    
    def test_validate_existing_discount_code(self):
        """Test validating the SAVE10 discount code"""
        response = requests.post(
            f"{BASE_URL}/api/store/discounts/validate?code=SAVE10&order_total=100"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['valid'] == True
        assert data['discount']['code'] == 'SAVE10'
        assert data['discount']['discount_type'] == 'percentage'
        assert data['discount']['value'] == 10.0
        # For $100 order with 10% off, discount should be $10
        assert data['discount_amount'] == 10.0
        print(f"✓ SAVE10 discount validated: {data['discount_amount']} off")
    
    def test_validate_percentage_calculation(self):
        """Test that percentage discount is calculated correctly"""
        response = requests.post(
            f"{BASE_URL}/api/store/discounts/validate?code=SAVE10&order_total=250"
        )
        assert response.status_code == 200
        
        data = response.json()
        # 10% of $250 = $25
        assert data['discount_amount'] == 25.0
        print(f"✓ 10% of $250 = ${data['discount_amount']}")
    
    def test_invalid_discount_code(self):
        """Test that invalid codes return 404"""
        response = requests.post(
            f"{BASE_URL}/api/store/discounts/validate?code=INVALIDCODE123&order_total=100"
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        data = response.json()
        assert 'detail' in data
        print(f"✓ Invalid code correctly rejected: {data['detail']}")
    
    def test_discount_code_case_insensitive(self):
        """Test that discount codes are case-insensitive"""
        response_upper = requests.post(
            f"{BASE_URL}/api/store/discounts/validate?code=SAVE10&order_total=100"
        )
        response_lower = requests.post(
            f"{BASE_URL}/api/store/discounts/validate?code=save10&order_total=100"
        )
        response_mixed = requests.post(
            f"{BASE_URL}/api/store/discounts/validate?code=SaVe10&order_total=100"
        )
        
        assert response_upper.status_code == 200
        assert response_lower.status_code == 200
        assert response_mixed.status_code == 200
        print("✓ Discount codes are case-insensitive")


class TestDiscountCRUD:
    """Test discount CRUD operations (admin required)"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get admin auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "super@amino.com", "password": "peptides"}
        )
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping admin tests")
        
        self.auth_token = login_response.json()['access_token']
        self.headers = {"Authorization": f"Bearer {self.auth_token}"}
    
    def test_list_discounts_authenticated(self):
        """Test listing discounts with auth"""
        response = requests.get(
            f"{BASE_URL}/api/store/discounts",
            headers=self.headers
        )
        assert response.status_code == 200
        
        discounts = response.json()
        assert isinstance(discounts, list)
        print(f"✓ Found {len(discounts)} discounts")
    
    def test_list_discounts_unauthenticated(self):
        """Test that listing discounts without auth fails"""
        response = requests.get(f"{BASE_URL}/api/store/discounts")
        assert response.status_code == 401
        print("✓ Unauthenticated list correctly rejected")
    
    def test_create_percentage_discount(self):
        """Test creating a new percentage discount"""
        discount_data = {
            "code": "TEST25",
            "description": "25% off test discount",
            "discount_type": "percentage",
            "value": 25.0,
            "is_active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/store/discounts",
            json=discount_data,
            headers=self.headers
        )
        
        # If it already exists, try to delete first
        if response.status_code == 400:
            discounts = requests.get(f"{BASE_URL}/api/store/discounts", headers=self.headers).json()
            test_discount = next((d for d in discounts if d['code'] == 'TEST25'), None)
            if test_discount:
                requests.delete(f"{BASE_URL}/api/store/discounts/{test_discount['id']}", headers=self.headers)
                response = requests.post(f"{BASE_URL}/api/store/discounts", json=discount_data, headers=self.headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['code'] == 'TEST25'
        assert data['discount_type'] == 'percentage'
        assert data['value'] == 25.0
        assert 'id' in data
        print(f"✓ Created TEST25 discount with id: {data['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/store/discounts/{data['id']}", headers=self.headers)
    
    def test_create_fixed_discount(self):
        """Test creating a fixed amount discount"""
        discount_data = {
            "code": "TESTFIXED10",
            "description": "$10 off test discount",
            "discount_type": "fixed",
            "value": 10.0,
            "is_active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/store/discounts",
            json=discount_data,
            headers=self.headers
        )
        
        if response.status_code == 400:
            discounts = requests.get(f"{BASE_URL}/api/store/discounts", headers=self.headers).json()
            test_discount = next((d for d in discounts if d['code'] == 'TESTFIXED10'), None)
            if test_discount:
                requests.delete(f"{BASE_URL}/api/store/discounts/{test_discount['id']}", headers=self.headers)
                response = requests.post(f"{BASE_URL}/api/store/discounts", json=discount_data, headers=self.headers)
        
        assert response.status_code == 200
        
        data = response.json()
        assert data['discount_type'] == 'fixed'
        
        # Validate fixed discount calculation
        validate_response = requests.post(
            f"{BASE_URL}/api/store/discounts/validate?code=TESTFIXED10&order_total=100"
        )
        assert validate_response.status_code == 200
        validate_data = validate_response.json()
        assert validate_data['discount_amount'] == 10.0  # Fixed $10 off
        
        print(f"✓ Fixed discount: ${validate_data['discount_amount']} off")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/store/discounts/{data['id']}", headers=self.headers)
    
    def test_min_order_amount_validation(self):
        """Test minimum order amount validation"""
        discount_data = {
            "code": "TESTMINORDER",
            "description": "Requires $50 minimum",
            "discount_type": "percentage",
            "value": 15.0,
            "min_order_amount": 50.0,
            "is_active": True
        }
        
        # Create discount
        response = requests.post(
            f"{BASE_URL}/api/store/discounts",
            json=discount_data,
            headers=self.headers
        )
        
        if response.status_code == 400:
            discounts = requests.get(f"{BASE_URL}/api/store/discounts", headers=self.headers).json()
            test_discount = next((d for d in discounts if d['code'] == 'TESTMINORDER'), None)
            if test_discount:
                requests.delete(f"{BASE_URL}/api/store/discounts/{test_discount['id']}", headers=self.headers)
                response = requests.post(f"{BASE_URL}/api/store/discounts", json=discount_data, headers=self.headers)
        
        assert response.status_code == 200
        discount_id = response.json()['id']
        
        # Try with order under minimum
        under_min_response = requests.post(
            f"{BASE_URL}/api/store/discounts/validate?code=TESTMINORDER&order_total=30"
        )
        assert under_min_response.status_code == 400
        assert "Minimum order amount" in under_min_response.json()['detail']
        print(f"✓ Order under minimum correctly rejected")
        
        # Try with order over minimum
        over_min_response = requests.post(
            f"{BASE_URL}/api/store/discounts/validate?code=TESTMINORDER&order_total=100"
        )
        assert over_min_response.status_code == 200
        print(f"✓ Order over minimum accepted")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/store/discounts/{discount_id}", headers=self.headers)
    
    def test_delete_discount(self):
        """Test deleting a discount"""
        # Create temp discount
        discount_data = {
            "code": "TESTTODELETE",
            "description": "Temp discount to delete",
            "discount_type": "percentage",
            "value": 5.0,
            "is_active": True
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/store/discounts",
            json=discount_data,
            headers=self.headers
        )
        
        if create_response.status_code == 400:
            discounts = requests.get(f"{BASE_URL}/api/store/discounts", headers=self.headers).json()
            test_discount = next((d for d in discounts if d['code'] == 'TESTTODELETE'), None)
            if test_discount:
                discount_id = test_discount['id']
            else:
                pytest.skip("Could not create test discount")
        else:
            discount_id = create_response.json()['id']
        
        # Delete discount
        delete_response = requests.delete(
            f"{BASE_URL}/api/store/discounts/{discount_id}",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        
        # Verify it's deleted
        validate_response = requests.post(
            f"{BASE_URL}/api/store/discounts/validate?code=TESTTODELETE&order_total=100"
        )
        assert validate_response.status_code == 404
        print("✓ Discount deleted successfully")


class TestFixedDiscountLimits:
    """Test fixed discount edge cases"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get admin auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "super@amino.com", "password": "peptides"}
        )
        if login_response.status_code != 200:
            pytest.skip("Admin login failed")
        
        self.auth_token = login_response.json()['access_token']
        self.headers = {"Authorization": f"Bearer {self.auth_token}"}
    
    def test_fixed_discount_not_exceed_order_total(self):
        """Test that fixed discount doesn't exceed order total"""
        discount_data = {
            "code": "TESTFIXED50",
            "description": "$50 off",
            "discount_type": "fixed",
            "value": 50.0,
            "is_active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/store/discounts",
            json=discount_data,
            headers=self.headers
        )
        
        if response.status_code == 400:
            discounts = requests.get(f"{BASE_URL}/api/store/discounts", headers=self.headers).json()
            test_discount = next((d for d in discounts if d['code'] == 'TESTFIXED50'), None)
            if test_discount:
                requests.delete(f"{BASE_URL}/api/store/discounts/{test_discount['id']}", headers=self.headers)
                response = requests.post(f"{BASE_URL}/api/store/discounts", json=discount_data, headers=self.headers)
        
        discount_id = response.json()['id']
        
        # Order total is $30, discount is $50 - should cap at $30
        validate_response = requests.post(
            f"{BASE_URL}/api/store/discounts/validate?code=TESTFIXED50&order_total=30"
        )
        assert validate_response.status_code == 200
        data = validate_response.json()
        assert data['discount_amount'] == 30.0  # Capped at order total
        print(f"✓ Fixed discount capped at order total: ${data['discount_amount']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/store/discounts/{discount_id}", headers=self.headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
