import { useTheme as useThemeContext } from '../../contexts/ThemeContext';

/**
 * Custom hook for theme management
 * Provides convenient access to theme state and actions
 */
export const useTheme = () => {
  const context = useThemeContext();
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return {
    // Theme state
    theme: context.theme,
    mode: context.mode,
    isLoading: context.isLoading,
    
    // Theme actions
    toggleTheme: context.toggleTheme,
    setTheme: context.setTheme,
    
    // Convenience getters
    isDark: context.mode === 'dark',
    isLight: context.mode === 'light',
    
    // Color access helpers
    colors: context.theme.colors,
    
    // CSS variable helpers
    getCSSVar: (colorKey: keyof typeof context.theme.colors) => {
      const cssVarName = `--color-${colorKey.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      return `var(${cssVarName})`;
    },
    
    // Theme-aware class helpers
    getThemeClass: (lightClass: string, darkClass: string) => {
      return context.mode === 'dark' ? darkClass : lightClass;
    },
  };
};

export default useTheme;