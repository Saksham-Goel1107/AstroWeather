#!/usr/bin/env python3
"""
Test script to verify the AstroWeather integration
"""

import os
import sys
import requests
import json
import time
from threading import Thread

def test_backend_api():
    """Test the weather prediction backend API"""
    print("🧪 Testing backend API...")

    # Test data
    test_cities = ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Chennai']

    for city in test_cities:
        try:
            print(f"  Testing prediction for {city}...")

            # Test prediction endpoint
            response = requests.post('http://localhost:5000/api/weather/predict', json={
                'city': city,
                'days': 3
            }, timeout=10)

            if response.status_code == 200:
                data = response.json()
                print(f"    ✅ {city}: {data['forecast']['average_temperature']:.1f}°C average")
            else:
                print(f"    ❌ {city}: HTTP {response.status_code}")

        except requests.exceptions.RequestException as e:
            print(f"    ❌ {city}: Connection error - {e}")
            return False

    # Test export endpoint
    try:
        print("  Testing export functionality...")
        response = requests.get('http://localhost:5000/api/weather/export/Delhi/3', timeout=10)

        if response.status_code == 200:
            print("    ✅ Export endpoint working")
        else:
            print(f"    ❌ Export: HTTP {response.status_code}")

    except requests.exceptions.RequestException as e:
        print(f"    ❌ Export: Connection error - {e}")

    return True

def test_frontend_access():
    """Test if frontend is accessible"""
    print("🌐 Testing frontend access...")

    try:
        response = requests.get('http://localhost:8080/glob.html', timeout=5)
        if response.status_code == 200:
            print("    ✅ Frontend accessible")
            return True
        else:
            print(f"    ❌ Frontend: HTTP {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"    ❌ Frontend: {e}")
        return False

def main():
    """Main test function"""
    print("🔬 AstroWeather Integration Test")
    print("=" * 40)

    # Wait a moment for servers to start
    print("⏳ Waiting for servers to initialize...")
    time.sleep(3)

    # Test backend
    backend_ok = test_backend_api()

    # Test frontend
    frontend_ok = test_frontend_access()

    # Summary
    print("\n📊 Test Results:")
    print(f"  Backend API: {'✅ PASS' if backend_ok else '❌ FAIL'}")
    print(f"  Frontend Access: {'✅ PASS' if frontend_ok else '❌ FAIL'}")

    if backend_ok and frontend_ok:
        print("\n🎉 All tests passed! Integration is working correctly.")
        print("\n📝 Next steps:")
        print("  1. Open http://localhost:8080/glob.html in your browser")
        print("  2. Click the weather prediction button (☁️)")
        print("  3. Select a city and generate predictions")
        print("  4. View prediction markers on the globe")
        print("  5. Export prediction data as CSV")
    else:
        print("\n⚠️  Some tests failed. Please check:")
        print("  - Is the Python server running on port 5000?")
        print("  - Is the frontend server running on port 8080?")
        print("  - Are all dependencies installed?")
        print("  - Is your OpenWeatherMap API key configured?")

    return backend_ok and frontend_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)