/**
 * Error Handling Middleware
 * 
 * Centralized error handling for the BookMyShow clone API.
 * Provides consistent error responses and proper error logging.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

const { ValidationError, DatabaseError, ConnectionError } = require('sequelize');
const { logError } = require('./logger');

/**
 * Custom error classes for better error handling
 */

/**
 * Base API Error class
 */
class APIError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // This is a trusted error
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Business logic error class
 */
class BusinessLogicError extends APIError {
  constructor(message, details = null) {
    super(message, 400, 'BUSINESS_LOGIC_ERROR', details);
    this.name = 'BusinessLogicError';
  }
}

/**
 * Resource not found error class
 */
class NotFoundError extends APIError {
  constructor(resource, identifier = null) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', { resource, identifier });
    this.name = 'NotFoundError';
  }
}

/**
 * Validation error class
 */
class RequestValidationError extends APIError {
  constructor(message, validationErrors = []) {
    super(message, 422, 'VALIDATION_ERROR', validationErrors);
    this.name = 'RequestValidationError';
  }
}

/**
 * Authorization error class
 */
class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/**
 * Conflict error class (for race conditions, duplicate resources, etc.)
 */
class ConflictError extends APIError {
  constructor(message, details = null) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limiting error class
 */
class RateLimitError extends APIError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

/**
 * Handle Sequelize validation errors
 * 
 * @description Converts Sequelize validation errors to consistent API format
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
const handleValidationError = (err, req, res, next) => {
  if (err instanceof ValidationError) {
    const validationErrors = err.errors.map(error => ({
      field: error.path,
      message: error.message,
      value: error.value,
      type: error.validatorKey || error.type,
    }));

    const apiError = new RequestValidationError(
      'Request validation failed',
      validationErrors
    );

    // Log the validation error
    logError(apiError, req, {
      originalError: err.message,
      validationDetails: validationErrors,
    });

    return res.status(apiError.statusCode).json({
      success: false,
      error: {
        code: apiError.errorCode,
        message: apiError.message,
        details: apiError.details,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      },
    });
  }

  next(err);
};

/**
 * Handle Sequelize database errors
 * 
 * @description Converts database errors to user-friendly messages
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
const handleDatabaseError = (err, req, res, next) => {
  let apiError;

  if (err instanceof DatabaseError || err instanceof ConnectionError) {
    // Log the original database error for debugging
    logError(err, req, {
      errorType: 'DATABASE_ERROR',
      sql: err.sql,
      parameters: err.parameters,
    });

    // Create user-friendly error message
    if (err.name === 'SequelizeUniqueConstraintError') {
      apiError = new ConflictError('Resource already exists', {
        fields: err.fields,
        value: err.value,
      });
    } else if (err.name === 'SequelizeForeignKeyConstraintError') {
      apiError = new BusinessLogicError('Referenced resource does not exist', {
        table: err.table,
        fields: err.fields,
      });
    } else if (err.name === 'SequelizeConnectionError') {
      apiError = new APIError('Database connection failed', 503, 'SERVICE_UNAVAILABLE');
    } else {
      // Generic database error
      apiError = new APIError(
        'Database operation failed',
        500,
        'DATABASE_ERROR',
        process.env.NODE_ENV === 'development' ? { originalError: err.message } : null
      );
    }

    return res.status(apiError.statusCode).json({
      success: false,
      error: {
        code: apiError.errorCode,
        message: apiError.message,
        details: apiError.details,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      },
    });
  }

  next(err);
};

/**
 * Global error handler
 * 
 * @description Handles all unhandled errors and provides consistent error responses
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
const globalErrorHandler = (err, req, res, next) => {
  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  let apiError;

  // Handle known API errors
  if (err instanceof APIError) {
    apiError = err;
  } else {
    // Handle unknown errors
    logError(err, req, {
      errorType: 'UNKNOWN_ERROR',
      stack: err.stack,
    });

    // Don't expose internal error details in production
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message;

    apiError = new APIError(message, 500, 'INTERNAL_ERROR');
  }

  // Log operational errors too (for monitoring)
  if (apiError.isOperational) {
    logError(apiError, req, {
      errorType: 'OPERATIONAL_ERROR',
      statusCode: apiError.statusCode,
    });
  }

  // Send error response
  res.status(apiError.statusCode).json({
    success: false,
    error: {
      code: apiError.errorCode,
      message: apiError.message,
      details: apiError.details,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    },
  });
};

/**
 * Async error wrapper
 * 
 * @description Wraps async route handlers to catch and forward errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function that catches errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create error response helper
 * 
 * @description Helper function to create consistent error responses
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {*} details - Additional error details
 * @param {string} requestId - Request identifier
 */
const createErrorResponse = (res, statusCode, message, code = 'ERROR', details = null, requestId = null) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId,
    },
  });
};

/**
 * Handle 404 errors (route not found)
 * 
 * @description Middleware to handle requests to non-existent routes
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
const handle404 = (req, res, next) => {
  const error = new NotFoundError('Route', req.originalUrl);
  next(error);
};

/**
 * Handle specific business logic errors
 */

/**
 * Seat booking conflict handler
 * @param {string} seatId - Seat identifier
 * @param {string} reason - Conflict reason
 * @returns {ConflictError} Formatted conflict error
 */
const createSeatConflictError = (seatId, reason = 'Seat is already reserved') => {
  return new ConflictError(reason, {
    seatId,
    conflictType: 'SEAT_RESERVATION',
  });
};

/**
 * Show capacity exceeded handler
 * @param {string} showId - Show identifier
 * @param {number} requestedSeats - Number of seats requested
 * @param {number} availableSeats - Number of seats available
 * @returns {BusinessLogicError} Formatted business logic error
 */
const createCapacityError = (showId, requestedSeats, availableSeats) => {
  return new BusinessLogicError(
    `Cannot book ${requestedSeats} seats. Only ${availableSeats} seats available.`,
    {
      showId,
      requestedSeats,
      availableSeats,
      errorType: 'INSUFFICIENT_CAPACITY',
    }
  );
};

/**
 * Expired block error handler
 * @param {string} seatId - Seat identifier
 * @returns {BusinessLogicError} Formatted business logic error
 */
const createExpiredBlockError = (seatId) => {
  return new BusinessLogicError(
    'Seat selection has expired. Please select seats again.',
    {
      seatId,
      errorType: 'EXPIRED_BLOCK',
    }
  );
};

module.exports = {
  // Error classes
  APIError,
  BusinessLogicError,
  NotFoundError,
  RequestValidationError,
  UnauthorizedError,
  ConflictError,
  RateLimitError,

  // Error handlers
  handleValidationError,
  handleDatabaseError,
  globalErrorHandler,
  handle404,

  // Utilities
  asyncHandler,
  createErrorResponse,

  // Business logic error creators
  createSeatConflictError,
  createCapacityError,
  createExpiredBlockError,
};

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. ERROR CLASSIFICATION:
 *    - Current: Basic error types with status codes
 *    - Issue: Limited error categorization for monitoring
 *    - Improvement: More granular error types, error severity levels
 * 
 * 2. ERROR RECOVERY:
 *    - Current: No automatic error recovery mechanisms
 *    - Issue: Some errors could be handled gracefully
 *    - Improvement: Retry mechanisms, circuit breakers
 * 
 * 3. ERROR MONITORING:
 *    - Current: Basic logging of errors
 *    - Issue: No alerting or error tracking integration
 *    - Improvement: Error tracking service integration (Sentry, Bugsnag)
 * 
 * 4. USER EXPERIENCE:
 *    - Current: Technical error messages exposed to users
 *    - Issue: Poor user experience with technical errors
 *    - Improvement: User-friendly error messages, localization
 * 
 * 5. ERROR CONTEXT:
 *    - Current: Basic request context in errors
 *    - Issue: Limited context for debugging complex issues
 *    - Improvement: Enhanced context tracking, user session info
 * 
 * 6. SECURITY CONSIDERATIONS:
 *    - Current: Some internal details exposed in development
 *    - Issue: Potential information leakage
 *    - Improvement: Better separation of internal vs external error details
 */