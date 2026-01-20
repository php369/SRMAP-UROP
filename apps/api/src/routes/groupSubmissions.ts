import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { rbacGuard } from '../middleware/rbac';
import { logger } from '../utils/logger';
import multer from 'multer';
import { GroupSubmission } from '../models/GroupSubmission';
import { Application } from '../models/Application';
import { Group } from '../models/Group';
import { StorageService } from '../services/storageService';

const router: Router = Router();

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
    const { groupId, githubUrl, presentationUrl, comments, assessmentType } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    logger.info('Group submission request received:', {
      groupId,
      githubUrl,
      presentationUrl,
      assessmentType,
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

    if (!assessmentType) {
      return res.status(400).json({
        success: false,
        error: 'Assessment type is required'
      });
    }

    // Validate assessment type
    const validAssessmentTypes = ['CLA-1', 'CLA-2', 'CLA-3', 'External'];
    if (!validAssessmentTypes.includes(assessmentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid assessment type'
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

    // Check if group already has a submission for this assessment type
    const existingSubmission = await GroupSubmission.findOne({
      groupId,
      assessmentType
    });
    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        error: `Group has already submitted for ${assessmentType}`
      });
    }

    // Prepare submission data
    const submissionData: any = {
      groupId,
      assessmentType,
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
    logger.error('Error creating group submission:', {
      error: error.message,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      stack: error.stack
    });

    // Check for duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {}).join(', ');
      return res.status(409).json({
        success: false,
        error: `Duplicate submission detected: A submission for this ${field} already exists.`
      });
    }

    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create group submission'
    });
  }
});

/**
 * GET /api/group-submissions/:groupId
 * Get submission for a specific group and assessment type
 */
router.get('/:groupId', authenticate, rbacGuard('student', 'faculty', 'coordinator'), async (req, res) => {
  try {
    const { groupId } = req.params;
    const { assessmentType } = req.query;

    logger.info('Direct group submission request:', { groupId, assessmentType, userId: req.user!.id });

    // For students, verify they are a member of this group
    if (req.user!.role.includes('student')) {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          error: 'Group not found'
        });
      }

      const isMember = group.leaderId.toString() === req.user!.id ||
        group.members.some(memberId => memberId.toString() === req.user!.id);

      if (!isMember) {
        return res.status(403).json({
          success: false,
          error: 'You are not a member of this group'
        });
      }
    }

    // Build query - include assessment type if provided
    const query: any = { groupId };
    if (assessmentType) {
      query.assessmentType = assessmentType;
    }

    const submission = await GroupSubmission.findOne(query)
      .populate('submittedBy', 'name email')
      .sort({ submittedAt: -1 }); // Get most recent if multiple

    logger.info('Direct group submission result:', submission ? { found: true, id: submission._id, assessmentType: submission.assessmentType } : { found: false });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: assessmentType
          ? `No submission found for this group for ${assessmentType}`
          : 'No submission found for this group'
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
 * Get submissions for current user's groups, optionally filtered by assessment type
 */
router.get('/my/submissions', authenticate, rbacGuard('student'), async (req, res) => {
  try {
    const { assessmentType } = req.query;

    logger.info('Group submission request from user:', req.user!.id, 'assessmentType:', assessmentType);

    // Find user's approved applications - check both solo and group applications
    // For group applications, we need to find the group first, then check if user is a member

    // First, find groups where the user is a member (leader or regular member)
    const userGroups = await Group.find({
      $or: [
        { leaderId: req.user!.id },
        { members: req.user!.id }
      ]
    });

    logger.info('Found user groups:', userGroups.map(g => ({ id: g._id, code: g.groupCode, leader: g.leaderId })));

    if (userGroups.length === 0) {
      logger.warn('No groups found for user:', req.user!.id);
      return res.status(404).json({
        success: false,
        error: 'No groups found for this user'
      });
    }

    // Find approved applications for these groups
    const groupIds = userGroups.map(group => group._id);
    logger.info('Searching for applications with group IDs:', groupIds);

    const application = await Application.findOne({
      groupId: { $in: groupIds },
      status: 'approved'
    }).populate('groupId');

    logger.info('Found application:', application ? { id: application._id, groupId: application.groupId, status: application.status } : 'none');

    if (!application || !application.groupId) {
      logger.warn('No approved group application found for user:', req.user!.id);
      return res.status(404).json({
        success: false,
        error: 'No approved group application found'
      });
    }

    // Build query for submission
    const submissionQuery: any = { groupId: application.groupId };
    if (assessmentType) {
      submissionQuery.assessmentType = assessmentType;
    }

    // Find submission for this group (optionally filtered by assessment type)
    logger.info('Searching for submission with query:', submissionQuery);

    const submission = await GroupSubmission.findOne(submissionQuery)
      .populate('submittedBy', 'name email')
      .sort({ submittedAt: -1 }); // Get most recent if multiple

    logger.info('Found submission:', submission ? { id: submission._id, assessmentType: submission.assessmentType, submittedBy: submission.submittedBy, githubUrl: submission.githubUrl } : 'none');

    if (!submission) {
      const errorMessage = assessmentType
        ? `No submission found for your group for ${assessmentType}`
        : 'No submission found for your group';
      logger.warn(errorMessage, 'Group ID:', application.groupId);
      return res.status(404).json({
        success: false,
        error: errorMessage
      });
    }

    logger.info('Successfully returning submission for user:', req.user!.id);
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