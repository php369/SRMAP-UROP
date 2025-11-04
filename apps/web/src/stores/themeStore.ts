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
        const { mode } = get();
        const newMode = mode === 'light' ? 'dark' : 'light';
        const newTheme = newMode === 'light' ? THEMES.LIGHT : THEMES.DARK;
        
        set({ mode: newMode, theme: newTheme });
        
        // Update CSS custom properties
        updateCSSVariables(newTheme);
      },

      setTheme: (mode: ThemeMode) => {
        const newTheme = mode === 'light' ? THEMES.LIGHT : THEMES.DARK;
        
        set({ mode, theme: newTheme });
        
        // Update CSS custom properties
        updateCSSVariables(newTheme);
      },
    }),
    {
      name: STORAGE_KEYS.THEME,
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Update CSS variables on hydration
          updateCSSVariables(state.theme);
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
  
  // Update data-theme attribute for Tailwind dark mode
  document.documentElement.setAttribute('data-theme', theme.mode);
  
  // Update class for Tailwind dark mode
  if (theme.mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
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
