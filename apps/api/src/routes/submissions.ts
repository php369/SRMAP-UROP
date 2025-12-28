import express from 'express';
import { SubmissionService } from '../services/submissionService';
import { authenticate } from '../middleware/auth';
import { rbacGuard } from '../middleware/rbac';
import { logger } from '../utils/logger';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { Group } from '../models/Group';
import { Submission } from '../models/Submission';

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
    // Determine correct resource type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase();
    const resourceType = ['pdf', 'doc', 'docx', 'zip', 'rar'].includes(extension || '') ? 'raw' : 'auto';
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${Date.now()}_${filename}`,
        resource_type: resourceType,
        // Add these options to help with untrusted account issues
        type: 'upload',
        access_mode: 'public'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          // Generate a signed URL for raw files to bypass untrusted restrictions
          let finalUrl = result.secure_url;
          
          if (resourceType === 'raw') {
            try {
              // Generate signed URL for raw files
              finalUrl = cloudinary.url(result.public_id, {
                resource_type: 'raw',
                type: 'upload',
                sign_url: true,
                secure: true
              });
            } catch (signError) {
              console.warn('Failed to generate signed URL, using original:', signError);
              // Fallback to original URL if signing fails
            }
          }
          
          resolve({
            url: finalUrl,
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
    const { groupId, studentId, githubUrl, presentationUrl, comments } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Debug logging
    logger.info('Submission request received:', {
      groupId,
      studentId,
      githubUrl,
      presentationUrl,
      hasReportFile: !!(files.reportFile && files.reportFile[0]),
      hasPresentationFile: !!(files.presentationFile && files.presentationFile[0]),
      userId: req.user!.id
    });

    // Validate required fields
    if (!githubUrl) {
      logger.warn('Submission failed: Missing GitHub URL');
      return res.status(400).json({
        error: 'GitHub URL is required'
      });
    }
    
    // Must have either groupId (group submission) or studentId (solo submission)
    if (!groupId && !studentId) {
      logger.warn(`Submission attempt by user ${req.user!.id} without groupId or studentId`);
      return res.status(400).json({
        error: 'Either groupId or studentId is required for submission'
      });
    }

    // Check if user can submit
    let eligibility;
    if (groupId) {
      // Group submission
      eligibility = await SubmissionService.canUserSubmit(req.user!.id, groupId);
    } else {
      // Solo submission - check if the studentId matches the authenticated user
      if (studentId !== req.user!.id) {
        return res.status(403).json({
          error: 'You can only submit for yourself'
        });
      }
      eligibility = { canSubmit: true };
    }
    
    logger.info('Submission eligibility check:', {
      userId: req.user!.id,
      groupId,
      studentId,
      canSubmit: eligibility.canSubmit,
      reason: eligibility.reason
    });
    
    if (!eligibility.canSubmit) {
      return res.status(403).json({
        error: eligibility.reason
      });
    }

    // Prepare submission data
    const submissionData: any = {
      githubUrl,
      presentationUrl,
      comments,
      submittedBy: req.user!.id,
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    };

    // Add either groupId or studentId
    if (groupId) {
      submissionData.groupId = groupId;
    } else {
      submissionData.studentId = studentId;
    }

    // Handle file uploads
    if (files.reportFile && files.reportFile[0]) {
      const reportFile = files.reportFile[0];
      const uploadResult = await uploadToCloudinary(
        reportFile.buffer,
        reportFile.originalname,
        'submissions/reports'
      );
      
      submissionData.reportFile = {
        url: `/api/v1/files/pdf/${uploadResult.cloudinaryId}`, // Use cloudinaryId which contains full path
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
        url: `/api/v1/files/pdf/${uploadResult.cloudinaryId}`, // Use cloudinaryId which contains full path
        name: presentationFile.originalname,
        size: presentationFile.size,
        contentType: presentationFile.mimetype,
        cloudinaryId: uploadResult.cloudinaryId
      };
    }

    // Create submission
    const submission = await SubmissionService.createSubmission(submissionData);

    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      data: submission
    });

  } catch (error: any) {
    logger.error('Error creating submission:', error);
    res.status(400).json({
      success: false,
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
        success: false,
        error: 'No submission found for this group'
      });
    }

    res.json({
      success: true,
      submission
    });
  } catch (error: any) {
    logger.error('Error fetching group submission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submission'
    });
  }
});

/**
 * GET /api/submissions/student/:studentId
 * Get submissions for a specific student (both solo and group submissions)
 */
router.get('/student/:studentId', authenticate, rbacGuard('student', 'faculty', 'coordinator'), async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // For students, they can only access their own submissions
    if (req.user!.role.includes('student') && studentId !== req.user!.id) {
      return res.status(403).json({
        error: 'You can only access your own submissions'
      });
    }
    
    // Get both solo and group submissions for the student
    const allSubmissions = await SubmissionService.getAllStudentSubmissions(studentId);
    
    if (!allSubmissions || allSubmissions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No submissions found for this student'
      });
    }

    // Return all submissions (frontend can handle multiple submissions)
    res.json({
      success: true,
      data: allSubmissions
    });
  } catch (error: any) {
    logger.error('Error fetching student submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions'
    });
  }
});

/**
 * GET /api/submissions/faculty
 * Get all submissions for faculty review (both solo and group submissions)
 */
router.get('/faculty', authenticate, rbacGuard('faculty', 'coordinator'), async (req, res) => {
  try {
    const allSubmissions = await SubmissionService.getAllSubmissionsForFaculty(req.user!.id);
    
    res.json({
      success: true,
      data: allSubmissions,
      count: allSubmissions.length,
      message: allSubmissions.length === 0 ? 'No submissions have been made for your projects yet.' : undefined
    });
  } catch (error: any) {
    logger.error('Error fetching faculty submissions:', error);
    res.status(500).json({
      success: false,
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

/**
 * PUT /api/submissions/:id/grade
 * Grade a submission (faculty only)
 */
router.put('/:id/grade', authenticate, rbacGuard('faculty', 'coordinator'), async (req, res) => {
  try {
    const { id } = req.params;
    const { facultyGrade, facultyComments, meetUrl } = req.body;

    if (facultyGrade === undefined || facultyGrade < 0 || facultyGrade > 100) {
      return res.status(400).json({
        success: false,
        error: 'Grade must be between 0 and 100'
      });
    }

    const submission = await SubmissionService.getSubmissionById(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Verify faculty is authorized to grade this submission
    if (submission.facultyId && submission.facultyId.toString() !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to grade this submission'
      });
    }

    // Update submission with grade
    submission.facultyGrade = facultyGrade;
    submission.facultyComments = facultyComments || '';
    submission.isGraded = true;
    
    if (meetUrl) {
      submission.meetUrl = meetUrl;
    }

    await submission.save();

    logger.info('Submission graded:', {
      submissionId: id,
      facultyId: req.user!.id,
      grade: facultyGrade
    });

    res.json({
      success: true,
      message: 'Grade submitted successfully',
      data: submission
    });
  } catch (error: any) {
    logger.error('Error grading submission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to grade submission'
    });
  }
});

/**
 * DELETE /api/submissions/group/:groupId
 * Delete submission for a group (development only)
 */
router.delete('/group/:groupId', authenticate, rbacGuard('student'), async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Find the submission
    const submission = await SubmissionService.getSubmissionByGroupId(groupId);
    if (!submission) {
      return res.status(404).json({
        error: 'No submission found for this group'
      });
    }
    
    // Verify user is the group leader
    const group = await Group.findById(groupId);
    if (!group || group.leaderId.toString() !== req.user!.id) {
      return res.status(403).json({
        error: 'Only the group leader can delete submissions'
      });
    }
    
    // Delete the submission
    await Submission.findByIdAndDelete(submission._id);
    
    logger.info('Submission deleted:', {
      submissionId: submission._id,
      groupId,
      deletedBy: req.user!.id
    });
    
    res.json({
      message: 'Submission deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting submission:', error);
    res.status(500).json({
      error: 'Failed to delete submission'
    });
  }
});

export default router;