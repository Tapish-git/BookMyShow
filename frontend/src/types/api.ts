/**
 * API Types and Interfaces
 * 
 * TypeScript type definitions for API requests and responses.
 * Ensures type safety across the application for backend communication.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

// Pagination interface
export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Movie related types
export interface Movie {
  id: string;
  title: string;
  description?: string;
  genre: string;
  duration: number;
  durationFormatted: string;
  rating?: number;
  ratingFormatted: string;
  posterUrl?: string;
  releaseDate: string;
  language: string;
  createdAt: string;
}

export interface MovieWithShows extends Movie {
  shows: {
    byDate: Record<string, ShowInfo[]>;
    totalShows: number;
    availableDates: string[];
  };
}

export interface MoviesResponse {
  movies: Movie[];
  pagination: Pagination;
  filters: {
    genre?: string;
    language?: string;
    search?: string;
  };
}

// Show related types
export interface Show {
  id: string;
  showDate: string;
  showTime: string;
  showDateTime: string;
  hallName: string;
  totalSeats: number;
  availableSeats: number;
  price: number;
  priceFormatted: string;
  status: 'upcoming' | 'live' | 'completed' | 'sold_out';
  movie: Movie;
}

export interface ShowInfo {
  id: string;
  time: string;
  hall: string;
  totalSeats: number;
  availableSeats: number;
  price: number;
  priceFormatted: string;
  status: 'available' | 'sold_out';
}

export interface ShowDetails extends Omit<Show, 'movie'> {
  timeUntilShow: {
    hours: number;
    minutes: number;
    formatted: string;
  };
  movie: Movie;
  seating: SeatingSummary;
  booking: {
    canBook: boolean;
    minBookingTime: string;
    maxSeatsPerBooking: number;
  };
}

export interface ShowsResponse {
  shows: Show[];
  pagination: Pagination;
  filters: {
    movieId?: string;
    date?: string;
    hallName?: string;
    availableOnly: boolean;
  };
}

// Seat related types
export interface Seat {
  id: string;
  seatNumber: number;
  seatType: 'Regular' | 'Premium' | 'VIP' | 'Recliner';
  seatIdentifier: string;
  displayName: string;
  isAvailable: boolean;
  reservationStatus: 'AVAILABLE' | 'BLOCKED' | 'BOOKED';
  row: string;
  number: number;
}

export interface SeatLayout {
  [row: string]: Seat[];
}

export interface SeatingSummary {
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  blockedSeats: number;
  occupancyPercentage: string;
}

export interface SeatLayoutResponse {
  show: {
    id: string;
    movieTitle: string;
    showDate: string;
    showTime: string;
    hallName: string;
    price: number;
  };
  seatLayout: SeatLayout;
  statistics: SeatingSummary;
  legend: {
    available: string;
    blocked: string;
    booked: string;
  };
}

// Seat blocking types
export interface BlockSeatsRequest {
  showId: string;
  seatIds: string[];
  blockDuration?: number;
}

export interface BlockedSeatInfo {
  seatId: string;
  reservationId: string;
  seatIdentifier: string;
  expiresAt: string;
  expiresIn: number;
}

export interface BlockSeatsResponse {
  blockedSeats: BlockedSeatInfo[];
  blockInfo: {
    durationMinutes: number;
    expiresAt: string;
    autoReleaseWarning: string;
  };
  showInfo: {
    id: string;
    availableSeats: number;
    price: number;
    totalAmount: string;
  };
}

// Booking related types
export interface UserDetails {
  name: string;
  email: string;
  phone?: string;
}

export interface CreateBookingRequest {
  showId: string;
  seatIds: string[];
  userDetails: UserDetails;
}

export interface BookingSeat {
  seatId: string;
  seatIdentifier: string;
  seatType: string;
  row: string;
  number: number;
}

export interface Booking {
  id: string;
  reference: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'REFUNDED' | 'NO_SHOW';
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  totalSeats: number;
  totalAmount: number;
  bookingDate: string;
}

export interface BookingDetails extends Booking {
  show: {
    id: string;
    movieTitle: string;
    showDate: string;
    showTime: string;
    hallName: string;
  };
  seats: BookingSeat[];
  ticket: {
    qrCode: string;
    isValid: boolean;
  };
  cancellation: {
    canCancel: boolean;
    reason: string;
    policy: string;
  };
}

export interface CreateBookingResponse {
  booking: {
    id: string;
    reference: string;
    status: string;
    createdAt: string;
  };
  ticket: {
    bookingReference: string;
    customerName: string;
    customerEmail: string;
    movieTitle: string;
    showDate: string;
    showTime: string;
    hallName: string;
    seats: BookingSeat[];
    totalSeats: number;
    totalAmount: number;
    bookingDate: string;
    qrCode: string;
  };
  show: {
    id: string;
    movieTitle: string;
    date: string;
    time: string;
    hall: string;
    price: number;
  };
}

export interface UserBookingsResponse {
  bookings: Array<{
    id: string;
    reference: string;
    status: string;
    movieTitle: string;
    showDate: string;
    showTime: string;
    hallName: string;
    totalSeats: number;
    totalAmount: number;
    bookingDate: string;
    canCancel: boolean;
  }>;
  userEmail: string;
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    hasMore: boolean;
  };
}

// Search and filter types
export interface MovieFilters {
  genre?: string;
  language?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ShowFilters {
  movieId?: string;
  date?: string;
  hallName?: string;
  availableOnly?: boolean;
  page?: number;
  limit?: number;
}

// Health check types
export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  connection: 'active' | 'failed';
  models?: {
    movies: number;
    shows: number;
    seats: number;
    bookings: number;
    seat_reservations: number;
  };
  timestamp: string;
}

// Error types for better error handling
export type ApiErrorCode = 
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BUSINESS_LOGIC_ERROR'
  | 'UNAUTHORIZED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'DATABASE_ERROR'
  | 'SERVICE_UNAVAILABLE';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  type: string;
}

// Query parameters for API calls
export interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

// Generic list response
export interface ListResponse<T> {
  items: T[];
  pagination: Pagination;
  filters?: Record<string, any>;
}

// Booking statistics (for admin dashboard)
export interface BookingStats {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  bookings: {
    totalBookings: number;
    totalSeats: number;
    totalRevenue: number;
    averageBookingValue: number;
  };
  reservations: {
    total: number;
    blocked: number;
    confirmed: number;
    expired: number;
    cancelled: number;
  };
  metrics: {
    conversionRate: string;
    blockExpiryRate: string;
  };
}