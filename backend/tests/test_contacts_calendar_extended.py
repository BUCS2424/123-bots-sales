"""
Extended tests for Contacts and Calendar modules:
- Contacts import with JSON payload
- Contacts export (JSON, CSV, VCF)
- Calendar events query with start_date/end_date/calendar_ids
- Calendar delete endpoint
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials - using provided credentials
ADMIN_EMAIL = "qa-admin-a2g@example.com"
ADMIN_PASSWORD = "TestPass123!"


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


# ============ CONTACTS IMPORT/EXPORT TESTS ============

class TestContactsImportExport:
    """Contacts import and export endpoint tests"""
    
    imported_contact_ids = []
    
    def test_import_contacts_json(self, auth_headers):
        """Test importing contacts via JSON payload"""
        unique_suffix = uuid.uuid4().hex[:6]
        payload = {
            "contacts": [
                {
                    "name": f"TEST_Import_John_{unique_suffix}",
                    "phone_number": f"555-{unique_suffix[:4]}",
                    "email": f"john_{unique_suffix}@test.com",
                    "organization": "Import Test Corp"
                },
                {
                    "name": f"TEST_Import_Jane_{unique_suffix}",
                    "phone_number": f"555-{unique_suffix[2:]}",
                    "email": f"jane_{unique_suffix}@test.com",
                    "organization": "Import Test Corp"
                }
            ],
            "skip_duplicates": True
        }
        response = requests.post(f"{BASE_URL}/api/contacts/import", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Import contacts failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert data.get("imported") >= 0  # May be 0 if duplicates exist
        print(f"Imported {data.get('imported')} contacts, skipped {data.get('skipped')}")
    
    def test_export_contacts_json(self, auth_headers):
        """Test exporting contacts as JSON"""
        response = requests.get(f"{BASE_URL}/api/contacts/export", headers=auth_headers)
        assert response.status_code == 200, f"Export contacts JSON failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Exported {len(data)} contacts as JSON")
    
    def test_export_contacts_csv(self, auth_headers):
        """Test exporting contacts as CSV"""
        response = requests.get(f"{BASE_URL}/api/contacts/export/csv", headers=auth_headers)
        assert response.status_code == 200, f"Export contacts CSV failed: {response.text}"
        assert "text/csv" in response.headers.get("content-type", "")
        content = response.text
        assert "name" in content.lower() or "Name" in content
        print(f"Exported contacts as CSV ({len(content)} bytes)")
    
    def test_export_contacts_vcf(self, auth_headers):
        """Test exporting contacts as VCF"""
        response = requests.get(f"{BASE_URL}/api/contacts/export/vcf", headers=auth_headers)
        assert response.status_code == 200, f"Export contacts VCF failed: {response.text}"
        content = response.text
        assert "BEGIN:VCARD" in content or len(content) == 0  # Empty if no contacts
        print(f"Exported contacts as VCF ({len(content)} bytes)")
    
    def test_import_with_skip_duplicates(self, auth_headers):
        """Test that skip_duplicates works correctly"""
        unique_suffix = uuid.uuid4().hex[:6]
        phone = f"555-DUP-{unique_suffix[:4]}"
        
        # First import
        payload1 = {
            "contacts": [{"name": f"TEST_Dup_{unique_suffix}", "phone_number": phone}],
            "skip_duplicates": True
        }
        response1 = requests.post(f"{BASE_URL}/api/contacts/import", json=payload1, headers=auth_headers)
        assert response1.status_code == 200
        data1 = response1.json()
        first_imported = data1.get("imported", 0)
        
        # Second import with same phone - should be skipped
        payload2 = {
            "contacts": [{"name": f"TEST_Dup2_{unique_suffix}", "phone_number": phone}],
            "skip_duplicates": True
        }
        response2 = requests.post(f"{BASE_URL}/api/contacts/import", json=payload2, headers=auth_headers)
        assert response2.status_code == 200
        data2 = response2.json()
        
        # If first import succeeded, second should be skipped
        if first_imported > 0:
            assert data2.get("skipped", 0) >= 1 or data2.get("imported", 0) == 0
            print(f"Duplicate detection working: skipped {data2.get('skipped', 0)}")
        else:
            print("First import was also skipped (duplicate already exists)")


# ============ CALENDAR EVENTS QUERY TESTS ============

class TestCalendarEventsQuery:
    """Calendar events query with date filters and calendar_ids"""
    
    test_calendar_id = None
    test_event_ids = []
    
    def test_get_or_create_calendar(self, auth_headers):
        """Get existing calendar or create one for testing"""
        response = requests.get(f"{BASE_URL}/api/calendars", headers=auth_headers)
        assert response.status_code == 200
        calendars = response.json()
        
        if calendars:
            TestCalendarEventsQuery.test_calendar_id = calendars[0]["id"]
            print(f"Using existing calendar: {TestCalendarEventsQuery.test_calendar_id}")
        else:
            # Create a test calendar
            payload = {"name": "TEST_Query_Calendar", "color": "#3b82f6"}
            response = requests.post(f"{BASE_URL}/api/calendars", json=payload, headers=auth_headers)
            assert response.status_code == 200
            TestCalendarEventsQuery.test_calendar_id = response.json()["id"]
            print(f"Created test calendar: {TestCalendarEventsQuery.test_calendar_id}")
    
    def test_create_events_for_query(self, auth_headers):
        """Create events for query testing"""
        if not TestCalendarEventsQuery.test_calendar_id:
            pytest.skip("No calendar available")
        
        now = datetime.now(timezone.utc)
        
        # Create events at different times
        for i, days_offset in enumerate([0, 7, 14, 30]):
            start = (now + timedelta(days=days_offset)).isoformat()
            end = (now + timedelta(days=days_offset, hours=1)).isoformat()
            
            payload = {
                "title": f"TEST_Query_Event_{i}",
                "start_time": start,
                "end_time": end,
                "calendar_id": TestCalendarEventsQuery.test_calendar_id,
                "all_day": False
            }
            response = requests.post(f"{BASE_URL}/api/calendars/events", json=payload, headers=auth_headers)
            assert response.status_code == 200, f"Create event failed: {response.text}"
            TestCalendarEventsQuery.test_event_ids.append(response.json()["id"])
        
        print(f"Created {len(TestCalendarEventsQuery.test_event_ids)} test events")
    
    def test_query_events_with_date_range(self, auth_headers):
        """Test querying events with start_date and end_date"""
        now = datetime.now(timezone.utc)
        start_date = now.isoformat()
        end_date = (now + timedelta(days=10)).isoformat()
        
        response = requests.get(
            f"{BASE_URL}/api/calendars/events",
            params={"start_date": start_date, "end_date": end_date},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Query events failed: {response.text}"
        events = response.json()
        assert isinstance(events, list)
        print(f"Found {len(events)} events in date range (next 10 days)")
    
    def test_query_events_with_calendar_ids(self, auth_headers):
        """Test querying events with calendar_ids filter"""
        if not TestCalendarEventsQuery.test_calendar_id:
            pytest.skip("No calendar available")
        
        response = requests.get(
            f"{BASE_URL}/api/calendars/events",
            params={"calendar_ids": TestCalendarEventsQuery.test_calendar_id},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Query events with calendar_ids failed: {response.text}"
        events = response.json()
        assert isinstance(events, list)
        # All events should belong to the specified calendar
        for event in events:
            assert event.get("calendar_id") == TestCalendarEventsQuery.test_calendar_id
        print(f"Found {len(events)} events for calendar {TestCalendarEventsQuery.test_calendar_id}")
    
    def test_query_events_with_multiple_calendar_ids(self, auth_headers):
        """Test querying events with multiple calendar_ids (comma-separated)"""
        if not TestCalendarEventsQuery.test_calendar_id:
            pytest.skip("No calendar available")
        
        # Get all calendars
        response = requests.get(f"{BASE_URL}/api/calendars", headers=auth_headers)
        calendars = response.json()
        calendar_ids = ",".join([c["id"] for c in calendars[:3]])  # First 3 calendars
        
        response = requests.get(
            f"{BASE_URL}/api/calendars/events",
            params={"calendar_ids": calendar_ids},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Query events with multiple calendar_ids failed: {response.text}"
        events = response.json()
        assert isinstance(events, list)
        print(f"Found {len(events)} events for calendars: {calendar_ids}")
    
    def test_query_events_combined_filters(self, auth_headers):
        """Test querying events with both date range and calendar_ids"""
        if not TestCalendarEventsQuery.test_calendar_id:
            pytest.skip("No calendar available")
        
        now = datetime.now(timezone.utc)
        start_date = now.isoformat()
        end_date = (now + timedelta(days=60)).isoformat()
        
        response = requests.get(
            f"{BASE_URL}/api/calendars/events",
            params={
                "start_date": start_date,
                "end_date": end_date,
                "calendar_ids": TestCalendarEventsQuery.test_calendar_id
            },
            headers=auth_headers
        )
        assert response.status_code == 200, f"Query events with combined filters failed: {response.text}"
        events = response.json()
        assert isinstance(events, list)
        print(f"Found {len(events)} events with combined filters")
    
    def test_delete_calendar_events(self, auth_headers):
        """Test deleting calendar events via API"""
        for event_id in TestCalendarEventsQuery.test_event_ids:
            response = requests.delete(
                f"{BASE_URL}/api/calendars/events/{event_id}",
                headers=auth_headers
            )
            assert response.status_code == 200, f"Delete event failed: {response.text}"
            data = response.json()
            assert data.get("status") == "deleted"
        
        print(f"Deleted {len(TestCalendarEventsQuery.test_event_ids)} test events")
        TestCalendarEventsQuery.test_event_ids = []


# ============ CALENDAR DELETE TESTS ============

class TestCalendarDelete:
    """Calendar delete endpoint tests"""
    
    test_calendar_id = None
    
    def test_create_calendar_for_delete(self, auth_headers):
        """Create a calendar to test deletion"""
        payload = {
            "name": f"TEST_Delete_Calendar_{uuid.uuid4().hex[:6]}",
            "color": "#ef4444",
            "is_default": False
        }
        response = requests.post(f"{BASE_URL}/api/calendars", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Create calendar failed: {response.text}"
        TestCalendarDelete.test_calendar_id = response.json()["id"]
        print(f"Created calendar for deletion: {TestCalendarDelete.test_calendar_id}")
    
    def test_delete_calendar(self, auth_headers):
        """Test deleting a calendar"""
        if not TestCalendarDelete.test_calendar_id:
            pytest.skip("No calendar to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/calendars/{TestCalendarDelete.test_calendar_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Delete calendar failed: {response.text}"
        data = response.json()
        assert data.get("status") == "deleted"
        print(f"Deleted calendar: {TestCalendarDelete.test_calendar_id}")
    
    def test_delete_nonexistent_calendar(self, auth_headers):
        """Test deleting a non-existent calendar returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/calendars/nonexistent-calendar-id",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Correctly returned 404 for non-existent calendar")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
