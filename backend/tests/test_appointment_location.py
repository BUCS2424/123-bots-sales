"""
Test suite for Appointment Location Dropdown Logic
Tests: Physical location with address field, Online meeting with SaySMe checkbox + secure room,
       Other meeting URL option, appointment_notifications_sent field in PUT response
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


class TestAppointmentLocationBackend:
    """Backend API tests for Appointment Location features"""
    
    # ============ PHYSICAL LOCATION APPOINTMENT ============
    
    def test_create_appointment_with_physical_location(self, auth_session):
        """Test creating appointment with physical location type and address"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create lead first
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Physical Location Test {unique_id}",
            "email": f"physical.test.{unique_id}@example.com",
            "message": "Test for physical location appointment"
        })
        assert create_response.status_code == 200, f"Failed to create lead: {create_response.text}"
        lead_id = create_response.json()["lead_id"]
        
        # Add appointment with physical location
        appointment = {
            "id": str(uuid.uuid4()),
            "date": "2026-04-01T10:00:00",
            "title": "In-Person Meeting",
            "location": "123 Main St, Suite 100, New York, NY 10001",
            "notes": "Bring documents",
            "location_type": "physical",
            "physical_address": "123 Main St, Suite 100, New York, NY 10001",
            "use_saysme": False,
            "saysme_room_name": "",
            "saysme_meeting_url": "",
            "use_other_meeting": False,
            "other_meeting_url": ""
        }
        
        update_response = auth_session.put(f"{BASE_URL}/api/leads/{lead_id}", json={
            "appointments": [appointment]
        })
        assert update_response.status_code == 200, f"Failed to update lead: {update_response.text}"
        
        # Check response includes appointment_notifications_sent field
        update_data = update_response.json()
        assert "appointment_notifications_sent" in update_data, "Missing appointment_notifications_sent in response"
        print(f"SUCCESS: appointment_notifications_sent = {update_data['appointment_notifications_sent']}")
        
        # Verify appointment persisted correctly
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert get_response.status_code == 200
        
        lead = get_response.json()
        assert len(lead["appointments"]) == 1
        saved_appt = lead["appointments"][0]
        assert saved_appt["location_type"] == "physical"
        assert saved_appt["physical_address"] == "123 Main St, Suite 100, New York, NY 10001"
        assert saved_appt["use_saysme"] == False
        assert saved_appt["saysme_meeting_url"] == ""
        print(f"SUCCESS: Physical location appointment persisted correctly")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    # ============ ONLINE MEETING WITH SAYSME ============
    
    def test_create_appointment_with_saysme_meeting(self, auth_session):
        """Test creating appointment with SaySMe online meeting"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create lead first
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"SaySMe Test {unique_id}",
            "email": f"saysme.test.{unique_id}@example.com",
            "message": "Test for SaySMe meeting"
        })
        assert create_response.status_code == 200
        lead_id = create_response.json()["lead_id"]
        
        # Add appointment with SaySMe meeting
        room_name = f"test-meeting-{unique_id}"
        appointment = {
            "id": str(uuid.uuid4()),
            "date": "2026-04-02T14:00:00",
            "title": "Online Discovery Call",
            "location": f"https://meet.saysme.org/{room_name}",
            "notes": "Video call",
            "location_type": "online",
            "physical_address": "",
            "use_saysme": True,
            "saysme_room_name": room_name,
            "saysme_meeting_url": f"https://meet.saysme.org/{room_name}",
            "use_other_meeting": False,
            "other_meeting_url": ""
        }
        
        update_response = auth_session.put(f"{BASE_URL}/api/leads/{lead_id}", json={
            "appointments": [appointment]
        })
        assert update_response.status_code == 200
        
        # Check appointment_notifications_sent field
        update_data = update_response.json()
        assert "appointment_notifications_sent" in update_data
        print(f"SUCCESS: appointment_notifications_sent = {update_data['appointment_notifications_sent']}")
        
        # Verify appointment persisted correctly
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        
        assert len(lead["appointments"]) == 1
        saved_appt = lead["appointments"][0]
        assert saved_appt["location_type"] == "online"
        assert saved_appt["use_saysme"] == True
        assert saved_appt["saysme_room_name"] == room_name
        assert saved_appt["saysme_meeting_url"] == f"https://meet.saysme.org/{room_name}"
        assert saved_appt["physical_address"] == ""
        print(f"SUCCESS: SaySMe meeting appointment persisted correctly")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    # ============ ONLINE MEETING WITH OTHER URL ============
    
    def test_create_appointment_with_other_meeting_url(self, auth_session):
        """Test creating appointment with custom/other meeting URL"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create lead first
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Other Meeting Test {unique_id}",
            "email": f"other.meeting.{unique_id}@example.com",
            "message": "Test for other meeting URL"
        })
        assert create_response.status_code == 200
        lead_id = create_response.json()["lead_id"]
        
        # Add appointment with other meeting URL
        other_url = "https://zoom.us/j/1234567890"
        appointment = {
            "id": str(uuid.uuid4()),
            "date": "2026-04-03T09:00:00",
            "title": "Zoom Call",
            "location": other_url,
            "notes": "Use Zoom link",
            "location_type": "online",
            "physical_address": "",
            "use_saysme": False,
            "saysme_room_name": "",
            "saysme_meeting_url": "",
            "use_other_meeting": True,
            "other_meeting_url": other_url
        }
        
        update_response = auth_session.put(f"{BASE_URL}/api/leads/{lead_id}", json={
            "appointments": [appointment]
        })
        assert update_response.status_code == 200
        
        # Check appointment_notifications_sent field
        update_data = update_response.json()
        assert "appointment_notifications_sent" in update_data
        print(f"SUCCESS: appointment_notifications_sent = {update_data['appointment_notifications_sent']}")
        
        # Verify appointment persisted correctly
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        
        assert len(lead["appointments"]) == 1
        saved_appt = lead["appointments"][0]
        assert saved_appt["location_type"] == "online"
        assert saved_appt["use_saysme"] == False
        assert saved_appt["use_other_meeting"] == True
        assert saved_appt["other_meeting_url"] == other_url
        print(f"SUCCESS: Other meeting URL appointment persisted correctly")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    # ============ COMBINED SAYSME + OTHER MEETING ============
    
    def test_create_appointment_with_both_saysme_and_other(self, auth_session):
        """Test creating appointment with both SaySMe and other meeting URL"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create lead first
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Combined Meeting Test {unique_id}",
            "email": f"combined.meeting.{unique_id}@example.com",
            "message": "Test for combined meeting options"
        })
        assert create_response.status_code == 200
        lead_id = create_response.json()["lead_id"]
        
        # Add appointment with both SaySMe and other meeting URL
        room_name = f"combined-{unique_id}"
        other_url = "https://teams.microsoft.com/l/meetup-join/abc123"
        appointment = {
            "id": str(uuid.uuid4()),
            "date": "2026-04-04T11:00:00",
            "title": "Multi-Platform Meeting",
            "location": f"https://meet.saysme.org/{room_name} | {other_url}",
            "notes": "Multiple options available",
            "location_type": "online",
            "physical_address": "",
            "use_saysme": True,
            "saysme_room_name": room_name,
            "saysme_meeting_url": f"https://meet.saysme.org/{room_name}",
            "use_other_meeting": True,
            "other_meeting_url": other_url
        }
        
        update_response = auth_session.put(f"{BASE_URL}/api/leads/{lead_id}", json={
            "appointments": [appointment]
        })
        assert update_response.status_code == 200
        
        # Verify appointment persisted correctly
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        
        assert len(lead["appointments"]) == 1
        saved_appt = lead["appointments"][0]
        assert saved_appt["location_type"] == "online"
        assert saved_appt["use_saysme"] == True
        assert saved_appt["saysme_meeting_url"] == f"https://meet.saysme.org/{room_name}"
        assert saved_appt["use_other_meeting"] == True
        assert saved_appt["other_meeting_url"] == other_url
        print(f"SUCCESS: Combined SaySMe + Other meeting appointment persisted correctly")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    # ============ MULTIPLE APPOINTMENTS ============
    
    def test_multiple_appointments_different_types(self, auth_session):
        """Test creating multiple appointments with different location types"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create lead first
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Multi Appointment Test {unique_id}",
            "email": f"multi.appt.{unique_id}@example.com",
            "message": "Test for multiple appointments"
        })
        assert create_response.status_code == 200
        lead_id = create_response.json()["lead_id"]
        
        # Add multiple appointments with different types
        appointments = [
            {
                "id": str(uuid.uuid4()),
                "date": "2026-04-05T10:00:00",
                "title": "Office Visit",
                "location": "456 Business Ave",
                "notes": "",
                "location_type": "physical",
                "physical_address": "456 Business Ave, Chicago, IL 60601",
                "use_saysme": False,
                "saysme_room_name": "",
                "saysme_meeting_url": "",
                "use_other_meeting": False,
                "other_meeting_url": ""
            },
            {
                "id": str(uuid.uuid4()),
                "date": "2026-04-06T14:00:00",
                "title": "SaySMe Follow-up",
                "location": f"https://meet.saysme.org/followup-{unique_id}",
                "notes": "",
                "location_type": "online",
                "physical_address": "",
                "use_saysme": True,
                "saysme_room_name": f"followup-{unique_id}",
                "saysme_meeting_url": f"https://meet.saysme.org/followup-{unique_id}",
                "use_other_meeting": False,
                "other_meeting_url": ""
            },
            {
                "id": str(uuid.uuid4()),
                "date": "2026-04-07T09:00:00",
                "title": "Google Meet",
                "location": "https://meet.google.com/abc-defg-hij",
                "notes": "",
                "location_type": "online",
                "physical_address": "",
                "use_saysme": False,
                "saysme_room_name": "",
                "saysme_meeting_url": "",
                "use_other_meeting": True,
                "other_meeting_url": "https://meet.google.com/abc-defg-hij"
            }
        ]
        
        update_response = auth_session.put(f"{BASE_URL}/api/leads/{lead_id}", json={
            "appointments": appointments
        })
        assert update_response.status_code == 200
        
        # Verify all appointments persisted correctly
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        
        assert len(lead["appointments"]) == 3
        
        # Check physical appointment
        physical_appt = lead["appointments"][0]
        assert physical_appt["location_type"] == "physical"
        assert physical_appt["physical_address"] == "456 Business Ave, Chicago, IL 60601"
        
        # Check SaySMe appointment
        saysme_appt = lead["appointments"][1]
        assert saysme_appt["location_type"] == "online"
        assert saysme_appt["use_saysme"] == True
        
        # Check other meeting appointment
        other_appt = lead["appointments"][2]
        assert other_appt["location_type"] == "online"
        assert other_appt["use_other_meeting"] == True
        
        print(f"SUCCESS: Multiple appointments with different types persisted correctly")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    # ============ APPOINTMENT NOTIFICATIONS SENT FIELD ============
    
    def test_appointment_notifications_sent_in_response(self, auth_session):
        """Test that PUT response includes appointment_notifications_sent field"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create lead first
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Notification Test {unique_id}",
            "email": f"notification.test.{unique_id}@example.com",
            "message": "Test for notification field"
        })
        assert create_response.status_code == 200
        lead_id = create_response.json()["lead_id"]
        
        # Add appointment
        appointment = {
            "id": str(uuid.uuid4()),
            "date": "2026-04-08T10:00:00",
            "title": "Notification Test Meeting",
            "location": "Test Location",
            "notes": "",
            "location_type": "physical",
            "physical_address": "Test Address",
            "use_saysme": False,
            "saysme_room_name": "",
            "saysme_meeting_url": "",
            "use_other_meeting": False,
            "other_meeting_url": ""
        }
        
        update_response = auth_session.put(f"{BASE_URL}/api/leads/{lead_id}", json={
            "appointments": [appointment]
        })
        assert update_response.status_code == 200
        
        update_data = update_response.json()
        
        # Verify appointment_notifications_sent field exists
        assert "appointment_notifications_sent" in update_data, "Missing appointment_notifications_sent field"
        assert isinstance(update_data["appointment_notifications_sent"], int), "appointment_notifications_sent should be int"
        
        # Note: SMTP may not be configured, so value could be 0
        print(f"SUCCESS: appointment_notifications_sent = {update_data['appointment_notifications_sent']} (0 is expected if SMTP not configured)")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    # ============ NO REGRESSION - EXISTING SECTIONS ============
    
    def test_no_regression_tasks_section(self, auth_session):
        """Test that tasks section still works correctly"""
        unique_id = str(uuid.uuid4())[:8]
        
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Tasks Regression Test {unique_id}",
            "email": f"tasks.regression.{unique_id}@example.com",
            "message": "Test for tasks regression"
        })
        lead_id = create_response.json()["lead_id"]
        
        # Add tasks
        tasks = [
            {"id": str(uuid.uuid4()), "title": "Task 1", "completed": False, "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "title": "Task 2", "completed": True, "created_at": datetime.now().isoformat()}
        ]
        
        update_response = auth_session.put(f"{BASE_URL}/api/leads/{lead_id}", json={"tasks": tasks})
        assert update_response.status_code == 200
        
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        assert len(lead["tasks"]) == 2
        print(f"SUCCESS: Tasks section works correctly (no regression)")
        
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    def test_no_regression_notes_section(self, auth_session):
        """Test that notes section still works correctly"""
        unique_id = str(uuid.uuid4())[:8]
        
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Notes Regression Test {unique_id}",
            "email": f"notes.regression.{unique_id}@example.com",
            "message": "Test for notes regression"
        })
        lead_id = create_response.json()["lead_id"]
        
        # Add notes
        notes_timeline = [
            {"id": str(uuid.uuid4()), "note": "Note 1", "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "note": "Note 2", "created_at": datetime.now().isoformat()}
        ]
        
        update_response = auth_session.put(f"{BASE_URL}/api/leads/{lead_id}", json={
            "notes": "Main notes",
            "notes_timeline": notes_timeline
        })
        assert update_response.status_code == 200
        
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        assert lead["notes"] == "Main notes"
        assert len(lead["notes_timeline"]) == 2
        print(f"SUCCESS: Notes section works correctly (no regression)")
        
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    def test_no_regression_payments_section(self, auth_session):
        """Test that payments section still works correctly"""
        unique_id = str(uuid.uuid4())[:8]
        
        create_response = auth_session.post(f"{BASE_URL}/api/leads/", json={
            "name": f"Payments Regression Test {unique_id}",
            "email": f"payments.regression.{unique_id}@example.com",
            "message": "Test for payments regression"
        })
        lead_id = create_response.json()["lead_id"]
        
        # Add payments
        payments = [
            {"id": str(uuid.uuid4()), "date": "2026-03-25", "amount": 500.00, "status": "Paid", "method": "Card", "note": "Deposit"}
        ]
        
        update_response = auth_session.put(f"{BASE_URL}/api/leads/{lead_id}", json={"payments": payments})
        assert update_response.status_code == 200
        
        get_response = auth_session.get(f"{BASE_URL}/api/leads/{lead_id}")
        lead = get_response.json()
        assert len(lead["payments"]) == 1
        assert lead["payments"][0]["amount"] == 500.00
        print(f"SUCCESS: Payments section works correctly (no regression)")
        
        auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
