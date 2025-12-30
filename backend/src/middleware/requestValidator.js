/**
 * Request Validation Middleware
 * 
 * Provides input validation, sanitization, and security checks for incoming requests.
 * Uses Joi for schema validation and implements security best practices.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

const Joi = require('joi');
const { RequestValidationError, UnauthorizedError } = require('./errorHandler');
const { logSecurityEvent } = require('./logger');

/**
 * Common validation schemas used across different endpoints
 */
const commonSchemas = {
  // UUID validation
  uuid: Joi.string().uuid({ version: 'uuidv4' }).required(),
  
  // Pagination parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0),
  }),
  
  // Date validation
  date: Joi.date().iso().required(),
  futureDate: Joi.date().iso().min('now').required(),
  
  // Email validation
  email: Joi.string().email().max(255).required(),
  
  // Phone number validation (Indian format)
  phone: Joi.string().pattern(/^[+]?[\d\s-()]{10,20}$/).optional(),
  
  // Name validation
  name: Joi.string().min(2).max(255).pattern(/^[a-zA-Z\s.'-]+$/).required(),
  
  // Search query validation
  searchQuery: Joi.string().min(1).max(100).trim().required(),
};

/**
 * Movie-related validation schemas
 */
const movieSchemas = {
  // Get movies query parameters
  getMoviesQuery: Joi.object({
    genre: Joi.string().valid('Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Adventure', 'Animation', 'Family').optional(),
    language: Joi.string().valid('English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi').optional(),
    search: Joi.string().min(1).max(100).trim().optional(),
    ...commonSchemas.pagination.describe(),
  }),
  
  // Movie ID parameter
  movieIdParam: Joi.object({
    id: commonSchemas.uuid,
  }),
};

/**
 * Show-related validation schemas
 */
const showSchemas = {
  // Get shows query parameters
  getShowsQuery: Joi.object({
    movieId: commonSchemas.uuid.optional(),
    date: Joi.date().iso().min('now').optional(),
    hallName: Joi.string().valid('Hall-1', 'Hall-2', 'Hall-3', 'Premium-Hall', 'IMAX-Hall').optional(),
    availableOnly: Joi.boolean().default(true),
    ...commonSchemas.pagination.describe(),
  }),
  
  // Show ID parameter
  showIdParam: Joi.object({
    id: commonSchemas.uuid,
  }),
  
  // Get shows by movie and date
  showsByMovieQuery: Joi.object({
    date: Joi.date().iso().min('now').optional(),
  }),
};

/**
 * Seat-related validation schemas
 */
const seatSchemas = {
  // Seat blocking request
  blockSeatsBody: Joi.object({
    showId: commonSchemas.uuid,
    seatIds: Joi.array().items(commonSchemas.uuid).min(1).max(10).unique().required(),
    blockDuration: Joi.number().integer().min(1).max(15).default(5), // minutes
  }),
  
  // Seat release request
  releaseSeatsBody: Joi.object({
    seatIds: Joi.array().items(commonSchemas.uuid).min(1).max(10).unique().required(),
  }),
  
  // Get seats query
  getSeatsQuery: Joi.object({
    showId: commonSchemas.uuid,
    availableOnly: Joi.boolean().default(false),
  }),
};

/**
 * Booking-related validation schemas
 */
const bookingSchemas = {
  // Create booking request
  createBookingBody: Joi.object({
    showId: commonSchemas.uuid,
    seatIds: Joi.array().items(commonSchemas.uuid).min(1).max(10).unique().required(),
    userDetails: Joi.object({
      name: commonSchemas.name,
      email: commonSchemas.email,
      phone: commonSchemas.phone.optional(),
    }).required(),
  }),
  
  // Get booking by reference
  bookingReferenceParam: Joi.object({
    reference: Joi.string().pattern(/^BMS[A-Z0-9]{8}$/).required(),
  }),
  
  // Cancel booking request
  cancelBookingBody: Joi.object({
    reason: Joi.string().max(500).optional(),
  }),
  
  // Get user bookings
  userBookingsQuery: Joi.object({
    email: commonSchemas.email,
    ...commonSchemas.pagination.describe(),
  }),
};

/**
 * Generic validation middleware factory
 * 
 * @description Creates validation middleware for different parts of the request
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    // Support passing plain object schema maps by wrapping with Joi.object()
    const joiSchema = (schema && typeof schema.validate === 'function')
      ? schema
      : Joi.object(schema || {});

    const { error, value } = joiSchema.validate(req[property], {
      abortEarly: false, // Return all validation errors
      stripUnknown: true, // Remove unknown properties
      convert: true, // Convert values to correct types
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
        type: detail.type,
      }));

      // Log validation failure
      logSecurityEvent('VALIDATION_FAILED', {
        property,
        errors: validationErrors,
        originalValue: req[property],
      }, req);

      throw new RequestValidationError(
        `${property} validation failed`,
        validationErrors
      );
    }

    // Replace the property with validated and sanitized value
    req[property] = value;
    next();
  };
};

/**
 * Input sanitization middleware
 * 
 * @description Sanitizes user input to prevent XSS and injection attacks
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize function to clean potentially dangerous characters
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .trim()
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, ''); // Remove event handlers
    } else if (Array.isArray(obj)) {
      return obj.map(sanitize);
    } else if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[sanitize(key)] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body, query, and params
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

/**
 * Request size validation middleware
 * 
 * @description Validates request payload size to prevent DoS attacks
 * @param {number} maxSize - Maximum allowed size in bytes
 * @returns {Function} Express middleware function
 */
const validateRequestSize = (maxSize = 1024 * 1024) => { // Default 1MB
  return (req, res, next) => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      logSecurityEvent('REQUEST_TOO_LARGE', {
        contentLength: parseInt(contentLength),
        maxSize,
        url: req.originalUrl,
      }, req);
      
      throw new RequestValidationError(
        'Request payload too large',
        [{ field: 'Content-Length', message: `Exceeds maximum size of ${maxSize} bytes` }]
      );
    }
    
    next();
  };
};

/**
 * Content-Type validation middleware
 * 
 * @description Validates Content-Type header for specific endpoints
 * @param {Array} allowedTypes - Array of allowed content types
 * @returns {Function} Express middleware function
 */
const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    const contentType = req.get('Content-Type');
    
    // Skip validation for GET requests
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }
    
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      logSecurityEvent('INVALID_CONTENT_TYPE', {
        contentType,
        allowedTypes,
        method: req.method,
      }, req);
      
      throw new RequestValidationError(
        'Invalid Content-Type',
        [{ field: 'Content-Type', message: `Must be one of: ${allowedTypes.join(', ')}` }]
      );
    }
    
    next();
  };
};

/**
 * Rate limiting validation (additional to express-rate-limit)
 * 
 * @description Custom rate limiting logic for specific operations
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware function
 */
const customRateLimit = (options = {}) => {
  const {
    windowMs = 60 * 1000, // 1 minute
    maxRequests = 10,
    keyGenerator = (req) => req.ip,
    message = 'Too many requests',
  } = options;
  
  const requests = new Map();
  
  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this key
    const userRequests = requests.get(key) || [];
    
    // Filter out old requests
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        key,
        requestCount: recentRequests.length,
        maxRequests,
        windowMs,
      }, req);
      
      throw new RequestValidationError(
        message,
        [{ field: 'rate_limit', message: `Exceeded ${maxRequests} requests per ${windowMs}ms` }]
      );
    }
    
    // Add current request
    recentRequests.push(now);
    requests.set(key, recentRequests);
    
    // Cleanup old entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
      for (const [mapKey, timestamps] of requests.entries()) {
        const validTimestamps = timestamps.filter(ts => ts > windowStart);
        if (validTimestamps.length === 0) {
          requests.delete(mapKey);
        } else {
          requests.set(mapKey, validTimestamps);
        }
      }
    }
    
    next();
  };
};

/**
 * Security headers validation
 * 
 * @description Validates presence of important security headers
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
const validateSecurityHeaders = (req, res, next) => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\(/i,
    /expression\(/i,
  ];
  
  // Check headers for suspicious content
  for (const [header, value] of Object.entries(req.headers)) {
    if (typeof value === 'string' && suspiciousPatterns.some(pattern => pattern.test(value))) {
      logSecurityEvent('SUSPICIOUS_HEADER', {
        header,
        value,
        pattern: suspiciousPatterns.find(pattern => pattern.test(value)).toString(),
      }, req);
      
      throw new RequestValidationError(
        'Malicious content detected in headers',
        [{ field: header, message: 'Contains potentially malicious content' }]
      );
    }
  }
  
  next();
};

module.exports = {
  // Schema collections
  movieSchemas,
  showSchemas,
  seatSchemas,
  bookingSchemas,
  commonSchemas,
  
  // Validation middleware
  validate,
  sanitizeInput,
  validateRequestSize,
  validateContentType,
  validateSecurityHeaders,
  customRateLimit,
};

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. VALIDATION PERFORMANCE:
 *    - Current: Schema validation on every request
 *    - Issue: Performance overhead for complex schemas
 *    - Improvement: Schema compilation, caching, async validation
 * 
 * 2. CUSTOM VALIDATIONS:
 *    - Current: Basic Joi validations with some custom logic
 *    - Issue: Limited business logic validation in schemas
 *    - Improvement: Custom validation functions, database-dependent validations
 * 
 * 3. ERROR MESSAGES:
 *    - Current: Technical validation error messages
 *    - Issue: Poor user experience, not localized
 *    - Improvement: User-friendly messages, internationalization
 * 
 * 4. SECURITY MEASURES:
 *    - Current: Basic sanitization and validation
 *    - Issue: Limited protection against advanced attacks
 *    - Improvement: Advanced XSS protection, CSP headers, input encoding
 * 
 * 5. RATE LIMITING:
 *    - Current: In-memory rate limiting
 *    - Issue: Doesn't work across multiple server instances
 *    - Improvement: Redis-based rate limiting, distributed rate limiting
 * 
 * 6. SCHEMA EVOLUTION:
 *    - Current: Static schemas defined in code
 *    - Issue: No versioning or dynamic schema updates
 *    - Improvement: Schema versioning, configuration-driven validation
 */