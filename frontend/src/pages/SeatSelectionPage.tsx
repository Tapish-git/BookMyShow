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
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Snackbar
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

const normalizeSeat = (rowName: string, seat: any, showPrice: number): Seat => {
    const seatIdentifier = seat.seatIdentifier || seat.seat_identifier || seat.displayName || seat.display_name;
    const seatType = seat.seatType || seat.seat_type || 'Regular';
    const isAvailable = (seat.isAvailable ?? seat.is_available ?? true) === true;
    const reservationStatusRaw = seat.reservationStatus || seat.reservation_status || null;
    const status = isAvailable ? 'available' : (reservationStatusRaw ? reservationStatusRaw.toString().toLowerCase() : 'booked');
    const seatPrice = Number(showPrice ?? seat.price ?? 0);

    return {
        id: seat.id,
        seat_number: seatIdentifier,
        row_name: rowName,
        seat_type: seatType,
        price: seatPrice,
        status
    };
};

const SeatSelectionPage: React.FC = () => {
    const { showId } = useParams<{ showId: string }>();
    const navigate = useNavigate();

    const [show, setShow] = useState<ShowDetails | null>(null);
    const [seats, setSeats] = useState<Seat[]>([]);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [blockedSeatIds, setBlockedSeatIds] = useState<string[]>([]);
    const [countdown, setCountdown] = useState<number | null>(null); // seconds
    const [bookingInProgress, setBookingInProgress] = useState(false);
    const [showUserDialog, setShowUserDialog] = useState(false);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // Load saved user details from localStorage
    useEffect(() => {
        const savedUser = localStorage.getItem('bookMyShowUser');
        if (savedUser) {
            try {
                const { name, email, phone } = JSON.parse(savedUser);
                setUserName(name || '');
                setUserEmail(email || '');
                setUserPhone(phone || '');
            } catch (e) {
                console.error('Failed to parse saved user data');
            }
        }
    }, []);

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
                        rowSeats.forEach(seat => seatsArray.push(normalizeSeat(rowName, seat, seatsResponse.show.price)));
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

    // Countdown tick
    useEffect(() => {
        if (countdown === null) return;
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown(prev => (prev && prev > 0) ? prev - 1 : 0);
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    // Auto-release seats when countdown ends
    useEffect(() => {
        const releaseOnExpiry = async () => {
            if (countdown === 0 && blockedSeatIds.length > 0) {
                try {
                    await seatApi.releaseSeats(blockedSeatIds);
                } catch (err) {
                    console.error('❌ Auto-release failed:', err);
                } finally {
                    setBlockedSeatIds([]);
                    setSelectedSeats([]);
                    setCountdown(null);
                    // Refresh seat layout to reflect availability
                    if (showId) {
                        try {
                            const seatsResponse = await seatApi.getSeatLayout(showId);
                            const seatsArray: Seat[] = [];
                            if (seatsResponse.seatLayout) {
                                Object.entries(seatsResponse.seatLayout).forEach(([rowName, rowSeats]) => {
                                    rowSeats.forEach(seat => seatsArray.push(normalizeSeat(rowName, seat, seatsResponse.show.price)));
                                });
                            }
                            setSeats(seatsArray);
                        } catch {}
                    }
                }
            }
        };
        releaseOnExpiry();
    }, [countdown]);

    const handleSeatClick = async (seatId: string, seatStatus: string) => {
        if (seatStatus !== 'available') return;

        setSelectedSeats(prev => {
            const next = prev.includes(seatId)
                ? prev.filter(id => id !== seatId)
                : [...prev, seatId];
            return next;
        });

        // Start session countdown on first selection (5 mins)
        if (countdown === null) {
            setCountdown(5 * 60);
        }
    };

    const handleProceed = async () => {
        if (selectedSeats.length === 0 || !showId) return;

        // Show user details dialog first
        setShowUserDialog(true);
    };

    const handleConfirmBooking = async () => {
        if (!userName.trim() || !userEmail.trim()) {
            setSnackbarMessage('Please fill in your name and email');
            setSnackbarOpen(true);
            return;
        }

        if (!showId) {
            setSnackbarMessage('Show ID is missing');
            setSnackbarOpen(true);
            return;
        }

        // Save user details to localStorage
        localStorage.setItem('bookMyShowUser', JSON.stringify({
            name: userName,
            email: userEmail,
            phone: userPhone
        }));

        setShowUserDialog(false);
        setBookingInProgress(true);

        try {
            // Block all selected seats at once before booking
            setSnackbarMessage('Blocking seats...');
            setSnackbarOpen(true);
            
            await seatApi.blockSeats({ showId, seatIds: selectedSeats, blockDuration: 5 });
            setBlockedSeatIds(selectedSeats);

            // Create booking immediately and navigate to confirmation
            setSnackbarMessage('Creating booking...');
            
            const booking = await (await import('@/services/api')).bookingApi.createBooking({
                showId: showId!,
                seatIds: selectedSeats,
                userDetails: {
                    name: userName,
                    email: userEmail,
                    phone: userPhone || undefined
                }
            });
            const reference = booking.booking.reference;
            
            setSnackbarMessage('Booking confirmed! Redirecting...');
            setTimeout(() => {
                navigate(`/booking/confirmation/${reference}`);
            }, 1000);
        } catch (err: any) {
            console.error('❌ Booking failed:', err);
            setError(err?.error?.message || 'Failed to complete booking');
            setSnackbarMessage('Booking failed. Please try again.');
            setSnackbarOpen(true);
            setBookingInProgress(false);
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
                        {countdown !== null && (
                            <Chip label={`Time left: ${Math.floor((countdown || 0)/60)}m ${(countdown || 0)%60}s`} color="warning" />
                        )}
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
                                        <Typography variant="caption">{(seat.seat_number || '').toString()}</Typography>
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
                                    disabled={selectedSeats.length === 0 || bookingInProgress}
                                    onClick={handleProceed}
                                    fullWidth
                                    startIcon={bookingInProgress ? <CircularProgress size={20} color="inherit" /> : null}
                                >
                                    {bookingInProgress ? 'Processing...' : `Proceed to Book (${selectedSeats.length} seats)`}
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

            {/* User Details Dialog */}
            <Dialog open={showUserDialog} onClose={() => !bookingInProgress && setShowUserDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Enter Your Details</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Full Name"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            required
                            fullWidth
                            disabled={bookingInProgress}
                        />
                        <TextField
                            label="Email Address"
                            type="email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            required
                            fullWidth
                            disabled={bookingInProgress}
                        />
                        <TextField
                            label="Phone Number (Optional)"
                            value={userPhone}
                            onChange={(e) => setUserPhone(e.target.value)}
                            fullWidth
                            disabled={bookingInProgress}
                        />
                        <Alert severity="info">
                            Your details will be saved for future bookings
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowUserDialog(false)} disabled={bookingInProgress}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmBooking} 
                        variant="contained" 
                        disabled={bookingInProgress}
                        startIcon={bookingInProgress ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {bookingInProgress ? 'Processing...' : `Confirm Booking (₹${totalPrice})`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Container>
    );
};

export default SeatSelectionPage;
