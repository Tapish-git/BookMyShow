/**
 * Movie Controller
 * 
 * Handles all movie-related HTTP requests and responses.
 * Implements business logic for movie browsing and search functionality.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

const { Movie, Show, sequelize } = require('../models');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const { logBusinessEvent, logPerformance } = require('../middleware/logger');
const { Op } = require('sequelize');

/**
 * Get all movies with optional filtering
 * 
 * @description Retrieves paginated list of movies with optional genre, language, and search filters
 * @route GET /api/v1/movies
 * @query {string} genre - Filter by genre (optional)
 * @query {string} language - Filter by language (optional) 
 * @query {string} search - Search in movie titles (optional)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const getAllMovies = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { genre, language, search, page = 1, limit = 10 } = req.query;

  // Build filter conditions
  const whereConditions = {};

  if (genre) {
    whereConditions.genre = genre;
  }

  if (language) {
    whereConditions.language = language;
  }

  if (search) {
    whereConditions.title = {
      [Op.iLike]: `%${search}%`, // Case-insensitive search
    };
  }

  // Calculate pagination offset
  const offset = (page - 1) * limit;

  try {
    // Get movies with pagination
    const { rows: movies, count: totalMovies } = await Movie.findAndCountAll({
      where: whereConditions,
      order: [
        ['rating', 'DESC'], // Highest rated first
        ['title', 'ASC'],   // Then alphabetically
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id',
        'title',
        'description',
        'genre',
        'duration',
        'rating',
        'poster_url',
        'release_date',
        'language',
        'created_at'
      ],
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalMovies / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('getAllMovies', duration, {
      totalMovies,
      filters: { genre, language, search },
      pagination: { page, limit, offset },
    });

    // Log business event
    logBusinessEvent('MOVIES_BROWSED', {
      totalResults: totalMovies,
      filters: { genre, language, search },
      page,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: {
        movies,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalMovies,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPreviousPage,
        },
        filters: {
          genre: genre || null,
          language: language || null,
          search: search || null,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logPerformance('getAllMovies', Date.now() - startTime, {
      error: error.message,
      filters: { genre, language, search },
    });
    throw error;
  }
});

/**
 * Get movie by ID with show information
 * 
 * @description Retrieves detailed information about a specific movie including upcoming shows
 * @route GET /api/v1/movies/:id
 * @param {string} id - Movie ID (UUID)
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const getMovieById = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;

  try {
    // Get movie with upcoming shows
    const movie = await Movie.findByPk(id, {
      include: [
        {
          model: Show,
          as: 'shows',
          where: {
            show_date: {
              [Op.gte]: new Date(), // Only upcoming shows
            },
          },
          required: false, // Left join - include movies even without shows
          attributes: [
            'id',
            'show_date',
            'show_time',
            'hall_name',
            'total_seats',
            'available_seats',
            'price',
          ],
        },
      ],
      order: [[{ model: Show, as: 'shows' }, 'show_date', 'ASC'], [{ model: Show, as: 'shows' }, 'show_time', 'ASC']],
    });

    if (!movie) {
      throw new NotFoundError('Movie', id);
    }

    // Group shows by date for better frontend consumption
    const showsByDate = {};
    if (movie.shows) {
      movie.shows.forEach(show => {
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
          status: show.available_seats > 0 ? 'available' : 'sold_out',
        });
      });
    }

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('getMovieById', duration, {
      movieId: id,
      showsCount: movie.shows ? movie.shows.length : 0,
    });

    // Log business event
    logBusinessEvent('MOVIE_VIEWED', {
      movieId: id,
      movieTitle: movie.title,
      showsAvailable: movie.shows ? movie.shows.length : 0,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: {
        movie: {
          id: movie.id,
          title: movie.title,
          description: movie.description,
          genre: movie.genre,
          duration: movie.duration,
          durationFormatted: `${movie.duration} mins`,
          rating: movie.rating,
          ratingFormatted: movie.rating ? `${movie.rating}/10` : 'Not Rated',
          posterUrl: movie.poster_url,
          releaseDate: movie.release_date,
          language: movie.language,
          createdAt: movie.created_at,
        },
        shows: {
          byDate: showsByDate,
          totalShows: movie.shows ? movie.shows.length : 0,
          availableDates: Object.keys(showsByDate).sort(),
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logPerformance('getMovieById', Date.now() - startTime, {
      movieId: id,
      error: error.message,
    });
    throw error;
  }
});

/**
 * Search movies by title
 * 
 * @description Searches movies by title with fuzzy matching
 * @route GET /api/v1/movies/search
 * @query {string} q - Search query (required)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 50)
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const searchMovies = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { q: searchQuery, page = 1, limit = 10 } = req.query;

  if (!searchQuery || searchQuery.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_SEARCH_QUERY',
        message: 'Search query is required',
      },
    });
  }

  const offset = (page - 1) * limit;
  const trimmedQuery = searchQuery.trim();

  try {
    // Search in title, description, and genre
    const { rows: movies, count: totalResults } = await Movie.findAndCountAll({
      where: {
        [Op.or]: [
          {
            title: {
              [Op.iLike]: `%${trimmedQuery}%`,
            },
          },
          {
            description: {
              [Op.iLike]: `%${trimmedQuery}%`,
            },
          },
          {
            genre: {
              [Op.iLike]: `%${trimmedQuery}%`,
            },
          },
        ],
      },
      order: [
        // Exact title matches first
        [
          sequelize.literal(
            `CASE WHEN LOWER(title) = LOWER('${trimmedQuery}') THEN 1 ELSE 2 END`
          ),
          'ASC'
        ],
        // Then by rating
        ['rating', 'DESC'],
        ['title', 'ASC'],
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id',
        'title',
        'description',
        'genre',
        'duration',
        'rating',
        'poster_url',
        'release_date',
        'language',
      ],
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalResults / limit);

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('searchMovies', duration, {
      searchQuery: trimmedQuery,
      totalResults,
      pagination: { page, limit },
    });

    // Log business event
    logBusinessEvent('MOVIES_SEARCHED', {
      searchQuery: trimmedQuery,
      totalResults,
      page,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: {
        movies,
        search: {
          query: trimmedQuery,
          totalResults,
          currentPage: parseInt(page),
          totalPages,
          hasMoreResults: page < totalPages,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logPerformance('searchMovies', Date.now() - startTime, {
      searchQuery: trimmedQuery,
      error: error.message,
    });
    throw error;
  }
});

/**
 * Get currently showing movies
 * 
 * @description Retrieves movies that have shows scheduled for today or future dates
 * @route GET /api/v1/movies/now-showing
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20)
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const getNowShowingMovies = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Get movies with shows from today onwards
    const { rows: movies, count: totalMovies } = await Movie.findAndCountAll({
      include: [
        {
          model: Show,
          as: 'shows',
          where: {
            show_date: {
              [Op.gte]: today,
            },
            available_seats: {
              [Op.gt]: 0, // Only shows with available seats
            },
          },
          required: true, // Inner join - only movies with available shows
          attributes: ['show_date', 'available_seats'],
        },
      ],
      order: [
        ['rating', 'DESC'],
        ['title', 'ASC'],
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true, // Important for accurate count with includes
    });

    // Format response with show statistics
    const moviesWithStats = movies.map(movie => ({
      id: movie.id,
      title: movie.title,
      description: movie.description,
      genre: movie.genre,
      duration: movie.duration,
      rating: movie.rating,
      posterUrl: movie.poster_url,
      releaseDate: movie.release_date,
      language: movie.language,
      showStats: {
        totalShows: movie.shows.length,
        availableSeats: movie.shows.reduce((sum, show) => sum + show.available_seats, 0),
        nextShowDate: movie.shows.length > 0 ?
          movie.shows.sort((a, b) => new Date(a.show_date) - new Date(b.show_date))[0].show_date :
          null,
      },
    }));

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('getNowShowingMovies', duration, {
      totalMovies,
      pagination: { page, limit },
    });

    // Log business event
    logBusinessEvent('NOW_SHOWING_VIEWED', {
      totalMovies,
      page,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: {
        movies: moviesWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMovies / limit),
          totalItems: totalMovies,
          itemsPerPage: parseInt(limit),
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logPerformance('getNowShowingMovies', Date.now() - startTime, {
      error: error.message,
    });
    throw error;
  }
});

/**
 * Get movies by genre
 * 
 * @description Retrieves movies filtered by specific genre
 * @route GET /api/v1/movies/genre/:genre
 * @param {string} genre - Movie genre
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 12)
 * @access Public
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const getMoviesByGenre = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { genre } = req.params;
  const { page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;

  // Validate genre
  const validGenres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Adventure', 'Animation', 'Family'];
  if (!validGenres.includes(genre)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_GENRE',
        message: `Invalid genre. Must be one of: ${validGenres.join(', ')}`,
      },
    });
  }

  try {
    const { rows: movies, count: totalMovies } = await Movie.findAndCountAll({
      where: { genre },
      order: [
        ['rating', 'DESC'],
        ['release_date', 'DESC'],
        ['title', 'ASC'],
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id',
        'title',
        'description',
        'genre',
        'duration',
        'rating',
        'poster_url',
        'release_date',
        'language',
      ],
    });

    // Log performance
    const duration = Date.now() - startTime;
    logPerformance('getMoviesByGenre', duration, {
      genre,
      totalMovies,
      pagination: { page, limit },
    });

    // Log business event
    logBusinessEvent('MOVIES_BY_GENRE_VIEWED', {
      genre,
      totalMovies,
      page,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: {
        movies,
        genre,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMovies / limit),
          totalItems: totalMovies,
          itemsPerPage: parseInt(limit),
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logPerformance('getMoviesByGenre', Date.now() - startTime, {
      genre,
      error: error.message,
    });
    throw error;
  }
});

module.exports = {
  getAllMovies,
  getMovieById,
  searchMovies,
  getNowShowingMovies,
  getMoviesByGenre,
};

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. CACHING STRATEGY:
 *    - Current: No caching implemented
 *    - Issue: Database queries on every request
 *    - Improvement: Redis caching for movie data, cache invalidation
 * 
 * 2. SEARCH OPTIMIZATION:
 *    - Current: Simple ILIKE queries
 *    - Issue: Poor performance on large datasets
 *    - Improvement: Full-text search, Elasticsearch integration
 * 
 * 3. IMAGE HANDLING:
 *    - Current: Direct URL storage
 *    - Issue: No image optimization, CDN integration
 *    - Improvement: Image processing service, CDN integration
 * 
 * 4. PAGINATION:
 *    - Current: Offset-based pagination
 *    - Issue: Performance degrades with large offsets
 *    - Improvement: Cursor-based pagination for better performance
 * 
 * 5. DATA TRANSFORMATION:
 *    - Current: Manual data formatting in controllers
 *    - Issue: Inconsistent response formats
 *    - Improvement: Serializer/transformer classes
 * 
 * 6. RECOMMENDATION ENGINE:
 *    - Current: Simple rating-based ordering
 *    - Issue: No personalization or smart recommendations
 *    - Improvement: User preference based recommendations
 */