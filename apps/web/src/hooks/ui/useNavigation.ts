import { useState, useEffect } from 'react';

export function useNavigation() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar on route change
  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  // Toggle sidebar collapse (desktop)
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return {
    isSidebarCollapsed,
    isMobileSidebarOpen,
    isMobile,
    toggleSidebarCollapse,
    toggleMobileSidebar,
    closeMobileSidebar,
  };
}
