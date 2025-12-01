// Comprehensive theme preloader to prevent FOUC (Flash of Unstyled Content)
// This ensures consistent theme application before React renders

export const preloadTheme = () => {
  const root = document.documentElement;
  
  // Theme color definitions
  const themes = {
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
      textSecondary: '#a89b7a',
      accent: '#c89643',
      highlight: '#918a41',
      border: '#3e3c2f',
      success: '#918a41',
      warning: '#c89643',
      error: '#d4704a',
      info: '#c8c3a3',
      hover: 'rgba(200, 150, 67, 0.1)',
      active: 'rgba(200, 150, 67, 0.2)',
      focus: '#c89643',
      glass: 'rgba(43, 42, 34, 0.8)',
      glassBorder: 'rgba(62, 60, 47, 0.4)',
    }
  };

  // Determine theme mode (always default to light for first-time users)
  let mode = 'light';
  try {
    const stored = localStorage.getItem('srm_portal_theme');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.mode === 'light' || parsed.mode === 'dark') {
        mode = parsed.mode;
      }
    }
  } catch (error) {
    console.warn('Theme preloader: Failed to parse stored theme, using light mode');
  }

  // Apply theme colors
  const colors = themes[mode as keyof typeof themes];
  Object.entries(colors).forEach(([key, value]) => {
    const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVarName, value);
  });

  // Set theme attributes and classes
  root.setAttribute('data-theme', mode);
  root.classList.add(mode);
  root.classList.remove(mode === 'light' ? 'dark' : 'light');

  // Add theme transition class for smooth changes
  root.classList.add('theme-transition');

  // Add CSS for theme transitions if not already present
  if (!document.getElementById('theme-transitions')) {
    const style = document.createElement('style');
    style.id = 'theme-transitions';
    style.textContent = `
      .theme-transition {
        transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
      }
      
      .theme-transition * {
        transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
      }
      
      /* Prevent flash during initial load */
      html:not(.theme-loaded) {
        visibility: hidden;
      }
      
      html.theme-loaded {
        visibility: visible;
      }
    `;
    document.head.appendChild(style);
  }

  // Mark theme as loaded
  root.classList.add('theme-loaded');
  
  console.log(`🎨 Theme preloader: Applied ${mode} theme`);
};

// Enhanced theme application with error handling
export const applyTheme = (mode: 'light' | 'dark') => {
  try {
    const root = document.documentElement;
    
    const themes = {
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
        textSecondary: '#a89b7a',
        accent: '#c89643',
        highlight: '#918a41',
        border: '#3e3c2f',
        success: '#918a41',
        warning: '#c89643',
        error: '#d4704a',
        info: '#c8c3a3',
        hover: 'rgba(200, 150, 67, 0.1)',
        active: 'rgba(200, 150, 67, 0.2)',
        focus: '#c89643',
        glass: 'rgba(43, 42, 34, 0.8)',
        glassBorder: 'rgba(62, 60, 47, 0.4)',
      }
    };

    const colors = themes[mode];
    Object.entries(colors).forEach(([key, value]) => {
      const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });

    root.setAttribute('data-theme', mode);
    root.classList.add(mode);
    root.classList.remove(mode === 'light' ? 'dark' : 'light');
    
    console.log(`🎨 Theme applied: ${mode}`);
  } catch (error) {
    console.error('Theme application failed:', error);
  }
};

// Call immediately when script loads
if (typeof window !== 'undefined') {
  // Apply theme immediately to prevent FOUC
  preloadTheme();
  
  // Listen for theme changes from other tabs
  window.addEventListener('storage', (event) => {
    if (event.key === 'srm_portal_theme' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed.mode === 'light' || parsed.mode === 'dark') {
          applyTheme(parsed.mode);
        }
      } catch (error) {
        console.warn('Failed to sync theme from storage event');
      }
    }
  });
}