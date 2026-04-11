import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, LoginCredentials } from '../types';
import { apiClient } from '../utils/api';
import { STORAGE_KEYS } from '../utils/constants';
import { sessionManager } from '../utils/session';
import { persistentAuth } from '../utils/persistent-auth';
import { clearThemeStorage } from '../utils/theme-reset';
import { tokenRefreshQueue } from '../utils/tokenRefreshQueue';

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
  refreshUserData: () => Promise<boolean>;
  checkAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => {
      // Set up session expiration listeners
      if (typeof window !== 'undefined') {
        window.addEventListener('session-expired' as any, () => {
          console.log('🔔 Session expired event received');
          console.trace('Session expired stack trace:');
          get().logout();
        });

        window.addEventListener('token-refresh-needed' as any, async () => {
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
        isLoading: true, // Set to true by default to prevent premature login redirects on refresh

        // Actions
        login: async (credentials: LoginCredentials) => {
          set({ isLoading: true });

          try {
            const response = await apiClient.post('/auth/google', credentials);

            if (response.success && response.data) {
              const { token, refreshToken: refreshTokenValue, user } = response.data as any;

              console.log('💾 Saving user data during login:', user);

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
          } catch (error: any) {
            set({ isLoading: false });

            // If it's an API error with structured response, pass it through
            if (error?.response?.data) {
              const apiError = new Error(JSON.stringify(error.response.data));
              throw apiError;
            }

            // Otherwise, throw the original error
            throw error;
          }
        },

        logout: () => {
          console.log('🚪 Logout called');
          console.trace('Logout stack trace:');

          // Clear token refresh queue
          tokenRefreshQueue.clear();

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
          // Use token refresh queue to prevent multiple simultaneous refreshes
          return tokenRefreshQueue.refresh(async () => {
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
          });
        },

        updateUser: (userData: Partial<User>) => {
          const { user } = get();
          if (user) {
            const updatedUser = { ...user, ...userData };
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
            set({ user: updatedUser });
          }
        },

        refreshUserData: async () => {
          try {
            const response = await apiClient.get<{ user: User }>('/auth/me');

            if (response.success && response.data?.user) {
              const updatedUser = response.data.user;

              // Update user in all storage systems
              sessionManager.setUserData(updatedUser);
              localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

              // Update persistent session if it exists
              const currentSession = persistentAuth.getCurrentSession();
              if (currentSession) {
                persistentAuth.saveSession(
                  currentSession.token,
                  currentSession.refreshToken,
                  updatedUser,
                  currentSession.rememberMe
                );
              }

              set({ user: updatedUser });

              console.log('✅ User data refreshed:', updatedUser);
              return true;
            }

            return false;
          } catch (error: any) {
            console.error('❌ Failed to refresh user data:', error);

            // Check if error implies we should logout (401/404)
            const errorMessage = error?.message?.toLowerCase() || '';
            const isAuthError =
              errorMessage.includes('401') ||
              errorMessage.includes('404') ||
              errorMessage.includes('unauthorized') ||
              errorMessage.includes('not found') ||
              errorMessage.includes('access revoked') ||
              errorMessage.includes('user not found');

            if (isAuthError) {
              console.error('❌ Critical auth error during refresh - logging out');
              get().logout();
            }

            return false;
          }
        },

        checkAuth: async () => {
          set({ isLoading: true });

          /* ----------------------------------------------------- */
          /*  MOCK AUTH START - DELETE THIS BLOCK BEFORE PRODUCTION */
          /* ----------------------------------------------------- */
          if (import.meta.env.DEV) {
            try {
              const urlParams = new URLSearchParams(window.location.search);
              const mockRole = urlParams.get('mock_role');
              const mockToken = urlParams.get('mock_token');

              if (mockRole) {
                // FORCE SESSION STORAGE ISOLATION
                sessionManager.enableSessionStorage();

                // Dynamic import to avoid bundling mock data in production
                const { getMockUser } = await import('../utils/mockAuth');
                const mockUser = getMockUser(mockRole);

                if (mockUser) {
                  console.log(`🕵️‍♂️ MOCK AUTH (Localhost): Logging in as ${mockRole}`, mockUser);

                  // MOCK TOKEN handling
                  if (mockToken) {
                    console.log('🔑 MOCK AUTH: Injecting backend token from URL');
                    sessionManager.setTokens(mockToken, 'mock-refresh-token');
                    // Save to session storage (rememberMe = false forces session storage in persistentAuth)
                    persistentAuth.saveSession(mockToken, 'mock-refresh-token', mockUser, false);

                    set({
                      user: mockUser,
                      token: mockToken,
                      refreshToken: 'mock-refresh-token',
                      isAuthenticated: true,
                      isLoading: false,
                    });
                    return;
                  }
                }
              }
            } catch (e) {
              console.error('Mock auth failed', e);
            }
          }
          /* ----------------------------------------------------- */
          /*  MOCK AUTH END                                       */
          /* ----------------------------------------------------- */

          try {
            // First, try to restore from persistent session
            const persistentSession = persistentAuth.restoreSession();

            if (!persistentSession) {
              console.log('ℹ️ No persistent session found, resetting auth loading state');
              set({ isLoading: false });
              return;
            }

            if (persistentSession) {
              console.log('🔄 Restoring session from persistent storage');
              console.log('📦 Restored user data:', persistentSession.user);

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

              // Validate user data has required fields
              console.log('🔍 Checking stored user data:', persistentSession.user);
              const hasValidUserData = persistentSession.user &&
                persistentSession.user.name &&
                persistentSession.user.email;

              console.log('✅ User data valid?', hasValidUserData);

              if (!hasValidUserData) {
                console.warn('⚠️ Stored user data is incomplete, fetching from server...');
                // User data is incomplete, must fetch from server before proceeding
                try {
                  const response = await apiClient.get('/auth/me');
                  if (response.success && response.data) {
                    const user = response.data as User;
                    persistentSession.user = user;
                    // Save to BOTH systems
                    persistentAuth.saveSession(
                      persistentSession.token,
                      persistentSession.refreshToken,
                      user,
                      persistentSession.rememberMe
                    );
                    sessionManager.setUserData(user);
                  } else {
                    console.error('❌ Failed to fetch user data');
                    persistentAuth.clearSession();
                    set({ isLoading: false });
                    return;
                  }
                } catch (error) {
                  console.error('❌ Error fetching user data:', error);
                  persistentAuth.clearSession();
                  set({ isLoading: false });
                  return;
                }
              }

              // Sync with sessionManager to keep both systems in sync
              sessionManager.setTokens(persistentSession.token, persistentSession.refreshToken);
              sessionManager.setUserData(persistentSession.user);

              // ⚠️ CRITICAL BUG FIX (PROACTIVE VALIDATION) ⚠️
              // Instead of doing verification in background, we now WAIT for it.
              // This prevents "Go to Dashboard" button from showing with stale user data.
              
              try {
                const response = await apiClient.get('/auth/me');
                if (response.success && response.data) {
                  const userData = response.data as any;
                  const user = userData.user || userData; // Handle both response formats
                  
                  console.log('✅ Session verified with server:', user);
                  
                  // Sync with sessionManager to keep both systems in sync
                  sessionManager.setTokens(persistentSession.token, persistentSession.refreshToken);
                  sessionManager.setUserData(user);
                  
                  // Save updated session
                  persistentAuth.saveSession(
                    persistentSession.token,
                    persistentSession.refreshToken,
                    user,
                    persistentSession.rememberMe
                  );

                  set({
                    user,
                    token: persistentSession.token,
                    refreshToken: persistentSession.refreshToken,
                    isAuthenticated: true,
                    isLoading: false,
                  });
                  
                  // Start session monitoring
                  sessionManager.startSessionMonitoring();
                } else {
                  console.error('❌ Server verification failed - logging out');
                  get().logout();
                }
              } catch (error) {
                console.warn('⚠️ Background session verification failed:', error);
                const err = error as any;
                const errorMessage = (err?.message || err?.toString() || '').toLowerCase();
                const isAuthError = 
                  errorMessage.includes('401') || 
                  errorMessage.includes('404') || 
                  errorMessage.includes('unauthorized') || 
                  errorMessage.includes('not found') ||
                  errorMessage.includes('access revoked') ||
                  errorMessage.includes('user not found');

                if (isAuthError) {
                  console.error('❌ Critical auth error - session is stale. Logging out.');
                  get().logout();
                } else {
                  // For network errors, we can allow the user to see the dashboard 
                  // but we should still set loading to false.
                  console.log('⚠️ Network error during verification, proceeding with cached data');
                  set({
                    user: persistentSession.user,
                    token: persistentSession.token,
                    refreshToken: persistentSession.refreshToken,
                    isAuthenticated: true,
                    isLoading: false,
                  });
                }
              }
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
          } catch (error: any) {
            // Only log unexpected errors, not expired tokens (which are normal)
            if (!error?.message?.includes('expired')) {
              console.error('❌ Auth check error:', error);
            }

            // Only logout on explicit auth errors (401, 403), not on network/server errors
            if (error?.message?.includes('401') || error?.message?.includes('403') || error?.message?.includes('UNAUTHORIZED')) {
              console.log('🔄 Session expired, please login again');
              get().logout();
            } else if (error?.message?.includes('expired')) {
              // Token expired - silent logout
              get().logout();
            } else {
              // For other errors (network, 500, etc.), keep the session and let monitoring handle it
              console.warn('⚠️ Non-auth error during check, keeping session active');
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
      // @ts-ignore
      storage: createJSONStorage(() => {
        // Use sessionStorage if in DEV mode AND using mock auth parameters
        // This ensures tab isolation for testing different roles
        if (typeof window !== 'undefined' && import.meta.env.DEV) {
          const params = new URLSearchParams(window.location.search);
          if (params.has('mock_role')) {
            return sessionStorage;
          }
        }
        return localStorage;
      }),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        // isAuthenticated is intentionally NOT persisted to prevent stale session bugs.
        // It is re-validated by checkAuth() on every page load.
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
