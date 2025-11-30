/**
 * Special Assistance Page
 * Allows users to request special assistance (wheelchair, visual impairment support)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import speechService from '../utils/speechSynthesis';
import '../styles/SpecialAssistance.css';

const SpecialAssistance = () => {
  const navigate = useNavigate();
  const [selectedAssistance, setSelectedAssistance] = useState([]);

  const assistanceOptions = [
    { id: 'wheelchair', label: 'Wheelchair Assistance', icon: '♿' },
    { id: 'visual', label: 'Visual Impairment Support', icon: '👁️' },
    { id: 'hearing', label: 'Hearing Impairment Support', icon: '👂' },
    { id: 'mobility', label: 'Mobility Assistance', icon: '🦯' },
    { id: 'none', label: 'No Special Assistance Required', icon: '✅' },
  ];

  useEffect(() => {
    const passengerName = sessionStorage.getItem('passengerName');
    const selectedSeat = sessionStorage.getItem('selectedSeat');
    
    if (!passengerName || !selectedSeat) {
      navigate('/passenger-info');
      return;
    }

    if (audioReady) {
      const message = 'Please select any special assistance you may need. You can select multiple options or choose none if no assistance is required.';
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

  const handleCheckboxChange = (assistanceId) => {
    setSelectedAssistance(prev => {
      let newSelection;
      
      // If "none" is selected, clear all others
      if (assistanceId === 'none') {
        newSelection = ['none'];
        speechService.speak('No special assistance selected');
      } else {
        // Remove "none" if other options are selected
        newSelection = prev.filter(id => id !== 'none');
        
        if (prev.includes(assistanceId)) {
          newSelection = newSelection.filter(id => id !== assistanceId);
          const option = assistanceOptions.find(opt => opt.id === assistanceId);
          speechService.speak(`${option.label} deselected`);
        } else {
          newSelection = [...newSelection, assistanceId];
          const option = assistanceOptions.find(opt => opt.id === assistanceId);
          speechService.speak(`${option.label} selected`);
        }
      }
      
      return newSelection;
    });
  };

  const handleNext = () => {
    const assistance = selectedAssistance.length === 0 ? ['none'] : selectedAssistance;
    sessionStorage.setItem('specialAssistance', JSON.stringify(assistance));
    
    speechService.speak('Special assistance preferences saved. Proceeding to payment.');
    
    setTimeout(() => {
      navigate('/payment');
    }, 500);
  };

  const handleBack = () => {
    speechService.speak('Going back to seat selection');
    navigate('/seat-selection');
  };

  return (
    <div className="page-container" role="main">
      <div className="progress-bar" role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100">
        <div className="progress-fill" style={{ width: '75%' }}></div>
      </div>

      <header className="page-header">
        <h1 tabIndex="0">Special Assistance</h1>
        <p className="page-description" tabIndex="0">
          Step 3 of 4: Request any special assistance
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

      <section className="form-section" aria-labelledby="assistance-form-heading">
        <h2 id="assistance-form-heading" className="sr-only">Special Assistance Options</h2>

        <div className="assistance-info" tabIndex="0">
          <p>
            We are committed to making your journey comfortable. Please let us know 
            if you need any special assistance during your travel.
          </p>
        </div>

        <fieldset className="assistance-options" aria-label="Special assistance options">
          <legend className="sr-only">Select special assistance requirements</legend>
          
          {assistanceOptions.map(option => (
            <div key={option.id} className="checkbox-option">
              <input
                type="checkbox"
                id={option.id}
                checked={selectedAssistance.includes(option.id)}
                onChange={() => handleCheckboxChange(option.id)}
                aria-label={option.label}
              />
              <label htmlFor={option.id} className="checkbox-label">
                <span className="option-icon" aria-hidden="true">{option.icon}</span>
                <span className="option-text">{option.label}</span>
              </label>
            </div>
          ))}
        </fieldset>

        {selectedAssistance.length > 0 && !selectedAssistance.includes('none') && (
          <div className="assistance-summary" aria-live="polite" tabIndex="0">
            <h3>Selected Assistance:</h3>
            <ul>
              {selectedAssistance.map(id => {
                const option = assistanceOptions.find(opt => opt.id === id);
                return <li key={id}>{option.icon} {option.label}</li>;
              })}
            </ul>
          </div>
        )}

        <div className="assistance-note" tabIndex="0">
          <p>
            <strong>Note:</strong> Our staff will be notified of your requirements 
            and will provide appropriate assistance throughout your journey.
          </p>
        </div>
      </section>

      <nav className="navigation-buttons" aria-label="Page navigation">
        <button
          className="btn btn-secondary"
          onClick={handleBack}
          aria-label="Go back to seat selection"
        >
          ← Back
        </button>
        <button
          className="btn btn-primary"
          onClick={handleNext}
          aria-label="Continue to payment"
        >
          Next →
        </button>
      </nav>
    </div>
  );
};

export default SpecialAssistance;
