import React from 'react';
import { Loader2 } from 'lucide-react';
import { lazy } from '../utils/performance';
import { DashboardPageSkeleton } from './common/DashboardSkeletons';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader2 className="w-12 h-12 animate-spin text-slate-400" />
  </div>
);

// Skeleton loading components
const DashboardSkeleton = () => <DashboardPageSkeleton />;
const AssessmentsSkeleton = () => <DashboardPageSkeleton />;

// Lazy loaded components with proper error boundaries


// Error boundary component


// Lazy loaded page components
// Lazy loaded page components
export const LazyDashboard = lazy(
  () => import('../pages/dashboard/DashboardPage').then(module => ({ default: module.DashboardPage })),
  () => <DashboardSkeleton />
);

export const LazyAssessments = lazy(
  () => import('../pages/assessments/AssessmentsPage').then(module => ({ default: module.AssessmentsPage })),
  () => <AssessmentsSkeleton />
);

export const LazyAssessmentDetail = lazy(
  () => import('../pages/assessments/AssessmentDetailPage').then(module => ({ default: module.AssessmentDetailPage })),
  LoadingSpinner
);

// Lazy loaded component chunks
export const LazyPerformanceMonitor = lazy(
  () => import('./admin/PerformanceMonitor').then(module => ({ default: module.PerformanceMonitor })),
  LoadingSpinner
);

// Higher-order component for lazy loading with intersection observer
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    threshold?: number;
    rootMargin?: string;
    fallback?: React.ComponentType;
  } = {}
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [isLoaded, setIsLoaded] = React.useState(false);
    const elementRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        {
          threshold: options.threshold || 0.1,
          rootMargin: options.rootMargin || '50px',
        }
      );

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => observer.disconnect();
    }, []);

    React.useEffect(() => {
      if (isVisible && !isLoaded) {
        setIsLoaded(true);
      }
    }, [isVisible, isLoaded]);

    if (!isVisible) {
      return (
        <div
          ref={elementRef}
          className="min-h-[200px] flex items-center justify-center"
        >
          {options.fallback ? React.createElement(options.fallback) : <LoadingSpinner />}
        </div>
      );
    }

    if (!isLoaded) {
      return options.fallback ? React.createElement(options.fallback) : <LoadingSpinner />;
    }

    return <Component {...(props as any)} ref={ref} />;
  });
};

// Preload utilities for critical components
export const preloadComponent = (importFunc: () => Promise<any>) => {
  // Preload on idle or after a delay
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFunc().catch(console.error);
    });
  } else {
    setTimeout(() => {
      importFunc().catch(console.error);
    }, 2000);
  }
};

// Preload critical components
export const preloadCriticalComponents = () => {
  // Preload dashboard after initial load
  preloadComponent(() => import('../pages/dashboard/DashboardPage'));

  // Preload assessments page
  preloadComponent(() => import('../pages/assessments/AssessmentsPage'));
};

// Component for managing lazy loading state
export const LazyLoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    // Initialize preloading after the app has loaded
    const timer = setTimeout(preloadCriticalComponents, 3000);
    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
};
