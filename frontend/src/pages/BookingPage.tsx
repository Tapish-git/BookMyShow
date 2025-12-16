import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const BookingPage: React.FC = () => (
    <Container>
        <Box sx={{ my: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Booking Summary
            </Typography>
            <Typography variant="body1">Complete your booking here.</Typography>
        </Box>
    </Container>
);

export default BookingPage;
