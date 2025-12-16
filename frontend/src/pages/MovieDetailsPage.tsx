import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { useParams } from 'react-router-dom';

const MovieDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    return (
        <Container>
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Movie Details
                </Typography>
                <Typography variant="body1">Details for movie ID: {id}</Typography>
            </Box>
        </Container>
    );
};

export default MovieDetailsPage;
