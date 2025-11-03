import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { code: string; state?: string }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
    updateUser,
  } = useAuthStore();

  // Initialize auth check on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Role-based access control helpers
  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  };

  // Permission-based access control
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Define role-based permissions
    const rolePermissions: Record<string, string[]> = {
      admin: [
        'users.read',
        'users.write',
        'users.delete',
        'cohorts.read',
        'cohorts.write',
        'cohorts.delete',
        'courses.read',
        'courses.write',
        'courses.delete',
        'assessments.read',
        'assessments.write',
        'assessments.delete',
        'submissions.read',
        'submissions.write',
        'grades.read',
        'grades.write',
        'reports.read',
        'system.admin',
      ],
      faculty: [
        'assessments.read',
        'assessments.write',
        'assessments.delete',
        'submissions.read',
        'grades.read',
        'grades.write',
        'courses.read',
        'cohorts.read',
        'reports.read',
      ],
      student: [
        'assessments.read',
        'submissions.read',
        'submissions.write',
        'grades.read',
        'profile.read',
        'profile.write',
      ],
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission);
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
    updateUser,
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}