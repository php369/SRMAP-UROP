import { useEffect, useRef, useCallback } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: (velocity?: number) => void;
  onSwipeRight?: (velocity?: number) => void;
  onSwipeUp?: (velocity?: number) => void;
  onSwipeDown?: (velocity?: number) => void;
  threshold?: number;
  velocityThreshold?: number;
  preventScroll?: boolean;
  enabled?: boolean;
}

export function useSwipeGesture(options: SwipeGestureOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    velocityThreshold = 0.3,
    preventScroll = false,
    enabled = true,
  } = options;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMoveRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const isSwipingRef = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    touchMoveRef.current = null;
    isSwipingRef.current = false;
  }, [enabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStartRef.current) return;

    const touch = e.touches[0];
    touchMoveRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if this is a swipe gesture
    if (absDeltaX > 10 || absDeltaY > 10) {
      isSwipingRef.current = true;
      
      // Prevent scroll if this is a horizontal swipe and preventScroll is enabled
      if (preventScroll && absDeltaX > absDeltaY) {
        e.preventDefault();
      }
    }
  }, [enabled, preventScroll]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const endTime = Date.now();
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = endTime - touchStartRef.current.time;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Calculate velocity (pixels per millisecond)
    const velocityX = absDeltaX / deltaTime;
    const velocityY = absDeltaY / deltaTime;

    // Determine if it's a horizontal or vertical swipe
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX > threshold || velocityX > velocityThreshold) {
        if (deltaX > 0) {
          onSwipeRight?.(velocityX);
        } else {
          onSwipeLeft?.(velocityX);
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY > threshold || velocityY > velocityThreshold) {
        if (deltaY > 0) {
          onSwipeDown?.(velocityY);
        } else {
          onSwipeUp?.(velocityY);
        }
      }
    }

    touchStartRef.current = null;
    touchMoveRef.current = null;
    isSwipingRef.current = false;
  }, [enabled, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocityThreshold]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, enabled, preventScroll]);

  return elementRef;
}