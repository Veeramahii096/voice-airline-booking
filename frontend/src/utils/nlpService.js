/**
 * NLP Service - Natural Language Processing for Voice Commands
 * Handles intent recognition, entity extraction, and conversational flow
 */

class NLPService {
  constructor() {
    this.intents = {
      // Greetings and general intents
      GREETING: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
      
      // Booking intents
      START_BOOKING: ['start booking', 'book flight', 'start checkout', 'voice checkout', 'begin booking'],
      CONFIRM_BOOKING: ['confirm', 'yes', 'proceed', 'continue', 'ok', 'confirm booking'],
      CANCEL_BOOKING: ['cancel', 'no', 'stop', 'exit', 'go back'],
      
      // Passenger info intents
      PROVIDE_NAME: [], // Dynamic - any name input
      CHANGE_NAME: ['change name', 'edit name', 'wrong name', 'correct name'],
      
      // Seat selection intents
      SELECT_SEAT: ['seat', 'choose seat', 'pick seat', 'want seat'],
      WINDOW_SEAT: ['window', 'window seat', 'seat by window', 'near window'],
      AISLE_SEAT: ['aisle', 'aisle seat', 'aisle side', 'near aisle'],
      MIDDLE_SEAT: ['middle', 'middle seat', 'center seat'],
      FRONT_ROW: ['front', 'front row', 'front seat', 'near front'],
      BACK_ROW: ['back', 'back row', 'rear', 'back seat'],
      
      // Special assistance intents
      NEED_WHEELCHAIR: ['wheelchair', 'need wheelchair', 'mobility assistance', 'wheelchair access'],
      NEED_VISUAL_AID: ['blind', 'visual impairment', 'cant see', 'vision assistance', 'visually impaired'],
      NEED_HEARING_AID: ['deaf', 'hearing impaired', 'cant hear', 'hearing assistance'],
      NO_ASSISTANCE: ['no assistance', 'dont need help', 'no help needed', 'im fine'],
      
      // Payment intents
      CONFIRM_PAYMENT: ['confirm payment', 'pay now', 'proceed to pay', 'make payment', 'complete payment'],
      CHANGE_PAYMENT_METHOD: ['change payment', 'different payment', 'another method'],
      ENTER_OTP: [], // Dynamic - OTP numbers
      
      // General intents
      HELP: ['help', 'need help', 'what can i do', 'how does this work', 'instructions'],
      REPEAT: ['repeat', 'say again', 'didnt hear', 'what did you say'],
      RESTART: ['restart', 'start over', 'begin again', 'reset'],
    };
    
    // Entity patterns
    this.entityPatterns = {
      NAME: /^[A-Za-z]{2,}\s+[A-Za-z]{2,}/, // First Last name
      SEAT_NUMBER: /(\d{1,2})\s*([A-C])/i, // 12A, 12 A, etc.
      OTP: /\b\d{6}\b/, // 6-digit OTP
      PHONE: /\b\d{10}\b/, // 10-digit phone
      EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    };
  }

  /**
   * Process user input and extract intent and entities
   * @param {string} input - User's voice/text input
   * @param {string} context - Current page/context (passenger-info, seat-selection, etc.)
   * @returns {Object} - { intent, entities, confidence, response }
   */
  processInput(input, context = 'general') {
    if (!input || typeof input !== 'string') {
      return {
        intent: 'UNKNOWN',
        entities: {},
        confidence: 0,
        response: 'I didn\'t understand that. Please try again.'
      };
    }

    const normalizedInput = input.toLowerCase().trim();
    
    // Extract entities first
    const entities = this.extractEntities(normalizedInput, context);
    
    // Detect intent
    const intent = this.detectIntent(normalizedInput, context, entities);
    
    // Generate response
    const response = this.generateResponse(intent, entities, context);
    
    return {
      intent: intent.name,
      entities,
      confidence: intent.confidence,
      response,
      action: this.getAction(intent.name, entities, context)
    };
  }

  /**
   * Detect intent from user input
   */
  detectIntent(input, context, entities) {
    let highestScore = 0;
    let detectedIntent = 'UNKNOWN';

    // Context-specific intent detection
    if (context === 'passenger-info' && entities.name) {
      return { name: 'PROVIDE_NAME', confidence: 0.95 };
    }

    if (context === 'seat-selection' && entities.seatNumber) {
      return { name: 'SELECT_SEAT', confidence: 0.95 };
    }

    if (context === 'payment' && entities.otp) {
      return { name: 'ENTER_OTP', confidence: 0.95 };
    }

    // Intent matching by keywords
    for (const [intentName, keywords] of Object.entries(this.intents)) {
      for (const keyword of keywords) {
        if (input.includes(keyword)) {
          const score = this.calculateMatchScore(input, keyword);
          if (score > highestScore) {
            highestScore = score;
            detectedIntent = intentName;
          }
        }
      }
    }

    // Fuzzy matching for seat preferences
    if (context === 'seat-selection') {
      if (input.match(/window|near.*window|by.*window/)) {
        return { name: 'WINDOW_SEAT', confidence: 0.9 };
      }
      if (input.match(/aisle|near.*aisle|by.*aisle/)) {
        return { name: 'AISLE_SEAT', confidence: 0.9 };
      }
      if (input.match(/front|forward|front.*row/)) {
        return { name: 'FRONT_ROW', confidence: 0.85 };
      }
    }

    return {
      name: detectedIntent,
      confidence: highestScore
    };
  }

  /**
   * Extract entities from input
   */
  extractEntities(input, context) {
    const entities = {};

    // Extract name (context: passenger-info)
    if (context === 'passenger-info') {
      const nameMatch = input.match(this.entityPatterns.NAME);
      if (nameMatch) {
        entities.name = this.capitalizeName(nameMatch[0]);
      } else if (input.length > 2 && !this.isCommand(input)) {
        // Assume entire input is name if not a command
        entities.name = this.capitalizeName(input);
      }
    }

    // Extract seat number
    const seatMatch = input.match(this.entityPatterns.SEAT_NUMBER);
    if (seatMatch) {
      entities.seatNumber = `${seatMatch[1]}${seatMatch[2].toUpperCase()}`;
    }

    // Extract seat preferences
    if (input.includes('window')) entities.seatPreference = 'window';
    if (input.includes('aisle')) entities.seatPreference = 'aisle';
    if (input.includes('middle')) entities.seatPreference = 'middle';
    
    // Extract row preferences
    if (input.match(/front|forward/)) entities.rowPreference = 'front';
    if (input.match(/back|rear/)) entities.rowPreference = 'back';

    // Extract OTP
    const otpMatch = input.match(this.entityPatterns.OTP);
    if (otpMatch) {
      entities.otp = otpMatch[0];
    } else if (context === 'payment') {
      // Try to extract OTP from spoken numbers
      entities.otp = this.extractSpokenOTP(input);
    }

    // Extract assistance needs
    if (input.match(/wheelchair|mobility/)) entities.assistance = 'wheelchair';
    if (input.match(/blind|visual|sight/)) entities.assistance = 'visual';
    if (input.match(/deaf|hearing/)) entities.assistance = 'hearing';

    return entities;
  }

  /**
   * Extract OTP from spoken numbers (e.g., "one two three four five six")
   */
  extractSpokenOTP(input) {
    const numberWords = {
      'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
      'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
      'oh': '0'
    };

    const words = input.toLowerCase().split(/\s+/);
    let otp = '';

    for (const word of words) {
      if (numberWords[word]) {
        otp += numberWords[word];
      }
    }

    return otp.length === 6 ? otp : null;
  }

  /**
   * Generate smart seat recommendation based on preferences
   */
  generateSeatRecommendation(entities) {
    const availableSeats = [
      '1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C',
      '10A', '10B', '10C', '11A', '11B', '11C', '12A', '12B', '12C'
    ];

    let recommendedSeats = availableSeats;

    // Filter by seat preference (A=Window, B=Middle, C=Aisle)
    if (entities.seatPreference === 'window') {
      recommendedSeats = recommendedSeats.filter(s => s.endsWith('A'));
    } else if (entities.seatPreference === 'aisle') {
      recommendedSeats = recommendedSeats.filter(s => s.endsWith('C'));
    } else if (entities.seatPreference === 'middle') {
      recommendedSeats = recommendedSeats.filter(s => s.endsWith('B'));
    }

    // Filter by row preference
    if (entities.rowPreference === 'front') {
      recommendedSeats = recommendedSeats.filter(s => parseInt(s) <= 3);
    } else if (entities.rowPreference === 'back') {
      recommendedSeats = recommendedSeats.filter(s => parseInt(s) >= 10);
    }

    return recommendedSeats.length > 0 ? recommendedSeats[0] : availableSeats[0];
  }

  /**
   * Generate contextual response
   */
  generateResponse(intent, entities, context) {
    const responses = {
      GREETING: "Hello! Welcome to Voice Airline Booking. Say 'Start voice checkout' to begin your booking.",
      START_BOOKING: "Great! Let's start your booking. Please tell me your name.",
      PROVIDE_NAME: entities.name ? `Thank you, ${entities.name}. Now, let's select your seat.` : "I didn't catch your name. Please say your full name.",
      SELECT_SEAT: entities.seatNumber ? `Seat ${entities.seatNumber} selected.` : "Which seat would you like?",
      WINDOW_SEAT: `I'll find you a window seat. ${this.generateSeatFromPreference(entities)}`,
      AISLE_SEAT: `I'll find you an aisle seat. ${this.generateSeatFromPreference(entities)}`,
      FRONT_ROW: `Looking for front row seats. ${this.generateSeatFromPreference(entities)}`,
      CONFIRM_PAYMENT: "Confirming your payment. Please wait...",
      ENTER_OTP: entities.otp ? `OTP ${entities.otp} received. Verifying...` : "Please say your 6-digit OTP.",
      NEED_WHEELCHAIR: "Wheelchair assistance will be arranged for you.",
      NEED_VISUAL_AID: "Visual impairment assistance will be provided.",
      NO_ASSISTANCE: "No special assistance needed. Proceeding to payment.",
      HELP: this.getHelpMessage(context),
      REPEAT: this.getRepeatMessage(context),
      UNKNOWN: "I didn't understand that. " + this.getHelpMessage(context)
    };

    return responses[intent.name] || responses.UNKNOWN;
  }

  /**
   * Generate seat recommendation message
   */
  generateSeatFromPreference(entities) {
    const seat = this.generateSeatRecommendation(entities);
    return `How about seat ${seat}? Say 'yes' to confirm or tell me a different seat.`;
  }

  /**
   * Get context-specific help message
   */
  getHelpMessage(context) {
    const helpMessages = {
      'welcome': 'Say "Start booking" to begin your flight booking.',
      'passenger-info': 'Please tell me your full name, for example: "John Smith".',
      'seat-selection': 'You can say a seat number like "12A" or describe your preference like "window seat in front row".',
      'special-assistance': 'Tell me if you need wheelchair, visual, or hearing assistance.',
      'payment': 'Say "Confirm payment" to proceed, then enter your OTP.',
      'general': 'You can say "help" at any time for instructions.'
    };

    return helpMessages[context] || helpMessages.general;
  }

  /**
   * Get repeat message for context
   */
  getRepeatMessage(context) {
    // This should repeat the last system message (implement in component)
    return "Let me repeat that...";
  }

  /**
   * Get action to perform based on intent
   */
  getAction(intent, entities, context) {
    const actions = {
      START_BOOKING: { type: 'NAVIGATE', target: '/passenger-info' },
      PROVIDE_NAME: { type: 'SET_NAME', value: entities.name },
      SELECT_SEAT: { type: 'SET_SEAT', value: entities.seatNumber || this.generateSeatRecommendation(entities) },
      WINDOW_SEAT: { type: 'SET_SEAT', value: this.generateSeatRecommendation({ ...entities, seatPreference: 'window' }) },
      AISLE_SEAT: { type: 'SET_SEAT', value: this.generateSeatRecommendation({ ...entities, seatPreference: 'aisle' }) },
      FRONT_ROW: { type: 'SET_SEAT', value: this.generateSeatRecommendation({ ...entities, rowPreference: 'front' }) },
      CONFIRM_PAYMENT: { type: 'PROCEED_PAYMENT' },
      ENTER_OTP: { type: 'VERIFY_OTP', value: entities.otp },
      NEED_WHEELCHAIR: { type: 'ADD_ASSISTANCE', value: 'wheelchair' },
      NEED_VISUAL_AID: { type: 'ADD_ASSISTANCE', value: 'visual' },
      HELP: { type: 'SHOW_HELP' },
      RESTART: { type: 'NAVIGATE', target: '/' }
    };

    return actions[intent] || { type: 'NONE' };
  }

  /**
   * Calculate match score for intent
   */
  calculateMatchScore(input, keyword) {
    if (input === keyword) return 1.0;
    if (input.includes(keyword)) return 0.8;
    
    // Simple word overlap scoring
    const inputWords = input.split(/\s+/);
    const keywordWords = keyword.split(/\s+/);
    const overlap = inputWords.filter(w => keywordWords.includes(w)).length;
    
    return overlap / Math.max(inputWords.length, keywordWords.length);
  }

  /**
   * Capitalize name properly
   */
  capitalizeName(name) {
    return name
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Check if input is a command vs data
   */
  isCommand(input) {
    const commandKeywords = ['start', 'confirm', 'cancel', 'help', 'repeat', 'change', 'select', 'book'];
    return commandKeywords.some(cmd => input.toLowerCase().includes(cmd));
  }

  /**
   * Process conversational context (for multi-turn dialogs)
   */
  processConversation(input, conversationHistory = []) {
    const lastContext = conversationHistory.length > 0 
      ? conversationHistory[conversationHistory.length - 1].context 
      : 'general';
    
    const result = this.processInput(input, lastContext);
    
    conversationHistory.push({
      input,
      ...result,
      timestamp: new Date().toISOString()
    });

    return result;
  }
}

// Create singleton instance
const nlpService = new NLPService();

export default nlpService;
