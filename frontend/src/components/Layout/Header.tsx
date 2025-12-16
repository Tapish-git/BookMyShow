import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
    return (
        <AppBar position="static">
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <Typography
                        variant="h6"
                        noWrap
                        component={Link}
                        to="/"
                        sx={{
                            mr: 2,
                            display: { xs: 'none', md: 'flex' },
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rem',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        BOOKMYSHOW
                    </Typography>
                    <Button color="inherit" component={Link} to="/movies">Movies</Button>
                    <Button color="inherit" component={Link} to="/my-bookings">My Bookings</Button>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Header;
