/**
 * Show Routes
 * 
 * Defines all show-related API endpoints with validation and middleware.
 * Handles routing for show browsing, scheduling, and availability functionality.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

const express = require('express');
const showController = require('../controllers/showController');
const { validate, showSchemas, commonSchemas } = require('../middleware/requestValidator');
const { asyncHandler } = require('../middleware/errorHandler');
const Joi = require('joi');

const router = express.Router();

/**
 * @route GET /api/v1/shows
 * @description Get all shows with optional filtering
 * @query {string} movieId - Filter by movie ID (UUID, optional)
 * @query {string} date - Filter by show date (YYYY-MM-DD, optional)
 * @query {string} hallName - Filter by hall name (optional)
 * @query {boolean} availableOnly - Only shows with available seats (default: true)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @access Public
 * @example
 *   GET /api/v1/shows?date=2024-01-15&availableOnly=true
 *   GET /api/v1/shows?movieId=123e4567-e89b-12d3-a456-426614174000&page=1
 */
router.get('/',
  validate(showSchemas.getShowsQuery, 'query'),
  asyncHandler(showController.getAllShows)
);

/**
 * @route GET /api/v1/shows/date-range
 * @description Get shows within a specific date range
 * @query {string} startDate - Start date (YYYY-MM-DD, required)
 * @query {string} endDate - End date (YYYY-MM-DD, required)
 * @query {string} movieId - Filter by movie ID (UUID, optional)
 * @query {boolean} availableOnly - Only shows with available seats (default: true)
 * @access Public
 * @example
 *   GET /api/v1/shows/date-range?startDate=2024-01-15&endDate=2024-01-20
 *   GET /api/v1/shows/date-range?startDate=2024-01-15&endDate=2024-01-17&movieId=123e4567
 */
router.get('/date-range',
  validate({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    movieId: commonSchemas.uuid.optional(),
    availableOnly: Joi.boolean().default(true),
  }, 'query'),
  asyncHandler(showController.getShowsByDateRange)
);

/**
 * @route GET /api/v1/shows/movie/:movieId
 * @description Get all shows for a specific movie
 * @param {string} movieId - Movie ID (UUID format)
 * @query {string} date - Filter by specific date (YYYY-MM-DD, optional)
 * @access Public
 * @example
 *   GET /api/v1/shows/movie/123e4567-e89b-12d3-a456-426614174000
 *   GET /api/v1/shows/movie/123e4567-e89b-12d3-a456-426614174000?date=2024-01-15
 */
router.get('/movie/:movieId',
  validate({
    movieId: commonSchemas.uuid,
  }, 'params'),
  validate(showSchemas.showsByMovieQuery, 'query'),
  asyncHandler(showController.getShowsByMovie)
);

/**
 * @route GET /api/v1/shows/:id
 * @description Get detailed information about a specific show
 * @param {string} id - Show ID (UUID format)
 * @access Public
 * @example
 *   GET /api/v1/shows/123e4567-e89b-12d3-a456-426614174000
 */
router.get('/:id',
  validate(showSchemas.showIdParam, 'params'),
  asyncHandler(showController.getShowById)
);

/**
 * @route GET /api/v1/shows/:id/seats
 * @description Get seat layout for a specific show (delegates to seat controller)
 * @param {string} id - Show ID (UUID format)
 * @query {boolean} availableOnly - Only return available seats (default: false)
 * @access Public
 * @example
 *   GET /api/v1/shows/123e4567-e89b-12d3-a456-426614174000/seats
 */
router.get('/:id/seats',
  validate(showSchemas.showIdParam, 'params'),
  validate({
    availableOnly: Joi.boolean().default(false),
  }, 'query'),
  asyncHandler(async (req, res) => {
    // Delegate to seat controller
    const seatController = require('../controllers/seatController');
    req.params.showId = req.params.id; // Map id to showId for seat controller
    return seatController.getSeatLayout(req, res);
  })
);

module.exports = router;

/**
 * ROUTE DOCUMENTATION:
 * 
 * Show routes are primarily for browsing and discovery. All routes are public
 * and don't require authentication. They provide various filtering options
 * to help users find shows based on their preferences.
 * 
 * COMMON FILTERING OPTIONS:
 * - movieId: Filter shows for a specific movie
 * - date: Filter shows for a specific date
 * - hallName: Filter shows for a specific hall
 * - availableOnly: Only shows with available seats (default: true)
 * 
 * RESPONSE FORMAT:
 * {
 *   "success": true,
 *   "data": {
 *     "shows": [...],
 *     "pagination": {...},
 *     "filters": {...}
 *   },
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 * 
 * SHOW STATES:
 * - upcoming: Show is scheduled in the future
 * - live: Show has started but not ended
 * - completed: Show has ended
 * - sold_out: No available seats
 * 
 * TYPICAL USER FLOWS:
 * 1. Browse movies: GET /movies
 * 2. View movie details: GET /movies/:id
 * 3. View shows for movie: GET /shows/movie/:movieId
 * 4. Select specific show: GET /shows/:id
 * 5. View seat layout: GET /shows/:id/seats
 * 6. Block seats: POST /seats/block
 * 7. Create booking: POST /bookings
 */

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. CACHING HEADERS:
 *    - Current: No cache control headers
 *    - Issue: No browser/CDN caching optimization
 *    - Improvement: Add ETags, cache headers for static show data
 * 
 * 2. SEARCH FUNCTIONALITY:
 *    - Current: No search within shows
 *    - Issue: Users can't search by time, hall features, etc.
 *    - Improvement: Full-text search for show features, time ranges
 * 
 * 3. BULK OPERATIONS:
 *    - Current: Individual show queries
 *    - Issue: No bulk operations for multiple shows
 *    - Improvement: Bulk show queries, batch seat availability checks
 * 
 * 4. RECOMMENDATION ENDPOINTS:
 *    - Current: No personalized recommendations
 *    - Issue: Generic show listing only
 *    - Improvement: Recommendation endpoints based on user preferences
 * 
 * 5. REAL-TIME UPDATES:
 *    - Current: Static data on each request
 *    - Issue: Seat availability might be stale
 *    - Improvement: WebSocket endpoints for real-time availability updates
 * 
 * 6. GEOGRAPHIC FILTERING:
 *    - Current: No location-based filtering
 *    - Issue: All halls shown regardless of user location
 *    - Improvement: Location-based hall filtering, distance calculations
 */