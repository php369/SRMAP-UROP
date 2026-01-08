import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { GlowButton } from '../ui/GlowButton';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { Breadcrumb } from '../ui/Breadcrumb';
import {
  BellIcon,
  InboxIcon,
  ChevronDownIcon,
  LogOutIcon,
  SuccessIcon,
  WarningIcon,
  InfoIcon
} from '../ui/Icons';

export function TopNavigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
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
    <motion.header
      className="sticky top-0 z-30"
      style={{
        backgroundColor: 'transparent',
        boxShadow: 'none'
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <GlassCard
          variant="elevated"
          className="px-6 py-4 transition-all duration-300 shadow-lg bg-surface border-border mx-4 mt-2 rounded-2xl"
        >
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
              {/* Theme toggle removed */}

              {/* Notifications */}
              <div className="relative">
                <GlowButton
                  onClick={() => setShowNotifications(!showNotifications)}
                  variant="ghost"
                  size="sm"
                  className="relative"
                >
                  <BellIcon className="w-5 h-5" />
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
                    <div className="bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
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
                              <InboxIcon className="w-12 h-12 mx-auto text-textSecondary mb-2" />
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
                                      <SuccessIcon className="w-4 h-4 text-success" />
                                    )}
                                    {notification.type === 'warning' && (
                                      <WarningIcon className="w-4 h-4 text-warning" />
                                    )}
                                    {notification.type === 'info' && (
                                      <InfoIcon className="w-4 h-4 text-info" />
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
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center ring-2 ring-white/20">
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <ChevronDownIcon className="w-4 h-4 text-textSecondary" />
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
                    <div className="bg-surface border border-border rounded-2xl shadow-2xl py-2">
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
                          <LogOutIcon className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </motion.header>
  );
}
