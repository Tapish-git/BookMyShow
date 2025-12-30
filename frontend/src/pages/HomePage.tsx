import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Container, 
    Grid, 
    Card, 
    CardMedia, 
    CardContent, 
    Button,
    Chip,
    Stack,
    IconButton,
    alpha
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
    Star, 
    ChevronLeft, 
    ChevronRight,
    LocalActivity,
    MovieFilter,
    EventSeat
} from '@mui/icons-material';
import api from '../services/api';

interface Movie {
    id: string;
    title: string;
    description: string;
    duration: number;
    language: string;
    genre: string;
    rating: number;
    release_date: string;
    poster_url: string;
    trailer_url: string;
}

const HomePage: React.FC = () => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [currentBanner, setCurrentBanner] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMovies();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % Math.min(movies.length, 3));
        }, 5000);
        return () => clearInterval(timer);
    }, [movies.length]);

    /**
     * Fetches the list of movies from the API and updates the component state.
     * Handles multiple response formats to ensure compatibility with different API response structures.
     * Sets loading state to false upon completion, regardless of success or failure.
     * 
     * @async
     * @function fetchMovies
     * @returns {Promise<void>}
     * @throws {Error} Logs any errors that occur during the API call and sets movies to an empty array.
     * 
     * @remarks
     * - If the response is an array directly, it uses the response as-is
     * - If the response is an object with a data property that is an array, it extracts response.data
     * - If neither condition is met, defaults to an empty array
     * - Errors are caught and logged to console, preventing component crashes
     */
    const fetchMovies = async () => {
        try {
            const response = await api.movieApi.getMovies();
            const mappedMovies = (response.movies || []).map((movie: any) => ({
                id: movie.id,
                title: movie.title,
                description: movie.description,
                duration: movie.duration,
                language: movie.language,
                genre: movie.genre,
                rating: movie.rating,
                release_date: movie.release_date || '',
                poster_url: movie.poster_url || '',
                trailer_url: movie.trailer_url || '',
            }));
            setMovies(mappedMovies);
        } catch (error) {
            console.error('Error fetching movies:', error);
            setMovies([]);
        }
    };

    const handlePrevBanner = () => {
        setCurrentBanner((prev) => (prev - 1 + Math.min(movies.length, 3)) % Math.min(movies.length, 3));
    };

    const handleNextBanner = () => {
        setCurrentBanner((prev) => (prev + 1) % Math.min(movies.length, 3));
    };

    const bannerMovies = movies.slice(0, 3);
    
    // Movie poster mapping - comprehensive list with IMDb posters
    const moviePosters: { [key: string]: { poster: string; banner: string } } = {
        // Case-insensitive lookup helper
        'avengers endgame': {
            poster: 'https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_SX300.jpg',
            banner: 'https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_.jpg'
        },
        'the batman': {
            poster: 'https://m.media-amazon.com/images/M/MV5BM2MyNTAwZGEtNTAxNC00ODVjLTgzZjUtYmU0YjAzNmQyZDEwXkEyXkFqcGdeQXVyNDc2NTg3NzA@._V1_SX300.jpg',
            banner: 'https://m.media-amazon.com/images/M/MV5BM2MyNTAwZGEtNTAxNC00ODVjLTgzZjUtYmU0YjAzNmQyZDEwXkEyXkFqcGdeQXVyNDc2NTg3NzA@._V1_.jpg'
        },
        'spider-man no way home': {
            poster: 'https://m.media-amazon.com/images/M/MV5BZWMyYzFjYTYtNTRjYi00OGExLWE2YzgtOGRmYjAxZTU3NzBiXkEyXkFqcGdeQXVyMzQ0MzA0NTM@._V1_SX300.jpg',
            banner: 'https://m.media-amazon.com/images/M/MV5BZWMyYzFjYTYtNTRjYi00OGExLWE2YzgtOGRmYjAxZTU3NzBiXkEyXkFqcGdeQXVyMzQ0MzA0NTM@._V1_.jpg'
        },
        'rrr': {
            poster: 'https://m.media-amazon.com/images/M/MV5BODUwNDNjYzctODUxNy00ZTA2LWIyYTEtMDc5Y2E5ZjBmNTMzXkEyXkFqcGdeQXVyODE5NzE3OTE@._V1_SX300.jpg',
            banner: 'https://m.media-amazon.com/images/M/MV5BODUwNDNjYzctODUxNy00ZTA2LWIyYTEtMDc5Y2E5ZjBmNTMzXkEyXkFqcGdeQXVyODE5NzE3OTE@._V1_.jpg'
        },
        'dangal': {
            poster: 'https://m.media-amazon.com/images/M/MV5BMTQ4MzQzMzM2Nl5BMl5BanBnXkFtZTgwMTQ1NzU3MDI@._V1_SX300.jpg',
            banner: 'https://m.media-amazon.com/images/M/MV5BMTQ4MzQzMzM2Nl5BMl5BanBnXkFtZTgwMTQ1NzU3MDI@._V1_.jpg'
        },
        '3 idiots': {
            poster: 'https://m.media-amazon.com/images/M/MV5BNTkyOGVjMGEtNmQzZi00NzFlLTlhOWQtODYyMDc2ZGJmYzFhXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg',
            banner: 'https://m.media-amazon.com/images/M/MV5BNTkyOGVjMGEtNmQzZi00NzFlLTlhOWQtODYyMDc2ZGJmYzFhXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg'
        },
        'bahubali 2': {
            poster: 'https://m.media-amazon.com/images/M/MV5BYTMxMmQ0ZDgtYzJhZC00NTA4LWFiMzYtMWRkYTZiNTdhNmI0XkEyXkFqcGdeQXVyODE5NzE3OTE@._V1_SX300.jpg',
            banner: 'https://m.media-amazon.com/images/M/MV5BYTMxMmQ0ZDgtYzJhZC00NTA4LWFiMzYtMWRkYTZiNTdhNmI0XkEyXkFqcGdeQXVyODE5NzE3OTE@._V1_.jpg'
        },
        'zindagi na milegi dobara': {
            poster: 'https://m.media-amazon.com/images/M/MV5BMTQxMzI5MTQ0Ml5BMl5BanBnXkFtZTcwNTc1MDQ0NQ@@._V1_SX300.jpg',
            banner: 'https://m.media-amazon.com/images/M/MV5BMTQxMzI5MTQ0Ml5BMl5BanBnXkFtZTcwNTc1MDQ0NQ@@._V1_.jpg'
        },
        'the dark knight': {
            poster: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg',
            banner: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg'
        },
        'inception': {
            poster: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg',
            banner: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg'
        },
        'the matrix': {
            poster: 'https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg',
            banner: 'https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg'
        },
        'interstellar': {
            poster: 'https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg',
            banner: 'https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg'
        }
    };
    
    // Helper to resolve poster URL with real movie posters
    const resolvePoster = (url?: string, movieTitle?: string) => {
        // Try to find poster by movie title (case-insensitive, remove special chars)
        if (movieTitle) {
            const normalizedTitle = movieTitle.toLowerCase().replace(/[:\-]/g, ' ').replace(/\s+/g, ' ').trim();
            if (moviePosters[normalizedTitle]) {
                return moviePosters[normalizedTitle].poster;
            }
        }
        // If URL is valid and not a placeholder, use it
        if (url && !url.includes('placeholder') && !url.includes('example.com')) {
            return url;
        }
        // Fallback to a solid color gradient
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23667eea;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23764ba2;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='600' fill='url(%23grad)'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='24' fill='white' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(movieTitle || 'Movie')}%3C/text%3E%3C/svg%3E`;
    };
    
    // Helper for banner images (wider format)
    const resolveBannerImage = (url?: string, movieTitle?: string) => {
        // Try to find banner by movie title (case-insensitive, remove special chars)
        if (movieTitle) {
            const normalizedTitle = movieTitle.toLowerCase().replace(/[:\-]/g, ' ').replace(/\s+/g, ' ').trim();
            if (moviePosters[normalizedTitle]) {
                return moviePosters[normalizedTitle].banner;
            }
        }
        // If URL is valid and not a placeholder, use it
        if (url && !url.includes('placeholder') && !url.includes('example.com')) {
            return url;
        }
        // Fallback to a solid color gradient
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='500'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23667eea;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23764ba2;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='500' fill='url(%23grad)'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='48' fill='white' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(movieTitle || 'Movie')}%3C/text%3E%3C/svg%3E`;
    };
    
    const currentMovie = bannerMovies[currentBanner];

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Hero Banner */}
            {currentMovie && (
                <Box
                    sx={{
                        position: 'relative',
                        height: { xs: '400px', md: '500px' },
                        background: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${resolveBannerImage(currentMovie.poster_url, currentMovie.title)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'flex-end',
                        overflow: 'hidden',
                    }}
                >
                    <Container sx={{ pb: 6, zIndex: 1 }}>
                        <Typography
                            variant="h2"
                            sx={{
                                color: 'white',
                                fontWeight: 700,
                                mb: 2,
                                fontSize: { xs: '2rem', md: '3.5rem' },
                            }}
                        >
                            {currentMovie.title}
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                            <Chip
                                icon={<Star sx={{ color: '#ffc107 !important' }} />}
                                label={`${currentMovie.rating}/10`}
                                sx={{ bgcolor: alpha('#fff', 0.2), color: 'white', fontWeight: 600 }}
                            />
                            <Chip
                                label={currentMovie.genre}
                                sx={{ bgcolor: alpha('#fff', 0.2), color: 'white' }}
                            />
                            <Chip
                                label={`${currentMovie.duration} mins`}
                                sx={{ bgcolor: alpha('#fff', 0.2), color: 'white' }}
                            />
                        </Stack>
                        <Typography
                            variant="body1"
                            sx={{
                                color: 'white',
                                mb: 3,
                                maxWidth: '600px',
                                display: { xs: 'none', md: 'block' },
                            }}
                        >
                            {currentMovie.description}
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<LocalActivity />}
                            onClick={() => navigate(`/movies/${currentMovie.id}`)}
                            sx={{
                                bgcolor: '#f84464',
                                '&:hover': { bgcolor: '#dc3558' },
                                borderRadius: 2,
                                px: 4,
                                py: 1.5,
                                fontWeight: 600,
                                textTransform: 'none',
                                fontSize: '1.1rem',
                            }}
                        >
                            Book Tickets
                        </Button>
                    </Container>

                    {/* Banner Navigation */}
                    <IconButton
                        onClick={handlePrevBanner}
                        sx={{
                            position: 'absolute',
                            left: 20,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: alpha('#fff', 0.2),
                            '&:hover': { bgcolor: alpha('#fff', 0.3) },
                            color: 'white',
                        }}
                    >
                        <ChevronLeft />
                    </IconButton>
                    <IconButton
                        onClick={handleNextBanner}
                        sx={{
                            position: 'absolute',
                            right: 20,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: alpha('#fff', 0.2),
                            '&:hover': { bgcolor: alpha('#fff', 0.3) },
                            color: 'white',
                        }}
                    >
                        <ChevronRight />
                    </IconButton>

                    {/* Banner Indicators */}
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            position: 'absolute',
                            bottom: 20,
                            left: '50%',
                            transform: 'translateX(-50%)',
                        }}
                    >
                        {bannerMovies.map((_, index) => (
                            <Box
                                key={index}
                                sx={{
                                    width: currentBanner === index ? 30 : 10,
                                    height: 10,
                                    borderRadius: 5,
                                    bgcolor: currentBanner === index ? '#f84464' : alpha('#fff', 0.5),
                                    transition: 'all 0.3s',
                                    cursor: 'pointer',
                                }}
                                onClick={() => setCurrentBanner(index)}
                            />
                        ))}
                    </Stack>
                </Box>
            )}

            {/* Quick Actions */}
            <Container sx={{ mt: -4, mb: 4, position: 'relative', zIndex: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <Card
                            sx={{
                                bgcolor: 'white',
                                borderRadius: 3,
                                p: 2,
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-4px)' },
                            }}
                            onClick={() => navigate('/movies')}
                        >
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <MovieFilter sx={{ fontSize: 40, color: '#f84464' }} />
                                <Box>
                                    <Typography variant="h6" fontWeight={600}>
                                        Browse Movies
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Explore latest releases
                                    </Typography>
                                </Box>
                            </Stack>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card
                            sx={{
                                bgcolor: 'white',
                                borderRadius: 3,
                                p: 2,
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-4px)' },
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <EventSeat sx={{ fontSize: 40, color: '#f84464' }} />
                                <Box>
                                    <Typography variant="h6" fontWeight={600}>
                                        Select Seats
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Choose your perfect spot
                                    </Typography>
                                </Box>
                            </Stack>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card
                            sx={{
                                bgcolor: 'white',
                                borderRadius: 3,
                                p: 2,
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-4px)' },
                            }}
                            onClick={() => navigate('/my-bookings')}
                        >
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <LocalActivity sx={{ fontSize: 40, color: '#f84464' }} />
                                <Box>
                                    <Typography variant="h6" fontWeight={600}>
                                        My Bookings
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        View your tickets
                                    </Typography>
                                </Box>
                            </Stack>
                        </Card>
                    </Grid>
                </Grid>
            </Container>

            {/* Recommended Movies */}
            <Container sx={{ py: 4 }}>
                <Typography
                    variant="h4"
                    fontWeight={700}
                    sx={{ mb: 3, color: '#333' }}
                >
                    Recommended Movies
                </Typography>
                
                <Grid container spacing={3}>
                    {movies.map((movie) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id}>
                            <Card
                                sx={{
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                    },
                                }}
                                onClick={() => navigate(`/movies/${movie.id}`)}
                            >
                                <Box sx={{ position: 'relative' }}>
                                    <CardMedia
                                        component="img"
                                        height="350"
                                        image={resolvePoster(movie.poster_url, movie.title)}
                                        alt={movie.title}
                                        sx={{ objectFit: 'cover' }}
                                    />
                                    <Chip
                                        icon={<Star sx={{ color: '#ffc107 !important' }} />}
                                        label={`${movie.rating}/10`}
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                            bgcolor: 'rgba(0,0,0,0.7)',
                                            color: 'white',
                                            fontWeight: 600,
                                        }}
                                    />
                                </Box>
                                <CardContent sx={{ p: 2 }}>
                                    <Typography
                                        variant="h6"
                                        fontWeight={600}
                                        sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {movie.title}
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                        <Chip
                                            label={movie.genre}
                                            size="small"
                                            sx={{
                                                bgcolor: alpha('#f84464', 0.1),
                                                color: '#f84464',
                                                fontWeight: 500,
                                            }}
                                        />
                                        <Chip
                                            label={movie.language}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Stack>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        sx={{
                                            mt: 2,
                                            bgcolor: '#f84464',
                                            '&:hover': { bgcolor: '#dc3558' },
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Book Now
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Footer Banner */}
            <Box
                sx={{
                    bgcolor: '#333545',
                    color: 'white',
                    py: 6,
                    mt: 6,
                }}
            >
                <Container>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h5" fontWeight={700} gutterBottom>
                                List Your Show
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Got a show, event, activity or a great experience? Partner with us & get listed on BookMyShow
                            </Typography>
                            <Button
                                variant="outlined"
                                sx={{
                                    color: 'white',
                                    borderColor: 'white',
                                    '&:hover': {
                                        bgcolor: alpha('#fff', 0.1),
                                        borderColor: 'white',
                                    },
                                }}
                            >
                                Contact Today!
                            </Button>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h5" fontWeight={700} gutterBottom>
                                24/7 Customer Support
                            </Typography>
                            <Typography variant="body1">
                                We're here to help! Get assistance anytime with your bookings and queries.
                            </Typography>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </Box>
    );
};

export default HomePage;
