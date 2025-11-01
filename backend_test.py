import requests
import sys
import json
from datetime import datetime

class LSEHostingAPITester:
    def __init__(self, base_url="https://hostedlse-free.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.user_token = None
        self.test_user_id = None
        self.test_product_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_admin_login(self):
        """Test admin login with default credentials"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user_data = {
            "nombre": "Test",
            "apellidos": "User",
            "email": f"test{timestamp}@example.com",
            "username": f"testuser{timestamp}",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        if success and 'token' in response:
            self.user_token = response['token']
            self.test_user_id = response['user']['id']
            print(f"   User token obtained: {self.user_token[:20]}...")
            print(f"   User ID: {self.test_user_id}")
            return True
        return False

    def test_user_login(self):
        """Test user login with created credentials"""
        timestamp = datetime.now().strftime('%H%M%S')
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"username": f"testuser{timestamp}", "password": "testpass123"}
        )
        return success

    def test_auth_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            token=self.user_token
        )
        return success

    def test_get_user_credits(self):
        """Test getting user credits"""
        success, response = self.run_test(
            "Get User Credits",
            "GET",
            "user/credits",
            200,
            token=self.user_token
        )
        return success

    def test_earn_credits(self):
        """Test earning credits"""
        success, response = self.run_test(
            "Earn Credits",
            "POST",
            "user/earn-credits",
            200,
            token=self.user_token
        )
        return success

    def test_credit_history(self):
        """Test getting credit history"""
        success, response = self.run_test(
            "Get Credit History",
            "GET",
            "user/credit-history",
            200,
            token=self.user_token
        )
        return success

    def test_shop_products(self):
        """Test getting shop products"""
        success, response = self.run_test(
            "Get Shop Products",
            "GET",
            "shop/products",
            200,
            token=self.user_token
        )
        return success

    def test_admin_get_users(self):
        """Test admin getting all users"""
        success, response = self.run_test(
            "Admin Get Users",
            "GET",
            "admin/users",
            200,
            token=self.admin_token
        )
        return success

    def test_admin_add_credits(self):
        """Test admin adding credits to user"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Admin Add Credits",
            "POST",
            "admin/add-credits",
            200,
            data={
                "user_id": self.test_user_id,
                "amount": 10,
                "reason": "Test credit addition"
            },
            token=self.admin_token
        )
        return success

    def test_admin_remove_credits(self):
        """Test admin removing credits from user"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Admin Remove Credits",
            "POST",
            "admin/remove-credits",
            200,
            data={
                "user_id": self.test_user_id,
                "amount": 5,
                "reason": "Test credit removal"
            },
            token=self.admin_token
        )
        return success

    def test_admin_get_settings(self):
        """Test admin getting settings"""
        success, response = self.run_test(
            "Admin Get Settings",
            "GET",
            "admin/settings",
            200,
            token=self.admin_token
        )
        return success

    def test_admin_update_settings(self):
        """Test admin updating settings"""
        success, response = self.run_test(
            "Admin Update Settings",
            "PUT",
            "admin/settings",
            200,
            data={
                "credit_amount": 3,
                "credit_interval": 300
            },
            token=self.admin_token
        )
        return success

    def test_admin_create_product(self):
        """Test admin creating a product"""
        success, response = self.run_test(
            "Admin Create Product",
            "POST",
            "admin/products",
            200,
            data={
                "name": "Test VPS Server",
                "description": "A test VPS server for testing purposes",
                "price": 50,
                "stock": 10
            },
            token=self.admin_token
        )
        if success and 'product' in response:
            self.test_product_id = response['product']['id']
            print(f"   Product ID: {self.test_product_id}")
        return success

    def test_admin_get_products(self):
        """Test admin getting products"""
        success, response = self.run_test(
            "Admin Get Products",
            "GET",
            "admin/products",
            200,
            token=self.admin_token
        )
        return success

    def test_admin_update_product(self):
        """Test admin updating a product"""
        if not self.test_product_id:
            print("❌ No test product ID available")
            return False
            
        success, response = self.run_test(
            "Admin Update Product",
            "PUT",
            f"admin/products/{self.test_product_id}",
            200,
            data={
                "name": "Updated Test VPS Server",
                "description": "An updated test VPS server",
                "price": 60,
                "stock": 15
            },
            token=self.admin_token
        )
        return success

    def test_purchase_product(self):
        """Test purchasing a product"""
        if not self.test_product_id:
            print("❌ No test product ID available")
            return False
            
        # First add enough credits to the user
        self.run_test(
            "Add Credits for Purchase",
            "POST",
            "admin/add-credits",
            200,
            data={
                "user_id": self.test_user_id,
                "amount": 100,
                "reason": "Credits for testing purchase"
            },
            token=self.admin_token
        )
        
        success, response = self.run_test(
            "Purchase Product",
            "POST",
            f"shop/purchase/{self.test_product_id}",
            200,
            token=self.user_token
        )
        return success

    def test_admin_delete_product(self):
        """Test admin deleting a product"""
        if not self.test_product_id:
            print("❌ No test product ID available")
            return False
            
        success, response = self.run_test(
            "Admin Delete Product",
            "DELETE",
            f"admin/products/{self.test_product_id}",
            200,
            token=self.admin_token
        )
        return success

def main():
    print("🚀 Starting LSE Hosting API Tests...")
    tester = LSEHostingAPITester()

    # Test sequence
    tests = [
        # Authentication tests
        ("Admin Login", tester.test_admin_login),
        ("User Registration", tester.test_user_registration),
        ("Get Current User", tester.test_auth_me),
        
        # User functionality tests
        ("Get User Credits", tester.test_get_user_credits),
        ("Earn Credits", tester.test_earn_credits),
        ("Get Credit History", tester.test_credit_history),
        ("Get Shop Products", tester.test_shop_products),
        
        # Admin functionality tests
        ("Admin Get Users", tester.test_admin_get_users),
        ("Admin Add Credits", tester.test_admin_add_credits),
        ("Admin Remove Credits", tester.test_admin_remove_credits),
        ("Admin Get Settings", tester.test_admin_get_settings),
        ("Admin Update Settings", tester.test_admin_update_settings),
        
        # Product management tests
        ("Admin Create Product", tester.test_admin_create_product),
        ("Admin Get Products", tester.test_admin_get_products),
        ("Admin Update Product", tester.test_admin_update_product),
        ("Purchase Product", tester.test_purchase_product),
        ("Admin Delete Product", tester.test_admin_delete_product),
    ]

    # Run all tests
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            tester.failed_tests.append({
                "test": test_name,
                "error": str(e)
            })

    # Print results
    print(f"\n📊 Test Results:")
    print(f"   Tests run: {tester.tests_run}")
    print(f"   Tests passed: {tester.tests_passed}")
    print(f"   Tests failed: {len(tester.failed_tests)}")
    print(f"   Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")

    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            error_msg = failure.get('error', f"Expected {failure.get('expected')}, got {failure.get('actual')}")
            print(f"   - {failure['test']}: {error_msg}")

    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())