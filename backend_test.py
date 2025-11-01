import requests
import sys
import json
from datetime import datetime

class LSEHostingAPITester:
    def __init__(self, base_url="https://lsehosting-free-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.test_user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.failed_tests.append({"test": name, "error": details})

    def test_config_endpoint(self):
        """Test public config endpoint"""
        try:
            response = requests.get(f"{self.api_url}/config")
            success = response.status_code == 200
            if success:
                config = response.json()
                expected_keys = ["credits_per_interval", "interval_seconds"]
                success = all(key in config for key in expected_keys)
                details = f"Config: {config}" if success else "Missing required config keys"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Config Endpoint", success, details)
            return success, response.json() if success else {}
        except Exception as e:
            self.log_test("Config Endpoint", False, str(e))
            return False, {}

    def test_admin_login(self):
        """Test admin login with default credentials"""
        try:
            login_data = {
                "usuario": "admin",
                "password": "admin123"
            }
            response = requests.post(f"{self.api_url}/auth/login", json=login_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_keys = ["access_token", "token_type", "user"]
                success = all(key in data for key in required_keys)
                if success:
                    self.admin_token = data["access_token"]
                    success = data["user"].get("is_admin", False)
                    details = "Admin login successful" if success else "User is not admin"
                else:
                    details = "Missing required response keys"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Admin Login", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Login", False, str(e))
            return False

    def test_user_registration(self):
        """Test user registration"""
        try:
            timestamp = datetime.now().strftime("%H%M%S")
            self.test_user_data = {
                "nombre": f"Test User {timestamp}",
                "usuario": f"testuser{timestamp}",
                "email": f"test{timestamp}@example.com",
                "password": "testpass123"
            }
            
            response = requests.post(f"{self.api_url}/auth/register", json=self.test_user_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_keys = ["access_token", "token_type", "user"]
                success = all(key in data for key in required_keys)
                if success:
                    self.user_token = data["access_token"]
                    user = data["user"]
                    success = (user["usuario"] == self.test_user_data["usuario"] and 
                             user["email"] == self.test_user_data["email"] and
                             user["credits"] == 0 and
                             not user["is_admin"])
                    details = "Registration successful" if success else "User data mismatch"
                else:
                    details = "Missing required response keys"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("User Registration", success, details)
            return success
        except Exception as e:
            self.log_test("User Registration", False, str(e))
            return False

    def test_user_login(self):
        """Test user login with registered credentials"""
        if not self.test_user_data:
            self.log_test("User Login", False, "No test user data available")
            return False
            
        try:
            login_data = {
                "usuario": self.test_user_data["usuario"],
                "password": self.test_user_data["password"]
            }
            response = requests.post(f"{self.api_url}/auth/login", json=login_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = "access_token" in data and "user" in data
                details = "Login successful" if success else "Missing token or user data"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("User Login", success, details)
            return success
        except Exception as e:
            self.log_test("User Login", False, str(e))
            return False

    def test_auth_me_endpoint(self):
        """Test /auth/me endpoint with user token"""
        if not self.user_token:
            self.log_test("Auth Me Endpoint", False, "No user token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = requests.get(f"{self.api_url}/auth/me", headers=headers)
            success = response.status_code == 200
            
            if success:
                user = response.json()
                success = (user["usuario"] == self.test_user_data["usuario"] and
                          "password" not in user)
                details = "User data retrieved successfully" if success else "User data mismatch or password exposed"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Auth Me Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Auth Me Endpoint", False, str(e))
            return False

    def test_claim_credits(self):
        """Test credit claiming functionality"""
        if not self.user_token:
            self.log_test("Claim Credits", False, "No user token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            claim_data = {"intervals": 2}
            response = requests.post(f"{self.api_url}/credits/claim", json=claim_data, headers=headers)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_keys = ["success", "credits_added", "total_credits"]
                success = all(key in data for key in required_keys)
                if success:
                    success = data["success"] and data["credits_added"] > 0
                    details = f"Credits claimed: {data['credits_added']}, Total: {data['total_credits']}"
                else:
                    details = "Missing required response keys"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Claim Credits", success, details)
            return success
        except Exception as e:
            self.log_test("Claim Credits", False, str(e))
            return False

    def test_notifications_endpoint(self):
        """Test notifications endpoint"""
        if not self.user_token:
            self.log_test("Notifications Endpoint", False, "No user token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = requests.get(f"{self.api_url}/notifications", headers=headers)
            success = response.status_code == 200
            
            if success:
                notifications = response.json()
                success = isinstance(notifications, list)
                details = f"Retrieved {len(notifications)} notifications" if success else "Invalid response format"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Notifications Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Notifications Endpoint", False, str(e))
            return False

    def test_admin_get_users(self):
        """Test admin endpoint to get all users"""
        if not self.admin_token:
            self.log_test("Admin Get Users", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.api_url}/admin/users", headers=headers)
            success = response.status_code == 200
            
            if success:
                users = response.json()
                success = isinstance(users, list) and len(users) > 0
                if success:
                    # Check if admin user exists
                    admin_exists = any(user.get("usuario") == "admin" for user in users)
                    success = admin_exists
                    details = f"Retrieved {len(users)} users, admin exists: {admin_exists}"
                else:
                    details = "No users found or invalid format"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Admin Get Users", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Get Users", False, str(e))
            return False

    def test_admin_add_credits(self):
        """Test admin functionality to add credits"""
        if not self.admin_token or not self.test_user_data:
            self.log_test("Admin Add Credits", False, "Missing admin token or test user")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            credit_data = {
                "usuario": self.test_user_data["usuario"],
                "credits": 100,
                "reason": "Test credit addition"
            }
            response = requests.post(f"{self.api_url}/admin/credits/add", json=credit_data, headers=headers)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("success", False) and "new_balance" in data
                details = f"Credits added, new balance: {data.get('new_balance', 'unknown')}" if success else "Invalid response"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Admin Add Credits", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Add Credits", False, str(e))
            return False

    def test_admin_remove_credits(self):
        """Test admin functionality to remove credits"""
        if not self.admin_token or not self.test_user_data:
            self.log_test("Admin Remove Credits", False, "Missing admin token or test user")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            credit_data = {
                "usuario": self.test_user_data["usuario"],
                "credits": 50,
                "reason": "Test credit removal"
            }
            response = requests.post(f"{self.api_url}/admin/credits/remove", json=credit_data, headers=headers)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("success", False) and "new_balance" in data
                details = f"Credits removed, new balance: {data.get('new_balance', 'unknown')}" if success else "Invalid response"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Admin Remove Credits", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Remove Credits", False, str(e))
            return False

    def test_admin_update_config(self):
        """Test admin functionality to update config"""
        if not self.admin_token:
            self.log_test("Admin Update Config", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            config_data = {
                "credits_per_interval": 2,
                "interval_seconds": 30
            }
            response = requests.post(f"{self.api_url}/admin/config", json=config_data, headers=headers)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("success", False) and "config" in data
                details = f"Config updated: {data.get('config', {})}" if success else "Invalid response"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Admin Update Config", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Update Config", False, str(e))
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting LSE Hosting Backend API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 50)
        
        # Test public endpoints
        self.test_config_endpoint()
        
        # Test authentication
        self.test_admin_login()
        self.test_user_registration()
        self.test_user_login()
        self.test_auth_me_endpoint()
        
        # Test user functionality
        self.test_claim_credits()
        self.test_notifications_endpoint()
        
        # Test admin functionality
        self.test_admin_get_users()
        self.test_admin_add_credits()
        self.test_admin_remove_credits()
        self.test_admin_update_config()
        
        # Print summary
        print("=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = LSEHostingAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())