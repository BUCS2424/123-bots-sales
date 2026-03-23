"""
Test suite for Accounting Dashboard API endpoints
Tests revenue, cost, profit calculations, date filtering, and report generation
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAccountingDashboardStats:
    """Tests for /api/accounting/dashboard/stats endpoint"""
    
    def test_stats_default_period(self):
        """Test dashboard stats with default 30-day period"""
        response = requests.get(f"{BASE_URL}/api/accounting/dashboard/stats")
        assert response.status_code == 200
        
        data = response.json()
        # Verify structure
        assert "period" in data
        assert "revenue" in data
        assert "costs" in data
        assert "profit" in data
        assert "orders" in data
        assert "products" in data
        assert "customers" in data
        
        # Verify revenue structure
        assert "gross" in data["revenue"]
        assert "net" in data["revenue"]
        assert "refunds" in data["revenue"]
        assert "average_order" in data["revenue"]
        
        # Verify profit calculation: profit = net_revenue - cost
        expected_profit = data["revenue"]["net"] - data["costs"]["total"]
        assert abs(data["profit"]["gross"] - expected_profit) < 0.01
        print(f"Stats: Revenue=${data['revenue']['net']}, Cost=${data['costs']['total']}, Profit=${data['profit']['gross']}")

    def test_stats_7_day_period(self):
        """Test stats with 7-day filter"""
        response = requests.get(f"{BASE_URL}/api/accounting/dashboard/stats", params={"period": "7"})
        assert response.status_code == 200
        data = response.json()
        assert data["period"]["label"] == "7"
        print(f"7-day period: {data['period']['start']} to {data['period']['end']}")

    def test_stats_30_day_period(self):
        """Test stats with 30-day filter"""
        response = requests.get(f"{BASE_URL}/api/accounting/dashboard/stats", params={"period": "30"})
        assert response.status_code == 200
        data = response.json()
        assert data["period"]["label"] == "30"

    def test_stats_60_day_period(self):
        """Test stats with 60-day filter"""
        response = requests.get(f"{BASE_URL}/api/accounting/dashboard/stats", params={"period": "60"})
        assert response.status_code == 200
        data = response.json()
        assert data["period"]["label"] == "60"

    def test_stats_90_day_period(self):
        """Test stats with 90-day filter"""
        response = requests.get(f"{BASE_URL}/api/accounting/dashboard/stats", params={"period": "90"})
        assert response.status_code == 200
        data = response.json()
        assert data["period"]["label"] == "90"

    def test_stats_365_day_period(self):
        """Test stats with 365-day filter"""
        response = requests.get(f"{BASE_URL}/api/accounting/dashboard/stats", params={"period": "365"})
        assert response.status_code == 200
        data = response.json()
        assert data["period"]["label"] == "365"

    def test_stats_all_time_period(self):
        """Test stats with all-time filter"""
        response = requests.get(f"{BASE_URL}/api/accounting/dashboard/stats", params={"period": "all"})
        assert response.status_code == 200
        data = response.json()
        assert data["period"]["label"] == "all"
        assert data["period"]["start"] == "2020-01-01"

    def test_stats_custom_date_range(self):
        """Test stats with custom date range"""
        response = requests.get(f"{BASE_URL}/api/accounting/dashboard/stats", params={
            "start_date": "2026-01-01",
            "end_date": "2026-03-07"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["period"]["label"] == "custom"
        assert data["period"]["start"] == "2026-01-01"
        print(f"Custom range: {data['period']['start']} to {data['period']['end']}")


class TestAccountingDailyBreakdown:
    """Tests for /api/accounting/dashboard/daily endpoint"""
    
    def test_daily_breakdown_returns_list(self):
        """Test daily breakdown endpoint returns list of daily data"""
        response = requests.get(f"{BASE_URL}/api/accounting/dashboard/daily", params={"period": "30"})
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            day = data[0]
            assert "date" in day
            assert "orders" in day
            assert "revenue" in day
            assert "cost" in day
            assert "profit" in day
            # Verify profit calculation per day
            assert abs(day["profit"] - (day["revenue"] - day["cost"])) < 0.01
            print(f"Daily data sample: {day['date']} - Revenue=${day['revenue']}, Profit=${day['profit']}")


class TestAccountingProductsBreakdown:
    """Tests for /api/accounting/dashboard/products endpoint"""
    
    def test_products_breakdown(self):
        """Test products breakdown returns product-level sales data"""
        response = requests.get(f"{BASE_URL}/api/accounting/dashboard/products", params={"period": "30", "limit": 10})
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            product = data[0]
            assert "product_id" in product
            assert "name" in product
            assert "units_sold" in product
            assert "revenue" in product
            assert "cost" in product
            assert "profit" in product
            assert "margin" in product
            # Verify profit calculation
            assert abs(product["profit"] - (product["revenue"] - product["cost"])) < 0.01
            print(f"Top product: {product['name']} - Units={product['units_sold']}, Revenue=${product['revenue']}")


class TestAccountingOrdersBreakdown:
    """Tests for /api/accounting/dashboard/orders-breakdown endpoint"""
    
    def test_orders_breakdown_structure(self):
        """Test orders breakdown returns status and payment method data"""
        response = requests.get(f"{BASE_URL}/api/accounting/dashboard/orders-breakdown", params={"period": "30"})
        assert response.status_code == 200
        
        data = response.json()
        assert "by_status" in data
        assert "by_payment_method" in data
        assert "by_source" in data
        
        # Verify by_source structure
        assert "web" in data["by_source"]
        assert "pos" in data["by_source"]
        
        # Check count and total fields
        if "paid" in data["by_status"]:
            assert "count" in data["by_status"]["paid"]
            assert "total" in data["by_status"]["paid"]
        
        print(f"Orders breakdown: By status={list(data['by_status'].keys())}, By payment={list(data['by_payment_method'].keys())}")


class TestAccountingFullReport:
    """Tests for /api/accounting/dashboard/report endpoint"""
    
    def test_full_report_generation(self):
        """Test full report generates comprehensive data"""
        response = requests.get(f"{BASE_URL}/api/accounting/dashboard/report", params={"period": "30"})
        assert response.status_code == 200
        
        data = response.json()
        # Verify report structure
        assert "generated_at" in data
        assert "period" in data
        assert "summary" in data
        assert "inventory" in data
        assert "daily_breakdown" in data
        assert "top_products" in data
        assert "orders_breakdown" in data
        
        # Verify summary contains all financial metrics
        summary = data["summary"]
        assert "gross_revenue" in summary
        assert "net_revenue" in summary
        assert "total_cost" in summary
        assert "gross_profit" in summary
        assert "profit_margin" in summary
        assert "total_orders" in summary
        assert "items_sold" in summary
        
        # Verify profit calculation in summary
        expected_profit = summary["net_revenue"] - summary["total_cost"]
        assert abs(summary["gross_profit"] - expected_profit) < 0.01
        
        print(f"Report generated at: {data['generated_at']}")
        print(f"Summary: Revenue=${summary['net_revenue']}, Cost=${summary['total_cost']}, Profit=${summary['gross_profit']}")


class TestProfitCalculation:
    """Test profit calculation correctness: Revenue - Cost = Profit"""
    
    def test_profit_formula_in_stats(self):
        """Verify Revenue - Cost = Profit in dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/accounting/dashboard/stats", params={"period": "all"})
        assert response.status_code == 200
        
        data = response.json()
        revenue = data["revenue"]["net"]
        cost = data["costs"]["total"]
        profit = data["profit"]["gross"]
        
        calculated_profit = revenue - cost
        assert abs(profit - calculated_profit) < 0.01, f"Profit mismatch: {profit} vs {calculated_profit}"
        
        # Verify margin percentage
        if revenue > 0:
            expected_margin = (profit / revenue) * 100
            assert abs(data["profit"]["margin_percentage"] - expected_margin) < 0.1
        
        print(f"Profit formula verified: ${revenue} - ${cost} = ${profit} ({data['profit']['margin_percentage']}% margin)")
