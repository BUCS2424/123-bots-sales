"""Tests for BUG (real weight in checkout rates) and FEATURE (send-to-shippo create-label)."""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://bot-admin-hub-4.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

PUDU_PRODUCT_ID = "1a95914e-8136-4517-ab15-075405207856"

TO_ADDR = {
    "name": "Test Customer",
    "street1": "123 Main St",
    "city": "Austin",
    "state": "TX",
    "zip_code": "78701",
    "country": "US",
    "phone": "5125551234",
    "email": "test@example.com",
}


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ---------- BUG FIX: checkout rates now accepts items ----------

class TestCheckoutRatesWithItems:
    def test_checkout_rates_with_heavy_item_does_not_crash(self, s):
        """Heavy PUDU product (85 lbs) -> computed weight ~1360oz; endpoint must not crash."""
        payload = {
            "to_address": TO_ADDR,
            "items": [{"product_id": PUDU_PRODUCT_ID, "quantity": 1}],
            "order_subtotal": 5000,
        }
        r = s.post(f"{API}/shipping/rates/checkout", json=payload, timeout=30)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:300]}"
        data = r.json()
        assert "rates" in data
        assert isinstance(data["rates"], list)
        assert len(data["rates"]) > 0, "Expected at least fallback rates"

    def test_checkout_rates_backward_compat_weight_oz(self, s):
        """Old shape (weight_oz, no items) still works."""
        payload = {
            "to_address": TO_ADDR,
            "weight_oz": 8,
            "order_subtotal": 25,
        }
        r = s.post(f"{API}/shipping/rates/checkout", json=payload, timeout=30)
        assert r.status_code == 200, f"Got {r.status_code}: {r.text[:300]}"
        data = r.json()
        assert "rates" in data
        assert len(data["rates"]) > 0

    def test_checkout_rates_multi_qty_heavy(self, s):
        """2x heavy item should still work; endpoint must handle big weights gracefully."""
        payload = {
            "to_address": TO_ADDR,
            "items": [{"product_id": PUDU_PRODUCT_ID, "quantity": 2}],
            "order_subtotal": 10000,
        }
        r = s.post(f"{API}/shipping/rates/checkout", json=payload, timeout=30)
        assert r.status_code == 200
        assert "rates" in r.json()


# ---------- FEATURE: create-label endpoint ----------

class TestCreateLabelEndpoint:
    def test_create_label_404_for_nonexistent_order(self, s):
        fake_id = str(uuid.uuid4())
        r = s.post(f"{API}/shipping/orders/{fake_id}/create-label", timeout=30)
        assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text[:300]}"

    def test_create_label_for_real_order_no_500(self, s):
        """Create an order via cashapp, then attempt create-label. Since Shippo isn't
        funded in preview, expect 502 (No live rates returned) or 200 already_shipped -
        but MUST NOT be 500."""
        order_payload = {
            "items": [{"id": PUDU_PRODUCT_ID, "product_id": PUDU_PRODUCT_ID, "name": "PUDU CC1 PRO", "price": 5000, "quantity": 1}],
            "shipping": {
                "firstName": "Test",
                "lastName": "Buyer",
                "address1": "123 Main St",
                "city": "Austin",
                "state": "TX",
                "zipCode": "78701",
                "country": "US",
                "phone": "5125551234",
            },
            "billing": {},
            "subtotal": 5000,
            "shipping_cost": 150,
            "tax": 0,
            "total": 5150,
            "payment_method": "cashapp",
            "customer_email": "TEST_shippotest@example.com",
            "customer_name": "TEST Shippo Buyer",
            "selected_shipping": {"carrier": "USPS", "service": "Priority Mail", "rate": 8.5},
        }
        create = s.post(f"{API}/payments/orders", json=order_payload, timeout=30)
        assert create.status_code in (200, 201), f"Order create failed {create.status_code}: {create.text[:400]}"
        order = create.json()
        order_id = order.get("id") or order.get("order_id") or (order.get("order") or {}).get("id")
        assert order_id, f"No order id in response: {order}"

        r = s.post(f"{API}/shipping/orders/{order_id}/create-label", timeout=45)
        # Must not be a 500 crash. Acceptable: 502 (no rates), 400 (bad provider), or 200 (already_shipped/success)
        assert r.status_code != 500, f"create-label crashed with 500: {r.text[:400]}"
        assert r.status_code in (200, 400, 404, 502), f"Unexpected status {r.status_code}: {r.text[:400]}"
        # Note: preview ingress replaces 5xx JSON body with HTML error page,
        # but backend log confirms FastAPI returns 502 with "No live rates returned" detail.
        # The key contract is: status != 500 (graceful) and status is a known code.
