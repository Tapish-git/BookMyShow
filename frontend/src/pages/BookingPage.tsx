import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Paper, Chip, Button, Divider, Stack, Alert, CircularProgress } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { showApi } from '@/services/api';

const BookingPage: React.FC = () => {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const showId = params.get('showId');
    const seats = (params.get('seats') || '').split(',').filter(Boolean);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [show, setShow] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            if (!showId) {
                setError('Missing showId.');
                setLoading(false);
                return;
            }
            try {
                const data = await showApi.getShowById(showId);
                setShow(data);
                setError(null);
            } catch (err: any) {
                setError(err?.error?.message || 'Unable to load show');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [showId]);

    if (loading) {
        return (
            <Container sx={{ py: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error || !show) {
        return (
            <Container sx={{ py: 6 }}>
                <Alert severity="error">{error || 'Show not found'}</Alert>
                <Button sx={{ mt: 2 }} onClick={() => navigate('/movies')}>Back to Movies</Button>
            </Container>
        );
    }

    const total = seats.length * Number(show.price || 0);

    return (
        <Container sx={{ py: 6 }}>
            <Paper sx={{ p: 4, mb: 3 }}>
                <Typography variant="h4" gutterBottom>Booking Summary</Typography>
                <Typography variant="h6" fontWeight={700}>{show.movie?.title}</Typography>
                <Typography variant="body2" color="text.secondary">{show.showDate} • {show.showTime} • {show.hallName}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                    {seats.map(s => <Chip key={s} label={s} />)}
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h5">Total: ₹{total}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Seats are blocked at the previous step. If you want to change seats, go back.
                </Typography>
                <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button variant="contained" onClick={() => navigate(`/booking/confirmation/${params.get('reference') || ''}`)} disabled={!params.get('reference')}>
                        View Confirmation
                    </Button>
                    <Button variant="outlined" onClick={() => navigate(-1)}>Back to Seats</Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default BookingPage;
