import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Grid,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Paper,
    Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { showApi, seatApi } from '@/services/api';
import { ShowDetails } from '@/types/api';

interface Seat {
    id: string;
    seat_number: string;
    row_name: string;
    seat_type: string;
    price: number;
    status: string;
}

const SeatSelectionPage: React.FC = () => {
    const { showId } = useParams<{ showId: string }>();
    const navigate = useNavigate();

    const [show, setShow] = useState<ShowDetails | null>(null);
    const [seats, setSeats] = useState<Seat[]>([]);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchShowAndSeats = async () => {
            if (!showId) return;

            try {
                console.log('🎬 Fetching show and seats for:', showId);

                // Fetch show details
                const showResponse = await showApi.getShowById(showId);
                console.log('✅ Show fetched:', showResponse);
                setShow(showResponse);

                // Fetch seat layout
                const seatsResponse = await seatApi.getSeatLayout(showId);
                console.log('✅ Seats fetched:', seatsResponse);

                // Transform seatLayout object into flat array
                const seatsArray: Seat[] = [];
                if (seatsResponse.seatLayout) {
                    Object.entries(seatsResponse.seatLayout).forEach(([rowName, rowSeats]) => {
                        rowSeats.forEach(seat => {
                            seatsArray.push({
                                id: seat.id,
                                seat_number: seat.seatIdentifier,
                                row_name: rowName,
                                seat_type: seat.seatType,
                                price: seatsResponse.show.price, // Use show price
                                status: seat.reservationStatus.toLowerCase()
                            });
                        });
                    });
                }
                setSeats(seatsArray);

                setError(null);
            } catch (err: any) {
                console.error('❌ Error fetching show/seats:', err);
                setError(err?.error?.message || 'Failed to load seats');
            } finally {
                setLoading(false);
            }
        };

        fetchShowAndSeats();
    }, [showId]);

    const handleSeatClick = (seatId: string, seatStatus: string) => {
        if (seatStatus !== 'available') return;

        setSelectedSeats(prev =>
            prev.includes(seatId)
                ? prev.filter(id => id !== seatId)
                : [...prev, seatId]
        );
    };

    const handleProceed = async () => {
        if (selectedSeats.length === 0) return;

        try {
            // Block seats
            await seatApi.blockSeats({
                showId: showId!,
                seatIds: selectedSeats
            });

            // Navigate to booking page
            navigate(`/booking?showId=${showId}&seats=${selectedSeats.join(',')}`);
        } catch (err: any) {
            setError(err?.error?.message || 'Failed to block seats');
        }
    };

    const getSeatColor = (seat: Seat) => {
        if (selectedSeats.includes(seat.id)) return '#4caf50';
        if (seat.status === 'booked') return '#d32f2f';
        if (seat.status === 'blocked') return '#ff9800';
        return '#2196f3';
    };

    const totalPrice = selectedSeats.reduce((sum, seatId) => {
        const seat = seats.find(s => s.id === seatId);
        return sum + (seat?.price || 0);
    }, 0);

    // Group seats by row
    const seatsByRow = seats.reduce((acc, seat) => {
        if (!acc[seat.row_name]) acc[seat.row_name] = [];
        acc[seat.row_name].push(seat);
        return acc;
    }, {} as Record<string, Seat[]>);

    if (loading) {
        return (
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error || !show) {
        return (
            <Container>
                <Box sx={{ my: 4 }}>
                    <Alert severity="error">{error || 'Show not found'}</Alert>
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
                {/* Show Info */}
                <Paper sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h5" gutterBottom>
                        {show.movie?.title || 'Movie'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip label={`${show.hallName}`} />
                        <Chip label={`${new Date(show.showDate).toLocaleDateString()}`} />
                        <Chip label={`${show.showTime}`} />
                        <Chip label={`₹${show.price}`} color="secondary" />
                    </Box>
                </Paper>

                {/* Legend */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip label="Available" sx={{ bgcolor: '#2196f3', color: 'white' }} size="small" />
                    <Chip label="Selected" sx={{ bgcolor: '#4caf50', color: 'white' }} size="small" />
                    <Chip label="Booked" sx={{ bgcolor: '#d32f2f', color: 'white' }} size="small" />
                    <Chip label="Blocked" sx={{ bgcolor: '#ff9800', color: 'white' }} size="small" />
                </Box>

                {/* Screen */}
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ px: 4, py: 1, bgcolor: '#e0e0e0', borderRadius: 1 }}>
                        🎬 SCREEN
                    </Typography>
                </Box>

                {/* Seat Layout */}
                <Box sx={{ mb: 4 }}>
                    {Object.entries(seatsByRow).map(([rowName, rowSeats]) => (
                        <Box key={rowName} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ width: 30, textAlign: 'center', fontWeight: 'bold' }}>
                                    {rowName}
                                </Typography>
                                {rowSeats.map((seat) => (
                                    <Box
                                        key={seat.id}
                                        onClick={() => handleSeatClick(seat.id, seat.status)}
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: getSeatColor(seat),
                                            color: 'white',
                                            borderRadius: 1,
                                            cursor: seat.status === 'available' || selectedSeats.includes(seat.id) ? 'pointer' : 'not-allowed',
                                            opacity: seat.status === 'available' || selectedSeats.includes(seat.id) ? 1 : 0.5,
                                            '&:hover': seat.status === 'available' ? {
                                                transform: 'scale(1.1)',
                                                transition: 'all 0.2s'
                                            } : {}
                                        }}
                                    >
                                        <Typography variant="caption">{seat.seat_number.slice(-2)}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ))}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Booking Summary */}
                <Paper sx={{ p: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                            <Typography variant="h6">
                                Selected Seats: {selectedSeats.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {selectedSeats.map(id => seats.find(s => s.id === id)?.seat_number).join(', ') || 'None'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} sx={{ textAlign: { sm: 'right' } }}>
                            <Typography variant="h5" color="secondary.main">
                                Total: ₹{totalPrice}
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    disabled={selectedSeats.length === 0}
                                    onClick={handleProceed}
                                    fullWidth
                                >
                                    Proceed to Book ({selectedSeats.length} seats)
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Back Button */}
                <Box sx={{ mt: 3 }}>
                    <Button onClick={() => navigate(-1)} variant="outlined">
                        ← Back
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default SeatSelectionPage;
