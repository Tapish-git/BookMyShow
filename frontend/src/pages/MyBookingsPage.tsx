import React, { useState } from 'react';
import { Box, Typography, Container, TextField, Button, Paper, Grid, Chip, Alert, CircularProgress } from '@mui/material';
import { bookingApi } from '@/services/api';

const MyBookingsPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [bookings, setBookings] = useState<any[]>([]);

    const handleFetch = async () => {
        if (!email) return;
        setLoading(true);
        try {
            const data = await bookingApi.getUserBookings(email);
            setBookings(data.bookings || []);
            setError(null);
        } catch (err: any) {
            setError(err?.error?.message || 'Unable to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container sx={{ py: 6 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                My Bookings
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Lookup by email</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        size="small"
                        sx={{ minWidth: 280 }}
                    />
                    <Button variant="contained" onClick={handleFetch} disabled={loading || !email}>
                        {loading ? 'Loading...' : 'Fetch'}
                    </Button>
                </Box>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </Paper>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && bookings.length === 0 && !error && (
                <Typography color="text.secondary">No bookings found.</Typography>
            )}

            <Grid container spacing={2} sx={{ mt: 1 }}>
                {bookings.map(b => (
                    <Grid item xs={12} md={6} key={b.id}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" fontWeight={700}>{b.movieTitle}</Typography>
                            <Typography variant="body2" color="text.secondary">{b.showDate} • {b.showTime} • {b.hallName}</Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>Reference: {b.reference}</Typography>
                            <Typography variant="body2">Seats: {b.totalSeats}</Typography>
                            <Typography variant="body2">Amount: ₹{b.totalAmount}</Typography>
                            <Chip label={b.status} size="small" sx={{ mt: 1 }} color={b.status === 'CONFIRMED' ? 'success' : 'default'} />
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default MyBookingsPage;
