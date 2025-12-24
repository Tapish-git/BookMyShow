/**
 * Database Configuration
 * 
 * This file configures the database connection settings for different environments.
 * Uses Sequelize ORM for MySQL database operations.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Database configuration object for different environments
 * 
 * @description Contains connection settings for development, test, and production environments
 * @type {Object}
 */
const config = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bookmyshow_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log, // Enable SQL query logging in development
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME_TEST || 'bookmyshow_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Disable logging in test environment
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    // Fallback values if DATABASE_URL is not present
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Disable logging in production
    pool: {
      max: 20, // Increased pool size for production
      min: 5,
      acquire: 60000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // For cloud databases
      },
    },
  },
};

/**
 * Get current environment configuration
 * 
 * @description Returns database configuration based on NODE_ENV
 * @returns {Object} Database configuration for current environment
 */
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

/**
 * Create Sequelize instance with error handling
 * 
 * @description Initializes database connection with proper error handling
 * @type {Sequelize}
 */
let sequelize;

try {
  const commonOptions = {
    dialect: 'mysql',
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions,

    // Additional Sequelize options for better performance
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },

    // Timezone configuration
    timezone: '+05:30', // IST timezone for Indian users
  };

  // Check if we should use environment variable for connection string
  if (dbConfig.use_env_variable && process.env[dbConfig.use_env_variable]) {
    // Use connection string directly (e.g., for Railway)
    sequelize = new Sequelize(process.env[dbConfig.use_env_variable], commonOptions);
    console.log(`✅ Sequelize initialized for ${env} environment using ${dbConfig.use_env_variable}`);
  } else {
    // Use individual parameters
    sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        ...commonOptions
      }
    );
    console.log(`✅ Sequelize initialized for ${env} environment`);
    console.log(`📍 Database: ${dbConfig.database} at ${dbConfig.host}:${dbConfig.port}`);
  }

} catch (error) {
  console.error('❌ CRITICAL: Failed to initialize database connection:', error.message);
  console.error('Stack trace:', error.stack);
  console.error('Config:', {
    env,
    use_env_variable: dbConfig?.use_env_variable,
    hasConnectionString: !!(dbConfig?.use_env_variable && process.env[dbConfig.use_env_variable]),
    host: dbConfig?.host,
    port: dbConfig?.port,
    database: dbConfig?.database,
    hasPassword: !!dbConfig?.password
  });
  process.exit(1);
}

/**
 * Test database connection
 * 
 * @description Authenticates database connection and logs status
 * @returns {Promise<boolean>} Connection success status
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database connection established successfully (${env})`);
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
};

/**
 * Close database connection gracefully
 * 
 * @description Closes all active connections in the pool
 * @returns {Promise<void>}
 */
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('📴 Database connection closed successfully');
  } catch (error) {
    console.error('Error closing database connection:', error.message);
  }
};

// Export configuration and sequelize instance
module.exports = {
  sequelize,
  config,
  testConnection,
  closeConnection,
  Sequelize,
};

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. CONNECTION POOLING:
 *    - Current: Basic pool configuration
 *    - Issue: Pool size might not be optimal for all environments
 *    - Improvement: Dynamic pool sizing based on load
 * 
 * 2. ERROR HANDLING:
 *    - Current: Basic try-catch with process.exit
 *    - Issue: Application crashes on DB connection failure
 *    - Improvement: Graceful degradation, retry logic, health checks
 * 
 * 3. SECURITY CONCERNS:
 *    - Current: Basic SSL configuration
 *    - Issue: SSL settings might be too permissive
 *    - Improvement: Proper SSL certificate validation
 * 
 * 4. MONITORING:
 *    - Current: Console logging only
 *    - Issue: No connection metrics or monitoring
 *    - Improvement: Add connection pool monitoring, query performance tracking
 * 
 * 5. CONFIGURATION VALIDATION:
 *    - Current: Basic environment variable reading
 *    - Issue: No validation of required config values
 *    - Improvement: Schema validation for configuration
 */
