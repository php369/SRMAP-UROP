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
  PROJECTS: '/projects',
  LOGIN: '/login',
  AUTH_CALLBACK: '/auth/callback',
  DASHBOARD: '/dashboard',
  APPLICATION: '/dashboard/application',
  SUBMISSION: '/dashboard/submission',
  ASSESSMENT: '/dashboard/assessment',
  MEETINGS: '/dashboard/meetings',
  ASSESSMENTS: '/dashboard/assessments',
  ASSESSMENT_DETAIL: '/dashboard/assessments/:id',
  SUBMISSIONS: '/dashboard/submissions',
  SUBMISSION_DETAIL: '/dashboard/submissions/:id',

  FACULTY_PROJECTS: '/dashboard/projects',
  PROJECT_APPROVALS: '/dashboard/projects/approvals',
  PROFILE: '/dashboard/profile',
  ADMIN: '/dashboard/admin',
  ADMIN_USERS: '/dashboard/admin/users',
  ADMIN_COHORTS: '/dashboard/admin/cohorts',
  ADMIN_COURSES: '/dashboard/admin/courses',
  ADMIN_REPORTS: '/dashboard/admin/reports',
} as const;

// Earth-Toned Color Palette
export const EARTH_PALETTE = {
  TUSSOCK: '#c89643',
  SATIN_LINEN: '#e5e4d3',
  WOODLAND: '#4a4724',
  GREEN_SMOKE: '#aaa46c',
  FLAX_SMOKE: '#817f63',
  CORAL_REEF: '#c8c3a3',
  SYCAMORE: '#918a41',
  STRAW: '#d4b57d',
} as const;

// Theme Configuration
export const THEMES = {
  LIGHT: {
    mode: 'light' as const,
    colors: {
      primary: EARTH_PALETTE.TUSSOCK,
      primaryGradient: `linear-gradient(135deg, ${EARTH_PALETTE.TUSSOCK} 0%, ${EARTH_PALETTE.SYCAMORE} 100%)`,
      secondary: EARTH_PALETTE.GREEN_SMOKE,
      accent: EARTH_PALETTE.TUSSOCK,
      background: EARTH_PALETTE.SATIN_LINEN,
      surface: EARTH_PALETTE.CORAL_REEF,
      glass: 'rgba(200, 195, 163, 0.7)',
      text: EARTH_PALETTE.WOODLAND,
      textSecondary: EARTH_PALETTE.FLAX_SMOKE,
      border: EARTH_PALETTE.GREEN_SMOKE,
      success: EARTH_PALETTE.SYCAMORE,
      warning: EARTH_PALETTE.TUSSOCK,
      error: '#d4704a',
      info: EARTH_PALETTE.FLAX_SMOKE,
    },
  },
  DARK: {
    mode: 'dark' as const,
    colors: {
      primary: EARTH_PALETTE.STRAW,
      primaryGradient: `linear-gradient(135deg, ${EARTH_PALETTE.STRAW} 0%, ${EARTH_PALETTE.TUSSOCK} 100%)`,
      secondary: '#3e3c2f',
      accent: EARTH_PALETTE.STRAW,
      background: '#1f1e17',
      surface: '#2b2a22',
      glass: 'rgba(43, 42, 34, 0.7)',
      text: EARTH_PALETTE.STRAW,
      textSecondary: EARTH_PALETTE.CORAL_REEF,
      border: '#3e3c2f',
      success: EARTH_PALETTE.TUSSOCK,
      warning: EARTH_PALETTE.STRAW,
      error: '#d4704a',
      info: EARTH_PALETTE.CORAL_REEF,
    },
  },
} as const;

// Role-based Navigation
export const ROLE_NAVIGATION = {
  student: [
    { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: 'Home' },
    { label: 'Application', path: ROUTES.APPLICATION, icon: 'Users' },
    { label: 'Submission', path: ROUTES.SUBMISSION, icon: 'Upload' },
    { label: 'Assessment', path: ROUTES.ASSESSMENT, icon: 'FileText' },
    { label: 'Meetings', path: ROUTES.MEETINGS, icon: 'Calendar' },
    { label: 'Profile', path: ROUTES.PROFILE, icon: 'User' },
  ],
  faculty: [
    { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: 'Home' },
    { label: 'My Projects', path: ROUTES.FACULTY_PROJECTS, icon: 'FolderOpen' },
    { label: 'Applications', path: '/dashboard/faculty/applications', icon: 'Users' },
    { label: 'Assessment', path: '/dashboard/faculty/assessment', icon: 'Award' },
    { label: 'Meetings', path: '/dashboard/faculty/meetings', icon: 'Calendar' },
    { label: 'Profile', path: ROUTES.PROFILE, icon: 'User' },
  ],
  coordinator: [
    { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: 'Home' },
    { label: 'My Projects', path: ROUTES.FACULTY_PROJECTS, icon: 'FolderOpen' },
    { label: 'Applications', path: '/dashboard/faculty/applications', icon: 'Users' },
    { label: 'Assessment', path: '/dashboard/faculty/assessment', icon: 'Award' },
    { label: 'Meetings', path: '/dashboard/faculty/meetings', icon: 'Calendar' },
    { label: 'Control Panel', path: '/dashboard/control', icon: 'Settings' },
    { label: 'Profile', path: ROUTES.PROFILE, icon: 'User' },
  ],
  admin: [
    { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: 'Home' },
    { label: 'Eligibility Upload', path: '/dashboard/admin/eligibility', icon: 'Upload' },
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
