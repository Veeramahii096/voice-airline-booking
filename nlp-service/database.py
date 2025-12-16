"""
Database Models for Production
MongoDB/PostgreSQL schemas for storing bookings, users, and profiles
"""
import os
from typing import Dict, Optional
from datetime import datetime

# For MongoDB (using pymongo) - HARDCODED for production
try:
    from pymongo import MongoClient
    USE_MONGODB = True
    MONGODB_URL = os.getenv('DATABASE_URL', 'mongodb+srv://Veera:bQayM02Aj0vjXuMw@cluster.hivvjdj.mongodb.net/voice_airline?retryWrites=true&w=majority')
    client = MongoClient(MONGODB_URL)
    db = client['airline_booking']
    print(f"✓ Connected to MongoDB Atlas")
except ImportError:
    USE_MONGODB = False
    db = None
    print("⚠️  MongoDB not available, using in-memory storage")

class UserDatabase:
    """Handle user profile storage and retrieval"""
    
    def __init__(self):
        self.collection = db['users'] if USE_MONGODB else {}
    
    def get_user_by_phone(self, phone: str) -> Optional[Dict]:
        """Retrieve user profile by phone number"""
        if USE_MONGODB:
            return self.collection.find_one({'phone': phone})
        else:
            return self.collection.get(phone)
    
    def create_or_update_user(self, phone: str, profile: Dict) -> bool:
        """Create or update user profile"""
        try:
            profile['phone'] = phone
            profile['updated_at'] = datetime.utcnow()
            
            if USE_MONGODB:
                self.collection.update_one(
                    {'phone': phone},
                    {'$set': profile},
                    upsert=True
                )
            else:
                self.collection[phone] = profile
            return True
        except Exception as e:
            print(f"Error saving user: {e}")
            return False
    
    def get_user_bookings(self, phone: str) -> list:
        """Get booking history for user"""
        if USE_MONGODB:
            bookings_collection = db['bookings']
            return list(bookings_collection.find({'phone': phone}).sort('created_at', -1))
        else:
            return []


class BookingDatabase:
    """Handle booking storage"""
    
    def __init__(self):
        self.collection = db['bookings'] if USE_MONGODB else {}
        self.counter = 1000
    
    def create_booking(self, booking_data: Dict) -> str:
        """Create new booking and return booking ID"""
        try:
            booking_id = f"AI{datetime.now().strftime('%Y%m%d')}{self.counter}"
            self.counter += 1
            
            booking_data['booking_id'] = booking_id
            booking_data['created_at'] = datetime.utcnow()
            booking_data['status'] = 'confirmed'
            
            if USE_MONGODB:
                self.collection.insert_one(booking_data)
            else:
                self.collection[booking_id] = booking_data
            
            return booking_id
        except Exception as e:
            print(f"Error creating booking: {e}")
            return None
    
    def get_booking(self, booking_id: str) -> Optional[Dict]:
        """Retrieve booking by ID"""
        if USE_MONGODB:
            return self.collection.find_one({'booking_id': booking_id})
        else:
            return self.collection.get(booking_id)
    
    def update_booking_status(self, booking_id: str, status: str) -> bool:
        """Update booking status (confirmed, cancelled, pending)"""
        try:
            if USE_MONGODB:
                self.collection.update_one(
                    {'booking_id': booking_id},
                    {'$set': {'status': status, 'updated_at': datetime.utcnow()}}
                )
            else:
                if booking_id in self.collection:
                    self.collection[booking_id]['status'] = status
            return True
        except Exception as e:
            print(f"Error updating booking: {e}")
            return False


# Global database instances
user_db = UserDatabase()
booking_db = BookingDatabase()
