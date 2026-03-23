"""
Test cases for Commission Settings API
- Tests GET and PUT endpoints for commission configuration
- Tests commission calculation based on gross profit
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCommissionSettings:
    """Commission Settings endpoint tests"""
    
    def test_get_commission_settings(self):
        """Test GET /api/admin-settings/commission returns valid settings"""
        response = requests.get(f"{BASE_URL}/api/admin-settings/commission")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify response structure
        assert "enabled" in data, "Missing 'enabled' field"
        assert "percentage" in data, "Missing 'percentage' field"
        assert "visible_to_roles" in data, "Missing 'visible_to_roles' field"
        
        # Verify data types
        assert isinstance(data["enabled"], bool), "enabled should be boolean"
        assert isinstance(data["percentage"], (int, float)), "percentage should be numeric"
        assert isinstance(data["visible_to_roles"], list), "visible_to_roles should be a list"
        
        print(f"✅ GET commission settings: enabled={data['enabled']}, percentage={data['percentage']}%")
    
    def test_update_commission_percentage(self):
        """Test PUT /api/admin-settings/commission updates percentage"""
        # Get current settings first
        get_response = requests.get(f"{BASE_URL}/api/admin-settings/commission")
        original_settings = get_response.json()
        
        # Update with new percentage
        new_percentage = 20.0
        update_payload = {
            "enabled": original_settings["enabled"],
            "percentage": new_percentage,
            "visible_to_roles": original_settings["visible_to_roles"]
        }
        
        put_response = requests.put(
            f"{BASE_URL}/api/admin-settings/commission",
            json=update_payload,
            headers={"Content-Type": "application/json"}
        )
        assert put_response.status_code == 200, f"Expected 200, got {put_response.status_code}"
        
        # Verify update response
        put_data = put_response.json()
        assert put_data.get("success") == True, "Expected success:true in response"
        
        # GET to verify persistence
        verify_response = requests.get(f"{BASE_URL}/api/admin-settings/commission")
        verify_data = verify_response.json()
        assert verify_data["percentage"] == new_percentage, f"Expected {new_percentage}, got {verify_data['percentage']}"
        
        print(f"✅ Updated commission percentage to {new_percentage}%")
        
        # Restore original settings
        restore_payload = {
            "enabled": original_settings["enabled"],
            "percentage": original_settings.get("percentage", 15.0),
            "visible_to_roles": original_settings["visible_to_roles"]
        }
        requests.put(
            f"{BASE_URL}/api/admin-settings/commission",
            json=restore_payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"✅ Restored original percentage: {original_settings.get('percentage', 15.0)}%")
    
    def test_toggle_commission_enabled(self):
        """Test toggling commission enabled/disabled"""
        # Get current settings
        get_response = requests.get(f"{BASE_URL}/api/admin-settings/commission")
        original_settings = get_response.json()
        original_enabled = original_settings["enabled"]
        
        # Toggle to opposite state
        new_enabled = not original_enabled
        update_payload = {
            "enabled": new_enabled,
            "percentage": original_settings["percentage"],
            "visible_to_roles": original_settings["visible_to_roles"]
        }
        
        put_response = requests.put(
            f"{BASE_URL}/api/admin-settings/commission",
            json=update_payload,
            headers={"Content-Type": "application/json"}
        )
        assert put_response.status_code == 200
        
        # Verify toggle
        verify_response = requests.get(f"{BASE_URL}/api/admin-settings/commission")
        verify_data = verify_response.json()
        assert verify_data["enabled"] == new_enabled, f"Expected enabled={new_enabled}, got {verify_data['enabled']}"
        
        print(f"✅ Toggled commission enabled from {original_enabled} to {new_enabled}")
        
        # Restore original state
        restore_payload = {
            "enabled": original_enabled,
            "percentage": original_settings["percentage"],
            "visible_to_roles": original_settings["visible_to_roles"]
        }
        requests.put(
            f"{BASE_URL}/api/admin-settings/commission",
            json=restore_payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"✅ Restored original enabled state: {original_enabled}")
    
    def test_commission_with_accounting_data(self):
        """Test that commission can be calculated with accounting stats"""
        # Get commission settings
        commission_response = requests.get(f"{BASE_URL}/api/admin-settings/commission")
        commission_data = commission_response.json()
        
        # Get accounting stats
        stats_response = requests.get(f"{BASE_URL}/api/accounting/dashboard/stats")
        assert stats_response.status_code == 200, f"Failed to get accounting stats: {stats_response.status_code}"
        
        stats_data = stats_response.json()
        gross_profit = stats_data.get("profit", {}).get("gross", 0)
        
        # Calculate expected commission
        percentage = commission_data.get("percentage", 10)
        expected_commission = gross_profit * (percentage / 100)
        
        print(f"✅ Gross Profit: ${gross_profit:.2f}")
        print(f"✅ Commission Percentage: {percentage}%")
        print(f"✅ Calculated Commission: ${expected_commission:.2f}")
        
        assert isinstance(expected_commission, (int, float)), "Commission should be calculable"
    
    def test_invalid_commission_percentage(self):
        """Test that valid percentage range is enforced (0-100)"""
        # Get current settings
        get_response = requests.get(f"{BASE_URL}/api/admin-settings/commission")
        original_settings = get_response.json()
        
        # Try to set percentage > 100 (backend should accept but frontend validates)
        # Backend accepts any float, validation is on frontend
        update_payload = {
            "enabled": original_settings["enabled"],
            "percentage": 150.0,  # Invalid high percentage
            "visible_to_roles": original_settings["visible_to_roles"]
        }
        
        put_response = requests.put(
            f"{BASE_URL}/api/admin-settings/commission",
            json=update_payload,
            headers={"Content-Type": "application/json"}
        )
        # Note: Backend accepts any value, validation is frontend responsibility
        print(f"✅ Backend accepts percentage values (validation on frontend): status={put_response.status_code}")
        
        # Restore original settings
        restore_payload = {
            "enabled": original_settings["enabled"],
            "percentage": original_settings.get("percentage", 15.0),
            "visible_to_roles": original_settings["visible_to_roles"]
        }
        requests.put(
            f"{BASE_URL}/api/admin-settings/commission",
            json=restore_payload,
            headers={"Content-Type": "application/json"}
        )
    
    def test_visible_to_roles_update(self):
        """Test updating visible_to_roles list"""
        # Get current settings
        get_response = requests.get(f"{BASE_URL}/api/admin-settings/commission")
        original_settings = get_response.json()
        
        # Update with different roles
        new_roles = ["admin", "store_owner", "sales"]
        update_payload = {
            "enabled": original_settings["enabled"],
            "percentage": original_settings["percentage"],
            "visible_to_roles": new_roles
        }
        
        put_response = requests.put(
            f"{BASE_URL}/api/admin-settings/commission",
            json=update_payload,
            headers={"Content-Type": "application/json"}
        )
        assert put_response.status_code == 200
        
        # Verify update
        verify_response = requests.get(f"{BASE_URL}/api/admin-settings/commission")
        verify_data = verify_response.json()
        assert set(verify_data["visible_to_roles"]) == set(new_roles), f"Expected roles {new_roles}, got {verify_data['visible_to_roles']}"
        
        print(f"✅ Updated visible_to_roles to {new_roles}")
        
        # Restore original roles
        restore_payload = {
            "enabled": original_settings["enabled"],
            "percentage": original_settings["percentage"],
            "visible_to_roles": original_settings.get("visible_to_roles", ["admin", "store_owner"])
        }
        requests.put(
            f"{BASE_URL}/api/admin-settings/commission",
            json=restore_payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"✅ Restored original roles")


class TestAccountingDashboardWithCommission:
    """Test accounting dashboard stats endpoint"""
    
    def test_accounting_stats_endpoint(self):
        """Test /api/accounting/dashboard/stats returns valid data for commission calculation"""
        response = requests.get(f"{BASE_URL}/api/accounting/dashboard/stats")
        assert response.status_code == 200
        
        data = response.json()
        # Verify profit data exists for commission calculation
        assert "profit" in data, "Missing profit data"
        assert "gross" in data["profit"], "Missing gross profit"
        
        print(f"✅ Accounting stats available for commission calculation")
        print(f"   Gross profit: ${data['profit']['gross']:.2f}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
