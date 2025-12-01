import { Submission, ISubmission } from '../models/Submission';
import { Group } from '../models/Group';
import { User } from '../models/User';
import { Window } from '../models/Window';
import { Project } from '../models/Project';
import mongoose from 'mongoose';

export class SubmissionService {
  /**
   * Create a new submission
   */
  static async createSubmission(data: {
    groupId?: string;
    studentId?: string;
    projectId: string;
    projectType: 'IDP' | 'UROP' | 'CAPSTONE';
    assessmentType: 'A1' | 'A2' | 'A3' | 'External';
    githubLink: string;
    reportUrl: string;
    pptUrl?: string;
    submittedBy: string;
    facultyId: string;
    externalEvaluatorId?: string;
  }): Promise<ISubmission> {
    // Validate submission window is open
    const isWindowOpen = await this.checkSubmissionWindow(
      data.projectType,
      data.assessmentType
    );

    if (!isWindowOpen) {
      throw new Error('Submission window is not open');
    }

    // Validate submitter is group leader or solo student
    if (data.groupId) {
      const group = await Group.findById(data.groupId);
      if (!group) {
        throw new Error('Group not found');
      }
      if (group.leaderId.toString() !== data.submittedBy) {
        throw new Error('Only group leader can submit');
      }
    }

    // Check if submission already exists
    const existingSubmission = await Submission.findOne({
      ...(data.groupId ? { groupId: data.groupId } : { studentId: data.studentId }),
      projectId: data.projectId,
      assessmentType: data.assessmentType
    });

    if (existingSubmission) {
      throw new Error('Submission already exists for this assessment');
    }

    // Generate unique submission ID
    const submissionId = await this.generateSubmissionId(data.projectType, data.assessmentType);

    // Create submission
    const submission = new Submission({
      submissionId,
      ...data,
      submittedAt: new Date(),
      isFrozen: true,
      isGraded: false,
      isGradeReleased: false
    });

    await submission.save();
    return submission;
  }

  /**
   * Get submission by ID
   */
  static async getSubmissionById(submissionId: string): Promise<ISubmission | null> {
    return await Submission.findById(submissionId)
      .populate('groupId')
      .populate('studentId')
      .populate('projectId')
      .populate('facultyId')
      .populate('externalEvaluatorId')
      .populate('submittedBy');
  }

  /**
   * Get submissions for a group
   */
  static async getGroupSubmissions(groupId: string): Promise<ISubmission[]> {
    return await Submission.find({ groupId })
      .populate('projectId')
      .populate('facultyId')
      .populate('externalEvaluatorId')
      .sort({ submittedAt: -1 });
  }

  /**
   * Get submissions for a student
   */
  static async getStudentSubmissions(studentId: string): Promise<ISubmission[]> {
    return await Submission.find({ studentId })
      .populate('projectId')
      .populate('facultyId')
      .populate('externalEvaluatorId')
      .sort({ submittedAt: -1 });
  }

  /**
   * Get submissions for faculty to grade
   */
  static async getFacultySubmissions(facultyId: string): Promise<ISubmission[]> {
    return await Submission.find({ facultyId })
      .populate('groupId')
      .populate('studentId')
      .populate('projectId')
      .populate('submittedBy')
      .sort({ submittedAt: -1 });
  }

  /**
   * Get submissions for external evaluator
   */
  static async getExternalEvaluatorSubmissions(evaluatorId: string): Promise<ISubmission[]> {
    return await Submission.find({ 
      externalEvaluatorId: evaluatorId,
      assessmentType: 'External'
    })
      .populate('groupId')
      .populate('studentId')
      .populate('projectId')
      .populate('facultyId')
      .populate('submittedBy')
      .sort({ submittedAt: -1 });
  }

  /**
   * Grade a submission (faculty)
   */
  static async gradeFacultySubmission(
    submissionId: string,
    facultyId: string,
    grade: number
  ): Promise<ISubmission> {
    const submission = await Submission.findById(submissionId);

    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.facultyId.toString() !== facultyId) {
      throw new Error('Unauthorized to grade this submission');
    }

    if (grade < 0 || grade > 100) {
      throw new Error('Grade must be between 0 and 100');
    }

    submission.facultyGrade = grade;
    await submission.save();

    return submission;
  }

  /**
   * Grade a submission (external evaluator)
   */
  static async gradeExternalSubmission(
    submissionId: string,
    evaluatorId: string,
    grade: number
  ): Promise<ISubmission> {
    const submission = await Submission.findById(submissionId);

    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.assessmentType !== 'External') {
      throw new Error('External grading only allowed for External assessments');
    }

    if (submission.externalEvaluatorId?.toString() !== evaluatorId) {
      throw new Error('Unauthorized to grade this submission');
    }

    if (grade < 0 || grade > 100) {
      throw new Error('Grade must be between 0 and 100');
    }

    submission.externalGrade = grade;
    await submission.save();

    return submission;
  }

  /**
   * Release grades (coordinator only)
   */
  static async releaseGrades(
    projectType: 'IDP' | 'UROP' | 'CAPSTONE',
    assessmentType?: 'A1' | 'A2' | 'A3' | 'External'
  ): Promise<number> {
    const query: any = { 
      projectType,
      isGraded: true,
      isGradeReleased: false
    };

    if (assessmentType) {
      query.assessmentType = assessmentType;
    }

    const result = await Submission.updateMany(
      query,
      { isGradeReleased: true }
    );

    return result.modifiedCount;
  }

  /**
   * Check if submission window is open
   */
  static async checkSubmissionWindow(
    projectType: 'IDP' | 'UROP' | 'CAPSTONE',
    assessmentType: 'A1' | 'A2' | 'A3' | 'External'
  ): Promise<boolean> {
    const now = new Date();

    const window = await Window.findOne({
      windowType: 'submission',
      projectType,
      assessmentType,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    return !!window;
  }

  /**
   * Generate unique submission ID
   */
  private static async generateSubmissionId(
    projectType: string,
    assessmentType: string
  ): Promise<string> {
    const prefix = `${projectType}-${assessmentType}`;
    const count = await Submission.countDocuments({
      projectType,
      assessmentType
    });

    return `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Get submission statistics
   */
  static async getSubmissionStats(projectType?: 'IDP' | 'UROP' | 'CAPSTONE') {
    const query = projectType ? { projectType } : {};

    const total = await Submission.countDocuments(query);
    const graded = await Submission.countDocuments({ ...query, isGraded: true });
    const released = await Submission.countDocuments({ ...query, isGradeReleased: true });

    const byAssessment = await Submission.aggregate([
      { $match: query },
      { $group: { _id: '$assessmentType', count: { $sum: 1 } } }
    ]);

    return {
      total,
      graded,
      released,
      pending: total - graded,
      byAssessment
    };
  }
}
