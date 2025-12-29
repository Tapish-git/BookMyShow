import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { movieApi, showApi } from '@/services/api';
import { MovieWithShows } from '@/types/api';

interface Show {
    id: string;
    date?: string;  // Date from the byDate grouping
    time: string;  // Backend returns 'time', not 'show_time'
    hall: string;  // Backend returns 'hall', not 'hall_name'
    price: number;
    availableSeats: number;  // Backend returns camelCase
    totalSeats: number;  // Backend returns camelCase
    priceFormatted: string;
    status: 'available' | 'sold_out';
}

const MovieDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [movie, setMovie] = useState<MovieWithShows | null>(null);
    const [shows, setShows] = useState<Show[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMovieDetails = async () => {
            if (!id) return;

            try {
                console.log('🎬 Fetching movie details for:', id);

                // Fetch movie details
                const movieResponse = await movieApi.getMovieById(id);
                console.log('✅ Movie fetched:', movieResponse);
                setMovie(movieResponse);

                // Fetch shows for this movie
                console.log('🎬 Fetching shows for movie:', id);
                const showsResponse = await showApi.getShowsByMovie(id);
                console.log('✅ Shows fetched:', showsResponse);

                // Backend returns shows grouped by date, flatten them into an array
                const showsArray: Show[] = [];
                if (showsResponse.shows?.byDate) {
                    Object.entries(showsResponse.shows.byDate).forEach(([date, dateShows]: [string, any]) => {
                        dateShows.forEach((show: any) => {
                            showsArray.push({ ...show, date }); // Add date to each show
                        });
                    });
                }
                setShows(showsArray);

                setError(null);
            } catch (err: any) {
                console.error('❌ Error fetching movie details:', err);
                setError(err?.error?.message || 'Failed to load movie details');
            } finally {
                setLoading(false);
            }
        };

        fetchMovieDetails();
    }, [id]);

    if (loading) {
        return (
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error || !movie) {
        return (
            <Container>
                <Box sx={{ my: 4 }}>
                    <Alert severity="error">{error || 'Movie not found'}</Alert>
                    <Button onClick={() => navigate('/movies')} sx={{ mt: 2 }}>
                        Back to Movies
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                {/* Movie Details Section */}
                <Grid container spacing={4}>
                    {/* Poster */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardMedia
                                component="img"
                                image={movie.posterUrl || '/placeholder-movie.jpg'}
                                alt={movie.title}
                                sx={{ width: '100%', height: 'auto' }}
                            />
                        </Card>
                    </Grid>

                    {/* Info */}
                    <Grid item xs={12} md={8}>
                        <Box>
                            <Typography variant="h3" component="h1" gutterBottom>
                                {movie.title}
                            </Typography>

                            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip label={movie.genre} color="primary" />
                                <Chip label={movie.language} />
                                <Chip label={`${movie.duration} mins`} />
                                <Chip label={`⭐ ${movie.rating || 0}/10`} color="secondary" />
                            </Box>

                            <Typography variant="body1" paragraph>
                                {movie.description}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                Release Date: {new Date(movie.releaseDate).toLocaleDateString()}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                {/* Shows Section */}
                <Box sx={{ mt: 6 }}>
                    <Typography variant="h4" gutterBottom>
                        Available Shows
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    {shows.length === 0 ? (
                        <Alert severity="info">No shows available for this movie at the moment.</Alert>
                    ) : (
                        <Grid container spacing={2}>
                            {shows.map((show) => (
                                <Grid item xs={12} sm={6} md={4} key={show.id}>
                                    <Card
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': {
                                                boxShadow: 4,
                                                transform: 'translateY(-2px)',
                                                transition: 'all 0.2s'
                                            }
                                        }}
                                        onClick={() => navigate(`/shows/${show.id}/seats`)}
                                    >
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                {show.hall}
                                            </Typography>
                                            {show.date && (
                                                <Typography variant="body2" color="text.secondary">
                                                    📅 {new Date(show.date).toLocaleDateString()}
                                                </Typography>
                                            )}
                                            <Typography variant="body2" color="text.secondary">
                                                🕒 {show.time}
                                            </Typography>
                                            <Typography variant="h6" color="secondary.main" sx={{ mt: 2 }}>
                                                {show.priceFormatted}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {show.availableSeats}/{show.totalSeats} seats available
                                            </Typography>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                sx={{ mt: 2 }}
                                                disabled={show.status === 'sold_out'}
                                            >
                                                {show.status === 'sold_out' ? 'Sold Out' : 'Book Now'}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>

                {/* Back Button */}
                <Box sx={{ mt: 4 }}>
                    <Button onClick={() => navigate('/movies')} variant="outlined">
                        ← Back to Movies
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default MovieDetailsPage;
