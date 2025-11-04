import { Request, Response, NextFunction } from 'express';
import { Window, IWindow } from '../models/Window';
import { logger } from '../utils/logger';

export interface WindowContext {
  windowKind: string;
  projectType?: string;
  isActive: boolean;
  window?: IWindow;
}

/**
 * Window enforcement middleware factory
 * Checks if the specified window is currently active for the given project type
 */
export const enforceWindow = (
  windowKind: 'grouping' | 'application' | 'faculty-edit-title' | 'internal-eval' | 'external-eval',
  options: {
    projectTypeFromBody?: string; // Field name in request body for project type
    projectTypeFromParams?: string; // Field name in request params for project type
    projectTypeFromQuery?: string; // Field name in request query for project type
    defaultProjectType?: 'IDP' | 'UROP' | 'CAPSTONE'; // Default project type if not found
    bypassForCoordinator?: boolean; // Allow coordinators to bypass window enforcement
    bypassForAdmin?: boolean; // Allow admins to bypass window enforcement
  } = {}
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Determine project type from request
      let projectType: string | undefined;
      
      if (options.projectTypeFromBody) {
        projectType = req.body[options.projectTypeFromBody];
      } else if (options.projectTypeFromParams) {
        projectType = req.params[options.projectTypeFromParams];
      } else if (options.projectTypeFromQuery) {
        projectType = req.query[options.projectTypeFromQuery] as string;
      } else if (options.defaultProjectType) {
        projectType = options.defaultProjectType;
      }

      // Try to get project type from auth context if not found
      if (!projectType && (req as any).authContext?.eligibility?.type) {
        projectType = (req as any).authContext.eligibility.type;
      }

      if (!projectType) {
        res.status(400).json({
          success: false,
          error: {
            code: 'PROJECT_TYPE_REQUIRED',
            message: 'Project type is required for window enforcement',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Validate project type
      if (!['IDP', 'UROP', 'CAPSTONE'].includes(projectType)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PROJECT_TYPE',
            message: 'Invalid project type. Must be IDP, UROP, or CAPSTONE',
            details: { providedType: projectType },
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Check for bypass permissions
      const authContext = (req as any).authContext;
      const userRole = req.user?.role;

      if (options.bypassForAdmin && (userRole === 'admin' || authContext?.isAdmin)) {
        logger.debug(`Window enforcement bypassed for admin: ${req.user?.email}`);
        attachWindowContext(req, windowKind, projectType, true);
        next();
        return;
      }

      if (options.bypassForCoordinator && (userRole === 'coordinator' || authContext?.isCoordinator)) {
        logger.debug(`Window enforcement bypassed for coordinator: ${req.user?.email}`);
        attachWindowContext(req, windowKind, projectType, true);
        next();
        return;
      }

      // Find the window for this kind and project type
      const window = await Window.findOne({
        kind: windowKind,
        type: projectType as 'IDP' | 'UROP' | 'CAPSTONE',
      }) as IWindow | null;

      if (!window) {
        // No window defined - allow access (no enforcement)
        logger.debug(`No window defined for ${windowKind}/${projectType} - allowing access`);
        attachWindowContext(req, windowKind, projectType, true);
        next();
        return;
      }

      // Check if window enforcement is enabled
      if (!window.enforced) {
        logger.debug(`Window enforcement disabled for ${windowKind}/${projectType} - allowing access`);
        attachWindowContext(req, windowKind, projectType, true, window);
        next();
        return;
      }

      // Check if current time is within window
      const now = new Date();
      const isActive = now >= window.start && now <= window.end;

      if (!isActive) {
        logger.warn(`Window not active for ${windowKind}/${projectType}: ${req.user?.email}`);
        
        res.status(403).json({
          success: false,
          error: {
            code: 'WINDOW_NOT_ACTIVE',
            message: `${windowKind} window is not currently active for ${projectType} projects`,
            details: {
              windowKind,
              projectType,
              windowStart: window.start.toISOString(),
              windowEnd: window.end.toISOString(),
              currentTime: now.toISOString(),
            },
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      logger.debug(`Window active for ${windowKind}/${projectType}: ${req.user?.email}`);
      attachWindowContext(req, windowKind, projectType, true, window);
      next();

    } catch (error) {
      logger.error('Window enforcement failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'WINDOW_ENFORCEMENT_ERROR',
          message: 'Failed to check window status',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Middleware to check multiple windows (OR condition)
 * Allows access if ANY of the specified windows is active
 */
export const enforceAnyWindow = (
  windowKinds: Array<'grouping' | 'application' | 'faculty-edit-title' | 'internal-eval' | 'external-eval'>,
  options: {
    projectTypeFromBody?: string;
    projectTypeFromParams?: string;
    projectTypeFromQuery?: string;
    defaultProjectType?: 'IDP' | 'UROP' | 'CAPSTONE';
    bypassForCoordinator?: boolean;
    bypassForAdmin?: boolean;
  } = {}
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Determine project type (same logic as enforceWindow)
      let projectType: string | undefined;
      
      if (options.projectTypeFromBody) {
        projectType = req.body[options.projectTypeFromBody];
      } else if (options.projectTypeFromParams) {
        projectType = req.params[options.projectTypeFromParams];
      } else if (options.projectTypeFromQuery) {
        projectType = req.query[options.projectTypeFromQuery] as string;
      } else if (options.defaultProjectType) {
        projectType = options.defaultProjectType;
      }

      if (!projectType && (req as any).authContext?.eligibility?.type) {
        projectType = (req as any).authContext.eligibility.type;
      }

      if (!projectType || !['IDP', 'UROP', 'CAPSTONE'].includes(projectType)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'PROJECT_TYPE_REQUIRED',
            message: 'Valid project type is required for window enforcement',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Check for bypass permissions
      const authContext = (req as any).authContext;
      const userRole = req.user?.role;

      if (options.bypassForAdmin && (userRole === 'admin' || authContext?.isAdmin)) {
        attachWindowContext(req, windowKinds.join('|'), projectType, true);
        next();
        return;
      }

      if (options.bypassForCoordinator && (userRole === 'coordinator' || authContext?.isCoordinator)) {
        attachWindowContext(req, windowKinds.join('|'), projectType, true);
        next();
        return;
      }

      // Check all windows
      const windows = await Window.find({
        kind: { $in: windowKinds },
        type: projectType as 'IDP' | 'UROP' | 'CAPSTONE',
      }) as IWindow[];

      const now = new Date();
      let hasActiveWindow = false;
      let activeWindow: IWindow | undefined;

      for (const window of windows) {
        if (!window.enforced) {
          // If any window has enforcement disabled, allow access
          hasActiveWindow = true;
          activeWindow = window;
          break;
        }

        if (now >= window.start && now <= window.end) {
          hasActiveWindow = true;
          activeWindow = window;
          break;
        }
      }

      // If no windows are defined, allow access
      if (windows.length === 0) {
        hasActiveWindow = true;
      }

      if (!hasActiveWindow) {
        res.status(403).json({
          success: false,
          error: {
            code: 'NO_ACTIVE_WINDOWS',
            message: `None of the required windows are currently active for ${projectType} projects`,
            details: {
              requiredWindows: windowKinds,
              projectType,
              currentTime: now.toISOString(),
            },
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      attachWindowContext(req, windowKinds.join('|'), projectType, true, activeWindow);
      next();

    } catch (error) {
      logger.error('Multiple window enforcement failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'WINDOW_ENFORCEMENT_ERROR',
          message: 'Failed to check window status',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Utility function to get window status without enforcement
 * Useful for informational endpoints
 */
export const getWindowStatus = async (
  windowKind: string,
  projectType: 'IDP' | 'UROP' | 'CAPSTONE'
): Promise<{
  isActive: boolean;
  window?: IWindow;
  reason?: string;
}> => {
  try {
    const window = await Window.findOne({
      kind: windowKind,
      type: projectType,
    }) as IWindow | null;

    if (!window) {
      return { isActive: true, reason: 'No window defined' };
    }

    if (!window.enforced) {
      return { isActive: true, window, reason: 'Enforcement disabled' };
    }

    const now = new Date();
    const isActive = now >= window.start && now <= window.end;

    return {
      isActive,
      window,
      reason: isActive ? 'Window active' : 'Window not active'
    };

  } catch (error) {
    logger.error('Failed to get window status:', error);
    return { isActive: false, reason: 'Error checking window' };
  }
};

/**
 * Helper function to attach window context to request
 */
function attachWindowContext(
  req: Request,
  windowKind: string,
  projectType: string,
  isActive: boolean,
  window?: IWindow
): void {
  (req as any).windowContext = {
    windowKind,
    projectType,
    isActive,
    window,
  } as WindowContext;
}