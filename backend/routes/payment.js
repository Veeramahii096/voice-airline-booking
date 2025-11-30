/**
 * Payment Routes
 * Handles payment processing and OTP verification
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Create payment order (generates OTP)
router.post('/create-order', paymentController.createOrder);

// Verify OTP for payment
router.post('/verify-otp', paymentController.verifyOTP);

module.exports = router;
