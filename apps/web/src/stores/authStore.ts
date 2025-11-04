import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginCredentials } from '../types';
import { apiClient } from '../utils/api';
import { STORAGE_KEYS } from '../utils/constants';
import { sessionManager } from '../utils/session';
import { persistentAuth } from '../utils/persistent-auth';
import { clearThemeStorage } from '../utils/theme-reset';

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
    (set, get) => {
      // Set up session expiration listeners
      if (typeof window !== 'undefined') {
        window.addEventListener('session-expired', () => {
          console.log('🔔 Session expired event received');
          get().logout();
        });
        
        window.addEventListener('token-refresh-needed', async () => {
          console.log('🔔 Token refresh needed event received');
          const refreshed = await get().refreshAuthToken();
          if (!refreshed) {
            get().logout();
          }
        });
      }
      
      return {
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
            
            // Store tokens using both session manager and persistent auth
            sessionManager.setTokens(token, refreshTokenValue);
            sessionManager.setUserData(user);
            
            // Get remember me preference from session storage
            const rememberMe = sessionStorage.getItem('remember_me') === 'true';
            
            // Save persistent session with user preference
            if (refreshTokenValue) {
              persistentAuth.saveSession(token, refreshTokenValue, user, rememberMe);
            }
            
            // Clear the temporary preference
            sessionStorage.removeItem('remember_me');
            
            set({
              user,
              token,
              refreshToken: refreshTokenValue,
              isAuthenticated: true,
              isLoading: false,
            });

            console.log('✅ Login successful - session will persist');
          } else {
            throw new Error(response.error?.message || 'Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        // Clear all sessions
        sessionManager.clearTokens();
        sessionManager.stopSessionMonitoring();
        persistentAuth.clearSession();
        
        // Reset state
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
        
        // Clear theme state to ensure login page shows in light mode
        clearThemeStorage();
        
        console.log('👋 Logged out successfully');
        
        // Redirect to login
        window.location.href = '/login';
      },

      refreshAuthToken: async () => {
        const { refreshToken, user } = get();
        
        if (!refreshToken) {
          console.log('❌ No refresh token available');
          return false;
        }
        
        try {
          console.log('🔄 Attempting to refresh token...');
          const response = await apiClient.post('/auth/refresh', { refreshToken });
          
          if (response.success && response.data) {
            const { token: newToken, refreshToken: newRefreshToken } = response.data as any;
            
            // Update tokens in all storage systems
            sessionManager.setTokens(newToken, newRefreshToken || refreshToken);
            
            if (user && (newRefreshToken || refreshToken)) {
              // Update persistent session
              const currentSession = persistentAuth.getCurrentSession();
              const rememberMe = currentSession?.rememberMe ?? true;
              persistentAuth.saveSession(newToken, newRefreshToken || refreshToken, user, rememberMe);
            }
            
            set({
              token: newToken,
              refreshToken: newRefreshToken || refreshToken,
            });
            
            console.log('✅ Token refreshed successfully');
            return true;
          } else {
            console.log('❌ Token refresh failed:', response.error);
          }
        } catch (error) {
          console.error('❌ Token refresh error:', error);
          // Don't logout immediately, give user a chance to re-authenticate
          return false;
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
        
        try {
          // First, try to restore from persistent session
          const persistentSession = persistentAuth.restoreSession();
          
          if (persistentSession) {
            console.log('🔄 Restoring session from persistent storage');
            
            // Check if token is expired
            if (sessionManager.isTokenExpired(persistentSession.token)) {
              console.log('🔄 Token expired, attempting refresh...');
              
              // Try to refresh the token
              const refreshResponse = await apiClient.post('/auth/refresh', { 
                refreshToken: persistentSession.refreshToken 
              });
              
              if (refreshResponse.success && refreshResponse.data) {
                const { token: newToken, refreshToken: newRefreshToken } = refreshResponse.data as any;
                
                // Update session with new tokens
                persistentSession.token = newToken;
                if (newRefreshToken) {
                  persistentSession.refreshToken = newRefreshToken;
                }
                
                // Save updated session
                persistentAuth.saveSession(
                  persistentSession.token, 
                  persistentSession.refreshToken, 
                  persistentSession.user, 
                  persistentSession.rememberMe
                );
                
                console.log('✅ Token refreshed during auth check');
              } else {
                console.log('❌ Token refresh failed during auth check');
                persistentAuth.clearSession();
                set({ isLoading: false });
                return;
              }
            }
            
            set({
              user: persistentSession.user,
              token: persistentSession.token,
              refreshToken: persistentSession.refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
            
            // Start session monitoring
            sessionManager.startSessionMonitoring();
            
            // Verify with server in background (don't block UI)
            apiClient.get('/auth/me').then(response => {
              if (response.success && response.data) {
                const user = response.data as User;
                set({ user });
                persistentAuth.updateActivity();
              }
            }).catch(async () => {
              // If verification fails, try to refresh token
              const refreshed = await get().refreshAuthToken();
              if (!refreshed) {
                console.log('❌ Session verification failed, logging out');
                get().logout();
              }
            });
            
            return;
          }
          
          // Fallback to session manager check
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
            
            // Save to persistent storage with remember me enabled by default
            if (refreshToken) {
              persistentAuth.saveSession(token, refreshToken, user, true);
            }
            
            // Start session monitoring
            sessionManager.startSessionMonitoring();
          } else {
            // Token is invalid, try to refresh
            const refreshed = await get().refreshAuthToken();
            if (!refreshed) {
              console.log('❌ Auth check failed, logging out');
              get().logout();
            }
          }
        } catch (error) {
          console.error('❌ Auth check error:', error);
          // Try to refresh token as last resort
          const refreshed = await get().refreshAuthToken();
          if (!refreshed) {
            console.log('❌ Final auth check failed, logging out');
            get().logout();
          }
        } finally {
          set({ isLoading: false });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      };
    },
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
