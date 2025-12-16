import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const MoviesPage: React.FC = () => (
    <Container>
        <Box sx={{ my: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Movies
            </Typography>
            <Typography variant="body1">List of movies will be displayed here.</Typography>
        </Box>
    </Container>
);

export default MoviesPage;
