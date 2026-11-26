import React, { createContext, useContext, useState, useEffect } from 'react';

export const ACCENT_THEMES = [
  {
    id: 'crimson',
    name: 'Cinema Crimson',
    color: '#e50914',
    hover: '#ff2a55',
    rgb: '229, 9, 20',
    description: 'Classic CineVerse Red',
  },
  {
    id: 'blue',
    name: 'Cyberpunk Blue',
    color: '#38bdf8',
    hover: '#0ea5e9',
    rgb: '56, 189, 248',
    description: 'Vibrant Sci-Fi Cyan',
  },
  {
    id: 'amber',
    name: 'Golden Amber',
    color: '#ffb800',
    hover: '#f59e0b',
    rgb: '255, 184, 0',
    description: 'Prestige Award Gold',
  },
  {
    id: 'emerald',
    name: 'Matrix Emerald',
    color: '#10b981',
    hover: '#059669',
    rgb: '16, 185, 129',
    description: 'Futuristic Neon Green',
  },
  {
    id: 'violet',
    name: 'Neon Violet',
    color: '#a855f7',
    hover: '#9333ea',
    rgb: '168, 85, 247',
    description: 'Synthwave Neon Purple',
  },
];

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [accent, setAccentState] = useState(() => {
    return localStorage.getItem('cineverse_glow_accent') || 'crimson';
  });

  const setAccent = (newAccentId) => {
    const valid = ACCENT_THEMES.some((t) => t.id === newAccentId);
    const chosen = valid ? newAccentId : 'crimson';
    setAccentState(chosen);
    localStorage.setItem('cineverse_glow_accent', chosen);
    document.documentElement.setAttribute('data-accent', chosen);
  };

  useEffect(() => {
    // Apply initial accent attribute on mount
    document.documentElement.setAttribute('data-accent', accent);
  }, [accent]);

  const activeTheme = ACCENT_THEMES.find((t) => t.id === accent) || ACCENT_THEMES[0];

  return (
    <ThemeContext.Provider value={{ accent, setAccent, activeTheme, ACCENT_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
