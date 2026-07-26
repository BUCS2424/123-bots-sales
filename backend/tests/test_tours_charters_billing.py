"""
Tests for the NEW Tours/Charters Billing/Invoicing module (this session):
- Charter Company (seller) new billing fields (billing_address/city/state/zip, tax_id,
  invoice_email, payment_terms) persistence
- One-way customer sync: seller create/update -> db.users + db.customers record,
  visible via GET /api/store/customers, customer_id set on seller
- Invoice CRUD (create/list/get/update/delete) with totals computation (subtotal/tax/total)
- Invoice status transitions: mark paid, void
- Invoice settings (defaults) get/put
- Public invoice view (no auth) + bill_from/seller enrichment
- Public Stripe Pay Now session creation + pay/status polling endpoint
- Accounting dashboard tours-charters-income endpoint
- Dev Settings feature-flags FareHarbor credential masking + round-trip of other flags
"""
import os
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


# =============== CHARTER COMPANY BILLING FIELDS + CUSTOMER SYNC ===============

class TestSellerBillingAndCustomerSync:
    @pytest.fixture(scope="class")
    def test_seller(self, authenticated_client):
        unique_email = f"TEST_billing_{uuid.uuid4().hex[:8]}@example.com"
        resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/sellers", json={
            "name": "TEST_Billing Charter Co",
            "contact_email": unique_email,
            "contact_phone": "555-0100",
            "billing_address": "1 Test Ave",
            "billing_city": "Testville",
            "billing_state": "FL",
            "billing_zip": "33101",
            "tax_id": "11-2223334",
            "invoice_email": unique_email,
            "payment_terms": "Net 15",
        })
        assert resp.status_code == 200
        seller = resp.json()
        yield seller, unique_email
        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/sellers/{seller['id']}")

    def test_seller_create_persists_billing_fields(self, test_seller):
        seller, unique_email = test_seller
        assert seller["billing_address"] == "1 Test Ave"
        assert seller["billing_city"] == "Testville"
        assert seller["billing_state"] == "FL"
        assert seller["billing_zip"] == "33101"
        assert seller["tax_id"] == "11-2223334"
        assert seller["invoice_email"] == unique_email
        assert seller["payment_terms"] == "Net 15"

    def test_seller_create_triggers_customer_sync(self, test_seller):
        seller, unique_email = test_seller
        assert seller.get("customer_id"), "customer_id should be set after create"
        assert isinstance(seller["customer_id"], str)

    def test_synced_customer_appears_in_store_customers(self, authenticated_client, test_seller):
        seller, unique_email = test_seller
        resp = authenticated_client.get(f"{BASE_URL}/api/store/customers", params={"search": "TEST_Billing Charter Co"})
        assert resp.status_code == 200
        customers = resp.json()
        matches = [c for c in customers if c.get("id") == seller["customer_id"]]
        assert len(matches) == 1, f"Expected synced customer {seller['customer_id']} in /store/customers list"
        customer = matches[0]
        assert customer["name"] == "TEST_Billing Charter Co"
        assert customer["email"] == unique_email.lower()
        assert customer["phone"] == "555-0100"
        assert customer["address"] == "1 Test Ave"
        assert customer["city"] == "Testville"
        assert customer["state"] == "FL"
        assert customer["zip_code"] == "33101"

    def test_seller_update_billing_fields_persists_and_resyncs(self, authenticated_client, test_seller):
        seller, unique_email = test_seller
        update_resp = authenticated_client.put(f"{BASE_URL}/api/tours-charters/sellers/{seller['id']}", json={
            "billing_city": "Updated City",
            "payment_terms": "Net 60",
        })
        assert update_resp.status_code == 200
        updated = update_resp.json()
        assert updated["billing_city"] == "Updated City"
        assert updated["payment_terms"] == "Net 60"
        assert updated["customer_id"] == seller["customer_id"]

        # GET to re-verify persistence
        get_resp = authenticated_client.get(f"{BASE_URL}/api/tours-charters/sellers")
        matched = [s for s in get_resp.json() if s["id"] == seller["id"]]
        assert len(matched) == 1
        assert matched[0]["billing_city"] == "Updated City"

        # Customer record should be updated too (same id, updated name/address stayed but city same source)
        cust_resp = authenticated_client.get(f"{BASE_URL}/api/store/customers", params={"search": "TEST_Billing Charter Co"})
        matches = [c for c in cust_resp.json() if c.get("id") == seller["customer_id"]]
        assert len(matches) == 1
        assert matches[0]["city"] == "Updated City"


# =============== INVOICE SETTINGS (DEFAULTS) ===============

class TestInvoiceSettings:
    def test_get_invoice_settings_returns_dict(self, authenticated_client):
        resp = authenticated_client.get(f"{BASE_URL}/api/tours-charters/invoice-settings")
        assert resp.status_code == 200
        data = resp.json()
        assert "default_bank_info" in data
        assert "default_sale_agent" in data

    def test_update_invoice_settings_persists(self, authenticated_client):
        payload = {
            "default_bank_info": "TEST Bank Routing 000111 Acct 222333",
            "default_venmo_info": "@TEST-venmo",
            "default_check_info": "TEST PO Box 99",
            "default_custom_note": "TEST Thanks for chartering with us!",
            "default_sale_agent": "TEST Agent Smith",
        }
        put_resp = authenticated_client.put(f"{BASE_URL}/api/tours-charters/invoice-settings", json=payload)
        assert put_resp.status_code == 200
        assert put_resp.json().get("success") is True

        get_resp = authenticated_client.get(f"{BASE_URL}/api/tours-charters/invoice-settings")
        data = get_resp.json()
        for key, value in payload.items():
            assert data[key] == value


# =============== INVOICE CRUD + TOTALS + STATUS TRANSITIONS ===============

class TestInvoiceCrud:
    @pytest.fixture(scope="class")
    def invoice_seller(self, authenticated_client):
        resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/sellers", json={
            "name": "TEST_Invoice Seller",
            "contact_email": f"TEST_invseller_{uuid.uuid4().hex[:6]}@example.com",
        })
        seller = resp.json()
        yield seller
        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/sellers/{seller['id']}")

    @pytest.fixture
    def created_invoice(self, authenticated_client, invoice_seller):
        payload = {
            "seller_id": invoice_seller["id"],
            "sale_agent": "TEST Agent",
            "line_items": [
                {"description": "Half day charter", "booking_ref": "BK-100", "qty": 2, "rate": 100, "tax_percent": 10},
                {"description": "Fuel surcharge", "booking_ref": "BK-100", "qty": 1, "rate": 25, "tax_percent": 0},
            ],
            "custom_note": "TEST note",
            "bank_info": "TEST bank info",
            "venmo_info": "@test",
            "check_info": "TEST check info",
        }
        resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/invoices", json=payload)
        assert resp.status_code == 200
        invoice = resp.json()
        yield invoice
        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/invoices/{invoice['id']}")

    def test_create_invoice_computes_totals_correctly(self, created_invoice):
        # subtotal = 2*100 + 1*25 = 225; tax = 200*0.10 + 25*0 = 20; total = 245
        assert created_invoice["subtotal"] == 225.0
        assert created_invoice["tax_amount"] == 20.0
        assert created_invoice["total"] == 245.0
        assert created_invoice["amount_due"] == 245.0
        assert created_invoice["amount_paid"] == 0.0
        assert created_invoice["status"] == "unpaid"

    def test_invoice_number_format(self, created_invoice):
        import re
        assert re.match(r"^INV-\d{6}-\d{2}$", created_invoice["invoice_number"])

    def test_get_invoice_by_id(self, authenticated_client, created_invoice):
        resp = authenticated_client.get(f"{BASE_URL}/api/tours-charters/invoices/{created_invoice['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == created_invoice["id"]

    def test_list_invoices_filter_by_seller(self, authenticated_client, created_invoice, invoice_seller):
        resp = authenticated_client.get(f"{BASE_URL}/api/tours-charters/invoices", params={"seller_id": invoice_seller["id"]})
        assert resp.status_code == 200
        ids = [i["id"] for i in resp.json()]
        assert created_invoice["id"] in ids

    def test_update_invoice_line_items_recomputes_totals(self, authenticated_client, created_invoice):
        new_items = [{"description": "Updated item", "booking_ref": "BK-200", "qty": 3, "rate": 50, "tax_percent": 5}]
        resp = authenticated_client.put(
            f"{BASE_URL}/api/tours-charters/invoices/{created_invoice['id']}", json={"line_items": new_items}
        )
        assert resp.status_code == 200
        updated = resp.json()
        # subtotal = 150, tax = 7.5, total = 157.5
        assert updated["subtotal"] == 150.0
        assert updated["tax_amount"] == 7.5
        assert updated["total"] == 157.5
        assert updated["amount_due"] == 157.5

    def test_mark_invoice_paid_sets_status_and_zero_due(self, authenticated_client, created_invoice):
        resp = authenticated_client.put(
            f"{BASE_URL}/api/tours-charters/invoices/{created_invoice['id']}", json={"status": "paid"}
        )
        assert resp.status_code == 200
        updated = resp.json()
        assert updated["status"] == "paid"
        assert updated["amount_due"] == 0.0
        assert updated["amount_paid"] == updated["total"]

        # Verify persistence
        get_resp = authenticated_client.get(f"{BASE_URL}/api/tours-charters/invoices/{created_invoice['id']}")
        assert get_resp.json()["status"] == "paid"

    def test_void_invoice_sets_status_void(self, authenticated_client, invoice_seller):
        create_resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/invoices", json={
            "seller_id": invoice_seller["id"],
            "line_items": [{"description": "To void", "qty": 1, "rate": 10, "tax_percent": 0}],
        })
        invoice = create_resp.json()
        void_resp = authenticated_client.put(
            f"{BASE_URL}/api/tours-charters/invoices/{invoice['id']}", json={"status": "void"}
        )
        assert void_resp.status_code == 200
        assert void_resp.json()["status"] == "void"
        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/invoices/{invoice['id']}")

    def test_delete_invoice_removes_it(self, authenticated_client, invoice_seller):
        create_resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/invoices", json={
            "seller_id": invoice_seller["id"],
            "line_items": [{"description": "To delete", "qty": 1, "rate": 5, "tax_percent": 0}],
        })
        invoice = create_resp.json()
        del_resp = authenticated_client.delete(f"{BASE_URL}/api/tours-charters/invoices/{invoice['id']}")
        assert del_resp.status_code == 200

        get_resp = authenticated_client.get(f"{BASE_URL}/api/tours-charters/invoices/{invoice['id']}")
        assert get_resp.status_code == 404

    def test_create_invoice_for_missing_seller_returns_400(self, authenticated_client):
        resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/invoices", json={
            "seller_id": "nonexistent-seller-id",
            "line_items": [],
        })
        assert resp.status_code == 400


# =============== PUBLIC INVOICE VIEW + STRIPE PAY NOW ===============

class TestPublicInvoiceViewAndPayment:
    @pytest.fixture(scope="class")
    def public_seller_and_invoice(self, authenticated_client):
        seller_resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/sellers", json={
            "name": "TEST_Public Charter Co",
            "contact_email": f"TEST_public_{uuid.uuid4().hex[:6]}@example.com",
            "billing_address": "99 Public St",
            "tax_id": "22-3334445",
        })
        seller = seller_resp.json()
        invoice_resp = authenticated_client.post(f"{BASE_URL}/api/tours-charters/invoices", json={
            "seller_id": seller["id"],
            "line_items": [{"description": "Public test line", "booking_ref": "BK-PUB", "qty": 1, "rate": 99.5, "tax_percent": 0}],
            "custom_note": "TEST public note",
            "bank_info": "TEST bank",
        })
        invoice = invoice_resp.json()
        yield seller, invoice
        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/invoices/{invoice['id']}")
        authenticated_client.delete(f"{BASE_URL}/api/tours-charters/sellers/{seller['id']}")

    def test_public_get_invoice_no_auth_required(self, api_client, public_seller_and_invoice):
        seller, invoice = public_seller_and_invoice
        # Use a fresh session with no Authorization header
        fresh = requests.Session()
        resp = fresh.get(f"{BASE_URL}/api/public/tours-charters/invoices/{invoice['id']}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["invoice_number"] == invoice["invoice_number"]
        assert data["seller"]["name"] == "TEST_Public Charter Co"
        assert data["seller"]["billing_address"] == "99 Public St"
        assert data["seller"]["tax_id"] == "22-3334445"
        assert "bill_from" in data
        assert data["line_items"][0]["description"] == "Public test line"
        assert data["custom_note"] == "TEST public note"
        assert data["bank_info"] == "TEST bank"
        assert isinstance(data["transactions"], list)

    def test_public_get_invoice_404_for_unknown_id(self):
        fresh = requests.Session()
        resp = fresh.get(f"{BASE_URL}/api/public/tours-charters/invoices/does-not-exist")
        assert resp.status_code == 404

    def test_pay_now_creates_stripe_checkout_session(self, public_seller_and_invoice):
        seller, invoice = public_seller_and_invoice
        fresh = requests.Session()
        resp = fresh.post(
            f"{BASE_URL}/api/public/tours-charters/invoices/{invoice['id']}/pay",
            json={"origin_url": BASE_URL},
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "url" in data and "session_id" in data
        assert data["url"].startswith("https://checkout.stripe.com/")

    def test_pay_status_endpoint_does_not_error(self, public_seller_and_invoice):
        seller, invoice = public_seller_and_invoice
        fresh = requests.Session()
        pay_resp = fresh.post(
            f"{BASE_URL}/api/public/tours-charters/invoices/{invoice['id']}/pay",
            json={"origin_url": BASE_URL},
        )
        session_id = pay_resp.json()["session_id"]
        status_resp = fresh.get(
            f"{BASE_URL}/api/public/tours-charters/invoices/{invoice['id']}/pay/status",
            params={"session_id": session_id},
        )
        assert status_resp.status_code == 200, status_resp.text
        data = status_resp.json()
        assert "payment_status" in data
        assert data["payment_status"] in ("paid", "unpaid", "no_payment_required", "open", "expired")

    def test_pay_now_on_already_paid_invoice_returns_400(self, authenticated_client, public_seller_and_invoice):
        seller, invoice = public_seller_and_invoice
        authenticated_client.put(f"{BASE_URL}/api/tours-charters/invoices/{invoice['id']}", json={"status": "paid"})
        fresh = requests.Session()
        resp = fresh.post(f"{BASE_URL}/api/public/tours-charters/invoices/{invoice['id']}/pay", json={})
        assert resp.status_code == 400
        # Revert to unpaid to keep fixture teardown semantics simple
        authenticated_client.put(f"{BASE_URL}/api/tours-charters/invoices/{invoice['id']}", json={"status": "unpaid"})


# =============== ACCOUNTING DASHBOARD - TOURS & CHARTERS INCOME ===============

class TestAccountingToursChartersIncome:
    def test_tours_charters_income_endpoint_returns_expected_shape(self, authenticated_client):
        resp = authenticated_client.get(f"{BASE_URL}/api/accounting/dashboard/tours-charters-income", params={"period": "30"})
        assert resp.status_code == 200
        data = resp.json()
        for key in ("total_invoiced", "total_paid", "total_unpaid", "invoice_count", "paid_count", "unpaid_count"):
            assert key in data
        assert isinstance(data["total_invoiced"], (int, float))
        assert isinstance(data["invoice_count"], int)

    def test_tours_charters_income_respects_custom_date_range(self, authenticated_client):
        resp = authenticated_client.get(
            f"{BASE_URL}/api/accounting/dashboard/tours-charters-income",
            params={"start_date": "2020-01-01", "end_date": "2020-01-31"},
        )
        assert resp.status_code == 200
        data = resp.json()
        # No invoices should exist in this far-past range
        assert data["invoice_count"] == 0
        assert data["total_invoiced"] == 0

    def test_dashboard_report_export_endpoint_still_works(self, authenticated_client):
        """Regression guard: /dashboard/report (used by accounting CSV export) must remain
        registered - a decorator was found missing/dropped near the new tours-charters-income
        endpoint insertion point during this review and was fixed."""
        resp = authenticated_client.get(f"{BASE_URL}/api/accounting/dashboard/report", params={"period": "30"})
        assert resp.status_code == 200
        data = resp.json()
        assert "period" in data
        assert "summary" in data


# =============== FAREHARBOR API SETTINGS (FEATURE FLAGS) ===============

class TestFareHarborFeatureFlagSettings:
    def test_get_feature_flags_masks_fareharbor_secrets_if_set(self, authenticated_client):
        # First ensure some value is set
        current = authenticated_client.get(f"{BASE_URL}/api/admin-settings/feature-flags").json()
        current["fareharbor_api_app"] = "TESTAPPVALUE1234"
        current["fareharbor_api_user"] = "TESTUSERVALUE5678"
        put_resp = authenticated_client.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=current)
        assert put_resp.status_code == 200

        get_resp = authenticated_client.get(f"{BASE_URL}/api/admin-settings/feature-flags")
        data = get_resp.json()
        assert data["fareharbor_api_app"] != "TESTAPPVALUE1234"
        assert data["fareharbor_api_app"].endswith("1234")
        assert data["fareharbor_api_user"].endswith("5678")

    def test_put_with_masked_value_does_not_overwrite_stored_secret(self, authenticated_client):
        masked = authenticated_client.get(f"{BASE_URL}/api/admin-settings/feature-flags").json()
        assert masked["fareharbor_api_app"].startswith("\u2022")
        # Re-submit the masked value as-is (simulating a form save without touching this field)
        put_resp = authenticated_client.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=masked)
        assert put_resp.status_code == 200

        get_resp = authenticated_client.get(f"{BASE_URL}/api/admin-settings/feature-flags").json()
        # Still ends in the same last 4 chars as originally stored (not blanked/corrupted)
        assert get_resp["fareharbor_api_app"].endswith("1234")
        assert get_resp["fareharbor_api_user"].endswith("5678")

    def test_saving_feature_flags_roundtrips_other_flags(self, authenticated_client):
        """The whole FeatureFlags form is submitted together (full overwrite PUT) - verify
        saving from this endpoint does not reset unrelated flags like activity_marketplace_enabled."""
        before = authenticated_client.get(f"{BASE_URL}/api/admin-settings/feature-flags").json()
        assert before.get("activity_marketplace_enabled") is True, "Precondition: activity_marketplace_enabled should be ON per test setup"

        put_resp = authenticated_client.put(f"{BASE_URL}/api/admin-settings/feature-flags", json=before)
        assert put_resp.status_code == 200

        after = authenticated_client.get(f"{BASE_URL}/api/admin-settings/feature-flags").json()
        assert after.get("activity_marketplace_enabled") is True
        assert after.get("cart_enabled") == before.get("cart_enabled")
