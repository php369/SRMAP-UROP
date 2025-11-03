import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import { uploadMultiple, validateUploadedFiles, handleUploadErrors } from '../middleware/upload';
import {
  createSubmission,
  getStudentSubmissions,
  getAssessmentSubmissions,
  getSubmissionById,
  updateSubmissionStatus,
  deleteSubmission,
  getSubmissionStats,
} from '../services/submissionService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

const router = Router();

// Validation schemas
const createSubmissionSchema = z.object({
  assessmentId: z.string().min(1, 'Assessment ID is required'),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

const querySchema = z.object({
  assessmentId: z.string().optional(),
  status: z.enum(['submitted', 'graded', 'returned']).optional(),
  limit: z.string().transform(Number).optional(),
  skip: z.string().transform(Number).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['submitted', 'graded', 'returned']),
});

/**
 * POST /submissions
 * Create a new submission with file uploads
 */
router.post(
  '/',
  authenticate,
  authorize('student'),
  uploadMultiple('files', 10), // Allow up to 10 files
  handleUploadErrors,
  validateUploadedFiles(), // Use default validation
  asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const validationResult = createSubmissionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid submission data',
          details: validationResult.error.errors,
        },
      });
    }

    const { assessmentId, notes } = validationResult.data;
    const studentId = req.user!.id;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES_UPLOADED',
          message: 'At least one file must be uploaded',
        },
      });
    }

    try {
      const submission = await createSubmission(studentId, {
        assessmentId,
        notes,
        files,
        metadata: {
          ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
        },
      });

      logger.info(`Submission created by student ${studentId}: ${submission._id}`);

      res.status(201).json({
        success: true,
        data: {
          submission,
          message: submission.isLate 
            ? 'Submission created successfully (submitted after deadline)'
            : 'Submission created successfully',
        },
      });

    } catch (error) {
      logger.error(`Failed to create submission for student ${studentId}:`, error);
      
      if (error instanceof Error) {
        if (error.message.includes('deadline has passed')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'DEADLINE_PASSED',
              message: error.message,
            },
          });
        }
        
        if (error.message.includes('already submitted')) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'ALREADY_SUBMITTED',
              message: error.message,
            },
          });
        }
        
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'ASSESSMENT_NOT_FOUND',
              message: error.message,
            },
          });
        }
        
        if (error.message.includes('file size') || error.message.includes('file type')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'FILE_VALIDATION_ERROR',
              message: error.message,
            },
          });
        }
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'SUBMISSION_CREATION_FAILED',
          message: 'Failed to create submission',
        },
      });
    }
  })
);

/**
 * GET /submissions
 * Get submissions based on user role and query parameters
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

  const { assessmentId, status, limit, skip } = queryResult.data;
  const user = req.user!;

  try {
    let submissions;

    if (user.role === 'student') {
      // Students can see their own submissions
      submissions = await getStudentSubmissions(user.id, {
        assessmentId,
        status,
        limit,
        skip,
      });
    } else if (user.role === 'faculty') {
      // Faculty need to specify an assessment ID to view submissions
      if (!assessmentId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ASSESSMENT_ID_REQUIRED',
            message: 'Assessment ID is required for faculty to view submissions',
          },
        });
      }

      submissions = await getAssessmentSubmissions(user.id, assessmentId, {
        status,
        limit,
        skip,
      });
    } else if (user.role === 'admin') {
      // Admins can view all submissions (simplified implementation)
      const { Submission } = await import('../models/Submission');
      const query: any = {};
      if (assessmentId) query.assessmentId = new mongoose.Types.ObjectId(assessmentId);
      if (status) query.status = status;

      submissions = await Submission.find(query)
        .populate('assessmentId', 'title courseId')
        .populate('studentId', 'name email')
        .sort({ submittedAt: -1 })
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
        submissions,
        count: submissions.length,
        pagination: {
          limit: limit || 50,
          skip: skip || 0,
        },
      },
    });

  } catch (error) {
    logger.error(`Failed to get submissions for user ${user.id}:`, error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: error.message,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SUBMISSIONS_FETCH_FAILED',
        message: 'Failed to retrieve submissions',
      },
    });
  }
}));

/**
 * GET /submissions/:id
 * Get a specific submission by ID
 */
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid submission ID',
      },
    });
  }

  try {
    const submission = await getSubmissionById(id, user.id, user.role);

    res.json({
      success: true,
      data: {
        submission,
      },
    });

  } catch (error) {
    logger.error(`Failed to get submission ${id}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SUBMISSION_NOT_FOUND',
            message: error.message,
          },
        });
      }
      
      if (error.message.includes('only view your own') || error.message.includes('only view submissions for your own')) {
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
        code: 'SUBMISSION_FETCH_FAILED',
        message: 'Failed to retrieve submission',
      },
    });
  }
}));

/**
 * PATCH /submissions/:id/status
 * Update submission status (for grading workflow)
 */
router.patch('/:id/status', authenticate, authorize('faculty', 'admin'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid submission ID',
      },
    });
  }

  // Validate request body
  const validationResult = updateStatusSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid status update data',
        details: validationResult.error.errors,
      },
    });
  }

  const { status } = validationResult.data;

  try {
    const submission = await updateSubmissionStatus(id, status, user.id);

    logger.info(`Submission status updated by ${user.role} ${user.id}: ${id} -> ${status}`);

    res.json({
      success: true,
      data: {
        submission,
        message: 'Submission status updated successfully',
      },
    });

  } catch (error) {
    logger.error(`Failed to update submission status ${id}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SUBMISSION_NOT_FOUND',
            message: error.message,
          },
        });
      }
      
      if (error.message.includes('only update submissions for your own')) {
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
        code: 'STATUS_UPDATE_FAILED',
        message: 'Failed to update submission status',
      },
    });
  }
}));

/**
 * DELETE /submissions/:id
 * Delete a submission and its files
 */
router.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid submission ID',
      },
    });
  }

  try {
    await deleteSubmission(id, user.id, user.role);

    logger.info(`Submission deleted by ${user.role} ${user.id}: ${id}`);

    res.json({
      success: true,
      data: {
        message: 'Submission deleted successfully',
        deleted: true,
      },
    });

  } catch (error) {
    logger.error(`Failed to delete submission ${id}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SUBMISSION_NOT_FOUND',
            message: error.message,
          },
        });
      }
      
      if (error.message.includes('only delete your own') || error.message.includes('Cannot delete submission')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'DELETION_NOT_ALLOWED',
            message: error.message,
          },
        });
      }
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SUBMISSION_DELETE_FAILED',
        message: 'Failed to delete submission',
      },
    });
  }
}));

/**
 * GET /submissions/stats/:assessmentId
 * Get submission statistics for an assessment
 */
router.get('/stats/:assessmentId', authenticate, authorize('faculty', 'admin'), asyncHandler(async (req: Request, res: Response) => {
  const { assessmentId } = req.params;
  const user = req.user!;

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
    const stats = await getSubmissionStats(assessmentId, user.id);

    res.json({
      success: true,
      data: {
        stats,
        assessmentId,
      },
    });

  } catch (error) {
    logger.error(`Failed to get submission stats for assessment ${assessmentId}:`, error);
    
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
      
      if (error.message.includes('only view statistics for your own')) {
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
        message: 'Failed to retrieve submission statistics',
      },
    });
  }
}));

export default router;