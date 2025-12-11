import { Submission, ISubmission } from '../models/Submission';
import { Group } from '../models/Group';
import { User } from '../models/User';
import { Window } from '../models/Window';
import { Project } from '../models/Project';
import mongoose from 'mongoose';

export interface CreateSubmissionData {
  groupId?: string; // For group submissions
  studentId?: string; // For solo submissions
  githubUrl: string;
  presentationUrl?: string;
  comments?: string;
  submittedBy: string;
  reportFile?: {
    url: string;
    name: string;
    size: number;
    contentType: string;
    cloudinaryId: string;
  };
  presentationFile?: {
    url: string;
    name: string;
    size: number;
    contentType: string;
    cloudinaryId: string;
  };
  metadata?: {
    ipAddress: string;
    userAgent: string;
  };
}

export class SubmissionService {
  /**
   * Check if user can submit for a group
   */
  static async canUserSubmit(userId: string, groupId: string): Promise<{
    canSubmit: boolean;
    reason?: string;
  }> {
    try {
      // Check if group exists
      const group = await Group.findById(groupId);
      if (!group) {
        return { canSubmit: false, reason: 'Group not found' };
      }

      // Check if user is a member of the group
      const memberIds = group.members.map((m: mongoose.Types.ObjectId) => m.toString());
      const isMember = memberIds.includes(userId);
      
      if (!isMember) {
        console.log('Member check failed:', {
          userId,
          memberIds,
          leaderId: group.leaderId.toString()
        });
        return { canSubmit: false, reason: 'You are not a member of this group' };
      }

      // Check if user is the group leader
      const isLeader = group.leaderId.toString() === userId;
      if (!isLeader) {
        console.log('Leader check failed:', {
          userId,
          leaderId: group.leaderId.toString(),
          match: group.leaderId.toString() === userId
        });
        return { canSubmit: false, reason: 'Only the group leader can submit' };
      }

      // Check if group already has a submission
      const objectId = new mongoose.Types.ObjectId(groupId);
      const existingSubmission = await Submission.findOne({ groupId: objectId });
      if (existingSubmission) {
        return { canSubmit: false, reason: 'Group has already submitted' };
      }

      return { canSubmit: true };
    } catch (error) {
      console.error('Error in canUserSubmit:', error);
      return { canSubmit: false, reason: 'Error checking eligibility' };
    }
  }

  /**
   * Get submissions for a user's groups
   */
  static async getSubmissionsForUser(userId: string): Promise<ISubmission[]> {
    // Find all groups where user is a member
    const groups = await Group.find({ 'members.user': userId });
    const groupIds = groups.map(g => g._id);

    // Find submissions for these groups
    return await Submission.find({ groupId: { $in: groupIds } })
      .populate('groupId')
      .populate('submittedBy')
      .sort({ submittedAt: -1 });
  }

  /**
   * Get submission by group ID
   */
  static async getSubmissionByGroupId(groupId: string): Promise<ISubmission | null> {
    // Convert string to ObjectId for proper comparison
    const objectId = new mongoose.Types.ObjectId(groupId);
    return await Submission.findOne({ groupId: objectId })
      .populate('groupId')
      .populate('submittedBy');
  }

  /**
   * Get submissions for faculty review
   */
  static async getSubmissionsForFaculty(facultyId: string): Promise<ISubmission[]> {
    // Find projects where faculty is assigned
    const projects = await Project.find({ facultyId });
    const projectIds = projects.map(p => p._id);

    // Find submissions for these projects
    return await Submission.find({ projectId: { $in: projectIds } })
      .populate('groupId')
      .populate('studentId')
      .populate('projectId')
      .populate('submittedBy')
      .sort({ submittedAt: -1 });
  }

  /**
   * Update submission
   */
  static async updateSubmission(
    submissionId: string,
    userId: string,
    updates: Partial<CreateSubmissionData>
  ): Promise<ISubmission> {
    const submission = await Submission.findById(submissionId);
    
    if (!submission) {
      throw new Error('Submission not found');
    }

    // Verify user is the one who submitted
    if (submission.submittedBy.toString() !== userId) {
      throw new Error('Unauthorized to update this submission');
    }

    // Update allowed fields
    if (updates.comments !== undefined) {
      submission.comments = updates.comments;
    }

    await submission.save();
    return submission;
  }
  /**
   * Create a new submission
   */
  static async createSubmission(data: CreateSubmissionData): Promise<ISubmission> {
    let group: any = null;
    let projectType: string = 'UROP'; // Default
    let projectId: mongoose.Types.ObjectId | undefined;
    let facultyId: mongoose.Types.ObjectId | undefined;

    if (data.groupId) {
      // Group submission
      group = await Group.findById(data.groupId).populate('assignedProjectId').populate('assignedFacultyId');
      if (!group) {
        throw new Error('Group not found');
      }

      // Validate submitter is group leader
      if (group.leaderId.toString() !== data.submittedBy) {
        throw new Error('Only group leader can submit');
      }

      // Check if submission already exists
      const groupObjectId = new mongoose.Types.ObjectId(data.groupId);
      const existingSubmission = await Submission.findOne({ groupId: groupObjectId });
      if (existingSubmission) {
        throw new Error('Group has already submitted');
      }

      projectType = group.projectType;
    } else if (data.studentId) {
      // Solo submission
      const studentObjectId = new mongoose.Types.ObjectId(data.studentId);
      
      // Validate submitter is the student
      if (data.studentId !== data.submittedBy) {
        throw new Error('You can only submit for yourself');
      }

      // Check if submission already exists
      const existingSubmission = await Submission.findOne({ studentId: studentObjectId });
      if (existingSubmission) {
        throw new Error('You have already submitted');
      }

      // Get user to determine project type
      const user = await User.findById(data.studentId);
      if (!user) {
        throw new Error('User not found');
      }

      // Map role to project type
      const roleToProjectType: Record<string, string> = {
        'idp-student': 'IDP',
        'urop-student': 'UROP',
        'capstone-student': 'CAPSTONE'
      };
      projectType = roleToProjectType[user.role] || 'UROP';
    } else {
      throw new Error('Either groupId or studentId is required');
    }

    // Get project and faculty details
    if (group) {
      // Group submission - get project details from group
      if (group.assignedProjectId) {
        const project = group.assignedProjectId as any;
        projectId = project._id;
        facultyId = project.facultyId;
      }
      
      if (group.assignedFacultyId) {
        facultyId = (group.assignedFacultyId as any)._id || group.assignedFacultyId;
      }
    } else {
      // Solo submission - project details will be assigned later by coordinator
      // For now, we'll use placeholder values
    }
    
    // If no project or faculty assigned, create a placeholder
    // This allows submissions before formal project assignment
    if (!projectId) {
      // Create a temporary project ID - in production, you'd want to handle this differently
      projectId = new mongoose.Types.ObjectId();
    }
    
    if (!facultyId) {
      // Use a placeholder faculty ID - in production, coordinator would assign later
      facultyId = new mongoose.Types.ObjectId();
    }
    
    // Generate unique submission ID
    const submissionId = await this.generateSubmissionId(projectType, 'A1');
    
    // Create submission
    const submissionData: any = {
      submissionId,
      projectId,
      projectType,
      assessmentType: 'A1', // Default to A1, can be updated later
      githubLink: data.githubUrl,
      reportUrl: data.reportFile?.url || '',
      pptUrl: data.presentationUrl || data.presentationFile?.url || '',
      submittedBy: data.submittedBy,
      facultyId,
    };

    // Add either groupId or studentId
    if (data.groupId) {
      submissionData.groupId = data.groupId;
    } else {
      submissionData.studentId = data.studentId;
    }

    // Add additional fields
    submissionData.submittedAt = new Date();
    submissionData.comments = data.comments;
    submissionData.metadata = data.metadata;
    submissionData.isFrozen = true;
    submissionData.isGraded = false;
    submissionData.isGradeReleased = false;

    const submission = new Submission(submissionData);
    await submission.save();
    
    // Update group status to frozen after submission (only for group submissions)
    if (data.groupId && group && group.status !== 'frozen') {
      group.status = 'frozen';
      await group.save();
      console.log(`Group ${group._id} status updated to frozen after submission`);
    }
    
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
