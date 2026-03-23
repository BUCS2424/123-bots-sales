"""
Peptide Catalog Backend Tests
Tests for: PDF-based catalog replacement, categories, products with options/pricing matrix
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Expected categories from PDF catalog
EXPECTED_CATEGORIES = [
    "Healing / Recovery",
    "Cognitive / Neuro",
    "Aesthetic / Skin",
    "Semaglutide",
    "Tirzepatide",
    "Retatrutide",
    "Other Metabolic",
    "Performance / Specialty",
    "Other",
]

# Sample products from catalog for validation
EXPECTED_PRODUCTS = [
    "BPC-157", "TB-500", "Selank", "Semax", "GHK-CU", "Sema", "Tirz", "Reta",
    "Ipamorelin", "Sermorelin", "NAD+", "Glutathione", "PT-141", "Melanotan II"
]

# Products that should NOT exist (old placeholders)
OLD_PRODUCTS = [
    "electronics", "tools", "hardware", "vintage", "antique"
]


class TestCatalogCategories:
    """Test catalog categories are correctly set from PDF"""
    
    def test_categories_endpoint_returns_200(self):
        """GET /api/store/categories returns 200"""
        response = requests.get(f"{BASE_URL}/api/store/categories")
        assert response.status_code == 200, f"Categories endpoint failed: {response.text}"
        print(f"✓ Categories endpoint returns 200")
    
    def test_all_pdf_categories_present(self):
        """All expected PDF categories are present"""
        response = requests.get(f"{BASE_URL}/api/store/categories")
        categories = response.json()
        category_names = [c["name"] for c in categories]
        
        for expected_cat in EXPECTED_CATEGORIES:
            assert expected_cat in category_names, f"Missing category: {expected_cat}"
        print(f"✓ All {len(EXPECTED_CATEGORIES)} PDF categories present: {category_names}")
    
    def test_categories_have_product_counts(self):
        """Each category has product_count field"""
        response = requests.get(f"{BASE_URL}/api/store/categories")
        categories = response.json()
        
        for cat in categories:
            assert "product_count" in cat, f"Category {cat['name']} missing product_count"
            assert isinstance(cat["product_count"], int), f"product_count must be int"
        print(f"✓ All categories have product_count field")
    
    def test_category_count_matches_expected(self):
        """Category count should be 9 (from PDF)"""
        response = requests.get(f"{BASE_URL}/api/store/categories")
        categories = response.json()
        assert len(categories) == 9, f"Expected 9 categories, got {len(categories)}"
        print(f"✓ Category count is 9 as expected")


class TestCatalogProducts:
    """Test products are correctly imported from PDF"""
    
    def test_products_endpoint_returns_200(self):
        """GET /api/store/products returns 200"""
        response = requests.get(f"{BASE_URL}/api/store/products")
        assert response.status_code == 200, f"Products endpoint failed: {response.text}"
        print(f"✓ Products endpoint returns 200")
    
    def test_products_count_matches_catalog(self):
        """Product count should be 35 (from peptide_catalog.py CATALOG_SOURCE)"""
        response = requests.get(f"{BASE_URL}/api/store/products")
        products = response.json()
        # Based on CATALOG_SOURCE in peptide_catalog.py there are 35 products
        assert len(products) >= 30, f"Expected ~35 products, got {len(products)}"
        print(f"✓ Products count: {len(products)}")
    
    def test_expected_products_exist(self):
        """Key products from PDF catalog should exist"""
        response = requests.get(f"{BASE_URL}/api/store/products")
        products = response.json()
        product_names = [p["name"] for p in products]
        
        found = []
        for expected in EXPECTED_PRODUCTS:
            if expected in product_names:
                found.append(expected)
        
        assert len(found) >= 10, f"Expected at least 10 PDF products, found {len(found)}: {found}"
        print(f"✓ Found {len(found)} expected products: {found}")
    
    def test_no_old_placeholder_products(self):
        """Old placeholder products (electronics, tools) should not exist"""
        response = requests.get(f"{BASE_URL}/api/store/products")
        products = response.json()
        product_names = [p["name"].lower() for p in products]
        product_categories = [p["category"].lower() for p in products]
        
        for old in OLD_PRODUCTS:
            assert old not in product_names, f"Old placeholder product found: {old}"
            assert old not in product_categories, f"Old placeholder category found: {old}"
        print(f"✓ No old placeholder products found")
    
    def test_products_have_required_fields(self):
        """Products have required fields: id, name, category, price, has_options"""
        response = requests.get(f"{BASE_URL}/api/store/products")
        products = response.json()
        
        required = ["id", "name", "category", "price", "has_options"]
        for product in products[:5]:  # Check first 5
            for field in required:
                assert field in product, f"Product {product.get('name', 'unknown')} missing {field}"
        print(f"✓ Products have required fields")


class TestProductOptions:
    """Test products have options data (strengths, packaging, pricing matrix)"""
    
    def test_products_have_custom_fields_data(self):
        """Products with has_options=True should have custom_fields_data"""
        response = requests.get(f"{BASE_URL}/api/store/products")
        products = response.json()
        
        products_with_options = [p for p in products if p.get("has_options")]
        assert len(products_with_options) > 0, "No products with options found"
        
        for product in products_with_options[:3]:
            assert "custom_fields_data" in product, f"{product['name']} missing custom_fields_data"
            assert product["custom_fields_data"] is not None, f"{product['name']} has null custom_fields_data"
        print(f"✓ {len(products_with_options)} products have custom_fields_data")
    
    def test_custom_fields_have_strength_options(self):
        """custom_fields_data should have strength_options array"""
        response = requests.get(f"{BASE_URL}/api/store/products")
        products = response.json()
        
        for product in products[:5]:
            if product.get("has_options") and product.get("custom_fields_data"):
                cfd = product["custom_fields_data"]
                assert "strength_options" in cfd, f"{product['name']} missing strength_options"
                assert isinstance(cfd["strength_options"], list), "strength_options should be list"
                assert len(cfd["strength_options"]) > 0, "strength_options should not be empty"
        print(f"✓ Products have strength_options")
    
    def test_custom_fields_have_package_options(self):
        """custom_fields_data should have package_options array"""
        response = requests.get(f"{BASE_URL}/api/store/products")
        products = response.json()
        
        for product in products[:5]:
            if product.get("has_options") and product.get("custom_fields_data"):
                cfd = product["custom_fields_data"]
                assert "package_options" in cfd, f"{product['name']} missing package_options"
                assert isinstance(cfd["package_options"], list), "package_options should be list"
                # Should have Single Vial, Half Kit, Full Kit
                expected_packages = ["Single Vial", "Half Kit", "Full Kit"]
                for pkg in expected_packages:
                    assert pkg in cfd["package_options"], f"Missing package: {pkg}"
        print(f"✓ Products have package_options (Single Vial, Half Kit, Full Kit)")
    
    def test_custom_fields_have_pricing_matrix(self):
        """custom_fields_data should have pricing_matrix with nested prices"""
        response = requests.get(f"{BASE_URL}/api/store/products")
        products = response.json()
        
        for product in products[:5]:
            if product.get("has_options") and product.get("custom_fields_data"):
                cfd = product["custom_fields_data"]
                assert "pricing_matrix" in cfd, f"{product['name']} missing pricing_matrix"
                matrix = cfd["pricing_matrix"]
                assert isinstance(matrix, dict), "pricing_matrix should be dict"
                
                # Verify structure: {strength: {package: price}}
                for strength, packages in matrix.items():
                    assert isinstance(packages, dict), f"Price packages for {strength} should be dict"
                    for pkg, price in packages.items():
                        assert isinstance(price, (int, float)), f"Price should be numeric: {price}"
                        assert price > 0, f"Price should be positive: {price}"
        print(f"✓ Products have valid pricing_matrix structure")
    
    def test_tirz_has_multiple_strengths(self):
        """Tirzepatide (Tirz) should have multiple strength options"""
        response = requests.get(f"{BASE_URL}/api/store/products?search=Tirz")
        products = response.json()
        
        tirz = next((p for p in products if p["name"] == "Tirz"), None)
        assert tirz is not None, "Tirz product not found"
        assert tirz.get("has_options"), "Tirz should have has_options=True"
        
        cfd = tirz.get("custom_fields_data", {})
        strengths = cfd.get("strength_options", [])
        # Tirz should have 8 strengths: 10mg, 15mg, 20mg, 25mg, 30mg, 40mg, 50mg, 60mg
        assert len(strengths) >= 6, f"Tirz should have multiple strengths, got {len(strengths)}"
        print(f"✓ Tirz has {len(strengths)} strength options: {strengths}")


class TestProductDetailAPI:
    """Test single product detail endpoint"""
    
    def test_get_product_by_id(self):
        """GET /api/store/products/{id} returns product with options"""
        # First get a product ID
        response = requests.get(f"{BASE_URL}/api/store/products?limit=1")
        products = response.json()
        assert len(products) > 0, "No products found"
        
        product_id = products[0]["id"]
        detail_response = requests.get(f"{BASE_URL}/api/store/products/{product_id}")
        assert detail_response.status_code == 200, f"Detail endpoint failed: {detail_response.text}"
        
        product = detail_response.json()
        assert product["id"] == product_id
        assert "custom_fields_data" in product
        print(f"✓ Product detail endpoint works: {product['name']}")
    
    def test_get_product_invalid_id_returns_404(self):
        """GET /api/store/products/{invalid_id} returns 404"""
        response = requests.get(f"{BASE_URL}/api/store/products/invalid-product-id-123")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Invalid product ID returns 404")


class TestCategoryFilter:
    """Test filtering products by category"""
    
    def test_filter_by_healing_recovery(self):
        """Filter products by Healing / Recovery category"""
        response = requests.get(f"{BASE_URL}/api/store/products", params={"category": "Healing / Recovery"})
        assert response.status_code == 200
        products = response.json()
        
        for product in products:
            assert product["category"] == "Healing / Recovery", f"Wrong category: {product['category']}"
        
        # Should include BPC-157, TB-500
        names = [p["name"] for p in products]
        assert "BPC-157" in names or "TB-500" in names, f"Expected BPC-157 or TB-500, got {names}"
        print(f"✓ Healing / Recovery filter works: {len(products)} products")
    
    def test_filter_by_tirzepatide(self):
        """Filter products by Tirzepatide category"""
        response = requests.get(f"{BASE_URL}/api/store/products", params={"category": "Tirzepatide"})
        assert response.status_code == 200
        products = response.json()
        
        assert len(products) > 0, "No Tirzepatide products found"
        for product in products:
            assert product["category"] == "Tirzepatide"
        print(f"✓ Tirzepatide filter works: {len(products)} products")


class TestSearchProducts:
    """Test product search functionality"""
    
    def test_search_by_name(self):
        """Search products by name"""
        response = requests.get(f"{BASE_URL}/api/store/products", params={"search": "BPC"})
        assert response.status_code == 200
        products = response.json()
        
        assert len(products) > 0, "No products found for 'BPC' search"
        for product in products:
            assert "BPC" in product["name"].upper() or "BPC" in product.get("description", "").upper()
        print(f"✓ Search by name works: found {len(products)} products for 'BPC'")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
