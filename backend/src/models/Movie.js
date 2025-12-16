/**
 * Movie Model
 * 
 * Defines the Movie entity for storing movie information in the database.
 * Contains movie details like title, description, genre, rating, etc.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Movie Model Definition
 * 
 * @description Sequelize model for movies table
 * @param {Sequelize} sequelize - Database connection instance
 * @param {DataTypes} DataTypes - Sequelize data types
 * @returns {Model} Movie model
 */
const Movie = sequelize.define('Movie', {
  /**
   * Primary key for movie identification
   * @type {string} UUID format
   */
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique identifier for the movie',
  },

  /**
   * Movie title/name
   * @type {string} Required field, max 255 characters
   */
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Movie title is required',
      },
      len: {
        args: [1, 255],
        msg: 'Movie title must be between 1 and 255 characters',
      },
    },
    comment: 'Official title of the movie',
  },

  /**
   * Movie description/plot summary
   * @type {text} Optional field for movie details
   */
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 2000],
        msg: 'Description must not exceed 2000 characters',
      },
    },
    comment: 'Brief description or plot summary of the movie',
  },

  /**
   * Movie genre/category
   * @type {string} Movie category
   */
  genre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Movie genre is required',
      },
      isIn: {
        args: [['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Adventure', 'Animation', 'Family']],
        msg: 'Invalid genre selected',
      },
    },
    comment: 'Category/genre of the movie (Action, Comedy, Drama, etc.)',
  },

  /**
   * Movie duration in minutes
   * @type {integer} Runtime in minutes
   */
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: 30,
        msg: 'Movie duration must be at least 30 minutes',
      },
      max: {
        args: 300,
        msg: 'Movie duration cannot exceed 300 minutes (5 hours)',
      },
    },
    comment: 'Duration of the movie in minutes',
  },

  /**
   * Movie rating (1-10 scale)
   * @type {decimal} Average rating from users
   */
  rating: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: true,
    defaultValue: null,
    validate: {
      min: {
        args: 1.0,
        msg: 'Rating must be at least 1.0',
      },
      max: {
        args: 10.0,
        msg: 'Rating cannot exceed 10.0',
      },
    },
    comment: 'Average user rating on a scale of 1.0 to 10.0',
  },

  /**
   * Movie poster image URL
   * @type {string} URL to movie poster image
   */
  poster_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Poster URL must be a valid URL',
      },
    },
    comment: 'URL to the movie poster image',
  },

  /**
   * Movie release date
   * @type {date} Official release date
   */
  release_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Release date must be a valid date',
      },
      isAfter: {
        args: '1900-01-01',
        msg: 'Release date must be after 1900',
      },
    },
    comment: 'Official release date of the movie',
  },

  /**
   * Primary language of the movie
   * @type {string} Language code or name
   */
  language: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'English',
    validate: {
      notEmpty: {
        msg: 'Movie language is required',
      },
      isIn: {
        args: [['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi']],
        msg: 'Invalid language selected',
      },
    },
    comment: 'Primary language of the movie',
  },

}, {
  // Model options
  tableName: 'movies',
  timestamps: true, // Automatically adds createdAt and updatedAt
  underscored: true, // Use snake_case for column names
  
  // Indexes for better query performance
  indexes: [
    {
      fields: ['title'],
      name: 'idx_movies_title',
    },
    {
      fields: ['genre'],
      name: 'idx_movies_genre',
    },
    {
      fields: ['release_date'],
      name: 'idx_movies_release_date',
    },
    {
      fields: ['rating'],
      name: 'idx_movies_rating',
    },
  ],

  // Model-level validations
  validate: {
    /**
     * Custom validation to ensure release date is not in distant future
     */
    releaseDateNotTooFuture() {
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 5);
      
      if (this.release_date > maxFutureDate) {
        throw new Error('Release date cannot be more than 5 years in the future');
      }
    },
  },
});

/**
 * Define Model Associations
 * 
 * @description Establishes relationships between Movie and other models
 * @param {Object} models - All defined models
 */
Movie.associate = (models) => {
  // Movie has many Shows
  Movie.hasMany(models.Show, {
    foreignKey: 'movie_id',
    as: 'shows',
    onDelete: 'CASCADE', // Delete shows when movie is deleted
    onUpdate: 'CASCADE',
  });
};

/**
 * Instance Methods
 */
Movie.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Add computed fields
  values.duration_formatted = `${values.duration} mins`;
  values.rating_formatted = values.rating ? `${values.rating}/10` : 'Not Rated';
  
  return values;
};

/**
 * Class Methods for common queries
 */

/**
 * Find movies by genre
 * @param {string} genre - Genre to search for
 * @returns {Promise<Array>} Movies in the specified genre
 */
Movie.findByGenre = function(genre) {
  return this.findAll({
    where: { genre },
    order: [['rating', 'DESC'], ['title', 'ASC']],
  });
};

/**
 * Search movies by title
 * @param {string} searchTerm - Title search term
 * @returns {Promise<Array>} Movies matching search term
 */
Movie.searchByTitle = function(searchTerm) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      title: {
        [Op.iLike]: `%${searchTerm}%`, // Case-insensitive search
      },
    },
    order: [['title', 'ASC']],
  });
};

/**
 * Get currently showing movies (released and have shows)
 * @returns {Promise<Array>} Currently showing movies with shows
 */
Movie.getCurrentlyShowing = function() {
  const { Op } = require('sequelize');
  const today = new Date();
  
  return this.findAll({
    where: {
      release_date: {
        [Op.lte]: today, // Released on or before today
      },
    },
    include: [{
      model: require('./Show'),
      as: 'shows',
      where: {
        show_date: {
          [Op.gte]: today, // Has shows today or in future
        },
      },
      required: true, // Inner join - only movies with shows
    }],
    order: [['rating', 'DESC'], ['title', 'ASC']],
  });
};

module.exports = Movie;

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. DATA VALIDATION:
 *    - Current: Basic Sequelize validators
 *    - Issue: Limited custom validation rules
 *    - Improvement: More comprehensive validation, custom validators
 * 
 * 2. SEARCH OPTIMIZATION:
 *    - Current: Simple LIKE queries for search
 *    - Issue: Not optimized for large datasets
 *    - Improvement: Full-text search, Elasticsearch integration
 * 
 * 3. IMAGE HANDLING:
 *    - Current: Simple URL storage for poster
 *    - Issue: No image validation, broken link handling
 *    - Improvement: Image upload service, CDN integration
 * 
 * 4. RATING SYSTEM:
 *    - Current: Simple decimal rating storage
 *    - Issue: No rating history, review system
 *    - Improvement: Separate reviews table, weighted ratings
 * 
 * 5. CACHING STRATEGY:
 *    - Current: No caching implemented
 *    - Issue: Database queries on every request
 *    - Improvement: Redis caching for frequently accessed movies
 * 
 * 6. SOFT DELETES:
 *    - Current: Hard delete (CASCADE)
 *    - Issue: Data loss when movie is deleted
 *    - Improvement: Soft delete with paranoid option
 */