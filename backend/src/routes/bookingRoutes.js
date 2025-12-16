/**
 * Booking Routes
 * 
 * Defines all booking-related API endpoints with validation and middleware.
 * Handles routing for booking creation, cancellation, and ticket management.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

const express = require('express');
const bookingController = require('../controllers/bookingController');
const { validate, bookingSchemas, customRateLimit } = require('../middleware/requestValidator');
const { asyncHandler } = require('../middleware/errorHandler');
const Joi = require('joi');

const router = express.Router();

/**
 * @route POST /api/v1/bookings
 * @description Create a new booking by confirming blocked seats
 * @body {string} showId - Show ID (UUID format)
 * @body {string[]} seatIds - Array of seat IDs to book (max: 10)
 * @body {Object} userDetails - User information
 * @body {string} userDetails.name - User full name
 * @body {string} userDetails.email - User email address
 * @body {string} userDetails.phone - User phone number (optional)
 * @access Public
 * @rateLimit 3 bookings per 5 minutes per IP
 * @example
 *   POST /api/v1/bookings
 *   {
 *     "showId": "123e4567-e89b-12d3-a456-426614174000",
 *     "seatIds": ["seat1-uuid", "seat2-uuid"],
 *     "userDetails": {
 *       "name": "John Doe",
 *       "email": "john@example.com",
 *       "phone": "+91-9876543210"
 *     }
 *   }
 */
router.post('/',
  // Strict rate limiting for booking creation
  customRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3, // 3 bookings per 5 minutes per IP
    message: 'Too many booking attempts. Please wait 5 minutes before trying again.',
    keyGenerator: (req) => `booking:${req.ip}`,
  }),
  validate(bookingSchemas.createBookingBody, 'body'),
  asyncHandler(bookingController.createBooking)
);

/**
 * @route GET /api/v1/bookings/stats
 * @description Get booking statistics for analytics
 * @query {string} startDate - Start date (YYYY-MM-DD, optional)
 * @query {string} endDate - End date (YYYY-MM-DD, optional)
 * @access Public (would be admin-only in production)
 * @example
 *   GET /api/v1/bookings/stats
 *   GET /api/v1/bookings/stats?startDate=2024-01-01&endDate=2024-01-31
 */
router.get('/stats',
  validate({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  }, 'query'),
  asyncHandler(bookingController.getBookingStats)
);

/**
 * @route GET /api/v1/bookings/user/:email
 * @description Get booking history for a user by email
 * @param {string} email - User email address
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 50)
 * @access Public
 * @rateLimit 10 requests per minute per email
 * @example
 *   GET /api/v1/bookings/user/john@example.com
 *   GET /api/v1/bookings/user/john@example.com?page=2&limit=5
 */
router.get('/user/:email',
  // Rate limiting per email to prevent abuse
  customRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute per email
    message: 'Too many requests for user bookings. Please wait before trying again.',
    keyGenerator: (req) => `user-bookings:${req.params.email}`,
  }),
  validate({
    email: bookingSchemas.commonSchemas.email,
  }, 'params'),
  validate({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
  }, 'query'),
  asyncHandler(bookingController.getUserBookings)
);

/**
 * @route GET /api/v1/bookings/:reference
 * @description Get booking details by reference number
 * @param {string} reference - Booking reference (BMS followed by 8 characters)
 * @access Public
 * @example
 *   GET /api/v1/bookings/BMS12345678
 */
router.get('/:reference',
  validate(bookingSchemas.bookingReferenceParam, 'params'),
  asyncHandler(bookingController.getBookingByReference)
);

/**
 * @route DELETE /api/v1/bookings/:reference
 * @description Cancel a booking by reference number
 * @param {string} reference - Booking reference (BMS followed by 8 characters)
 * @body {string} reason - Cancellation reason (optional, max 500 chars)
 * @access Public
 * @rateLimit 5 cancellations per hour per IP
 * @example
 *   DELETE /api/v1/bookings/BMS12345678
 *   {
 *     "reason": "Change of plans"
 *   }
 */
router.delete('/:reference',
  // Rate limiting for cancellations
  customRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 cancellations per hour per IP
    message: 'Too many cancellation attempts. Please wait before trying again.',
    keyGenerator: (req) => `cancel:${req.ip}`,
  }),
  validate(bookingSchemas.bookingReferenceParam, 'params'),
  validate(bookingSchemas.cancelBookingBody, 'body'),
  asyncHandler(bookingController.cancelBooking)
);

/**
 * @route PATCH /api/v1/bookings/:reference/cancel
 * @description Alternative endpoint for booking cancellation (PATCH method)
 * @param {string} reference - Booking reference
 * @body {string} reason - Cancellation reason (optional)
 * @access Public
 * @example
 *   PATCH /api/v1/bookings/BMS12345678/cancel
 *   {
 *     "reason": "Emergency"
 *   }
 */
router.patch('/:reference/cancel',
  // Same rate limiting as DELETE
  customRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    message: 'Too many cancellation attempts. Please wait before trying again.',
    keyGenerator: (req) => `cancel:${req.ip}`,
  }),
  validate(bookingSchemas.bookingReferenceParam, 'params'),
  validate(bookingSchemas.cancelBookingBody, 'body'),
  asyncHandler(bookingController.cancelBooking)
);

/**
 * @route GET /api/v1/bookings/:reference/ticket
 * @description Get digital ticket information (same as booking details but formatted for ticket)
 * @param {string} reference - Booking reference
 * @access Public
 * @example
 *   GET /api/v1/bookings/BMS12345678/ticket
 */
router.get('/:reference/ticket',
  validate(bookingSchemas.bookingReferenceParam, 'params'),
  asyncHandler(async (req, res) => {
    // Delegate to booking controller but format response as ticket
    const originalJson = res.json;
    res.json = function(data) {
      if (data.success && data.data.booking) {
        // Transform booking data to ticket format
        const ticketData = {
          success: true,
          data: {
            ticket: {
              bookingReference: data.data.booking.reference,
              customerName: data.data.booking.customerName,
              customerEmail: data.data.booking.customerEmail,
              movieTitle: data.data.show.movieTitle,
              showDate: data.data.show.showDate,
              showTime: data.data.show.showTime,
              hallName: data.data.show.hallName,
              seats: data.data.seats,
              totalSeats: data.data.booking.totalSeats,
              totalAmount: data.data.booking.totalAmount,
              bookingDate: data.data.booking.bookingDate,
              qrCode: data.data.ticket.qrCode,
              isValid: data.data.ticket.isValid,
              status: data.data.booking.status,
            },
            instructions: [
              'Please arrive at the cinema 15 minutes before show time',
              'Present this ticket at the entrance for verification',
              'Mobile tickets are accepted - no need to print',
              'Outside food and beverages are not allowed',
            ],
          },
          timestamp: data.timestamp,
        };
        return originalJson.call(this, ticketData);
      }
      return originalJson.call(this, data);
    };
    
    return bookingController.getBookingByReference(req, res);
  })
);

module.exports = router;

/**
 * ROUTE DOCUMENTATION:
 * 
 * BOOKING FLOW:
 * 1. Block seats: POST /seats/block
 * 2. Create booking: POST /bookings (within block time)
 * 3. View ticket: GET /bookings/:reference
 * 4. Cancel if needed: DELETE /bookings/:reference
 * 
 * RATE LIMITING STRATEGY:
 * - Booking creation: 3 per 5 minutes (strict to prevent abuse)
 * - Booking lookup: Standard rates
 * - User history: 10 per minute per email
 * - Cancellations: 5 per hour per IP
 * 
 * BOOKING STATES:
 * - CONFIRMED: Active booking, tickets valid
 * - CANCELLED: Cancelled by user, seats released
 * - REFUNDED: Cancelled with refund (future)
 * - NO_SHOW: User didn't attend (future)
 * 
 * RESPONSE FORMAT:
 * {
 *   "success": true,
 *   "data": {
 *     "booking": {...},
 *     "ticket": {...},
 *     "show": {...}
 *   },
 *   "message": "Optional success message",
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 * 
 * ERROR HANDLING:
 * - 400: Validation errors, business logic errors
 * - 404: Booking not found
 * - 409: Conflicts (duplicate bookings, expired blocks)
 * - 429: Rate limit exceeded
 * - 500: Internal server errors
 */

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. AUTHENTICATION & AUTHORIZATION:
 *    - Current: No user authentication required
 *    - Issue: Anyone can view bookings with reference number
 *    - Improvement: User authentication, authorization checks
 * 
 * 2. EMAIL VERIFICATION:
 *    - Current: No email verification for bookings
 *    - Issue: Fake email addresses can be used
 *    - Improvement: Email verification, OTP validation
 * 
 * 3. BOOKING REFERENCE SECURITY:
 *    - Current: Predictable booking reference format
 *    - Issue: Potential enumeration attacks
 *    - Improvement: Cryptographically secure random references
 * 
 * 4. RATE LIMITING GRANULARITY:
 *    - Current: IP-based rate limiting only
 *    - Issue: Shared IPs, legitimate users blocked
 *    - Improvement: User session-based limiting, progressive penalties
 * 
 * 5. BOOKING MODIFICATIONS:
 *    - Current: Only cancellation allowed
 *    - Issue: No seat changes, date modifications
 *    - Improvement: Booking modification APIs with business rules
 * 
 * 6. AUDIT TRAIL:
 *    - Current: Basic logging in controllers
 *    - Issue: Limited audit information
 *    - Improvement: Comprehensive audit trail, booking lifecycle tracking
 */