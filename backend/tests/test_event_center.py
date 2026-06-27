"""Backend tests for Event Center module (Phase 1)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://bot-catalog-preview.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "mel@a2gdesigns.com"
ADMIN_PASSWORD = "BigDaddy2016!!"


@pytest.fixture(scope="session")
def admin_token():
    # Try multiple known login endpoints
    for path in ["/api/auth/login", "/api/login", "/api/users/login"]:
        r = requests.post(f"{BASE_URL}{path}", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        if r.status_code == 200:
            data = r.json()
            token = data.get("access_token") or data.get("token") or data.get("session_token")
            if token:
                return token
    pytest.skip("Could not obtain admin token")


@pytest.fixture(scope="session")
def headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def state():
    return {}


# -------- feature flag (public) --------
def test_public_feature_flags_events_enabled():
    r = requests.get(f"{BASE_URL}/api/settings/feature-flags")
    assert r.status_code == 200, r.text
    data = r.json()
    assert "events_enabled" in data, f"events_enabled missing in {data}"


# -------- Categories CRUD --------
def test_category_crud(headers, state):
    # create
    r = requests.post(f"{BASE_URL}/api/events/categories", headers=headers,
                      json={"name": "TEST_Conference", "color": "#ff0000", "description": "test"})
    assert r.status_code == 200, r.text
    cat = r.json()
    assert cat["name"] == "TEST_Conference"
    assert cat["color"] == "#ff0000"
    assert "id" in cat and "slug" in cat
    state["cat_id"] = cat["id"]

    # list
    r = requests.get(f"{BASE_URL}/api/events/categories", headers=headers)
    assert r.status_code == 200
    assert any(c["id"] == state["cat_id"] for c in r.json())

    # update
    r = requests.put(f"{BASE_URL}/api/events/categories/{state['cat_id']}", headers=headers,
                     json={"name": "TEST_Workshop", "color": "#00ff00"})
    assert r.status_code == 200, r.text
    assert r.json()["name"] == "TEST_Workshop"


def test_category_requires_auth():
    r = requests.get(f"{BASE_URL}/api/events/categories")
    assert r.status_code == 401


# -------- Venues CRUD --------
def test_venue_crud(headers, state):
    r = requests.post(f"{BASE_URL}/api/events/venues", headers=headers,
                      json={"name": "TEST_Venue", "city": "Denver", "capacity": 500,
                            "images": ["https://example.com/v.jpg"]})
    assert r.status_code == 200, r.text
    v = r.json()
    assert v["name"] == "TEST_Venue"
    assert v["capacity"] == 500
    assert v["images"] == ["https://example.com/v.jpg"]
    state["venue_id"] = v["id"]

    r = requests.get(f"{BASE_URL}/api/events/venues", headers=headers)
    assert r.status_code == 200
    assert any(x["id"] == state["venue_id"] for x in r.json())

    r = requests.put(f"{BASE_URL}/api/events/venues/{state['venue_id']}", headers=headers,
                     json={"capacity": 750})
    assert r.status_code == 200
    assert r.json()["capacity"] == 750


# -------- Events CRUD --------
def test_event_create_with_ticket_types(headers, state):
    payload = {
        "title": "TEST_Concert Night",
        "status": "on_sale",
        "capacity": 200,
        "start_datetime": "2026-06-01T20:00:00Z",
        "venue_id": state.get("venue_id"),
        "category_id": state.get("cat_id"),
        "ticket_background_url": "https://example.com/bg.jpg",
        "ticket_tagline": "BE READY",
        "ticket_types": [
            {"name": "General", "price": 25.0, "quantity": 100},
            {"name": "VIP", "price": 75.0, "quantity": 50},
        ],
        "custom_form_fields": [
            {"label": "Shirt Size", "type": "select", "required": True, "options": ["S", "M", "L"]}
        ],
    }
    r = requests.post(f"{BASE_URL}/api/events", headers=headers, json=payload)
    assert r.status_code == 200, r.text
    ev = r.json()
    assert ev["title"] == payload["title"]
    assert ev.get("slug"), "slug missing"
    assert "concert-night" in ev["slug"]
    assert len(ev["ticket_types"]) == 2
    for tt in ev["ticket_types"]:
        assert tt.get("id"), "ticket_type.id auto-assigned missing"
    for f in ev["custom_form_fields"]:
        assert f.get("id"), "custom_form_field.id auto-assigned missing"
    state["event_id"] = ev["id"]
    state["ticket_type_id"] = ev["ticket_types"][0]["id"]

    # GET by id
    r = requests.get(f"{BASE_URL}/api/events/{ev['id']}", headers=headers)
    assert r.status_code == 200
    assert r.json()["title"] == payload["title"]


def test_event_list_filters(headers, state):
    r = requests.get(f"{BASE_URL}/api/events", headers=headers)
    assert r.status_code == 200
    assert any(e["id"] == state["event_id"] for e in r.json())

    r = requests.get(f"{BASE_URL}/api/events?status=on_sale", headers=headers)
    assert r.status_code == 200
    assert all(e["status"] == "on_sale" for e in r.json())

    r = requests.get(f"{BASE_URL}/api/events?search=Concert", headers=headers)
    assert r.status_code == 200
    assert any(e["id"] == state["event_id"] for e in r.json())


def test_event_update(headers, state):
    r = requests.put(f"{BASE_URL}/api/events/{state['event_id']}", headers=headers,
                     json={"capacity": 300, "status": "live"})
    assert r.status_code == 200
    assert r.json()["capacity"] == 300
    assert r.json()["status"] == "live"


# -------- Dashboard stats --------
def test_dashboard_stats(headers):
    r = requests.get(f"{BASE_URL}/api/events/dashboard/stats", headers=headers)
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ["upcoming_events", "live_events", "tickets_sold", "total_revenue",
              "attendance_rate", "sales_trend", "upcoming_list"]:
        assert k in d, f"missing {k}"
    assert isinstance(d["sales_trend"], list)
    assert len(d["sales_trend"]) == 12
    for entry in d["sales_trend"]:
        assert "label" in entry and "value" in entry


# -------- Attendees & Check-in --------
def test_attendee_lifecycle(headers, state):
    payload = {
        "event_id": state["event_id"],
        "name": "TEST_Alice",
        "email": "test_alice@example.com",
        "ticket_type_id": state["ticket_type_id"],
        "quantity": 2,
        "amount_paid": 50.0,
    }
    r = requests.post(f"{BASE_URL}/api/events/attendees", headers=headers, json=payload)
    assert r.status_code == 200, r.text
    a = r.json()
    assert a["ticket_code"].startswith("EVT-")
    assert a["name"] == "TEST_Alice"
    state["attendee_id"] = a["id"]
    state["ticket_code"] = a["ticket_code"]

    # verify sold counter incremented
    r = requests.get(f"{BASE_URL}/api/events/{state['event_id']}", headers=headers)
    tt = next(t for t in r.json()["ticket_types"] if t["id"] == state["ticket_type_id"])
    assert tt["sold"] >= 2

    # list
    r = requests.get(f"{BASE_URL}/api/events/attendees/list", headers=headers,
                     params={"event_id": state["event_id"]})
    assert r.status_code == 200
    assert any(x["id"] == state["attendee_id"] for x in r.json())

    # search
    r = requests.get(f"{BASE_URL}/api/events/attendees/list", headers=headers,
                     params={"search": "TEST_Alice"})
    assert r.status_code == 200
    assert any(x["id"] == state["attendee_id"] for x in r.json())

    # checkin
    r = requests.post(f"{BASE_URL}/api/events/attendees/{state['attendee_id']}/checkin", headers=headers)
    assert r.status_code == 200
    assert r.json()["already"] is False
    # second checkin -> already=true
    r = requests.post(f"{BASE_URL}/api/events/attendees/{state['attendee_id']}/checkin", headers=headers)
    assert r.status_code == 200
    assert r.json()["already"] is True

    # verify by code
    r = requests.get(f"{BASE_URL}/api/events/verify/{state['ticket_code']}", headers=headers)
    assert r.status_code == 200
    assert r.json()["id"] == state["attendee_id"]
    assert r.json()["event_title"]


# -------- Cleanup --------
def test_zz_cleanup(headers, state):
    if state.get("attendee_id"):
        r = requests.delete(f"{BASE_URL}/api/events/attendees/{state['attendee_id']}", headers=headers)
        assert r.status_code == 200
    if state.get("event_id"):
        r = requests.delete(f"{BASE_URL}/api/events/{state['event_id']}", headers=headers)
        assert r.status_code == 200
    if state.get("venue_id"):
        r = requests.delete(f"{BASE_URL}/api/events/venues/{state['venue_id']}", headers=headers)
        assert r.status_code == 200
    if state.get("cat_id"):
        r = requests.delete(f"{BASE_URL}/api/events/categories/{state['cat_id']}", headers=headers)
        assert r.status_code == 200
