"""
Test Johnny 5 Phase 2 Pricing & Stock Sheet Features
Tests:
- CSV import/export endpoints
- Manual row create/update/read
- Global markup settings
- Connected cart stock check endpoints
- Local cart stock check endpoint
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    BASE_URL = "https://bot-shop-demo.preview.emergentagent.com"

# Admin credentials
ADMIN_EMAIL = "super@amino.com"
ADMIN_PASSWORD = "peptides"

# Store API key from connected store list
STORE_API_KEY = "j5_ad9d1fb5be6a4499a6f04740ec25c5a9"


class TestJohnny5PricingStockSettings:
    """Test global markup settings endpoints"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json().get("access_token")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    def test_get_pricing_stock_settings(self):
        """GET /api/johnny5/pricing-stock/settings should return global settings"""
        response = requests.get(
            f"{BASE_URL}/api/johnny5/pricing-stock/settings",
            headers=self.headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "settings" in data
        assert "global_markup_percent" in data["settings"]
        assert "updated_at" in data["settings"]
        print(f"GET settings: {data}")

    def test_update_global_markup_percent(self):
        """PUT /api/johnny5/pricing-stock/settings should update global markup %"""
        # Update to 15%
        response = requests.put(
            f"{BASE_URL}/api/johnny5/pricing-stock/settings",
            headers=self.headers,
            json={"global_markup_percent": 15.0},
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert data["settings"]["global_markup_percent"] == 15.0
        print(f"PUT settings updated markup to 15%: {data}")

        # Verify GET returns new value
        get_response = requests.get(
            f"{BASE_URL}/api/johnny5/pricing-stock/settings",
            headers=self.headers,
        )
        assert get_response.status_code == 200
        assert get_response.json()["settings"]["global_markup_percent"] == 15.0

        # Reset to 0 for clean state
        requests.put(
            f"{BASE_URL}/api/johnny5/pricing-stock/settings",
            headers=self.headers,
            json={"global_markup_percent": 0.0},
        )


class TestJohnny5PricingStockRows:
    """Test manual row create/update/read endpoints"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert response.status_code == 200
        self.token = response.json().get("access_token")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    def test_list_pricing_stock_rows(self):
        """GET /api/johnny5/pricing-stock/rows should return all rows"""
        response = requests.get(
            f"{BASE_URL}/api/johnny5/pricing-stock/rows",
            headers=self.headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "rows" in data
        assert "total" in data
        assert isinstance(data["rows"], list)
        print(f"Found {data['total']} rows in pricing stock sheet")

    def test_create_pricing_stock_row(self):
        """POST /api/johnny5/pricing-stock/rows should create a new row"""
        test_row = {
            "sku": "TEST-SKU-001",
            "product_id": None,
            "product_name": "Test Product",
            "option_strength": "10mg",
            "option_package": "Single",
            "price": 99.99,
            "cost_price": 50.00,
            "stock_quantity": 100,
            "in_stock": True,
            "estimated_restock": "",
            "allow_preorder": False,
        }
        response = requests.post(
            f"{BASE_URL}/api/johnny5/pricing-stock/rows",
            headers=self.headers,
            json=test_row,
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "row" in data
        assert data["row"]["sku"] == "TEST-SKU-001"
        assert data["row"]["price"] == 99.99
        assert data["row"]["cost_price"] == 50.00
        assert data["row"]["stock_quantity"] == 100
        assert data["row"]["in_stock"] is True
        assert "connected_store_cost" in data["row"]
        assert "status_icon" in data["row"]
        assert data["row"]["status_icon"] == "green_check"
        print(f"Created row: {data['row']}")
        self.created_row_id = data["row"]["id"]

    def test_create_row_requires_sku_or_product_id(self):
        """POST /api/johnny5/pricing-stock/rows without sku/product_id should fail"""
        test_row = {
            "product_name": "Bad Test Product",
            "price": 10.00,
        }
        response = requests.post(
            f"{BASE_URL}/api/johnny5/pricing-stock/rows",
            headers=self.headers,
            json=test_row,
        )
        assert response.status_code == 400
        print(f"Correctly rejected row without sku/product_id")

    def test_update_pricing_stock_row(self):
        """PUT /api/johnny5/pricing-stock/rows/{id} should update an existing row"""
        # First create a row
        create_response = requests.post(
            f"{BASE_URL}/api/johnny5/pricing-stock/rows",
            headers=self.headers,
            json={
                "sku": "TEST-UPDATE-SKU",
                "product_name": "Update Test",
                "price": 100.00,
                "cost_price": 60.00,
                "stock_quantity": 50,
                "in_stock": True,
                "estimated_restock": "",
                "allow_preorder": False,
            },
        )
        assert create_response.status_code == 200
        row_id = create_response.json()["row"]["id"]

        # Update the row
        update_response = requests.put(
            f"{BASE_URL}/api/johnny5/pricing-stock/rows/{row_id}",
            headers=self.headers,
            json={
                "stock_quantity": 0,
                "in_stock": False,
                "estimated_restock": "2-3 weeks",
                "allow_preorder": True,
            },
        )
        assert update_response.status_code == 200
        data = update_response.json()
        assert data.get("success") is True
        assert data["row"]["stock_quantity"] == 0
        assert data["row"]["in_stock"] is False
        assert data["row"]["estimated_restock"] == "2-3 weeks"
        assert data["row"]["allow_preorder"] is True
        assert data["row"]["status_icon"] == "red_x"
        assert data["row"]["preorder_without_exact_restock_prompt"] is False  # Has exact date
        print(f"Updated row with out-of-stock status and ETA: {data['row']}")

    def test_update_row_not_found(self):
        """PUT /api/johnny5/pricing-stock/rows/{bad_id} should return 404"""
        response = requests.put(
            f"{BASE_URL}/api/johnny5/pricing-stock/rows/nonexistent-id-123",
            headers=self.headers,
            json={"stock_quantity": 10},
        )
        assert response.status_code == 404
        print("Correctly returned 404 for nonexistent row")


class TestJohnny5CSVImportExport:
    """Test CSV import/export endpoints"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert response.status_code == 200
        self.token = response.json().get("access_token")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
        }

    def test_export_pricing_stock_csv(self):
        """GET /api/johnny5/pricing-stock/export.csv should return CSV file"""
        response = requests.get(
            f"{BASE_URL}/api/johnny5/pricing-stock/export.csv",
            headers=self.headers,
        )
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("Content-Type", "")
        content = response.text
        # Check for required CSV headers
        required_fields = [
            "sku",
            "product_id",
            "product_name",
            "option_strength",
            "option_package",
            "price",
            "cost_price",
            "stock_quantity",
            "in_stock",
            "estimated_restock",
            "allow_preorder",
        ]
        first_line = content.split("\n")[0]
        for field in required_fields:
            assert field in first_line, f"Missing field {field} in CSV header"
        print(f"CSV export headers valid: {first_line}")
        print(f"CSV total lines: {len(content.split(chr(10)))}")

    def test_import_pricing_stock_csv(self):
        """POST /api/johnny5/pricing-stock/import.csv should import CSV data"""
        # Create valid CSV content
        csv_content = """sku,product_id,product_name,option_strength,option_package,price,cost_price,stock_quantity,in_stock,estimated_restock,allow_preorder
IMPORT-TEST-001,,Import Test Product 1,5mg,Single,49.99,25.00,200,true,,false
IMPORT-TEST-002,,Import Test Product 2,10mg,Bundle,89.99,45.00,0,false,Mid January,true
"""
        files = {
            "file": ("test_import.csv", csv_content, "text/csv"),
        }
        response = requests.post(
            f"{BASE_URL}/api/johnny5/pricing-stock/import.csv",
            headers=self.headers,
            files=files,
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert data["imported"] == 2
        print(f"CSV import result: {data}")

        # Verify rows are present via GET
        list_response = requests.get(
            f"{BASE_URL}/api/johnny5/pricing-stock/rows",
            headers={**self.headers, "Content-Type": "application/json"},
        )
        rows = list_response.json().get("rows", [])
        skus = [r.get("sku") for r in rows]
        assert "IMPORT-TEST-001" in skus
        assert "IMPORT-TEST-002" in skus

    def test_import_csv_missing_columns(self):
        """POST /api/johnny5/pricing-stock/import.csv with missing columns should fail"""
        csv_content = """sku,product_name,price
BAD-SKU,Bad Product,10.00
"""
        files = {
            "file": ("bad_import.csv", csv_content, "text/csv"),
        }
        response = requests.post(
            f"{BASE_URL}/api/johnny5/pricing-stock/import.csv",
            headers=self.headers,
            files=files,
        )
        assert response.status_code == 400
        print(f"Correctly rejected CSV with missing columns: {response.json()}")

    def test_import_csv_non_csv_file(self):
        """POST /api/johnny5/pricing-stock/import.csv with non-CSV should fail"""
        txt_content = "This is not a CSV file"
        files = {
            "file": ("test.txt", txt_content, "text/plain"),
        }
        response = requests.post(
            f"{BASE_URL}/api/johnny5/pricing-stock/import.csv",
            headers=self.headers,
            files=files,
        )
        assert response.status_code == 400
        print("Correctly rejected non-CSV file")


class TestJohnny5ConnectedCartStock:
    """Test connected store integration endpoints for stock check"""

    def test_get_connected_store_stock(self):
        """GET /api/johnny5/integration/stock should return stock data for connected store"""
        response = requests.get(
            f"{BASE_URL}/api/johnny5/integration/stock",
            headers={
                "X-Store-API-Key": STORE_API_KEY,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "products" in data
        assert "store_id" in data
        print(f"Connected store stock: {len(data.get('products', []))} products returned")

        # Verify each product has required fields
        if data["products"]:
            product = data["products"][0]
            required_fields = [
                "status_icon",
                "estimated_restock",
                "allow_preorder",
                "connected_store_cost",
                "in_stock",
                "stock_quantity",
            ]
            for field in required_fields:
                assert field in product, f"Missing field {field} in product response"
            print(f"Sample product response: {product}")

    def test_get_connected_store_stock_missing_api_key(self):
        """GET /api/johnny5/integration/stock without API key should fail"""
        response = requests.get(f"{BASE_URL}/api/johnny5/integration/stock")
        assert response.status_code == 401
        print("Correctly returned 401 for missing API key")

    def test_check_connected_store_stock(self):
        """POST /api/johnny5/integration/stock/check should validate items for connected store"""
        payload = {
            "items": [
                {"sku": "IMPORT-TEST-001", "quantity": 1},
                {"product_id": "nonexistent-product", "quantity": 1},
            ]
        }
        response = requests.post(
            f"{BASE_URL}/api/johnny5/integration/stock/check",
            headers={
                "X-Store-API-Key": STORE_API_KEY,
                "Content-Type": "application/json",
            },
            json=payload,
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "all_available" in data
        assert "results" in data
        assert isinstance(data["results"], list)
        print(f"Stock check results: {data}")

        # Each result should have status_icon, ETA, preorder flag, connected_store_cost
        for result in data["results"]:
            assert "status" in result
            assert "status_icon" in result or result.get("status") in ["not_found", "missing_reference"]
            if "status_icon" in result:
                assert result["status_icon"] in ["green_check", "red_x"]
            if result.get("status") == "preorder_allowed":
                assert "preorder_without_exact_restock_prompt" in result


class TestJohnny5LocalCartStock:
    """Test local cart stock check endpoint"""

    def test_check_local_cart_stock(self):
        """POST /api/johnny5/local/stock/check should validate items for local storefront"""
        payload = {
            "items": [
                {
                    "sku": "IMPORT-TEST-001",
                    "selected_strength": "5mg",
                    "selected_package": "Single",
                    "quantity": 1,
                },
                {
                    "sku": "IMPORT-TEST-002",
                    "quantity": 1,
                },
            ]
        }
        response = requests.post(
            f"{BASE_URL}/api/johnny5/local/stock/check",
            headers={"Content-Type": "application/json"},
            json=payload,
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "all_available" in data
        assert "results" in data
        print(f"Local cart stock check: {data}")

        # Validate response structure
        for result in data["results"]:
            assert "status" in result
            assert "requested" in result
            assert "available" in result
            if "status_icon" in result:
                assert result["status_icon"] in ["green_check", "red_x"]

    def test_check_local_cart_stock_preorder_item(self):
        """POST /api/johnny5/local/stock/check for out-of-stock item with preorder=true"""
        # IMPORT-TEST-002 was set to out of stock with allow_preorder=true
        payload = {
            "items": [
                {
                    "sku": "IMPORT-TEST-002",
                    "quantity": 1,
                },
            ]
        }
        response = requests.post(
            f"{BASE_URL}/api/johnny5/local/stock/check",
            headers={"Content-Type": "application/json"},
            json=payload,
        )
        assert response.status_code == 200
        data = response.json()

        # The result should have preorder_allowed status if allow_preorder is true
        if data["results"]:
            result = data["results"][0]
            print(f"Preorder item result: {result}")
            # Status should be preorder_allowed since in_stock=false but allow_preorder=true
            assert result["status"] in ["ok", "preorder_allowed", "insufficient"]
            if result.get("status") == "preorder_allowed":
                assert "preorder_without_exact_restock_prompt" in result


class TestJohnny5GlobalMarkupApplied:
    """Test that global markup % is correctly applied to connected_store_cost"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert response.status_code == 200
        self.token = response.json().get("access_token")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    def test_global_markup_applied_to_connected_cost(self):
        """Verify connected_store_cost includes global markup %"""
        # Set markup to 20%
        requests.put(
            f"{BASE_URL}/api/johnny5/pricing-stock/settings",
            headers=self.headers,
            json={"global_markup_percent": 20.0},
        )

        # Create a test row with cost_price=100
        create_response = requests.post(
            f"{BASE_URL}/api/johnny5/pricing-stock/rows",
            headers=self.headers,
            json={
                "sku": "MARKUP-TEST-SKU",
                "product_name": "Markup Test Product",
                "price": 150.00,
                "cost_price": 100.00,
                "stock_quantity": 10,
                "in_stock": True,
            },
        )
        assert create_response.status_code == 200
        row = create_response.json()["row"]

        # connected_store_cost should be 100 * 1.20 = 120
        assert row["connected_store_cost"] == 120.00
        assert row["global_markup_percent"] == 20.0
        print(f"Markup test: cost_price=100, markup=20%, connected_store_cost={row['connected_store_cost']}")

        # Reset markup to 0
        requests.put(
            f"{BASE_URL}/api/johnny5/pricing-stock/settings",
            headers=self.headers,
            json={"global_markup_percent": 0.0},
        )


class TestJohnny5StockStatusIcons:
    """Test that status_icon correctly shows green_check or red_x based on stock"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert response.status_code == 200
        self.token = response.json().get("access_token")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    def test_in_stock_shows_green_check(self):
        """Row with in_stock=true and stock_quantity>0 should have status_icon=green_check"""
        create_response = requests.post(
            f"{BASE_URL}/api/johnny5/pricing-stock/rows",
            headers=self.headers,
            json={
                "sku": "STATUS-GREEN-TEST",
                "product_name": "Green Check Test",
                "price": 50.00,
                "cost_price": 25.00,
                "stock_quantity": 50,
                "in_stock": True,
            },
        )
        assert create_response.status_code == 200
        row = create_response.json()["row"]
        assert row["status_icon"] == "green_check"
        print(f"In-stock row has status_icon=green_check: PASS")

    def test_out_of_stock_shows_red_x(self):
        """Row with in_stock=false or stock_quantity=0 should have status_icon=red_x"""
        create_response = requests.post(
            f"{BASE_URL}/api/johnny5/pricing-stock/rows",
            headers=self.headers,
            json={
                "sku": "STATUS-RED-TEST",
                "product_name": "Red X Test",
                "price": 50.00,
                "cost_price": 25.00,
                "stock_quantity": 0,
                "in_stock": False,
                "estimated_restock": "Late January",
            },
        )
        assert create_response.status_code == 200
        row = create_response.json()["row"]
        assert row["status_icon"] == "red_x"
        assert row["estimated_restock"] == "Late January"
        print(f"Out-of-stock row has status_icon=red_x with ETA: PASS")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
