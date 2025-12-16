import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { useParams } from 'react-router-dom';

const SeatSelectionPage: React.FC = () => {
    const { showId } = useParams<{ showId: string }>();
    return (
        <Container>
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Select Seats
                </Typography>
                <Typography variant="body1">Seat selection for show ID: {showId}</Typography>
            </Box>
        </Container>
    );
};

export default SeatSelectionPage;
