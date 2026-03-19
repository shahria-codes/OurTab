'use client';

import React from 'react';
import IconButton from '@mui/material/IconButton';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useThemeContext } from './ThemeContext';
import { Tooltip } from '@mui/material';

export default function ThemeToggle() {
    const { mode, toggleTheme } = useThemeContext();
    const isLight = mode === 'light';

    return (
        <Tooltip title={`Switch to ${isLight ? 'dark' : 'light'} mode`}>
            <IconButton 
                onClick={toggleTheme} 
                sx={{
                    color: isLight ? '#1e1b4b' : '#f8fafc',
                    bgcolor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)',
                    '&:hover': {
                        bgcolor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.1)',
                    }
                }}
            >
                {isLight ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
        </Tooltip>
    );
}
