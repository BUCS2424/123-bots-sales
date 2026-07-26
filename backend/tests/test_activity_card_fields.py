"""
Tests for the NEW Activity fields (location, price_from, short_description) added to
support the redesigned public excursion-card grid, and the enrichment of the public
activities list endpoint with seller_logo_url + effective_fareharbor_shortname
(needed for the card design + direct Book Now behavior).
"""
import pytest
import requests
import os

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
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD,
    })
    if response.status_code != 200:
        pytest.skip("Admin auth failed - skipping authenticated tests")
    return response.json().get("access_token")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


@pytest.fixture(scope="module")
def seed_seller_id(authenticated_client):
    r = authenticated_client.get(f"{BASE_URL}/api/tours-charters/sellers")
    assert r.status_code == 200
    sellers = r.json()
    match = [s for s in sellers if s["name"] == "Blue Dream Charters"]
    assert match, "Seed seller 'Blue Dream Charters' not found"
    return match[0]["id"]


class TestNewActivityFieldsCRUD:
    """location / price_from / short_description on Activity create + update, verified via GET"""

    def test_create_activity_with_new_fields_and_verify_persistence(self, authenticated_client, seed_seller_id):
        payload = {
            "title": "TEST_Card Fields Activity",
            "seller_id": seed_seller_id,
            "location": "Test Bay, Test Island",
            "price_from": "99",
            "short_description": "TEST short teaser text.",
            "description": "TEST full description text.",
            "duration": "2 Hours",
            "status": "published",
        }
        create_resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/activities", json=payload)
        assert create_resp.status_code == 200
        created = create_resp.json()
        assert created["location"] == "Test Bay, Test Island"
        assert created["price_from"] == "99"
        assert created["short_description"] == "TEST short teaser text."
        activity_id = created["id"]

        list_resp = authenticated_client.get(f"{BASE_URL}/api/tours-charters/activities")
        assert list_resp.status_code == 200
        fetched = next((a for a in list_resp.json() if a["id"] == activity_id), None)
        assert fetched is not None
        assert fetched["location"] == "Test Bay, Test Island"
        assert fetched["price_from"] == "99"
        assert fetched["short_description"] == "TEST short teaser text."

        # cleanup
        del_resp = authenticated_client.delete(f"{BASE_URL}/api/tours-charters/activities/{activity_id}")
        assert del_resp.status_code == 200

    def test_update_new_fields_and_verify_persistence(self, authenticated_client, seed_seller_id):
        create_resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/activities", json={
            "title": "TEST_Update Card Fields Activity",
            "seller_id": seed_seller_id,
        })
        activity_id = create_resp.json()["id"]

        update_resp = authenticated_client.put(
            f"{BASE_URL}/api/tours-charters/activities/{activity_id}",
            json={"location": "Updated Location", "price_from": "150", "short_description": "Updated teaser."},
        )
        assert update_resp.status_code == 200
        updated = update_resp.json()
        assert updated["location"] == "Updated Location"
        assert updated["price_from"] == "150"
        assert updated["short_description"] == "Updated teaser."

        list_resp = authenticated_client.get(f"{BASE_URL}/api/tours-charters/activities")
        fetched = next((a for a in list_resp.json() if a["id"] == activity_id), None)
        assert fetched["location"] == "Updated Location"
        assert fetched["price_from"] == "150"

        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/activities/{activity_id}")


class TestPublicActivitiesCardEnrichment:
    """public_list_activities must return seller_logo_url + effective_fareharbor_shortname per activity"""

    def test_public_list_activities_includes_seller_logo_and_shortname(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/public/tours-charters/activities", params={"category_slug": "boat-charters"})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        sunset_sail = next((a for a in data if a["alias"] == "sunset-sail"), None)
        assert sunset_sail is not None
        assert "seller_logo_url" in sunset_sail
        assert "effective_fareharbor_shortname" in sunset_sail
        assert sunset_sail["seller_name"] == "Blue Dream Charters"
        assert sunset_sail["seller_slug"] == "blue-dream-charters"
        assert sunset_sail["location"] == "St. Thomas, U.S. Virgin Islands"
        assert sunset_sail["price_from"] == "45"
        assert sunset_sail["short_description"]

    def test_public_list_activities_by_company_slug(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/public/tours-charters/activities", params={"seller_slug": "blue-dream-charters"})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert all(a["seller_slug"] == "blue-dream-charters" for a in data)

    def test_public_get_single_activity_includes_effective_fareharbor_shortname(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/public/tours-charters/activities/sunset-sail")
        assert resp.status_code == 200
        data = resp.json()
        assert "effective_fareharbor_shortname" in data
        assert data["seller"]["slug"] == "blue-dream-charters"
