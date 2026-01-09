import { ReactNode, useEffect, useState, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { UserOnboardingModal } from '../modals/UserOnboardingModal';
import { useAuth } from '../../contexts/AuthContext';

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



  return (
    <div
      className="flex min-h-screen bg-[#f5f4f2]"
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
          <div className="sticky top-0 z-30 flex items-center justify-between px-4 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all duration-200">
            <div className="flex items-center gap-3">
              <img src="/branding/srm-icon.svg" alt="SRM Logo" className="w-8 h-8" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 leading-tight">Project Portal</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SRM University-AP</span>
              </div>
            </div>
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('open-mobile-sidebar'))}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Framed Canvas */}
        <main className={`flex-1 relative ${isMobile ? 'p-0' : 'p-3'
          }`}>
          <div className={`w-full min-h-full ${isMobile
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

