"""
Booking Module Backend Tests
Tests for:
- GET /api/booking/settings - Load booking settings
- POST /api/booking/settings - Save booking settings
- GET /api/booking/link - Get booking link
- GET /api/booking/my-bookings - List user's bookings
- DELETE /api/booking/{id} - Cancel booking
- POST /api/booking/invite - Send meeting invite
- GET /api/booking/public/{slug} - Public booking page info
- GET /api/booking/public/{slug}/slots/{date} - Available slots
- POST /api/booking/public/{slug} - Create public booking (legacy)
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
API_URL = f"{BASE_URL}/api"

# Test credentials
ADMIN_EMAIL = "qa-admin-a2g@example.com"
ADMIN_PASSWORD = "TestPass123!"


class TestBookingModule:
    """Booking module endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.token = None
        self.booking_slug = None
        self.test_booking_id = None
        
    def _login(self):
        """Authenticate and get token"""
        response = self.session.post(f"{API_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access_token") or data.get("token")
            if self.token:
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            return True
        return False
    
    # ==================== AUTHENTICATED ENDPOINTS ====================
    
    def test_01_login_success(self):
        """Test admin login"""
        result = self._login()
        assert result, "Login failed"
        assert self.token is not None, "No token received"
        print(f"✓ Login successful, token received")
    
    def test_02_get_booking_settings(self):
        """Test GET /api/booking/settings - Load booking settings"""
        assert self._login(), "Login required"
        
        response = self.session.get(f"{API_URL}/booking/settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify exact module structure fields
        assert "enabled" in data, "Missing 'enabled' field"
        assert "availability" in data, "Missing 'availability' field"
        assert "meeting_lengths" in data, "Missing 'meeting_lengths' field"
        assert "default_length" in data, "Missing 'default_length' field"
        assert "buffer_minutes" in data, "Missing 'buffer_minutes' field"
        assert "advance_days" in data, "Missing 'advance_days' field"
        assert "timezone" in data, "Missing 'timezone' field"
        assert "video_meet_enabled" in data, "Missing 'video_meet_enabled' field"
        assert "video_meet_base_url" in data, "Missing 'video_meet_base_url' field"
        
        # Verify availability structure
        assert isinstance(data["availability"], list), "availability should be a list"
        if len(data["availability"]) > 0:
            slot = data["availability"][0]
            assert "day" in slot, "Availability slot missing 'day'"
            assert "start_time" in slot, "Availability slot missing 'start_time'"
            assert "end_time" in slot, "Availability slot missing 'end_time'"
            assert "enabled" in slot, "Availability slot missing 'enabled'"
        
        print(f"✓ GET /api/booking/settings - Settings loaded with {len(data['availability'])} availability slots")
    
    def test_03_save_booking_settings(self):
        """Test POST /api/booking/settings - Save booking settings"""
        assert self._login(), "Login required"
        
        # First get current settings
        get_response = self.session.get(f"{API_URL}/booking/settings")
        assert get_response.status_code == 200
        current = get_response.json()
        
        # Update settings with exact module structure
        updated_settings = {
            "enabled": True,
            "availability": [
                {"day": 1, "start_time": "09:00", "end_time": "17:00", "enabled": True},
                {"day": 2, "start_time": "09:00", "end_time": "17:00", "enabled": True},
                {"day": 3, "start_time": "09:00", "end_time": "17:00", "enabled": True},
                {"day": 4, "start_time": "09:00", "end_time": "17:00", "enabled": True},
                {"day": 5, "start_time": "09:00", "end_time": "17:00", "enabled": True},
                {"day": 6, "start_time": "10:00", "end_time": "14:00", "enabled": False},
                {"day": 0, "start_time": "10:00", "end_time": "14:00", "enabled": False},
            ],
            "meeting_lengths": [15, 30, 45, 60],
            "default_length": 30,
            "buffer_minutes": 15,
            "advance_days": 30,
            "timezone": "America/New_York",
            "video_meet_enabled": True,
            "video_meet_base_url": "https://meet.saysme.org"
        }
        
        response = self.session.post(f"{API_URL}/booking/settings", json=updated_settings)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "success" or "message" in data, "Expected success response"
        
        # Verify settings were saved by fetching again
        verify_response = self.session.get(f"{API_URL}/booking/settings")
        assert verify_response.status_code == 200
        verified = verify_response.json()
        assert verified["default_length"] == 30, "Settings not persisted correctly"
        
        print(f"✓ POST /api/booking/settings - Settings saved successfully")
    
    def test_04_get_booking_link(self):
        """Test GET /api/booking/link - Get booking link and URL"""
        assert self._login(), "Login required"
        
        response = self.session.get(f"{API_URL}/booking/link")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "booking_url" in data, "Missing 'booking_url' field"
        assert "slug" in data or "booking_slug" in data, "Missing slug field"
        
        self.booking_slug = data.get("slug") or data.get("booking_slug")
        assert self.booking_slug, "Booking slug is empty"
        
        # Verify URL format
        booking_url = data.get("booking_url", "")
        assert "/book/" in booking_url or "/booking/" in booking_url, "Invalid booking URL format"
        
        print(f"✓ GET /api/booking/link - Booking URL: {booking_url}")
        return self.booking_slug
    
    def test_05_get_my_bookings(self):
        """Test GET /api/booking/my-bookings - List user's bookings"""
        assert self._login(), "Login required"
        
        response = self.session.get(f"{API_URL}/booking/my-bookings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of bookings"
        
        # If there are bookings, verify structure
        if len(data) > 0:
            booking = data[0]
            # Check for expected fields
            expected_fields = ["id", "guest_name", "guest_email", "date", "time", "duration", "status"]
            for field in expected_fields:
                assert field in booking, f"Booking missing '{field}' field"
        
        print(f"✓ GET /api/booking/my-bookings - Found {len(data)} bookings")
    
    def test_06_send_meeting_invite(self):
        """Test POST /api/booking/invite - Send meeting invite"""
        assert self._login(), "Login required"
        
        # Create a meeting invite
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        invite_data = {
            "title": "TEST_Meeting_Invite",
            "date": tomorrow,
            "time": "10:00",
            "duration": 30,
            "description": "Test meeting description",
            "video_enabled": True,
            "custom_room_name": "test-meeting-room",
            "invitees": [
                {"type": "email", "value": "test-invitee@example.com"}
            ]
        }
        
        response = self.session.post(f"{API_URL}/booking/invite", json=invite_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "success", "Expected success status"
        assert "results" in data, "Missing 'results' field"
        
        # Check video link generation
        if invite_data["video_enabled"]:
            assert "video_link" in data, "Missing video_link when video_enabled=True"
            if data.get("video_link"):
                assert "meet.saysme.org" in data["video_link"] or "test-meeting-room" in data["video_link"], "Invalid video link"
        
        print(f"✓ POST /api/booking/invite - Invite sent, video_link: {data.get('video_link')}")
    
    # ==================== PUBLIC ENDPOINTS ====================
    
    def test_07_get_public_booking_page(self):
        """Test GET /api/booking/public/{slug} - Public booking page info"""
        # First get the booking slug
        assert self._login(), "Login required"
        link_response = self.session.get(f"{API_URL}/booking/link")
        assert link_response.status_code == 200
        slug = link_response.json().get("slug") or link_response.json().get("booking_slug")
        assert slug, "No booking slug found"
        
        # Now test public endpoint (no auth needed)
        public_session = requests.Session()
        public_session.headers.update({"Content-Type": "application/json"})
        
        response = public_session.get(f"{API_URL}/booking/public/{slug}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify public booking page data
        assert "user_name" in data, "Missing 'user_name' field"
        assert "availability" in data, "Missing 'availability' field"
        assert "meeting_lengths" in data, "Missing 'meeting_lengths' field"
        assert "default_length" in data, "Missing 'default_length' field"
        assert "video_meet_enabled" in data, "Missing 'video_meet_enabled' field"
        
        print(f"✓ GET /api/booking/public/{slug} - Public page loads for host: {data.get('user_name')}")
    
    def test_08_get_available_slots(self):
        """Test GET /api/booking/public/{slug}/slots/{date} - Available time slots"""
        # First get the booking slug
        assert self._login(), "Login required"
        link_response = self.session.get(f"{API_URL}/booking/link")
        assert link_response.status_code == 200
        slug = link_response.json().get("slug") or link_response.json().get("booking_slug")
        
        # Get slots for a weekday (Monday-Friday)
        # Find next Monday
        today = datetime.now()
        days_until_monday = (7 - today.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7
        next_monday = today + timedelta(days=days_until_monday)
        date_str = next_monday.strftime("%Y-%m-%d")
        
        public_session = requests.Session()
        public_session.headers.update({"Content-Type": "application/json"})
        
        response = public_session.get(f"{API_URL}/booking/public/{slug}/slots/{date_str}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "date" in data, "Missing 'date' field"
        assert "slots" in data, "Missing 'slots' field"
        assert isinstance(data["slots"], list), "slots should be a list"
        
        # If slots available, verify structure
        if len(data["slots"]) > 0:
            slot = data["slots"][0]
            assert "time" in slot, "Slot missing 'time' field"
            assert "display" in slot, "Slot missing 'display' field"
        
        print(f"✓ GET /api/booking/public/{slug}/slots/{date_str} - Found {len(data['slots'])} available slots")
    
    def test_09_create_public_booking(self):
        """Test POST /api/booking/public/{slug} - Create public booking (legacy)"""
        # First get the booking slug
        assert self._login(), "Login required"
        link_response = self.session.get(f"{API_URL}/booking/link")
        assert link_response.status_code == 200
        slug = link_response.json().get("slug") or link_response.json().get("booking_slug")
        
        # Find next Monday for booking
        today = datetime.now()
        days_until_monday = (7 - today.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7
        next_monday = today + timedelta(days=days_until_monday)
        date_str = next_monday.strftime("%Y-%m-%d")
        
        public_session = requests.Session()
        public_session.headers.update({"Content-Type": "application/json"})
        
        # Create booking
        booking_data = {
            "name": "TEST_Public_Booker",
            "email": "test-public-booker@example.com",
            "phone": "+1234567890",
            "date": date_str,
            "time": "10:00",
            "duration": 30,
            "notes": "Test booking from automated tests",
            "custom_room_name": "test-public-booking-room"
        }
        
        response = public_session.post(f"{API_URL}/booking/public/{slug}", json=booking_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Check booking was created
        assert "id" in data, "Missing booking 'id' field"
        assert data.get("guest_name") == "TEST_Public_Booker", "Guest name mismatch"
        assert data.get("status") in ["confirmed", "pending"], "Invalid booking status"
        
        self.test_booking_id = data.get("id")
        print(f"✓ POST /api/booking/public/{slug} - Booking created with ID: {self.test_booking_id}")
        return self.test_booking_id
    
    def test_10_cancel_booking(self):
        """Test DELETE /api/booking/{id} - Cancel booking"""
        assert self._login(), "Login required"
        
        # First create a booking to cancel
        link_response = self.session.get(f"{API_URL}/booking/link")
        slug = link_response.json().get("slug") or link_response.json().get("booking_slug")
        
        today = datetime.now()
        days_until_monday = (7 - today.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7
        next_monday = today + timedelta(days=days_until_monday)
        date_str = next_monday.strftime("%Y-%m-%d")
        
        public_session = requests.Session()
        public_session.headers.update({"Content-Type": "application/json"})
        
        booking_data = {
            "name": "TEST_Cancel_Booking",
            "email": "test-cancel@example.com",
            "date": date_str,
            "time": "11:00",
            "duration": 30
        }
        
        create_response = public_session.post(f"{API_URL}/booking/public/{slug}", json=booking_data)
        assert create_response.status_code == 200, f"Failed to create booking: {create_response.text}"
        booking_id = create_response.json().get("id")
        assert booking_id, "No booking ID returned"
        
        # Now cancel the booking (authenticated)
        cancel_response = self.session.delete(f"{API_URL}/booking/{booking_id}")
        assert cancel_response.status_code == 200, f"Expected 200, got {cancel_response.status_code}: {cancel_response.text}"
        
        data = cancel_response.json()
        assert data.get("status") == "cancelled", "Expected cancelled status"
        
        print(f"✓ DELETE /api/booking/{booking_id} - Booking cancelled successfully")
    
    def test_11_invalid_booking_slug_returns_404(self):
        """Test GET /api/booking/public/{invalid_slug} returns 404"""
        public_session = requests.Session()
        public_session.headers.update({"Content-Type": "application/json"})
        
        response = public_session.get(f"{API_URL}/booking/public/invalid-nonexistent-slug-12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        print(f"✓ Invalid booking slug returns 404 as expected")
    
    def test_12_booking_settings_unauthenticated_returns_401(self):
        """Test GET /api/booking/settings without auth returns 401/403"""
        public_session = requests.Session()
        public_session.headers.update({"Content-Type": "application/json"})
        
        response = public_session.get(f"{API_URL}/booking/settings")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        
        print(f"✓ Unauthenticated booking settings request returns {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
