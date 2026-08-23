"""
Test suite for User Management and Wholesale Pricing System
Testing: Staff management, Customer tier management, Wholesale settings, Price calculations
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
TEST_STAFF_EMAIL = f"test_staff_{uuid.uuid4().hex[:8]}@123bots.com"
TEST_STAFF_NAME = "TEST_Staff_Member"
EXISTING_PRODUCT_ID = "7271c39a-8d18-4269-a594-519c1572bf76"  # BPC-157
WHOLESALE_CUSTOMER_WITH_CUSTOM_DISCOUNT = "62ce7fcd-63e6-49f9-bf32-b0f892a8b176"  # 25% custom discount
STANDARD_WHOLESALE_CUSTOMER = "ef3dbb63-2ff0-45b5-9132-1fedaf4a0a1a"  # Uses global 20% discount


class TestStaffManagement:
    """Staff member CRUD operations"""
    created_staff_id = None
    
    def test_list_staff_returns_200(self):
        """GET /api/users/staff returns 200"""
        response = requests.get(f"{BASE_URL}/api/users/staff")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Staff list returned {len(data)} members")
    
    def test_staff_list_contains_expected_fields(self):
        """Staff list items have required fields"""
        response = requests.get(f"{BASE_URL}/api/users/staff")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            staff = data[0]
            required_fields = ["id", "email", "name", "role", "is_active", "created_at"]
            for field in required_fields:
                assert field in staff, f"Missing field: {field}"
            print(f"✅ Staff record has all required fields")
    
    def test_staff_roles_are_valid(self):
        """Staff members have valid roles (store_owner, sales, shipper)"""
        response = requests.get(f"{BASE_URL}/api/users/staff")
        assert response.status_code == 200
        data = response.json()
        
        valid_roles = ["store_owner", "sales", "shipper"]
        for staff in data:
            assert staff["role"] in valid_roles, f"Invalid role: {staff['role']}"
        print(f"✅ All staff members have valid roles")
    
    def test_create_staff_member(self):
        """POST /api/users/staff creates new staff member"""
        payload = {
            "email": TEST_STAFF_EMAIL,
            "name": TEST_STAFF_NAME,
            "password": "TestPassword123!",
            "role": "sales",
            "phone": "555-999-8888"
        }
        response = requests.post(f"{BASE_URL}/api/users/staff", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == TEST_STAFF_EMAIL.lower()
        assert data["name"] == TEST_STAFF_NAME
        assert data["role"] == "sales"
        assert data["is_active"] == True
        
        TestStaffManagement.created_staff_id = data["id"]
        print(f"✅ Created staff member with ID: {data['id']}")
    
    def test_verify_created_staff_in_list(self):
        """Verify created staff appears in staff list"""
        response = requests.get(f"{BASE_URL}/api/users/staff")
        assert response.status_code == 200
        data = response.json()
        
        found = False
        for staff in data:
            if staff["id"] == TestStaffManagement.created_staff_id:
                found = True
                assert staff["email"] == TEST_STAFF_EMAIL.lower()
                assert staff["name"] == TEST_STAFF_NAME
                break
        
        assert found, "Created staff not found in list"
        print(f"✅ Verified staff member exists in list")
    
    def test_update_staff_member(self):
        """PUT /api/users/staff/{id} updates staff member"""
        if not TestStaffManagement.created_staff_id:
            pytest.skip("No staff member created")
        
        payload = {
            "name": "TEST_Updated_Name",
            "role": "shipper"
        }
        response = requests.put(
            f"{BASE_URL}/api/users/staff/{TestStaffManagement.created_staff_id}",
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "TEST_Updated_Name"
        assert data["role"] == "shipper"
        print(f"✅ Updated staff member")
    
    def test_delete_staff_member(self):
        """DELETE /api/users/staff/{id} soft deletes staff member"""
        if not TestStaffManagement.created_staff_id:
            pytest.skip("No staff member created")
        
        response = requests.delete(
            f"{BASE_URL}/api/users/staff/{TestStaffManagement.created_staff_id}"
        )
        assert response.status_code == 200
        
        # Verify not in list anymore
        response = requests.get(f"{BASE_URL}/api/users/staff")
        data = response.json()
        
        found = False
        for staff in data:
            if staff["id"] == TestStaffManagement.created_staff_id:
                found = True
                break
        
        assert not found, "Deleted staff still appears in list"
        print(f"✅ Staff member deleted (soft delete)")
    
    def test_create_staff_with_invalid_role_fails(self):
        """Creating staff with invalid role returns 400"""
        payload = {
            "email": f"invalid_{uuid.uuid4().hex[:8]}@test.com",
            "name": "Invalid Role Test",
            "password": "TestPassword123!",
            "role": "invalid_role"
        }
        response = requests.post(f"{BASE_URL}/api/users/staff", json=payload)
        assert response.status_code == 400
        print(f"✅ Invalid role rejected with 400")


class TestCustomerTierManagement:
    """Customer tier and wholesale settings"""
    
    def test_list_customers_returns_200(self):
        """GET /api/users/customers returns 200"""
        response = requests.get(f"{BASE_URL}/api/users/customers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Customer list returned {len(data)} customers")
    
    def test_customer_list_contains_tier_info(self):
        """Customer records have tier information"""
        response = requests.get(f"{BASE_URL}/api/users/customers")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            customer = data[0]
            required_fields = ["id", "email", "name", "customer_type", "minimum_order_amount"]
            for field in required_fields:
                assert field in customer, f"Missing field: {field}"
        print(f"✅ Customer records have tier info")
    
    def test_get_single_customer(self):
        """GET /api/users/customers/{id} returns customer details"""
        response = requests.get(f"{BASE_URL}/api/users/customers/{WHOLESALE_CUSTOMER_WITH_CUSTOM_DISCOUNT}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == WHOLESALE_CUSTOMER_WITH_CUSTOM_DISCOUNT
        assert data["customer_type"] == "wholesale"
        assert data["custom_discount_percentage"] == 25.0
        assert data["minimum_order_amount"] == 100.0
        print(f"✅ Retrieved customer with custom discount: {data['custom_discount_percentage']}%")
    
    def test_wholesale_customer_has_custom_discount(self):
        """Verify wholesale customer with custom 25% discount"""
        response = requests.get(f"{BASE_URL}/api/users/customers/{WHOLESALE_CUSTOMER_WITH_CUSTOM_DISCOUNT}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["customer_type"] == "wholesale"
        assert data["custom_discount_percentage"] == 25.0
        print(f"✅ Wholesale customer has 25% custom discount")
    
    def test_standard_wholesale_customer_uses_global_discount(self):
        """Verify standard wholesale customer (no custom discount)"""
        response = requests.get(f"{BASE_URL}/api/users/customers/{STANDARD_WHOLESALE_CUSTOMER}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["customer_type"] == "wholesale"
        assert data["custom_discount_percentage"] is None
        print(f"✅ Standard wholesale customer uses global discount (no custom)")
    
    def test_filter_customers_by_tier(self):
        """GET /api/users/customers?tier=wholesale filters correctly"""
        response = requests.get(f"{BASE_URL}/api/users/customers?tier=wholesale")
        assert response.status_code == 200
        
        data = response.json()
        for customer in data:
            assert customer["customer_type"] == "wholesale", f"Found non-wholesale: {customer['customer_type']}"
        print(f"✅ Tier filter returns only wholesale customers ({len(data)} found)")
    
    def test_search_customers(self):
        """GET /api/users/customers?search= searches correctly"""
        response = requests.get(f"{BASE_URL}/api/users/customers?search=test")
        assert response.status_code == 200
        data = response.json()
        print(f"✅ Search returned {len(data)} matching customers")


class TestWholesaleSettings:
    """Global wholesale discount settings"""
    
    def test_get_wholesale_settings_returns_200(self):
        """GET /api/users/wholesale/settings returns 200"""
        response = requests.get(f"{BASE_URL}/api/users/wholesale/settings")
        assert response.status_code == 200
        print(f"✅ Wholesale settings endpoint returns 200")
    
    def test_wholesale_settings_has_required_fields(self):
        """Wholesale settings contains all required fields"""
        response = requests.get(f"{BASE_URL}/api/users/wholesale/settings")
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ["default_discount_percentage", "quantity_tiers", 
                          "wholesale_registration_enabled", "wholesale_approval_required"]
        
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        print(f"✅ Wholesale settings has all required fields")
    
    def test_default_discount_is_20_percent(self):
        """Default wholesale discount is 20%"""
        response = requests.get(f"{BASE_URL}/api/users/wholesale/settings")
        assert response.status_code == 200
        
        data = response.json()
        assert data["default_discount_percentage"] == 20.0
        print(f"✅ Default wholesale discount is 20%")
    
    def test_quantity_tiers_configured(self):
        """Quantity-based discount tiers are configured"""
        response = requests.get(f"{BASE_URL}/api/users/wholesale/settings")
        assert response.status_code == 200
        
        data = response.json()
        tiers = data["quantity_tiers"]
        
        # Verify expected tiers: 5+ = 25%, 10+ = 30%, 25+ = 35%
        assert len(tiers) >= 3
        
        tier_map = {t["min_qty"]: t["discount_pct"] for t in tiers}
        assert tier_map.get(5) == 25, "Missing 5+ tier at 25%"
        assert tier_map.get(10) == 30, "Missing 10+ tier at 30%"
        assert tier_map.get(25) == 35, "Missing 25+ tier at 35%"
        
        print(f"✅ Quantity tiers configured: {tiers}")
    
    def test_update_wholesale_settings(self):
        """PUT /api/users/wholesale/settings updates settings"""
        # First get current settings
        response = requests.get(f"{BASE_URL}/api/users/wholesale/settings")
        original = response.json()
        
        # Update settings
        payload = {
            "default_discount_percentage": 20.0,
            "quantity_tiers": original["quantity_tiers"],
            "wholesale_registration_enabled": False,
            "wholesale_approval_required": True
        }
        
        response = requests.put(f"{BASE_URL}/api/users/wholesale/settings", json=payload)
        assert response.status_code == 200
        print(f"✅ Wholesale settings updated successfully")


class TestPriceCalculation:
    """Price calculation API for tier-based pricing"""
    
    def test_retail_price_for_no_customer(self):
        """Calculate price returns retail price when no customer_id"""
        response = requests.post(
            f"{BASE_URL}/api/users/calculate-price",
            params={"product_id": EXISTING_PRODUCT_ID, "quantity": 1}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["price_type"] == "retail"
        assert data["discount_applied"] == 0
        assert data["unit_price"] == 40.0  # BPC-157 retail price
        print(f"✅ Retail price: ${data['unit_price']}")
    
    def test_wholesale_price_with_custom_discount(self):
        """Wholesale customer with 25% custom discount gets correct price"""
        response = requests.post(
            f"{BASE_URL}/api/users/calculate-price",
            params={
                "product_id": EXISTING_PRODUCT_ID,
                "customer_id": WHOLESALE_CUSTOMER_WITH_CUSTOM_DISCOUNT,
                "quantity": 1
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["price_type"] == "wholesale"
        assert data["discount_applied"] == 25.0
        assert data["discount_source"] == "customer_override"
        assert data["unit_price"] == 30.0  # 40 * (1 - 0.25) = 30
        assert data["savings"] == 10.0
        print(f"✅ Custom wholesale price: ${data['unit_price']} (25% off)")
    
    def test_wholesale_price_with_global_discount(self):
        """Standard wholesale customer gets global 20% discount"""
        response = requests.post(
            f"{BASE_URL}/api/users/calculate-price",
            params={
                "product_id": EXISTING_PRODUCT_ID,
                "customer_id": STANDARD_WHOLESALE_CUSTOMER,
                "quantity": 1
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["price_type"] == "wholesale"
        assert data["discount_applied"] == 20.0
        assert data["discount_source"] == "global"
        assert data["unit_price"] == 32.0  # 40 * (1 - 0.20) = 32
        print(f"✅ Global wholesale price: ${data['unit_price']} (20% off)")
    
    def test_quantity_tier_5_units(self):
        """5+ units gets 25% discount (overrides 20% global)"""
        response = requests.post(
            f"{BASE_URL}/api/users/calculate-price",
            params={
                "product_id": EXISTING_PRODUCT_ID,
                "customer_id": STANDARD_WHOLESALE_CUSTOMER,
                "quantity": 5
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["discount_applied"] == 25
        assert data["discount_source"] == "quantity_tier_5"
        assert data["unit_price"] == 30.0  # 40 * (1 - 0.25) = 30
        assert data["total"] == 150.0  # 30 * 5
        print(f"✅ Quantity tier 5+: ${data['unit_price']}/unit, total ${data['total']}")
    
    def test_quantity_tier_10_units(self):
        """10+ units gets 30% discount"""
        response = requests.post(
            f"{BASE_URL}/api/users/calculate-price",
            params={
                "product_id": EXISTING_PRODUCT_ID,
                "customer_id": STANDARD_WHOLESALE_CUSTOMER,
                "quantity": 10
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["discount_applied"] == 30
        assert data["discount_source"] == "quantity_tier_10"
        assert data["unit_price"] == 28.0  # 40 * (1 - 0.30) = 28
        assert data["total"] == 280.0  # 28 * 10
        print(f"✅ Quantity tier 10+: ${data['unit_price']}/unit, total ${data['total']}")
    
    def test_quantity_tier_25_units(self):
        """25+ units gets 35% discount"""
        response = requests.post(
            f"{BASE_URL}/api/users/calculate-price",
            params={
                "product_id": EXISTING_PRODUCT_ID,
                "customer_id": STANDARD_WHOLESALE_CUSTOMER,
                "quantity": 25
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["discount_applied"] == 35
        assert data["discount_source"] == "quantity_tier_25"
        assert data["unit_price"] == 26.0  # 40 * (1 - 0.35) = 26
        assert data["total"] == 650.0  # 26 * 25
        print(f"✅ Quantity tier 25+: ${data['unit_price']}/unit, total ${data['total']}")
    
    def test_product_not_found_returns_404(self):
        """Non-existent product returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/users/calculate-price",
            params={"product_id": "non-existent-id", "quantity": 1}
        )
        assert response.status_code == 404
        print(f"✅ Non-existent product returns 404")
    
    def test_savings_calculated_correctly(self):
        """Savings field shows correct amount saved"""
        response = requests.post(
            f"{BASE_URL}/api/users/calculate-price",
            params={
                "product_id": EXISTING_PRODUCT_ID,
                "customer_id": STANDARD_WHOLESALE_CUSTOMER,
                "quantity": 10
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        # Retail: 40 * 10 = 400, Wholesale: 28 * 10 = 280, Savings: 120
        assert data["savings"] == 120.0
        print(f"✅ Savings calculated correctly: ${data['savings']}")


class TestCartPricing:
    """Bulk pricing calculation for cart"""
    
    def test_calculate_cart_pricing(self):
        """POST /api/users/calculate-cart calculates entire cart"""
        payload = {
            "items": [
                {"product_id": EXISTING_PRODUCT_ID, "quantity": 5}
            ],
            "customer_id": STANDARD_WHOLESALE_CUSTOMER
        }
        
        response = requests.post(f"{BASE_URL}/api/users/calculate-cart", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        assert "subtotal" in data
        assert "customer_type" in data
        assert data["customer_type"] == "wholesale"
        print(f"✅ Cart pricing calculated: ${data['subtotal']}")
    
    def test_cart_minimum_order_check(self):
        """Cart pricing checks minimum order for customer"""
        # Wholesale customer with $100 minimum
        payload = {
            "items": [
                {"product_id": EXISTING_PRODUCT_ID, "quantity": 1}  # Only $30 with 25% discount
            ],
            "customer_id": WHOLESALE_CUSTOMER_WITH_CUSTOM_DISCOUNT
        }
        
        response = requests.post(f"{BASE_URL}/api/users/calculate-cart", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "minimum_order_amount" in data
        assert "meets_minimum_order" in data
        assert data["minimum_order_amount"] == 100.0
        assert data["meets_minimum_order"] == False  # $30 < $100
        assert data["amount_to_minimum"] == 70.0  # Need $70 more
        print(f"✅ Minimum order check: need ${data['amount_to_minimum']} more")


class TestProductWholesalePrice:
    """Per-product wholesale price override"""
    
    def test_get_product_wholesale_price(self):
        """GET /api/users/products/{id}/wholesale-price returns pricing info"""
        response = requests.get(f"{BASE_URL}/api/users/products/{EXISTING_PRODUCT_ID}/wholesale-price")
        assert response.status_code == 200
        
        data = response.json()
        assert "product_id" in data
        assert "retail_price" in data
        assert "wholesale_price" in data
        assert "price_source" in data
        print(f"✅ Product wholesale pricing: ${data['wholesale_price']} ({data['price_source']})")
    
    def test_product_not_found_wholesale_price(self):
        """Non-existent product returns 404"""
        response = requests.get(f"{BASE_URL}/api/users/products/non-existent/wholesale-price")
        assert response.status_code == 404
        print(f"✅ Non-existent product returns 404")


class TestRoleVerification:
    """User role verification endpoint"""
    
    def test_verify_customer_role(self):
        """GET /api/users/verify-role returns customer tier info"""
        response = requests.get(
            f"{BASE_URL}/api/users/verify-role",
            params={"user_id": WHOLESALE_CUSTOMER_WITH_CUSTOM_DISCOUNT}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["user_type"] == "customer"
        assert data["customer_tier"] == "wholesale"
        print(f"✅ Role verification: {data['user_type']} - {data['customer_tier']}")
    
    def test_verify_nonexistent_user(self):
        """Non-existent user returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/users/verify-role",
            params={"user_id": "non-existent-user"}
        )
        assert response.status_code == 404
        print(f"✅ Non-existent user returns 404")


class TestPricedProducts:
    """Products with tier-based pricing endpoint"""
    
    def test_priced_products_for_retail(self):
        """GET /api/store/products/priced without customer_id returns retail prices"""
        response = requests.get(f"{BASE_URL}/api/store/products/priced")
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        assert data["customer_type"] == "retail"
        
        if len(data["products"]) > 0:
            product = data["products"][0]
            assert "display_price" in product
        print(f"✅ Priced products (retail): {len(data['products'])} products")
    
    def test_priced_products_for_wholesale(self):
        """GET /api/store/products/priced with wholesale customer shows discounted prices"""
        response = requests.get(
            f"{BASE_URL}/api/store/products/priced",
            params={"customer_id": STANDARD_WHOLESALE_CUSTOMER}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["customer_type"] == "wholesale"
        assert data["wholesale_discount"] == 20.0
        
        if len(data["products"]) > 0:
            product = data["products"][0]
            assert product["display_price"] <= product.get("retail_price", product["price"])
            assert "savings_percentage" in product
        print(f"✅ Priced products (wholesale): shows discounted prices")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
