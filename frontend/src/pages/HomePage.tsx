import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const HomePage: React.FC = () => (
    <Container>
        <Box sx={{ my: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Welcome to BookMyShowwww!
            </Typography>
            <Typography variant="body1">
                Browse movies and book tickets online.
            </Typography>
        </Box>
    </Container>
);

export default HomePage;
