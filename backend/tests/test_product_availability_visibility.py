"""
Regression tests for the bug fix: 'Product availability' (in_stock) toggle
must remove/hide products from the public storefront, same as 'Visibility
on Live Site' (is_visible) toggle.

Covers: GET /api/store/products, /api/store/products/priced,
/api/store/products/{id}, /api/store/products/seo/{seo_path}
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
def admin_token(api_client):
    resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if resp.status_code != 200:
        pytest.skip("Admin auth failed - skipping authenticated tests")
    return resp.json()["access_token"]


@pytest.fixture(scope="module")
def authenticated_client(admin_token):
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}"
    })
    return session


@pytest.fixture(scope="module")
def target_product(authenticated_client):
    """Fetch PUDU CC1 PRO product (only product in catalog) as admin."""
    resp = authenticated_client.get(f"{BASE_URL}/api/store/products")
    assert resp.status_code == 200
    products = resp.json()
    pudu = next((p for p in products if p.get("sku") == "pudu-cc1-pro"), None)
    assert pudu is not None, "PUDU CC1 PRO product not found in catalog"
    return pudu


@pytest.fixture
def restore_product_state(authenticated_client, target_product):
    """Ensure product is restored to in_stock=True, is_visible=True after each test."""
    yield
    authenticated_client.put(
        f"{BASE_URL}/api/store/products/{target_product['id']}",
        json={"in_stock": True, "is_visible": True}
    )


class TestProductAvailabilityToggle:
    """TEST 1 & 2 & 3: Disabling in_stock removes product from public store + 404 on direct fetch"""

    def test_admin_can_disable_product_availability(self, authenticated_client, target_product, restore_product_state):
        product_id = target_product["id"]
        resp = authenticated_client.put(
            f"{BASE_URL}/api/store/products/{product_id}",
            json={"in_stock": False}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["in_stock"] is False

        # Verify persistence via GET (admin)
        get_resp = authenticated_client.get(f"{BASE_URL}/api/store/products/{product_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["in_stock"] is False

    def test_disabled_product_excluded_from_public_list(self, api_client, authenticated_client, target_product, restore_product_state):
        product_id = target_product["id"]
        # Disable as admin
        authenticated_client.put(f"{BASE_URL}/api/store/products/{product_id}", json={"in_stock": False})

        # Public (unauthenticated) list should NOT include this product
        public_resp = api_client.get(f"{BASE_URL}/api/store/products")
        assert public_resp.status_code == 200
        public_ids = [p["id"] for p in public_resp.json()]
        assert product_id not in public_ids, "Disabled product should be excluded from public /api/store/products"

    def test_disabled_product_excluded_from_public_priced_list(self, api_client, authenticated_client, target_product, restore_product_state):
        product_id = target_product["id"]
        authenticated_client.put(f"{BASE_URL}/api/store/products/{product_id}", json={"in_stock": False})

        public_resp = api_client.get(f"{BASE_URL}/api/store/products/priced")
        assert public_resp.status_code == 200
        body = public_resp.json()
        products_list = body["products"] if isinstance(body, dict) else body
        public_ids = [p["id"] for p in products_list]
        assert product_id not in public_ids, "Disabled product should be excluded from public /api/store/products/priced"

    def test_disabled_product_direct_fetch_returns_404_for_public(self, api_client, authenticated_client, target_product, restore_product_state):
        product_id = target_product["id"]
        authenticated_client.put(f"{BASE_URL}/api/store/products/{product_id}", json={"in_stock": False})

        public_resp = api_client.get(f"{BASE_URL}/api/store/products/{product_id}")
        assert public_resp.status_code == 404

    def test_disabled_product_seo_url_returns_404_for_public(self, api_client, authenticated_client, target_product, restore_product_state):
        product_id = target_product["id"]
        seo_url = target_product.get("seo_url")
        assert seo_url, "Product must have seo_url for this test"
        authenticated_client.put(f"{BASE_URL}/api/store/products/{product_id}", json={"in_stock": False})

        public_resp = api_client.get(f"{BASE_URL}/api/store/products/seo/{seo_url}")
        assert public_resp.status_code == 404

    def test_admin_can_still_see_disabled_product(self, authenticated_client, target_product, restore_product_state):
        """TEST 6: Authenticated/admin users can still preview disabled products directly and in list."""
        product_id = target_product["id"]
        authenticated_client.put(f"{BASE_URL}/api/store/products/{product_id}", json={"in_stock": False})

        # Direct fetch as admin should succeed
        get_resp = authenticated_client.get(f"{BASE_URL}/api/store/products/{product_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["in_stock"] is False

        # List as admin should still include disabled product
        list_resp = authenticated_client.get(f"{BASE_URL}/api/store/products")
        assert list_resp.status_code == 200
        ids = [p["id"] for p in list_resp.json()]
        assert product_id in ids, "Admin list should show disabled product too"

    def test_re_enable_product_reappears_publicly(self, api_client, authenticated_client, target_product, restore_product_state):
        """TEST 4: Re-enabling in_stock makes product reappear in public listing."""
        product_id = target_product["id"]
        # Disable then re-enable
        authenticated_client.put(f"{BASE_URL}/api/store/products/{product_id}", json={"in_stock": False})
        confirm_disabled = api_client.get(f"{BASE_URL}/api/store/products")
        assert product_id not in [p["id"] for p in confirm_disabled.json()]

        authenticated_client.put(f"{BASE_URL}/api/store/products/{product_id}", json={"in_stock": True})
        public_resp = api_client.get(f"{BASE_URL}/api/store/products")
        assert public_resp.status_code == 200
        public_ids = [p["id"] for p in public_resp.json()]
        assert product_id in public_ids, "Re-enabled product should reappear in public listing"


class TestVisibilityToggleRegression:
    """TEST 5: is_visible toggle (independent from in_stock) still works correctly - no regression."""

    def test_hidden_product_excluded_from_public_list_while_available(self, api_client, authenticated_client, target_product, restore_product_state):
        product_id = target_product["id"]
        # Keep in_stock True, only set is_visible False
        authenticated_client.put(
            f"{BASE_URL}/api/store/products/{product_id}",
            json={"in_stock": True, "is_visible": False}
        )

        public_resp = api_client.get(f"{BASE_URL}/api/store/products")
        assert public_resp.status_code == 200
        public_ids = [p["id"] for p in public_resp.json()]
        assert product_id not in public_ids, "Hidden (is_visible=False) product should be excluded from public list"

        # Direct fetch should 404 too
        detail_resp = api_client.get(f"{BASE_URL}/api/store/products/{product_id}")
        assert detail_resp.status_code == 404

    def test_visible_again_product_reappears(self, api_client, authenticated_client, target_product, restore_product_state):
        product_id = target_product["id"]
        authenticated_client.put(
            f"{BASE_URL}/api/store/products/{product_id}",
            json={"in_stock": True, "is_visible": False}
        )
        authenticated_client.put(
            f"{BASE_URL}/api/store/products/{product_id}",
            json={"in_stock": True, "is_visible": True}
        )
        public_resp = api_client.get(f"{BASE_URL}/api/store/products")
        public_ids = [p["id"] for p in public_resp.json()]
        assert product_id in public_ids, "Product should reappear once is_visible is restored to True"

    def test_both_enabled_product_visible_publicly(self, api_client, authenticated_client, target_product, restore_product_state):
        """Sanity check: fully enabled + visible product shows up publicly by default."""
        product_id = target_product["id"]
        authenticated_client.put(
            f"{BASE_URL}/api/store/products/{product_id}",
            json={"in_stock": True, "is_visible": True}
        )
        public_resp = api_client.get(f"{BASE_URL}/api/store/products")
        public_ids = [p["id"] for p in public_resp.json()]
        assert product_id in public_ids
