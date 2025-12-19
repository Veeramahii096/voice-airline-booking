"""
Real Flight API Integration
Connects to external flight data APIs (Amadeus, Skyscanner, etc.)
"""
import os
import requests
from typing import List, Dict, Optional
from datetime import datetime

class FlightAPIClient:
    def __init__(self):
        # HARDCODED credentials for production
        self.api_key = os.getenv('AMADEUS_API_KEY', 'xoNfz9fYJQIyYYckyY3oGp9Tlu0zTPWS')
        self.api_secret = os.getenv('AMADEUS_API_SECRET', 'I8l5uhG8lKFYson0')
        self.api_url = os.getenv('FLIGHT_API_URL', 'https://test.api.amadeus.com/v2')
        self.access_token = None
        
    def authenticate(self):
        """Get OAuth access token for Amadeus API"""
        try:
            auth_url = "https://test.api.amadeus.com/v1/security/oauth2/token"
            print(f"🔐 Authenticating with Amadeus (key={self.api_key[:8]}...)", flush=True)
            response = requests.post(
                auth_url,
                data={
                    'grant_type': 'client_credentials',
                    'client_id': self.api_key,
                    'client_secret': self.api_secret
                },
                timeout=10
            )
            print(f"🔑 Auth response: {response.status_code}", flush=True)
            if response.status_code == 200:
                self.access_token = response.json()['access_token']
                print(f"✓ Got access token", flush=True)
                return True
            else:
                print(f"❌ Auth failed: {response.text[:300]}", flush=True)
        except Exception as e:
            print(f"❌ Authentication error: {e}", flush=True)
        return False
    
    def search_flights(
        self,
        origin: str,
        destination: str,
        date: str,
        passengers: int = 1,
        travel_class: str = 'ECONOMY'
    ) -> List[Dict]:
        """
        Search for real flights using Amadeus Flight Offers Search API
        
        Args:
            origin: IATA airport code (e.g., 'DEL' for Delhi)
            destination: IATA airport code (e.g., 'BOM' for Mumbai)
            date: Travel date in YYYY-MM-DD format
            passengers: Number of passengers
            travel_class: ECONOMY, BUSINESS, FIRST
            
        Returns:
            List of flight offers
        """
        print(f"📞 Calling search_flights: {origin}→{destination}, token={'✓' if self.access_token else '✗'}", flush=True)
        
        if not self.access_token:
            print(f"🔑 No token, authenticating...", flush=True)
            if not self.authenticate():
                print(f"❌ Authentication failed", flush=True)
                return self._get_fallback_flights(origin, destination, travel_class)
            print(f"✓ Authentication successful", flush=True)
        
        try:
            headers = {'Authorization': f'Bearer {self.access_token}'}
            params = {
                'originLocationCode': origin,
                'destinationLocationCode': destination,
                'departureDate': date,
                'adults': passengers,
                'travelClass': travel_class,
                'currencyCode': 'INR',
                'max': 10
            }
            
            print(f"🌐 Making API request to Amadeus...", flush=True)
            response = requests.get(
                f'{self.api_url}/shopping/flight-offers',
                headers=headers,
                params=params,
                timeout=10
            )
            print(f"📡 Response status: {response.status_code}", flush=True)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✈️ Amadeus Response: {len(data.get('data', []))} flights found", flush=True)
                if not data.get('data'):
                    print(f"⚠️ Amadeus returned 0 flights for {origin}→{destination} on {date}", flush=True)
                return self._parse_amadeus_response(data)
            else:
                print(f"❌ Amadeus API Error: {response.status_code} - {response.text[:200]}", flush=True)
                return self._get_fallback_flights(origin, destination, travel_class)
                
        except Exception as e:
            print(f"Flight search error: {e}")
            return self._get_fallback_flights(origin, destination, travel_class)
    
    def _parse_amadeus_response(self, data: Dict) -> List[Dict]:
        """Convert Amadeus API response to our format"""
        flights = []
        
        for offer in data.get('data', []):
            try:
                itinerary = offer['itineraries'][0]
                segment = itinerary['segments'][0]
                price = offer['price']
                
                flight = {
                    'flight': segment['carrierCode'] + segment['number'],
                    'carrier': segment['carrierCode'],
                    'time': segment['departure']['at'].split('T')[1][:5],
                    'duration': itinerary['duration'].replace('PT', ''),
                    'price': float(price['total']),
                    'class': offer['travelerPricings'][0]['fareDetailsBySegment'][0]['cabin'],
                    'aircraft': segment.get('aircraft', {}).get('code', 'N/A'),
                    'stops': len(itinerary['segments']) - 1,
                    'seats_available': int(segment.get('numberOfBookableSeats', 9))
                }
                flights.append(flight)
            except Exception as e:
                print(f"Parse error: {e}")
                continue
        
        return flights
    
    def get_seat_map(
        self,
        flight_offer_id: str = None,
        flight_number: str = None,
        carrier_code: str = None,
        departure_date: str = None,
        origin: str = None,
        destination: str = None
    ) -> Dict:
        """
        Get real seat map using Amadeus SeatMap API
        
        Args:
            flight_offer_id: Flight offer ID from flight search (preferred)
            flight_number: Flight number (e.g., '2822')
            carrier_code: Airline code (e.g., 'AI')
            departure_date: Date in YYYY-MM-DD format
            origin: Origin IATA code
            destination: Destination IATA code
            
        Returns:
            Dict with seat map data including available seats by preference
        """
        print(f"🪑 Getting seat map for {carrier_code}{flight_number}...", flush=True)
        
        if not self.access_token:
            print(f"🔑 No token, authenticating...", flush=True)
            if not self.authenticate():
                print(f"❌ Authentication failed, using fallback seats", flush=True)
                return self._get_fallback_seatmap()
        
        try:
            headers = {'Authorization': f'Bearer {self.access_token}'}
            
            # Amadeus Seat Map API endpoint
            url = 'https://test.api.amadeus.com/v1/shopping/seatmaps'
            
            # Build request body for flight-orderId method
            params = {
                'flight-orderId': flight_offer_id
            } if flight_offer_id else {
                'flightNumber': flight_number,
                'carrierCode': carrier_code,
                'departureDate': departure_date,
                'origin': origin,
                'destination': destination
            }
            
            print(f"🌐 Requesting seat map from Amadeus...", flush=True)
            response = requests.get(
                url,
                headers=headers,
                params=params,
                timeout=10
            )
            print(f"📡 Seat map response: {response.status_code}", flush=True)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Seat map received", flush=True)
                return self._parse_seatmap_response(data)
            else:
                print(f"⚠️ Seat map API returned {response.status_code}: {response.text[:200]}", flush=True)
                return self._get_fallback_seatmap()
                
        except Exception as e:
            print(f"❌ Seat map error: {e}", flush=True)
            return self._get_fallback_seatmap()
    
    def _parse_seatmap_response(self, data: Dict) -> Dict:
        """Parse Amadeus seat map response and categorize seats"""
        available_seats = {
            'Window': [],
            'Aisle': [],
            'Middle': []
        }
        
        try:
            for seatmap in data.get('data', []):
                for deck in seatmap.get('decks', []):
                    for seat in deck.get('seats', []):
                        if seat.get('travelerPricing', [{}])[0].get('seatAvailabilityStatus') == 'AVAILABLE':
                            seat_number = seat.get('number', '')
                            coords = seat.get('coordinates', {})
                            
                            # Categorize by seat characteristics
                            if seat.get('characteristicsCodes'):
                                codes = seat['characteristicsCodes']
                                if 'W' in codes or '1' in codes:  # Window seats
                                    available_seats['Window'].append(seat_number)
                                elif 'A' in codes or any(c in codes for c in ['9', 'IA']):  # Aisle seats
                                    available_seats['Aisle'].append(seat_number)
                                else:
                                    available_seats['Middle'].append(seat_number)
                            else:
                                # Fallback: use seat letter (A/F=Window, C/D=Aisle, B/E=Middle)
                                if seat_number:
                                    letter = seat_number[-1]
                                    if letter in ['A', 'F', 'K']:
                                        available_seats['Window'].append(seat_number)
                                    elif letter in ['C', 'D', 'G', 'H']:
                                        available_seats['Aisle'].append(seat_number)
                                    else:
                                        available_seats['Middle'].append(seat_number)
        except Exception as e:
            print(f"⚠️ Seat map parsing error: {e}", flush=True)
        
        # Log available seats
        print(f"🪑 Available seats - Window: {len(available_seats['Window'])}, Aisle: {len(available_seats['Aisle'])}, Middle: {len(available_seats['Middle'])}", flush=True)
        
        return available_seats
    
    def _get_fallback_seatmap(self) -> Dict:
        """Return sample seat map when API is unavailable"""
        return {
            'Window': ['12A', '12F', '13A', '13F', '14A', '14F'],
            'Aisle': ['12C', '12D', '13C', '13D', '14C', '14D'],
            'Middle': ['12B', '12E', '13B', '13E', '14B', '14E']
        }
    
    def _get_fallback_flights(self, origin: str, destination: str, travel_class: str) -> List[Dict]:
        """Return sample flights when API is unavailable"""
        # Basic fallback with common routes
        sample_flights = {
            'DEL-BOM': [
                {'flight': 'AI101', 'carrier': 'AirIndia', 'time': '06:00', 'duration': '2h 15m', 'price': 4500, 'class': 'Economy', 'aircraft': 'Boeing 737', 'stops': 0, 'seats_available': 25},
                {'flight': 'AI105', 'carrier': 'AirIndia', 'time': '12:45', 'duration': '2h 15m', 'price': 8500, 'class': 'Business', 'aircraft': 'Boeing 787', 'stops': 0, 'seats_available': 8},
            ],
            'BOM-SIN': [
                {'flight': 'SQ001', 'carrier': 'SingaporeAir', 'time': '02:30', 'duration': '5h 30m', 'price': 28500, 'class': 'Economy', 'aircraft': 'Boeing 787-10', 'stops': 0, 'seats_available': 60},
                {'flight': 'SQ003', 'carrier': 'SingaporeAir', 'time': '09:30', 'duration': '5h 30m', 'price': 65000, 'class': 'Business', 'aircraft': 'Airbus A350', 'stops': 0, 'seats_available': 12},
            ]
        }
        
        route_key = f"{origin}-{destination}"
        flights = sample_flights.get(route_key, [])
        
        # Filter by class
        return [f for f in flights if f['class'].lower() == travel_class.lower()]

# Add get_airport_code method to FlightAPIClient class
FlightAPIClient.get_airport_code = lambda self, city_name: {
    'mumbai': 'BOM', 'delhi': 'DEL', 'bangalore': 'BLR', 'bengaluru': 'BLR',
    'chennai': 'MAA', 'kolkata': 'CCU', 'hyderabad': 'HYD', 'ahmedabad': 'AMD',
    'pune': 'PNQ', 'kochi': 'COK', 'cochin': 'COK', 'goa': 'GOI', 'jaipur': 'JAI',
    'lucknow': 'LKO', 'chandigarh': 'IXC', 'thiruvananthapuram': 'TRV',
    'trivandrum': 'TRV', 'coimbatore': 'CJB', 'dubai': 'DXB', 'singapore': 'SIN',
    'london': 'LHR', 'new york': 'JFK', 'los angeles': 'LAX', 'paris': 'CDG', 'tokyo': 'NRT'
}.get(city_name.lower().strip())

# Global instance
flight_api = FlightAPIClient()


def get_real_flights(origin: str, destination: str, date: str, passengers: int = 1, travel_class: str = 'Economy') -> List[Dict]:
    """
    Wrapper function to get flights from real API
    """
    return flight_api.search_flights(origin, destination, date, passengers, travel_class)
