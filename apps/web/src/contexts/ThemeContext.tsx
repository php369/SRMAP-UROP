import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeContextType, ThemeMode, ThemeConfig } from '../types';
import { MODERN_PALETTE, STORAGE_KEYS } from '../utils/constants';

// Theme configurations based on the modern palette
const LIGHT_THEME: ThemeConfig = {
  mode: 'light',
  colors: {
    bg: MODERN_PALETTE.SLATE_50,
    surface: MODERN_PALETTE.WHITE,
    textPrimary: MODERN_PALETTE.SLATE_900,
    textSecondary: MODERN_PALETTE.SLATE_600,
    accent: MODERN_PALETTE.INDIGO_600,
    highlight: MODERN_PALETTE.BLUE_500,
    border: MODERN_PALETTE.SLATE_200,
    success: MODERN_PALETTE.EMERALD_600,
    warning: MODERN_PALETTE.AMBER_500,
    error: MODERN_PALETTE.RED_500,
    info: MODERN_PALETTE.BLUE_500,
    hover: 'rgba(79, 70, 229, 0.1)',
    active: 'rgba(79, 70, 229, 0.2)',
    focus: MODERN_PALETTE.INDIGO_600,
    glass: 'rgba(255, 255, 255, 0.9)',
    glassBorder: MODERN_PALETTE.SLATE_200,
  },
};

// Dark theme deprecated - identical to light
const DARK_THEME: ThemeConfig = { ...LIGHT_THEME, mode: 'light' };

// Create the theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light'
}) => {
  const [mode, setMode] = useState<ThemeMode>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);

  // Get current theme configuration
  const theme = mode === 'light' ? LIGHT_THEME : DARK_THEME;

  // Load theme from localStorage on mount
  useEffect(() => {
    const loadThemeFromStorage = () => {
      try {
        const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
        if (storedTheme) {
          const parsedTheme = JSON.parse(storedTheme);
          if (parsedTheme.mode === 'light' || parsedTheme.mode === 'dark') {
            setMode(parsedTheme.mode);
          }
        }
      } catch (error) {
        console.warn('Failed to load theme from localStorage:', error);
        // Fallback to default theme
        setMode(defaultTheme);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemeFromStorage();
  }, [defaultTheme]);

  // Apply theme to DOM when theme changes
  useEffect(() => {
    if (isLoading) return;

    const applyThemeToDOM = (themeConfig: ThemeConfig) => {
      const root = document.documentElement;

      // Apply CSS custom properties
      Object.entries(themeConfig.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
      });

      // Set data-theme attribute
      root.setAttribute('data-theme', 'light');

      // Handle Tailwind CSS dark mode class - always remove dark
      root.classList.add('light');
      root.classList.remove('dark');
    };

    applyThemeToDOM(theme);
  }, [theme, isLoading]);

  // Save theme to localStorage when it changes
  useEffect(() => {
    if (isLoading) return;

    // We don't really need to save it anymore since it's always light, but we'll keep it for legacy compat
  }, [mode, isLoading]);

  // Listen for theme changes from other tabs
  useEffect(() => {
    // No-op
  }, [mode]);

  // Toggle - Disabled
  const toggleTheme = () => {
    setMode('light');
  };

  // Set specific theme - Force light
  const setTheme = (newMode: ThemeMode) => {
    setMode('light');
  };

  // Context value
  const contextValue: ThemeContextType = {
    theme,
    mode,
    toggleTheme,
    setTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export theme configurations for external use
export { LIGHT_THEME, DARK_THEME };