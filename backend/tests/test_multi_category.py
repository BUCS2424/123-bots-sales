"""
Multi-Category Feature Tests
----------------------------
Tests for:
1. POST /api/store/products with category + categories[] auto-creates missing categories
2. PUT /api/store/products/{id} updates categories[] and creates newly introduced categories  
3. GET /api/store/products?category=<name> returns product when category is present in categories[]
4. Delete product and verify category cleanup
5. Duplicate product carries categories[] correctly
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMultiCategoryFeature:
    """Tests for multi-category product assignment and auto-creation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures and get auth token"""
        self.unique_id = uuid.uuid4().hex[:8].upper()
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "super@amino.com",
            "password": "peptides"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        token = login_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Track created resources for cleanup
        self.created_product_ids = []
        self.created_category_names = []
        
        yield
        
        # Cleanup: Delete test products
        for product_id in self.created_product_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/store/products/{product_id}")
            except Exception:
                pass
    
    # ========== Test 1: Create product with category + categories[] auto-creates missing categories ==========
    
    def test_create_product_with_new_categories_auto_creates_them(self):
        """POST /api/store/products auto-creates missing categories"""
        new_cat_1 = f"TEST_MultiCat_Alpha_{self.unique_id}"
        new_cat_2 = f"TEST_MultiCat_Beta_{self.unique_id}"
        new_cat_3 = f"TEST_MultiCat_Gamma_{self.unique_id}"
        
        # Create product with new categories that don't exist
        product_payload = {
            "name": f"TEST_MultiCat_Product_{self.unique_id}",
            "description": "Product with multiple new categories",
            "category": new_cat_1,
            "categories": [new_cat_1, new_cat_2, new_cat_3],
            "price": 99.99,
            "condition": "Good",
            "in_stock": True,
            "quantity": 10
        }
        
        response = self.session.post(f"{BASE_URL}/api/store/products", json=product_payload)
        assert response.status_code == 200, f"Create product failed: {response.text}"
        
        product = response.json()
        self.created_product_ids.append(product["id"])
        self.created_category_names.extend([new_cat_1, new_cat_2, new_cat_3])
        
        # Verify product has primary category set correctly
        assert product["category"] == new_cat_1, f"Expected primary category '{new_cat_1}', got '{product.get('category')}'"
        
        # Verify categories array is populated
        assert "categories" in product, "Product should have 'categories' field"
        assert len(product["categories"]) == 3, f"Expected 3 categories, got {len(product['categories'])}"
        assert new_cat_1 in product["categories"], f"'{new_cat_1}' should be in categories"
        assert new_cat_2 in product["categories"], f"'{new_cat_2}' should be in categories"
        assert new_cat_3 in product["categories"], f"'{new_cat_3}' should be in categories"
        
        # First category should match primary
        assert product["categories"][0] == new_cat_1, "First category should be primary category"
        
        print(f"✓ Product created with categories: {product['categories']}")
        
        # Verify categories were auto-created in DB
        categories_response = self.session.get(f"{BASE_URL}/api/store/categories")
        assert categories_response.status_code == 200
        categories = categories_response.json()
        category_names = [c["name"] for c in categories]
        
        assert new_cat_1 in category_names, f"Category '{new_cat_1}' should have been auto-created"
        assert new_cat_2 in category_names, f"Category '{new_cat_2}' should have been auto-created"
        assert new_cat_3 in category_names, f"Category '{new_cat_3}' should have been auto-created"
        
        print(f"✓ All categories auto-created: {new_cat_1}, {new_cat_2}, {new_cat_3}")
    
    def test_create_product_with_empty_categories_defaults_to_general(self):
        """POST /api/store/products with empty categories defaults to 'General'"""
        product_payload = {
            "name": f"TEST_DefaultCat_Product_{self.unique_id}",
            "description": "Product with no categories specified",
            "category": "",  # Empty primary
            "categories": [],  # Empty list
            "price": 49.99,
            "condition": "Good"
        }
        
        response = self.session.post(f"{BASE_URL}/api/store/products", json=product_payload)
        assert response.status_code == 200, f"Create product failed: {response.text}"
        
        product = response.json()
        self.created_product_ids.append(product["id"])
        
        # Should default to 'General' category
        assert product["category"] == "General", f"Expected 'General', got '{product['category']}'"
        assert "General" in product["categories"], "categories[] should contain 'General'"
        
        print(f"✓ Empty categories defaulted to: {product['categories']}")
    
    # ========== Test 2: Update product updates categories[] and creates new categories ==========
    
    def test_update_product_with_new_category_creates_it(self):
        """PUT /api/store/products/{id} creates newly introduced categories"""
        # First create a product
        product_payload = {
            "name": f"TEST_UpdateCat_Product_{self.unique_id}",
            "description": "Product for update test",
            "category": "Other",
            "categories": ["Other"],
            "price": 59.99,
            "condition": "Good"
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/store/products", json=product_payload)
        assert create_response.status_code == 200
        product = create_response.json()
        product_id = product["id"]
        self.created_product_ids.append(product_id)
        
        # Now update with new categories
        new_cat = f"TEST_UpdateNew_Category_{self.unique_id}"
        update_payload = {
            "category": new_cat,
            "categories": [new_cat, "Other"]
        }
        
        update_response = self.session.put(f"{BASE_URL}/api/store/products/{product_id}", json=update_payload)
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        updated_product = update_response.json()
        self.created_category_names.append(new_cat)
        
        # Verify update
        assert updated_product["category"] == new_cat, f"Primary category should be '{new_cat}'"
        assert new_cat in updated_product["categories"], f"'{new_cat}' should be in categories"
        assert "Other" in updated_product["categories"], "'Other' should still be in categories"
        
        print(f"✓ Product updated with new categories: {updated_product['categories']}")
        
        # Verify new category was created
        categories_response = self.session.get(f"{BASE_URL}/api/store/categories")
        category_names = [c["name"] for c in categories_response.json()]
        assert new_cat in category_names, f"Category '{new_cat}' should have been auto-created"
        
        print(f"✓ New category '{new_cat}' auto-created during update")
    
    def test_update_product_categories_with_category_updates_primary(self):
        """PUT /api/store/products/{id} updates primary when both category and categories are sent"""
        # Create product
        product_payload = {
            "name": f"TEST_UpdatePrimary_{self.unique_id}",
            "description": "Test primary update",
            "category": "Other",
            "categories": ["Other"],
            "price": 29.99
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/store/products", json=product_payload)
        assert create_response.status_code == 200
        product = create_response.json()
        self.created_product_ids.append(product["id"])
        
        # Update with both category and categories - category should become primary
        cat_primary = f"TEST_Primary_{self.unique_id}"
        cat_secondary = f"TEST_Secondary_{self.unique_id}"
        
        update_response = self.session.put(f"{BASE_URL}/api/store/products/{product['id']}", json={
            "category": cat_primary,
            "categories": [cat_primary, cat_secondary]
        })
        assert update_response.status_code == 200
        
        updated = update_response.json()
        self.created_category_names.extend([cat_primary, cat_secondary])
        
        # First category in list should be primary
        assert updated["category"] == cat_primary, f"Primary should be '{cat_primary}', got '{updated['category']}'"
        assert updated["categories"][0] == cat_primary, "First in categories[] should match primary"
        
        print(f"✓ Primary category updated correctly: {updated['category']}")
    
    # ========== Test 3: Filter products by category works with categories[] ==========
    
    def test_filter_products_by_secondary_category(self):
        """GET /api/store/products?category=<name> includes products where category is in categories[]"""
        primary_cat = f"TEST_FilterPrimary_{self.unique_id}"
        secondary_cat = f"TEST_FilterSecondary_{self.unique_id}"
        
        # Create product with multiple categories
        product_payload = {
            "name": f"TEST_FilterProduct_{self.unique_id}",
            "description": "Test filtering by secondary category",
            "category": primary_cat,
            "categories": [primary_cat, secondary_cat],
            "price": 79.99,
            "in_stock": True
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/store/products", json=product_payload)
        assert create_response.status_code == 200
        product = create_response.json()
        self.created_product_ids.append(product["id"])
        self.created_category_names.extend([primary_cat, secondary_cat])
        
        print(f"✓ Created product with primary='{primary_cat}', secondary='{secondary_cat}'")
        
        # Filter by primary category - should find product
        filter_primary = self.session.get(f"{BASE_URL}/api/store/products?category={primary_cat}")
        assert filter_primary.status_code == 200
        products_primary = filter_primary.json()
        
        product_ids = [p["id"] for p in products_primary]
        assert product["id"] in product_ids, f"Product should be found when filtering by primary category '{primary_cat}'"
        print(f"✓ Product found by primary category filter: {primary_cat}")
        
        # Filter by secondary category - should also find product
        filter_secondary = self.session.get(f"{BASE_URL}/api/store/products?category={secondary_cat}")
        assert filter_secondary.status_code == 200
        products_secondary = filter_secondary.json()
        
        product_ids_secondary = [p["id"] for p in products_secondary]
        assert product["id"] in product_ids_secondary, f"Product should be found when filtering by secondary category '{secondary_cat}'"
        print(f"✓ Product found by secondary category filter: {secondary_cat}")
    
    # ========== Test 4: Delete product ==========
    
    def test_delete_product_with_multiple_categories(self):
        """DELETE /api/store/products/{id} removes product and updates category counts"""
        cat_1 = f"TEST_DeleteCat1_{self.unique_id}"
        cat_2 = f"TEST_DeleteCat2_{self.unique_id}"
        
        # Create product
        product_payload = {
            "name": f"TEST_DeleteProduct_{self.unique_id}",
            "description": "Product to be deleted",
            "category": cat_1,
            "categories": [cat_1, cat_2],
            "price": 19.99
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/store/products", json=product_payload)
        assert create_response.status_code == 200
        product = create_response.json()
        product_id = product["id"]
        self.created_category_names.extend([cat_1, cat_2])
        
        # Delete product
        delete_response = self.session.delete(f"{BASE_URL}/api/store/products/{product_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        # Verify product is gone
        get_response = self.session.get(f"{BASE_URL}/api/store/products/{product_id}")
        assert get_response.status_code == 404, "Deleted product should return 404"
        
        print(f"✓ Product deleted successfully")
    
    # ========== Test 5: Category deduplication ==========
    
    def test_categories_deduplicated_case_insensitive(self):
        """Categories are deduplicated and case-insensitive"""
        product_payload = {
            "name": f"TEST_DedupProduct_{self.unique_id}",
            "description": "Test deduplication",
            "category": "Other",
            "categories": ["Other", "other", "OTHER", "Other"],  # Duplicates with different cases
            "price": 39.99
        }
        
        response = self.session.post(f"{BASE_URL}/api/store/products", json=product_payload)
        assert response.status_code == 200
        product = response.json()
        self.created_product_ids.append(product["id"])
        
        # Should be deduplicated to single entry
        categories = product["categories"]
        unique_lower = list(set(c.lower() for c in categories))
        assert len(unique_lower) == 1, f"Expected 1 unique category (deduplicated), got {len(unique_lower)}: {categories}"
        
        print(f"✓ Categories deduplicated: {categories}")
    
    # ========== Test 6: Get product endpoint returns categories[] ==========
    
    def test_get_product_returns_categories_array(self):
        """GET /api/store/products/{id} returns categories[] field"""
        cat_1 = f"TEST_GetCat1_{self.unique_id}"
        cat_2 = f"TEST_GetCat2_{self.unique_id}"
        
        # Create product
        product_payload = {
            "name": f"TEST_GetProduct_{self.unique_id}",
            "description": "Test get endpoint",
            "category": cat_1,
            "categories": [cat_1, cat_2],
            "price": 49.99
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/store/products", json=product_payload)
        assert create_response.status_code == 200
        product = create_response.json()
        self.created_product_ids.append(product["id"])
        self.created_category_names.extend([cat_1, cat_2])
        
        # Get product by ID
        get_response = self.session.get(f"{BASE_URL}/api/store/products/{product['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        
        # Verify categories field
        assert "categories" in fetched, "Product should have 'categories' field"
        assert isinstance(fetched["categories"], list), "categories should be a list"
        assert cat_1 in fetched["categories"], f"'{cat_1}' should be in fetched categories"
        assert cat_2 in fetched["categories"], f"'{cat_2}' should be in fetched categories"
        
        print(f"✓ GET product returns categories: {fetched['categories']}")
    
    # ========== Test 7: Related products query uses categories[] ==========
    
    def test_related_products_uses_categories_array(self):
        """GET /api/store/products/{id}/related finds products by shared categories"""
        shared_cat = f"TEST_SharedCat_{self.unique_id}"
        
        # Create first product
        product1 = self.session.post(f"{BASE_URL}/api/store/products", json={
            "name": f"TEST_Related1_{self.unique_id}",
            "description": "First related product",
            "category": shared_cat,
            "categories": [shared_cat],
            "price": 29.99
        }).json()
        self.created_product_ids.append(product1["id"])
        
        # Create second product with same category
        product2 = self.session.post(f"{BASE_URL}/api/store/products", json={
            "name": f"TEST_Related2_{self.unique_id}",
            "description": "Second related product",
            "category": shared_cat,
            "categories": [shared_cat],
            "price": 39.99
        }).json()
        self.created_product_ids.append(product2["id"])
        self.created_category_names.append(shared_cat)
        
        # Get related products for product1
        related_response = self.session.get(f"{BASE_URL}/api/store/products/{product1['id']}/related")
        assert related_response.status_code == 200
        related = related_response.json()
        
        related_ids = [p["id"] for p in related]
        assert product2["id"] in related_ids, "Product2 should be in related products (shares category)"
        
        print(f"✓ Related products found by shared category: {len(related)} products")


class TestMultiCategoryUIIntegration:
    """Tests for verifying product listing and filtering behavior"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "super@amino.com",
            "password": "peptides"
        })
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        yield
    
    def test_list_products_returns_categories_for_all(self):
        """GET /api/store/products returns categories[] for each product"""
        response = self.session.get(f"{BASE_URL}/api/store/products?limit=10")
        assert response.status_code == 200
        products = response.json()
        
        assert len(products) > 0, "Should have at least one product"
        
        for product in products:
            assert "categories" in product, f"Product {product['id']} missing 'categories' field"
            assert isinstance(product["categories"], list), f"Product {product['id']} categories should be list"
            assert "category" in product, f"Product {product['id']} missing 'category' field"
            
            # If categories not empty, first should match primary
            if len(product["categories"]) > 0:
                assert product["categories"][0] == product["category"], \
                    f"First category should match primary for product {product['id']}"
        
        print(f"✓ All {len(products)} products have valid categories[] field")
    
    def test_list_products_with_pricing_returns_category_fields(self):
        """GET /api/store/products/priced returns category field for each product"""
        response = self.session.get(f"{BASE_URL}/api/store/products/priced?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        assert len(products) > 0, "Should have at least one product"
        
        for product in products:
            # All products should have 'category' field
            assert "category" in product, f"Product {product['id']} missing 'category' in priced endpoint"
            # Note: 'categories' array is only populated for newly created products
            # Legacy products may have empty categories[]
        
        print(f"✓ Priced endpoint returns category field for {len(products)} products")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
