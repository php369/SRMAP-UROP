import { ReactNode } from 'react';
import { AuthGuard } from './AuthGuard';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: string;
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

export function ProtectedRoute(props: ProtectedRouteProps) {
  return <AuthGuard {...props} />;
}

// Convenience components for specific roles
export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
}

export function FacultyRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole={['faculty', 'admin']}>
      {children}
    </ProtectedRoute>
  );
}

export function StudentRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole={['student', 'faculty', 'admin']}>
      {children}
    </ProtectedRoute>
  );
}
