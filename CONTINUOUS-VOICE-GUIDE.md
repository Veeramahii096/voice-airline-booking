# 🎙️ Continuous Voice Conversation - Quick Test Guide

## ✅ What's New

**Automatic Continuous Listening** - No more button clicks!
- ✅ Microphone **automatically restarts** after each response
- ✅ **Python NLP service** handles conversation intelligence
- ✅ **Natural conversation flow** - just speak!

## 🚀 How to Test

### 1. Open the Demo
```
http://localhost/demo
```

### 2. Grant Microphone Permission
- Browser will ask for microphone access
- Click "Allow"

### 3. Just Start Talking!
The system will automatically:
1. Start listening when page loads
2. Process your voice input
3. Respond with voice
4. **Automatically start listening again** (after 4 seconds)

### 4. Full Conversation Flow

**You:** "Hello"
**System:** "Hello! Welcome to Voice Airline Booking. Say 'start booking' to begin."
*(Microphone automatically restarts - 🎤 icon appears)*

**You:** "Start booking"
**System:** "Excellent! Let's get you booked. Great! Please tell me your full name."
*(Microphone automatically restarts)*

**You:** "John Smith"
**System:** "Thank you, John Smith! What seat would you prefer? Window, aisle, or middle?"
*(Microphone automatically restarts)*

**You:** "Window seat"
**System:** "Great choice! Window seat selected. Perfect! Ready for payment. Say 'confirm payment' to proceed."
*(Microphone automatically restarts)*

**You:** "Confirm payment"
**System:** "Processing your payment... Payment successful! Your booking is complete. Thank you!"
*(Booking complete - conversation ends)*

## 🔍 Visual Indicators

Watch for these status changes:
- **🎤 Listening...** - Microphone is active (icon pulses)
- **⚙️ Processing...** - Analyzing your voice input
- **💤 Waiting...** - Between responses (will auto-restart)

## 🎯 Key Features

1. **No Manual Clicking** - Conversation flows naturally
2. **Smart Context** - Python NLP understands conversation state
3. **Auto-Recovery** - Even on errors, microphone restarts
4. **Progress Tracking** - Visual steps show your booking progress
5. **Conversation History** - See full chat transcript

## 🛠️ Manual Controls (If Needed)

If you want to pause/resume manually:
- **⏸️ Pause Listening** - Stop automatic listening
- **▶️ Resume Listening** - Start listening again
- **🔄 Restart Conversation** - Begin new booking

## 📊 Services Running

- **Frontend**: http://localhost (Port 80)
- **Backend API**: http://localhost:4000
- **Python NLP**: http://localhost:5000

## 🐳 Docker Status
```bash
docker-compose ps
```

Should show 3 services:
- voice-airline-frontend
- voice-airline-backend  
- voice-airline-nlp

## 🧪 Test Python NLP Directly
```bash
curl -X POST http://localhost:5000/api/nlp/process \
  -H "Content-Type: application/json" \
  -d "{\"input\": \"hello\", \"session_id\": \"test\"}"
```

## 🎨 What You'll See

1. **Progress Bar** - Shows steps: Start → Name → Seat → Pay → Done
2. **Conversation Box** - Chat bubbles (🤖 system, 👤 you)
3. **Booking Summary** - Shows collected info (passenger, seat, payment)
4. **Voice Status** - Real-time listening/processing indicator
5. **Help Section** - Expandable tips and script reference

## 💡 Tips

- **Speak clearly** - Wait for system response before continuing
- **Natural language** - Say things naturally, NLP will understand
- **Watch status** - Wait for 🎤 icon before speaking
- **Be patient** - 4-second delay between responses for speech synthesis

## 🔧 Troubleshooting

**Problem:** Microphone not auto-restarting
- Check browser console for errors
- Refresh page and grant microphone permission again

**Problem:** NLP service not responding
- Check: `curl http://localhost:5000/health`
- Should return: `{"status": "healthy"}`

**Problem:** Voice recognition not working
- Use Chrome, Edge, or Safari (best support)
- Check microphone permissions in browser settings

## 🎯 Success Criteria

✅ You can complete full booking without clicking anything
✅ System responds with voice after each input
✅ Microphone automatically restarts (🎤 icon appears)
✅ All 4 steps complete: Name → Seat → Payment → Done
✅ Conversation history shows all exchanges

---

**Ready to test? Open http://localhost/demo and say "Hello"!** 🎤
