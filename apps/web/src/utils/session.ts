import { STORAGE_KEYS } from './constants';

export class SessionManager {
  private static instance: SessionManager;
  private refreshTimer: number | null = null;

  private constructor() { }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Storage helper
  private getStorage(): Storage {
    // @ts-ignore - Dev only feature
    if (import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true') {
      return sessionStorage;
    }
    return localStorage;
  }

  // Token management
  getToken(): string | null {
    return this.getStorage().getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  getRefreshToken(): string | null {
    return this.getStorage().getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  setTokens(token: string, refreshToken: string): void {
    const storage = this.getStorage();
    storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    this.scheduleTokenRefresh(token);
  }

  clearTokens(): void {
    const storage = this.getStorage();
    storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    storage.removeItem(STORAGE_KEYS.USER_DATA);
    this.clearRefreshTimer();
  }

  // User data management
  getUserData(): any | null {
    const storage = this.getStorage();
    const userData = storage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }

  setUserData(userData: any): void {
    this.getStorage().setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  }

  // Token expiration handling
  private parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    const payload = this.parseJWT(token);
    if (!payload || !payload.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  }

  getTokenExpirationTime(token: string): number | null {
    const payload = this.parseJWT(token);
    return payload?.exp ? payload.exp * 1000 : null;
  }

  // Automatic token refresh
  scheduleTokenRefresh(token: string): void {
    this.clearRefreshTimer();

    const expirationTime = this.getTokenExpirationTime(token);
    if (!expirationTime) return;

    // Refresh token 5 minutes before expiration
    const refreshTime = expirationTime - Date.now() - (5 * 60 * 1000);

    if (refreshTime > 0) {
      this.refreshTimer = window.setTimeout(() => {
        this.triggerTokenRefresh();
      }, refreshTime);
    }
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      window.clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private triggerTokenRefresh(): void {
    // Dispatch custom event for token refresh
    window.dispatchEvent(new CustomEvent('token-refresh-needed'));
  }

  // Session validation
  isValidSession(): boolean {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    const userData = this.getUserData();

    if (!token || !refreshToken || !userData) {
      return false;
    }

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      return false;
    }

    return true;
  }

  // Security utilities
  generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Session monitoring
  startSessionMonitoring(): void {
    // Monitor for token refresh events
    window.addEventListener('token-refresh-needed', this.handleTokenRefresh);

    // Monitor for storage changes (multiple tabs)
    window.addEventListener('storage', this.handleStorageChange);

    // Monitor for page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  stopSessionMonitoring(): void {
    window.removeEventListener('token-refresh-needed', this.handleTokenRefresh);
    window.removeEventListener('storage', this.handleStorageChange);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.clearRefreshTimer();
  }

  private handleTokenRefresh = (): void => {
    // This will be handled by the auth store
    console.log('Token refresh needed');
  };

  private handleStorageChange = (event: StorageEvent): void => {
    if (event.key === STORAGE_KEYS.AUTH_TOKEN && !event.newValue) {
      // Token was removed in another tab, logout
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
  };

  private handleVisibilityChange = (): void => {
    if (!document.hidden) {
      // Page became visible, check session validity
      if (!this.isValidSession()) {
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
    }
  };
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
