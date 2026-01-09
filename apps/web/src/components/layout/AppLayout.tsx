import { ReactNode, useEffect, useState, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { UserOnboardingModal } from '../modals/UserOnboardingModal';
import { useAuth } from '../../contexts/AuthContext';
import { useSwipeGesture } from '../../hooks/ui/useSwipeGesture';
import { useUserRefresh } from '../../hooks/useUserRefresh';
import { MenuIcon } from '../ui/Icons';
import { PageLoader } from '../common/PageLoader';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

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
      if (isMobile) {
        document.dispatchEvent(new CustomEvent('open-mobile-sidebar'));
      }
    },
    onSwipeLeft: () => {
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
      className="flex h-screen bg-[#f5f4f2] overflow-hidden"
    >
      {/* User Onboarding Modal - user name check */}
      {/* We need to access the user from AuthContext/AuthStore. 
          The Sidebar component uses useAuth, so we should too or useStore directly.
          Since AppLayout doesn't use useAuth currently, let's add it. 
      */}
      <UserOnboardingModal isOpen={!useAuth().user?.name} />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isMobile ? 'pl-0' : 'lg:pl-64'
        }`}>
        {/* Mobile Header */}
        {isMobile && (
          <div className="flex items-center px-4 h-16 bg-white border-b border-slate-200 flex-shrink-0 z-30">
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('open-mobile-sidebar'))}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <span className="ml-3 font-semibold text-slate-900">Project Portal</span>
          </div>
        )}

        {/* Framed Canvas */}
        <main className={`flex-1 relative overflow-hidden ${isMobile ? 'p-0' : 'p-3'
          }`}>
          <div className={`w-full h-full overflow-y-auto ${isMobile
            ? 'px-4 py-6'
            : 'bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8'
            }`}>
            <div className="max-w-7xl mx-auto min-h-full">
              <Suspense fallback={<PageLoader />}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="min-h-full"
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile swipe hint */}
      {isMobile && (
        <div className="fixed bottom-4 left-4 right-4 pointer-events-none z-50">
          <div className="bg-slate-900/80 backdrop-blur-sm text-white rounded-full px-4 py-2 text-center text-xs shadow-lg mx-auto w-max">
            <span>Swipe right for menu</span>
          </div>
        </div>
      )}
    </div>
  );
}

