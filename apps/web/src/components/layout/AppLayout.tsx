import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { useSidebar } from '../../contexts/SidebarContext';
import { useSwipeGesture } from '../../hooks/ui/useSwipeGesture';
import { useUserRefresh } from '../../hooks/useUserRefresh';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const { isCollapsed } = useSidebar();

  // Refresh user data every 5 minutes to catch role changes
  useUserRefresh(5 * 60 * 1000);

  // Track mobile state
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add swipe gesture support for mobile navigation
  const swipeRef = useSwipeGesture({
    onSwipeRight: () => {
      // Open mobile sidebar on swipe right from left edge
      if (isMobile) {
        document.dispatchEvent(new CustomEvent('open-mobile-sidebar'));
      }
    },
    onSwipeLeft: () => {
      // Close mobile sidebar on swipe left
      if (isMobile) {
        document.dispatchEvent(new CustomEvent('close-mobile-sidebar'));
      }
    },
    threshold: 80,
    velocityThreshold: 0.4,
    preventScroll: false,
    enabled: isMobile,
  });

  return (
    <div
      ref={swipeRef as any}
      className="min-h-screen bg-slate-50 overflow-x-hidden"
    >
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Removed gradient blobs for cleaner look with new palette */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className={`transition-all duration-300 ${isMobile ? 'pl-0' : isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}>
        {/* Top navigation */}
        <TopNavigation />

        {/* Page content */}
        <main className={`relative z-10 py-4 sm:py-6 px-4 sm:px-6 transition-all duration-300 ${isMobile ? 'pt-20' : 'lg:pt-6'
          }`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile swipe hint */}
      {
        isMobile && (
          <div className="fixed bottom-4 left-4 right-4 pointer-events-none">
            <div className="bg-surface/80 backdrop-blur-sm border border-border rounded-lg p-3 text-center text-sm text-textSecondary">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                <span>Swipe right to open menu</span>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
