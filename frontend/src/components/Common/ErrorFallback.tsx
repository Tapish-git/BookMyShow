import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
    title?: string;
    description?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary, title = 'Error', description }) => {
    return (
        <Box role="alert" sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="error" gutterBottom>{title}</Typography>
            <Typography variant="body1" gutterBottom>{description || error.message}</Typography>
            <Button variant="contained" onClick={resetErrorBoundary} sx={{ mt: 2 }}>
                Try again
            </Button>
        </Box>
    );
};

export default ErrorFallback;
