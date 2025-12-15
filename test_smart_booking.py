"""
Test script for AI-Powered Smart Booking with Voice Recognition
"""
import requests
import json

BASE_URL = 'http://localhost:5000/api/nlp'

def test_single_command_booking():
    """Test: Book flight from Mumbai to Singapore tomorrow"""
    print("\n🎤 Test 1: Single Command Booking")
    print("User says: 'Book flight from Mumbai to Singapore tomorrow'")
    
    response = requests.post(f'{BASE_URL}/process', json={
        'input': 'book flight from mumbai to singapore tomorrow',
        'session_id': 'test_session_1',
        'user_id': 'user_sample_1'  # Simulated voice ID
    })
    
    result = response.json()
    print(f"\n🤖 Bot: {result['response']}")
    print(f"📊 Intent: {result['intent']}")
    print(f"✅ Auto-filled: {result.get('smart_filled', False)}")
    print(f"📋 Context: Step {result['context']['step']} - {result['context']['step_name']}")
    
    return result

def test_voice_identification():
    """Test: Voice identification returns user profile"""
    print("\n\n🎤 Test 2: Voice Identification")
    print("System identifies voice pattern...")
    
    response = requests.post(f'{BASE_URL}/identify', json={
        'voice_sample': 'sample_voice_data'
    })
    
    result = response.json()
    print(f"\n✅ Identified: {result['identified']}")
    if result['identified']:
        profile = result['profile']
        print(f"👤 Name: {profile['name']}")
        print(f"📧 Email: {profile['email']}")
        print(f"📱 Phone: {profile['phone']}")
        print(f"💺 Preferences: {profile['preferences']}")
    
    return result

def test_greeting_with_profile():
    """Test: Greeting with identified user"""
    print("\n\n🎤 Test 3: Greeting with Profile")
    print("User says: 'Hello'")
    
    response = requests.post(f'{BASE_URL}/process', json={
        'input': 'hello',
        'session_id': 'test_session_2',
        'user_id': 'user_sample_1'
    })
    
    result = response.json()
    print(f"\n🤖 Bot: {result['response']}")
    print(f"📊 Voice Identified: {result['context']['context']['voice_identified']}")
    
    return result

def test_skip_auto_filled():
    """Test: Skip passenger details if auto-filled"""
    print("\n\n🎤 Test 4: Auto-Fill Skip Demo")
    print("Booking with auto-filled passenger details...")
    
    session_id = 'test_session_3'
    
    # Start booking
    r1 = requests.post(f'{BASE_URL}/process', json={
        'input': 'book flight from delhi to london tomorrow',
        'session_id': session_id,
        'user_id': 'user_sample_1'
    })
    print(f"\n🤖 Bot: {r1.json()['response']}")
    
    # Continue to next step (should skip passenger details)
    r2 = requests.post(f'{BASE_URL}/process', json={
        'input': 'one passenger',
        'session_id': session_id,
        'user_id': 'user_sample_1'
    })
    print(f"\n🤖 Bot: {r2.json()['response']}")
    
    # Class selection
    r3 = requests.post(f'{BASE_URL}/process', json={
        'input': 'economy',
        'session_id': session_id,
        'user_id': 'user_sample_1'
    })
    print(f"\n🤖 Bot: {r3.json()['response']}")
    
    return r3.json()

if __name__ == '__main__':
    print("=" * 60)
    print("🤖 AI-POWERED SMART BOOKING TEST")
    print("=" * 60)
    
    try:
        # Test 1: Single command booking
        test_single_command_booking()
        
        # Test 2: Voice identification
        test_voice_identification()
        
        # Test 3: Greeting with profile
        test_greeting_with_profile()
        
        # Test 4: Skip auto-filled details
        test_skip_auto_filled()
        
        print("\n\n" + "=" * 60)
        print("✅ ALL TESTS COMPLETED!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("Make sure NLP service is running on http://localhost:5000")
