import { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { ROLE_NAVIGATION, ROUTES } from '../../utils/constants';
import { cn } from '../../utils/cn';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { SessionStatus } from '../auth/SessionStatus';
import { useSwipeGesture } from '../../hooks/ui/useSwipeGesture';

// Icon components for navigation
const IconComponents = {
  Home: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  FileText: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  FolderOpen: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  ),
  Upload: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  ),
  Award: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
      />
    </svg>
  ),
  User: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  Users: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
      />
    </svg>
  ),
  BookOpen: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  ),
  BarChart3: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  CheckCircle: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  if (!user) {
    return null;
  }

  const navigationItems = ROLE_NAVIGATION[user.role] || [];

  // Handle mobile sidebar open/close
  const openMobileSidebar = useCallback(() => {
    if (window.innerWidth < 1024) {
      setIsAnimating(true);
      setIsMobileOpen(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, []);

  const closeMobileSidebar = useCallback(() => {
    if (window.innerWidth < 1024) {
      setIsAnimating(true);
      setIsMobileOpen(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, []);

  // Swipe gesture support for mobile sidebar
  const swipeRef = useSwipeGesture({
    onSwipeRight: () => openMobileSidebar(),
    onSwipeLeft: () => closeMobileSidebar(),
    threshold: 50,
    velocityThreshold: 0.3,
    preventScroll: true,
    enabled: window.innerWidth < 1024,
  });

  // Close mobile sidebar on route change
  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname, closeMobileSidebar]);

  // Handle escape key and custom events for mobile sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileSidebar();
      }
    };

    const handleOpenSidebar = () => openMobileSidebar();
    const handleCloseSidebar = () => closeMobileSidebar();

    if (isMobileOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Listen for custom events from AppLayout
    document.addEventListener('open-mobile-sidebar', handleOpenSidebar);
    document.addEventListener('close-mobile-sidebar', handleCloseSidebar);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('open-mobile-sidebar', handleOpenSidebar);
      document.removeEventListener('close-mobile-sidebar', handleCloseSidebar);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen, openMobileSidebar, closeMobileSidebar]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarContent = (
    <div
      className={cn(
        'flex flex-col h-full transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        {isCollapsed ? (
          <img
            src="/branding/srm-icon.svg"
            alt="SRM University-AP"
            className="w-8 h-8"
          />
        ) : (
          <div className="flex items-center space-x-3">
            <img
              src="/branding/srm-icon.svg"
              alt="SRM University-AP"
              className="w-8 h-8"
            />
            <div>
              <h1 className="text-lg font-bold" style={{ color: '#ceb57d' }}>
                Project Portal
              </h1>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }}>SRM University-AP</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigationItems.map(item => {
          const IconComponent =
            IconComponents[item.icon as keyof typeof IconComponents];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={() => {
                // Check if current path matches exactly or starts with the item path (for nested routes)
                const currentPath = location.pathname;
                const isCurrentPage = currentPath === item.path ||
                  (item.path !== ROUTES.DASHBOARD && currentPath.startsWith(item.path));

                return cn(
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden theme-transition',
                  isCurrentPage
                    ? 'border'
                    : 'hover:bg-opacity-10',
                  isCollapsed ? 'justify-center' : 'justify-start'
                );
              }}
              style={() => {
                const currentPath = location.pathname;
                const isCurrentPage = currentPath === item.path ||
                  (item.path !== ROUTES.DASHBOARD && currentPath.startsWith(item.path));

                return {
                  backgroundColor: isCurrentPage ? 'var(--color-hover)' : 'transparent',
                  color: isCurrentPage ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  borderColor: isCurrentPage ? 'var(--color-accent)' : 'transparent',
                };
              }}
            >
              {() => {
                const currentPath = location.pathname;
                const isCurrentPage = currentPath === item.path ||
                  (item.path !== ROUTES.DASHBOARD && currentPath.startsWith(item.path));

                return (
                  <>
                    {/* Active indicator */}
                    {isCurrentPage && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                        style={{ backgroundColor: 'var(--color-accent)' }}
                      />
                    )}

                    {/* Icon */}
                    <div
                      className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                      style={{
                        color: isCurrentPage ? 'var(--color-accent)' : 'inherit'
                      }}
                    >
                      {IconComponent && <IconComponent />}
                    </div>

                    {/* Label */}
                    {!isCollapsed && (
                      <span className="ml-3 transition-opacity duration-200">
                        {item.label}
                      </span>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div
                        className="absolute left-full ml-2 px-2 py-1 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50"
                        style={{
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        {item.label}
                      </div>
                    )}
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-white/10">
        <div
          className={cn(
            'flex items-center transition-all duration-200',
            isCollapsed ? 'justify-center' : 'justify-start'
          )}
        >
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <span className="text-textPrimary text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          </div>

          {!isCollapsed && (
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">
                {user?.name || 'Loading...'}
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="glass" size="sm">
                  {user?.role || 'user'}
                </Badge>
              </div>
              <SessionStatus className="mt-1" />
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <div className="hidden lg:block p-4 border-t border-white/10">
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-center p-2 text-textSecondary hover:text-text hover:bg-white/10 rounded-lg transition-colors duration-200"
        >
          <svg
            className={cn(
              'w-5 h-5 transition-transform duration-200',
              isCollapsed ? 'rotate-180' : ''
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <GlassCard
          variant="elevated"
          className={cn(
            'fixed left-4 top-4 bottom-4 z-40 transition-all duration-300',
            isCollapsed ? 'w-16' : 'w-64'
          )}
        >
          {sidebarContent}
        </GlassCard>
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        {/* Mobile menu button */}
        <button
          onClick={openMobileSidebar}
          className={cn(
            'fixed top-4 left-4 z-50 p-3 bg-surface/90 backdrop-blur-md border border-border rounded-xl text-text hover:bg-surface transition-all duration-200 shadow-lg hover:shadow-xl',
            isMobileOpen && 'opacity-0 pointer-events-none'
          )}
          aria-label="Open navigation menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Swipe indicator for mobile */}
        {!isMobileOpen && (
          <div className="fixed left-0 top-1/2 transform -translate-y-1/2 w-1 h-16 bg-gradient-to-b from-transparent via-primary/50 to-transparent rounded-r-full opacity-30 animate-pulse" />
        )}

        {/* Mobile sidebar overlay */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className={cn(
                'fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
                isAnimating ? 'opacity-0' : 'opacity-100'
              )}
              onClick={closeMobileSidebar}
            />

            {/* Sidebar */}
            <div
              ref={swipeRef as any}
              className={cn(
                'fixed inset-y-0 left-0 w-72 sm:w-80 transform transition-all duration-300 ease-out',
                isAnimating && !isMobileOpen
                  ? '-translate-x-full'
                  : 'translate-x-0'
              )}
            >
              <GlassCard variant="elevated" className="h-full relative">
                {/* Close button */}
                <button
                  onClick={closeMobileSidebar}
                  className="absolute top-4 right-4 z-10 p-2 text-textSecondary hover:text-text hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close navigation menu"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {sidebarContent}
              </GlassCard>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
