# Quick Start Guide - Voice Airline Booking System

## 🚀 Get Started in 5 Minutes

### Step 1: Open Two Command Prompts

**Command Prompt 1 - Backend:**
```cmd
cd c:\Users\Veera\Downloads\voices\voice-airline-booking\backend
npm install
npm start
```

Wait for message: "🚀 Voice Airline Booking API Server running on http://localhost:4000"

**Command Prompt 2 - Frontend:**
```cmd
cd c:\Users\Veera\Downloads\voices\voice-airline-booking\frontend
npm install
npm run dev
```

Wait for message and browser will open automatically at: http://localhost:5173

### Step 2: Test the Application

1. **Allow Microphone Access** when prompted by browser
2. Click "Start Booking" button
3. Enter name: Type or click microphone to say your name
4. Select seat: Choose from dropdown or say "Seat 12A"
5. Select special assistance (optional)
6. Complete payment with OTP: **123456**
7. View confirmation and download ticket

## 🎤 Voice Commands to Try

- **Name**: Say "John Smith" or "Sarah Williams"
- **Seat**: Say "Seat 12A", "Seat 15B", or "12C"
- **OTP**: Say "One two three four five six"

## ⚠️ Important Notes

### Browser Requirements
- **Best Experience**: Chrome or Edge (full voice support)
- **Also Works**: Safari (macOS/iOS)
- **Limited**: Firefox (no voice recognition)

### Microphone Access
- Click "Allow" when browser asks for microphone permission
- Voice features won't work without microphone access
- You can always use manual input instead

### Mock Payment
- This is a test system - no real payment processed
- Use OTP: **123456** (shown on screen)
- No credit card details required

## 🔧 Troubleshooting

### "Port already in use" Error
```cmd
# Windows - Kill process on port 4000
netstat -ano | findstr :4000
taskkill /PID <PID_NUMBER> /F
```

### Voice Not Working
1. Check microphone is connected
2. Refresh browser and allow permissions
3. Use Chrome or Edge browser
4. Try manual input as alternative

### Dependencies Installation Failed
```cmd
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rmdir /s /q node_modules
del package-lock.json
npm install
```

## 📱 Test on Mobile

1. Both devices must be on same WiFi network
2. Find your computer's IP address:
   ```cmd
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

3. On mobile browser, visit:
   ```
   http://YOUR_IP_ADDRESS:5173
   ```

## 🎯 Testing Checklist

- [ ] Backend server running (port 4000)
- [ ] Frontend server running (port 5173)
- [ ] Microphone permission granted
- [ ] Voice input works
- [ ] Text-to-speech plays
- [ ] Can complete full booking
- [ ] OTP verification works (123456)
- [ ] Ticket downloads successfully

## 📞 Getting Help

Check the main README.md for detailed documentation:
- API endpoints
- Architecture details
- Accessibility features
- Production deployment guide

---

**Happy Testing! 🎉**

For production use, remember to:
- Integrate real payment gateway
- Add proper OTP SMS/Email service
- Use a real database
- Enable HTTPS
- Add user authentication
