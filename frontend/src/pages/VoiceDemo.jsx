/**
 * Voice Checkout Demo - Continuous Conversation with Python NLP
 * Automatically listens and responds without button clicks
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import speechService from '../utils/speechSynthesis';
import { processVoiceInput, resetConversation } from '../utils/pythonNlpService';
import '../styles/VoiceDemo.css';

const VoiceDemo = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [passengerName, setPassengerName] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
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
  } = useSpeechRecognition();

  const demoSteps = ['Start', 'Name', 'Seat', 'Pay', 'Done'];

  // Start listening on mount
  useEffect(() => {
    const initialMessage = 'Hello! Welcome to Voice Airline Booking. Say "start booking" to begin.';
    speechService.speak(initialMessage);
    addMessage('system', initialMessage);
    
    // Start listening after initial message
    setTimeout(() => {
      if (shouldContinueListening.current) {
        startListening();
      }
    }, 4000);
    
    return () => {
      shouldContinueListening.current = false;
      stopListening();
    };
  }, []);

  // Process transcript when speech recognition stops
  useEffect(() => {
    if (transcript && !isListening && !isProcessing) {
      handleVoiceInput(transcript);
    }
  }, [transcript, isListening]);

  const addMessage = (type, text) => {
    setConversationHistory(prev => [...prev, {
      type,
      text,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleVoiceInput = async (userInput) => {
    if (!userInput.trim()) return;
    
    setIsProcessing(true);
    addMessage('user', userInput);
    
    try {
      // Send to Python NLP service
      const result = await processVoiceInput(userInput);
      
      console.log('Python NLP Result:', result);
      
      // Speak the response
      if (result.response) {
        addMessage('system', result.response);
        speechService.speak(result.response);
      }
      
      // Update UI state based on context
      if (result.context) {
        setStep(result.context.step);
        if (result.context.passenger_name) {
          setPassengerName(result.context.passenger_name);
        }
        if (result.context.seat_preference) {
          setSeatNumber(result.context.seat_preference);
        }
        if (result.context.payment_confirmed) {
          setPaymentConfirmed(true);
        }
      }
      
      // Reset transcript and continue listening if needed
      resetTranscript();
      
      // Auto-restart listening after response (if auto_listen is true)
      if (result.auto_listen && shouldContinueListening.current) {
        setTimeout(() => {
          if (!isListening && shouldContinueListening.current) {
            startListening();
          }
        }, 4000); // Wait 4 seconds for speech to finish
      }
      
    } catch (error) {
      console.error('Voice processing error:', error);
      addMessage('system', 'Sorry, I had trouble processing that. Please try again.');
      speechService.speak('Sorry, I had trouble processing that. Please try again.');
      
      // Restart listening even on error
      setTimeout(() => {
        if (shouldContinueListening.current) {
          resetTranscript();
          startListening();
        }
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualToggle = () => {
    if (isListening) {
      shouldContinueListening.current = false;
      stopListening();
    } else {
      shouldContinueListening.current = true;
      resetTranscript();
      startListening();
    }
  };

  const handleRestart = async () => {
    await resetConversation();
    setStep(0);
    setPassengerName('');
    setSeatNumber('');
    setPaymentConfirmed(false);
    setConversationHistory([]);
    shouldContinueListening.current = true;
    
    const initialMessage = 'Hello! Welcome to Voice Airline Booking. Say "start booking" to begin.';
    speechService.speak(initialMessage);
    addMessage('system', initialMessage);
    
    setTimeout(() => {
      if (shouldContinueListening.current) {
        resetTranscript();
        startListening();
      }
    }, 4000);
  };

  const handleGoToFullBooking = () => {
    shouldContinueListening.current = false;
    stopListening();
    navigate('/');
  };

  if (!isSupported) {
    return (
      <div className="voice-demo-container">
        <div className="voice-input-error">
          Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.
        </div>
      </div>
    );
  }

  return (
    <div className="voice-demo-container">
      <header className="demo-header">
        <h1>🎙️ Voice Checkout POC Demo</h1>
        <p>Continuous Voice Conversation with Python NLP</p>
      </header>

      <div className="demo-content">
        {/* Progress Indicator */}
        <div className="demo-progress">
          <div className="progress-steps">
            {demoSteps.map((label, index) => (
              <div
                key={index}
                className={`progress-step ${index === step ? 'active' : ''} ${index < step ? 'completed' : ''}`}
              >
                <div className="step-circle">{index + 1}</div>
                <div className="step-label">{label}</div>
              </div>
            ))}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(step / (demoSteps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Voice Status Indicator */}
        <div className="voice-status">
          <div className={`status-indicator ${isListening ? 'listening' : isProcessing ? 'processing' : 'idle'}`}>
            {isListening && (
              <>
                <span className="mic-icon pulsing">🎤</span>
                <span>Listening...</span>
              </>
            )}
            {isProcessing && (
              <>
                <span className="mic-icon">⚙️</span>
                <span>Processing...</span>
              </>
            )}
            {!isListening && !isProcessing && (
              <>
                <span className="mic-icon">💤</span>
                <span>Waiting...</span>
              </>
            )}
          </div>
          {interimTranscript && (
            <div className="interim-text">
              Hearing: "{interimTranscript}"
            </div>
          )}
        </div>

        {/* Conversation Display */}
        <div className="conversation-box" role="log" aria-live="polite">
          {conversationHistory.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              <div className="message-icon">
                {msg.type === 'system' ? '🤖' : '👤'}
              </div>
              <div className="message-bubble">
                <div className="message-text">{msg.text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Booking Summary */}
        {(passengerName || seatNumber) && (
          <div className="booking-summary">
            <h3>📋 Current Booking</h3>
            {passengerName && (
              <div className="summary-item">
                <span className="label">Passenger:</span>
                <span className="value">{passengerName}</span>
              </div>
            )}
            {seatNumber && (
              <div className="summary-item">
                <span className="label">Seat:</span>
                <span className="value">{seatNumber}</span>
              </div>
            )}
            {paymentConfirmed && (
              <div className="summary-item success">
                <span className="label">Payment:</span>
                <span className="value">✅ Confirmed</span>
              </div>
            )}
          </div>
        )}

        {/* Manual Controls */}
        <div className="demo-controls">
          <button
            className={`control-button ${isListening ? 'listening' : ''}`}
            onClick={handleManualToggle}
            disabled={isProcessing}
          >
            {isListening ? '⏸️ Pause Listening' : '▶️ Resume Listening'}
          </button>
          
          <button className="control-button secondary" onClick={handleRestart}>
            🔄 Restart Conversation
          </button>
          
          <button className="control-button secondary" onClick={handleGoToFullBooking}>
            📝 Full Booking Form
          </button>
        </div>

        {/* Help Text */}
        <div className="demo-help">
          <details>
            <summary>💡 How It Works</summary>
            <div className="help-content">
              <p><strong>Continuous Voice Conversation:</strong></p>
              <ul>
                <li>✅ <strong>Auto-listening</strong> - Microphone automatically restarts after each response</li>
                <li>✅ <strong>Python NLP</strong> - Advanced conversation management</li>
                <li>✅ <strong>No clicking</strong> - Just speak naturally!</li>
              </ul>
              <p><strong>Try saying:</strong></p>
              <ul>
                <li>"Hello" - Greet the system</li>
                <li>"Start booking" - Begin booking process</li>
                <li>"John Smith" - Provide your name</li>
                <li>"Window seat" - Select seat preference</li>
                <li>"Confirm payment" - Complete booking</li>
              </ul>
            </div>
          </details>
        </div>

        {error && (
          <div className="voice-error">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Demo Script Reference */}
      <div className="demo-footer">
        <details>
          <summary>📋 Demo Script Reference</summary>
          <div className="script-content">
            <h4>Voice Booking Flow</h4>
            <ol>
              <li><strong>Greeting:</strong> "Hello" → System responds with welcome</li>
              <li><strong>Start:</strong> "Start booking" → Moves to name input</li>
              <li><strong>Name:</strong> "Your full name" → Moves to seat selection</li>
              <li><strong>Seat:</strong> "Window/Aisle/Middle seat" → Moves to payment</li>
              <li><strong>Payment:</strong> "Confirm payment" → Completes booking</li>
            </ol>
          </div>
        </details>
      </div>
    </div>
  );
};

export default VoiceDemo;
