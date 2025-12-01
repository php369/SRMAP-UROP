import { ReactNode, useEffect } from 'react';
import { useThemeStore } from '../../stores/themeStore';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, mode } = useThemeStore();

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    // Update CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Update data attributes and classes
    root.setAttribute('data-theme', mode);
    
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, mode]);

  return <>{children}</>;
}
