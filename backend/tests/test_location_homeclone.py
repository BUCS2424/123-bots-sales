"""
Tests for Location Page Homepage Clone Template
Tests: /api/dev/location-preview and /api/locations/*.html endpoints
Requirements:
- GET /api/dev/location-preview returns 200 without auth
- Preview page reflects homepage-like structure (hero, proof strip, feature/info sections)
- Contains at least 3 peptide information blocks
- Contains testimonials section near bottom
- State/county/city coverage sections still present with links
- SEO tags and JSON-LD are present
- Public state page endpoint works (/api/locations/peptide-research-supply-florida.html)
"""
import pytest
import requests
import os
import json
import re

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")


class TestPublicAccess:
    """Test that /api/dev/location-preview is accessible without authentication"""

    def test_location_preview_returns_200_without_auth(self):
        """Preview endpoint should return 200 without any authentication header"""
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    def test_location_preview_returns_html_content(self):
        """Preview endpoint should return HTML content type"""
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        assert "text/html" in response.headers.get("content-type", ""), "Expected HTML content type"


class TestHomepageStructure:
    """Test homepage-like structure: hero, proof strip, feature sections"""

    @pytest.fixture(scope="class")
    def preview_html(self):
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        return response.text

    def test_hero_wrap_section_present(self, preview_html):
        """Homepage has hero-wrap section with gradient background"""
        assert "hero-wrap" in preview_html, "Missing hero-wrap section"

    def test_hero_card_present(self, preview_html):
        """Hero contains a hero-card component"""
        assert "hero-card" in preview_html, "Missing hero-card component"

    def test_eyebrow_badge_present(self, preview_html):
        """Hero contains an eyebrow badge"""
        assert "eyebrow" in preview_html, "Missing eyebrow badge"

    def test_h1_title_present(self, preview_html):
        """Page has h1 title: Precision Synthesized Peptides"""
        assert "<h1>" in preview_html and "Precision Synthesized Peptides" in preview_html, "Missing h1 title"

    def test_cta_buttons_present(self, preview_html):
        """Hero has CTA buttons (Explore Peptides, Open Research Library)"""
        assert "btn-primary" in preview_html, "Missing primary CTA button"
        assert "btn-secondary" in preview_html, "Missing secondary CTA button"
        assert "Explore Peptides" in preview_html, "Missing Explore Peptides CTA"
        assert "Open Research Library" in preview_html, "Missing Open Research Library CTA"

    def test_proof_strip_section_present(self, preview_html):
        """Homepage has proof-strip section with metrics"""
        assert "proof-strip" in preview_html, "Missing proof-strip section"
        assert "proof-grid" in preview_html, "Missing proof-grid component"
        assert "proof-item" in preview_html, "Missing proof-item elements"

    def test_proof_strip_metrics(self, preview_html):
        """Proof strip shows counties, cities, products, purity metrics"""
        assert "Counties Covered" in preview_html, "Missing Counties Covered metric"
        assert "Cities Covered" in preview_html, "Missing Cities Covered metric"
        assert "Peptide Products" in preview_html, "Missing Peptide Products metric"
        assert "Purity Standard" in preview_html, "Missing Purity Standard metric"

    def test_research_without_compromise_section(self, preview_html):
        """Page has Research Without Compromise feature section with 4 cards"""
        assert "Research Without Compromise" in preview_html, "Missing Research Without Compromise section"
        assert "cards-4" in preview_html, "Missing 4-column card grid"
        assert "Lab-Grade Synthesis" in preview_html, "Missing Lab-Grade Synthesis card"
        assert "99%+ Purity Verified" in preview_html, "Missing Purity Verified card"
        assert "Structured Product Options" in preview_html, "Missing Product Options card"
        assert "Research Library Access" in preview_html, "Missing Research Library Access card"


class TestPeptideInformationBlocks:
    """Test that at least 3 peptide information blocks are present"""

    @pytest.fixture(scope="class")
    def preview_html(self):
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        return response.text

    def test_peptide_information_section_present(self, preview_html):
        """Page has Peptide Information section"""
        assert "Peptide Information for" in preview_html, "Missing Peptide Information section header"

    def test_healing_recovery_peptides_block(self, preview_html):
        """Peptide block 1: Healing & Recovery Peptides (BPC-157, TB-500)"""
        assert "Healing & Recovery Peptides" in preview_html, "Missing Healing & Recovery Peptides block"
        assert "BPC-157" in preview_html, "Missing BPC-157 reference"
        assert "TB-500" in preview_html, "Missing TB-500 reference"

    def test_cognitive_neuro_compounds_block(self, preview_html):
        """Peptide block 2: Cognitive & Neuro Compounds (Semax, Selank)"""
        assert "Cognitive & Neuro Compounds" in preview_html, "Missing Cognitive & Neuro Compounds block"
        assert "Semax" in preview_html, "Missing Semax reference"
        assert "Selank" in preview_html, "Missing Selank reference"

    def test_metabolic_research_peptides_block(self, preview_html):
        """Peptide block 3: Metabolic Research Peptides (Semaglutide, Tirzepatide, Retatrutide)"""
        assert "Metabolic Research Peptides" in preview_html, "Missing Metabolic Research Peptides block"
        assert "Semaglutide" in preview_html, "Missing Semaglutide reference"
        assert "Tirzepatide" in preview_html, "Missing Tirzepatide reference"
        assert "Retatrutide" in preview_html, "Missing Retatrutide reference"

    def test_three_peptide_info_cards(self, preview_html):
        """At least 3 peptide information cards exist in cards-3 grid"""
        assert "cards-3" in preview_html, "Missing 3-column card grid for peptide info"
        # Count cards in peptide info section
        peptide_cards = ["Healing & Recovery", "Cognitive & Neuro", "Metabolic Research"]
        found_cards = sum(1 for card in peptide_cards if card in preview_html)
        assert found_cards >= 3, f"Expected at least 3 peptide info blocks, found {found_cards}"


class TestTestimonialsSection:
    """Test testimonials section is present near bottom"""

    @pytest.fixture(scope="class")
    def preview_html(self):
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        return response.text

    def test_testimonials_section_present(self, preview_html):
        """Page has testimonials section"""
        assert "testimonials" in preview_html.lower(), "Missing testimonials section"
        assert '<section class="testimonials">' in preview_html, "Missing testimonials section element"

    def test_testimonials_header(self, preview_html):
        """Testimonials section has header"""
        assert "<h2>Testimonials</h2>" in preview_html, "Missing Testimonials header"

    def test_quote_grid_present(self, preview_html):
        """Testimonials has quote-grid with 3 quotes"""
        assert "quote-grid" in preview_html, "Missing quote-grid"
        assert 'class="quote"' in preview_html, "Missing quote elements"

    def test_three_testimonials_present(self, preview_html):
        """Three testimonials from research team roles"""
        assert "Research Operations Lead" in preview_html, "Missing Research Operations Lead testimonial"
        assert "Biomedical Program Manager" in preview_html, "Missing Biomedical Program Manager testimonial"
        assert "Principal Investigator" in preview_html, "Missing Principal Investigator testimonial"

    def test_testimonials_positioned_near_bottom(self, preview_html):
        """Testimonials section appears after coverage section and before footer"""
        coverage_pos = preview_html.find("Location Coverage")
        # Find the actual testimonials section element, not CSS class
        testimonials_pos = preview_html.find('<section class="testimonials">')
        footer_pos = preview_html.find('<footer class="footer">')
        assert coverage_pos < testimonials_pos < footer_pos, f"Testimonials should be between coverage and footer (coverage={coverage_pos}, testimonials={testimonials_pos}, footer={footer_pos})"


class TestStateCoverageStructure:
    """Test state/county/city coverage sections with links"""

    @pytest.fixture(scope="class")
    def preview_html(self):
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        return response.text

    def test_location_coverage_section_present(self, preview_html):
        """Page has Location Coverage section"""
        assert "Location Coverage" in preview_html, "Missing Location Coverage section"

    def test_county_coverage_box_present(self, preview_html):
        """County Coverage chip-box exists with county links"""
        assert "County Coverage" in preview_html, "Missing County Coverage section"
        assert "chip-box" in preview_html, "Missing chip-box component"

    def test_city_coverage_box_present(self, preview_html):
        """City Coverage chip-box exists with city links"""
        assert "City Coverage" in preview_html, "Missing City Coverage section"

    def test_county_links_present(self, preview_html):
        """County chip links exist and point to correct URLs"""
        # Check for county links pattern
        county_link_pattern = r'href="/api/locations/peptide-research-supply-[a-z-]+-fl\.html"'
        county_links = re.findall(county_link_pattern, preview_html)
        assert len(county_links) >= 10, f"Expected at least 10 county links, found {len(county_links)}"

    def test_city_links_present(self, preview_html):
        """City chip links exist"""
        city_link_pattern = r'class="chip" href="/api/locations/peptide-research-supply-[a-z-]+-fl\.html"'
        city_links = re.findall(city_link_pattern, preview_html)
        assert len(city_links) >= 20, f"Expected at least 20 city links, found {len(city_links)}"

    def test_chip_styling_present(self, preview_html):
        """Chips have proper styling class"""
        assert 'class="chip"' in preview_html, "Missing chip class styling"
        assert "chips" in preview_html, "Missing chips container"

    def test_compliance_notice_present(self, preview_html):
        """Compliance notice is present"""
        assert "Compliance Notice" in preview_html, "Missing Compliance Notice"
        assert "non-human research use only" in preview_html, "Missing non-human research disclaimer"


class TestSEOMetadata:
    """Test SEO tags and JSON-LD are present"""

    @pytest.fixture(scope="class")
    def preview_html(self):
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        return response.text

    def test_title_tag_present(self, preview_html):
        """Title tag with AMINO-CHAIN branding"""
        assert "<title>" in preview_html, "Missing title tag"
        assert "AMINO-CHAIN" in preview_html, "Missing AMINO-CHAIN in title"
        assert "Peptide Research Supply" in preview_html, "Missing Peptide Research Supply in title"

    def test_meta_description_present(self, preview_html):
        """Meta description tag present"""
        assert 'meta name="description"' in preview_html, "Missing meta description"

    def test_meta_keywords_present(self, preview_html):
        """Meta keywords tag present"""
        assert 'meta name="keywords"' in preview_html, "Missing meta keywords"

    def test_canonical_url_present(self, preview_html):
        """Canonical URL tag present"""
        assert 'rel="canonical"' in preview_html, "Missing canonical URL"

    def test_robots_meta_present(self, preview_html):
        """Robots meta tag allows indexing"""
        assert 'meta name="robots"' in preview_html, "Missing robots meta tag"
        assert "index,follow" in preview_html, "Robots should allow index,follow"

    def test_open_graph_tags_present(self, preview_html):
        """Open Graph tags present (og:title, og:description, og:type, og:url, og:site_name)"""
        assert 'property="og:title"' in preview_html, "Missing og:title"
        assert 'property="og:description"' in preview_html, "Missing og:description"
        assert 'property="og:type"' in preview_html, "Missing og:type"
        assert 'property="og:url"' in preview_html, "Missing og:url"
        assert 'property="og:site_name"' in preview_html, "Missing og:site_name"

    def test_twitter_card_tags_present(self, preview_html):
        """Twitter card tags present"""
        assert 'name="twitter:card"' in preview_html, "Missing twitter:card"
        assert 'name="twitter:title"' in preview_html, "Missing twitter:title"
        assert 'name="twitter:description"' in preview_html, "Missing twitter:description"

    def test_json_ld_schema_present(self, preview_html):
        """JSON-LD schema present and valid"""
        assert 'application/ld+json' in preview_html, "Missing JSON-LD script tag"
        # Extract and validate JSON-LD
        json_ld_match = re.search(r'<script type="application/ld\+json">(.*?)</script>', preview_html)
        assert json_ld_match, "Could not extract JSON-LD"
        json_ld = json.loads(json_ld_match.group(1))
        assert json_ld.get("@context") == "https://schema.org", "Invalid JSON-LD @context"
        assert json_ld.get("@type") == "WebPage", "Invalid JSON-LD @type"
        assert "publisher" in json_ld, "Missing publisher in JSON-LD"
        assert json_ld["publisher"].get("name") == "AMINO-CHAIN", "Missing AMINO-CHAIN publisher"


class TestPublicStatePages:
    """Test public state page endpoint works"""

    def test_florida_state_page_returns_200(self):
        """GET /api/locations/peptide-research-supply-florida.html returns 200"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "text/html" in response.headers.get("content-type", ""), "Expected HTML content"

    def test_florida_state_page_has_seo_metadata(self):
        """State page has proper SEO metadata"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-florida.html")
        html = response.text
        assert "<title>" in html, "Missing title tag"
        assert "Florida" in html, "Missing Florida in content"
        assert 'application/ld+json' in html, "Missing JSON-LD"

    def test_county_page_returns_200(self):
        """County page (Broward) returns 200"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-broward-fl.html")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "Broward County" in response.text, "Missing Broward County in content"

    def test_city_page_returns_200(self):
        """City page (Miami) returns 200"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-miami-fl.html")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "Miami" in response.text, "Missing Miami in content"

    def test_invalid_location_returns_404(self):
        """Invalid location page returns 404"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-invalid-location-xx.html")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"

    def test_county_page_has_breadcrumb_to_state(self):
        """County page has breadcrumb linking back to state"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-broward-fl.html")
        html = response.text
        assert "crumb" in html, "Missing breadcrumb element"
        assert "Florida" in html, "Missing Florida state reference in breadcrumb"

    def test_city_page_has_breadcrumb_to_state(self):
        """City page has breadcrumb linking back to state"""
        response = requests.get(f"{BASE_URL}/api/locations/peptide-research-supply-miami-fl.html")
        html = response.text
        assert "crumb" in html, "Missing breadcrumb element"
        assert "Florida" in html or "florida" in html, "Missing Florida state reference"


class TestAMINOChainBranding:
    """Test AMINO-CHAIN branding and styling"""

    @pytest.fixture(scope="class")
    def preview_html(self):
        response = requests.get(f"{BASE_URL}/api/dev/location-preview")
        return response.text

    def test_amino_chain_brand_present(self, preview_html):
        """AMINO-CHAIN brand name appears in header"""
        assert "AMINO-CHAIN" in preview_html, "Missing AMINO-CHAIN branding"
        assert 'class="brand"' in preview_html, "Missing brand class"

    def test_brand_badge_present(self, preview_html):
        """Brand badge with 'A' letter present"""
        assert 'class="brand-badge"' in preview_html, "Missing brand-badge"

    def test_fonts_loaded(self, preview_html):
        """Space Grotesk and Manrope fonts are loaded"""
        assert "Space+Grotesk" in preview_html or "Space Grotesk" in preview_html, "Missing Space Grotesk font"
        assert "Manrope" in preview_html, "Missing Manrope font"

    def test_purple_gold_color_scheme(self, preview_html):
        """Purple and gold color variables present"""
        assert "--purple-1" in preview_html, "Missing purple-1 color variable"
        assert "--purple-2" in preview_html, "Missing purple-2 color variable"
        assert "--gold-1" in preview_html, "Missing gold-1 color variable"
        assert "--gold-2" in preview_html, "Missing gold-2 color variable"

    def test_gradient_background_present(self, preview_html):
        """Hero has gradient background"""
        assert "linear-gradient" in preview_html, "Missing gradient background"

    def test_footer_present(self, preview_html):
        """Footer with AMINO-CHAIN copyright present"""
        assert "footer" in preview_html, "Missing footer"
        assert "© 2026 AMINO-CHAIN" in preview_html, "Missing copyright notice"
