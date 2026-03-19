'use client';

import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import ReplayIcon from '@mui/icons-material/Replay';

export default function OfflinePage() {
    return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Container maxWidth="sm">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 4,
                        textAlign: 'center',
                        borderRadius: '24px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(108, 99, 255, 0.2)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                        animation: 'fadeInUp 0.6s ease-out'
                    }}
                >
                    <Box sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255, 101, 132, 0.1)',
                        mb: 3
                    }}>
                        <WifiOffIcon sx={{ fontSize: 40, color: '#FF6584' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary', letterSpacing: '-0.02em' }}>
                        You're offline
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, maxWidth: 300 }}>
                        It seems you've lost your network connection. Please check your internet connection and try again.
                    </Typography>

                    <Button
                        variant="contained"
                        onClick={() => window.location.reload()}
                        startIcon={<ReplayIcon />}
                        sx={{
                            borderRadius: '16px',
                            py: 1.5,
                            px: 4,
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '1rem',
                            background: 'linear-gradient(135deg, #6C63FF 0%, #4f46e5 100%)',
                            boxShadow: '0 8px 16px rgba(108, 99, 255, 0.2)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #7C73FF 0%, #6C63FF 100%)',
                                transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.2s'
                        }}
                    >
                        Try Again
                    </Button>
                </Box>
                <style jsx global>{`
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </Container>
        </main>
    );
}
