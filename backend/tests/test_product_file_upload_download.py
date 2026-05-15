"""
Test suite for Product File Upload/Download Module
Tests: POST /api/store/products/{id}/files, GET /api/store/products/{id}/files,
       DELETE /api/store/products/{id}/files/{file_id},
       PATCH /api/store/products/{id}/files/{file_id},
       GET /api/store/products/{id}/files/download/{filename},
       GET /api/store/orders/my
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
PRODUCT_ID = "1a95914e-8136-4517-ab15-075405207856"  # Pre-existing test product

ADMIN_EMAIL = "mel@a2gdesigns.com"
ADMIN_PASSWORD = "BigDaddy2016!!"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin auth token."""
    res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if res.status_code == 200:
        return res.json().get("token") or res.json().get("access_token")
    pytest.skip(f"Admin auth failed: {res.status_code} {res.text}")


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


class TestProductFilesListEndpoint:
    """GET /api/store/products/{product_id}/files"""

    def test_list_files_no_auth(self):
        """Public endpoint - should return 200 with files list."""
        res = requests.get(f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files")
        assert res.status_code == 200
        data = res.json()
        assert "files" in data
        assert isinstance(data["files"], list)
        print(f"PASS: list_files_no_auth -> {len(data['files'])} files found")

    def test_list_files_private_have_no_url(self):
        """Private files should not have URL in public listing."""
        res = requests.get(f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files")
        assert res.status_code == 200
        files = res.json()["files"]
        for f in files:
            if not f.get("is_public", True):
                assert "url" not in f or f.get("url") is None, \
                    f"Private file {f.get('id')} should not have URL in public listing"
        print(f"PASS: private files don't expose URLs to unauthenticated users")

    def test_list_files_public_have_url(self):
        """Public files should have URL."""
        res = requests.get(f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files")
        assert res.status_code == 200
        files = res.json()["files"]
        for f in files:
            if f.get("is_public"):
                assert "url" in f and f["url"], \
                    f"Public file {f.get('id')} should have URL"
        print(f"PASS: public files expose URLs")

    def test_list_files_nonexistent_product(self):
        """Should return 404 for unknown product."""
        res = requests.get(f"{BASE_URL}/api/store/products/nonexistent-product-id/files")
        assert res.status_code == 404
        print("PASS: nonexistent product returns 404")


class TestProductFileUpload:
    """POST /api/store/products/{product_id}/files"""

    uploaded_file_id = None

    def test_upload_file_no_auth(self):
        """Upload without auth should return 401."""
        dummy_content = b"test file content"
        files = {"file": ("test.txt", io.BytesIO(dummy_content), "text/plain")}
        res = requests.post(
            f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files",
            files=files,
            data={"is_public": "false"}
        )
        assert res.status_code in [401, 403]
        print(f"PASS: upload without auth returns {res.status_code}")

    def test_upload_public_file(self, admin_headers):
        """Admin can upload a public file."""
        dummy_content = b"TEST_public_file_content_for_testing"
        files = {"file": ("TEST_public.txt", io.BytesIO(dummy_content), "text/plain")}
        res = requests.post(
            f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files",
            headers=admin_headers,
            files=files,
            data={"is_public": "true"}
        )
        assert res.status_code == 200, f"Upload failed: {res.status_code} {res.text}"
        data = res.json()
        assert "file" in data
        file_record = data["file"]
        assert file_record.get("is_public") == True
        assert file_record.get("name") == "TEST_public.txt"
        assert "id" in file_record
        assert "url" in file_record
        assert "size" in file_record
        TestProductFileUpload.uploaded_file_id = file_record["id"]
        print(f"PASS: upload_public_file -> id={file_record['id']}")

    def test_upload_private_file(self, admin_headers):
        """Admin can upload a private file."""
        dummy_content = b"TEST_private_file_content_for_testing"
        files = {"file": ("TEST_private.txt", io.BytesIO(dummy_content), "text/plain")}
        res = requests.post(
            f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files",
            headers=admin_headers,
            files=files,
            data={"is_public": "false"}
        )
        assert res.status_code == 200, f"Upload failed: {res.status_code} {res.text}"
        data = res.json()
        file_record = data["file"]
        assert file_record.get("is_public") == False
        print(f"PASS: upload_private_file -> id={file_record['id']}")

    def test_uploaded_file_appears_in_list(self, admin_headers):
        """After upload, file should appear in list."""
        res = requests.get(f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files")
        assert res.status_code == 200
        files = res.json()["files"]
        file_names = [f["name"] for f in files]
        assert "TEST_public.txt" in file_names or any("TEST_public" in n for n in file_names), \
            f"Uploaded file not found in list. Found: {file_names}"
        print(f"PASS: uploaded file appears in list. Total files: {len(files)}")


class TestProductFileToggle:
    """PATCH /api/store/products/{product_id}/files/{file_id}"""

    def test_toggle_requires_admin(self):
        """Toggle without auth should fail."""
        res = requests.patch(
            f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files/some-file-id",
            json={"is_public": True}
        )
        assert res.status_code in [401, 403]
        print(f"PASS: toggle without auth returns {res.status_code}")

    def test_toggle_file_visibility(self, admin_headers):
        """Admin can toggle file from public to private and back."""
        # First upload a file to toggle
        dummy_content = b"TEST_toggle_file"
        files = {"file": ("TEST_toggle.txt", io.BytesIO(dummy_content), "text/plain")}
        upload_res = requests.post(
            f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files",
            headers=admin_headers,
            files=files,
            data={"is_public": "true"}
        )
        assert upload_res.status_code == 200
        file_id = upload_res.json()["file"]["id"]

        # Toggle to private
        patch_res = requests.patch(
            f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files/{file_id}",
            headers=admin_headers,
            json={"is_public": False}
        )
        assert patch_res.status_code == 200
        assert patch_res.json().get("success") == True

        # Verify it's private now (URL should be stripped)
        list_res = requests.get(f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files")
        files_list = list_res.json()["files"]
        toggled = next((f for f in files_list if f["id"] == file_id), None)
        assert toggled is not None
        assert toggled.get("is_public") == False
        assert "url" not in toggled or not toggled.get("url"), "Private file URL should be stripped"

        # Toggle back to public
        patch_res2 = requests.patch(
            f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files/{file_id}",
            headers=admin_headers,
            json={"is_public": True}
        )
        assert patch_res2.status_code == 200
        print(f"PASS: toggle_file_visibility -> toggled file {file_id}")

        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files/{file_id}",
            headers=admin_headers
        )


class TestProductFileDownload:
    """GET /api/store/products/{product_id}/files/download/{filename}"""

    def test_download_public_file(self, admin_headers):
        """Public file should be downloadable without auth."""
        # First upload a public file
        dummy_content = b"TEST_download_public_content"
        files = {"file": ("TEST_dl_public.txt", io.BytesIO(dummy_content), "text/plain")}
        upload_res = requests.post(
            f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files",
            headers=admin_headers,
            files=files,
            data={"is_public": "true"}
        )
        assert upload_res.status_code == 200
        file_record = upload_res.json()["file"]
        file_url = file_record["url"]
        file_id = file_record["id"]

        # Download without auth (public)
        dl_res = requests.get(f"{BASE_URL}{file_url}")
        assert dl_res.status_code == 200
        assert dl_res.content == dummy_content
        print(f"PASS: public file download works without auth")

        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files/{file_id}",
            headers=admin_headers
        )

    def test_download_private_file_no_auth(self, admin_headers):
        """Private file should return 401 without auth."""
        # First upload a private file
        dummy_content = b"TEST_download_private_content"
        files = {"file": ("TEST_dl_private.txt", io.BytesIO(dummy_content), "text/plain")}
        upload_res = requests.post(
            f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files",
            headers=admin_headers,
            files=files,
            data={"is_public": "false"}
        )
        assert upload_res.status_code == 200
        file_record = upload_res.json()["file"]
        file_url = file_record["url"]
        file_id = file_record["id"]

        # Try to download without auth
        dl_res = requests.get(f"{BASE_URL}{file_url}")
        assert dl_res.status_code == 401, f"Expected 401 but got {dl_res.status_code}"
        print(f"PASS: private file returns 401 without auth")

        # Admin can download with auth token (via query param)
        admin_token_val = admin_headers["Authorization"].replace("Bearer ", "")
        dl_res_auth = requests.get(f"{BASE_URL}{file_url}?token={admin_token_val}")
        assert dl_res_auth.status_code == 200, f"Admin token download failed: {dl_res_auth.status_code}"
        print(f"PASS: private file download works with admin token")

        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files/{file_id}",
            headers=admin_headers
        )


class TestProductFileDelete:
    """DELETE /api/store/products/{product_id}/files/{file_id}"""

    def test_delete_requires_admin(self):
        """Delete without auth should return 401."""
        res = requests.delete(
            f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files/some-file-id"
        )
        assert res.status_code in [401, 403]
        print(f"PASS: delete without auth returns {res.status_code}")

    def test_delete_nonexistent_file(self, admin_headers):
        """Delete nonexistent file should return 404."""
        res = requests.delete(
            f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files/nonexistent-file-id",
            headers=admin_headers
        )
        assert res.status_code == 404
        print("PASS: delete nonexistent file returns 404")

    def test_upload_and_delete_file(self, admin_headers):
        """Upload file then delete it - verify it's gone."""
        # Upload
        dummy_content = b"TEST_delete_me"
        files = {"file": ("TEST_delete_me.txt", io.BytesIO(dummy_content), "text/plain")}
        upload_res = requests.post(
            f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files",
            headers=admin_headers,
            files=files,
            data={"is_public": "true"}
        )
        assert upload_res.status_code == 200
        file_id = upload_res.json()["file"]["id"]

        # Delete
        del_res = requests.delete(
            f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files/{file_id}",
            headers=admin_headers
        )
        assert del_res.status_code == 200
        assert del_res.json().get("success") == True

        # Verify gone
        list_res = requests.get(f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files")
        files_list = list_res.json()["files"]
        file_ids = [f["id"] for f in files_list]
        assert file_id not in file_ids, "Deleted file still in list"
        print(f"PASS: upload_and_delete_file -> file removed from list")


class TestOrdersMyEndpoint:
    """GET /api/store/orders/my - CRITICAL: tests route ordering conflict"""

    def test_orders_my_requires_auth(self):
        """Should return 401 without auth."""
        res = requests.get(f"{BASE_URL}/api/store/orders/my")
        assert res.status_code == 401, \
            f"Expected 401 but got {res.status_code}. CRITICAL: If 404, route is captured by /orders/{{order_id}}"
        print(f"PASS: /orders/my without auth returns {res.status_code}")

    def test_orders_my_returns_orders_list(self, admin_headers):
        """Authenticated user should get their orders list."""
        res = requests.get(f"{BASE_URL}/api/store/orders/my", headers=admin_headers)
        assert res.status_code == 200, \
            f"Expected 200 but got {res.status_code}. CRITICAL: If 422/404, route ordering bug detected. Response: {res.text}"
        data = res.json()
        assert "orders" in data, f"Response should have 'orders' key. Got: {data}"
        assert isinstance(data["orders"], list), "Orders should be a list"
        print(f"PASS: /orders/my returns {len(data['orders'])} orders for admin")

    def test_orders_my_not_treated_as_order_id(self):
        """Verify that /orders/my is NOT treated as order_id='my' which returns 404."""
        # Without auth it should be 401 (not 404 which would mean route conflict)
        res = requests.get(f"{BASE_URL}/api/store/orders/my")
        assert res.status_code != 404, \
            f"CRITICAL BUG: /orders/my returns 404 - route is being captured by /orders/{{order_id}} treating 'my' as order_id"
        print(f"PASS: /orders/my correctly handled (status={res.status_code}), not captured by /orders/{{order_id}}")


class TestCleanup:
    """Cleanup TEST_ files after testing."""

    def test_cleanup_test_files(self, admin_headers):
        """Remove any TEST_ prefixed files from the product."""
        res = requests.get(f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files")
        assert res.status_code == 200
        files = res.json()["files"]
        cleaned = 0
        for f in files:
            if f.get("name", "").startswith("TEST_"):
                del_res = requests.delete(
                    f"{BASE_URL}/api/store/products/{PRODUCT_ID}/files/{f['id']}",
                    headers=admin_headers
                )
                if del_res.status_code == 200:
                    cleaned += 1
        print(f"PASS: cleanup -> removed {cleaned} TEST_ files")
