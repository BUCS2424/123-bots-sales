"""Tests for shipping settings save + test-connection body-vs-stored key resolution.

Covers the fix where POST /api/shipping/test-connection/{provider} accepts optional
credentials in the request body so a freshly-typed key can be tested before saving.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"

FAKE_SHIPPO_KEY = "shippo_test_TESTKEY123ABC"
FAKE_EASYPOST_KEY = "EZTK_TESTKEY123"
FAKE_SS_KEY = "ss_test_key_123"
FAKE_SS_SECRET = "ss_test_secret_456"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(autouse=True)
def _reset_settings(session):
    """Reset shipping settings before and after each test to clean state."""
    payload = {
        "shippo_api_key": "",
        "shippo_enabled": False,
        "easypost_api_key": "",
        "easypost_enabled": False,
        "shipstation_api_key": "",
        "shipstation_api_secret": "",
        "shipstation_enabled": False,
        "active_provider": "",
    }
    session.put(f"{API}/shipping/settings", json=payload)
    yield
    session.put(f"{API}/shipping/settings", json=payload)


class TestShippingSettingsSaveAndMask:
    def test_put_saves_and_get_returns_masked_key(self, session):
        put_resp = session.put(
            f"{API}/shipping/settings",
            json={
                "shippo_api_key": FAKE_SHIPPO_KEY,
                "shippo_enabled": True,
            },
        )
        assert put_resp.status_code == 200, put_resp.text

        get_resp = session.get(f"{API}/shipping/settings")
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data.get("shippo_enabled") is True
        masked = data.get("shippo_api_key", "")
        assert masked.startswith("••••"), f"expected mask, got {masked!r}"
        assert masked.endswith(FAKE_SHIPPO_KEY[-4:]), masked

    def test_put_with_masked_key_does_not_overwrite_stored_key(self, session):
        # Save real key first
        session.put(
            f"{API}/shipping/settings",
            json={"shippo_api_key": FAKE_SHIPPO_KEY, "shippo_enabled": True},
        )

        # Send masked value back (simulating frontend re-submitting form)
        masked_value = "••••••••" + FAKE_SHIPPO_KEY[-4:]
        put2 = session.put(
            f"{API}/shipping/settings",
            json={"shippo_api_key": masked_value, "shippo_enabled": True},
        )
        assert put2.status_code == 200

        # Test-connection with no body -> should still find stored key (returns 200 not 400)
        r = session.post(f"{API}/shipping/test-connection/shippo", json={})
        assert r.status_code == 200, f"stored key was overwritten: {r.status_code} {r.text}"
        body = r.json()
        assert body.get("provider") == "shippo"
        assert "success" in body


class TestTestConnectionBodyResolution:
    def test_shippo_body_key_returns_200_without_saving(self, session):
        """Primary assertion: typed-but-unsaved key returns 200 (not 400)."""
        r = session.post(
            f"{API}/shipping/test-connection/shippo",
            json={"shippo_api_key": FAKE_SHIPPO_KEY},
        )
        assert r.status_code == 200, (
            f"Expected 200 with body key; got {r.status_code}: {r.text}"
        )
        data = r.json()
        assert data.get("provider") == "shippo"
        assert "success" in data
        assert isinstance(data["success"], bool)

    def test_shippo_no_body_no_stored_key_returns_400(self, session):
        r = session.post(f"{API}/shipping/test-connection/shippo")
        assert r.status_code == 400
        detail = r.json().get("detail", "")
        assert "not configured" in detail.lower()

    def test_shippo_masked_body_falls_back_to_stored(self, session):
        # Store a real key
        session.put(
            f"{API}/shipping/settings",
            json={"shippo_api_key": FAKE_SHIPPO_KEY, "shippo_enabled": True},
        )
        # Send masked body -> should use stored key, not 400
        masked = "••••••••" + FAKE_SHIPPO_KEY[-4:]
        r = session.post(
            f"{API}/shipping/test-connection/shippo",
            json={"shippo_api_key": masked},
        )
        assert r.status_code == 200, r.text
        assert r.json().get("provider") == "shippo"

    def test_shippo_empty_body_string_no_stored_returns_400(self, session):
        r = session.post(
            f"{API}/shipping/test-connection/shippo",
            json={"shippo_api_key": ""},
        )
        assert r.status_code == 400


class TestOtherProvidersRegression:
    def test_easypost_body_key_returns_200(self, session):
        r = session.post(
            f"{API}/shipping/test-connection/easypost",
            json={"easypost_api_key": FAKE_EASYPOST_KEY},
        )
        assert r.status_code == 200, r.text
        assert r.json().get("provider") == "easypost"

    def test_easypost_no_creds_returns_400(self, session):
        r = session.post(f"{API}/shipping/test-connection/easypost", json={})
        assert r.status_code == 400

    def test_shipstation_body_creds_returns_200(self, session):
        r = session.post(
            f"{API}/shipping/test-connection/shipstation",
            json={
                "shipstation_api_key": FAKE_SS_KEY,
                "shipstation_api_secret": FAKE_SS_SECRET,
            },
        )
        assert r.status_code == 200, r.text
        assert r.json().get("provider") == "shipstation"

    def test_shipstation_missing_secret_returns_400(self, session):
        r = session.post(
            f"{API}/shipping/test-connection/shipstation",
            json={"shipstation_api_key": FAKE_SS_KEY},
        )
        assert r.status_code == 400

    def test_stamps_body_creds_returns_200(self, session):
        r = session.post(
            f"{API}/shipping/test-connection/stamps",
            json={
                "stamps_integration_id": "int123",
                "stamps_username": "u",
                "stamps_password": "p",
            },
        )
        assert r.status_code == 200, r.text
        assert r.json().get("provider") == "stamps"

    def test_invalid_provider_returns_400(self, session):
        r = session.post(f"{API}/shipping/test-connection/bogus", json={})
        assert r.status_code == 400
