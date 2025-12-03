import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

// Stores
import { useAuthStore } from './stores/authStore';

// Components
import { AuthGuard } from './components/auth/AuthGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationProvider } from './components/common/NotificationProvider';
import { PageLoader } from './components/common/PageLoader';
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

// Lazy loaded pages
const CoordinatorApprovalsPage = lazy(() => import('./pages/projects/CoordinatorApprovalsPage').then(m => ({ default: m.CoordinatorApprovalsPage })));
const StudentApplicationPage = lazy(() => import('./pages/dashboard/StudentApplicationPage').then(m => ({ default: m.StudentApplicationPage })));
const ApplicationPage = lazy(() => import('./pages/student/ApplicationPage').then(m => ({ default: m.ApplicationPage })));
const SubmissionPage = lazy(() => import('./pages/student/SubmissionPage').then(m => ({ default: m.SubmissionPage })));
const AssessmentPage = lazy(() => import('./pages/student/AssessmentPage').then(m => ({ default: m.AssessmentPage })));
const MeetingsPage = lazy(() => import('./pages/student/MeetingsPage').then(m => ({ default: m.MeetingsPage })));
const ControlPanel = lazy(() => import('./pages/coordinator/ControlPanel').then(m => ({ default: m.ControlPanel })));
const FacultyProjectsPage = lazy(() => import('./pages/faculty/ProjectsPage').then(m => ({ default: m.FacultyProjectsPage })));
const FacultyApplicationsPage = lazy(() => import('./pages/faculty/ApplicationsPage').then(m => ({ default: m.FacultyApplicationsPage })));
const FacultyAssessmentPage = lazy(() => import('./pages/faculty/AssessmentPage').then(m => ({ default: m.FacultyAssessmentPage })));
const FacultyMeetingsPage = lazy(() => import('./pages/faculty/MeetingsPage').then(m => ({ default: m.FacultyMeetingsPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const EligibilityUpload = lazy(() => import('./pages/admin/EligibilityUpload').then(m => ({ default: m.EligibilityUpload })));
const WindowManagement = lazy(() => import('./pages/admin/WindowManagement').then(m => ({ default: m.WindowManagement })));

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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-background text-text">
                <NotificationProvider />

                <Suspense fallback={<PageLoader />}>
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
                                <Route path="/application" element={
                                  <AuthGuard requiredRole="student">
                                    <ApplicationPage />
                                  </AuthGuard>
                                } />
                                <Route path="/submission" element={
                                  <AuthGuard requiredRole="student">
                                    <SubmissionPage />
                                  </AuthGuard>
                                } />
                                <Route path="/assessment" element={
                                  <AuthGuard requiredRole="student">
                                    <AssessmentPage />
                                  </AuthGuard>
                                } />
                                <Route path="/meetings" element={
                                  <AuthGuard requiredRole="student">
                                    <MeetingsPage />
                                  </AuthGuard>
                                } />

                                {/* Faculty routes */}
                                <Route path="/projects" element={
                                  <AuthGuard requiredRole={['faculty', 'coordinator']}>
                                    <FacultyProjectsPage />
                                  </AuthGuard>
                                } />
                                <Route path="/faculty/applications" element={
                                  <AuthGuard requiredRole={['faculty', 'coordinator']}>
                                    <FacultyApplicationsPage />
                                  </AuthGuard>
                                } />
                                <Route path="/faculty/assessment" element={
                                  <AuthGuard requiredRole={['faculty', 'coordinator']}>
                                    <FacultyAssessmentPage />
                                  </AuthGuard>
                                } />
                                <Route path="/faculty/meetings" element={
                                  <AuthGuard requiredRole={['faculty', 'coordinator']}>
                                    <FacultyMeetingsPage />
                                  </AuthGuard>
                                } />

                                {/* Coordinator routes */}
                                <Route path="/projects/approvals" element={
                                  <AuthGuard requiredRole="coordinator">
                                    <CoordinatorApprovalsPage />
                                  </AuthGuard>
                                } />
                                <Route path="/control" element={
                                  <AuthGuard requiredRole="coordinator">
                                    <ControlPanel />
                                  </AuthGuard>
                                } />

                                {/* Admin routes */}
                                <Route path="/admin/users" element={
                                  <AuthGuard requiredRole="admin">
                                    <AdminUsersPage />
                                  </AuthGuard>
                                } />
                                <Route path="/admin/eligibility" element={
                                  <AuthGuard requiredRole="admin">
                                    <EligibilityUpload />
                                  </AuthGuard>
                                } />
                                <Route path="/admin/windows" element={
                                  <AuthGuard requiredRole="admin">
                                    <WindowManagement />
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
                </Suspense>

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
    </ErrorBoundary>
  );
}

export default App;
