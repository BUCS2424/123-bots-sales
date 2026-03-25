"""
Test suite for "Create an Opportunity" button feature
Tests: Create button exists, opens modal, creates new lead via POST /api/leads/,
       new lead appears in Opportunity column with status 'opportunity'
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "qa-admin-a2g@example.com"
ADMIN_PASSWORD = "TestPass123!"


@pytest.fixture(scope="module")
def auth_session():
    """Module-scoped fixture to get authenticated session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Login to get token
    login_response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if login_response.status_code == 200:
        token = login_response.json().get("access_token") or login_response.json().get("token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        print(f"Auth successful, token obtained")
        return session
    else:
        pytest.skip(f"Authentication failed: {login_response.status_code} - {login_response.text}")


class TestCreateOpportunityFeature:
    """Backend API tests for Create Opportunity button feature"""
    
    # ============ CREATE OPPORTUNITY VIA POST /api/leads/ ============
    
    def test_create_opportunity_with_required_fields(self, auth_session):
        """Test POST /api/leads/ creates opportunity with required fields (primary_contact_name, primary_email, opportunity_name)"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Minimal required fields for create mode
        create_data = {
            "name": f"TEST_Create Opp Contact {unique_id}",
            "email": f"test.create.opp.{unique_id}@example.com",
            "phone": "",
            "subject": f"TEST_Create Opportunity {unique_id}",
            "message": "Opportunity created from Opportunities board",
            "source": "admin_opportunities",
            "primary_contact_name": f"TEST_Create Opp Contact {unique_id}",
            "primary_email": f"test.create.opp.{unique_id}@example.com",
            "primary_phone": "",
            "additional_contacts": [],
            "opportunity_name": f"TEST_Create Opportunity {unique_id}",
            "pipeline": "001. Main Leads Pipeline",
            "stage": "1. New Inquiry",
            "opportunity_status": "Open",
            "opportunity_value": None,
            "owner_id": "",
            "followers": [],
            "business_name": "",
            "opportunity_source": "Manual Opportunity",
            "tags": [],
            "appointments": [],
            "tasks": [],
            "notes_timeline": [],
            "payments": [],
            "associated_objects": []
        }
        
        response = auth_session.post(f"{BASE_URL}/api/leads/", json=create_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        assert "lead_id" in data, "Expected lead_id in response"
        
        created_lead_id = data["lead_id"]
        print(f"SUCCESS: Created opportunity with ID: {created_lead_id}")
        
        # Verify lead was created with correct data
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{created_lead_id}")
        assert get_response.status_code == 200
        
        lead = get_response.json()
        assert lead["primary_contact_name"] == create_data["primary_contact_name"]
        assert lead["primary_email"] == create_data["primary_email"]
        assert lead["opportunity_name"] == create_data["opportunity_name"]
        assert lead["status"] == "opportunity", f"Expected status 'opportunity', got '{lead['status']}'"
        assert lead["stage"] == "1. New Inquiry", f"Expected stage '1. New Inquiry', got '{lead['stage']}'"
        print("SUCCESS: Opportunity data verified with required fields")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{created_lead_id}")
    
    def test_created_opportunity_appears_in_opportunity_column(self, auth_session):
        """Test that newly created opportunity appears in the 'opportunity' column of kanban"""
        unique_id = str(uuid.uuid4())[:8]
        
        create_data = {
            "name": f"TEST_Kanban Test {unique_id}",
            "email": f"test.kanban.{unique_id}@example.com",
            "message": "Testing kanban placement",
            "source": "admin_opportunities",
            "primary_contact_name": f"TEST_Kanban Contact {unique_id}",
            "primary_email": f"test.kanban.{unique_id}@example.com",
            "opportunity_name": f"TEST_Kanban Opportunity {unique_id}",
            "pipeline": "001. Main Leads Pipeline",
            "stage": "1. New Inquiry",
            "opportunity_status": "Open"
        }
        
        # Create the opportunity
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json=create_data)
        assert create_response.status_code == 200
        created_lead_id = create_response.json()["lead_id"]
        
        # Get kanban view
        kanban_response = auth_session.get(f"{BASE_URL}/api/leads/")
        assert kanban_response.status_code == 200
        
        kanban_data = kanban_response.json()
        opportunity_column = kanban_data.get("opportunity", [])
        
        # Find our created lead in the opportunity column
        found_lead = None
        for lead in opportunity_column:
            if lead.get("id") == created_lead_id:
                found_lead = lead
                break
        
        assert found_lead is not None, f"Created lead {created_lead_id} not found in opportunity column"
        assert found_lead["status"] == "opportunity"
        print(f"SUCCESS: Created opportunity found in 'opportunity' column")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{created_lead_id}")
    
    def test_create_opportunity_with_all_optional_fields(self, auth_session):
        """Test POST /api/leads/ with all optional fields populated"""
        unique_id = str(uuid.uuid4())[:8]
        
        create_data = {
            "name": f"TEST_Full Opp {unique_id}",
            "email": f"test.full.opp.{unique_id}@example.com",
            "phone": "555-123-4567",
            "subject": f"TEST_Full Opportunity {unique_id}",
            "message": "Full opportunity with all fields",
            "source": "admin_opportunities",
            "primary_contact_name": f"TEST_Full Contact {unique_id}",
            "primary_email": f"test.full.opp.{unique_id}@example.com",
            "primary_phone": "555-123-4567",
            "additional_contacts": ["extra1@example.com", "extra2@example.com"],
            "opportunity_name": f"TEST_Full Opportunity {unique_id}",
            "pipeline": "002. Enterprise Opportunities",
            "stage": "1. New Inquiry",
            "opportunity_status": "In Progress",
            "opportunity_value": 75000.00,
            "owner_id": "",
            "followers": [],
            "business_name": "Test Business LLC",
            "opportunity_source": "Referral",
            "tags": ["test", "full", "automated"],
            "appointments": [],
            "tasks": [],
            "notes_timeline": [],
            "payments": [],
            "associated_objects": []
        }
        
        response = auth_session.post(f"{BASE_URL}/api/leads/", json=create_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        created_lead_id = response.json()["lead_id"]
        
        # Verify all fields
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{created_lead_id}")
        lead = get_response.json()
        
        assert lead["opportunity_value"] == 75000.00
        assert lead["business_name"] == "Test Business LLC"
        assert lead["opportunity_source"] == "Referral"
        assert "test" in lead["tags"]
        assert len(lead["additional_contacts"]) == 2
        assert lead["status"] == "opportunity"
        print(f"SUCCESS: Full opportunity created with all optional fields")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{created_lead_id}")
    
    # ============ EDIT MODE STILL WORKS ============
    
    def test_edit_existing_opportunity_via_put(self, auth_session):
        """Test PUT /api/leads/{id} still works for editing existing opportunities"""
        unique_id = str(uuid.uuid4())[:8]
        
        # First create an opportunity
        create_data = {
            "name": f"TEST_Edit Test {unique_id}",
            "email": f"test.edit.{unique_id}@example.com",
            "message": "Test for edit mode",
            "primary_contact_name": f"TEST_Edit Contact {unique_id}",
            "primary_email": f"test.edit.{unique_id}@example.com",
            "opportunity_name": f"TEST_Edit Opportunity {unique_id}",
            "stage": "1. New Inquiry"
        }
        
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json=create_data)
        assert create_response.status_code == 200
        lead_id = create_response.json()["lead_id"]
        
        # Now update via PUT (edit mode)
        update_data = {
            "opportunity_name": f"TEST_Updated Opportunity {unique_id}",
            "stage": "3. Contacted Lead",
            "opportunity_status": "In Progress",
            "opportunity_value": 50000.00,
            "notes": "Updated via edit mode"
        }
        
        update_response = auth_session.put(f"{BASE_URL}/api/leads/{lead_id}", json=update_data)
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
        
        # Verify update
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        
        assert lead["opportunity_name"] == update_data["opportunity_name"]
        assert lead["stage"] == update_data["stage"]
        assert lead["opportunity_status"] == update_data["opportunity_status"]
        assert lead["opportunity_value"] == update_data["opportunity_value"]
        assert lead["notes"] == update_data["notes"]
        print(f"SUCCESS: Edit mode (PUT) works correctly")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    # ============ DRAG-DROP STILL WORKS ============
    
    def test_drag_drop_status_update_still_works(self, auth_session):
        """Test PATCH /api/leads/{id}/status still works for drag-drop"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create opportunity
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"TEST_DragDrop {unique_id}",
            "email": f"test.dragdrop.{unique_id}@example.com",
            "message": "Test for drag-drop",
            "primary_contact_name": f"TEST_DragDrop Contact {unique_id}",
            "primary_email": f"test.dragdrop.{unique_id}@example.com",
            "opportunity_name": f"TEST_DragDrop Opportunity {unique_id}"
        })
        lead_id = create_response.json()["lead_id"]
        
        # Verify starts in opportunity column
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert get_response.json()["status"] == "opportunity"
        
        # Drag to needs_order
        status_response = auth_session.patch(f"{BASE_URL}/api/leads/{lead_id}/status", json={"status": "needs_order"})
        assert status_response.status_code == 200
        
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert get_response.json()["status"] == "needs_order"
        print("SUCCESS: Drag to needs_order works")
        
        # Drag to needs_support
        status_response = auth_session.patch(f"{BASE_URL}/api/leads/{lead_id}/status", json={"status": "needs_support"})
        assert status_response.status_code == 200
        
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert get_response.json()["status"] == "needs_support"
        print("SUCCESS: Drag to needs_support works")
        
        # Drag to miscellaneous
        status_response = auth_session.patch(f"{BASE_URL}/api/leads/{lead_id}/status", json={"status": "miscellaneous"})
        assert status_response.status_code == 200
        
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert get_response.json()["status"] == "miscellaneous"
        print("SUCCESS: Drag to miscellaneous works")
        
        # Drag back to opportunity
        status_response = auth_session.patch(f"{BASE_URL}/api/leads/{lead_id}/status", json={"status": "opportunity"})
        assert status_response.status_code == 200
        
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert get_response.json()["status"] == "opportunity"
        print("SUCCESS: Drag back to opportunity works")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    # ============ DELETE STILL WORKS ============
    
    def test_delete_opportunity_still_works(self, auth_session):
        """Test DELETE /api/leads/{id} still works"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create opportunity
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"TEST_Delete {unique_id}",
            "email": f"test.delete.{unique_id}@example.com",
            "message": "Test for delete",
            "primary_contact_name": f"TEST_Delete Contact {unique_id}",
            "primary_email": f"test.delete.{unique_id}@example.com",
            "opportunity_name": f"TEST_Delete Opportunity {unique_id}"
        })
        lead_id = create_response.json()["lead_id"]
        
        # Delete
        delete_response = auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert get_response.status_code == 404
        print("SUCCESS: Delete opportunity works")
    
    # ============ CONVERT TO CLIENT STILL WORKS ============
    
    def test_convert_to_client_still_works(self, auth_session):
        """Test POST /api/leads/{id}/convert-to-client still works"""
        unique_id = str(uuid.uuid4())[:8]
        test_email = f"test.convert.{unique_id}@example.com"
        
        # Create opportunity
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"TEST_Convert {unique_id}",
            "email": test_email,
            "phone": "555-CONVERT",
            "message": "Test for convert",
            "primary_contact_name": f"TEST_Convert Contact {unique_id}",
            "primary_email": test_email,
            "primary_phone": "555-CONVERT",
            "opportunity_name": f"TEST_Convert Opportunity {unique_id}",
            "opportunity_value": 25000.00
        })
        lead_id = create_response.json()["lead_id"]
        
        # Convert to client
        convert_response = auth_session.post(f"{BASE_URL}/api/leads/{lead_id}/convert-to-client")
        assert convert_response.status_code == 200, f"Expected 200, got {convert_response.status_code}: {convert_response.text}"
        
        data = convert_response.json()
        assert data.get("success") == True
        assert "user_id" in data
        assert "customer_id" in data
        print(f"SUCCESS: Convert to client works. User ID: {data['user_id']}")
        
        # Verify lead is marked as converted
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        assert lead.get("converted_to_client") == True
        print("SUCCESS: Lead marked as converted")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
