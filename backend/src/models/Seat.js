/**
 * Seat Model
 * 
 * Defines the Seat entity representing individual seats in a theater hall for a specific show.
 * Handles seat layout, availability, and reservations.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Seat Model Definition
 * 
 * @description Sequelize model for seats table
 * @param {Sequelize} sequelize - Database connection instance
 * @param {DataTypes} DataTypes - Sequelize data types
 * @returns {Model} Seat model
 */
const Seat = sequelize.define('Seat', {
  /**
   * Primary key for seat identification
   * @type {string} UUID format
   */
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique identifier for the seat',
  },

  /**
   * Reference to the show this seat belongs to
   * @type {string} Foreign key to Show model
   */
  show_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'shows',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    comment: 'Foreign key reference to the show',
  },

  /**
   * Row identifier (A, B, C, etc.)
   * @type {string} Row letter/number
   */
  row_number: {
    type: DataTypes.STRING(5),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Row number is required',
      },
      is: {
        args: /^[A-Z]{1,2}$/i, // Allow A-Z or AA-ZZ format
        msg: 'Row number must be 1-2 letters (A, B, AA, etc.)',
      },
    },
    comment: 'Row identifier in the theater (A, B, C, etc.)',
  },

  /**
   * Seat number within the row
   * @type {integer} Seat position in the row
   */
  seat_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: 1,
        msg: 'Seat number must be at least 1',
      },
      max: {
        args: 50,
        msg: 'Seat number cannot exceed 50 per row',
      },
    },
    comment: 'Seat number within the row (1, 2, 3, etc.)',
  },

  /**
   * Type/Category of the seat
   * @type {string} Seat category for pricing
   */
  seat_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Regular',
    validate: {
      isIn: {
        args: [['Regular', 'Premium', 'VIP', 'Recliner']],
        msg: 'Invalid seat type selected',
      },
    },
    comment: 'Category of seat (Regular, Premium, VIP, Recliner)',
  },

  /**
   * Current availability status of the seat
   * @type {boolean} Whether seat is available for booking
   * @note This field is managed by the seat reservation system
   */
  is_available: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Current availability status of the seat',
  },

}, {
  // Model options
  tableName: 'seats',
  timestamps: true,
  underscored: true,
  
  // Indexes for optimized queries
  indexes: [
    {
      fields: ['show_id'],
      name: 'idx_seats_show',
    },
    {
      fields: ['show_id', 'row_number', 'seat_number'],
      name: 'idx_seats_unique_position',
      unique: true, // Prevent duplicate seats in same position
    },
    {
      fields: ['show_id', 'is_available'],
      name: 'idx_seats_availability',
    },
    {
      fields: ['row_number'],
      name: 'idx_seats_row',
    },
    {
      fields: ['seat_type'],
      name: 'idx_seats_type',
    },
  ],

  // Model-level validations
  validate: {
    /**
     * Custom validation for seat positioning logic
     */
    validSeatPosition() {
      // Ensure row letters are uppercase
      this.row_number = this.row_number.toUpperCase();
      
      // Basic validation for seat arrangement
      if (this.row_number === 'A' && this.seat_number > 20) {
        throw new Error('Front row (A) cannot have more than 20 seats');
      }
    },
  },
});

/**
 * Define Model Associations
 * 
 * @description Establishes relationships between Seat and other models
 * @param {Object} models - All defined models
 */
Seat.associate = (models) => {
  // Seat belongs to Show
  Seat.belongsTo(models.Show, {
    foreignKey: 'show_id',
    as: 'show',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // Seat has many SeatReservations
  Seat.hasMany(models.SeatReservation, {
    foreignKey: 'seat_id',
    as: 'reservations',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

/**
 * Instance Methods
 */

/**
 * Get seat identifier for display
 * @returns {string} Human-readable seat identifier (e.g., "A12")
 */
Seat.prototype.getSeatIdentifier = function() {
  return `${this.row_number}${this.seat_number}`;
};

/**
 * Check if seat is currently blocked or reserved
 * @returns {Promise<boolean>} Whether seat has active reservation
 */
Seat.prototype.hasActiveReservation = async function() {
  const SeatReservation = require('./SeatReservation');
  const { Op } = require('sequelize');
  
  const activeReservation = await SeatReservation.findOne({
    where: {
      seat_id: this.id,
      reservation_status: {
        [Op.in]: ['BLOCKED', 'CONFIRMED'],
      },
      // For blocked seats, check if not expired
      [Op.or]: [
        { reservation_status: 'CONFIRMED' },
        {
          reservation_status: 'BLOCKED',
          expires_at: {
            [Op.gt]: new Date(),
          },
        },
      ],
    },
  });
  
  return !!activeReservation;
};

/**
 * Block seat temporarily for booking process
 * @param {number} durationMinutes - Duration to block seat (default: 5 minutes)
 * @returns {Promise<Object>} Reservation details
 */
Seat.prototype.blockSeat = async function(durationMinutes = 5) {
  const SeatReservation = require('./SeatReservation');
  
  // Check if seat is already blocked or reserved
  const hasReservation = await this.hasActiveReservation();
  if (hasReservation) {
    throw new Error(`Seat ${this.getSeatIdentifier()} is already reserved or blocked`);
  }
  
  // Create temporary block
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);
  
  const reservation = await SeatReservation.create({
    seat_id: this.id,
    reservation_status: 'BLOCKED',
    blocked_at: new Date(),
    expires_at: expiresAt,
  });
  
  // Update seat availability
  await this.update({ is_available: false });
  
  return {
    reservationId: reservation.id,
    expiresAt: expiresAt,
    seatIdentifier: this.getSeatIdentifier(),
  };
};

/**
 * Release seat block
 * @returns {Promise<boolean>} Success status
 */
Seat.prototype.releaseSeat = async function() {
  const SeatReservation = require('./SeatReservation');
  
  // Find active block (not confirmed bookings)
  const blockReservation = await SeatReservation.findOne({
    where: {
      seat_id: this.id,
      reservation_status: 'BLOCKED',
    },
  });
  
  if (blockReservation) {
    await blockReservation.update({ reservation_status: 'EXPIRED' });
    await this.update({ is_available: true });
    return true;
  }
  
  return false;
};

/**
 * Confirm seat booking
 * @param {string} bookingId - Booking ID to associate with
 * @returns {Promise<Object>} Confirmation details
 */
Seat.prototype.confirmBooking = async function(bookingId) {
  const SeatReservation = require('./SeatReservation');
  
  // Find blocked reservation for this seat
  const reservation = await SeatReservation.findOne({
    where: {
      seat_id: this.id,
      reservation_status: 'BLOCKED',
    },
  });
  
  if (!reservation) {
    throw new Error(`No active block found for seat ${this.getSeatIdentifier()}`);
  }
  
  // Check if block hasn't expired
  if (new Date() > reservation.expires_at) {
    await reservation.update({ reservation_status: 'EXPIRED' });
    await this.update({ is_available: true });
    throw new Error(`Seat block has expired for ${this.getSeatIdentifier()}`);
  }
  
  // Confirm the reservation
  await reservation.update({
    booking_id: bookingId,
    reservation_status: 'CONFIRMED',
    confirmed_at: new Date(),
  });
  
  return {
    seatIdentifier: this.getSeatIdentifier(),
    reservationId: reservation.id,
    confirmedAt: new Date(),
  };
};

/**
 * Custom JSON serialization
 */
Seat.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Add computed fields
  values.seat_identifier = this.getSeatIdentifier();
  values.display_name = `${this.row_number}${this.seat_number}`;
  
  return values;
};

/**
 * Class Methods for common operations
 */

/**
 * Generate seat layout for a show
 * @param {string} showId - Show ID
 * @param {Object} layoutConfig - Hall layout configuration
 * @returns {Promise<Array>} Created seats
 */
Seat.generateSeatLayout = async function(showId, layoutConfig) {
  const { rows, seatsPerRow, seatTypes } = layoutConfig;
  const seats = [];
  
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const rowLetter = rows[rowIndex];
    const seatsInRow = seatsPerRow[rowIndex] || seatsPerRow[0];
    const seatType = seatTypes[rowIndex] || 'Regular';
    
    for (let seatNum = 1; seatNum <= seatsInRow; seatNum++) {
      seats.push({
        show_id: showId,
        row_number: rowLetter,
        seat_number: seatNum,
        seat_type: seatType,
        is_available: true,
      });
    }
  }
  
  return await this.bulkCreate(seats);
};

/**
 * Get seat layout organized by rows
 * @param {string} showId - Show ID
 * @returns {Promise<Object>} Seat layout organized by rows
 */
Seat.getSeatLayout = async function(showId) {
  const seats = await this.findAll({
    where: { show_id: showId },
    include: [{
      model: require('./SeatReservation'),
      as: 'reservations',
      where: {
        reservation_status: {
          [Op.in]: ['BLOCKED', 'CONFIRMED'],
        },
      },
      required: false, // Left join - include seats without reservations
    }],
    order: [['row_number', 'ASC'], ['seat_number', 'ASC']],
  });
  
  // Group seats by row
  const layout = {};
  seats.forEach(seat => {
    const row = seat.row_number;
    if (!layout[row]) {
      layout[row] = [];
    }
    
    // Check if seat is truly available (not blocked or confirmed)
    const hasActiveReservation = seat.reservations && seat.reservations.some(res => {
      if (res.reservation_status === 'CONFIRMED') return true;
      if (res.reservation_status === 'BLOCKED' && new Date() < res.expires_at) return true;
      return false;
    });
    
    layout[row].push({
      ...seat.toJSON(),
      is_available: !hasActiveReservation,
      reservation_status: hasActiveReservation ? 
        (seat.reservations.find(r => r.reservation_status === 'CONFIRMED') ? 'BOOKED' : 'BLOCKED') 
        : 'AVAILABLE',
    });
  });
  
  return layout;
};

/**
 * Get available seats for a show
 * @param {string} showId - Show ID
 * @param {number} count - Number of seats needed (optional)
 * @returns {Promise<Array>} Available seats
 */
Seat.getAvailableSeats = async function(showId, count = null) {
  const { Op } = require('sequelize');
  
  const whereCondition = {
    show_id: showId,
    is_available: true,
  };
  
  const queryOptions = {
    where: whereCondition,
    order: [['row_number', 'ASC'], ['seat_number', 'ASC']],
  };
  
  if (count) {
    queryOptions.limit = count;
  }
  
  return await this.findAll(queryOptions);
};

/**
 * Release expired seat blocks
 * @returns {Promise<number>} Number of seats released
 */
Seat.releaseExpiredBlocks = async function() {
  const SeatReservation = require('./SeatReservation');
  const { Op } = require('sequelize');
  
  // Find expired blocks
  const expiredReservations = await SeatReservation.findAll({
    where: {
      reservation_status: 'BLOCKED',
      expires_at: {
        [Op.lt]: new Date(),
      },
    },
    include: [{
      model: this,
      as: 'seat',
    }],
  });
  
  let releasedCount = 0;
  
  // Process each expired reservation
  for (const reservation of expiredReservations) {
    await reservation.update({ reservation_status: 'EXPIRED' });
    await reservation.seat.update({ is_available: true });
    releasedCount++;
  }
  
  return releasedCount;
};

module.exports = Seat;

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. SEAT LAYOUT GENERATION:
 *    - Current: Simple row/seat number based layout
 *    - Issue: Doesn't handle complex theater layouts (aisles, missing seats)
 *    - Improvement: Flexible layout configuration, seat coordinates
 * 
 * 2. CONCURRENT SEAT BLOCKING:
 *    - Current: Basic database-level checks
 *    - Issue: Race conditions possible between check and block
 *    - Improvement: Database transactions, optimistic/pessimistic locking
 * 
 * 3. SEAT PRICING:
 *    - Current: Simple seat type categorization
 *    - Issue: No dynamic pricing based on position, demand
 *    - Improvement: Position-based pricing, demand-based pricing
 * 
 * 4. EXPIRY MANAGEMENT:
 *    - Current: Background cleanup required
 *    - Issue: Relies on external process to clean expired blocks
 *    - Improvement: Automatic cleanup with database triggers, scheduled jobs
 * 
 * 5. SEAT VISUALIZATION:
 *    - Current: Simple row/number structure
 *    - Issue: No support for visual layout rendering
 *    - Improvement: Coordinate-based layout, visual metadata
 * 
 * 6. PERFORMANCE OPTIMIZATION:
 *    - Current: Individual seat operations
 *    - Issue: N+1 queries for bulk operations
 *    - Improvement: Bulk operations, caching, denormalization
 */