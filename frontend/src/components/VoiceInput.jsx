/**
 * Voice Input Component
 * Reusable component for voice input with visual feedback
 */

import React from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import '../styles/VoiceInput.css';

const VoiceInput = ({ onTranscript, placeholder, ariaLabel }) => {
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

  React.useEffect(() => {
    if (transcript && !isListening) {
      onTranscript(transcript);
    }
  }, [transcript, isListening, onTranscript]);

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
        className={`voice-button ${isListening ? 'listening' : ''}`}
        onClick={isListening ? stopListening : startListening}
        aria-label={ariaLabel || 'Voice input button'}
        aria-pressed={isListening}
        type="button"
      >
        {isListening ? (
          <span className="mic-icon listening-icon">🎤</span>
        ) : (
          <span className="mic-icon">🎙️</span>
        )}
        <span className="voice-button-text">
          {isListening ? 'Listening...' : 'Click to Speak'}
        </span>
      </button>

      {isListening && interimTranscript && (
        <div className="interim-transcript" aria-live="polite">
          Hearing: {interimTranscript}
        </div>
      )}

      {transcript && !isListening && (
        <div className="final-transcript" aria-live="polite">
          You said: {transcript}
        </div>
      )}

      {error && (
        <div className="voice-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
