/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        srm: {
          50: '#fffbea',
          100: '#fff7c2',
          200: '#ffeaa3',
          300: '#fcd34d',
          400: '#f5bb3e', // Primary Light/Main
          500: '#e59b2e',
          600: '#c49b60', // Primary Dark/Text
          700: '#a1703e',
          800: '#7d5232',
          900: '#5a3b25',
        },
        primary: {
          DEFAULT: '#f5bb3e', // srm-400
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-foreground)',
        },
        accent: {
          DEFAULT: '#c49b60', // srm-600
          foreground: '#ffffff',
        },
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        text: 'var(--color-text)',
        textSecondary: 'var(--color-textSecondary)',
        border: 'var(--color-border)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
