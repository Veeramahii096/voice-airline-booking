/**
 * API Service
 * Handles all backend API calls
 */

// Use environment variable or default to backend service in Docker
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

class ApiService {
  // Create booking
  static async createBooking(bookingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      return data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  // Get booking by ID
  static async getBooking(bookingId) {
    try {
      const response = await fetch(`${API_BASE_URL}/booking/${bookingId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch booking');
      }

      return data;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  }

  // Create payment order
  static async createOrder(orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Verify OTP
  static async verifyOTP(otpData) {
    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(otpData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      return data;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }
}

export default ApiService;
