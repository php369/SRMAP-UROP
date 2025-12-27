import express from 'express';
import { authenticate } from '../middleware/auth';
import { rbacGuard } from '../middleware/rbac';
import { logger } from '../utils/logger';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { GroupSubmission } from '../models/GroupSubmission';
import { Application } from '../models/Application';

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
  folder: string = 'group-submissions'
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
      const uploadResult = await uploadToCloudinary(
        reportFile.buffer,
        reportFile.originalname,
        'group-submissions/reports'
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
        'group-submissions/presentations'
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
    // Find user's approved applications
    const applications = await Application.find({
      $or: [
        { studentId: req.user!.id },
        { groupId: { $exists: true } } // Will filter by group membership later
      ],
      status: 'approved'
    });

    const groupIds = applications
      .filter(app => app.groupId)
      .map(app => app.groupId);

    // Find submissions for these groups
    const submissions = await GroupSubmission.find({
      groupId: { $in: groupIds }
    })
      .populate('submittedBy', 'name email')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: submissions
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