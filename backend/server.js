/**
 * Voice Airline Booking & Payment System POC - Backend Server
 * Express.js REST API with in-memory storage
 */

const express = require('express');
const cors = require('cors');
const bookingRoutes = require('./routes/booking');
const paymentRoutes = require('./routes/payment');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', bookingRoutes);
app.use('/api', paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Voice Airline Booking API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Voice Airline Booking API Server running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   - POST /api/booking`);
  console.log(`   - POST /api/create-order`);
  console.log(`   - POST /api/verify-otp`);
});

module.exports = app;
