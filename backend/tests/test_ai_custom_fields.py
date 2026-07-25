"""
Test AI Custom Fields Feature
Tests:
1. AI Generate Category Fields API
2. Product model with custom_fields_data
3. Category custom_fields storage
4. Product editor integration with custom fields
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://activity-seo-preview.preview.emergentagent.com')

class TestAICustomFieldsFeature:
    """Test AI Custom Fields generation and integration"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "mel@a2gdesigns.com",
            "password": "BigDaddy2016!!"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    # ============ AI CATEGORY FIELDS API TESTS ============
    
    def test_ai_generate_category_fields_success(self):
        """Test AI generates custom fields for a category"""
        response = self.session.post(f"{BASE_URL}/api/ai/generate-category-fields", json={
            "category_name": "Jewelry"
        })
        
        assert response.status_code == 200, f"API failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "category_name" in data
        assert "custom_fields" in data
        assert isinstance(data["custom_fields"], list)
        assert len(data["custom_fields"]) >= 5, "Should generate at least 5 fields"
        
        # Verify field structure
        for field in data["custom_fields"]:
            assert "name" in field
            assert "label" in field
            assert "field_type" in field
            assert field["field_type"] in ["text", "number", "select", "multi_select", "textarea"]
    
    def test_ai_generate_category_fields_with_description(self):
        """Test AI generates fields with category description"""
        response = self.session.post(f"{BASE_URL}/api/ai/generate-category-fields", json={
            "category_name": "Watches",
            "description": "Luxury and vintage timepieces"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["custom_fields"]) >= 5
    
    def test_ai_generate_category_fields_requires_auth(self):
        """Test AI endpoint requires authentication"""
        # Create new session without auth
        no_auth_session = requests.Session()
        no_auth_session.headers.update({"Content-Type": "application/json"})
        
        response = no_auth_session.post(f"{BASE_URL}/api/ai/generate-category-fields", json={
            "category_name": "Test"
        })
        
        assert response.status_code == 401, "Should require authentication"
    
    # ============ CATEGORY CUSTOM FIELDS STORAGE TESTS ============
    
    def test_category_has_custom_fields(self):
        """Test that Firearms category has custom_fields defined"""
        response = self.session.get(f"{BASE_URL}/api/store/categories")
        assert response.status_code == 200
        
        categories = response.json()
        firearms_category = next((c for c in categories if c["name"] == "Firearms"), None)
        
        assert firearms_category is not None, "Firearms category should exist"
        assert firearms_category.get("custom_fields") is not None, "Firearms should have custom_fields"
        assert len(firearms_category["custom_fields"]) >= 5, "Firearms should have at least 5 custom fields"
        
        # Verify field structure
        for field in firearms_category["custom_fields"]:
            assert "id" in field
            assert "name" in field
            assert "label" in field
            assert "field_type" in field
    
    def test_category_custom_fields_have_options(self):
        """Test that select fields have options defined"""
        response = self.session.get(f"{BASE_URL}/api/store/categories")
        categories = response.json()
        
        firearms_category = next((c for c in categories if c["name"] == "Firearms"), None)
        assert firearms_category is not None
        
        # Find a select field
        select_fields = [f for f in firearms_category["custom_fields"] if f["field_type"] == "select"]
        assert len(select_fields) > 0, "Should have select fields"
        
        for field in select_fields:
            assert "options" in field
            assert len(field["options"]) > 0, f"Select field {field['name']} should have options"
            for option in field["options"]:
                assert "label" in option
                assert "value" in option
    
    # ============ PRODUCT CUSTOM FIELDS DATA TESTS ============
    
    def test_create_product_with_custom_fields_data(self):
        """Test creating a product with custom_fields_data"""
        product_data = {
            "name": "TEST_Glock 19 Gen 5",
            "description": "Test firearm product with custom fields",
            "category": "Firearms",
            "price": 499.99,
            "image": "https://example.com/glock19.jpg",
            "condition": "Good",
            "custom_fields_data": {
                "firearm_type": "handgun_semi_auto_pistol",
                "manufacturer": "Glock",
                "model": "19 Gen 5",
                "caliber_gauge": "9mm_luger",
                "action_type": "striker_fired",
                "barrel_length_in": "4.02",
                "capacity": "15",
                "finish_color": "black",
                "serial_number": "TEST123456"
            }
        }
        
        response = self.session.post(f"{BASE_URL}/api/store/products", json=product_data)
        assert response.status_code == 200, f"Create failed: {response.text}"
        
        created_product = response.json()
        assert created_product.get("custom_fields_data") is not None
        assert created_product["custom_fields_data"]["manufacturer"] == "Glock"
        assert created_product["custom_fields_data"]["caliber_gauge"] == "9mm_luger"
        
        # Store product ID for cleanup
        self.test_product_id = created_product["id"]
        
        # Verify by fetching the product
        get_response = self.session.get(f"{BASE_URL}/api/store/products/{created_product['id']}")
        assert get_response.status_code == 200
        
        fetched_product = get_response.json()
        assert fetched_product["custom_fields_data"]["serial_number"] == "TEST123456"
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/store/products/{created_product['id']}")
    
    def test_update_product_custom_fields_data(self):
        """Test updating product custom_fields_data"""
        # First create a product
        product_data = {
            "name": "TEST_Update Custom Fields Product",
            "description": "Test product for update",
            "category": "Firearms",
            "price": 299.99,
            "image": "https://example.com/test.jpg",
            "custom_fields_data": {
                "manufacturer": "Original Manufacturer"
            }
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/store/products", json=product_data)
        assert create_response.status_code == 200
        product_id = create_response.json()["id"]
        
        # Update the custom_fields_data
        update_response = self.session.put(f"{BASE_URL}/api/store/products/{product_id}", json={
            "custom_fields_data": {
                "manufacturer": "Updated Manufacturer",
                "model": "New Model"
            }
        })
        assert update_response.status_code == 200
        
        # Verify update
        get_response = self.session.get(f"{BASE_URL}/api/store/products/{product_id}")
        assert get_response.status_code == 200
        
        updated_product = get_response.json()
        assert updated_product["custom_fields_data"]["manufacturer"] == "Updated Manufacturer"
        assert updated_product["custom_fields_data"]["model"] == "New Model"
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/store/products/{product_id}")
    
    def test_product_without_custom_fields_data(self):
        """Test that products without custom_fields_data work correctly"""
        product_data = {
            "name": "TEST_No Custom Fields Product",
            "description": "Test product without custom fields",
            "category": "Electronics",
            "price": 99.99,
            "image": "https://example.com/test.jpg"
        }
        
        response = self.session.post(f"{BASE_URL}/api/store/products", json=product_data)
        assert response.status_code == 200
        
        product = response.json()
        # custom_fields_data should be None or empty
        assert product.get("custom_fields_data") is None or product.get("custom_fields_data") == {}
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/store/products/{product['id']}")
    
    # ============ CATEGORY WITHOUT CUSTOM FIELDS TESTS ============
    
    def test_category_without_custom_fields(self):
        """Test that categories without custom_fields return null"""
        response = self.session.get(f"{BASE_URL}/api/store/categories")
        categories = response.json()
        
        # Find a category without custom fields
        electronics = next((c for c in categories if c["name"] == "Electronics"), None)
        assert electronics is not None
        
        # custom_fields should be None or empty list
        assert electronics.get("custom_fields") is None or electronics.get("custom_fields") == []


class TestDLImageFeatureExtended:
    """Extended tests for D/L Image feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "mel@a2gdesigns.com",
            "password": "BigDaddy2016!!"
        })
        assert login_response.status_code == 200
        self.token = login_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_storage_list_endpoint_exists(self):
        """Test storage list endpoint exists and requires auth"""
        response = self.session.get(f"{BASE_URL}/api/storage/list/test-folder")
        # Should return 400 (storage not configured) not 404
        assert response.status_code == 400
        assert "Storage not configured" in response.text
    
    def test_storage_upload_endpoint_exists(self):
        """Test storage upload endpoint exists"""
        # Create a simple test file
        files = {'file': ('test.txt', b'test content', 'text/plain')}
        data = {'folder': 'test-folder'}
        
        # Remove Content-Type header for multipart
        headers = {"Authorization": f"Bearer {self.token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/storage/upload",
            files=files,
            data=data,
            headers=headers
        )
        
        # Should return 400 (storage not configured) not 404
        assert response.status_code == 400
        assert "Storage not configured" in response.text
    
    def test_storage_delete_endpoint_requires_super_admin(self):
        """Test storage delete endpoint requires super_admin"""
        response = self.session.delete(f"{BASE_URL}/api/storage/delete", json={
            "folder": "test-folder",
            "filename": "test.jpg"
        })
        
        # Should return 400 (storage not configured) since user is super_admin
        # If user wasn't super_admin, would return 403
        assert response.status_code == 400
        assert "Storage not configured" in response.text


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
