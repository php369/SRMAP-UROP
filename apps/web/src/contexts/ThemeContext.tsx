import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeContextType, ThemeMode, ThemeConfig } from '../types';
import { EARTH_PALETTE, STORAGE_KEYS } from '../utils/constants';

// Theme configurations based on the earth-toned color palette
const LIGHT_THEME: ThemeConfig = {
  mode: 'light',
  colors: {
    bg: EARTH_PALETTE.SATIN_LINEN,
    surface: EARTH_PALETTE.CORAL_REEF,
    textPrimary: EARTH_PALETTE.WOODLAND,
    textSecondary: EARTH_PALETTE.FLAX_SMOKE,
    accent: EARTH_PALETTE.TUSSOCK,
    highlight: EARTH_PALETTE.SYCAMORE,
    border: EARTH_PALETTE.GREEN_SMOKE,
    success: EARTH_PALETTE.SYCAMORE,
    warning: EARTH_PALETTE.TUSSOCK,
    error: '#d4704a',
    info: EARTH_PALETTE.FLAX_SMOKE,
    hover: 'rgba(200, 150, 67, 0.1)',
    active: 'rgba(200, 150, 67, 0.2)',
    focus: EARTH_PALETTE.TUSSOCK,
    glass: 'rgba(200, 195, 163, 0.7)',
    glassBorder: 'rgba(170, 164, 108, 0.3)',
  },
};

const DARK_THEME: ThemeConfig = {
  mode: 'dark',
  colors: {
    bg: '#1f1e17',
    surface: '#2b2a22',
    textPrimary: EARTH_PALETTE.STRAW,
    textSecondary: EARTH_PALETTE.CORAL_REEF,
    accent: EARTH_PALETTE.STRAW,
    highlight: EARTH_PALETTE.TUSSOCK,
    border: '#3e3c2f',
    success: EARTH_PALETTE.TUSSOCK,
    warning: EARTH_PALETTE.STRAW,
    error: '#d4704a',
    info: EARTH_PALETTE.CORAL_REEF,
    hover: 'rgba(212, 181, 125, 0.1)',
    active: 'rgba(212, 181, 125, 0.2)',
    focus: EARTH_PALETTE.STRAW,
    glass: 'rgba(43, 42, 34, 0.7)',
    glassBorder: 'rgba(62, 60, 47, 0.3)',
  },
};

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
      root.setAttribute('data-theme', themeConfig.mode);

      // Handle Tailwind CSS dark mode class
      if (themeConfig.mode === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    };

    applyThemeToDOM(theme);
  }, [theme, isLoading]);

  // Save theme to localStorage when it changes
  useEffect(() => {
    if (isLoading) return;

    try {
      localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify({ mode }));
      
      // Dispatch storage event for cross-tab synchronization
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEYS.THEME,
        newValue: JSON.stringify({ mode }),
        storageArea: localStorage,
      }));
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [mode, isLoading]);

  // Listen for theme changes from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.THEME && event.newValue) {
        try {
          const parsedTheme = JSON.parse(event.newValue);
          if (parsedTheme.mode && parsedTheme.mode !== mode) {
            setMode(parsedTheme.mode);
          }
        } catch (error) {
          console.warn('Failed to parse theme from storage event:', error);
        }
      }
    };

    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [mode]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  // Set specific theme
  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
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