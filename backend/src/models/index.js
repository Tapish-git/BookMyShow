/**
 * Models Index File
 * 
 * Centralizes all model imports and establishes model associations.
 * This file is the single point of entry for all database models.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

const { sequelize } = require('../config/database');

// Import all models
const Movie = require('./Movie');
const Show = require('./Show');
const Seat = require('./Seat');
const Booking = require('./Booking');
const SeatReservation = require('./SeatReservation');

/**
 * Models object containing all defined models
 * @type {Object}
 */
const models = {
  Movie,
  Show,
  Seat,
  Booking,
  SeatReservation,
};

/**
 * Establish model associations
 * 
 * @description Sets up all relationships between models
 * This must be done after all models are imported to avoid circular dependencies
 */
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

/**
 * Initialize database and sync models
 * 
 * @description Creates tables and applies any pending migrations
 * @param {boolean} force - Whether to drop existing tables (default: false)
 * @param {boolean} alter - Whether to alter existing tables (default: false)
 * @returns {Promise<void>}
 */
const initializeDatabase = async (force = false, alter = false) => {
  try {
    console.log('🔄 Initializing database...');
    console.log('🔗 Attempting to authenticate with database...');

    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection verified successfully');

    console.log('🔄 Syncing database models...');

    // Sync models with database
    if (force) {
      console.log('⚠️  WARNING: Force sync will drop all tables!');
      await sequelize.sync({ force: true });
      console.log('🔄 Database tables recreated');
    } else if (alter) {
      console.log('🔄 Altering tables to match models...');
      await sequelize.sync({ alter: true });
      console.log('✅ Database tables altered');
    } else {
      await sequelize.sync();
      console.log('✅ Database synchronized');
    }

  } catch (error) {
    console.error('❌ CRITICAL: Database initialization failed');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Stack trace:', error.stack);
    throw error;
  }
};

/**
 * Populate database with sample data
 * 
 * @description Seeds the database with initial data for development/testing
 * @returns {Promise<void>}
 */
const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database with sample data...');

    // Check if data already exists
    const movieCount = await Movie.count();
    if (movieCount > 0) {
      console.log('📊 Database already contains data, skipping seed');
      return;
    }

    // Create sample movies
    const movies = await Movie.bulkCreate([
      {
        title: 'Avengers: Endgame',
        description: 'The epic conclusion to the Infinity Saga that became a defining moment in cinematic history.',
        genre: 'Action',
        duration: 181,
        rating: 8.4,
        poster_url: 'https://example.com/avengers-endgame-poster.jpg',
        release_date: '2019-04-26',
        language: 'English',
      },
      {
        title: 'RRR',
        description: 'A fictional story about two legendary revolutionaries and their journey away from home.',
        genre: 'Action',
        duration: 187,
        rating: 7.9,
        poster_url: 'https://example.com/rrr-poster.jpg',
        release_date: '2022-03-25',
        language: 'Telugu',
      },
      {
        title: 'Spider-Man: No Way Home',
        description: 'Peter Parker seeks help from Doctor Strange to make everyone forget his identity as Spider-Man.',
        genre: 'Action',
        duration: 148,
        rating: 8.2,
        poster_url: 'https://example.com/spiderman-nwh-poster.jpg',
        release_date: '2021-12-17',
        language: 'English',
      },
    ]);

    console.log(`✅ Created ${movies.length} sample movies`);

    // Create sample shows for each movie
    const shows = [];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const movie of movies) {
      // Create shows for today and tomorrow
      const movieShows = await Show.bulkCreate([
        {
          movie_id: movie.id,
          show_date: today.toISOString().split('T')[0],
          show_time: '10:00:00',
          hall_name: 'Hall-1',
          total_seats: 100,
          available_seats: 100,
          price: 150.00,
        },
        {
          movie_id: movie.id,
          show_date: today.toISOString().split('T')[0],
          show_time: '14:30:00',
          hall_name: 'Hall-2',
          total_seats: 120,
          available_seats: 120,
          price: 180.00,
        },
        {
          movie_id: movie.id,
          show_date: tomorrow.toISOString().split('T')[0],
          show_time: '18:00:00',
          hall_name: 'Premium-Hall',
          total_seats: 80,
          available_seats: 80,
          price: 250.00,
        },
      ]);

      shows.push(...movieShows);
    }

    console.log(`✅ Created ${shows.length} sample shows`);

    // Create seats for each show
    let totalSeatsCreated = 0;

    for (const show of shows) {
      const seats = [];
      const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const seatsPerRow = Math.ceil(show.total_seats / rows.length);

      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const seatsInThisRow = Math.min(seatsPerRow, show.total_seats - (rowIndex * seatsPerRow));

        if (seatsInThisRow <= 0) break;

        for (let seatNum = 1; seatNum <= seatsInThisRow; seatNum++) {
          seats.push({
            show_id: show.id,
            row_number: row,
            seat_number: seatNum,
            seat_type: rowIndex < 2 ? 'Premium' : 'Regular', // First 2 rows are premium
            is_available: true,
          });
        }
      }

      await Seat.bulkCreate(seats);
      totalSeatsCreated += seats.length;
    }

    console.log(`✅ Created ${totalSeatsCreated} sample seats`);
    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    throw error;
  }
};

/**
 * Close all database connections
 * 
 * @description Gracefully closes database connection pool
 * @returns {Promise<void>}
 */
const closeDatabase = async () => {
  try {
    await sequelize.close();
    console.log('📴 Database connections closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error.message);
  }
};

/**
 * Health check for database
 * 
 * @description Performs basic health check on database connection
 * @returns {Promise<Object>} Health check result
 */
const healthCheck = async () => {
  try {
    await sequelize.authenticate();

    // Get basic statistics
    const stats = await Promise.all([
      Movie.count(),
      Show.count(),
      Seat.count(),
      Booking.count(),
      SeatReservation.count(),
    ]);

    return {
      status: 'healthy',
      connection: 'active',
      models: {
        movies: stats[0],
        shows: stats[1],
        seats: stats[2],
        bookings: stats[3],
        seat_reservations: stats[4],
      },
      timestamp: new Date(),
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      connection: 'failed',
      error: error.message,
      timestamp: new Date(),
    };
  }
};

// Export models and utilities
module.exports = {
  // Database connection
  sequelize,

  // Models
  Movie,
  Show,
  Seat,
  Booking,
  SeatReservation,

  // Utilities
  initializeDatabase,
  seedDatabase,
  closeDatabase,
  healthCheck,
  models,
};

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. MODEL ASSOCIATIONS:
 *    - Current: Simple association setup
 *    - Issue: No lazy loading configuration
 *    - Improvement: Configure eager/lazy loading strategies
 * 
 * 2. SEEDING STRATEGY:
 *    - Current: Simple bulk create for sample data
 *    - Issue: Not environment-aware, overwrites data
 *    - Improvement: Environment-specific seeding, migration-based seeding
 * 
 * 3. DATABASE INITIALIZATION:
 *    - Current: Basic sync with force/alter options
 *    - Issue: No migration tracking, version control
 *    - Improvement: Proper migration system, version tracking
 * 
 * 4. ERROR HANDLING:
 *    - Current: Basic try-catch with console logging
 *    - Issue: No structured error handling, recovery
 *    - Improvement: Structured error types, recovery strategies
 * 
 * 5. CONNECTION MANAGEMENT:
 *    - Current: Single connection pool for all operations
 *    - Issue: No read/write separation, connection optimization
 *    - Improvement: Read replicas, connection optimization
 * 
 * 6. MONITORING:
 *    - Current: Basic health check
 *    - Issue: No detailed performance metrics
 *    - Improvement: Connection pool metrics, query performance tracking
 */