"""
Load environment variables from .env file for production
"""
import os
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()

# Configuration class
class Config:
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # API URLs - Using Render URLs for production
    BACKEND_URL = os.getenv('BACKEND_URL', 'https://voice-airline-backend.onrender.com')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://voice-airline-booking-2.onrender.com')
    
    # Database - HARDCODED MongoDB for production
    DATABASE_URL = os.getenv('DATABASE_URL', 'mongodb+srv://Veera:bQayM02Aj0vjXuMw@cluster.hivvjdj.mongodb.net/voice_airline?retryWrites=true&w=majority')
    
    # Flight API - HARDCODED for production
    AMADEUS_API_KEY = os.getenv('AMADEUS_API_KEY', 'xoNfz9fYJQIyYYckyY3oGp9Tlu0zTPWS')
    AMADEUS_API_SECRET = os.getenv('AMADEUS_API_SECRET', 'I8l5uhG8lKFYson0')
    FLIGHT_API_URL = os.getenv('FLIGHT_API_URL', 'https://api.amadeus.com/v2')
    
    # Payment Gateway
    RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', '')
    RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', '')
    
    # Email Service
    EMAIL_API_KEY = os.getenv('EMAIL_API_KEY', '')
    EMAIL_FROM = os.getenv('EMAIL_FROM', 'noreply@airline.com')
    
    # SMS Service
    TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
    TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
    TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '')
    
    # Environment
    ENV = os.getenv('NODE_ENV', 'development')
    DEBUG = ENV == 'development'
    PORT = int(os.getenv('PORT', 5000))

# Export config
config = Config()

# Helper functions for app.py
def has_amadeus_config():
    """Check if Amadeus API credentials are configured"""
    return bool(Config.AMADEUS_API_KEY and Config.AMADEUS_API_SECRET)

def has_mongodb_config():
    """Check if MongoDB is configured"""
    return bool(Config.DATABASE_URL)

def validate_config():
    """Validate configuration on startup"""
    if has_amadeus_config():
        print(f"✓ Amadeus API configured: {Config.AMADEUS_API_KEY[:8]}...")
    else:
        print("⚠️  Amadeus API not configured - using mock flights")
    
    if has_mongodb_config():
        print(f"✓ MongoDB configured")
    else:
        print("⚠️  MongoDB not configured - using in-memory storage")
    
    return has_amadeus_config() or has_mongodb_config()
