import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Grid,
    Card,
    CardMedia,
    CardContent,
    CircularProgress,
    Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { movieApi } from '@/services/api';
import { Movie } from '@/types/api';

const MoviesPage: React.FC = () => {
    const navigate = useNavigate();
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                console.log('🎬 Fetching movies from API...');
                const response = await movieApi.getMovies();
                console.log('✅ Movies fetched:', response);
                setMovies(response.movies || []);
                setError(null);
            } catch (err: any) {
                console.error('❌ Error fetching movies:', err);
                setError(err?.message || 'Failed to load movies. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, []);

    if (loading) {
        return (
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <Box sx={{ my: 4 }}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            </Container>
        );
    }

    return (
        <Container>
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Movies
                </Typography>

                {movies.length === 0 ? (
                    <Typography variant="body1">No movies available at the moment.</Typography>
                ) : (
                    <Grid container spacing={3} sx={{ mt: 2 }}>
                        {movies.map((movie) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            transform: 'scale(1.02)',
                                            boxShadow: 6,
                                            transition: 'all 0.3s ease'
                                        }
                                    }}
                                    onClick={() => navigate(`/movies/${movie.id}`)}
                                >
                                    <CardMedia
                                        component="img"
                                        height="400"
                                        image={(movie.posterUrl && !movie.posterUrl.includes('placeholder-movie.jpg'))
                                            ? movie.posterUrl
                                            : 'https://placehold.co/600x900/333333/FFFFFF?text=Movie+Poster'}
                                        alt={movie.title}
                                        sx={{ objectFit: 'cover' }}
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography gutterBottom variant="h6" component="div">
                                            {movie.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            {movie.genre} | {movie.language}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            ⭐ {movie.rating}/10 | {movie.duration} mins
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>
        </Container>
    );
};

export default MoviesPage;

