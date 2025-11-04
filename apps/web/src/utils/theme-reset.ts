/**
 * Theme reset utilities for ensuring consistent login page appearance
 */

export const resetToLightTheme = () => {
  // Remove dark mode class
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.add('light');
  
  // Force light theme CSS variables
  document.documentElement.style.setProperty('--bg', '#FAFAFA');
  document.documentElement.style.setProperty('--surface', '#FFFFFF');
  document.documentElement.style.setProperty('--textPrimary', '#0F172A');
  document.documentElement.style.setProperty('--textSecondary', '#64748B');
  document.documentElement.style.setProperty('--border', '#E2E8F0');
  document.documentElement.style.setProperty('--accent', '#6366F1');
  
  // Set body background to white
  document.body.style.backgroundColor = '#ffffff';
  
  console.log('🎨 Reset to light theme for login');
};

export const clearThemeStorage = () => {
  // Clear theme-related storage
  localStorage.removeItem('theme-store');
  sessionStorage.removeItem('theme-store');
  localStorage.removeItem('srm_portal_theme');
  
  console.log('🧹 Cleared theme storage');
};

export const restoreThemeFromStorage = () => {
  // This will be called when navigating away from login
  // Let the theme system restore the user's preferred theme
  const themeStore = localStorage.getItem('theme-store');
  if (themeStore) {
    try {
      const theme = JSON.parse(themeStore);
      if (theme.state?.mode === 'dark') {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
    } catch (error) {
      console.warn('Failed to restore theme from storage:', error);
    }
  }
};