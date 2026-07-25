"""Tests: email templates use dynamic site logo (bug fix verification)."""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://activity-seo-preview.preview.emergentagent.com").rstrip("/")
OLD_LOGO_MARKER = "gingerkare-logo-3-blue.png"

TEMPLATE_IDS = [
    "order_confirmation",
    "shipping_confirmation",
    "welcome_email",
    "password_reset",
    "order_status_update",
    "abandoned_cart",
]


@pytest.fixture(scope="module")
def site_logo():
    r = requests.get(f"{BASE_URL}/api/settings/site", timeout=30)
    assert r.status_code == 200, f"public site settings failed: {r.status_code} {r.text}"
    data = r.json()
    logo = data.get("logo_url")
    assert logo, f"logo_url missing in site settings: {data}"
    return logo


def _extract_logo_srcs(html):
    return re.findall(r'<img[^>]+src="([^"]+)"', html)


def test_get_all_templates_uses_dynamic_logo(site_logo):
    r = requests.get(f"{BASE_URL}/api/email-templates", timeout=30)
    assert r.status_code == 200, r.text
    templates = r.json()
    assert isinstance(templates, list) and len(templates) >= 4
    for tpl in templates:
        html = tpl["html_content"]
        assert OLD_LOGO_MARKER not in html, f"template {tpl['id']} still contains legacy logo"
        assert "{{site_logo}}" not in html, f"template {tpl['id']} has unresolved placeholder"
        srcs = _extract_logo_srcs(html)
        assert srcs, f"template {tpl['id']} has no <img src>"
        assert srcs[0] == site_logo, f"template {tpl['id']} logo {srcs[0]} != site logo {site_logo}"


@pytest.mark.parametrize("tid", TEMPLATE_IDS)
def test_get_single_template_uses_dynamic_logo(tid, site_logo):
    r = requests.get(f"{BASE_URL}/api/email-templates/{tid}", timeout=30)
    assert r.status_code == 200, r.text
    tpl = r.json()
    html = tpl["html_content"]
    assert OLD_LOGO_MARKER not in html
    assert "{{site_logo}}" not in html
    srcs = _extract_logo_srcs(html)
    assert srcs and srcs[0] == site_logo
    assert "site_logo" in tpl.get("variables", [])


@pytest.mark.parametrize("tid", TEMPLATE_IDS)
def test_preview_uses_dynamic_logo(tid, site_logo):
    r = requests.post(f"{BASE_URL}/api/email-templates/{tid}/preview", timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    html = data["html_content"]
    assert OLD_LOGO_MARKER not in html, f"{tid} preview contains legacy logo"
    assert "{{site_logo}}" not in html, f"{tid} preview has unresolved placeholder"
    srcs = _extract_logo_srcs(html)
    assert srcs and srcs[0] == site_logo, f"{tid} preview logo {srcs[0]} != {site_logo}"


def test_preview_reflects_updated_logo(site_logo):
    """Change site logo, verify preview reflects it, then restore."""
    # Login as admin
    login = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "mel@a2gdesigns.com", "password": "BigDaddy2016!!"},
        timeout=30,
    )
    if login.status_code != 200:
        pytest.skip(f"admin login failed: {login.status_code}")
    token = login.json().get("token") or login.json().get("access_token")
    if not token:
        pytest.skip("no token returned")
    headers = {"Authorization": f"Bearer {token}"}

    # Get current settings
    cur = requests.get(f"{BASE_URL}/api/admin-settings/site", headers=headers, timeout=30)
    assert cur.status_code == 200, cur.text
    current = cur.json()
    original_logo = current.get("logo_url")

    new_logo = "/api/storage/public/site/test-dynamic-logo.png"
    payload = {**current, "logo_url": new_logo}
    upd = requests.put(f"{BASE_URL}/api/admin-settings/site", json=payload, headers=headers, timeout=30)
    assert upd.status_code == 200, upd.text

    try:
        pv = requests.post(f"{BASE_URL}/api/email-templates/password_reset/preview", timeout=30)
        assert pv.status_code == 200
        html = pv.json()["html_content"]
        assert new_logo in html, "preview did not reflect updated logo"
        assert OLD_LOGO_MARKER not in html
    finally:
        # Restore
        payload = {**current, "logo_url": original_logo}
        requests.put(f"{BASE_URL}/api/admin-settings/site", json=payload, headers=headers, timeout=30)
