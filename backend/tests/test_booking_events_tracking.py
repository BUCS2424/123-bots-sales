"""
Tests for the new Book Now funnel tracking feature:
- POST /api/public/tours-charters/booking-events (public, no auth)
- GET /api/tours-charters/booking-events/summary?days=N (admin auth required)
Also spot-checks the public activities listing endpoint used by the new
white/3-col ActivityListPage redesign (location/duration fields used for
the new dropdown filters).
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
ADMIN_EMAIL = "mel@a2gdesigns.com"
ADMIN_PASSWORD = "BigDaddy2016!!"


@pytest.fixture(scope="module")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD,
    })
    if resp.status_code != 200:
        pytest.skip("Admin auth failed - skipping authenticated tests")
    return resp.json().get("access_token")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


@pytest.fixture(scope="module")
def sunset_sail_activity(api_client):
    resp = api_client.get(f"{BASE_URL}/api/public/tours-charters/activities")
    assert resp.status_code == 200
    activities = resp.json()
    match = next((a for a in activities if a.get("alias") == "sunset-sail"), None)
    assert match is not None, "Seed activity 'Sunset Sail' (alias sunset-sail) not found"
    return match


class TestPublicActivitiesListingFields:
    """Fields needed by the new white/3-col card grid + dropdown filters"""

    def test_sunset_sail_has_card_fields(self, sunset_sail_activity):
        a = sunset_sail_activity
        assert a["title"] == "Sunset Sail"
        assert a["duration"] == "4 Hours"
        assert a["location"] == "St. Thomas, U.S. Virgin Islands"
        assert a["price_from"] == "45"
        assert a["seller_name"] == "Blue Dream Charters"
        assert a["seller_slug"] == "blue-dream-charters"
        assert a["booking_provider"] == "generic"
        assert a["booking_url"]

    def test_category_filtered_listing_returns_activity(self, api_client, sunset_sail_activity):
        resp = api_client.get(f"{BASE_URL}/api/public/tours-charters/activities", params={
            "category_slug": "boat-charters"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert any(a["alias"] == "sunset-sail" for a in data)

    def test_seller_filtered_listing_returns_activity(self, api_client, sunset_sail_activity):
        resp = api_client.get(f"{BASE_URL}/api/public/tours-charters/activities", params={
            "seller_slug": "blue-dream-charters"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert any(a["alias"] == "sunset-sail" for a in data)


class TestBookingEventTrackingPublic:
    """POST /api/public/tours-charters/booking-events - no auth required"""

    def test_track_book_now_click_event(self, api_client, sunset_sail_activity):
        session_id = f"TEST_sess_{uuid.uuid4().hex[:8]}"
        payload = {
            "activity_id": sunset_sail_activity["id"],
            "activity_title": sunset_sail_activity["title"],
            "seller_id": sunset_sail_activity["seller_id"],
            "seller_name": sunset_sail_activity["seller_name"],
            "booking_provider": sunset_sail_activity["booking_provider"],
            "event_type": "book_now_click",
            "page_context": "list",
            "session_id": session_id,
        }
        resp = api_client.post(f"{BASE_URL}/api/public/tours-charters/booking-events", json=payload)
        assert resp.status_code == 200
        assert resp.json().get("success") is True

    def test_track_full_funnel_sequence_external_redirect(self, api_client, sunset_sail_activity):
        """click -> external_redirect (matches generic booking_provider flow)"""
        session_id = f"TEST_sess_{uuid.uuid4().hex[:8]}"
        base = {
            "activity_id": sunset_sail_activity["id"],
            "activity_title": sunset_sail_activity["title"],
            "seller_id": sunset_sail_activity["seller_id"],
            "seller_name": sunset_sail_activity["seller_name"],
            "booking_provider": "generic",
            "page_context": "list",
            "session_id": session_id,
        }
        r1 = api_client.post(f"{BASE_URL}/api/public/tours-charters/booking-events",
                              json={**base, "event_type": "book_now_click"})
        r2 = api_client.post(f"{BASE_URL}/api/public/tours-charters/booking-events",
                              json={**base, "event_type": "external_redirect"})
        assert r1.status_code == 200
        assert r2.status_code == 200

    def test_track_full_funnel_sequence_drawer_with_duration(self, api_client, sunset_sail_activity):
        """click -> drawer_opened -> drawer_closed with duration_seconds (engagement proxy)"""
        session_id = f"TEST_sess_{uuid.uuid4().hex[:8]}"
        base = {
            "activity_id": sunset_sail_activity["id"],
            "activity_title": sunset_sail_activity["title"],
            "seller_id": sunset_sail_activity["seller_id"],
            "seller_name": sunset_sail_activity["seller_name"],
            "booking_provider": "fareharbor",
            "page_context": "detail",
            "session_id": session_id,
        }
        r1 = api_client.post(f"{BASE_URL}/api/public/tours-charters/booking-events",
                              json={**base, "event_type": "book_now_click"})
        r2 = api_client.post(f"{BASE_URL}/api/public/tours-charters/booking-events",
                              json={**base, "event_type": "drawer_opened"})
        r3 = api_client.post(f"{BASE_URL}/api/public/tours-charters/booking-events",
                              json={**base, "event_type": "drawer_closed", "duration_seconds": 25.5})
        assert r1.status_code == 200 and r2.status_code == 200 and r3.status_code == 200
        self._last_session_id = session_id

    def test_missing_required_field_activity_id_rejected(self, api_client):
        resp = api_client.post(f"{BASE_URL}/api/public/tours-charters/booking-events", json={
            "event_type": "book_now_click",
        })
        assert resp.status_code == 422  # Pydantic validation error - activity_id required


class TestBookingEventsSummaryAdmin:
    """GET /api/tours-charters/booking-events/summary?days=N - admin auth required"""

    def test_summary_requires_auth(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/tours-charters/booking-events/summary")
        assert resp.status_code in (401, 403)

    def test_summary_returns_expected_shape(self, authenticated_client):
        resp = authenticated_client.get(f"{BASE_URL}/api/tours-charters/booking-events/summary", params={"days": 30})
        assert resp.status_code == 200
        data = resp.json()
        for key in ["total_clicks", "drawer_opened", "drawer_closed", "external_redirects", "engaged_20s_plus", "recent_events"]:
            assert key in data
        assert isinstance(data["total_clicks"], int)
        assert isinstance(data["recent_events"], list)

    def test_summary_reflects_newly_tracked_events(self, authenticated_client, api_client, sunset_sail_activity):
        # Get baseline
        before = authenticated_client.get(f"{BASE_URL}/api/tours-charters/booking-events/summary", params={"days": 1}).json()
        base_clicks = before["total_clicks"]

        session_id = f"TEST_sess_{uuid.uuid4().hex[:8]}"
        api_client.post(f"{BASE_URL}/api/public/tours-charters/booking-events", json={
            "activity_id": sunset_sail_activity["id"],
            "activity_title": sunset_sail_activity["title"],
            "seller_id": sunset_sail_activity["seller_id"],
            "seller_name": sunset_sail_activity["seller_name"],
            "booking_provider": "generic",
            "event_type": "book_now_click",
            "page_context": "list",
            "session_id": session_id,
        })
        time.sleep(0.5)

        after = authenticated_client.get(f"{BASE_URL}/api/tours-charters/booking-events/summary", params={"days": 1}).json()
        assert after["total_clicks"] == base_clicks + 1

        # Verify the specific event appears in recent_events with correct fields
        found = next((e for e in after["recent_events"] if e.get("session_id") == session_id), None)
        assert found is not None
        assert found["activity_id"] == sunset_sail_activity["id"]
        assert found["event_type"] == "book_now_click"

    def test_engaged_20s_plus_counts_only_long_durations(self, authenticated_client, api_client, sunset_sail_activity):
        short_session = f"TEST_sess_{uuid.uuid4().hex[:8]}"
        long_session = f"TEST_sess_{uuid.uuid4().hex[:8]}"
        base = {
            "activity_id": sunset_sail_activity["id"],
            "activity_title": sunset_sail_activity["title"],
            "seller_id": sunset_sail_activity["seller_id"],
            "seller_name": sunset_sail_activity["seller_name"],
            "booking_provider": "fareharbor",
            "page_context": "detail",
        }
        before = authenticated_client.get(f"{BASE_URL}/api/tours-charters/booking-events/summary", params={"days": 1}).json()
        base_engaged = before["engaged_20s_plus"]

        api_client.post(f"{BASE_URL}/api/public/tours-charters/booking-events",
                         json={**base, "session_id": short_session, "event_type": "drawer_closed", "duration_seconds": 5.0})
        api_client.post(f"{BASE_URL}/api/public/tours-charters/booking-events",
                         json={**base, "session_id": long_session, "event_type": "drawer_closed", "duration_seconds": 45.0})
        time.sleep(0.5)

        after = authenticated_client.get(f"{BASE_URL}/api/tours-charters/booking-events/summary", params={"days": 1}).json()
        # Only the 45s one should count towards engaged, the 5s one should not
        assert after["engaged_20s_plus"] == base_engaged + 1
