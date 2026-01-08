import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeActions, useThemeMode } from '../../stores/themeStore';
import { GlowButton } from '../ui/GlowButton';
import { Badge } from '../ui/Badge';
import { Breadcrumb } from '../ui/Breadcrumb';

export function TopNavigation() {
  const { user, logout } = useAuth();
  const themeMode = useThemeMode();
  const { toggleTheme } = useThemeActions();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  // Track scroll position - removed as navbar is now static

  // Notifications - will be fetched from API in the future
  const notifications: any[] = [];
  const unreadCount = 0;

  // Get page title from current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/assessments') return 'Assessments';
    if (path === '/submissions') return 'Submissions';
    if (path.startsWith('/admin')) return 'Admin Panel';
    return 'SRM Portal';
  };

  return (
    <header
      className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl"
    >
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-between items-center">
          {/* Left side - page title and breadcrumbs */}
          <div className="flex items-center space-x-6">
            <div>
              <h1 className="text-xl font-semibold text-text">{getPageTitle()}</h1>
              <Breadcrumb className="mt-1" />
            </div>
          </div>

          {/* Right side - actions and user menu */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <GlowButton
              onClick={toggleTheme}
              variant="ghost"
              size="sm"
              aria-label="Toggle theme"
              className="relative"
            >
              <div className="transition-transform duration-300 hover:scale-110">
                {themeMode === 'light' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
            </GlowButton>

            {/* Notifications */}
            <div className="relative">
              <GlowButton
                onClick={() => setShowNotifications(!showNotifications)}
                variant="ghost"
                size="sm"
                className="relative"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {/* Notification badge */}
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-error rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{unreadCount}</span>
                  </div>
                )}
              </GlowButton>

              {/* Notifications backdrop */}
              {showNotifications && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
              )}

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 z-50">
                  <div className="bg-surface/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5">
                    <div className="py-2 max-h-96 overflow-y-auto">
                      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-text">Notifications</h3>
                        {unreadCount > 0 && (
                          <Badge variant="glass" size="sm">{unreadCount} new</Badge>
                        )}
                      </div>

                      <div className="py-1">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <svg className="w-12 h-12 mx-auto text-textSecondary mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-sm text-textSecondary">No notifications</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              key={notification.id}
                              className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-l-2 ${!notification.read ? 'border-primary bg-white/5' : 'border-transparent'
                                }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notification.type === 'success' ? 'bg-success/20' :
                                  notification.type === 'warning' ? 'bg-warning/20' :
                                    'bg-info/20'
                                  }`}>
                                  {notification.type === 'success' && (
                                    <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  {notification.type === 'warning' && (
                                    <svg className="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                  )}
                                  {notification.type === 'info' && (
                                    <svg className="w-4 h-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-text">{notification.title}</p>
                                  <p className="text-xs text-textSecondary mt-1">{notification.message}</p>
                                  <p className="text-xs text-textSecondary mt-1">{notification.time}</p>
                                </div>
                                {!notification.read && (
                                  <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full"></div>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      {notifications.length > 0 && (
                        <div className="border-t border-white/10 py-2">
                          <button className="w-full text-center px-4 py-2 text-sm text-primary hover:bg-white/5 transition-colors">
                            View All Notifications
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 transition-colors duration-200"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-text">{user?.name}</p>
                  <div className="flex items-center justify-end space-x-1">
                    <Badge variant="glass" size="sm">
                      {user?.role}
                    </Badge>
                  </div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center ring-2 ring-white/20">
                  <span className="text-textPrimary text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <svg className="w-4 h-4 text-textSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Click outside to close user menu - render backdrop first */}
              {showUserMenu && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
              )}

              {/* User dropdown menu - render on top of backdrop */}
              {showUserMenu && (
                <div className="absolute right-0 mt-4 w-56 z-50">
                  <div className="bg-surface/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl py-2">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium text-text">{user?.name}</p>
                      <p className="text-xs text-textSecondary truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-error hover:bg-hover transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
