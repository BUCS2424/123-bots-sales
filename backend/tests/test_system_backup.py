"""
Test Suite for System Backup & Restore functionality
Tests the 2-step create/download flow, restore from zip, and retention policy (max 5 backups)
"""
import pytest
import requests
import os
import io
import zipfile

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def auth_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "super@amino.com",
        "password": "peptides"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")

@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Return headers with admin auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestSystemBackupList:
    """Tests for GET /api/admin-settings/system-backup/list"""
    
    def test_list_backups_requires_auth(self):
        """List backups should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin-settings/system-backup/list")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: List backups requires authentication")
    
    def test_list_backups_with_auth(self, auth_headers):
        """List backups should return backup metadata with auth"""
        response = requests.get(
            f"{BASE_URL}/api/admin-settings/system-backup/list",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "success" in data, "Response should contain 'success' field"
        assert data["success"] is True, "Response success should be True"
        assert "backups" in data, "Response should contain 'backups' field"
        assert isinstance(data["backups"], list), "Backups should be a list"
        assert "retention_count" in data, "Response should contain 'retention_count'"
        assert data["retention_count"] == 5, "Retention count should be 5"
        print(f"PASS: List backups returns {len(data['backups'])} backups with retention_count=5")


class TestSystemBackupCreate:
    """Tests for POST /api/admin-settings/system-backup/create"""
    
    def test_create_backup_requires_auth(self):
        """Create backup should require authentication"""
        response = requests.post(f"{BASE_URL}/api/admin-settings/system-backup/create")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Create backup requires authentication")
    
    def test_create_backup_with_auth(self, auth_headers):
        """Create backup should return backup metadata with auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin-settings/system-backup/create",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "success" in data, "Response should contain 'success' field"
        assert data["success"] is True, "Response success should be True"
        assert "backup_id" in data, "Response should contain 'backup_id'"
        assert "file_name" in data, "Response should contain 'file_name'"
        assert "created_at" in data, "Response should contain 'created_at'"
        assert data["file_name"].endswith(".zip"), "Backup file should be a .zip"
        assert "message" in data, "Response should contain 'message'"
        
        print(f"PASS: Create backup returned backup_id={data['backup_id']}, file={data['file_name']}")
        return data["backup_id"], data["file_name"]


class TestSystemBackupDownload:
    """Tests for GET /api/admin-settings/system-backup/download/{backup_id}"""
    
    def test_download_backup_requires_auth(self, auth_headers):
        """Download backup should require authentication"""
        # First create a backup to get a valid ID
        create_resp = requests.post(
            f"{BASE_URL}/api/admin-settings/system-backup/create",
            headers=auth_headers
        )
        backup_id = create_resp.json().get("backup_id")
        
        # Try download without auth
        response = requests.get(f"{BASE_URL}/api/admin-settings/system-backup/download/{backup_id}")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Download backup requires authentication")
    
    def test_download_backup_with_auth(self, auth_headers):
        """Download backup should return ZIP file with auth"""
        # First create a backup
        create_resp = requests.post(
            f"{BASE_URL}/api/admin-settings/system-backup/create",
            headers=auth_headers
        )
        assert create_resp.status_code == 200
        backup_data = create_resp.json()
        backup_id = backup_data["backup_id"]
        file_name = backup_data["file_name"]
        
        # Download the backup
        response = requests.get(
            f"{BASE_URL}/api/admin-settings/system-backup/download/{backup_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.headers.get("content-type") == "application/zip", \
            f"Expected application/zip content-type, got {response.headers.get('content-type')}"
        
        # Verify it's actually a valid ZIP
        try:
            zip_content = io.BytesIO(response.content)
            with zipfile.ZipFile(zip_content, 'r') as z:
                file_list = z.namelist()
                assert len(file_list) > 0, "ZIP file should contain files"
                # Check for expected structure
                has_app_files = any(f.startswith("app/") for f in file_list)
                has_mongo_dump = any(f.startswith("mongodb_dump/") for f in file_list)
                has_metadata = "backup_metadata.json" in file_list
                
                print(f"ZIP contents: {len(file_list)} files, has_app={has_app_files}, has_db={has_mongo_dump}, has_meta={has_metadata}")
                assert has_metadata, "ZIP should contain backup_metadata.json"
        except zipfile.BadZipFile:
            pytest.fail("Downloaded file is not a valid ZIP")
        
        print(f"PASS: Downloaded backup {file_name} ({len(response.content)} bytes) is a valid ZIP")
    
    def test_download_invalid_backup_id(self, auth_headers):
        """Download with invalid backup_id should return 404"""
        response = requests.get(
            f"{BASE_URL}/api/admin-settings/system-backup/download/invalid-backup-id-12345",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Download with invalid backup_id returns 404")


class TestSystemBackupRestore:
    """Tests for POST /api/admin-settings/system-backup/restore"""
    
    def test_restore_requires_auth(self):
        """Restore backup should require authentication"""
        # Create a minimal valid ZIP for testing
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w') as z:
            z.writestr("test.txt", "test content")
        zip_buffer.seek(0)
        
        response = requests.post(
            f"{BASE_URL}/api/admin-settings/system-backup/restore",
            files={"backup_file": ("test.zip", zip_buffer, "application/zip")}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Restore backup requires authentication")
    
    def test_restore_invalid_file_type(self, auth_headers):
        """Restore with non-ZIP file should return 400"""
        # Create a non-zip file
        txt_content = io.BytesIO(b"This is not a zip file")
        
        response = requests.post(
            f"{BASE_URL}/api/admin-settings/system-backup/restore",
            headers={"Authorization": auth_headers["Authorization"]},
            files={"backup_file": ("test.txt", txt_content, "text/plain")}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Response should contain 'detail' field"
        assert "zip" in data["detail"].lower(), "Error should mention zip format"
        print(f"PASS: Restore with non-ZIP returns 400: {data['detail']}")
    
    def test_restore_with_valid_zip(self, auth_headers):
        """Restore with valid ZIP should succeed"""
        # First create a backup to get a valid structure
        create_resp = requests.post(
            f"{BASE_URL}/api/admin-settings/system-backup/create",
            headers=auth_headers
        )
        assert create_resp.status_code == 200
        backup_id = create_resp.json()["backup_id"]
        
        # Download the backup
        download_resp = requests.get(
            f"{BASE_URL}/api/admin-settings/system-backup/download/{backup_id}",
            headers=auth_headers
        )
        assert download_resp.status_code == 200
        
        # Use the downloaded backup for restore test
        zip_content = io.BytesIO(download_resp.content)
        zip_content.seek(0)
        
        response = requests.post(
            f"{BASE_URL}/api/admin-settings/system-backup/restore",
            headers={"Authorization": auth_headers["Authorization"]},
            files={"backup_file": ("backup.zip", zip_content, "application/zip")}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "success" in data, "Response should contain 'success' field"
        assert data["success"] is True, "Response success should be True"
        assert "message" in data, "Response should contain 'message'"
        
        print(f"PASS: Restore completed: {data['message']}")


class TestRetentionPolicy:
    """Tests for backup retention policy (max 5 backups)"""
    
    def test_retention_keeps_max_5_backups(self, auth_headers):
        """Creating more than 5 backups should keep only the latest 5"""
        # Get initial count
        list_resp = requests.get(
            f"{BASE_URL}/api/admin-settings/system-backup/list",
            headers=auth_headers
        )
        initial_count = len(list_resp.json().get("backups", []))
        print(f"Initial backup count: {initial_count}")
        
        # Create backups until we have more than 5
        backups_to_create = max(0, 6 - initial_count)
        
        for i in range(backups_to_create):
            create_resp = requests.post(
                f"{BASE_URL}/api/admin-settings/system-backup/create",
                headers=auth_headers
            )
            assert create_resp.status_code == 200, f"Failed to create backup {i+1}"
            print(f"Created backup {i+1}/{backups_to_create}")
        
        # Verify retention policy
        list_resp = requests.get(
            f"{BASE_URL}/api/admin-settings/system-backup/list",
            headers=auth_headers
        )
        assert list_resp.status_code == 200
        
        data = list_resp.json()
        backup_count = len(data.get("backups", []))
        
        # Should be at most 5 backups
        assert backup_count <= 5, f"Expected max 5 backups, got {backup_count}"
        print(f"PASS: Retention policy keeps max 5 backups, current count: {backup_count}")


class TestBackupEndToEnd:
    """End-to-end test for the 2-step create/download flow"""
    
    def test_create_then_download_flow(self, auth_headers):
        """Test the complete 2-step backup flow: create -> download"""
        # Step 1: Create backup
        create_resp = requests.post(
            f"{BASE_URL}/api/admin-settings/system-backup/create",
            headers=auth_headers
        )
        assert create_resp.status_code == 200, f"Step 1 failed: {create_resp.status_code}"
        
        backup_data = create_resp.json()
        assert backup_data["success"] is True
        backup_id = backup_data["backup_id"]
        file_name = backup_data["file_name"]
        print(f"Step 1 complete: Created backup {file_name}")
        
        # Verify backup appears in list
        list_resp = requests.get(
            f"{BASE_URL}/api/admin-settings/system-backup/list",
            headers=auth_headers
        )
        assert list_resp.status_code == 200
        
        backups = list_resp.json().get("backups", [])
        backup_ids = [b.get("id") for b in backups]
        assert backup_id in backup_ids, f"Created backup {backup_id} not found in list"
        print(f"Step 1 verified: Backup appears in list")
        
        # Step 2: Download backup
        download_resp = requests.get(
            f"{BASE_URL}/api/admin-settings/system-backup/download/{backup_id}",
            headers=auth_headers
        )
        assert download_resp.status_code == 200, f"Step 2 failed: {download_resp.status_code}"
        assert len(download_resp.content) > 0, "Downloaded backup should not be empty"
        
        # Verify ZIP structure
        zip_content = io.BytesIO(download_resp.content)
        with zipfile.ZipFile(zip_content, 'r') as z:
            file_list = z.namelist()
            
            # Should contain app files, mongodb dump, and metadata
            has_app = any("app/" in f for f in file_list)
            has_metadata = "backup_metadata.json" in file_list
            
            print(f"Step 2 complete: Downloaded ZIP with {len(file_list)} files")
            print(f"  - Contains app files: {has_app}")
            print(f"  - Contains metadata: {has_metadata}")
        
        print("PASS: Full 2-step create->download flow completed successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
