'use client';

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import NextAppDirEmotionCacheProvider from './EmotionCache';
import { createAppTheme } from '@/theme';
import { ThemeContextProvider, useThemeContext } from './ThemeContext';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
    return (
        <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
            <ThemeContextProvider>
                {children}
            </ThemeContextProvider>
        </NextAppDirEmotionCacheProvider>
    );
}
