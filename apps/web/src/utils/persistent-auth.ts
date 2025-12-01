/**
 * Enhanced persistent authentication system
 * This ensures users stay logged in like other Google OAuth websites
 */

import { STORAGE_KEYS } from './constants';

interface AuthSession {
  token: string;
  refreshToken: string;
  user: any;
  expiresAt: number;
  lastActivity: number;
  rememberMe: boolean;
}

class PersistentAuth {
  private static instance: PersistentAuth;
  private sessionCheckInterval: number | null = null;
  private readonly SESSION_DURATION = 90 * 24 * 60 * 60 * 1000; // 90 days (extended)
  private readonly ACTIVITY_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days of inactivity (extended)

  private constructor() {
    this.initializeSessionMonitoring();
  }

  static getInstance(): PersistentAuth {
    if (!PersistentAuth.instance) {
      PersistentAuth.instance = new PersistentAuth();
    }
    return PersistentAuth.instance;
  }

  /**
   * Save authentication session with long-term persistence
   */
  saveSession(token: string, refreshToken: string, user: any, rememberMe: boolean = true): void {
    const session: AuthSession = {
      token,
      refreshToken,
      user,
      expiresAt: Date.now() + this.SESSION_DURATION,
      lastActivity: Date.now(),
      rememberMe,
    };

    // Use localStorage for persistent sessions, sessionStorage for temporary
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    storage.setItem('auth_session', JSON.stringify(session));

    // Also save to localStorage as backup even for temporary sessions
    localStorage.setItem('auth_backup', JSON.stringify({
      hasSession: true,
      rememberMe,
      lastLogin: Date.now(),
      sessionId: this.generateSessionId(),
    }));

    this.updateActivity();
    console.log('✅ Session saved successfully', { rememberMe, expiresAt: new Date(session.expiresAt) });
  }

  /**
   * Restore authentication session
   */
  restoreSession(): AuthSession | null {
    // Try localStorage first (persistent sessions)
    let session = this.getSessionFromStorage(localStorage);
    
    // If not found, try sessionStorage (temporary sessions)
    if (!session) {
      session = this.getSessionFromStorage(sessionStorage);
    }

    if (!session) {
      console.log('❌ No session found');
      return null;
    }

    // Check if session is expired
    if (this.isSessionExpired(session)) {
      console.log('⏰ Session expired');
      this.clearSession();
      return null;
    }

    // Check if user has been inactive too long
    if (this.isInactivityExpired(session)) {
      console.log('😴 Session expired due to inactivity');
      this.clearSession();
      return null;
    }

    // Update last activity
    this.updateActivity();
    console.log('✅ Session restored successfully');
    return session;
  }

  /**
   * Update user activity timestamp
   */
  updateActivity(): void {
    const session = this.getCurrentSession();
    if (session) {
      session.lastActivity = Date.now();
      const storage = session.rememberMe ? localStorage : sessionStorage;
      storage.setItem('auth_session', JSON.stringify(session));
    }
  }

  /**
   * Clear all session data
   */
  clearSession(): void {
    // Clear from both storages
    [localStorage, sessionStorage].forEach(storage => {
      storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      storage.removeItem(STORAGE_KEYS.USER_DATA);
      storage.removeItem('auth_session');
    });
    
    localStorage.removeItem('auth_backup');
    console.log('🧹 Session cleared');
  }

  /**
   * Check if user has an existing session (for auto-login)
   */
  hasValidSession(): boolean {
    const session = this.restoreSession();
    return session !== null;
  }

  /**
   * Get current session data
   */
  getCurrentSession(): AuthSession | null {
    // Try localStorage first
    let session = this.getSessionFromStorage(localStorage);
    if (!session) {
      session = this.getSessionFromStorage(sessionStorage);
    }
    return session;
  }

  /**
   * Initialize session monitoring for activity tracking
   */
  private initializeSessionMonitoring(): void {
    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    let activityTimeout: number | null = null;
    
    const trackActivity = () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      
      activityTimeout = window.setTimeout(() => {
        this.updateActivity();
      }, 30000); // Update activity every 30 seconds of activity
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    // Check session validity periodically
    this.sessionCheckInterval = window.setInterval(() => {
      const session = this.getCurrentSession();
      if (session && (this.isSessionExpired(session) || this.isInactivityExpired(session))) {
        this.clearSession();
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
    }, 60000); // Check every minute

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Page became visible, update activity
        this.updateActivity();
      }
    });

    // Handle storage changes (sync across tabs)
    window.addEventListener('storage', (event) => {
      if (event.key === 'auth_session' && !event.newValue) {
        // Session was cleared in another tab
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
    });
  }

  /**
   * Get session from specific storage
   */
  private getSessionFromStorage(storage: Storage): AuthSession | null {
    try {
      const sessionData = storage.getItem('auth_session');
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error parsing session data:', error);
      return null;
    }
  }

  /**
   * Check if session is expired
   */
  private isSessionExpired(session: AuthSession): boolean {
    return Date.now() > session.expiresAt;
  }

  /**
   * Check if user has been inactive too long
   */
  private isInactivityExpired(session: AuthSession): boolean {
    return Date.now() - session.lastActivity > this.ACTIVITY_TIMEOUT;
  }

  /**
   * Extend session expiration
   */
  extendSession(): void {
    const session = this.getCurrentSession();
    if (session) {
      session.expiresAt = Date.now() + this.SESSION_DURATION;
      session.lastActivity = Date.now();
      
      const storage = session.rememberMe ? localStorage : sessionStorage;
      storage.setItem('auth_session', JSON.stringify(session));
      
      console.log('⏰ Session extended');
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Check if session should be automatically extended
   */
  shouldExtendSession(): boolean {
    const session = this.getCurrentSession();
    if (!session) return false;
    
    // Extend if session expires within 7 days and user has been active recently
    const timeUntilExpiry = session.expiresAt - Date.now();
    const timeSinceActivity = Date.now() - session.lastActivity;
    
    return timeUntilExpiry < (7 * 24 * 60 * 60 * 1000) && timeSinceActivity < (24 * 60 * 60 * 1000);
  }

  /**
   * Clean up monitoring
   */
  destroy(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
}

export const persistentAuth = PersistentAuth.getInstance();