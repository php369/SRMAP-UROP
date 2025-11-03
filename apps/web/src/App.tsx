import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

// Stores
import { useAuthStore } from './stores/authStore';
import { initializeTheme } from './stores/themeStore';

// Components
import { AuthGuard } from './components/auth/AuthGuard';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { NotificationProvider } from './components/common/NotificationProvider';
import { ThemeProvider } from './components/providers/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AssessmentsPage } from './pages/assessments/AssessmentsPage';
import { AssessmentDetailPage } from './pages/assessments/AssessmentDetailPage';
import { SubmissionsPage } from './pages/submissions/SubmissionsPage';
import { SubmissionDetailPage } from './pages/submissions/SubmissionDetailPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCohortsPage } from './pages/admin/AdminCohortsPage';
import { AdminCoursesPage } from './pages/admin/AdminCoursesPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';

// Layout
import { AppLayout } from './components/layout/AppLayout';

// Constants
import { ROUTES } from './utils/constants';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    // Initialize theme
    initializeTheme();
    
    // Check authentication status
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background text-text">
              <NotificationProvider />
          
          <Routes>
            {/* Public routes */}
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallbackPage />} />
            
            {/* Protected routes */}
            <Route
              path="/*"
              element={
                <AuthGuard>
                  <AppLayout>
                    <Routes>
                      <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                      <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                      <Route path={ROUTES.ASSESSMENTS} element={<AssessmentsPage />} />
                      <Route path={ROUTES.ASSESSMENT_DETAIL} element={<AssessmentDetailPage />} />
                      <Route path={ROUTES.SUBMISSIONS} element={<SubmissionsPage />} />
                      <Route path={ROUTES.SUBMISSION_DETAIL} element={<SubmissionDetailPage />} />
                      <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                      
                      {/* Admin routes */}
                      <Route path={ROUTES.ADMIN_USERS} element={
                        <AuthGuard requiredRole="admin">
                          <AdminUsersPage />
                        </AuthGuard>
                      } />
                      <Route path={ROUTES.ADMIN_COHORTS} element={
                        <AuthGuard requiredRole="admin">
                          <AdminCohortsPage />
                        </AuthGuard>
                      } />
                      <Route path={ROUTES.ADMIN_COURSES} element={
                        <AuthGuard requiredRole="admin">
                          <AdminCoursesPage />
                        </AuthGuard>
                      } />
                      <Route path={ROUTES.ADMIN_REPORTS} element={
                        <AuthGuard requiredRole={['admin', 'faculty']}>
                          <AdminReportsPage />
                        </AuthGuard>
                      } />
                      
                      {/* Catch all route */}
                      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                    </Routes>
                  </AppLayout>
                </AuthGuard>
              }
            />
          </Routes>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'bg-surface text-text border border-border',
            }}
          />
          </div>
          </Router>
          
          {/* React Query DevTools */}
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;