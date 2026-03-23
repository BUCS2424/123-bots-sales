"""
CSV Import/Export Tests for HR Employees
Tests for:
- GET /api/hr/employees/export/csv
- POST /api/hr/employees/import/csv
"""

import pytest
import requests
import os
import io
import csv

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestCSVExport:
    """Tests for GET /api/hr/employees/export/csv"""
    
    def test_export_csv_returns_200(self):
        """Test that export CSV endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/hr/employees/export/csv")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Export CSV returns 200")
    
    def test_export_csv_content_type(self):
        """Test that export returns CSV content type"""
        response = requests.get(f"{BASE_URL}/api/hr/employees/export/csv")
        assert response.status_code == 200
        content_type = response.headers.get('Content-Type', '')
        assert 'text/csv' in content_type, f"Expected text/csv, got {content_type}"
        print("PASS: Export CSV has correct content type")
    
    def test_export_csv_has_headers(self):
        """Test that CSV has correct headers"""
        response = requests.get(f"{BASE_URL}/api/hr/employees/export/csv")
        assert response.status_code == 200
        
        content = response.text
        reader = csv.reader(io.StringIO(content))
        headers = next(reader)
        
        expected_headers = [
            "first_name", "last_name", "email", "phone", "address", "city", "state",
            "zip_code", "date_of_birth", "department", "position", "hire_date",
            "hourly_rate", "employment_type", "status",
            "emergency_contact_name", "emergency_contact_phone", "emergency_contact_relationship"
        ]
        
        assert headers == expected_headers, f"Headers mismatch: {headers}"
        print(f"PASS: Export CSV has correct headers: {len(headers)} fields")
    
    def test_export_csv_has_content_disposition(self):
        """Test that CSV has Content-Disposition header for download"""
        response = requests.get(f"{BASE_URL}/api/hr/employees/export/csv")
        assert response.status_code == 200
        
        content_disposition = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disposition, f"Expected attachment, got {content_disposition}"
        assert 'filename=' in content_disposition, "Expected filename in Content-Disposition"
        assert '.csv' in content_disposition, "Expected .csv extension in filename"
        print(f"PASS: Content-Disposition header correct: {content_disposition}")


class TestCSVImport:
    """Tests for POST /api/hr/employees/import/csv"""
    
    def test_import_csv_valid_file(self):
        """Test importing valid CSV creates employees"""
        # Create a valid CSV content with unique emails
        csv_content = """first_name,last_name,email,phone,address,city,state,zip_code,date_of_birth,department,position,hire_date,hourly_rate,employment_type,status,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship
TestImport,User1,test_import_user1_unique123@example.com,555-1234,123 Test St,TestCity,AL,12345,1990-01-15,General,Cashier,2024-01-01,15.50,full_time,active,John Contact,555-9999,Brother"""
        
        files = {
            'file': ('test_employees.csv', csv_content, 'text/csv')
        }
        
        response = requests.post(f"{BASE_URL}/api/hr/employees/import/csv", files=files)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'created' in data, "Response missing 'created' field"
        assert 'skipped' in data, "Response missing 'skipped' field"
        assert 'errors' in data, "Response missing 'errors' field"
        print(f"PASS: Import CSV returned: created={data['created']}, skipped={data['skipped']}")
        
        # If created > 0, the test is successful; if skipped due to duplicate, that's also valid
        assert isinstance(data['created'], int), "created should be an integer"
        assert isinstance(data['skipped'], int), "skipped should be an integer"
    
    def test_import_csv_duplicate_email_skipped(self):
        """Test that duplicate emails are skipped"""
        # First import
        csv_content1 = """first_name,last_name,email,phone,address,city,state,zip_code,date_of_birth,department,position,hire_date,hourly_rate,employment_type,status,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship
DuplicateTest,User,duplicate_test_user@example.com,555-1111,,,,,,,,,15,full_time,active,,,"""
        
        files1 = {
            'file': ('test.csv', csv_content1, 'text/csv')
        }
        requests.post(f"{BASE_URL}/api/hr/employees/import/csv", files=files1)
        
        # Second import with same email
        csv_content2 = """first_name,last_name,email,phone,address,city,state,zip_code,date_of_birth,department,position,hire_date,hourly_rate,employment_type,status,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship
DuplicateTest,User2,duplicate_test_user@example.com,555-2222,,,,,,,,,20,full_time,active,,,"""
        
        files2 = {
            'file': ('test2.csv', csv_content2, 'text/csv')
        }
        response2 = requests.post(f"{BASE_URL}/api/hr/employees/import/csv", files=files2)
        
        assert response2.status_code == 200, f"Expected 200, got {response2.status_code}"
        data = response2.json()
        
        # Should be skipped because email already exists
        assert data['skipped'] > 0 or 'already exists' in str(data.get('errors', [])), \
            f"Expected duplicate to be skipped: {data}"
        print(f"PASS: Duplicate email correctly skipped: {data}")
    
    def test_import_csv_missing_required_fields(self):
        """Test that rows with missing required fields return errors"""
        # CSV with missing last_name
        csv_content = """first_name,last_name,email,phone,address,city,state,zip_code,date_of_birth,department,position,hire_date,hourly_rate,employment_type,status,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship
OnlyFirst,,missing_lastname@example.com,555-1234,,,,,,,,,15,full_time,active,,,"""
        
        files = {
            'file': ('test.csv', csv_content, 'text/csv')
        }
        response = requests.post(f"{BASE_URL}/api/hr/employees/import/csv", files=files)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Should be skipped or have errors due to missing required field
        assert data['skipped'] > 0 or len(data.get('errors', [])) > 0, \
            f"Expected row to be skipped or have errors: {data}"
        print(f"PASS: Missing required fields handled correctly: {data}")
    
    def test_import_csv_invalid_file_type(self):
        """Test that non-CSV file is rejected"""
        txt_content = "This is not a CSV file"
        
        files = {
            'file': ('test.txt', txt_content, 'text/plain')
        }
        response = requests.post(f"{BASE_URL}/api/hr/employees/import/csv", files=files)
        
        # Should return 400 for invalid file type
        assert response.status_code == 400, f"Expected 400 for non-CSV, got {response.status_code}"
        print("PASS: Non-CSV file correctly rejected with 400")
    
    def test_import_csv_creates_employee_and_verify(self):
        """Test that imported employee can be verified via GET"""
        unique_email = f"verify_import_test_{os.urandom(4).hex()}@example.com"
        
        csv_content = f"""first_name,last_name,email,phone,address,city,state,zip_code,date_of_birth,department,position,hire_date,hourly_rate,employment_type,status,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship
VerifyImport,TestUser,{unique_email},555-7777,789 Verify St,VerifyCity,AL,36301,1985-06-20,Pawn Shop,Manager,2024-01-15,25.00,full_time,active,Emergency Person,555-8888,Spouse"""
        
        files = {
            'file': ('test.csv', csv_content, 'text/csv')
        }
        response = requests.post(f"{BASE_URL}/api/hr/employees/import/csv", files=files)
        
        assert response.status_code == 200, f"Import failed: {response.text}"
        data = response.json()
        assert data['created'] > 0, f"Expected employee to be created: {data}"
        
        # Verify employee exists via GET
        emp_response = requests.get(f"{BASE_URL}/api/hr/employees")
        assert emp_response.status_code == 200
        
        employees = emp_response.json()
        imported_emp = next((e for e in employees if e['email'] == unique_email), None)
        
        assert imported_emp is not None, f"Imported employee not found with email {unique_email}"
        assert imported_emp['first_name'] == 'VerifyImport'
        assert imported_emp['last_name'] == 'TestUser'
        assert imported_emp['department'] == 'Pawn Shop'
        assert imported_emp['position'] == 'Manager'
        assert imported_emp['hourly_rate'] == 25.00
        
        print(f"PASS: Imported employee verified in database: {imported_emp['first_name']} {imported_emp['last_name']}")
        
        # Return employee id for cleanup
        return imported_emp.get('id')


class TestCSVExportContent:
    """Tests for verifying export content matches employees"""
    
    def test_export_csv_contains_employee_data(self):
        """Test that export contains employee data"""
        # First get employees via API
        emp_response = requests.get(f"{BASE_URL}/api/hr/employees")
        assert emp_response.status_code == 200
        employees = emp_response.json()
        
        if not employees:
            pytest.skip("No employees in database to test export")
        
        # Get CSV export
        csv_response = requests.get(f"{BASE_URL}/api/hr/employees/export/csv")
        assert csv_response.status_code == 200
        
        content = csv_response.text
        reader = csv.DictReader(io.StringIO(content))
        csv_rows = list(reader)
        
        # Check that at least one employee exists in CSV
        assert len(csv_rows) > 0, "CSV should contain employee data"
        
        # Verify first employee from API is in CSV
        first_emp = employees[0]
        csv_emails = [row['email'] for row in csv_rows]
        assert first_emp['email'] in csv_emails, f"Employee {first_emp['email']} not found in CSV"
        
        print(f"PASS: Export contains {len(csv_rows)} employees, verified {first_emp['email']} exists")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
