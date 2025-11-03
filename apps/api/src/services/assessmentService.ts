import { Assessment, IAssessment } from '../models/Assessment';
import { User } from '../models/User';
import { Cohort } from '../models/Cohort';
import { Course } from '../models/Course';
import { 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  hasCalendarPermissions,
  generateCalendarAuthUrl 
} from './googleCalendar';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export interface CreateAssessmentRequest {
  title: string;
  description: string;
  courseId: string;
  dueAt: string; // ISO date string
  cohortIds: string[];
  settings?: {
    allowLateSubmissions?: boolean;
    maxFileSize?: number;
    allowedFileTypes?: string[];
  };
}

export interface AssessmentWithMeetLink {
  [key: string]: any;
  meetUrl?: string;
  calendarEventId?: string;
  needsCalendarAuth?: boolean;
  calendarAuthUrl?: string;
}

/**
 * Create a new assessment with automatic Google Meet link generation
 * @param facultyId - Faculty member creating the assessment
 * @param assessmentData - Assessment details
 * @returns Created assessment with Meet link
 */
export async function createAssessmentWithMeetLink(
  facultyId: string,
  assessmentData: CreateAssessmentRequest
): Promise<AssessmentWithMeetLink> {
  try {
    // Validate faculty exists and has permission
    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      throw new Error('Only faculty members can create assessments');
    }

    // Validate course exists and faculty has access
    const course = await Course.findById(assessmentData.courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (course.facultyId.toString() !== facultyId) {
      throw new Error('You can only create assessments for your own courses');
    }

    // Validate cohorts exist
    const cohorts = await Cohort.find({
      _id: { $in: assessmentData.cohortIds.map(id => new mongoose.Types.ObjectId(id)) }
    });

    if (cohorts.length !== assessmentData.cohortIds.length) {
      throw new Error('One or more cohorts not found');
    }

    // Create assessment in database first
    const assessment = new Assessment({
      courseId: assessmentData.courseId,
      facultyId,
      title: assessmentData.title,
      description: assessmentData.description,
      dueAt: new Date(assessmentData.dueAt),
      visibility: {
        cohortIds: assessmentData.cohortIds.map(id => new mongoose.Types.ObjectId(id)),
        courseIds: [new mongoose.Types.ObjectId(assessmentData.courseId)],
      },
      settings: {
        allowLateSubmissions: assessmentData.settings?.allowLateSubmissions || false,
        maxFileSize: assessmentData.settings?.maxFileSize || 10 * 1024 * 1024, // 10MB
        allowedFileTypes: assessmentData.settings?.allowedFileTypes || ['pdf', 'doc', 'docx', 'txt'],
      },
      status: 'draft', // Start as draft until calendar event is created
    });

    await assessment.save();
    logger.info(`Assessment created: ${assessment._id} by faculty: ${facultyId}`);

    // Check if faculty has calendar permissions
    const hasPermissions = await hasCalendarPermissions(facultyId);
    
    if (!hasPermissions) {
      logger.warn(`Faculty ${facultyId} lacks calendar permissions for assessment ${assessment._id}`);
      
      return {
        ...assessment.toObject(),
        needsCalendarAuth: true,
        calendarAuthUrl: generateCalendarAuthUrl(facultyId, assessment._id.toString()),
      } as AssessmentWithMeetLink;
    }

    // Create calendar event with Meet link
    try {
      const dueDate = new Date(assessmentData.dueAt);
      const startTime = new Date(dueDate.getTime() - 60 * 60 * 1000); // 1 hour before due time
      
      // Get student emails for attendees
      const studentEmails = await getStudentEmailsFromCohorts(assessmentData.cohortIds);

      const calendarEvent = await createCalendarEvent(facultyId, {
        summary: `Assessment: ${assessmentData.title}`,
        description: `${assessmentData.description}\n\nCourse: ${course.title}\nDue: ${dueDate.toLocaleString()}`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: dueDate.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        attendees: [
          { email: faculty.email, displayName: faculty.name },
          ...studentEmails.map(email => ({ email })),
        ],
      });

      // Update assessment with calendar details
      assessment.meetUrl = calendarEvent.meetUrl;
      assessment.calendarEventId = calendarEvent.eventId;
      assessment.status = 'published'; // Now published with Meet link
      await assessment.save();

      logger.info(`Calendar event created for assessment ${assessment._id}: ${calendarEvent.eventId}`);

      return {
        ...assessment.toObject(),
        meetUrl: calendarEvent.meetUrl,
        calendarEventId: calendarEvent.eventId,
      } as AssessmentWithMeetLink;

    } catch (calendarError) {
      logger.error(`Failed to create calendar event for assessment ${assessment._id}:`, calendarError);
      
      // Assessment exists but without Meet link
      return {
        ...assessment.toObject(),
        needsCalendarAuth: true,
        calendarAuthUrl: generateCalendarAuthUrl(facultyId, assessment._id.toString()),
      } as AssessmentWithMeetLink;
    }

  } catch (error) {
    logger.error(`Failed to create assessment for faculty ${facultyId}:`, error);
    throw error;
  }
}

/**
 * Update an existing assessment and its calendar event
 * @param facultyId - Faculty member updating the assessment
 * @param assessmentId - Assessment ID to update
 * @param updateData - Updated assessment data
 * @returns Updated assessment
 */
export async function updateAssessmentWithCalendar(
  facultyId: string,
  assessmentId: string,
  updateData: Partial<CreateAssessmentRequest>
): Promise<AssessmentWithMeetLink> {
  try {
    // Find and validate assessment
    const assessment = await Assessment.findById(assessmentId) as IAssessment | null;
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    if (assessment.facultyId.toString() !== facultyId) {
      throw new Error('You can only update your own assessments');
    }

    // Update assessment fields
    if (updateData.title) assessment.title = updateData.title;
    if (updateData.description) assessment.description = updateData.description;
    if (updateData.dueAt) assessment.dueAt = new Date(updateData.dueAt);
    if (updateData.cohortIds) {
      assessment.visibility.cohortIds = updateData.cohortIds.map(id => new mongoose.Types.ObjectId(id));
    }
    if (updateData.settings) {
      assessment.settings = { ...assessment.settings, ...updateData.settings };
    }

    await assessment.save();

    // Update calendar event if it exists
    if (assessment.calendarEventId && (updateData.title || updateData.description || updateData.dueAt)) {
      try {
        const hasPermissions = await hasCalendarPermissions(facultyId);
        
        if (hasPermissions) {
          const dueDate = new Date(assessment.dueAt);
          const startTime = new Date(dueDate.getTime() - 60 * 60 * 1000);

          const updatedEvent = await updateCalendarEvent(facultyId, assessment.calendarEventId, {
            summary: `Assessment: ${assessment.title}`,
            description: assessment.description,
            start: {
              dateTime: startTime.toISOString(),
              timeZone: 'Asia/Kolkata',
            },
            end: {
              dateTime: dueDate.toISOString(),
              timeZone: 'Asia/Kolkata',
            },
          });

          assessment.meetUrl = updatedEvent.meetUrl;
          await assessment.save();

          logger.info(`Calendar event updated for assessment ${assessmentId}`);
        }
      } catch (calendarError) {
        logger.error(`Failed to update calendar event for assessment ${assessmentId}:`, calendarError);
        // Continue without failing the assessment update
      }
    }

    return assessment.toObject() as AssessmentWithMeetLink;

  } catch (error) {
    logger.error(`Failed to update assessment ${assessmentId}:`, error);
    throw error;
  }
}

/**
 * Delete an assessment and its calendar event
 * @param facultyId - Faculty member deleting the assessment
 * @param assessmentId - Assessment ID to delete
 */
export async function deleteAssessmentWithCalendar(
  facultyId: string,
  assessmentId: string
): Promise<void> {
  try {
    // Find and validate assessment
    const assessment = await Assessment.findById(assessmentId) as IAssessment | null;
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    if (assessment.facultyId.toString() !== facultyId) {
      throw new Error('You can only delete your own assessments');
    }

    // Delete calendar event if it exists
    if (assessment.calendarEventId) {
      try {
        const hasPermissions = await hasCalendarPermissions(facultyId);
        
        if (hasPermissions) {
          await deleteCalendarEvent(facultyId, assessment.calendarEventId);
          logger.info(`Calendar event deleted for assessment ${assessmentId}`);
        }
      } catch (calendarError) {
        logger.error(`Failed to delete calendar event for assessment ${assessmentId}:`, calendarError);
        // Continue with assessment deletion even if calendar deletion fails
      }
    }

    // Delete assessment from database
    await Assessment.findByIdAndDelete(assessmentId);
    logger.info(`Assessment deleted: ${assessmentId}`);

  } catch (error) {
    logger.error(`Failed to delete assessment ${assessmentId}:`, error);
    throw error;
  }
}

/**
 * Get assessments for a faculty member
 * @param facultyId - Faculty member ID
 * @param filters - Optional filters
 * @returns List of assessments
 */
export async function getFacultyAssessments(
  facultyId: string,
  filters?: {
    courseId?: string;
    status?: 'draft' | 'published' | 'closed';
    limit?: number;
    skip?: number;
  }
): Promise<IAssessment[]> {
  try {
    const query: any = { facultyId: new mongoose.Types.ObjectId(facultyId) };
    
    if (filters?.courseId) {
      query.courseId = new mongoose.Types.ObjectId(filters.courseId);
    }
    
    if (filters?.status) {
      query.status = filters.status;
    }

    const assessments = await Assessment.find(query)
      .populate('courseId', 'title code')
      .sort({ createdAt: -1 })
      .limit(filters?.limit || 50)
      .skip(filters?.skip || 0);

    return assessments;

  } catch (error) {
    logger.error(`Failed to get assessments for faculty ${facultyId}:`, error);
    throw error;
  }
}

/**
 * Get assessments visible to a student
 * @param studentId - Student ID
 * @param filters - Optional filters
 * @returns List of assessments
 */
export async function getStudentAssessments(
  studentId: string,
  filters?: {
    courseId?: string;
    status?: 'published' | 'closed';
    limit?: number;
    skip?: number;
  }
): Promise<IAssessment[]> {
  try {
    // Find student's cohorts
    const student = await User.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    const cohorts = await Cohort.find({ students: new mongoose.Types.ObjectId(studentId) });
    const cohortIds = cohorts.map(cohort => cohort._id);

    const query: any = {
      'visibility.cohortIds': { $in: cohortIds },
      status: { $in: ['published', 'closed'] }, // Only show published or closed assessments
    };
    
    if (filters?.courseId) {
      query.courseId = new mongoose.Types.ObjectId(filters.courseId);
    }
    
    if (filters?.status) {
      query.status = filters.status;
    }

    const assessments = await Assessment.find(query)
      .populate('courseId', 'title code')
      .populate('facultyId', 'name email')
      .sort({ dueAt: 1 }) // Sort by due date
      .limit(filters?.limit || 50)
      .skip(filters?.skip || 0);

    return assessments;

  } catch (error) {
    logger.error(`Failed to get assessments for student ${studentId}:`, error);
    throw error;
  }
}

/**
 * Complete calendar authentication for an assessment
 * @param facultyId - Faculty member ID
 * @param assessmentId - Assessment ID
 * @param authCode - Google OAuth authorization code
 * @returns Updated assessment with Meet link
 */
export async function completeCalendarAuth(
  facultyId: string,
  assessmentId: string,
  _authCode: string
): Promise<AssessmentWithMeetLink> {
  try {
    // Exchange auth code for tokens (this would be handled by the auth service)
    // For now, assume tokens are stored and try to create the calendar event
    
    const assessment = await Assessment.findById(assessmentId) as IAssessment | null;
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    if (assessment.facultyId.toString() !== facultyId) {
      throw new Error('Unauthorized');
    }

    // Try to create calendar event now that we have permissions
    const course = await Course.findById(assessment.courseId);
    const faculty = await User.findById(facultyId);
    
    if (!course || !faculty) {
      throw new Error('Course or faculty not found');
    }

    const dueDate = new Date(assessment.dueAt);
    const startTime = new Date(dueDate.getTime() - 60 * 60 * 1000);
    
    const studentEmails = await getStudentEmailsFromCohorts(
      assessment.visibility.cohortIds.map(id => id.toString())
    );

    const calendarEvent = await createCalendarEvent(facultyId, {
      summary: `Assessment: ${assessment.title}`,
      description: `${assessment.description}\n\nCourse: ${course.title}\nDue: ${dueDate.toLocaleString()}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: dueDate.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      attendees: [
        { email: faculty.email, displayName: faculty.name },
        ...studentEmails.map(email => ({ email })),
      ],
    });

    // Update assessment with calendar details
    assessment.meetUrl = calendarEvent.meetUrl;
    assessment.calendarEventId = calendarEvent.eventId;
    assessment.status = 'published';
    await assessment.save();

    logger.info(`Calendar authentication completed for assessment ${assessmentId}`);

    return assessment.toObject() as AssessmentWithMeetLink;

  } catch (error) {
    logger.error(`Failed to complete calendar auth for assessment ${assessmentId}:`, error);
    throw error;
  }
}

/**
 * Helper function to get student emails from cohort IDs
 * @param cohortIds - Array of cohort IDs
 * @returns Array of student email addresses
 */
async function getStudentEmailsFromCohorts(cohortIds: string[]): Promise<string[]> {
  try {
    const cohorts = await Cohort.find({
      _id: { $in: cohortIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).populate('students', 'email');

    const emails: string[] = [];
    cohorts.forEach(cohort => {
      cohort.students.forEach((student: any) => {
        if (student.email && !emails.includes(student.email)) {
          emails.push(student.email);
        }
      });
    });

    return emails;

  } catch (error) {
    logger.error('Failed to get student emails from cohorts:', error);
    return [];
  }
}