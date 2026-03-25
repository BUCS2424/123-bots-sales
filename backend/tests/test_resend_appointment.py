"""
Test suite for Resend Appointment Info feature
Tests the POST /api/leads/{lead_id}/appointments/resend endpoint
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "mel@a2gdesigns.com"
ADMIN_PASSWORD = "BigDaddy2016!!"


class TestResendAppointmentInfo:
    """Tests for the Resend Appointment Info endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.token = self._get_auth_token()
        if self.token:
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        self.created_lead_ids = []
        yield
        # Cleanup created leads
        for lead_id in self.created_lead_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/leads/{lead_id}")
            except:
                pass
    
    def _get_auth_token(self):
        """Get authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def _create_test_lead_with_appointment(self):
        """Create a test lead with an appointment for testing"""
        unique_id = str(uuid.uuid4())[:8]
        lead_data = {
            "name": f"TEST_Resend_{unique_id}",
            "email": f"test_resend_{unique_id}@example.com",
            "phone": "555-0123",
            "subject": "Test Resend Appointment",
            "message": "Testing resend appointment feature",
            "source": "test",
            "primary_contact_name": f"Test Contact {unique_id}",
            "primary_email": f"test_resend_{unique_id}@example.com",
            "opportunity_name": f"Test Opportunity {unique_id}",
            "appointments": [
                {
                    "id": f"appt-{unique_id}",
                    "date": "2026-02-15T10:00:00",
                    "title": "Test Meeting",
                    "location_type": "online",
                    "use_saysme": True,
                    "saysme_room_name": f"test-room-{unique_id}",
                    "saysme_meeting_url": f"https://meet.saysme.org/test-room-{unique_id}",
                    "notes": "Test appointment for resend"
                }
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/leads/", json=lead_data)
        if response.status_code == 200:
            lead_id = response.json().get("lead_id")
            self.created_lead_ids.append(lead_id)
            return lead_id, f"appt-{unique_id}"
        return None, None
    
    def test_resend_endpoint_exists(self):
        """Test that the resend endpoint exists and responds"""
        # Create a test lead with appointment
        lead_id, appt_id = self._create_test_lead_with_appointment()
        assert lead_id is not None, "Failed to create test lead"
        
        # Call resend endpoint
        response = self.session.post(
            f"{BASE_URL}/api/leads/{lead_id}/appointments/resend",
            json={"appointment_id": appt_id}
        )
        
        # Should return 200 (success) or 400/404 (valid error response)
        assert response.status_code in [200, 400, 404], f"Unexpected status: {response.status_code}"
        print(f"Resend endpoint response: {response.status_code} - {response.json()}")
    
    def test_resend_with_appointment_id(self):
        """Test resend using appointment_id"""
        lead_id, appt_id = self._create_test_lead_with_appointment()
        assert lead_id is not None, "Failed to create test lead"
        
        response = self.session.post(
            f"{BASE_URL}/api/leads/{lead_id}/appointments/resend",
            json={"appointment_id": appt_id}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "appointment_notifications_sent" in data
        print(f"Resend with appointment_id: {data}")
    
    def test_resend_with_appointment_index(self):
        """Test resend using appointment_index fallback"""
        lead_id, _ = self._create_test_lead_with_appointment()
        assert lead_id is not None, "Failed to create test lead"
        
        response = self.session.post(
            f"{BASE_URL}/api/leads/{lead_id}/appointments/resend",
            json={"appointment_index": 0}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "appointment_notifications_sent" in data
        print(f"Resend with appointment_index: {data}")
    
    def test_resend_with_both_id_and_index(self):
        """Test resend with both appointment_id and appointment_index (id takes priority)"""
        lead_id, appt_id = self._create_test_lead_with_appointment()
        assert lead_id is not None, "Failed to create test lead"
        
        response = self.session.post(
            f"{BASE_URL}/api/leads/{lead_id}/appointments/resend",
            json={
                "appointment_id": appt_id,
                "appointment_index": 0
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"Resend with both id and index: {data}")
    
    def test_resend_invalid_lead_id(self):
        """Test resend with non-existent lead ID"""
        response = self.session.post(
            f"{BASE_URL}/api/leads/non-existent-lead-id/appointments/resend",
            json={"appointment_index": 0}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"Invalid lead ID response: {response.json()}")
    
    def test_resend_invalid_appointment_id(self):
        """Test resend with non-existent appointment ID"""
        lead_id, _ = self._create_test_lead_with_appointment()
        assert lead_id is not None, "Failed to create test lead"
        
        response = self.session.post(
            f"{BASE_URL}/api/leads/{lead_id}/appointments/resend",
            json={"appointment_id": "non-existent-appointment-id"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"Invalid appointment ID response: {response.json()}")
    
    def test_resend_invalid_appointment_index(self):
        """Test resend with out-of-range appointment index"""
        lead_id, _ = self._create_test_lead_with_appointment()
        assert lead_id is not None, "Failed to create test lead"
        
        response = self.session.post(
            f"{BASE_URL}/api/leads/{lead_id}/appointments/resend",
            json={"appointment_index": 999}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"Invalid appointment index response: {response.json()}")
    
    def test_resend_no_appointments(self):
        """Test resend on lead with no appointments"""
        # Create lead without appointments
        unique_id = str(uuid.uuid4())[:8]
        lead_data = {
            "name": f"TEST_NoAppt_{unique_id}",
            "email": f"test_noappt_{unique_id}@example.com",
            "message": "Testing no appointments",
            "source": "test"
        }
        response = self.session.post(f"{BASE_URL}/api/leads/", json=lead_data)
        assert response.status_code == 200
        lead_id = response.json().get("lead_id")
        self.created_lead_ids.append(lead_id)
        
        # Try to resend
        response = self.session.post(
            f"{BASE_URL}/api/leads/{lead_id}/appointments/resend",
            json={"appointment_index": 0}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"No appointments response: {response.json()}")
    
    def test_resend_requires_auth(self):
        """Test that resend endpoint requires authentication"""
        lead_id, appt_id = self._create_test_lead_with_appointment()
        assert lead_id is not None, "Failed to create test lead"
        
        # Make request without auth header
        no_auth_session = requests.Session()
        no_auth_session.headers.update({"Content-Type": "application/json"})
        
        response = no_auth_session.post(
            f"{BASE_URL}/api/leads/{lead_id}/appointments/resend",
            json={"appointment_id": appt_id}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"No auth response: {response.json()}")


class TestExistingAppointmentBehavior:
    """Tests to ensure existing appointment add/save behavior remains intact"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.token = self._get_auth_token()
        if self.token:
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        self.created_lead_ids = []
        yield
        # Cleanup
        for lead_id in self.created_lead_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/leads/{lead_id}")
            except:
                pass
    
    def _get_auth_token(self):
        """Get authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def test_add_appointment_still_works(self):
        """Test that adding appointments via PUT still works"""
        # Create lead
        unique_id = str(uuid.uuid4())[:8]
        lead_data = {
            "name": f"TEST_AddAppt_{unique_id}",
            "email": f"test_addappt_{unique_id}@example.com",
            "message": "Testing add appointment",
            "source": "test"
        }
        response = self.session.post(f"{BASE_URL}/api/leads/", json=lead_data)
        assert response.status_code == 200
        lead_id = response.json().get("lead_id")
        self.created_lead_ids.append(lead_id)
        
        # Add appointment via PUT
        update_data = {
            "appointments": [
                {
                    "id": f"new-appt-{unique_id}",
                    "date": "2026-03-01T14:00:00",
                    "title": "New Appointment",
                    "location_type": "physical",
                    "physical_address": "123 Test St"
                }
            ]
        }
        response = self.session.put(f"{BASE_URL}/api/leads/{lead_id}", json=update_data)
        assert response.status_code == 200, f"PUT failed: {response.text}"
        
        # Verify appointment was saved
        response = self.session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert response.status_code == 200
        lead = response.json()
        assert len(lead.get("appointments", [])) == 1
        assert lead["appointments"][0]["title"] == "New Appointment"
        print(f"Add appointment test passed: {lead['appointments']}")
    
    def test_update_appointment_still_works(self):
        """Test that updating appointments via PUT still works"""
        # Create lead with appointment
        unique_id = str(uuid.uuid4())[:8]
        lead_data = {
            "name": f"TEST_UpdateAppt_{unique_id}",
            "email": f"test_updateappt_{unique_id}@example.com",
            "message": "Testing update appointment",
            "source": "test",
            "appointments": [
                {
                    "id": f"orig-appt-{unique_id}",
                    "date": "2026-03-01T14:00:00",
                    "title": "Original Title"
                }
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/leads/", json=lead_data)
        assert response.status_code == 200
        lead_id = response.json().get("lead_id")
        self.created_lead_ids.append(lead_id)
        
        # Update appointment
        update_data = {
            "appointments": [
                {
                    "id": f"orig-appt-{unique_id}",
                    "date": "2026-03-01T14:00:00",
                    "title": "Updated Title"
                }
            ]
        }
        response = self.session.put(f"{BASE_URL}/api/leads/{lead_id}", json=update_data)
        assert response.status_code == 200
        
        # Verify update
        response = self.session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert response.status_code == 200
        lead = response.json()
        assert lead["appointments"][0]["title"] == "Updated Title"
        print(f"Update appointment test passed")
    
    def test_delete_appointment_still_works(self):
        """Test that removing appointments via PUT still works"""
        # Create lead with appointment
        unique_id = str(uuid.uuid4())[:8]
        lead_data = {
            "name": f"TEST_DeleteAppt_{unique_id}",
            "email": f"test_deleteappt_{unique_id}@example.com",
            "message": "Testing delete appointment",
            "source": "test",
            "appointments": [
                {
                    "id": f"del-appt-{unique_id}",
                    "date": "2026-03-01T14:00:00",
                    "title": "To Be Deleted"
                }
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/leads/", json=lead_data)
        assert response.status_code == 200
        lead_id = response.json().get("lead_id")
        self.created_lead_ids.append(lead_id)
        
        # Remove appointment by sending empty array
        update_data = {"appointments": []}
        response = self.session.put(f"{BASE_URL}/api/leads/{lead_id}", json=update_data)
        assert response.status_code == 200
        
        # Verify deletion
        response = self.session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert response.status_code == 200
        lead = response.json()
        assert len(lead.get("appointments", [])) == 0
        print(f"Delete appointment test passed")


class TestNoRegressionOtherActions:
    """Tests to ensure Update/Delete/Convert actions still work"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.token = self._get_auth_token()
        if self.token:
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        self.created_lead_ids = []
        yield
        # Cleanup
        for lead_id in self.created_lead_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/leads/{lead_id}")
            except:
                pass
    
    def _get_auth_token(self):
        """Get authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def test_lead_update_still_works(self):
        """Test that general lead update still works"""
        unique_id = str(uuid.uuid4())[:8]
        lead_data = {
            "name": f"TEST_Update_{unique_id}",
            "email": f"test_update_{unique_id}@example.com",
            "message": "Testing update",
            "source": "test"
        }
        response = self.session.post(f"{BASE_URL}/api/leads/", json=lead_data)
        assert response.status_code == 200
        lead_id = response.json().get("lead_id")
        self.created_lead_ids.append(lead_id)
        
        # Update lead
        update_data = {
            "opportunity_name": "Updated Opportunity Name",
            "opportunity_value": 5000
        }
        response = self.session.put(f"{BASE_URL}/api/leads/{lead_id}", json=update_data)
        assert response.status_code == 200
        
        # Verify
        response = self.session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert response.status_code == 200
        lead = response.json()
        assert lead["opportunity_name"] == "Updated Opportunity Name"
        assert lead["opportunity_value"] == 5000
        print("Lead update test passed")
    
    def test_lead_delete_still_works(self):
        """Test that lead delete still works"""
        unique_id = str(uuid.uuid4())[:8]
        lead_data = {
            "name": f"TEST_Delete_{unique_id}",
            "email": f"test_delete_{unique_id}@example.com",
            "message": "Testing delete",
            "source": "test"
        }
        response = self.session.post(f"{BASE_URL}/api/leads/", json=lead_data)
        assert response.status_code == 200
        lead_id = response.json().get("lead_id")
        # Don't add to cleanup since we're deleting it
        
        # Delete lead
        response = self.session.delete(f"{BASE_URL}/api/leads/{lead_id}")
        assert response.status_code == 200
        
        # Verify deletion
        response = self.session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert response.status_code == 404
        print("Lead delete test passed")
    
    def test_lead_status_update_still_works(self):
        """Test that lead status update (drag/drop) still works"""
        unique_id = str(uuid.uuid4())[:8]
        lead_data = {
            "name": f"TEST_Status_{unique_id}",
            "email": f"test_status_{unique_id}@example.com",
            "message": "Testing status update",
            "source": "test"
        }
        response = self.session.post(f"{BASE_URL}/api/leads/", json=lead_data)
        assert response.status_code == 200
        lead_id = response.json().get("lead_id")
        self.created_lead_ids.append(lead_id)
        
        # Update status
        response = self.session.patch(
            f"{BASE_URL}/api/leads/{lead_id}/status",
            json={"status": "needs_order"}
        )
        assert response.status_code == 200
        
        # Verify
        response = self.session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert response.status_code == 200
        lead = response.json()
        assert lead["status"] == "needs_order"
        print("Lead status update test passed")
    
    def test_convert_to_client_still_works(self):
        """Test that convert to client still works"""
        unique_id = str(uuid.uuid4())[:8]
        lead_data = {
            "name": f"TEST_Convert_{unique_id}",
            "email": f"test_convert_{unique_id}@example.com",
            "message": "Testing convert",
            "source": "test",
            "primary_email": f"test_convert_{unique_id}@example.com",
            "primary_contact_name": f"Test Convert {unique_id}"
        }
        response = self.session.post(f"{BASE_URL}/api/leads/", json=lead_data)
        assert response.status_code == 200
        lead_id = response.json().get("lead_id")
        self.created_lead_ids.append(lead_id)
        
        # Convert to client
        response = self.session.post(f"{BASE_URL}/api/leads/{lead_id}/convert-to-client")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "user_id" in data
        assert "customer_id" in data
        print(f"Convert to client test passed: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
