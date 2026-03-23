"""
Multi-Provider Shipping Integration Tests
Tests for: Shipping rates API, free shipping threshold, order creation with shipping details
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestShippingSettings:
    """Test shipping settings retrieval"""
    
    def test_get_shipping_settings_returns_200(self):
        """GET /api/shipping/settings returns 200"""
        response = requests.get(f"{BASE_URL}/api/shipping/settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /api/shipping/settings returns 200")
    
    def test_shipping_settings_has_required_fields(self):
        """Shipping settings contains all required fields"""
        response = requests.get(f"{BASE_URL}/api/shipping/settings")
        data = response.json()
        
        required_fields = [
            'active_provider', 'shippo_enabled', 'easypost_enabled', 'shipstation_enabled',
            'global_upcharge_type', 'global_upcharge_amount', 
            'free_shipping_enabled', 'free_shipping_threshold',
            'origin_name', 'origin_street1', 'origin_city', 'origin_state', 'origin_zip'
        ]
        
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        print("✅ Shipping settings contains all required fields")
    
    def test_free_shipping_is_enabled(self):
        """Free shipping is enabled with correct threshold"""
        response = requests.get(f"{BASE_URL}/api/shipping/settings")
        data = response.json()
        
        assert data.get('free_shipping_enabled') == True, "Free shipping should be enabled"
        assert data.get('free_shipping_threshold') == 100.0, f"Expected threshold 100, got {data.get('free_shipping_threshold')}"
        print("✅ Free shipping enabled with $100 threshold")


class TestShippingRatesCheckout:
    """Test checkout shipping rates endpoint"""
    
    @pytest.fixture
    def sample_address(self):
        return {
            "name": "Test User",
            "street1": "123 Main St",
            "city": "Miami",
            "state": "FL",
            "zip_code": "33101",
            "country": "US"
        }
    
    def test_checkout_rates_returns_200(self, sample_address):
        """POST /api/shipping/rates/checkout returns 200"""
        response = requests.post(
            f"{BASE_URL}/api/shipping/rates/checkout",
            json={
                "to_address": sample_address,
                "weight_oz": 8,
                "order_subtotal": 50
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ POST /api/shipping/rates/checkout returns 200")
    
    def test_checkout_rates_returns_rates_array(self, sample_address):
        """Checkout rates returns rates array"""
        response = requests.post(
            f"{BASE_URL}/api/shipping/rates/checkout",
            json={
                "to_address": sample_address,
                "weight_oz": 8,
                "order_subtotal": 50
            }
        )
        data = response.json()
        
        assert 'rates' in data, "Response should contain 'rates' array"
        assert isinstance(data['rates'], list), "rates should be a list"
        assert len(data['rates']) > 0, "Should return at least one rate"
        print(f"✅ Checkout rates returns {len(data['rates'])} rates")
    
    def test_rates_sorted_by_price_cheapest_first(self, sample_address):
        """Rates are sorted by price (cheapest first)"""
        response = requests.post(
            f"{BASE_URL}/api/shipping/rates/checkout",
            json={
                "to_address": sample_address,
                "weight_oz": 8,
                "order_subtotal": 50
            }
        )
        data = response.json()
        rates = data['rates']
        
        # Verify rates are sorted by rate_with_upcharge (cheapest first)
        prices = [r.get('rate_with_upcharge', r.get('rate', 0)) for r in rates]
        assert prices == sorted(prices), f"Rates not sorted by price. Got: {prices}"
        print(f"✅ Rates sorted by price (cheapest first): {prices}")
    
    def test_no_free_shipping_below_threshold(self, sample_address):
        """No free shipping when order below threshold"""
        response = requests.post(
            f"{BASE_URL}/api/shipping/rates/checkout",
            json={
                "to_address": sample_address,
                "weight_oz": 8,
                "order_subtotal": 50  # Below $100 threshold
            }
        )
        data = response.json()
        
        assert data.get('free_shipping_eligible') == False, "Should not be eligible for free shipping"
        
        # Verify no free shipping rate in list
        free_rates = [r for r in data['rates'] if r.get('is_free') == True or r.get('rate') == 0]
        assert len(free_rates) == 0, "Should not have free shipping rates"
        print("✅ No free shipping below $100 threshold")
    
    def test_free_shipping_above_threshold(self, sample_address):
        """Free shipping appears when order above threshold"""
        response = requests.post(
            f"{BASE_URL}/api/shipping/rates/checkout",
            json={
                "to_address": sample_address,
                "weight_oz": 8,
                "order_subtotal": 150  # Above $100 threshold
            }
        )
        data = response.json()
        
        assert data.get('free_shipping_eligible') == True, "Should be eligible for free shipping"
        assert data.get('free_shipping_threshold') == 100.0, "Threshold should be $100"
        print("✅ Order qualifies for free shipping above $100")
    
    def test_free_shipping_appears_first(self, sample_address):
        """Free shipping rate appears first when eligible"""
        response = requests.post(
            f"{BASE_URL}/api/shipping/rates/checkout",
            json={
                "to_address": sample_address,
                "weight_oz": 8,
                "order_subtotal": 150  # Above threshold
            }
        )
        data = response.json()
        rates = data['rates']
        
        # First rate should be free shipping
        first_rate = rates[0]
        assert first_rate.get('is_free') == True, f"First rate should be free. Got: {first_rate}"
        assert first_rate.get('rate') == 0, "Free rate should be $0"
        assert first_rate.get('carrier') == 'FREE', f"Carrier should be FREE. Got: {first_rate.get('carrier')}"
        print("✅ Free shipping appears first when eligible")
    
    def test_rates_have_required_fields(self, sample_address):
        """Each rate has required fields"""
        response = requests.post(
            f"{BASE_URL}/api/shipping/rates/checkout",
            json={
                "to_address": sample_address,
                "weight_oz": 8,
                "order_subtotal": 50
            }
        )
        data = response.json()
        
        required_rate_fields = ['provider', 'carrier', 'service', 'rate', 'rate_id']
        
        for rate in data['rates']:
            for field in required_rate_fields:
                assert field in rate, f"Rate missing field: {field}. Rate: {rate}"
        print("✅ All rates have required fields")
    
    def test_response_includes_providers_queried(self, sample_address):
        """Response includes providers_queried array"""
        response = requests.post(
            f"{BASE_URL}/api/shipping/rates/checkout",
            json={
                "to_address": sample_address,
                "weight_oz": 8,
                "order_subtotal": 50
            }
        )
        data = response.json()
        
        assert 'providers_queried' in data, "Response should include providers_queried"
        assert isinstance(data['providers_queried'], list), "providers_queried should be a list"
        # Since no providers are configured, this should be empty (fallback rates used)
        print(f"✅ Response includes providers_queried: {data['providers_queried']}")
    
    def test_fallback_rates_when_no_providers(self, sample_address):
        """Fallback rates used when no providers configured"""
        response = requests.post(
            f"{BASE_URL}/api/shipping/rates/checkout",
            json={
                "to_address": sample_address,
                "weight_oz": 8,
                "order_subtotal": 50
            }
        )
        data = response.json()
        
        # Should have fallback rates
        fallback_rates = [r for r in data['rates'] if r.get('provider') == 'fallback']
        assert len(fallback_rates) > 0, "Should have fallback rates when no providers configured"
        print(f"✅ Fallback rates used ({len(fallback_rates)} rates)")


class TestOrderCreationWithShipping:
    """Test order creation with selected_shipping field"""
    
    @pytest.fixture
    def sample_shipping_info(self):
        return {
            "firstName": "Test",
            "lastName": "User",
            "email": "test@example.com",
            "phone": "555-123-4567",
            "address1": "123 Main St",
            "city": "Miami",
            "state": "FL",
            "zipCode": "33101",
            "country": "US"
        }
    
    @pytest.fixture
    def sample_cart_items(self):
        return [
            {
                "product_id": "test-product-1",
                "name": "BPC-157 (5mg)",
                "price": 44.95,
                "quantity": 2
            }
        ]
    
    def test_order_with_selected_shipping(self, sample_shipping_info, sample_cart_items):
        """Order can be created with selected_shipping details"""
        selected_shipping = {
            "provider": "fallback",
            "carrier": "USPS",
            "service": "Priority Mail (2-3 days)",
            "rate": 8.50,
            "rate_with_upcharge": 8.50,
            "rate_id": "fallback_priority",
            "estimated_days": 3,
            "is_free": False
        }
        
        order_data = {
            "items": sample_cart_items,
            "shipping": sample_shipping_info,
            "subtotal": 89.90,
            "shipping_cost": 8.50,
            "tax": 7.42,
            "total": 105.82,
            "customer_email": sample_shipping_info["email"],
            "customer_name": f"{sample_shipping_info['firstName']} {sample_shipping_info['lastName']}",
            "payment_method": "demo",
            "selected_shipping": selected_shipping
        }
        
        response = requests.post(
            f"{BASE_URL}/api/payments/orders",
            json=order_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data.get('success') == True, "Order creation should succeed"
        assert 'order' in data, "Response should contain order"
        print(f"✅ Order created with selected_shipping: {data['order'].get('order_number')}")
    
    def test_order_persists_shipping_details(self, sample_shipping_info, sample_cart_items):
        """Order persists selected_shipping details"""
        selected_shipping = {
            "provider": "store",
            "carrier": "FREE",
            "service": "Free Ground Shipping",
            "rate": 0,
            "rate_with_upcharge": 0,
            "rate_id": "free_shipping",
            "estimated_days": 5,
            "is_free": True
        }
        
        order_data = {
            "items": sample_cart_items,
            "shipping": sample_shipping_info,
            "subtotal": 89.90,
            "shipping_cost": 0,
            "tax": 7.42,
            "total": 97.32,
            "customer_email": sample_shipping_info["email"],
            "customer_name": f"{sample_shipping_info['firstName']} {sample_shipping_info['lastName']}",
            "payment_method": "demo",
            "selected_shipping": selected_shipping
        }
        
        # Create order
        create_response = requests.post(
            f"{BASE_URL}/api/payments/orders",
            json=order_data
        )
        
        assert create_response.status_code == 200
        order = create_response.json()['order']
        order_id = order['id']
        
        # Fetch order to verify shipping details persisted
        get_response = requests.get(f"{BASE_URL}/api/payments/orders/{order_id}")
        assert get_response.status_code == 200, f"Could not fetch order: {get_response.status_code}"
        
        fetched_order = get_response.json()
        assert 'selected_shipping' in fetched_order, "Order should have selected_shipping"
        assert fetched_order['selected_shipping']['is_free'] == True, "Should be free shipping"
        assert fetched_order['selected_shipping']['carrier'] == 'FREE', "Carrier should be FREE"
        print(f"✅ Order persists shipping details: {fetched_order['selected_shipping']}")
    
    def test_shipping_cost_in_order_total(self, sample_shipping_info, sample_cart_items):
        """Shipping cost is correctly applied to order total"""
        selected_shipping = {
            "provider": "fallback",
            "carrier": "USPS",
            "service": "Express (1-2 days)",
            "rate": 26.50,
            "rate_with_upcharge": 26.50,
            "rate_id": "fallback_express",
            "estimated_days": 1,
            "is_free": False
        }
        
        subtotal = 89.90
        shipping_cost = 26.50
        tax = subtotal * 0.0825  # 8.25% tax
        total = subtotal + shipping_cost + tax
        
        order_data = {
            "items": sample_cart_items,
            "shipping": sample_shipping_info,
            "subtotal": subtotal,
            "shipping_cost": shipping_cost,
            "tax": round(tax, 2),
            "total": round(total, 2),
            "customer_email": sample_shipping_info["email"],
            "customer_name": f"{sample_shipping_info['firstName']} {sample_shipping_info['lastName']}",
            "payment_method": "demo",
            "selected_shipping": selected_shipping
        }
        
        response = requests.post(
            f"{BASE_URL}/api/payments/orders",
            json=order_data
        )
        
        assert response.status_code == 200
        order = response.json()['order']
        
        assert order['subtotal'] == subtotal, f"Subtotal mismatch: {order['subtotal']} != {subtotal}"
        assert order['shipping_cost'] == shipping_cost, f"Shipping cost mismatch: {order['shipping_cost']} != {shipping_cost}"
        assert order['total'] == round(total, 2), f"Total mismatch: {order['total']} != {round(total, 2)}"
        print(f"✅ Order total correct: ${order['total']} (subtotal: ${subtotal}, shipping: ${shipping_cost}, tax: ${round(tax, 2)})")


class TestShippingRatesValidation:
    """Test shipping rates validation and edge cases"""
    
    def test_rates_request_requires_address(self):
        """Rates request requires valid address"""
        response = requests.post(
            f"{BASE_URL}/api/shipping/rates/checkout",
            json={
                "weight_oz": 8,
                "order_subtotal": 50
                # Missing to_address
            }
        )
        # Should return 422 for validation error
        assert response.status_code == 422, f"Expected 422 for missing address, got {response.status_code}"
        print("✅ Rates request validates required address")
    
    def test_rates_with_zero_subtotal(self):
        """Rates work with zero subtotal"""
        response = requests.post(
            f"{BASE_URL}/api/shipping/rates/checkout",
            json={
                "to_address": {
                    "name": "Test",
                    "street1": "123 Main",
                    "city": "Miami",
                    "state": "FL",
                    "zip_code": "33101",
                    "country": "US"
                },
                "weight_oz": 8,
                "order_subtotal": 0
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data['free_shipping_eligible'] == False, "Zero subtotal should not qualify for free shipping"
        print("✅ Rates work with zero subtotal")
    
    def test_rates_at_exact_threshold(self):
        """Rates at exact free shipping threshold"""
        response = requests.post(
            f"{BASE_URL}/api/shipping/rates/checkout",
            json={
                "to_address": {
                    "name": "Test",
                    "street1": "123 Main",
                    "city": "Miami",
                    "state": "FL",
                    "zip_code": "33101",
                    "country": "US"
                },
                "weight_oz": 8,
                "order_subtotal": 100  # Exactly at threshold
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # At exactly $100, should be eligible (>= threshold)
        assert data['free_shipping_eligible'] == True, "Order at exactly $100 should qualify for free shipping"
        print("✅ Order at exact threshold ($100) qualifies for free shipping")


class TestShippingProviderIntegration:
    """Tests for multi-provider shipping (MOCKED - no real API keys)"""
    
    def test_no_providers_enabled_returns_fallback(self):
        """When no providers enabled, fallback rates returned"""
        # First check settings
        settings_response = requests.get(f"{BASE_URL}/api/shipping/settings")
        settings = settings_response.json()
        
        # Verify all providers disabled
        assert settings.get('shippo_enabled') == False, "Shippo should be disabled"
        assert settings.get('easypost_enabled') == False, "EasyPost should be disabled"
        assert settings.get('shipstation_enabled') == False, "ShipStation should be disabled"
        
        # Get rates
        rates_response = requests.post(
            f"{BASE_URL}/api/shipping/rates/checkout",
            json={
                "to_address": {
                    "name": "Test",
                    "street1": "123 Main",
                    "city": "Miami",
                    "state": "FL",
                    "zip_code": "33101",
                    "country": "US"
                },
                "weight_oz": 8,
                "order_subtotal": 50
            }
        )
        
        data = rates_response.json()
        assert len(data['providers_queried']) == 0, "No providers should be queried"
        
        # All rates should be fallback
        for rate in data['rates']:
            assert rate['provider'] == 'fallback', f"Expected fallback provider, got: {rate['provider']}"
        
        print("✅ Fallback rates returned when no providers enabled (MOCKED)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
