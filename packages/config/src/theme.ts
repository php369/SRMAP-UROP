// Theme configuration for glassmorphism design
export const theme = {
  colors: {
    glass: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.2)',
      strong: 'rgba(255, 255, 255, 0.3)',
    },
    glassDark: {
      light: 'rgba(0, 0, 0, 0.1)',
      medium: 'rgba(0, 0, 0, 0.2)',
      strong: 'rgba(0, 0, 0, 0.3)',
    },
    srm: {
      primary: '#FF6B35',
      secondary: '#004E89',
      accent: '#00A8CC',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    neon: {
      blue: '#00D4FF',
      purple: '#8B5CF6',
      pink: '#EC4899',
      green: '#10B981',
      orange: '#F97316',
      yellow: '#EAB308',
    },
  },
  blur: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  shadows: {
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    glassDark: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    neon: {
      blue: '0 0 20px rgba(0, 212, 255, 0.5)',
      purple: '0 0 20px rgba(139, 92, 246, 0.5)',
      pink: '0 0 20px rgba(236, 72, 153, 0.5)',
      green: '0 0 20px rgba(16, 185, 129, 0.5)',
    },
    glow: {
      sm: '0 0 10px rgba(255, 255, 255, 0.1)',
      md: '0 0 20px rgba(255, 255, 255, 0.2)',
      lg: '0 0 30px rgba(255, 255, 255, 0.3)',
    },
  },
  borderRadius: {
    glass: '16px',
    card: '12px',
    button: '8px',
  },
} as const;

export type Theme = typeof theme;