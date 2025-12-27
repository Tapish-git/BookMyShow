/**
 * Movie Routes
 * 
 * Defines all movie-related API endpoints with validation and middleware.
 * Handles routing for movie browsing, search, and details functionality.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

console.log('🔧 [movieRoutes.js] File loading started...');

const express = require('express');
console.log('✅ [movieRoutes.js] express loaded');

const movieController = require('../controllers/movieController');
console.log('✅ [movieRoutes.js] movieController loaded');
const { validate, movieSchemas, commonSchemas } = require('../middleware/requestValidator');
console.log('✅ [movieRoutes.js] requestValidator loaded');
const { asyncHandler } = require('../middleware/errorHandler');
console.log('✅ [movieRoutes.js] errorHandler loaded');

const router = express.Router();
console.log('✅ [movieRoutes.js] Router created');
console.log('🎉 [movieRoutes.js] ALL IMPORTS SUCCESSFUL!');

/**
 * @route GET /api/v1/movies
 * @description Get all movies with optional filtering
 * @query {string} genre - Filter by genre (optional)
 * @query {string} language - Filter by language (optional)
 * @query {string} search - Search in movie titles (optional)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @access Public
 * @example
 *   GET /api/v1/movies?genre=Action&page=1&limit=10
 *   GET /api/v1/movies?search=avengers&language=English
 */
router.get('/',
  validate(movieSchemas.getMoviesQuery, 'query'),
  asyncHandler(movieController.getAllMovies)
);

/**
 * @route GET /api/v1/movies/search
 * @description Search movies by title, description, or genre
 * @query {string} q - Search query (required, min: 1 char, max: 100 chars)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 50)
 * @access Public
 * @example
 *   GET /api/v1/movies/search?q=spider&page=1&limit=5
 */
router.get('/search',
  validate({
    q: commonSchemas.searchQuery,
    page: movieSchemas.getMoviesQuery.extract('page'),
    limit: movieSchemas.getMoviesQuery.extract('limit'),
  }, 'query'),
  asyncHandler(movieController.searchMovies)
);

/**
 * @route GET /api/v1/movies/now-showing
 * @description Get currently showing movies (movies with upcoming shows)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20)
 * @access Public
 * @example
 *   GET /api/v1/movies/now-showing?page=1&limit=20
 */
router.get('/now-showing',
  validate({
    page: movieSchemas.getMoviesQuery.extract('page'),
    limit: movieSchemas.getMoviesQuery.extract('limit'),
  }, 'query'),
  asyncHandler(movieController.getNowShowingMovies)
);

/**
 * @route GET /api/v1/movies/genre/:genre
 * @description Get movies by specific genre
 * @param {string} genre - Movie genre (Action, Comedy, Drama, etc.)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 12)
 * @access Public
 * @example
 *   GET /api/v1/movies/genre/Action?page=1&limit=12
 */
router.get('/genre/:genre',
  validate({
    genre: require('joi').string().valid(
      'Action', 'Comedy', 'Drama', 'Horror', 'Romance',
      'Sci-Fi', 'Thriller', 'Adventure', 'Animation', 'Family'
    ).required(),
  }, 'params'),
  validate({
    page: movieSchemas.getMoviesQuery.extract('page'),
    limit: movieSchemas.getMoviesQuery.extract('limit'),
  }, 'query'),
  asyncHandler(movieController.getMoviesByGenre)
);

/**
 * @route GET /api/v1/movies/:id
 * @description Get movie details by ID with show information
 * @param {string} id - Movie ID (UUID format)
 * @access Public
 * @example
 *   GET /api/v1/movies/123e4567-e89b-12d3-a456-426614174000
 */
router.get('/:id',
  validate(movieSchemas.movieIdParam, 'params'),
  asyncHandler(movieController.getMovieById)
);

/**
 * @route GET /api/v1/movies/:id/shows
 * @description Get shows for a specific movie
 * @param {string} id - Movie ID (UUID format)
 * @query {string} date - Filter by specific date (YYYY-MM-DD, optional)
 * @access Public
 * @example
 *   GET /api/v1/movies/123e4567-e89b-12d3-a456-426614174000/shows
 *   GET /api/v1/movies/123e4567-e89b-12d3-a456-426614174000/shows?date=2024-01-15
 */
router.get('/:id/shows',
  validate(movieSchemas.movieIdParam, 'params'),
  validate(movieSchemas.showsByMovieQuery, 'query'),
  asyncHandler(async (req, res) => {
    // This endpoint delegates to the show controller
    const showController = require('../controllers/showController');
    req.query.movieId = req.params.id; // Add movieId to query
    return showController.getShowsByMovie(req, res);
  })
);

module.exports = router;

/**
 * ROUTE DOCUMENTATION:
 * 
 * All movie routes are public and don't require authentication.
 * They support various query parameters for filtering and pagination.
 * 
 * COMMON RESPONSE FORMAT:
 * {
 *   "success": true,
 *   "data": {
 *     "movies": [...],
 *     "pagination": {...},
 *     "filters": {...}
 *   },
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 * 
 * ERROR RESPONSE FORMAT:
 * {
 *   "success": false,
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Error description",
 *     "details": {...},
 *     "timestamp": "2024-01-01T00:00:00.000Z",
 *     "requestId": "req_123456789"
 *   }
 * }
 */

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. ROUTE ORGANIZATION:
 *    - Current: All movie routes in single file
 *    - Issue: Could become large with more endpoints
 *    - Improvement: Split into sub-routers (search, details, etc.)
 * 
 * 2. VALIDATION CONSISTENCY:
 *    - Current: Mixed validation schemas
 *    - Issue: Some validations are inline, others imported
 *    - Improvement: Consistent validation schema organization
 * 
 * 3. CACHING HEADERS:
 *    - Current: No cache control headers
 *    - Issue: No browser/CDN caching optimization
 *    - Improvement: Add appropriate cache headers for static data
 * 
 * 4. API VERSIONING:
 *    - Current: Version in URL path
 *    - Issue: No deprecation strategy
 *    - Improvement: Header-based versioning, deprecation notices
 * 
 * 5. RATE LIMITING:
 *    - Current: Global rate limiting only
 *    - Issue: No endpoint-specific limits
 *    - Improvement: Different limits for search vs browse endpoints
 * 
 * 6. DOCUMENTATION:
 *    - Current: Comments in code
 *    - Issue: No interactive API documentation
 *    - Improvement: OpenAPI/Swagger documentation
 */