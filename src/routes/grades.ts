import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import {
  createGrade,
  updateGrade,
  getGradeBySubmission,
  getAssessmentGrades,
  getStudentGrades,
  getAssessmentGradeStats,
  deleteGrade,
  getGradeHistory
} from '../services/gradingService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

const router = Router();

// Validation schemas
const createGradeSchema = z.object({
  score: z.number().min(0, 'Score cannot be negative'),
  maxScore: z.number().min(1, 'Max score must be at least 1').optional(),
  rubric: z.array(z.object({
    criteria: z.string().min(1, 'Criteria is required'),
    points: z.number().min(0, 'Points cannot be negative'),
    maxPoints: z.number().min(0, 'Max points cannot be negative'),
    feedback: z.string().optional(),
  })).optional(),
  comments: z.string().max(1000, 'Comments too long'),
});

const updateGradeSchema = createGradeSchema.partial();

/**
 * POST /submissions/:submissionId/grade
 * Create a grade for a submission (faculty only)
 */
router.post('/submissions/:submissionId/grade', 
  authenticate, 
  authorize('faculty'), 
  asyncHandler(async (req: Request, res: Response) => {
    const { submissionId } = req.params;
    const facultyId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid submission ID',
        },
      });
    }

    // Validate request body
    const validationResult = createGradeSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid grade data',
          details: validationResult.error.errors,
        },
      });
    }

    const gradeData = validationResult.data;

    try {
      const grade = await createGrade(facultyId, submissionId, gradeData);

      logger.info(`Grade created for submission ${submissionId} by faculty ${facultyId}`);

      res.status(201).json({
        success: true,
        data: {
          grade,
          message: 'Grade created successfully',
        },
      });

    } catch (error) {
      logger.error(`Failed to create grade for submission ${submissionId}:`, error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'RESOURCE_NOT_FOUND',
              message: error.message,
            },
          });
        }

        if (error.message.includes('already been graded')) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'ALREADY_GRADED',
              message: error.message,
            },
          });
        }

        if (error.message.includes('only grade submissions')) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: error.message,
            },
          });
        }

        if (error.message.includes('Score must be')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_SCORE',
              message: error.message,
            },
          });
        }
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'GRADE_CREATION_FAILED',
          message: 'Failed to create grade',
        },
      });
    }
  })
);

/**
 * GET /submissions/:submissionId/grade
 * Get grade for a specific submission
 */
router.get('/submissions/:submissionId/grade',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { submissionId } = req.params;
    const user = req.user!;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid submission ID',
        },
      });
    }

    try {
      const grade = await getGradeBySubmission(submissionId, user.id, user.role);

      if (!grade) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'GRADE_NOT_FOUND',
            message: 'Grade not found for this submission',
          },
        });
      }

      res.json({
        success: true,
        data: {
          grade,
        },
      });

    } catch (error) {
      logger.error(`Failed to get grade for submission ${submissionId}:`, error);

      if (error instanceof Error && error.message.includes('only view your own')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'GRADE_FETCH_FAILED',
          message: 'Failed to retrieve grade',
        },
      });
    }
  })
);

/**
 * PATCH /grades/:gradeId
 * Update an existing grade (faculty only)
 */
router.patch('/grades/:gradeId',
  authenticate,
  authorize('faculty'),
  asyncHandler(async (req: Request, res: Response) => {
    const { gradeId } = req.params;
    const facultyId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(gradeId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid grade ID',
        },
      });
    }

    // Validate request body
    const validationResult = updateGradeSchema.safeParse(req.body);
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
      const grade = await updateGrade(facultyId, gradeId, updateData);

      logger.info(`Grade updated: ${gradeId} by faculty ${facultyId}`);

      res.json({
        success: true,
        data: {
          grade,
          message: 'Grade updated successfully',
        },
      });

    } catch (error) {
      logger.error(`Failed to update grade ${gradeId}:`, error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'GRADE_NOT_FOUND',
              message: error.message,
            },
          });
        }

        if (error.message.includes('only update grades')) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: error.message,
            },
          });
        }

        if (error.message.includes('Score must be')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_SCORE',
              message: error.message,
            },
          });
        }
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'GRADE_UPDATE_FAILED',
          message: 'Failed to update grade',
        },
      });
    }
  })
);

/**
 * GET /assessments/:assessmentId/grades
 * Get all grades for an assessment (faculty only)
 */
router.get('/assessments/:assessmentId/grades',
  authenticate,
  authorize('faculty'),
  asyncHandler(async (req: Request, res: Response) => {
    const { assessmentId } = req.params;
    const facultyId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid assessment ID',
        },
      });
    }

    try {
      const grades = await getAssessmentGrades(facultyId, assessmentId);

      res.json({
        success: true,
        data: {
          grades,
          count: grades.length,
        },
      });

    } catch (error) {
      logger.error(`Failed to get grades for assessment ${assessmentId}:`, error);

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

        if (error.message.includes('only view grades')) {
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
          code: 'GRADES_FETCH_FAILED',
          message: 'Failed to retrieve grades',
        },
      });
    }
  })
);

/**
 * GET /students/:studentId/grades
 * Get all grades for a student (student can only see their own, faculty/admin can see any)
 */
router.get('/students/:studentId/grades',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { studentId } = req.params;
    const user = req.user!;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid student ID',
        },
      });
    }

    // Students can only view their own grades
    if (user.role === 'student' && studentId !== user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only view your own grades',
        },
      });
    }

    try {
      const grades = await getStudentGrades(studentId);

      res.json({
        success: true,
        data: {
          grades,
          count: grades.length,
        },
      });

    } catch (error) {
      logger.error(`Failed to get grades for student ${studentId}:`, error);

      res.status(500).json({
        success: false,
        error: {
          code: 'GRADES_FETCH_FAILED',
          message: 'Failed to retrieve student grades',
        },
      });
    }
  })
);

/**
 * GET /me/grades
 * Get current user's grades (students only)
 */
router.get('/me/grades',
  authenticate,
  authorize('student'),
  asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!.id;

    try {
      const grades = await getStudentGrades(studentId);

      res.json({
        success: true,
        data: {
          grades,
          count: grades.length,
        },
      });

    } catch (error) {
      logger.error(`Failed to get grades for current student ${studentId}:`, error);

      res.status(500).json({
        success: false,
        error: {
          code: 'GRADES_FETCH_FAILED',
          message: 'Failed to retrieve your grades',
        },
      });
    }
  })
);

/**
 * GET /assessments/:assessmentId/grades/stats
 * Get grade statistics for an assessment (faculty only)
 */
router.get('/assessments/:assessmentId/grades/stats',
  authenticate,
  authorize('faculty'),
  asyncHandler(async (req: Request, res: Response) => {
    const { assessmentId } = req.params;
    const facultyId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid assessment ID',
        },
      });
    }

    try {
      const stats = await getAssessmentGradeStats(facultyId, assessmentId);

      res.json({
        success: true,
        data: {
          statistics: stats,
        },
      });

    } catch (error) {
      logger.error(`Failed to get grade statistics for assessment ${assessmentId}:`, error);

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

        if (error.message.includes('only view statistics')) {
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
          code: 'STATS_FETCH_FAILED',
          message: 'Failed to retrieve grade statistics',
        },
      });
    }
  })
);

/**
 * DELETE /grades/:gradeId
 * Delete a grade (admin only)
 */
router.delete('/grades/:gradeId',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const { gradeId } = req.params;
    const user = req.user!;

    if (!mongoose.Types.ObjectId.isValid(gradeId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid grade ID',
        },
      });
    }

    try {
      await deleteGrade(gradeId, user.id, user.role);

      logger.info(`Grade deleted: ${gradeId} by admin ${user.id}`);

      res.json({
        success: true,
        data: {
          message: 'Grade deleted successfully',
          deleted: true,
        },
      });

    } catch (error) {
      logger.error(`Failed to delete grade ${gradeId}:`, error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'GRADE_NOT_FOUND',
              message: error.message,
            },
          });
        }

        if (error.message.includes('Only administrators')) {
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
          code: 'GRADE_DELETE_FAILED',
          message: 'Failed to delete grade',
        },
      });
    }
  })
);

/**
 * GET /submissions/:submissionId/grade/history
 * Get grade history for a submission
 */
router.get('/submissions/:submissionId/grade/history',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { submissionId } = req.params;
    const user = req.user!;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid submission ID',
        },
      });
    }

    try {
      const history = await getGradeHistory(submissionId, user.id, user.role);

      res.json({
        success: true,
        data: {
          history,
          count: history.length,
        },
      });

    } catch (error) {
      logger.error(`Failed to get grade history for submission ${submissionId}:`, error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'GRADE_NOT_FOUND',
              message: error.message,
            },
          });
        }

        if (error.message.includes('only view your own')) {
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
          code: 'HISTORY_FETCH_FAILED',
          message: 'Failed to retrieve grade history',
        },
      });
    }
  })
);

export default router;