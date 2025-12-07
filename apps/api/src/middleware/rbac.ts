import { Request, Response, NextFunction } from 'express';
import { checkUserAuthorization } from '../services/authService';
import { logger } from '../utils/logger';

/**
 * Enhanced RBAC middleware that checks current authorization status
 * This middleware re-validates user authorization on each request
 */
export const rbacGuard = (...allowedRoles: Array<'student' | 'idp-student' | 'urop-student' | 'capstone-student' | 'faculty' | 'coordinator' | 'admin'>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    try {
      // Re-check user authorization to ensure current eligibility/faculty status
      const authResult = await checkUserAuthorization(req.user.email);
      
      if (!authResult.isAuthorized) {
        logger.warn(`RBAC: Access denied for ${req.user.email} - authorization revoked`);
        res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_REVOKED',
            message: 'User access has been revoked',
            guidance: authResult.error?.guidance,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Check if user's current role is in allowed roles
      let hasAccess = allowedRoles.includes(authResult.role as any);
      
      // Special handling for generic 'student' role - matches any student type
      if (!hasAccess && allowedRoles.includes('student' as any) && authResult.role.endsWith('-student')) {
        hasAccess = true;
      }
      
      if (!hasAccess) {
        logger.warn(`RBAC: Insufficient permissions for ${req.user.email} (${authResult.role}) to access ${req.path}`);
        
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to access this resource',
            details: {
              requiredRoles: allowedRoles,
              userRole: authResult.role,
            },
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Update request user with current role and authorization info
      req.user.role = authResult.role;
      
      // Attach additional context for downstream middleware
      (req as any).authContext = {
        user: authResult.user,
        isCoordinator: authResult.role === 'coordinator' || authResult.role === 'admin',
        isAdmin: authResult.role === 'admin',
      };

      logger.debug(`RBAC: Access granted for ${req.user.email} (${authResult.role}) to ${req.path}`);
      next();

    } catch (error) {
      logger.error('RBAC check failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'RBAC_ERROR',
          message: 'Failed to verify user permissions',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Student-specific RBAC guard that also validates project type eligibility
 */
export const studentGuard = (requiredProjectType?: 'IDP' | 'UROP' | 'CAPSTONE') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    try {
      const authResult = await checkUserAuthorization(req.user.email);
      
      if (!authResult.isAuthorized || !authResult.role.endsWith('-student')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'STUDENT_ACCESS_REQUIRED',
            message: 'Student access required',
            guidance: authResult.error?.guidance,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Note: Project type eligibility check removed - all students can access all project types now

      req.user.role = authResult.role;
      (req as any).authContext = {
        user: authResult.user,
        projectType: requiredProjectType,
      };

      next();

    } catch (error) {
      logger.error('Student RBAC check failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'RBAC_ERROR',
          message: 'Failed to verify student permissions',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Faculty-specific RBAC guard
 */
export const facultyGuard = (requireCoordinator: boolean = false) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    try {
      const authResult = await checkUserAuthorization(req.user.email);
      
      if (!authResult.isAuthorized || !['faculty', 'coordinator'].includes(authResult.role)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FACULTY_ACCESS_REQUIRED',
            message: 'Faculty access required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Check coordinator requirement
      if (requireCoordinator && authResult.role !== 'coordinator') {
        res.status(403).json({
          success: false,
          error: {
            code: 'COORDINATOR_ACCESS_REQUIRED',
            message: 'Coordinator privileges required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      req.user.role = authResult.role;
      (req as any).authContext = {
        user: authResult.user,
        facultyInfo: authResult.user, // Add facultyInfo for backward compatibility
        isCoordinator: authResult.role === 'coordinator' || authResult.role === 'admin',
        department: authResult.user?.department,
      };

      next();

    } catch (error) {
      logger.error('Faculty RBAC check failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'RBAC_ERROR',
          message: 'Failed to verify faculty permissions',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Admin-specific RBAC guard
 */
export const adminGuard = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    try {
      const authResult = await checkUserAuthorization(req.user.email);
      
      if (!authResult.isAuthorized || authResult.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: {
            code: 'ADMIN_ACCESS_REQUIRED',
            message: 'Administrator access required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      req.user.role = 'admin';
      (req as any).authContext = {
        isAdmin: true,
      };

      next();

    } catch (error) {
      logger.error('Admin RBAC check failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'RBAC_ERROR',
          message: 'Failed to verify admin permissions',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};