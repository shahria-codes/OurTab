'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { PaletteMode, ThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from '@/theme';

type ThemeContextType = {
  mode: PaletteMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const applyThemeToDOM = (nextMode: PaletteMode) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  root.setAttribute('data-theme', nextMode);
  if (nextMode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
  root.style.colorScheme = nextMode;

  // Background is handled by globals.css CSS variables now,
  // but we can ensure styles are applied directly to body to avoid Tailwind conflicts if needed.
  if (nextMode === 'dark') {
    body.style.backgroundColor = '#0f172a';
    body.style.backgroundImage = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
  } else {
    body.style.backgroundColor = '#faf9ff';
    body.style.backgroundImage = 'linear-gradient(135deg, #faf9ff 0%, #f0ebff 100%)';
  }
};

const getInitialMode = (): PaletteMode => {
  // Always return 'dark' initially to match SSR and prevent hydration mismatches.
  // We will switch to the user's preferred theme in a useEffect after mounting.
  return 'dark';
};

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedMode = (localStorage.getItem('themeMode') as PaletteMode) || 'dark';
    if (savedMode !== 'dark') {
      setMode(savedMode);
    }
    
    // Remove the blocking injected style so dynamic toggling and CSS transitions work again
    const initStyle = document.getElementById('theme-init-style');
    if (initStyle) {
      setTimeout(() => initStyle.remove(), 10);
    }
  }, []);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
    applyThemeToDOM(newMode);
  };


  const theme = useMemo(() => createAppTheme(mode), [mode]);

  // Apply DOM classes whenever mode changes (covers initial load too)
  useEffect(() => {
    if (mounted) {
      applyThemeToDOM(mode);
    }
  }, [mode, mounted]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: '100%'
        }}>
          {children}
        </div>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeContextProvider');
  }
  return context;
};
