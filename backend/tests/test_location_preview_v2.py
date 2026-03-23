"""
Test suite for Location Preview V2 - Public accessibility and AMINO-CHAIN redesign
Tests cover:
1. Public accessibility of /api/dev/location-preview (no auth required)
2. Wide/full layout with AMINO-CHAIN theming
3. At least 3 peptide information sections
4. Testimonials section at bottom
5. State/county/city structure preservation
6. SEO metadata and schema tags
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')


class TestLocationPreviewPublicAccess:
    """Test that /api/dev/location-preview is publicly accessible without authentication"""
    
    def test_preview_returns_200_without_auth(self):
        """Preview endpoint should return 200 without any authentication"""
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ /api/dev/location-preview returns 200 without authentication")
    
    def test_preview_returns_html_content(self):
        """Preview endpoint should return HTML content"""
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", ""), \
            "Expected HTML content type"
        assert "<!doctype html>" in response.text.lower(), "Expected HTML document"
        print("✅ /api/dev/location-preview returns HTML content")


class TestAminoChainTheming:
    """Test AMINO-CHAIN visual theme and layout"""
    
    @pytest.fixture
    def preview_html(self):
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        return response.text
    
    def test_amino_chain_branding(self, preview_html):
        """Page should have AMINO-CHAIN branding"""
        assert "AMINO-CHAIN" in preview_html, "Missing AMINO-CHAIN branding"
        print("✅ AMINO-CHAIN branding present")
    
    def test_colorful_gradient_hero(self, preview_html):
        """Hero section should have colorful gradient background"""
        # Check for purple/gold gradient CSS
        assert "#22093f" in preview_html or "#4b1d77" in preview_html or "#7f35bf" in preview_html, \
            "Missing purple gradient colors"
        assert "#d8a85d" in preview_html, "Missing gold accent color"
        print("✅ Colorful gradient hero with purple/gold theme")
    
    def test_wide_container_layout(self, preview_html):
        """Layout should use wide container (1320px)"""
        assert "min(1320px" in preview_html, "Missing wide container (1320px)"
        print("✅ Wide container layout (1320px)")
    
    def test_space_grotesk_font(self, preview_html):
        """Page should use Space Grotesk font family"""
        assert "Space Grotesk" in preview_html, "Missing Space Grotesk font"
        assert "Manrope" in preview_html, "Missing Manrope font"
        print("✅ Space Grotesk and Manrope fonts loaded")


class TestPeptideInformationSections:
    """Test that at least 3 peptide information sections are present"""
    
    @pytest.fixture
    def preview_html(self):
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        return response.text
    
    def test_peptide_research_information_section(self, preview_html):
        """Page should have Peptide Research Information section"""
        assert "Peptide Research Information" in preview_html, \
            "Missing Peptide Research Information section"
        print("✅ Peptide Research Information section present")
    
    def test_healing_recovery_peptides_card(self, preview_html):
        """Section 1: Healing & Recovery Peptides"""
        assert "Healing &amp; Recovery Peptides" in preview_html or "Healing & Recovery Peptides" in preview_html, \
            "Missing Healing & Recovery Peptides info card"
        assert "BPC-157" in preview_html, "Missing BPC-157 peptide mention"
        assert "TB-500" in preview_html, "Missing TB-500 peptide mention"
        print("✅ Healing & Recovery Peptides section with BPC-157, TB-500")
    
    def test_cognitive_neuro_compounds_card(self, preview_html):
        """Section 2: Cognitive & Neuro Compounds"""
        assert "Cognitive &amp; Neuro Compounds" in preview_html or "Cognitive & Neuro Compounds" in preview_html, \
            "Missing Cognitive & Neuro Compounds info card"
        assert "Semax" in preview_html, "Missing Semax peptide mention"
        assert "Selank" in preview_html, "Missing Selank peptide mention"
        print("✅ Cognitive & Neuro Compounds section with Semax, Selank")
    
    def test_metabolic_research_catalog_card(self, preview_html):
        """Section 3: Metabolic Research Catalog"""
        assert "Metabolic Research Catalog" in preview_html, \
            "Missing Metabolic Research Catalog info card"
        assert "Semaglutide" in preview_html, "Missing Semaglutide peptide mention"
        assert "Tirzepatide" in preview_html, "Missing Tirzepatide peptide mention"
        print("✅ Metabolic Research Catalog section with Semaglutide, Tirzepatide")
    
    def test_three_info_cards_present(self, preview_html):
        """Should have exactly 3 info cards in grid"""
        count = preview_html.count('class="info-card"')
        assert count >= 3, f"Expected at least 3 info-card elements, found {count}"
        print(f"✅ Found {count} peptide information cards (required: 3)")


class TestTestimonialsSection:
    """Test testimonials section at the bottom of the page"""
    
    @pytest.fixture
    def preview_html(self):
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        return response.text
    
    def test_testimonials_section_exists(self, preview_html):
        """Testimonials section should exist"""
        assert 'class="testimonials"' in preview_html, "Missing testimonials section"
        print("✅ Testimonials section exists")
    
    def test_testimonials_header(self, preview_html):
        """Should have 'What Research Teams Say' header"""
        assert "What Research Teams Say" in preview_html, \
            "Missing testimonials header"
        print("✅ Testimonials header: 'What Research Teams Say'")
    
    def test_testimonials_quotes(self, preview_html):
        """Should have multiple testimonial quotes"""
        quote_count = preview_html.count('class="quote"')
        assert quote_count >= 3, f"Expected at least 3 testimonial quotes, found {quote_count}"
        print(f"✅ Found {quote_count} testimonial quotes")
    
    def test_testimonials_citations(self, preview_html):
        """Testimonials should have citations"""
        assert "Research Operations Lead" in preview_html, "Missing testimonial citation"
        assert "Biomedical Lab Manager" in preview_html, "Missing testimonial citation"
        assert "Principal Investigator" in preview_html, "Missing testimonial citation"
        print("✅ Testimonial citations present")
    
    def test_testimonials_at_bottom(self, preview_html):
        """Testimonials section should be near bottom (after coverage section)"""
        testimonials_pos = preview_html.find('class="testimonials"')
        footer_pos = preview_html.find('class="footer"')
        coverage_pos = preview_html.find("Coverage by Region")
        
        assert testimonials_pos > coverage_pos, "Testimonials should be after Coverage by Region"
        assert footer_pos > testimonials_pos, "Footer should be after Testimonials"
        print("✅ Testimonials positioned near bottom (after coverage, before footer)")


class TestStateCountyCityStructure:
    """Test that state/county/city navigation structure is preserved"""
    
    @pytest.fixture
    def preview_html(self):
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        return response.text
    
    def test_county_coverage_section(self, preview_html):
        """County coverage section with chip links"""
        assert "County Coverage" in preview_html, "Missing County Coverage section"
        # Check for county chip links
        assert 'class="chip"' in preview_html, "Missing chip link elements"
        assert "Alachua County" in preview_html or "alachua" in preview_html.lower(), \
            "Missing county chip links"
        print("✅ County Coverage section with chip links present")
    
    def test_city_coverage_section(self, preview_html):
        """City coverage section with chip links"""
        assert "City Coverage" in preview_html, "Missing City Coverage section"
        print("✅ City Coverage section present")
    
    def test_county_links_work(self):
        """County links should resolve (test Broward County FL)"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-broward-fl.html")
        assert response.status_code == 200, f"County page returned {response.status_code}"
        assert "County Coverage" in response.text, "County page missing proper structure"
        assert "Broward" in response.text, "County name not in page"
        print("✅ County page (Broward) loads correctly with proper structure")
    
    def test_city_links_work(self):
        """City links should resolve (test Miami FL)"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-miami-fl.html")
        assert response.status_code == 200, f"City page returned {response.status_code}"
        assert "City Coverage" in response.text, "City page missing proper structure"
        assert "Miami" in response.text, "City name not in page"
        print("✅ City page (Miami) loads correctly with proper structure")
    
    def test_metrics_displayed(self, preview_html):
        """Metrics should show county and city counts"""
        assert "Counties Covered" in preview_html, "Missing Counties Covered metric"
        assert "Cities Covered" in preview_html, "Missing Cities Covered metric"
        assert "67" in preview_html, "Missing Florida county count (67)"
        assert "942" in preview_html, "Missing Florida city count (942)"
        print("✅ Metrics displayed: 67 Counties, 942 Cities")
    
    def test_breadcrumb_on_county_page(self):
        """County pages should have breadcrumb back to state"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-broward-fl.html")
        assert "Florida" in response.text, "County page missing state link in breadcrumb"
        assert "peptide-research-supply-florida.html" in response.text, \
            "County page missing link back to state page"
        print("✅ County page has breadcrumb linking to state")
    
    def test_breadcrumb_on_city_page(self):
        """City pages should have breadcrumb back to state"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-miami-fl.html")
        assert "Florida" in response.text, "City page missing state link in breadcrumb"
        print("✅ City page has breadcrumb linking to state")


class TestSEOMetadataAndSchema:
    """Test SEO metadata tags and JSON-LD schema"""
    
    @pytest.fixture
    def preview_html(self):
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        return response.text
    
    def test_title_tag(self, preview_html):
        """Page should have proper title with AMINO-CHAIN"""
        assert "<title>" in preview_html, "Missing title tag"
        assert "AMINO-CHAIN" in preview_html, "Missing AMINO-CHAIN in title"
        assert "Peptide Research Supply" in preview_html, "Missing keywords in title"
        print("✅ Title tag with AMINO-CHAIN branding")
    
    def test_meta_description(self, preview_html):
        """Meta description present"""
        assert 'name="description"' in preview_html, "Missing meta description"
        print("✅ Meta description tag present")
    
    def test_canonical_url(self, preview_html):
        """Canonical URL present"""
        assert 'rel="canonical"' in preview_html, "Missing canonical link"
        print("✅ Canonical URL present")
    
    def test_open_graph_tags(self, preview_html):
        """Open Graph tags for social sharing"""
        assert 'property="og:title"' in preview_html, "Missing og:title"
        assert 'property="og:description"' in preview_html, "Missing og:description"
        assert 'property="og:url"' in preview_html, "Missing og:url"
        assert 'property="og:site_name"' in preview_html, "Missing og:site_name"
        assert 'property="og:type"' in preview_html, "Missing og:type"
        print("✅ Open Graph tags (og:title, og:description, og:url, og:site_name, og:type)")
    
    def test_twitter_card_tags(self, preview_html):
        """Twitter card tags for social sharing"""
        assert 'name="twitter:card"' in preview_html, "Missing twitter:card"
        assert 'name="twitter:title"' in preview_html, "Missing twitter:title"
        assert 'name="twitter:description"' in preview_html, "Missing twitter:description"
        print("✅ Twitter card tags (twitter:card, twitter:title, twitter:description)")
    
    def test_json_ld_schema(self, preview_html):
        """JSON-LD schema present and valid"""
        assert 'type="application/ld+json"' in preview_html, "Missing JSON-LD script"
        
        # Extract and validate JSON-LD
        import re
        json_ld_match = re.search(r'<script type="application/ld\+json">(.*?)</script>', preview_html, re.DOTALL)
        assert json_ld_match, "Could not extract JSON-LD content"
        
        json_ld = json.loads(json_ld_match.group(1))
        assert json_ld.get("@context") == "https://schema.org", "Invalid @context"
        assert json_ld.get("@type") == "WebPage", "Invalid @type"
        assert "AMINO-CHAIN" in json_ld.get("name", ""), "Missing AMINO-CHAIN in schema name"
        assert json_ld.get("publisher", {}).get("@type") == "Organization", "Missing publisher organization"
        print("✅ JSON-LD schema valid with @context=schema.org, @type=WebPage, publisher=Organization")


class TestPublicStatePageEndpoint:
    """Test public state page endpoint"""
    
    def test_florida_state_page(self):
        """GET /api/locations/peptide-research-supply-florida.html works"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        assert response.status_code == 200, f"State page returned {response.status_code}"
        assert "Florida" in response.text, "Missing state name"
        assert "AMINO-CHAIN" in response.text, "Missing AMINO-CHAIN branding"
        print("✅ /api/locations/peptide-research-supply-florida.html returns 200 with AMINO-CHAIN branding")
    
    def test_state_page_has_seo(self):
        """State page has SEO metadata"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        assert "<title>" in html, "Missing title"
        assert 'rel="canonical"' in html, "Missing canonical"
        assert 'property="og:title"' in html, "Missing OG tags"
        assert 'type="application/ld+json"' in html, "Missing JSON-LD"
        print("✅ State page has full SEO metadata")
    
    def test_invalid_location_returns_404(self):
        """Invalid location slug returns 404"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-invalid-location.html")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Invalid location returns 404")


class TestComplianceNotice:
    """Test compliance notice is present"""
    
    def test_compliance_notice_present(self):
        """Page should have compliance notice"""
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        html = response.text
        assert "Compliance Notice" in html, "Missing Compliance Notice"
        assert "non-human research use only" in html, "Missing research-only disclaimer"
        print("✅ Compliance notice present with non-human research disclaimer")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
