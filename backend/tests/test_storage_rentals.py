"""
Storage Rentals API Tests
Tests for storage unit sizes, rentals, POS checkout, and admin stats endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "mel@a2gdesigns.com"
ADMIN_PASSWORD = "BigDaddy2016!!"


class TestStorageSizesPublic:
    """Public storage sizes endpoint tests"""
    
    def test_get_storage_sizes_returns_list(self):
        """GET /api/storage-rentals/sizes - should return list of sizes"""
        response = requests.get(f"{BASE_URL}/api/storage-rentals/sizes")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/storage-rentals/sizes returned {len(data)} sizes")
    
    def test_storage_sizes_have_required_fields(self):
        """Verify storage sizes have all required fields"""
        response = requests.get(f"{BASE_URL}/api/storage-rentals/sizes")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            size = data[0]
            required_fields = ['id', 'name', 'width', 'length', 'square_feet', 
                             'monthly_price', 'yearly_price', 'total_units', 'available_units']
            for field in required_fields:
                assert field in size, f"Missing field: {field}"
            print(f"✓ Storage size has all required fields: {required_fields}")
        else:
            pytest.skip("No storage sizes available to test")
    
    def test_get_single_storage_size(self):
        """GET /api/storage-rentals/sizes/{id} - should return single size"""
        # First get all sizes
        response = requests.get(f"{BASE_URL}/api/storage-rentals/sizes")
        assert response.status_code == 200
        sizes = response.json()
        
        if len(sizes) > 0:
            size_id = sizes[0]['id']
            response = requests.get(f"{BASE_URL}/api/storage-rentals/sizes/{size_id}")
            assert response.status_code == 200
            data = response.json()
            assert data['id'] == size_id
            print(f"✓ GET /api/storage-rentals/sizes/{size_id} returned correct size")
        else:
            pytest.skip("No storage sizes available to test")
    
    def test_get_nonexistent_size_returns_404(self):
        """GET /api/storage-rentals/sizes/{invalid_id} - should return 404"""
        response = requests.get(f"{BASE_URL}/api/storage-rentals/sizes/nonexistent-id-12345")
        assert response.status_code == 404
        print("✓ GET nonexistent size returns 404")


class TestAdminAuthentication:
    """Admin authentication tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    def test_admin_login_success(self):
        """POST /api/auth/login - admin login should succeed"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        print("✓ Admin login successful")
    
    def test_admin_login_invalid_credentials(self):
        """POST /api/auth/login - invalid credentials should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 400]
        print("✓ Invalid login returns error")


class TestStorageStats:
    """Admin storage stats endpoint tests"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authenticated headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Authentication failed")
    
    def test_get_storage_stats_requires_auth(self):
        """GET /api/storage-rentals/stats - should require authentication"""
        response = requests.get(f"{BASE_URL}/api/storage-rentals/stats")
        assert response.status_code in [401, 403]
        print("✓ GET /api/storage-rentals/stats requires authentication")
    
    def test_get_storage_stats_with_auth(self, auth_headers):
        """GET /api/storage-rentals/stats - should return stats with auth"""
        response = requests.get(f"{BASE_URL}/api/storage-rentals/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify stats structure
        expected_fields = ['total_sizes', 'total_rentals', 'active_rentals', 
                          'total_revenue', 'total_units', 'available_units', 'occupancy_rate']
        for field in expected_fields:
            assert field in data, f"Missing stats field: {field}"
        
        # Verify data types
        assert isinstance(data['total_units'], int)
        assert isinstance(data['occupancy_rate'], (int, float))
        print(f"✓ Storage stats: {data['total_units']} total units, {data['occupancy_rate']:.1f}% occupancy")


class TestStorageSizesCRUD:
    """Admin CRUD operations for storage sizes"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authenticated headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Authentication failed")
    
    def test_create_storage_size_requires_auth(self):
        """POST /api/storage-rentals/sizes - should require authentication"""
        response = requests.post(f"{BASE_URL}/api/storage-rentals/sizes", json={
            "name": "TEST_5x5",
            "width": 5,
            "length": 5,
            "monthly_price": 49.00,
            "yearly_price": 499.00,
            "description": "Test unit",
            "total_units": 5
        })
        assert response.status_code in [401, 403]
        print("✓ POST /api/storage-rentals/sizes requires authentication")
    
    def test_create_update_delete_storage_size(self, auth_headers):
        """Full CRUD cycle for storage size"""
        # CREATE
        create_payload = {
            "name": "TEST_8x8",
            "width": 8,
            "length": 8,
            "monthly_price": 79.00,
            "yearly_price": 799.00,
            "description": "Test storage unit for automated testing",
            "climate_controlled": True,
            "drive_up_access": True,
            "floor_level": "ground",
            "total_units": 5,
            "features": ["Test feature"]
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/storage-rentals/sizes",
            json=create_payload,
            headers=auth_headers
        )
        assert create_response.status_code == 200
        created = create_response.json()
        assert created['name'] == "TEST_8x8"
        assert created['square_feet'] == 64  # 8x8
        size_id = created['id']
        print(f"✓ Created storage size: {size_id}")
        
        # READ - Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/storage-rentals/sizes/{size_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched['name'] == "TEST_8x8"
        print(f"✓ Verified storage size persisted")
        
        # UPDATE
        update_payload = {
            "name": "TEST_8x8_UPDATED",
            "width": 8,
            "length": 8,
            "monthly_price": 89.00,
            "yearly_price": 899.00,
            "description": "Updated test unit",
            "climate_controlled": True,
            "drive_up_access": True,
            "floor_level": "ground",
            "total_units": 10,
            "features": ["Updated feature"]
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/storage-rentals/sizes/{size_id}",
            json=update_payload,
            headers=auth_headers
        )
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated['name'] == "TEST_8x8_UPDATED"
        assert updated['monthly_price'] == 89.00
        print(f"✓ Updated storage size")
        
        # DELETE
        delete_response = requests.delete(
            f"{BASE_URL}/api/storage-rentals/sizes/{size_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 200
        print(f"✓ Deleted storage size")
        
        # Verify deletion
        verify_response = requests.get(f"{BASE_URL}/api/storage-rentals/sizes/{size_id}")
        assert verify_response.status_code == 404
        print(f"✓ Verified storage size deleted")


class TestRentals:
    """Rental endpoint tests"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authenticated headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Authentication failed")
    
    def test_get_rentals_requires_auth(self):
        """GET /api/storage-rentals/rentals - should require authentication"""
        response = requests.get(f"{BASE_URL}/api/storage-rentals/rentals")
        assert response.status_code in [401, 403]
        print("✓ GET /api/storage-rentals/rentals requires authentication")
    
    def test_get_rentals_with_auth(self, auth_headers):
        """GET /api/storage-rentals/rentals - should return rentals list"""
        response = requests.get(f"{BASE_URL}/api/storage-rentals/rentals", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/storage-rentals/rentals returned {len(data)} rentals")


class TestPOSCheckout:
    """POS checkout endpoint tests"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authenticated headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def available_size_id(self):
        """Get an available storage size ID"""
        response = requests.get(f"{BASE_URL}/api/storage-rentals/sizes")
        if response.status_code == 200:
            sizes = response.json()
            for size in sizes:
                if size.get('available_units', 0) > 0:
                    return size['id']
        pytest.skip("No available storage sizes")
    
    def test_pos_checkout_requires_auth(self, available_size_id):
        """POST /api/storage-rentals/pos/checkout - should require authentication"""
        response = requests.post(f"{BASE_URL}/api/storage-rentals/pos/checkout", json={
            "unit_size_id": available_size_id,
            "customer": {
                "first_name": "Test",
                "last_name": "Customer",
                "email": "test@example.com",
                "phone": "555-555-5555",
                "address": "123 Test St",
                "city": "Dothan",
                "state": "AL",
                "zip_code": "36301"
            },
            "billing_type": "monthly",
            "origin_url": "https://test.com"
        })
        assert response.status_code in [401, 403]
        print("✓ POST /api/storage-rentals/pos/checkout requires authentication")
    
    def test_pos_checkout_creates_rental(self, auth_headers, available_size_id):
        """POST /api/storage-rentals/pos/checkout - should create paid rental"""
        response = requests.post(
            f"{BASE_URL}/api/storage-rentals/pos/checkout",
            json={
                "unit_size_id": available_size_id,
                "customer": {
                    "first_name": "TEST_POS",
                    "last_name": "Customer",
                    "email": "test_pos@example.com",
                    "phone": "555-555-5555",
                    "address": "123 Test St",
                    "city": "Dothan",
                    "state": "AL",
                    "zip_code": "36301"
                },
                "billing_type": "monthly",
                "origin_url": "https://test.com"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert 'rental_id' in data
        assert 'unit_number' in data
        assert 'access_code' in data
        assert 'price' in data
        assert data['status'] == 'active'
        
        # Verify access code is 4 digits
        assert len(data['access_code']) == 4
        assert data['access_code'].isdigit()
        
        print(f"✓ POS checkout created rental: {data['rental_id']}")
        print(f"  Unit: {data['unit_number']}, Access Code: {data['access_code']}, Price: ${data['price']}")
        
        # Verify rental was created with paid status
        rental_response = requests.get(
            f"{BASE_URL}/api/storage-rentals/rentals/{data['rental_id']}",
            headers=auth_headers
        )
        assert rental_response.status_code == 200
        rental = rental_response.json()
        assert rental['payment_status'] == 'paid'
        assert rental['status'] == 'active'
        print(f"✓ Verified rental is marked as paid and active")


class TestOnlineRentalCheckout:
    """Online rental checkout (Stripe) endpoint tests"""
    
    @pytest.fixture
    def available_size_id(self):
        """Get an available storage size ID"""
        response = requests.get(f"{BASE_URL}/api/storage-rentals/sizes")
        if response.status_code == 200:
            sizes = response.json()
            for size in sizes:
                if size.get('available_units', 0) > 0:
                    return size['id']
        pytest.skip("No available storage sizes")
    
    def test_create_rental_returns_checkout_url(self, available_size_id):
        """POST /api/storage-rentals/rentals - should return Stripe checkout URL"""
        response = requests.post(
            f"{BASE_URL}/api/storage-rentals/rentals",
            json={
                "unit_size_id": available_size_id,
                "customer": {
                    "first_name": "TEST_Online",
                    "last_name": "Customer",
                    "email": "test_online@example.com",
                    "phone": "555-555-5556",
                    "address": "456 Test Ave",
                    "city": "Dothan",
                    "state": "AL",
                    "zip_code": "36301"
                },
                "billing_type": "monthly",
                "origin_url": "https://a2g-integration.preview.emergentagent.com"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response has checkout URL
        assert 'rental_id' in data
        assert 'checkout_url' in data
        assert 'session_id' in data
        
        # Verify checkout URL is a Stripe URL
        assert 'stripe.com' in data['checkout_url'] or 'checkout' in data['checkout_url']
        
        print(f"✓ Online rental created: {data['rental_id']}")
        print(f"  Checkout URL generated: {data['checkout_url'][:50]}...")
    
    def test_create_rental_with_invalid_size_returns_404(self):
        """POST /api/storage-rentals/rentals - invalid size should return 404"""
        response = requests.post(
            f"{BASE_URL}/api/storage-rentals/rentals",
            json={
                "unit_size_id": "invalid-size-id-12345",
                "customer": {
                    "first_name": "Test",
                    "last_name": "Customer",
                    "email": "test@example.com",
                    "phone": "555-555-5555",
                    "address": "123 Test St",
                    "city": "Dothan",
                    "state": "AL",
                    "zip_code": "36301"
                },
                "billing_type": "monthly",
                "origin_url": "https://test.com"
            }
        )
        assert response.status_code == 404
        print("✓ Invalid size ID returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
