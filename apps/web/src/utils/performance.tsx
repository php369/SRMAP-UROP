/**
 * Performance optimization utilities for SRM Project Portal
 */
import React from 'react';

// Lazy loading utilities
export const lazy = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFunc);
  
  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => (
    <React.Suspense 
      fallback={
        fallback ? React.createElement(fallback) : 
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <LazyComponent {...props} ref={ref} />
    </React.Suspense>
  ));
};