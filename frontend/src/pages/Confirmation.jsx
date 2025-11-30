/**
 * Confirmation Page
 * Displays booking confirmation with voice readout and download option
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import speechService from '../utils/speechSynthesis';
import ApiService from '../utils/api';
import '../styles/Confirmation.css';

const Confirmation = () => {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBookingDetails = async () => {
      const bookingId = sessionStorage.getItem('confirmedBookingId');
      const txnId = sessionStorage.getItem('transactionId');

      if (!bookingId) {
        navigate('/');
        return;
      }

      setTransactionId(txnId);

      try {
        const response = await ApiService.getBooking(bookingId);
        
        if (response.success) {
          setBooking(response.booking);
          
          // Read booking details aloud with delay
          setTimeout(() => {
            const confirmationMessage = 
              `Congratulations! Your booking is confirmed. ` +
              `Booking ID: ${response.booking.bookingId}. ` +
              `Passenger name: ${response.booking.passengerName}. ` +
              `Flight: ${response.booking.flightNumber}. ` +
              `From ${response.booking.departure} to ${response.booking.destination}. ` +
              `Seat number: ${response.booking.seatNumber}. ` +
              `Date: ${response.booking.date}. ` +
              `Amount paid: ${response.booking.price} rupees. ` +
              `Transaction ID: ${txnId}. ` +
              `You can download your ticket or start a new booking.`;

            console.log('🔊 Speaking confirmation:', confirmationMessage.substring(0, 50) + '...');
            
            // Direct speech synthesis
            const utterance = new SpeechSynthesisUtterance(confirmationMessage);
            utterance.rate = 0.9;
            utterance.volume = 1.0;
            utterance.lang = 'en-US';
            
            utterance.onstart = () => console.log('✅ Confirmation speech started');
            utterance.onerror = (e) => console.error('❌ Speech error:', e);
            
            window.speechSynthesis.speak(utterance);
          }, 1000);
        } else {
          throw new Error('Failed to load booking details');
        }
      } catch (err) {
        setError(err.message);
        speechService.speak('Error loading booking details');
      } finally {
        setLoading(false);
      }
    };

    loadBookingDetails();
  }, [navigate]);

  const handleDownloadTicket = () => {
    speechService.speak('Downloading ticket');
    
    // Create mock ticket text content
    const ticketContent = `
========================================
      FLIGHT TICKET CONFIRMATION
========================================

Booking ID: ${booking.bookingId}
Transaction ID: ${transactionId}

PASSENGER DETAILS
-----------------
Name: ${booking.passengerName}
Seat: ${booking.seatNumber}

FLIGHT DETAILS
--------------
Flight Number: ${booking.flightNumber}
From: ${booking.departure}
To: ${booking.destination}
Date: ${booking.date}

SPECIAL ASSISTANCE
------------------
${booking.specialAssistance.join(', ')}

PAYMENT DETAILS
---------------
Amount: ₹${booking.price}
Status: CONFIRMED

========================================
Thank you for booking with us!
Voice Airline Booking System
========================================
    `;

    // Create and download text file
    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ticket_${booking.bookingId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    speechService.speak('Ticket downloaded successfully');
  };

  const handleNewBooking = () => {
    // Clear session storage
    sessionStorage.clear();
    speechService.speak('Starting new booking');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="page-container loading-container" role="main">
        <div className="spinner" aria-label="Loading booking details"></div>
        <p>Loading booking details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container error-container" role="main">
        <h1>Error</h1>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="page-container confirmation-container" role="main">
      <div className="progress-bar" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100">
        <div className="progress-fill" style={{ width: '100%' }}></div>
      </div>

      <header className="page-header">
        <div className="success-icon" aria-hidden="true">✅</div>
        <h1 tabIndex="0">Booking Confirmed!</h1>
        <p className="page-description" tabIndex="0">
          Your flight has been successfully booked
        </p>
      </header>

      {booking && (
        <section className="confirmation-details" aria-labelledby="booking-details-heading">
          <h2 id="booking-details-heading" className="sr-only">Booking Details</h2>

          <div className="confirmation-card">
            <div className="card-section" tabIndex="0">
              <h3>Booking Information</h3>
              <div className="detail-row">
                <span className="detail-label">Booking ID:</span>
                <strong className="detail-value">{booking.bookingId}</strong>
              </div>
              <div className="detail-row">
                <span className="detail-label">Transaction ID:</span>
                <strong className="detail-value">{transactionId}</strong>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <strong className="detail-value status-confirmed">CONFIRMED</strong>
              </div>
            </div>

            <div className="card-section" tabIndex="0">
              <h3>Passenger Details</h3>
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <strong className="detail-value">{booking.passengerName}</strong>
              </div>
              <div className="detail-row">
                <span className="detail-label">Seat Number:</span>
                <strong className="detail-value">{booking.seatNumber}</strong>
              </div>
            </div>

            <div className="card-section" tabIndex="0">
              <h3>Flight Details</h3>
              <div className="detail-row">
                <span className="detail-label">Flight:</span>
                <strong className="detail-value">{booking.flightNumber}</strong>
              </div>
              <div className="detail-row">
                <span className="detail-label">From:</span>
                <strong className="detail-value">{booking.departure}</strong>
              </div>
              <div className="detail-row">
                <span className="detail-label">To:</span>
                <strong className="detail-value">{booking.destination}</strong>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <strong className="detail-value">{booking.date}</strong>
              </div>
            </div>

            {booking.specialAssistance && !booking.specialAssistance.includes('none') && (
              <div className="card-section" tabIndex="0">
                <h3>Special Assistance</h3>
                <ul className="assistance-list">
                  {booking.specialAssistance.map((assistance, index) => (
                    <li key={index}>{assistance}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="card-section" tabIndex="0">
              <h3>Payment Details</h3>
              <div className="detail-row">
                <span className="detail-label">Amount Paid:</span>
                <strong className="detail-value amount">₹{booking.price}</strong>
              </div>
              <div className="detail-row">
                <span className="detail-label">Payment Status:</span>
                <strong className="detail-value status-success">SUCCESS</strong>
              </div>
            </div>
          </div>

          <div className="accessibility-acknowledgement" tabIndex="0">
            <h3>Accessibility Notice</h3>
            <p>
              🌟 Thank you for using our voice-enabled booking system! 
              We are committed to making air travel accessible for everyone.
            </p>
            <p>
              Our staff has been notified of your special requirements and will 
              provide appropriate assistance throughout your journey.
            </p>
          </div>

          <div className="action-buttons">
            <button
              className="btn btn-primary btn-large"
              onClick={handleDownloadTicket}
              aria-label="Download ticket as text file"
            >
              📥 Download Ticket
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleNewBooking}
              aria-label="Start a new booking"
            >
              🆕 New Booking
            </button>
          </div>

          <div className="important-notice" tabIndex="0">
            <h4>Important Information:</h4>
            <ul>
              <li>Please arrive at the airport at least 2 hours before departure</li>
              <li>Carry a valid photo ID for verification</li>
              <li>Check-in opens 3 hours before departure</li>
              <li>For any assistance, contact our helpline: 1800-XXX-XXXX</li>
            </ul>
          </div>
        </section>
      )}
    </div>
  );
};

export default Confirmation;
