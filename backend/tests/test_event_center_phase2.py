"""Phase 2 Event Center public ticketing tests."""
import os
import re
import time
import pytest
import requests

def _load_backend_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if not v:
        try:
            with open("/app/frontend/.env") as f:
                for line in f:
                    if line.startswith("REACT_APP_BACKEND_URL="):
                        v = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break
        except Exception:
            pass
    if not v:
        raise RuntimeError("REACT_APP_BACKEND_URL not set")
    return v.rstrip("/")


BASE_URL = _load_backend_url()
ADMIN_EMAIL = "mel@a2gdesigns.com"
ADMIN_PASSWORD = "BigDaddy2016!!"
FREE_SLUG = "free-community-meetup"


@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json().get("access_token") or r.json().get("token")


@pytest.fixture(scope="session")
def free_event(s):
    r = s.get(f"{BASE_URL}/api/public/events/{FREE_SLUG}")
    assert r.status_code == 200, r.text
    return r.json()


# --- /config/paypal ---
def test_paypal_config_disabled(s):
    r = s.get(f"{BASE_URL}/api/public/events/config/paypal")
    assert r.status_code == 200
    data = r.json()
    assert "enabled" in data
    # PayPal intentionally not configured in this env
    assert data["enabled"] is False or data.get("available") is False


# --- Public events list and detail ---
def test_public_events_list_contains_free(s):
    r = s.get(f"{BASE_URL}/api/public/events/")
    assert r.status_code == 200
    slugs = [e.get("slug") for e in r.json()]
    assert FREE_SLUG in slugs


def test_public_event_detail(free_event):
    assert free_event["slug"] == FREE_SLUG
    tts = free_event.get("ticket_types") or []
    assert len(tts) >= 1
    free_tt = next((t for t in tts if float(t.get("price", 0)) == 0.0), None)
    assert free_tt is not None
    assert free_tt.get("id")


# --- FREE registration happy path ---
def test_free_registration_full_flow(s, free_event):
    free_tt = next(t for t in free_event["ticket_types"] if float(t.get("price", 0)) == 0.0)
    tt_id = free_tt["id"]
    sold_before = int(free_tt.get("sold", 0) or 0)

    custom = {}
    for f in free_event.get("custom_form_fields", []) or []:
        if f.get("type") == "select" and f.get("options"):
            custom[f["id"]] = f["options"][0]
        else:
            custom[f["id"]] = "TEST"

    payload = {
        "buyer_name": "TEST_Buyer",
        "buyer_email": "test_buyer@example.com",
        "buyer_phone": "555-0100",
        "items": [{"ticket_type_id": tt_id, "quantity": 2}],
        "custom_form_data": custom,
    }
    r = s.post(f"{BASE_URL}/api/public/events/{FREE_SLUG}/register", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "completed"
    order_id = body["order_id"]
    assert order_id

    # GET order returns order + attendees
    r2 = s.get(f"{BASE_URL}/api/public/events/orders/{order_id}")
    assert r2.status_code == 200, r2.text
    order_resp = r2.json()
    assert order_resp["order"]["payment_status"] == "completed"
    attendees = order_resp["attendees"]
    assert len(attendees) == 2
    codes = []
    for a in attendees:
        assert re.match(r"^EVT-[A-Z0-9]{4,8}-[A-Z0-9]{4,8}$", a["ticket_code"]), a["ticket_code"]
        codes.append(a["ticket_code"])
    assert len(set(codes)) == 2  # unique

    # Ticket lookup
    r3 = s.get(f"{BASE_URL}/api/public/events/ticket/{codes[0]}")
    assert r3.status_code == 200, r3.text
    tdata = r3.json()
    assert tdata["attendee"]["ticket_code"] == codes[0]
    assert tdata["event"]["title"] == free_event["title"]
    assert tdata["qr"].startswith("data:image/png;base64,")
    assert len(tdata["qr"]) > 100

    # ticket_types.sold incremented by 2
    r4 = s.get(f"{BASE_URL}/api/public/events/{FREE_SLUG}")
    assert r4.status_code == 200
    new_tt = next(t for t in r4.json()["ticket_types"] if t["id"] == tt_id)
    assert int(new_tt.get("sold", 0)) == sold_before + 2

    # Stash for next test
    pytest.SHARED = {"order_id": order_id, "ticket_code": codes[0], "attendee_id": attendees[0]["id"]}


# --- Paid path returns 503 gracefully ---
def test_paid_path_returns_503(s, admin_token):
    # Create a paid event via admin
    headers = {"Authorization": f"Bearer {admin_token}"}
    paid_event = {
        "title": "TEST_Phase2_Paid_Event",
        "status": "on_sale",
        "start_datetime": "2026-12-31T20:00:00+00:00",
        "timezone": "America/Denver",
        "capacity": 50,
        "ticket_types": [{"name": "GA", "price": 10.0, "currency": "USD", "quantity": 50, "is_active": True}],
        "custom_form_fields": [],
    }
    r = s.post(f"{BASE_URL}/api/events", json=paid_event, headers=headers)
    assert r.status_code in (200, 201), r.text
    ev = r.json()
    slug = ev["slug"]
    tt_id = ev["ticket_types"][0]["id"]

    try:
        payload = {
            "buyer_name": "TEST_Paid",
            "buyer_email": "paid@example.com",
            "items": [{"ticket_type_id": tt_id, "quantity": 1}],
        }
        r2 = s.post(f"{BASE_URL}/api/public/events/{slug}/register", json=payload)
        assert r2.status_code == 503, f"Expected 503, got {r2.status_code}: {r2.text}"
        body = r2.json()
        msg = (body.get("detail") or "").lower()
        assert "available" in msg or "configured" in msg, msg
    finally:
        # cleanup
        s.delete(f"{BASE_URL}/api/events/{ev['id']}", headers=headers)


# --- Admin resend ---
def test_admin_resend_ticket(s, admin_token):
    att_id = getattr(pytest, "SHARED", {}).get("attendee_id")
    if not att_id:
        pytest.skip("Attendee id not available")
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = s.post(f"{BASE_URL}/api/events/attendees/{att_id}/resend", headers=headers)
    # SMTP may be unconfigured but endpoint should still return success (wrapped try/except per spec)
    assert r.status_code == 200, r.text
    assert r.json().get("success") is True


# --- Door verify ---
def test_door_verify_real_ticket(s, admin_token):
    code = getattr(pytest, "SHARED", {}).get("ticket_code")
    if not code:
        pytest.skip("Ticket code not available")
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = s.get(f"{BASE_URL}/api/events/verify/{code}", headers=headers)
    assert r.status_code == 200, r.text
    body = r.json()
    # Phase 1 verify returns attendee + event info
    assert body.get("ticket_code") == code or body.get("attendee", {}).get("ticket_code") == code or "attendee" in body or "name" in body
