import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const MyBookingsPage: React.FC = () => (
    <Container>
        <Box sx={{ my: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                My Bookings
            </Typography>
            <Typography variant="body1">Your past and upcoming bookings.</Typography>
        </Box>
    </Container>
);

export default MyBookingsPage;
