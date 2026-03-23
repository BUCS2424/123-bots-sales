"""
Test cases for Product CSV Import API
Tests:
- Required columns enforcement (name, price, category)
- Multi-category support with comma and pipe delimiters
- Auto-creation of missing top-level categories
- Duplicate SKU row skipping
- Response structure validation (created_count, skipped_count, total_rows, errors[])
"""

import pytest
import requests
import os
import io
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_ADMIN_EMAIL = "super@amino.com"
TEST_ADMIN_PASSWORD = "peptides"
BACKUP_ADMIN_EMAIL = "test@emergent.dev"
BACKUP_ADMIN_PASSWORD = "TestAdmin123!"

# CSV content templates
CSV_VALID_BASIC = """name,price,category,sku,quantity
TEST_CSV_Import_Product1,19.99,TEST_CSV_Category1,TEST_SKU_001,10
TEST_CSV_Import_Product2,29.99,TEST_CSV_Category2,TEST_SKU_002,5
TEST_CSV_Import_Product3,39.99,TEST_CSV_Category1,TEST_SKU_003,8
"""

CSV_MULTI_CATEGORY_COMMA = """name,price,category,categories,sku
TEST_CSV_MultiCat_Comma1,49.99,TEST_CSV_Cat_Primary,TEST_CSV_Cat_Secondary1,TEST_CSV_Cat_Secondary2,TEST_SKU_MC001
TEST_CSV_MultiCat_Comma2,59.99,TEST_CSV_Cat_Primary,TEST_CSV_Cat_New1,TEST_CSV_Cat_New2,TEST_SKU_MC002
"""

CSV_MULTI_CATEGORY_PIPE = """name,price,category,categories,sku
TEST_CSV_MultiCat_Pipe1,49.99,TEST_CSV_Cat_Pipe_Primary,TEST_CSV_PipeCat1|TEST_CSV_PipeCat2|TEST_CSV_PipeCat3,TEST_SKU_MP001
TEST_CSV_MultiCat_Pipe2,69.99,TEST_CSV_Cat_Pipe_Primary,TEST_CSV_PipeCat4|TEST_CSV_PipeCat5,TEST_SKU_MP002
"""

CSV_MISSING_NAME = """name,price,category,sku
,19.99,TestCat,SKU_NO_NAME
TEST_ValidProd,29.99,TestCat,SKU_VALID_001
"""

CSV_MISSING_PRICE = """name,price,category,sku
TEST_MissingPrice,invalid,TestCat,SKU_PRICE_001
TEST_ValidPrice,29.99,TestCat,SKU_PRICE_002
"""

CSV_MISSING_CATEGORY = """name,price,category,sku
TEST_NoCat,19.99,,SKU_NO_CAT
TEST_WithCat,29.99,TestCat,SKU_WITH_CAT
"""

CSV_MISSING_REQUIRED_COLUMNS = """name,quantity,sku
TestProduct,10,SKU001
"""

CSV_EMPTY = """"""

CSV_NO_HEADER = """TestProduct,19.99,TestCat,SKU001"""


class TestCSVProductImport:
    """Test suite for Product CSV Import endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test - get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.token = None
        self.created_product_ids = []
        
        # Try primary credentials
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_ADMIN_EMAIL,
            "password": TEST_ADMIN_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access_token") or data.get("token")
        else:
            # Try backup credentials
            response = self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": BACKUP_ADMIN_EMAIL,
                "password": BACKUP_ADMIN_PASSWORD
            })
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token") or data.get("token")
        
        if not self.token:
            pytest.skip("Could not authenticate with admin credentials")
        
        yield
        
        # Cleanup: Delete test products created during tests
        self._cleanup_test_data()
    
    def _cleanup_test_data(self):
        """Clean up TEST_ prefixed products and categories"""
        if not self.token:
            return
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Delete test products
        for product_id in self.created_product_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/store/products/{product_id}", headers=headers)
            except Exception:
                pass
        
        # Delete test categories
        try:
            categories_resp = self.session.get(f"{BASE_URL}/api/store/categories")
            if categories_resp.status_code == 200:
                for cat in categories_resp.json():
                    if cat.get("name", "").startswith("TEST_CSV_"):
                        self.session.delete(f"{BASE_URL}/api/store/categories/{cat['id']}", headers=headers)
        except Exception:
            pass
    
    def _get_auth_headers(self):
        """Return headers with auth token for file upload (no Content-Type for multipart)"""
        return {"Authorization": f"Bearer {self.token}"}
    
    def _upload_csv(self, csv_content: str, filename: str = "products.csv"):
        """Upload CSV content using a fresh session without Content-Type header"""
        upload_session = requests.Session()
        files = {"file": (filename, csv_content.encode('utf-8'), "text/csv")}
        return upload_session.post(
            f"{BASE_URL}/api/store/products/import/csv",
            headers={"Authorization": f"Bearer {self.token}"},
            files=files
        )
    
    def _create_csv_file(self, csv_content: str, filename: str = "test_products.csv"):
        """Create a file-like object from CSV string"""
        return ("file", (filename, csv_content.encode('utf-8'), "text/csv"))

    # =========================
    # Test: Basic CSV Import
    # =========================
    def test_csv_import_basic_success(self):
        """Test basic CSV import with required columns"""
        response = self._upload_csv(CSV_VALID_BASIC)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Track created products for cleanup
        self.created_product_ids.extend(data.get("created_product_ids", []))
        
        # Validate response structure
        assert "message" in data
        assert "total_rows" in data
        assert "created_count" in data
        assert "skipped_count" in data
        assert "errors" in data
        assert isinstance(data["errors"], list)
        
        # Validate counts
        assert data["total_rows"] == 3
        assert data["created_count"] == 3
        assert data["skipped_count"] == 0
        assert len(data["errors"]) == 0
        
        print(f"PASS: Basic CSV import succeeded - {data['created_count']} products created")

    # =========================
    # Test: Required Columns Missing
    # =========================
    def test_csv_import_missing_required_columns(self):
        """Test that CSV without required columns (price, category) is rejected"""
        response = self._upload_csv(CSV_MISSING_REQUIRED_COLUMNS)
        
        assert response.status_code == 400, f"Expected 400 for missing columns, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "missing" in data["detail"].lower() or "required" in data["detail"].lower()
        
        print(f"PASS: Missing required columns correctly rejected: {data['detail']}")

    # =========================
    # Test: Missing Name Value
    # =========================
    def test_csv_import_missing_name_value(self):
        """Test rows with missing name are skipped"""
        response = self._upload_csv(CSV_MISSING_NAME)
        
        assert response.status_code == 200
        data = response.json()
        
        self.created_product_ids.extend(data.get("created_product_ids", []))
        
        # Should have 1 skipped (missing name) and 1 created
        assert data["skipped_count"] >= 1, "Row with missing name should be skipped"
        assert len(data["errors"]) >= 1
        
        # Check error message for name
        name_error = any("name" in str(e.get("error", "")).lower() for e in data["errors"])
        assert name_error, "Error should mention missing name"
        
        print(f"PASS: Missing name row skipped. Errors: {data['errors']}")

    # =========================
    # Test: Missing Price Value
    # =========================
    def test_csv_import_invalid_price(self):
        """Test rows with invalid/missing price are skipped"""
        response = self._upload_csv(CSV_MISSING_PRICE)
        
        assert response.status_code == 200
        data = response.json()
        
        self.created_product_ids.extend(data.get("created_product_ids", []))
        
        assert data["skipped_count"] >= 1, "Row with invalid price should be skipped"
        assert len(data["errors"]) >= 1
        
        price_error = any("price" in str(e.get("error", "")).lower() for e in data["errors"])
        assert price_error, "Error should mention missing/invalid price"
        
        print(f"PASS: Invalid price row skipped. Errors: {data['errors']}")

    # =========================
    # Test: Missing Category Value
    # =========================
    def test_csv_import_missing_category_value(self):
        """Test rows with missing category are skipped"""
        response = self._upload_csv(CSV_MISSING_CATEGORY)
        
        assert response.status_code == 200
        data = response.json()
        
        self.created_product_ids.extend(data.get("created_product_ids", []))
        
        assert data["skipped_count"] >= 1, "Row with missing category should be skipped"
        assert len(data["errors"]) >= 1
        
        cat_error = any("category" in str(e.get("error", "")).lower() for e in data["errors"])
        assert cat_error, "Error should mention missing category"
        
        print(f"PASS: Missing category row skipped. Errors: {data['errors']}")

    # =========================
    # Test: Multi-Category with Comma
    # =========================
    def test_csv_import_multi_category_comma(self):
        """Test categories column with comma separator"""
        csv_content = """name,price,category,categories,sku
TEST_CSV_CommaMulti1,49.99,TEST_CSV_Primary_C,TEST_CSV_Secondary_C1,TEST_CSV_Secondary_C2,TEST_SKU_CMC001
TEST_CSV_CommaMulti2,59.99,TEST_CSV_Primary_C,TEST_CSV_Secondary_C3,TEST_SKU_CMC002
"""
        response = self._upload_csv(csv_content)
        
        assert response.status_code == 200
        data = response.json()
        
        self.created_product_ids.extend(data.get("created_product_ids", []))
        
        assert data["created_count"] >= 1, "At least one product should be created"
        
        # Verify created product has categories array
        if data.get("created_product_ids"):
            product_id = data["created_product_ids"][0]
            product_resp = self.session.get(
                f"{BASE_URL}/api/store/products/{product_id}",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            if product_resp.status_code == 200:
                product = product_resp.json()
                assert "categories" in product, "Product should have categories field"
                assert isinstance(product["categories"], list), "Categories should be a list"
                assert len(product["categories"]) >= 1, "Categories should have at least one entry"
                print(f"PASS: Product has categories: {product['categories']}")
        
        print(f"PASS: Comma-separated multi-category import succeeded")

    # =========================
    # Test: Multi-Category with Pipe
    # =========================
    def test_csv_import_multi_category_pipe(self):
        """Test categories column with pipe separator"""
        csv_content = """name,price,category,categories,sku
TEST_CSV_PipeMulti1,49.99,TEST_CSV_Primary_P,TEST_CSV_SecondaryP1|TEST_CSV_SecondaryP2|TEST_CSV_SecondaryP3,TEST_SKU_PMP001
TEST_CSV_PipeMulti2,69.99,TEST_CSV_Primary_P,TEST_CSV_SecondaryP4|TEST_CSV_SecondaryP5,TEST_SKU_PMP002
"""
        response = self._upload_csv(csv_content)
        
        assert response.status_code == 200
        data = response.json()
        
        self.created_product_ids.extend(data.get("created_product_ids", []))
        
        assert data["created_count"] >= 1
        
        # Verify created product has multiple categories from pipe-separated input
        if data.get("created_product_ids"):
            product_id = data["created_product_ids"][0]
            product_resp = self.session.get(
                f"{BASE_URL}/api/store/products/{product_id}",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            if product_resp.status_code == 200:
                product = product_resp.json()
                assert "categories" in product
                assert len(product["categories"]) >= 2, "Product should have multiple categories from pipe input"
                print(f"PASS: Pipe-separated categories: {product['categories']}")
        
        print(f"PASS: Pipe-separated multi-category import succeeded")

    # =========================
    # Test: Auto-Create Categories
    # =========================
    def test_csv_import_auto_creates_categories(self):
        """Test that new categories are auto-created during import"""
        unique_id = uuid.uuid4().hex[:6]
        new_category_name = f"TEST_CSV_AutoCreate_{unique_id}"
        
        csv_content = f"""name,price,category,sku
TEST_CSV_AutoCreateProduct,99.99,{new_category_name},TEST_SKU_AC001
"""
        response = self._upload_csv(csv_content)
        
        assert response.status_code == 200
        data = response.json()
        
        self.created_product_ids.extend(data.get("created_product_ids", []))
        
        assert data["created_count"] == 1
        
        # Verify category was created
        cat_resp = self.session.get(f"{BASE_URL}/api/store/categories")
        assert cat_resp.status_code == 200
        categories = cat_resp.json()
        
        found_category = any(c.get("name") == new_category_name for c in categories)
        assert found_category, f"Category '{new_category_name}' should have been auto-created"
        
        print(f"PASS: Category '{new_category_name}' was auto-created")

    # =========================
    # Test: Duplicate SKU Skipping
    # =========================
    def test_csv_import_duplicate_sku_skipped(self):
        """Test that duplicate SKU rows are skipped"""
        unique_sku = f"TEST_DUP_SKU_{uuid.uuid4().hex[:6]}"
        
        # First import creates a product
        csv_first = f"""name,price,category,sku
TEST_CSV_First,29.99,TEST_CSV_DupCat,{unique_sku}
"""
        response = self._upload_csv(csv_first, "products1.csv")
        assert response.status_code == 200
        first_data = response.json()
        self.created_product_ids.extend(first_data.get("created_product_ids", []))
        assert first_data["created_count"] == 1, "First product should be created"
        
        # Second import with same SKU should be skipped
        csv_second = f"""name,price,category,sku
TEST_CSV_Second,39.99,TEST_CSV_DupCat,{unique_sku}
"""
        response = self._upload_csv(csv_second, "products2.csv")
        assert response.status_code == 200
        second_data = response.json()
        
        assert second_data["skipped_count"] == 1, "Duplicate SKU row should be skipped"
        assert second_data["created_count"] == 0, "No new product should be created"
        assert len(second_data["errors"]) == 1
        
        # Check error mentions duplicate SKU
        error_msg = second_data["errors"][0].get("error", "")
        assert "duplicate" in error_msg.lower() or "sku" in error_msg.lower()
        
        print(f"PASS: Duplicate SKU '{unique_sku}' was correctly skipped")

    # =========================
    # Test: Empty CSV File
    # =========================
    def test_csv_import_empty_file(self):
        """Test that empty CSV is rejected"""
        upload_session = requests.Session()
        files = {"file": ("empty.csv", b"", "text/csv")}
        
        response = upload_session.post(
            f"{BASE_URL}/api/store/products/import/csv",
            headers={"Authorization": f"Bearer {self.token}"},
            files=files
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "empty" in data["detail"].lower()
        
        print(f"PASS: Empty CSV correctly rejected: {data['detail']}")

    # =========================
    # Test: Non-CSV File Rejected
    # =========================
    def test_csv_import_non_csv_rejected(self):
        """Test that non-CSV files are rejected"""
        upload_session = requests.Session()
        files = {"file": ("products.txt", b"name,price,category\nProd1,19.99,Cat1", "text/plain")}
        
        response = upload_session.post(
            f"{BASE_URL}/api/store/products/import/csv",
            headers={"Authorization": f"Bearer {self.token}"},
            files=files
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "csv" in data["detail"].lower()
        
        print(f"PASS: Non-CSV file correctly rejected: {data['detail']}")

    # =========================
    # Test: Auth Required
    # =========================
    def test_csv_import_requires_auth(self):
        """Test that CSV import requires admin authentication"""
        upload_session = requests.Session()
        files = {"file": ("products.csv", CSV_VALID_BASIC.encode('utf-8'), "text/csv")}
        
        # No auth header
        response = upload_session.post(
            f"{BASE_URL}/api/store/products/import/csv",
            files=files
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        
        print(f"PASS: CSV import correctly requires authentication")

    # =========================
    # Test: Response Structure
    # =========================
    def test_csv_import_response_structure(self):
        """Test that response includes all required fields"""
        csv_content = """name,price,category,sku
TEST_CSV_ResponseTest1,19.99,TEST_CSV_RespCat,TEST_SKU_RESP001
,29.99,TEST_CSV_RespCat,TEST_SKU_RESP002
"""
        response = self._upload_csv(csv_content)
        
        assert response.status_code == 200
        data = response.json()
        
        self.created_product_ids.extend(data.get("created_product_ids", []))
        
        # Verify all required response fields
        required_fields = ["message", "total_rows", "created_count", "skipped_count", "errors"]
        for field in required_fields:
            assert field in data, f"Response missing required field: {field}"
        
        # Verify errors array structure
        assert isinstance(data["errors"], list)
        if data["errors"]:
            error = data["errors"][0]
            assert "row" in error, "Error should include row number"
            assert "error" in error, "Error should include error message"
        
        print(f"PASS: Response structure is correct with all required fields")
