/**
 * Booking Routes
 * Handles flight booking operations
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Create a new booking
router.post('/booking', bookingController.createBooking);

// Get booking by ID
router.get('/booking/:bookingId', bookingController.getBooking);

// Get all bookings (for testing)
router.get('/bookings', bookingController.getAllBookings);

module.exports = router;
