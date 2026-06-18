import React, { createContext, useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

export const ThemeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
});

const lightPalette = {
  mode: 'light',
  primary: { main: '#2563eb' },
  background: { default: '#f8fafc', paper: '#ffffff' },
  text: { primary: '#1e293b' },
};

const darkPalette = {
  mode: 'dark',
  primary: { main: '#2563eb' },
  background: { default: '#0f172a', paper: '#1e293b' },
  text: { primary: '#f1f5f9' },
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('themeMode');
    if (saved === 'dark' || saved === 'light') setMode(saved);
  }, []);

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', next);
      return next;
    });
  };

  const theme = useMemo(() => createTheme(mode === 'light' ? { palette: lightPalette } : { palette: darkPalette }), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
