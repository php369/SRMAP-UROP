import { Submission, ISubmission, FileMetadata } from '../models/Submission';
import { Assessment, IAssessment } from '../models/Assessment';
import { User } from '../models/User';
import { uploadFileBuffer, generateFolderPath, deleteFile } from './cloudinaryService';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export interface CreateSubmissionRequest {
  assessmentId: string;
  notes?: string;
  files: Express.Multer.File[];
  metadata: {
    ipAddress: string;
    userAgent: string;
  };
}

export interface SubmissionWithAssessment extends ISubmission {
  assessment?: IAssessment;
  isLate?: boolean;
}

/**
 * Create a new submission with file uploads
 * @param studentId - Student creating the submission
 * @param submissionData - Submission details and files
 * @returns Created submission
 */
export async function createSubmission(
  studentId: string,
  submissionData: CreateSubmissionRequest
): Promise<SubmissionWithAssessment> {
  try {
    // Validate student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      throw new Error('Only students can create submissions');
    }

    // Validate assessment exists and is published
    const assessment = await Assessment.findById(submissionData.assessmentId) as IAssessment | null;
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    if (assessment.status !== 'published') {
      throw new Error('Assessment is not available for submissions');
    }

    // Check if submission deadline has passed
    const now = new Date();
    const isLate = now > assessment.dueAt;
    
    if (isLate && !assessment.settings.allowLateSubmissions) {
      throw new Error('Submission deadline has passed and late submissions are not allowed');
    }

    // Check if student already has a submission for this assessment
    const existingSubmission = await Submission.findOne({
      assessmentId: submissionData.assessmentId,
      studentId: new mongoose.Types.ObjectId(studentId),
    });

    if (existingSubmission) {
      throw new Error('You have already submitted for this assessment');
    }

    // Validate files against assessment settings
    const totalSize = submissionData.files.reduce((sum, file) => sum + file.size, 0);
    
    if (totalSize > assessment.settings.maxFileSize) {
      const maxSizeMB = Math.round(assessment.settings.maxFileSize / (1024 * 1024));
      const totalSizeMB = Math.round(totalSize / (1024 * 1024) * 100) / 100;
      throw new Error(`Total file size ${totalSizeMB}MB exceeds assessment limit of ${maxSizeMB}MB`);
    }

    // Validate file types
    for (const file of submissionData.files) {
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      if (!fileExtension || !assessment.settings.allowedFileTypes.includes(fileExtension)) {
        throw new Error(`File type '${fileExtension}' is not allowed for this assessment. Allowed types: ${assessment.settings.allowedFileTypes.join(', ')}`);
      }
    }

    // Upload files to Cloudinary
    const uploadedFiles: FileMetadata[] = [];
    const folderPath = generateFolderPath('submissions', studentId, submissionData.assessmentId);

    try {
      for (const file of submissionData.files) {
        const uploadResult = await uploadFileBuffer(file.buffer, {
          folder: folderPath,
          publicId: `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
          resourceType: 'auto',
          allowedFormats: assessment.settings.allowedFileTypes,
          maxBytes: assessment.settings.maxFileSize,
        });

        uploadedFiles.push({
          url: uploadResult.secureUrl,
          name: file.originalname,
          size: file.size,
          contentType: file.mimetype,
          cloudinaryId: uploadResult.publicId,
        });

        logger.info(`File uploaded for submission: ${uploadResult.publicId}`);
      }

      // Create submission in database
      const submission = new Submission({
        assessmentId: submissionData.assessmentId,
        studentId: new mongoose.Types.ObjectId(studentId),
        files: uploadedFiles,
        notes: submissionData.notes,
        submittedAt: now,
        status: 'submitted',
        metadata: {
          ipAddress: submissionData.metadata.ipAddress,
          userAgent: submissionData.metadata.userAgent,
          fileCount: uploadedFiles.length,
          totalSize,
        },
      });

      await submission.save();
      logger.info(`Submission created: ${submission._id} by student: ${studentId}`);

      // Return submission with assessment data and late flag
      const submissionWithData = submission.toObject() as SubmissionWithAssessment;
      submissionWithData.assessment = assessment;
      submissionWithData.isLate = isLate;

      return submissionWithData;

    } catch (uploadError) {
      // Clean up any uploaded files if submission creation fails
      for (const uploadedFile of uploadedFiles) {
        if (uploadedFile.cloudinaryId) {
          try {
            await deleteFile(uploadedFile.cloudinaryId);
          } catch (deleteError) {
            logger.warn(`Failed to cleanup uploaded file: ${uploadedFile.cloudinaryId}`, deleteError);
          }
        }
      }
      throw uploadError;
    }

  } catch (error) {
    logger.error(`Failed to create submission for student ${studentId}:`, error);
    throw error;
  }
}

/**
 * Get submissions for a student
 * @param studentId - Student ID
 * @param filters - Optional filters
 * @returns List of submissions
 */
export async function getStudentSubmissions(
  studentId: string,
  filters?: {
    assessmentId?: string;
    status?: 'submitted' | 'graded' | 'returned';
    limit?: number;
    skip?: number;
  }
): Promise<SubmissionWithAssessment[]> {
  try {
    const query: any = { studentId: new mongoose.Types.ObjectId(studentId) };
    
    if (filters?.assessmentId) {
      query.assessmentId = new mongoose.Types.ObjectId(filters.assessmentId);
    }
    
    if (filters?.status) {
      query.status = filters.status;
    }

    const submissions = await Submission.find(query)
      .populate({
        path: 'assessmentId',
        select: 'title description dueAt status settings',
        populate: {
          path: 'courseId',
          select: 'title code',
        },
      })
      .sort({ submittedAt: -1 })
      .limit(filters?.limit || 50)
      .skip(filters?.skip || 0);

    // Add isLate flag to each submission
    const submissionsWithData = submissions.map(submission => {
      const submissionObj = submission.toObject() as SubmissionWithAssessment;
      const assessment = submissionObj.assessmentId as any;
      
      if (assessment && assessment.dueAt) {
        submissionObj.isLate = submission.submittedAt > new Date(assessment.dueAt);
      }
      
      return submissionObj;
    });

    return submissionsWithData;

  } catch (error) {
    logger.error(`Failed to get submissions for student ${studentId}:`, error);
    throw error;
  }
}

/**
 * Get submissions for an assessment (faculty view)
 * @param facultyId - Faculty ID (for authorization)
 * @param assessmentId - Assessment ID
 * @param filters - Optional filters
 * @returns List of submissions
 */
export async function getAssessmentSubmissions(
  facultyId: string,
  assessmentId: string,
  filters?: {
    status?: 'submitted' | 'graded' | 'returned';
    limit?: number;
    skip?: number;
  }
): Promise<SubmissionWithAssessment[]> {
  try {
    // Validate assessment exists and faculty owns it
    const assessment = await Assessment.findById(assessmentId) as IAssessment | null;
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    if (assessment.facultyId.toString() !== facultyId) {
      throw new Error('You can only view submissions for your own assessments');
    }

    const query: any = { assessmentId: new mongoose.Types.ObjectId(assessmentId) };
    
    if (filters?.status) {
      query.status = filters.status;
    }

    const submissions = await Submission.find(query)
      .populate('studentId', 'name email profile.department profile.year')
      .sort({ submittedAt: -1 })
      .limit(filters?.limit || 100)
      .skip(filters?.skip || 0);

    // Add isLate flag to each submission
    const submissionsWithData = submissions.map(submission => {
      const submissionObj = submission.toObject() as SubmissionWithAssessment;
      submissionObj.isLate = submission.submittedAt > assessment.dueAt;
      submissionObj.assessment = assessment;
      return submissionObj;
    });

    return submissionsWithData;

  } catch (error) {
    logger.error(`Failed to get submissions for assessment ${assessmentId}:`, error);
    throw error;
  }
}

/**
 * Get a specific submission by ID
 * @param submissionId - Submission ID
 * @param userId - User ID (for authorization)
 * @param userRole - User role
 * @returns Submission details
 */
export async function getSubmissionById(
  submissionId: string,
  userId: string,
  userRole: 'student' | 'faculty' | 'admin'
): Promise<SubmissionWithAssessment> {
  try {
    const submission = await Submission.findById(submissionId)
      .populate({
        path: 'assessmentId',
        select: 'title description dueAt status facultyId',
        populate: {
          path: 'courseId',
          select: 'title code',
        },
      })
      .populate('studentId', 'name email profile.department profile.year');

    if (!submission) {
      throw new Error('Submission not found');
    }

    // Authorization check
    if (userRole === 'student') {
      if (submission.studentId._id.toString() !== userId) {
        throw new Error('You can only view your own submissions');
      }
    } else if (userRole === 'faculty') {
      const assessment = submission.assessmentId as any;
      if (assessment.facultyId.toString() !== userId) {
        throw new Error('You can only view submissions for your own assessments');
      }
    }
    // Admins can view all submissions

    // Add isLate flag
    const submissionObj = submission.toObject() as SubmissionWithAssessment;
    const assessment = submissionObj.assessmentId as any;
    
    if (assessment && assessment.dueAt) {
      submissionObj.isLate = submission.submittedAt > new Date(assessment.dueAt);
    }

    return submissionObj;

  } catch (error) {
    logger.error(`Failed to get submission ${submissionId}:`, error);
    throw error;
  }
}

/**
 * Update submission status (for grading workflow)
 * @param submissionId - Submission ID
 * @param status - New status
 * @param facultyId - Faculty ID (for authorization)
 * @returns Updated submission
 */
export async function updateSubmissionStatus(
  submissionId: string,
  status: 'submitted' | 'graded' | 'returned',
  facultyId: string
): Promise<ISubmission> {
  try {
    const submission = await Submission.findById(submissionId)
      .populate('assessmentId', 'facultyId');

    if (!submission) {
      throw new Error('Submission not found');
    }

    // Check authorization
    const assessment = submission.assessmentId as any;
    if (assessment.facultyId.toString() !== facultyId) {
      throw new Error('You can only update submissions for your own assessments');
    }

    submission.status = status;
    await submission.save();

    logger.info(`Submission status updated: ${submissionId} -> ${status}`);
    return submission;

  } catch (error) {
    logger.error(`Failed to update submission status ${submissionId}:`, error);
    throw error;
  }
}

/**
 * Delete a submission and its files
 * @param submissionId - Submission ID
 * @param userId - User ID (for authorization)
 * @param userRole - User role
 */
export async function deleteSubmission(
  submissionId: string,
  userId: string,
  userRole: 'student' | 'faculty' | 'admin'
): Promise<void> {
  try {
    const submission = await Submission.findById(submissionId)
      .populate('assessmentId', 'facultyId dueAt settings');

    if (!submission) {
      throw new Error('Submission not found');
    }

    // Authorization check
    if (userRole === 'student') {
      if (submission.studentId.toString() !== userId) {
        throw new Error('You can only delete your own submissions');
      }
      
      // Check if deletion is allowed (e.g., before deadline)
      const assessment = submission.assessmentId as any;
      const now = new Date();
      if (now > assessment.dueAt) {
        throw new Error('Cannot delete submission after the deadline');
      }
    } else if (userRole === 'faculty') {
      const assessment = submission.assessmentId as any;
      if (assessment.facultyId.toString() !== userId) {
        throw new Error('You can only delete submissions for your own assessments');
      }
    }
    // Admins can delete any submission

    // Delete files from Cloudinary
    for (const file of submission.files) {
      if (file.cloudinaryId) {
        try {
          await deleteFile(file.cloudinaryId);
          logger.info(`File deleted from Cloudinary: ${file.cloudinaryId}`);
        } catch (deleteError) {
          logger.warn(`Failed to delete file from Cloudinary: ${file.cloudinaryId}`, deleteError);
        }
      }
    }

    // Delete submission from database
    await Submission.findByIdAndDelete(submissionId);
    logger.info(`Submission deleted: ${submissionId}`);

  } catch (error) {
    logger.error(`Failed to delete submission ${submissionId}:`, error);
    throw error;
  }
}

/**
 * Get submission statistics for an assessment
 * @param assessmentId - Assessment ID
 * @param facultyId - Faculty ID (for authorization)
 * @returns Submission statistics
 */
export async function getSubmissionStats(
  assessmentId: string,
  facultyId: string
): Promise<{
  total: number;
  submitted: number;
  graded: number;
  returned: number;
  late: number;
  onTime: number;
}> {
  try {
    // Validate assessment exists and faculty owns it
    const assessment = await Assessment.findById(assessmentId) as IAssessment | null;
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    if (assessment.facultyId.toString() !== facultyId) {
      throw new Error('You can only view statistics for your own assessments');
    }

    // Get all submissions for the assessment
    const submissions = await Submission.find({ assessmentId: new mongoose.Types.ObjectId(assessmentId) });

    const stats = {
      total: submissions.length,
      submitted: 0,
      graded: 0,
      returned: 0,
      late: 0,
      onTime: 0,
    };

    submissions.forEach(submission => {
      // Count by status
      switch (submission.status) {
        case 'submitted':
          stats.submitted++;
          break;
        case 'graded':
          stats.graded++;
          break;
        case 'returned':
          stats.returned++;
          break;
      }

      // Count by timing
      if (submission.submittedAt > assessment.dueAt) {
        stats.late++;
      } else {
        stats.onTime++;
      }
    });

    return stats;

  } catch (error) {
    logger.error(`Failed to get submission stats for assessment ${assessmentId}:`, error);
    throw error;
  }
}