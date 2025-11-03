import { useThemeStore } from '../../stores/themeStore';
import { designSystem, getGlassBackground, getGlassBorder } from '../../utils/design-system';

export function useTheme() {
  const { mode, theme, toggleTheme, setTheme } = useThemeStore();
  
  const isDark = mode === 'dark';
  
  // Theme-aware utilities
  const glass = {
    background: (variant: 'subtle' | 'default' | 'elevated' | 'strong' = 'default') => 
      getGlassBackground(variant, isDark),
    border: () => getGlassBorder(isDark),
    blur: (intensity: 'sm' | 'md' | 'lg' | 'xl' = 'md') => 
      designSystem.glass.blur[intensity],
  };

  const colors = {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    accent: theme.colors.accent,
    background: theme.colors.background,
    surface: theme.colors.surface,
    text: theme.colors.text,
    textSecondary: theme.colors.textSecondary,
    border: theme.colors.border,
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
    info: theme.colors.info,
  };

  const gradients = {
    primary: theme.colors.primaryGradient,
    mesh: 'radial-gradient(at 40% 20%, hsla(228,100%,74%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0px, transparent 50%)',
  };

  return {
    mode,
    theme,
    isDark,
    toggleTheme,
    setTheme,
    colors,
    gradients,
    glass,
    designSystem,
  };
}