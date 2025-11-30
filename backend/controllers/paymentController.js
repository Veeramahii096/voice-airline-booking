/**
 * Payment Controller
 * Handles mock payment processing and OTP verification
 */

const { updateBookingStatus } = require('./bookingController');

// In-memory storage for payment orders and OTPs
const paymentOrders = new Map();
let orderIdCounter = 5000;

// Mock OTP for testing (in production, this would be sent via SMS/Email)
const MOCK_OTP = '123456';

/**
 * Create payment order and generate OTP
 */
const createOrder = (req, res) => {
  try {
    const {
      bookingId,
      amount,
      paymentMethod
    } = req.body;

    // Validate required fields
    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID and amount are required'
      });
    }

    // Generate order ID
    const orderId = `ORD${orderIdCounter++}`;

    // Generate OTP (in production, send via SMS/Email)
    const otp = MOCK_OTP;

    // Create order object
    const order = {
      orderId,
      bookingId,
      amount,
      paymentMethod: paymentMethod || 'credit_card',
      otp,
      otpVerified: false,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    };

    // Store order
    paymentOrders.set(orderId, order);

    console.log(`💳 Payment order created: ${orderId}`);
    console.log(`🔐 OTP generated: ${otp} (Mock - in production, send via SMS)`);

    res.status(201).json({
      success: true,
      orderId,
      amount,
      message: 'Payment order created. OTP sent successfully.',
      // In production, DO NOT send OTP in response!
      // This is only for testing purposes
      mockOTP: otp
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order',
      message: error.message
    });
  }
};

/**
 * Verify OTP and complete payment
 */
const verifyOTP = (req, res) => {
  try {
    const { orderId, otp } = req.body;

    // Validate required fields
    if (!orderId || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Order ID and OTP are required'
      });
    }

    // Get order
    const order = paymentOrders.get(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Payment order not found'
      });
    }

    // Check if order has expired
    if (new Date() > new Date(order.expiresAt)) {
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new one.'
      });
    }

    // Check if OTP is already verified
    if (order.otpVerified) {
      return res.status(400).json({
        success: false,
        error: 'Payment already completed'
      });
    }

    // Verify OTP
    if (otp.trim() !== order.otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP. Please try again.'
      });
    }

    // Mark OTP as verified and payment as completed
    order.otpVerified = true;
    order.status = 'completed';
    order.verifiedAt = new Date().toISOString();
    paymentOrders.set(orderId, order);

    // Update booking status
    updateBookingStatus(order.bookingId, 'confirmed');

    console.log(`✅ Payment verified: ${orderId} for booking ${order.bookingId}`);

    res.json({
      success: true,
      orderId,
      bookingId: order.bookingId,
      message: 'Payment completed successfully',
      transactionId: `TXN${Date.now()}`
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP',
      message: error.message
    });
  }
};

module.exports = {
  createOrder,
  verifyOTP
};
