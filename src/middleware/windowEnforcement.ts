import { Request, Response, NextFunction } from 'express';
import { isWindowActive } from '../services/windowService';
import { IWindow } from '../models/Window';
import { logger } from '../utils/logger';

/**
 * Middleware factory to enforce window-based access control
 * @param windowType - Type of window to check
 * @param getProjectType - Function to extract project type from request
 * @param getAssessmentType - Optional function to extract assessment type from request
 * @returns Express middleware
 */
export function requireActiveWindow(
  windowType: IWindow['windowType'],
  getProjectType: (req: Request) => IWindow['projectType'],
  getAssessmentType?: (req: Request) => IWindow['assessmentType'] | undefined
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectType = getProjectType(req);
      const assessmentType = getAssessmentType ? getAssessmentType(req) : undefined;

      if (!projectType) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PROJECT_TYPE',
            message: 'Project type is required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const active = await isWindowActive(windowType, projectType, assessmentType);

      if (!active) {
        const windowName = assessmentType
          ? `${windowType} (${assessmentType})`
          : windowType;

        logger.warn(`Window enforcement failed: ${windowName} for ${projectType} is not active`);

        res.status(423).json({
          success: false,
          error: {
            code: 'WINDOW_CLOSED',
            message: `The ${windowName} window is currently closed for ${projectType} projects`,
            details: {
              windowType,
              projectType,
              assessmentType,
            },
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Window enforcement error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'WINDOW_CHECK_FAILED',
          message: 'Failed to verify window status',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}

/**
 * Middleware to check if proposal window is active
 * Expects projectType in request body or params
 */
export const requireProposalWindow = requireActiveWindow(
  'proposal',
  (req) => req.body.projectType || req.params.projectType || req.query.projectType
);

/**
 * Middleware to check if application window is active
 * Expects projectType in request body or params
 */
export const requireApplicationWindow = requireActiveWindow(
  'application',
  (req) => req.body.projectType || req.params.projectType || req.query.projectType
);

/**
 * Middleware to check if submission window is active
 * Expects projectType and assessmentType in request body or params
 */
export const requireSubmissionWindow = requireActiveWindow(
  'submission',
  (req) => req.body.projectType || req.params.projectType || req.query.projectType,
  (req) => req.body.assessmentType || req.params.assessmentType || req.query.assessmentType
);

/**
 * Middleware to check if assessment window is active
 * Expects projectType and assessmentType in request body or params
 */
export const requireAssessmentWindow = requireActiveWindow(
  'assessment',
  (req) => req.body.projectType || req.params.projectType || req.query.projectType,
  (req) => req.body.assessmentType || req.params.assessmentType || req.query.assessmentType
);

/**
 * Middleware to check if grade release window is active
 * Expects projectType in request body or params
 */
export const requireGradeReleaseWindow = requireActiveWindow(
  'grade_release',
  (req) => req.body.projectType || req.params.projectType || req.query.projectType
);

/**
 * Enforce window access for any window type
 * @param windowType - Type of window to enforce
 * @param projectType - Project type to check
 * @param assessmentType - Optional assessment type
 */
export const enforceWindow = requireActiveWindow;

/**
 * Enforce window access for any window type (alias)
 */
export const enforceAnyWindow = requireActiveWindow;

/**
 * Get window status for a specific window type and project type
 * @param windowType - Type of window to check
 * @param projectType - Project type to check
 * @param assessmentType - Optional assessment type
 * @returns Promise<boolean> - Whether the window is active
 */
export async function getWindowStatus(
  windowType: IWindow['windowType'],
  projectType: IWindow['projectType'],
  assessmentType?: IWindow['assessmentType']
): Promise<boolean> {
  try {
    return await isWindowActive(windowType, projectType, assessmentType);
  } catch (error) {
    logger.error('Failed to get window status:', error);
    return false;
  }
}
