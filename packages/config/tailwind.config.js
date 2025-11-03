/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './apps/web/index.html',
    './apps/web/src/**/*.{js,ts,jsx,tsx}',
    './packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Glassmorphism color palette
        glass: {
          50: 'rgba(255, 255, 255, 0.1)',
          100: 'rgba(255, 255, 255, 0.2)',
          200: 'rgba(255, 255, 255, 0.3)',
          300: 'rgba(255, 255, 255, 0.4)',
          400: 'rgba(255, 255, 255, 0.5)',
          500: 'rgba(255, 255, 255, 0.6)',
          600: 'rgba(255, 255, 255, 0.7)',
          700: 'rgba(255, 255, 255, 0.8)',
          800: 'rgba(255, 255, 255, 0.9)',
          900: 'rgba(255, 255, 255, 1)',
        },
        'glass-dark': {
          50: 'rgba(0, 0, 0, 0.1)',
          100: 'rgba(0, 0, 0, 0.2)',
          200: 'rgba(0, 0, 0, 0.3)',
          300: 'rgba(0, 0, 0, 0.4)',
          400: 'rgba(0, 0, 0, 0.5)',
          500: 'rgba(0, 0, 0, 0.6)',
          600: 'rgba(0, 0, 0, 0.7)',
          700: 'rgba(0, 0, 0, 0.8)',
          800: 'rgba(0, 0, 0, 0.9)',
          900: 'rgba(0, 0, 0, 1)',
        },
        // SRM Brand colors
        srm: {
          primary: '#FF6B35',
          secondary: '#004E89',
          accent: '#00A8CC',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
        },
        // Neon glow colors
        neon: {
          blue: '#00D4FF',
          purple: '#8B5CF6',
          pink: '#EC4899',
          green: '#10B981',
          orange: '#F97316',
          yellow: '#EAB308',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        'glass-gradient-dark': 'linear-gradient(135deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.05))',
        'neon-gradient': 'linear-gradient(45deg, #00D4FF, #8B5CF6, #EC4899)',
        'srm-gradient': 'linear-gradient(135deg, #FF6B35, #004E89, #00A8CC)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'neon-blue': '0 0 20px rgba(0, 212, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(139, 92, 246, 0.5)',
        'neon-pink': '0 0 20px rgba(236, 72, 153, 0.5)',
        'neon-green': '0 0 20px rgba(16, 185, 129, 0.5)',
        'glow-sm': '0 0 10px rgba(255, 255, 255, 0.1)',
        'glow-md': '0 0 20px rgba(255, 255, 255, 0.2)',
        'glow-lg': '0 0 30px rgba(255, 255, 255, 0.3)',
      },
      borderRadius: {
        'glass': '16px',
        '4xl': '2rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'gradient': 'gradient 15s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)' },
          '100%': { boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    function({ addUtilities }) {
      const newUtilities = {
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        },
        '.glass-border': {
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
        },
        '.glass-border-dark': {
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
        },
        '.neon-border': {
          border: '1px solid transparent',
          backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)), linear-gradient(45deg, #00D4FF, #8B5CF6, #EC4899)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'content-box, border-box',
        },
        '.magnetic': {
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.magnetic:hover': {
          transform: 'translateY(-2px) scale(1.02)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};