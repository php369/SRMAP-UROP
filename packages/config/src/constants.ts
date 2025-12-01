// Application constants
export const APP_CONFIG = {
  name: 'SRM-AP Project Management Portal',
  description: 'SRM University-AP Project Management Portal',
  version: '1.0.0',
  domain: 'srmap.edu.in',
} as const;

export const API_CONFIG = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.srm-portal.com' 
    : 'http://localhost:3001',
  timeout: 10000,
  retries: 3,
} as const;

export const ROUTES = {
  auth: {
    login: '/auth/login',
    callback: '/auth/callback',
    logout: '/auth/logout',
  },
  dashboard: '/dashboard',
  assessments: '/assessments',
  submissions: '/submissions',
  projects: '/projects',
  profile: '/profile',
  admin: '/admin',
} as const;

export const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  ADMIN: 'admin',
} as const;

export const FILE_UPLOAD = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
  ],
} as const;