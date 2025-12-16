/**
 * Welcome Page - Starting point of the application
 * Voice-enabled welcome message for accessibility
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import speechService from '../utils/speechSynthesis';
import '../styles/Welcome.css';

const Welcome = () => {
  const navigate = useNavigate();
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);

  const startAudioAndNavigate = () => {
    if (audioStarted) return;
    setAudioStarted(true);
    
    const welcomeMessage = 
      'Welcome to Voice Enabled Airline Booking System. ' +
      'This system is fully accessible for blind users. ' +
      'Starting automatic voice booking now.';

    const utterance = new SpeechSynthesisUtterance(welcomeMessage);
    utterance.rate = 0.9;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';
    
    utterance.onend = () => {
      navigate('/voice-booking');
    };
    
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    // Listen for any user interaction
    const handleInteraction = () => {
      startAudioAndNavigate();
    };

    // Add listeners for click, touch, and keyboard
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      window.speechSynthesis.cancel();
    };
  }, [audioStarted]);

  const handleStartBooking = () => {
    speechService.speak('Starting your booking journey. Please provide your name.');
    setTimeout(() => {
      navigate('/passenger-info');
    }, 500);
  };

  const handleVoiceBooking = () => {
    // Direct navigation - speech will happen after user clicks START button in VoiceBooking
    navigate('/voice-booking');
  };

  const handleVoiceDemo = () => {
    speechService.speak('Starting voice checkout demo. Follow the prompts to experience NLP powered booking.');
    setTimeout(() => {
      navigate('/demo');
    }, 500);
  };

  const toggleVoice = () => {
    const newState = speechService.toggle();
    setVoiceEnabled(newState);
    if (newState) {
      speechService.speak('Voice assistance enabled');
    }
  };

  return (
    <div className="welcome-container" role="main">
      <header className="welcome-header">
        <h1 tabIndex="0">
          ✈️ Voice Airline Booking System
        </h1>
        <p className="subtitle" tabIndex="0">
          Accessible Flight Booking for Everyone
        </p>
      </header>

      <section className="welcome-content" aria-labelledby="welcome-heading">
        <h2 id="welcome-heading" className="sr-only">Welcome Information</h2>
        
        <div className="welcome-message" tabIndex="0">
          <p>
            Welcome! This is a fully voice-enabled airline booking system designed 
            with accessibility in mind.
          </p>
          <p>
            You can complete your entire booking using voice commands or traditional input.
          </p>
        </div>

        <div className="features-list" aria-label="System features">
          <h3 tabIndex="0">Features:</h3>
          <ul>
            <li tabIndex="0">🎤 Voice-enabled booking process</li>
            <li tabIndex="0">🧠 NLP-powered natural language understanding</li>
            <li tabIndex="0">♿ Full screen reader support</li>
            <li tabIndex="0">🗣️ Text-to-speech announcements</li>
            <li tabIndex="0">🎯 Simple and intuitive interface</li>
            <li tabIndex="0">🔒 Secure payment with OTP</li>
          </ul>
        </div>

        <div className="action-buttons">
          <button
            className="btn btn-primary btn-large btn-voice-highlight"
            onClick={() => navigate('/chat-booking')}
            aria-label="Start chat-style voice booking with popup confirmations"
            autoFocus
          >
            💬 Chat-Style Voice Booking (New!)
          </button>

          <button
            className="btn btn-primary btn-large btn-voice-highlight"
            onClick={handleVoiceBooking}
            aria-label="Start complete voice-controlled booking flow"
          >
            🎙️ Complete Voice Booking (Full Flow)
          </button>

          <button
            className="btn btn-primary btn-large demo-highlight"
            onClick={handleVoiceDemo}
            aria-label="Try voice checkout demo with NLP"
          >
            🎤 Quick Voice Demo (POC)
          </button>

          <button
            className="btn btn-primary btn-large"
            onClick={handleStartBooking}
            aria-label="Start full booking process"
          >
            📝 Manual Booking Form
          </button>

          <button
            className="btn btn-secondary"
            onClick={toggleVoice}
            aria-label={voiceEnabled ? 'Disable voice assistance' : 'Enable voice assistance'}
            aria-pressed={voiceEnabled}
          >
            {voiceEnabled ? '🔊 Voice: ON' : '🔇 Voice: OFF'}
          </button>
        </div>

        <div className="accessibility-note" tabIndex="0">
          <p>
            <strong>Accessibility Notice:</strong> This system supports keyboard navigation, 
            screen readers (NVDA, JAWS, VoiceOver), and voice commands.
          </p>
        </div>
      </section>

      <footer className="welcome-footer">
        <p tabIndex="0">
          Need help? Press F1 or say "Help" at any time.
        </p>
      </footer>
    </div>
  );
};

export default Welcome;
