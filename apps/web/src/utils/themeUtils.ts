import { ThemeMode, ColorScheme } from '../types';

/**
 * Utility functions for theme-aware styling and operations
 */

/**
 * Generate CSS custom property name from color key
 */
export function getCSSVarName(colorKey: keyof ColorScheme): string {
  return `--color-${colorKey.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
}

/**
 * Get CSS variable reference for use in styles
 */
export function getCSSVar(colorKey: keyof ColorScheme): string {
  return `var(${getCSSVarName(colorKey)})`;
}

/**
 * Generate theme-aware class names
 */
export function themeClass(lightClass: string, darkClass: string, mode: ThemeMode): string {
  return mode === 'dark' ? darkClass : lightClass;
}

/**
 * Generate conditional classes based on theme mode
 */
export function conditionalThemeClass(
  baseClass: string,
  lightModifier?: string,
  darkModifier?: string,
  mode?: ThemeMode
): string {
  if (!mode) return baseClass;
  
  const modifier = mode === 'dark' ? darkModifier : lightModifier;
  return modifier ? `${baseClass} ${modifier}` : baseClass;
}

/**
 * Create theme-aware inline styles
 */
export function themeStyles(
  lightStyles: React.CSSProperties,
  darkStyles: React.CSSProperties,
  mode: ThemeMode
): React.CSSProperties {
  return mode === 'dark' ? { ...lightStyles, ...darkStyles } : lightStyles;
}

/**
 * Generate alpha variant of a color
 */
export function withAlpha(color: string, alpha: number): string {
  // Handle CSS custom properties
  if (color.startsWith('var(')) {
    return `rgba(${color.slice(4, -1)}, ${alpha})`;
  }
  
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  // Handle rgb/rgba colors
  if (color.startsWith('rgb')) {
    const values = color.match(/\d+/g);
    if (values && values.length >= 3) {
      return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${alpha})`;
    }
  }
  
  // Fallback
  return color;
}

/**
 * Check if current theme is dark mode
 */
export function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

/**
 * Check if current theme is light mode
 */
export function isLightMode(): boolean {
  if (typeof document === 'undefined') return true;
  return document.documentElement.getAttribute('data-theme') === 'light';
}

/**
 * Get current theme mode from DOM
 */
export function getCurrentThemeMode(): ThemeMode {
  if (typeof document === 'undefined') return 'light';
  const theme = document.documentElement.getAttribute('data-theme');
  return theme === 'dark' ? 'dark' : 'light';
}

/**
 * Theme-aware color palette for dynamic styling
 */
export const THEME_COLORS = {
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
  },
} as const;

/**
 * Get color value for current theme
 */
export function getThemeColor(
  colorKey: keyof typeof THEME_COLORS.light,
  mode?: ThemeMode
): string {
  const currentMode = mode || getCurrentThemeMode();
  return THEME_COLORS[currentMode][colorKey];
}

export default {
  getCSSVarName,
  getCSSVar,
  themeClass,
  conditionalThemeClass,
  themeStyles,
  withAlpha,
  isDarkMode,
  isLightMode,
  getCurrentThemeMode,
  getThemeColor,
  THEME_COLORS,
};