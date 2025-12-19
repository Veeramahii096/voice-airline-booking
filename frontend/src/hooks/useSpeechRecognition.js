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
  const [status, setStatus] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef(null);
  const retryRef = useRef(0);
  const restartTimerRef = useRef(null);
  const lastRestartAtRef = useRef(0);
  const persistentRef = useRef(false); // when true, keep auto-restarting until explicitly disabled
  const manualRestartRef = useRef(false); // when true, prevent onend auto-restart

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
      setStatus('listening');
      // Always reset retry counter on start to allow continuous listening
      retryRef.current = 0;
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
        // successful final result — clear retry counter and status
        retryRef.current = 0;
        setStatus(null);
      }
    };
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);

      if (event.error === 'no-speech') {
        // If persistent mode is enabled, keep restarting indefinitely
        if (persistentRef.current) {
          console.log('No speech detected but persistent mode is ON — restarting immediately');
          setStatus('No speech detected — waiting for your voice.');
          clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            lastRestartAtRef.current = Date.now();
            if (recognitionRef.current && isListening) {
              try {
                recognitionRef.current.start();
                console.log('🔄 Restarted recognition (persistent mode)');
              } catch (e) {
                console.log('Recognition restart failed', e.message);
              }
            }
          }, 500);
          return;
        }

        retryRef.current = (retryRef.current || 0) + 1;
        console.log(`No speech detected (attempt ${retryRef.current})`);

        if (retryRef.current <= 3) {
          setStatus('No speech detected — please speak now.');
          // throttle rapid restarts
          const now = Date.now();
          const since = now - (lastRestartAtRef.current || 0);
          const cooldown = since < 700 ? 700 - since : 0;
          clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            lastRestartAtRef.current = Date.now();
            if (recognitionRef.current && isListening) {
              try {
                recognitionRef.current.start();
                console.log('🔄 Restarted recognition after no-speech');
              } catch (e) {
                console.log('Recognition restart failed', e.message);
              }
            }
          }, cooldown || 700);
        } else {
          // After several attempts, stop auto-restarting and prompt user
          setStatus('I still did not hear you — please check your microphone or click to retry.');
          setIsListening(false);
          try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
        }

        return;
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.');
        setIsListening(false);
        setStatus(null);
      } else if (event.error === 'aborted') {
        console.log('Recognition aborted (normal during restart)');
        return;
      } else {
        console.log(`Recognition error: ${event.error}, will retry...`);
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          if (recognitionRef.current && isListening) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.log('Could not restart after error');
            }
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      console.log('Voice recognition ended');
      // Check if manual restart is in progress - if so, don't auto-restart
      if (manualRestartRef.current) {
        console.log('⏭️ Manual restart in progress, skipping onend auto-restart');
        setInterimTranscript('');
        return;
      }
      // Auto-restart if still supposed to be listening and retry limit not reached
      if (isListening) {
        console.log('🔄 Recognition ended but should continue - considering restart...');
        // If persistent mode, always restart (ignore retry limit)
        if (persistentRef.current) {
          // Reset retry counter in persistent mode to keep going
          retryRef.current = 0;
          setTimeout(() => {
            if (recognitionRef.current && isListening && !manualRestartRef.current) {
              try {
                recognitionRef.current.start();
                console.log('✅ Auto-restart successful (persistent mode)');
              } catch (e) {
                console.log('⚠️ Could not auto-restart (persistent):', e.message);
              }
            }
          }, 300);
        } else {
          const attempts = retryRef.current || 0;
          if (attempts < 3) {
            setTimeout(() => {
              if (recognitionRef.current && isListening && !manualRestartRef.current) {
                try {
                  recognitionRef.current.start();
                  console.log('✅ Auto-restart successful');
                } catch (e) {
                  console.log('⚠️ Could not auto-restart:', e.message);
                }
              }
            }, 500);
          } else {
            console.log('Max no-speech retries reached; not auto-restarting.');
          }
        }
      }
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      setStatus('listening');
      retryRef.current = 0;
      
      try {
        console.log('🎤 Calling recognition.start()...');
        recognitionRef.current.start();
        console.log('✅ Recognition.start() called successfully');
        setIsListening(true);
        // reset retry counter when explicitly starting
        retryRef.current = 0;
      } catch (error) {
        console.error('❌ Error starting recognition:', error);
        // If already started, set state to listening anyway
        if (error.message && error.message.includes('already started')) {
          console.log('✅ Recognition already active, setting state');
          setIsListening(true);
        } else {
          setError('Failed to start voice recognition: ' + error.message);
        }
      }
    } else {
      console.error('❌ Recognition ref is null!');
      setError('Voice recognition not initialized');
    }
  };

  const enablePersistentListening = () => {
    persistentRef.current = true;
    console.log('Persistent listening ENABLED');
  };

  const disablePersistentListening = () => {
    persistentRef.current = false;
    console.log('Persistent listening DISABLED');
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      // Set state immediately before attempting stop
      setIsListening(false);
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
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
    enablePersistentListening,
    disablePersistentListening,
  };
};

export default useSpeechRecognition;
