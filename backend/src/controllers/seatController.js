/**
 * Seat Controller
 * 
 * Handles all seat-related HTTP requests and responses.
 * Implements seat selection, blocking, and layout functionality.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

console.log('🔧 [seatController.js] Loading...');
const { Seat, Show, SeatReservation, Movie } = require('../models');
console.log('✅ [seatController.js] Models loaded');
const {
  asyncHandler,
  NotFoundError,
  BusinessLogicError,
  ConflictError,
  createSeatConflictError,
  createExpiredBlockError
} = require('../middleware/errorHandler');
console.log('✅ [seatController.js] Error handlers loaded');
const { logBusinessEvent, logPerformance, logSecurityEvent } = require('../middleware/logger');
console.log('✅ [seatController.js] Logger loaded');
const { sequelize } = require('../config/database');
console.log('✅ [seatController.js] ALL IMPORTS COMPLETE!');

/**
 * Get seat layout for a show
 * 
 * @description Retrieves the complete seat layout for a show with availability status
 * @route GET /api/v1/seats/layout/:showId
 * @param {string} showId - Show ID (UUID)
 * @query {boolean} availableOnly - Only return available seats (default: false)
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const getSeatLayout = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { showId } = req.params;
  const { availableOnly = false } = req.query;

  try {
    // Verify show exists
    const show = await Show.findByPk(showId, {
      include: [{
        model: Movie,
        as: 'movie',
        attributes: ['title', 'duration'],
      }],
    });

    if (!show) {
      throw new NotFoundError('Show', showId);
    }

    // Get seat layout with current availability
    const seatLayout = await Seat.getSeatLayout(showId);

    // Filter by availability if requested
    let filteredLayout = seatLayout;
    if (availableOnly) {
      filteredLayout = {};
      Object.keys(seatLayout).forEach(row => {
        const availableSeats = seatLayout[row].filter(seat => seat.is_available);
        if (availableSeats.length > 0) {
          filteredLayout[row] = availableSeats;
        }
      });
    }

    // Calculate layout statistics
    const allSeats = Object.values(seatLayout).flat();
    const stats = {
      totalSeats: allSeats.length,
      availableSeats: allSeats.filter(seat => seat.is_available).length,
      bookedSeats: allSeats.filter(seat => seat.reservation_status === 'BOOKED').length,
      blockedSeats: allSeats.filter(seat => seat.reservation_status === 'BLOCKED').length,
      rows: Object.keys(seatLayout).length,
    };

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('getSeatLayout', duration, {
      showId,
      totalSeats: stats.totalSeats,
      availableOnly,
    });

    // Log business event
    logBusinessEvent('SEAT_LAYOUT_VIEWED', {
      showId,
      movieTitle: show.movie.title,
      totalSeats: stats.totalSeats,
      availableSeats: stats.availableSeats,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: {
        show: {
          id: show.id,
          movieTitle: show.movie.title,
          showDate: show.show_date,
          showTime: show.show_time,
          hallName: show.hall_name,
          price: show.price,
        },
        seatLayout: filteredLayout,
        statistics: stats,
        legend: {
          available: 'Seat is available for booking',
          blocked: 'Seat is temporarily blocked (will expire soon)',
          booked: 'Seat is already booked',
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logPerformance('getSeatLayout', Date.now() - startTime, {
      showId,
      error: error.message,
    });
    throw error;
  }
});

/**
 * Block selected seats temporarily
 * 
 * @description Temporarily blocks seats for booking process (5-minute hold)
 * @route POST /api/v1/seats/block
 * @body {string} showId - Show ID (UUID)
 * @body {string[]} seatIds - Array of seat IDs to block
 * @body {number} blockDuration - Duration in minutes (default: 5, max: 15)
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const blockSeats = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { showId, seatIds, blockDuration = 5 } = req.body;

  // Validate input
  if (!seatIds || seatIds.length === 0) {
    throw new BusinessLogicError('At least one seat must be selected');
  }

  if (seatIds.length > 10) {
    throw new BusinessLogicError('Cannot block more than 10 seats at once');
  }

  const transaction = await sequelize.transaction();

  try {
    // Verify show exists and is bookable
    const show = await Show.findByPk(showId, { transaction });
    if (!show) {
      throw new NotFoundError('Show', showId);
    }

    // Check if show is in the future
    const showDateTime = new Date(`${show.show_date}T${show.show_time}`);
    if (showDateTime <= new Date()) {
      throw new BusinessLogicError('Cannot block seats for past shows');
    }

    // Verify all seats exist and belong to the show
    const seats = await Seat.findAll({
      where: {
        id: seatIds,
        show_id: showId,
      },
      transaction,
    });

    if (seats.length !== seatIds.length) {
      const foundSeatIds = seats.map(s => s.id);
      const missingSeatIds = seatIds.filter(id => !foundSeatIds.includes(id));
      throw new NotFoundError('Seats', missingSeatIds.join(', '));
    }

    // Check if show has enough available seats
    if (show.available_seats < seatIds.length) {
      throw new BusinessLogicError(
        `Show only has ${show.available_seats} available seats, but ${seatIds.length} were requested`
      );
    }

    // Clean up any expired blocks first
    await SeatReservation.cleanupExpiredBlocks();

    // Check for existing active reservations
    const existingReservations = await SeatReservation.findAll({
      where: {
        seat_id: seatIds,
        reservation_status: ['BLOCKED', 'CONFIRMED'],
      },
      include: [{
        model: Seat,
        as: 'seat',
        attributes: ['row_number', 'seat_number'],
      }],
      transaction,
    });

    // Filter out expired blocks
    const activeReservations = existingReservations.filter(reservation => {
      if (reservation.reservation_status === 'CONFIRMED') {
        return true; // Confirmed reservations are always active
      }

      if (reservation.reservation_status === 'BLOCKED') {
        return new Date() < reservation.expires_at; // Check if block hasn't expired
      }

      return false;
    });

    if (activeReservations.length > 0) {
      const conflictSeats = activeReservations.map(res =>
        `${res.seat.row_number}${res.seat.seat_number}`
      ).join(', ');

      throw createSeatConflictError(
        conflictSeats,
        `Seats ${conflictSeats} are already reserved or blocked by another user`
      );
    }

    // Block all seats atomically
    const blockedReservations = await SeatReservation.blockMultipleSeats(
      seatIds,
      blockDuration
    );

    // Update show available seat count
    await show.updateAvailableSeats(-seatIds.length);

    await transaction.commit();

    // Prepare response
    const blockedSeatsInfo = blockedReservations.map((reservation, index) => ({
      seatId: seatIds[index],
      reservationId: reservation.id,
      seatIdentifier: seats.find(s => s.id === seatIds[index]).getSeatIdentifier(),
      expiresAt: reservation.expires_at,
      expiresIn: Math.floor((reservation.expires_at - new Date()) / 1000), // seconds
    }));

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('blockSeats', duration, {
      showId,
      seatCount: seatIds.length,
      blockDuration,
    });

    // Log business event
    logBusinessEvent('SEATS_BLOCKED', {
      showId,
      seatIds,
      seatCount: seatIds.length,
      blockDuration,
      expiresAt: blockedReservations[0].expires_at,
      userAgent: req.get('User-Agent'),
      clientIp: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        blockedSeats: blockedSeatsInfo,
        blockInfo: {
          durationMinutes: blockDuration,
          expiresAt: blockedReservations[0].expires_at,
          autoReleaseWarning: `Seats will be automatically released if booking is not completed within ${blockDuration} minutes`,
        },
        showInfo: {
          id: show.id,
          availableSeats: show.available_seats - seatIds.length, // Updated count
          price: show.price,
          totalAmount: (show.price * seatIds.length).toFixed(2),
        },
      },
      message: `Successfully blocked ${seatIds.length} seats for ${blockDuration} minutes`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    await transaction.rollback();

    logPerformance('blockSeats', Date.now() - startTime, {
      showId,
      seatCount: seatIds ? seatIds.length : 0,
      error: error.message,
    });

    // Log security event if suspicious activity detected
    if (seatIds && seatIds.length > 10) {
      logSecurityEvent('SUSPICIOUS_SEAT_BLOCKING', {
        showId,
        seatCount: seatIds.length,
        clientIp: req.ip,
        userAgent: req.get('User-Agent'),
      }, req);
    }

    throw error;
  }
});

/**
 * Release blocked seats
 * 
 * @description Manually releases blocked seats before expiry
 * @route POST /api/v1/seats/release
 * @body {string[]} seatIds - Array of seat IDs to release
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const releaseSeats = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { seatIds } = req.body;

  if (!seatIds || seatIds.length === 0) {
    throw new BusinessLogicError('At least one seat ID must be provided');
  }

  const transaction = await sequelize.transaction();

  try {
    // Find blocked reservations for these seats
    const blockedReservations = await SeatReservation.findAll({
      where: {
        seat_id: seatIds,
        reservation_status: 'BLOCKED',
      },
      include: [{
        model: Seat,
        as: 'seat',
        include: [{
          model: Show,
          as: 'show',
        }],
      }],
      transaction,
    });

    if (blockedReservations.length === 0) {
      throw new NotFoundError('Blocked reservations for provided seat IDs');
    }

    // Check if any blocks have expired
    const expiredBlocks = blockedReservations.filter(res => new Date() > res.expires_at);
    if (expiredBlocks.length > 0) {
      const expiredSeatIds = expiredBlocks.map(res => res.seat_id);
      throw createExpiredBlockError(expiredSeatIds.join(', '));
    }

    // Group by show for efficient seat count updates
    const showUpdates = {};

    // Release each reservation
    const releasedSeats = [];
    for (const reservation of blockedReservations) {
      await reservation.update({
        reservation_status: 'EXPIRED'
      }, { transaction });

      await reservation.seat.update({
        is_available: true
      }, { transaction });

      // Track show updates
      const showId = reservation.seat.show_id;
      if (!showUpdates[showId]) {
        showUpdates[showId] = 0;
      }
      showUpdates[showId]++;

      releasedSeats.push({
        seatId: reservation.seat_id,
        seatIdentifier: reservation.seat.getSeatIdentifier(),
        showId: showId,
      });
    }

    // Update available seat counts for affected shows
    for (const [showId, count] of Object.entries(showUpdates)) {
      const show = await Show.findByPk(showId, { transaction });
      await show.updateAvailableSeats(count);
    }

    await transaction.commit();

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('releaseSeats', duration, {
      seatCount: releasedSeats.length,
      showsAffected: Object.keys(showUpdates).length,
    });

    // Log business event
    logBusinessEvent('SEATS_RELEASED', {
      seatIds,
      seatCount: releasedSeats.length,
      manual: true,
      userAgent: req.get('User-Agent'),
      clientIp: req.ip,
    });

    res.json({
      success: true,
      data: {
        releasedSeats,
        summary: {
          totalReleased: releasedSeats.length,
          showsAffected: Object.keys(showUpdates).length,
        },
      },
      message: `Successfully released ${releasedSeats.length} blocked seats`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    await transaction.rollback();

    logPerformance('releaseSeats', Date.now() - startTime, {
      seatCount: seatIds ? seatIds.length : 0,
      error: error.message,
    });

    throw error;
  }
});

/**
 * Get available seats for a show
 * 
 * @description Retrieves only available seats for booking
 * @route GET /api/v1/seats/available/:showId
 * @param {string} showId - Show ID (UUID)
 * @query {number} count - Maximum number of seats to return (optional)
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const getAvailableSeats = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { showId } = req.params;
  const { count } = req.query;

  try {
    // Verify show exists
    const show = await Show.findByPk(showId);
    if (!show) {
      throw new NotFoundError('Show', showId);
    }

    // Clean up expired blocks first
    await SeatReservation.cleanupExpiredBlocks();

    // Get available seats
    const availableSeats = await Seat.getAvailableSeats(showId, count);

    // Group by row for better presentation
    const seatsByRow = {};
    availableSeats.forEach(seat => {
      const row = seat.row_number;
      if (!seatsByRow[row]) {
        seatsByRow[row] = [];
      }
      seatsByRow[row].push({
        id: seat.id,
        seatNumber: seat.seat_number,
        seatType: seat.seat_type,
        seatIdentifier: seat.getSeatIdentifier(),
      });
    });

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('getAvailableSeats', duration, {
      showId,
      availableCount: availableSeats.length,
      requestedCount: count,
    });

    res.json({
      success: true,
      data: {
        showId,
        availableSeats: seatsByRow,
        summary: {
          totalAvailable: availableSeats.length,
          rows: Object.keys(seatsByRow).length,
          showCapacity: show.total_seats,
          occupancy: ((show.total_seats - availableSeats.length) / show.total_seats * 100).toFixed(1) + '%',
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logPerformance('getAvailableSeats', Date.now() - startTime, {
      showId,
      error: error.message,
    });
    throw error;
  }
});

/**
 * Extend seat block duration
 * 
 * @description Extends the expiry time of blocked seats
 * @route PATCH /api/v1/seats/extend-block
 * @body {string[]} seatIds - Array of seat IDs to extend
 * @body {number} additionalMinutes - Additional minutes to extend (max: 10)
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const extendSeatBlock = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { seatIds, additionalMinutes = 5 } = req.body;

  if (!seatIds || seatIds.length === 0) {
    throw new BusinessLogicError('At least one seat ID must be provided');
  }

  if (additionalMinutes > 10) {
    throw new BusinessLogicError('Cannot extend block by more than 10 minutes');
  }

  try {
    // Find blocked reservations
    const reservations = await SeatReservation.findAll({
      where: {
        seat_id: seatIds,
        reservation_status: 'BLOCKED',
      },
      include: [{
        model: Seat,
        as: 'seat',
        attributes: ['row_number', 'seat_number'],
      }],
    });

    if (reservations.length === 0) {
      throw new NotFoundError('Blocked reservations for provided seat IDs');
    }

    // Check if any blocks have expired
    const expiredReservations = reservations.filter(res => res.hasExpired());
    if (expiredReservations.length > 0) {
      const expiredSeats = expiredReservations.map(res =>
        res.seat.getSeatIdentifier()
      ).join(', ');
      throw createExpiredBlockError(expiredSeats);
    }

    // Extend each reservation
    const extendedReservations = [];
    for (const reservation of reservations) {
      const extended = await reservation.extendBlock(additionalMinutes);
      extendedReservations.push({
        seatId: reservation.seat_id,
        seatIdentifier: reservation.seat.getSeatIdentifier(),
        newExpiryTime: extended.expires_at,
        remainingTime: extended.getRemainingTime(),
      });
    }

    // Log business event
    logBusinessEvent('SEAT_BLOCKS_EXTENDED', {
      seatIds,
      seatCount: seatIds.length,
      additionalMinutes,
      userAgent: req.get('User-Agent'),
      clientIp: req.ip,
    });

    res.json({
      success: true,
      data: {
        extendedSeats: extendedReservations,
        extension: {
          additionalMinutes,
          totalExtended: extendedReservations.length,
        },
      },
      message: `Successfully extended ${extendedReservations.length} seat blocks by ${additionalMinutes} minutes`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logPerformance('extendSeatBlock', Date.now() - startTime, {
      seatCount: seatIds ? seatIds.length : 0,
      additionalMinutes,
      error: error.message,
    });
    throw error;
  }
});

module.exports = {
  getSeatLayout,
  blockSeats,
  releaseSeats,
  getAvailableSeats,
  extendSeatBlock,
};

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. CONCURRENCY HANDLING:
 *    - Current: Database transactions with basic conflict detection
 *    - Issue: Potential race conditions during high-load seat blocking
 *    - Improvement: Optimistic locking, distributed locks with Redis
 * 
 * 2. BLOCK EXPIRY MECHANISM:
 *    - Current: Manual cleanup + check on operations
 *    - Issue: Relies on application to clean up expired blocks
 *    - Improvement: Database triggers, background job scheduler
 * 
 * 3. SEAT SELECTION ALGORITHM:
 *    - Current: User selects individual seats
 *    - Issue: No intelligent seat suggestions for groups
 *    - Improvement: Best available seat algorithm, group seating suggestions
 * 
 * 4. PERFORMANCE OPTIMIZATION:
 *    - Current: Individual seat operations in loops
 *    - Issue: N+1 queries and performance bottlenecks
 *    - Improvement: Bulk operations, database stored procedures
 * 
 * 5. REAL-TIME UPDATES:
 *    - Current: Polling-based seat availability updates
 *    - Issue: Delayed updates, poor user experience
 *    - Improvement: WebSocket integration for real-time seat updates
 * 
 * 6. ABUSE PREVENTION:
 *    - Current: Basic rate limiting and validation
 *    - Issue: Users could spam seat blocking requests
 *    - Improvement: Per-user rate limiting, CAPTCHA for suspicious activity
 */