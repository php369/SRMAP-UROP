// Authentication and Authorization Middleware
export { authenticate, authorize, requirePermission, optionalAuth, requireOwnership } from './auth';
export { rbacGuard, studentGuard, facultyGuard, adminGuard } from './rbac';
export { enforceWindow, enforceAnyWindow, getWindowStatus } from './windowEnforcement';
export { 
  authErrorHandler, 
  AuthenticationError, 
  AuthorizationError, 
  WindowNotActiveError, 
  EligibilityError,
  throwAuthenticationError,
  throwAuthorizationError,
  throwWindowNotActiveError,
  throwEligibilityError
} from './authErrorHandler';

// Other Middleware
export { asyncHandler } from './errorHandler';
export { default as upload } from './upload';

// Utility functions
export { 
  getAuthContext,
  canAccessOwnResource,
  canManageProjects,
  canApproveApplications,
  canPublishGrades,
  canManageWindows,
  canImportEligibility,
  canManageFaculty,
  isEligibleForProjectType,
  getEligibleProjectTypes,
  canAccessProjectType,
  getUserWindowStatus,
  canPerformActionInWindow,
  validateRequestContext
} from '../services/authorizationService';