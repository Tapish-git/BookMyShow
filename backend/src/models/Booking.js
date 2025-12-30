/**
 * Booking Model
 * 
 * Defines the Booking entity representing a user's ticket booking record.
 * Contains user information, show details, and booking status.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Booking Model Definition
 * 
 * @description Sequelize model for bookings table
 * @param {Sequelize} sequelize - Database connection instance
 * @param {DataTypes} DataTypes - Sequelize data types
 * @returns {Model} Booking model
 */
const Booking = sequelize.define('Booking', {
  /**
   * Primary key for booking identification
   * @type {string} UUID format
   */
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique identifier for the booking',
  },

  /**
   * Unique booking reference for user display
   * @type {string} Human-readable booking reference
   */
  booking_reference: {
    type: DataTypes.STRING(20),
    allowNull: true, // Temporarily allow null - will be generated in beforeCreate hook
    unique: true,
    validate: {
      len: {
        args: [6, 20],
        msg: 'Booking reference must be between 6 and 20 characters',
      },
    },
    comment: 'Unique booking reference number for customer display',
  },

  /**
   * User email address
   * @type {string} Contact email for booking confirmation
   */
  user_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: {
        msg: 'Please provide a valid email address',
      },
      len: {
        args: [5, 255],
        msg: 'Email must be between 5 and 255 characters',
      },
    },
    comment: 'User email address for booking notifications',
  },

  /**
   * User full name
   * @type {string} Customer name for booking
   */
  user_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'User name is required',
      },
      len: {
        args: [2, 255],
        msg: 'Name must be between 2 and 255 characters',
      },
      is: {
        args: /^[a-zA-Z\s.'-]+$/i,
        msg: 'Name can only contain letters, spaces, dots, and hyphens',
      },
    },
    comment: 'Full name of the person making the booking',
  },

  /**
   * User phone number
   * @type {string} Contact number (optional)
   */
  user_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: {
        args: /^[+]?[\d\s-()]{10,20}$/,
        msg: 'Please provide a valid phone number',
      },
    },
    comment: 'User contact phone number (optional)',
  },

  /**
   * Reference to the show being booked
   * @type {string} Foreign key to Show model
   */
  show_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'shows',
      key: 'id',
    },
    onDelete: 'RESTRICT', // Don't allow show deletion if bookings exist
    onUpdate: 'CASCADE',
    comment: 'Foreign key reference to the show',
  },

  /**
   * Total number of seats booked
   * @type {integer} Count of seats in this booking
   */
  total_seats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: 1,
        msg: 'Must book at least 1 seat',
      },
      max: {
        args: 10,
        msg: 'Cannot book more than 10 seats in a single booking',
      },
    },
    comment: 'Total number of seats booked',
  },

  /**
   * Total amount for the booking
   * @type {decimal} Total cost in currency units
   */
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: {
        args: 50,
        msg: 'Total amount must be at least ₹50',
      },
      max: {
        args: 50000.00,
        msg: 'Total amount cannot exceed ₹50,000',
      },
    },
    comment: 'Total booking amount in INR',
  },

  /**
   * Current status of the booking
   * @type {string} Booking status
   */
  booking_status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'CONFIRMED',
    validate: {
      isIn: {
        args: [['CONFIRMED', 'CANCELLED', 'REFUNDED', 'NO_SHOW']],
        msg: 'Invalid booking status',
      },
    },
    comment: 'Current status of the booking (CONFIRMED, CANCELLED, etc.)',
  },

  /**
   * Date and time when booking was made
   * @type {datetime} Booking timestamp
   */
  booking_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: {
        msg: 'Booking date must be a valid date',
      },
    },
    comment: 'Timestamp when the booking was created',
  },

}, {
  // Model options
  tableName: 'bookings',
  timestamps: true,
  underscored: true,
  
  // Indexes for optimized queries
  indexes: [
    {
      fields: ['booking_reference'],
      name: 'idx_bookings_reference',
      unique: true,
    },
    {
      fields: ['user_email'],
      name: 'idx_bookings_email',
    },
    {
      fields: ['show_id'],
      name: 'idx_bookings_show',
    },
    {
      fields: ['booking_date'],
      name: 'idx_bookings_date',
    },
    {
      fields: ['booking_status'],
      name: 'idx_bookings_status',
    },
    {
      fields: ['user_email', 'booking_date'],
      name: 'idx_bookings_user_history',
    },
  ],

  // Model-level validations
  validate: {
    /**
     * Ensure booking date is not in the future beyond reasonable time
     */
    reasonableBookingDate() {
      const bookingDate = new Date(this.booking_date);
      const now = new Date();
      const maxFutureTime = new Date(now.getTime() + (5 * 60 * 1000)); // 5 minutes buffer
      
      if (bookingDate > maxFutureTime) {
        throw new Error('Booking date cannot be in the future');
      }
    },

    /**
     * Validate total amount matches seats and pricing logic
     */
    validateTotalAmount() {
      if (this.total_seats > 0 && this.total_amount <= 0) {
        throw new Error('Total amount must be greater than zero for confirmed bookings');
      }
    },
  },
});

/**
 * Define Model Associations
 * 
 * @description Establishes relationships between Booking and other models
 * @param {Object} models - All defined models
 */
Booking.associate = (models) => {
  // Booking belongs to Show
  Booking.belongsTo(models.Show, {
    foreignKey: 'show_id',
    as: 'show',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  // Booking has many SeatReservations
  Booking.hasMany(models.SeatReservation, {
    foreignKey: 'booking_id',
    as: 'seat_reservations',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

/**
 * Hooks (Lifecycle callbacks)
 */

/**
 * Before Create Hook - Generate booking reference
 */
Booking.beforeCreate(async (booking, options) => {
  if (!booking.booking_reference) {
    booking.booking_reference = await Booking.generateBookingReference();
  }
});

/**
 * Instance Methods
 */

/**
 * Get booking details with associated data
 * @returns {Promise<Object>} Complete booking information
 */
Booking.prototype.getFullDetails = async function() {
  const Show = require('./Show');
  const Movie = require('./Movie');
  const SeatReservation = require('./SeatReservation');
  const Seat = require('./Seat');
  
  const booking = await Booking.findByPk(this.id, {
    include: [
      {
        model: Show,
        as: 'show',
        include: [{
          model: Movie,
          as: 'movie',
          attributes: ['title', 'duration', 'poster_url'],
        }],
      },
      {
        model: SeatReservation,
        as: 'seat_reservations',
        include: [{
          model: Seat,
          as: 'seat',
          attributes: ['row_number', 'seat_number', 'seat_type'],
        }],
        where: { reservation_status: 'CONFIRMED' },
        required: false,
      },
    ],
  });
  
  return booking;
};

/**
 * Cancel booking and release seats
 * @param {string} reason - Cancellation reason (optional)
 * @returns {Promise<Object>} Cancellation result
 */
Booking.prototype.cancelBooking = async function(reason = 'User cancellation') {
  const transaction = await sequelize.transaction();
  
  try {
    // Update booking status
    await this.update({ 
      booking_status: 'CANCELLED' 
    }, { transaction });
    
    // Find and cancel seat reservations
    const SeatReservation = require('./SeatReservation');
    const seatReservations = await SeatReservation.findAll({
      where: { booking_id: this.id },
      transaction,
    });
    
    // Release seats
    for (const reservation of seatReservations) {
      await reservation.update({ 
        reservation_status: 'CANCELLED' 
      }, { transaction });
      
      // Update seat availability
      const Seat = require('./Seat');
      const seat = await Seat.findByPk(reservation.seat_id, { transaction });
      await seat.update({ is_available: true }, { transaction });
    }
    
    // Update show available seats count
    const Show = require('./Show');
    const show = await Show.findByPk(this.show_id, { transaction });
    await show.updateAvailableSeats(this.total_seats, { transaction });
    
    await transaction.commit();
    
    return {
      success: true,
      message: 'Booking cancelled successfully',
      cancelled_seats: seatReservations.length,
      reason,
    };
    
  } catch (error) {
    await transaction.rollback();
    throw new Error(`Failed to cancel booking: ${error.message}`);
  }
};

/**
 * Check if booking can be cancelled
 * @returns {Object} Cancellation eligibility
 */
Booking.prototype.canBeCancelled = function() {
  if (this.booking_status !== 'CONFIRMED') {
    return {
      canCancel: false,
      reason: 'Only confirmed bookings can be cancelled',
    };
  }
  
  // Check if show date has passed
  const Show = require('./Show');
  Show.findByPk(this.show_id).then(show => {
    const showDateTime = new Date(`${show.show_date}T${show.show_time}`);
    const now = new Date();
    
    if (showDateTime <= now) {
      return {
        canCancel: false,
        reason: 'Cannot cancel booking for shows that have already started or ended',
      };
    }
  });
  
  // Check cancellation window (e.g., 1 hour before show)
  const cancellationDeadline = new Date(`${this.show.show_date}T${this.show.show_time}`);
  cancellationDeadline.setHours(cancellationDeadline.getHours() - 1);
  
  if (new Date() > cancellationDeadline) {
    return {
      canCancel: false,
      reason: 'Cancellation window has closed (1 hour before show time)',
    };
  }
  
  return {
    canCancel: true,
    reason: 'Booking can be cancelled',
  };
};

/**
 * Generate digital ticket information
 * @returns {Object} Ticket details for display
 */
Booking.prototype.generateTicket = function() {
  return {
    bookingReference: this.booking_reference,
    customerName: this.user_name,
    customerEmail: this.user_email,
    movieTitle: this.show?.movie?.title,
    showDate: this.show?.show_date,
    showTime: this.show?.show_time,
    hallName: this.show?.hall_name,
    totalSeats: this.total_seats,
    totalAmount: this.total_amount,
    bookingDate: this.booking_date,
    status: this.booking_status,
    qrCode: `BMS-${this.booking_reference}`, // QR code data
  };
};

/**
 * Custom JSON serialization
 */
Booking.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Add computed fields
  values.total_amount_formatted = `₹${values.total_amount}`;
  values.booking_date_formatted = new Date(values.booking_date).toLocaleString('en-IN');
  values.can_cancel = this.canBeCancelled().canCancel;
  
  return values;
};

/**
 * Class Methods
 */

/**
 * Generate unique booking reference
 * @returns {Promise<string>} Unique booking reference
 */
Booking.generateBookingReference = async function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let reference;
  let isUnique = false;
  
  while (!isUnique) {
    reference = 'BMS';
    for (let i = 0; i < 8; i++) {
      reference += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Check if reference is unique
    const existingBooking = await this.findOne({
      where: { booking_reference: reference },
    });
    
    if (!existingBooking) {
      isUnique = true;
    }
  }
  
  return reference;
};

/**
 * Create new booking with seat reservations
 * @param {Object} bookingData - Booking information
 * @param {Array} selectedSeats - Array of seat IDs
 * @returns {Promise<Object>} Created booking with details
 */
Booking.createWithSeats = async function(bookingData, selectedSeats) {
  const transaction = await sequelize.transaction();
  
  try {
    // Create the booking
    const booking = await this.create(bookingData, { transaction });
    
    // Confirm seat reservations
    const SeatReservation = require('./SeatReservation');
    const Seat = require('./Seat');
    
    const confirmedSeats = [];
    
    for (const seatId of selectedSeats) {
      const seat = await Seat.findByPk(seatId, { transaction });
      if (!seat) {
        throw new Error(`Seat not found: ${seatId}`);
      }
      
      // Confirm the seat booking
      const confirmation = await seat.confirmBooking(booking.id);
      confirmedSeats.push(confirmation);
    }
    
    await transaction.commit();
    
    return {
      booking,
      confirmedSeats,
      totalSeats: confirmedSeats.length,
    };
    
  } catch (error) {
    await transaction.rollback();
    throw new Error(`Failed to create booking: ${error.message}`);
  }
};

/**
 * Find bookings by user email
 * @param {string} email - User email
 * @param {number} limit - Maximum number of results (default: 10)
 * @returns {Promise<Array>} User's booking history
 */
Booking.findByUserEmail = function(email, limit = 10) {
  return this.findAll({
    where: { user_email: email },
    include: [{
      model: require('./Show'),
      as: 'show',
      include: [{
        model: require('./Movie'),
        as: 'movie',
        attributes: ['title', 'poster_url'],
      }],
    }],
    order: [['booking_date', 'DESC']],
    limit,
  });
};

/**
 * Find booking by reference number
 * @param {string} reference - Booking reference
 * @returns {Promise<Object>} Booking with full details
 */
Booking.findByReference = async function(reference) {
  const booking = await this.findOne({
    where: { booking_reference: reference },
  });
  
  if (booking) {
    return await booking.getFullDetails();
  }
  
  return null;
};

/**
 * Get booking statistics for a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Booking statistics
 */
Booking.getBookingStats = async function(startDate, endDate) {
  const { Op, fn, col } = require('sequelize');
  
  const stats = await this.findAll({
    where: {
      booking_date: {
        [Op.between]: [startDate, endDate],
      },
      booking_status: 'CONFIRMED',
    },
    attributes: [
      [fn('COUNT', col('id')), 'total_bookings'],
      [fn('SUM', col('total_seats')), 'total_seats_sold'],
      [fn('SUM', col('total_amount')), 'total_revenue'],
      [fn('AVG', col('total_amount')), 'average_booking_value'],
    ],
    raw: true,
  });
  
  return stats[0];
};

module.exports = Booking;

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. USER MANAGEMENT:
 *    - Current: User details stored with each booking (denormalized)
 *    - Issue: Data duplication, no user profiles
 *    - Improvement: Separate User entity, user authentication
 * 
 * 2. BOOKING REFERENCE GENERATION:
 *    - Current: Random string generation with uniqueness check
 *    - Issue: Potential performance issue with growing dataset
 *    - Improvement: Sequential numbering, distributed ID generation
 * 
 * 3. CANCELLATION POLICY:
 *    - Current: Simple time-based cancellation
 *    - Issue: No flexible cancellation policies
 *    - Improvement: Configurable cancellation rules, refund policies
 * 
 * 4. TRANSACTION HANDLING:
 *    - Current: Basic transaction for booking creation
 *    - Issue: Long-running transactions, deadlock potential
 *    - Improvement: Saga pattern, eventual consistency
 * 
 * 5. PAYMENT INTEGRATION:
 *    - Current: No payment processing
 *    - Issue: Bookings without payment verification
 *    - Improvement: Payment gateway integration, payment status tracking
 * 
 * 6. NOTIFICATION SYSTEM:
 *    - Current: No booking confirmations or reminders
 *    - Issue: Poor user experience
 *    - Improvement: Email/SMS notifications, booking reminders
 */