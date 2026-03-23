"""
Tests for Location Generator feature endpoints
- Tests all dev settings location generator endpoints (super admin protected)
- Tests public location page serving
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestLocationGeneratorAuth:
    """Test that location generator endpoints require super admin authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as super admin
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "mel@a2gdesigns.com", "password": "BigDaddy2016!!"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        token = login_response.json().get("access_token")
        assert token, "No access token returned"
        
        self.auth_headers = {"Authorization": f"Bearer {token}"}
        
    def test_us_states_requires_auth(self):
        """GET /api/dev/us-states should require authentication"""
        response = self.session.get(f"{BASE_URL}/api/dev/us-states")
        assert response.status_code == 403 or response.status_code == 401, \
            f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_stats_requires_auth(self):
        """GET /api/dev/stats should require authentication"""
        response = self.session.get(f"{BASE_URL}/api/dev/stats")
        assert response.status_code == 403 or response.status_code == 401, \
            f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_generated_pages_grouped_requires_auth(self):
        """GET /api/dev/generated-pages-grouped should require authentication"""
        response = self.session.get(f"{BASE_URL}/api/dev/generated-pages-grouped")
        assert response.status_code == 403 or response.status_code == 401, \
            f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_location_data_requires_auth(self):
        """GET /api/dev/location-data/{state_slug} should require authentication"""
        response = self.session.get(f"{BASE_URL}/api/dev/location-data/alabama")
        assert response.status_code == 403 or response.status_code == 401, \
            f"Expected 401/403 without auth, got {response.status_code}"


class TestUSStatesEndpoint:
    """Test GET /api/dev/us-states endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as super admin
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "mel@a2gdesigns.com", "password": "BigDaddy2016!!"}
        )
        assert login_response.status_code == 200
        token = login_response.json().get("access_token")
        self.auth_headers = {"Authorization": f"Bearer {token}"}
    
    def test_get_us_states_success(self):
        """GET /api/dev/us-states returns list of states with proper structure"""
        response = self.session.get(
            f"{BASE_URL}/api/dev/us-states",
            headers=self.auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should return at least one state"
        
        # Verify first state has required fields
        first_state = data[0]
        assert "name" in first_state, "State should have name"
        assert "slug" in first_state, "State should have slug"
        assert "abbr" in first_state, "State should have abbr"
        assert "county_count" in first_state, "State should have county_count"
        assert "city_count" in first_state, "State should have city_count"
        assert "total_pages" in first_state, "State should have total_pages"
        
        print(f"Found {len(data)} states")
        print(f"First state: {first_state['name']} ({first_state['abbr']}) - {first_state['county_count']} counties, {first_state['city_count']} cities")


class TestStatsEndpoint:
    """Test GET /api/dev/stats endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "mel@a2gdesigns.com", "password": "BigDaddy2016!!"}
        )
        assert login_response.status_code == 200
        token = login_response.json().get("access_token")
        self.auth_headers = {"Authorization": f"Bearer {token}"}
    
    def test_get_stats_success(self):
        """GET /api/dev/stats returns statistics with proper structure"""
        response = self.session.get(
            f"{BASE_URL}/api/dev/stats",
            headers=self.auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "states" in data, "Stats should include states count"
        assert "counties" in data, "Stats should include counties count"
        assert "cities" in data, "Stats should include cities count"
        assert "generated_pages" in data, "Stats should include generated_pages count"
        assert "total_locations" in data, "Stats should include total_locations"
        
        # Data validation
        assert isinstance(data["states"], int), "states should be integer"
        assert data["states"] > 0, "Should have at least 1 state"
        
        print(f"Stats: {data['states']} states, {data['counties']} counties, {data['cities']} cities")
        print(f"Generated pages: {data['generated_pages']}, Total locations: {data['total_locations']}")


class TestGeneratedPagesGroupedEndpoint:
    """Test GET /api/dev/generated-pages-grouped endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "mel@a2gdesigns.com", "password": "BigDaddy2016!!"}
        )
        assert login_response.status_code == 200
        token = login_response.json().get("access_token")
        self.auth_headers = {"Authorization": f"Bearer {token}"}
    
    def test_get_generated_pages_grouped_success(self):
        """GET /api/dev/generated-pages-grouped returns grouped data"""
        response = self.session.get(
            f"{BASE_URL}/api/dev/generated-pages-grouped",
            headers=self.auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "states" in data, "Response should have states key"
        assert isinstance(data["states"], list), "states should be a list"
        
        print(f"Generated pages grouped by state: {len(data['states'])} states with generated pages")
        
        # If there are generated pages, verify structure
        if data["states"]:
            first = data["states"][0]
            assert "slug" in first, "State entry should have slug"
            assert "total_pages" in first, "State entry should have total_pages"


class TestLocationDataEndpoint:
    """Test GET /api/dev/location-data/{state_slug} endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "mel@a2gdesigns.com", "password": "BigDaddy2016!!"}
        )
        assert login_response.status_code == 200
        token = login_response.json().get("access_token")
        self.auth_headers = {"Authorization": f"Bearer {token}"}
    
    def test_get_location_data_alabama(self):
        """GET /api/dev/location-data/alabama returns Alabama state data"""
        response = self.session.get(
            f"{BASE_URL}/api/dev/location-data/alabama",
            headers=self.auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["name"] == "Alabama", f"Expected Alabama, got {data.get('name')}"
        assert data["slug"] == "alabama", f"Expected alabama slug, got {data.get('slug')}"
        assert "counties" in data, "Should have counties array"
        assert "cities" in data, "Should have cities array"
        assert isinstance(data["counties"], list), "counties should be list"
        assert isinstance(data["cities"], list), "cities should be list"
        
        print(f"Alabama: {len(data['counties'])} counties, {len(data['cities'])} cities")
    
    def test_get_location_data_nonexistent(self):
        """GET /api/dev/location-data/{invalid} returns 404"""
        response = self.session.get(
            f"{BASE_URL}/api/dev/location-data/nonexistent-state",
            headers=self.auth_headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestLocationPreviewEndpoint:
    """Test GET /api/dev/location-preview endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "mel@a2gdesigns.com", "password": "BigDaddy2016!!"}
        )
        assert login_response.status_code == 200
        token = login_response.json().get("access_token")
        self.auth_headers = {"Authorization": f"Bearer {token}"}
    
    def test_location_preview_returns_html(self):
        """GET /api/dev/location-preview returns sample HTML page"""
        response = self.session.get(
            f"{BASE_URL}/api/dev/location-preview",
            headers=self.auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        content = response.text
        assert "<!doctype html>" in content.lower() or "<html" in content.lower(), \
            "Response should be HTML"
        assert "AMINO-CHAIN" in content, "HTML should contain AMINO-CHAIN branding"
        assert "Peptide Research Supply" in content, "HTML should contain Peptide Research Supply"
        
        print("Location preview returns valid HTML with proper branding")


class TestGenerateStateEndpoint:
    """Test POST /api/dev/generate-state/{state_slug} endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "mel@a2gdesigns.com", "password": "BigDaddy2016!!"}
        )
        assert login_response.status_code == 200
        token = login_response.json().get("access_token")
        self.auth_headers = {"Authorization": f"Bearer {token}"}
    
    def test_generate_state_requires_auth(self):
        """POST /api/dev/generate-state/{state_slug} requires super admin auth"""
        response = self.session.post(
            f"{BASE_URL}/api/dev/generate-state/alaska",
            json={"include_counties": False, "include_cities": False}
        )
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_generate_state_alaska_minimal(self):
        """POST /api/dev/generate-state/alaska generates pages (minimal)"""
        # Generate only state page for faster test
        response = self.session.post(
            f"{BASE_URL}/api/dev/generate-state/alaska",
            json={"include_counties": False, "include_cities": False},
            headers=self.auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "generated" in data, "Response should have generated count"
        assert "message" in data, "Response should have message"
        assert data["generated"] >= 1, f"Should generate at least 1 page, got {data['generated']}"
        assert "Alaska" in data.get("state", ""), "Response should include state name"
        
        print(f"Generated {data['generated']} pages for Alaska")
    
    def test_generate_state_nonexistent(self):
        """POST /api/dev/generate-state/{invalid} returns 404"""
        response = self.session.post(
            f"{BASE_URL}/api/dev/generate-state/nonexistent-state",
            json={"include_counties": False, "include_cities": False},
            headers=self.auth_headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestDeleteStateGeneratedPages:
    """Test DELETE /api/dev/generated-pages/bulk/state/{state_slug} endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "mel@a2gdesigns.com", "password": "BigDaddy2016!!"}
        )
        assert login_response.status_code == 200
        token = login_response.json().get("access_token")
        self.auth_headers = {"Authorization": f"Bearer {token}"}
    
    def test_delete_state_pages_requires_auth(self):
        """DELETE /api/dev/generated-pages/bulk/state/{state} requires super admin auth"""
        response = self.session.delete(
            f"{BASE_URL}/api/dev/generated-pages/bulk/state/alaska"
        )
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_delete_state_pages_alaska(self):
        """DELETE /api/dev/generated-pages/bulk/state/alaska deletes generated pages"""
        response = self.session.delete(
            f"{BASE_URL}/api/dev/generated-pages/bulk/state/alaska",
            headers=self.auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "deleted_count" in data, "Response should have deleted_count"
        assert "message" in data, "Response should have message"
        
        print(f"Deleted {data['deleted_count']} pages for Alaska")


class TestPublicLocationPages:
    """Test GET /api/locations/{filename} public endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
    
    def test_serve_state_page_dynamically(self):
        """GET /api/locations/peptide-research-supply-florida.html returns HTML"""
        response = self.session.get(
            f"{BASE_URL}/api/locations/peptide-research-supply-florida.html"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        content = response.text
        assert "<!doctype html>" in content.lower() or "<html" in content.lower(), \
            "Response should be HTML"
        assert "Florida" in content, "HTML should contain Florida"
        assert "AMINO-CHAIN" in content, "HTML should contain AMINO-CHAIN branding"
        
        print("Florida location page renders dynamically")
    
    def test_serve_city_page_dynamically(self):
        """GET /api/locations/peptide-research-supply-birmingham-al.html returns city HTML"""
        response = self.session.get(
            f"{BASE_URL}/api/locations/peptide-research-supply-birmingham-al.html"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        content = response.text
        assert "<!doctype html>" in content.lower() or "<html" in content.lower(), \
            "Response should be HTML"
        assert "Birmingham" in content, "HTML should contain Birmingham"
        
        print("Birmingham, AL city page renders dynamically")
    
    def test_invalid_location_returns_404(self):
        """GET /api/locations/peptide-research-supply-invalid-xx.html returns 404"""
        response = self.session.get(
            f"{BASE_URL}/api/locations/peptide-research-supply-invalid-location-xx.html"
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_non_html_returns_404(self):
        """GET /api/locations/somefile.txt returns 404"""
        response = self.session.get(
            f"{BASE_URL}/api/locations/somefile.txt"
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestHomepageNoRegression:
    """Ensure homepage still loads correctly (no regression)"""
    
    def test_homepage_loads(self):
        """Homepage should load without errors"""
        response = requests.get(BASE_URL)
        assert response.status_code == 200, f"Homepage returned {response.status_code}"
        assert "<!doctype html>" in response.text.lower() or "<html" in response.text.lower()
        print("Homepage loads successfully - no regression")
    
    def test_api_root_works(self):
        """API root should respond"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "AMINO-CHAIN Peptides API"
        print("API root accessible - no regression")
