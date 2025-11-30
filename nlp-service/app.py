"""
Python NLP Service for Voice Airline Booking
Provides advanced conversation management and context tracking
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import re
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Conversation sessions storage
sessions = {}

class ConversationManager:
    def __init__(self, session_id):
        self.session_id = session_id
        self.context = {
            'step': 0,
            'passenger_name': None,
            'seat_preference': None,
            'payment_confirmed': False,
            'history': []
        }
        self.steps = [
            {'name': 'greeting', 'prompt': 'Hello! Welcome to Voice Airline Booking. Say "start booking" to begin.'},
            {'name': 'name', 'prompt': 'Great! Please tell me your full name.'},
            {'name': 'seat', 'prompt': 'What seat would you prefer? Window, aisle, or middle?'},
            {'name': 'payment', 'prompt': 'Perfect! Ready for payment. Say "confirm payment" to proceed.'},
            {'name': 'complete', 'prompt': 'Payment successful! Your booking is complete. Thank you!'}
        ]
    
    def process_input(self, user_input):
        """Process user voice input and generate response"""
        user_input = user_input.lower().strip()
        self.context['history'].append({'user': user_input, 'time': datetime.now().isoformat()})
        
        current_step = self.context['step']
        
        # Step 0: Greeting / Start booking
        if current_step == 0:
            if self._match_intent(user_input, ['hello', 'hi', 'hey', 'good morning', 'good afternoon']):
                return {
                    'response': self.steps[0]['prompt'],
                    'intent': 'greeting',
                    'advance': False,
                    'auto_listen': True
                }
            elif self._match_intent(user_input, ['start', 'begin', 'book', 'checkout', 'start booking', 'start voice checkout']):
                self.context['step'] = 1
                return {
                    'response': "Excellent! Let's get you booked. " + self.steps[1]['prompt'],
                    'intent': 'start_booking',
                    'advance': True,
                    'auto_listen': True
                }
            else:
                return {
                    'response': 'I didn\'t understand. Say "hello" to greet me, or "start booking" to begin your reservation.',
                    'intent': 'unknown',
                    'advance': False,
                    'auto_listen': True
                }
        
        # Step 1: Get passenger name
        elif current_step == 1:
            name = self._extract_name(user_input)
            if name:
                self.context['passenger_name'] = name
                self.context['step'] = 2
                return {
                    'response': f"Thank you, {name}! " + self.steps[2]['prompt'],
                    'intent': 'provide_name',
                    'entities': {'name': name},
                    'advance': True,
                    'auto_listen': True
                }
            else:
                return {
                    'response': 'I need your full name. Please say your first and last name clearly.',
                    'intent': 'name_unclear',
                    'advance': False,
                    'auto_listen': True
                }
        
        # Step 2: Seat selection
        elif current_step == 2:
            seat = self._extract_seat_preference(user_input)
            if seat:
                self.context['seat_preference'] = seat
                self.context['step'] = 3
                return {
                    'response': f"Great choice! {seat} seat selected. " + self.steps[3]['prompt'],
                    'intent': 'select_seat',
                    'entities': {'seat': seat},
                    'advance': True,
                    'auto_listen': True
                }
            else:
                return {
                    'response': 'Please tell me your seat preference: window, aisle, or middle seat.',
                    'intent': 'seat_unclear',
                    'advance': False,
                    'auto_listen': True
                }
        
        # Step 3: Payment confirmation
        elif current_step == 3:
            if self._match_intent(user_input, ['confirm', 'yes', 'proceed', 'pay', 'confirm payment', 'ok', 'okay']):
                self.context['payment_confirmed'] = True
                self.context['step'] = 4
                return {
                    'response': 'Processing your payment... ' + self.steps[4]['prompt'],
                    'intent': 'confirm_payment',
                    'advance': True,
                    'auto_listen': False,  # Done, no more listening
                    'booking_complete': True
                }
            else:
                return {
                    'response': 'To complete your booking, please say "confirm payment".',
                    'intent': 'payment_unclear',
                    'advance': False,
                    'auto_listen': True
                }
        
        # Step 4: Complete
        else:
            return {
                'response': 'Your booking is complete! Have a great flight!',
                'intent': 'complete',
                'advance': False,
                'auto_listen': False
            }
    
    def _match_intent(self, user_input, keywords):
        """Check if user input matches any keyword"""
        return any(keyword in user_input for keyword in keywords)
    
    def _extract_name(self, user_input):
        """Extract passenger name from input"""
        # Remove common filler words
        cleaned = re.sub(r'\b(my|name|is|i\'m|i am|this is|it\'s|its|called)\b', '', user_input, flags=re.IGNORECASE)
        cleaned = cleaned.strip()
        
        # Split into words and take 2-3 words as name
        words = [w for w in cleaned.split() if len(w) > 1]
        
        if len(words) >= 2:
            # Take first two words as first and last name
            return ' '.join(words[:2]).title()
        elif len(words) == 1:
            return words[0].title()
        
        return None
    
    def _extract_seat_preference(self, user_input):
        """Extract seat preference from input"""
        if any(word in user_input for word in ['window', 'windows']):
            return 'Window'
        elif any(word in user_input for word in ['aisle', 'isle', 'corridor']):
            return 'Aisle'
        elif any(word in user_input for word in ['middle', 'center', 'centre']):
            return 'Middle'
        
        # Check for specific seat numbers
        seat_match = re.search(r'\b(\d{1,2}[A-F])\b', user_input.upper())
        if seat_match:
            return seat_match.group(1)
        
        return None
    
    def get_current_step(self):
        """Get current conversation step"""
        return {
            'step': self.context['step'],
            'step_name': self.steps[self.context['step']]['name'],
            'passenger_name': self.context['passenger_name'],
            'seat_preference': self.context['seat_preference'],
            'payment_confirmed': self.context['payment_confirmed']
        }


@app.route('/api/nlp/process', methods=['POST'])
def process_voice_input():
    """Process voice input and return NLP response"""
    data = request.json
    user_input = data.get('input', '')
    session_id = data.get('session_id', 'default')
    
    # Get or create session
    if session_id not in sessions:
        sessions[session_id] = ConversationManager(session_id)
    
    conversation = sessions[session_id]
    result = conversation.process_input(user_input)
    result['context'] = conversation.get_current_step()
    
    return jsonify(result)


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
    app.run(host='0.0.0.0', port=5000, debug=True)
