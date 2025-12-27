/**
 * Seat Routes
 * 
 * Defines all seat-related API endpoints with validation and middleware.
 * Handles routing for seat layout, blocking, and availability functionality.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

const express = require('express');
const seatController = require('../controllers/seatController');
const { validate, seatSchemas, customRateLimit } = require('../middleware/requestValidator');
const { asyncHandler } = require('../middleware/errorHandler');
const Joi = require('joi');

const router = express.Router();

/**
 * @route GET /api/v1/seats/layout/:showId
 * @description Get complete seat layout for a show with availability status
 * @param {string} showId - Show ID (UUID format)
 * @query {boolean} availableOnly - Only return available seats (default: false)
 * @access Public
 * @example
 *   GET /api/v1/seats/layout/123e4567-e89b-12d3-a456-426614174000
 *   GET /api/v1/seats/layout/123e4567-e89b-12d3-a456-426614174000?availableOnly=true
 */
router.get('/layout/:showId',
  validate({
    showId: Joi.string().uuid().required(),
  }, 'params'),
  validate({
    availableOnly: require('joi').boolean().default(false),
  }, 'query'),
  asyncHandler(seatController.getSeatLayout)
);

/**
 * @route GET /api/v1/seats/available/:showId
 * @description Get only available seats for a show
 * @param {string} showId - Show ID (UUID format)
 * @query {number} count - Maximum number of seats to return (optional)
 * @access Public
 * @example
 *   GET /api/v1/seats/available/123e4567-e89b-12d3-a456-426614174000
 *   GET /api/v1/seats/available/123e4567-e89b-12d3-a456-426614174000?count=20
 */
router.get('/available/:showId',
  validate({
    showId: Joi.string().uuid().required(),
  }, 'params'),
  validate({
    count: require('joi').number().integer().min(1).max(100).optional(),
  }, 'query'),
  asyncHandler(seatController.getAvailableSeats)
);

/**
 * @route POST /api/v1/seats/block
 * @description Temporarily block seats for booking process (5-minute hold)
 * @body {string} showId - Show ID (UUID format)
 * @body {string[]} seatIds - Array of seat IDs to block (max: 10)
 * @body {number} blockDuration - Duration in minutes (default: 5, max: 15)
 * @access Public
 * @rateLimit 5 requests per minute per IP
 * @example
 *   POST /api/v1/seats/block
 *   {
 *     "showId": "123e4567-e89b-12d3-a456-426614174000",
 *     "seatIds": ["seat1-uuid", "seat2-uuid"],
 *     "blockDuration": 5
 *   }
 */
router.post('/block',
  // Custom rate limiting for seat blocking (more restrictive)
  customRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute per IP
    message: 'Too many seat blocking attempts. Please wait before trying again.',
    keyGenerator: (req) => `block:${req.ip}`,
  }),
  validate(seatSchemas.blockSeatsBody, 'body'),
  asyncHandler(seatController.blockSeats)
);

/**
 * @route POST /api/v1/seats/release
 * @description Manually release blocked seats before expiry
 * @body {string[]} seatIds - Array of seat IDs to release
 * @access Public
 * @example
 *   POST /api/v1/seats/release
 *   {
 *     "seatIds": ["seat1-uuid", "seat2-uuid"]
 *   }
 */
router.post('/release',
  validate(seatSchemas.releaseSeatsBody, 'body'),
  asyncHandler(seatController.releaseSeats)
);

/**
 * @route PATCH /api/v1/seats/extend-block
 * @description Extend the expiry time of blocked seats
 * @body {string[]} seatIds - Array of seat IDs to extend
 * @body {number} additionalMinutes - Additional minutes to extend (max: 10)
 * @access Public
 * @rateLimit 3 requests per minute per IP
 * @example
 *   PATCH /api/v1/seats/extend-block
 *   {
 *     "seatIds": ["seat1-uuid", "seat2-uuid"],
 *     "additionalMinutes": 5
 *   }
 */
router.patch('/extend-block',
  // Rate limiting for block extensions
  customRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3, // 3 requests per minute per IP
    message: 'Too many block extension attempts. Please wait before trying again.',
    keyGenerator: (req) => `extend:${req.ip}`,
  }),
  validate({
    seatIds: Joi.array().items(Joi.string().uuid()).min(1).max(10).required(),
    additionalMinutes: Joi.number().integer().min(1).max(10).default(5),
  }, 'body'),
  asyncHandler(seatController.extendSeatBlock)
);

/**
 * @route GET /api/v1/seats/:showId
 * @description Alternative endpoint for getting seat layout (backwards compatibility)
 * @param {string} showId - Show ID (UUID format)
 * @query {boolean} availableOnly - Only return available seats (default: false)
 * @access Public
 * @deprecated Use /api/v1/seats/layout/:showId instead
 */
router.get('/:showId',
  validate({
    showId: Joi.string().uuid().required(),
  }, 'params'),
  validate({
    availableOnly: require('joi').boolean().default(false),
  }, 'query'),
  asyncHandler((req, res, next) => {
    // Add deprecation warning header
    res.set('Warning', '299 - "This endpoint is deprecated. Use /api/v1/seats/layout/:showId instead"');
    return seatController.getSeatLayout(req, res, next);
  })
);

module.exports = router;

/**
 * ROUTE DOCUMENTATION:
 * 
 * All seat routes are public but have different rate limiting rules:
 * - Seat layout/availability: Standard rate limits
 * - Seat blocking: 5 requests per minute per IP
 * - Block extension: 3 requests per minute per IP
 * 
 * SEAT BLOCKING FLOW:
 * 1. GET /seats/layout/:showId - View available seats
 * 2. POST /seats/block - Block selected seats (5-min hold)
 * 3. Optional: PATCH /seats/extend-block - Extend block time
 * 4. Complete booking within block time or seats auto-release
 * 5. Optional: POST /seats/release - Manual release before expiry
 * 
 * RESPONSE FORMAT:
 * {
 *   "success": true,
 *   "data": {
 *     "seatLayout": {...},
 *     "statistics": {...},
 *     "show": {...}
 *   },
 *   "message": "Optional success message",
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 * 
 * ERROR RESPONSE FORMAT:
 * {
 *   "success": false,
 *   "error": {
 *     "code": "SEAT_CONFLICT",
 *     "message": "Seats A1, A2 are already reserved",
 *     "details": {...},
 *     "timestamp": "2024-01-01T00:00:00.000Z",
 *     "requestId": "req_123456789"
 *   }
 * }
 * 
 * SEAT STATES:
 * - available: Can be selected and blocked
 * - blocked: Temporarily reserved (5-15 minutes)
 * - booked: Permanently reserved (confirmed booking)
 */

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. RATE LIMITING STRATEGY:
 *    - Current: Simple IP-based rate limiting
 *    - Issue: Legitimate users might be blocked, shared IPs
 *    - Improvement: User session-based limiting, progressive penalties
 * 
 * 2. ENDPOINT VERSIONING:
 *    - Current: Deprecation warning headers
 *    - Issue: No automatic migration path
 *    - Improvement: Automatic redirects, version sunset timeline
 * 
 * 3. SEAT BLOCKING VALIDATION:
 *    - Current: Basic validation in middleware
 *    - Issue: Business logic validation scattered
 *    - Improvement: Centralized business rule validation
 * 
 * 4. ERROR HANDLING:
 *    - Current: Generic error responses
 *    - Issue: Limited context for debugging conflicts
 *    - Improvement: More detailed conflict information
 * 
 * 5. CACHING STRATEGY:
 *    - Current: No caching for seat layouts
 *    - Issue: Database hit on every layout request
 *    - Improvement: Short-term caching with cache invalidation
 * 
 * 6. MONITORING:
 *    - Current: Basic logging
 *    - Issue: No metrics for seat blocking patterns
 *    - Improvement: Metrics for block success rates, popular seats
 */