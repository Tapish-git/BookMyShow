/**
 * Show Model
 * 
 * Defines the Show entity representing a movie screening at a specific date and time.
 * Links movies to specific showings with hall information and seat availability.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Show Model Definition
 * 
 * @description Sequelize model for shows table
 * @param {Sequelize} sequelize - Database connection instance
 * @param {DataTypes} DataTypes - Sequelize data types
 * @returns {Model} Show model
 */
const Show = sequelize.define('Show', {
  /**
   * Primary key for show identification
   * @type {string} UUID format
   */
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique identifier for the show',
  },

  /**
   * Reference to the movie being shown
   * @type {string} Foreign key to Movie model
   */
  movie_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'movies',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    comment: 'Foreign key reference to the movie',
  },

  /**
   * Date of the show
   * @type {date} Show date (YYYY-MM-DD)
   */
  show_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Show date must be a valid date',
      },
      isAfter: {
        args: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
        msg: 'Show date cannot be in the past',
      },
    },
    comment: 'Date when the show is scheduled',
  },

  /**
   * Time of the show
   * @type {time} Show time (HH:MM:SS)
   */
  show_time: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      /**
       * Custom validation to ensure show time is reasonable
       */
      isReasonableTime(value) {
        const time = new Date(`1970-01-01T${value}`);
        const hours = time.getHours();
        
        // Shows should be between 6 AM and 11:30 PM
        if (hours < 6 || hours >= 24 || (hours === 23 && time.getMinutes() > 30)) {
          throw new Error('Show time must be between 06:00 and 23:30');
        }
      },
    },
    comment: 'Time when the show starts',
  },

  /**
   * Hall/Theater name where the show is being screened
   * @type {string} Hall identifier
   */
  hall_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Hall name is required',
      },
      isIn: {
        args: [['Hall-1', 'Hall-2', 'Hall-3', 'Premium-Hall', 'IMAX-Hall']],
        msg: 'Invalid hall name selected',
      },
    },
    comment: 'Name/identifier of the hall where movie is being shown',
  },

  /**
   * Total number of seats in the hall
   * @type {integer} Maximum seating capacity
   */
  total_seats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: 50,
        msg: 'Hall must have at least 50 seats',
      },
      max: {
        args: 500,
        msg: 'Hall cannot have more than 500 seats',
      },
    },
    comment: 'Total number of seats available in the hall',
  },

  /**
   * Currently available seats
   * @type {integer} Real-time seat availability
   * @note This is a denormalized field for performance - can lead to consistency issues
   */
  available_seats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: function() {
      return this.total_seats || 0;
    },
    validate: {
      min: {
        args: 0,
        msg: 'Available seats cannot be negative',
      },
      /**
       * Custom validation to ensure available seats don't exceed total
       */
      notExceedTotal(value) {
        if (value > this.total_seats) {
          throw new Error('Available seats cannot exceed total seats');
        }
      },
    },
    comment: 'Current number of available seats (updated in real-time)',
  },

  /**
   * Ticket price for this show
   * @type {decimal} Price per ticket in currency units
   */
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: 50.00,
        msg: 'Ticket price must be at least ₹50',
      },
      max: {
        args: 2000.00,
        msg: 'Ticket price cannot exceed ₹2000',
      },
    },
    comment: 'Price per ticket for this show in INR',
  },

}, {
  // Model options
  tableName: 'shows',
  timestamps: true,
  underscored: true,
  
  // Indexes for optimized queries
  indexes: [
    {
      fields: ['movie_id'],
      name: 'idx_shows_movie',
    },
    {
      fields: ['show_date'],
      name: 'idx_shows_date',
    },
    {
      fields: ['movie_id', 'show_date'],
      name: 'idx_shows_movie_date',
    },
    {
      fields: ['show_date', 'show_time'],
      name: 'idx_shows_datetime',
    },
    {
      fields: ['hall_name', 'show_date', 'show_time'],
      name: 'idx_shows_hall_schedule',
      unique: true, // Prevent double booking of halls
    },
  ],

  // Model-level validations
  validate: {
    /**
     * Ensure show date and time combination is in the future
     */
    showTimeInFuture() {
      const showDateTime = new Date(`${this.show_date}T${this.show_time}`);
      const now = new Date();
      
      if (showDateTime <= now) {
        throw new Error('Show date and time must be in the future');
      }
    },

    /**
     * Validate reasonable show scheduling (not too far in advance)
     */
    reasonableAdvanceBooking() {
      const showDate = new Date(this.show_date);
      const maxAdvanceDate = new Date();
      maxAdvanceDate.setDate(maxAdvanceDate.getDate() + 90); // 3 months in advance
      
      if (showDate > maxAdvanceDate) {
        throw new Error('Shows cannot be scheduled more than 3 months in advance');
      }
    },
  },
});

/**
 * Define Model Associations
 * 
 * @description Establishes relationships between Show and other models
 * @param {Object} models - All defined models
 */
Show.associate = (models) => {
  // Show belongs to Movie
  Show.belongsTo(models.Movie, {
    foreignKey: 'movie_id',
    as: 'movie',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // Show has many Seats
  Show.hasMany(models.Seat, {
    foreignKey: 'show_id',
    as: 'seats',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // Show has many Bookings
  Show.hasMany(models.Booking, {
    foreignKey: 'show_id',
    as: 'bookings',
    onDelete: 'RESTRICT', // Prevent deletion if bookings exist
    onUpdate: 'CASCADE',
  });
};

/**
 * Instance Methods
 */

/**
 * Update available seat count
 * @param {number} seatChange - Number of seats to add/subtract (negative to reduce)
 * @returns {Promise<Show>} Updated show instance
 */
Show.prototype.updateAvailableSeats = async function(seatChange, options = {}) {
  const newAvailableCount = this.available_seats + seatChange;
  
  if (newAvailableCount < 0) {
    throw new Error('Cannot reduce available seats below zero');
  }
  
  if (newAvailableCount > this.total_seats) {
    throw new Error('Available seats cannot exceed total seats');
  }
  
  this.available_seats = newAvailableCount;
  return await this.save({ transaction: options.transaction });
};

/**
 * Check if show has available seats
 * @param {number} requiredSeats - Number of seats needed
 * @returns {boolean} Whether enough seats are available
 */
Show.prototype.hasAvailableSeats = function(requiredSeats = 1) {
  return this.available_seats >= requiredSeats;
};

/**
 * Get show status based on time and availability
 * @returns {string} Show status (upcoming, live, sold_out, completed)
 */
Show.prototype.getStatus = function() {
  const now = new Date();
  const showDateTime = new Date(`${this.show_date}T${this.show_time}`);
  const showEndTime = new Date(showDateTime.getTime() + (3 * 60 * 60 * 1000)); // Assume 3-hour max duration
  
  if (this.available_seats === 0) {
    return 'sold_out';
  } else if (now > showEndTime) {
    return 'completed';
  } else if (now >= showDateTime) {
    return 'live';
  } else {
    return 'upcoming';
  }
};

/**
 * Custom JSON serialization
 */
Show.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Add computed fields
  values.status = this.getStatus();
  values.occupancy_percentage = ((this.total_seats - this.available_seats) / this.total_seats * 100).toFixed(1);
  values.show_datetime = `${values.show_date}T${values.show_time}`;
  values.price_formatted = `₹${values.price}`;
  
  return values;
};

/**
 * Class Methods for common queries
 */

/**
 * Find shows by movie and date
 * @param {string} movieId - Movie ID
 * @param {string} date - Show date (YYYY-MM-DD)
 * @returns {Promise<Array>} Shows for the movie on specified date
 */
Show.findByMovieAndDate = function(movieId, date) {
  return this.findAll({
    where: {
      movie_id: movieId,
      show_date: date,
    },
    include: [{
      model: require('./Movie'),
      as: 'movie',
      attributes: ['title', 'duration'],
    }],
    order: [['show_time', 'ASC']],
  });
};

/**
 * Get upcoming shows for a movie
 * @param {string} movieId - Movie ID
 * @param {number} days - Number of days to look ahead (default: 7)
 * @returns {Promise<Array>} Upcoming shows
 */
Show.getUpcomingShows = function(movieId, days = 7) {
  const { Op } = require('sequelize');
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);
  
  return this.findAll({
    where: {
      movie_id: movieId,
      show_date: {
        [Op.between]: [today, endDate],
      },
      available_seats: {
        [Op.gt]: 0, // Only shows with available seats
      },
    },
    order: [['show_date', 'ASC'], ['show_time', 'ASC']],
  });
};

/**
 * Get shows by hall and date (for conflict checking)
 * @param {string} hallName - Hall name
 * @param {string} date - Show date
 * @returns {Promise<Array>} Shows in the hall on specified date
 */
Show.findByHallAndDate = function(hallName, date) {
  return this.findAll({
    where: {
      hall_name: hallName,
      show_date: date,
    },
    order: [['show_time', 'ASC']],
  });
};

module.exports = Show;

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. DENORMALIZED AVAILABLE_SEATS FIELD:
 *    - Current: Stored as column for performance
 *    - Issue: Risk of data inconsistency during concurrent bookings
 *    - Improvement: Calculate dynamically or use event sourcing
 * 
 * 2. HALL MANAGEMENT:
 *    - Current: Simple string-based hall names
 *    - Issue: No hall capacity validation, layout configuration
 *    - Improvement: Separate Hall entity with capacity and layout
 * 
 * 3. PRICING STRATEGY:
 *    - Current: Fixed price per show
 *    - Issue: No dynamic pricing, discounts, or seat category pricing
 *    - Improvement: Dynamic pricing based on demand, seat categories
 * 
 * 4. SHOW SCHEDULING:
 *    - Current: Basic time validation
 *    - Issue: No buffer time between shows, cleanup time
 *    - Improvement: Configurable buffer times, automated scheduling
 * 
 * 5. CONCURRENT SEAT UPDATES:
 *    - Current: Simple increment/decrement
 *    - Issue: Race conditions possible
 *    - Improvement: Database-level atomic operations, pessimistic locking
 * 
 * 6. STATUS CALCULATION:
 *    - Current: Calculated on each request
 *    - Issue: Performance overhead
 *    - Improvement: Cache status, background job to update status
 */