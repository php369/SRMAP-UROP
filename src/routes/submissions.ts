import express from 'express';
import { SubmissionService, CreateSubmissionData } from '../services/submissionService';
import { authenticate } from '../middleware/auth';
import { rbacGuard } from '../middleware/rbac';
import { logger } from '../utils/logger';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 2 // Max 2 files (report + presentation)
  },
  fileFilter: (_req, file, cb) => {
    // Allow PDF for reports and PDF/PPT/PPTX for presentations
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PPT, and PPTX files are allowed.'));
    }
  }
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 */
async function uploadToCloudinary(
  buffer: Buffer, 
  filename: string, 
  folder: string = 'submissions'
): Promise<{ url: string; cloudinaryId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${Date.now()}_${filename}`,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            cloudinaryId: result.public_id
          });
        } else {
          reject(new Error('Upload failed'));
        }
      }
    );

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
}

/**
 * POST /api/submissions
 * Create a new group submission
 */
router.post('/', authenticate, rbacGuard('student'), upload.fields([
  { name: 'reportFile', maxCount: 1 },
  { name: 'presentationFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { groupId, githubUrl, presentationUrl, comments } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Validate required fields
    if (!groupId || !githubUrl) {
      return res.status(400).json({
        error: 'Group ID and GitHub URL are required'
      });
    }

    // Check if user can submit
    const eligibility = await SubmissionService.canUserSubmit(req.user!.id, groupId);
    if (!eligibility.canSubmit) {
      return res.status(403).json({
        error: eligibility.reason
      });
    }

    // Prepare submission data
    const submissionData: CreateSubmissionData = {
      groupId,
      githubUrl,
      presentationUrl,
      comments,
      submittedBy: req.user!.id,
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    };

    // Handle file uploads
    if (files.reportFile && files.reportFile[0]) {
      const reportFile = files.reportFile[0];
      const uploadResult = await uploadToCloudinary(
        reportFile.buffer,
        reportFile.originalname,
        'submissions/reports'
      );
      
      submissionData.reportFile = {
        url: uploadResult.url,
        name: reportFile.originalname,
        size: reportFile.size,
        contentType: reportFile.mimetype,
        cloudinaryId: uploadResult.cloudinaryId
      };
    }

    if (files.presentationFile && files.presentationFile[0]) {
      const presentationFile = files.presentationFile[0];
      const uploadResult = await uploadToCloudinary(
        presentationFile.buffer,
        presentationFile.originalname,
        'submissions/presentations'
      );
      
      submissionData.presentationFile = {
        url: uploadResult.url,
        name: presentationFile.originalname,
        size: presentationFile.size,
        contentType: presentationFile.mimetype,
        cloudinaryId: uploadResult.cloudinaryId
      };
    }

    // Create submission
    const submission = await SubmissionService.createSubmission(submissionData);

    res.status(201).json({
      message: 'Submission created successfully',
      submission
    });

  } catch (error: any) {
    logger.error('Error creating submission:', error);
    res.status(400).json({
      error: error.message || 'Failed to create submission'
    });
  }
});

/**
 * GET /api/submissions/my
 * Get submissions for current user's groups
 */
router.get('/my', authenticate, rbacGuard('student'), async (req, res) => {
  try {
    const submissions = await SubmissionService.getSubmissionsForUser(req.user!.id);
    
    res.json({
      submissions,
      message: submissions.length === 0 ? 'You have not submitted any projects yet. Join a group and submit your work to get started.' : undefined
    });
  } catch (error: any) {
    logger.error('Error fetching user submissions:', error);
    res.status(500).json({
      error: 'Failed to fetch submissions'
    });
  }
});

/**
 * GET /api/submissions/group/:groupId
 * Get submission for a specific group
 */
router.get('/group/:groupId', authenticate, rbacGuard('student', 'faculty', 'coordinator'), async (req, res) => {
  try {
    const { groupId } = req.params;
    const submission = await SubmissionService.getSubmissionByGroupId(groupId);
    
    if (!submission) {
      return res.status(404).json({
        error: 'No submission found for this group'
      });
    }

    res.json({
      submission
    });
  } catch (error: any) {
    logger.error('Error fetching group submission:', error);
    res.status(500).json({
      error: 'Failed to fetch submission'
    });
  }
});

/**
 * GET /api/submissions/faculty
 * Get all submissions for faculty review
 */
router.get('/faculty', authenticate, rbacGuard('faculty', 'coordinator'), async (req, res) => {
  try {
    const submissions = await SubmissionService.getSubmissionsForFaculty(req.user!.id);
    
    res.json({
      submissions,
      message: submissions.length === 0 ? 'No submissions have been made for your projects yet.' : undefined
    });
  } catch (error: any) {
    logger.error('Error fetching faculty submissions:', error);
    res.status(500).json({
      error: 'Failed to fetch submissions'
    });
  }
});

/**
 * PUT /api/submissions/:id/comments
 * Update submission comments
 */
router.put('/:id/comments', authenticate, rbacGuard('student'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const submission = await SubmissionService.updateSubmission(
      id,
      req.user!.id,
      { comments }
    );

    res.json({
      message: 'Comments updated successfully',
      submission
    });
  } catch (error: any) {
    logger.error('Error updating submission comments:', error);
    res.status(400).json({
      error: error.message || 'Failed to update comments'
    });
  }
});

/**
 * GET /api/submissions/:groupId/eligibility
 * Check if user can submit for a group
 */
router.get('/:groupId/eligibility', authenticate, rbacGuard('student'), async (req, res) => {
  try {
    const { groupId } = req.params;
    const eligibility = await SubmissionService.canUserSubmit(req.user!.id, groupId);
    
    res.json(eligibility);
  } catch (error: any) {
    logger.error('Error checking submission eligibility:', error);
    res.status(500).json({
      error: 'Failed to check eligibility'
    });
  }
});

export default router;