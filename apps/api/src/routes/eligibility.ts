import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import {
  uploadStudentEmails,
  uploadFacultyEmails,
  parseEmailCSV
} from '../services/eligibilityUploadService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const studentUploadSchema = z.object({
  csvData: z.string().min(1, 'CSV data is required'),
  projectType: z.enum(['IDP', 'UROP', 'CAPSTONE'])
});

const facultyUploadSchema = z.object({
  csvData: z.string().min(1, 'CSV data is required')
});

/**
 * POST /eligibility/upload
 * Upload student emails for a specific project type
 */
router.post('/upload', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.id;

  // Validate request body
  const validationResult = studentUploadSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: validationResult.error.errors
      }
    });
  }

  const { csvData, projectType } = validationResult.data;

  try {
    // Parse CSV to extract emails
    const emails = parseEmailCSV(csvData);

    if (emails.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_EMAILS_FOUND',
          message: 'No valid emails found in CSV'
        }
      });
    }

    // Upload emails
    const result = await uploadStudentEmails(emails, projectType, adminId);

    logger.info(`Student eligibility upload completed: ${result.success} success, ${result.failed} failed`);

    res.json({
      success: true,
      data: {
        ...result,
        projectType,
        totalProcessed: emails.length
      }
    });

  } catch (error) {
    logger.error('Failed to upload student eligibility:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Failed to upload student eligibility'
      }
    });
  }
}));

/**
 * POST /eligibility/faculty/upload
 * Upload faculty emails
 */
router.post('/faculty/upload', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.id;

  // Validate request body
  const validationResult = facultyUploadSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: validationResult.error.errors
      }
    });
  }

  const { csvData } = validationResult.data;

  try {
    // Parse CSV to extract emails
    const emails = parseEmailCSV(csvData);

    if (emails.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_EMAILS_FOUND',
          message: 'No valid emails found in CSV'
        }
      });
    }

    // Upload emails
    const result = await uploadFacultyEmails(emails, adminId);

    logger.info(`Faculty eligibility upload completed: ${result.success} success, ${result.failed} failed`);

    res.json({
      success: true,
      data: {
        ...result,
        totalProcessed: emails.length
      }
    });

  } catch (error) {
    logger.error('Failed to upload faculty eligibility:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Failed to upload faculty eligibility'
      }
    });
  }
}));

export default router;
