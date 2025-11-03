import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { GlassCard } from '../ui/GlassCard';
import { ROUTES } from '../../utils/constants';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: string;
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

export function AuthGuard({ 
  children, 
  requiredRole,
  requiredPermission,
  fallbackPath = ROUTES.DASHBOARD,
  showAccessDenied = true
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={ROUTES.LOGIN} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check role-based access
  if (requiredRole && !hasRole(requiredRole)) {
    if (showAccessDenied) {
      return <AccessDeniedPage userRole={user?.role} requiredRole={requiredRole} />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (showAccessDenied) {
      return <AccessDeniedPage userRole={user?.role} requiredPermission={requiredPermission} />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

// Access Denied Component
interface AccessDeniedPageProps {
  userRole?: string;
  requiredRole?: string | string[];
  requiredPermission?: string;
}

function AccessDeniedPage({ userRole, requiredRole, requiredPermission }: AccessDeniedPageProps) {
  const formatRole = (role: string | string[]) => {
    if (Array.isArray(role)) {
      return role.join(', ');
    }
    return role;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <GlassCard variant="elevated" className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-text mb-2">Access Denied</h1>
        
        <p className="text-textSecondary mb-4">
          You don't have permission to access this page.
        </p>
        
        <div className="text-sm text-textSecondary mb-6 space-y-1">
          <p>Your role: <span className="font-medium text-text capitalize">{userRole}</span></p>
          {requiredRole && (
            <p>Required role: <span className="font-medium text-text capitalize">{formatRole(requiredRole)}</span></p>
          )}
          {requiredPermission && (
            <p>Required permission: <span className="font-medium text-text">{requiredPermission}</span></p>
          )}
        </div>
        
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Go Back
        </button>
      </GlassCard>
    </div>
  );
}