import mongoose from 'mongoose';
import { Assessment, IAssessment } from '../models/Assessment';
import { logger } from '../utils/logger';

export class AssessmentService {
  /**
   * Create a new assessment
   */
  static async createAssessment(
    title: string,
    description: string,
    type: 'IDP' | 'UROP' | 'CAPSTONE',
    dueDate: Date,
    facultyId: mongoose.Types.ObjectId,
    cohortIds: mongoose.Types.ObjectId[]
  ): Promise<IAssessment> {
    try {
      const assessment = new Assessment({
        title,
        description,
        type,
        dueDate,
        facultyId,
        cohortIds,
        status: 'draft'
      });

      await assessment.save();
      logger.info(`Assessment created: ${assessment.title} by faculty ${facultyId}`);
      
      return assessment;
    } catch (error) {
      logger.error('Error creating assessment:', error);
      throw error;
    }
  }

  /**
   * Get assessments by faculty ID
   */
  static async getAssessmentsByFaculty(facultyId: mongoose.Types.ObjectId): Promise<IAssessment[]> {
    try {
      const assessments = await Assessment.find({ facultyId })
        .populate('cohortIds', 'name year semester type')
        .sort({ createdAt: -1 });

      return assessments;
    } catch (error) {
      logger.error('Error getting assessments by faculty:', error);
      throw error;
    }
  }

  /**
   * Publish an assessment
   */
  static async publishAssessment(
    assessmentId: mongoose.Types.ObjectId,
    facultyId: mongoose.Types.ObjectId
  ): Promise<IAssessment> {
    try {
      const assessment = await Assessment.findOneAndUpdate(
        { _id: assessmentId, facultyId },
        { status: 'published' },
        { new: true }
      );

      if (!assessment) {
        throw new Error('Assessment not found or unauthorized');
      }

      logger.info(`Assessment published: ${assessment.title}`);
      return assessment;
    } catch (error) {
      logger.error('Error publishing assessment:', error);
      throw error;
    }
  }
}

/**
 * Placeholder function for calendar auth completion
 * This will be implemented in future tasks
 */
export async function completeCalendarAuth(userId: string, assessmentId: string, code: string): Promise<void> {
  logger.info(`Calendar auth completion requested for user ${userId}, assessment ${assessmentId} with code ${code}`);
  // TODO: Implement calendar auth completion in future tasks
  throw new Error('Calendar auth completion not yet implemented');
}

export default AssessmentService;
/**
 * Create assessment with Google Meet link
 */
export async function createAssessmentWithMeetLink(
  facultyId: string,
  assessmentData: any
): Promise<IAssessment & { needsCalendarAuth?: boolean }> {
  try {
    // For now, just create the assessment without Meet link
    // Meet link functionality will be implemented in future tasks
    const assessment = await AssessmentService.createAssessment(
      assessmentData.title,
      assessmentData.description,
      assessmentData.type || 'IDP',
      new Date(assessmentData.dueDate),
      new mongoose.Types.ObjectId(facultyId),
      assessmentData.cohortIds?.map((id: string) => new mongoose.Types.ObjectId(id)) || []
    );

    // Add needsCalendarAuth property for compatibility
    const result = assessment.toObject() as IAssessment & { needsCalendarAuth?: boolean };
    result.needsCalendarAuth = false; // For now, no calendar auth needed
    
    return result;
  } catch (error) {
    logger.error('Error creating assessment with meet link:', error);
    throw error;
  }
}

/**
 * Update assessment with calendar integration
 */
export async function updateAssessmentWithCalendar(
  assessmentId: string,
  facultyId: string,
  updates: any
): Promise<IAssessment> {
  try {
    // Convert string arrays to ObjectId arrays if needed
    const processedUpdates = { ...updates };
    if (processedUpdates.cohortIds && Array.isArray(processedUpdates.cohortIds)) {
      processedUpdates.cohortIds = processedUpdates.cohortIds.map((id: string) => new mongoose.Types.ObjectId(id));
    }

    const assessment = await Assessment.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(assessmentId), facultyId: new mongoose.Types.ObjectId(facultyId) },
      processedUpdates,
      { new: true }
    );

    if (!assessment) {
      throw new Error('Assessment not found or unauthorized');
    }

    logger.info(`Assessment updated: ${assessment.title}`);
    return assessment;
  } catch (error) {
    logger.error('Error updating assessment:', error);
    throw error;
  }
}

/**
 * Delete assessment with calendar cleanup
 */
export async function deleteAssessmentWithCalendar(
  facultyId: string,
  assessmentId: string
): Promise<void> {
  try {
    const assessment = await Assessment.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(assessmentId),
      facultyId: new mongoose.Types.ObjectId(facultyId)
    });

    if (!assessment) {
      throw new Error('Assessment not found or unauthorized');
    }

    logger.info(`Assessment deleted: ${assessment.title}`);
  } catch (error) {
    logger.error('Error deleting assessment:', error);
    throw error;
  }
}

/**
 * Get faculty assessments
 */
export async function getFacultyAssessments(
  facultyId: string,
  options?: any
): Promise<IAssessment[]> {
  try {
    // For now, ignore the options parameter - will be implemented in future tasks
    logger.info(`Getting assessments for faculty ${facultyId} with options:`, options);
    return AssessmentService.getAssessmentsByFaculty(new mongoose.Types.ObjectId(facultyId));
  } catch (error) {
    logger.error('Error getting faculty assessments:', error);
    throw error;
  }
}

/**
 * Get student assessments
 */
export async function getStudentAssessments(
  studentId: string,
  options?: any
): Promise<IAssessment[]> {
  try {
    // For now, return empty array - will be implemented when student-assessment relationship is defined
    logger.info(`Getting assessments for student ${studentId} with options:`, options);
    return [];
  } catch (error) {
    logger.error('Error getting student assessments:', error);
    throw error;
  }
}