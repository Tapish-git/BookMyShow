import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const NotFoundPage: React.FC = () => (
    <Container>
        <Box sx={{ my: 4, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
                404 - Page Not Found
            </Typography>
            <Typography variant="body1">The page you are looking for does not exist.</Typography>
        </Box>
    </Container>
);

export default NotFoundPage;
