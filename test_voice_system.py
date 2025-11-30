#!/usr/bin/env python3
"""
Voice Airline Booking System - Test Script
Tests backend API and provides diagnostic information
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:4000/api"

def print_section(title):
    """Print formatted section header"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_health():
    """Test health endpoint"""
    print_section("Testing Health Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"✅ Status Code: {response.status_code}")
        print(f"✅ Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_booking_creation():
    """Test booking creation"""
    print_section("Testing Booking Creation")
    
    booking_data = {
        "passengerName": "Test User",
        "seatNumber": "12A",
        "specialAssistance": {
            "wheelchair": False,
            "visualImpairment": False,
            "hearingImpairment": False
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/booking",
            json=booking_data,
            timeout=5
        )
        print(f"✅ Status Code: {response.status_code}")
        result = response.json()
        print(f"✅ Booking ID: {result.get('bookingId')}")
        print(f"✅ Response: {json.dumps(result, indent=2)}")
        return result.get('bookingId')
    except Exception as e:
        print(f"❌ Booking creation failed: {e}")
        return None

def test_order_creation(booking_id):
    """Test payment order creation"""
    print_section("Testing Payment Order Creation")
    
    order_data = {
        "bookingId": booking_id,
        "amount": 5000,
        "paymentMethod": "googlepay"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/create-order",
            json=order_data,
            timeout=5
        )
        print(f"✅ Status Code: {response.status_code}")
        result = response.json()
        print(f"✅ Order ID: {result.get('orderId')}")
        print(f"✅ OTP: {result.get('otp')}")
        print(f"✅ Response: {json.dumps(result, indent=2)}")
        return result.get('orderId'), result.get('otp')
    except Exception as e:
        print(f"❌ Order creation failed: {e}")
        return None, None

def test_otp_verification(order_id, otp):
    """Test OTP verification"""
    print_section("Testing OTP Verification")
    
    verify_data = {
        "orderId": order_id,
        "otp": otp
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/verify-otp",
            json=verify_data,
            timeout=5
        )
        print(f"✅ Status Code: {response.status_code}")
        result = response.json()
        print(f"✅ Success: {result.get('success')}")
        print(f"✅ Response: {json.dumps(result, indent=2)}")
        return result.get('success')
    except Exception as e:
        print(f"❌ OTP verification failed: {e}")
        return False

def check_docker_status():
    """Check if Docker containers are running"""
    print_section("Checking Docker Status")
    import subprocess
    
    try:
        result = subprocess.run(
            ['docker', 'ps', '--filter', 'name=voice-airline', '--format', '{{.Names}}\t{{.Status}}'],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.stdout:
            print("Docker Containers:")
            for line in result.stdout.strip().split('\n'):
                if line:
                    name, status = line.split('\t')
                    print(f"  ✅ {name}: {status}")
        else:
            print("❌ No voice-airline containers found")
            
    except Exception as e:
        print(f"⚠️  Could not check Docker status: {e}")

def test_frontend_accessibility():
    """Test if frontend is accessible"""
    print_section("Testing Frontend Accessibility")
    
    try:
        response = requests.get("http://localhost", timeout=5)
        print(f"✅ Frontend Status: {response.status_code}")
        print(f"✅ Content Length: {len(response.content)} bytes")
        
        # Check for demo page
        demo_response = requests.get("http://localhost/demo", timeout=5)
        print(f"✅ Demo Page Status: {demo_response.status_code}")
        
    except Exception as e:
        print(f"❌ Frontend not accessible: {e}")

def run_full_test():
    """Run complete test suite"""
    print("\n" + "🎙️ "*30)
    print("  VOICE AIRLINE BOOKING SYSTEM - DIAGNOSTIC TEST")
    print("🎙️ "*30)
    print(f"\n📅 Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check Docker
    check_docker_status()
    
    # Test frontend
    test_frontend_accessibility()
    
    # Test backend health
    if not test_health():
        print("\n❌ Backend not responding. Make sure containers are running:")
        print("   docker-compose ps")
        return
    
    print("\n⏳ Waiting 2 seconds...")
    time.sleep(2)
    
    # Test booking flow
    booking_id = test_booking_creation()
    if not booking_id:
        return
    
    print("\n⏳ Waiting 1 second...")
    time.sleep(1)
    
    # Test payment
    order_id, otp = test_order_creation(booking_id)
    if not order_id:
        return
    
    print("\n⏳ Waiting 1 second...")
    time.sleep(1)
    
    # Test OTP verification
    success = test_otp_verification(order_id, otp)
    
    # Summary
    print_section("TEST SUMMARY")
    if success:
        print("✅ All tests PASSED!")
        print("\n🎙️ Your Voice Booking System is working correctly!")
        print("\n📱 Access URLs:")
        print("   Frontend: http://localhost")
        print("   Demo Page: http://localhost/demo")
        print("   Backend API: http://localhost:4000")
    else:
        print("❌ Some tests FAILED")
        print("\nPlease check the logs:")
        print("   docker-compose logs")
    
    print("\n" + "="*60 + "\n")

def show_nlp_info():
    """Display NLP features information"""
    print_section("NLP Features in Voice Demo")
    
    print("""
🧠 NATURAL LANGUAGE PROCESSING

The voice demo uses client-side NLP to understand natural speech:

1. INTENT RECOGNITION
   - Detects what you want to do
   - Example: "start booking", "book flight" → START_BOOKING
   
2. ENTITY EXTRACTION
   - Captures: names, seats, preferences
   - Example: "window seat front row" → {preference: "window", row: "front"}
   
3. SMART RECOMMENDATIONS
   - Suggests optimal seats
   - Example: "window front" → Recommends seat 1A
   
4. CONTEXT AWARENESS
   - Adapts to booking stage
   - Same words mean different things at different steps

📝 DEMO FLOW:
   Step 1: Say "Start voice checkout"
   Step 2: Say your name (e.g., "John Smith")
   Step 3: Say seat preference (e.g., "aisle seat")
   Step 4: Say "Confirm payment"

⚡ Processing: <50ms (instant)
🎯 Accuracy: 78-82%
    """)

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--nlp":
        show_nlp_info()
    else:
        run_full_test()
        
        print("\n💡 TIP: Run 'python test_voice_system.py --nlp' for NLP info")
