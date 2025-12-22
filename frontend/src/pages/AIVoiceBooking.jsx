/**
 * AI Voice Booking - Powered by Python NLP Service
 * Features: Voice recognition, smart auto-fill, single command booking
 * Complete 15-step Singapore Airlines style flow
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import speechService from '../utils/speechSynthesis';
import { processVoiceInput, resetConversation, identifyUser, getConversationStatus } from '../utils/pythonNlpService';
import '../styles/VoiceBooking.css';

const AIVoiceBooking = () => {
  const navigate = useNavigate();
  
  // Conversation state from Python NLP
  const [currentStep, setCurrentStep] = useState(1);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [bookingData, setBookingData] = useState({});
  const [flightsOptions, setFlightsOptions] = useState([]);
  const [selectionConfirmation, setSelectionConfirmation] = useState('');
  const selectionTimeoutRef = useRef(null);
  const [selectedFlightId, setSelectedFlightId] = useState(null);
  const [reviewDetails, setReviewDetails] = useState(null);
  const [confirmationDetails, setConfirmationDetails] = useState(null);
  
  // Voice control state
  const [listeningEnabled, setListeningEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showStartButton, setShowStartButton] = useState(false); // Auto-start, no button
  const [isIdentified, setIsIdentified] = useState(false);
  const shouldContinueListening = useRef(true);
  
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    enablePersistentListening,
    disablePersistentListening,
  } = useSpeechRecognition();

  // Step labels for UI
  const stepLabels = {
    1: 'Welcome',
    2: 'Origin City',
    3: 'Destination City',
    4: 'Travel Date',
    5: 'Number of Passengers',
    6: 'Travel Class',
    7: 'Flight Time',
    8: 'Passenger Name',
    9: 'Email Address',
    10: 'Phone Number',
    11: 'Seat Selection',
    12: 'Meal Preference',
    13: 'Special Assistance',
    14: 'Review Booking',
    15: 'Payment',
    16: 'Confirmation'
  };

  // Initialize - Auto-start booking on mount (fully automatic, no buttons)
  useEffect(() => {
    const autoStart = async () => {
      await resetConversation();
      // Auto-start immediately
      setTimeout(() => {
        handleStartBooking();
      }, 800);
    };
    autoStart();
  }, []);

  // Start voice booking
  const handleStartBooking = async () => {
    console.log('🎬 Starting AI Voice Booking...');
    setShowStartButton(false);
    setAudioEnabled(true);
    setListeningEnabled(true);
    shouldContinueListening.current = true;
    // Enable persistent listening so recognition keeps running until user explicitly ends
    try { enablePersistentListening(); } catch (e) { /* ignore if not present */ }

    // Get initial greeting from NLP
    try {
      const response = await processVoiceInput('hello');
      const message = response.response || response.message || 'Welcome! Let\'s start booking.';
      
      setCurrentPrompt(message);
      setCurrentStep(response.current_step || 1);
      setBookingData(response.collected_data || {});
      
      // Add to history
      setConversationHistory(prev => [...prev, {
        speaker: 'bot',
        message: message,
        step: response.current_step
      }]);

      // Speak and listen
      await speakAndListen(message);
    } catch (error) {
      console.error('❌ Error starting booking:', error);
      setCurrentPrompt('Sorry, there was an error. Please refresh and try again.');
    }
  };

  // Speak message and start listening
  const speakAndListen = async (message) => {
    console.log('🔊 Speaking:', message);
    
    await speechService.speak(message);
    
    // ALWAYS restart listening for continuous conversation
    console.log('🎤 Auto-restarting listener for continuous conversation...');
    // Force stop first to ensure clean restart
    stopListening();
    // Wait longer for stop to complete, then start listening using the hook function
    setTimeout(() => {
      console.log('🎤 Restarting recognition after speech...');
      startListening();
    }, 1500);
  };

  // Process voice input when transcript changes
  useEffect(() => {
    if (transcript && !isProcessing) {
      handleVoiceInput(transcript);
      resetTranscript();
    }
  }, [transcript]);

  // Handle voice input
  const handleVoiceInput = async (input) => {
    if (!input.trim() || isProcessing) return;

    console.log('🎤 User said:', input);
    setIsProcessing(true);
    stopListening();

    // Add user message to history
    setConversationHistory(prev => [...prev, {
      speaker: 'user',
      message: input,
      step: currentStep
    }]);

    try {
      // Check for voice identification keywords
      if (input.toLowerCase().includes('phone') && /\d{10}/.test(input)) {
        console.log('📱 Detecting voice identification attempt...');
        const phoneMatch = input.match(/\d{10}/);
        if (phoneMatch) {
          const identifyResult = await identifyUser(phoneMatch[0]);
          if (identifyResult.identified) {
            console.log('✅ User identified:', identifyResult.user_id);
            setIsIdentified(true);
            
            // Show identification success
            const welcomeMsg = `Welcome back, ${identifyResult.profile.name}! I've auto-filled your passenger details. Let's continue with your booking.`;
            await speakAndListen(welcomeMsg);
            setConversationHistory(prev => [...prev, {
              speaker: 'bot',
              message: welcomeMsg,
              step: currentStep
            }]);
          }
        }
      }

      // Send to NLP service
      const response = await processVoiceInput(input);
      
      console.log('🤖 NLP Response:', response);

      // Extract message (NLP service uses 'response', not 'message')
      const message = response.response || response.message || 'Please continue.';

      // Update state
      // NLP may return nested context: response.context.context or response.context
      const nlpCtx = response.context && (response.context.context || response.context) || {};
      setCurrentStep(nlpCtx.step || response.current_step || currentStep);
      // Merge collected data if provided
      setBookingData(prev => ({ ...prev, ...(response.collected_data || nlpCtx || {}) }));
      // If NLP returned structured flights, surface them
      if (response.flights && Array.isArray(response.flights)) {
        setFlightsOptions(response.flights);
      } else {
        setFlightsOptions([]);
      }
      setCurrentPrompt(message);

      // Add bot response to history
      setConversationHistory(prev => [...prev, {
        speaker: 'bot',
        message: message,
        step: response.current_step
      }]);

      // If NLP reached the review step (step 13), surface a visual booking review UI
      const stepNum = nlpCtx.step || response.current_step;
      if (stepNum === 13 || response.intent === 'review' || (nlpCtx.step_name && nlpCtx.step_name.toLowerCase().includes('review'))) {
        const sel = nlpCtx.selected_flight || response.selected_flight || bookingData.selected_flight || null;
        const passengers = nlpCtx.passengers || bookingData.passengers;
        const total = sel && sel.price && passengers ? (sel.price * passengers) : (response.total_amount || null);
        setReviewDetails({
          selectedFlight: sel,
          passengerName: nlpCtx.passenger_name || bookingData.passenger_name || bookingData.name || '',
          email: nlpCtx.email || bookingData.email || '',
          phone: nlpCtx.phone || bookingData.phone || '',
          seat: nlpCtx.seat_number || bookingData.seat || bookingData.seat_number || '',
          meal: nlpCtx.meal_preference || bookingData.meal || '',
          travelDate: nlpCtx.travel_date || bookingData.date || nlpCtx.travel_date,
          passengers,
          classPref: nlpCtx.class_preference || bookingData.class || '',
          totalAmount: total,
          rawReviewText: message
        });
        // speak the review text and restart listening so user can say 'confirm' or 'change'
        await speechService.speak(message);
        // keep listening enabled so user can say 'confirm' or 'change'
        try { enablePersistentListening(); } catch (e) {}
        // Explicitly restart listening after review
        stopListening();
        setTimeout(() => {
          console.log('🎤 Restarting listener after review...');
          startListening();
        }, 1500);
        setIsProcessing(false);
        return;
      }

      // Check if booking is cancelled - ONLY stop on explicit cancel/end/finish
      if (response.booking_cancelled) {
        console.log('❌ Booking cancelled by voice');
        shouldContinueListening.current = false;
        // Stop listening and disable persistent mode
        try { disablePersistentListening(); } catch (e) {}
        stopListening();
        await speechService.speak(message);
        
        // Navigate back to home after delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
        return;
      }

      // Check if booking is complete
      if (response.booking_complete) {
        console.log('✅ Booking completed!');
        shouldContinueListening.current = false;
        // Disable persistent listening when flow finishes
        try { disablePersistentListening(); } catch (e) {}
        
        // Clear review details and show comprehensive confirmation
        setReviewDetails(null);
        const collectedData = response.collected_data || nlpCtx || bookingData;
        const sel = collectedData.selected_flight || bookingData.selected_flight || null;
        const passengers = collectedData.passengers || bookingData.passengers;
        const total = sel && sel.price && passengers ? (sel.price * passengers) : null;
        
        setConfirmationDetails({
          selectedFlight: sel,
          passengerName: collectedData.passenger_name || collectedData.name || bookingData.name || '',
          email: collectedData.email || bookingData.email || '',
          phone: collectedData.phone || bookingData.phone || '',
          seat: collectedData.seat_number || collectedData.seat || bookingData.seat || '',
          meal: collectedData.meal_preference || collectedData.meal || bookingData.meal || '',
          assistance: collectedData.special_assistance || collectedData.assistance || bookingData.assistance || '',
          travelDate: collectedData.travel_date || bookingData.date || '',
          passengers,
          classPref: collectedData.class_preference || collectedData.class || bookingData.class || '',
          totalAmount: total,
          bookingId: response.booking_id || 'AI' + Date.now()
        });
        
        const confirmMsg = "🎉 Booking Confirmed! Your flight has been successfully booked. Here are your booking details.";
        setCurrentPrompt(confirmMsg);
        await speechService.speak(confirmMsg);
        
        // Navigate to confirmation after showing details for 5 seconds
        setTimeout(() => {
          navigate('/confirmation', { 
            state: { 
              bookingData: collectedData,
              bookingId: response.booking_id || 'AI' + Date.now()
            } 
          });
        }, 5000);
      } else {
        // Continue conversation - bot keeps asking until correct input or user says end/cancel
        await speakAndListen(message);
      }

    } catch (error) {
      console.error('❌ Error processing voice input:', error);
      const errorMsg = 'Sorry, I had trouble understanding. Could you please repeat that?';
      setCurrentPrompt(errorMsg);
      await speakAndListen(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };



  // Handle direct UI flight selection (click)
  const handleSelectFlight = async (flight) => {
    if (!flight) return;
    // Local confirmation immediately so the user hears/reads exact selected flight
    const confirmationText = `You selected ${flight.carrier} ${flight.flight} departing at ${flight.time}. I will confirm this selection.`;
    setSelectionConfirmation(confirmationText);
    setSelectedFlightId(flight.flight);
    // Clear any previous timeout
    if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);

    try {
      // Speak the confirmation immediately
      await speechService.speak(confirmationText);
    } catch (e) {
      console.warn('Speech confirmation failed', e);
    }

    // Then send selection to NLP as user's input (flight number)
    const selectionInput = `flight ${flight.flight}`;
    setConversationHistory(prev => [...prev, { speaker: 'user', message: `Selected ${flight.flight}`, step: currentStep }]);
    setBookingData(prev => ({ ...prev, selected_flight: flight }));
    try {
      const response = await processVoiceInput(selectionInput);
      const message = response.response || response.message || '';
      setConversationHistory(prev => [...prev, { speaker: 'bot', message, step: response.current_step }]);
      setCurrentStep(response.current_step || currentStep);
      setBookingData(response.collected_data || bookingData);
      setFlightsOptions([]);

      // Clear selection UI state now that NLP has acknowledged
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
        selectionTimeoutRef.current = null;
      }
      setSelectionConfirmation('');
      setSelectedFlightId(null);

      await speakAndListen(message);
    } catch (e) {
      console.error('Flight selection error', e);
      // fallback: clear highlight after a short delay
      selectionTimeoutRef.current = setTimeout(() => {
        setSelectionConfirmation('');
        setSelectedFlightId(null);
      }, 8000);
    }
  };

  // Toggle voice listening
  const toggleVoice = () => {
    if (listeningEnabled) {
      shouldContinueListening.current = false;
      setListeningEnabled(false);
      try { disablePersistentListening(); } catch (e) {}
      stopListening();
      speechService.cancel();
    } else {
      shouldContinueListening.current = true;
      setListeningEnabled(true);
      try { enablePersistentListening(); } catch (e) {}
      startListening();
    }
  };

  // Cancel booking
  const handleCancel = async () => {
    shouldContinueListening.current = false;
    try { disablePersistentListening(); } catch (e) {}
    stopListening();
    speechService.cancel();
    await resetConversation();
    navigate('/');
  };

  if (!isSupported) {
    return (
      <div className="voice-booking-container">
        <div className="error-message">
          <h2>Voice Recognition Not Supported</h2>
          <p>Your browser doesn't support voice recognition. Please use Chrome, Edge, or Safari.</p>
          <button onClick={() => navigate('/')}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-booking-container" role="main" aria-label="AI Voice Booking">
      <header className="booking-header">
        <h1>✈️ AI Voice Booking</h1>
        <p className="subtitle">Powered by Smart NLP • 15-Step Flow</p>
      </header>

      {/* Progress indicator */}
      <div className="progress-bar" role="progressbar" aria-valuenow={currentStep} aria-valuemin="1" aria-valuemax="16">
        <div className="progress-fill" style={{ width: `${(currentStep / 16) * 100}%` }}></div>
        <span className="progress-text">
          Step {currentStep}/16: {stepLabels[currentStep] || 'Processing'}
        </span>
      </div>

      {/* Auto-start message */}
      {showStartButton && (
        <div className="start-section" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎤</div>
          <h2 style={{ color: 'white', marginBottom: '15px' }}>Starting Voice Booking...</h2>
          <p className="help-text" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Say commands like:<br/>
            • "Book flight from Mumbai to Singapore tomorrow"<br/>
            • "My phone is 9876543210" (for auto-fill)<br/>
            • "Cancel" or "Stop" to exit
          </p>
        </div>
      )}

      {/* Main Content Area - Two Column Layout */}
      {!showStartButton && (
        <>
          <div className="main-content-wrapper" style={{ display: 'flex', gap: '25px', width: '100%', maxWidth: '1400px', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
            
            {/* Left Column - Conversation */}
            <div className="left-column" style={{ flex: '1 1 65%', minWidth: 0 }}>
              <div className="chat-container" role="log" aria-live="polite" aria-atomic="false">
                <div className="chat-messages">
                  {conversationHistory.map((entry, index) => (
                    <div 
                      key={index} 
                      className={`chat-message ${entry.speaker === 'bot' ? 'bot-message' : 'user-message'}`}
                      role="article"
                      aria-label={`${entry.speaker === 'bot' ? 'Assistant' : 'You'} said: ${entry.message}`}
                    >
                      <div className="message-avatar">
                        {entry.speaker === 'bot' ? '🤖' : '👤'}
                      </div>
                      <div className="message-bubble">{entry.message}</div>
                    </div>
                  ))}
                
                {/* Current processing state */}
                {isProcessing && (
                  <div className="chat-message bot-message processing">
                    <div className="message-avatar">🤖</div>
                    <div className="message-bubble">
                      <span className="typing-indicator">●●●</span>
                    </div>
                  </div>
                )}

                {/* Current input */}
                {isListening && (interimTranscript || transcript) && (
                  <div className="chat-message user-message interim">
                    <div className="message-avatar">👤</div>
                    <div className="message-bubble">{interimTranscript || transcript}</div>
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Right Column - Booking Summary/Review/Confirmation Sidebar */}
            {(confirmationDetails || reviewDetails || Object.keys(bookingData).length > 0) && (
              <div className="right-column" style={{ flex: '0 0 400px', position: 'sticky', top: '20px', alignSelf: 'flex-start' }}>
              
              {/* Booking Confirmation Card - Shows after booking complete */}
              {confirmationDetails && (
                <div className="confirmation-card" role="region" aria-label="Booking Confirmation" style={{
                  padding: '24px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(20, 184, 166, 0.2) 100%)',
                  borderRadius: '20px',
                  border: '2px solid rgba(16, 185, 129, 0.4)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(20px)'
                }}>
                  <div style={{textAlign: 'center', marginBottom: '20px'}}>
                    <div style={{fontSize: '48px', marginBottom: '10px'}}>✅</div>
                    <h2 style={{color: '#10b981', margin: '0', fontSize: '24px', fontWeight: 'bold'}}>Booking Confirmed!</h2>
                    <p style={{color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '5px'}}>Booking ID: {confirmationDetails.bookingId}</p>
                  </div>
                  
                  {/* Flight Details */}
                  {confirmationDetails.selectedFlight && (
                    <div style={{backgroundColor: 'rgba(255,255,255,0.08)', padding: '16px', borderRadius: '12px', marginBottom: '12px', border: '1px solid rgba(99, 102, 241, 0.3)'}}>
                      <h4 style={{color: '#818cf8', marginBottom: '10px', fontSize: '16px', fontWeight: '700'}}>✈️ Flight Details</h4>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#f3f4f6'}}>
                        <div><strong style={{color: '#a78bfa'}}>Flight:</strong> {confirmationDetails.selectedFlight.carrier} {confirmationDetails.selectedFlight.flight}</div>
                        <div><strong style={{color: '#a78bfa'}}>Class:</strong> {confirmationDetails.classPref || confirmationDetails.selectedFlight.class}</div>
                        <div><strong style={{color: '#a78bfa'}}>Date:</strong> {confirmationDetails.travelDate}</div>
                        <div><strong style={{color: '#a78bfa'}}>Time:</strong> {confirmationDetails.selectedFlight.time}</div>
                        <div><strong style={{color: '#a78bfa'}}>Duration:</strong> {confirmationDetails.selectedFlight.duration}</div>
                        <div><strong style={{color: '#a78bfa'}}>Aircraft:</strong> {confirmationDetails.selectedFlight.aircraft}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Passenger Details */}
                  <div style={{backgroundColor: 'rgba(255,255,255,0.08)', padding: '16px', borderRadius: '12px', marginBottom: '12px', border: '1px solid rgba(245, 158, 11, 0.3)'}}>
                    <h4 style={{color: '#fbbf24', marginBottom: '10px', fontSize: '16px', fontWeight: '700'}}>👤 Passenger Info</h4>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#f3f4f6'}}>
                      <div><strong style={{color: '#fbbf24'}}>Name:</strong> {confirmationDetails.passengerName}</div>
                      <div><strong style={{color: '#fbbf24'}}>Passengers:</strong> {confirmationDetails.passengers}</div>
                      <div><strong style={{color: '#fbbf24'}}>Email:</strong> {confirmationDetails.email}</div>
                      <div><strong style={{color: '#fbbf24'}}>Phone:</strong> {confirmationDetails.phone}</div>
                      <div><strong style={{color: '#fbbf24'}}>Seat:</strong> {confirmationDetails.seat}</div>
                      <div><strong style={{color: '#fbbf24'}}>Meal:</strong> {confirmationDetails.meal}</div>
                      {confirmationDetails.assistance && <div><strong style={{color: '#fbbf24'}}>Assistance:</strong> {confirmationDetails.assistance}</div>}
                    </div>
                  </div>
                  
                  {/* Total Amount */}
                  <div style={{backgroundColor: 'rgba(16, 185, 129, 0.25)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '2px solid rgba(16, 185, 129, 0.5)', marginBottom: '12px'}}>
                    <h4 style={{color: '#10b981', marginBottom: '8px', fontSize: '15px', fontWeight: '700'}}>💰 Total Fare</h4>
                    <div style={{fontSize: '32px', fontWeight: 'bold', color: '#10b981'}}>₹{confirmationDetails.totalAmount ? confirmationDetails.totalAmount.toLocaleString() : 'N/A'}</div>
                  </div>
                  
                  {/* Redirect Message */}
                  <div style={{padding: '12px', backgroundColor: 'rgba(99, 102, 241, 0.15)', borderRadius: '10px', textAlign: 'center', border: '1px dashed rgba(99, 102, 241, 0.4)'}}>
                    <p style={{margin: '0', fontSize: '13px', color: '#a78bfa', fontWeight: '600'}}>📄 Redirecting to confirmation page...</p>
                  </div>
                </div>
              )}

              {/* Booking Review Card - Visual display only, no buttons */}
              {!confirmationDetails && reviewDetails && (
                <div className="booking-review-card" role="region" aria-label="Booking Review" style={{
                  padding: '24px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                  borderRadius: '20px',
                  border: '2px solid rgba(99, 102, 241, 0.4)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(20px)'
                }}>
                  <h3 style={{color: '#a78bfa', marginBottom: '18px', fontSize: '20px', textAlign: 'center', fontWeight: '700'}}>✈️ Booking Review</h3>
                  
                  {/* Flight Details */}
                  {reviewDetails.selectedFlight && (
                    <div style={{backgroundColor: 'rgba(255,255,255,0.08)', padding: '14px', borderRadius: '12px', marginBottom: '12px', border: '1px solid rgba(20, 184, 166, 0.3)'}}>
                      <h4 style={{color: '#5eead4', marginBottom: '10px', fontSize: '15px', fontWeight: '700'}}>🛫 Flight Details</h4>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#f3f4f6'}}>
                        <div><strong style={{color: '#5eead4'}}>Flight:</strong> {reviewDetails.selectedFlight.carrier} {reviewDetails.selectedFlight.flight}</div>
                        <div><strong style={{color: '#5eead4'}}>Aircraft:</strong> {reviewDetails.selectedFlight.aircraft || 'N/A'}</div>
                        <div><strong style={{color: '#5eead4'}}>Departure:</strong> {reviewDetails.selectedFlight.time}</div>
                        <div><strong style={{color: '#5eead4'}}>Duration:</strong> {reviewDetails.selectedFlight.duration}</div>
                        <div><strong style={{color: '#5eead4'}}>Class:</strong> {reviewDetails.classPref}</div>
                        <div><strong style={{color: '#5eead4'}}>Date:</strong> {reviewDetails.travelDate}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Passenger Details */}
                  <div style={{backgroundColor: 'rgba(255,255,255,0.08)', padding: '14px', borderRadius: '12px', marginBottom: '12px', border: '1px solid rgba(245, 158, 11, 0.3)'}}>
                    <h4 style={{color: '#fbbf24', marginBottom: '10px', fontSize: '15px', fontWeight: '700'}}>👤 Passenger Info</h4>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#f3f4f6'}}>
                      <div><strong style={{color: '#fbbf24'}}>Name:</strong> {reviewDetails.passengerName}</div>
                      <div><strong style={{color: '#fbbf24'}}>Passengers:</strong> {reviewDetails.passengers}</div>
                      <div><strong style={{color: '#fbbf24'}}>Email:</strong> {reviewDetails.email}</div>
                      <div><strong style={{color: '#fbbf24'}}>Phone:</strong> {reviewDetails.phone}</div>
                      <div><strong style={{color: '#fbbf24'}}>Seat:</strong> {reviewDetails.seat}</div>
                      <div><strong style={{color: '#fbbf24'}}>Meal:</strong> {reviewDetails.meal}</div>
                    </div>
                  </div>
                  
                  {/* Total Amount */}
                  <div style={{backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '14px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.4)', marginBottom: '12px'}}>
                    <h4 style={{color: '#34d399', marginBottom: '8px', fontSize: '15px', fontWeight: '700'}}>💰 Total Fare</h4>
                    <div style={{fontSize: '28px', fontWeight: 'bold', color: '#34d399'}}>₹{reviewDetails.totalAmount ? reviewDetails.totalAmount.toLocaleString() : 'N/A'}</div>
                  </div>
                  
                  {/* Voice Instructions */}
                  <div style={{padding: '14px', backgroundColor: 'rgba(99, 102, 241, 0.15)', borderRadius: '12px', textAlign: 'center', border: '1px dashed rgba(99, 102, 241, 0.4)'}}>
                    <p style={{margin: '5px 0', fontSize: '14px', color: '#e5e7eb'}}>🎤 Say <strong style={{color: '#a78bfa'}}>"confirm"</strong> to proceed</p>
                    <p style={{margin: '5px 0', fontSize: '14px', color: '#e5e7eb'}}>🎤 Say <strong style={{color: '#f87171'}}>"change"</strong> to modify</p>
                  </div>
                </div>
              )}

              {/* Booking Summary - Shows collected information */}
              {!reviewDetails && !confirmationDetails && Object.keys(bookingData).length > 0 && (
                <div className="booking-summary-sidebar" role="region" aria-label="Collected booking information" style={{
                  padding: '24px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                }}>
                  <h3 style={{
                    color: '#a78bfa',
                    marginBottom: '20px',
                    fontSize: '20px',
                    fontWeight: '700',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    📋 Booking Info
                  </h3>
                  
                  <div className="sidebar-data" style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                    {bookingData.origin && (
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        borderRadius: '10px',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <strong style={{ color: '#a78bfa', display: 'block', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>From</strong>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#f3f4f6' }}>{bookingData.origin}</span>
                      </div>
                    )}
                    
                    {bookingData.destination && (
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        borderRadius: '10px',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <strong style={{ color: '#a78bfa', display: 'block', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>To</strong>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#f3f4f6' }}>{bookingData.destination}</span>
                      </div>
                    )}
                    
                    {bookingData.date && (
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderRadius: '10px',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <strong style={{ color: '#34d399', display: 'block', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</strong>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#f3f4f6' }}>{bookingData.date}</span>
                      </div>
                    )}
                    
                    {bookingData.passengers && (
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderRadius: '10px',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <strong style={{ color: '#34d399', display: 'block', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Passengers</strong>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#f3f4f6' }}>{bookingData.passengers}</span>
                      </div>
                    )}
                    
                    {bookingData.class && (
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        borderRadius: '10px',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Class</strong>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#f3f4f6' }}>{bookingData.class}</span>
                      </div>
                    )}
                    
                    {bookingData.flight_time && (
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        borderRadius: '10px',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</strong>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#f3f4f6' }}>{bookingData.flight_time}</span>
                      </div>
                    )}
                    
                    {bookingData.name && (
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        borderRadius: '10px',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <strong style={{ color: '#818cf8', display: 'block', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</strong>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#f3f4f6' }}>{bookingData.name}</span>
                      </div>
                    )}
                    
                    {bookingData.email && (
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        borderRadius: '10px',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <strong style={{ color: '#818cf8', display: 'block', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</strong>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#f3f4f6' }}>{bookingData.email}</span>
                      </div>
                    )}
                    
                    {bookingData.phone && (
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        borderRadius: '10px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <strong style={{ color: '#f87171', display: 'block', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</strong>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#f3f4f6' }}>{bookingData.phone}</span>
                      </div>
                    )}
                    
                    {bookingData.seat && (
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        borderRadius: '10px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <strong style={{ color: '#f87171', display: 'block', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Seat</strong>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#f3f4f6' }}>{bookingData.seat}</span>
                      </div>
                    )}
                    
                    {bookingData.meal && (
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(20, 184, 166, 0.2)',
                        borderRadius: '10px',
                        border: '1px solid rgba(20, 184, 166, 0.3)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <strong style={{ color: '#5eead4', display: 'block', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Meal</strong>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#f3f4f6' }}>{bookingData.meal}</span>
                      </div>
                    )}
                    
                    {bookingData.assistance && (
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(20, 184, 166, 0.2)',
                        borderRadius: '10px',
                        border: '1px solid rgba(20, 184, 166, 0.3)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <strong style={{ color: '#5eead4', display: 'block', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assistance</strong>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#f3f4f6' }}>{bookingData.assistance}</span>
                      </div>
                    )}
                  </div>
                  
                  {isIdentified && (
                    <div className="identified-badge" style={{
                      marginTop: '16px',
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(20, 184, 166, 0.25) 100%)',
                      borderRadius: '10px',
                      textAlign: 'center',
                      color: '#34d399',
                      fontWeight: 'bold',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      fontSize: '14px'
                    }}>
                      ✅ User Identified - Auto-filled
                    </div>
                  )}
                </div>
              )}
            </div>
            )}
          </div>

          {/* Flight options listing (if available) */}
          {flightsOptions && flightsOptions.length > 0 && (
            <div className="flight-options" role="region" aria-label="Available flights" style={{position: 'relative', zIndex: 1, maxWidth: '1400px', width: '100%'}}>
              <h3>✈️ Available Flights</h3>
              {/* Selection confirmation banner */}
              {selectionConfirmation && (
                <div className="selection-confirmation" role="status" aria-live="polite" style={{marginBottom: '16px', padding: '16px 20px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(20, 184, 166, 0.2) 100%)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '12px', color: '#34d399', fontWeight: '600', fontSize: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'}}>
                  <strong style={{color: '#10b981'}}>✓ Selected:</strong> {selectionConfirmation}
                </div>
              )}
              <div className="flights-grid">
                {flightsOptions.map((f, idx) => (
                  <div key={idx} className={`flight-card ${selectedFlightId===f.flight? 'selected pulse':''}`} onClick={() => handleSelectFlight(f)} role="button" tabIndex={0}>
                    <div className="flight-top">
                      <strong>{f.carrier} {f.flight}</strong>
                      <span className="flight-class">{f.class}</span>
                    </div>
                    <div className="flight-body">
                      <div><strong>Time:</strong> {f.time} • <strong>Duration:</strong> {f.duration}</div>
                      <div><strong>Aircraft:</strong> {f.aircraft} • <strong>Price:</strong> ₹{f.price.toLocaleString()}</div>
                      <div><strong>Seats:</strong> {f.seats_available}</div>
                    </div>
                    <div className="flight-cta">Click or say "{idx+1}" to select</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status indicators - Voice commands only */}
          <div className="status-bar" style={{ textAlign: 'center', marginTop: '30px', fontSize: '18px', maxWidth: '900px', width: '100%', position: 'relative', zIndex: 1 }}>
            {isListening && <span className="status-indicator listening" style={{ display: 'inline-block', marginBottom: '15px', padding: '10px 24px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '20px', color: '#10b981', fontWeight: 'bold', border: '1px solid rgba(16, 185, 129, 0.4)' }}>🎤 Listening...</span>}
            {isProcessing && <span className="status-indicator processing" style={{ display: 'inline-block', marginBottom: '15px', padding: '10px 24px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '20px', color: '#f59e0b', fontWeight: 'bold', border: '1px solid rgba(245, 158, 11, 0.4)' }}>⚙️ Processing...</span>}
            {error && <span className="status-indicator error" style={{ display: 'inline-block', marginBottom: '15px', padding: '10px 24px', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '20px', color: '#ef4444', fontWeight: 'bold', border: '1px solid rgba(239, 68, 68, 0.4)' }}>⚠️ {error}</span>}
            <div style={{ marginTop: '25px', padding: '28px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', borderRadius: '16px', fontSize: '15px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
              <p style={{ margin: '8px 0', color: '#e5e7eb', fontWeight: '500', lineHeight: '1.8' }}>💬 Say <strong style={{ color: '#fbbf24' }}>"cancel"</strong> or <strong style={{ color: '#fbbf24' }}>"stop"</strong> to end booking</p>
              <p style={{ margin: '8px 0', color: '#e5e7eb', fontWeight: '500', lineHeight: '1.8' }}>💬 Say <strong style={{ color: '#fbbf24' }}>"go back"</strong> to return to previous step</p>
              <p style={{ margin: '8px 0', color: '#e5e7eb', fontWeight: '500', lineHeight: '1.8' }}>💬 Say <strong style={{ color: '#fbbf24' }}>"help"</strong> for assistance</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIVoiceBooking;
