/**
 * Enhanced Voice Input Component with NLP Integration
 * Supports intelligent voice command processing
 */

import React, { useEffect, useState } from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import nlpService from '../utils/nlpService';
import '../styles/VoiceInput.css';

const VoiceInputNLP = ({ onTranscript, onIntent, placeholder, ariaLabel, context = 'general', autoRestart = true }) => {
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

  const [processing, setProcessing] = useState(false);
  const [nlpResult, setNlpResult] = useState(null);
  const [shouldAutoRestart, setShouldAutoRestart] = useState(false);

  useEffect(() => {
    if (transcript && !isListening) {
      // Process with NLP when speech recognition completes
      setProcessing(true);
      
      const result = nlpService.processInput(transcript, context);
      setNlpResult(result);
      
      // Call callbacks
      if (onTranscript) onTranscript(transcript);
      if (onIntent) onIntent(result);
      
      setProcessing(false);
      
      // Auto-restart listening after processing (if enabled)
      if (autoRestart) {
        setShouldAutoRestart(true);
      }
    }
  }, [transcript, isListening, context, onTranscript, onIntent, autoRestart]);

  // Auto-restart listening after a delay
  useEffect(() => {
    if (shouldAutoRestart && !isListening && !processing) {
      const timer = setTimeout(() => {
        resetTranscript();
        setNlpResult(null);
        startListening();
        setShouldAutoRestart(false);
      }, 3500); // Wait 3.5 seconds for system to finish speaking
      
      return () => clearTimeout(timer);
    }
  }, [shouldAutoRestart, isListening, processing, startListening, resetTranscript]);

  const handleStartListening = () => {
    resetTranscript();
    setNlpResult(null);
    startListening();
  };

  if (!isSupported) {
    return (
      <div className="voice-input-error" role="alert">
        Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.
      </div>
    );
  }

  return (
    <div className="voice-input-container">
      <button
        className={`voice-button ${isListening ? 'listening' : ''} ${processing ? 'processing' : ''}`}
        onClick={isListening ? stopListening : handleStartListening}
        aria-label={ariaLabel || 'Voice input button'}
        aria-pressed={isListening}
        type="button"
        disabled={processing}
      >
        {processing ? (
          <>
            <span className="mic-icon">⚙️</span>
            <span className="voice-button-text">Processing...</span>
          </>
        ) : isListening ? (
          <>
            <span className="mic-icon listening-icon">🎤</span>
            <span className="voice-button-text">Listening...</span>
          </>
        ) : (
          <>
            <span className="mic-icon">🎙️</span>
            <span className="voice-button-text">Click to Speak</span>
          </>
        )}
      </button>

      {isListening && interimTranscript && (
        <div className="interim-transcript" aria-live="polite">
          <span className="label">Hearing:</span> {interimTranscript}
        </div>
      )}

      {transcript && !isListening && (
        <div className="final-transcript" aria-live="polite">
          <span className="label">You said:</span> {transcript}
        </div>
      )}

      {nlpResult && (
        <div className="nlp-result" aria-live="polite">
          <div className="nlp-intent">
            <span className="label">Understood:</span> {nlpResult.response}
          </div>
          {nlpResult.confidence > 0 && (
            <div className="nlp-confidence">
              Confidence: {Math.round(nlpResult.confidence * 100)}%
            </div>
          )}
          {Object.keys(nlpResult.entities).length > 0 && (
            <div className="nlp-entities">
              <span className="label">Detected:</span>
              {Object.entries(nlpResult.entities).map(([key, value]) => (
                <span key={key} className="entity-badge">
                  {key}: {value}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="voice-error" role="alert">
          {error}
        </div>
      )}

      <div className="voice-hints" tabIndex="0">
        <details>
          <summary>💡 Voice Command Tips</summary>
          <div className="hints-content">
            {context === 'passenger-info' && (
              <ul>
                <li>Say your full name: "John Smith"</li>
                <li>Say "change name" to restart</li>
              </ul>
            )}
            {context === 'seat-selection' && (
              <ul>
                <li>Say seat number: "12A" or "Seat 12A"</li>
                <li>Describe preference: "Window seat in front row"</li>
                <li>Say: "Aisle seat", "Window seat", "Front row"</li>
              </ul>
            )}
            {context === 'payment' && (
              <ul>
                <li>Say "Confirm payment" to proceed</li>
                <li>Say OTP digits: "1 2 3 4 5 6"</li>
                <li>Or say: "One two three four five six"</li>
              </ul>
            )}
            {context === 'special-assistance' && (
              <ul>
                <li>Say "Wheelchair assistance"</li>
                <li>Say "Visual impairment support"</li>
                <li>Say "No assistance needed"</li>
              </ul>
            )}
            <li>Say "help" anytime for instructions</li>
          </div>
        </details>
      </div>
    </div>
  );
};

export default VoiceInputNLP;
