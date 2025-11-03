import { Grade, IGrade, RubricCriteria } from '../models/Grade';
import { Submission, ISubmission } from '../models/Submission';
import { Assessment } from '../models/Assessment';
// import { User } from '../models/User'; // Not used directly
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export interface CreateGradeRequest {
  score: number;
  maxScore?: number;
  rubric?: RubricCriteria[];
  comments: string;
}

export interface UpdateGradeRequest {
  score?: number;
  maxScore?: number;
  rubric?: RubricCriteria[];
  comments?: string;
}

export interface GradeWithSubmission {
  [key: string]: any;
  submission?: ISubmission;
  student?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Create a grade for a submission
 * @param facultyId - Faculty member creating the grade
 * @param submissionId - Submission to grade
 * @param gradeData - Grade details
 * @returns Created grade
 */
export async function createGrade(
  facultyId: string,
  submissionId: string,
  gradeData: CreateGradeRequest
): Promise<IGrade> {
  try {
    // Validate submission exists and faculty has permission
    const submission = await Submission.findById(submissionId)
      .populate('assessmentId') as ISubmission | null;
    
    if (!submission) {
      throw new Error('Submission not found');
    }

    const assessment = submission.assessmentId as any;
    if (!assessment) {
      throw new Error('Assessment not found for submission');
    }

    // Check if faculty owns the assessment
    if (assessment.facultyId.toString() !== facultyId) {
      throw new Error('You can only grade submissions for your own assessments');
    }

    // Check if grade already exists
    const existingGrade = await Grade.findOne({ submissionId });
    if (existingGrade) {
      throw new Error('Submission has already been graded. Use update instead.');
    }

    // Validate score
    const maxScore = gradeData.maxScore || 100;
    if (gradeData.score < 0 || gradeData.score > maxScore) {
      throw new Error(`Score must be between 0 and ${maxScore}`);
    }

    // Create grade
    const grade = new Grade({
      submissionId: new mongoose.Types.ObjectId(submissionId),
      facultyId: new mongoose.Types.ObjectId(facultyId),
      score: gradeData.score,
      maxScore,
      rubric: gradeData.rubric || [],
      comments: gradeData.comments,
      gradedAt: new Date(),
      history: [], // Will be populated by pre-save middleware
    });

    await grade.save();

    // Update submission status
    submission.status = 'graded';
    await submission.save();

    logger.info(`Grade created for submission ${submissionId} by faculty ${facultyId}`);

    return grade;

  } catch (error) {
    logger.error(`Failed to create grade for submission ${submissionId}:`, error);
    throw error;
  }
}

/**
 * Update an existing grade
 * @param facultyId - Faculty member updating the grade
 * @param gradeId - Grade ID to update
 * @param updateData - Updated grade data
 * @returns Updated grade
 */
export async function updateGrade(
  facultyId: string,
  gradeId: string,
  updateData: UpdateGradeRequest
): Promise<IGrade> {
  try {
    // Find and validate grade
    const grade = await Grade.findById(gradeId)
      .populate({
        path: 'submissionId',
        populate: {
          path: 'assessmentId'
        }
      }) as IGrade | null;

    if (!grade) {
      throw new Error('Grade not found');
    }

    // Check permissions
    const submission = grade.submissionId as any;
    const assessment = submission.assessmentId;
    
    if (assessment.facultyId.toString() !== facultyId) {
      throw new Error('You can only update grades for your own assessments');
    }

    // Update fields
    if (updateData.score !== undefined) {
      const maxScore = updateData.maxScore || grade.maxScore;
      if (updateData.score < 0 || updateData.score > maxScore) {
        throw new Error(`Score must be between 0 and ${maxScore}`);
      }
      grade.score = updateData.score;
    }

    if (updateData.maxScore !== undefined) {
      grade.maxScore = updateData.maxScore;
    }

    if (updateData.rubric !== undefined) {
      grade.rubric = updateData.rubric;
    }

    if (updateData.comments !== undefined) {
      grade.comments = updateData.comments;
    }

    grade.gradedAt = new Date();
    await grade.save();

    logger.info(`Grade updated: ${gradeId} by faculty ${facultyId}`);

    return grade;

  } catch (error) {
    logger.error(`Failed to update grade ${gradeId}:`, error);
    throw error;
  }
}

/**
 * Get grade for a specific submission
 * @param submissionId - Submission ID
 * @param userId - User requesting the grade
 * @param userRole - Role of the user
 * @returns Grade with submission details
 */
export async function getGradeBySubmission(
  submissionId: string,
  userId: string,
  userRole: string
): Promise<GradeWithSubmission | null> {
  try {
    const grade = await Grade.findOne({ submissionId })
      .populate({
        path: 'submissionId',
        populate: [
          {
            path: 'studentId',
            select: 'name email'
          },
          {
            path: 'assessmentId',
            select: 'title facultyId'
          }
        ]
      })
      .populate('facultyId', 'name email') as IGrade | null;

    if (!grade) {
      return null;
    }

    const submission = grade.submissionId as any;
    const assessment = submission.assessmentId;

    // Check permissions
    if (userRole === 'student') {
      // Students can only see their own grades
      if (submission.studentId._id.toString() !== userId) {
        throw new Error('You can only view your own grades');
      }
    } else if (userRole === 'faculty') {
      // Faculty can only see grades for their assessments
      if (assessment.facultyId.toString() !== userId) {
        throw new Error('You can only view grades for your own assessments');
      }
    }
    // Admins can see all grades

    const result: GradeWithSubmission = {
      ...grade.toObject(),
      submission: submission,
      student: {
        id: submission.studentId._id.toString(),
        name: submission.studentId.name,
        email: submission.studentId.email,
      },
    } as GradeWithSubmission;

    return result;

  } catch (error) {
    logger.error(`Failed to get grade for submission ${submissionId}:`, error);
    throw error;
  }
}

/**
 * Get all grades for an assessment (faculty only)
 * @param facultyId - Faculty member ID
 * @param assessmentId - Assessment ID
 * @returns List of grades with submission details
 */
export async function getAssessmentGrades(
  facultyId: string,
  assessmentId: string
): Promise<GradeWithSubmission[]> {
  try {
    // Validate assessment ownership
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    if (assessment.facultyId.toString() !== facultyId) {
      throw new Error('You can only view grades for your own assessments');
    }

    // Get all submissions for the assessment
    const submissions = await Submission.find({ assessmentId })
      .populate('studentId', 'name email');

    // Get grades for these submissions
    const submissionIds = submissions.map(sub => sub._id);
    const grades = await Grade.find({ submissionId: { $in: submissionIds } })
      .populate('facultyId', 'name email');

    // Combine grades with submission data
    const result: GradeWithSubmission[] = grades.map(grade => {
      const submission = submissions.find(sub => (sub._id as any).toString() === grade.submissionId.toString());
      const student = submission?.studentId as any;

      const gradeObj = grade.toObject() as any;
      gradeObj.submission = submission?.toObject();
      gradeObj.student = student ? {
        id: student._id.toString(),
        name: student.name,
        email: student.email,
      } : undefined;
      
      return gradeObj;
    });

    return result;

  } catch (error) {
    logger.error(`Failed to get grades for assessment ${assessmentId}:`, error);
    throw error;
  }
}

/**
 * Get all grades for a student
 * @param studentId - Student ID
 * @returns List of student's grades
 */
export async function getStudentGrades(studentId: string): Promise<GradeWithSubmission[]> {
  try {
    // Get all submissions by the student
    const submissions = await Submission.find({ studentId })
      .populate({
        path: 'assessmentId',
        select: 'title dueAt courseId',
        populate: {
          path: 'courseId',
          select: 'title code'
        }
      });

    // Get grades for these submissions
    const submissionIds = submissions.map(sub => sub._id);
    const grades = await Grade.find({ submissionId: { $in: submissionIds } })
      .populate('facultyId', 'name email');

    // Combine grades with submission data
    const result: GradeWithSubmission[] = grades.map(grade => {
      const submission = submissions.find(sub => (sub._id as any).toString() === grade.submissionId.toString());

      const gradeObj = grade.toObject() as any;
      gradeObj.submission = submission?.toObject();
      
      return gradeObj;
    });

    // Sort by graded date (newest first)
    result.sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime());

    return result;

  } catch (error) {
    logger.error(`Failed to get grades for student ${studentId}:`, error);
    throw error;
  }
}

/**
 * Get grade statistics for an assessment
 * @param facultyId - Faculty member ID
 * @param assessmentId - Assessment ID
 * @returns Grade statistics
 */
export async function getAssessmentGradeStats(
  facultyId: string,
  assessmentId: string
): Promise<{
  totalSubmissions: number;
  gradedSubmissions: number;
  pendingGrades: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  gradeDistribution: { range: string; count: number }[];
}> {
  try {
    // Validate assessment ownership
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    if (assessment.facultyId.toString() !== facultyId) {
      throw new Error('You can only view statistics for your own assessments');
    }

    // Get all submissions for the assessment
    const totalSubmissions = await Submission.countDocuments({ assessmentId });
    const gradedSubmissions = await Submission.countDocuments({ 
      assessmentId, 
      status: 'graded' 
    });

    // Get all grades for the assessment
    const submissions = await Submission.find({ assessmentId });
    const submissionIds = submissions.map(sub => sub._id);
    const grades = await Grade.find({ submissionId: { $in: submissionIds } });

    const pendingGrades = totalSubmissions - gradedSubmissions;

    if (grades.length === 0) {
      return {
        totalSubmissions,
        gradedSubmissions: 0,
        pendingGrades,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        gradeDistribution: [],
      };
    }

    // Calculate statistics
    const scores = grades.map(grade => (grade.score / grade.maxScore) * 100); // Convert to percentages
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Grade distribution
    const gradeDistribution = [
      { range: '90-100%', count: scores.filter(s => s >= 90).length },
      { range: '80-89%', count: scores.filter(s => s >= 80 && s < 90).length },
      { range: '70-79%', count: scores.filter(s => s >= 70 && s < 80).length },
      { range: '60-69%', count: scores.filter(s => s >= 60 && s < 70).length },
      { range: 'Below 60%', count: scores.filter(s => s < 60).length },
    ];

    return {
      totalSubmissions,
      gradedSubmissions,
      pendingGrades,
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore: Math.round(highestScore * 100) / 100,
      lowestScore: Math.round(lowestScore * 100) / 100,
      gradeDistribution,
    };

  } catch (error) {
    logger.error(`Failed to get grade statistics for assessment ${assessmentId}:`, error);
    throw error;
  }
}

/**
 * Delete a grade (admin only)
 * @param gradeId - Grade ID to delete
 * @param userId - User performing the deletion
 * @param userRole - Role of the user
 */
export async function deleteGrade(
  gradeId: string,
  userId: string,
  userRole: string
): Promise<void> {
  try {
    if (userRole !== 'admin') {
      throw new Error('Only administrators can delete grades');
    }

    const grade = await Grade.findById(gradeId);
    if (!grade) {
      throw new Error('Grade not found');
    }

    // Update submission status back to submitted
    await Submission.findByIdAndUpdate(grade.submissionId, {
      status: 'submitted'
    });

    // Delete the grade
    await Grade.findByIdAndDelete(gradeId);

    logger.info(`Grade deleted: ${gradeId} by admin ${userId}`);

  } catch (error) {
    logger.error(`Failed to delete grade ${gradeId}:`, error);
    throw error;
  }
}

/**
 * Get grade history for a submission
 * @param submissionId - Submission ID
 * @param userId - User requesting the history
 * @param userRole - Role of the user
 * @returns Grade history
 */
export async function getGradeHistory(
  submissionId: string,
  userId: string,
  userRole: string
): Promise<IGrade['history']> {
  try {
    const grade = await Grade.findOne({ submissionId })
      .populate({
        path: 'submissionId',
        populate: {
          path: 'assessmentId',
          select: 'facultyId'
        }
      });

    if (!grade) {
      throw new Error('Grade not found');
    }

    const submission = grade.submissionId as any;
    const assessment = submission.assessmentId;

    // Check permissions
    if (userRole === 'student') {
      if (submission.studentId.toString() !== userId) {
        throw new Error('You can only view your own grade history');
      }
    } else if (userRole === 'faculty') {
      if (assessment.facultyId.toString() !== userId) {
        throw new Error('You can only view grade history for your own assessments');
      }
    }
    // Admins can see all grade history

    return grade.history;

  } catch (error) {
    logger.error(`Failed to get grade history for submission ${submissionId}:`, error);
    throw error;
  }
}