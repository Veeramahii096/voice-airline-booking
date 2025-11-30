/**
 * Complete Voice Booking Flow - Fully Voice Controlled
 * Bot speaks every instruction, waits for voice response
 * Blind-friendly, hands-free booking
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import speechService from '../utils/speechSynthesis';
import { processVoiceInput, resetConversation } from '../utils/pythonNlpService';
import '../styles/VoiceBooking.css';

const VoiceBooking = () => {
  const navigate = useNavigate();
  
  // Booking state
  const [currentScreen, setCurrentScreen] = useState('welcome'); // welcome, flight-search, review, passenger, seat, assistance, payment, confirmation
  const [bookingData, setBookingData] = useState({
    origin: '',
    destination: '',
    date: '',
    time: '',
    passengers: 1,
    fareType: 'Economy',
    totalAmount: 0,
    passengerName: '',
    email: '',
    phone: '',
    seatNumber: '',
    seatType: '',
    assistanceNeeded: false,
    assistanceType: '',
    paymentMethod: '',
    bookingId: '',
  });
  
  // Conversation state
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const shouldContinueListening = useRef(true);
  const [listeningEnabled, setListeningEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const [waitingForClick, setWaitingForClick] = useState(true);
  
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

  // Screen definitions with voice prompts
  const screens = {
    welcome: {
      title: 'Welcome to Voice Airline Booking',
      prompt: 'Welcome to Voice Airline Booking! This is a fully voice-controlled system. I will guide you through each step. To begin, say "start booking" or "book a flight". You can also say "help" at any time.',
      aria: 'Welcome screen. Say start booking to begin.'
    },
    'flight-search': {
      title: 'Flight Search',
      prompt: 'Let\'s find your flight. Where are you flying from? Say your departure city.',
      aria: 'Flight search. Provide your departure city.'
    },
    review: {
      title: 'Review and Checkout',
      prompt: 'Your flight is from {origin} to {destination} on {date} at {time}. {passengers} passenger, {fareType} class. Total amount is {totalAmount} rupees. Say "continue" to proceed with booking, or say "change" to modify details.',
      aria: 'Review your flight details.'
    },
    passenger: {
      title: 'Passenger Details',
      prompt: 'I need your passenger information. Please tell me your full name. Just say your first name and last name. For example, "Raj Kumar" or "Priya Singh".',
      aria: 'Passenger information screen. Provide your name.'
    },
    seat: {
      title: 'Seat Selection',
      prompt: 'Now let\'s select your seat. Would you like a window seat, aisle seat, or middle seat? You can also say a specific seat number like "ten C".',
      aria: 'Seat selection screen. Choose your seat preference.'
    },
    assistance: {
      title: 'Special Assistance',
      prompt: 'Do you need any special assistance? Say "wheelchair" for wheelchair assistance, "visual impairment" for visual support, "priority boarding", or say "no assistance" if you don\'t need any help.',
      aria: 'Special assistance options.'
    },
    payment: {
      title: 'Payment',
      prompt: 'Time to complete payment. Your total is {totalAmount} rupees. Available payment methods: Google Pay, Visa card, or UPI. Which payment method would you like to use?',
      aria: 'Payment screen. Select payment method.'
    },
    confirmation: {
      title: 'Booking Confirmed',
      prompt: 'Congratulations! Your booking is confirmed. Your booking ID is {bookingId}. Flying from {origin} to {destination} on {date}. Passenger: {passengerName}. Seat: {seatNumber}. Total paid: {totalAmount} rupees. Your ticket has been emailed to {email}. Say "hear itinerary" to hear your full details again, or say "finish" to end.',
      aria: 'Booking confirmation. Your booking is complete.'
    }
  };

  // Start voice on mount
  useEffect(() => {
    // Don't auto-start, wait for user click (browser audio policy)
    return () => {
      shouldContinueListening.current = false;
      stopListening();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleStartVoiceBooking = () => {
    console.log('🚀 Starting voice booking...');
    setShowStartButton(false);
    setAudioEnabled(true);
    setListeningEnabled(true);
    
    // Wait for voices to load, then speak
    const initSpeech = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('📢 Available voices:', voices.length);
      
      if (voices.length > 0) {
        console.log('✅ Voices loaded, starting welcome message...');
        setTimeout(() => {
          speakAndWait(screens.welcome.prompt);
          setCurrentPrompt(screens.welcome.prompt);
        }, 300);
      } else {
        console.warn('⚠️ No voices yet, retrying...');
        setTimeout(initSpeech, 300);
      }
    };
    
    // Handle voices loaded event
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        console.log('🔄 Voices changed event fired');
        initSpeech();
      };
    }
    
    initSpeech();
  };

  // Auto-start voice booking when component loads  
  useEffect(() => {
    if (!audioEnabled && showStartButton) {
      // Listen for any user interaction to start
      const handleInteraction = () => {
        if (!audioEnabled) {
          handleStartVoiceBooking();
        }
      };

      document.addEventListener('click', handleInteraction);
      document.addEventListener('keydown', handleInteraction);
      document.addEventListener('touchstart', handleInteraction);
      
      return () => {
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
      };
    }
  }, [audioEnabled, showStartButton]);

  // Process transcript when speech stops - FASTER response
  useEffect(() => {
    if (transcript && transcript.trim().length > 0 && !isProcessing && listeningEnabled) {
      // Debounce to wait for complete sentence (1.5 seconds of silence)
      const timer = setTimeout(() => {
        if (transcript.trim().length > 0) {
          console.log('🎯 Processing transcript:', transcript);
          handleVoiceInput(transcript);
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [transcript, listeningEnabled, isProcessing]);

  // Handle no-speech error - automatically restart listening
  useEffect(() => {
    if (error && error.includes('no-speech') && listeningEnabled && !isProcessing) {
      console.log('⚠️ No speech detected, restarting listening in 2 seconds...');
      setTimeout(() => {
        if (shouldContinueListening.current && currentScreen !== 'confirmation') {
          console.log('🔄 Restarting after no-speech error...');
          resetTranscript();
          startListening();
        }
      }, 2000);
    }
  }, [error, listeningEnabled, isProcessing]);

  // Watchdog: Ensure listening is active when it should be
  useEffect(() => {
    if (listeningEnabled && !isListening && !isProcessing && currentScreen !== 'confirmation' && audioEnabled) {
      // Check if bot is currently speaking
      if (window.speechSynthesis.speaking) {
        console.log('🔇 Bot is speaking, not starting listening yet');
        return;
      }
      
      console.log('🐕 WATCHDOG: Should be listening but not active - restarting...');
      const watchdogTimer = setTimeout(() => {
        if (listeningEnabled && !isListening && !isProcessing && audioEnabled) {
          console.log('🔄 WATCHDOG: Force restarting listening...');
          try {
            startListening();
          } catch (e) {
            console.error('Watchdog restart failed:', e);
          }
        }
      }, 2000);
      
      return () => clearTimeout(watchdogTimer);
    }
  }, [listeningEnabled, isListening, isProcessing, currentScreen, audioEnabled]);

  const speakAndWait = async (text, delay = 5000) => {
    const formattedText = formatPrompt(text);
    addMessage('bot', formattedText);
    
    console.log('🔊 Speaking:', formattedText);
    
    // Only cancel if NOT currently speaking (to avoid interrupting active speech)
    if (window.speechSynthesis.speaking) {
      console.log('⏳ Speech already active, waiting for it to finish...');
      // Wait for current speech to finish
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }
    
    console.log('🗑️ Canceling any queued speech...');
    window.speechSynthesis.cancel();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Stop listening before speaking
    if (isListening) {
      console.log('🛑 Stopping listening before speaking...');
      stopListening();
      setListeningEnabled(false);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
      // Get voices
      const voices = window.speechSynthesis.getVoices();
      console.log('📢 Available voices:', voices.length);
      
      if (voices.length === 0) {
        console.error('❌ No voices available!');
        return;
      }
      
      // Find best English voice
      const englishVoice = 
        voices.find(v => v.lang === 'en-US') ||
        voices.find(v => v.lang === 'en-GB') ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0];
      
      console.log('🎤 Selected voice:', englishVoice.name, 'Lang:', englishVoice.lang);
      
      // Create utterance with explicit settings
      const utterance = new SpeechSynthesisUtterance(formattedText);
      utterance.voice = englishVoice;
      utterance.rate = 1.1; // Faster speech for quicker responses
      utterance.pitch = 1.0;
      utterance.volume = 1.0; // Maximum volume
      utterance.lang = englishVoice.lang;
      
      console.log('📣 Calling speechSynthesis.speak()...');
      
      // Speak with promise
      return new Promise((resolve) => {
        utterance.onstart = () => {
          console.log('🔊 Speech STARTED');
          console.log('🔍 Is speaking?', window.speechSynthesis.speaking);
          console.log('🔍 Is pending?', window.speechSynthesis.pending);
        };
        
        utterance.onend = () => {
          console.log('✅ Speech FINISHED');
          console.log('📊 State: screen=' + currentScreen + ', listeningEnabled=' + listeningEnabled + ', isListening=' + isListening);
          
          // Wait for speech synthesis to completely finish
          const checkSpeakingDone = () => {
            if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
              console.log('⏳ Speech still active, waiting...');
              setTimeout(checkSpeakingDone, 200);
              return;
            }
            
            // Start listening after speech - reduced delay for faster response
            const listeningDelay = 800; // Fast response - 0.8 second delay
            console.log(`⏱️ Waiting ${listeningDelay}ms before listening...`);
            setTimeout(() => {
              if (shouldContinueListening.current && currentScreen !== 'confirmation') {
                // Double-check speech is not active
                if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
                  console.log('⚠️ Speech still active, delaying listening start...');
                  setTimeout(() => {
                    if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
                      startListeningNow();
                    }
                  }, 1000);
                } else {
                  startListeningNow();
                }
              } else {
                console.log('⛔ Not starting listening: shouldContinue=' + shouldContinueListening.current + ', screen=' + currentScreen);
              }
              resolve();
            }, listeningDelay);
          };
          
          const startListeningNow = () => {
            console.log('🎤 Starting to listen NOW...');
            console.log('📊 Before start: isListening=' + isListening + ', listeningEnabled=' + listeningEnabled);
            resetTranscript();
            setListeningEnabled(true);
            try {
              startListening();
              console.log('✅ startListening() called');
            } catch (e) {
              console.error('❌ Failed to start listening:', e);
            }
          };
          
          checkSpeakingDone();
        };
        
        utterance.onerror = (error) => {
          console.error('❌ Speech ERROR:', error);
          console.error('Error details:', error.error, error.charIndex);
          // Don't alert, just log and resolve
          resolve();
        };
        
        console.log('📣 Calling speechSynthesis.speak()...');
        window.speechSynthesis.speak(utterance);
        console.log('✅ Utterance queued');
        
        // Check if actually speaking
        setTimeout(() => {
          console.log('🔍 Is speaking?', window.speechSynthesis.speaking);
          console.log('🔍 Is pending?', window.speechSynthesis.pending);
        }, 200);
      });
    } catch (error) {
      console.error('❌ speakAndWait error:', error);
      return Promise.resolve();
    }
  };

  const formatPrompt = (text) => {
    return text
      .replace('{origin}', bookingData.origin || 'your departure city')
      .replace('{destination}', bookingData.destination || 'your destination')
      .replace('{date}', bookingData.date || 'your travel date')
      .replace('{time}', bookingData.time || 'departure time')
      .replace('{passengers}', bookingData.passengers)
      .replace('{fareType}', bookingData.fareType)
      .replace('{totalAmount}', bookingData.totalAmount)
      .replace('{passengerName}', bookingData.passengerName)
      .replace('{email}', bookingData.email)
      .replace('{seatNumber}', bookingData.seatNumber)
      .replace('{bookingId}', bookingData.bookingId);
  };

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
    setListeningEnabled(false);
    stopListening();
    addMessage('user', userInput);
    
    const input = userInput.toLowerCase().trim();
    
    try {
      // Process based on current screen
      switch (currentScreen) {
        case 'welcome':
          await handleWelcomeInput(input);
          break;
        case 'flight-search':
          await handleFlightSearchInput(input);
          break;
        case 'review':
          await handleReviewInput(input);
          break;
        case 'passenger':
          await handlePassengerInput(input);
          break;
        case 'seat':
          await handleSeatInput(input);
          break;
        case 'assistance':
          await handleAssistanceInput(input);
          break;
        case 'payment':
          await handlePaymentInput(input);
          break;
        case 'confirmation':
          await handleConfirmationInput(input);
          break;
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      speakAndWait('Sorry, I didn\'t understand that. Let me repeat. ' + currentPrompt, 4000);
    } finally {
      setIsProcessing(false);
      resetTranscript();
    }
  };

  const handleWelcomeInput = async (input) => {
    if (input.includes('start') || input.includes('book') || input.includes('begin')) {
      setCurrentScreen('flight-search');
      const prompt = screens['flight-search'].prompt;
      setCurrentPrompt(prompt);
      speakAndWait(prompt, 4000);
    } else if (input.includes('help')) {
      speakAndWait('This is a voice-only booking system. Just speak your answers when I ask questions. Say "start booking" to begin your flight reservation.', 5000);
    } else {
      speakAndWait('I didn\'t catch that. Please say "start booking" to begin, or say "help" for assistance.', 4000);
    }
  };

  const handleFlightSearchInput = async (input) => {
    // Multi-step flight search
    if (!bookingData.origin) {
      // Extract origin
      const origin = extractCity(input);
      if (origin) {
        setBookingData(prev => ({ ...prev, origin }));
        speakAndWait(`Great! Flying from ${origin}. Now, where are you flying to? Say your destination city.`, 4000);
      } else {
        speakAndWait('I didn\'t catch the city name. Please say your departure city clearly, like "Chennai" or "Mumbai".', 4000);
      }
    } else if (!bookingData.destination) {
      // Extract destination
      const destination = extractCity(input);
      if (destination) {
        setBookingData(prev => ({ ...prev, destination }));
        speakAndWait(`Perfect! From ${bookingData.origin} to ${destination}. When would you like to travel? Say the date, like "twenty first March" or "tomorrow".`, 5000);
      } else {
        speakAndWait('Please say your destination city.', 3000);
      }
    } else if (!bookingData.date) {
      // Extract date
      const date = extractDate(input);
      if (date) {
        setBookingData(prev => ({ ...prev, date, time: '10:30 AM', totalAmount: 28500 }));
        setCurrentScreen('review');
        const prompt = screens.review.prompt;
        setCurrentPrompt(prompt);
        speakAndWait(prompt, 8000);
      } else {
        speakAndWait('I need a travel date. Please say the date, like "March twenty first" or "next Monday".', 4000);
      }
    }
  };

  const handleReviewInput = async (input) => {
    if (input.includes('continue') || input.includes('proceed') || input.includes('yes') || input.includes('confirm')) {
      setCurrentScreen('passenger');
      const prompt = screens.passenger.prompt;
      setCurrentPrompt(prompt);
      speakAndWait(prompt, 4000);
    } else if (input.includes('change') || input.includes('modify')) {
      setBookingData(prev => ({ ...prev, origin: '', destination: '', date: '' }));
      setCurrentScreen('flight-search');
      speakAndWait('Okay, let\'s start over. Where are you flying from?', 3000);
    } else {
      speakAndWait('Say "continue" to proceed with booking, or "change" to modify your flight details.', 4000);
    }
  };

  const handlePassengerInput = async (input) => {
    if (!bookingData.passengerName) {
      const name = extractName(input);
      if (name) {
        setBookingData(prev => ({ ...prev, passengerName: name }));
        speakAndWait(`Thank you ${name}. Now I need your email address. Please speak your email slowly and clearly. Say it like: "john at gmail dot com" or "priya at yahoo dot com".`, 6000);
      } else {
        speakAndWait('I did not catch your name. Please say your first name and last name clearly. For example, say "Raj Kumar" or just "Raj".', 4000);
      }
    } else if (!bookingData.email) {
      const email = extractEmail(input);
      if (email) {
        setBookingData(prev => ({ ...prev, email, phone: '9876543210' }));
        setCurrentScreen('seat');
        const prompt = screens.seat.prompt;
        setCurrentPrompt(prompt);
        speakAndWait(prompt, 6000);
      } else {
        speakAndWait('I need a valid email address. Please say it slowly: username, then "at", then domain, then "dot com". For example: "raj at gmail dot com".', 5000);
      }
    }
  };

  const handleSeatInput = async (input) => {
    const seat = extractSeat(input);
    if (seat) {
      setBookingData(prev => ({ ...prev, seatNumber: seat.number, seatType: seat.type }));
      setCurrentScreen('assistance');
      const prompt = screens.assistance.prompt;
      setCurrentPrompt(prompt);
      speakAndWait(prompt, 7000);
    } else {
      speakAndWait('Please tell me your seat preference: window, aisle, or middle. Or say a specific seat like "ten C".', 5000);
    }
  };

  const handleAssistanceInput = async (input) => {
    if (input.includes('no') || input.includes('not needed') || input.includes('don\'t need') || input.includes('none')) {
      setBookingData(prev => ({ ...prev, assistanceNeeded: false }));
      speakAndWait('No special assistance. Moving to payment.', 2000);
      setTimeout(() => {
        setCurrentScreen('payment');
        const prompt = screens.payment.prompt;
        setCurrentPrompt(prompt);
        speakAndWait(prompt, 6000);
      }, 2500);
    } else if (input.includes('wheelchair')) {
      setBookingData(prev => ({ ...prev, assistanceNeeded: true, assistanceType: 'Wheelchair' }));
      speakAndWait('Wheelchair assistance added. Moving to payment.', 2000);
      setTimeout(() => {
        setCurrentScreen('payment');
        const prompt = screens.payment.prompt;
        setCurrentPrompt(prompt);
        speakAndWait(prompt, 6000);
      }, 2500);
    } else if (input.includes('visual') || input.includes('blind')) {
      setBookingData(prev => ({ ...prev, assistanceNeeded: true, assistanceType: 'Visual Impairment Support' }));
      speakAndWait('Visual impairment support added. Moving to payment.', 2000);
      setTimeout(() => {
        setCurrentScreen('payment');
        const prompt = screens.payment.prompt;
        setCurrentPrompt(prompt);
        speakAndWait(prompt, 6000);
      }, 2500);
    } else if (input.includes('priority')) {
      setBookingData(prev => ({ ...prev, assistanceNeeded: true, assistanceType: 'Priority Boarding' }));
      speakAndWait('Priority boarding added. Moving to payment.', 2000);
      setTimeout(() => {
        setCurrentScreen('payment');
        const prompt = screens.payment.prompt;
        setCurrentPrompt(prompt);
        speakAndWait(prompt, 6000);
      }, 2500);
    } else {
      speakAndWait('Please say "wheelchair", "visual impairment", "priority boarding", or "no assistance".', 5000);
    }
  };

  const handlePaymentInput = async (input) => {
    if (input.includes('google pay') || input.includes('google')) {
      setBookingData(prev => ({ ...prev, paymentMethod: 'Google Pay' }));
      speakAndWait('Google Pay selected. Processing payment... Please wait.', 4000);
      setTimeout(() => completeBooking(), 4000);
    } else if (input.includes('visa') || input.includes('card')) {
      setBookingData(prev => ({ ...prev, paymentMethod: 'Visa Card' }));
      speakAndWait('Visa card selected. Processing payment... Please wait.', 4000);
      setTimeout(() => completeBooking(), 4000);
    } else if (input.includes('upi')) {
      setBookingData(prev => ({ ...prev, paymentMethod: 'UPI' }));
      speakAndWait('UPI selected. Processing payment... Please wait.', 4000);
      setTimeout(() => completeBooking(), 4000);
    } else {
      speakAndWait('Please say "Google Pay", "Visa card", or "UPI" to select your payment method.', 4000);
    }
  };

  const completeBooking = () => {
    const bookingId = 'ABC' + Math.floor(Math.random() * 1000);
    setBookingData(prev => ({ ...prev, bookingId }));
    setCurrentScreen('confirmation');
    const prompt = screens.confirmation.prompt;
    setCurrentPrompt(prompt);
    speakAndWait(prompt, 12000);
  };

  const handleConfirmationInput = async (input) => {
    if (input.includes('hear') || input.includes('itinerary') || input.includes('repeat')) {
      speakAndWait(currentPrompt, 12000);
    } else if (input.includes('finish') || input.includes('done') || input.includes('exit')) {
      speakAndWait('Thank you for booking with us! Have a great flight! Goodbye.', 4000);
      shouldContinueListening.current = false;
      setTimeout(() => navigate('/'), 4000);
    } else {
      speakAndWait('Say "hear itinerary" to hear your booking details again, or "finish" to end.', 5000);
    }
  };

  // Helper functions
  const extractCity = (input) => {
    const cities = ['chennai', 'singapore', 'mumbai', 'delhi', 'bangalore', 'hyderabad', 'kolkata', 'london', 'dubai', 'new york'];
    const found = cities.find(city => input.includes(city));
    return found ? found.charAt(0).toUpperCase() + found.slice(1) : null;
  };

  const extractDate = (input) => {
    if (input.includes('tomorrow')) return 'Tomorrow';
    if (input.includes('today')) return 'Today';
    if (input.includes('march') || input.includes('21')) return '21 Mar';
    return '21 Mar'; // Default
  };

  const extractName = (input) => {
    // Remove common phrases and clean input
    const cleaned = input.replace(/my name is|i am|this is|called|it's|its/gi, '').trim();
    const words = cleaned.split(' ').filter(w => w.length > 1);
    
    // Take first 2-3 meaningful words as name
    if (words.length === 1 && words[0].length > 2) {
      // Single name given, capitalize it
      return words[0].charAt(0).toUpperCase() + words[0].slice(1);
    } else if (words.length >= 2) {
      // Multiple words, take first 2 and capitalize
      return words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    return null;
  };

  const extractEmail = (input) => {
    const normalized = input.replace(/ at /g, '@').replace(/ dot /g, '.').replace(/\s/g, '');
    return normalized.includes('@') ? normalized : null;
  };

  const extractSeat = (input) => {
    if (input.includes('window')) {
      return { number: '10A', type: 'Window' };
    } else if (input.includes('aisle')) {
      return { number: '10C', type: 'Aisle' };
    } else if (input.includes('middle')) {
      return { number: '10B', type: 'Middle' };
    }
    // Extract specific seat
    const match = input.match(/(\d+)\s*([a-f])/i);
    if (match) {
      return { number: match[1] + match[2].toUpperCase(), type: 'Selected' };
    }
    return null;
  };

  if (!isSupported) {
    return (
      <div className="voice-booking-container">
        <div className="error-message" role="alert">
          Voice recognition not supported. Please use Chrome, Edge, or Safari.
        </div>
      </div>
    );
  }

  return (
    <div className="voice-booking-container" role="main" aria-label={screens[currentScreen].aria}>
      {/* Screen Header */}
      <header className="booking-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/')}
          aria-label="Go back to home"
        >
          ← Back
        </button>
        <h1>{screens[currentScreen].title}</h1>
      </header>

      {/* Voice Status */}
      <div className="voice-status-large" role="status" aria-live="polite">
        {showStartButton ? (
          <div className="start-voice-prompt">
            <div className="speaker-icon-large" aria-hidden="true">🔊</div>
            <h2>Voice Booking System</h2>
            <p style={{ fontSize: '20px', marginBottom: '30px' }}>
              Fully accessible for blind users - Bot speaks every instruction
            </p>
            <button 
              className="start-voice-button"
              onClick={handleStartVoiceBooking}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStartVoiceBooking();
                }
              }}
              autoFocus
              tabIndex={0}
              aria-label="Start voice-controlled booking. Press Enter or Space to activate. Bot will speak all instructions."
              style={{
                padding: '30px 60px',
                fontSize: '24px',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: '3px solid #fff',
                borderRadius: '15px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                animation: 'pulse 2s infinite'
              }}
            >
              🎙️ PRESS ENTER TO START
            </button>
            <p style={{ marginTop: '30px', fontSize: '22px', fontWeight: 'bold' }}>
              👆 Press ENTER, SPACE, or CLICK to begin
            </p>
          </div>
        ) : isListening ? (
          <div className="status-listening">
            <div className="mic-icon-large pulsing">🎤</div>
            <p>Listening...</p>
            {interimTranscript && <p className="interim">"{interimTranscript}"</p>}
          </div>
        ) : isProcessing ? (
          <div className="status-processing">
            <div className="loader-icon">⚙️</div>
            <p>Processing your response...</p>
          </div>
        ) : (
          <div className="status-idle">
            <div className="speaker-icon">🔊</div>
            <p>Bot is speaking...</p>
          </div>
        )}
      </div>

      {/* Current Screen Visual */}
      <div className="screen-visual">
        {currentScreen === 'welcome' && (
          <div className="welcome-visual">
            <div className="icon-large">✈️</div>
            <p>Voice-Controlled Flight Booking</p>
          </div>
        )}
        
        {currentScreen === 'flight-search' && (
          <div className="search-visual">
            <div className="route-display">
              <div className="city">{bookingData.origin || '___'}</div>
              <div className="arrow">→</div>
              <div className="city">{bookingData.destination || '___'}</div>
            </div>
            {bookingData.date && <p className="date">{bookingData.date}</p>}
          </div>
        )}
        
        {currentScreen === 'review' && (
          <div className="review-visual">
            <h2>Review and Checkout</h2>
            <div className="flight-info">
              <p>✈️ {bookingData.origin} → {bookingData.destination}</p>
              <p>📅 {bookingData.date}, {bookingData.time}</p>
              <p>💺 {bookingData.fareType} | {bookingData.passengers} Adult</p>
              <p className="total">Total: ₹{bookingData.totalAmount}</p>
            </div>
          </div>
        )}
        
        {currentScreen === 'passenger' && (
          <div className="passenger-visual">
            <h2>Passenger Details</h2>
            {bookingData.passengerName && <p>👤 {bookingData.passengerName}</p>}
            {bookingData.email && <p>✉️ {bookingData.email}</p>}
          </div>
        )}
        
        {currentScreen === 'seat' && (
          <div className="seat-visual">
            <div className="seat-icon-large">💺</div>
            <p>Select your seat preference</p>
            {bookingData.seatNumber && <p className="selected">Selected: {bookingData.seatNumber}</p>}
          </div>
        )}
        
        {currentScreen === 'assistance' && (
          <div className="assistance-visual">
            <div className="assist-icons">
              <span>♿</span>
              <span>👁️</span>
              <span>🎯</span>
            </div>
            <p>Special Assistance Options</p>
          </div>
        )}
        
        {currentScreen === 'payment' && (
          <div className="payment-visual">
            <h2>Payment</h2>
            <p className="amount">₹{bookingData.totalAmount}</p>
            <div className="payment-methods">
              <div className="method">💳 Visa</div>
              <div className="method">🟢 Google Pay</div>
              <div className="method">📱 UPI</div>
            </div>
            {isListening && <p className="listening-text">Listening...</p>}
          </div>
        )}
        
        {currentScreen === 'confirmation' && (
          <div className="confirmation-visual">
            <div className="success-icon">✅</div>
            <h2>Booking Confirmed!</h2>
            <p className="booking-id">{bookingData.bookingId}</p>
            <div className="booking-details">
              <p>✈️ {bookingData.origin} → {bookingData.destination}</p>
              <p>👤 {bookingData.passengerName}</p>
              <p>💺 {bookingData.seatNumber}</p>
              <p>📧 {bookingData.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Conversation History (Hidden for screen readers, visible for sighted users) */}
      <div className="conversation-log" aria-hidden="true">
        {conversationHistory.slice(-4).map((msg, index) => (
          <div key={index} className={`msg ${msg.type}`}>
            <span className="icon">{msg.type === 'bot' ? '🤖' : '👤'}</span>
            <span className="text">{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Accessibility Info */}
      <div className="a11y-info" role="status" aria-live="polite" aria-atomic="true">
        {currentPrompt}
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceBooking;
