import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeActions, useThemeMode } from '../../stores/themeStore';
import { useCommandPalette } from '../../hooks/ui/useCommandPalette';
import { GlowButton } from '../ui/GlowButton';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { CommandPalette } from '../ui/CommandPalette';
import { Breadcrumb } from '../ui/Breadcrumb';

export function TopNavigation() {
  const { user, logout } = useAuth();
  const themeMode = useThemeMode();
  const { toggleTheme } = useThemeActions();
  const { isOpen: isCommandPaletteOpen, openCommandPalette, closeCommandPalette } = useCommandPalette();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get page title from current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/assessments') return 'Assessments';
    if (path === '/submissions') return 'Submissions';
    if (path === '/profile') return 'Profile';
    if (path.startsWith('/admin')) return 'Admin Panel';
    return 'SRM Portal';
  };

  return (
    <header className="relative z-30">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <GlassCard variant="default" className="px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Left side - page title and breadcrumbs */}
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-xl font-semibold text-text">{getPageTitle()}</h1>
                <Breadcrumb className="mt-1" />
              </div>
              
              {/* Command palette trigger */}
              <button
                onClick={openCommandPalette}
                className="hidden md:flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-200 text-textSecondary hover:text-text"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm">Search...</span>
                <Badge variant="glass" size="sm">⌘K</Badge>
              </button>
            </div>

            {/* Right side - actions and user menu */}
            <div className="flex items-center space-x-4">
              {/* Command palette button (mobile) */}
              <GlowButton
                onClick={openCommandPalette}
                variant="ghost"
                size="sm"
                className="md:hidden"
                aria-label="Open command palette"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </GlowButton>

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
              <GlowButton
                variant="ghost"
                size="sm"
                className="relative"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 1 6 6v2.25a2.25 2.25 0 0 0 2.25 2.25H21a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1 0-1.5h2.25A2.25 2.25 0 0 0 7.5 12V9.75a6 6 0 0 1 6-6Z" />
                </svg>
                {/* Notification badge */}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full"></div>
              </GlowButton>

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
                    <span className="text-white text-sm font-medium">
                      {user?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-textSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User dropdown menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 z-50">
                    <GlassCard variant="elevated" className="py-2">
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-sm font-medium text-text">{user?.name}</p>
                        <p className="text-xs text-textSecondary">{user?.email}</p>
                      </div>
                      
                      <div className="py-1">
                        <button className="w-full text-left px-4 py-2 text-sm text-textSecondary hover:text-text hover:bg-white/10 transition-colors">
                          Profile Settings
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-textSecondary hover:text-text hover:bg-white/10 transition-colors">
                          Preferences
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-textSecondary hover:text-text hover:bg-white/10 transition-colors">
                          Help & Support
                        </button>
                      </div>
                      
                      <div className="border-t border-white/10 py-1">
                        <button
                          onClick={logout}
                          className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </GlassCard>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={closeCommandPalette} 
      />
    </header>
  );
}