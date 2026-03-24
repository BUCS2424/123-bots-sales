"""
Test Location Slug Prefix Feature
Tests configurable location URL slug prefix and backward compatibility
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestLocationPublicRoutes:
    """Test public location page routes with various prefixes"""
    
    def test_commercial_cleaning_robots_missouri_resolves(self):
        """Test that /api/locations/commercial-cleaning-robots-missouri returns 200"""
        response = requests.get(f"{BASE_URL}/api/locations/commercial-cleaning-robots-missouri")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "Missouri" in response.text, "Response should contain Missouri"
        assert "123Bots" in response.text, "Response should contain 123Bots"
        print("PASS: commercial-cleaning-robots-missouri resolves correctly")
    
    def test_custom_sublimation_missouri_backward_compatibility(self):
        """Test backward compatibility: /api/locations/custom-sublimation-missouri still resolves"""
        response = requests.get(f"{BASE_URL}/api/locations/custom-sublimation-missouri")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "Missouri" in response.text, "Response should contain Missouri"
        print("PASS: custom-sublimation-missouri backward compatibility works")
    
    def test_cleaning_robots_prefix_resolves(self):
        """Test that cleaning-robots prefix also resolves"""
        response = requests.get(f"{BASE_URL}/api/locations/cleaning-robots-missouri")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "Missouri" in response.text, "Response should contain Missouri"
        print("PASS: cleaning-robots-missouri resolves correctly")
    
    def test_123bots_prefix_resolves(self):
        """Test that 123bots prefix also resolves"""
        response = requests.get(f"{BASE_URL}/api/locations/123bots-missouri")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "Missouri" in response.text, "Response should contain Missouri"
        print("PASS: 123bots-missouri resolves correctly")
    
    def test_peptide_research_supply_prefix_resolves(self):
        """Test that peptide-research-supply prefix also resolves"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-missouri")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "Missouri" in response.text, "Response should contain Missouri"
        print("PASS: peptide-research-supply-missouri resolves correctly")
    
    def test_florida_state_page_resolves(self):
        """Test that Florida state page resolves with commercial-cleaning-robots prefix"""
        response = requests.get(f"{BASE_URL}/api/locations/commercial-cleaning-robots-florida")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "Florida" in response.text, "Response should contain Florida"
        print("PASS: commercial-cleaning-robots-florida resolves correctly")
    
    def test_invalid_location_returns_404(self):
        """Test that invalid location returns 404"""
        response = requests.get(f"{BASE_URL}/api/locations/commercial-cleaning-robots-nonexistent-state-xyz")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Invalid location returns 404 as expected")


class TestLocationSlugSettingsEndpoint:
    """Test /api/dev/location-slug-settings endpoint"""
    
    def test_get_location_slug_settings_requires_auth(self):
        """Test that GET /api/dev/location-slug-settings requires authentication"""
        response = requests.get(f"{BASE_URL}/api/dev/location-slug-settings")
        # Should return 401 without auth token
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("PASS: GET /api/dev/location-slug-settings requires auth (401)")
    
    def test_put_location_slug_settings_requires_auth(self):
        """Test that PUT /api/dev/location-slug-settings requires authentication"""
        response = requests.put(
            f"{BASE_URL}/api/dev/location-slug-settings",
            json={"location_slug_prefix": "test-prefix"}
        )
        # Should return 401 without auth token
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("PASS: PUT /api/dev/location-slug-settings requires auth (401)")


class TestLocationPreviewEndpoint:
    """Test location preview endpoint"""
    
    def test_location_preview_returns_html(self):
        """Test that /api/dev/location-preview returns HTML"""
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        # This endpoint may or may not require auth depending on implementation
        if response.status_code == 200:
            assert "html" in response.text.lower(), "Response should be HTML"
            print("PASS: /api/dev/location-preview returns HTML")
        elif response.status_code == 401:
            print("PASS: /api/dev/location-preview requires auth (401)")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")


class TestLocationCanonicalUrls:
    """Test that canonical URLs use the correct prefix"""
    
    def test_canonical_url_uses_prefix(self):
        """Test that canonical URL in response uses the location prefix"""
        response = requests.get(f"{BASE_URL}/api/locations/commercial-cleaning-robots-missouri")
        assert response.status_code == 200
        # Check canonical link contains the prefix
        assert 'rel="canonical"' in response.text, "Response should have canonical link"
        assert "commercial-cleaning-robots-missouri" in response.text, "Canonical should use prefix"
        print("PASS: Canonical URL uses correct prefix")
    
    def test_og_url_uses_prefix(self):
        """Test that og:url meta tag uses the location prefix"""
        response = requests.get(f"{BASE_URL}/api/locations/commercial-cleaning-robots-missouri")
        assert response.status_code == 200
        assert 'og:url' in response.text, "Response should have og:url meta tag"
        assert "commercial-cleaning-robots-missouri" in response.text, "og:url should use prefix"
        print("PASS: og:url uses correct prefix")


class TestDevEndpoints:
    """Test dev endpoints for location generator"""
    
    def test_us_states_endpoint(self):
        """Test /api/dev/us-states endpoint"""
        response = requests.get(f"{BASE_URL}/api/dev/us-states")
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list), "Response should be a list"
            if len(data) > 0:
                assert "name" in data[0], "State should have name"
                assert "slug" in data[0], "State should have slug"
            print(f"PASS: /api/dev/us-states returns {len(data)} states")
        elif response.status_code == 401:
            print("PASS: /api/dev/us-states requires auth (401)")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")
    
    def test_stats_endpoint(self):
        """Test /api/dev/stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/dev/stats")
        if response.status_code == 200:
            data = response.json()
            assert "states" in data, "Response should have states count"
            assert "counties" in data, "Response should have counties count"
            assert "cities" in data, "Response should have cities count"
            print(f"PASS: /api/dev/stats returns stats - states: {data.get('states')}")
        elif response.status_code == 401:
            print("PASS: /api/dev/stats requires auth (401)")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")


class TestSitemapLocationUrls:
    """Test sitemap includes location URLs with correct prefix"""
    
    def test_sitemap_xml_accessible(self):
        """Test that sitemap.xml is accessible"""
        response = requests.get(f"{BASE_URL}/sitemap.xml")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "xml" in response.headers.get("content-type", "").lower(), "Should return XML"
        print("PASS: sitemap.xml is accessible")
    
    def test_sitemap_locations_xml_accessible(self):
        """Test that sitemap-locations.xml is accessible"""
        response = requests.get(f"{BASE_URL}/sitemap-locations.xml")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "xml" in response.headers.get("content-type", "").lower(), "Should return XML"
        print("PASS: sitemap-locations.xml is accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
