// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
export const API_VERSION = 'v1';
export const API_URL = `${API_BASE_URL}/api/${API_VERSION}`;

// Socket.IO Configuration
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`;

// Application Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  AUTH_CALLBACK: '/auth/callback',
  DASHBOARD: '/dashboard',
  ASSESSMENTS: '/assessments',
  ASSESSMENT_DETAIL: '/assessments/:id',
  SUBMISSIONS: '/submissions',
  SUBMISSION_DETAIL: '/submissions/:id',
  GRADES: '/grades',
  PROFILE: '/profile',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_COHORTS: '/admin/cohorts',
  ADMIN_COURSES: '/admin/courses',
  ADMIN_REPORTS: '/admin/reports',
} as const;

// Theme Configuration
export const THEMES = {
  LIGHT: {
    mode: 'light' as const,
    colors: {
      primary: '#6366F1',
      primaryGradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      secondary: '#14B8A6',
      accent: '#F59E0B',
      background: '#FAFAFA',
      surface: '#FFFFFF',
      glass: 'rgba(255, 255, 255, 0.7)',
      text: '#0F172A',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
  },
  DARK: {
    mode: 'dark' as const,
    colors: {
      primary: '#818CF8',
      primaryGradient: 'linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)',
      secondary: '#14B8A6',
      accent: '#F59E0B',
      background: '#0F172A',
      surface: '#1E293B',
      glass: 'rgba(30, 41, 59, 0.7)',
      text: '#F8FAFC',
      textSecondary: '#94A3B8',
      border: '#334155',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
  },
} as const;

// Role-based Navigation
export const ROLE_NAVIGATION = {
  student: [
    { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: 'Home' },
    { label: 'Assessments', path: ROUTES.ASSESSMENTS, icon: 'FileText' },
    { label: 'Submissions', path: ROUTES.SUBMISSIONS, icon: 'Upload' },
    { label: 'Grades', path: ROUTES.GRADES, icon: 'Award' },
    { label: 'Profile', path: ROUTES.PROFILE, icon: 'User' },
  ],
  faculty: [
    { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: 'Home' },
    { label: 'Assessments', path: ROUTES.ASSESSMENTS, icon: 'FileText' },
    { label: 'Submissions', path: ROUTES.SUBMISSIONS, icon: 'Upload' },
    { label: 'Grades', path: ROUTES.GRADES, icon: 'Award' },
    { label: 'Profile', path: ROUTES.PROFILE, icon: 'User' },
  ],
  admin: [
    { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: 'Home' },
    { label: 'Users', path: ROUTES.ADMIN_USERS, icon: 'Users' },
    { label: 'Cohorts', path: ROUTES.ADMIN_COHORTS, icon: 'Users' },
    { label: 'Courses', path: ROUTES.ADMIN_COURSES, icon: 'BookOpen' },
    { label: 'Reports', path: ROUTES.ADMIN_REPORTS, icon: 'BarChart3' },
    { label: 'Profile', path: ROUTES.PROFILE, icon: 'User' },
  ],
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'srm_portal_token',
  REFRESH_TOKEN: 'srm_portal_refresh_token',
  USER_DATA: 'srm_portal_user',
  THEME: 'srm_portal_theme',
  SIDEBAR_COLLAPSED: 'srm_portal_sidebar_collapsed',
  NOTIFICATIONS_READ: 'srm_portal_notifications_read',
} as const;