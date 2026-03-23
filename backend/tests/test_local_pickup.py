"""
Test suite for Local Pickup feature
Tests admin CRUD operations for pickup locations and public endpoint
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestLocalPickupPublicAPI:
    """Tests for public local pickup settings endpoint (no auth required)"""
    
    def test_get_public_local_pickup_settings(self):
        """GET /api/settings/local-pickup returns enabled status and active locations"""
        response = requests.get(f"{BASE_URL}/api/settings/local-pickup")
        assert response.status_code == 200
        
        data = response.json()
        assert "enabled" in data
        assert "locations" in data
        assert isinstance(data["locations"], list)
        print(f"Public local pickup: enabled={data['enabled']}, locations={len(data['locations'])}")
    
    def test_public_endpoint_only_returns_active_locations(self, auth_token, cleanup_test_locations):
        """Public endpoint should only return active locations (inactive filtered out)"""
        # Create an inactive location via admin API
        inactive_location = {
            "name": "TEST_Inactive Location",
            "address": "999 Hidden St",
            "city": "Nowhere",
            "state": "AL",
            "zip_code": "99999",
            "active": False
        }
        
        add_resp = requests.post(
            f"{BASE_URL}/api/admin-settings/local-pickup/locations",
            headers={"Authorization": f"Bearer {auth_token}"},
            json=inactive_location
        )
        assert add_resp.status_code == 200
        loc_id = add_resp.json()["location"]["id"]
        cleanup_test_locations.append(loc_id)
        
        # Public endpoint should not include this location
        public_resp = requests.get(f"{BASE_URL}/api/settings/local-pickup")
        assert public_resp.status_code == 200
        
        public_locations = public_resp.json()["locations"]
        inactive_ids = [loc["id"] for loc in public_locations if loc.get("name") == "TEST_Inactive Location"]
        assert len(inactive_ids) == 0, "Inactive location should not appear in public endpoint"
        print("Verified: inactive locations are filtered from public endpoint")


class TestLocalPickupAdminAPI:
    """Tests for admin local pickup settings endpoints"""
    
    def test_get_admin_local_pickup_settings(self, auth_token):
        """GET /api/admin-settings/local-pickup returns full settings including inactive locations"""
        response = requests.get(
            f"{BASE_URL}/api/admin-settings/local-pickup",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "enabled" in data
        assert "locations" in data
        # Admin endpoint includes 'active' field and 'updated_at'
        print(f"Admin local pickup: enabled={data['enabled']}, locations={len(data['locations'])}")
    
    def test_enable_disable_local_pickup(self, auth_token):
        """PUT /api/admin-settings/local-pickup can toggle enabled status"""
        # Get current state
        get_resp = requests.get(
            f"{BASE_URL}/api/admin-settings/local-pickup",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        current_state = get_resp.json()
        
        # Toggle enabled
        new_enabled = not current_state.get("enabled", False)
        update_resp = requests.put(
            f"{BASE_URL}/api/admin-settings/local-pickup",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"enabled": new_enabled, "locations": current_state.get("locations", [])}
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["success"] == True
        
        # Verify change
        verify_resp = requests.get(
            f"{BASE_URL}/api/admin-settings/local-pickup",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert verify_resp.json()["enabled"] == new_enabled
        
        # Restore original state
        requests.put(
            f"{BASE_URL}/api/admin-settings/local-pickup",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"enabled": current_state.get("enabled", True), "locations": current_state.get("locations", [])}
        )
        print(f"Toggle test passed: enabled toggled to {new_enabled} and restored")
    
    def test_add_pickup_location(self, auth_token, cleanup_test_locations):
        """POST /api/admin-settings/local-pickup/locations creates new location with generated ID"""
        new_location = {
            "name": "TEST_New Warehouse",
            "address": "789 Test Ave",
            "city": "Montgomery",
            "state": "AL",
            "zip_code": "36104",
            "phone": "(334) 555-1234",
            "hours": "Mon-Fri 8am-6pm",
            "notes": "Test location for automated testing",
            "active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin-settings/local-pickup/locations",
            headers={"Authorization": f"Bearer {auth_token}"},
            json=new_location
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "location" in data
        assert data["location"]["id"]  # ID should be generated
        assert data["location"]["name"] == "TEST_New Warehouse"
        assert data["location"]["address"] == "789 Test Ave"
        
        cleanup_test_locations.append(data["location"]["id"])
        print(f"Created location: {data['location']['id']}")
    
    def test_update_pickup_location(self, auth_token, cleanup_test_locations):
        """PUT /api/admin-settings/local-pickup/locations/{id} updates existing location"""
        # First create a location
        create_resp = requests.post(
            f"{BASE_URL}/api/admin-settings/local-pickup/locations",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "TEST_Update Test",
                "address": "100 Update St",
                "city": "Huntsville",
                "state": "AL",
                "zip_code": "35801",
                "active": True
            }
        )
        assert create_resp.status_code == 200
        loc_id = create_resp.json()["location"]["id"]
        cleanup_test_locations.append(loc_id)
        
        # Update the location
        update_resp = requests.put(
            f"{BASE_URL}/api/admin-settings/local-pickup/locations/{loc_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "TEST_Updated Name",
                "address": "200 Updated Ave",
                "city": "Huntsville",
                "state": "AL",
                "zip_code": "35802",
                "phone": "(256) 555-9999",
                "active": True
            }
        )
        
        assert update_resp.status_code == 200
        assert update_resp.json()["success"] == True
        
        # Verify update
        get_resp = requests.get(
            f"{BASE_URL}/api/admin-settings/local-pickup",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        locations = get_resp.json()["locations"]
        updated_loc = next((l for l in locations if l["id"] == loc_id), None)
        
        assert updated_loc is not None
        assert updated_loc["name"] == "TEST_Updated Name"
        assert updated_loc["address"] == "200 Updated Ave"
        print(f"Updated location {loc_id} successfully")
    
    def test_delete_pickup_location(self, auth_token):
        """DELETE /api/admin-settings/local-pickup/locations/{id} removes location"""
        # Create a location to delete
        create_resp = requests.post(
            f"{BASE_URL}/api/admin-settings/local-pickup/locations",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "TEST_Delete Test",
                "address": "999 Delete Me",
                "city": "Mobile",
                "state": "AL",
                "zip_code": "36601",
                "active": True
            }
        )
        assert create_resp.status_code == 200
        loc_id = create_resp.json()["location"]["id"]
        
        # Delete the location
        delete_resp = requests.delete(
            f"{BASE_URL}/api/admin-settings/local-pickup/locations/{loc_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert delete_resp.status_code == 200
        assert delete_resp.json()["success"] == True
        
        # Verify deletion
        get_resp = requests.get(
            f"{BASE_URL}/api/admin-settings/local-pickup",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        locations = get_resp.json()["locations"]
        deleted_loc = next((l for l in locations if l["id"] == loc_id), None)
        
        assert deleted_loc is None, "Location should be deleted"
        print(f"Deleted location {loc_id} successfully")
    
    def test_delete_nonexistent_location_returns_404(self, auth_token):
        """DELETE non-existent location should return 404"""
        response = requests.delete(
            f"{BASE_URL}/api/admin-settings/local-pickup/locations/non-existent-id-12345",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json().get("detail", "").lower()
        print("Correctly returned 404 for non-existent location delete")
    
    def test_update_nonexistent_location_returns_404(self, auth_token):
        """PUT non-existent location should return 404"""
        response = requests.put(
            f"{BASE_URL}/api/admin-settings/local-pickup/locations/non-existent-id-12345",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "Test",
                "address": "123 Test",
                "city": "Test",
                "state": "AL",
                "zip_code": "12345",
                "active": True
            }
        )
        
        assert response.status_code == 404
        assert "not found" in response.json().get("detail", "").lower()
        print("Correctly returned 404 for non-existent location update")
    
    def test_location_required_fields_validation(self, auth_token):
        """Location creation requires name, address, city, state, zip_code"""
        # Test with missing required fields
        incomplete_location = {
            "name": "TEST_Incomplete",
            # Missing address, city, state, zip_code
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin-settings/local-pickup/locations",
            headers={"Authorization": f"Bearer {auth_token}"},
            json=incomplete_location
        )
        
        # Should fail validation (422 Unprocessable Entity)
        assert response.status_code == 422
        print("Correctly validated required fields")


# Fixtures
@pytest.fixture(scope="session")
def auth_token():
    """Get admin authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "super@amino.com", "password": "peptides"}
    )
    if response.status_code != 200:
        pytest.skip("Could not authenticate - skipping authenticated tests")
    
    data = response.json()
    token = data.get("access_token") or data.get("token")
    if not token:
        pytest.skip("No token received - skipping authenticated tests")
    return token


@pytest.fixture
def cleanup_test_locations(auth_token):
    """Fixture to track and cleanup test-created locations"""
    location_ids = []
    yield location_ids
    
    # Cleanup after test
    for loc_id in location_ids:
        try:
            requests.delete(
                f"{BASE_URL}/api/admin-settings/local-pickup/locations/{loc_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
        except Exception:
            pass


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
