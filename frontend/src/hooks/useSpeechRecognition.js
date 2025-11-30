/**
 * Voice Recognition Hook
 * Custom React hook for speech-to-text functionality
 */

import { useState, useEffect, useRef } from 'react';

const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser');
      return;
    }

    setIsSupported(true);

    // Initialize Speech Recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Changed to true for longer listening
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('Voice recognition started');
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);
      if (final) {
        setTranscript(prev => (prev + final).trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Handle no-speech error gracefully
      if (event.error === 'no-speech') {
        console.log('No speech detected, will retry...');
        setError('No speech detected. Please speak clearly.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.');
      } else {
        setError(`Error: ${event.error}`);
      }
      
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('Voice recognition ended');
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      // Stop any existing recognition first
      if (isListening) {
        console.log('⚠️ Already listening, stopping first...');
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Stop error (ignored):', e);
        }
      }
      
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      
      // Small delay to ensure clean start
      setTimeout(() => {
        try {
          console.log('🎤 Calling recognition.start()...');
          recognitionRef.current.start();
          console.log('✅ Recognition.start() called successfully');
        } catch (error) {
          console.error('❌ Error starting recognition:', error);
          // If already started, that's okay
          if (error.message && error.message.includes('already started')) {
            console.log('Recognition already active, continuing...');
          } else {
            setError('Failed to start voice recognition: ' + error.message);
          }
        }
      }, 100);
    } else {
      console.error('❌ Recognition ref is null!');
      setError('Voice recognition not initialized');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};

export default useSpeechRecognition;
