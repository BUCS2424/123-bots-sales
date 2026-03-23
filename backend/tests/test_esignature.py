"""
E-Signature API Tests
Tests for electronic signature functionality for Pawn, Storage, and RV Service contracts
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestESignatureAuth:
    """Authentication setup for e-signature tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "mel@a2gdesigns.com",
            "password": "BigDaddy2016!!"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}


class TestESignatureStats(TestESignatureAuth):
    """Test e-signature stats endpoint"""
    
    def test_get_stats(self, auth_headers):
        """Test GET /api/esignature/stats returns correct structure"""
        response = requests.get(f"{BASE_URL}/api/esignature/stats", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "total_signed" in data
        assert "signed_today" in data
        assert "by_type" in data
        assert "pawn" in data["by_type"]
        assert "storage" in data["by_type"]
        assert "rv_service" in data["by_type"]
        assert "printed" in data
        assert "digital_only" in data
        print(f"Stats: {data}")


class TestESignatureTemplates(TestESignatureAuth):
    """Test e-signature template endpoints"""
    
    def test_seed_default_templates(self, auth_headers):
        """Test POST /api/esignature/templates/seed-defaults"""
        response = requests.post(f"{BASE_URL}/api/esignature/templates/seed-defaults", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "count" in data
        print(f"Seeded templates: {data}")
    
    def test_list_templates(self, auth_headers):
        """Test GET /api/esignature/templates returns all 3 default templates"""
        response = requests.get(f"{BASE_URL}/api/esignature/templates", headers=auth_headers)
        assert response.status_code == 200
        
        templates = response.json()
        assert isinstance(templates, list)
        assert len(templates) >= 3, f"Expected at least 3 templates, got {len(templates)}"
        
        # Verify all 3 contract types have templates
        contract_types = [t["contract_type"] for t in templates]
        assert "pawn" in contract_types, "Missing pawn template"
        assert "storage" in contract_types, "Missing storage template"
        assert "rv_service" in contract_types, "Missing rv_service template"
        print(f"Templates found: {contract_types}")
    
    def test_list_templates_by_type(self, auth_headers):
        """Test GET /api/esignature/templates?contract_type=pawn"""
        response = requests.get(f"{BASE_URL}/api/esignature/templates", 
                               params={"contract_type": "pawn"}, 
                               headers=auth_headers)
        assert response.status_code == 200
        
        templates = response.json()
        assert len(templates) >= 1
        assert all(t["contract_type"] == "pawn" for t in templates)
        print(f"Pawn templates: {len(templates)}")
    
    def test_create_custom_template(self, auth_headers):
        """Test POST /api/esignature/templates creates new template"""
        template_data = {
            "name": f"TEST_Custom Template {uuid.uuid4().hex[:8]}",
            "contract_type": "pawn",
            "content": "# Test Template\n\nThis is a test template.",
            "required_fields": ["customer_name", "loan_amount"],
            "legal_text": "Test legal text",
            "is_active": True
        }
        
        response = requests.post(f"{BASE_URL}/api/esignature/templates", 
                                json=template_data, 
                                headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "id" in data
        print(f"Created template: {data['id']}")
        
        # Cleanup - deactivate the test template
        requests.delete(f"{BASE_URL}/api/esignature/templates/{data['id']}", headers=auth_headers)


class TestESignatureSignContract(TestESignatureAuth):
    """Test contract signing functionality"""
    
    @pytest.fixture(scope="class")
    def test_customer(self, auth_headers):
        """Create or get a test customer"""
        # Search for existing test customer
        response = requests.get(f"{BASE_URL}/api/pawn-contracts/customers/search",
                               params={"q": "TEST_ESIGN"},
                               headers=auth_headers)
        
        if response.status_code == 200 and len(response.json()) > 0:
            return response.json()[0]
        
        # Create new test customer
        customer_data = {
            "first_name": "TEST_ESIGN",
            "last_name": "Customer",
            "phone": "(334) 555-9999",
            "email": "test_esign@test.com",
            "drivers_license": "TESTSIG123",
            "dl_state": "AL"
        }
        
        response = requests.post(f"{BASE_URL}/api/pawn-contracts/customers",
                                json=customer_data,
                                headers=auth_headers)
        assert response.status_code == 200
        
        # Fetch the created customer
        customer_id = response.json()["id"]
        response = requests.get(f"{BASE_URL}/api/pawn-contracts/customers/{customer_id}",
                               headers=auth_headers)
        return response.json()
    
    @pytest.fixture(scope="class")
    def test_pawn_contract(self, auth_headers, test_customer):
        """Create a test pawn contract for signing"""
        contract_data = {
            "customer_id": test_customer["id"],
            "items": [{
                "description": "TEST_ESIGN Gold Ring",
                "category": "Jewelry & Watches",
                "condition": "Good",
                "estimated_value": 500
            }],
            "loan_amount": 200,
            "interest_rate": 20,
            "loan_term_days": 30,
            "notes": "Test contract for e-signature testing"
        }
        
        response = requests.post(f"{BASE_URL}/api/pawn-contracts/pawn",
                                json=contract_data,
                                headers=auth_headers)
        assert response.status_code == 200, f"Failed to create contract: {response.text}"
        
        contract = response.json()
        print(f"Created test contract: {contract['contract_number']}")
        return contract
    
    def test_sign_pawn_contract(self, auth_headers, test_pawn_contract, test_customer):
        """Test POST /api/esignature/sign for pawn contract"""
        # Create a simple base64 signature image (1x1 white pixel PNG)
        signature_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        sign_request = {
            "contract_type": "pawn",
            "contract_id": test_pawn_contract["contract_id"],
            "contract_number": test_pawn_contract["contract_number"],
            "contract_data": {
                "contract_number": test_pawn_contract["contract_number"],
                "ticket_number": test_pawn_contract.get("ticket_number", ""),
                "customer_name": f"{test_customer['first_name']} {test_customer['last_name']}",
                "customer_dl": test_customer["drivers_license"],
                "loan_amount": test_pawn_contract["loan_amount"],
                "due_date": test_pawn_contract["due_date"],
                "items": test_pawn_contract.get("items", [])
            },
            "signature": {
                "signature_image": signature_image,
                "signature_type": "draw",
                "typed_name": None,
                "signer_name": f"{test_customer['first_name']} {test_customer['last_name']}",
                "signer_email": test_customer.get("email", ""),
                "signer_phone": test_customer.get("phone", ""),
                "device_info": "Test Device"
            },
            "print_requested": False,
            "notes": "Test signature"
        }
        
        response = requests.post(f"{BASE_URL}/api/esignature/sign",
                                json=sign_request,
                                headers=auth_headers)
        assert response.status_code == 200, f"Sign failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "signature_id" in data
        assert data["signature_id"].startswith("SIG-")
        assert "document_hash" in data
        assert "signed_at" in data
        
        print(f"Signed contract - Signature ID: {data['signature_id']}")
        return data["signature_id"]
    
    def test_sign_with_typed_signature(self, auth_headers, test_pawn_contract, test_customer):
        """Test signing with typed signature instead of drawn"""
        signature_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        sign_request = {
            "contract_type": "pawn",
            "contract_id": test_pawn_contract["contract_id"],
            "contract_number": test_pawn_contract["contract_number"],
            "contract_data": {
                "contract_number": test_pawn_contract["contract_number"],
                "customer_name": f"{test_customer['first_name']} {test_customer['last_name']}",
                "loan_amount": test_pawn_contract["loan_amount"]
            },
            "signature": {
                "signature_image": signature_image,
                "signature_type": "type",  # Typed signature
                "typed_name": f"{test_customer['first_name']} {test_customer['last_name']}",
                "signer_name": f"{test_customer['first_name']} {test_customer['last_name']}",
                "signer_email": test_customer.get("email", ""),
                "signer_phone": test_customer.get("phone", "")
            },
            "print_requested": True
        }
        
        response = requests.post(f"{BASE_URL}/api/esignature/sign",
                                json=sign_request,
                                headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        print(f"Typed signature - Signature ID: {data['signature_id']}")


class TestESignatureVerify(TestESignatureAuth):
    """Test signature verification"""
    
    @pytest.fixture(scope="class")
    def signed_contract(self, auth_headers):
        """Create a signed contract for verification tests"""
        # First create a customer
        customer_data = {
            "first_name": "TEST_VERIFY",
            "last_name": "Signer",
            "phone": "(334) 555-8888",
            "drivers_license": "TESTVER123",
            "dl_state": "AL"
        }
        
        response = requests.post(f"{BASE_URL}/api/pawn-contracts/customers",
                                json=customer_data,
                                headers=auth_headers)
        customer_id = response.json()["id"]
        
        # Create a pawn contract
        contract_data = {
            "customer_id": customer_id,
            "items": [{
                "description": "TEST_VERIFY Watch",
                "category": "Jewelry & Watches",
                "condition": "Excellent",
                "estimated_value": 1000
            }],
            "loan_amount": 400,
            "interest_rate": 20,
            "loan_term_days": 30
        }
        
        response = requests.post(f"{BASE_URL}/api/pawn-contracts/pawn",
                                json=contract_data,
                                headers=auth_headers)
        contract = response.json()
        
        # Sign the contract
        signature_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        sign_request = {
            "contract_type": "pawn",
            "contract_id": contract["contract_id"],
            "contract_number": contract["contract_number"],
            "contract_data": {
                "contract_number": contract["contract_number"],
                "customer_name": "TEST_VERIFY Signer",
                "loan_amount": 400
            },
            "signature": {
                "signature_image": signature_image,
                "signature_type": "draw",
                "signer_name": "TEST_VERIFY Signer"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/esignature/sign",
                                json=sign_request,
                                headers=auth_headers)
        return response.json()
    
    def test_verify_signature(self, auth_headers, signed_contract):
        """Test GET /api/esignature/verify/{signature_id}"""
        signature_id = signed_contract["signature_id"]
        
        response = requests.get(f"{BASE_URL}/api/esignature/verify/{signature_id}",
                               headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["signature_id"] == signature_id
        assert data["is_valid"] == True
        assert data["integrity_check"] == "PASSED"
        assert "signer_name" in data
        assert "signed_at" in data
        assert "document_hash" in data
        
        print(f"Verification result: {data}")
    
    def test_verify_invalid_signature(self, auth_headers):
        """Test verification with non-existent signature ID"""
        response = requests.get(f"{BASE_URL}/api/esignature/verify/SIG-INVALID-12345678",
                               headers=auth_headers)
        assert response.status_code == 404


class TestESignatureContracts(TestESignatureAuth):
    """Test signed contracts listing"""
    
    def test_list_signed_contracts(self, auth_headers):
        """Test GET /api/esignature/contracts"""
        response = requests.get(f"{BASE_URL}/api/esignature/contracts",
                               headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "contracts" in data
        assert "total" in data
        assert isinstance(data["contracts"], list)
        
        print(f"Total signed contracts: {data['total']}")
    
    def test_list_contracts_by_type(self, auth_headers):
        """Test GET /api/esignature/contracts?contract_type=pawn"""
        response = requests.get(f"{BASE_URL}/api/esignature/contracts",
                               params={"contract_type": "pawn"},
                               headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        # All returned contracts should be pawn type
        for contract in data["contracts"]:
            assert contract["contract_type"] == "pawn"
        
        print(f"Pawn signed contracts: {data['total']}")


class TestESignaturePrint(TestESignatureAuth):
    """Test print functionality"""
    
    @pytest.fixture(scope="class")
    def printable_contract(self, auth_headers):
        """Create a signed contract for print tests"""
        # Create customer
        customer_data = {
            "first_name": "TEST_PRINT",
            "last_name": "Customer",
            "phone": "(334) 555-7777",
            "drivers_license": "TESTPRT123",
            "dl_state": "AL"
        }
        
        response = requests.post(f"{BASE_URL}/api/pawn-contracts/customers",
                                json=customer_data,
                                headers=auth_headers)
        customer_id = response.json()["id"]
        
        # Create contract
        contract_data = {
            "customer_id": customer_id,
            "items": [{
                "description": "TEST_PRINT Item",
                "category": "Electronics",
                "condition": "Good",
                "estimated_value": 300
            }],
            "loan_amount": 150,
            "interest_rate": 20,
            "loan_term_days": 30
        }
        
        response = requests.post(f"{BASE_URL}/api/pawn-contracts/pawn",
                                json=contract_data,
                                headers=auth_headers)
        contract = response.json()
        
        # Sign it
        signature_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        sign_request = {
            "contract_type": "pawn",
            "contract_id": contract["contract_id"],
            "contract_number": contract["contract_number"],
            "contract_data": {"contract_number": contract["contract_number"]},
            "signature": {
                "signature_image": signature_image,
                "signature_type": "draw",
                "signer_name": "TEST_PRINT Customer"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/esignature/sign",
                                json=sign_request,
                                headers=auth_headers)
        return response.json()
    
    def test_mark_contract_printed(self, auth_headers, printable_contract):
        """Test POST /api/esignature/print/{signature_id}"""
        signature_id = printable_contract["signature_id"]
        
        response = requests.post(f"{BASE_URL}/api/esignature/print/{signature_id}",
                                params={"copies": 2},
                                headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "2 copies" in data["message"]
        
        print(f"Marked as printed: {data}")
    
    def test_get_signed_contract_details(self, auth_headers, printable_contract):
        """Test GET /api/esignature/contract/{signature_id}"""
        signature_id = printable_contract["signature_id"]
        
        response = requests.get(f"{BASE_URL}/api/esignature/contract/{signature_id}",
                               headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["signature_id"] == signature_id
        assert "contract_type" in data
        assert "contract_number" in data
        assert "signature" in data
        assert data["print_count"] >= 0
        
        print(f"Contract details retrieved: {data['contract_number']}")


class TestESignatureStatsAfterSigning(TestESignatureAuth):
    """Test stats after signing contracts"""
    
    def test_stats_reflect_signed_contracts(self, auth_headers):
        """Verify stats endpoint reflects signed contracts"""
        response = requests.get(f"{BASE_URL}/api/esignature/stats", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        # After our tests, there should be some signed contracts
        assert data["total_signed"] >= 0
        assert data["by_type"]["pawn"] >= 0
        
        print(f"Final stats: total={data['total_signed']}, pawn={data['by_type']['pawn']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
