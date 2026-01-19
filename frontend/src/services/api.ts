/**
 * API Service
 * 
 * Central HTTP client for communicating with the BookMyShow backend API.
 * Uses Axios for HTTP requests with interceptors for error handling and logging.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import {
  ApiResponse,
  ApiError,
  MoviesResponse,
  MovieWithShows,
  ShowsResponse,
  ShowDetails,
  SeatLayoutResponse,
  BlockSeatsRequest,
  BlockSeatsResponse,
  CreateBookingRequest,
  CreateBookingResponse,
  BookingDetails,
  UserBookingsResponse,
  HealthCheck,
  BookingStats,
  MovieFilters,
  ShowFilters,
  QueryParams
} from '@/types/api';

// API Configuration
const MODE = import.meta.env.MODE;
const API_BASE_URL = MODE === 'production'
  ? '/api/v1' // Use Vite proxy to local backend in development
  : (import.meta.env.VITE_API_BASE_URL || "https://bookmyshow-backend-gwc2.onrender.com/api/v1");
console.log("API BASE URL:", API_BASE_URL, "MODE:", MODE);
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Create Axios instance with default configuration
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // Include cookies for session management
  });

  // Request interceptor for logging and auth
  client.interceptors.request.use(
    (config) => {
      // Log outgoing requests in development
      if (import.meta.env.MODE === 'development') {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
        });
      }

      return config;
    },
    (error) => {
      console.error('❌ API Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log successful responses in development
      if (import.meta.env.MODE === 'development') {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          status: response.status,
          data: response.data,
        });
      }

      return response;
    },
    (error: AxiosError) => {
      // Enhanced error logging
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // Transform API errors to consistent format
      if (error.response?.data) {
        const apiError = error.response.data as ApiError;
        return Promise.reject({
          ...apiError,
          status: error.response.status,
        });
      }

      // Handle network errors
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        return Promise.reject({
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network connection failed. Please check your internet connection.',
            timestamp: new Date().toISOString(),
          },
          status: 0,
        });
      }

      // Handle timeout errors
      if (error.code === 'ECONNABORTED') {
        return Promise.reject({
          success: false,
          error: {
            code: 'TIMEOUT_ERROR',
            message: 'Request timeout. Please try again.',
            timestamp: new Date().toISOString(),
          },
          status: 408,
        });
      }

      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * API client instance
 */
const apiClient = createApiClient();

/**
 * Helper function to build query string from parameters
 */
const buildQueryParams = (params: QueryParams): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Movie API endpoints
 */
export const movieApi = {
  /**
   * Get all movies with optional filtering
   */
  getMovies: async (filters: MovieFilters = {}): Promise<MoviesResponse> => {
    const queryParams = buildQueryParams(filters as unknown as QueryParams);
    const response = await apiClient.get<ApiResponse<any>>(`/movies${queryParams}`);
    const raw = response.data.data as any;
    const movies = (raw.movies || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      genre: m.genre,
      duration: m.duration,
      durationFormatted: `${m.duration} mins`,
      rating: m.rating,
      ratingFormatted: m.rating ? `${m.rating}/10` : 'Not Rated',
      posterUrl: m.poster_url || m.posterUrl,
      releaseDate: m.release_date || m.releaseDate,
      language: m.language,
      createdAt: m.created_at || m.createdAt,
    }));
    return {
      movies,
      pagination: raw.pagination,
      filters: raw.filters,
    } as MoviesResponse;
  },

  /**
   * Get movie by ID with show information
   */
  getMovieById: async (id: string): Promise<MovieWithShows> => {
    const response = await apiClient.get<ApiResponse<{ movie: MovieWithShows }>>(`/movies/${id}`);
    return response.data.data.movie;
  },

  /**
   * Search movies by title
   */
  searchMovies: async (query: string, page = 1, limit = 10) => {
    const queryParams = buildQueryParams({ q: query, page, limit } as unknown as QueryParams);
    const response = await apiClient.get<ApiResponse<MoviesResponse>>(`/movies/search${queryParams}`);
    return response.data.data;
  },

  /**
   * Get currently showing movies
   */
  getNowShowingMovies: async (page = 1, limit = 20) => {
    const queryParams = buildQueryParams({ page, limit } as unknown as QueryParams);
    const response = await apiClient.get<ApiResponse<MoviesResponse>>(`/movies/now-showing${queryParams}`);
    return response.data.data;
  },

  /**
   * Get movies by genre
   */
  getMoviesByGenre: async (genre: string, page = 1, limit = 12) => {
    const queryParams = buildQueryParams({ page, limit } as unknown as QueryParams);
    const response = await apiClient.get<ApiResponse<MoviesResponse>>(`/movies/genre/${genre}${queryParams}`);
    return response.data.data;
  },
};

/**
 * Show API endpoints
 */
export const showApi = {
  /**
   * Get all shows with optional filtering
   */
  getShows: async (filters: ShowFilters = {}): Promise<ShowsResponse> => {
    const queryParams = buildQueryParams(filters as unknown as QueryParams);
    const response = await apiClient.get<ApiResponse<ShowsResponse>>(`/shows${queryParams}`);
    return response.data.data;
  },

  /**
   * Get show by ID
   */
  getShowById: async (id: string): Promise<ShowDetails> => {
    const response = await apiClient.get<ApiResponse<any>>(`/shows/${id}`);
    const raw = response.data.data as any;
    const s = raw.show;
    const flattened: ShowDetails = {
      id: s.id,
      showDate: s.showDate || s.show_date,
      showTime: s.showTime || s.show_time,
      showDateTime: s.showDateTime || `${s.show_date}T${s.show_time}`,
      hallName: s.hallName || s.hall_name,
      totalSeats: raw.seating?.totalSeats ?? s.totalSeats ?? 0,
      availableSeats: raw.seating?.availableSeats ?? s.availableSeats ?? 0,
      price: Number(s.price),
      priceFormatted: s.priceFormatted || `₹${s.price}`,
      status: s.status,
      timeUntilShow: s.timeUntilShow,
      movie: raw.movie,
      seating: raw.seating,
      booking: raw.booking,
    };
    return flattened;
  },

  /**
   * Get shows by movie ID
   */
  getShowsByMovie: async (movieId: string, date?: string) => {
    const queryParams = buildQueryParams({ date } as unknown as QueryParams);
    const response = await apiClient.get<ApiResponse<any>>(`/shows/movie/${movieId}${queryParams}`);
    return response.data.data;
  },

  /**
   * Get shows in date range
   */
  getShowsByDateRange: async (startDate: string, endDate: string, movieId?: string) => {
    const queryParams = buildQueryParams({ startDate, endDate, movieId } as unknown as QueryParams);
    const response = await apiClient.get<ApiResponse<any>>(`/shows/date-range${queryParams}`);
    return response.data.data;
  },
};

/**
 * Seat API endpoints
 */
export const seatApi = {
  /**
   * Get seat layout for a show
   */
  getSeatLayout: async (showId: string, availableOnly = false): Promise<SeatLayoutResponse> => {
    const queryParams = buildQueryParams({ availableOnly } as unknown as QueryParams);
    const response = await apiClient.get<ApiResponse<SeatLayoutResponse>>(`/seats/layout/${showId}${queryParams}`);
    return response.data.data;
  },

  /**
   * Get available seats for a show
   */
  getAvailableSeats: async (showId: string, count?: number) => {
    const queryParams = buildQueryParams({ count } as unknown as QueryParams);
    const response = await apiClient.get<ApiResponse<any>>(`/seats/available/${showId}${queryParams}`);
    return response.data.data;
  },

  /**
   * Block selected seats
   */
  blockSeats: async (request: BlockSeatsRequest): Promise<BlockSeatsResponse> => {
    const response = await apiClient.post<ApiResponse<BlockSeatsResponse>>('/seats/block', request);
    return response.data.data;
  },

  /**
   * Release blocked seats
   */
  releaseSeats: async (seatIds: string[]) => {
    const response = await apiClient.post<ApiResponse<any>>('/seats/release', { seatIds });
    return response.data.data;
  },

  /**
   * Extend seat block duration
   */
  extendSeatBlock: async (seatIds: string[], additionalMinutes = 5) => {
    const response = await apiClient.patch<ApiResponse<any>>('/seats/extend-block', {
      seatIds,
      additionalMinutes,
    });
    return response.data.data;
  },
};

/**
 * Booking API endpoints
 */
export const bookingApi = {
  /**
   * Create a new booking
   */
  createBooking: async (request: CreateBookingRequest): Promise<CreateBookingResponse> => {
    const response = await apiClient.post<ApiResponse<CreateBookingResponse>>('/bookings', request);
    return response.data.data;
  },

  /**
   * Get booking by reference
   */
  getBookingByReference: async (reference: string): Promise<BookingDetails> => {
    const response = await apiClient.get<ApiResponse<BookingDetails>>(`/bookings/${reference}`);
    return response.data.data;
  },

  /**
   * Get user bookings by email
   */
  getUserBookings: async (email: string, page = 1, limit = 10): Promise<UserBookingsResponse> => {
    const queryParams = buildQueryParams({ page, limit } as unknown as QueryParams);
    const response = await apiClient.get<ApiResponse<UserBookingsResponse>>(`/bookings/user/${email}${queryParams}`);
    return response.data.data;
  },

  /**
   * Cancel a booking
   */
  cancelBooking: async (reference: string, reason?: string) => {
    const response = await apiClient.delete<ApiResponse<any>>(`/bookings/${reference}`, {
      data: { reason },
    });
    return response.data.data;
  },

  /**
   * Get booking statistics
   */
  getBookingStats: async (startDate?: string, endDate?: string): Promise<BookingStats> => {
    const queryParams = buildQueryParams({ startDate, endDate } as unknown as QueryParams);
    const response = await apiClient.get<ApiResponse<BookingStats>>(`/bookings/stats${queryParams}`);
    return response.data.data;
  },

  /**
   * Get digital ticket
   */
  getDigitalTicket: async (reference: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/bookings/${reference}/ticket`);
    return response.data.data;
  },
};

/**
 * Health check API
 */
export const healthApi = {
  /**
   * Basic health check
   */
  getHealthStatus: async (): Promise<HealthCheck> => {
    const response = await apiClient.get<HealthCheck>('/health');
    return response.data;
  },

  /**
   * Detailed health check
   */
  getDetailedHealth: async (): Promise<HealthCheck> => {
    const response = await apiClient.get<HealthCheck>('/health/detailed');
    return response.data;
  },
};

/**
 * Generic API utility functions
 */
export const apiUtils = {
  /**
   * Check if error is a specific API error code
   */
  isApiError: (error: any, code?: string): boolean => {
    return error?.error?.code === code || (code === undefined && !!error?.error?.code);
  },

  /**
   * Get error message from API error
   */
  getErrorMessage: (error: any): string => {
    if (apiUtils.isApiError(error)) {
      return error.error.message;
    }

    if (error?.message) {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  },

  /**
   * Check if error is a network error
   */
  isNetworkError: (error: any): boolean => {
    return error?.error?.code === 'NETWORK_ERROR' || error?.status === 0;
  },

  /**
   * Check if error is a validation error
   */
  isValidationError: (error: any): boolean => {
    return error?.error?.code === 'VALIDATION_ERROR';
  },

  /**
   * Retry API call with exponential backoff
   */
  retryWithBackoff: async <T>(
    apiCall: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 1000
  ): Promise<T> => {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;

        // Don't retry on validation errors or client errors
        if (apiUtils.isValidationError(error) || ((error as any)?.status >= 400 && (error as any)?.status < 500)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait with exponential backoff
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));

        console.log(`🔄 Retrying API call (attempt ${attempt + 2}/${maxRetries + 1}) after ${delay}ms`);
      }
    }

    throw lastError;
  },
};

// Default export
export default {
  movieApi,
  showApi,
  seatApi,
  bookingApi,
  healthApi,
  apiUtils,
};