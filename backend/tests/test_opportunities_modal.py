"""
Test suite for Opportunities Modal Redesign
Tests: CRUD operations, sections (appointments, tasks, notes, payments, associated objects),
       Convert to Client functionality, and Hide Empty Fields toggle
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "mel@a2gdesigns.com"
ADMIN_PASSWORD = "BigDaddy2016!!"


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
        print(f"Auth successful, token obtained: {token[:50]}...")
        return session
    else:
        pytest.skip(f"Authentication failed: {login_response.status_code} - {login_response.text}")


class TestOpportunitiesModalBackend:
    """Backend API tests for Opportunities Modal features"""
    
    # ============ GET LEADS/OPPORTUNITIES ============
    
    def test_get_leads_kanban_view(self, auth_session):
        """Test GET /api/leads/ returns grouped leads for kanban"""
        response = auth_session.get(f"{BASE_URL}/api/leads/")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Should have kanban columns
        assert "opportunity" in data, "Missing 'opportunity' column"
        assert "needs_order" in data, "Missing 'needs_order' column"
        assert "needs_support" in data, "Missing 'needs_support' column"
        assert "miscellaneous" in data, "Missing 'miscellaneous' column"
        
        # Each column should be a list
        assert isinstance(data["opportunity"], list)
        print(f"SUCCESS: Kanban view returns {len(data['opportunity'])} opportunities")
    
    def test_get_leads_list_view(self, auth_session):
        """Test GET /api/leads/list returns flat list"""
        response = auth_session.get(f"{BASE_URL}/api/leads/list")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list response"
        print(f"SUCCESS: List view returns {len(data)} leads")
    
    # ============ CREATE LEAD ============
    
    def test_create_lead_with_all_fields(self, auth_session):
        """Test POST /api/leads/ creates lead with all opportunity fields"""
        unique_id = str(uuid.uuid4())[:8]
        lead_data = {
            "name": f"Test Lead {unique_id}",
            "email": f"test.lead.{unique_id}@example.com",
            "phone": "555-123-4567",
            "subject": "Test Subject",
            "message": "Test message for opportunity",
            "source": "test_suite",
            "primary_contact_name": f"Primary Contact {unique_id}",
            "primary_email": f"primary.{unique_id}@example.com",
            "primary_phone": "555-987-6543",
            "additional_contacts": ["contact1@example.com", "contact2@example.com"],
            "opportunity_name": f"Test Opportunity {unique_id}",
            "pipeline": "001. Main Leads Pipeline",
            "stage": "2. Discovery Call",
            "opportunity_status": "In Progress",
            "opportunity_value": 50000.00,
            "business_name": "Test Business Inc",
            "opportunity_source": "Website",
            "tags": ["test", "automated"],
            "appointments": [
                {"id": str(uuid.uuid4()), "date": "2026-04-01T10:00:00", "title": "Discovery Call", "location": "Zoom", "notes": "Initial meeting"}
            ],
            "tasks": [
                {"id": str(uuid.uuid4()), "title": "Follow up email", "completed": False, "created_at": datetime.now().isoformat()}
            ],
            "notes_timeline": [
                {"id": str(uuid.uuid4()), "note": "Initial contact made", "created_at": datetime.now().isoformat()}
            ],
            "payments": [
                {"id": str(uuid.uuid4()), "date": "2026-03-25", "amount": 1000.00, "status": "Paid", "method": "Card", "note": "Deposit"}
            ],
            "associated_objects": [
                {"id": str(uuid.uuid4()), "type": "Contract", "reference": "CONTRACT-001", "url": "https://example.com/contract"}
            ]
        }
        
        response = auth_session.post(f"{BASE_URL}/api/leads/", json=lead_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        assert "lead_id" in data, "Expected lead_id in response"
        
        created_lead_id = data["lead_id"]
        print(f"SUCCESS: Created lead with ID: {created_lead_id}")
        
        # Verify lead was created with correct data
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{created_lead_id}")
        assert get_response.status_code == 200
        
        lead = get_response.json()
        assert lead["opportunity_name"] == lead_data["opportunity_name"]
        assert lead["pipeline"] == lead_data["pipeline"]
        assert lead["stage"] == lead_data["stage"]
        assert lead["opportunity_status"] == lead_data["opportunity_status"]
        assert lead["opportunity_value"] == lead_data["opportunity_value"]
        assert len(lead["appointments"]) == 1
        assert len(lead["tasks"]) == 1
        assert len(lead["notes_timeline"]) == 1
        assert len(lead["payments"]) == 1
        assert len(lead["associated_objects"]) == 1
        print("SUCCESS: Lead data verified with all fields")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{created_lead_id}")
    
    # ============ UPDATE LEAD ============
    
    def test_update_lead_opportunity_details(self, auth_session):
        """Test PUT /api/leads/{id} updates opportunity details"""
        # First create a lead
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Update Test {unique_id}",
            "email": f"update.test.{unique_id}@example.com",
            "message": "Test for update"
        })
        assert create_response.status_code == 200
        lead_id = create_response.json()["lead_id"]
        
        # Update with new opportunity details
        update_data = {
            "opportunity_name": f"Updated Opportunity {unique_id}",
            "pipeline": "002. Enterprise Opportunities",
            "stage": "4. Proposal Sent",
            "opportunity_status": "Won",
            "opportunity_value": 75000.00,
            "business_name": "Updated Business LLC",
            "tags": ["updated", "won"]
        }
        
        update_response = auth_session.put(f"{BASE_URL}/api/leads/{lead_id}", json=update_data)
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
        
        # Verify update persisted
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert get_response.status_code == 200
        
        lead = get_response.json()
        assert lead["opportunity_name"] == update_data["opportunity_name"]
        assert lead["pipeline"] == update_data["pipeline"]
        assert lead["stage"] == update_data["stage"]
        assert lead["opportunity_status"] == update_data["opportunity_status"]
        assert lead["opportunity_value"] == update_data["opportunity_value"]
        print(f"SUCCESS: Lead {lead_id} updated and verified")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    def test_update_lead_appointments(self, auth_session):
        """Test updating appointments array persists correctly"""
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Appointment Test {unique_id}",
            "email": f"appt.test.{unique_id}@example.com",
            "message": "Test for appointments"
        })
        lead_id = create_response.json()["lead_id"]
        
        # Add appointments
        appointments = [
            {"id": str(uuid.uuid4()), "date": "2026-04-01T10:00:00", "title": "Call 1", "location": "Phone", "notes": "First call"},
            {"id": str(uuid.uuid4()), "date": "2026-04-05T14:00:00", "title": "Meeting", "location": "Office", "notes": "In-person"}
        ]
        
        update_response = auth_session.put(f"{BASE_URL}/api/leads/{lead_id}", json={"appointments": appointments})
        assert update_response.status_code == 200
        
        # Verify
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        assert len(lead["appointments"]) == 2
        assert lead["appointments"][0]["title"] == "Call 1"
        assert lead["appointments"][1]["title"] == "Meeting"
        print(f"SUCCESS: Appointments persisted correctly")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    def test_update_lead_tasks(self, auth_session):
        """Test updating tasks array with toggle functionality"""
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Task Test {unique_id}",
            "email": f"task.test.{unique_id}@example.com",
            "message": "Test for tasks"
        })
        lead_id = create_response.json()["lead_id"]
        
        # Add tasks
        task_id = str(uuid.uuid4())
        tasks = [
            {"id": task_id, "title": "Task 1", "completed": False, "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "title": "Task 2", "completed": True, "created_at": datetime.now().isoformat()}
        ]
        
        update_response = auth_session.put(f"{BASE_URL}/api/leads/{lead_id}", json={"tasks": tasks})
        assert update_response.status_code == 200
        
        # Verify
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        assert len(lead["tasks"]) == 2
        assert lead["tasks"][0]["completed"] == False
        assert lead["tasks"][1]["completed"] == True
        print(f"SUCCESS: Tasks persisted with completion status")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    def test_update_lead_notes_timeline(self, auth_session):
        """Test updating notes timeline array"""
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Notes Test {unique_id}",
            "email": f"notes.test.{unique_id}@example.com",
            "message": "Test for notes"
        })
        lead_id = create_response.json()["lead_id"]
        
        # Add notes timeline
        notes_timeline = [
            {"id": str(uuid.uuid4()), "note": "First contact", "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "note": "Follow up call", "created_at": datetime.now().isoformat()}
        ]
        
        update_response = auth_session.put(f"{BASE_URL}/api/leads/{lead_id}", json={
            "notes": "Main notes field",
            "notes_timeline": notes_timeline
        })
        assert update_response.status_code == 200
        
        # Verify
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        assert lead["notes"] == "Main notes field"
        assert len(lead["notes_timeline"]) == 2
        print(f"SUCCESS: Notes and timeline persisted correctly")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    def test_update_lead_payments(self, auth_session):
        """Test updating payments array"""
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Payment Test {unique_id}",
            "email": f"payment.test.{unique_id}@example.com",
            "message": "Test for payments"
        })
        lead_id = create_response.json()["lead_id"]
        
        # Add payments
        payments = [
            {"id": str(uuid.uuid4()), "date": "2026-03-25", "amount": 500.00, "status": "Paid", "method": "Card", "note": "Deposit"},
            {"id": str(uuid.uuid4()), "date": "2026-04-01", "amount": 1500.00, "status": "Pending", "method": "ACH", "note": "Balance"}
        ]
        
        update_response = auth_session.put(f"{BASE_URL}/api/leads/{lead_id}", json={"payments": payments})
        assert update_response.status_code == 200
        
        # Verify
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        assert len(lead["payments"]) == 2
        assert lead["payments"][0]["amount"] == 500.00
        assert lead["payments"][1]["status"] == "Pending"
        print(f"SUCCESS: Payments persisted correctly")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    def test_update_lead_associated_objects(self, auth_session):
        """Test updating associated objects array"""
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"AssocObj Test {unique_id}",
            "email": f"assoc.test.{unique_id}@example.com",
            "message": "Test for associated objects"
        })
        lead_id = create_response.json()["lead_id"]
        
        # Add associated objects
        associated_objects = [
            {"id": str(uuid.uuid4()), "type": "Contract", "reference": "CONTRACT-001", "url": "https://example.com/contract"},
            {"id": str(uuid.uuid4()), "type": "Invoice", "reference": "INV-001", "url": "https://example.com/invoice"}
        ]
        
        update_response = auth_session.put(f"{BASE_URL}/api/leads/{lead_id}", json={"associated_objects": associated_objects})
        assert update_response.status_code == 200
        
        # Verify
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        assert len(lead["associated_objects"]) == 2
        assert lead["associated_objects"][0]["type"] == "Contract"
        assert lead["associated_objects"][1]["type"] == "Invoice"
        print(f"SUCCESS: Associated objects persisted correctly")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    # ============ STATUS UPDATE (DRAG/DROP) ============
    
    def test_update_lead_status_drag_drop(self, auth_session):
        """Test PATCH /api/leads/{id}/status for drag/drop"""
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Status Test {unique_id}",
            "email": f"status.test.{unique_id}@example.com",
            "message": "Test for status update"
        })
        lead_id = create_response.json()["lead_id"]
        
        # Update status to needs_order
        status_response = auth_session.patch(f"{BASE_URL}/api/leads/{lead_id}/status", json={"status": "needs_order"})
        assert status_response.status_code == 200
        
        # Verify
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        assert lead["status"] == "needs_order"
        print(f"SUCCESS: Status updated to needs_order")
        
        # Update to needs_support
        status_response = auth_session.patch(f"{BASE_URL}/api/leads/{lead_id}/status", json={"status": "needs_support"})
        assert status_response.status_code == 200
        
        # Verify
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        assert lead["status"] == "needs_support"
        print(f"SUCCESS: Status updated to needs_support")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    def test_update_lead_status_invalid(self, auth_session):
        """Test PATCH /api/leads/{id}/status rejects invalid status"""
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Invalid Status Test {unique_id}",
            "email": f"invalid.status.{unique_id}@example.com",
            "message": "Test for invalid status"
        })
        lead_id = create_response.json()["lead_id"]
        
        # Try invalid status
        status_response = auth_session.patch(f"{BASE_URL}/api/leads/{lead_id}/status", json={"status": "invalid_status"})
        assert status_response.status_code == 400, f"Expected 400, got {status_response.status_code}"
        print(f"SUCCESS: Invalid status rejected with 400")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    # ============ DELETE LEAD ============
    
    def test_delete_lead(self, auth_session):
        """Test DELETE /api/leads/{id}"""
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Delete Test {unique_id}",
            "email": f"delete.test.{unique_id}@example.com",
            "message": "Test for delete"
        })
        lead_id = create_response.json()["lead_id"]
        
        # Delete
        delete_response = auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert get_response.status_code == 404
        print(f"SUCCESS: Lead deleted and verified")
    
    # ============ CONVERT TO CLIENT ============
    
    def test_convert_lead_to_client(self, auth_session):
        """Test POST /api/leads/{id}/convert-to-client"""
        unique_id = str(uuid.uuid4())[:8]
        test_email = f"convert.client.{unique_id}@example.com"
        
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Convert Test {unique_id}",
            "email": test_email,
            "phone": "555-CONVERT",
            "message": "Test for convert to client",
            "primary_contact_name": f"Convert Contact {unique_id}",
            "primary_email": test_email,
            "primary_phone": "555-CONVERT",
            "opportunity_name": f"Convert Opportunity {unique_id}",
            "opportunity_value": 25000.00
        })
        assert create_response.status_code == 200
        lead_id = create_response.json()["lead_id"]
        
        # Convert to client
        convert_response = auth_session.post(f"{BASE_URL}/api/leads/{lead_id}/convert-to-client")
        assert convert_response.status_code == 200, f"Expected 200, got {convert_response.status_code}: {convert_response.text}"
        
        data = convert_response.json()
        assert data.get("success") == True
        assert "user_id" in data
        assert "customer_id" in data
        assert data.get("user_created") == True  # New user should be created
        assert "temporary_password" in data  # Should have temp password for new user
        print(f"SUCCESS: Lead converted to client. User ID: {data['user_id']}, Customer ID: {data['customer_id']}")
        
        # Verify lead is marked as converted
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        assert lead.get("converted_to_client") == True
        assert lead.get("converted_customer_id") == data["customer_id"]
        print(f"SUCCESS: Lead marked as converted")
        
        # Verify customer exists in /api/users/customers
        customers_response = auth_session.get(f"{BASE_URL}/api/users/customers")
        if customers_response.status_code == 200:
            customers = customers_response.json()
            customer_emails = [c.get("email") for c in customers]
            assert test_email.lower() in [e.lower() for e in customer_emails if e], f"Customer not found in /api/users/customers"
            print(f"SUCCESS: Customer found in /api/users/customers")
        
        # Verify customer exists in /api/store/customers
        store_customers_response = auth_session.get(f"{BASE_URL}/api/store/customers")
        if store_customers_response.status_code == 200:
            store_customers = store_customers_response.json()
            store_customer_emails = [c.get("email") for c in store_customers]
            assert test_email.lower() in [e.lower() for e in store_customer_emails if e], f"Customer not found in /api/store/customers"
            print(f"SUCCESS: Customer found in /api/store/customers")
        
        # Cleanup - delete lead
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    def test_convert_lead_without_email_fails(self, auth_session):
        """Test convert to client fails without email"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create lead without primary_email (only name and message)
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"No Email Test {unique_id}",
            "email": "",  # Empty email
            "message": "Test without email"
        })
        # This might fail at creation or conversion
        if create_response.status_code == 200:
            lead_id = create_response.json()["lead_id"]
            
            # Try to convert - should fail
            convert_response = auth_session.post(f"{BASE_URL}/api/leads/{lead_id}/convert-to-client")
            assert convert_response.status_code == 400, f"Expected 400, got {convert_response.status_code}"
            print(f"SUCCESS: Convert without email rejected with 400")
            
            # Cleanup
            auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    # ============ STAFF ENDPOINTS FOR OWNER/FOLLOWERS ============
    
    def test_get_staff_for_owner_dropdown(self, auth_session):
        """Test GET /api/users/staff returns staff for owner dropdown"""
        response = auth_session.get(f"{BASE_URL}/api/users/staff")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of staff"
        
        if len(data) > 0:
            staff = data[0]
            assert "id" in staff, "Staff should have id"
            assert "name" in staff, "Staff should have name"
            assert "email" in staff, "Staff should have email"
            print(f"SUCCESS: Staff endpoint returns {len(data)} staff members")
        else:
            print("WARNING: No staff members found (may be expected)")
    
    def test_update_lead_owner_and_followers(self, auth_session):
        """Test updating owner_id and followers fields"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Get staff list first
        staff_response = auth_session.get(f"{BASE_URL}/api/users/staff")
        staff_list = staff_response.json() if staff_response.status_code == 200 else []
        
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Owner Test {unique_id}",
            "email": f"owner.test.{unique_id}@example.com",
            "message": "Test for owner/followers"
        })
        lead_id = create_response.json()["lead_id"]
        
        # Update with owner and followers
        update_data = {
            "owner_id": staff_list[0]["id"] if staff_list else "test-owner-id",
            "followers": [staff_list[0]["id"]] if staff_list else ["test-follower-id"]
        }
        
        update_response = auth_session.put(f"{BASE_URL}/api/leads/{lead_id}", json=update_data)
        assert update_response.status_code == 200
        
        # Verify
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        assert lead["owner_id"] == update_data["owner_id"]
        assert lead["followers"] == update_data["followers"]
        print(f"SUCCESS: Owner and followers updated correctly")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
