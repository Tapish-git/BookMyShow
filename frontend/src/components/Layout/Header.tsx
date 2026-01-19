import React, { useState } from 'react';
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Button, 
    Container,
    Box,
    InputBase,
    IconButton,
    Menu,
    MenuItem,
    alpha,
    useTheme,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { 
    Search, 
    LocationOn, 
    Menu as MenuIcon,
    AccountCircle,
    Home,
    Movie,
    ConfirmationNumber
} from '@mui/icons-material';

const Header: React.FC = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const theme = useTheme();

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMobileMenuToggle = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const menuItems = [
        { text: 'Home', path: '/', icon: <Home /> },
        { text: 'Movies', path: '/movies', icon: <Movie /> },
        { text: 'My Bookings', path: '/my-bookings', icon: <ConfirmationNumber /> },
    ];

    return (
        <AppBar 
            position="sticky" 
            elevation={0}
            sx={{ 
                bgcolor: '#333545',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}
        >
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ minHeight: '70px' }}>
                    {/* Mobile Menu Icon */}
                    <IconButton
                        sx={{ display: { xs: 'flex', md: 'none' }, mr: 1, color: 'white' }}
                        onClick={handleMobileMenuToggle}
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* Logo */}
                    <Typography
                        variant="h5"
                        component={Link}
                        to="/"
                        sx={{
                            mr: 4,
                            fontWeight: 800,
                            color: 'white',
                            textDecoration: 'none',
                            fontSize: { xs: '1.2rem', md: '1.5rem' },
                            background: 'linear-gradient(45deg, #f84464, #ff6b9d)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '0.5px',
                        }}
                    >
                        BookMyShow
                    </Typography>

                    {/* Search Bar - Desktop */}
                    <Box
                        sx={{
                            display: { xs: 'none', md: 'flex' },
                            flex: 1,
                            maxWidth: '500px',
                            position: 'relative',
                            borderRadius: 1,
                            bgcolor: alpha('#fff', 0.15),
                            '&:hover': {
                                bgcolor: alpha('#fff', 0.25),
                            },
                            mr: 2,
                        }}
                    >
                        <Box
                            sx={{
                                padding: theme.spacing(0, 2),
                                height: '100%',
                                position: 'absolute',
                                pointerEvents: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Search sx={{ color: 'white' }} />
                        </Box>
                        <InputBase
                            placeholder="Search for Movies, Events, Plays, Sports…"
                            sx={{
                                color: 'white',
                                width: '100%',
                                pl: theme.spacing(6),
                                pr: 2,
                                py: 1,
                                '& ::placeholder': {
                                    color: alpha('#fff', 0.7),
                                },
                            }}
                        />
                    </Box>

                    {/* Location */}
                    <Button
                        startIcon={<LocationOn />}
                        sx={{
                            color: 'white',
                            textTransform: 'none',
                            display: { xs: 'none', md: 'flex' },
                            mr: 2,
                            '&:hover': {
                                bgcolor: alpha('#fff', 0.1),
                            },
                        }}
                    >
                        Mumbai
                    </Button>

                    <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }} />

                    {/* Desktop Menu */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                        <Button 
                            color="inherit" 
                            component={Link} 
                            to="/movies"
                            sx={{
                                textTransform: 'none',
                                fontSize: '1rem',
                                '&:hover': {
                                    bgcolor: alpha('#fff', 0.1),
                                },
                            }}
                        >
                            Movies
                        </Button>
                        <Button 
                            color="inherit" 
                            component={Link} 
                            to="/my-bookings"
                            sx={{
                                textTransform: 'none',
                                fontSize: '1rem',
                                '&:hover': {
                                    bgcolor: alpha('#fff', 0.1),
                                },
                            }}
                        >
                            My Bookings
                        </Button>
                    </Box>

                    {/* Sign In Button */}
                    <Button
                        variant="contained"
                        startIcon={<AccountCircle />}
                        onClick={handleProfileMenuOpen}
                        sx={{
                            ml: 2,
                            bgcolor: '#f84464',
                            color: 'white',
                            textTransform: 'none',
                            borderRadius: 1,
                            px: 2,
                            '&:hover': {
                                bgcolor: '#dc3558',
                            },
                        }}
                    >
                        Sign In
                    </Button>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        sx={{ mt: 1 }}
                    >
                        <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
                        <MenuItem onClick={handleMenuClose}>My Bookings</MenuItem>
                        <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
                        <MenuItem onClick={handleMenuClose}>Logout</MenuItem>
                    </Menu>
                </Toolbar>
            </Container>

            {/* Mobile Drawer */}
            <Drawer
                anchor="left"
                open={mobileMenuOpen}
                onClose={handleMobileMenuToggle}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: 250,
                        bgcolor: '#333545',
                        color: 'white',
                    },
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                        Menu
                    </Typography>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton
                                    component={Link}
                                    to={item.path}
                                    onClick={handleMobileMenuToggle}
                                    sx={{
                                        borderRadius: 1,
                                        mb: 0.5,
                                        '&:hover': {
                                            bgcolor: alpha('#fff', 0.1),
                                        },
                                    }}
                                >
                                    <Box sx={{ mr: 2, display: 'flex', color: '#f84464' }}>
                                        {item.icon}
                                    </Box>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
        </AppBar>
    );
};

export default Header;
