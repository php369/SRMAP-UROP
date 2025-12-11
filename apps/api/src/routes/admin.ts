import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import {
  getUsers,
  updateUserRole,
  getSystemStats,
  generateReports,
  deleteUser
} from '../services/adminService';
// Cohort model removed - functionality disabled
// Course model removed - functionality disabled
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

const router = Router();

// Validation schemas
const userSearchSchema = z.object({
  role: z.enum(['idp-student', 'urop-student', 'capstone-student', 'faculty', 'admin']).optional(),
  department: z.string().optional(),
  year: z.string().transform(Number).optional(),
  search: z.string().optional(),
  limit: z.string().transform(Number).optional(),
  skip: z.string().transform(Number).optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['idp-student', 'urop-student', 'capstone-student', 'faculty', 'admin']),
});

// Cohort schemas removed - functionality disabled

const createCourseSchema = z.object({
  code: z.string().min(1, 'Course code is required').max(20, 'Code too long'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  credits: z.number().min(1).max(6),
  facultyId: z.string().min(1, 'Faculty ID is required'),
  cohortIds: z.array(z.string()).optional(),
  semester: z.enum(['Fall', 'Spring', 'Summer']),
  year: z.number().min(2020).max(2030),
});

const reportDateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Eligibility and Faculty Roster endpoints removed - collections dropped from database
// Authorization now based on User model fields: role, isCoordinator, isExternalEvaluator, department

/**
 * GET /admin/users
 * Get all users with optional filtering and search
 */
router.get('/users', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  // Validate query parameters
  const queryResult = userSearchSchema.safeParse(req.query);
  if (!queryResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        details: queryResult.error.errors,
      },
    });
  }

  const filters = queryResult.data;

  try {
    const users = await getUsers(filters);

    res.json({
      success: true,
      data: {
        users,
        count: users.length,
        filters: filters,
      },
    });

  } catch (error) {
    logger.error('Failed to get users:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'USERS_FETCH_FAILED',
        message: 'Failed to retrieve users',
      },
    });
  }
}));

/**
 * PATCH /admin/users/:userId/role
 * Update user role
 */
router.patch('/users/:userId/role', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const adminId = req.user!.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid user ID',
      },
    });
  }

  // Validate request body
  const validationResult = updateRoleSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid role data',
        details: validationResult.error.errors,
      },
    });
  }

  const { role } = validationResult.data;

  try {
    const user = await updateUserRole(userId, role, adminId);

    logger.info(`User role updated: ${userId} to ${role} by admin ${adminId}`);

    res.json({
      success: true,
      data: {
        user,
        message: `User role updated to ${role}`,
      },
    });

  } catch (error) {
    logger.error(`Failed to update user role for ${userId}:`, error);

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: error.message,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'ROLE_UPDATE_FAILED',
        message: 'Failed to update user role',
      },
    });
  }
}));

/**
 * DELETE /admin/users/:userId
 * Delete a user (with safety checks)
 */
router.delete('/users/:userId', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const adminId = req.user!.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid user ID',
      },
    });
  }

  // Prevent self-deletion
  if (userId === adminId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'SELF_DELETE_FORBIDDEN',
        message: 'Cannot delete your own account',
      },
    });
  }

  try {
    await deleteUser(userId, adminId);

    logger.info(`User deleted: ${userId} by admin ${adminId}`);

    res.json({
      success: true,
      data: {
        message: 'User deleted successfully',
        deleted: true,
      },
    });

  } catch (error) {
    logger.error(`Failed to delete user ${userId}:`, error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: error.message,
          },
        });
      }

      if (error.message.includes('Cannot delete')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DELETE_FORBIDDEN',
            message: error.message,
          },
        });
      }
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'USER_DELETE_FAILED',
        message: 'Failed to delete user',
      },
    });
  }
}));

/**
 * GET /admin/stats
 * Get system-wide statistics
 */
router.get('/stats', authenticate, authorize('admin'), asyncHandler(async (_req: Request, res: Response) => {
  try {
    const stats = await getSystemStats();

    res.json({
      success: true,
      data: {
        statistics: stats,
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error('Failed to get system stats:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_FETCH_FAILED',
        message: 'Failed to retrieve system statistics',
      },
    });
  }
}));

/**
 * GET /admin/cohorts
 * Cohorts functionality disabled - model removed
 */
router.get('/cohorts', authenticate, authorize('admin'), asyncHandler(async (_req: Request, res: Response) => {
  res.status(410).json({
    success: false,
    error: {
      code: 'FEATURE_DISABLED',
      message: 'Cohorts functionality has been disabled',
    },
  });
}));

/**
 * POST /admin/cohorts
 * Cohorts functionality disabled - model removed
 */
router.post('/cohorts', authenticate, authorize('admin'), asyncHandler(async (_req: Request, res: Response) => {
  res.status(410).json({
    success: false,
    error: {
      code: 'FEATURE_DISABLED',
      message: 'Cohorts functionality has been disabled',
    },
  });
}));

/**
 * PATCH /admin/cohorts/:cohortId
 * Cohorts functionality disabled - model removed
 */
router.patch('/cohorts/:cohortId', authenticate, authorize('admin'), asyncHandler(async (_req: Request, res: Response) => {
  res.status(410).json({
    success: false,
    error: {
      code: 'FEATURE_DISABLED',
      message: 'Cohorts functionality has been disabled',
    },
  });
}));

/**
 * POST /admin/cohorts/:cohortId/members
 * Cohorts functionality disabled - model removed
 */
router.post('/cohorts/:cohortId/members', authenticate, authorize('admin'), asyncHandler(async (_req: Request, res: Response) => {
  res.status(410).json({
    success: false,
    error: {
      code: 'FEATURE_DISABLED',
      message: 'Cohorts functionality has been disabled',
    },
  });
}));

/**
 * DELETE /admin/cohorts/:cohortId/members/:userId
 * Cohorts functionality disabled - model removed
 */
router.delete('/cohorts/:cohortId/members/:userId', authenticate, authorize('admin'), asyncHandler(async (_req: Request, res: Response) => {
  res.status(410).json({
    success: false,
    error: {
      code: 'FEATURE_DISABLED',
      message: 'Cohorts functionality has been disabled',
    },
  });
}));

/**
 * GET /admin/courses
 * Courses functionality disabled - model removed
 */
router.get('/courses', authenticate, authorize('admin'), asyncHandler(async (_req: Request, res: Response) => {
  res.status(410).json({
    success: false,
    error: {
      code: 'FEATURE_DISABLED',
      message: 'Courses functionality has been disabled',
    },
  });
}));

/**
 * POST /admin/courses
 * Courses functionality disabled - model removed
 */
router.post('/courses', authenticate, authorize('admin'), asyncHandler(async (_req: Request, res: Response) => {
  res.status(410).json({
    success: false,
    error: {
      code: 'FEATURE_DISABLED',
      message: 'Courses functionality has been disabled',
    },
  });
}));

/**
 * GET /admin/reports
 * Generate comprehensive reports
 */
router.get('/reports', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  // Validate query parameters
  const queryResult = reportDateRangeSchema.safeParse(req.query);
  if (!queryResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid date range parameters',
        details: queryResult.error.errors,
      },
    });
  }

  const { startDate, endDate } = queryResult.data;
  const dateRange = startDate && endDate ? {
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  } : undefined;

  try {
    const reports = await generateReports('users', dateRange || {});

    res.json({
      success: true,
      data: {
        reports,
        dateRange,
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error('Failed to generate reports:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'REPORTS_GENERATION_FAILED',
        message: 'Failed to generate reports',
      },
    });
  }
}));

/**
 * GET /admin/reports/csv
 * Export reports as CSV
 */
router.get('/reports/csv', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.query;

  if (!type || !['assessments', 'grading', 'activity'].includes(type as string)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REPORT_TYPE',
        message: 'Report type must be one of: assessments, grading, activity',
      },
    });
  }

  try {
    const reports = await generateReports('users');
    let csvData = '';
    let filename = '';

    switch (type) {
      case 'assessments':
        filename = `assessment-report-${new Date().toISOString().split('T')[0]}.csv`;
        csvData = 'Assessment ID,Title,Course,Faculty,Total Submissions,Graded Submissions,Average Grade,Due Date,Created At\n';
        csvData += (reports.assessmentReport || []).map((row: any) =>
          `${row.assessmentId},"${row.title}","${row.course}","${row.faculty}",${row.totalSubmissions},${row.gradedSubmissions},${row.averageGrade},${row.dueDate.toISOString()},${row.createdAt.toISOString()}`
        ).join('\n');
        break;

      case 'grading':
        filename = `grading-latency-report-${new Date().toISOString().split('T')[0]}.csv`;
        csvData = 'Faculty ID,Faculty Name,Average Grading Time (hours),Total Graded,Pending Grades\n';
        csvData += (reports.gradingLatencyReport || []).map((row: any) =>
          `${row.facultyId},"${row.facultyName}",${row.averageGradingTime},${row.totalGraded},${row.pendingGrades}`
        ).join('\n');
        break;

      case 'activity':
        filename = `activity-report-${new Date().toISOString().split('T')[0]}.csv`;
        csvData = 'Date,New Users,Submissions,Grades,Assessments\n';
        csvData += (reports.activityReport || []).map((row: any) =>
          `${row.date.toISOString().split('T')[0]},${row.newUsers},${row.submissions},${row.grades},${row.assessments}`
        ).join('\n');
        break;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);

  } catch (error) {
    logger.error('Failed to export CSV report:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'CSV_EXPORT_FAILED',
        message: 'Failed to export CSV report',
      },
    });
  }
}));

export default router;