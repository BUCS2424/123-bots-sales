"""
Test Booking Location Type and Meeting Mode Features
Tests for:
- Admin Create Meeting modal location type (Physical/Online)
- Physical address field when Physical selected
- meet.saysme.org checkbox and room name for Online
- Other Meeting URL checkbox (mutually exclusive with meet.saysme)
- POST /api/booking/invite with location fields
- Public booking form location section
- POST /api/booking/public/{slug} with location fields
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "qa-admin-a2g@example.com"
ADMIN_PASSWORD = "TestPass123!"


class TestBookingLocationFeatures:
    """Test booking location type and meeting mode features"""
    
    auth_token = None
    user_id = None
    booking_slug = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        if not TestBookingLocationFeatures.auth_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            if response.status_code == 200:
                data = response.json()
                TestBookingLocationFeatures.auth_token = data.get("access_token") or data.get("token")
                TestBookingLocationFeatures.user_id = data.get("user", {}).get("id")
            else:
                pytest.skip(f"Authentication failed: {response.status_code}")
        
        self.headers = {"Authorization": f"Bearer {TestBookingLocationFeatures.auth_token}"}
    
    # ==================== BOOKING SETTINGS TESTS ====================
    
    def test_get_booking_settings_has_location_fields(self):
        """GET /api/booking/settings returns location type fields"""
        response = requests.get(f"{BASE_URL}/api/booking/settings", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Check location-related fields exist
        assert "default_location_type" in data, "Missing default_location_type field"
        assert "physical_address" in data, "Missing physical_address field"
        assert "other_meeting_url" in data, "Missing other_meeting_url field"
        assert "video_meet_enabled" in data, "Missing video_meet_enabled field"
        assert "video_meet_base_url" in data, "Missing video_meet_base_url field"
        
        # Store booking slug for later tests
        TestBookingLocationFeatures.booking_slug = data.get("booking_slug") or data.get("slug")
        print(f"Booking settings retrieved with location fields. Slug: {TestBookingLocationFeatures.booking_slug}")
    
    def test_save_booking_settings_with_physical_location(self):
        """POST /api/booking/settings saves physical location settings"""
        payload = {
            "enabled": True,
            "availability": [
                {"day": 1, "start_time": "09:00", "end_time": "17:00", "enabled": True},
                {"day": 2, "start_time": "09:00", "end_time": "17:00", "enabled": True},
                {"day": 3, "start_time": "09:00", "end_time": "17:00", "enabled": True},
                {"day": 4, "start_time": "09:00", "end_time": "17:00", "enabled": True},
                {"day": 5, "start_time": "09:00", "end_time": "17:00", "enabled": True}
            ],
            "meeting_lengths": [15, 30, 45, 60],
            "default_length": 30,
            "buffer_minutes": 15,
            "advance_days": 30,
            "timezone": "America/New_York",
            "video_meet_enabled": True,
            "video_meet_base_url": "https://meet.saysme.org",
            "default_location_type": "physical",
            "physical_address": "123 Test Street, Suite 100, New York, NY 10001",
            "other_meeting_url": ""
        }
        
        response = requests.post(f"{BASE_URL}/api/booking/settings", json=payload, headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify settings were saved
        get_response = requests.get(f"{BASE_URL}/api/booking/settings", headers=self.headers)
        assert get_response.status_code == 200
        data = get_response.json()
        assert data.get("default_location_type") == "physical", "default_location_type not saved"
        assert data.get("physical_address") == "123 Test Street, Suite 100, New York, NY 10001", "physical_address not saved"
        print("Physical location settings saved successfully")
    
    def test_save_booking_settings_with_online_location(self):
        """POST /api/booking/settings saves online location settings"""
        payload = {
            "enabled": True,
            "availability": [
                {"day": 1, "start_time": "09:00", "end_time": "17:00", "enabled": True},
                {"day": 2, "start_time": "09:00", "end_time": "17:00", "enabled": True}
            ],
            "meeting_lengths": [15, 30, 45, 60],
            "default_length": 30,
            "buffer_minutes": 15,
            "advance_days": 30,
            "timezone": "America/New_York",
            "video_meet_enabled": True,
            "video_meet_base_url": "https://meet.saysme.org",
            "default_location_type": "online",
            "physical_address": "",
            "other_meeting_url": "https://zoom.us/j/123456789"
        }
        
        response = requests.post(f"{BASE_URL}/api/booking/settings", json=payload, headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify settings were saved
        get_response = requests.get(f"{BASE_URL}/api/booking/settings", headers=self.headers)
        assert get_response.status_code == 200
        data = get_response.json()
        assert data.get("default_location_type") == "online", "default_location_type not saved"
        assert data.get("other_meeting_url") == "https://zoom.us/j/123456789", "other_meeting_url not saved"
        print("Online location settings saved successfully")
    
    # ==================== INVITE ENDPOINT TESTS ====================
    
    def test_invite_with_physical_location(self):
        """POST /api/booking/invite with physical location type"""
        payload = {
            "title": "Test Physical Meeting",
            "date": "2026-04-15",
            "time": "10:00",
            "duration": 30,
            "description": "Test meeting at physical location",
            "location_type": "physical",
            "use_saysme": False,
            "use_other": False,
            "other_meeting_text": "",
            "physical_address": "456 Meeting Ave, Conference Room A, Chicago, IL 60601",
            "custom_room_name": "",
            "invitees": [
                {"type": "email", "value": f"test-{uuid.uuid4().hex[:8]}@example.com"}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/booking/invite", json=payload, headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "success", "Invite should succeed"
        # Physical location should not have video_link
        assert data.get("video_link") is None, "Physical meeting should not have video_link"
        print("Physical location invite sent successfully")
    
    def test_invite_with_saysme_online(self):
        """POST /api/booking/invite with meet.saysme.org online meeting"""
        room_name = f"test-room-{uuid.uuid4().hex[:8]}"
        payload = {
            "title": "Test SaysMe Meeting",
            "date": "2026-04-16",
            "time": "14:00",
            "duration": 45,
            "description": "Test meeting with meet.saysme.org",
            "location_type": "online",
            "use_saysme": True,
            "use_other": False,
            "other_meeting_text": "",
            "physical_address": "",
            "custom_room_name": room_name,
            "invitees": [
                {"type": "email", "value": f"test-{uuid.uuid4().hex[:8]}@example.com"}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/booking/invite", json=payload, headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "success", "Invite should succeed"
        video_link = data.get("video_link")
        assert video_link is not None, "Online meeting should have video_link"
        assert "meet.saysme.org" in video_link, f"Video link should contain meet.saysme.org: {video_link}"
        assert room_name in video_link, f"Video link should contain room name: {video_link}"
        print(f"SaysMe online invite sent successfully. Video link: {video_link}")
    
    def test_invite_with_other_meeting_url(self):
        """POST /api/booking/invite with Other Meeting URL (custom)"""
        custom_url = "https://teams.microsoft.com/l/meetup-join/test123"
        payload = {
            "title": "Test Other Meeting URL",
            "date": "2026-04-17",
            "time": "11:00",
            "duration": 60,
            "description": "Test meeting with custom URL",
            "location_type": "online",
            "use_saysme": False,
            "use_other": True,
            "other_meeting_text": custom_url,
            "physical_address": "",
            "custom_room_name": "",
            "invitees": [
                {"type": "email", "value": f"test-{uuid.uuid4().hex[:8]}@example.com"}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/booking/invite", json=payload, headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "success", "Invite should succeed"
        video_link = data.get("video_link")
        assert video_link == custom_url, f"Video link should be custom URL: {video_link}"
        print(f"Other meeting URL invite sent successfully. Video link: {video_link}")
    
    def test_invite_mutual_exclusivity_saysme_other(self):
        """Verify use_saysme and use_other are mutually exclusive in backend logic"""
        # When both are true, backend should prioritize use_other
        custom_url = "https://zoom.us/j/mutual-test"
        payload = {
            "title": "Test Mutual Exclusivity",
            "date": "2026-04-18",
            "time": "09:00",
            "duration": 30,
            "description": "Testing mutual exclusivity",
            "location_type": "online",
            "use_saysme": True,  # Both true
            "use_other": True,   # Both true
            "other_meeting_text": custom_url,
            "physical_address": "",
            "custom_room_name": "should-be-ignored",
            "invitees": [
                {"type": "email", "value": f"test-{uuid.uuid4().hex[:8]}@example.com"}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/booking/invite", json=payload, headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        video_link = data.get("video_link")
        # Backend checks use_other first, so custom URL should be used
        assert video_link == custom_url, f"When both true, use_other should take precedence: {video_link}"
        print("Mutual exclusivity test passed - use_other takes precedence")
    
    # ==================== PUBLIC BOOKING ENDPOINT TESTS ====================
    
    def test_public_booking_get_returns_location_defaults(self):
        """GET /api/booking/public/{slug} returns location default fields"""
        # First ensure we have a slug
        if not TestBookingLocationFeatures.booking_slug:
            link_response = requests.get(f"{BASE_URL}/api/booking/link", headers=self.headers)
            if link_response.status_code == 200:
                TestBookingLocationFeatures.booking_slug = link_response.json().get("slug")
        
        slug = TestBookingLocationFeatures.booking_slug
        if not slug:
            pytest.skip("No booking slug available")
        
        response = requests.get(f"{BASE_URL}/api/booking/public/{slug}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Check that location-related fields are present in response
        assert "video_meet_enabled" in data, "Missing video_meet_enabled"
        assert "video_meet_base_url" in data, "Missing video_meet_base_url"
        print(f"Public booking page returns location defaults for slug: {slug}")
    
    def test_public_booking_post_with_physical_location(self):
        """POST /api/booking/public/{slug} with physical location"""
        slug = TestBookingLocationFeatures.booking_slug
        if not slug:
            pytest.skip("No booking slug available")
        
        # Get available slots first
        import datetime
        tomorrow = (datetime.datetime.now() + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
        slots_response = requests.get(f"{BASE_URL}/api/booking/public/{slug}/slots/{tomorrow}")
        
        time_slot = "10:00"
        if slots_response.status_code == 200:
            slots = slots_response.json().get("slots", [])
            if slots:
                time_slot = slots[0].get("time", "10:00")
        
        payload = {
            "name": f"Test Guest Physical {uuid.uuid4().hex[:6]}",
            "email": f"guest-physical-{uuid.uuid4().hex[:8]}@example.com",
            "phone": "+1234567890",
            "date": tomorrow,
            "time": time_slot,
            "duration": 30,
            "notes": "Testing physical location booking",
            "location_type": "physical",
            "use_saysme": False,
            "use_other": False,
            "other_meeting_text": "",
            "physical_address": "789 Guest Location, Room 101, Boston, MA 02101",
            "custom_room_name": None
        }
        
        response = requests.post(f"{BASE_URL}/api/booking/public/{slug}", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "success", "Booking should succeed"
        assert data.get("booking_id") is not None, "Should return booking_id"
        
        details = data.get("details", {})
        assert details.get("location_type") == "physical", "Location type should be physical"
        assert details.get("physical_address") == "789 Guest Location, Room 101, Boston, MA 02101", "Physical address should be saved"
        
        # Physical booking should not have video_link
        assert data.get("video_link") is None, "Physical booking should not have video_link"
        print(f"Public booking with physical location created successfully. ID: {data.get('booking_id')}")
    
    def test_public_booking_post_with_saysme_online(self):
        """POST /api/booking/public/{slug} with meet.saysme.org"""
        slug = TestBookingLocationFeatures.booking_slug
        if not slug:
            pytest.skip("No booking slug available")
        
        import datetime
        day_after = (datetime.datetime.now() + datetime.timedelta(days=2)).strftime("%Y-%m-%d")
        
        room_name = f"guest-room-{uuid.uuid4().hex[:8]}"
        payload = {
            "name": f"Test Guest Online {uuid.uuid4().hex[:6]}",
            "email": f"guest-online-{uuid.uuid4().hex[:8]}@example.com",
            "phone": "",
            "date": day_after,
            "time": "14:00",
            "duration": 45,
            "notes": "Testing online booking with meet.saysme.org",
            "location_type": "online",
            "use_saysme": True,
            "use_other": False,
            "other_meeting_text": "",
            "physical_address": "",
            "custom_room_name": room_name
        }
        
        response = requests.post(f"{BASE_URL}/api/booking/public/{slug}", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "success", "Booking should succeed"
        
        video_link = data.get("video_link")
        assert video_link is not None, "Online booking should have video_link"
        assert "meet.saysme.org" in video_link, f"Video link should contain meet.saysme.org: {video_link}"
        print(f"Public booking with meet.saysme.org created successfully. Video link: {video_link}")
    
    def test_public_booking_post_with_other_meeting_url(self):
        """POST /api/booking/public/{slug} with Other Meeting URL"""
        slug = TestBookingLocationFeatures.booking_slug
        if not slug:
            pytest.skip("No booking slug available")
        
        import datetime
        day_after = (datetime.datetime.now() + datetime.timedelta(days=3)).strftime("%Y-%m-%d")
        
        custom_url = "https://webex.com/meet/test-guest-meeting"
        payload = {
            "name": f"Test Guest Other {uuid.uuid4().hex[:6]}",
            "email": f"guest-other-{uuid.uuid4().hex[:8]}@example.com",
            "phone": "",
            "date": day_after,
            "time": "16:00",
            "duration": 30,
            "notes": "Testing other meeting URL booking",
            "location_type": "online",
            "use_saysme": False,
            "use_other": True,
            "other_meeting_text": custom_url,
            "physical_address": "",
            "custom_room_name": None
        }
        
        response = requests.post(f"{BASE_URL}/api/booking/public/{slug}", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "success", "Booking should succeed"
        
        video_link = data.get("video_link")
        assert video_link == custom_url, f"Video link should be custom URL: {video_link}"
        print(f"Public booking with other meeting URL created successfully. Video link: {video_link}")
    
    # ==================== MY BOOKINGS VERIFICATION ====================
    
    def test_my_bookings_includes_location_fields(self):
        """GET /api/booking/my-bookings returns bookings with location fields"""
        response = requests.get(f"{BASE_URL}/api/booking/my-bookings", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        bookings = response.json()
        if bookings:
            # Check first booking has location fields
            booking = bookings[0]
            # These fields should be present (may be empty strings)
            assert "location_type" in booking or "video_link" in booking, "Booking should have location-related fields"
            print(f"My bookings returned {len(bookings)} bookings with location fields")
        else:
            print("No bookings found to verify location fields")
    
    # ==================== ADMIN MEETINGS VERIFICATION ====================
    
    def test_admin_meetings_includes_location_fields(self):
        """GET /api/booking/admin/meetings returns meetings with location fields"""
        # Get admin users first
        users_response = requests.get(f"{BASE_URL}/api/booking/admin/users", headers=self.headers)
        if users_response.status_code != 200:
            pytest.skip("Could not get admin users")
        
        users = users_response.json()
        if not users:
            pytest.skip("No admin users found")
        
        user_ids = ",".join([u.get("id") for u in users[:3] if u.get("id")])
        
        response = requests.get(
            f"{BASE_URL}/api/booking/admin/meetings",
            params={"user_ids": user_ids},
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        meetings = response.json()
        if meetings:
            meeting = meetings[0]
            # Check location fields are present
            assert "location_type" in meeting, "Meeting should have location_type"
            assert "physical_address" in meeting, "Meeting should have physical_address"
            assert "video_link" in meeting, "Meeting should have video_link"
            assert "other_meeting_url" in meeting, "Meeting should have other_meeting_url"
            print(f"Admin meetings returned {len(meetings)} meetings with location fields")
        else:
            print("No admin meetings found to verify location fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
