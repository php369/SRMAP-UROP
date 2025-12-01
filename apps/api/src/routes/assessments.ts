import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import { 
  createAssessmentWithMeetLink,
  updateAssessmentWithCalendar,
  deleteAssessmentWithCalendar,
  getFacultyAssessments,
  getStudentAssessments,
  completeCalendarAuth
} from '../services/assessmentService';
import { Assessment } from '../models/Assessment';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

const router = Router();

// Validation schemas
const createAssessmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  courseId: z.string().min(1, 'Course ID is required'),
  dueAt: z.string().datetime('Invalid due date format'),
  cohortIds: z.array(z.string()).min(1, 'At least one cohort is required'),
  settings: z.object({
    allowLateSubmissions: z.boolean().optional(),
    maxFileSize: z.number().min(1024).max(100 * 1024 * 1024).optional(), // 1KB to 100MB
    allowedFileTypes: z.array(z.string()).optional(),
  }).optional(),
});

const updateAssessmentSchema = createAssessmentSchema.partial();

const querySchema = z.object({
  courseId: z.string().optional(),
  status: z.enum(['draft', 'published', 'closed']).optional(),
  scope: z.enum(['mine', 'course', 'cohort']).optional(),
  limit: z.string().transform(Number).optional(),
  skip: z.string().transform(Number).optional(),
});

/**
 * @swagger
 * /api/v1/assessments:
 *   post:
 *     summary: Create a new assessment with automatic Meet link generation
 *     description: Creates a new assessment and automatically generates Google Meet link and calendar event (faculty only)
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAssessmentRequest'
 *     responses:
 *       201:
 *         description: Assessment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         assessment:
 *                           $ref: '#/components/schemas/Assessment'
 *                         message:
 *                           type: string
 *                           example: 'Assessment created successfully with Meet link.'
 *       400:
 *         description: Invalid assessment data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Insufficient permissions (faculty only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Course or cohort not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Assessment creation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', authenticate, authorize('faculty'), asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validationResult = createAssessmentSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid assessment data',
        details: validationResult.error.errors,
      },
    });
  }

  const assessmentData = validationResult.data;
  const facultyId = req.user!.id;

  try {
    const assessment = await createAssessmentWithMeetLink(facultyId, assessmentData);

    logger.info(`Assessment created by faculty ${facultyId}: ${assessment._id}`);

    res.status(201).json({
      success: true,
      data: {
        assessment,
        message: assessment.needsCalendarAuth 
          ? 'Assessment created. Please complete calendar authentication to generate Meet link.'
          : 'Assessment created successfully with Meet link.',
      },
    });

  } catch (error) {
    logger.error(`Failed to create assessment for faculty ${facultyId}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('Only faculty members')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: error.message,
          },
        });
      }
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: error.message,
          },
        });
      }
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'ASSESSMENT_CREATION_FAILED',
        message: 'Failed to create assessment',
      },
    });
  }
}));

/**
 * @swagger
 * /api/v1/assessments:
 *   get:
 *     summary: Get assessments based on user role and query parameters
 *     description: Returns assessments visible to the current user based on their role (students see cohort assessments, faculty see their own, admins see all)
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by course ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, closed]
 *         description: Filter by assessment status
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *           enum: [mine, course, cohort]
 *         description: Filter scope (faculty only)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of assessments to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of assessments to skip
 *     responses:
 *       200:
 *         description: Assessments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         assessments:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Assessment'
 *                         count:
 *                           type: integer
 *                           example: 10
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             limit:
 *                               type: integer
 *                               example: 50
 *                             skip:
 *                               type: integer
 *                               example: 0
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Invalid user role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to retrieve assessments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Validate query parameters
  const queryResult = querySchema.safeParse(req.query);
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

  const { courseId, status, limit, skip } = queryResult.data;
  const user = req.user!;

  try {
    let assessments;

    if (user.role === 'faculty') {
      // Faculty can see their own assessments
      assessments = await getFacultyAssessments(user.id, {
        courseId,
        status,
        limit,
        skip,
      });
    } else if (user.role === 'student') {
      // Students can see assessments assigned to their cohorts
      assessments = await getStudentAssessments(user.id, {
        courseId,
        status: status as 'published' | 'closed' | undefined,
        limit,
        skip,
      });
    } else if (user.role === 'admin') {
      // Admins can see all assessments
      const query: any = {};
      if (courseId) query.courseId = new mongoose.Types.ObjectId(courseId);
      if (status) query.status = status;

      assessments = await Assessment.find(query)
        .populate('courseId', 'title code')
        .populate('facultyId', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit || 50)
        .skip(skip || 0);
    } else {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Invalid user role',
        },
      });
    }

    res.json({
      success: true,
      data: {
        assessments,
        count: assessments.length,
        pagination: {
          limit: limit || 50,
          skip: skip || 0,
        },
      },
    });

  } catch (error) {
    logger.error(`Failed to get assessments for user ${user.id}:`, error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'ASSESSMENTS_FETCH_FAILED',
        message: 'Failed to retrieve assessments',
      },
    });
  }
}));

/**
 * GET /assessments/:id
 * Get a specific assessment by ID
 */
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid assessment ID',
      },
    });
  }

  try {
    const assessment = await Assessment.findById(id)
      .populate('courseId', 'title code')
      .populate('facultyId', 'name email');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment not found',
        },
      });
    }

    // Check permissions
    if (user.role === 'student') {
      // Students can only see published assessments assigned to their cohorts
      // This would require checking cohort membership - simplified for now
      if (assessment.status !== 'published') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ASSESSMENT_NOT_AVAILABLE',
            message: 'Assessment is not available',
          },
        });
      }
    } else if (user.role === 'faculty') {
      // Faculty can only see their own assessments
      if (assessment.facultyId._id.toString() !== user.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'You can only view your own assessments',
          },
        });
      }
    }
    // Admins can see all assessments

    res.json({
      success: true,
      data: {
        assessment,
      },
    });

  } catch (error) {
    logger.error(`Failed to get assessment ${id}:`, error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'ASSESSMENT_FETCH_FAILED',
        message: 'Failed to retrieve assessment',
      },
    });
  }
}));

/**
 * PATCH /assessments/:id
 * Update an existing assessment
 */
router.patch('/:id', authenticate, authorize('faculty'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const facultyId = req.user!.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid assessment ID',
      },
    });
  }

  // Validate request body
  const validationResult = updateAssessmentSchema.safeParse(req.body);
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

  const updateData = validationResult.data;

  try {
    const assessment = await updateAssessmentWithCalendar(facultyId, id, updateData);

    logger.info(`Assessment updated by faculty ${facultyId}: ${id}`);

    res.json({
      success: true,
      data: {
        assessment,
        message: 'Assessment updated successfully',
      },
    });

  } catch (error) {
    logger.error(`Failed to update assessment ${id}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ASSESSMENT_NOT_FOUND',
            message: error.message,
          },
        });
      }
      
      if (error.message.includes('only update your own')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: error.message,
          },
        });
      }
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'ASSESSMENT_UPDATE_FAILED',
        message: 'Failed to update assessment',
      },
    });
  }
}));

/**
 * DELETE /assessments/:id
 * Delete an assessment and its calendar event
 */
router.delete('/:id', authenticate, authorize('faculty', 'admin'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid assessment ID',
      },
    });
  }

  try {
    // For faculty, use the service that checks ownership
    // For admin, allow direct deletion
    if (user.role === 'faculty') {
      await deleteAssessmentWithCalendar(user.id, id);
    } else {
      // Admin can delete any assessment
      const assessment = await Assessment.findById(id);
      if (!assessment) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ASSESSMENT_NOT_FOUND',
            message: 'Assessment not found',
          },
        });
      }

      await deleteAssessmentWithCalendar(assessment.facultyId.toString(), id);
    }

    logger.info(`Assessment deleted by ${user.role} ${user.id}: ${id}`);

    res.json({
      success: true,
      data: {
        message: 'Assessment deleted successfully',
        deleted: true,
        calendarEventDeleted: true,
      },
    });

  } catch (error) {
    logger.error(`Failed to delete assessment ${id}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ASSESSMENT_NOT_FOUND',
            message: error.message,
          },
        });
      }
      
      if (error.message.includes('only delete your own')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: error.message,
          },
        });
      }
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'ASSESSMENT_DELETE_FAILED',
        message: 'Failed to delete assessment',
      },
    });
  }
}));

/**
 * POST /assessments/:id/calendar-auth
 * Complete calendar authentication for an assessment
 */
router.post('/:id/calendar-auth', authenticate, authorize('faculty'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { code } = req.body;
  const facultyId = req.user!.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid assessment ID',
      },
    });
  }

  if (!code) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Authorization code is required',
      },
    });
  }

  try {
    const assessment = await completeCalendarAuth(facultyId, id, code);

    logger.info(`Calendar authentication completed for assessment ${id}`);

    res.json({
      success: true,
      data: {
        assessment,
        message: 'Calendar authentication completed successfully',
      },
    });

  } catch (error) {
    logger.error(`Failed to complete calendar auth for assessment ${id}:`, error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'CALENDAR_AUTH_FAILED',
        message: 'Failed to complete calendar authentication',
      },
    });
  }
}));

export default router;