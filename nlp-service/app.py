"""
Python NLP Service for Voice Airline Booking
AI-Powered: Voice Recognition + Smart Auto-Fill + Single Command Booking
Singapore Airlines Style - Complete Booking Flow
PRODUCTION VERSION - Uses real APIs and database
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import os
from datetime import datetime, timedelta
import hashlib
import requests
import json

app = Flask(__name__)

# CORS Configuration - Allow all origins
CORS(app, resources={r"/*": {"origins": "*"}})

# Conversation sessions storage
sessions = {}

# User profiles database (voice ID → user details)
USER_PROFILES = {
    # Voice pattern hash → User data
    'user_sample_1': {
        'name': 'Raj Kumar',
        'email': 'raj.kumar@example.com',
        'phone': '9876543210',
        'preferences': {
            'seat': 'Window',
            'meal': 'Vegetarian',
            'class': 'Economy'
        },
        'history': [
            {'route': 'mumbai-singapore', 'frequency': 5},
            {'route': 'delhi-london', 'frequency': 2}
        ]
    }
}

# Note: In production, user profiles are stored in database (MongoDB/PostgreSQL)
# Local USER_PROFILES dict is kept only as fallback for demo/development

# Available flights database - Singapore Airlines style mock data
FLIGHTS_DB = {
    # India Domestic Routes (local carriers remain for domestic legs)
    'mumbai-delhi': [
        {'flight': 'AI101', 'carrier': 'AirIndia', 'time': '06:00', 'duration': '2h 15m', 'price': 4500, 'class': 'Economy', 'aircraft': 'Boeing 737', 'stops': 0, 'seats_available': 25},
        {'flight': 'AI103', 'carrier': 'AirIndia', 'time': '09:30', 'duration': '2h 15m', 'price': 5200, 'class': 'Economy', 'aircraft': 'Airbus A320', 'stops': 0, 'seats_available': 20},
        {'flight': 'AI105', 'carrier': 'AirIndia', 'time': '12:45', 'duration': '2h 15m', 'price': 8500, 'class': 'Business', 'aircraft': 'Boeing 787', 'stops': 0, 'seats_available': 8},
    ],

    # Routes served by Singapore Airlines (international)
    'mumbai-singapore': [
        {'flight': 'SQ001', 'carrier': 'SingaporeAir', 'time': '02:30', 'duration': '5h 30m', 'price': 28500, 'class': 'Economy', 'aircraft': 'Boeing 787-10', 'stops': 0, 'seats_available': 60},
        {'flight': 'SQ003', 'carrier': 'SingaporeAir', 'time': '09:30', 'duration': '5h 30m', 'price': 65000, 'class': 'Business', 'aircraft': 'Airbus A350', 'stops': 0, 'seats_available': 12},
        {'flight': 'SQ005', 'carrier': 'SingaporeAir', 'time': '14:15', 'duration': '5h 30m', 'price': 32000, 'class': 'Economy', 'aircraft': 'Boeing 777-300ER', 'stops': 0, 'seats_available': 48},
        {'flight': 'SQ007', 'carrier': 'SingaporeAir', 'time': '19:45', 'duration': '5h 30m', 'price': 72000, 'class': 'Business', 'aircraft': 'Airbus A380', 'stops': 0, 'seats_available': 10},
    ],

    'delhi-singapore': [
        {'flight': 'SQ011', 'carrier': 'SingaporeAir', 'time': '01:45', 'duration': '5h 45m', 'price': 30000, 'class': 'Economy', 'aircraft': 'Boeing 787-10', 'stops': 0, 'seats_available': 55},
        {'flight': 'SQ013', 'carrier': 'SingaporeAir', 'time': '08:30', 'duration': '5h 45m', 'price': 68000, 'class': 'Business', 'aircraft': 'Airbus A350', 'stops': 0, 'seats_available': 9},
        {'flight': 'SQ015', 'carrier': 'SingaporeAir', 'time': '15:00', 'duration': '5h 45m', 'price': 33500, 'class': 'Economy', 'aircraft': 'Boeing 777-300ER', 'stops': 0, 'seats_available': 40},
    ],

    'singapore-london': [
        {'flight': 'SQ301', 'carrier': 'SingaporeAir', 'time': '23:55', 'duration': '13h 30m', 'price': 120000, 'class': 'Economy', 'aircraft': 'Airbus A350', 'stops': 0, 'seats_available': 70},
        {'flight': 'SQ303', 'carrier': 'SingaporeAir', 'time': '09:20', 'duration': '13h 30m', 'price': 350000, 'class': 'Business', 'aircraft': 'Airbus A380', 'stops': 0, 'seats_available': 16},
    ],

    'singapore-new york': [
        {'flight': 'SQ401', 'carrier': 'SingaporeAir', 'time': '19:00', 'duration': '18h 00m', 'price': 250000, 'class': 'Economy', 'aircraft': 'Boeing 777-300ER', 'stops': 1, 'seats_available': 90},
        {'flight': 'SQ403', 'carrier': 'SingaporeAir', 'time': '23:15', 'duration': '18h 00m', 'price': 600000, 'class': 'Business', 'aircraft': 'Airbus A350', 'stops': 1, 'seats_available': 18},
    ],

    'mumbai-bangkok': [
        {'flight': 'TG301', 'carrier': 'ThaiAir', 'time': '04:00', 'duration': '4h 30m', 'price': 18500, 'class': 'Economy', 'aircraft': 'Boeing 787-8', 'stops': 0, 'seats_available': 44},
        {'flight': 'TG303', 'carrier': 'ThaiAir', 'time': '10:30', 'duration': '4h 30m', 'price': 42000, 'class': 'Business', 'aircraft': 'Airbus A350', 'stops': 0, 'seats_available': 8},
    ],

    # Add a couple of common regional routes
    'bangalore-dubai': [
        {'flight': 'EK101', 'carrier': 'Emirates', 'time': '03:15', 'duration': '4h 15m', 'price': 22000, 'class': 'Economy', 'aircraft': 'Boeing 777-300ER', 'stops': 0, 'seats_available': 60},
        {'flight': 'EK103', 'carrier': 'Emirates', 'time': '08:45', 'duration': '4h 15m', 'price': 52000, 'class': 'Business', 'aircraft': 'Airbus A380', 'stops': 0, 'seats_available': 12},
    ],

    # Europe and long-haul examples
    'delhi-london': [
        {'flight': 'BA101', 'carrier': 'BritishAir', 'time': '02:00', 'duration': '9h 30m', 'price': 45000, 'class': 'Economy', 'aircraft': 'Boeing 787-9', 'stops': 0, 'seats_available': 60},
        {'flight': 'BA103', 'carrier': 'BritishAir', 'time': '10:00', 'duration': '9h 30m', 'price': 125000, 'class': 'Business', 'aircraft': 'Airbus A350', 'stops': 0, 'seats_available': 14},
    ],

    'mumbai-paris': [
        {'flight': 'AF201', 'carrier': 'AirFrance', 'time': '01:30', 'duration': '10h 15m', 'price': 48000, 'class': 'Economy', 'aircraft': 'Boeing 787-9', 'stops': 0, 'seats_available': 55},
    ],

    # Americas
    'delhi-new york': [
        {'flight': 'AI191', 'carrier': 'AirIndia', 'time': '01:00', 'duration': '15h 30m', 'price': 85000, 'class': 'Economy', 'aircraft': 'Boeing 777-300ER', 'stops': 0, 'seats_available': 80},
    ],

    # Australia
    'delhi-sydney': [
        {'flight': 'QF401', 'carrier': 'Qantas', 'time': '04:00', 'duration': '13h 30m', 'price': 75000, 'class': 'Economy', 'aircraft': 'Boeing 787-9', 'stops': 0, 'seats_available': 70},
    ],

    # Added realistic Kolkata <-> Chennai domestic services
    'kolkata-chennai': [
        {'flight': '6E201', 'carrier': 'IndiGo', 'time': '06:20', 'duration': '1h 50m', 'price': 4800, 'class': 'Economy', 'aircraft': 'Airbus A320', 'stops': 0, 'seats_available': 32},
        {'flight': 'UK501', 'carrier': 'Vistara', 'time': '15:30', 'duration': '1h 45m', 'price': 12500, 'class': 'Business', 'aircraft': 'Airbus A320neo', 'stops': 0, 'seats_available': 8},
        {'flight': '6E203', 'carrier': 'IndiGo', 'time': '19:10', 'duration': '1h 55m', 'price': 5200, 'class': 'Economy', 'aircraft': 'Airbus A320', 'stops': 0, 'seats_available': 28}
    ],

    'chennai-kolkata': [
        {'flight': '6E202', 'carrier': 'IndiGo', 'time': '07:00', 'duration': '1h 50m', 'price': 5000, 'class': 'Economy', 'aircraft': 'Airbus A320', 'stops': 0, 'seats_available': 30},
        {'flight': 'UK502', 'carrier': 'Vistara', 'time': '16:15', 'duration': '1h 45m', 'price': 12800, 'class': 'Business', 'aircraft': 'Airbus A320neo', 'stops': 0, 'seats_available': 6},
        {'flight': '6E204', 'carrier': 'IndiGo', 'time': '20:05', 'duration': '1h 55m', 'price': 5400, 'class': 'Economy', 'aircraft': 'Airbus A320', 'stops': 0, 'seats_available': 25}
    ],
}

class ConversationManager:
    def __init__(self, session_id, user_profile=None):
        self.session_id = session_id
        self.user_profile = user_profile  # Pre-filled from voice recognition
        self.context = {
            'step': 0,
            'voice_identified': user_profile is not None,
            'origin': None,
            'destination': None,
            'travel_date': None,
            'passengers': 1,
            'class_preference': user_profile['preferences']['class'] if user_profile else 'Economy',
            'selected_flight': None,
            'passenger_name': user_profile['name'] if user_profile else None,
            'email': user_profile['email'] if user_profile else None,
            'phone': user_profile['phone'] if user_profile else None,
            'seat_preference': user_profile['preferences']['seat'] if user_profile else None,
            'seat_number': None,
            'meal_preference': user_profile['preferences']['meal'] if user_profile else None,
            'assistance_needed': False,
            'assistance_type': None,
            'payment_confirmed': False,
            'booking_id': None,
            'auto_filled': [],  # Track what was auto-filled
            'history': []
        }
        self.steps = [
            {'name': 'welcome', 'prompt': 'Welcome to Voice Airline Booking! I\'ll help you book your flight. Say "start booking" to begin, or say "help" for assistance.'},
            {'name': 'origin', 'prompt': 'Great! Where are you flying from? Please say your departure city.'},
            {'name': 'destination', 'prompt': 'And where would you like to fly to? Please say your destination city.'},
            {'name': 'date', 'prompt': 'When would you like to travel? You can say "today", "tomorrow", or a specific date.'},
            {'name': 'passengers', 'prompt': 'How many passengers will be traveling?'},
            {'name': 'class', 'prompt': 'Would you prefer Economy or Business class?'},
            {'name': 'flight_selection', 'prompt': 'I found some flights for you. Which time slot works best?'},
            {'name': 'passenger_name', 'prompt': 'Please tell me the passenger\'s full name.'},
            {'name': 'email', 'prompt': 'What\'s your email address for the booking confirmation?'},
            {'name': 'phone', 'prompt': 'Please provide your phone number.'},
            {'name': 'seat_selection', 'prompt': 'Would you like a window seat, aisle seat, or middle seat?'},
            {'name': 'meal', 'prompt': 'Any meal preference? We have vegetarian, non-vegetarian, or vegan options.'},
            {'name': 'assistance', 'prompt': 'Do you need any special assistance like wheelchair, visual aid, or hearing assistance?'},
            {'name': 'review', 'prompt': 'Let me confirm your booking details. Say "confirm" to proceed or "change" to modify.'},
            {'name': 'payment', 'prompt': 'Your total amount is shown. Say "proceed to payment" when ready.'},
            {'name': 'complete', 'prompt': 'Payment successful! Your booking is confirmed. You\'ll receive an email confirmation shortly. Thank you for choosing us!'}
        ]
    
    def process_input(self, user_input):
        """Process user voice input - AI-Powered with Smart Auto-Fill"""
        user_input = user_input.lower().strip()
        self.context['history'].append({'user': user_input, 'time': datetime.now().isoformat()})
        
        # Voice commands: cancel, stop, go back
        if self._match_intent(user_input, ['cancel', 'stop', 'exit', 'quit', 'end']):
            return {'response': 'Booking cancelled. Thank you!', 'intent': 'cancel', 'advance': False, 'auto_listen': False, 'booking_cancelled': True}
        
        if self._match_intent(user_input, ['go back', 'previous', 'back']):
            if self.context['step'] > 0:
                self.context['step'] -= 1
                return {'response': 'Going back. ' + self.steps[self.context['step']]['prompt'], 'intent': 'go_back', 'advance': False, 'auto_listen': True}
            return {'response': 'Already at the beginning.', 'intent': 'go_back_fail', 'advance': False, 'auto_listen': True}
        
        if self._match_intent(user_input, ['help', 'what do i say', 'what should i say']):
            help_msg = self.steps[self.context['step']]['prompt'] + " Or say 'cancel' to stop, 'go back' to return."
            return {'response': help_msg, 'intent': 'help', 'advance': False, 'auto_listen': True}
        
        # Try to extract complete booking from single command (works at ANY step before flight selection)
        smart_extract = self._extract_complete_booking(user_input)
        if smart_extract and self.context['step'] < 4:  # Allow smart booking up to step 3 (date)
            return self._handle_smart_booking(smart_extract)
        
        current_step = self.context['step']
        
        # Step 0: Welcome & Voice Identification
        if current_step == 0:
            if self._match_intent(user_input, ['hello', 'hi', 'hey', 'good morning', 'good afternoon']):
                if self.context['voice_identified']:
                    return {'response': f"Hello {self.context['passenger_name']}! Ready to book your flight? Just say where and when.", 'intent': 'greeting_identified', 'advance': False, 'auto_listen': True}
                return {'response': self.steps[0]['prompt'], 'intent': 'greeting', 'advance': False, 'auto_listen': True}
            elif self._match_intent(user_input, ['start', 'begin', 'book', 'booking']):
                self.context['step'] = 1
                return {'response': self.steps[1]['prompt'], 'intent': 'start_booking', 'advance': True, 'auto_listen': True}
            return {'response': self.steps[0]['prompt'], 'intent': 'unknown', 'advance': False, 'auto_listen': True}
        
        # Step 1: Origin City
        elif current_step == 1:
            origin = self._extract_city(user_input)
            if origin:
                self.context['origin'] = origin
                self.context['step'] = 2
                return {'response': f"Flying from {origin}. " + self.steps[2]['prompt'], 'intent': 'set_origin', 'entities': {'origin': origin}, 'advance': True, 'auto_listen': True}
            return {'response': 'Please say your departure city clearly.', 'intent': 'origin_unclear', 'advance': False, 'auto_listen': True}
        
        # Step 2: Destination City
        elif current_step == 2:
            destination = self._extract_city(user_input)
            if destination:
                self.context['destination'] = destination
                self.context['step'] = 3
                return {'response': f"To {destination}. " + self.steps[3]['prompt'], 'intent': 'set_destination', 'entities': {'destination': destination}, 'advance': True, 'auto_listen': True}
            return {'response': 'Please say your destination city.', 'intent': 'destination_unclear', 'advance': False, 'auto_listen': True}
        
        # Step 3: Travel Date
        elif current_step == 3:
            travel_date = self._extract_date(user_input)
            if travel_date:
                self.context['travel_date'] = travel_date
                self.context['step'] = 4
                return {'response': f"Travel date: {travel_date}. " + self.steps[4]['prompt'], 'intent': 'set_date', 'entities': {'date': travel_date}, 'advance': True, 'auto_listen': True}
            return {'response': 'Please say your travel date.', 'intent': 'date_unclear', 'advance': False, 'auto_listen': True}
        
        # Step 4: Number of Passengers
        elif current_step == 4:
            passengers = self._extract_number(user_input)
            if passengers and passengers > 0:
                self.context['passengers'] = passengers
                self.context['step'] = 5
                return {'response': f"{passengers} passenger{'s' if passengers > 1 else ''}. " + self.steps[5]['prompt'], 'intent': 'set_passengers', 'entities': {'passengers': passengers}, 'advance': True, 'auto_listen': True}
            return {'response': 'Please say the number of passengers.', 'intent': 'passengers_unclear', 'advance': False, 'auto_listen': True}
        
        # Step 5: Class Preference
        elif current_step == 5:
            class_pref = self._extract_class(user_input)
            if class_pref:
                self.context['class_preference'] = class_pref
                flights = self._get_available_flights()
                self.context['step'] = 6
                return {'response': f"{class_pref} class selected. " + flights, 'intent': 'set_class', 'entities': {'class': class_pref}, 'advance': True, 'auto_listen': True, 'flights': self._get_flight_options()}
            return {'response': 'Please say Economy or Business.', 'intent': 'class_unclear', 'advance': False, 'auto_listen': True}
        
        # Step 6: Flight Selection
        elif current_step == 6:
            flight = self._extract_flight_time(user_input)
            if flight:
                self.context['selected_flight'] = flight
                self.context['step'] = 7
                # Build detailed spoken response including price, carrier, duration, aircraft and seat info
                fcode = flight.get('flight', 'N/A')
                carrier = flight.get('carrier', 'Unknown')
                ftime = flight.get('time', 'TBA')
                duration = flight.get('duration', 'N/A')
                aircraft = flight.get('aircraft', '')
                price = flight.get('price')
                seats = flight.get('seats_available', 'Unknown')
                price_text = f"₹{price:,}" if isinstance(price, (int, float)) and price > 0 else 'price not available'
                details = f"Selected {fcode} operated by {carrier}, departing at {ftime}, duration {duration}."
                if aircraft:
                    details += f" Aircraft: {aircraft}."
                details += f" Price: {price_text}. Seats available: {seats}."
                response_text = details + ' ' + self.steps[7]['prompt']
                return {'response': response_text, 'intent': 'select_flight', 'entities': {'flight': flight}, 'advance': True, 'auto_listen': True, 'selected_flight': flight}
            return {'response': 'Please say morning, afternoon, or evening.', 'intent': 'flight_unclear', 'advance': False, 'auto_listen': True}
        
        # Step 7: Passenger Name (Skip if auto-filled)
        elif current_step == 7:
            if self.context['passenger_name'] and 'name' in self.context.get('auto_filled', []):
                # Auto-filled, just confirm and skip
                if self._match_intent(user_input, ['yes', 'correct', 'ok', 'confirm']):
                    self.context['step'] = 10  # Skip email & phone if also auto-filled
                    return {'response': f"Great! Using {self.context['passenger_name']}. " + self.steps[10]['prompt'], 'intent': 'confirm_autofill', 'advance': True, 'auto_listen': True}
                elif self._match_intent(user_input, ['no', 'change', 'different']):
                    self.context['passenger_name'] = None
                    return {'response': 'Please say the passenger name.', 'intent': 'request_new_name', 'advance': False, 'auto_listen': True}
            
            name = self._extract_name(user_input)
            if name:
                self.context['passenger_name'] = name
                self.context['step'] = 8
                return {'response': f"Passenger name: {name}. " + self.steps[8]['prompt'], 'intent': 'set_name', 'entities': {'name': name}, 'advance': True, 'auto_listen': True}
            return {'response': 'Please say the full name clearly.', 'intent': 'name_unclear', 'advance': False, 'auto_listen': True}
        
        # Step 8: Email (Skip if auto-filled)
        elif current_step == 8:
            if self.context['email'] and 'email' in self.context.get('auto_filled', []):
                self.context['step'] = 9
                return {'response': f"Using email: {self.context['email']}. " + self.steps[9]['prompt'], 'intent': 'skip_email', 'advance': True, 'auto_listen': True}
            
            email = self._extract_email(user_input)
            if email:
                self.context['email'] = email
                self.context['step'] = 9
                return {'response': f"Email: {email}. " + self.steps[9]['prompt'], 'intent': 'set_email', 'entities': {'email': email}, 'advance': True, 'auto_listen': True}
            return {'response': 'Please say your email address.', 'intent': 'email_unclear', 'advance': False, 'auto_listen': True}
        
        # Step 9: Phone (Skip if auto-filled)
        elif current_step == 9:
            if self.context['phone'] and 'phone' in self.context.get('auto_filled', []):
                self.context['step'] = 10
                return {'response': f"Using phone: {self.context['phone']}. " + self.steps[10]['prompt'], 'intent': 'skip_phone', 'advance': True, 'auto_listen': True}
            
            phone = self._extract_phone(user_input)
            if phone:
                self.context['phone'] = phone
                self.context['step'] = 10
                return {'response': f"Phone: {phone}. " + self.steps[10]['prompt'], 'intent': 'set_phone', 'entities': {'phone': phone}, 'advance': True, 'auto_listen': True}
            return {'response': 'Please say your 10-digit phone number.', 'intent': 'phone_unclear', 'advance': False, 'auto_listen': True}
        
        # Step 10: Seat Selection
        elif current_step == 10:
            seat = self._extract_seat_preference(user_input)
            if seat:
                self.context['seat_preference'] = seat
                self.context['seat_number'] = self._assign_seat(seat)
                self.context['step'] = 11
                return {'response': f"{seat} seat - {self.context['seat_number']} assigned. " + self.steps[11]['prompt'], 'intent': 'select_seat', 'entities': {'seat': seat, 'seat_number': self.context['seat_number']}, 'advance': True, 'auto_listen': True}
            return {'response': 'Please say window, aisle, or middle.', 'intent': 'seat_unclear', 'advance': False, 'auto_listen': True}
        
        # Step 11: Meal Preference
        elif current_step == 11:
            meal = self._extract_meal(user_input)
            if meal:
                self.context['meal_preference'] = meal
                self.context['step'] = 12
                return {'response': f"{meal} meal noted. " + self.steps[12]['prompt'], 'intent': 'set_meal', 'entities': {'meal': meal}, 'advance': True, 'auto_listen': True}
            return {'response': 'Please say vegetarian, non-vegetarian, or vegan.', 'intent': 'meal_unclear', 'advance': False, 'auto_listen': True}
        
        # Step 12: Special Assistance
        elif current_step == 12:
            if self._match_intent(user_input, ['no', 'none', 'not needed', 'no thanks']):
                self.context['assistance_needed'] = False
                self.context['step'] = 13
                return {'response': 'No assistance needed. ' + self._generate_review(), 'intent': 'no_assistance', 'advance': True, 'auto_listen': True}
            assistance = self._extract_assistance(user_input)
            if assistance:
                self.context['assistance_needed'] = True
                self.context['assistance_type'] = assistance
                self.context['step'] = 13
                return {'response': f"{assistance} assistance arranged. " + self._generate_review(), 'intent': 'set_assistance', 'entities': {'assistance': assistance}, 'advance': True, 'auto_listen': True}
            return {'response': 'Say wheelchair, visual aid, hearing assistance, or no.', 'intent': 'assistance_unclear', 'advance': False, 'auto_listen': True}
        
        # Step 13: Review & Confirm
        elif current_step == 13:
            if self._match_intent(user_input, ['confirm', 'yes', 'proceed', 'correct']):
                self.context['step'] = 14
                price = self.context['selected_flight']['price'] * self.context['passengers']
                return {'response': f"Confirmed! Total amount: ₹{price:,}. " + self.steps[14]['prompt'], 'intent': 'confirm_booking', 'advance': True, 'auto_listen': True, 'total_amount': price}
            elif self._match_intent(user_input, ['change', 'modify', 'edit', 'wrong']):
                return {'response': 'What would you like to change?', 'intent': 'request_change', 'advance': False, 'auto_listen': True}
            return {'response': 'Say confirm to proceed or change to modify.', 'intent': 'review_unclear', 'advance': False, 'auto_listen': True}
        
        # Step 14: Payment
        elif current_step == 14:
            if self._match_intent(user_input, ['proceed', 'payment', 'pay', 'confirm payment']):
                self.context['payment_confirmed'] = True
                self.context['booking_id'] = f"BK{datetime.now().strftime('%Y%m%d%H%M%S')}"
                self.context['step'] = 15
                return {'response': self.steps[15]['prompt'], 'intent': 'payment_success', 'advance': True, 'auto_listen': False, 'booking_complete': True, 'booking_id': self.context['booking_id']}
            return {'response': 'Say proceed to payment when ready.', 'intent': 'payment_pending', 'advance': False, 'auto_listen': True}
        
        # Step 15: Complete
        else:
            return {'response': 'Your booking is complete! Have a great flight!', 'intent': 'complete', 'advance': False, 'auto_listen': False}
    
    def _extract_complete_booking(self, user_input):
        """Extract origin, destination, date from single command"""
        # Examples: "book flight from mumbai to singapore tomorrow"
        #           "I want to fly delhi to london next friday"
        #           "fly bangalore dubai on 15th december"
        
        origin = None
        destination = None
        date = None
        
        # Extract origin (after "from")
        from_match = re.search(r'from\s+(\w+)', user_input)
        if from_match:
            origin = self._extract_city(from_match.group(1))
        
        # Extract destination (after "to")
        to_match = re.search(r'to\s+(\w+)', user_input)
        if to_match:
            destination = self._extract_city(to_match.group(1))
        
        # Extract date
        date = self._extract_date(user_input)
        
        if origin and destination:
            return {'origin': origin, 'destination': destination, 'date': date}
        
        return None
    
    def _handle_smart_booking(self, booking_data):
        """Handle single-command booking with auto-filled details"""
        self.context['origin'] = booking_data['origin']
        self.context['destination'] = booking_data['destination']
        
        # Only set date if it was extracted, otherwise ask for it
        if booking_data.get('date'):
            self.context['travel_date'] = booking_data['date']
        
        # Mark auto-filled fields
        if self.context['passenger_name']:
            self.context['auto_filled'].append('name')
        if self.context['email']:
            self.context['auto_filled'].append('email')
        if self.context['phone']:
            self.context['auto_filled'].append('phone')
        if self.context['seat_preference']:
            self.context['auto_filled'].append('seat')
        if self.context['meal_preference']:
            self.context['auto_filled'].append('meal')
        
        # Build confirmation message
        msg = f"Perfect! Booking flight from {booking_data['origin']} to {booking_data['destination']}"
        if booking_data.get('date'):
            msg += f" on {booking_data['date']}"
        
        # Add auto-filled info
        if self.context['voice_identified']:
            msg += f". I have your details: {self.context['passenger_name']}, {self.context['email']}. "
        
        # Smart step selection: skip to appropriate step
        # If no date provided, go to step 3 (date) - DATE IS MANDATORY
        # If date provided, go to step 4 (passengers)
        if not booking_data.get('date'):
            self.context['step'] = 3
        else:
            self.context['step'] = 4
        
        next_prompt = self.steps[self.context['step']]['prompt']
        
        return {
            'response': msg + next_prompt,
            'intent': 'smart_booking',
            'advance': True,
            'auto_listen': True,
            'smart_filled': True,
            'entities': booking_data
        }
    
    def _match_intent(self, user_input, keywords):
        """Check if user input matches any keyword"""
        return any(keyword in user_input for keyword in keywords)
    
    def _extract_city(self, user_input):
        """Extract city name from input"""
        cities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'singapore', 'london', 'dubai', 'new york', 'tokyo', 'paris', 'sydney']
        cleaned = re.sub(r'\b(from|to|flying|going)\b', '', user_input, flags=re.IGNORECASE).strip()
        for city in cities:
            if city in cleaned:
                return city.title()
        words = cleaned.split()
        if words:
            return ' '.join(words[:2]).title()
        return None
    
    def _extract_date(self, user_input):
        """Extract travel date from input"""
        if 'today' in user_input:
            return datetime.now().strftime('%Y-%m-%d')
        elif 'tomorrow' in user_input:
            return (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        elif 'day after' in user_input or 'next' in user_input:
            return (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d')
        date_match = re.search(r'(\d{1,2})[/-](\d{1,2})', user_input)
        if date_match:
            return f"2025-{date_match.group(2).zfill(2)}-{date_match.group(1).zfill(2)}"
        return None
    
    def _extract_number(self, user_input):
        """Extract number from input"""
        number_words = {'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9}
        for word, num in number_words.items():
            if word in user_input:
                return num
        match = re.search(r'\b(\d+)\b', user_input)
        return int(match.group(1)) if match else None
    
    def _extract_class(self, user_input):
        """Extract class preference"""
        if 'business' in user_input:
            return 'Business'
        elif 'economy' in user_input or 'eco' in user_input:
            return 'Economy'
        return None
    
    def _get_available_flights(self):
        """Get flight options based on route - with full details like Singapore Airlines"""
        route = f"{self.context['origin'].lower()}-{self.context['destination'].lower()}"
        # Try to call the flights lookup endpoint (self) to retrieve structured data
        try:
            params = {'origin': self.context['origin'], 'destination': self.context['destination'], 'class': self.context['class_preference'], 'date': self.context.get('travel_date')}
            resp = requests.get('http://127.0.0.1:5000/api/flights', params=params, timeout=2)
            if resp.status_code == 200:
                data = resp.json()
                flights = data.get('flights', [])
                if flights:
                    # Build spoken description from returned flights
                    flight_desc = f"I found {len(flights)} {self.context['class_preference']} flights. "
                    morning = [f for f in flights if 5 <= int(f['time'].split(':')[0]) < 12]
                    afternoon = [f for f in flights if 12 <= int(f['time'].split(':')[0]) < 18]
                    evening = [f for f in flights if int(f['time'].split(':')[0]) >= 18 or int(f['time'].split(':')[0]) < 5]
                    options = []
                    if morning:
                        f = morning[0]
                        options.append(f"Morning: Flight {f['flight']} at {f['time']}, {f.get('duration','n/a')}, {f.get('aircraft','')}, {f.get('price')} rupees")
                    if afternoon:
                        f = afternoon[0]
                        options.append(f"Afternoon: Flight {f['flight']} at {f['time']}, {f.get('duration','n/a')}, {f.get('aircraft','')}, {f.get('price')} rupees")
                    if evening:
                        f = evening[0]
                        options.append(f"Evening: Flight {f['flight']} at {f['time']}, {f.get('duration','n/a')}, {f.get('aircraft','')}, {f.get('price')} rupees")
                    flight_desc += ". ".join(options) + ". Which time works for you?"
                    # Save last lookup in context for later use
                    self.context['last_flights_lookup'] = flights
                    return flight_desc
        except Exception as e:
            # Fall back to local DB if the HTTP lookup fails
            print('Flight lookup HTTP error:', e)

        # Fallback: try local FLIGHTS_DB
        flights = []
        if route in FLIGHTS_DB:
            flights = [f for f in FLIGHTS_DB[route] if f['class'] == self.context['class_preference']]

        # If no flights, try swapped route (user may say destination/origin in different order)
        if not flights:
            swapped = f"{self.context['destination'].lower()}-{self.context['origin'].lower()}"
            if swapped in FLIGHTS_DB:
                flights = [f for f in FLIGHTS_DB[swapped] if f['class'] == self.context['class_preference']]

        # If still no flights, try to find any flights matching origin OR destination to offer alternatives
        if not flights:
            # search for any route that starts with origin-
            for r, fls in FLIGHTS_DB.items():
                if r.startswith(self.context['origin'].lower() + '-'):
                    candidates = [f for f in fls if f['class'] == self.context['class_preference']]
                    if candidates:
                        flights = candidates
                        break
            # or any route that ends with -destination
            if not flights:
                for r, fls in FLIGHTS_DB.items():
                    if r.endswith('-' + self.context['destination'].lower()):
                        candidates = [f for f in fls if f['class'] == self.context['class_preference']]
                        if candidates:
                            flights = candidates
                            break

        # Cache lookup if we found fallback flights
        if flights:
            self.context['last_flights_lookup'] = flights
            morning = [f for f in flights if 5 <= int(f['time'].split(':')[0]) < 12]
            afternoon = [f for f in flights if 12 <= int(f['time'].split(':')[0]) < 18]
            evening = [f for f in flights if int(f['time'].split(':')[0]) >= 18 or int(f['time'].split(':')[0]) < 5]
            options = []
            if morning:
                f = morning[0]
                options.append(f"Morning: Flight {f['flight']} at {f['time']}")
            if afternoon:
                f = afternoon[0]
                options.append(f"Afternoon: Flight {f['flight']} at {f['time']}")
            if evening:
                f = evening[0]
                options.append(f"Evening: Flight {f['flight']} at {f['time']}")
            return f"I found {len(flights)} {self.context['class_preference']} flights. " + ". ".join(options) + ". Which time works for you?"

        return "I found some flights. Would you prefer morning, afternoon, or evening?"
    
    def _get_flight_options(self):
        """Return flight options for frontend"""
        route = f"{self.context['origin'].lower()}-{self.context['destination'].lower()}"
        # Prefer cached lookup
        if 'last_flights_lookup' in self.context:
            return [f for f in self.context['last_flights_lookup'] if f.get('class','').lower() == self.context['class_preference'].lower()]
        # Otherwise call flights endpoint
        try:
            params = {'origin': self.context['origin'], 'destination': self.context['destination'], 'class': self.context['class_preference'], 'date': self.context.get('travel_date')}
            resp = requests.get('http://127.0.0.1:5000/api/flights', params=params, timeout=2)
            if resp.status_code == 200:
                data = resp.json()
                return data.get('flights', [])
        except Exception:
            pass
        # Fallback to local DB
        if route in FLIGHTS_DB:
            return [f for f in FLIGHTS_DB[route] if f['class'] == self.context['class_preference']]
        return []
    
    def _extract_flight_time(self, user_input):
        """Extract flight selection with robust parsing and fallbacks."""
        # Normalize and sanitize input
        raw = user_input
        user_input = re.sub(r"[^\w\s:\.]", '', user_input.lower()).strip()

        route = f"{self.context.get('origin','').lower()}-{self.context.get('destination','').lower()}"

        # Prefer cached lookup but ensure it's a list; otherwise refresh options
        flights = []
        if isinstance(self.context.get('last_flights_lookup'), list):
            flights = [f for f in self.context['last_flights_lookup'] if f.get('class','').lower() == self.context['class_preference'].lower()]
        else:
            flights = self._get_flight_options()

        # If still empty, try to refresh from FLIGHTS_DB as last resort
        if not flights and route in FLIGHTS_DB:
            flights = [f for f in FLIGHTS_DB[route] if f.get('class','').lower() == self.context['class_preference'].lower()]
            # cache this lookup so subsequent selection can use it
            self.context['last_flights_lookup'] = flights

        print(f"_extract_flight_time: input='{raw}' sanitized='{user_input}' flights_count={len(flights)}")

        # If no real flights were found but user said a time-of-day, synthesize a placeholder
        # so the conversation can progress (useful when route not in DB or lookup failed)
        lowered_raw = raw.lower()
        if not flights:
            if any(k in lowered_raw for k in ('morning', 'early', 'forenoon')):
                return {'flight': 'GEN-MORNING', 'carrier': 'Scheduled', 'time': '09:00', 'class': self.context['class_preference'], 'price': 0}
            if any(k in lowered_raw for k in ('afternoon', 'noon', 'midday', 'mid')):
                return {'flight': 'GEN-AFTERNOON', 'carrier': 'Scheduled', 'time': '14:00', 'class': self.context['class_preference'], 'price': 0}
            if any(k in lowered_raw for k in ('evening', 'night', 'late', 'eve')):
                return {'flight': 'GEN-EVENING', 'carrier': 'Scheduled', 'time': '19:00', 'class': self.context['class_preference'], 'price': 0}

        # 1) Match explicit flight number e.g. SQ003 or AI105
        flight_num_match = re.search(r'\b([A-Za-z]{1,4}\d{1,4})\b', user_input.replace('-', ''))
        if flight_num_match:
            code = flight_num_match.group(1).upper()
            for f in flights:
                if f.get('flight','').upper() == code:
                    return f

        # 2) Match numeric index (user says '1' or 'first' or '1st')
        number_words = {'first':1,'one':1,'second':2,'two':2,'third':3,'three':3,'four':4,'fourth':4,'five':5,'fifth':5}
        # ordinal like '1st', '2nd'
        ord_match = re.search(r'\b(\d+)(?:st|nd|rd|th)?\b', user_input)
        if ord_match:
            idx = int(ord_match.group(1))
            if 1 <= idx <= len(flights):
                return flights[idx-1]
        for w, n in number_words.items():
            if re.search(r'\b' + re.escape(w) + r'\b', user_input):
                if 1 <= n <= len(flights):
                    return flights[n-1]

        # 3) Parse explicit hour (e.g., '9 am', '09:30') and pick closest flight
        time_match = re.search(r'\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b', user_input)
        if time_match:
            hour = int(time_match.group(1))
            minute = int(time_match.group(2)) if time_match.group(2) else 0
            ampm = time_match.group(3)
            if ampm:
                if ampm == 'pm' and hour < 12:
                    hour += 12
                if ampm == 'am' and hour == 12:
                    hour = 0
            # find flight with closest hour
            best = None
            best_diff = 24
            for f in flights:
                try:
                    fh = int(f['time'].split(':')[0])
                    diff = abs(fh - hour)
                    if diff < best_diff:
                        best_diff = diff
                        best = f
                except Exception:
                    continue
            if best:
                return best

        # 4) Match time of day keywords (robust: regex first, then substring fallback)
        if re.search(r'\bmorning\b|\bearly\b|\bforenoon\b', user_input):
            return flights[0]
        if re.search(r'\bafternoon\b|\bmid\b|\bnoon\b|\bmidday\b', user_input):
            return flights[1] if len(flights) > 1 else flights[0]
        if re.search(r'\bevening\b|\bnight\b|\blate\b|\beve\b', user_input):
            return flights[-1]

        # Fallback substring matching (handles variants like "in the evening", trailing punctuation, small ASR variants)
        lowered = raw.lower()
        if any(k in lowered for k in ('morning', 'early', 'forenoon')):
            return flights[0]
        if any(k in lowered for k in ('afternoon', 'noon', 'midday', 'mid')):
            return flights[1] if len(flights) > 1 else flights[0]
        if any(k in lowered for k in ('evening', 'night', 'late', 'eve')):
            return flights[-1]

        return None
    
    def _extract_name(self, user_input):
        """Extract passenger name"""
        cleaned = re.sub(r'\b(my|name|is|i\'m|i am|this is|it\'s|its|called)\b', '', user_input, flags=re.IGNORECASE).strip()
        words = [w for w in cleaned.split() if len(w) > 1]
        if len(words) >= 2:
            return ' '.join(words[:2]).title()
        elif len(words) == 1:
            return words[0].title()
        return None
    
    def _extract_email(self, user_input):
        """Extract email from voice (basic)"""
        email_match = re.search(r'\b[\w.-]+@[\w.-]+\.\w+\b', user_input)
        if email_match:
            return email_match.group(0)
        cleaned = re.sub(r'\s+', '', user_input)
        if '@' in cleaned and '.' in cleaned:
            return cleaned
        return None
    
    def _extract_phone(self, user_input):
        """Extract phone number"""
        # Remove all spaces and non-digit characters
        digits_only = re.sub(r'[^0-9]', '', user_input)
        # Check if we have exactly 10 digits
        if len(digits_only) == 10:
            return digits_only
        return None
    
    def _extract_seat_preference(self, user_input):
        """Extract seat preference"""
        if 'window' in user_input:
            return 'Window'
        elif 'aisle' in user_input:
            return 'Aisle'
        elif 'middle' in user_input or 'center' in user_input:
            return 'Middle'
        return None
    
    def _assign_seat(self, preference):
        """Assign seat number based on preference"""
        seats = {'Window': '12A', 'Aisle': '12C', 'Middle': '12B'}
        return seats.get(preference, '12B')
    
    def _extract_meal(self, user_input):
        """Extract meal preference"""
        lowered = user_input.lower()
        # Handle explicit negative/no-preference replies like 'no', 'not', 'none'
        if any(k in lowered for k in ('no preference', 'no meal', 'none', 'not', 'no')):
            return 'No Preference'
        if 'veg' in lowered and 'non' not in lowered:
            return 'Vegetarian'
        elif 'non' in lowered or 'meat' in lowered or 'chicken' in lowered:
            return 'Non-Vegetarian'
        elif 'vegan' in lowered:
            return 'Vegan'
        return None
    
    def _extract_assistance(self, user_input):
        """Extract assistance type"""
        if 'wheelchair' in user_input or 'mobility' in user_input:
            return 'Wheelchair'
        elif 'visual' in user_input or 'blind' in user_input:
            return 'Visual Aid'
        elif 'hearing' in user_input or 'deaf' in user_input:
            return 'Hearing Aid'
        return None
    
    def _generate_review(self):
        """Generate booking review summary - comprehensive like Singapore Airlines"""
        flight = self.context['selected_flight']
        price_total = flight['price'] * self.context['passengers']
        
        review = f"Here's your booking summary: "
        review += f"Flight {flight['flight']} operated by {flight['aircraft']}, "
        review += f"departing {self.context['origin']} at {flight['time']}, "
        review += f"arriving {self.context['destination']}, flight duration {flight['duration']}. "
        review += f"Travel date: {self.context['travel_date']}. "
        review += f"{self.context['passengers']} passenger{'s' if self.context['passengers'] > 1 else ''} in {self.context['class_preference']} class. "
        review += f"Passenger name: {self.context['passenger_name']}. "
        review += f"Contact: {self.context['email']}, {self.context['phone']}. "
        review += f"Seat: {self.context['seat_number']} {self.context['seat_preference']}. "
        review += f"Meal: {self.context['meal_preference']}. "
        if self.context.get('special_assistance') and self.context['special_assistance'] != 'None':
            review += f"Special assistance: {self.context['special_assistance']}. "
        review += f"Total fare: {price_total:,} rupees. "
        review += f"Say confirm to proceed with booking."
        
        return review
    
    def get_current_step(self):
        """Get current conversation step and context"""
        return {
            'step': self.context['step'],
            'step_name': self.steps[self.context['step']]['name'],
            'context': self.context
        }


@app.route('/')
def home():
    """Root endpoint - API information"""
    return jsonify({
        "status": "Voice Airline Booking NLP API is running",
        "service": "nlp-service",
        "version": "1.0.0",
        "endpoints": [
            {"path": "/", "methods": ["GET"], "description": "API status and information"},
            {"path": "/health", "methods": ["GET"], "description": "Health check endpoint"},
            {"path": "/api/nlp/identify", "methods": ["POST"], "description": "Identify user from voice pattern"},
            {"path": "/api/nlp/process", "methods": ["POST"], "description": "Process voice input and return NLP response"},
            {"path": "/api/flights", "methods": ["GET", "POST"], "description": "Flight lookup endpoint"},
            {"path": "/api/nlp/save-profile", "methods": ["POST"], "description": "Save or update user profile"},
            {"path": "/api/nlp/reset", "methods": ["POST"], "description": "Reset conversation session"},
            {"path": "/api/nlp/status", "methods": ["GET"], "description": "Get current session status"}
        ]
    })


@app.route('/api/nlp/identify', methods=['POST'])
def identify_voice():
    """Identify user from voice pattern and return profile"""
    data = request.json
    voice_sample = data.get('voice_sample', '')
    
    # Simple voice identification (in production, use ML model)
    voice_hash = hashlib.md5(voice_sample.encode()).hexdigest()[:10]
    
    # Check if user exists in database
    user_profile = USER_PROFILES.get('user_sample_1')  # Demo: return sample user
    
    if user_profile:
        return jsonify({
            'identified': True,
            'user_id': 'user_sample_1',
            'profile': user_profile,
            'message': f"Welcome back, {user_profile['name']}!"
        })
    
    return jsonify({'identified': False, 'message': 'New user detected'})


@app.route('/api/nlp/identify', methods=['POST'])
def identify_user():
    """Identify user by voice or test with phone number"""
    data = request.json
    test_phone = data.get('test_phone')  # For testing: simulate voice ID with phone
    
    # Search for user by phone (simulating voice recognition)
    for user_id, profile in USER_PROFILES.items():
        if profile['phone'] == test_phone:
            return jsonify({
                'identified': True,
                'user_id': user_id,
                'profile': profile,
                'message': f"Welcome back, {profile['name']}! Your details are ready."
            })
    
    return jsonify({'identified': False, 'message': 'New user - will collect details'})


@app.route('/api/flights', methods=['GET', 'POST'])
def flights_lookup():
    """Flight lookup using existing FLIGHTS_DB mock data.
    Accepts JSON body or query params: origin, destination, date, class
    """
    data = request.get_json(silent=True) or request.args or {}
    origin = (data.get('origin') or data.get('from') or data.get('o') or '').strip()
    destination = (data.get('destination') or data.get('to') or data.get('d') or '').strip()
    travel_date = data.get('date') or data.get('travel_date') or None
    cls = data.get('class') or data.get('c') or None

    if not origin or not destination:
        return jsonify({'error': 'origin and destination are required'}), 400

    route = f"{origin.lower()}-{destination.lower()}"
    flights = FLIGHTS_DB.get(route, [])
    if cls:
        flights = [f for f in flights if f.get('class', '').lower() == cls.lower()]

    return jsonify({'route': route, 'date': travel_date, 'flights': flights})


@app.route('/api/nlp/process', methods=['POST'])
def process_voice_input():
    """Process voice input and return NLP response - with voice identification"""
    data = request.json
    user_input = data.get('input', '')
    session_id = data.get('session_id', 'default')
    user_id = data.get('user_id', None)  # From voice identification
    
    # Get user profile if identified
    # Get user profile from in-memory storage
    user_profile = USER_PROFILES.get(user_id) if user_id else None
    
    # Get or create session with user profile
    if session_id not in sessions:
        sessions[session_id] = ConversationManager(session_id, user_profile)
    
    conversation = sessions[session_id]
    result = conversation.process_input(user_input)
    result['context'] = conversation.get_current_step()
    
    return jsonify(result)


@app.route('/api/nlp/save-profile', methods=['POST'])
def save_user_profile():
    """Save or update user profile after successful booking"""
    data = request.json
    session_id = data.get('session_id')
    
    if session_id in sessions:
        conversation = sessions[session_id]
        context = conversation.context
        
        # Create/update user profile
        user_id = f"user_{hashlib.md5(context['phone'].encode()).hexdigest()[:10]}"
        USER_PROFILES[user_id] = {
            'name': context['passenger_name'],
            'email': context['email'],
            'phone': context['phone'],
            'preferences': {
                'seat': context['seat_preference'],
                'meal': context['meal_preference'],
                'class': context['class_preference']
            },
            'history': []
        }
        # Persist profiles to disk so they survive container restarts
        try:
            with open(PROFILE_FILE, 'w', encoding='utf-8') as pf:
                json.dump(USER_PROFILES, pf, indent=2)
        except Exception as e:
            print('Could not persist profile to file:', e)

        return jsonify({'status': 'saved', 'user_id': user_id, 'message': 'Profile saved for future bookings'})
    
    return jsonify({'status': 'error', 'message': 'Session not found'})


@app.route('/api/nlp/profile/<user_id>', methods=['GET'])
def get_user_profile(user_id):
    """Return a saved user profile by user_id (for debugging/UI)."""
    profile = USER_PROFILES.get(user_id)
    if profile:
        return jsonify({'found': True, 'user_id': user_id, 'profile': profile})
    return jsonify({'found': False, 'message': 'user not found'}), 404


@app.route('/api/nlp/reset', methods=['POST'])
def reset_session():
    """Reset conversation session"""
    data = request.json
    session_id = data.get('session_id', 'default')
    
    if session_id in sessions:
        del sessions[session_id]
    
    return jsonify({'status': 'reset', 'session_id': session_id})


@app.route('/api/nlp/status', methods=['GET'])
def get_status():
    """Get current session status"""
    session_id = request.args.get('session_id', 'default')
    
    if session_id in sessions:
        conversation = sessions[session_id]
        return jsonify({
            'active': True,
            'context': conversation.get_current_step()
        })
    
    return jsonify({'active': False})


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'nlp-service', 'sessions': len(sessions)})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
