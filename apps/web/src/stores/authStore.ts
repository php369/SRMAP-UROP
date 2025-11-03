import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginCredentials } from '../types';
import { apiClient } from '../utils/api';
import { STORAGE_KEYS } from '../utils/constants';
import { sessionManager } from '../utils/session';

interface AuthStore {
  // State
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshAuthToken: () => Promise<boolean>;
  updateUser: (user: Partial<User>) => void;
  checkAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        
        try {
          const response = await apiClient.post('/auth/google', credentials);
          
          if (response.success && response.data) {
            const { token, refreshToken: refreshTokenValue, user } = response.data as any;
            
            // Store tokens using session manager
            sessionManager.setTokens(token, refreshTokenValue);
            sessionManager.setUserData(user);
            
            set({
              user,
              token,
              refreshToken: refreshTokenValue,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.error?.message || 'Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        // Clear session
        sessionManager.clearTokens();
        sessionManager.stopSessionMonitoring();
        
        // Reset state
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
        
        // Redirect to login
        window.location.href = '/login';
      },

      refreshAuthToken: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          return false;
        }
        
        try {
          const response = await apiClient.post('/auth/refresh', { refreshToken });
          
          if (response.success && response.data) {
            const { token: newToken, refreshToken: newRefreshToken } = response.data as any;
            
            // Update tokens
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
            if (newRefreshToken) {
              localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
            }
            
            set({
              token: newToken,
              refreshToken: newRefreshToken || refreshToken,
            });
            
            return true;
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
        }
        
        return false;
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...userData };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
          set({ user: updatedUser });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        
        // Check session validity
        if (!sessionManager.isValidSession()) {
          set({ isLoading: false });
          return;
        }
        
        const token = sessionManager.getToken();
        const refreshToken = sessionManager.getRefreshToken();
        const userData = sessionManager.getUserData();
        
        if (!token || !userData) {
          set({ isLoading: false });
          return;
        }
        
        try {
          // Verify token with server
          const response = await apiClient.get('/auth/me');
          
          if (response.success && response.data) {
            const user = response.data as User;
            
            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
            
            // Start session monitoring
            sessionManager.startSessionMonitoring();
          } else {
            // Token is invalid, try to refresh
            const refreshed = await get().refreshAuthToken();
            if (!refreshed) {
              get().logout();
            }
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          // Try to refresh token
          const refreshed = await get().refreshAuthToken();
          if (!refreshed) {
            get().logout();
          }
        } finally {
          set({ isLoading: false });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors for easier access
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useUserRole = () => useAuthStore((state) => state.user?.role);

// Auth actions
export const useAuthActions = () => {
  const { login, logout, refreshAuthToken, updateUser, checkAuth, setLoading } = useAuthStore();
  return { login, logout, refreshAuthToken, updateUser, checkAuth, setLoading };
};