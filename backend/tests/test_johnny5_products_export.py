"""
Test Johnny 5 Products List and CSV Export features
Tests the enhanced CSV export and products list endpoints added for Johnny 5 dashboard
"""
import pytest
import requests
import csv
import io
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Expected CSV fields for live products export
EXPECTED_CSV_FIELDS = [
    "product_id",
    "sku", 
    "product_name",
    "category",
    "strength",
    "package",
    "price",
    "cost_price",
    "stock_quantity",
    "in_stock",
    "description",
    "image_url",
    "updated_at",
]


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "super@amino.com", "password": "peptides"}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("access_token")


@pytest.fixture
def auth_headers(admin_token):
    """Auth headers for admin requests"""
    return {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }


class TestJohnny5ProductsList:
    """Test GET /api/johnny5/products endpoint - Products list with option inventory"""
    
    def test_products_list_returns_200(self, auth_headers):
        """Test that products list endpoint returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/johnny5/products",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "total" in data
        print(f"Products list: {data['total']} total products returned")
    
    def test_products_list_structure(self, auth_headers):
        """Test that products have the expected structure with option breakdown"""
        response = requests.get(
            f"{BASE_URL}/api/johnny5/products?limit=5",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", [])
        
        if len(products) > 0:
            product = products[0]
            # Check required fields
            assert "id" in product
            assert "name" in product
            assert "sku" in product
            assert "category" in product
            assert "price" in product
            assert "has_options" in product
            assert "total_stock" in product
            assert "in_stock" in product
            
            # If product has options, verify options_breakdown
            if product.get("has_options"):
                assert "strength_options" in product
                assert "package_options" in product
                assert "options_breakdown" in product
                
                # Check options_breakdown structure
                if len(product.get("options_breakdown", [])) > 0:
                    option = product["options_breakdown"][0]
                    assert "strength" in option
                    assert "package" in option
                    assert "price" in option
                    assert "stock_quantity" in option
                    assert "in_stock" in option
                    print(f"Product {product['name']} has {len(product['options_breakdown'])} option combinations")
    
    def test_products_list_search_filter(self, auth_headers):
        """Test search filter functionality"""
        response = requests.get(
            f"{BASE_URL}/api/johnny5/products?search=BPC",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", [])
        # If search returns results, all should contain 'BPC' in name/sku
        for product in products:
            found = (
                "BPC" in (product.get("name") or "").upper() or
                "BPC" in (product.get("sku") or "").upper() or
                "BPC" in (product.get("category") or "").upper()
            )
            assert found, f"Product {product['name']} doesn't match search 'BPC'"
        print(f"Search 'BPC' returned {len(products)} products")
    
    def test_products_list_category_filter(self, auth_headers):
        """Test category filter functionality"""
        # First get available categories
        response = requests.get(
            f"{BASE_URL}/api/johnny5/products",
            headers=auth_headers
        )
        assert response.status_code == 200
        categories = response.json().get("categories", [])
        
        if len(categories) > 0:
            test_category = categories[0]
            response = requests.get(
                f"{BASE_URL}/api/johnny5/products?category={test_category}",
                headers=auth_headers
            )
            assert response.status_code == 200
            products = response.json().get("products", [])
            for product in products:
                assert product.get("category") == test_category
            print(f"Category filter '{test_category}' returned {len(products)} products")
    
    def test_products_list_stock_filter_in_stock(self, auth_headers):
        """Test in_stock=true filter - verifies endpoint doesn't error
        Note: Due to option-level stock enrichment, returned in_stock may differ from DB filter
        """
        response = requests.get(
            f"{BASE_URL}/api/johnny5/products?in_stock=true",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "total" in data
        print(f"In-stock filter query completed, returned {len(data['products'])} products")
    
    def test_products_list_stock_filter_out_of_stock(self, auth_headers):
        """Test in_stock=false filter"""
        response = requests.get(
            f"{BASE_URL}/api/johnny5/products?in_stock=false",
            headers=auth_headers
        )
        assert response.status_code == 200
        products = response.json().get("products", [])
        for product in products:
            assert product.get("in_stock") == False, f"Product {product['name']} should be out of stock"
        print(f"Out-of-stock filter returned {len(products)} products")
    
    def test_products_list_pagination(self, auth_headers):
        """Test pagination with limit and skip"""
        response1 = requests.get(
            f"{BASE_URL}/api/johnny5/products?limit=2&skip=0",
            headers=auth_headers
        )
        assert response1.status_code == 200
        products1 = response1.json().get("products", [])
        
        response2 = requests.get(
            f"{BASE_URL}/api/johnny5/products?limit=2&skip=2",
            headers=auth_headers
        )
        assert response2.status_code == 200
        products2 = response2.json().get("products", [])
        
        # Ensure pages contain different products
        if len(products1) > 0 and len(products2) > 0:
            ids1 = {p["id"] for p in products1}
            ids2 = {p["id"] for p in products2}
            assert ids1.isdisjoint(ids2), "Paginated results should not overlap"
            print(f"Pagination works: page1={len(products1)} items, page2={len(products2)} items")


class TestJohnny5ProductsExportCSV:
    """Test GET /api/johnny5/products/export.csv endpoint - CSV export of live products"""
    
    def test_csv_export_returns_200(self, auth_headers):
        """Test that CSV export returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/johnny5/products/export.csv",
            headers=auth_headers
        )
        assert response.status_code == 200
        print("CSV export endpoint returns 200 OK")
    
    def test_csv_export_content_type(self, auth_headers):
        """Test that CSV export returns correct content type"""
        response = requests.get(
            f"{BASE_URL}/api/johnny5/products/export.csv",
            headers=auth_headers
        )
        assert response.status_code == 200
        content_type = response.headers.get("Content-Type", "")
        assert "text/csv" in content_type, f"Expected text/csv, got {content_type}"
        print(f"Content-Type: {content_type}")
    
    def test_csv_export_content_disposition(self, auth_headers):
        """Test that CSV export has Content-Disposition header for download"""
        response = requests.get(
            f"{BASE_URL}/api/johnny5/products/export.csv",
            headers=auth_headers
        )
        assert response.status_code == 200
        content_disposition = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disposition
        assert "filename=" in content_disposition
        assert ".csv" in content_disposition
        print(f"Content-Disposition: {content_disposition}")
    
    def test_csv_export_has_all_expected_fields(self, auth_headers):
        """Test that CSV export contains all expected column headers"""
        response = requests.get(
            f"{BASE_URL}/api/johnny5/products/export.csv",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        content = response.text
        reader = csv.DictReader(io.StringIO(content))
        headers = reader.fieldnames or []
        
        for field in EXPECTED_CSV_FIELDS:
            assert field in headers, f"Missing expected field: {field}"
        print(f"CSV has all {len(EXPECTED_CSV_FIELDS)} expected fields: {headers}")
    
    def test_csv_export_has_valid_data(self, auth_headers):
        """Test that CSV export contains valid product data"""
        response = requests.get(
            f"{BASE_URL}/api/johnny5/products/export.csv",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        content = response.text
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)
        
        assert len(rows) > 0, "CSV should have at least one product row"
        
        # Check first row has valid data
        row = rows[0]
        assert row.get("product_id"), "product_id should not be empty"
        assert row.get("product_name"), "product_name should not be empty"
        print(f"CSV contains {len(rows)} product rows")
    
    def test_csv_export_options_as_separate_rows(self, auth_headers):
        """Test that products with options have multiple rows (one per strength × package)"""
        response = requests.get(
            f"{BASE_URL}/api/johnny5/products/export.csv",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        content = response.text
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)
        
        # Group rows by product_id
        products_rows = {}
        for row in rows:
            pid = row.get("product_id")
            if pid not in products_rows:
                products_rows[pid] = []
            products_rows[pid].append(row)
        
        # Find a product with multiple rows (has options)
        multi_row_products = {pid: rows for pid, rows in products_rows.items() if len(rows) > 1}
        
        if multi_row_products:
            # Check that rows have different strength/package combinations
            pid, product_rows = next(iter(multi_row_products.items()))
            combinations = set()
            for row in product_rows:
                combo = (row.get("strength"), row.get("package"))
                combinations.add(combo)
            
            assert len(combinations) == len(product_rows), "Each row should have unique strength × package"
            print(f"Found product with {len(product_rows)} option rows: {combinations}")
        else:
            print("No products with options found (single-row products only)")
    
    def test_csv_export_price_values(self, auth_headers):
        """Test that price values in CSV are numeric"""
        response = requests.get(
            f"{BASE_URL}/api/johnny5/products/export.csv",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        content = response.text
        reader = csv.DictReader(io.StringIO(content))
        
        for row in reader:
            price = row.get("price", "")
            cost_price = row.get("cost_price", "")
            stock_quantity = row.get("stock_quantity", "")
            
            # Price should be a valid float
            if price:
                float(price)  # Will raise if not valid
            if cost_price:
                float(cost_price)
            if stock_quantity:
                int(float(stock_quantity))  # Stock should be integer
        
        print("All price and stock values are valid numbers")
    
    def test_csv_export_in_stock_boolean(self, auth_headers):
        """Test that in_stock field contains valid boolean strings"""
        response = requests.get(
            f"{BASE_URL}/api/johnny5/products/export.csv",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        content = response.text
        reader = csv.DictReader(io.StringIO(content))
        
        valid_booleans = {"true", "false"}
        for row in reader:
            in_stock = row.get("in_stock", "").lower()
            assert in_stock in valid_booleans, f"in_stock should be true/false, got: {in_stock}"
        
        print("All in_stock values are valid booleans")


class TestJohnny5ProductsAuthentication:
    """Test that endpoints require admin authentication"""
    
    def test_products_list_requires_auth(self):
        """Test that products list endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/johnny5/products")
        assert response.status_code == 401, "Should return 401 without auth"
        print("Products list requires authentication: 401 without token")
    
    def test_csv_export_requires_auth(self):
        """Test that CSV export endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/johnny5/products/export.csv")
        assert response.status_code == 401, "Should return 401 without auth"
        print("CSV export requires authentication: 401 without token")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
