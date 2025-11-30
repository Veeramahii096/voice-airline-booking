/**
 * Seat Selection Page
 * Allows seat selection via dropdown or voice input
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceInput from '../components/VoiceInput';
import speechService from '../utils/speechSynthesis';
import '../styles/SeatSelection.css';
import '../styles/AudioButton.css';

const SeatSelection = () => {
  const navigate = useNavigate();
  const [selectedSeat, setSelectedSeat] = useState('');
  const [error, setError] = useState('');
  const [audioReady, setAudioReady] = useState(false);

  // Available seats (mock data)
  const availableSeats = [
    '1A', '1B', '1C', '2A', '2B', '2C',
    '3A', '3B', '3C', '4A', '4B', '4C',
    '5A', '5B', '5C', '6A', '6B', '6C',
    '10A', '10B', '10C', '11A', '11B', '11C',
    '12A', '12B', '12C', '15A', '15B', '15C',
  ];

  useEffect(() => {
    const passengerName = sessionStorage.getItem('passengerName');
    if (!passengerName) {
      navigate('/passenger-info');
      return;
    }

    if (audioReady) {
      const message = 'Please select your seat. You can choose from the dropdown menu or use voice input. For example, say Seat 12 A or Seat 15 B.';
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

  const handleVoiceTranscript = (transcript) => {
    // Parse voice input for seat number
    // Examples: "seat 12A", "12A", "seat twelve A", "12 A"
    const normalized = transcript.toUpperCase().replace(/SEAT\s*/i, '').replace(/\s+/g, '');
    
    // Check if the seat exists
    const matchedSeat = availableSeats.find(seat => 
      seat === normalized || seat.replace(/\s/g, '') === normalized
    );

    if (matchedSeat) {
      setSelectedSeat(matchedSeat);
      setError('');
      speechService.speak(`Seat ${matchedSeat} selected`);
    } else {
      const errorMsg = `Seat ${normalized} is not available. Please try another seat.`;
      setError(errorMsg);
      speechService.speak(errorMsg);
    }
  };

  const handleSelectChange = (e) => {
    const seat = e.target.value;
    setSelectedSeat(seat);
    setError('');
    if (seat) {
      speechService.speak(`Seat ${seat} selected`);
    }
  };

  const handleNext = () => {
    if (!selectedSeat) {
      const errorMsg = 'Please select a seat';
      setError(errorMsg);
      speechService.speak(errorMsg);
      return;
    }

    sessionStorage.setItem('selectedSeat', selectedSeat);
    speechService.speak('Seat confirmed. Now, let us know if you need any special assistance.');
    
    setTimeout(() => {
      navigate('/special-assistance');
    }, 500);
  };

  const handleBack = () => {
    speechService.speak('Going back to passenger information');
    navigate('/passenger-info');
  };

  return (
    <div className="page-container" role="main">
      <div className="progress-bar" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">
        <div className="progress-fill" style={{ width: '50%' }}></div>
      </div>

      <header className="page-header">
        <h1 tabIndex="0">Seat Selection</h1>
        <p className="page-description" tabIndex="0">
          Step 2 of 4: Choose your preferred seat
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

      <section className="form-section" aria-labelledby="seat-form-heading">
        <h2 id="seat-form-heading" className="sr-only">Seat Selection Form</h2>

        <div className="flight-info" tabIndex="0">
          <p><strong>Flight:</strong> AI101</p>
          <p><strong>Route:</strong> New Delhi (DEL) → Mumbai (BOM)</p>
          <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
        </div>

        <div className="form-group">
          <label htmlFor="seat-select" className="form-label">
            Select Seat *
          </label>
          <select
            id="seat-select"
            className="form-select"
            value={selectedSeat}
            onChange={handleSelectChange}
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'seat-error' : 'seat-help'}
          >
            <option value="">-- Choose a seat --</option>
            {availableSeats.map(seat => (
              <option key={seat} value={seat}>
                Seat {seat}
              </option>
            ))}
          </select>
          <span id="seat-help" className="form-help">
            A = Window, B = Middle, C = Aisle
          </span>
          {error && (
            <span id="seat-error" className="form-error" role="alert">
              {error}
            </span>
          )}
        </div>

        <div className="seat-map" aria-label="Aircraft seat layout">
          <p className="seat-map-title" tabIndex="0">Seat Layout Reference:</p>
          <div className="seat-legend" tabIndex="0">
            <span>🪟 A - Window</span>
            <span>👤 B - Middle</span>
            <span>🚶 C - Aisle</span>
          </div>
        </div>

        <div className="voice-input-section">
          <p className="section-title" tabIndex="0">Or use voice to select seat:</p>
          <p className="voice-example" tabIndex="0">
            Say: "Seat 12A" or "Seat 15B"
          </p>
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            ariaLabel="Select seat using voice"
          />
        </div>

        {selectedSeat && (
          <div className="seat-preview" aria-live="polite" tabIndex="0">
            <strong>Selected Seat:</strong> {selectedSeat}
          </div>
        )}
      </section>

      <nav className="navigation-buttons" aria-label="Page navigation">
        <button
          className="btn btn-secondary"
          onClick={handleBack}
          aria-label="Go back to passenger information"
        >
          ← Back
        </button>
        <button
          className="btn btn-primary"
          onClick={handleNext}
          aria-label="Continue to special assistance"
        >
          Next →
        </button>
      </nav>
    </div>
  );
};

export default SeatSelection;
