import { STORAGE_KEYS } from './constants';

/**
 * Theme initialization utility for immediate theme application on page load
 * This prevents flash of unstyled content (FOUC) by applying theme before React hydration
 */

export interface ThemeInitConfig {
  mode: 'light' | 'dark';
}

// Color configurations matching ThemeContext
const THEME_COLORS = {
  light: {
    bg: '#e5e4d3',
    surface: '#c8c3a3',
    textPrimary: '#4a4724',
    textSecondary: '#817f63',
    accent: '#c89643',
    highlight: '#918a41',
    border: '#aaa46c',
    success: '#918a41',
    warning: '#c89643',
    error: '#d4704a',
    info: '#817f63',
    hover: 'rgba(200, 150, 67, 0.1)',
    active: 'rgba(200, 150, 67, 0.2)',
    focus: '#c89643',
    glass: 'rgba(200, 195, 163, 0.7)',
    glassBorder: 'rgba(170, 164, 108, 0.3)',
  },
  dark: {
    bg: '#1f1e17',
    surface: '#2b2a22',
    textPrimary: '#d4b57d',
    textSecondary: '#c8c3a3',
    accent: '#d4b57d',
    highlight: '#c89643',
    border: '#3e3c2f',
    success: '#c89643',
    warning: '#d4b57d',
    error: '#d4704a',
    info: '#c8c3a3',
    hover: 'rgba(212, 181, 125, 0.1)',
    active: 'rgba(212, 181, 125, 0.2)',
    focus: '#d4b57d',
    glass: 'rgba(43, 42, 34, 0.7)',
    glassBorder: 'rgba(62, 60, 47, 0.3)',
  },
};

/**
 * Apply theme colors to CSS custom properties
 */
function applyThemeColors(mode: 'light' | 'dark'): void {
  const root = document.documentElement;
  const colors = THEME_COLORS[mode];

  // Apply CSS custom properties
  Object.entries(colors).forEach(([key, value]) => {
    const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVarName, value);
  });

  // Set data-theme attribute
  root.setAttribute('data-theme', mode);

  // Handle Tailwind CSS dark mode class
  if (mode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}

/**
 * Get theme from localStorage with fallback
 */
function getStoredTheme(): 'light' | 'dark' {
  try {
    const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (storedTheme) {
      const parsed = JSON.parse(storedTheme);
      if (parsed.mode === 'light' || parsed.mode === 'dark') {
        return parsed.mode;
      }
    }
  } catch (error) {
    console.warn('Failed to parse stored theme:', error);
  }

  // Fallback to system preference or light mode
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return 'light';
}

/**
 * Initialize theme immediately on page load
 * Call this function as early as possible to prevent FOUC
 */
export function initializeTheme(): void {
  const mode = getStoredTheme();
  applyThemeColors(mode);
}

/**
 * Set up system theme preference listener
 * This will automatically switch themes when the user changes their system preference
 */
export function setupSystemThemeListener(): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {}; // No-op for SSR
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleSystemThemeChange = (event: MediaQueryListEvent) => {
    // Only apply system theme if no user preference is stored
    try {
      const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (!storedTheme) {
        const newMode = event.matches ? 'dark' : 'light';
        applyThemeColors(newMode);
        localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify({ mode: newMode }));
      }
    } catch (error) {
      console.warn('Failed to handle system theme change:', error);
    }
  };

  // Add listener
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(handleSystemThemeChange);
    return () => mediaQuery.removeListener(handleSystemThemeChange);
  }
}

/**
 * Inline script content for immediate theme initialization
 * This can be injected into the HTML head to prevent FOUC
 */
export const THEME_INIT_SCRIPT = `
(function() {
  try {
    const STORAGE_KEY = '${STORAGE_KEYS.THEME}';
    const stored = localStorage.getItem(STORAGE_KEY);
    let mode = 'light';
    
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.mode === 'light' || parsed.mode === 'dark') {
        mode = parsed.mode;
      }
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      mode = 'dark';
    }
    
    const colors = ${JSON.stringify(THEME_COLORS)};
    const root = document.documentElement;
    
    Object.entries(colors[mode]).forEach(([key, value]) => {
      const cssVarName = '--color-' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(cssVarName, value);
    });
    
    root.setAttribute('data-theme', mode);
    root.classList.add(mode);
    root.classList.remove(mode === 'light' ? 'dark' : 'light');
  } catch (error) {
    console.warn('Theme initialization failed:', error);
  }
})();
`;

export default {
  initializeTheme,
  setupSystemThemeListener,
  THEME_INIT_SCRIPT,
};