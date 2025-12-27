/**
 * Show Controller
 * 
 * Handles all show-related HTTP requests and responses.
 * Implements show browsing, filtering, and scheduling functionality.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

console.log('🔧 [showController.js] Loading...');
const { Show, Movie, Seat } = require('../models');
console.log('✅ [showController.js] Models loaded');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
console.log('✅ [showController.js] Error handlers loaded');
const { logBusinessEvent, logPerformance } = require('../middleware/logger');
console.log('✅ [showController.js] Logger loaded');
const { Op } = require('sequelize');
console.log('✅ [showController.js] ALL IMPORTS COMPLETE!');

/**
 * Get all shows with optional filtering
 * 
 * @description Retrieves paginated list of shows with optional filters
 * @route GET /api/v1/shows
 * @query {string} movieId - Filter by movie ID (optional)
 * @query {string} date - Filter by show date (YYYY-MM-DD, optional)
 * @query {string} hallName - Filter by hall name (optional)
 * @query {boolean} availableOnly - Only shows with available seats (default: true)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10)
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const getAllShows = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const {
    movieId,
    date,
    hallName,
    availableOnly = true,
    page = 1,
    limit = 10
  } = req.query;

  // Build filter conditions
  const whereConditions = {};

  if (movieId) {
    whereConditions.movie_id = movieId;
  }

  if (date) {
    whereConditions.show_date = date;
  } else {
    // Default to shows from today onwards
    whereConditions.show_date = {
      [Op.gte]: new Date().toISOString().split('T')[0],
    };
  }

  if (hallName) {
    whereConditions.hall_name = hallName;
  }

  if (availableOnly) {
    whereConditions.available_seats = {
      [Op.gt]: 0,
    };
  }

  // Calculate pagination offset
  const offset = (page - 1) * limit;

  try {
    // Get shows with movie information
    const { rows: shows, count: totalShows } = await Show.findAndCountAll({
      where: whereConditions,
      include: [{
        model: Movie,
        as: 'movie',
        attributes: ['id', 'title', 'genre', 'duration', 'rating', 'poster_url', 'language'],
      }],
      order: [
        ['show_date', 'ASC'],
        ['show_time', 'ASC'],
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true, // Important for accurate count with includes
    });

    // Format shows for response
    const formattedShows = shows.map(show => ({
      id: show.id,
      showDate: show.show_date,
      showTime: show.show_time,
      showDateTime: `${show.show_date}T${show.show_time}`,
      hallName: show.hall_name,
      totalSeats: show.total_seats,
      availableSeats: show.available_seats,
      price: show.price,
      priceFormatted: `₹${show.price}`,
      status: show.getStatus(),
      movie: {
        id: show.movie.id,
        title: show.movie.title,
        genre: show.movie.genre,
        duration: show.movie.duration,
        durationFormatted: `${show.movie.duration} mins`,
        rating: show.movie.rating,
        posterUrl: show.movie.poster_url,
        language: show.movie.language,
      },
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalShows / limit);

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('getAllShows', duration, {
      totalShows,
      filters: { movieId, date, hallName, availableOnly },
      pagination: { page, limit },
    });

    // Log business event
    logBusinessEvent('SHOWS_BROWSED', {
      totalResults: totalShows,
      filters: { movieId, date, hallName, availableOnly },
      page,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: {
        shows: formattedShows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalShows,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        filters: {
          movieId: movieId || null,
          date: date || null,
          hallName: hallName || null,
          availableOnly,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logPerformance('getAllShows', Date.now() - startTime, {
      error: error.message,
      filters: { movieId, date, hallName, availableOnly },
    });
    throw error;
  }
});

/**
 * Get shows by movie ID
 * 
 * @description Retrieves all shows for a specific movie
 * @route GET /api/v1/shows/movie/:movieId
 * @param {string} movieId - Movie ID (UUID)
 * @query {string} date - Filter by specific date (optional)
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const getShowsByMovie = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { movieId } = req.params;
  const { date } = req.query;

  try {
    // Verify movie exists
    const movie = await Movie.findByPk(movieId);
    if (!movie) {
      throw new NotFoundError('Movie', movieId);
    }

    // Build date filter
    let dateFilter = {
      [Op.gte]: new Date().toISOString().split('T')[0], // Today onwards
    };

    if (date) {
      dateFilter = date;
    }

    // Get shows for this movie
    const shows = await Show.findAll({
      where: {
        movie_id: movieId,
        show_date: dateFilter,
        available_seats: {
          [Op.gt]: 0, // Only available shows
        },
      },
      order: [
        ['show_date', 'ASC'],
        ['show_time', 'ASC'],
      ],
      attributes: [
        'id',
        'show_date',
        'show_time',
        'hall_name',
        'total_seats',
        'available_seats',
        'price',
      ],
    });

    // Group shows by date
    const showsByDate = {};
    shows.forEach(show => {
      const dateKey = show.show_date;
      if (!showsByDate[dateKey]) {
        showsByDate[dateKey] = [];
      }

      showsByDate[dateKey].push({
        id: show.id,
        time: show.show_time,
        hall: show.hall_name,
        totalSeats: show.total_seats,
        availableSeats: show.available_seats,
        price: show.price,
        priceFormatted: `₹${show.price}`,
        status: show.available_seats > 0 ? 'available' : 'sold_out',
      });
    });

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('getShowsByMovie', duration, {
      movieId,
      showsCount: shows.length,
      date,
    });

    // Log business event
    logBusinessEvent('MOVIE_SHOWS_VIEWED', {
      movieId,
      movieTitle: movie.title,
      showsCount: shows.length,
      requestedDate: date,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: {
        movie: {
          id: movie.id,
          title: movie.title,
          genre: movie.genre,
          duration: movie.duration,
          rating: movie.rating,
          posterUrl: movie.poster_url,
          language: movie.language,
        },
        shows: {
          byDate: showsByDate,
          totalShows: shows.length,
          availableDates: Object.keys(showsByDate).sort(),
        },
        requestedDate: date || 'all_upcoming',
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logPerformance('getShowsByMovie', Date.now() - startTime, {
      movieId,
      error: error.message,
    });
    throw error;
  }
});

/**
 * Get show by ID with detailed information
 * 
 * @description Retrieves detailed information about a specific show
 * @route GET /api/v1/shows/:id
 * @param {string} id - Show ID (UUID)
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const getShowById = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;

  try {
    const show = await Show.findByPk(id, {
      include: [{
        model: Movie,
        as: 'movie',
        attributes: ['id', 'title', 'description', 'genre', 'duration', 'rating', 'poster_url', 'language'],
      }],
    });

    if (!show) {
      throw new NotFoundError('Show', id);
    }

    // Get seat layout summary
    const seatLayout = await Seat.getSeatLayout(id);
    const allSeats = Object.values(seatLayout).flat();

    const seatSummary = {
      totalSeats: allSeats.length,
      availableSeats: allSeats.filter(seat => seat.is_available).length,
      bookedSeats: allSeats.filter(seat => seat.reservation_status === 'BOOKED').length,
      blockedSeats: allSeats.filter(seat => seat.reservation_status === 'BLOCKED').length,
      occupancyPercentage: ((allSeats.length - allSeats.filter(seat => seat.is_available).length) / allSeats.length * 100).toFixed(1),
    };

    // Calculate time until show
    const showDateTime = new Date(`${show.show_date}T${show.show_time}`);
    const timeUntilShow = Math.max(0, showDateTime.getTime() - new Date().getTime());
    const hoursUntilShow = Math.floor(timeUntilShow / (1000 * 60 * 60));
    const minutesUntilShow = Math.floor((timeUntilShow % (1000 * 60 * 60)) / (1000 * 60));

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('getShowById', duration, {
      showId: id,
      availableSeats: seatSummary.availableSeats,
    });

    // Log business event
    logBusinessEvent('SHOW_DETAILS_VIEWED', {
      showId: id,
      movieTitle: show.movie.title,
      showDate: show.show_date,
      showTime: show.show_time,
      availableSeats: seatSummary.availableSeats,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: {
        show: {
          id: show.id,
          showDate: show.show_date,
          showTime: show.show_time,
          showDateTime: `${show.show_date}T${show.show_time}`,
          hallName: show.hall_name,
          price: show.price,
          priceFormatted: `₹${show.price}`,
          status: show.getStatus(),
          timeUntilShow: {
            hours: hoursUntilShow,
            minutes: minutesUntilShow,
            formatted: timeUntilShow > 0 ? `${hoursUntilShow}h ${minutesUntilShow}m` : 'Started/Past',
          },
        },
        movie: show.movie,
        seating: seatSummary,
        booking: {
          canBook: show.getStatus() === 'upcoming' && seatSummary.availableSeats > 0,
          minBookingTime: '30 minutes before show time',
          maxSeatsPerBooking: 10,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logPerformance('getShowById', Date.now() - startTime, {
      showId: id,
      error: error.message,
    });
    throw error;
  }
});

/**
 * Get shows by date range
 * 
 * @description Retrieves shows within a specific date range
 * @route GET /api/v1/shows/date-range
 * @query {string} startDate - Start date (YYYY-MM-DD, required)
 * @query {string} endDate - End date (YYYY-MM-DD, required)
 * @query {string} movieId - Filter by movie ID (optional)
 * @query {boolean} availableOnly - Only shows with available seats (default: true)
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const getShowsByDateRange = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { startDate, endDate, movieId, availableOnly = true } = req.query;

  if (!startDate || !endDate) {
    throw new BusinessLogicError('Both startDate and endDate are required');
  }

  // Validate date range
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    throw new BusinessLogicError('startDate must be before or equal to endDate');
  }

  // Limit date range to 30 days
  const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
  if (daysDiff > 30) {
    throw new BusinessLogicError('Date range cannot exceed 30 days');
  }

  try {
    // Build filter conditions
    const whereConditions = {
      show_date: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (movieId) {
      whereConditions.movie_id = movieId;
    }

    if (availableOnly) {
      whereConditions.available_seats = {
        [Op.gt]: 0,
      };
    }

    // Get shows
    const shows = await Show.findAll({
      where: whereConditions,
      include: [{
        model: Movie,
        as: 'movie',
        attributes: ['id', 'title', 'genre', 'duration', 'poster_url'],
      }],
      order: [
        ['show_date', 'ASC'],
        ['show_time', 'ASC'],
      ],
    });

    // Group shows by date
    const showsByDate = {};
    shows.forEach(show => {
      const dateKey = show.show_date;
      if (!showsByDate[dateKey]) {
        showsByDate[dateKey] = [];
      }

      showsByDate[dateKey].push({
        id: show.id,
        time: show.show_time,
        hall: show.hall_name,
        availableSeats: show.available_seats,
        price: show.price,
        movie: {
          id: show.movie.id,
          title: show.movie.title,
          genre: show.movie.genre,
          duration: show.movie.duration,
          posterUrl: show.movie.poster_url,
        },
      });
    });

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('getShowsByDateRange', duration, {
      dateRange: { startDate, endDate },
      showsCount: shows.length,
      movieId,
    });

    res.json({
      success: true,
      data: {
        dateRange: { startDate, endDate },
        shows: {
          byDate: showsByDate,
          totalShows: shows.length,
          datesWithShows: Object.keys(showsByDate).length,
        },
        filters: { movieId, availableOnly },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logPerformance('getShowsByDateRange', Date.now() - startTime, {
      dateRange: { startDate, endDate },
      error: error.message,
    });
    throw error;
  }
});

module.exports = {
  getAllShows,
  getShowsByMovie,
  getShowById,
  getShowsByDateRange,
};

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. CACHING STRATEGY:
 *    - Current: No caching for show data
 *    - Issue: Database queries on every request
 *    - Improvement: Cache show schedules with TTL, invalidate on updates
 * 
 * 2. REAL-TIME AVAILABILITY:
 *    - Current: Database queries for seat availability
 *    - Issue: Slightly stale data possible
 *    - Improvement: Real-time updates with WebSockets, event streaming
 * 
 * 3. SHOW RECOMMENDATIONS:
 *    - Current: Simple date/time ordering
 *    - Issue: No personalized recommendations
 *    - Improvement: Recommendation engine based on user preferences
 * 
 * 4. PERFORMANCE OPTIMIZATION:
 *    - Current: Standard database queries
 *    - Issue: N+1 queries possible in some scenarios
 *    - Improvement: Query optimization, database indexing strategies
 * 
 * 5. DATE FILTERING:
 *    - Current: Basic date range filtering
 *    - Issue: No timezone handling, limited date formats
 *    - Improvement: Timezone-aware dates, flexible date parsing
 * 
 * 6. SHOW STATUS CALCULATION:
 *    - Current: Calculated on each request
 *    - Issue: Performance overhead
 *    - Improvement: Cached status with background updates
 */