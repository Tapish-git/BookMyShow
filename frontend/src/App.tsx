/**
 * Main Application Component
 * 
 * Root component that sets up routing, theme, and global providers.
 * Handles application-wide state management and error boundaries.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';

// Components
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import ErrorFallback from './components/Common/ErrorFallback';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Pages
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailsPage from './pages/MovieDetailsPage';
import ShowDetailsPage from './pages/ShowDetailsPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import BookingPage from './pages/BookingPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import MyBookingsPage from './pages/MyBookingsPage';
import NotFoundPage from './pages/NotFoundPage';

// Contexts
import { BookingProvider } from './contexts/BookingContext';

/**
 * Create React Query client with configuration
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry once for server errors
        return failureCount < 1;
      },
    },
  },
});

/**
 * Create Material-UI theme with BookMyShow-inspired colors
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Blue
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f50057', // Pink/Red
      light: '#ff5983',
      dark: '#c51162',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1976d2',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

/**
 * Error fallback component for the error boundary
 */
const AppErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary,
}) => (
  <ErrorFallback 
    error={error}
    resetErrorBoundary={resetErrorBoundary}
    title="Application Error"
    description="Something went wrong with the application. Please try refreshing the page."
  />
);

/**
 * Main App component
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary
      FallbackComponent={AppErrorFallback}
      onError={(error, errorInfo) => {
        // Log error to console in development
        console.error('Application Error:', error, errorInfo);
        
        // In production, you would send this to an error tracking service
        // Example: Sentry.captureException(error);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BookingProvider>
            <Router>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '100vh',
                }}
              >
                {/* Header */}
                <Header />
                
                {/* Main Content */}
                <Box
                  component="main"
                  sx={{
                    flex: 1,
                    backgroundColor: 'background.default',
                  }}
                >
                  <React.Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      {/* Home */}
                      <Route path="/" element={<HomePage />} />
                      
                      {/* Movies */}
                      <Route path="/movies" element={<MoviesPage />} />
                      <Route path="/movies/:id" element={<MovieDetailsPage />} />
                      
                      {/* Shows */}
                      <Route path="/shows/:id" element={<ShowDetailsPage />} />
                      
                      {/* Booking Flow */}
                      <Route path="/shows/:showId/seats" element={<SeatSelectionPage />} />
                      <Route path="/booking" element={<BookingPage />} />
                      <Route path="/booking/confirmation/:reference" element={<BookingConfirmationPage />} />
                      
                      {/* User Bookings */}
                      <Route path="/my-bookings" element={<MyBookingsPage />} />
                      
                      {/* 404 */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </React.Suspense>
                </Box>
                
                {/* Footer */}
                <Footer />
              </Box>
            </Router>
          </BookingProvider>
          
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                borderRadius: '8px',
                background: '#333',
                color: '#fff',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: '#4caf50',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#d32f2f',
                  secondary: '#fff',
                },
              },
            }}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

/**
 * LEARNING NOTES & POTENTIAL IMPROVEMENTS:
 * 
 * 1. CODE SPLITTING:
 *    - Current: Basic React.Suspense for route components
 *    - Issue: All routes loaded initially
 *    - Improvement: Lazy loading with React.lazy() for better performance
 * 
 * 2. STATE MANAGEMENT:
 *    - Current: Context API + React Query
 *    - Issue: Might become complex with more features
 *    - Improvement: Consider Zustand or Redux Toolkit for complex state
 * 
 * 3. ERROR HANDLING:
 *    - Current: Basic error boundary
 *    - Issue: Limited error recovery options
 *    - Improvement: More granular error boundaries, error reporting service
 * 
 * 4. THEME CUSTOMIZATION:
 *    - Current: Static Material-UI theme
 *    - Issue: No dark mode support
 *    - Improvement: Dynamic theme switching, user preferences
 * 
 * 5. PERFORMANCE MONITORING:
 *    - Current: No performance tracking
 *    - Issue: No insights into app performance
 *    - Improvement: Web vitals tracking, performance monitoring
 * 
 * 6. ACCESSIBILITY:
 *    - Current: Basic Material-UI accessibility
 *    - Issue: Limited custom accessibility features
 *    - Improvement: Enhanced focus management, screen reader support
 */