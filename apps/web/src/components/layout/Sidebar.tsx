import { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_NAVIGATION, ROUTES } from '../../utils/constants';
import { cn } from '../../utils/cn';
import { useSwipeGesture } from '../../hooks/ui/useSwipeGesture';
import {
  HomeIcon,
  FileTextIcon,
  FolderOpenIcon,
  UploadIcon,
  AwardIcon,
  UserIcon,
  UsersIcon,
  BookOpenIcon,
  BarChart3Icon,
  SettingsIcon,
  CheckCircleIcon,
  CalendarIcon,
  MenuIcon,
  XIcon
} from '../ui/Icons';

// Icon components for navigation
const IconComponents = {
  Home: HomeIcon,
  FileText: FileTextIcon,
  FolderOpen: FolderOpenIcon,
  Upload: UploadIcon,
  Award: AwardIcon,
  User: UserIcon,
  Users: UsersIcon,
  BookOpen: BookOpenIcon,
  BarChart3: BarChart3Icon,
  Settings: SettingsIcon,
  CheckCircle: CheckCircleIcon,
  Calendar: CalendarIcon,
};

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigationItems = user ? ROLE_NAVIGATION[user.role] || [] : [];

  // Handle mobile sidebar open/close
  const openMobileSidebar = useCallback(() => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(true);
    }
  }, []);

  const closeMobileSidebar = useCallback(() => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
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



  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-40 bg-slate-50/50 border-r border-slate-200/50">
        {/* Logo */}
        <div className="flex flex-col justify-center h-20 px-6">
          <div className="flex items-center space-x-3">
            <img
              src="/branding/srm-icon.svg"
              alt="SRM University-AP"
              className="w-8 h-8"
            />
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                Project Portal
              </h1>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">SRM University-AP</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Menu</div>
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
                    'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                    isCurrentPage
                      ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
                  );
                }}
              >
                {() => {
                  const currentPath = location.pathname;
                  const isCurrentPage = currentPath === item.path ||
                    (item.path !== ROUTES.DASHBOARD && currentPath.startsWith(item.path));

                  return (
                    <>
                      <div
                        className={cn(
                          "flex-shrink-0 transition-colors duration-200",
                          isCurrentPage ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                        )}
                      >
                        {IconComponent && <IconComponent className="w-5 h-5" />}
                      </div>
                      <span className="ml-3">{item.label}</span>
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 mt-auto">
          <div className="flex items-center p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex-shrink-0">
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                <span className="text-primary text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user?.name || 'Loading...'}
              </p>
              <div className="flex items-center">
                <span className="text-xs text-slate-500 capitalize">
                  {user?.role || 'user'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        {/* Mobile menu button */}
        <button
          onClick={openMobileSidebar}
          className={cn(
            'fixed top-4 left-4 z-50 p-3 bg-surface border border-border rounded-2xl text-text hover:bg-surface transition-all duration-300 shadow-lg group',
            isMobileOpen && 'opacity-0 pointer-events-none scale-90'
          )}
          aria-label="Open navigation menu"
        >
          <MenuIcon
            className="w-6 h-6 transform group-hover:scale-110 transition-transform"
          />
        </button>

        {/* Swipe indicator for mobile */}
        {!isMobileOpen && (
          <div className="fixed left-0 top-1/2 transform -translate-y-1/2 w-1.5 h-20 bg-gradient-to-b from-transparent via-primary/40 to-transparent rounded-r-full opacity-50 animate-pulse" />
        )}

        {/* Mobile sidebar overlay */}
        <div
          className={cn(
            'fixed inset-0 z-50 lg:hidden transition-all duration-300',
            isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 transition-opacity duration-300"
            onClick={closeMobileSidebar}
          />

          {/* Glass Drawer */}
          <div
            ref={swipeRef as any}
            className={cn(
              'absolute inset-y-4 left-4 w-[85vw] sm:w-80 transform transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)',
              isMobileOpen ? 'translate-x-0' : '-translate-x-[110%]'
            )}
          >
            <div className="h-full bg-surface border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col">
              {/* Close button area */}
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={closeMobileSidebar}
                  className="p-2 text-textSecondary hover:text-text hover:bg-white/10 rounded-xl transition-all duration-200"
                  aria-label="Close navigation menu"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Reuse existing sidebar content logic but wrapped in our new container */}
              <div
                className={cn(
                  'flex flex-col h-full',
                  'w-full' // Override specific widths from desktop logic
                )}
              >
                {/* Logo */}
                <div className="flex items-center justify-start px-6 h-20 border-b border-border/10">
                  <div className="flex items-center space-x-3">
                    <img
                      src="/branding/srm-icon.svg"
                      alt="SRM University-AP"
                      className="w-10 h-10 shadow-lg rounded-lg"
                    />
                    <div>
                      <h1 className="text-xl font-bold text-primary">
                        Project Portal
                      </h1>
                    </div>
                  </div>
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
                          const currentPath = location.pathname;
                          const isCurrentPage = currentPath === item.path ||
                            (item.path !== ROUTES.DASHBOARD && currentPath.startsWith(item.path));

                          return cn(
                            'group flex items-center px-4 py-3.5 text-base font-medium rounded-2xl transition-all duration-300 relative overflow-hidden',
                            isCurrentPage
                              ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                              : 'text-textSecondary hover:bg-surface/50 hover:text-text'
                          );
                        }}
                      >
                        {() => {
                          const currentPath = location.pathname;
                          const isCurrentPage = currentPath === item.path ||
                            (item.path !== ROUTES.DASHBOARD && currentPath.startsWith(item.path));

                          return (
                            <>
                              {isCurrentPage && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
                              )}

                              <div
                                className={cn(
                                  "flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                                  isCurrentPage ? "text-primary" : "text-textSecondary/70 group-hover:text-text"
                                )}
                              >
                                {IconComponent && <IconComponent />}
                              </div>
                              <span className="ml-4 tracking-wide">{item.label}</span>
                            </>
                          );
                        }}
                      </NavLink>
                    );
                  })}
                </nav>

                {/* User Info Footnote */}
                <div className="p-4 mt-auto border-t border-border/10 bg-surface/50">
                  <div className="flex items-center p-3 rounded-2xl bg-surface border border-border/30 shadow-sm">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-inner">
                      <span className="text-white text-sm font-bold">
                        {user?.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="ml-3 min-w-0">
                      <p className="text-sm font-bold text-text truncate">
                        {user?.name || 'Loading...'}
                      </p>
                      <p className="text-xs text-textSecondary uppercase tracking-wider font-semibold">
                        {user?.role || 'user'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
