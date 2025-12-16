import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { useParams } from 'react-router-dom';

const BookingConfirmationPage: React.FC = () => {
    const { reference } = useParams<{ reference: string }>();
    return (
        <Container>
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Booking Confirmed!
                </Typography>
                <Typography variant="body1">Your booking reference is: {reference}</Typography>
            </Box>
        </Container>
    );
};

export default BookingConfirmationPage;
