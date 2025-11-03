import { useState, useEffect, useCallback } from 'react';
import { useSwipeGesture } from './useSwipeGesture';

interface MobileNavigationOptions {
  threshold?: number;
  velocityThreshold?: number;
  edgeThreshold?: number;
  enabled?: boolean;
}

export function useMobileNavigation(options: MobileNavigationOptions = {}) {
  const {
    threshold = 80,
    velocityThreshold = 0.4,
    edgeThreshold = 50,
    enabled = true,
  } = options;

  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Open navigation
  const open = useCallback(() => {
    if (!isMobile || isAnimating) return;
    
    setIsAnimating(true);
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => setIsAnimating(false), 300);
  }, [isMobile, isAnimating]);

  // Close navigation
  const close = useCallback(() => {
    if (!isMobile || isAnimating) return;
    
    setIsAnimating(true);
    setIsOpen(false);
    document.body.style.overflow = 'unset';
    
    setTimeout(() => setIsAnimating(false), 300);
  }, [isMobile, isAnimating]);

  // Toggle navigation
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Handle swipe gestures
  const swipeRef = useSwipeGesture({
    onSwipeRight: (velocity) => {
      if (!isMobile || !enabled) return;
      
      // Only open if swipe starts from left edge
      const startX = (velocity || 0) > velocityThreshold ? 0 : edgeThreshold;
      if (startX <= edgeThreshold) {
        open();
      }
    },
    onSwipeLeft: () => {
      if (!isMobile || !enabled) return;
      close();
    },
    threshold,
    velocityThreshold,
    preventScroll: isOpen,
    enabled: enabled && isMobile,
  });

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabled || !isMobile) return;

      switch (e.key) {
        case 'Escape':
          if (isOpen) {
            e.preventDefault();
            close();
          }
          break;
        case 'm':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggle();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, isMobile, isOpen, close, toggle]);

  // Handle custom events
  useEffect(() => {
    const handleOpenEvent = () => open();
    const handleCloseEvent = () => close();
    const handleToggleEvent = () => toggle();

    document.addEventListener('mobile-nav:open', handleOpenEvent);
    document.addEventListener('mobile-nav:close', handleCloseEvent);
    document.addEventListener('mobile-nav:toggle', handleToggleEvent);

    return () => {
      document.removeEventListener('mobile-nav:open', handleOpenEvent);
      document.removeEventListener('mobile-nav:close', handleCloseEvent);
      document.removeEventListener('mobile-nav:toggle', handleToggleEvent);
    };
  }, [open, close, toggle]);

  // Auto-close on route change
  useEffect(() => {
    const handleRouteChange = () => {
      if (isOpen) {
        close();
      }
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      // Cleanup body overflow on unmount
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, close]);

  return {
    isMobile,
    isOpen,
    isAnimating,
    open,
    close,
    toggle,
    swipeRef,
  };
}

// Utility functions for triggering mobile navigation from anywhere
export const mobileNavigation = {
  open: () => document.dispatchEvent(new CustomEvent('mobile-nav:open')),
  close: () => document.dispatchEvent(new CustomEvent('mobile-nav:close')),
  toggle: () => document.dispatchEvent(new CustomEvent('mobile-nav:toggle')),
};