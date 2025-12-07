/**
 * Helper functions for role checking
 */

export type UserRole = 'idp-student' | 'urop-student' | 'capstone-student' | 'faculty' | 'admin';
export type ExtendedRole = UserRole | 'coordinator';

/**
 * Check if a role is a student role
 */
export function isStudentRole(role: string): boolean {
  return role === 'idp-student' || role === 'urop-student' || role === 'capstone-student';
}

/**
 * Check if a role is a faculty role
 */
export function isFacultyRole(role: string): boolean {
  return role === 'faculty' || role === 'coordinator';
}

/**
 * Check if a role is an admin role
 */
export function isAdminRole(role: string): boolean {
  return role === 'admin';
}

/**
 * Get a generic student role for backwards compatibility
 */
export function getGenericStudentRole(): 'idp-student' {
  return 'idp-student';
}
