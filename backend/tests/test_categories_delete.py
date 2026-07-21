"""Regression tests for category delete + product-cleanup behavior."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bot-admin-hub-4.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "mel@a2gdesigns.com"
ADMIN_PASSWORD = "BigDaddy2016!!"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    return r.json().get("access_token") or r.json().get("token")


@pytest.fixture(scope="module")
def headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_login_ok(token):
    assert token


def test_categories_list_ok():
    r = requests.get(f"{API}/store/categories", timeout=20)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_delete_category_strips_products_and_no_respawn(headers):
    # Create a test category
    payload = {"name": "TEST_DeleteRespawn", "parent_id": None, "sort_order": 999, "is_enabled": True}
    r = requests.post(f"{API}/store/categories", json=payload, headers=headers, timeout=20)
    assert r.status_code in (200, 201), r.text[:200]
    cat = r.json()
    cat_id = cat["id"]
    cat_name = cat["name"]

    # Delete it
    r = requests.delete(f"{API}/store/categories/{cat_id}", headers=headers, timeout=30)
    assert r.status_code in (200, 204), r.text[:200]

    # Confirm no respawn
    r = requests.get(f"{API}/store/categories", timeout=20)
    names = [c["name"] for c in r.json()]
    assert cat_name not in names, f"Deleted category respawned: {names}"


def test_reorder_endpoint_ok(headers):
    r = requests.get(f"{API}/store/categories", timeout=20)
    cats = r.json()
    if len(cats) < 2:
        pytest.skip("Need >=2 categories to test reorder")
    items = [{"id": c["id"], "parent_id": c.get("parent_id"), "sort_order": i}
             for i, c in enumerate(cats)]
    r = requests.post(f"{API}/store/categories/reorder", json={"items": items}, headers=headers, timeout=20)
    assert r.status_code in (200, 204), r.text[:300]


def test_reorder_can_nest_category(headers):
    # Create two categories and nest one under the other via reorder
    r1 = requests.post(f"{API}/store/categories",
                       json={"name": "TEST_NestParent", "parent_id": None, "sort_order": 900, "is_enabled": True},
                       headers=headers, timeout=20)
    r2 = requests.post(f"{API}/store/categories",
                       json={"name": "TEST_NestChild", "parent_id": None, "sort_order": 901, "is_enabled": True},
                       headers=headers, timeout=20)
    assert r1.status_code in (200, 201) and r2.status_code in (200, 201)
    parent_id = r1.json()["id"]
    child_id = r2.json()["id"]
    try:
        payload = {"items": [{"id": child_id, "parent_id": parent_id, "sort_order": 0}]}
        r = requests.post(f"{API}/store/categories/reorder", json=payload, headers=headers, timeout=20)
        assert r.status_code in (200, 204), r.text[:300]

        # Verify persisted
        cats = requests.get(f"{API}/store/categories", timeout=20).json()
        child = next((c for c in cats if c["id"] == child_id), None)
        assert child is not None
        assert child.get("parent_id") == parent_id, f"Nesting not persisted: {child}"
    finally:
        requests.delete(f"{API}/store/categories/{child_id}", headers=headers, timeout=20)
        requests.delete(f"{API}/store/categories/{parent_id}", headers=headers, timeout=20)
