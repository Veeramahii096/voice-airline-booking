/**
 * Booking Controller
 * Manages in-memory storage and business logic for bookings
 */

// In-memory storage for bookings
const bookings = new Map();

// Counter for generating booking IDs
let bookingIdCounter = 1000;

/**
 * Create a new booking
 */
const createBooking = (req, res) => {
  try {
    const {
      passengerName,
      seatNumber,
      specialAssistance,
      flightNumber,
      departure,
      destination,
      date,
      price
    } = req.body;

    // Validate required fields
    if (!passengerName || !seatNumber) {
      return res.status(400).json({
        success: false,
        error: 'Passenger name and seat number are required'
      });
    }

    // Generate booking ID
    const bookingId = `BK${bookingIdCounter++}`;

    // Create booking object
    const booking = {
      bookingId,
      passengerName,
      seatNumber,
      specialAssistance: specialAssistance || [],
      flightNumber: flightNumber || 'AI101',
      departure: departure || 'New Delhi (DEL)',
      destination: destination || 'Mumbai (BOM)',
      date: date || new Date().toISOString().split('T')[0],
      price: price || 5999,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Store booking
    bookings.set(bookingId, booking);

    console.log(`✅ Booking created: ${bookingId} for ${passengerName}`);

    res.status(201).json({
      success: true,
      booking,
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      message: error.message
    });
  }
};

/**
 * Get booking by ID
 */
const getBooking = (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = bookings.get(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking'
    });
  }
};

/**
 * Get all bookings (for testing)
 */
const getAllBookings = (req, res) => {
  try {
    const allBookings = Array.from(bookings.values());

    res.json({
      success: true,
      count: allBookings.length,
      bookings: allBookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
};

/**
 * Update booking status (internal use)
 */
const updateBookingStatus = (bookingId, status) => {
  const booking = bookings.get(bookingId);
  if (booking) {
    booking.status = status;
    booking.updatedAt = new Date().toISOString();
    bookings.set(bookingId, booking);
    return true;
  }
  return false;
};

module.exports = {
  createBooking,
  getBooking,
  getAllBookings,
  updateBookingStatus
};
