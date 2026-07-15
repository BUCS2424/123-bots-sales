"""Tests for Stripe checkout integration + regression for other payment branches."""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://botshop-ticketing.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _order_payload(payment_method: str, extra: dict | None = None):
    uid = uuid.uuid4().hex[:8]
    payload = {
        "items": [
            {
                "product_id": f"test-prod-{uid}",
                "name": "TEST Product",
                "price": 25.00,
                "quantity": 1,
                "sku": f"TEST-{uid}",
            }
        ],
        "shipping": {
            "first_name": "TEST",
            "last_name": "User",
            "email": f"test_{uid}@example.com",
            "phone": "555-000-1234",
            "address_line1": "123 Test St",
            "city": "Denver",
            "state": "CO",
            "postal_code": "80202",
            "country": "US",
        },
        "billing": None,
        "subtotal": 25.00,
        "shipping_cost": 5.00,
        "tax": 0.00,
        "total": 30.00,
        "payment_method": payment_method,
        "customer_email": f"test_{uid}@example.com",
        "customer_name": "TEST User",
        "source": "web",
        "origin_url": BASE_URL,
    }
    if extra:
        payload.update(extra)
    return payload


# ============ Stripe public settings ============

class TestStripePublicSettings:
    def test_stripe_public_settings(self):
        r = requests.get(f"{API}/payments/settings/stripe/public", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "is_enabled" in data
        assert data.get("is_enabled") is True, f"Expected Stripe enabled: {data}"
        # publishable_key / is_test_mode present (values may be blank)
        assert "publishable_key" in data
        assert "is_test_mode" in data


# ============ Stripe order creation ============

class TestStripeOrder:
    session_id = None
    redirect_url = None

    def test_create_stripe_order_returns_redirect(self):
        payload = _order_payload("stripe")
        r = requests.post(f"{API}/payments/orders", json=payload, timeout=30)
        assert r.status_code == 200, f"HTTP {r.status_code}: {r.text}"
        data = r.json()
        assert data.get("success") is True, data
        pay = data.get("payment") or {}
        redirect = pay.get("redirect_url") or data.get("redirect_url")
        assert redirect and "stripe.com" in redirect, f"Missing stripe redirect: {data}"
        # session id (cs_...) either in payload or extract from URL
        session_id = pay.get("session_id") or data.get("session_id")
        if not session_id:
            # extract from URL query
            import re
            m = re.search(r"cs_[A-Za-z0-9_]+", redirect)
            assert m, f"Cannot find cs_ session id in URL: {redirect}"
            session_id = m.group(0)
        assert session_id.startswith("cs_"), session_id
        TestStripeOrder.session_id = session_id
        TestStripeOrder.redirect_url = redirect

    def test_stripe_status_idempotent(self):
        assert TestStripeOrder.session_id, "prev test must have set session_id"
        sid = TestStripeOrder.session_id
        r1 = requests.get(f"{API}/payments/stripe/status/{sid}", timeout=30)
        assert r1.status_code == 200, r1.text
        d1 = r1.json()
        # expected shape
        assert "status" in d1 or "payment_status" in d1, d1
        # Call again — must be idempotent
        r2 = requests.get(f"{API}/payments/stripe/status/{sid}", timeout=30)
        assert r2.status_code == 200, r2.text
        d2 = r2.json()
        # payment_status should be unpaid (not paid) since we did not complete
        ps1 = d1.get("payment_status")
        ps2 = d2.get("payment_status")
        assert ps1 == ps2, f"payment_status changed between polls: {ps1} vs {ps2}"


# ============ Regression: other payment branches ============

class TestPaymentRegression:
    def test_cashapp_order(self):
        payload = _order_payload("cashapp")
        r = requests.post(f"{API}/payments/orders", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        # Either success True with pending or acknowledged branch
        assert "success" in data or "order" in data, data

    def test_venmo_order(self):
        payload = _order_payload("venmo")
        r = requests.post(f"{API}/payments/orders", json=payload, timeout=30)
        assert r.status_code == 200, r.text

    def test_paypal_order(self):
        payload = _order_payload("paypal")
        r = requests.post(f"{API}/payments/orders", json=payload, timeout=30)
        # PayPal branch may return 200 with redirect or 400 if not configured — allow both, but not 500
        assert r.status_code in (200, 400, 503), f"HTTP {r.status_code}: {r.text}"

    def test_durango_card_without_token_rejected_or_demo(self):
        # Durango not configured; either returns demo/error but must not 500
        payload = _order_payload("card", {"payment_token": "tok_test_fake"})
        r = requests.post(f"{API}/payments/orders", json=payload, timeout=30)
        assert r.status_code in (200, 400, 402), f"HTTP {r.status_code}: {r.text}"
