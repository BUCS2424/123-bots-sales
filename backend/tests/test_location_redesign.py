"""
Tests for AMINO-CHAIN themed location pages redesign
- Validates HTML structure, SEO metadata, JSON-LD schema
- Tests state/county/city structure and navigation links
- Verifies CTAs and primary navigation
"""
import pytest
import requests
import json
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestLocationPageRedesign:
    """Test AMINO-CHAIN themed location pages"""
    
    def test_state_page_returns_200(self):
        """Florida state page returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        assert response.status_code == 200
        assert 'text/html' in response.headers.get('content-type', '')
        print("✅ Florida state page returns 200 OK")
    
    def test_state_page_has_amino_chain_branding(self):
        """State page has AMINO-CHAIN branding elements"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        # Brand name in page
        assert "AMINO-CHAIN" in html
        # Logo badge
        assert 'class="brand-badge"' in html
        assert '>A</span>' in html
        print("✅ AMINO-CHAIN branding present")
    
    def test_state_page_title_seo(self):
        """State page has proper SEO title"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        assert '<title>Peptide Research Supply in Florida | AMINO-CHAIN</title>' in html
        print("✅ SEO title correct for state page")
    
    def test_state_page_meta_description(self):
        """State page has meta description"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        assert 'name="description"' in html
        assert 'AMINO-CHAIN supports non-human peptide research' in html
        print("✅ Meta description present")
    
    def test_state_page_canonical_url(self):
        """State page has canonical URL"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        assert '<link rel="canonical" href="/api/locations/peptide-research-supply-florida.html" />' in html
        print("✅ Canonical URL present")
    
    def test_state_page_og_tags(self):
        """State page has Open Graph tags"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        assert 'property="og:title"' in html
        assert 'property="og:description"' in html
        assert 'property="og:type"' in html
        assert 'property="og:url"' in html
        assert 'property="og:site_name"' in html
        assert 'content="AMINO-CHAIN"' in html
        print("✅ Open Graph tags present")
    
    def test_state_page_twitter_tags(self):
        """State page has Twitter card tags"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        assert 'name="twitter:card"' in html
        assert 'name="twitter:title"' in html
        assert 'name="twitter:description"' in html
        print("✅ Twitter card tags present")
    
    def test_state_page_json_ld_schema(self):
        """State page has valid JSON-LD schema"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        # Extract JSON-LD
        import re
        match = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
        assert match, "JSON-LD script tag not found"
        json_ld_str = match.group(1)
        json_ld = json.loads(json_ld_str)
        
        # Validate structure
        assert json_ld.get("@context") == "https://schema.org"
        assert json_ld.get("@type") == "WebPage"
        assert "Florida" in json_ld.get("name", "")
        assert "AMINO-CHAIN" in json_ld.get("name", "")
        assert json_ld.get("inLanguage") == "en-US"
        assert json_ld.get("publisher", {}).get("name") == "AMINO-CHAIN"
        print("✅ JSON-LD schema valid")
    
    def test_state_page_county_coverage_links(self):
        """State page shows county coverage links"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        assert '<h3>County Coverage</h3>' in html
        assert 'class="chip"' in html
        # Check specific county link format
        assert 'href="/api/locations/peptide-research-supply-alachua-fl.html"' in html
        print("✅ County coverage links present")
    
    def test_state_page_city_coverage_links(self):
        """State page shows city coverage links"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        assert '<h3>City Coverage</h3>' in html
        # Check city link
        assert 'href="/api/locations/peptide-research-supply-miami-fl.html"' in html or \
               'href="/api/locations/peptide-research-supply-' in html
        print("✅ City coverage links present")
    
    def test_state_page_metrics_display(self):
        """State page shows metrics (counties, cities counts)"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        assert '<strong>67</strong><span>Counties Covered</span>' in html
        assert '<strong>942</strong><span>Cities Covered</span>' in html
        print("✅ Metrics displayed correctly")
    
    def test_state_page_cta_pawn_shop(self):
        """State page has CTA to /pawn-shop"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        assert 'href="/pawn-shop"' in html
        assert 'Peptides Catalog' in html or 'Explore Peptides' in html
        print("✅ Pawn shop CTA present")
    
    def test_state_page_cta_research(self):
        """State page has CTA to /research"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        assert 'href="/research"' in html
        assert 'Research Library' in html or 'Open Research Library' in html
        print("✅ Research CTA present")


class TestCityPage:
    """Test city page structure"""
    
    def test_city_page_returns_200(self):
        """Miami city page returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-miami-fl.html")
        assert response.status_code == 200
        print("✅ Miami city page returns 200 OK")
    
    def test_city_page_title(self):
        """City page has correct title"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-miami-fl.html")
        html = response.text
        assert '<title>Peptide Research Supply in Miami, FL | AMINO-CHAIN</title>' in html
        print("✅ City page title correct")
    
    def test_city_page_breadcrumb(self):
        """City page has breadcrumb to state"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-miami-fl.html")
        html = response.text
        assert 'class="breadcrumbs"' in html
        assert 'href="/api/locations/peptide-research-supply-florida.html"' in html
        assert '>Florida<' in html
        print("✅ City page breadcrumb present")
    
    def test_city_page_eyebrow_label(self):
        """City page shows 'City Coverage' eyebrow"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-miami-fl.html")
        html = response.text
        assert 'City Coverage' in html
        print("✅ City page eyebrow label correct")


class TestCountyPage:
    """Test county page structure"""
    
    def test_county_page_returns_200(self):
        """Broward county page returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-broward-fl.html")
        assert response.status_code == 200
        print("✅ Broward county page returns 200 OK")
    
    def test_county_page_title(self):
        """County page has correct title"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-broward-fl.html")
        html = response.text
        assert 'Broward County' in html
        assert 'AMINO-CHAIN' in html
        print("✅ County page title has county name and brand")
    
    def test_county_page_breadcrumb(self):
        """County page has breadcrumb to state"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-broward-fl.html")
        html = response.text
        assert 'class="breadcrumbs"' in html
        assert 'href="/api/locations/peptide-research-supply-florida.html"' in html
        print("✅ County page breadcrumb present")
    
    def test_county_page_eyebrow_label(self):
        """County page shows 'County Coverage' eyebrow"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-broward-fl.html")
        html = response.text
        assert 'County Coverage' in html
        print("✅ County page eyebrow label correct")


class TestDevPreviewEndpoint:
    """Test /api/dev/location-preview endpoint (requires auth)"""
    
    def test_preview_without_auth_returns_401(self):
        """Preview endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        assert response.status_code in [401, 403]
        print("✅ Preview endpoint requires auth")
    
    def test_preview_with_auth_returns_html(self):
        """Preview endpoint returns HTML when authenticated"""
        # Login first
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "mel@a2gdesigns.com", "password": "BigDaddy2016!!"}
        )
        if login_response.status_code != 200:
            pytest.skip("Login failed - skipping authenticated test")
        
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/dev/location-preview", headers=headers)
        assert response.status_code == 200
        assert 'text/html' in response.headers.get('content-type', '')
        assert 'AMINO-CHAIN' in response.text
        print("✅ Preview endpoint returns HTML with auth")


class TestErrorHandling:
    """Test error handling for invalid location pages"""
    
    def test_invalid_location_returns_404(self):
        """Invalid location slug returns 404"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-invalid-xx.html")
        assert response.status_code == 404
        print("✅ Invalid location returns 404")
    
    def test_non_html_file_returns_404(self):
        """Non-HTML file request returns 404"""
        response = requests.get(f"{BASE_URL}/api/locations/somefile.txt")
        assert response.status_code == 404
        print("✅ Non-HTML file returns 404")


class TestHTMLValidity:
    """Test HTML structure and styling"""
    
    def test_html_has_viewport_meta(self):
        """HTML has viewport meta for mobile"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        assert 'name="viewport"' in html
        assert 'width=device-width' in html
        print("✅ Viewport meta present for mobile")
    
    def test_html_has_responsive_styles(self):
        """HTML has responsive CSS media queries"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        assert '@media (max-width:' in html or '@media (max-width: ' in html
        print("✅ Responsive CSS media queries present")
    
    def test_html_has_compliance_notice(self):
        """HTML has compliance notice"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        assert 'Compliance Notice' in html
        assert 'non-human research' in html
        print("✅ Compliance notice present")
    
    def test_html_has_footer(self):
        """HTML has footer with copyright"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        assert '© 2026 AMINO-CHAIN' in html
        print("✅ Footer with copyright present")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
