import React from 'react';
import { Box, Container, Typography, Grid, Link, Stack, IconButton, Divider } from '@mui/material';
import { 
    Facebook, 
    Twitter, 
    Instagram, 
    YouTube,
    Email,
    Phone,
    LocationOn
} from '@mui/icons-material';

const Footer: React.FC = () => {
    return (
        <Box component="footer" sx={{ bgcolor: '#333545', color: 'white', pt: 6, pb: 3 }}>
            <Container maxWidth="xl">
                <Grid container spacing={4}>
                    {/* About Section */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: '#f84464' }}>
                            BookMyShow
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.7)' }}>
                            India's biggest online movie and events ticketing platform. Book tickets for movies, plays, sports, and live events.
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <IconButton sx={{ color: 'white', '&:hover': { color: '#f84464' } }}>
                                <Facebook />
                            </IconButton>
                            <IconButton sx={{ color: 'white', '&:hover': { color: '#f84464' } }}>
                                <Twitter />
                            </IconButton>
                            <IconButton sx={{ color: 'white', '&:hover': { color: '#f84464' } }}>
                                <Instagram />
                            </IconButton>
                            <IconButton sx={{ color: 'white', '&:hover': { color: '#f84464' } }}>
                                <YouTube />
                            </IconButton>
                        </Stack>
                    </Grid>

                    {/* Quick Links */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Quick Links
                        </Typography>
                        <Stack spacing={1}>
                            <Link href="#" underline="hover" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#f84464' } }}>
                                About Us
                            </Link>
                            <Link href="#" underline="hover" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#f84464' } }}>
                                Contact Us
                            </Link>
                            <Link href="#" underline="hover" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#f84464' } }}>
                                Terms & Conditions
                            </Link>
                            <Link href="#" underline="hover" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#f84464' } }}>
                                Privacy Policy
                            </Link>
                            <Link href="#" underline="hover" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#f84464' } }}>
                                FAQ
                            </Link>
                        </Stack>
                    </Grid>

                    {/* Services */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Our Services
                        </Typography>
                        <Stack spacing={1}>
                            <Link href="#" underline="hover" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#f84464' } }}>
                                Movies
                            </Link>
                            <Link href="#" underline="hover" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#f84464' } }}>
                                Events
                            </Link>
                            <Link href="#" underline="hover" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#f84464' } }}>
                                Plays
                            </Link>
                            <Link href="#" underline="hover" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#f84464' } }}>
                                Sports
                            </Link>
                            <Link href="#" underline="hover" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#f84464' } }}>
                                Gift Cards
                            </Link>
                        </Stack>
                    </Grid>

                    {/* Contact Info */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Contact Us
                        </Typography>
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Email sx={{ color: '#f84464' }} />
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    support@bookmyshow.com
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Phone sx={{ color: '#f84464' }} />
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    +91 1800 123 4567
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOn sx={{ color: '#f84464' }} />
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    Mumbai, Maharashtra, India
                                </Typography>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

                {/* Bottom Bar */}
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        © {new Date().getFullYear()} BookMyShow Clone. All rights reserved. | Designed with ❤️
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;
