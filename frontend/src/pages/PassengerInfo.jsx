/**
 * Passenger Info Page
 * Collects passenger name with voice input support
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceInput from '../components/VoiceInput';
import speechService from '../utils/speechSynthesis';
import '../styles/PassengerInfo.css';
import '../styles/AudioButton.css';

const PassengerInfo = () => {
  const navigate = useNavigate();
  const [passengerName, setPassengerName] = useState('');
  const [error, setError] = useState('');
  const [audioReady, setAudioReady] = useState(false);

  useEffect(() => {
    if (audioReady) {
      const message = 'Please enter your passenger information. You can type or use voice input. Say your name, email, and phone number.';
      console.log('🔊 Speaking:', message);
      
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.9;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';
      
      utterance.onstart = () => console.log('✅ Speech started');
      utterance.onerror = (e) => console.error('❌ Speech error:', e);
      
      window.speechSynthesis.speak(utterance);
    }
  }, [audioReady]);

  const handleVoiceTranscript = (transcript) => {
    setPassengerName(transcript);
    setError('');
    speechService.speak(`Name captured: ${transcript}`);
  };

  const handleInputChange = (e) => {
    setPassengerName(e.target.value);
    setError('');
  };

  const handleNext = () => {
    if (!passengerName.trim()) {
      const errorMsg = 'Please enter your name';
      setError(errorMsg);
      speechService.speak(errorMsg);
      return;
    }

    if (passengerName.trim().length < 2) {
      const errorMsg = 'Please enter a valid name';
      setError(errorMsg);
      speechService.speak(errorMsg);
      return;
    }

    // Store in session storage
    sessionStorage.setItem('passengerName', passengerName.trim());
    
    speechService.speak(`Thank you, ${passengerName}. Now let's select your seat.`);
    
    setTimeout(() => {
      navigate('/seat-selection');
    }, 500);
  };

  const handleBack = () => {
    speechService.speak('Going back to welcome page');
    navigate('/');
  };

  return (
    <div className="page-container" role="main">
      <div className="progress-bar" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
        <div className="progress-fill" style={{ width: '25%' }}></div>
      </div>

      <header className="page-header">
        <h1 tabIndex="0">Passenger Information</h1>
        <p className="page-description" tabIndex="0">
          Step 1 of 4: Enter your name
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

      <section className="form-section" aria-labelledby="passenger-form-heading">
        <h2 id="passenger-form-heading" className="sr-only">Passenger Name Form</h2>

        <div className="form-group">
          <label htmlFor="passenger-name" className="form-label">
            Full Name *
          </label>
          <input
            id="passenger-name"
            type="text"
            className="form-input"
            value={passengerName}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'name-error' : 'name-help'}
            autoFocus
          />
          <span id="name-help" className="form-help">
            Enter your name as it appears on your ID
          </span>
          {error && (
            <span id="name-error" className="form-error" role="alert">
              {error}
            </span>
          )}
        </div>

        <div className="voice-input-section">
          <p className="section-title" tabIndex="0">Or use voice input:</p>
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            ariaLabel="Record passenger name using voice"
          />
        </div>

        {passengerName && (
          <div className="name-preview" aria-live="polite" tabIndex="0">
            <strong>Name:</strong> {passengerName}
          </div>
        )}
      </section>

      <nav className="navigation-buttons" aria-label="Page navigation">
        <button
          className="btn btn-secondary"
          onClick={handleBack}
          aria-label="Go back to welcome page"
        >
          ← Back
        </button>
        <button
          className="btn btn-primary"
          onClick={handleNext}
          aria-label="Continue to seat selection"
        >
          Next →
        </button>
      </nav>
    </div>
  );
};

export default PassengerInfo;
