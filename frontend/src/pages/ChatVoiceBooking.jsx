/**
 * Chat-Style Voice Booking with Popup Confirmations
 * Modern chat interface with voice interaction
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import speechService from '../utils/speechSynthesis';
import { processVoiceInput, resetConversation } from '../utils/pythonNlpService';
import '../styles/ChatVoiceBooking.css';

const ChatVoiceBooking = () => {
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const audioEnabledRef = useRef(false);
  
  const {
    transcript,
    interimTranscript,
    isRecognitionActive,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add message to chat
  const addMessage = (text, sender = 'bot', data = null) => {
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      text, 
      sender, 
      timestamp: new Date().toLocaleTimeString(),
      data 
    }]);
  };

  // Start conversation
  const startConversation = async () => {
    audioEnabledRef.current = true;
    resetConversation();
    
    const welcomeMsg = "Hello! Welcome to Voice Airline Booking. I'm here to guide you through the process. Where would you like to fly from?";
    addMessage(welcomeMsg, 'bot');
    await speechService.speak(welcomeMsg);
    
    setIsListening(true);
    startListening();
  };

  // Process voice input
  useEffect(() => {
    if (transcript && !isProcessing) {
      handleVoiceInput(transcript);
      resetTranscript();
    }
  }, [transcript]);

  const handleVoiceInput = async (input) => {
    if (!input.trim()) return;
    
    // Add user message
    addMessage(input, 'user');
    setIsProcessing(true);
    stopListening();

    try {
      const response = await processVoiceInput(input);
      
      // Add bot response
      addMessage(response.message, 'bot');
      
      // Check if we have complete booking data for confirmation
      if (response.intent === 'provide_passenger_info' && 
          response.context?.passenger_name && 
          response.context?.email && 
          response.context?.phone) {
        
        setBookingData(response.context);
        setShowConfirmationPopup(true);
        
        const confirmMsg = "I've gathered your information. Please review and confirm.";
        await speechService.speak(confirmMsg);
        
      } else {
        // Continue conversation
        await speechService.speak(response.message);
        
        // Resume listening after bot speaks
        setTimeout(() => {
          if (audioEnabledRef.current) {
            startListening();
          }
        }, 500);
      }
      
    } catch (error) {
      console.error('Error processing voice:', error);
      addMessage("Sorry, I had trouble processing that. Could you please repeat?", 'bot');
      await speechService.speak("Sorry, I had trouble processing that. Could you please repeat?");
      
      setTimeout(() => {
        if (audioEnabledRef.current) {
          startListening();
        }
      }, 500);
    } finally {
      setIsProcessing(false);
    }
  };

  // Voice confirmation handler
  const handleVoiceConfirmation = async (input) => {
    const confirmed = input.toLowerCase().includes('yes') || 
                     input.toLowerCase().includes('confirm') ||
                     input.toLowerCase().includes('correct');
    
    if (confirmed) {
      setShowConfirmationPopup(false);
      const msg = "Great! Moving to payment. How would you like to pay?";
      addMessage(msg, 'bot');
      await speechService.speak(msg);
      
      setTimeout(() => {
        if (audioEnabledRef.current) {
          startListening();
        }
      }, 500);
    } else {
      setShowConfirmationPopup(false);
      const msg = "No problem. What would you like to change?";
      addMessage(msg, 'bot');
      await speechService.speak(msg);
      
      setTimeout(() => {
        if (audioEnabledRef.current) {
          startListening();
        }
      }, 500);
    }
  };

  const confirmDetails = () => {
    setShowConfirmationPopup(false);
    const msg = "Perfect! Proceeding to payment...";
    addMessage(msg, 'bot');
    speechService.speak(msg);
    
    // Navigate to payment
    setTimeout(() => {
      navigate('/payment', { state: { bookingData } });
    }, 2000);
  };

  const editDetails = () => {
    setShowConfirmationPopup(false);
    const msg = "Sure, what would you like to change?";
    addMessage(msg, 'bot');
    speechService.speak(msg);
    
    setTimeout(() => {
      if (audioEnabledRef.current) {
        startListening();
      }
    }, 500);
  };

  return (
    <div className="chat-booking-container">
      {/* Header */}
      <div className="chat-header">
        <div className="header-content">
          <div className="bot-avatar">
            <span>🤖</span>
          </div>
          <div className="header-info">
            <h2>Voice Assistant</h2>
            <p className="status">
              {isListening ? '🎤 Listening...' : isProcessing ? '💭 Thinking...' : '✓ Online'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-screen">
            <div className="welcome-icon">✈️</div>
            <h2>Welcome to Voice Booking</h2>
            <p>Click the button below to start your voice-guided booking experience</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            <div className="message-avatar">
              {msg.sender === 'bot' ? '🤖' : '👤'}
            </div>
            <div className="message-content">
              <div className="message-bubble">
                {msg.text}
              </div>
              <div className="message-time">{msg.timestamp}</div>
            </div>
          </div>
        ))}
        
        {interimTranscript && (
          <div className="message user interim">
            <div className="message-avatar">👤</div>
            <div className="message-content">
              <div className="message-bubble">
                {interimTranscript}...
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Start Button or Voice Input Area */}
      <div className="chat-input-area">
        {messages.length === 0 ? (
          <button className="start-booking-btn" onClick={startConversation}>
            <span className="mic-icon">🎤</span>
            Start Voice Booking
          </button>
        ) : (
          <div className="voice-status">
            {isListening && (
              <div className="listening-indicator">
                <div className="pulse-ring"></div>
                <div className="pulse-ring delay-1"></div>
                <div className="pulse-ring delay-2"></div>
                <span className="mic-icon">🎤</span>
              </div>
            )}
            {isProcessing && (
              <div className="processing-indicator">
                <div className="spinner"></div>
                <span>Processing...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Popup */}
      {showConfirmationPopup && bookingData && (
        <div className="popup-overlay">
          <div className="confirmation-popup">
            <div className="popup-header">
              <h3>📋 Review Your Information</h3>
              <button className="close-btn" onClick={() => setShowConfirmationPopup(false)}>×</button>
            </div>
            
            <div className="popup-content">
              <div className="info-section">
                <h4>Flight Details</h4>
                <div className="info-row">
                  <span className="label">Route:</span>
                  <span className="value">{bookingData.origin} → {bookingData.destination}</span>
                </div>
                <div className="info-row">
                  <span className="label">Date:</span>
                  <span className="value">{bookingData.travel_date}</span>
                </div>
                <div className="info-row">
                  <span className="label">Class:</span>
                  <span className="value">{bookingData.class_preference}</span>
                </div>
              </div>

              <div className="info-section">
                <h4>Passenger Information</h4>
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{bookingData.passenger_name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span className="value">{bookingData.email}</span>
                </div>
                <div className="info-row">
                  <span className="label">Phone:</span>
                  <span className="value">{bookingData.phone}</span>
                </div>
              </div>

              {bookingData.seat_number && (
                <div className="info-section">
                  <h4>Seat Selection</h4>
                  <div className="info-row">
                    <span className="label">Seat:</span>
                    <span className="value">{bookingData.seat_number}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="popup-actions">
              <p className="voice-prompt">Say "Confirm" or "Edit" to continue</p>
              <div className="button-group">
                <button className="btn-secondary" onClick={editDetails}>
                  ✏️ Edit Details
                </button>
                <button className="btn-primary" onClick={confirmDetails}>
                  ✓ Confirm & Pay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatVoiceBooking;
