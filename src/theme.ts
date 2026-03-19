'use client';
import { createTheme, PaletteMode } from '@mui/material/styles';
import { Outfit } from 'next/font/google';

const outfit = Outfit({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    display: 'swap',
});

export const createAppTheme = (mode: PaletteMode) => {
    return createTheme({
        typography: {
            fontFamily: outfit.style.fontFamily,
            h4: {
                fontWeight: 700,
            },
            h6: {
                fontWeight: 600,
            }
        },
        palette: {
            mode,
            primary: {
                main: mode === 'light' ? '#6C63FF' : '#8B7FFF',
            },
            secondary: {
                main: mode === 'light' ? '#FF6584' : '#FF7A9A',
            },
            success: {
                main: mode === 'light' ? '#10B981' : '#34D399',
            },
            background: {
                default: mode === 'light' ? '#faf9ff' : '#0f172a',
                paper: mode === 'light' ? '#ffffff' : 'rgba(30, 41, 59, 0.7)',
            },
            text: {
                primary: mode === 'light' ? '#1e1b4b' : '#f8fafc',
                secondary: mode === 'light' ? '#6366f1' : '#94a3b8',
            }
        },
        shape: {
            borderRadius: 16,
        },
        components: {
            MuiPaper: {
                styleOverrides: {
                    root: {
                        boxShadow: mode === 'light'
                            ? '0px 4px 20px rgba(0, 0, 0, 0.05)'
                            : '0px 4px 20px rgba(0, 0, 0, 0.3)',
                        backgroundImage: 'none', // Prevent MUI from adding gradients
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        background: mode === 'light'
                            ? '#ffffff'
                            : 'rgba(20, 30, 50, 0.92)',
                        backgroundImage: 'none',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
                        boxShadow: mode === 'dark'
                            ? '0 32px 64px rgba(0,0,0,0.6)'
                            : '0 32px 64px rgba(0,0,0,0.12)',
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: mode === 'light'
                                ? 'rgba(0,0,0,0.02)'
                                : 'rgba(255,255,255,0.04)',
                        },
                    },
                },
            },
            MuiInputBase: {
                styleOverrides: {
                    root: {
                        backgroundColor: 'transparent',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 12,
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        fontWeight: 500,
                    }
                }
            }
        },
    });
};

// Default dark theme for initial load
const theme = createAppTheme('dark');
export default theme;
