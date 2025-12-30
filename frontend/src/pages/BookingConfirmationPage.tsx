import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Paper, Chip, Divider, Button, CircularProgress, Alert, Stack } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingApi } from '@/services/api';

const BookingConfirmationPage: React.FC = () => {
    const { reference } = useParams<{ reference: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [booking, setBooking] = useState<any>(null);

    useEffect(() => {
        const fetchBooking = async () => {
            if (!reference) return;
            try {
                const data = await bookingApi.getBookingByReference(reference);
                setBooking(data);
                setError(null);
            } catch (err: any) {
                setError(err?.error?.message || 'Unable to fetch booking details');
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [reference]);

    if (loading) {
        return (
            <Container sx={{ py: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error || !booking) {
        return (
            <Container sx={{ py: 6 }}>
                <Alert severity="error">{error || 'Booking not found'}</Alert>
                <Button sx={{ mt: 2 }} onClick={() => navigate('/movies')}>Back to Movies</Button>
            </Container>
        );
    }

    const { booking: bookingInfo, show, seats, ticket } = booking;

    return (
        <Container sx={{ py: 6 }}>
            <Paper sx={{ p: 4, mb: 3 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Booking Confirmed!
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                    <Chip label={`Reference: ${bookingInfo.reference}`} color="success" />
                    <Chip label={show?.movieTitle} />
                    <Chip label={`${show?.showDate} ${show?.showTime}`} />
                    <Chip label={show?.hallName} />
                </Stack>
                <Typography variant="body1" color="text.secondary">
                    Thank you for booking! Show this reference at the counter. A digital ticket is generated below.
                </Typography>
            </Paper>

            <Paper sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom>Ticket</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1" fontWeight={600}>{show?.movieTitle}</Typography>
                <Typography variant="body2" color="text.secondary">{show?.showDate} at {show?.showTime} • {show?.hallName}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Customer: {bookingInfo.customerName || bookingInfo.user_name || 'Guest User'}</Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
                    {(seats || []).map((s: any) => (
                        <Chip key={s.seatIdentifier} label={s.seatIdentifier} />
                    ))}
                </Stack>
                <Typography variant="h6">Total: ₹{bookingInfo.totalAmount || bookingInfo.total_amount}</Typography>
                <Typography variant="body2" color="text.secondary">QR: {ticket?.qrCode || ticket?.qr_code}</Typography>
            </Paper>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="contained" onClick={() => navigate('/movies')}>Book Another</Button>
                <Button variant="outlined" onClick={() => navigate('/my-bookings')}>View My Bookings</Button>
            </Box>
        </Container>
    );
};

export default BookingConfirmationPage;
