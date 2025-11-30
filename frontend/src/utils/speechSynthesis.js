/**
 * Speech Synthesis Utility
 * Text-to-Speech (TTS) functionality
 */

class SpeechSynthesisService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.isEnabled = true;
    this.initVoice();
  }

  // Initialize preferred voice
  initVoice() {
    const voices = this.synth.getVoices();
    // Prefer English voice
    this.voice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
    
    // iOS Safari workaround
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        const voices = this.synth.getVoices();
        this.voice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      };
    }
  }

  // Speak text
  speak(text, options = {}) {
    if (!this.isEnabled) {
      console.log('Speech synthesis is disabled');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this.voice;
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      utterance.onend = () => {
        console.log('Speech finished:', text);
        resolve();
      };

      utterance.onerror = (error) => {
        console.error('Speech error:', error);
        reject(error);
      };

      this.synth.speak(utterance);
    });
  }

  // Cancel ongoing speech
  cancel() {
    this.synth.cancel();
  }

  // Toggle speech on/off
  toggle() {
    this.isEnabled = !this.isEnabled;
    if (!this.isEnabled) {
      this.cancel();
    }
    return this.isEnabled;
  }

  // Check if speaking
  isSpeaking() {
    return this.synth.speaking;
  }
}

// Create singleton instance
const speechService = new SpeechSynthesisService();

export default speechService;
