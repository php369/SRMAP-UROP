import React, { Suspense } from 'react';
import { lazy } from '../utils/performance';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
      <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin absolute top-0 left-0"></div>
    </div>
  </div>
);

// Skeleton loading components
const DashboardSkeleton = () => (
  <div className="space-y-6 p-6">
    <div className="h-8 bg-gray-200 rounded-md animate-pulse"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-surface p-6 rounded-lg shadow-sm border">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
        </div>
      ))}
    </div>
    <div className="bg-surface p-6 rounded-lg shadow-sm border">
      <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
      <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
    </div>
  </div>
);

const AssessmentsSkeleton = () => (
  <div className="space-y-6 p-6">
    <div className="flex justify-between items-center">
      <div className="h-8 bg-gray-200 rounded-md animate-pulse w-48"></div>
      <div className="h-10 bg-gray-200 rounded-md animate-pulse w-32"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-surface p-6 rounded-lg shadow-sm border">
          <div className="h-6 bg-gray-200 rounded animate-pulse mb-3"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-3/4"></div>
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ProfileSkeleton = () => (
  <div className="space-y-6 p-6">
    <div className="bg-surface p-6 rounded-lg shadow-sm border">
      <div className="flex items-center space-x-6 mb-6">
        <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-40"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

// Lazy loaded components with proper error boundaries
const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ));
};

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return React.createElement(this.props.fallback);
      }
      
      return (
        <div className="flex items-center justify-center min-h-[200px] p-6">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-600 mb-4">
              We encountered an error loading this component.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy loaded page components
export const LazyDashboard = lazy(
  () => import('../pages/DashboardPage'),
  () => <DashboardSkeleton />
);

export const LazyAssessments = lazy(
  () => import('../pages/AssessmentsPage'),
  () => <AssessmentsSkeleton />
);

export const LazyAssessmentDetail = lazy(
  () => import('../pages/AssessmentDetailPage'),
  LoadingSpinner
);

export const LazyProfile = lazy(
  () => import('../pages/profile/UserProfilePage'),
  () => <ProfileSkeleton />
);

export const LazyAdminDashboard = lazy(
  () => import('../pages/admin/AdminDashboard'),
  () => <DashboardSkeleton />
);

export const LazyUserManagement = lazy(
  () => import('../pages/admin/UserManagement'),
  LoadingSpinner
);

export const LazyCohortManagement = lazy(
  () => import('../pages/admin/CohortManagement'),
  LoadingSpinner
);

export const LazyReportsPage = lazy(
  () => import('../pages/admin/ReportsPage'),
  LoadingSpinner
);

// Lazy loaded component chunks
export const LazyPerformanceMonitor = lazy(
  () => import('./admin/PerformanceMonitor'),
  LoadingSpinner
);

export const LazyThreeJSComponents = lazy(
  () => import('./3d/ThreeJSComponents'),
  LoadingSpinner
);

export const LazyChartComponents = lazy(
  () => import('./charts/ChartComponents'),
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

    return <Component {...props} ref={ref} />;
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
  preloadComponent(() => import('../pages/DashboardPage'));
  
  // Preload assessments page
  preloadComponent(() => import('../pages/AssessmentsPage'));
  
  // Preload profile page
  preloadComponent(() => import('../pages/profile/UserProfilePage'));
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
