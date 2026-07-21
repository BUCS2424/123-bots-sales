"""
Test suite for NEW Shipping feature on Quotes/Orders/Invoices.
Covers:
1. Quote CRUD with shipping_cost (persist / clear -> hidden)
2. Convert-to-invoice carries shipping_cost
3. Quote catalog product shipping_weight/length/width/height fields + Sync from Store
4. POST /api/shipping/rates/checkout (fallback mock rates expected, no live carrier key configured)
5. PATCH /api/payments/orders/{order_id}/shipping recalculates total = subtotal+tax+shipping
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

ADMIN_EMAIL = "mel@a2gdesigns.com"
ADMIN_PASSWORD = "BigDaddy2016!!"


@pytest.fixture(scope="module")
def auth_token():
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def test_lead(auth_headers):
    unique_id = str(uuid.uuid4())[:8]
    lead_data = {
        "name": f"TEST_ShipLead_{unique_id}",
        "email": f"test_ship_{unique_id}@example.com",
        "phone": "555-987-6543",
        "subject": "Shipping Feature Test Lead",
        "message": "Test lead for quote shipping cost testing",
        "source": "test_automation",
        "primary_contact_name": f"Test Ship Lead {unique_id}",
        "primary_email": f"test_ship_{unique_id}@example.com",
        "opportunity_name": f"Shipping Test Opportunity {unique_id}"
    }
    response = requests.post(f"{BASE_URL}/api/leads/", json=lead_data, headers=auth_headers)
    assert response.status_code in [200, 201], f"Failed to create test lead: {response.text}"
    data = response.json()
    lead_id = data.get("lead_id") or data.get("id")
    lead_response = requests.get(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
    lead = lead_response.json() if lead_response.status_code == 200 else {"id": lead_id}
    yield lead
    try:
        requests.delete(f"{BASE_URL}/api/leads/{lead['id']}", headers=auth_headers)
    except Exception:
        pass


def _base_quote_payload(name_suffix, shipping_cost=None):
    return {
        "name": f"TEST_ShipQuote_{name_suffix}",
        "notes": "Shipping feature test quote",
        "valid_until": "2026-12-31",
        "contract_template_id": "",
        "contract_template_name": "",
        "contract_document_ids": [],
        "items": [{"description": "PUDU CC1 PRO (test)", "quantity": 1, "unit_price": 1000.00, "item_type": "custom", "billing_type": "onetime"}],
        "subtotal": 1000.00,
        "tax_exempt": False,
        "tax_rate": 0,
        "tax_amount": 0,
        "shipping_cost": shipping_cost,
        "total": 1000.00 + (shipping_cost or 0),
        "total_onetime": 1000.00,
        "total_monthly": 0.0,
        "total_yearly": 0.0,
    }


class TestQuoteShippingCost:
    """Quote shipping_cost persistence via create/update/get"""

    def test_create_quote_with_shipping_cost_persists(self, auth_headers, test_lead):
        unique_id = str(uuid.uuid4())[:8]
        payload = _base_quote_payload(unique_id, shipping_cost=35.75)
        create_resp = requests.post(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes", json=payload, headers=auth_headers)
        assert create_resp.status_code == 200
        quote = create_resp.json()
        assert quote["shipping_cost"] == 35.75
        assert quote["total"] == 1035.75
        quote_id = quote["id"]

        # Verify via list endpoint (GET -> persisted)
        list_resp = requests.get(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes", headers=auth_headers)
        assert list_resp.status_code == 200
        fetched = next((q for q in list_resp.json()["quotes"] if q["id"] == quote_id), None)
        assert fetched is not None
        assert fetched["shipping_cost"] == 35.75

        requests.delete(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes/{quote_id}", headers=auth_headers)

    def test_create_quote_with_no_shipping_cost_is_null(self, auth_headers, test_lead):
        unique_id = str(uuid.uuid4())[:8]
        payload = _base_quote_payload(unique_id, shipping_cost=None)
        create_resp = requests.post(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes", json=payload, headers=auth_headers)
        assert create_resp.status_code == 200
        quote = create_resp.json()
        assert quote.get("shipping_cost") is None
        quote_id = quote["id"]

        list_resp = requests.get(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes", headers=auth_headers)
        fetched = next((q for q in list_resp.json()["quotes"] if q["id"] == quote_id), None)
        assert fetched.get("shipping_cost") is None

        requests.delete(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes/{quote_id}", headers=auth_headers)

    def test_update_quote_shipping_cost_then_clear(self, auth_headers, test_lead):
        unique_id = str(uuid.uuid4())[:8]
        payload = _base_quote_payload(unique_id, shipping_cost=None)
        create_resp = requests.post(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes", json=payload, headers=auth_headers)
        quote_id = create_resp.json()["id"]

        # Update: set shipping_cost
        update_payload = _base_quote_payload(unique_id, shipping_cost=50.00)
        update_resp = requests.put(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes/{quote_id}", json=update_payload, headers=auth_headers)
        assert update_resp.status_code == 200
        assert update_resp.json()["shipping_cost"] == 50.00

        # Update again: clear shipping_cost (back to null/hidden)
        clear_payload = _base_quote_payload(unique_id, shipping_cost=None)
        clear_resp = requests.put(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes/{quote_id}", json=clear_payload, headers=auth_headers)
        assert clear_resp.status_code == 200
        assert clear_resp.json().get("shipping_cost") is None

        requests.delete(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes/{quote_id}", headers=auth_headers)


class TestConvertToInvoiceCarriesShipping:

    def test_convert_to_invoice_carries_shipping_cost(self, auth_headers, test_lead):
        unique_id = str(uuid.uuid4())[:8]
        payload = _base_quote_payload(unique_id, shipping_cost=42.10)
        create_resp = requests.post(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes", json=payload, headers=auth_headers)
        quote_id = create_resp.json()["id"]

        convert_resp = requests.post(
            f"{BASE_URL}/api/leads/{test_lead['id']}/quotes/{quote_id}/convert-to-invoice",
            headers=auth_headers
        )
        assert convert_resp.status_code == 200
        data = convert_resp.json()
        assert data["success"] is True
        assert data["invoice"]["shipping_cost"] == 42.10

        requests.delete(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes/{quote_id}", headers=auth_headers)


class TestQuoteCatalogShippingFields:

    created_id = None

    def test_create_product_with_shipping_dims(self, auth_headers):
        unique_id = uuid.uuid4().hex[:6]
        payload = {
            "name": f"TEST_ShipProduct_{unique_id}",
            "description": "Test product with shipping dims",
            "category": "Test",
            "sku": f"TSP-{unique_id}",
            "price_onetime": 250.0,
            "price_monthly": 0,
            "price_yearly": 0,
            "is_active": True,
            "shipping_weight": 12.5,
            "shipping_length": 20,
            "shipping_width": 15,
            "shipping_height": 10,
        }
        resp = requests.post(f"{BASE_URL}/api/quotes/catalog/products", json=payload, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["shipping_weight"] == 12.5
        assert data["shipping_length"] == 20
        assert data["shipping_width"] == 15
        assert data["shipping_height"] == 10
        TestQuoteCatalogShippingFields.created_id = data["id"]

        # GET -> verify persisted
        list_resp = requests.get(f"{BASE_URL}/api/quotes/catalog/products", headers=auth_headers)
        fetched = next((p for p in list_resp.json()["products"] if p["id"] == data["id"]), None)
        assert fetched is not None
        assert fetched["shipping_weight"] == 12.5

        requests.delete(f"{BASE_URL}/api/quotes/catalog/products/{data['id']}", headers=auth_headers)

    def test_sync_from_store(self, auth_headers):
        resp = requests.post(f"{BASE_URL}/api/quotes/catalog/products/sync-from-store", json={}, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "created" in data and "updated" in data
        assert isinstance(data["total_store_products"], int)
        print(f"Sync from store: created={data['created']} updated={data['updated']} total={data['total_store_products']}")

        # Re-run: should now update (not re-create) same products
        resp2 = requests.post(f"{BASE_URL}/api/quotes/catalog/products/sync-from-store", json={}, headers=auth_headers)
        assert resp2.status_code == 200
        data2 = resp2.json()
        assert data2["created"] == 0, "Second sync run should not create duplicates"


class TestShippingRatesCheckout:
    """Shipping rate calculator - fallback USPS mock rates expected (no live carrier key configured)"""

    def test_checkout_rates_returns_fallback_rates(self, auth_headers):
        payload = {
            "to_address": {
                "name": "Test Customer",
                "street1": "123 Main St",
                "city": "Miami",
                "state": "FL",
                "zip_code": "33101",
                "country": "US",
            },
            "weight_oz": 32,
            "order_subtotal": 500,
        }
        resp = requests.post(f"{BASE_URL}/api/shipping/rates/checkout", json=payload, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "rates" in data
        assert isinstance(data["rates"], list)
        assert len(data["rates"]) > 0
        for rate in data["rates"]:
            assert "carrier" in rate
            assert "rate_with_upcharge" in rate or "rate" in rate
        print(f"Got {len(data['rates'])} rates, providers_queried={data.get('providers_queried')}")


class TestOrderShippingPatch:
    """PATCH /api/payments/orders/{order_id}/shipping"""

    def test_patch_shipping_requires_existing_order(self, auth_headers):
        fake_id = str(uuid.uuid4())
        resp = requests.patch(f"{BASE_URL}/api/payments/orders/{fake_id}/shipping", json={"shipping_cost": 10.0}, headers=auth_headers)
        assert resp.status_code == 404

    def test_patch_shipping_recalculates_total_on_real_order(self, auth_headers):
        # Find a real order to test against
        orders_resp = requests.get(f"{BASE_URL}/api/payments/orders", headers=auth_headers)
        if orders_resp.status_code != 200:
            pytest.skip("Could not list orders to find a target for shipping patch test")
        orders = orders_resp.json()
        orders_list = orders.get("orders", orders) if isinstance(orders, dict) else orders
        if not orders_list:
            pytest.skip("No orders exist in this environment to test shipping patch against")
        order = orders_list[0]
        order_id = order["id"]
        original_shipping = order.get("shipping_cost", 0) or 0

        new_shipping = round(original_shipping + 5.55, 2)
        resp = requests.patch(f"{BASE_URL}/api/payments/orders/{order_id}/shipping", json={"shipping_cost": new_shipping}, headers=auth_headers)
        assert resp.status_code == 200
        updated = resp.json()
        assert updated["shipping_cost"] == new_shipping
        expected_total = round(float(order.get("subtotal", 0) or 0) + float(order.get("tax", 0) or 0) + new_shipping, 2)
        assert updated["total"] == expected_total

        # GET to verify persisted
        get_resp = requests.get(f"{BASE_URL}/api/payments/orders/{order_id}", headers=auth_headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["shipping_cost"] == new_shipping

        # Restore original value
        requests.patch(f"{BASE_URL}/api/payments/orders/{order_id}/shipping", json={"shipping_cost": original_shipping}, headers=auth_headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
