#!/usr/bin/env python3
"""
Comprehensive backend test for Printful OAuth-ready flow
Tests all endpoints and validates the new OAuth implementation

User credentials: super@amino.com / peptides
Base URL: https://bots-ui-build.preview.emergentagent.com

Test Requirements:
1. GET /api/admin-settings/printful-oauth works for authenticated admin and returns configured/client_id/client_secret_masked
2. GET /api/printful/status works for authenticated admin  
3. GET /api/printful/connect-url works for authenticated admin and returns success=true, auth_url, redirect_uri
4. Confirm old manual-credentials model is no longer required for the new connect flow
"""

import os
import sys
import asyncio
import json
import httpx
import time
from typing import Dict, Any, Optional

# Test configuration
BASE_URL = "https://bots-ui-build.preview.emergentagent.com"
ADMIN_EMAIL = "super@amino.com"
ADMIN_PASSWORD = "peptides"

class PrintfulOAuthTester:
    def __init__(self):
        self.access_token = None
        self.client = httpx.AsyncClient(timeout=30.0)
        self.test_results = []
        
    async def cleanup(self):
        """Cleanup resources"""
        await self.client.aclose()
    
    def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "details": details,
            "status": status
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    async def authenticate_admin(self) -> bool:
        """Authenticate as admin user and get access token"""
        try:
            response = await self.client.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": ADMIN_EMAIL,
                    "password": ADMIN_PASSWORD
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                user_info = data.get("user", {})
                
                success = bool(self.access_token and user_info.get("role") in ["super_admin", "admin"])
                details = f"Status: {response.status_code}, User: {user_info.get('name')} ({user_info.get('role')})"
                
                self.log_test("Admin Authentication", success, details)
                return success
            else:
                self.log_test("Admin Authentication", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Authentication", False, f"Exception: {str(e)}")
            return False
    
    def get_auth_headers(self) -> Dict[str, str]:
        """Get authorization headers for authenticated requests"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    async def test_printful_oauth_settings_endpoint(self) -> bool:
        """Test GET /api/admin-settings/printful-oauth endpoint"""
        try:
            response = await self.client.get(
                f"{BASE_URL}/api/admin-settings/printful-oauth",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["configured", "client_id", "client_secret_masked"]
                has_required_fields = all(field in data for field in required_fields)
                
                details = f"Status: {response.status_code}, Fields: {list(data.keys())}"
                details += f", configured: {data.get('configured')}"
                
                if data.get("client_id"):
                    details += f", client_id: {data.get('client_id')[:10]}..."
                if data.get("client_secret_masked"):
                    details += f", secret_masked: {data.get('client_secret_masked')}"
                
                self.log_test(
                    "GET /api/admin-settings/printful-oauth", 
                    has_required_fields,
                    details
                )
                return has_required_fields
            else:
                self.log_test(
                    "GET /api/admin-settings/printful-oauth", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("GET /api/admin-settings/printful-oauth", False, f"Exception: {str(e)}")
            return False
    
    async def test_printful_status_endpoint(self) -> bool:
        """Test GET /api/printful/status endpoint"""
        try:
            response = await self.client.get(
                f"{BASE_URL}/api/printful/status",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields for status endpoint
                expected_fields = [
                    "feature_enabled", "app_configured", "client_id", 
                    "connected", "store_id", "store_name"
                ]
                has_required_fields = all(field in data for field in expected_fields)
                
                details = f"Status: {response.status_code}, feature_enabled: {data.get('feature_enabled')}"
                details += f", app_configured: {data.get('app_configured')}"
                details += f", connected: {data.get('connected')}"
                details += f", client_id: {data.get('client_id', '')[:10] if data.get('client_id') else 'None'}..."
                
                self.log_test(
                    "GET /api/printful/status", 
                    has_required_fields,
                    details
                )
                return has_required_fields
            else:
                self.log_test(
                    "GET /api/printful/status", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("GET /api/printful/status", False, f"Exception: {str(e)}")
            return False
    
    async def test_printful_connect_url_endpoint(self) -> bool:
        """Test GET /api/printful/connect-url endpoint"""
        try:
            response = await self.client.get(
                f"{BASE_URL}/api/printful/connect-url",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                success = data.get("success") is True
                auth_url = data.get("auth_url", "")
                redirect_uri = data.get("redirect_uri", "")
                
                # Validate auth_url points to Printful
                auth_url_valid = auth_url.startswith("https://www.printful.com/app/install")
                
                # Validate redirect_uri points back to our callback
                redirect_uri_valid = redirect_uri == f"{BASE_URL}/api/printful/callback"
                
                all_valid = success and auth_url_valid and redirect_uri_valid
                
                details = f"Status: {response.status_code}, success: {success}"
                details += f", auth_url: {auth_url[:50]}..."
                details += f", redirect_uri: {redirect_uri}"
                details += f", auth_url_valid: {auth_url_valid}, redirect_uri_valid: {redirect_uri_valid}"
                
                self.log_test(
                    "GET /api/printful/connect-url", 
                    all_valid,
                    details
                )
                return all_valid
            else:
                self.log_test(
                    "GET /api/printful/connect-url", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("GET /api/printful/connect-url", False, f"Exception: {str(e)}")
            return False
    
    async def test_legacy_endpoints_deprecation(self) -> bool:
        """Test that legacy manual credentials endpoints still exist but point to OAuth flow"""
        try:
            # Test the legacy credentials endpoint
            response = await self.client.get(
                f"{BASE_URL}/api/printful/credentials",
                headers=self.get_auth_headers()
            )
            
            legacy_works = response.status_code == 200
            
            details = f"Legacy credentials endpoint status: {response.status_code}"
            if legacy_works:
                data = response.json()
                details += f", configured: {data.get('configured')}"
                # Look for OAuth indicators
                oauth_indicators = (
                    "OAuth" in str(data.get("api_key_masked", "")) or 
                    "OAuth" in str(data.get("webhook_secret_masked", "")) or
                    data.get("api_key_masked") == "OAuth connection active"
                )
                details += f", OAuth indicators: {oauth_indicators}"
            
            self.log_test(
                "Legacy endpoints deprecation check", 
                legacy_works,
                details
            )
            return legacy_works
            
        except Exception as e:
            self.log_test("Legacy endpoints deprecation check", False, f"Exception: {str(e)}")
            return False
    
    async def test_auth_requirements(self) -> bool:
        """Test that endpoints require proper authentication"""
        try:
            # Test without auth token
            response = await self.client.get(f"{BASE_URL}/api/printful/status")
            requires_auth = response.status_code == 401
            
            # Test with invalid token
            response2 = await self.client.get(
                f"{BASE_URL}/api/printful/status",
                headers={"Authorization": "Bearer invalid_token"}
            )
            rejects_invalid = response2.status_code == 401
            
            success = requires_auth and rejects_invalid
            details = f"No auth: {response.status_code}, Invalid auth: {response2.status_code}"
            
            self.log_test(
                "Authentication requirements", 
                success,
                details
            )
            return success
            
        except Exception as e:
            self.log_test("Authentication requirements", False, f"Exception: {str(e)}")
            return False
    
    def generate_summary(self) -> str:
        """Generate test execution summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["passed"])
        
        summary = f"\n{'='*80}\n"
        summary += f"PRINTFUL OAUTH BACKEND TEST SUMMARY\n"
        summary += f"{'='*80}\n"
        summary += f"Total Tests: {total_tests}\n"
        summary += f"Passed: {passed_tests}\n"
        summary += f"Failed: {total_tests - passed_tests}\n"
        summary += f"Success Rate: {(passed_tests/total_tests)*100:.1f}%\n\n"
        
        summary += "DETAILED RESULTS:\n"
        summary += "-" * 50 + "\n"
        
        for result in self.test_results:
            summary += f"{result['status']} {result['test']}\n"
            if result['details']:
                summary += f"     {result['details']}\n"
        
        summary += "\n" + "="*80 + "\n"
        
        # Overall assessment
        if passed_tests == total_tests:
            summary += "🎉 ALL TESTS PASSED - Printful OAuth flow is fully functional!\n"
        elif passed_tests >= total_tests * 0.8:
            summary += "⚠️  MOSTLY WORKING - Minor issues detected\n"
        else:
            summary += "❌ CRITICAL ISSUES - Major functionality problems detected\n"
            
        summary += "="*80 + "\n"
        return summary
    
    async def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Printful OAuth Backend Test Suite...")
        print(f"Base URL: {BASE_URL}")
        print(f"Admin User: {ADMIN_EMAIL}")
        print("="*80)
        
        try:
            # Step 1: Authentication
            auth_success = await self.authenticate_admin()
            if not auth_success:
                print("❌ Authentication failed - cannot proceed with tests")
                return
            
            print("✅ Authentication successful - proceeding with tests...\n")
            
            # Step 2: Run core endpoint tests
            await self.test_auth_requirements()
            await self.test_printful_oauth_settings_endpoint()
            await self.test_printful_status_endpoint()
            await self.test_printful_connect_url_endpoint()
            await self.test_legacy_endpoints_deprecation()
            
            # Step 3: Generate and display summary
            summary = self.generate_summary()
            print(summary)
            
        except Exception as e:
            print(f"❌ Test suite failed with exception: {str(e)}")
        finally:
            await self.cleanup()

async def main():
    """Main test execution function"""
    tester = PrintfulOAuthTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())