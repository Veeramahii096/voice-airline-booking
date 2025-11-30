/**
 * Payment Page
 * Handles payment method selection, order creation, and OTP verification
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceInput from '../components/VoiceInput';
import speechService from '../utils/speechSynthesis';
import ApiService from '../utils/api';
import '../styles/Payment.css';
import '../styles/AudioButton.css';

const Payment = () => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [orderId, setOrderId] = useState('');
  const [otp, setOtp] = useState('');
  const [mockOtp, setMockOtp] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingData, setBookingData] = useState(null);
  const [audioReady, setAudioReady] = useState(false);

  const amount = 5999;

  useEffect(() => {
    const passengerName = sessionStorage.getItem('passengerName');
    const selectedSeat = sessionStorage.getItem('selectedSeat');
    const specialAssistance = sessionStorage.getItem('specialAssistance');
    
    if (!passengerName || !selectedSeat) {
      navigate('/passenger-info');
      return;
    }

    setBookingData({
      passengerName,
      selectedSeat,
      specialAssistance: JSON.parse(specialAssistance || '["none"]'),
    });

    if (audioReady) {
      const message = `Your booking amount is ${amount} rupees. Please select a payment method and confirm payment.`;
      console.log('🔊 Speaking:', message);
      
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.9;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';
      
      utterance.onstart = () => console.log('✅ Speech started');
      utterance.onerror = (e) => console.error('❌ Speech error:', e);
      
      window.speechSynthesis.speak(utterance);
    }
  }, [navigate, audioReady]);

  const handlePaymentMethodChange = (e) => {
    const method = e.target.value;
    setPaymentMethod(method);
    
    const methodNames = {
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      upi: 'UPI',
      net_banking: 'Net Banking',
    };
    
    speechService.speak(`${methodNames[method]} selected`);
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    setError('');

    try {
      // Step 1: Create booking
      speechService.speak('Creating your booking. Please wait.');
      
      const bookingResponse = await ApiService.createBooking({
        passengerName: bookingData.passengerName,
        seatNumber: bookingData.selectedSeat,
        specialAssistance: bookingData.specialAssistance,
        flightNumber: 'AI101',
        departure: 'New Delhi (DEL)',
        destination: 'Mumbai (BOM)',
        date: new Date().toISOString().split('T')[0],
        price: amount,
      });

      if (!bookingResponse.success) {
        throw new Error('Failed to create booking');
      }

      const newBookingId = bookingResponse.booking.bookingId;
      setBookingId(newBookingId);

      // Step 2: Create payment order
      speechService.speak('Booking created. Generating OTP for payment verification.');
      
      const orderResponse = await ApiService.createOrder({
        bookingId: newBookingId,
        amount: amount,
        paymentMethod: paymentMethod,
      });

      if (!orderResponse.success) {
        throw new Error('Failed to create payment order');
      }

      setOrderId(orderResponse.orderId);
      setMockOtp(orderResponse.mockOTP);
      setShowOtpInput(true);

      speechService.speak(
        `OTP has been sent. For testing purposes, the OTP is ${orderResponse.mockOTP}. ` +
        'Please enter the OTP to complete payment. You can type or use voice input.'
      );

    } catch (err) {
      const errorMsg = err.message || 'Payment initiation failed';
      setError(errorMsg);
      speechService.speak(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
    setError('');
  };

  const handleVoiceOtp = (transcript) => {
    // Extract numbers from voice input
    const numbers = transcript.replace(/\D/g, '');
    setOtp(numbers);
    speechService.speak(`OTP entered: ${numbers.split('').join(' ')}`);
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      const errorMsg = 'Please enter a valid 6-digit OTP';
      setError(errorMsg);
      speechService.speak(errorMsg);
      return;
    }

    setLoading(true);
    setError('');

    try {
      speechService.speak('Verifying OTP. Please wait.');

      const verifyResponse = await ApiService.verifyOTP({
        orderId: orderId,
        otp: otp,
      });

      if (!verifyResponse.success) {
        throw new Error(verifyResponse.error || 'OTP verification failed');
      }

      // Store booking ID for confirmation page
      sessionStorage.setItem('confirmedBookingId', bookingId);
      sessionStorage.setItem('transactionId', verifyResponse.transactionId);

      speechService.speak('Payment successful! Your booking is confirmed. Redirecting to confirmation page.');

      setTimeout(() => {
        navigate('/confirmation');
      }, 1000);

    } catch (err) {
      const errorMsg = err.message || 'OTP verification failed';
      setError(errorMsg);
      speechService.speak(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    speechService.speak('Going back to special assistance');
    navigate('/special-assistance');
  };

  return (
    <div className="page-container" role="main">
      <div className="progress-bar" role="progressbar" aria-valuenow="90" aria-valuemin="0" aria-valuemax="100">
        <div className="progress-fill" style={{ width: '90%' }}></div>
      </div>

      <header className="page-header">
        <h1 tabIndex="0">Payment</h1>
        <p className="page-description" tabIndex="0">
          Step 4 of 4: Complete your payment
        </p>
        
        {!audioReady && (
          <button 
            className="btn-enable-audio"
            onClick={() => setAudioReady(true)}
          >
            🔊 Enable Voice Assistant
          </button>
        )}
      </header>

      <section className="form-section" aria-labelledby="payment-form-heading">
        <h2 id="payment-form-heading" className="sr-only">Payment Form</h2>

        {bookingData && (
          <div className="booking-summary" tabIndex="0">
            <h3>Booking Summary</h3>
            <div className="summary-item">
              <span>Passenger:</span>
              <strong>{bookingData.passengerName}</strong>
            </div>
            <div className="summary-item">
              <span>Seat:</span>
              <strong>{bookingData.selectedSeat}</strong>
            </div>
            <div className="summary-item">
              <span>Flight:</span>
              <strong>AI101 (DEL → BOM)</strong>
            </div>
            <div className="summary-item amount-item">
              <span>Amount:</span>
              <strong>₹{amount}</strong>
            </div>
          </div>
        )}

        {!showOtpInput ? (
          <>
            <div className="form-group">
              <label htmlFor="payment-method" className="form-label">
                Payment Method *
              </label>
              <select
                id="payment-method"
                className="form-select"
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
                disabled={loading}
                aria-required="true"
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="upi">UPI</option>
                <option value="net_banking">Net Banking</option>
              </select>
            </div>

            <div className="payment-info" tabIndex="0">
              <p>
                🔒 This is a secure mock payment. No real transaction will be processed.
              </p>
              <p>
                You will receive an OTP for verification after confirming payment.
              </p>
            </div>

            <button
              className="btn btn-primary btn-large"
              onClick={handleConfirmPayment}
              disabled={loading}
              aria-label="Confirm payment and generate OTP"
            >
              {loading ? 'Processing...' : `Confirm Payment ₹${amount}`}
            </button>
          </>
        ) : (
          <>
            <div className="otp-section">
              <div className="otp-info" tabIndex="0">
                <p>✅ Payment order created successfully!</p>
                <p>📱 OTP has been sent for verification.</p>
                <p className="mock-otp-display">
                  <strong>Mock OTP (for testing):</strong> {mockOtp}
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="otp-input" className="form-label">
                  Enter OTP *
                </label>
                <input
                  id="otp-input"
                  type="text"
                  className="form-input otp-input"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="123456"
                  maxLength="6"
                  disabled={loading}
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? 'otp-error' : 'otp-help'}
                  autoFocus
                />
                <span id="otp-help" className="form-help">
                  Enter the 6-digit OTP
                </span>
                {error && (
                  <span id="otp-error" className="form-error" role="alert">
                    {error}
                  </span>
                )}
              </div>

              <div className="voice-input-section">
                <p className="section-title" tabIndex="0">Or use voice to enter OTP:</p>
                <VoiceInput
                  onTranscript={handleVoiceOtp}
                  ariaLabel="Enter OTP using voice"
                />
              </div>

              <button
                className="btn btn-success btn-large"
                onClick={handleVerifyOtp}
                disabled={loading || !otp}
                aria-label="Verify OTP and complete payment"
              >
                {loading ? 'Verifying...' : 'Verify OTP & Complete Payment'}
              </button>
            </div>
          </>
        )}

        {error && !showOtpInput && (
          <div className="error-message" role="alert" tabIndex="0">
            {error}
          </div>
        )}
      </section>

      {!showOtpInput && (
        <nav className="navigation-buttons" aria-label="Page navigation">
          <button
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={loading}
            aria-label="Go back to special assistance"
          >
            ← Back
          </button>
        </nav>
      )}
    </div>
  );
};

export default Payment;
