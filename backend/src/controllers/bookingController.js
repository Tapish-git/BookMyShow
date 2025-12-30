/**
 * Booking Controller
 * 
 * Handles all booking-related HTTP requests and responses.
 * Implements booking creation, cancellation, and ticket generation functionality.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

console.log('🔧 [bookingController.js] Loading...');
const { Booking, Show, Movie, Seat, SeatReservation } = require('../models');
console.log('✅ [bookingController.js] Models loaded');
const {
  asyncHandler,
  NotFoundError,
  BusinessLogicError,
  ConflictError,
  createExpiredBlockError,
  createCapacityError
} = require('../middleware/errorHandler');
console.log('✅ [bookingController.js] Error handlers loaded');
const { logBusinessEvent, logPerformance, logSecurityEvent } = require('../middleware/logger');
console.log('✅ [bookingController.js] Logger loaded');
const { sequelize } = require('../config/database');
console.log('✅ [bookingController.js] Database loaded');
const { Op } = require('sequelize');
console.log('✅ [bookingController.js] ALL IMPORTS COMPLETE!');

/**
 * Create a new booking
 * 
 * @description Creates a confirmed booking by converting blocked seats to reservations
 * @route POST /api/v1/bookings
 * @body {string} showId - Show ID (UUID)
 * @body {string[]} seatIds - Array of seat IDs to book (max: 10)
 * @body {Object} userDetails - User information
 * @body {string} userDetails.name - User full name
 * @body {string} userDetails.email - User email address
 * @body {string} userDetails.phone - User phone number (optional)
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const createBooking = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { showId, seatIds, userDetails } = req.body;

  // Validate input
  if (!seatIds || seatIds.length === 0) {
    throw new BusinessLogicError('At least one seat must be selected for booking');
  }

  if (seatIds.length > 10) {
    throw new BusinessLogicError('Cannot book more than 10 seats in a single booking');
  }

  const transaction = await sequelize.transaction();

  try {
    // Verify show exists and is bookable
    const show = await Show.findByPk(showId, {
      include: [{
        model: Movie,
        as: 'movie',
        attributes: ['title', 'duration'],
      }],
      transaction,
    });

    if (!show) {
      throw new NotFoundError('Show', showId);
    }

    // Check if show is in the future (allow booking up to 30 minutes before show time)
    const showDateTime = new Date(`${show.show_date}T${show.show_time}`);
    const bookingCutoff = new Date(showDateTime.getTime() - (30 * 60 * 1000)); // 30 minutes before

    if (new Date() > bookingCutoff) {
      throw new BusinessLogicError(
        'Booking is closed. Cannot book tickets within 30 minutes of show time or for past shows'
      );
    }

    // Clean up expired blocks first
    await SeatReservation.cleanupExpiredBlocks();

    // Verify all seats exist and are currently blocked
    const seatReservations = await SeatReservation.findAll({
      where: {
        seat_id: seatIds,
        reservation_status: 'BLOCKED',
      },
      include: [{
        model: Seat,
        as: 'seat',
        where: { show_id: showId },
        attributes: ['id', 'row_number', 'seat_number', 'seat_type'],
      }],
      transaction,
    });

    if (seatReservations.length !== seatIds.length) {
      const foundSeatIds = seatReservations.map(res => res.seat_id);
      const missingSeatIds = seatIds.filter(id => !foundSeatIds.includes(id));

      throw new BusinessLogicError(
        `Some seats are not available for booking. Missing or not blocked: ${missingSeatIds.join(', ')}`
      );
    }

    // Check if any blocks have expired
    const expiredBlocks = seatReservations.filter(res => new Date() > res.expires_at);
    if (expiredBlocks.length > 0) {
      const expiredSeats = expiredBlocks.map(res =>
        `${res.seat.row_number}${res.seat.seat_number}`
      ).join(', ');
      throw createExpiredBlockError(expiredSeats);
    }

    // Calculate total amount
    const totalAmount = show.price * seatIds.length;

    // Validate user details
    const { name, email, phone } = userDetails;
    if (!name || !email) {
      throw new BusinessLogicError('User name and email are required');
    }

    // Check for duplicate bookings (same email, same show, recent booking)
    const recentBooking = await Booking.findOne({
      where: {
        user_email: email,
        show_id: showId,
        booking_status: 'CONFIRMED',
        created_at: {
          [Op.gte]: new Date(Date.now() - (10 * 60 * 1000)), // Last 10 minutes
        },
      },
      transaction,
    });

    if (recentBooking) {
      logSecurityEvent('DUPLICATE_BOOKING_ATTEMPT', {
        email,
        showId,
        existingBookingId: recentBooking.id,
        clientIp: req.ip,
      }, req);

      throw new ConflictError(
        'A recent booking already exists for this email and show. Please check your email for confirmation.'
      );
    }

    // Create the booking
    console.log('\n=== 📋 CREATE BOOKING - START ===');
    console.log('Request data:', { showId, seatIds, userDetails });
    console.log('Booking data to create:', { total_seats: seatIds.length, total_amount: totalAmount, user_email: email });

    const bookingData = {
      show_id: showId,
      user_email: email,
      user_name: name,
      user_phone: phone || null,
      total_seats: seatIds.length,
      total_amount: totalAmount,
      booking_status: 'CONFIRMED',
      booking_date: new Date(),
    };

    const booking = await Booking.create(bookingData, { transaction });
    console.log('✓ Booking created:', { id: booking.id, reference: booking.booking_reference, total_amount: booking.total_amount });

    // Confirm all seat reservations
    const confirmedSeats = [];
    for (const reservation of seatReservations) {
      await reservation.update({
        booking_id: booking.id,
        reservation_status: 'CONFIRMED',
        confirmed_at: new Date(),
      }, { transaction });

      confirmedSeats.push({
        seatId: reservation.seat_id,
        seatIdentifier: `${reservation.seat.row_number}${reservation.seat.seat_number}`,
        seatType: reservation.seat.seat_type,
        row: reservation.seat.row_number,
        number: reservation.seat.seat_number,
      });
    }

    // No need to update show.available_seats as seats were already reduced during blocking

    await transaction.commit();

    // Generate ticket information
    const ticket = {
      bookingReference: booking.booking_reference,
      customerName: booking.user_name,
      customerEmail: booking.user_email,
      movieTitle: show.movie.title,
      showDate: show.show_date,
      showTime: show.show_time,
      hallName: show.hall_name,
      seats: confirmedSeats,
      totalSeats: seatIds.length,
      totalAmount: totalAmount,
      bookingDate: booking.booking_date,
      qrCode: `BMS-${booking.booking_reference}`,
    };

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('createBooking', duration, {
      showId,
      seatCount: seatIds.length,
      totalAmount,
      userEmail: email,
    });

    // Log business event
    logBusinessEvent('BOOKING_CREATED', {
      bookingId: booking.id,
      bookingReference: booking.booking_reference,
      showId,
      movieTitle: show.movie.title,
      seatCount: seatIds.length,
      totalAmount,
      userEmail: email,
      userAgent: req.get('User-Agent'),
      clientIp: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          reference: booking.booking_reference,
          status: booking.booking_status,
          createdAt: booking.booking_date,
        },
        ticket,
        show: {
          id: show.id,
          movieTitle: show.movie.title,
          date: show.show_date,
          time: show.show_time,
          hall: show.hall_name,
          price: show.price,
        },
      },
      message: `Booking confirmed! Your booking reference is ${booking.booking_reference}`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    await transaction.rollback();

    logPerformance('createBooking', Date.now() - startTime, {
      showId,
      seatCount: seatIds ? seatIds.length : 0,
      userEmail: userDetails?.email,
      error: error.message,
    });

    throw error;
  }
});

/**
 * Get booking by reference
 * 
 * @description Retrieves booking details and ticket information by booking reference
 * @route GET /api/v1/bookings/:reference
 * @param {string} reference - Booking reference (BMS followed by 8 characters)
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const getBookingByReference = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { reference } = req.params;

  try {
    const booking = await Booking.findByReference(reference);

    if (!booking) {
      throw new NotFoundError('Booking', reference);
    }

    // Get seat details
    const seatDetails = booking.seat_reservations?.map(reservation => ({
      seatIdentifier: `${reservation.seat.row_number}${reservation.seat.seat_number}`,
      seatType: reservation.seat.seat_type,
      row: reservation.seat.row_number,
      number: reservation.seat.seat_number,
    })) || [];

    // Check if booking can be cancelled
    const cancellationInfo = booking.canBeCancelled();

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('getBookingByReference', duration, {
      reference,
      bookingStatus: booking.booking_status,
    });

    // Log business event
    logBusinessEvent('BOOKING_VIEWED', {
      bookingId: booking.id,
      bookingReference: booking.booking_reference,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          reference: booking.booking_reference,
          status: booking.booking_status,
          customerName: booking.user_name,
          customerEmail: booking.user_email,
          customerPhone: booking.user_phone,
          totalSeats: booking.total_seats,
          totalAmount: booking.total_amount,
          bookingDate: booking.booking_date,
        },
        show: {
          id: booking.show.id,
          movieTitle: booking.show.movie.title,
          showDate: booking.show.show_date,
          showTime: booking.show.show_time,
          hallName: booking.show.hall_name,
        },
        seats: seatDetails,
        ticket: {
          qrCode: `BMS-${booking.booking_reference}`,
          isValid: booking.booking_status === 'CONFIRMED',
        },
        cancellation: {
          ...cancellationInfo,
          policy: 'Cancellations allowed up to 1 hour before show time',
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logPerformance('getBookingByReference', Date.now() - startTime, {
      reference,
      error: error.message,
    });
    throw error;
  }
});

/**
 * Get bookings by user email
 * 
 * @description Retrieves booking history for a user by email address
 * @route GET /api/v1/bookings/user/:email
 * @param {string} email - User email address
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 50)
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const getUserBookings = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { email } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const bookings = await Booking.findByUserEmail(email, parseInt(limit));

    // Calculate pagination (simplified since we're using limit)
    const offset = (page - 1) * limit;
    const paginatedBookings = bookings.slice(offset, offset + parseInt(limit));

    // Format booking data for response
    const formattedBookings = paginatedBookings.map(booking => ({
      id: booking.id,
      reference: booking.booking_reference,
      status: booking.booking_status,
      movieTitle: booking.show?.movie?.title || 'Unknown Movie',
      showDate: booking.show?.show_date,
      showTime: booking.show?.show_time,
      hallName: booking.show?.hall_name,
      totalSeats: booking.total_seats,
      totalAmount: booking.total_amount,
      bookingDate: booking.booking_date,
      canCancel: booking.canBeCancelled().canCancel,
    }));

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('getUserBookings', duration, {
      email,
      bookingCount: bookings.length,
      page,
      limit,
    });

    res.json({
      success: true,
      data: {
        bookings: formattedBookings,
        userEmail: email,
        pagination: {
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit),
          totalItems: bookings.length,
          hasMore: bookings.length > offset + parseInt(limit),
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logPerformance('getUserBookings', Date.now() - startTime, {
      email,
      error: error.message,
    });
    throw error;
  }
});

/**
 * Cancel a booking
 * 
 * @description Cancels a confirmed booking and releases the seats
 * @route DELETE /api/v1/bookings/:reference
 * @param {string} reference - Booking reference
 * @body {string} reason - Cancellation reason (optional)
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { reference } = req.params;
  const { reason = 'User cancellation' } = req.body;

  try {
    const booking = await Booking.findOne({
      where: { booking_reference: reference },
      include: [{
        model: Show,
        as: 'show',
        include: [{
          model: Movie,
          as: 'movie',
          attributes: ['title'],
        }],
      }],
    });

    if (!booking) {
      throw new NotFoundError('Booking', reference);
    }

    // Check if booking can be cancelled
    const cancellationCheck = booking.canBeCancelled();
    if (!cancellationCheck.canCancel) {
      throw new BusinessLogicError(cancellationCheck.reason);
    }

    // Cancel the booking
    const cancellationResult = await booking.cancelBooking(reason);

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('cancelBooking', duration, {
      bookingReference: reference,
      seatCount: cancellationResult.cancelled_seats,
    });

    // Log business event
    logBusinessEvent('BOOKING_CANCELLED', {
      bookingId: booking.id,
      bookingReference: booking.booking_reference,
      showId: booking.show_id,
      movieTitle: booking.show?.movie?.title,
      seatCount: booking.total_seats,
      totalAmount: booking.total_amount,
      reason,
      userAgent: req.get('User-Agent'),
      clientIp: req.ip,
    });

    res.json({
      success: true,
      data: {
        booking: {
          reference: booking.booking_reference,
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
        cancellation: {
          reason,
          seatsReleased: cancellationResult.cancelled_seats,
          message: cancellationResult.message,
        },
      },
      message: `Booking ${reference} has been successfully cancelled`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logPerformance('cancelBooking', Date.now() - startTime, {
      bookingReference: reference,
      error: error.message,
    });
    throw error;
  }
});

/**
 * Get booking statistics
 * 
 * @description Retrieves booking statistics for analytics (admin endpoint)
 * @route GET /api/v1/bookings/stats
 * @query {string} startDate - Start date (YYYY-MM-DD)
 * @query {string} endDate - End date (YYYY-MM-DD)
 * @access Public (would be admin-only in real system)
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const getBookingStats = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { startDate, endDate } = req.query;

  // Default to last 30 days if no dates provided
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000));

  try {
    const stats = await Booking.getBookingStats(start, end);

    // Get seat reservation statistics
    const seatStats = await SeatReservation.getReservationStats(start, end);

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('getBookingStats', duration, {
      startDate: start,
      endDate: end,
    });

    res.json({
      success: true,
      data: {
        dateRange: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        },
        bookings: {
          totalBookings: parseInt(stats.total_bookings) || 0,
          totalSeats: parseInt(stats.total_seats_sold) || 0,
          totalRevenue: parseFloat(stats.total_revenue) || 0,
          averageBookingValue: parseFloat(stats.average_booking_value) || 0,
        },
        reservations: seatStats,
        metrics: {
          conversionRate: seatStats.total > 0 ?
            ((seatStats.confirmed / seatStats.total) * 100).toFixed(2) + '%' :
            '0%',
          blockExpiryRate: seatStats.total > 0 ?
            ((seatStats.expired / seatStats.total) * 100).toFixed(2) + '%' :
            '0%',
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logPerformance('getBookingStats', Date.now() - startTime, {
      error: error.message,
    });
    throw error;
  }
});

module.exports = {
  createBooking,
  getBookingByReference,
  getUserBookings,
  cancelBooking,
  getBookingStats,
};

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. PAYMENT INTEGRATION:
 *    - Current: No payment processing
 *    - Issue: Bookings created without payment verification
 *    - Improvement: Payment gateway integration, payment status tracking
 * 
 * 2. DUPLICATE BOOKING PREVENTION:
 *    - Current: Simple time-based duplicate check
 *    - Issue: Sophisticated duplicate booking attempts possible
 *    - Improvement: Better fraud detection, user session tracking
 * 
 * 3. BOOKING CONFIRMATION:
 *    - Current: No email/SMS notifications
 *    - Issue: Poor user experience, no booking reminders
 *    - Improvement: Email/SMS service integration, reminder system
 * 
 * 4. CANCELLATION POLICY:
 *    - Current: Simple time-based cancellation
 *    - Issue: Inflexible cancellation rules
 *    - Improvement: Configurable cancellation policies, partial refunds
 * 
 * 5. BOOKING ANALYTICS:
 *    - Current: Basic statistics only
 *    - Issue: Limited business insights
 *    - Improvement: Advanced analytics, booking patterns, revenue insights
 * 
 * 6. CONCURRENCY HANDLING:
 *    - Current: Database transactions for booking creation
 *    - Issue: Potential race conditions in high-load scenarios
 *    - Improvement: Distributed locking, queue-based booking processing
 */