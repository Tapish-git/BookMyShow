import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const Footer: React.FC = () => {
    return (
        <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: '#f5f5f5' }}>
            <Container maxWidth="sm">
                <Typography variant="body1">
                    © {new Date().getFullYear()} BookMyShow Clone. All rights reserved.
                </Typography>
            </Container>
        </Box>
    );
};

export default Footer;
