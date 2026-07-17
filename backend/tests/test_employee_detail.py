"""
Test suite for Employee Detail Page feature - HR module
Tests backend API endpoints for employee details, updates, and time-off requests
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bots-ecommerce-hub.preview.emergentagent.com')
API = f"{BASE_URL}/api"

# Test employee ID provided
TEST_EMPLOYEE_ID = "8af91ef6-6942-4548-a51c-6073d1b7ec73"

class TestEmployeeDetailAPI:
    """Test GET /api/hr/employees/{id} endpoint"""
    
    def test_get_employee_by_id_returns_200(self):
        """Test that getting employee by valid ID returns 200"""
        response = requests.get(f"{API}/hr/employees/{TEST_EMPLOYEE_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ GET /api/hr/employees/{TEST_EMPLOYEE_ID} returns 200")
    
    def test_get_employee_returns_complete_data(self):
        """Test that employee response contains all required fields"""
        response = requests.get(f"{API}/hr/employees/{TEST_EMPLOYEE_ID}")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check required fields from EmployeeResponse model
        required_fields = [
            'id', 'first_name', 'last_name', 'email', 'department',
            'position', 'hourly_rate', 'employment_type', 'status', 'created_at'
        ]
        
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Validate specific values for test employee
        assert data['id'] == TEST_EMPLOYEE_ID
        assert data['first_name'] == 'John'
        assert data['last_name'] == 'Doe'
        assert data['department'] == 'Pawn Shop'
        assert data['status'] == 'active'
        print(f"✓ Employee data contains all required fields with correct values")
    
    def test_get_employee_invalid_id_returns_404(self):
        """Test that non-existent employee returns 404"""
        invalid_id = "non-existent-id-12345"
        response = requests.get(f"{API}/hr/employees/{invalid_id}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Non-existent employee ID returns 404")


class TestEmployeeUpdateAPI:
    """Test PUT /api/hr/employees/{id} endpoint"""
    
    def test_update_employee_returns_200(self):
        """Test that updating employee returns 200"""
        # Get current employee data first
        get_response = requests.get(f"{API}/hr/employees/{TEST_EMPLOYEE_ID}")
        assert get_response.status_code == 200
        original_data = get_response.json()
        
        # Update with same data (no actual change to preserve test data)
        update_data = {
            "first_name": original_data['first_name'],
            "last_name": original_data['last_name'],
            "email": original_data['email'],
            "phone": original_data.get('phone'),
            "department": original_data['department'],
            "position": original_data.get('position'),
            "hourly_rate": original_data['hourly_rate'],
            "employment_type": original_data['employment_type'],
            "status": original_data['status']
        }
        
        response = requests.put(
            f"{API}/hr/employees/{TEST_EMPLOYEE_ID}",
            json=update_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ PUT /api/hr/employees/{TEST_EMPLOYEE_ID} returns 200")
    
    def test_update_employee_persists_changes(self):
        """Test that employee updates are persisted"""
        # Get current data
        get_response = requests.get(f"{API}/hr/employees/{TEST_EMPLOYEE_ID}")
        original_data = get_response.json()
        original_phone = original_data.get('phone')
        
        # Update phone number
        new_phone = "555-999-8888"
        update_data = {
            "phone": new_phone
        }
        
        update_response = requests.put(
            f"{API}/hr/employees/{TEST_EMPLOYEE_ID}",
            json=update_data,
            headers={"Content-Type": "application/json"}
        )
        assert update_response.status_code == 200
        
        # Verify update persisted
        verify_response = requests.get(f"{API}/hr/employees/{TEST_EMPLOYEE_ID}")
        assert verify_response.status_code == 200
        updated_data = verify_response.json()
        assert updated_data['phone'] == new_phone, f"Phone not updated, got: {updated_data.get('phone')}"
        
        # Restore original phone
        restore_data = {"phone": original_phone if original_phone else "555-123-4567"}
        requests.put(
            f"{API}/hr/employees/{TEST_EMPLOYEE_ID}",
            json=restore_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"✓ Employee update persists changes and can be verified via GET")


class TestTimeOffRequestsAPI:
    """Test time-off requests filtered by employee"""
    
    def test_get_time_off_by_employee_returns_list(self):
        """Test GET /api/hr/time-off?employee_id={id} returns list"""
        response = requests.get(f"{API}/hr/time-off", params={"employee_id": TEST_EMPLOYEE_ID})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/hr/time-off?employee_id={TEST_EMPLOYEE_ID} returns list (count: {len(data)})")


class TestHRSettingsAPI:
    """Test HR settings endpoint (needed for employee detail page)"""
    
    def test_get_hr_settings_returns_200(self):
        """Test GET /api/hr/settings returns 200"""
        response = requests.get(f"{API}/hr/settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ GET /api/hr/settings returns 200")
    
    def test_hr_settings_contains_departments_and_positions(self):
        """Test that HR settings contain departments and positions for dropdowns"""
        response = requests.get(f"{API}/hr/settings")
        assert response.status_code == 200
        
        data = response.json()
        assert 'departments' in data, "HR settings should contain departments"
        assert 'positions' in data, "HR settings should contain positions"
        assert isinstance(data['departments'], list), "Departments should be a list"
        assert isinstance(data['positions'], list), "Positions should be a list"
        assert len(data['departments']) > 0, "Departments list should not be empty"
        assert len(data['positions']) > 0, "Positions list should not be empty"
        print(f"✓ HR settings contain departments ({len(data['departments'])}) and positions ({len(data['positions'])})")


class TestEmployeeListAPI:
    """Test employee list endpoint (used for navigation)"""
    
    def test_get_employees_returns_list(self):
        """Test GET /api/hr/employees returns list"""
        response = requests.get(f"{API}/hr/employees")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least one employee"
        print(f"✓ GET /api/hr/employees returns list with {len(data)} employee(s)")
    
    def test_employee_in_list_has_required_fields(self):
        """Test that employees in list have fields needed for table display"""
        response = requests.get(f"{API}/hr/employees")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) > 0
        
        employee = data[0]
        required_fields = ['id', 'first_name', 'last_name', 'email', 'department', 'status']
        
        for field in required_fields:
            assert field in employee, f"Employee in list missing field: {field}"
        
        print(f"✓ Employee list items contain all required fields for table display")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
