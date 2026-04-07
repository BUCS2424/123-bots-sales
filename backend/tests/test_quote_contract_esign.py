"""
Test suite for Quote, Contract, and eSign feature
Tests: Contract templates CRUD, Quote CRUD, Public quote signing flow
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bots-crm-preview.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "qa-admin-a2g@example.com"
ADMIN_PASSWORD = "TestPass123!"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        # Handle 2FA if required
        if data.get("requires_two_factor"):
            pytest.skip("2FA required - skipping authenticated tests")
        return data.get("access_token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def api_client(auth_token):
    """Shared requests session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


@pytest.fixture(scope="module")
def test_lead(api_client):
    """Create a test lead for quote testing"""
    unique_id = str(uuid.uuid4())[:8]
    lead_data = {
        "name": f"TEST_QuoteLead_{unique_id}",
        "email": f"test_quote_{unique_id}@example.com",
        "phone": "555-123-4567",
        "subject": "Quote Test Lead",
        "message": "Test lead for quote testing",
        "source": "test_automation",
        "primary_contact_name": f"Test Quote Lead {unique_id}",
        "primary_email": f"test_quote_{unique_id}@example.com",
        "opportunity_name": f"Quote Test Opportunity {unique_id}"
    }
    response = api_client.post(f"{BASE_URL}/api/leads/", json=lead_data)
    assert response.status_code in [200, 201], f"Failed to create test lead: {response.text}"
    data = response.json()
    # Handle different response formats
    lead_id = data.get("lead_id") or data.get("id")
    # Fetch the full lead data
    lead_response = api_client.get(f"{BASE_URL}/api/leads/{lead_id}")
    lead = lead_response.json() if lead_response.status_code == 200 else {"id": lead_id}
    yield lead
    # Cleanup
    try:
        api_client.delete(f"{BASE_URL}/api/leads/{lead['id']}")
    except:
        pass


class TestContractTemplates:
    """Contract template CRUD tests"""
    
    def test_list_contract_templates(self, api_client):
        """GET /api/contract-templates - List all templates"""
        response = api_client.get(f"{BASE_URL}/api/contract-templates")
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        assert isinstance(data["templates"], list)
        print(f"Found {len(data['templates'])} contract templates")
    
    def test_create_contract_template(self, api_client):
        """POST /api/contract-templates - Create new template"""
        unique_id = str(uuid.uuid4())[:8]
        template_data = {
            "name": f"TEST_Template_{unique_id}",
            "content": "<h2>Test Contract</h2><p>This is a test contract for {{client_name}}.</p>",
            "description": "Test template for automation",
            "category": "test",
            "is_active": True,
            "is_default": False,
            "is_required": False
        }
        response = api_client.post(f"{BASE_URL}/api/contract-templates", json=template_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == template_data["name"]
        assert "id" in data
        print(f"Created template: {data['id']}")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/contract-templates/{data['id']}")
    
    def test_update_contract_template(self, api_client):
        """PUT /api/contract-templates/{id} - Update template"""
        # First create a template
        unique_id = str(uuid.uuid4())[:8]
        create_data = {
            "name": f"TEST_UpdateTemplate_{unique_id}",
            "content": "<p>Original content</p>",
            "description": "Original description",
            "category": "test",
            "is_active": True,
            "is_default": False,
            "is_required": False
        }
        create_response = api_client.post(f"{BASE_URL}/api/contract-templates", json=create_data)
        assert create_response.status_code == 200
        template = create_response.json()
        template_id = template["id"]
        
        # Update the template
        update_data = {
            "name": f"TEST_UpdatedTemplate_{unique_id}",
            "content": "<p>Updated content</p>",
            "description": "Updated description",
            "category": "test",
            "is_active": True,
            "is_default": False,
            "is_required": True
        }
        update_response = api_client.put(f"{BASE_URL}/api/contract-templates/{template_id}", json=update_data)
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["name"] == update_data["name"]
        assert updated["is_required"] == True
        print(f"Updated template: {template_id}")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/contract-templates/{template_id}")
    
    def test_delete_contract_template(self, api_client):
        """DELETE /api/contract-templates/{id} - Delete template"""
        # First create a template
        unique_id = str(uuid.uuid4())[:8]
        create_data = {
            "name": f"TEST_DeleteTemplate_{unique_id}",
            "content": "<p>To be deleted</p>",
            "description": "Template to delete",
            "category": "test",
            "is_active": True,
            "is_default": False,
            "is_required": False
        }
        create_response = api_client.post(f"{BASE_URL}/api/contract-templates", json=create_data)
        assert create_response.status_code == 200
        template = create_response.json()
        template_id = template["id"]
        
        # Delete the template
        delete_response = api_client.delete(f"{BASE_URL}/api/contract-templates/{template_id}")
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert data.get("success") == True
        print(f"Deleted template: {template_id}")
        
        # Verify deletion
        get_response = api_client.get(f"{BASE_URL}/api/contract-templates")
        templates = get_response.json().get("templates", [])
        assert not any(t["id"] == template_id for t in templates)


class TestQuoteCRUD:
    """Quote CRUD tests for leads"""
    
    def test_list_lead_quotes(self, api_client, test_lead):
        """GET /api/leads/{leadId}/quotes - List quotes for a lead"""
        response = api_client.get(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes")
        assert response.status_code == 200
        data = response.json()
        assert "quotes" in data
        assert isinstance(data["quotes"], list)
        print(f"Found {len(data['quotes'])} quotes for lead {test_lead['id']}")
    
    def test_create_lead_quote(self, api_client, test_lead):
        """POST /api/leads/{leadId}/quotes - Create a new quote"""
        unique_id = str(uuid.uuid4())[:8]
        quote_data = {
            "name": f"TEST_Quote_{unique_id}",
            "notes": "Test quote notes",
            "valid_until": "2026-12-31",
            "contract_template_id": "",
            "contract_template_name": "",
            "contract_document_ids": [],
            "items": [
                {
                    "description": "Test Service",
                    "quantity": 1,
                    "unit_price": 100.00,
                    "item_type": "custom",
                    "billing_type": "onetime"
                },
                {
                    "description": "Monthly Support",
                    "quantity": 1,
                    "unit_price": 50.00,
                    "item_type": "custom",
                    "billing_type": "monthly"
                }
            ],
            "total": 150.00,
            "total_onetime": 100.00,
            "total_monthly": 50.00,
            "total_yearly": 0.0
        }
        response = api_client.post(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes", json=quote_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == quote_data["name"]
        assert "id" in data
        assert data["status"] == "draft"
        assert len(data["items"]) == 2
        print(f"Created quote: {data['id']}")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes/{data['id']}")
    
    def test_update_lead_quote(self, api_client, test_lead):
        """PUT /api/leads/{leadId}/quotes/{quoteId} - Update a quote"""
        # First create a quote
        unique_id = str(uuid.uuid4())[:8]
        create_data = {
            "name": f"TEST_UpdateQuote_{unique_id}",
            "notes": "Original notes",
            "valid_until": "2026-12-31",
            "contract_template_id": "",
            "contract_template_name": "",
            "contract_document_ids": [],
            "items": [{"description": "Original Item", "quantity": 1, "unit_price": 100.00, "item_type": "custom", "billing_type": "onetime"}],
            "total": 100.00,
            "total_onetime": 100.00,
            "total_monthly": 0.0,
            "total_yearly": 0.0
        }
        create_response = api_client.post(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes", json=create_data)
        assert create_response.status_code == 200
        quote = create_response.json()
        quote_id = quote["id"]
        
        # Update the quote
        update_data = {
            "name": f"TEST_UpdatedQuote_{unique_id}",
            "notes": "Updated notes",
            "valid_until": "2027-01-15",
            "contract_template_id": "",
            "contract_template_name": "",
            "contract_document_ids": [],
            "items": [
                {"description": "Updated Item", "quantity": 2, "unit_price": 150.00, "item_type": "custom", "billing_type": "onetime"}
            ],
            "total": 300.00,
            "total_onetime": 300.00,
            "total_monthly": 0.0,
            "total_yearly": 0.0
        }
        update_response = api_client.put(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes/{quote_id}", json=update_data)
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["name"] == update_data["name"]
        assert updated["notes"] == "Updated notes"
        print(f"Updated quote: {quote_id}")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes/{quote_id}")
    
    def test_delete_lead_quote(self, api_client, test_lead):
        """DELETE /api/leads/{leadId}/quotes/{quoteId} - Delete a quote"""
        # First create a quote
        unique_id = str(uuid.uuid4())[:8]
        create_data = {
            "name": f"TEST_DeleteQuote_{unique_id}",
            "notes": "To be deleted",
            "valid_until": "2026-12-31",
            "contract_template_id": "",
            "contract_template_name": "",
            "contract_document_ids": [],
            "items": [{"description": "Delete Item", "quantity": 1, "unit_price": 50.00, "item_type": "custom", "billing_type": "onetime"}],
            "total": 50.00,
            "total_onetime": 50.00,
            "total_monthly": 0.0,
            "total_yearly": 0.0
        }
        create_response = api_client.post(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes", json=create_data)
        assert create_response.status_code == 200
        quote = create_response.json()
        quote_id = quote["id"]
        
        # Delete the quote
        delete_response = api_client.delete(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes/{quote_id}")
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert data.get("success") == True
        print(f"Deleted quote: {quote_id}")


class TestPublicQuoteSigning:
    """Public quote signing flow tests"""
    
    def test_get_public_quote(self, api_client, test_lead):
        """GET /api/public/quote/{quoteId} - Get public quote for signing"""
        # First create a quote
        unique_id = str(uuid.uuid4())[:8]
        quote_data = {
            "name": f"TEST_PublicQuote_{unique_id}",
            "notes": "Public quote test",
            "valid_until": "2026-12-31",
            "contract_template_id": "",
            "contract_template_name": "",
            "contract_document_ids": [],
            "items": [{"description": "Public Item", "quantity": 1, "unit_price": 200.00, "item_type": "custom", "billing_type": "onetime"}],
            "total": 200.00,
            "total_onetime": 200.00,
            "total_monthly": 0.0,
            "total_yearly": 0.0
        }
        create_response = api_client.post(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes", json=quote_data)
        assert create_response.status_code == 200
        quote = create_response.json()
        quote_id = quote["id"]
        
        # Get public quote (no auth required)
        public_response = requests.get(f"{BASE_URL}/api/public/quote/{quote_id}")
        assert public_response.status_code == 200
        data = public_response.json()
        assert "quote" in data
        assert "lead" in data
        assert "documents" in data
        assert data["quote"]["id"] == quote_id
        assert data["already_signed"] == False
        print(f"Retrieved public quote: {quote_id}")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes/{quote_id}")
    
    def test_sign_public_quote(self, api_client, test_lead):
        """POST /api/public/quote/{quoteId}/sign - Sign a quote"""
        # First create a quote
        unique_id = str(uuid.uuid4())[:8]
        quote_data = {
            "name": f"TEST_SignQuote_{unique_id}",
            "notes": "Quote to sign",
            "valid_until": "2026-12-31",
            "contract_template_id": "",
            "contract_template_name": "",
            "contract_document_ids": [],
            "items": [{"description": "Sign Item", "quantity": 1, "unit_price": 500.00, "item_type": "custom", "billing_type": "onetime"}],
            "total": 500.00,
            "total_onetime": 500.00,
            "total_monthly": 0.0,
            "total_yearly": 0.0
        }
        create_response = api_client.post(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes", json=quote_data)
        assert create_response.status_code == 200
        quote = create_response.json()
        quote_id = quote["id"]
        
        # Sign the quote (no auth required)
        sign_data = {
            "signer_name": "Test Signer",
            "signer_email": "signer@example.com",
            "document_signatures": []
        }
        sign_response = requests.post(f"{BASE_URL}/api/public/quote/{quote_id}/sign", json=sign_data)
        assert sign_response.status_code == 200
        data = sign_response.json()
        assert data.get("success") == True
        assert "deposit_amount" in data
        assert "balance_amount" in data
        assert data["deposit_amount"] == 325.00  # 65% of 500
        assert data["balance_amount"] == 175.00  # 35% of 500
        print(f"Signed quote: {quote_id}, deposit: ${data['deposit_amount']}")
        
        # Verify quote is now signed
        public_response = requests.get(f"{BASE_URL}/api/public/quote/{quote_id}")
        assert public_response.status_code == 200
        assert public_response.json()["already_signed"] == True
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes/{quote_id}")
    
    def test_cannot_sign_already_signed_quote(self, api_client, test_lead):
        """POST /api/public/quote/{quoteId}/sign - Cannot sign already signed quote"""
        # First create and sign a quote
        unique_id = str(uuid.uuid4())[:8]
        quote_data = {
            "name": f"TEST_DoubleSign_{unique_id}",
            "notes": "Double sign test",
            "valid_until": "2026-12-31",
            "contract_template_id": "",
            "contract_template_name": "",
            "contract_document_ids": [],
            "items": [{"description": "Double Sign Item", "quantity": 1, "unit_price": 100.00, "item_type": "custom", "billing_type": "onetime"}],
            "total": 100.00,
            "total_onetime": 100.00,
            "total_monthly": 0.0,
            "total_yearly": 0.0
        }
        create_response = api_client.post(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes", json=quote_data)
        assert create_response.status_code == 200
        quote = create_response.json()
        quote_id = quote["id"]
        
        # Sign the quote first time
        sign_data = {"signer_name": "First Signer", "signer_email": "first@example.com", "document_signatures": []}
        first_sign = requests.post(f"{BASE_URL}/api/public/quote/{quote_id}/sign", json=sign_data)
        assert first_sign.status_code == 200
        
        # Try to sign again
        second_sign = requests.post(f"{BASE_URL}/api/public/quote/{quote_id}/sign", json=sign_data)
        assert second_sign.status_code == 400
        assert "already signed" in second_sign.json().get("detail", "").lower()
        print(f"Correctly prevented double signing of quote: {quote_id}")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/leads/{test_lead['id']}/quotes/{quote_id}")


class TestBillingProducts:
    """Test billing products and services endpoints"""
    
    def test_list_billing_products(self, api_client):
        """GET /api/billing/products - List products for quote builder"""
        response = api_client.get(f"{BASE_URL}/api/billing/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert isinstance(data["products"], list)
        print(f"Found {len(data['products'])} billing products")
    
    def test_list_billing_services(self, api_client):
        """GET /api/billing/services - List services for quote builder"""
        response = api_client.get(f"{BASE_URL}/api/billing/services")
        assert response.status_code == 200
        data = response.json()
        assert "services" in data
        assert isinstance(data["services"], list)
        print(f"Found {len(data['services'])} billing services")


class TestCustomerQuoteLeadLink:
    """Test customer to lead linking for quotes"""
    
    def test_resolve_customer_lead_link_not_found(self, api_client):
        """GET /api/customers/{customerId}/quote-lead-link - Non-existent customer"""
        fake_id = str(uuid.uuid4())
        response = api_client.get(f"{BASE_URL}/api/customers/{fake_id}/quote-lead-link")
        assert response.status_code == 404
        print("Correctly returned 404 for non-existent customer")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
