import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

// Stores
import { useAuthStore } from './stores/authStore';

// Components
import { AuthGuard } from './components/auth/AuthGuard';

import { NotificationProvider } from './components/common/NotificationProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';

// Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AssessmentsPage } from './pages/assessments/AssessmentsPage';
import { AssessmentDetailPage } from './pages/assessments/AssessmentDetailPage';
import { SubmissionsPage } from './pages/submissions/SubmissionsPage';
import { SubmissionDetailPage } from './pages/submissions/SubmissionDetailPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { PreferencesPage } from './pages/profile/PreferencesPage';
import { HelpSupportPage } from './pages/support/HelpSupportPage';
import { FacultyProjectsPage } from './pages/projects/FacultyProjectsPage';
import { CoordinatorApprovalsPage } from './pages/projects/CoordinatorApprovalsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCohortsPage } from './pages/admin/AdminCohortsPage';
import { AdminCoursesPage } from './pages/admin/AdminCoursesPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { EligibilityUpload } from './pages/admin/EligibilityUpload';

// Layout
import { AppLayout } from './components/layout/AppLayout';

// Constants
import { ROUTES } from './utils/constants';

// Theme preloader and styles
import './utils/themePreloader';
import './styles/dashboard-theme.css';

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
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authentication status in background (don't block public routes)
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background text-text">
              <NotificationProvider />

              <Routes>
                {/* Public routes */}
                <Route path={ROUTES.HOME} element={<LandingPage />} />
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallbackPage />} />

                {/* Protected routes */}
                <Route
                  path="/dashboard/*"
                  element={
                    <AuthGuard>
                      <SidebarProvider>
                        <AppLayout>
                          <Routes>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/assessments" element={<AssessmentsPage />} />
                            <Route path="/assessments/:id" element={<AssessmentDetailPage />} />
                            <Route path="/submissions" element={<SubmissionsPage />} />
                            <Route path="/submissions/:id" element={<SubmissionDetailPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/preferences" element={<PreferencesPage />} />
                            <Route path="/help" element={<HelpSupportPage />} />

                            {/* Faculty routes */}
                            <Route path="/projects" element={
                              <AuthGuard requiredRole={['faculty', 'coordinator']}>
                                <FacultyProjectsPage />
                              </AuthGuard>
                            } />

                            {/* Coordinator routes */}
                            <Route path="/projects/approvals" element={
                              <AuthGuard requiredRole="coordinator">
                                <CoordinatorApprovalsPage />
                              </AuthGuard>
                            } />

                            {/* Admin routes */}
                            <Route path="/admin/users" element={
                              <AuthGuard requiredRole="admin">
                                <AdminUsersPage />
                              </AuthGuard>
                            } />
                            <Route path="/admin/cohorts" element={
                              <AuthGuard requiredRole="admin">
                                <AdminCohortsPage />
                              </AuthGuard>
                            } />
                            <Route path="/admin/courses" element={
                              <AuthGuard requiredRole="admin">
                                <AdminCoursesPage />
                              </AuthGuard>
                            } />
                            <Route path="/admin/reports" element={
                              <AuthGuard requiredRole={['admin', 'faculty']}>
                                <AdminReportsPage />
                              </AuthGuard>
                            } />
                            <Route path="/admin/eligibility" element={
                              <AuthGuard requiredRole="admin">
                                <EligibilityUpload />
                              </AuthGuard>
                            } />

                            {/* Catch all route */}
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                          </Routes>
                        </AppLayout>
                      </SidebarProvider>
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
