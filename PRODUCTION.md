# Voice Airline Booking System - Production Deployment Notes

## 🚀 Production Readiness Checklist

### 1. Payment Gateway Integration

#### Razorpay Integration (Recommended for India)
```javascript
// Install Razorpay SDK
npm install razorpay

// Backend - Create Order
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const order = await razorpay.orders.create({
  amount: amount * 100, // Amount in paise
  currency: 'INR',
  receipt: bookingId,
  payment_capture: 1
});
```

#### Stripe Integration (International)
```javascript
// Install Stripe SDK
npm install stripe

// Backend
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const paymentIntent = await stripe.paymentIntents.create({
  amount: amount * 100,
  currency: 'usd',
  metadata: { bookingId }
});
```

### 2. OTP Implementation

#### SMS Gateway (Twilio)
```javascript
// Install Twilio
npm install twilio

// Send OTP
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

await client.messages.create({
  body: `Your OTP is: ${otp}`,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: phoneNumber
});
```

#### Email OTP (Nodemailer)
```javascript
// Install nodemailer
npm install nodemailer

// Send Email
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

await transporter.sendMail({
  from: 'noreply@airline.com',
  to: email,
  subject: 'Your Booking OTP',
  text: `Your OTP is: ${otp}`
});
```

### 3. Database Integration

#### MongoDB Setup
```javascript
// Install dependencies
npm install mongoose

// Connection
const mongoose = require('mongoose');
await mongoose.connect(process.env.MONGODB_URI);

// Booking Schema
const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  passengerName: { type: String, required: true },
  seatNumber: { type: String, required: true },
  specialAssistance: [String],
  flightNumber: String,
  departure: String,
  destination: String,
  date: Date,
  price: Number,
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);
```

#### PostgreSQL Setup
```javascript
// Install dependencies
npm install pg sequelize

// Models
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL);

const Booking = sequelize.define('Booking', {
  bookingId: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  passengerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // ... other fields
});
```

### 4. Environment Variables

Create `.env` files:

**backend/.env**
```env
# Server
PORT=4000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/airline_booking
# OR
DATABASE_URL=postgresql://user:password@localhost:5432/airline_booking

# Payment Gateway
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
# OR
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_PUBLISHABLE_KEY=your_publishable_key

# SMS/OTP
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# JWT Secret
JWT_SECRET=your_secret_key_here

# CORS
ALLOWED_ORIGINS=https://yourdomain.com
```

**frontend/.env**
```env
VITE_API_URL=https://api.yourdomain.com
VITE_RAZORPAY_KEY_ID=your_key_id
```

### 5. Security Enhancements

#### Add Helmet.js
```javascript
npm install helmet
const helmet = require('helmet');
app.use(helmet());
```

#### Rate Limiting
```javascript
npm install express-rate-limit
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

#### Input Validation
```javascript
npm install express-validator
const { body, validationResult } = require('express-validator');

app.post('/api/booking',
  body('passengerName').isLength({ min: 2 }).trim().escape(),
  body('seatNumber').matches(/^[0-9]{1,2}[A-C]$/),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process booking
  }
);
```

### 6. Deployment Options

#### Option A: Traditional VPS (AWS EC2, DigitalOcean)
```bash
# Install dependencies
sudo apt update
sudo apt install nodejs npm nginx

# Setup Nginx reverse proxy
# /etc/nginx/sites-available/airline-booking
server {
    listen 80;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /var/www/airline-booking/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}

# Enable SSL with Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

#### Option B: Containerized (Docker)
```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["node", "server.js"]

# frontend/Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/airline_booking
    depends_on:
      - mongo
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
  
  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

#### Option C: Serverless (Vercel + MongoDB Atlas)
```json
// vercel.json for backend
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

### 7. Monitoring & Logging

#### Winston Logger
```javascript
npm install winston

const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

#### Application Monitoring
- **Sentry**: Error tracking
- **DataDog**: Performance monitoring
- **LogRocket**: User session replay

### 8. Testing

#### Backend Tests
```javascript
npm install --save-dev jest supertest

// __tests__/booking.test.js
const request = require('supertest');
const app = require('../server');

describe('Booking API', () => {
  test('Create booking', async () => {
    const response = await request(app)
      .post('/api/booking')
      .send({
        passengerName: 'Test User',
        seatNumber: '12A'
      });
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

#### Frontend Tests
```javascript
npm install --save-dev @testing-library/react vitest

// src/pages/__tests__/Welcome.test.jsx
import { render, screen } from '@testing-library/react';
import Welcome from '../Welcome';

test('renders welcome heading', () => {
  render(<Welcome />);
  expect(screen.getByText(/Voice Airline Booking/i)).toBeInTheDocument();
});
```

### 9. Performance Optimization

#### Backend
- Implement caching (Redis)
- Use compression middleware
- Optimize database queries
- Add CDN for static assets

#### Frontend
- Code splitting
- Lazy loading routes
- Image optimization
- Service Worker for offline support

### 10. Compliance & Legal

- **GDPR**: Add privacy policy, cookie consent
- **ADA/WCAG**: Ensure accessibility compliance
- **PCI DSS**: If handling real payments
- **Terms of Service**: User agreements

---

## 📞 Support Resources

- **Payment Gateways**: Razorpay, Stripe documentation
- **SMS Services**: Twilio, AWS SNS
- **Hosting**: Vercel, Netlify, AWS, DigitalOcean
- **Database**: MongoDB Atlas, AWS RDS, PostgreSQL
- **Monitoring**: Sentry, DataDog, New Relic

## 🎯 Estimated Production Timeline

- Week 1-2: Payment gateway integration
- Week 3: Database setup and migration
- Week 4: OTP and notification system
- Week 5-6: Security hardening and testing
- Week 7: Deployment and monitoring setup
- Week 8: Load testing and optimization

**Total: ~8 weeks for production-ready system**
