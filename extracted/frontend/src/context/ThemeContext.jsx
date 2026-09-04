import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);

export const COLOR_THEMES = [
  { id: 'default', label: '', primary: '217 91% 60%', ring: '217 91% 60%', darkPrimary: '217 91% 60%', darkRing: '217 91% 60%' },
  { id: 'blue', label: '', primary: '221 83% 53%', ring: '221 83% 53%', darkPrimary: '217 91% 60%', darkRing: '217 91% 60%' },
  { id: 'green', label: '', primary: '142 71% 45%', ring: '142 71% 45%', darkPrimary: '142 69% 58%', darkRing: '142 69% 58%' },
  { id: 'purple', label: '', primary: '262 83% 58%', ring: '262 83% 58%', darkPrimary: '263 70% 66%', darkRing: '263 70% 66%' },
  { id: 'rose', label: '', primary: '347 77% 50%', ring: '347 77% 50%', darkPrimary: '347 77% 60%', darkRing: '347 77% 60%' },
  { id: 'orange', label: '', primary: '25 95% 53%', ring: '25 95% 53%', darkPrimary: '25 95% 58%', darkRing: '25 95% 58%' }
];

const MODE_KEY = 'hoshiar_theme_mode';
const COLOR_KEY = 'hoshiar_color_theme';
const TEXT_KEY = 'hoshiar_text_size';

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => localStorage.getItem(MODE_KEY) || 'system');
  const [colorTheme, setColorThemeState] = useState(() => localStorage.getItem(COLOR_KEY) || 'default');
  const [textSize, setTextSizeState] = useState(() => localStorage.getItem(TEXT_KEY) || 'medium');

  const [isDark, setIsDark] = useState(false);

  // resolve system mode
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = mode === 'dark' || (mode === 'system' && mq.matches);
      setIsDark(dark);
      document.documentElement.classList.toggle('dark', dark);
    };
    apply();
    if (mode === 'system') {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [mode]);

  // apply color theme
  useEffect(() => {
    const theme = COLOR_THEMES.find((c) => c.id === colorTheme) || COLOR_THEMES[0];
    const root = document.documentElement;
    const dark = document.documentElement.classList.contains('dark');
    const primary = dark ? theme.darkPrimary : theme.primary;
    const ring = dark ? theme.darkRing : theme.ring;
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--ring', ring);
    root.style.setProperty('--sidebar-primary', primary);
  }, [colorTheme, isDark]);

  // apply text size
  useEffect(() => {
    const root = document.documentElement;
    const sizes = { small: '15px', medium: '16px', large: '18px' };
    root.style.fontSize = sizes[textSize] || '16px';
  }, [textSize]);

  const setMode = useCallback((m) => {
    setModeState(m);
    localStorage.setItem(MODE_KEY, m);
  }, []);
  const setColorTheme = useCallback((c) => {
    setColorThemeState(c);
    localStorage.setItem(COLOR_KEY, c);
  }, []);
  const setTextSize = useCallback((s) => {
    setTextSizeState(s);
    localStorage.setItem(TEXT_KEY, s);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ mode, setMode, colorTheme, setColorTheme, textSize, setTextSize, isDark, colorThemes: COLOR_THEMES }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}