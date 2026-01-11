import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { THEMES, STORAGE_KEYS } from '../utils/constants';

type ThemeMode = 'light' | 'dark';

interface ThemeStore {
  mode: ThemeMode;
  theme: typeof THEMES.LIGHT | typeof THEMES.DARK;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'light',
      theme: THEMES.LIGHT,

      toggleTheme: () => {
        // Theme toggling is disabled in the modern design
        const { mode } = get();
        if (mode !== 'light') {
          set({ mode: 'light', theme: THEMES.LIGHT });
          updateCSSVariables(THEMES.LIGHT);
        }
      },

      setTheme: () => {
        // Force light mode regardless of input
        set({ mode: 'light', theme: THEMES.LIGHT });
        updateCSSVariables(THEMES.LIGHT);
      },
    }),
    {
      name: STORAGE_KEYS.THEME,
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Update CSS variables on hydration
          if (state.theme) {
            updateCSSVariables(state.theme);
          }
        }
      },
    }
  )
);

// Update CSS custom properties
function updateCSSVariables(theme: typeof THEMES.LIGHT | typeof THEMES.DARK) {
  const root = document.documentElement;

  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  // Update data-theme attribute for Tailwind (always light)
  document.documentElement.setAttribute('data-theme', 'light');

  // Remove dark class always
  document.documentElement.classList.remove('dark');
}

// Initialize theme on app start
export const initializeTheme = () => {
  const { theme } = useThemeStore.getState();
  updateCSSVariables(theme);
};

// Selectors
export const useTheme = () => useThemeStore((state) => state.theme);
export const useThemeMode = () => useThemeStore((state) => state.mode);
export const useThemeActions = () => {
  const { toggleTheme, setTheme } = useThemeStore();
  return { toggleTheme, setTheme };
};
