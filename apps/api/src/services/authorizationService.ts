import { Request } from 'express';
import { getWindowStatus } from '../middleware/windowEnforcement';
import { logger } from '../utils/logger';

export interface AuthorizationContext {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'idp-student' | 'urop-student' | 'capstone-student' | 'faculty' | 'coordinator' | 'admin';
    isCoordinator?: boolean;
    isExternalEvaluator?: boolean;
    department?: string;
  };
  isCoordinator: boolean;
  isAdmin: boolean;
  projectType?: 'IDP' | 'UROP' | 'CAPSTONE';
}

/**
 * Extract authorization context from request
 */
export function getAuthContext(req: Request): AuthorizationContext | null {
  if (!req.user) {
    return null;
  }

  const authContext = (req as any).authContext || {};
  
  return {
    user: req.user,
    isCoordinator: req.user.isCoordinator || req.user.role === 'coordinator' || req.user.role === 'admin',
    isAdmin: req.user.role === 'admin',
    projectType: authContext.projectType,
  };
}

/**
 * Check if user can access resource based on ownership
 */
export function canAccessOwnResource(
  authContext: AuthorizationContext,
  resourceUserId: string
): boolean {
  // Admin can access any resource
  if (authContext.isAdmin) {
    return true;
  }

  // Coordinator can access resources in their domain (implementation specific)
  if (authContext.isCoordinator) {
    // For now, coordinators can access any resource
    // This can be refined based on department or other criteria
    return true;
  }

  // User can access their own resources
  return authContext.user.id === resourceUserId;
}

/**
 * Check if user can manage projects (create, approve, etc.)
 */
export function canManageProjects(authContext: AuthorizationContext): boolean {
  return authContext.user.role === 'faculty' || 
         authContext.isCoordinator || 
         authContext.isAdmin;
}

/**
 * Check if user can approve project applications
 */
export function canApproveApplications(authContext: AuthorizationContext): boolean {
  return authContext.isCoordinator || authContext.isAdmin;
}

/**
 * Check if user can publish grades/evaluations
 */
export function canPublishGrades(authContext: AuthorizationContext): boolean {
  return authContext.isCoordinator || authContext.isAdmin;
}

/**
 * Check if user can manage windows
 */
export function canManageWindows(authContext: AuthorizationContext): boolean {
  return authContext.isCoordinator || authContext.isAdmin;
}

// Eligibility and Faculty Roster management functions removed - collections dropped from database

/**
 * Check if user is eligible for specific project type
 * Note: With eligibility removed, all students can access all project types
 */
export function isEligibleForProjectType(
  authContext: AuthorizationContext,
  projectType: 'IDP' | 'UROP' | 'CAPSTONE'
): boolean {
  // All users can access all project types now
  return true;
}

/**
 * Get user's eligible project types
 */
export function getEligibleProjectTypes(authContext: AuthorizationContext): string[] {
  // All users can work with all project types
  return ['IDP', 'UROP', 'CAPSTONE'];
}

/**
 * Check if user can access project of specific type
 */
export function canAccessProjectType(
  authContext: AuthorizationContext,
  projectType: 'IDP' | 'UROP' | 'CAPSTONE'
): boolean {
  // Admin and coordinators can access all project types
  if (authContext.isAdmin || authContext.isCoordinator) {
    return true;
  }

  // Faculty can access all project types they're assigned to
  if (authContext.user.role === 'faculty') {
    return true;
  }

  // Students can only access their eligible project type
  return isEligibleForProjectType(authContext, projectType);
}

/**
 * Get comprehensive window status for user's project types
 */
export async function getUserWindowStatus(authContext: AuthorizationContext): Promise<{
  [key: string]: {
    isActive: boolean;
    window?: any;
    reason?: string;
  };
}> {
  const projectTypes = getEligibleProjectTypes(authContext);
  const windowKinds = ['grouping', 'application', 'faculty-edit-title', 'internal-eval', 'external-eval'];
  
  const status: any = {};

  for (const projectType of projectTypes) {
    status[projectType] = {};
    
    for (const windowKind of windowKinds) {
      try {
        const windowStatus = await getWindowStatus(windowKind as any, projectType as any);
        status[projectType][windowKind] = { isActive: windowStatus };
      } catch (error) {
        logger.error(`Failed to get window status for ${projectType}/${windowKind}:`, error);
        status[projectType][windowKind] = {
          isActive: false,
          reason: 'Error checking window'
        };
      }
    }
  }

  return status;
}

/**
 * Check if user can perform action during current windows
 */
export async function canPerformActionInWindow(
  authContext: AuthorizationContext,
  action: 'grouping' | 'application' | 'faculty-edit-title' | 'internal-eval' | 'external-eval',
  projectType?: 'IDP' | 'UROP' | 'CAPSTONE'
): Promise<boolean> {
  // Admin and coordinators can bypass window restrictions
  if (authContext.isAdmin || authContext.isCoordinator) {
    return true;
  }

  // Determine project type
  const targetProjectType = projectType || authContext.projectType;
  if (!targetProjectType) {
    return false;
  }

  // Check if user is eligible for this project type
  if (!canAccessProjectType(authContext, targetProjectType)) {
    return false;
  }

  // Check window status
  const windowStatus = await getWindowStatus(action as any, targetProjectType);
  return windowStatus;
}

/**
 * Validate request context for authorization
 */
export function validateRequestContext(req: Request): {
  isValid: boolean;
  authContext?: AuthorizationContext;
  error?: string;
} {
  const authContext = getAuthContext(req);
  
  if (!authContext) {
    return {
      isValid: false,
      error: 'No authentication context found'
    };
  }

  return {
    isValid: true,
    authContext
  };
}