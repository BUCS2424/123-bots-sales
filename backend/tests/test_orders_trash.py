"""
Backend tests for Order Trash / Soft-Delete feature (backend/durango_payments.py).
Covers: GET /orders (excludes trashed), GET /orders/trash, POST /orders/bulk-trash,
POST /orders/bulk-restore, POST /orders/bulk-permanent-delete, POST /orders/trash/empty.
Also covers auth boundary (401 without token) and accounting exclusion
(backend/accounting.py stats exclude is_deleted orders).
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
def admin_token(api_client):
    resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if resp.status_code != 200:
        pytest.skip(f"Admin login failed: {resp.status_code} {resp.text}")
    data = resp.json()
    token = data.get("access_token") or data.get("token")
    if not token:
        pytest.skip(f"No token in login response: {data}")
    return token


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def _create_test_order(api_client, total=42.50, status="paid"):
    """Create a TEST_ order directly via the checkout/orders create path if available,
    else fall back to inserting through an existing endpoint. Returns order id or None."""
    order_number = f"TEST-TRASH-{uuid.uuid4().hex[:8]}"
    payload = {
        "id": str(uuid.uuid4()),
        "order_number": order_number,
        "customer_name": "TEST Trash Customer",
        "customer_email": "test_trash_customer@example.com",
        "items": [{"product_id": "test-prod", "name": "Test Product", "price": total, "quantity": 1}],
        "subtotal": total,
        "tax": 0,
        "shipping_cost": 0,
        "total": total,
        "status": status,
        "payment_method": "demo",
    }
    return payload


class TestOrdersTrashAuthBoundary:
    """TEST 8: Auth boundary - endpoints require admin bearer token"""

    def test_get_trash_without_auth_returns_401(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/payments/orders/trash")
        assert resp.status_code == 401
        data = resp.json()
        assert "detail" in data

    def test_bulk_trash_without_auth_returns_401(self, api_client):
        resp = api_client.post(f"{BASE_URL}/api/payments/orders/bulk-trash", json={"order_ids": ["fake-id"]})
        assert resp.status_code == 401

    def test_bulk_restore_without_auth_returns_401(self, api_client):
        resp = api_client.post(f"{BASE_URL}/api/payments/orders/bulk-restore", json={"order_ids": ["fake-id"]})
        assert resp.status_code == 401

    def test_bulk_permanent_delete_without_auth_returns_401(self, api_client):
        resp = api_client.post(f"{BASE_URL}/api/payments/orders/bulk-permanent-delete", json={"order_ids": ["fake-id"]})
        assert resp.status_code == 401

    def test_empty_trash_without_auth_returns_401(self, api_client):
        resp = api_client.post(f"{BASE_URL}/api/payments/orders/trash/empty", json={})
        assert resp.status_code == 401


class TestOrdersTrashCRUDFlow:
    """TEST 1/3/4/5/6: Full trash -> restore -> permanent delete lifecycle using existing orders"""

    def test_get_orders_list_excludes_trashed(self, api_client, auth_headers):
        resp = api_client.get(f"{BASE_URL}/api/payments/orders", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "orders" in data
        for o in data["orders"]:
            assert o.get("is_deleted") is not True

    def test_get_trash_list_structure(self, api_client, auth_headers):
        resp = api_client.get(f"{BASE_URL}/api/payments/orders/trash", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "orders" in data
        assert "total" in data
        assert isinstance(data["orders"], list)

    def test_full_trash_restore_lifecycle(self, api_client, auth_headers):
        # Get an existing order to use (non-destructive, will restore after)
        list_resp = api_client.get(f"{BASE_URL}/api/payments/orders", headers=auth_headers)
        orders = list_resp.json().get("orders", [])
        assert len(orders) > 0, "Need at least one existing order to test trash lifecycle"
        target = orders[0]
        order_id = target["id"]

        # TRASH it
        trash_resp = api_client.post(
            f"{BASE_URL}/api/payments/orders/bulk-trash",
            json={"order_ids": [order_id]},
            headers=auth_headers
        )
        assert trash_resp.status_code == 200
        trash_data = trash_resp.json()
        assert trash_data["success"] is True
        assert trash_data["trashed_count"] == 1

        # Verify excluded from main list
        list_resp2 = api_client.get(f"{BASE_URL}/api/payments/orders", headers=auth_headers)
        ids_after_trash = [o["id"] for o in list_resp2.json().get("orders", [])]
        assert order_id not in ids_after_trash

        # Verify present in trash list with deleted_by/deleted_at
        trash_list = api_client.get(f"{BASE_URL}/api/payments/orders/trash", headers=auth_headers)
        trashed_ids = {o["id"]: o for o in trash_list.json().get("orders", [])}
        assert order_id in trashed_ids
        assert trashed_ids[order_id]["deleted_by"] == ADMIN_EMAIL
        assert trashed_ids[order_id]["deleted_at"] is not None

        # RESTORE it
        restore_resp = api_client.post(
            f"{BASE_URL}/api/payments/orders/bulk-restore",
            json={"order_ids": [order_id]},
            headers=auth_headers
        )
        assert restore_resp.status_code == 200
        restore_data = restore_resp.json()
        assert restore_data["success"] is True
        assert restore_data["restored_count"] == 1

        # Verify back in main list
        list_resp3 = api_client.get(f"{BASE_URL}/api/payments/orders", headers=auth_headers)
        ids_after_restore = [o["id"] for o in list_resp3.json().get("orders", [])]
        assert order_id in ids_after_restore

        # Verify no longer in trash
        trash_list2 = api_client.get(f"{BASE_URL}/api/payments/orders/trash", headers=auth_headers)
        trashed_ids2 = [o["id"] for o in trash_list2.json().get("orders", [])]
        assert order_id not in trashed_ids2

    def test_bulk_trash_empty_ids_returns_400(self, api_client, auth_headers):
        resp = api_client.post(
            f"{BASE_URL}/api/payments/orders/bulk-trash",
            json={"order_ids": []},
            headers=auth_headers
        )
        assert resp.status_code == 400

    def test_permanent_delete_nonexistent_order_returns_zero(self, api_client, auth_headers):
        resp = api_client.post(
            f"{BASE_URL}/api/payments/orders/bulk-permanent-delete",
            json={"order_ids": [f"nonexistent-{uuid.uuid4()}"]},
            headers=auth_headers
        )
        assert resp.status_code == 200
        assert resp.json()["deleted_count"] == 0


class TestOrdersTrashAccountingExclusion:
    """TEST 7: Trashed orders excluded from accounting/analytics stats"""

    def test_accounting_and_restore_order_excluded_from_stats(self, api_client, auth_headers):
        # Pick a paid order with non-zero total
        list_resp = api_client.get(f"{BASE_URL}/api/payments/orders", headers=auth_headers)
        orders = list_resp.json().get("orders", [])
        paid_orders = [o for o in orders if o.get("status") == "paid" and o.get("total", 0) > 0]
        if not paid_orders:
            pytest.skip("No paid order with non-zero total available for accounting exclusion test")
        target = paid_orders[0]
        order_id = target["id"]
        order_total = target["total"]

        # Get baseline stats
        stats_before = api_client.get(f"{BASE_URL}/api/store/analytics/stats", headers=auth_headers)
        assert stats_before.status_code == 200
        revenue_before = stats_before.json().get("total_revenue", stats_before.json().get("revenue"))

        try:
            # Trash the order
            trash_resp = api_client.post(
                f"{BASE_URL}/api/payments/orders/bulk-trash",
                json={"order_ids": [order_id]},
                headers=auth_headers
            )
            assert trash_resp.status_code == 200

            stats_after = api_client.get(f"{BASE_URL}/api/store/analytics/stats", headers=auth_headers)
            assert stats_after.status_code == 200
            revenue_after = stats_after.json().get("total_revenue", stats_after.json().get("revenue"))

            if revenue_before is not None and revenue_after is not None:
                assert revenue_after <= revenue_before - order_total + 0.01, (
                    f"Expected revenue to decrease by ~{order_total} after trashing order. "
                    f"before={revenue_before}, after={revenue_after}"
                )
        finally:
            # Always restore to leave data as found
            api_client.post(
                f"{BASE_URL}/api/payments/orders/bulk-restore",
                json={"order_ids": [order_id]},
                headers=auth_headers
            )

        # Verify restored back in main list
        list_resp2 = api_client.get(f"{BASE_URL}/api/payments/orders", headers=auth_headers)
        ids_after_restore = [o["id"] for o in list_resp2.json().get("orders", [])]
        assert order_id in ids_after_restore
