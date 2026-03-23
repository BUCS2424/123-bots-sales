"""
Research Library API Tests
Tests for peptide research library endpoints: articles, categories, tags
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestResearchArticlesList:
    """Tests for GET /api/research/articles - paginated article list with filters"""
    
    def test_get_articles_default(self):
        """Test fetching articles with default pagination"""
        response = requests.get(f"{BASE_URL}/api/research/articles")
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert "has_more" in data
        
        # Default should return 9 items per page
        assert data["limit"] == 9
        assert data["page"] == 1
        assert len(data["items"]) <= 9
        assert data["total"] >= len(data["items"])
        
        # Validate item structure
        if data["items"]:
            article = data["items"][0]
            assert "id" in article
            assert "slug" in article
            assert "title" in article
            assert "category" in article
            assert "tags" in article
            assert "summary" in article
            # Content should NOT be in list response
            assert "content" not in article

    def test_get_articles_pagination(self):
        """Test pagination parameters"""
        response = requests.get(f"{BASE_URL}/api/research/articles?page=2&limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert data["page"] == 2
        assert data["limit"] == 5
        assert len(data["items"]) <= 5

    def test_get_articles_filter_by_category(self):
        """Test filtering articles by category"""
        response = requests.get(f"{BASE_URL}/api/research/articles?category=Healing%20%26%20Recovery")
        assert response.status_code == 200
        
        data = response.json()
        assert data["items"]
        for article in data["items"]:
            assert article["category"] == "Healing & Recovery"

    def test_get_articles_filter_by_tag(self):
        """Test filtering articles by tag"""
        response = requests.get(f"{BASE_URL}/api/research/articles?tag=Healing")
        assert response.status_code == 200
        
        data = response.json()
        assert data["items"]
        for article in data["items"]:
            # Check tag is in the article's tags (case-insensitive)
            tags_lower = [t.lower() for t in article["tags"]]
            assert "healing" in tags_lower

    def test_get_articles_search(self):
        """Test search functionality"""
        response = requests.get(f"{BASE_URL}/api/research/articles?search=BPC")
        assert response.status_code == 200
        
        data = response.json()
        assert data["items"]
        # At least one result should match BPC
        assert any("BPC" in article["title"] or "BPC" in article["summary"] for article in data["items"])

    def test_get_articles_combined_filters(self):
        """Test combining category and search filters"""
        response = requests.get(f"{BASE_URL}/api/research/articles?category=Performance&search=growth")
        assert response.status_code == 200
        
        data = response.json()
        # All results should be in Performance category
        for article in data["items"]:
            assert article["category"] == "Performance"

    def test_get_articles_invalid_filter(self):
        """Test that invalid filter values return 400"""
        # Test with characters not allowed by sanitization
        response = requests.get(f"{BASE_URL}/api/research/articles?category=<script>alert(1)</script>")
        assert response.status_code == 400


class TestResearchArticleDetail:
    """Tests for GET /api/research/articles/{slug} - single article detail"""
    
    def test_get_article_by_slug(self):
        """Test fetching a single article by slug"""
        response = requests.get(f"{BASE_URL}/api/research/articles/bpc-157-body-protection-compound")
        assert response.status_code == 200
        
        data = response.json()
        assert data["slug"] == "bpc-157-body-protection-compound"
        assert data["title"] == "BPC-157: Body Protection Compound"
        assert data["category"] == "Healing & Recovery"
        assert "content" in data  # Detail response should include content
        assert "BPC-157" in data["tags"]
        assert "summary" in data
        assert len(data["content"]) > 100  # Should have substantial content

    def test_get_article_not_found(self):
        """Test 404 for non-existent article"""
        response = requests.get(f"{BASE_URL}/api/research/articles/non-existent-article-slug-12345")
        assert response.status_code == 404
        
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()

    def test_get_article_invalid_slug_format(self):
        """Test 400 for invalid slug format (too short)"""
        response = requests.get(f"{BASE_URL}/api/research/articles/ab")
        assert response.status_code == 400
        
        data = response.json()
        assert "detail" in data
        assert "invalid" in data["detail"].lower()

    def test_get_article_includes_meta_fields(self):
        """Test that article includes SEO meta fields"""
        response = requests.get(f"{BASE_URL}/api/research/articles/bpc-157-body-protection-compound")
        assert response.status_code == 200
        
        data = response.json()
        # SEO fields should be present (may be null but key should exist)
        assert "meta_title" in data
        assert "meta_description" in data
        assert "meta_keywords" in data

    def test_get_article_includes_related_products(self):
        """Test that article includes related products"""
        response = requests.get(f"{BASE_URL}/api/research/articles/bpc-157-body-protection-compound")
        assert response.status_code == 200
        
        data = response.json()
        assert "related_products" in data
        assert isinstance(data["related_products"], list)


class TestResearchCategories:
    """Tests for GET /api/research/categories - unique category list"""
    
    def test_get_categories(self):
        """Test fetching all categories"""
        response = requests.get(f"{BASE_URL}/api/research/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Categories should be sorted
        assert data == sorted(data, key=str.lower)
        
        # Check expected categories
        expected_categories = ["Healing & Recovery", "Metabolic", "Cognitive & Neuro", "Performance"]
        for category in expected_categories:
            assert category in data


class TestResearchTags:
    """Tests for GET /api/research/tags - unique tags with counts"""
    
    def test_get_tags(self):
        """Test fetching all tags with counts"""
        response = requests.get(f"{BASE_URL}/api/research/tags")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check structure
        for tag_info in data:
            assert "tag" in tag_info
            assert "count" in tag_info
            assert isinstance(tag_info["tag"], str)
            assert isinstance(tag_info["count"], int)
            assert tag_info["count"] > 0

    def test_get_tags_sorted_by_count(self):
        """Test that tags are sorted by count descending"""
        response = requests.get(f"{BASE_URL}/api/research/tags")
        assert response.status_code == 200
        
        data = response.json()
        # Check that counts are in descending order (or equal)
        for i in range(len(data) - 1):
            assert data[i]["count"] >= data[i + 1]["count"]


class TestResearchDataIntegrity:
    """Tests to verify data integrity across endpoints"""
    
    def test_article_list_matches_detail(self):
        """Verify list item matches detail response for same article"""
        # Get list first
        list_response = requests.get(f"{BASE_URL}/api/research/articles?limit=1")
        assert list_response.status_code == 200
        list_data = list_response.json()
        
        if list_data["items"]:
            list_article = list_data["items"][0]
            slug = list_article["slug"]
            
            # Get detail
            detail_response = requests.get(f"{BASE_URL}/api/research/articles/{slug}")
            assert detail_response.status_code == 200
            detail_article = detail_response.json()
            
            # Fields in list should match detail
            assert list_article["id"] == detail_article["id"]
            assert list_article["title"] == detail_article["title"]
            assert list_article["category"] == detail_article["category"]
            assert list_article["summary"] == detail_article["summary"]
            assert list_article["tags"] == detail_article["tags"]

    def test_category_filter_returns_valid_categories(self):
        """Verify category filter returns articles only from valid categories"""
        # Get all categories
        cat_response = requests.get(f"{BASE_URL}/api/research/categories")
        categories = cat_response.json()
        
        for category in categories[:3]:  # Test first 3 categories
            articles_response = requests.get(f"{BASE_URL}/api/research/articles?category={category}")
            assert articles_response.status_code == 200
            articles_data = articles_response.json()
            
            for article in articles_data["items"]:
                assert article["category"] == category

    def test_total_count_consistency(self):
        """Verify total count is consistent with pagination"""
        # Get total (max limit is 50)
        response = requests.get(f"{BASE_URL}/api/research/articles?limit=50")
        assert response.status_code == 200
        data = response.json()
        total = data["total"]
        items_count = len(data["items"])
        
        # With limit 50, we should get all items or less
        assert items_count <= total
        assert items_count == min(50, total)


# Fixture for shared session
@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
