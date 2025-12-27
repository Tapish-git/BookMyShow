/**
 * Express Application Setup
 * 
 * Main application file that configures Express server, middleware, routes,
 * and error handling for the BookMyShow clone backend API.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

console.log('🔧 [app.js] File loading started...');

process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:');
  console.error('Name:', error.name);
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

const express = require('express');
console.log('✅ [app.js] express loaded');

const cors = require('cors');
console.log('✅ [app.js] cors loaded');

const helmet = require('helmet');
console.log('✅ [app.js] helmet loaded');

const rateLimit = require('express-rate-limit');
console.log('✅ [app.js] express-rate-limit loaded');

const session = require('express-session');
console.log('✅ [app.js] express-session loaded');

const SequelizeStore = require('connect-session-sequelize')(session.Store);
console.log('✅ [app.js] connect-session-sequelize loaded');

require('dotenv').config();
console.log('✅ [app.js] dotenv configured');

// Import database connection and models
console.log('🛠️ [app.js] About to load models...');
const { sequelize, initializeDatabase, healthCheck } = require('./models');
console.log('✅ [app.js] models loaded');

// Import middleware
console.log('🛠️ [app.js] About to load middleware...');
const logger = require('./middleware/logger');
console.log('✅ [app.js] logger loaded');
const errorHandler = require('./middleware/errorHandler');
console.log('✅ [app.js] errorHandler loaded');
const requestValidator = require('./middleware/requestValidator');
console.log('✅ [app.js] requestValidator loaded');

// Import routes
// console.log('🛠️ [app.js] About to load routes...');
// const movieRoutes = require('./routes/movieRoutes');
// console.log('✅ [app.js] movieRoutes loaded');
// const showRoutes = require('./routes/showRoutes');
// console.log('✅ [app.js] showRoutes loaded');
// const seatRoutes = require('./routes/seatRoutes');
// console.log('✅ [app.js] seatRoutes loaded');
// const bookingRoutes = require('./routes/bookingRoutes');
// console.log('✅ [app.js] bookingRoutes loaded');
// const healthRoutes = require('./routes/healthRoutes');
// console.log('✅ [app.js] healthRoutes loaded');

// Import routes
console.log('🛠️ [app.js] About to load routes...');

let movieRoutes, showRoutes, seatRoutes, bookingRoutes, healthRoutes;

try {
  movieRoutes = require('./routes/movieRoutes');
  console.log('✅ [app.js] movieRoutes loaded');
} catch (error) {
  console.error('❌ [app.js] FAILED to load movieRoutes:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}

try {
  showRoutes = require('./routes/showRoutes');
  console.log('✅ [app.js] showRoutes loaded');
} catch (error) {
  console.error('❌ [app.js] FAILED to load showRoutes:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}

try {
  seatRoutes = require('./routes/seatRoutes');
  console.log('✅ [app.js] seatRoutes loaded');
} catch (error) {
  console.error('❌ [app.js] FAILED to load seatRoutes:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}

try {
  bookingRoutes = require('./routes/bookingRoutes');
  console.log('✅ [app.js] bookingRoutes loaded');
} catch (error) {
  console.error('❌ [app.js] FAILED to load bookingRoutes:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}

try {
  healthRoutes = require('./routes/healthRoutes');
  console.log('✅ [app.js] healthRoutes loaded');
} catch (error) {
  console.error('❌ [app.js] FAILED to load healthRoutes:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}


console.log('✅ [app.js] ALL MODULES LOADED SUCCESSFULLY!');

/**
 * Create Express application instance
 * @type {Express}
 */
const app = express();

/**
 * Configuration constants
 */
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
// Remove trailing slash from FRONTEND_URL to prevent CORS issues
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3001').replace(/\/$/, '');

/**
 * Trust proxy (important for deployment behind reverse proxy)
 */
app.set('trust proxy', 1);

/**
 * Security Middleware
 * 
 * @description Apply security headers and configurations
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

/**
 * CORS Configuration
 * 
 * @description Configure cross-origin resource sharing for frontend
 */
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow frontend URL and localhost for development
    const allowedOrigins = [
      FRONTEND_URL,
      'http://localhost:3001',
      'http://localhost:3000',
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

/**
 * Rate Limiting
 * 
 * @description Prevent abuse by limiting requests per IP
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/api/', limiter);

/**
 * Request Parsing Middleware
 * 
 * @description Parse incoming request bodies
 */
app.use(express.json({
  limit: '10mb',
  type: 'application/json',
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
}));

/**
 * Session Configuration
 * 
 * @description Configure session management using database store
 */
const sessionStore = new SequelizeStore({
  db: sequelize,
  table: 'sessions',
  extendDefaultFields: (defaults, session) => {
    return {
      data: defaults.data,
      expires: defaults.expires,
      user_id: session.userId || null,
    };
  },
});

app.use(session({
  name: 'bookmyshow.sid',
  secret: process.env.SESSION_SECRET || 'default-secret-key-change-in-production',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    // secure: NODE_ENV === 'production', // Use secure cookies in production
    secure: false, // Use secure cookies in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
  },
}));

/**
 * Custom Middleware
 * 
 * @description Apply custom application middleware
 */
app.use(logger.requestLogger); // Log all requests
app.use(requestValidator.sanitizeInput); // Sanitize user input

/**
 * Health Check Endpoint (before other routes)
 * 
 * @description Simple health check for load balancers
 */
app.get('/health', async (req, res) => {
  const health = await healthCheck();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

/**
 * API Routes
 * 
 * @description Mount all API route handlers
 */
const API_VERSION = process.env.API_VERSION || 'v1';

app.use(`/api/${API_VERSION}/movies`, movieRoutes);
app.use(`/api/${API_VERSION}/shows`, showRoutes);
app.use(`/api/${API_VERSION}/seats`, seatRoutes);
app.use(`/api/${API_VERSION}/bookings`, bookingRoutes);
app.use(`/api/${API_VERSION}/health`, healthRoutes);

/**
 * Welcome Route
 * 
 * @description Basic welcome message for API root
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to BookMyShow Clone API',
    version: API_VERSION,
    documentation: '/api/docs',
    health: '/health',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

/**
 * 404 Handler
 * 
 * @description Handle requests to non-existent routes
 */
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`,
    method: req.method,
    availableRoutes: [
      `GET /api/${API_VERSION}/movies`,
      `GET /api/${API_VERSION}/shows`,
      `POST /api/${API_VERSION}/seats/block`,
      `POST /api/${API_VERSION}/bookings`,
      'GET /health',
    ],
  });
});

/**
 * Error Handling Middleware
 * 
 * @description Centralized error handling (must be last middleware)
 */
app.use(errorHandler.handleValidationError);
app.use(errorHandler.handleDatabaseError);
app.use(errorHandler.globalErrorHandler);

/**
 * Initialize Database and Start Server
 * 
 * @description Set up database connection and start the Express server
 */
const startServer = async () => {
  try {
    console.log('========================================');
    console.log('🚀 STEP 1: Starting BookMyShow Clone API Server...');
    console.log(`📊 Environment: ${NODE_ENV}`);
    console.log(`📍 PORT: ${PORT}`);
    console.log(`📍 FRONTEND_URL: ${FRONTEND_URL}`);
    console.log('========================================');

    // Initialize database
    console.log('🚀 STEP 2: About to call initializeDatabase()...');
    try {
      await initializeDatabase();
      console.log('✅ STEP 2 COMPLETE: Database initialized successfully');
    } catch (dbError) {
      console.error('❌ STEP 2 FAILED: Database initialization error');
      console.error('Error name:', dbError.name);
      console.error('Error message:', dbError.message);
      console.error('Error stack:', dbError.stack);
      throw dbError;
    }

    // Session store will auto-create the table on first use
    console.log('✅ STEP 3 COMPLETE: Session store configured (table will be created on first use)');

    // Start server
    console.log('🚀 STEP 4: About to start HTTP server...');
    console.log(`Binding to 0.0.0.0:${PORT}...`);
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('========================================');
      console.log('✅ ✅ ✅ SERVER STARTED SUCCESSFULLY! ✅ ✅ ✅');
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api/${API_VERSION}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`📚 Welcome: http://localhost:${PORT}/`);
      console.log('========================================');
    });

    /**
     * Graceful Shutdown Handler
     * 
     * @description Handle SIGTERM and SIGINT signals for graceful shutdown
     */
    const gracefulShutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

      server.close(async () => {
        console.log('📴 HTTP server closed');

        try {
          await sequelize.close();
          console.log('📴 Database connections closed');
          console.log('✅ Graceful shutdown completed');
          // process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error.message);
          // process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('⏰ Could not close connections in time, forcefully shutting down');
        // process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    // process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    // process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;

  } catch (error) {
    console.error('❌ CRITICAL: Failed to start server', error);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    // process.exit(1);
  }
};

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // process.exit(1);
});

// Export app for testing and server instance for direct execution
module.exports = app;

// Start server if this file is run directly
console.log('🔧 [app.js] Checking if file is main module...');
console.log('require.main === module:', require.main === module);

if (require.main === module) {
  console.log('✅ [app.js] File IS main module, calling startServer()...');
  startServer().catch(error => {
    console.error('❌ Fatal error during startup:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  });
} else {
  console.log('ℹ️ [app.js] File is NOT main module, exporting app only');
}

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. SESSION MANAGEMENT:
 *    - Current: Server-side sessions with database storage
 *    - Issue: Doesn't scale horizontally without sticky sessions
 *    - Improvement: JWT tokens, Redis session store, stateless authentication
 * 
 * 2. SECURITY HARDENING:
 *    - Current: Basic helmet configuration and rate limiting
 *    - Issue: No input sanitization, CSRF protection
 *    - Improvement: express-validator, CSRF tokens, input sanitization
 * 
 * 3. ERROR HANDLING:
 *    - Current: Basic error middleware
 *    - Issue: No error classification, limited error context
 *    - Improvement: Structured error types, error reporting service
 * 
 * 4. MONITORING & OBSERVABILITY:
 *    - Current: Basic console logging
 *    - Issue: No metrics, tracing, or structured logging
 *    - Improvement: Winston structured logging, metrics collection, APM
 * 
 * 5. API VERSIONING:
 *    - Current: Simple version prefix in routes
 *    - Issue: No deprecation strategy, breaking change handling
 *    - Improvement: Header-based versioning, deprecation warnings
 * 
 * 6. GRACEFUL SHUTDOWN:
 *    - Current: Basic signal handling
 *    - Issue: No connection draining, active request handling
 *    - Improvement: Connection draining, request completion tracking
 */