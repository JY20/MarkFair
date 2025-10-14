"""
Test script for user endpoints.

Usage:
  python backend/test/test_user.py

Requires TEST_MODE=true and TEST_USER_ID in backend/.env
"""

import os
import sys
import requests
from pathlib import Path

# Try to load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        print(f"📄 Loaded environment from {env_path}")
except ImportError:
    pass  # python-dotenv not installed, will use os.getenv only

# Configuration
API_BASE = os.getenv("API_BASE", "http://localhost:8000")
TEST_USER_ID = os.getenv("TEST_USER_ID")

# Allow manual JWT override for production testing
JWT_TOKEN = os.getenv("JWT_TOKEN")

if not JWT_TOKEN and not TEST_USER_ID:
    print("❌ Error: Neither TEST_USER_ID nor JWT_TOKEN found")
    print("\nOption 1 (Recommended): Add TEST_USER_ID to backend/.env")
    print("  TEST_USER_ID=user_xxxxx  # Get from Clerk dashboard")
    print("  python backend/test/test_user.py")
    print("\nOption 2: Use fresh JWT from frontend (expires in 60s)")
    print("  1. Open http://localhost:5173 in browser")
    print("  2. Sign in with Clerk")
    print("  3. Open browser console (F12)")
    print("  4. Run: await window.Clerk.session.getToken({ template: 'backend' })")
    print("  5. Copy and run:")
    print("     JWT_TOKEN='<token>' python backend/test/test_user.py")
    sys.exit(1)

if TEST_USER_ID:
    print(f"🔑 Using TEST_USER_ID: {TEST_USER_ID}")
    print("⚠️  WARNING: Bypassing JWT auth for testing. Not for production!")
    AUTH_HEADERS = {"X-Test-User-ID": TEST_USER_ID}
else:
    print(f"🔑 Using JWT_TOKEN (expires in ~60s)")
    AUTH_HEADERS = {"Authorization": f"Bearer {JWT_TOKEN}"}


def test_set_user_type_kol():
    """Test POST /api/user/type with KOL"""
    print("\n" + "=" * 60)
    print("Test 1: Set User Type to KOL")
    print("=" * 60)
    
    payload = {"user_type": "KOL"}
    
    print(f"\n📤 POST {API_BASE}/api/user/type")
    print(f"Payload: {payload}")
    
    headers = {"Content-Type": "application/json"}
    headers.update(AUTH_HEADERS)
    
    try:
        resp = requests.post(
            f"{API_BASE}/api/user/type",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if resp.status_code != 200:
            print(f"❌ Request failed with status {resp.status_code}")
            print(f"Response: {resp.text}")
            return False
        
        data = resp.json()
        print(f"\n✅ User type set successfully!")
        print(f"Response: {data}")
        
        if data.get("user_type") != "KOL":
            print(f"❌ Expected user_type='KOL', got '{data.get('user_type')}'")
            return False
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return False


def test_set_user_type_advertiser():
    """Test POST /api/user/type with ADVERTISER"""
    print("\n" + "=" * 60)
    print("Test 2: Set User Type to ADVERTISER")
    print("=" * 60)
    
    payload = {"user_type": "ADVERTISER"}
    
    print(f"\n📤 POST {API_BASE}/api/user/type")
    print(f"Payload: {payload}")
    
    headers = {"Content-Type": "application/json"}
    headers.update(AUTH_HEADERS)
    
    try:
        resp = requests.post(
            f"{API_BASE}/api/user/type",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if resp.status_code != 200:
            print(f"❌ Request failed with status {resp.status_code}")
            print(f"Response: {resp.text}")
            return False
        
        data = resp.json()
        print(f"\n✅ User type set successfully!")
        print(f"Response: {data}")
        
        if data.get("user_type") != "ADVERTISER":
            print(f"❌ Expected user_type='ADVERTISER', got '{data.get('user_type')}'")
            return False
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return False


def test_get_user_type():
    """Test GET /api/user/me"""
    print("\n" + "=" * 60)
    print("Test 3: Get User Type")
    print("=" * 60)
    
    print(f"\n📤 GET {API_BASE}/api/user/me")
    
    headers = {}
    headers.update(AUTH_HEADERS)
    
    try:
        resp = requests.get(
            f"{API_BASE}/api/user/me",
            headers=headers,
            timeout=10
        )
        
        if resp.status_code != 200:
            print(f"❌ Request failed with status {resp.status_code}")
            print(f"Response: {resp.text}")
            return False
        
        data = resp.json()
        print(f"\n✅ User type retrieved successfully!")
        print(f"Response: {data}")
        
        user_type = data.get("user_type")
        if user_type not in ["KOL", "ADVERTISER", None]:
            print(f"❌ Unexpected user_type value: '{user_type}'")
            return False
        
        print(f"📋 Current user type: {user_type or 'Not set'}")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return False


def test_invalid_user_type():
    """Test POST /api/user/type with invalid value"""
    print("\n" + "=" * 60)
    print("Test 4: Set Invalid User Type (should fail)")
    print("=" * 60)
    
    payload = {"user_type": "INVALID"}
    
    print(f"\n📤 POST {API_BASE}/api/user/type")
    print(f"Payload: {payload}")
    
    headers = {"Content-Type": "application/json"}
    headers.update(AUTH_HEADERS)
    
    try:
        resp = requests.post(
            f"{API_BASE}/api/user/type",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if resp.status_code == 422:
            print(f"\n✅ Correctly rejected invalid user type!")
            print(f"Response: {resp.text}")
            return True
        else:
            print(f"❌ Expected 422 status, got {resp.status_code}")
            print(f"Response: {resp.text}")
            return False
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return False


def main():
    print("\n🧪 Starting User Endpoints Test")
    print(f"API Base: {API_BASE}")
    
    results = []
    
    # Test 1: Get initial user type
    results.append(("Get User Type (initial)", test_get_user_type()))
    
    # Test 2: Set to KOL
    results.append(("Set User Type to KOL", test_set_user_type_kol()))
    
    # Test 3: Verify it's KOL
    results.append(("Get User Type (verify KOL)", test_get_user_type()))
    
    # Test 4: Set to ADVERTISER
    results.append(("Set User Type to ADVERTISER", test_set_user_type_advertiser()))
    
    # Test 5: Verify it's ADVERTISER
    results.append(("Get User Type (verify ADVERTISER)", test_get_user_type()))
    
    # Test 6: Try invalid user type
    results.append(("Set Invalid User Type", test_invalid_user_type()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print("\n" + "=" * 60)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        print("=" * 60)
        return 0
    else:
        print("⚠️  Some tests failed")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)

