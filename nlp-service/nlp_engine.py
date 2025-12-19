"""
Real NLP Engine using spaCy
Free, production-ready Natural Language Processing
"""
import spacy
import re
from datetime import datetime, timedelta

class NLPEngine:
    def __init__(self):
        """Initialize spaCy NLP model"""
        try:
            self.nlp = spacy.load("en_core_web_sm")
            print("✓ spaCy NLP engine loaded successfully")
        except OSError:
            print("⚠️  spaCy model not found. Run: python -m spacy download en_core_web_sm")
            self.nlp = None
    
    def extract_entities(self, text):
        """Extract named entities from text using spaCy"""
        if not self.nlp:
            return self._fallback_extract(text)
        
        doc = self.nlp(text.lower())
        entities = {
            'locations': [],
            'dates': [],
            'persons': [],
            'numbers': [],
            'times': []
        }
        
        # Extract named entities
        for ent in doc.ents:
            if ent.label_ in ['GPE', 'LOC']:  # Geopolitical entity or location
                entities['locations'].append(ent.text)
            elif ent.label_ == 'DATE':
                entities['dates'].append(ent.text)
            elif ent.label_ == 'PERSON':
                entities['persons'].append(ent.text)
            elif ent.label_ in ['CARDINAL', 'QUANTITY']:
                entities['numbers'].append(ent.text)
            elif ent.label_ == 'TIME':
                entities['times'].append(ent.text)
        
        # Extract additional patterns
        entities.update(self._extract_patterns(text))
        
        return entities
    
    def classify_intent(self, text):
        """Classify user intent from text"""
        text_lower = text.lower()
        print(f"🔍 classify_intent: text='{text}', text_lower='{text_lower}'", flush=True)
        
        # Booking intents
        booking_match = any(word in text_lower for word in ['book', 'booking', 'flight', 'ticket', 'reserve'])
        print(f"  booking_match={booking_match}", flush=True)
        if booking_match:
            if any(word in text_lower for word in ['cancel', 'stop', 'exit', 'no']):
                return 'cancel_booking'
            print(f"  → Returning 'start_booking'", flush=True)
            return 'start_booking'
        
        # Travel class preference - CHECK BEFORE NEGATION to avoid "economy/economic" being caught as "no"
        if any(word in text_lower for word in ['economy', 'economic', 'business', 'first class', 'class']):
            if 'business' in text_lower:
                return 'class_business'
            elif any(word in text_lower for word in ['economy', 'economic']):
                return 'class_economy'
            elif 'first' in text_lower:
                return 'class_first'
            return 'travel_class'
        
        # Time preferences - CHECK BEFORE NEGATION to avoid "afternoon/noon" being caught as "no"
        if any(word in text_lower for word in ['morning', 'afternoon', 'evening', 'night', 'noon']):
            return 'time_preference'
        
        # Confirmation intents
        if any(word in text_lower for word in ['yes', 'confirm', 'correct', 'okay', 'ok', 'sure', 'proceed']):
            return 'confirm'
        
        # Negation intents - use word boundaries to avoid false matches
        import re
        negation_words = ['cancel', 'wrong', 'incorrect', 'change', 'stop', 'exit', 'quit']
        # Check for standalone "no" with word boundaries (not part of another word)
        if any(word in text_lower for word in negation_words) or re.search(r'\bno\b', text_lower):
            return 'reject'
        
        # Seat preference
        if 'seat' in text_lower:
            if 'window' in text_lower:
                return 'seat_window'
            elif 'aisle' in text_lower:
                return 'seat_aisle'
            elif 'middle' in text_lower:
                return 'seat_middle'
            return 'seat_preference'
        
        # Payment methods
        if any(word in text_lower for word in ['card', 'credit', 'debit', 'upi', 'payment']):
            if 'upi' in text_lower:
                return 'payment_upi'
            elif any(word in text_lower for word in ['credit', 'debit', 'card']):
                return 'payment_card'
            return 'payment'
        
        # Special assistance
        if any(word in text_lower for word in ['wheelchair', 'assistance', 'special', 'help']):
            return 'special_assistance'
        
        # Meal preference
        if any(word in text_lower for word in ['meal', 'food', 'vegetarian', 'vegan', 'non-veg']):
            return 'meal_preference'
        
        # Greeting
        if any(word in text_lower for word in ['hello', 'hi', 'hey', 'good morning', 'good evening']):
            return 'greeting'
        
        return 'general_input'
    
    def extract_flight_details(self, text):
        """Extract flight booking details from natural language"""
        entities = self.extract_entities(text)
        details = {}
        
        # Extract origin and destination
        locations = entities.get('locations', [])
        if len(locations) >= 2:
            details['origin'] = locations[0]
            details['destination'] = locations[1]
        elif len(locations) == 1:
            # Check for "to" or "from" prepositions
            if ' to ' in text.lower():
                parts = text.lower().split(' to ')
                details['destination'] = locations[0]
            elif ' from ' in text.lower():
                parts = text.lower().split(' from ')
                details['origin'] = locations[0]
        
        # Extract date
        dates = entities.get('dates', [])
        if dates:
            details['date'] = self._parse_date(dates[0])
        
        # Extract passenger count
        numbers = entities.get('numbers', [])
        if numbers:
            try:
                count = int(numbers[0])
                if 1 <= count <= 9:
                    details['passengers'] = count
            except ValueError:
                pass
        
        # Extract class preference
        text_lower = text.lower()
        if 'business' in text_lower or 'business class' in text_lower:
            details['class'] = 'Business'
        elif 'economy' in text_lower or 'economy class' in text_lower:
            details['class'] = 'Economy'
        elif 'first class' in text_lower or 'first' in text_lower:
            details['class'] = 'First'
        
        return details
    
    def extract_passenger_info(self, text):
        """Extract passenger name and contact from text"""
        entities = self.extract_entities(text)
        info = {}
        
        # Extract name
        persons = entities.get('persons', [])
        if persons:
            info['name'] = ' '.join(persons).title()
        else:
            # Fallback: extract capitalized words (likely names)
            name_match = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b', text)
            if name_match:
                info['name'] = name_match.group(1)
        
        # Extract phone number
        phone = entities.get('phone')
        if phone:
            info['phone'] = phone
        
        # Extract email
        email = entities.get('email')
        if email:
            info['email'] = email
        
        return info
    
    def _extract_patterns(self, text):
        """Extract additional patterns using regex"""
        patterns = {}
        
        # Phone number patterns (Indian)
        phone_match = re.search(r'(\+91[\s-]?)?[6-9]\d{9}', text)
        if phone_match:
            patterns['phone'] = phone_match.group(0).replace(' ', '').replace('-', '')
        
        # Email pattern
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        if email_match:
            patterns['email'] = email_match.group(0)
        
        # Date patterns (tomorrow, today, next week, etc.)
        date_keywords = {
            'today': 0,
            'tomorrow': 1,
            'day after tomorrow': 2,
            'next week': 7,
            'next month': 30
        }
        
        text_lower = text.lower()
        for keyword, days in date_keywords.items():
            if keyword in text_lower:
                date = datetime.now() + timedelta(days=days)
                patterns['parsed_date'] = date.strftime('%Y-%m-%d')
                break
        
        # Extract specific date formats
        date_match = re.search(r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b', text)
        if date_match:
            try:
                day, month, year = date_match.groups()
                if len(year) == 2:
                    year = '20' + year
                patterns['parsed_date'] = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
            except:
                pass
        
        return patterns
    
    def _parse_date(self, date_text):
        """Parse date text to standard format"""
        date_text_lower = date_text.lower()
        
        # Relative dates
        if date_text_lower in ['today', 'tonight']:
            return datetime.now().strftime('%Y-%m-%d')
        elif date_text_lower == 'tomorrow':
            return (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        elif 'next week' in date_text_lower:
            return (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
        
        # Try to parse specific dates
        try:
            # Try various date formats
            for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%m/%d/%Y']:
                try:
                    parsed = datetime.strptime(date_text, fmt)
                    return parsed.strftime('%Y-%m-%d')
                except:
                    continue
        except:
            pass
        
        # Default to tomorrow
        return (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    
    def _fallback_extract(self, text):
        """Fallback extraction when spaCy is not available"""
        return self._extract_patterns(text)

# Singleton instance
nlp_engine = NLPEngine()
