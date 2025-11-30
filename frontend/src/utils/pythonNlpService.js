/**
 * Python NLP Service API Client
 * Connects frontend to Python-based conversation manager
 */

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

/**
 * Process voice input through Python NLP service
 */
export const processVoiceInput = async (userInput) => {
  try {
    const response = await fetch(`${NLP_API_BASE}/api/nlp/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: userInput,
        session_id: getSessionId(),
      }),
    });

    if (!response.ok) {
      throw new Error(`NLP service error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Python NLP service error:', error);
    // Fallback to client-side NLP if Python service unavailable
    return {
      response: 'NLP service temporarily unavailable. Using fallback processing.',
      intent: 'error',
      advance: false,
      auto_listen: true,
      error: error.message,
    };
  }
};

/**
 * Reset conversation session
 */
export const resetConversation = async () => {
  try {
    const response = await fetch(`${NLP_API_BASE}/api/nlp/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: getSessionId(),
      }),
    });

    if (response.ok) {
      // Clear session ID to create new one
      sessionStorage.removeItem('nlp_session_id');
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
      `${NLP_API_BASE}/api/nlp/status?session_id=${getSessionId()}`
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
    const response = await fetch(`${NLP_API_BASE}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

export default {
  processVoiceInput,
  resetConversation,
  getConversationStatus,
  checkNLPHealth,
};
