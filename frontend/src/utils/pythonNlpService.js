/**
 * Python NLP Service API Client - AI-Powered with Voice Recognition
 * Connects frontend to Python-based conversation manager
 */

import nlpService from './nlpService.js';

const NLP_API_BASE = import.meta.env.VITE_NLP_URL || 'http://localhost:5000/api/nlp';

// Generate unique session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('nlp_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('nlp_session_id', sessionId);
  }
  return sessionId;
};

// Get or identify user
const getUserId = () => {
  return sessionStorage.getItem('nlp_user_id') || null;
};

/**
 * Identify user by voice (simulated with test phone)
 */
export const identifyUser = async (testPhone = '9876543210') => {
  try {
    const response = await fetch(`${NLP_API_BASE}/identify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test_phone: testPhone,
      }),
    });

    if (!response.ok) {
      throw new Error(`Identification failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.identified) {
      // Store user ID for future requests
      sessionStorage.setItem('nlp_user_id', result.user_id);
      sessionStorage.setItem('nlp_user_name', result.profile.name);
    }
    
    return result;
  } catch (error) {
    console.error('User identification error:', error);
    return { identified: false };
  }
};

/**
 * Process voice input through Python NLP service with AI features
 */
export const processVoiceInput = async (userInput) => {
  try {
    const response = await fetch(`${NLP_API_BASE}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: userInput,
        session_id: getSessionId(),
        user_id: getUserId(), // Include user ID if identified
      }),
    });

    if (!response.ok) {
      throw new Error(`NLP service error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Python NLP service error:', error);
    console.log('Using fallback client-side NLP processing...');
    
    // Fallback to client-side NLP if Python service unavailable
    // Note: Using 'general' context as we don't have session context available here.
    // The client-side NLP will infer context from the input itself.
    const fallbackResult = nlpService.processInput(userInput, 'general');
    
    // Transform client-side NLP result to match Python NLP service response format
    // Note: advance is set based on action type (true if action is actionable, false otherwise)
    // This enables the conversation to progress when using fallback processing
    return {
      response: fallbackResult.response,
      intent: fallbackResult.intent,
      entities: fallbackResult.entities,
      confidence: fallbackResult.confidence,
      action: fallbackResult.action,
      advance: fallbackResult.action?.type !== 'NONE',
      auto_listen: true,
    };
  }
};

/**
 * Reset conversation session
 */
export const resetConversation = async () => {
  try {
    const response = await fetch(`${NLP_API_BASE}/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: getSessionId(),
      }),
    });

    if (response.ok) {
      // Clear session ID and user ID to create new one
      sessionStorage.removeItem('nlp_session_id');
      sessionStorage.removeItem('nlp_user_id');
      sessionStorage.removeItem('nlp_user_name');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Reset conversation error:', error);
    return false;
  }
};

/**
 * Get current conversation status
 */
export const getConversationStatus = async () => {
  try {
    const response = await fetch(
      `${NLP_API_BASE}/status?session_id=${getSessionId()}`
    );

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get status error:', error);
    return { active: false };
  }
};

/**
 * Check Python NLP service health
 */
export const checkNLPHealth = async () => {
  try {
    const response = await fetch('http://localhost:5000/health');
    return response.ok;
  } catch (error) {
    return false;
  }
};

export default {
  identifyUser,
  processVoiceInput,
  resetConversation,
  getConversationStatus,
  checkNLPHealth,
};
