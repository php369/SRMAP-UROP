import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';
import { verifyAccessToken, extractTokenFromHeader } from '../services/jwtService';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: 'idp-student' | 'urop-student' | 'capstone-student' | 'faculty' | 'coordinator' | 'admin';
        isGroupLeader?: boolean;
        isCoordinator?: boolean;
        isExternalEvaluator?: boolean;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Authorization token required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Find user in database to ensure they still exist
    const user = await User.findById(payload.userId) as IUser | null;
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Get enhanced role information
    const { getEnhancedUserRole } = await import('../services/roleService');
    const roleInfo = await getEnhancedUserRole(user._id);

    // Attach user to request with enhanced role information
    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: (roleInfo?.effectiveRole || user.role) as 'idp-student' | 'urop-student' | 'capstone-student' | 'faculty' | 'admin' | 'coordinator',
      isGroupLeader: roleInfo?.isGroupLeader || false,
      isCoordinator: roleInfo?.isCoordinator || false,
      isExternalEvaluator: roleInfo?.isExternalEvaluator || false,
    };

    next();

  } catch (error) {
    logger.error('Authentication failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Access token has expired',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (error.message.includes('Invalid')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid access token',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication failed',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Authorization middleware factory
 * Creates middleware that checks if user has required role(s)
 */
export const authorize = (...allowedRoles: Array<'student' | 'idp-student' | 'urop-student' | 'capstone-student' | 'faculty' | 'coordinator' | 'admin'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

    // Check if user's role is in allowed roles
    let hasAccess = allowedRoles.includes(req.user.role as any);

    // Special handling for generic 'student' role - matches any student type
    if (!hasAccess && allowedRoles.includes('student' as any) && req.user.role.endsWith('-student')) {
      hasAccess = true;
    }

    // If coordinator is in allowed roles and user has isCoordinator flag, grant access
    if (!hasAccess && allowedRoles.includes('coordinator') && req.user.isCoordinator) {
      hasAccess = true;
    }

    if (!hasAccess) {
      logger.warn(`Unauthorized access attempt by ${req.user.email} (${req.user.role}) to ${req.path}`);

      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to access this resource',
          details: {
            requiredRoles: allowedRoles,
            userRole: req.user.role,
          },
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 * Checks if user has specific permission
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

    const userPermissions = getUserPermissions(req.user.role);

    if (!userPermissions.includes(permission)) {
      logger.warn(`Permission denied for ${req.user.email}: ${permission}`);

      res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: `Permission denied: ${permission}`,
          details: {
            requiredPermission: permission,
            userPermissions,
          },
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if no token
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      next();
      return;
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Find user in database
    const user = await User.findById(payload.userId) as IUser | null;
    if (user) {
      // Get enhanced role information
      const { getEnhancedUserRole } = await import('../services/roleService');
      const roleInfo = await getEnhancedUserRole(user._id);

      req.user = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: (roleInfo?.effectiveRole || user.role) as 'idp-student' | 'urop-student' | 'capstone-student' | 'faculty' | 'admin' | 'coordinator',
        isGroupLeader: roleInfo?.isGroupLeader || false,
        isCoordinator: roleInfo?.isCoordinator || false,
        isExternalEvaluator: roleInfo?.isExternalEvaluator || false,
      };
    }

    next();

  } catch (error) {
    // Don't fail on optional auth errors, just continue without user
    logger.debug('Optional auth failed:', error);
    next();
  }
};

/**
 * Resource ownership middleware
 * Checks if user owns the resource or has admin privileges
 */
export const requireOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

    // Admin can access any resource
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Check ownership based on request parameters or body
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

    if (!resourceUserId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_RESOURCE_ID',
          message: `Missing ${resourceUserIdField} in request`,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    if (resourceUserId !== req.user.id) {
      logger.warn(`Ownership check failed for ${req.user.email}: ${resourceUserId} !== ${req.user.id}`);

      res.status(403).json({
        success: false,
        error: {
          code: 'NOT_RESOURCE_OWNER',
          message: 'You can only access your own resources',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
};

/**
 * Get user permissions based on role
 */
function getUserPermissions(role: string): string[] {
  const permissions: { [key: string]: string[] } = {
    student: [
      'assessments:read',
      'submissions:create',
      'submissions:read:own',
      'grades:read:own',
    ],
    faculty: [
      'assessments:create',
      'assessments:read',
      'assessments:update:own',
      'assessments:delete:own',
      'submissions:read',
      'grades:create',
      'grades:update',
      'grades:read',
    ],
    coordinator: [
      'assessments:create',
      'assessments:read',
      'assessments:update',
      'assessments:delete',
      'submissions:read',
      'grades:create',
      'grades:update',
      'grades:read',
      'grades:publish',
      'projects:approve',
      'projects:reject',
      'windows:manage',
      'evaluations:publish',
    ],
    admin: [
      'users:read',
      'users:update',
      'users:delete',
      'assessments:read',
      'assessments:delete',
      'submissions:read',
      'grades:read',
      'reports:read',
      'system:manage',
      'eligibility:import',
      'faculty:manage',
    ],
  };

  return permissions[role] || [];
}