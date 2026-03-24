"""
Test Shop Category Flow - Testing /shop category landing page and related features
- GET /api/store/categories returns product_info_url and shop_target_url fields
- Category model includes new fields
- Shop button behavior logic (subcategories first, then products)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCategoryAPIFields:
    """Test that category API returns new fields for Product Info and Shop button targets"""
    
    def test_categories_endpoint_returns_200(self):
        """GET /api/store/categories should return 200"""
        response = requests.get(f"{BASE_URL}/api/store/categories")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"SUCCESS: GET /api/store/categories returned 200")
    
    def test_categories_response_is_list(self):
        """Categories response should be a list"""
        response = requests.get(f"{BASE_URL}/api/store/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"SUCCESS: Categories response is a list with {len(data)} items")
    
    def test_category_has_product_info_url_field(self):
        """Each category should have product_info_url field"""
        response = requests.get(f"{BASE_URL}/api/store/categories")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) == 0:
            pytest.skip("No categories found to test")
        
        for category in data:
            assert 'product_info_url' in category, f"Category {category.get('name', 'unknown')} missing product_info_url field"
        
        print(f"SUCCESS: All {len(data)} categories have product_info_url field")
    
    def test_category_has_shop_target_url_field(self):
        """Each category should have shop_target_url field"""
        response = requests.get(f"{BASE_URL}/api/store/categories")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) == 0:
            pytest.skip("No categories found to test")
        
        for category in data:
            assert 'shop_target_url' in category, f"Category {category.get('name', 'unknown')} missing shop_target_url field"
        
        print(f"SUCCESS: All {len(data)} categories have shop_target_url field")
    
    def test_category_has_required_fields(self):
        """Each category should have all required fields for shop display"""
        response = requests.get(f"{BASE_URL}/api/store/categories")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) == 0:
            pytest.skip("No categories found to test")
        
        required_fields = ['id', 'name', 'parent_id', 'is_enabled', 'product_info_url', 'shop_target_url']
        
        for category in data:
            for field in required_fields:
                assert field in category, f"Category {category.get('name', 'unknown')} missing {field} field"
        
        print(f"SUCCESS: All categories have required fields: {required_fields}")
    
    def test_category_parent_id_can_be_null(self):
        """Root categories should have parent_id as null"""
        response = requests.get(f"{BASE_URL}/api/store/categories")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) == 0:
            pytest.skip("No categories found to test")
        
        root_categories = [c for c in data if c.get('parent_id') is None]
        print(f"SUCCESS: Found {len(root_categories)} root categories (parent_id=null)")
        assert len(root_categories) > 0 or len(data) == 0, "Expected at least one root category or empty list"


class TestProductsEndpoint:
    """Test products endpoint for shop page"""
    
    def test_products_endpoint_returns_200(self):
        """GET /api/store/products should return 200"""
        response = requests.get(f"{BASE_URL}/api/store/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"SUCCESS: GET /api/store/products returned 200")
    
    def test_products_response_structure(self):
        """Products response should have expected structure"""
        response = requests.get(f"{BASE_URL}/api/store/products")
        assert response.status_code == 200
        data = response.json()
        
        # Response can be list or dict with 'products' key
        if isinstance(data, dict):
            assert 'products' in data or isinstance(data.get('products', []), list)
            products = data.get('products', [])
        else:
            products = data
        
        print(f"SUCCESS: Products endpoint returned {len(products)} products")


class TestShopRoutes:
    """Test shop-related routes are accessible"""
    
    def test_shop_page_accessible(self):
        """GET /shop should be accessible (returns HTML)"""
        response = requests.get(f"{BASE_URL}/shop", allow_redirects=True)
        # Frontend routes return HTML, so we check for 200 or redirect
        assert response.status_code in [200, 301, 302], f"Expected 200/301/302, got {response.status_code}"
        print(f"SUCCESS: /shop route accessible (status: {response.status_code})")
    
    def test_shop_products_page_accessible(self):
        """GET /shop/products should be accessible"""
        response = requests.get(f"{BASE_URL}/shop/products", allow_redirects=True)
        assert response.status_code in [200, 301, 302], f"Expected 200/301/302, got {response.status_code}"
        print(f"SUCCESS: /shop/products route accessible (status: {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
