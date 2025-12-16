/**
 * Logging Middleware
 * 
 * Provides structured logging functionality for the BookMyShow clone API.
 * Uses Winston for configurable, structured logging with multiple transports.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

const winston = require('winston');
const path = require('path');

/**
 * Custom log format for better readability
 * @type {winston.Logform.Format}
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

/**
 * Console format for development environment
 * @type {winston.Logform.Format}
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

/**
 * Winston logger configuration
 * @type {winston.Logger}
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'bookmyshow-api',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    // Write all logs with importance level of 'error' or less to 'error.log'
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write all logs with importance level of 'info' or less to 'combined.log'
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
    }),
  ],
});

/**
 * Add console transport in development environment
 */
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

/**
 * Request logging middleware
 * 
 * @description Logs incoming HTTP requests with timing information
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Generate request ID for tracing
  req.requestId = generateRequestId();
  
  // Log incoming request
  logger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - start;
    
    // Log response
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: JSON.stringify(body).length,
    });
    
    return originalJson.call(this, body);
  };
  
  // Handle response without json() call
  res.on('finish', () => {
    if (!res.headersSent) return;
    
    const duration = Date.now() - start;
    
    // Only log if json() wasn't called
    if (res.json === originalJson) {
      logger.info('Request completed', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });
    }
  });
  
  next();
};

/**
 * Generate unique request ID
 * @returns {string} Unique request identifier
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Database operation logger
 * 
 * @description Logs database operations for monitoring and debugging
 * @param {string} operation - Database operation type (SELECT, INSERT, UPDATE, DELETE)
 * @param {string} model - Model name
 * @param {Object} options - Additional logging options
 */
const logDatabaseOperation = (operation, model, options = {}) => {
  logger.debug('Database operation', {
    operation,
    model,
    duration: options.duration,
    affectedRows: options.affectedRows,
    query: options.query ? options.query.substring(0, 100) : undefined,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Security event logger
 * 
 * @description Logs security-related events for monitoring
 * @param {string} event - Security event type
 * @param {Object} details - Event details
 * @param {Request} req - Express request object (optional)
 */
const logSecurityEvent = (event, details, req = null) => {
  const logData = {
    securityEvent: event,
    ...details,
    timestamp: new Date().toISOString(),
  };
  
  if (req) {
    logData.requestId = req.requestId;
    logData.ip = req.ip;
    logData.userAgent = req.get('User-Agent');
    logData.url = req.originalUrl;
  }
  
  logger.warn('Security event detected', logData);
};

/**
 * Business logic logger
 * 
 * @description Logs important business events (bookings, payments, etc.)
 * @param {string} event - Business event type
 * @param {Object} data - Event data
 * @param {string} userId - User identifier (optional)
 */
const logBusinessEvent = (event, data, userId = null) => {
  logger.info('Business event', {
    businessEvent: event,
    userId,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Performance logger
 * 
 * @description Logs performance metrics for optimization
 * @param {string} operation - Operation name
 * @param {number} duration - Operation duration in milliseconds
 * @param {Object} metadata - Additional performance metadata
 */
const logPerformance = (operation, duration, metadata = {}) => {
  const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
  
  logger.log(level, 'Performance metric', {
    operation,
    duration: `${duration}ms`,
    slow: duration > 1000,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Error logger with context
 * 
 * @description Enhanced error logging with request context
 * @param {Error} error - Error object
 * @param {Request} req - Express request object (optional)
 * @param {Object} context - Additional context
 */
const logError = (error, req = null, context = {}) => {
  const logData = {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
    timestamp: new Date().toISOString(),
  };
  
  if (req) {
    logData.requestId = req.requestId;
    logData.method = req.method;
    logData.url = req.originalUrl;
    logData.userAgent = req.get('User-Agent');
    logData.ip = req.ip;
  }
  
  logger.error('Application error', logData);
};

/**
 * Create logs directory if it doesn't exist
 */
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

module.exports = {
  logger,
  requestLogger,
  logDatabaseOperation,
  logSecurityEvent,
  logBusinessEvent,
  logPerformance,
  logError,
};

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. LOG AGGREGATION:
 *    - Current: File-based logging only
 *    - Issue: Difficult to search and analyze logs across instances
 *    - Improvement: ELK stack, Fluentd, or cloud logging services
 * 
 * 2. STRUCTURED LOGGING:
 *    - Current: JSON format with some structure
 *    - Issue: Inconsistent log schema across different events
 *    - Improvement: Standardized log schema, log validation
 * 
 * 3. LOG ROTATION:
 *    - Current: Winston handles basic file rotation
 *    - Issue: No compression, limited rotation policies
 *    - Improvement: Advanced rotation with compression, archival
 * 
 * 4. SENSITIVE DATA PROTECTION:
 *    - Current: No automatic scrubbing of sensitive data
 *    - Issue: Risk of logging passwords, tokens, etc.
 *    - Improvement: Automatic PII detection and redaction
 * 
 * 5. PERFORMANCE IMPACT:
 *    - Current: Synchronous logging operations
 *    - Issue: Can block request processing
 *    - Improvement: Asynchronous logging, buffering
 * 
 * 6. LOG CORRELATION:
 *    - Current: Basic request ID correlation
 *    - Issue: No distributed tracing, limited correlation
 *    - Improvement: Distributed tracing, correlation IDs
 */