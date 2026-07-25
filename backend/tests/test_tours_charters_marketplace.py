"""
Tests for the new 'Activity & Charter Marketplace' (Tours / Charters) module:
- Feature flag (activity_marketplace_enabled) get/set via admin_settings
- Admin CRUD: activity categories, sellers (charter companies), activities
- Dashboard stats
- Public read-only endpoints under /api/public/tours-charters/*
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


class TestFeatureFlag:
    def test_public_feature_flag_present(self):
        # Fresh, unauthenticated session - public storefront endpoint
        resp = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert resp.status_code == 200
        data = resp.json()
        assert "activity_marketplace_enabled" in data
        assert isinstance(data["activity_marketplace_enabled"], bool)

    def test_toggle_flag_on_and_off(self, authenticated_client):
        # get current flags first (admin endpoint, PUT requires full payload)
        get_resp = authenticated_client.get(f"{BASE_URL}/api/admin-settings/feature-flags")
        assert get_resp.status_code == 200
        current = get_resp.json()

        # Turn ON
        current["activity_marketplace_enabled"] = True
        put_resp = authenticated_client.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=current)
        assert put_resp.status_code == 200
        public_check = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert public_check.json()["activity_marketplace_enabled"] is True

        # Turn OFF
        current["activity_marketplace_enabled"] = False
        put_resp2 = authenticated_client.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=current)
        assert put_resp2.status_code == 200
        public_check2 = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert public_check2.json()["activity_marketplace_enabled"] is False

        # Re-enable at the end so the feature stays visible for continued use
        current["activity_marketplace_enabled"] = True
        put_resp3 = authenticated_client.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=current)
        assert put_resp3.status_code == 200
        final_check = requests.get(f"{BASE_URL}/api/settings/feature-flags")
        assert final_check.json()["activity_marketplace_enabled"] is True


class TestCategoriesCRUD:
    def test_create_get_update_delete_category(self, authenticated_client):
        create_resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/categories", json={
            "name": "TEST_Snorkeling Trips",
            "description": "Test category",
            "image_url": "",
            "sort_order": 1,
        })
        assert create_resp.status_code == 200
        cat = create_resp.json()
        assert cat["name"] == "TEST_Snorkeling Trips"
        assert cat["slug"]
        assert cat["is_active"] is True
        cat_id = cat["id"]

        list_resp = authenticated_client.get(f"{BASE_URL}/api/tours-charters/categories")
        assert list_resp.status_code == 200
        assert any(c["id"] == cat_id for c in list_resp.json())

        update_resp = authenticated_client.put(f"{BASE_URL}/api/tours-charters/categories/{cat_id}", json={
            "description": "Updated description"
        })
        assert update_resp.status_code == 200
        assert update_resp.json()["description"] == "Updated description"

        delete_resp = authenticated_client.delete(f"{BASE_URL}/api/tours-charters/categories/{cat_id}")
        assert delete_resp.status_code == 200
        assert delete_resp.json()["success"] is True

        list_resp2 = authenticated_client.get(f"{BASE_URL}/api/tours-charters/categories")
        assert not any(c["id"] == cat_id for c in list_resp2.json())

    def test_delete_nonexistent_category_404(self, authenticated_client):
        resp = authenticated_client.delete(f"{BASE_URL}/api/tours-charters/categories/does-not-exist")
        assert resp.status_code == 404


class TestSellersCRUD:
    def test_create_get_update_delete_seller(self, authenticated_client):
        create_resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/sellers", json={
            "name": "TEST_Ocean Adventures Co",
            "description": "Test seller",
            "commission_rate": 12.5,
        })
        assert create_resp.status_code == 200
        seller = create_resp.json()
        assert seller["name"] == "TEST_Ocean Adventures Co"
        assert seller["commission_rate"] == 12.5
        assert seller["slug"]
        seller_id = seller["id"]

        update_resp = authenticated_client.put(f"{BASE_URL}/api/tours-charters/sellers/{seller_id}", json={
            "commission_rate": 15.0
        })
        assert update_resp.status_code == 200
        assert update_resp.json()["commission_rate"] == 15.0

        delete_resp = authenticated_client.delete(f"{BASE_URL}/api/tours-charters/sellers/{seller_id}")
        assert delete_resp.status_code == 200

    def test_delete_seller_with_activity_blocked(self, authenticated_client):
        seller_resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/sellers", json={
            "name": "TEST_Blocked Delete Seller"
        })
        seller_id = seller_resp.json()["id"]
        activity_resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/activities", json={
            "name": "TEST_Blocking Activity",
            "seller_id": seller_id,
        })
        assert activity_resp.status_code == 200
        activity_id = activity_resp.json()["id"]

        delete_resp = authenticated_client.delete(f"{BASE_URL}/api/tours-charters/sellers/{seller_id}")
        assert delete_resp.status_code == 400

        # cleanup
        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/activities/{activity_id}")
        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/sellers/{seller_id}")


class TestActivitiesCRUD:
    @pytest.fixture(scope="class")
    def seller_and_category(self, authenticated_client):
        seller = authenticated_client.post(f"{BASE_URL}/api/tours-charters/sellers", json={
            "name": "TEST_Activities CRUD Seller"
        }).json()
        category = authenticated_client.post(f"{BASE_URL}/api/tours-charters/categories", json={
            "name": "TEST_Activities CRUD Category"
        }).json()
        yield seller, category
        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/sellers/{seller['id']}")
        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/categories/{category['id']}")

    def test_create_activity_invalid_seller_400(self, authenticated_client):
        resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/activities", json={
            "name": "TEST_Bad Seller Activity", "seller_id": "nonexistent-seller-id"
        })
        assert resp.status_code == 400

    def test_full_activity_lifecycle(self, authenticated_client, seller_and_category):
        seller, category = seller_and_category
        create_resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/activities", json={
            "name": "TEST_Full Lifecycle Activity",
            "seller_id": seller["id"],
            "category_ids": [category["id"]],
            "tags": ["family-friendly", "sunset"],
            "description": "A test activity",
            "price_display": "$99/person",
            "duration": "2 hours",
            "booking_type": "external_link",
            "booking_url": "https://fareharbor.com/embeds/book/test",
        })
        assert create_resp.status_code == 200
        activity = create_resp.json()
        assert activity["name"] == "TEST_Full Lifecycle Activity"
        assert activity["slug"]
        assert activity["booking_type"] == "external_link"
        activity_id = activity["id"]

        list_resp = authenticated_client.get(f"{BASE_URL}/api/tours-charters/activities")
        assert list_resp.status_code == 200
        found = next((a for a in list_resp.json() if a["id"] == activity_id), None)
        assert found is not None
        assert found["seller_name"] == seller["name"]

        # Filter by seller_id
        filtered = authenticated_client.get(f"{BASE_URL}/api/tours-charters/activities", params={"seller_id": seller["id"]})
        assert any(a["id"] == activity_id for a in filtered.json())

        # Update
        update_resp = authenticated_client.put(f"{BASE_URL}/api/tours-charters/activities/{activity_id}", json={
            "booking_type": "native_checkout"
        })
        assert update_resp.status_code == 200
        assert update_resp.json()["booking_type"] == "native_checkout"

        # Delete
        delete_resp = authenticated_client.delete(f"{BASE_URL}/api/tours-charters/activities/{activity_id}")
        assert delete_resp.status_code == 200
        list_resp2 = authenticated_client.get(f"{BASE_URL}/api/tours-charters/activities")
        assert not any(a["id"] == activity_id for a in list_resp2.json())

    def test_delete_category_pulls_from_activity(self, authenticated_client, seller_and_category):
        seller, category = seller_and_category
        # create a throwaway category+activity pair to verify $pull behavior
        extra_cat = authenticated_client.post(f"{BASE_URL}/api/tours-charters/categories", json={
            "name": "TEST_Throwaway Category"
        }).json()
        activity = authenticated_client.post(f"{BASE_URL}/api/tours-charters/activities", json={
            "name": "TEST_Category Pull Activity",
            "seller_id": seller["id"],
            "category_ids": [extra_cat["id"]],
        }).json()

        del_resp = authenticated_client.delete(f"{BASE_URL}/api/tours-charters/categories/{extra_cat['id']}")
        assert del_resp.status_code == 200

        activities = authenticated_client.get(f"{BASE_URL}/api/tours-charters/activities").json()
        found = next(a for a in activities if a["id"] == activity["id"])
        assert extra_cat["id"] not in found["category_ids"]

        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/activities/{activity['id']}")


class TestDashboardStats:
    def test_dashboard_stats_shape(self, authenticated_client):
        resp = authenticated_client.get(f"{BASE_URL}/api/tours-charters/dashboard/stats")
        assert resp.status_code == 200
        data = resp.json()
        for key in ["total_activities", "active_activities", "total_categories", "total_sellers", "total_bookings", "commission_revenue"]:
            assert key in data
        assert isinstance(data["total_activities"], int)
        assert data["total_bookings"] == 0
        assert data["commission_revenue"] == 0.0


class TestAuthGuards:
    def test_categories_requires_auth(self):
        resp = requests.get(f"{BASE_URL}/api/tours-charters/categories")
        assert resp.status_code == 401

    def test_activities_requires_auth(self):
        resp = requests.get(f"{BASE_URL}/api/tours-charters/activities")
        assert resp.status_code == 401

    def test_dashboard_requires_auth(self):
        resp = requests.get(f"{BASE_URL}/api/tours-charters/dashboard/stats")
        assert resp.status_code == 401


class TestPublicEndpoints:
    def test_public_categories_no_auth_needed(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/public/tours-charters/categories")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        # seeded 'Boat Charters' should be present
        boat = next((c for c in data if c["slug"] == "boat-charters"), None)
        assert boat is not None
        assert "activity_count" in boat

    def test_public_sellers_no_auth_needed(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/public/tours-charters/sellers")
        assert resp.status_code == 200
        data = resp.json()
        seller = next((s for s in data if s["slug"] == "blue-dream-charters"), None)
        assert seller is not None
        assert "activity_count" in seller

    def test_public_activities_filter_by_category_slug(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/public/tours-charters/activities", params={"category_slug": "boat-charters"})
        assert resp.status_code == 200
        data = resp.json()
        assert any(a["slug"] == "sunset-sail" for a in data)

    def test_public_activities_filter_by_seller_slug(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/public/tours-charters/activities", params={"seller_slug": "blue-dream-charters"})
        assert resp.status_code == 200
        data = resp.json()
        assert any(a["slug"] == "sunset-sail" for a in data)
        assert all("seller_name" in a and "seller_slug" in a for a in data)

    def test_public_activities_filter_by_unknown_slug_returns_empty(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/public/tours-charters/activities", params={"category_slug": "does-not-exist"})
        assert resp.status_code == 200
        assert resp.json() == []

    def test_public_activity_detail_by_slug(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/public/tours-charters/activities/sunset-sail")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"]
        assert data["seller"]["slug"] == "blue-dream-charters"
        assert isinstance(data["categories"], list)
        assert data["booking_type"] == "external_link"
        assert "fareharbor" in (data.get("booking_url") or "")

    def test_public_activity_detail_404_for_unknown_slug(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/public/tours-charters/activities/does-not-exist-slug")
        assert resp.status_code == 404

    def test_public_endpoints_do_not_return_inactive(self, authenticated_client, api_client):
        # create an inactive category/activity via admin, then confirm not shown publicly
        cat = authenticated_client.post(f"{BASE_URL}/api/tours-charters/categories", json={
            "name": "TEST_Inactive Category"
        }).json()
        authenticated_client.put(f"{BASE_URL}/api/tours-charters/categories/{cat['id']}", json={"is_active": False})

        public_cats = api_client.get(f"{BASE_URL}/api/public/tours-charters/categories").json()
        assert not any(c["id"] == cat["id"] for c in public_cats)

        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/categories/{cat['id']}")
