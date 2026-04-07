"""
External Stack API Delivery Module Tests
- Pipelines CRUD (create/edit/delete pipelines with stages)
- External API Sources CRUD (each with unique auth credentials)
- Lead Ingestion Endpoint (accepts full 25+ field set)
- Feature flag gating (external_api_enabled)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "mel@a2gdesigns.com"
ADMIN_PASSWORD = "BigDaddy2016!!"


@pytest.fixture(scope="module")
def auth_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    token = data.get("access_token") or data.get("token")
    assert token, "No token in login response"
    return token


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestPipelinesCRUD:
    """Test Pipelines CRUD operations"""
    
    created_pipeline_id = None
    
    def test_get_pipelines_returns_default(self, auth_headers):
        """GET /api/pipelines/ returns the default Main Leads Pipeline with 7 stages"""
        response = requests.get(f"{BASE_URL}/api/pipelines/", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        pipelines = response.json()
        assert isinstance(pipelines, list), "Response should be a list"
        assert len(pipelines) >= 1, "Should have at least one pipeline"
        
        # Find the default pipeline
        default_pipeline = next((p for p in pipelines if p.get("is_default")), None)
        assert default_pipeline is not None, "Default pipeline not found"
        assert default_pipeline["name"] == "Main Leads Pipeline", f"Default pipeline name mismatch: {default_pipeline['name']}"
        
        # Verify 7 stages
        stages = default_pipeline.get("stages", [])
        assert len(stages) == 7, f"Expected 7 stages, got {len(stages)}"
        
        expected_stage_labels = ["Cold Call", "Build Interest", "Interested/Waiting", "Demo", "Proposal Sent", "Waiting on Leadership", "Closed"]
        actual_labels = [s["label"] for s in stages]
        assert actual_labels == expected_stage_labels, f"Stage labels mismatch: {actual_labels}"
        print(f"PASS: Default pipeline has 7 stages: {actual_labels}")
    
    def test_create_custom_pipeline(self, auth_headers):
        """POST /api/pipelines/ creates a new custom pipeline with custom stages"""
        unique_name = f"TEST_Pipeline_{uuid.uuid4().hex[:8]}"
        payload = {
            "name": unique_name,
            "stages": [
                {"label": "New Lead", "color": "bg-blue-500"},
                {"label": "Qualified", "color": "bg-green-500"},
                {"label": "Won", "color": "bg-emerald-600"}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/pipelines/", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data.get("name") == unique_name, f"Name mismatch: {data.get('name')}"
        assert data.get("is_default") == False, "Custom pipeline should not be default"
        assert len(data.get("stages", [])) == 3, f"Expected 3 stages, got {len(data.get('stages', []))}"
        assert "id" in data, "Pipeline should have an ID"
        
        TestPipelinesCRUD.created_pipeline_id = data["id"]
        print(f"PASS: Created custom pipeline '{unique_name}' with ID {data['id']}")
    
    def test_update_pipeline(self, auth_headers):
        """PUT /api/pipelines/{id} updates a pipeline's name and stages"""
        if not TestPipelinesCRUD.created_pipeline_id:
            pytest.skip("No pipeline created to update")
        
        pipeline_id = TestPipelinesCRUD.created_pipeline_id
        updated_name = f"TEST_Updated_Pipeline_{uuid.uuid4().hex[:8]}"
        payload = {
            "name": updated_name,
            "stages": [
                {"label": "Stage A", "color": "bg-red-500"},
                {"label": "Stage B", "color": "bg-yellow-500"}
            ]
        }
        
        response = requests.put(f"{BASE_URL}/api/pipelines/{pipeline_id}", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Update should succeed: {data}"
        
        # Verify update by fetching
        get_response = requests.get(f"{BASE_URL}/api/pipelines/", headers=auth_headers)
        pipelines = get_response.json()
        updated_pipeline = next((p for p in pipelines if p.get("id") == pipeline_id), None)
        assert updated_pipeline is not None, "Updated pipeline not found"
        assert updated_pipeline["name"] == updated_name, f"Name not updated: {updated_pipeline['name']}"
        assert len(updated_pipeline["stages"]) == 2, f"Stages not updated: {len(updated_pipeline['stages'])}"
        print(f"PASS: Updated pipeline to '{updated_name}' with 2 stages")
    
    def test_delete_non_default_pipeline(self, auth_headers):
        """DELETE /api/pipelines/{id} deletes a non-default pipeline"""
        if not TestPipelinesCRUD.created_pipeline_id:
            pytest.skip("No pipeline created to delete")
        
        pipeline_id = TestPipelinesCRUD.created_pipeline_id
        response = requests.delete(f"{BASE_URL}/api/pipelines/{pipeline_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Delete should succeed: {data}"
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/pipelines/", headers=auth_headers)
        pipelines = get_response.json()
        deleted_pipeline = next((p for p in pipelines if p.get("id") == pipeline_id), None)
        assert deleted_pipeline is None, "Pipeline should be deleted"
        print(f"PASS: Deleted pipeline {pipeline_id}")
        TestPipelinesCRUD.created_pipeline_id = None
    
    def test_cannot_delete_default_pipeline(self, auth_headers):
        """DELETE /api/pipelines/{id} rejects deleting the default pipeline"""
        # Get default pipeline ID
        response = requests.get(f"{BASE_URL}/api/pipelines/", headers=auth_headers)
        pipelines = response.json()
        default_pipeline = next((p for p in pipelines if p.get("is_default")), None)
        assert default_pipeline is not None, "Default pipeline not found"
        
        delete_response = requests.delete(f"{BASE_URL}/api/pipelines/{default_pipeline['id']}", headers=auth_headers)
        assert delete_response.status_code == 400, f"Should reject with 400, got {delete_response.status_code}"
        
        data = delete_response.json()
        assert "default" in data.get("detail", "").lower(), f"Error should mention default: {data}"
        print(f"PASS: Cannot delete default pipeline - got 400 with message: {data.get('detail')}")


class TestExternalApiSourcesCRUD:
    """Test External API Sources CRUD operations"""
    
    created_source_id = None
    created_source_token = None
    created_source_header = None
    
    def test_get_sources_list(self, auth_headers):
        """GET /api/external-api/sources returns list of sources"""
        response = requests.get(f"{BASE_URL}/api/external-api/sources", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        sources = response.json()
        assert isinstance(sources, list), "Response should be a list"
        print(f"PASS: GET /api/external-api/sources returns {len(sources)} sources")
    
    def test_create_source_with_auto_token(self, auth_headers):
        """POST /api/external-api/sources creates a new source with auto-generated auth token"""
        unique_name = f"TEST_Source_{uuid.uuid4().hex[:8]}"
        payload = {
            "name": unique_name,
            "auth_header_name": "X-Test-API-Key",
            "email_forward_enabled": False
        }
        
        response = requests.post(f"{BASE_URL}/api/external-api/sources", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data.get("name") == unique_name, f"Name mismatch: {data.get('name')}"
        assert data.get("auth_header_name") == "X-Test-API-Key", f"Header mismatch: {data.get('auth_header_name')}"
        assert "auth_token" in data, "Should have auto-generated auth_token"
        assert len(data.get("auth_token", "")) > 20, "Token should be substantial"
        assert data.get("is_active") == True, "New source should be active"
        assert data.get("leads_received") == 0, "New source should have 0 leads"
        assert "id" in data, "Source should have an ID"
        
        TestExternalApiSourcesCRUD.created_source_id = data["id"]
        TestExternalApiSourcesCRUD.created_source_token = data["auth_token"]
        TestExternalApiSourcesCRUD.created_source_header = data["auth_header_name"]
        print(f"PASS: Created source '{unique_name}' with token {data['auth_token'][:20]}...")
    
    def test_update_source_toggle_active(self, auth_headers):
        """PUT /api/external-api/sources/{id} updates a source (toggle active, change settings)"""
        if not TestExternalApiSourcesCRUD.created_source_id:
            pytest.skip("No source created to update")
        
        source_id = TestExternalApiSourcesCRUD.created_source_id
        
        # Toggle to inactive
        payload = {"is_active": False}
        response = requests.put(f"{BASE_URL}/api/external-api/sources/{source_id}", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/external-api/sources", headers=auth_headers)
        sources = get_response.json()
        updated_source = next((s for s in sources if s.get("id") == source_id), None)
        assert updated_source is not None, "Updated source not found"
        assert updated_source["is_active"] == False, "Source should be inactive"
        
        # Toggle back to active
        payload = {"is_active": True}
        response = requests.put(f"{BASE_URL}/api/external-api/sources/{source_id}", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        print(f"PASS: Toggled source {source_id} active status")
    
    def test_regenerate_token(self, auth_headers):
        """POST /api/external-api/sources/{id}/regenerate-token generates a new token"""
        if not TestExternalApiSourcesCRUD.created_source_id:
            pytest.skip("No source created to regenerate token")
        
        source_id = TestExternalApiSourcesCRUD.created_source_id
        old_token = TestExternalApiSourcesCRUD.created_source_token
        
        response = requests.post(f"{BASE_URL}/api/external-api/sources/{source_id}/regenerate-token", json={}, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Regenerate should succeed: {data}"
        assert "auth_token" in data, "Should return new token"
        new_token = data["auth_token"]
        assert new_token != old_token, "New token should be different from old token"
        assert len(new_token) > 20, "New token should be substantial"
        
        TestExternalApiSourcesCRUD.created_source_token = new_token
        print(f"PASS: Regenerated token from {old_token[:10]}... to {new_token[:10]}...")


class TestLeadIngestion:
    """Test Lead Ingestion Endpoint"""
    
    def test_lead_ingestion_with_valid_auth(self, auth_headers):
        """POST /api/external-api/leads with valid source auth header+token creates a lead successfully"""
        source_id = TestExternalApiSourcesCRUD.created_source_id
        source_token = TestExternalApiSourcesCRUD.created_source_token
        source_header = TestExternalApiSourcesCRUD.created_source_header
        
        if not source_id or not source_token:
            pytest.skip("No source created for lead ingestion test")
        
        # Create lead with the source's auth header
        lead_payload = {
            "name": f"TEST_Lead_{uuid.uuid4().hex[:8]}",
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "555-123-4567",
            "opportunity_name": "Test Opportunity",
            "business_name": "Test Business Inc",
            "opportunity_value": 5000.00,
            "opportunity_source": "Test Source",
            "notes": "This is a test lead from external API"
        }
        
        # Use the source's custom auth header
        lead_headers = {source_header: source_token}
        
        response = requests.post(f"{BASE_URL}/api/external-api/leads", json=lead_payload, headers=lead_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Lead creation should succeed: {data}"
        assert "lead_id" in data, "Should return lead_id"
        assert "source" in data, "Should return source name"
        print(f"PASS: Created lead {data['lead_id']} via external API from source '{data['source']}'")
    
    def test_lead_ingestion_invalid_auth(self):
        """POST /api/external-api/leads with invalid/missing auth returns 401"""
        lead_payload = {
            "name": "Test Lead",
            "email": "test@example.com"
        }
        
        # No auth header
        response = requests.post(f"{BASE_URL}/api/external-api/leads", json=lead_payload)
        assert response.status_code == 401, f"Should return 401, got {response.status_code}"
        
        # Invalid token
        response = requests.post(f"{BASE_URL}/api/external-api/leads", json=lead_payload, headers={"X-API-Key": "invalid_token"})
        assert response.status_code == 401, f"Should return 401 for invalid token, got {response.status_code}"
        print("PASS: Invalid/missing auth returns 401")
    
    def test_lead_ingestion_increments_count(self, auth_headers):
        """POST /api/external-api/leads increments leads_received count on the source"""
        source_id = TestExternalApiSourcesCRUD.created_source_id
        source_token = TestExternalApiSourcesCRUD.created_source_token
        source_header = TestExternalApiSourcesCRUD.created_source_header
        
        if not source_id or not source_token:
            pytest.skip("No source created for lead count test")
        
        # Get current count
        get_response = requests.get(f"{BASE_URL}/api/external-api/sources", headers=auth_headers)
        sources = get_response.json()
        source = next((s for s in sources if s.get("id") == source_id), None)
        initial_count = source.get("leads_received", 0)
        
        # Create a lead
        lead_payload = {
            "name": f"TEST_CountLead_{uuid.uuid4().hex[:8]}",
            "email": f"count_{uuid.uuid4().hex[:8]}@example.com"
        }
        lead_headers = {source_header: source_token}
        response = requests.post(f"{BASE_URL}/api/external-api/leads", json=lead_payload, headers=lead_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify count incremented
        get_response = requests.get(f"{BASE_URL}/api/external-api/sources", headers=auth_headers)
        sources = get_response.json()
        source = next((s for s in sources if s.get("id") == source_id), None)
        new_count = source.get("leads_received", 0)
        
        assert new_count == initial_count + 1, f"Count should increment from {initial_count} to {initial_count + 1}, got {new_count}"
        print(f"PASS: leads_received incremented from {initial_count} to {new_count}")


class TestFeatureFlag:
    """Test Feature Flag gating"""
    
    def test_feature_flag_in_public_endpoint(self):
        """GET /api/settings/feature-flags includes external_api_enabled"""
        response = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "external_api_enabled" in data, "Feature flags should include external_api_enabled"
        print(f"PASS: external_api_enabled = {data['external_api_enabled']}")
    
    def test_feature_flag_in_admin_endpoint(self, auth_headers):
        """GET /api/admin-settings/feature-flags includes external_api_enabled"""
        response = requests.get(f"{BASE_URL}/api/admin-settings/feature-flags", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "external_api_enabled" in data, "Admin feature flags should include external_api_enabled"
        print(f"PASS: Admin external_api_enabled = {data['external_api_enabled']}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_delete_test_source(self, auth_headers):
        """DELETE /api/external-api/sources/{id} deletes a source"""
        source_id = TestExternalApiSourcesCRUD.created_source_id
        if not source_id:
            pytest.skip("No source to delete")
        
        response = requests.delete(f"{BASE_URL}/api/external-api/sources/{source_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Delete should succeed: {data}"
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/external-api/sources", headers=auth_headers)
        sources = get_response.json()
        deleted_source = next((s for s in sources if s.get("id") == source_id), None)
        assert deleted_source is None, "Source should be deleted"
        print(f"PASS: Deleted test source {source_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
