/**
 * SeatReservation Model
 * 
 * Defines the SeatReservation entity for managing seat blocking and booking states.
 * Handles temporary seat holds (5-minute blocks) and confirmed reservations.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * SeatReservation Model Definition
 * 
 * @description Sequelize model for seat_reservations table
 * @param {Sequelize} sequelize - Database connection instance
 * @param {DataTypes} DataTypes - Sequelize data types
 * @returns {Model} SeatReservation model
 */
const SeatReservation = sequelize.define('SeatReservation', {
  /**
   * Primary key for reservation identification
   * @type {string} UUID format
   */
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique identifier for the seat reservation',
  },

  /**
   * Reference to the booking (null for temporary blocks)
   * @type {string} Foreign key to Booking model
   */
  booking_id: {
    type: DataTypes.UUID,
    allowNull: true, // Null for temporary blocks, populated when confirmed
    references: {
      model: 'bookings',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    comment: 'Foreign key reference to the booking (null for temporary blocks)',
  },

  /**
   * Reference to the seat being reserved
   * @type {string} Foreign key to Seat model
   */
  seat_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'seats',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    comment: 'Foreign key reference to the seat',
  },

  /**
   * Current status of the reservation
   * @type {string} Reservation state
   */
  reservation_status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: {
        args: [['BLOCKED', 'CONFIRMED', 'EXPIRED', 'CANCELLED']],
        msg: 'Invalid reservation status',
      },
    },
    comment: 'Current status: BLOCKED (temp), CONFIRMED (booked), EXPIRED, CANCELLED',
  },

  /**
   * Timestamp when seat was initially blocked
   * @type {datetime} Block creation time
   */
  blocked_at: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'Blocked timestamp must be a valid date',
      },
    },
    comment: 'Timestamp when the seat was initially blocked',
  },

  /**
   * Timestamp when the block expires
   * @type {datetime} Block expiration time
   */
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'Expiry timestamp must be a valid date',
      },
      /**
       * Custom validation to ensure expiry is after blocked time
       */
      expiryAfterBlock(value) {
        if (value && this.blocked_at && value <= this.blocked_at) {
          throw new Error('Expiry time must be after blocked time');
        }
      },
    },
    comment: 'Timestamp when the block automatically expires',
  },

  /**
   * Timestamp when booking was confirmed
   * @type {datetime} Confirmation time
   */
  confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'Confirmation timestamp must be a valid date',
      },
    },
    comment: 'Timestamp when the booking was confirmed',
  },

}, {
  // Model options
  tableName: 'seat_reservations',
  timestamps: true,
  underscored: true,
  
  // Indexes for optimized queries
  indexes: [
    {
      fields: ['seat_id'],
      name: 'idx_seat_reservations_seat',
    },
    {
      fields: ['booking_id'],
      name: 'idx_seat_reservations_booking',
    },
    {
      fields: ['reservation_status'],
      name: 'idx_seat_reservations_status',
    },
    {
      fields: ['expires_at'],
      name: 'idx_seat_reservations_expires',
    },
    {
      fields: ['seat_id', 'reservation_status'],
      name: 'idx_seat_reservations_seat_status',
    },
    {
      // Unique constraint to prevent multiple active reservations for same seat
      fields: ['seat_id'],
      name: 'idx_seat_reservations_active',
      unique: true,
      where: {
        reservation_status: {
          [Op.in]: ['BLOCKED', 'CONFIRMED'],
        },
      },
    },
  ],

  // Model-level validations
  validate: {
    /**
     * Ensure booking_id is present for confirmed reservations
     */
    bookingRequiredForConfirmed() {
      if (this.reservation_status === 'CONFIRMED' && !this.booking_id) {
        throw new Error('Booking ID is required for confirmed reservations');
      }
    },

    /**
     * Ensure blocked_at is present for blocked reservations
     */
    blockedAtRequiredForBlocked() {
      if (this.reservation_status === 'BLOCKED' && !this.blocked_at) {
        throw new Error('Blocked timestamp is required for blocked reservations');
      }
    },

    /**
     * Ensure expires_at is present for blocked reservations
     */
    expiryRequiredForBlocked() {
      if (this.reservation_status === 'BLOCKED' && !this.expires_at) {
        throw new Error('Expiry timestamp is required for blocked reservations');
      }
    },

    /**
     * Ensure confirmed_at is present for confirmed reservations
     */
    confirmedAtRequiredForConfirmed() {
      if (this.reservation_status === 'CONFIRMED' && !this.confirmed_at) {
        throw new Error('Confirmation timestamp is required for confirmed reservations');
      }
    },
  },
});

/**
 * Define Model Associations
 * 
 * @description Establishes relationships between SeatReservation and other models
 * @param {Object} models - All defined models
 */
SeatReservation.associate = (models) => {
  // SeatReservation belongs to Booking
  SeatReservation.belongsTo(models.Booking, {
    foreignKey: 'booking_id',
    as: 'booking',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // SeatReservation belongs to Seat
  SeatReservation.belongsTo(models.Seat, {
    foreignKey: 'seat_id',
    as: 'seat',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

/**
 * Hooks (Lifecycle callbacks)
 */

/**
 * Before Update Hook - Validate status transitions
 */
SeatReservation.beforeUpdate(async (reservation, options) => {
  const oldStatus = reservation._previousDataValues.reservation_status;
  const newStatus = reservation.reservation_status;
  
  // Define valid status transitions
  const validTransitions = {
    'BLOCKED': ['CONFIRMED', 'EXPIRED', 'CANCELLED'],
    'CONFIRMED': ['CANCELLED'], // Confirmed bookings can only be cancelled
    'EXPIRED': [], // Expired reservations cannot change status
    'CANCELLED': [], // Cancelled reservations cannot change status
  };
  
  if (oldStatus && !validTransitions[oldStatus].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${oldStatus} to ${newStatus}`);
  }
  
  // Set timestamps based on status
  if (newStatus === 'CONFIRMED' && !reservation.confirmed_at) {
    reservation.confirmed_at = new Date();
  }
});

/**
 * Instance Methods
 */

/**
 * Check if reservation is currently active
 * @returns {boolean} Whether reservation is active (blocked or confirmed)
 */
SeatReservation.prototype.isActive = function() {
  return ['BLOCKED', 'CONFIRMED'].includes(this.reservation_status);
};

/**
 * Check if block has expired
 * @returns {boolean} Whether the block has expired
 */
SeatReservation.prototype.hasExpired = function() {
  if (this.reservation_status !== 'BLOCKED' || !this.expires_at) {
    return false;
  }
  
  return new Date() > this.expires_at;
};

/**
 * Get remaining time for block expiry
 * @returns {number} Remaining seconds until expiry (0 if expired or not blocked)
 */
SeatReservation.prototype.getRemainingTime = function() {
  if (this.reservation_status !== 'BLOCKED' || !this.expires_at) {
    return 0;
  }
  
  const now = new Date();
  const remaining = Math.max(0, Math.floor((this.expires_at - now) / 1000));
  
  return remaining;
};

/**
 * Extend block duration
 * @param {number} additionalMinutes - Additional minutes to extend
 * @returns {Promise<SeatReservation>} Updated reservation
 */
SeatReservation.prototype.extendBlock = async function(additionalMinutes = 5) {
  if (this.reservation_status !== 'BLOCKED') {
    throw new Error('Can only extend blocked reservations');
  }
  
  if (this.hasExpired()) {
    throw new Error('Cannot extend expired reservation');
  }
  
  const newExpiryTime = new Date(this.expires_at);
  newExpiryTime.setMinutes(newExpiryTime.getMinutes() + additionalMinutes);
  
  return await this.update({
    expires_at: newExpiryTime,
  });
};

/**
 * Expire the reservation
 * @returns {Promise<SeatReservation>} Updated reservation
 */
SeatReservation.prototype.expire = async function() {
  if (this.reservation_status !== 'BLOCKED') {
    throw new Error('Can only expire blocked reservations');
  }
  
  return await this.update({
    reservation_status: 'EXPIRED',
  });
};

/**
 * Confirm the reservation with booking
 * @param {string} bookingId - Booking ID to associate
 * @returns {Promise<SeatReservation>} Updated reservation
 */
SeatReservation.prototype.confirm = async function(bookingId) {
  if (this.reservation_status !== 'BLOCKED') {
    throw new Error('Can only confirm blocked reservations');
  }
  
  if (this.hasExpired()) {
    throw new Error('Cannot confirm expired reservation');
  }
  
  return await this.update({
    reservation_status: 'CONFIRMED',
    booking_id: bookingId,
    confirmed_at: new Date(),
  });
};

/**
 * Cancel the reservation
 * @returns {Promise<SeatReservation>} Updated reservation
 */
SeatReservation.prototype.cancel = async function() {
  if (!this.isActive()) {
    throw new Error('Can only cancel active reservations');
  }
  
  return await this.update({
    reservation_status: 'CANCELLED',
  });
};

/**
 * Custom JSON serialization
 */
SeatReservation.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Add computed fields
  values.is_active = this.isActive();
  values.has_expired = this.hasExpired();
  values.remaining_seconds = this.getRemainingTime();
  values.remaining_formatted = this.formatRemainingTime();
  
  return values;
};

/**
 * Format remaining time for display
 * @returns {string} Formatted remaining time
 */
SeatReservation.prototype.formatRemainingTime = function() {
  const seconds = this.getRemainingTime();
  
  if (seconds <= 0) {
    return 'Expired';
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Class Methods
 */

/**
 * Create a new seat block
 * @param {string} seatId - Seat ID to block
 * @param {number} durationMinutes - Block duration in minutes (default: 5)
 * @returns {Promise<SeatReservation>} Created reservation
 */
SeatReservation.createBlock = async function(seatId, durationMinutes = 5, transaction = null) {
  // Check for existing active reservations
  const existingReservation = await this.findOne({
    where: {
      seat_id: seatId,
      reservation_status: {
        [Op.in]: ['BLOCKED', 'CONFIRMED'],
      },
    },
    transaction,
  });
  
  if (existingReservation) {
    // Check if it's a block that has expired
    if (existingReservation.reservation_status === 'BLOCKED' && existingReservation.hasExpired()) {
      console.log(`[createBlock] Expiring old block for seat ${seatId}`);
      await existingReservation.expire();
    } else {
      console.log(`[createBlock] Seat ${seatId} already has active reservation: ${existingReservation.reservation_status}`);
      throw new Error('Seat is already reserved or blocked');
    }
  }
  
  // Create new block
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (durationMinutes * 60 * 1000));
  
  try {
    const reservation = await this.create({
      seat_id: seatId,
      reservation_status: 'BLOCKED',
      blocked_at: now,
      expires_at: expiresAt,
    }, { transaction });
    console.log(`[createBlock] Successfully created block for seat ${seatId}, expires: ${expiresAt}`);
    return reservation;
  } catch (err) {
    // Handle unique constraint violation - another request may have created a block concurrently
    if (err.name === 'SequelizeUniqueConstraintError') {
      console.log(`[createBlock] Unique constraint violation for seat ${seatId} - checking if expired...`);
      const latestReservation = await this.findOne({
        where: {
          seat_id: seatId,
          reservation_status: {
            [Op.in]: ['BLOCKED', 'CONFIRMED'],
          },
        },
        order: [['created_at', 'DESC']],
        transaction,
      });
      
      if (latestReservation) {
        if (latestReservation.reservation_status === 'BLOCKED' && latestReservation.hasExpired()) {
          console.log(`[createBlock] Latest block for seat ${seatId} is expired, deleting and retrying...`);
          // DELETE the expired reservation to clear the unique constraint
          await latestReservation.update({ reservation_status: 'EXPIRED' }, { transaction });
          
          // Also delete from the table to clear unique index
          await this.destroy({
            where: {
              id: latestReservation.id
            },
            transaction
          });
          
          // Retry the create after deleting
          const retryReservation = await this.create({
            seat_id: seatId,
            reservation_status: 'BLOCKED',
            blocked_at: now,
            expires_at: expiresAt,
          }, { transaction });
          console.log(`[createBlock] Successfully created block on retry for seat ${seatId}`);
          return retryReservation;
        } else {
          console.log(`[createBlock] Latest reservation for seat ${seatId} is still active: ${latestReservation.reservation_status}`);
          throw new Error('Seat is already reserved or blocked');
        }
      }
    }
    throw err;
  }
};

/**
 * Find active reservation for a seat
 * @param {string} seatId - Seat ID
 * @returns {Promise<SeatReservation|null>} Active reservation or null
 */
SeatReservation.findActiveBySeat = async function(seatId) {
  return await this.findOne({
    where: {
      seat_id: seatId,
      reservation_status: {
        [Op.in]: ['BLOCKED', 'CONFIRMED'],
      },
    },
    order: [['created_at', 'DESC']], // Get most recent
  });
};

/**
 * Find expired blocks that need cleanup
 * @returns {Promise<Array>} Expired reservations
 */
SeatReservation.findExpiredBlocks = async function() {
  const { Op } = require('sequelize');
  
  return await this.findAll({
    where: {
      reservation_status: 'BLOCKED',
      expires_at: {
        [Op.lt]: new Date(),
      },
    },
    include: [{
      model: require('./Seat'),
      as: 'seat',
      attributes: ['id', 'row_number', 'seat_number', 'show_id'],
    }],
  });
};

/**
 * Cleanup expired blocks and release seats
 * @param {Transaction} outerTransaction - Optional outer transaction to reuse (prevents deadlocks)
 * @returns {Promise<number>} Number of reservations cleaned up
 */
SeatReservation.cleanupExpiredBlocks = async function(outerTransaction = null) {
  const transaction = outerTransaction || await sequelize.transaction();
  
  try {
    const expiredReservations = await this.findExpiredBlocks();
    let cleanupCount = 0;
    const showReleaseCounts = {};
    
    for (const reservation of expiredReservations) {
      // Expire the reservation
      await reservation.update({ 
        reservation_status: 'EXPIRED' 
      }, { transaction });
      
      // Release the seat
      const Seat = require('./Seat');
      await Seat.update(
        { is_available: true },
        { 
          where: { id: reservation.seat_id },
          transaction,
          validate: false // skip validators when toggling availability during cleanup
        }
      );

      // Track how many seats we free per show to restore availability counters
      const showId = reservation.seat?.show_id;
      if (showId) {
        showReleaseCounts[showId] = (showReleaseCounts[showId] || 0) + 1;
      }
      
      cleanupCount++;
    }

    // Restore available_seats counts for affected shows using safe SQL update
    // Use MIN to cap at total_seats to prevent overflow
    const Show = require('./Show');
    for (const [showId, count] of Object.entries(showReleaseCounts)) {
      await sequelize.query(
        'UPDATE shows SET available_seats = LEAST(available_seats + :count, total_seats) WHERE id = :showId',
        {
          replacements: { count, showId },
          transaction,
          type: sequelize.QueryTypes.UPDATE,
        }
      );
    }
    
    if (!outerTransaction) {
      await transaction.commit();
    }
    return cleanupCount;
    
  } catch (error) {
    if (!outerTransaction) {
      await transaction.rollback();
    }
    throw new Error(`Failed to cleanup expired blocks: ${error.message}`);
  }
};

/**
 * Get reservation statistics for a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Reservation statistics
 */
SeatReservation.getReservationStats = async function(startDate, endDate) {
  const { Op, fn, col } = require('sequelize');
  
  const stats = await this.findAll({
    where: {
      created_at: {
        [Op.between]: [startDate, endDate],
      },
    },
    attributes: [
      'reservation_status',
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['reservation_status'],
    raw: true,
  });
  
  // Format results
  const result = {
    total: 0,
    blocked: 0,
    confirmed: 0,
    expired: 0,
    cancelled: 0,
  };
  
  stats.forEach(stat => {
    result[stat.reservation_status.toLowerCase()] = parseInt(stat.count);
    result.total += parseInt(stat.count);
  });
  
  return result;
};

/**
 * Block multiple seats atomically
 * @param {Array} seatIds - Array of seat IDs to block
 * @param {number} durationMinutes - Block duration in minutes
 * @returns {Promise<Array>} Array of created reservations
 */
SeatReservation.blockMultipleSeats = async function(seatIds, durationMinutes = 5, outerTransaction = null) {
  const transaction = outerTransaction || await sequelize.transaction();
  
  try {
    const reservations = [];
    
    for (const seatId of seatIds) {
      const reservation = await this.createBlock(seatId, durationMinutes, transaction);
      reservations.push(reservation);
      
      // Update seat availability
      const Seat = require('./Seat');
      await Seat.update(
        { is_available: false },
        { 
          where: { id: seatId },
          transaction,
          validate: false // avoid row_number validator when only toggling availability
        }
      );
    }
    
    if (!outerTransaction) {
      await transaction.commit();
    }
    return reservations;
    
  } catch (error) {
    console.log('🔴 blockMultipleSeats caught error:');
    console.log('  Error message:', error.message);
    console.log('  Error name:', error.name);
    console.log('  Full error:', error);
    if (error.errors) {
      console.log('  Validation errors:', error.errors);
    }
    
    if (!outerTransaction) {
      await transaction.rollback();
    }
    throw new Error(`Failed to block seats: ${error.message}`);
  }
};

module.exports = SeatReservation;

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. CONCURRENCY CONTROL:
 *    - Current: Database unique constraints for prevention
 *    - Issue: Race conditions between check and insert
 *    - Improvement: Pessimistic locking, SELECT FOR UPDATE
 * 
 * 2. BLOCK EXPIRY MANAGEMENT:
 *    - Current: Background cleanup process required
 *    - Issue: Depends on external scheduler
 *    - Improvement: Database triggers, TTL indexes (if using Redis)
 * 
 * 3. STATUS TRANSITION VALIDATION:
 *    - Current: Basic validation in beforeUpdate hook
 *    - Issue: Could be bypassed by direct SQL
 *    - Improvement: Database constraints, state machine pattern
 * 
 * 4. PERFORMANCE OPTIMIZATION:
 *    - Current: Individual seat operations
 *    - Issue: N+1 queries for bulk operations
 *    - Improvement: Batch operations, bulk updates
 * 
 * 5. AUDIT TRAIL:
 *    - Current: Basic status tracking
 *    - Issue: No detailed history of status changes
 *    - Improvement: Event sourcing, audit log table
 * 
 * 6. MONITORING:
 *    - Current: No metrics or alerts
 *    - Issue: Difficult to monitor block performance
 *    - Improvement: Metrics collection, alerting on high expiry rates
 */