"""
Tests for the newest Tours/Charters work:
- Activity SEO fields (seo_title, seo_description, seo_robots) persistence + public exposure
- Charter Company (Seller) full field CRUD (contact_email/phone/website/logo/commission/fareharbor_shortname)
- Seller delete blocked (400) when linked activities exist, allowed when none
"""
import os
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
        "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
    })
    if resp.status_code != 200:
        pytest.skip("Admin login failed - skipping authenticated tests")
    return resp.json().get("access_token")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestActivitySeoFields:
    @pytest.fixture(scope="class")
    def seo_seller_and_category(self, authenticated_client):
        seller = authenticated_client.post(f"{BASE_URL}/api/tours-charters/sellers", json={
            "name": "TEST_SEO Seller"
        }).json()
        category = authenticated_client.post(f"{BASE_URL}/api/tours-charters/categories", json={
            "name": "TEST_SEO Category"
        }).json()
        yield seller, category
        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/sellers/{seller['id']}")
        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/categories/{category['id']}")

    def test_create_activity_with_seo_fields_persists(self, authenticated_client, api_client, seo_seller_and_category):
        seller, category = seo_seller_and_category
        create_resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/activities", json={
            "title": "TEST_SEO Activity",
            "seller_id": seller["id"],
            "category_ids": [category["id"]],
            "status": "published",
            "seo_title": "Custom SEO Title Here",
            "seo_description": "Custom meta description for search engines.",
            "seo_robots": "noindex_nofollow",
        })
        assert create_resp.status_code == 200
        activity = create_resp.json()
        assert activity["seo_title"] == "Custom SEO Title Here"
        assert activity["seo_description"] == "Custom meta description for search engines."
        assert activity["seo_robots"] == "noindex_nofollow"
        activity_id = activity["id"]
        alias = activity["alias"]

        # GET (admin) to verify persistence
        admin_list = authenticated_client.get(f"{BASE_URL}/api/tours-charters/activities").json()
        found = next(a for a in admin_list if a["id"] == activity_id)
        assert found["seo_title"] == "Custom SEO Title Here"
        assert found["seo_robots"] == "noindex_nofollow"

        # Public detail endpoint should expose the same seo_* fields for frontend meta tag rendering
        # NOTE: status is 'published' but seo_robots=noindex_nofollow only controls <meta robots>, not visibility
        public_detail = api_client.get(f"{BASE_URL}/api/public/tours-charters/activities/{alias}")
        assert public_detail.status_code == 200
        pdata = public_detail.json()
        assert pdata["seo_title"] == "Custom SEO Title Here"
        assert pdata["seo_description"] == "Custom meta description for search engines."
        assert pdata["seo_robots"] == "noindex_nofollow"

        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/activities/{activity_id}")

    def test_update_activity_seo_fields_persists(self, authenticated_client, seo_seller_and_category):
        seller, category = seo_seller_and_category
        activity = authenticated_client.post(f"{BASE_URL}/api/tours-charters/activities", json={
            "title": "TEST_SEO Update Activity",
            "seller_id": seller["id"],
        }).json()
        activity_id = activity["id"]
        # default robots should be index_follow
        assert activity["seo_robots"] == "index_follow"

        update_resp = authenticated_client.put(f"{BASE_URL}/api/tours-charters/activities/{activity_id}", json={
            "seo_title": "Updated SEO Title",
            "seo_description": "Updated SEO description text.",
            "seo_robots": "index_nofollow",
        })
        assert update_resp.status_code == 200
        updated = update_resp.json()
        assert updated["seo_title"] == "Updated SEO Title"
        assert updated["seo_robots"] == "index_nofollow"

        # GET to re-verify persistence after update
        admin_list = authenticated_client.get(f"{BASE_URL}/api/tours-charters/activities").json()
        found = next(a for a in admin_list if a["id"] == activity_id)
        assert found["seo_description"] == "Updated SEO description text."
        assert found["seo_robots"] == "index_nofollow"

        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/activities/{activity_id}")

    def test_seo_fields_default_blank_when_not_provided(self, authenticated_client, seo_seller_and_category):
        seller, category = seo_seller_and_category
        activity = authenticated_client.post(f"{BASE_URL}/api/tours-charters/activities", json={
            "title": "TEST_SEO Default Activity",
            "seller_id": seller["id"],
        }).json()
        assert activity["seo_title"] == ""
        assert activity["seo_description"] == ""
        assert activity["seo_robots"] == "index_follow"
        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/activities/{activity['id']}")


class TestCharterCompanyFullFieldsCRUD:
    def test_create_charter_company_all_fields_persist(self, authenticated_client):
        payload = {
            "name": "TEST_Full Field Charter Co",
            "description": "A full-service charter company",
            "logo_url": "https://example.com/logo.png",
            "contact_email": "contact@fullfieldcharter.com",
            "contact_phone": "555-867-5309",
            "website": "https://fullfieldcharter.com",
            "commission_rate": 17.5,
            "fareharbor_shortname": "full-field-charter",
        }
        create_resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/sellers", json=payload)
        assert create_resp.status_code == 200
        seller = create_resp.json()
        for key, val in payload.items():
            assert seller[key] == val
        assert seller["is_active"] is True
        seller_id = seller["id"]

        # GET (list) to verify persistence
        list_resp = authenticated_client.get(f"{BASE_URL}/api/tours-charters/sellers")
        found = next(s for s in list_resp.json() if s["id"] == seller_id)
        assert found["contact_email"] == "contact@fullfieldcharter.com"
        assert found["commission_rate"] == 17.5
        assert found["fareharbor_shortname"] == "full-field-charter"

        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/sellers/{seller_id}")

    def test_update_charter_company_name_commission_status_persist(self, authenticated_client):
        seller = authenticated_client.post(f"{BASE_URL}/api/tours-charters/sellers", json={
            "name": "TEST_Editable Charter Co", "commission_rate": 5.0
        }).json()
        seller_id = seller["id"]

        update_resp = authenticated_client.put(f"{BASE_URL}/api/tours-charters/sellers/{seller_id}", json={
            "name": "TEST_Renamed Charter Co",
            "commission_rate": 22.0,
            "is_active": False,
        })
        assert update_resp.status_code == 200
        updated = update_resp.json()
        assert updated["name"] == "TEST_Renamed Charter Co"
        assert updated["commission_rate"] == 22.0
        assert updated["is_active"] is False

        # GET to verify persistence after "reload"
        list_resp = authenticated_client.get(f"{BASE_URL}/api/tours-charters/sellers")
        found = next(s for s in list_resp.json() if s["id"] == seller_id)
        assert found["name"] == "TEST_Renamed Charter Co"
        assert found["commission_rate"] == 22.0
        assert found["is_active"] is False

        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/sellers/{seller_id}")

    def test_delete_charter_company_with_linked_activity_blocked_400(self, authenticated_client):
        seller = authenticated_client.post(f"{BASE_URL}/api/tours-charters/sellers", json={
            "name": "TEST_Linked Charter Co"
        }).json()
        seller_id = seller["id"]
        activity = authenticated_client.post(f"{BASE_URL}/api/tours-charters/activities", json={
            "title": "TEST_Linked Activity", "seller_id": seller_id,
        }).json()
        activity_id = activity["id"]

        delete_resp = authenticated_client.delete(f"{BASE_URL}/api/tours-charters/sellers/{seller_id}")
        assert delete_resp.status_code == 400
        assert "detail" in delete_resp.json()

        # Verify seller was NOT actually removed (still present in list)
        list_resp = authenticated_client.get(f"{BASE_URL}/api/tours-charters/sellers")
        assert any(s["id"] == seller_id for s in list_resp.json())

        # cleanup: remove activity first, then seller should delete cleanly
        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/activities/{activity_id}")
        delete_resp2 = authenticated_client.delete(f"{BASE_URL}/api/tours-charters/sellers/{seller_id}")
        assert delete_resp2.status_code == 200

        list_resp2 = authenticated_client.get(f"{BASE_URL}/api/tours-charters/sellers")
        assert not any(s["id"] == seller_id for s in list_resp2.json())

    def test_delete_charter_company_no_activities_succeeds(self, authenticated_client):
        seller = authenticated_client.post(f"{BASE_URL}/api/tours-charters/sellers", json={
            "name": "TEST_Throwaway Charter Co"
        }).json()
        seller_id = seller["id"]
        delete_resp = authenticated_client.delete(f"{BASE_URL}/api/tours-charters/sellers/{seller_id}")
        assert delete_resp.status_code == 200

        list_resp = authenticated_client.get(f"{BASE_URL}/api/tours-charters/sellers")
        assert not any(s["id"] == seller_id for s in list_resp.json())
