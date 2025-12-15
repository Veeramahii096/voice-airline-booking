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
    
    # API URLs
    BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:4000')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    
    # Database
    DATABASE_URL = os.getenv('DATABASE_URL', '')
    
    # Flight API
    AMADEUS_API_KEY = os.getenv('AMADEUS_API_KEY', '')
    AMADEUS_API_SECRET = os.getenv('AMADEUS_API_SECRET', '')
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
