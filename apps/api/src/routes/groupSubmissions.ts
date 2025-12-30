import express from 'express';
import { authenticate } from '../middleware/auth';
import { rbacGuard } from '../middleware/rbac';
import { logger } from '../utils/logger';
import multer from 'multer';
import { GroupSubmission } from '../models/GroupSubmission';
import { Application } from '../models/Application';
import { StorageService } from '../services/storageService';

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

/**
 * POST /api/group-submissions
 * Create a new group submission
 */
router.post('/', authenticate, rbacGuard('student'), upload.fields([
  { name: 'reportFile', maxCount: 1 },
  { name: 'presentationFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { groupId, githubUrl, presentationUrl, comments } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    logger.info('Group submission request received:', {
      groupId,
      githubUrl,
      presentationUrl,
      hasReportFile: !!(files.reportFile && files.reportFile[0]),
      hasPresentationFile: !!(files.presentationFile && files.presentationFile[0]),
      userId: req.user!.id
    });

    // Validate required fields
    if (!githubUrl) {
      return res.status(400).json({
        success: false,
        error: 'GitHub URL is required'
      });
    }

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: 'Group ID is required'
      });
    }

    // Check if user is authorized to submit for this group
    const application = await Application.findOne({
      groupId,
      status: 'approved'
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'No approved application found for this group'
      });
    }

    // Check if group already has a submission
    const existingSubmission = await GroupSubmission.findOne({ groupId });
    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        error: 'Group has already submitted'
      });
    }

    // Prepare submission data
    const submissionData: any = {
      groupId,
      githubUrl,
      presentationUrl,
      comments,
      submittedBy: req.user!.id,
      status: 'submitted',
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        totalFileSize: 0
      }
    };

    // Handle file uploads
    if (files.reportFile && files.reportFile[0]) {
      const reportFile = files.reportFile[0];
      const uploadResult = await StorageService.uploadFile(
        reportFile.buffer,
        reportFile.originalname,
        'group',
        reportFile.mimetype
      );
      
      submissionData.reportFile = {
        url: uploadResult.url,
        name: reportFile.originalname,
        size: reportFile.size,
        contentType: reportFile.mimetype,
        storagePath: uploadResult.path
      };
    }

    if (files.presentationFile && files.presentationFile[0]) {
      const presentationFile = files.presentationFile[0];
      const uploadResult = await StorageService.uploadFile(
        presentationFile.buffer,
        presentationFile.originalname,
        'group',
        presentationFile.mimetype
      );
      
      submissionData.presentationFile = {
        url: uploadResult.url,
        name: presentationFile.originalname,
        size: presentationFile.size,
        contentType: presentationFile.mimetype,
        storagePath: uploadResult.path
      };
    }

    // Create submission
    const submission = new GroupSubmission(submissionData);
    await submission.save();

    logger.info('Group submission created successfully:', {
      submissionId: submission._id,
      groupId,
      submittedBy: req.user!.id
    });

    res.status(201).json({
      success: true,
      message: 'Group submission created successfully',
      data: submission
    });

  } catch (error: any) {
    logger.error('Error creating group submission:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create group submission'
    });
  }
});

/**
 * GET /api/group-submissions/:groupId
 * Get submission for a specific group
 */
router.get('/:groupId', authenticate, rbacGuard('student', 'faculty', 'coordinator'), async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const submission = await GroupSubmission.findOne({ groupId })
      .populate('submittedBy', 'name email');
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'No submission found for this group'
      });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error: any) {
    logger.error('Error fetching group submission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch group submission'
    });
  }
});

/**
 * GET /api/group-submissions/my/submissions
 * Get submissions for current user's groups
 */
router.get('/my/submissions', authenticate, rbacGuard('student'), async (req, res) => {
  try {
    // Find user's approved applications to get their group
    const application = await Application.findOne({
      studentId: req.user!.id,
      status: 'approved'
    }).populate('groupId');

    if (!application || !application.groupId) {
      return res.status(404).json({
        success: false,
        error: 'No approved group application found'
      });
    }

    // Find submission for this group
    const submission = await GroupSubmission.findOne({
      groupId: application.groupId
    })
      .populate('submittedBy', 'name email')
      .sort({ submittedAt: -1 });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'No submission found for your group'
      });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error: any) {
    logger.error('Error fetching user group submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions'
    });
  }
});

export default router;