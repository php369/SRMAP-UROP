import { useAuth } from '../../contexts/AuthContext';

export function useAuthStatus() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin: user?.role === 'admin',
    isFaculty: user?.role === 'faculty' || user?.role === 'admin',
    isStudent: user?.role === 'student',
    userRole: user?.role,
  };
}

export function usePermissions() {
  const { hasRole, hasPermission } = useAuth();

  return {
    hasRole,
    hasPermission,
    canManageUsers: hasPermission('users.write'),
    canManageCourses: hasPermission('courses.write'),
    canManageAssessments: hasPermission('assessments.write'),
    canGradeSubmissions: hasPermission('grades.write'),
    canViewReports: hasPermission('reports.read'),
    canAccessAdmin: hasPermission('system.admin'),
  };
}
