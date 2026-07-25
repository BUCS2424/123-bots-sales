"""Tests for the Tax Exempt module (leads, customers, storefront enforcement)."""
import io
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://activity-seo-preview.preview.emergentagent.com').rstrip('/')
ADMIN_EMAIL = 'mel@a2gdesigns.com'
ADMIN_PASS = 'BigDaddy2016!!'

session = requests.Session()


@pytest.fixture(scope='module')
def admin_token():
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    return r.json().get('token') or r.json().get('access_token')


@pytest.fixture(scope='module')
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope='module')
def a_lead_id(admin_headers):
    r = session.get(f"{BASE_URL}/api/leads/list", headers=admin_headers, timeout=30)
    assert r.status_code == 200, r.text[:200]
    data = r.json()
    leads = data if isinstance(data, list) else data.get('leads', [])
    assert leads, "no leads found"
    return leads[0].get('id')


@pytest.fixture(scope='module')
def a_customer_id(admin_headers):
    r = session.get(f"{BASE_URL}/api/users/customers", headers=admin_headers, timeout=30)
    assert r.status_code == 200, r.text[:200]
    data = r.json()
    customers = data if isinstance(data, list) else data.get('customers', [])
    assert customers, "no customers found"
    return customers[0].get('id')


def test_upload_cert(admin_headers):
    png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\xcf"
        b"\xc0\xf0\x1f\x00\x05\x00\x01\xff\xa5\xd0\x99\xa5\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    files = {'file': ('cert.png', io.BytesIO(png_bytes), 'image/png')}
    r = session.post(f"{BASE_URL}/api/tax-exempt/upload-cert", headers=admin_headers, files=files, timeout=30)
    assert r.status_code == 200, r.text[:200]
    body = r.json()
    assert body['url'].startswith('/api/uploads/tax-certs/')
    assert body['name'] == 'cert.png'
    assert body['content_type'] == 'image/png'
    assert body['size'] > 0
    # Verify file served
    r2 = session.get(f"{BASE_URL}{body['url']}", timeout=30)
    assert r2.status_code == 200
    return body


def test_set_lead_tax_exempt_and_persist(admin_headers, a_lead_id):
    payload = {
        "tax_exempt": True,
        "certificate_number": "TEST_CERT_LEAD_001",
        "reason": "TEST Reseller",
        "expiration_date": "2027-01-01",
        "cert_file": None,
    }
    r = session.put(f"{BASE_URL}/api/tax-exempt/lead/{a_lead_id}", headers=admin_headers, json=payload, timeout=30)
    assert r.status_code == 200, r.text[:200]
    body = r.json()
    assert body['success'] is True
    lead = body['lead']
    assert lead['tax_exempt'] is True
    assert lead['tax_exempt_info']['certificate_number'] == 'TEST_CERT_LEAD_001'
    assert lead['tax_exempt_info']['reason'] == 'TEST Reseller'
    assert lead['tax_exempt_info']['expiration_date'] == '2027-01-01'

    # Toggle off cleanup
    r2 = session.put(f"{BASE_URL}/api/tax-exempt/lead/{a_lead_id}", headers=admin_headers,
                     json={"tax_exempt": False, "certificate_number": "", "reason": "", "expiration_date": "", "cert_file": None}, timeout=30)
    assert r2.status_code == 200


def test_set_customer_tax_exempt_and_persist(admin_headers, a_customer_id):
    payload = {
        "tax_exempt": True,
        "certificate_number": "TEST_CERT_CUST_001",
        "reason": "TEST Non-profit",
        "expiration_date": "2028-06-30",
        "cert_file": None,
    }
    r = session.put(f"{BASE_URL}/api/tax-exempt/customer/{a_customer_id}", headers=admin_headers, json=payload, timeout=30)
    assert r.status_code == 200, r.text[:200]
    body = r.json()
    assert body['success'] is True
    cust = body['customer']
    assert cust['tax_exempt'] is True
    assert cust['tax_exempt_info']['certificate_number'] == 'TEST_CERT_CUST_001'

    # Cleanup
    session.put(f"{BASE_URL}/api/tax-exempt/customer/{a_customer_id}", headers=admin_headers,
                json={"tax_exempt": False, "certificate_number": "", "reason": "", "expiration_date": "", "cert_file": None}, timeout=30)


def test_get_me_tax_exempt(admin_headers):
    r = session.get(f"{BASE_URL}/api/tax-exempt/me", headers=admin_headers, timeout=30)
    assert r.status_code == 200, r.text[:200]
    body = r.json()
    assert 'tax_exempt' in body
    assert isinstance(body['tax_exempt'], bool)


def test_set_lead_not_found(admin_headers):
    r = session.put(f"{BASE_URL}/api/tax-exempt/lead/nonexistent-xyz", headers=admin_headers,
                    json={"tax_exempt": False}, timeout=30)
    assert r.status_code == 404


def test_upload_requires_auth():
    files = {'file': ('c.png', b'\x89PNG\r\n', 'image/png')}
    r = session.post(f"{BASE_URL}/api/tax-exempt/upload-cert", files=files, timeout=30)
    assert r.status_code in (401, 403)


def test_admin_settings_tax_available(admin_headers):
    """Quote builder fetches this to compute the sales tax line."""
    r = session.get(f"{BASE_URL}/api/admin-settings/tax", headers=admin_headers, timeout=30)
    assert r.status_code == 200, r.text[:200]
    body = r.json()
    assert isinstance(body, dict)
