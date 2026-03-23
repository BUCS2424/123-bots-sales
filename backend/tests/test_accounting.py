"""
Test Suite for Accounting Module
Tests all 6 accounting endpoints for the Alabama Pawn Shop
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if BASE_URL:
    BASE_URL = BASE_URL.rstrip('/')

class TestAccountingEndpoints:
    """Test all accounting API endpoints"""

    def test_daily_snapshot_returns_correct_structure(self):
        """GET /api/accounting/daily-snapshot - verify structure"""
        response = requests.get(f"{BASE_URL}/api/accounting/daily-snapshot")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify all required fields are present
        required_fields = [
            'report_date', 'beginning_cash', 'new_loans_written', 'new_loans_count',
            'buys_cash_out', 'buys_count', 'loan_redemptions', 'redemptions_count',
            'service_charges', 'retail_sales', 'sales_tax_collected', 
            'ending_cash', 'net_cash_flow'
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Verify data types
        assert isinstance(data['report_date'], str)
        assert isinstance(data['beginning_cash'], (int, float))
        assert isinstance(data['new_loans_written'], (int, float))
        assert isinstance(data['new_loans_count'], int)
        assert isinstance(data['service_charges'], (int, float))
        print(f"Daily Snapshot Response: beginning_cash={data['beginning_cash']}, ending_cash={data['ending_cash']}")

    def test_daily_snapshot_with_date_param(self):
        """GET /api/accounting/daily-snapshot?report_date=YYYY-MM-DD"""
        today = datetime.now().strftime("%Y-%m-%d")
        response = requests.get(f"{BASE_URL}/api/accounting/daily-snapshot", params={'report_date': today})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data['report_date'] == today, f"Expected date {today}, got {data['report_date']}"
        print(f"Daily Snapshot for {today}: {data}")

    def test_inventory_valuation_returns_correct_structure(self):
        """GET /api/accounting/inventory-valuation - verify 3 categories"""
        response = requests.get(f"{BASE_URL}/api/accounting/inventory-valuation")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify all required fields for 3 inventory categories
        required_fields = [
            'pawn_receivables', 'pawn_receivables_count',
            'buy_inventory_value', 'buy_inventory_cost', 'buy_inventory_count',
            'forfeited_value', 'forfeited_loan_value', 'forfeited_count',
            'total_inventory_value'
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Verify numeric types
        assert isinstance(data['pawn_receivables'], (int, float))
        assert isinstance(data['buy_inventory_value'], (int, float))
        assert isinstance(data['forfeited_value'], (int, float))
        print(f"Inventory Valuation: pawn_receivables={data['pawn_receivables']}, buy_inventory={data['buy_inventory_value']}, forfeited={data['forfeited_value']}")

    def test_kpis_returns_yield_redemption_aging(self):
        """GET /api/accounting/kpis - verify yield, redemption rate, inventory aging"""
        response = requests.get(f"{BASE_URL}/api/accounting/kpis")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify all required KPI fields
        required_fields = [
            'total_contracts', 'active_contracts', 'paid_contracts', 'defaulted_contracts',
            'total_principal_outstanding', 'yield_on_loans', 'redemption_rate',
            'avg_loan_amount', 'inventory_aging', 'total_retail_items'
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Verify inventory_aging has correct buckets
        aging = data['inventory_aging']
        assert '0-30' in aging, "Missing aging bucket: 0-30"
        assert '31-60' in aging, "Missing aging bucket: 31-60"
        assert '61-90' in aging, "Missing aging bucket: 61-90"
        assert '90+' in aging, "Missing aging bucket: 90+"
        
        print(f"KPIs: yield={data['yield_on_loans']}%, redemption_rate={data['redemption_rate']}%, active_contracts={data['active_contracts']}")
        print(f"Inventory Aging: {aging}")

    def test_sales_tax_returns_al_breakdown(self):
        """GET /api/accounting/sales-tax - verify AL tax breakdown"""
        response = requests.get(f"{BASE_URL}/api/accounting/sales-tax")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify all required tax fields
        required_fields = [
            'report_period', 'taxable_retail_sales', 'tax_collected',
            'non_taxable_service_charges', 'state_tax_rate', 'local_tax_rate',
            'combined_rate', 'state_tax_due', 'local_tax_due', 'total_tax_due',
            'total_orders'
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Verify AL state tax rate is 4%
        assert data['state_tax_rate'] == 4.0, f"Expected state_tax_rate=4.0, got {data['state_tax_rate']}"
        
        # Verify combined rate is state + local
        expected_combined = data['state_tax_rate'] + data['local_tax_rate']
        assert data['combined_rate'] == expected_combined, f"Combined rate mismatch"
        
        print(f"Sales Tax: taxable={data['taxable_retail_sales']}, non_taxable={data['non_taxable_service_charges']}, total_due={data['total_tax_due']}")

    def test_sales_tax_with_month_param(self):
        """GET /api/accounting/sales-tax?report_month=YYYY-MM"""
        month = datetime.now().strftime("%Y-%m")
        response = requests.get(f"{BASE_URL}/api/accounting/sales-tax", params={'report_month': month})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data['report_period'] == month, f"Expected period {month}, got {data['report_period']}"

    def test_journal_entries_returns_double_entry(self):
        """GET /api/accounting/journal-entries - verify debit/credit accounts"""
        response = requests.get(f"{BASE_URL}/api/accounting/journal-entries")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify required fields
        assert 'report_date' in data
        assert 'entries' in data
        assert 'total_debits' in data
        assert 'total_credits' in data
        
        # If there are entries, verify they have double-entry structure
        if data['entries']:
            entry = data['entries'][0]
            assert 'debit_account' in entry, "Entry missing debit_account"
            assert 'credit_account' in entry, "Entry missing credit_account"
            assert 'amount' in entry, "Entry missing amount"
            assert 'description' in entry, "Entry missing description"
            assert 'type' in entry, "Entry missing type"
            print(f"Sample Journal Entry: {entry}")
        
        print(f"Journal Entries: count={len(data['entries'])}, total_debits={data['total_debits']}, total_credits={data['total_credits']}")

    def test_journal_entries_with_date_param(self):
        """GET /api/accounting/journal-entries?report_date=YYYY-MM-DD"""
        today = datetime.now().strftime("%Y-%m-%d")
        response = requests.get(f"{BASE_URL}/api/accounting/journal-entries", params={'report_date': today})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data['report_date'] == today

    def test_monthly_summary_returns_combined_data(self):
        """GET /api/accounting/monthly-summary - verify combined monthly data"""
        response = requests.get(f"{BASE_URL}/api/accounting/monthly-summary")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify all required monthly summary fields
        required_fields = [
            'report_period', 'loans_written', 'total_loaned',
            'buys_made', 'total_bought', 'redemptions', 'principal_collected',
            'interest_collected', 'defaults', 'retail_revenue', 'sales_tax_collected',
            'total_revenue', 'total_cash_out', 'net_income'
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Verify net_income calculation: total_revenue - total_cash_out
        expected_net = data['total_revenue'] - data['total_cash_out']
        assert abs(data['net_income'] - expected_net) < 0.01, f"Net income mismatch: {data['net_income']} vs expected {expected_net}"
        
        print(f"Monthly Summary: loans={data['loans_written']}, buys={data['buys_made']}, interest={data['interest_collected']}, net_income={data['net_income']}")

    def test_monthly_summary_with_month_param(self):
        """GET /api/accounting/monthly-summary?report_month=YYYY-MM"""
        month = datetime.now().strftime("%Y-%m")
        response = requests.get(f"{BASE_URL}/api/accounting/monthly-summary", params={'report_month': month})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data['report_period'] == month

    def test_all_endpoints_return_valid_numeric_values(self):
        """Verify all endpoints return valid non-negative monetary values"""
        endpoints = [
            ('/api/accounting/daily-snapshot', ['beginning_cash', 'ending_cash']),
            ('/api/accounting/inventory-valuation', ['pawn_receivables', 'buy_inventory_value', 'total_inventory_value']),
            ('/api/accounting/kpis', ['total_principal_outstanding', 'avg_loan_amount']),
            ('/api/accounting/sales-tax', ['taxable_retail_sales', 'total_tax_due']),
            ('/api/accounting/monthly-summary', ['total_loaned', 'total_revenue'])
        ]
        
        for endpoint, fields in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            assert response.status_code == 200, f"Failed {endpoint}"
            data = response.json()
            for field in fields:
                value = data.get(field, 0)
                assert value >= 0, f"{endpoint} - {field} has negative value: {value}"
        
        print("All monetary values are valid and non-negative")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
