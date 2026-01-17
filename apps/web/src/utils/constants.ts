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
  HELP: '/dashboard/help',


  FACULTY_PROJECTS: '/dashboard/projects',

  PROFILE: '/dashboard/profile',
  ADMIN: '/dashboard/admin',
  ADMIN_USERS: '/dashboard/admin/users',
  ADMIN_REPORTS: '/dashboard/admin/reports',
  MASTER_CONTROL: '/dashboard/admin/system',
} as const;

// Modern SRM Gold Color Palette
export const MODERN_PALETTE = {
  SRM_400: '#f5bb3e', // Primary Light
  SRM_600: '#c49b60', // Primary Dark
  INDIGO_50: '#eef2ff', // Keeping for soft backgrounds if needed, or replace
  SLATE_900: '#0f172a',
  SLATE_800: '#1e293b',
  SLATE_600: '#475569',
  SLATE_500: '#64748b',
  SLATE_200: '#e2e8f0',
  SLATE_100: '#f1f5f9',
  SLATE_50: '#f8fafc',
  WHITE: '#ffffff',
  EMERALD_600: '#059669',
  AMBER_500: '#f59e0b',
  RED_500: '#ef4444',
  BLUE_500: '#3b82f6',
} as const;

// Theme Configuration
export const THEMES = {
  LIGHT: {
    mode: 'light' as const,
    colors: {
      primary: MODERN_PALETTE.SRM_400,
      primaryGradient: `linear-gradient(135deg, ${MODERN_PALETTE.SRM_400} 0%, ${MODERN_PALETTE.SRM_600} 100%)`,
      secondary: MODERN_PALETTE.SLATE_500,
      accent: MODERN_PALETTE.SRM_600,
      background: MODERN_PALETTE.SLATE_50,
      surface: MODERN_PALETTE.WHITE,
      glass: 'rgba(255, 255, 255, 0.9)', // More opaque for modern clean look
      text: MODERN_PALETTE.SLATE_900,
      textSecondary: MODERN_PALETTE.SLATE_600,
      border: MODERN_PALETTE.SLATE_200,
      success: MODERN_PALETTE.EMERALD_600,
      warning: MODERN_PALETTE.AMBER_500,
      error: MODERN_PALETTE.RED_500,
      info: MODERN_PALETTE.BLUE_500,
    },
  },
} as const;

// Role-based Navigation
const studentNavigation = [
  { label: 'Home', path: ROUTES.DASHBOARD, icon: 'Home', color: '#2563EB' },
  { label: 'Application', path: ROUTES.APPLICATION, icon: 'Users', color: '#14B8A6' },
  { label: 'Submission', path: ROUTES.SUBMISSION, icon: 'Upload', color: '#7C3AED' },
  { label: 'Assessment', path: ROUTES.ASSESSMENT, icon: 'FileText', color: '#F59E0B' },
  { label: 'Meetings', path: ROUTES.MEETINGS, icon: 'Calendar', color: '#06B6D4' },
];

export const ROLE_NAVIGATION = {
  student: studentNavigation,
  'idp-student': studentNavigation,
  'urop-student': studentNavigation,
  'capstone-student': studentNavigation,
  faculty: [
    { label: 'Home', path: ROUTES.DASHBOARD, icon: 'Home', color: '#2563EB' },
    { label: 'Projects', path: ROUTES.FACULTY_PROJECTS, icon: 'FolderOpen', color: '#EA580C' },
    { label: 'Applications', path: '/dashboard/faculty/applications', icon: 'Users', color: '#14B8A6' },
    { label: 'Assessment', path: '/dashboard/faculty/assessment', icon: 'Award', color: '#F59E0B' },
    { label: 'Meetings', path: '/dashboard/faculty/meetings', icon: 'Calendar', color: '#06B6D4' },
  ],
  coordinator: [
    { label: 'Home', path: ROUTES.DASHBOARD, icon: 'Home', color: '#2563EB' },
    { label: 'Projects', path: ROUTES.FACULTY_PROJECTS, icon: 'FolderOpen', color: '#EA580C' },
    { label: 'Applications', path: '/dashboard/faculty/applications', icon: 'Users', color: '#14B8A6' },
    { label: 'Assessment', path: '/dashboard/faculty/assessment', icon: 'Award', color: '#F59E0B' },
    { label: 'Meetings', path: '/dashboard/faculty/meetings', icon: 'Calendar', color: '#06B6D4' },
    { label: 'Control Panel', path: '/dashboard/control', icon: 'Settings', color: '#DC2626' },
  ],
  admin: [
    { label: 'Home', path: ROUTES.DASHBOARD, icon: 'Home', color: '#2563EB' },
    { label: 'Eligibility Upload', path: '/dashboard/admin/eligibility', icon: 'Upload', color: '#22C55E' },
    { label: 'Master Control', path: '/dashboard/admin/system', icon: 'Settings', color: '#154259' },
  ],

} as const;

// Helper function to check if user is a student
export const isStudentRole = (role: string | undefined): boolean => {
  if (!role) return false;
  return role === 'student' || role === 'idp-student' || role === 'urop-student' || role === 'capstone-student';
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'srm_portal_token',
  REFRESH_TOKEN: 'srm_portal_refresh_token',
  USER_DATA: 'srm_portal_user',
  THEME: 'srm_portal_theme',
  SIDEBAR_COLLAPSED: 'srm_portal_sidebar_collapsed',
  NOTIFICATIONS_READ: 'srm_portal_notifications_read',
} as const;
