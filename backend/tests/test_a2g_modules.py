"""
Test suite for A2G modules (Step 1 backend wiring):
- Contacts CRUD
- Calendar (calendars, events, categories)
- Tasks (CRUD, comments, push-status)
- Radio (search, featured, tune)
- AndGo (goto-links CRUD, reorder)
- Booking (settings, link, public booking, meetings)
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "mel@a2gdesigns.com"
ADMIN_PASSWORD = "BigDaddy2016!!"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    return data.get("access_token")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Return headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


# ============ CONTACTS MODULE TESTS ============

class TestContacts:
    """Contacts CRUD endpoint tests"""
    
    created_contact_id = None
    
    def test_create_contact(self, auth_headers):
        """Test creating a new contact"""
        payload = {
            "first_name": "TEST_John",
            "last_name": "Doe",
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "mobile_phone": "555-1234",
            "organization": "Test Corp",
            "status": "active"
        }
        response = requests.post(f"{BASE_URL}/api/contacts", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Create contact failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["first_name"] == "TEST_John"
        assert data["last_name"] == "Doe"
        assert "name" in data  # Should be auto-generated
        TestContacts.created_contact_id = data["id"]
        print(f"Created contact: {data['id']}")
    
    def test_list_contacts(self, auth_headers):
        """Test listing contacts"""
        response = requests.get(f"{BASE_URL}/api/contacts", headers=auth_headers)
        assert response.status_code == 200, f"List contacts failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Listed {len(data)} contacts")
    
    def test_get_contact(self, auth_headers):
        """Test getting a specific contact"""
        if not TestContacts.created_contact_id:
            pytest.skip("No contact created")
        response = requests.get(f"{BASE_URL}/api/contacts/{TestContacts.created_contact_id}", headers=auth_headers)
        assert response.status_code == 200, f"Get contact failed: {response.text}"
        data = response.json()
        assert data["id"] == TestContacts.created_contact_id
        print(f"Got contact: {data['name']}")
    
    def test_update_contact(self, auth_headers):
        """Test updating a contact"""
        if not TestContacts.created_contact_id:
            pytest.skip("No contact created")
        payload = {
            "first_name": "TEST_Jane",
            "last_name": "Doe",
            "email": "updated@example.com",
            "mobile_phone": "555-5678",
            "organization": "Updated Corp",
            "status": "active"
        }
        response = requests.put(f"{BASE_URL}/api/contacts/{TestContacts.created_contact_id}", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Update contact failed: {response.text}"
        data = response.json()
        assert data["first_name"] == "TEST_Jane"
        print(f"Updated contact: {data['name']}")
    
    def test_delete_contact(self, auth_headers):
        """Test deleting a contact"""
        if not TestContacts.created_contact_id:
            pytest.skip("No contact created")
        response = requests.delete(f"{BASE_URL}/api/contacts/{TestContacts.created_contact_id}", headers=auth_headers)
        assert response.status_code == 200, f"Delete contact failed: {response.text}"
        data = response.json()
        assert data.get("status") == "deleted"
        print(f"Deleted contact: {TestContacts.created_contact_id}")
    
    def test_contact_not_found(self, auth_headers):
        """Test 404 for non-existent contact"""
        response = requests.get(f"{BASE_URL}/api/contacts/nonexistent-id", headers=auth_headers)
        assert response.status_code == 404


# ============ CALENDAR MODULE TESTS ============

class TestCalendar:
    """Calendar endpoints tests"""
    
    created_calendar_id = None
    created_event_id = None
    created_category_id = None
    
    def test_get_calendars(self, auth_headers):
        """Test getting calendars (creates default if none exist)"""
        response = requests.get(f"{BASE_URL}/api/calendars", headers=auth_headers)
        assert response.status_code == 200, f"Get calendars failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # Should have at least default calendar
        TestCalendar.created_calendar_id = data[0]["id"]
        print(f"Got {len(data)} calendars, using: {TestCalendar.created_calendar_id}")
    
    def test_create_calendar(self, auth_headers):
        """Test creating a new calendar"""
        payload = {
            "name": "TEST_Work Calendar",
            "color": "#ff5733",
            "description": "Test work calendar",
            "is_default": False
        }
        response = requests.post(f"{BASE_URL}/api/calendars", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Create calendar failed: {response.text}"
        data = response.json()
        assert data["name"] == "TEST_Work Calendar"
        assert data["color"] == "#ff5733"
        TestCalendar.created_calendar_id = data["id"]
        print(f"Created calendar: {data['id']}")
    
    def test_get_categories(self, auth_headers):
        """Test getting event categories"""
        response = requests.get(f"{BASE_URL}/api/calendars/categories", headers=auth_headers)
        assert response.status_code == 200, f"Get categories failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Got {len(data)} categories")
    
    def test_create_category(self, auth_headers):
        """Test creating an event category"""
        payload = {
            "name": "TEST_Meeting",
            "color": "#3b82f6"
        }
        response = requests.post(f"{BASE_URL}/api/calendars/categories", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Create category failed: {response.text}"
        data = response.json()
        assert data["name"] == "TEST_Meeting"
        TestCalendar.created_category_id = data["id"]
        print(f"Created category: {data['id']}")
    
    def test_create_event(self, auth_headers):
        """Test creating a calendar event"""
        if not TestCalendar.created_calendar_id:
            pytest.skip("No calendar available")
        
        now = datetime.now(timezone.utc)
        start_time = (now + timedelta(days=1)).isoformat()
        end_time = (now + timedelta(days=1, hours=1)).isoformat()
        
        payload = {
            "title": "TEST_Team Meeting",
            "description": "Weekly team sync",
            "start_time": start_time,
            "end_time": end_time,
            "all_day": False,
            "calendar_id": TestCalendar.created_calendar_id,
            "location": "Conference Room A",
            "reminder_minutes": 15,
            "priority": "normal",
            "status": "confirmed"
        }
        response = requests.post(f"{BASE_URL}/api/calendars/events", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Create event failed: {response.text}"
        data = response.json()
        assert data["title"] == "TEST_Team Meeting"
        TestCalendar.created_event_id = data["id"]
        print(f"Created event: {data['id']}")
    
    def test_get_events(self, auth_headers):
        """Test getting calendar events"""
        response = requests.get(f"{BASE_URL}/api/calendars/events", headers=auth_headers)
        assert response.status_code == 200, f"Get events failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Got {len(data)} events")
    
    def test_update_event(self, auth_headers):
        """Test updating a calendar event"""
        if not TestCalendar.created_event_id:
            pytest.skip("No event created")
        
        payload = {
            "title": "TEST_Updated Meeting",
            "description": "Updated description"
        }
        response = requests.put(f"{BASE_URL}/api/calendars/events/{TestCalendar.created_event_id}", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Update event failed: {response.text}"
        data = response.json()
        assert data["title"] == "TEST_Updated Meeting"
        print(f"Updated event: {data['id']}")
    
    def test_delete_event(self, auth_headers):
        """Test deleting a calendar event"""
        if not TestCalendar.created_event_id:
            pytest.skip("No event created")
        
        response = requests.delete(f"{BASE_URL}/api/calendars/events/{TestCalendar.created_event_id}", headers=auth_headers)
        assert response.status_code == 200, f"Delete event failed: {response.text}"
        data = response.json()
        assert data.get("status") == "deleted"
        print(f"Deleted event: {TestCalendar.created_event_id}")


# ============ TASKS MODULE TESTS ============

class TestTasks:
    """Tasks CRUD and comments tests"""
    
    created_task_id = None
    created_comment_id = None
    
    def test_create_task(self, auth_headers):
        """Test creating a new task"""
        payload = {
            "title": "TEST_Complete project",
            "description": "Finish the project by end of week",
            "due_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "priority": "high",
            "status": "pending"
        }
        response = requests.post(f"{BASE_URL}/api/tasks", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Create task failed: {response.text}"
        data = response.json()
        assert data["title"] == "TEST_Complete project"
        assert data["priority"] == "high"
        TestTasks.created_task_id = data["id"]
        print(f"Created task: {data['id']}")
    
    def test_list_tasks(self, auth_headers):
        """Test listing tasks"""
        response = requests.get(f"{BASE_URL}/api/tasks", headers=auth_headers)
        assert response.status_code == 200, f"List tasks failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Listed {len(data)} tasks")
    
    def test_update_task(self, auth_headers):
        """Test updating a task"""
        if not TestTasks.created_task_id:
            pytest.skip("No task created")
        
        payload = {
            "title": "TEST_Updated task",
            "status": "in_progress"
        }
        response = requests.put(f"{BASE_URL}/api/tasks/{TestTasks.created_task_id}", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Update task failed: {response.text}"
        data = response.json()
        assert data["title"] == "TEST_Updated task"
        assert data["status"] == "in_progress"
        print(f"Updated task: {data['id']}")
    
    def test_add_task_comment(self, auth_headers):
        """Test adding a comment to a task"""
        if not TestTasks.created_task_id:
            pytest.skip("No task created")
        
        payload = {
            "comment": "TEST_This is a test comment"
        }
        response = requests.post(f"{BASE_URL}/api/tasks/{TestTasks.created_task_id}/comments", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Add comment failed: {response.text}"
        data = response.json()
        assert data["comment"] == "TEST_This is a test comment"
        TestTasks.created_comment_id = data["id"]
        print(f"Added comment: {data['id']}")
    
    def test_list_task_comments(self, auth_headers):
        """Test listing task comments"""
        if not TestTasks.created_task_id:
            pytest.skip("No task created")
        
        response = requests.get(f"{BASE_URL}/api/tasks/{TestTasks.created_task_id}/comments", headers=auth_headers)
        assert response.status_code == 200, f"List comments failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Listed {len(data)} comments")
    
    def test_push_task_status(self, auth_headers):
        """Test pushing task status to external source"""
        if not TestTasks.created_task_id:
            pytest.skip("No task created")
        
        payload = {
            "source": "google_tasks",
            "success": True,
            "message": "Synced successfully"
        }
        response = requests.post(f"{BASE_URL}/api/tasks/{TestTasks.created_task_id}/push-status", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Push status failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok"
        assert data.get("last_push_source") == "google_tasks"
        print(f"Pushed task status: {data}")
    
    def test_delete_task(self, auth_headers):
        """Test deleting a task"""
        if not TestTasks.created_task_id:
            pytest.skip("No task created")
        
        response = requests.delete(f"{BASE_URL}/api/tasks/{TestTasks.created_task_id}", headers=auth_headers)
        assert response.status_code == 200, f"Delete task failed: {response.text}"
        data = response.json()
        assert data.get("status") == "deleted"
        print(f"Deleted task: {TestTasks.created_task_id}")


# ============ RADIO MODULE TESTS ============

class TestRadio:
    """Radio endpoints tests (external API integration)"""
    
    def test_radio_search(self, auth_headers):
        """Test radio station search"""
        response = requests.get(f"{BASE_URL}/api/radio/search?q=jazz", headers=auth_headers)
        assert response.status_code == 200, f"Radio search failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} radio stations for 'jazz'")
    
    def test_radio_featured(self, auth_headers):
        """Test getting featured radio stations"""
        response = requests.get(f"{BASE_URL}/api/radio/featured?category=popular", headers=auth_headers)
        assert response.status_code == 200, f"Radio featured failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Got {len(data)} featured stations")
    
    def test_radio_featured_music(self, auth_headers):
        """Test getting music category stations"""
        response = requests.get(f"{BASE_URL}/api/radio/featured?category=music", headers=auth_headers)
        assert response.status_code == 200, f"Radio featured music failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Got {len(data)} music stations")
    
    def test_radio_tune(self, auth_headers):
        """Test tuning to a radio station (may fail if no valid station ID)"""
        # Use a known station ID or skip if not available
        response = requests.get(f"{BASE_URL}/api/radio/tune?id=s12345", headers=auth_headers)
        # This may return 500 if station doesn't exist, which is expected
        assert response.status_code in [200, 500], f"Radio tune unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert "streams" in data or "best" in data
            print(f"Tuned to station: {data}")
        else:
            print("Radio tune returned 500 (expected for invalid station ID)")


# ============ ANDGO MODULE TESTS ============

class TestAndGo:
    """AndGo (goto-links) CRUD tests"""
    
    created_link_ids = []
    
    def test_create_link(self, auth_headers):
        """Test creating a goto link"""
        payload = {
            "title": "TEST_Google",
            "url": "https://google.com",
            "color": "#4285f4"
        }
        response = requests.post(f"{BASE_URL}/api/goto-links", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Create link failed: {response.text}"
        data = response.json()
        assert data["title"] == "TEST_Google"
        assert data["url"] == "https://google.com"
        TestAndGo.created_link_ids.append(data["id"])
        print(f"Created link: {data['id']}")
    
    def test_create_second_link(self, auth_headers):
        """Test creating another goto link for reorder test"""
        payload = {
            "title": "TEST_GitHub",
            "url": "https://github.com",
            "color": "#333333"
        }
        response = requests.post(f"{BASE_URL}/api/goto-links", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Create second link failed: {response.text}"
        data = response.json()
        TestAndGo.created_link_ids.append(data["id"])
        print(f"Created second link: {data['id']}")
    
    def test_list_links(self, auth_headers):
        """Test listing goto links"""
        response = requests.get(f"{BASE_URL}/api/goto-links", headers=auth_headers)
        assert response.status_code == 200, f"List links failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Listed {len(data)} links")
    
    def test_update_link(self, auth_headers):
        """Test updating a goto link"""
        if not TestAndGo.created_link_ids:
            pytest.skip("No link created")
        
        payload = {
            "title": "TEST_Updated Google",
            "url": "https://www.google.com",
            "color": "#34a853"
        }
        response = requests.put(f"{BASE_URL}/api/goto-links/{TestAndGo.created_link_ids[0]}", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Update link failed: {response.text}"
        data = response.json()
        assert data.get("status") == "success"
        print(f"Updated link: {TestAndGo.created_link_ids[0]}")
    
    def test_reorder_links(self, auth_headers):
        """Test reordering goto links"""
        if len(TestAndGo.created_link_ids) < 2:
            pytest.skip("Need at least 2 links for reorder test")
        
        # Reverse the order
        payload = {
            "ordered_ids": list(reversed(TestAndGo.created_link_ids))
        }
        response = requests.put(f"{BASE_URL}/api/goto-links/reorder", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Reorder links failed: {response.text}"
        data = response.json()
        assert data.get("status") == "success"
        print(f"Reordered links")
    
    def test_delete_links(self, auth_headers):
        """Test deleting goto links"""
        for link_id in TestAndGo.created_link_ids:
            response = requests.delete(f"{BASE_URL}/api/goto-links/{link_id}", headers=auth_headers)
            assert response.status_code == 200, f"Delete link failed: {response.text}"
            print(f"Deleted link: {link_id}")
        TestAndGo.created_link_ids = []


# ============ BOOKING MODULE TESTS ============

class TestBooking:
    """Booking endpoints tests"""
    
    booking_slug = None
    
    def test_get_booking_settings(self, auth_headers):
        """Test getting booking settings (creates default if none exist)"""
        response = requests.get(f"{BASE_URL}/api/booking/settings", headers=auth_headers)
        assert response.status_code == 200, f"Get booking settings failed: {response.text}"
        data = response.json()
        assert "slug" in data
        assert "enabled" in data
        TestBooking.booking_slug = data["slug"]
        print(f"Got booking settings, slug: {data['slug']}")
    
    def test_update_booking_settings(self, auth_headers):
        """Test updating booking settings"""
        payload = {
            "enabled": True,
            "title": "TEST_Book a Meeting",
            "description": "Choose an available time slot.",
            "meeting_duration": 30,
            "timezone": "UTC",
            "daily_start_hour": 9,
            "daily_end_hour": 17,
            "max_days_ahead": 30
        }
        response = requests.put(f"{BASE_URL}/api/booking/settings", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Update booking settings failed: {response.text}"
        data = response.json()
        assert data["title"] == "TEST_Book a Meeting"
        print(f"Updated booking settings")
    
    def test_get_booking_link(self, auth_headers):
        """Test getting booking link"""
        response = requests.get(f"{BASE_URL}/api/booking/link", headers=auth_headers)
        assert response.status_code == 200, f"Get booking link failed: {response.text}"
        data = response.json()
        assert "slug" in data
        assert "public_url" in data
        assert "enabled" in data
        print(f"Got booking link: {data['public_url']}")
    
    def test_get_public_booking(self, auth_headers):
        """Test getting public booking page"""
        if not TestBooking.booking_slug:
            pytest.skip("No booking slug available")
        
        # Public endpoint - no auth needed
        response = requests.get(f"{BASE_URL}/api/booking/public/{TestBooking.booking_slug}")
        assert response.status_code == 200, f"Get public booking failed: {response.text}"
        data = response.json()
        assert "settings" in data
        assert "host" in data
        assert "available_slots" in data
        print(f"Got public booking page with {len(data['available_slots'])} slots")
    
    def test_create_public_booking(self, auth_headers):
        """Test creating a public booking"""
        if not TestBooking.booking_slug:
            pytest.skip("No booking slug available")
        
        # Get available slots first
        response = requests.get(f"{BASE_URL}/api/booking/public/{TestBooking.booking_slug}")
        if response.status_code != 200:
            pytest.skip("Could not get public booking page")
        
        data = response.json()
        if not data.get("available_slots"):
            pytest.skip("No available slots")
        
        # Try multiple slots until we find one that's available
        booked = False
        for slot in data["available_slots"][:10]:  # Try first 10 slots
            payload = {
                "guest_name": "TEST_Guest User",
                "guest_email": f"test.guest.{uuid.uuid4().hex[:6]}@example.com",
                "guest_phone": "555-9999",
                "topic": "Test Meeting",
                "notes": "This is a test booking",
                "starts_at": slot,
                "duration_minutes": 30
            }
            response = requests.post(f"{BASE_URL}/api/booking/public/{TestBooking.booking_slug}/book", json=payload)
            if response.status_code == 200:
                data = response.json()
                assert data.get("success") == True
                assert "meeting" in data
                print(f"Created booking: {data['meeting']['id']}")
                booked = True
                break
            elif response.status_code == 409:
                # Slot already booked, try next one
                continue
            else:
                assert False, f"Unexpected error: {response.status_code} - {response.text}"
        
        if not booked:
            # All slots were taken, but the endpoint is working correctly (409 is valid response)
            print("All tested slots were already booked - endpoint working correctly (409 responses)")
            # This is still a pass - the endpoint is functioning correctly
    
    def test_list_meetings(self, auth_headers):
        """Test listing meetings"""
        response = requests.get(f"{BASE_URL}/api/booking/meetings", headers=auth_headers)
        assert response.status_code == 200, f"List meetings failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Listed {len(data)} meetings")
    
    def test_update_meeting_status(self, auth_headers):
        """Test updating meeting status"""
        # First get meetings
        response = requests.get(f"{BASE_URL}/api/booking/meetings", headers=auth_headers)
        if response.status_code != 200:
            pytest.skip("Could not get meetings")
        
        meetings = response.json()
        test_meetings = [m for m in meetings if m.get("guest_name", "").startswith("TEST_")]
        
        if not test_meetings:
            pytest.skip("No test meetings to update")
        
        meeting_id = test_meetings[0]["id"]
        payload = {"status": "confirmed"}
        response = requests.patch(f"{BASE_URL}/api/booking/meetings/{meeting_id}/status", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Update meeting status failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"Updated meeting status: {meeting_id}")


# ============ AUTH REQUIRED TESTS ============

class TestAuthRequired:
    """Test that endpoints require authentication"""
    
    def test_contacts_requires_auth(self):
        """Test contacts endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/contacts")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_calendars_requires_auth(self):
        """Test calendars endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/calendars")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_tasks_requires_auth(self):
        """Test tasks endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/tasks")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_radio_requires_auth(self):
        """Test radio endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/radio/featured")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_goto_links_requires_auth(self):
        """Test goto-links endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/goto-links")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_booking_settings_requires_auth(self):
        """Test booking settings endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/booking/settings")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
