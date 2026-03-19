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

  // Directly apply background to body because Tailwind/MUI CssBaseline
  // can override CSS variables from the cascade
  if (nextMode === 'dark') {
    body.style.backgroundColor = '#0f172a';
    body.style.backgroundImage = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
  } else {
    body.style.backgroundColor = '#faf9ff';
    body.style.backgroundImage = 'linear-gradient(135deg, #faf9ff 0%, #f0ebff 100%)';
  }
};

// Immediately read from localStorage + apply to DOM before first render
const getInitialMode = (): PaletteMode => {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem('themeMode') as PaletteMode) || 'dark';
};

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
    applyThemeToDOM(newMode);
  };

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  // Apply DOM classes whenever mode changes (covers initial load too)
  useEffect(() => {
    applyThemeToDOM(mode);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
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
