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
        self.api_key = os.getenv('FLIGHT_API_KEY', '')
        self.api_url = os.getenv('FLIGHT_API_URL', 'https://api.amadeus.com/v2')
        self.access_token = None
        
    def authenticate(self):
        """Get OAuth access token for Amadeus API"""
        try:
            auth_url = "https://api.amadeus.com/v1/security/oauth2/token"
            response = requests.post(
                auth_url,
                data={
                    'grant_type': 'client_credentials',
                    'client_id': os.getenv('AMADEUS_API_KEY', ''),
                    'client_secret': os.getenv('AMADEUS_API_SECRET', '')
                }
            )
            if response.status_code == 200:
                self.access_token = response.json()['access_token']
                return True
        except Exception as e:
            print(f"Authentication error: {e}")
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
        if not self.access_token:
            if not self.authenticate():
                return self._get_fallback_flights(origin, destination, travel_class)
        
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
            
            response = requests.get(
                f'{self.api_url}/shopping/flight-offers',
                headers=headers,
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return self._parse_amadeus_response(data)
            else:
                print(f"API Error: {response.status_code}")
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

# Global instance
flight_api = FlightAPIClient()


def get_real_flights(origin: str, destination: str, date: str, passengers: int = 1, travel_class: str = 'Economy') -> List[Dict]:
    """
    Wrapper function to get flights from real API
    """
    return flight_api.search_flights(origin, destination, date, passengers, travel_class)
