# Voice Airline Booking & Payment System POC

## 🎯 Project Overview

A fully voice-enabled airline booking platform with **NLP (Natural Language Processing)** capabilities, designed for both visually impaired and regular users. This proof-of-concept demonstrates accessible web development using voice recognition, intelligent command understanding, text-to-speech, and ARIA standards.

## ✨ Features

### Core Functionality
- ✅ **Voice-Enabled Booking Flow** - Complete booking using voice commands
- ✅ **🧠 NLP-Powered Commands** - Natural language understanding (NEW!)
- ✅ **🎙️ Voice Demo (POC)** - Interactive demonstration of AI-powered booking (NEW!)
- ✅ **Passenger Information** - Voice or text input for passenger name
- ✅ **Smart Seat Selection** - Natural commands like "window seat front row" (NEW!)
- ✅ **Special Assistance** - Request wheelchair, visual support, etc.
- ✅ **Mock Payment System** - Simulated payment with OTP verification
- ✅ **Booking Confirmation** - Voice readout of ticket details
- ✅ **Ticket Download** - Download booking as text file

### NLP Features (NEW!)
- 🧠 **Intent Recognition** - Understands what you want to do automatically
- 🎯 **Entity Extraction** - Captures names, seats, preferences from natural speech
- 💡 **Smart Recommendations** - Suggests optimal seats based on preferences
- 🗣️ **Natural Language** - No rigid commands - speak naturally
- 📊 **Context Awareness** - Adapts to current booking stage
- ⚡ **Fast Processing** - <50ms client-side NLP processing

### Accessibility Features
- 🎤 **Web Speech API Integration** - Speech-to-Text and Text-to-Speech
- ♿ **ARIA Compliance** - Full screen reader support (NVDA, JAWS, VoiceOver)
- ⌨️ **Keyboard Navigation** - Complete keyboard accessibility
- 🔊 **Voice Prompts** - Audio guidance throughout the journey
- 📱 **Responsive Design** - Works on desktop and mobile

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with Hooks
- **Routing**: React Router v6
- **Build Tool**: Vite
- **Styling**: CSS3 with custom properties
- **Voice**: Web Speech API (native browser support)
- **NLP**: Custom JavaScript NLP engine (client-side) ← NEW!
- **Accessibility**: ARIA labels, semantic HTML, WCAG 2.1 AAA

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express.js 4.18
- **Storage**: In-memory (no database for POC)
- **CORS**: Enabled for local development
- **Deployment**: Docker + Docker Compose

## 📁 Project Structure

```
voice-airline-booking/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── VoiceInput.jsx
│   │   ├── pages/
│   │   │   ├── Welcome.jsx
│   │   │   ├── PassengerInfo.jsx
│   │   │   ├── SeatSelection.jsx
│   │   │   ├── SpecialAssistance.jsx
│   │   │   ├── Payment.jsx
│   │   │   └── Confirmation.jsx
│   │   ├── hooks/
│   │   │   └── useSpeechRecognition.js
│   │   ├── utils/
│   │   │   ├── speechSynthesis.js
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   ├── Welcome.css
│   │   │   ├── PassengerInfo.css
│   │   │   ├── SeatSelection.css
│   │   │   ├── SpecialAssistance.css
│   │   │   ├── Payment.css
│   │   │   ├── Confirmation.css
│   │   │   └── VoiceInput.css
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .gitignore
│
├── backend/
│   ├── controllers/
│   │   ├── bookingController.js
│   │   └── paymentController.js
│   ├── routes/
│   │   ├── booking.js
│   │   └── payment.js
│   ├── server.js
│   ├── package.json
│   └── .gitignore
│
├── NLP-IMPLEMENTATION-GUIDE.md     ← NLP technical documentation (NEW!)
├── NLP-VISUAL-SUMMARY.md           ← NLP architecture diagrams (NEW!)
├── POC-DEMO-CARD.md                ← Quick demo reference (NEW!)
├── DOCKER-GUIDE.md                 ← Docker setup guide
├── INSTALLATION-GUIDE.md           ← Detailed installation
└── README.md
```

## 🎙️ Try the Voice Demo (POC)

**NEW!** Experience the NLP-powered voice booking system:

1. **Start the application** (see Installation section below)
2. **Navigate to homepage**: http://localhost:5173
3. **Click**: "🎙️ Try Voice Demo (POC)" button
4. **Grant microphone permissions** when prompted
5. **Follow the voice prompts**:
   - Say: **"Start voice checkout"**
   - Say: **"Ramesh Kumar"** (or your name)
   - Say: **"Aisle seat front row"** (or any preference)
   - Say: **"Confirm payment"**

**Demo completes in ~45 seconds!**

### Voice Commands You Can Try

| Stage | Natural Commands |
|-------|------------------|
| Start | "start booking", "book flight", "voice checkout" |
| Name | "John Smith", "my name is Priya Sharma" |
| Seat | "12A", "window seat", "aisle front row", "window seat please" |
| Payment | "confirm payment", "pay now", "proceed" |
| Help | "help", "what can i do" (at any time) |

📖 **Full Documentation**: See [POC-DEMO-CARD.md](./POC-DEMO-CARD.md) for complete demo script

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)
- Modern web browser (Chrome, Edge, or Safari recommended for voice features)

### Step 1: Clone/Extract Project
```bash
cd voice-airline-booking
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

## ▶️ Running the Application

### Option 1: Run Backend and Frontend Separately

#### Terminal 1 - Start Backend Server
```bash
cd backend
npm start
```
Backend will run on: **http://localhost:4000**

#### Terminal 2 - Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend will run on: **http://localhost:5173**

### Option 2: Quick Start Script

Create a `start.bat` file in the root directory (Windows):
```batch
@echo off
echo Starting Voice Airline Booking System...
start cmd /k "cd backend && npm start"
timeout /t 3
start cmd /k "cd frontend && npm run dev"
```

Or `start.sh` for Mac/Linux:
```bash
#!/bin/bash
echo "Starting Voice Airline Booking System..."
cd backend && npm start &
sleep 3
cd ../frontend && npm run dev
```

## 📋 Usage Guide

### Booking Flow

1. **Welcome Page**
   - Voice greeting plays automatically
   - Click "Start Booking" to begin

2. **Passenger Information**
   - Enter name by typing or using voice
   - Click microphone button and speak clearly
   - System confirms captured name

3. **Seat Selection**
   - Choose from dropdown or say "Seat 12A"
   - View seat layout (A=Window, B=Middle, C=Aisle)

4. **Special Assistance**
   - Select any required assistance
   - Multiple selections allowed
   - Or choose "No Special Assistance"

5. **Payment**
   - Select payment method
   - Click "Confirm Payment"
   - System generates OTP (mock: 123456)
   - Enter OTP via typing or voice
   - Payment is verified

6. **Confirmation**
   - Booking details read aloud
   - Download ticket as text file
   - Start new booking if needed

### Voice Commands Examples

- **Name**: "John Smith" or "Sarah Johnson"
- **Seat**: "Seat 12A", "Seat 15B", "12C"
- **OTP**: "One two three four five six" or "123456"

## 🔌 API Endpoints

### Booking APIs

#### Create Booking
```
POST /api/booking
Content-Type: application/json

{
  "passengerName": "John Doe",
  "seatNumber": "12A",
  "specialAssistance": ["wheelchair"],
  "flightNumber": "AI101",
  "departure": "New Delhi (DEL)",
  "destination": "Mumbai (BOM)",
  "date": "2025-11-29",
  "price": 5999
}

Response:
{
  "success": true,
  "booking": {
    "bookingId": "BK1000",
    "passengerName": "John Doe",
    "seatNumber": "12A",
    ...
  }
}
```

#### Get Booking
```
GET /api/booking/:bookingId

Response:
{
  "success": true,
  "booking": { ... }
}
```

### Payment APIs

#### Create Payment Order
```
POST /api/create-order
Content-Type: application/json

{
  "bookingId": "BK1000",
  "amount": 5999,
  "paymentMethod": "credit_card"
}

Response:
{
  "success": true,
  "orderId": "ORD5000",
  "amount": 5999,
  "mockOTP": "123456"
}
```

#### Verify OTP
```
POST /api/verify-otp
Content-Type: application/json

{
  "orderId": "ORD5000",
  "otp": "123456"
}

Response:
{
  "success": true,
  "orderId": "ORD5000",
  "bookingId": "BK1000",
  "transactionId": "TXN1732886400000"
}
```

## ♿ Accessibility Features

### Screen Reader Support
- All elements have proper ARIA labels
- Live regions for dynamic content
- Semantic HTML structure
- Skip navigation links

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Arrow keys in dropdowns
- Clear focus indicators

### Voice Features
- Text-to-Speech announcements
- Speech-to-Text input
- Voice can be toggled on/off
- Works with browser's native speech API

### Visual Design
- High contrast ratios (WCAG AA compliant)
- Large touch targets (44px minimum)
- Clear visual feedback
- Reduced motion support

## 🔐 Security Notes

### Current Implementation (POC)
- ⚠️ **Mock OTP**: Fixed OTP (123456) for testing
- ⚠️ **No Authentication**: No user login required
- ⚠️ **In-Memory Storage**: Data lost on restart
- ⚠️ **No Encryption**: Plain HTTP communication

### Production Recommendations
- ✅ Implement real OTP via SMS/Email gateway
- ✅ Add user authentication (JWT, OAuth)
- ✅ Use persistent database (MongoDB, PostgreSQL)
- ✅ Enable HTTPS/SSL certificates
- ✅ Add rate limiting and CSRF protection
- ✅ Validate and sanitize all inputs
- ✅ Implement proper error handling
- ✅ Add logging and monitoring

## 🔄 Future Enhancements

### Payment Integration
1. **Real Payment Gateway**
   - Integrate Razorpay/Stripe/PayPal
   - PCI DSS compliance
   - Multiple currency support

2. **OTP System**
   - SMS gateway (Twilio, AWS SNS)
   - Email OTP as backup
   - Time-based OTP expiration

### Database Integration
```javascript
// Example: MongoDB Schema
const bookingSchema = new Schema({
  bookingId: { type: String, required: true, unique: true },
  passengerName: { type: String, required: true },
  seatNumber: { type: String, required: true },
  specialAssistance: [String],
  flightNumber: String,
  departure: String,
  destination: String,
  date: Date,
  price: Number,
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'] },
  createdAt: { type: Date, default: Date.now }
});
```

### Additional Features
- Flight search functionality
- Multiple flight options
- Real-time seat availability
- Price comparison
- Booking history
- User profiles
- Email confirmations
- SMS notifications
- Multi-language support
- Calendar integration

## 🧪 Testing

### Manual Testing Checklist
- [ ] Voice input works on all pages
- [ ] Text-to-Speech reads all content
- [ ] Keyboard navigation complete
- [ ] Screen reader announces properly
- [ ] All buttons are accessible
- [ ] OTP verification works
- [ ] Booking creates successfully
- [ ] Ticket downloads correctly

### Browser Compatibility
- ✅ Chrome/Edge (Best support for Web Speech API)
- ✅ Safari (iOS/macOS)
- ⚠️ Firefox (Limited speech recognition support)

## 📝 Notes for Developers

### Web Speech API Browser Support
The Web Speech API is used for voice features:
- **Speech Recognition**: Chrome, Edge, Safari
- **Speech Synthesis**: All modern browsers

Fallback: Manual input available when voice unsupported

### Session Storage
- Booking data stored temporarily in `sessionStorage`
- Cleared after confirmation or browser close
- No sensitive data persisted

### Mock Data
- Flight: AI101 (DEL → BOM)
- Default Price: ₹5999
- OTP: 123456 (for testing)

## 🐛 Troubleshooting

### Voice Recognition Not Working
1. Check browser compatibility (use Chrome/Edge)
2. Allow microphone permissions
3. Ensure HTTPS (or localhost for testing)
4. Check microphone hardware

### Backend Not Starting
```bash
# Check if port 4000 is available
netstat -ano | findstr :4000

# Kill process if port is busy (Windows)
taskkill /PID <PID> /F

# Or use different port in server.js
const PORT = 4001;
```

### Frontend Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

This is a Proof of Concept (POC) project for educational and demonstration purposes.

## 👥 Contact & Support

For questions or issues, please refer to the project documentation or raise an issue in the repository.

---

**Built with ❤️ for Accessibility**

Made with React, Node.js, and Web Speech API to demonstrate inclusive web development.
