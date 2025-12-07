import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import {
  getUsers,
  updateUserRole,
  getSystemStats,
  createCohort,
  updateCohort,
  createCourse,
  generateReports,
  deleteUser
} from '../services/adminService';
import { Cohort } from '../models/Cohort';
import { Course } from '../models/Course';
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

const createCohortSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  year: z.number().min(2020).max(2030),
  department: z.enum([
    'Computer Science',
    'Information Technology',
    'Electronics and Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Chemical Engineering',
    'Biotechnology',
    'Management Studies',
    'Liberal Arts'
  ]),
  studentIds: z.array(z.string()).optional(),
  facultyIds: z.array(z.string()).optional(),
});

const updateCohortSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  year: z.number().min(2020).max(2030).optional(),
  department: z.enum([
    'Computer Science',
    'Information Technology',
    'Electronics and Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Chemical Engineering',
    'Biotechnology',
    'Management Studies',
    'Liberal Arts'
  ]).optional(),
  addStudents: z.array(z.string()).optional(),
  removeStudents: z.array(z.string()).optional(),
  addFaculty: z.array(z.string()).optional(),
  removeFaculty: z.array(z.string()).optional(),
});

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
 * Get all cohorts
 */
router.get('/cohorts', authenticate, authorize('admin'), asyncHandler(async (_req: Request, res: Response) => {
  try {
    const cohorts = await Cohort.find()
      .populate('members', 'name email role')
      .sort({ year: -1, name: 1 });

    res.json({
      success: true,
      data: {
        cohorts,
        count: cohorts.length,
      },
    });

  } catch (error) {
    logger.error('Failed to get cohorts:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'COHORTS_FETCH_FAILED',
        message: 'Failed to retrieve cohorts',
      },
    });
  }
}));

/**
 * POST /admin/cohorts
 * Create a new cohort
 */
router.post('/cohorts', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.id;

  // Validate request body
  const validationResult = createCohortSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid cohort data',
        details: validationResult.error.errors,
      },
    });
  }

  const cohortData = validationResult.data as {
    name: string;
    year: number;
    department: string;
    studentIds?: string[];
    facultyIds?: string[];
  };

  try {
    const cohort = await createCohort(cohortData, adminId);

    logger.info(`Cohort created: ${cohort.name} by admin ${adminId}`);

    res.status(201).json({
      success: true,
      data: {
        cohort,
        message: 'Cohort created successfully',
      },
    });

  } catch (error) {
    logger.error('Failed to create cohort:', error);

    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'COHORT_EXISTS',
          message: error.message,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'COHORT_CREATION_FAILED',
        message: 'Failed to create cohort',
      },
    });
  }
}));

/**
 * PATCH /admin/cohorts/:cohortId
 * Update cohort membership and details
 */
router.patch('/cohorts/:cohortId', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { cohortId } = req.params;
  const adminId = req.user!.id;

  if (!mongoose.Types.ObjectId.isValid(cohortId)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid cohort ID',
      },
    });
  }

  // Validate request body
  const validationResult = updateCohortSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid update data',
        details: validationResult.error.errors,
      },
    });
  }

  const updates = validationResult.data;

  try {
    const cohort = await updateCohort(cohortId, updates, adminId);

    logger.info(`Cohort updated: ${cohortId} by admin ${adminId}`);

    res.json({
      success: true,
      data: {
        cohort,
        message: 'Cohort updated successfully',
      },
    });

  } catch (error) {
    logger.error(`Failed to update cohort ${cohortId}:`, error);

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COHORT_NOT_FOUND',
          message: error.message,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'COHORT_UPDATE_FAILED',
        message: 'Failed to update cohort',
      },
    });
  }
}));

/**
 * POST /admin/cohorts/:cohortId/members
 * Add members to a cohort
 */
router.post('/cohorts/:cohortId/members', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { cohortId } = req.params;
  const { userIds } = req.body;

  if (!mongoose.Types.ObjectId.isValid(cohortId)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid cohort ID',
      },
    });
  }

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'userIds must be a non-empty array',
      },
    });
  }

  try {
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COHORT_NOT_FOUND',
          message: 'Cohort not found',
        },
      });
    }

    // Add members (avoid duplicates)
    const newMembers = userIds.filter(id => !cohort.members.includes(id));
    cohort.members.push(...newMembers);
    await cohort.save();

    const updatedCohort = await Cohort.findById(cohortId).populate('members', 'name email role');

    logger.info(`Added ${newMembers.length} members to cohort ${cohortId}`);

    res.json({
      success: true,
      data: {
        cohort: updatedCohort,
        addedCount: newMembers.length,
        message: `Added ${newMembers.length} member(s) to cohort`,
      },
    });

  } catch (error) {
    logger.error(`Failed to add members to cohort ${cohortId}:`, error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ADD_MEMBERS_FAILED',
        message: 'Failed to add members to cohort',
      },
    });
  }
}));

/**
 * DELETE /admin/cohorts/:cohortId/members/:userId
 * Remove a member from a cohort
 */
router.delete('/cohorts/:cohortId/members/:userId', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { cohortId, userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(cohortId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid cohort or user ID',
      },
    });
  }

  try {
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COHORT_NOT_FOUND',
          message: 'Cohort not found',
        },
      });
    }

    // Remove member
    cohort.members = cohort.members.filter(id => id.toString() !== userId);
    await cohort.save();

    const updatedCohort = await Cohort.findById(cohortId).populate('members', 'name email role');

    logger.info(`Removed member ${userId} from cohort ${cohortId}`);

    res.json({
      success: true,
      data: {
        cohort: updatedCohort,
        message: 'Member removed from cohort',
      },
    });

  } catch (error) {
    logger.error(`Failed to remove member from cohort ${cohortId}:`, error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REMOVE_MEMBER_FAILED',
        message: 'Failed to remove member from cohort',
      },
    });
  }
}));

/**
 * GET /admin/courses
 * Get all courses
 */
router.get('/courses', authenticate, authorize('admin'), asyncHandler(async (_req: Request, res: Response) => {
  try {
    const courses = await Course.find()
      .populate('facultyId', 'name email')
      .populate('cohorts', 'name year department')
      .sort({ year: -1, semester: 1, code: 1 });

    res.json({
      success: true,
      data: {
        courses,
        count: courses.length,
      },
    });

  } catch (error) {
    logger.error('Failed to get courses:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'COURSES_FETCH_FAILED',
        message: 'Failed to retrieve courses',
      },
    });
  }
}));

/**
 * POST /admin/courses
 * Create a new course
 */
router.post('/courses', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.id;

  // Validate request body
  const validationResult = createCourseSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid course data',
        details: validationResult.error.errors,
      },
    });
  }

  const courseData = validationResult.data as {
    code: string;
    title: string;
    description?: string;
    credits: number;
    facultyId: string;
    cohortIds?: string[];
    semester: 'Fall' | 'Spring' | 'Summer';
    year: number;
  };

  try {
    const course = await createCourse(courseData, adminId);

    logger.info(`Course created: ${course.code} by admin ${adminId}`);

    res.status(201).json({
      success: true,
      data: {
        course,
        message: 'Course created successfully',
      },
    });

  } catch (error) {
    logger.error('Failed to create course:', error);

    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'COURSE_EXISTS',
          message: error.message,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'COURSE_CREATION_FAILED',
        message: 'Failed to create course',
      },
    });
  }
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