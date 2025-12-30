import mongoose from 'mongoose';
import { IStudentEvaluation, StudentEvaluation } from '../models/StudentEvaluation';
import { Group } from '../models/Group';
import { User } from '../models/User';
import { logger } from '../utils/logger';

export class StudentEvaluationService {
  /**
   * Convert CLA-1 conduct score (0-20) to final grade (0-10)
   */
  static convertCLA1(conductScore: number): number {
    if (conductScore < 0 || conductScore > 20) {
      throw new Error('CLA-1 conduct score must be between 0 and 20');
    }
    return Math.min(10, Math.round(conductScore * 10 / 20));
  }

  /**
   * Convert CLA-2 conduct score (0-30) to final grade (0-15)
   */
  static convertCLA2(conductScore: number): number {
    if (conductScore < 0 || conductScore > 30) {
      throw new Error('CLA-2 conduct score must be between 0 and 30');
    }
    return Math.min(15, Math.round(conductScore * 15 / 30));
  }

  /**
   * Convert CLA-3 conduct score (0-50) to final grade (0-25)
   */
  static convertCLA3(conductScore: number): number {
    if (conductScore < 0 || conductScore > 50) {
      throw new Error('CLA-3 conduct score must be between 0 and 50');
    }
    return Math.min(25, Math.round(conductScore * 25 / 50));
  }

  /**
   * Convert External conduct score (0-100) to final grade (0-50)
   */
  static convertExternal(conductScore: number): number {
    if (conductScore < 0 || conductScore > 100) {
      throw new Error('External conduct score must be between 0 and 100');
    }
    return Math.min(50, Math.round(conductScore * 50 / 100));
  }

  /**
   * Update internal assessment score for a student (CLA-1, CLA-2, CLA-3)
   */
  static async updateStudentInternalScore(
    studentId: mongoose.Types.ObjectId,
    groupId: mongoose.Types.ObjectId,
    component: 'cla1' | 'cla2' | 'cla3',
    conductScore: number,
    facultyId: mongoose.Types.ObjectId,
    userRole: string,
    comments?: string
  ): Promise<IStudentEvaluation> {
    try {
      // Find the group and validate it exists
      const group = await Group.findById(groupId).populate('members', 'name email');
      if (!group) {
        throw new Error('Group not found');
      }

      if (!group.assignedProjectId || !group.assignedFacultyId) {
        throw new Error('Group must be assigned to a project before evaluation');
      }

      // Check if faculty is authorized to evaluate this group
      if (userRole === 'faculty' && !group.assignedFacultyId.equals(facultyId)) {
        throw new Error('You are not authorized to evaluate this group');
      }

      // Check if student is a member of the group
      const isMember = group.members.some((member: any) => member._id.equals(studentId));
      if (!isMember) {
        throw new Error('Student is not a member of this group');
      }

      // Validate score ranges based on component
      const maxScores = { cla1: 20, cla2: 30, cla3: 50 };
      const maxScore = maxScores[component];
      
      if (conductScore < 0 || conductScore > maxScore) {
        throw new Error(`${component.toUpperCase()} conduct score must be between 0 and ${maxScore}`);
      }

      // Find or create student evaluation record
      let evaluation = await StudentEvaluation.findOne({
        studentId: studentId,
        groupId: groupId,
        projectId: group.assignedProjectId
      });

      if (!evaluation) {
        // Create new evaluation record
        evaluation = new StudentEvaluation({
          studentId: studentId,
          groupId: groupId,
          projectId: group.assignedProjectId,
          facultyId: group.assignedFacultyId,
          internal: {
            cla1: { conduct: 0, convert: 0, comments: '' },
            cla2: { conduct: 0, convert: 0, comments: '' },
            cla3: { conduct: 0, convert: 0, comments: '' }
          },
          external: {
            reportPresentation: { conduct: 0, convert: 0, comments: '' }
          },
          totalInternal: 0,
          totalExternal: 0,
          total: 0,
          isPublished: false
        });
      }

      // Check if grades are already published (frozen)
      if (evaluation.isPublished) {
        throw new Error('Grades have been published and cannot be modified. Please contact the coordinator if changes are needed.');
      }

      // Update the specific component score and comments
      evaluation.internal[component].conduct = conductScore;
      if (comments !== undefined) {
        evaluation.internal[component].comments = comments;
      }
      
      // Save will trigger automatic conversion and totals calculation
      await evaluation.save();

      logger.info(`${component.toUpperCase()} score updated for student ${studentId} in group ${group.groupCode}: ${conductScore}${comments ? ' with comments' : ''}`);

      const populatedEvaluation = await StudentEvaluation.findById(evaluation._id)
        .populate('studentId', 'name email studentId')
        .populate('groupId', 'groupCode members')
        .populate('projectId', 'title type')
        .populate('facultyId', 'name email');
      
      return populatedEvaluation!;

    } catch (error) {
      logger.error('Error updating student internal score:', error);
      throw error;
    }
  }

  /**
   * Update external assessment score for a student
   */
  static async updateStudentExternalScore(
    studentId: mongoose.Types.ObjectId,
    groupId: mongoose.Types.ObjectId,
    conductScore: number,
    facultyId: mongoose.Types.ObjectId,
    userRole: string,
    comments?: string
  ): Promise<IStudentEvaluation> {
    try {
      // Find the group and validate it exists
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      if (!group.assignedProjectId || !group.assignedFacultyId) {
        throw new Error('Group must be assigned to a project before evaluation');
      }

      // Validate score range
      if (conductScore < 0 || conductScore > 100) {
        throw new Error('External conduct score must be between 0 and 100');
      }

      // Find evaluation record
      const evaluation = await StudentEvaluation.findOne({
        studentId: studentId,
        groupId: groupId,
        projectId: group.assignedProjectId
      });

      if (!evaluation) {
        throw new Error('Student evaluation record not found');
      }

      // Check if grades are already published (frozen)
      if (evaluation.isPublished) {
        throw new Error('Grades have been published and cannot be modified. Please contact the coordinator if changes are needed.');
      }

      // Check if faculty is authorized to evaluate this student as external evaluator
      if (userRole === 'faculty') {
        if (!evaluation.externalFacultyId || !evaluation.externalFacultyId.equals(facultyId)) {
          throw new Error('You are not assigned as external evaluator for this student');
        }
      }

      // Update the external score and comments
      evaluation.external.reportPresentation.conduct = conductScore;
      if (comments !== undefined) {
        evaluation.external.reportPresentation.comments = comments;
      }
      
      // Save will trigger automatic conversion and totals calculation
      await evaluation.save();

      logger.info(`External score updated for student ${studentId} in group ${group.groupCode}: ${conductScore}${comments ? ' with comments' : ''}`);

      const populatedEvaluation = await StudentEvaluation.findById(evaluation._id)
        .populate('studentId', 'name email studentId')
        .populate('groupId', 'groupCode members')
        .populate('projectId', 'title type')
        .populate('facultyId', 'name email')
        .populate('externalFacultyId', 'name email');
      
      return populatedEvaluation!;

    } catch (error) {
      logger.error('Error updating student external score:', error);
      throw error;
    }
  }

  /**
   * Get student evaluations for faculty grading
   */
  static async getFacultyStudentEvaluations(
    facultyId: mongoose.Types.ObjectId,
    projectType?: 'IDP' | 'UROP' | 'CAPSTONE'
  ): Promise<any[]> {
    try {
      let matchConditions: any = {
        $or: [
          { facultyId: facultyId },
          { externalFacultyId: facultyId }
        ]
      };

      // If project type is specified, filter by group type
      if (projectType) {
        const groups = await Group.find({ 
          type: projectType,
          status: 'approved',
          assignedProjectId: { $exists: true }
        }).select('_id');
        
        const groupIds = groups.map(g => g._id);
        matchConditions.groupId = { $in: groupIds };
      }

      const evaluations = await StudentEvaluation.find(matchConditions)
        .populate('studentId', 'name email studentId')
        .populate('groupId', 'groupCode members assignedProjectId')
        .populate('projectId', 'title type')
        .populate('facultyId', 'name email')
        .populate('externalFacultyId', 'name email')
        .sort({ createdAt: 1 });

      // Group evaluations by group for easier display
      const groupedEvaluations: any = {};
      
      evaluations.forEach(evaluation => {
        const groupId = evaluation.groupId._id.toString();
        if (!groupedEvaluations[groupId]) {
          groupedEvaluations[groupId] = {
            groupId: groupId,
            groupCode: (evaluation.groupId as any).groupCode,
            projectId: evaluation.projectId._id,
            projectTitle: (evaluation.projectId as any).title,
            projectType: (evaluation.projectId as any).type,
            students: []
          };
        }
        
        groupedEvaluations[groupId].students.push({
          studentId: evaluation.studentId._id,
          studentName: (evaluation.studentId as any).name,
          studentEmail: (evaluation.studentId as any).email,
          evaluation: evaluation
        });
      });

      return Object.values(groupedEvaluations);
    } catch (error) {
      logger.error('Error getting faculty student evaluations:', error);
      throw error;
    }
  }

  /**
   * Get submissions with student evaluation data for faculty assessment page
   */
  static async getSubmissionsWithEvaluations(facultyId: mongoose.Types.ObjectId): Promise<any[]> {
    try {
      // Get groups assigned to this faculty
      const facultyGroups = await Group.find({ assignedFacultyId: facultyId })
        .populate('members', 'name email studentId')
        .populate('assignedProjectId', 'title projectId type brief facultyName');

      if (facultyGroups.length === 0) {
        return [];
      }

      const { GroupSubmission } = await import('../models/GroupSubmission');
      const groupIds = facultyGroups.map(group => group._id);
      
      // Get group submissions
      const groupSubmissions = await GroupSubmission.find({ 
        groupId: { $in: groupIds } 
      })
        .populate('submittedBy', 'name email')
        .sort({ submittedAt: -1 });

      const submissions: any[] = [];

      // Process each group submission
      for (const submission of groupSubmissions) {
        const group = facultyGroups.find(g => g._id.toString() === submission.groupId.toString());
        if (!group) continue;

        // Get student evaluations for this group
        const studentEvaluations = await StudentEvaluation.find({
          groupId: group._id,
          projectId: group.assignedProjectId
        }).populate('studentId', 'name email studentId');

        // Map existing evaluations to students
        const evaluationMap = new Map();
        studentEvaluations.forEach(evaluation => {
          evaluationMap.set(evaluation.studentId._id.toString(), evaluation);
        });

        // Create students array with all group members, including evaluation data if it exists
        const studentsWithEvaluations = group.members.map((member: any) => {
          const evaluation = evaluationMap.get(member._id.toString());
          return {
            studentId: member._id,
            studentName: member.name,
            studentEmail: member.email,
            evaluation: evaluation || null // null if no evaluation exists yet
          };
        });

        submissions.push({
          _id: submission._id,
          submissionType: 'group',
          assessmentType: 'CLA-1', // Default, will be determined by active window
          githubLink: submission.githubUrl,
          reportUrl: submission.reportFile?.url,
          presentationUrl: submission.presentationFile?.url || submission.presentationUrl,
          submittedAt: submission.submittedAt,
          submittedBy: submission.submittedBy,
          groupId: {
            _id: group._id,
            groupCode: group.groupCode,
            members: group.members,
            assignedProjectId: group.assignedProjectId
          },
          projectId: group.assignedProjectId,
          students: studentsWithEvaluations,
          comments: submission.comments
        });
      }

      return submissions;
    } catch (error) {
      logger.error('Error getting submissions with evaluations:', error);
      throw error;
    }
  }

  /**
   * Assign external evaluator to students in a group
   */
  static async assignExternalEvaluatorToStudents(
    groupId: mongoose.Types.ObjectId,
    externalFacultyId: mongoose.Types.ObjectId,
    _assignedBy: mongoose.Types.ObjectId
  ): Promise<{ updated: number; evaluations: IStudentEvaluation[] }> {
    try {
      // Find the group and validate it exists
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      if (!group.assignedProjectId || !group.assignedFacultyId) {
        throw new Error('Group must be assigned to a project before external evaluator assignment');
      }

      // Validate external faculty exists
      const externalFaculty = await User.findById(externalFacultyId);
      if (!externalFaculty) {
        throw new Error('External faculty not found');
      }

      if (externalFaculty.role !== 'faculty' && !externalFaculty.isExternalEvaluator) {
        throw new Error('User is not a faculty member or external evaluator');
      }

      // Check if external faculty is different from internal faculty
      if (group.assignedFacultyId.equals(externalFacultyId)) {
        throw new Error('External evaluator cannot be the same as internal faculty');
      }

      // Update all student evaluations for this group
      const result = await StudentEvaluation.updateMany(
        {
          groupId: groupId,
          projectId: group.assignedProjectId
        },
        {
          externalFacultyId: externalFacultyId
        }
      );

      const updatedEvaluations = await StudentEvaluation.find({
        groupId: groupId,
        projectId: group.assignedProjectId
      })
        .populate('studentId', 'name email studentId')
        .populate('groupId', 'groupCode members')
        .populate('projectId', 'title type')
        .populate('facultyId', 'name email')
        .populate('externalFacultyId', 'name email');

      logger.info(`External evaluator ${externalFaculty.email} assigned to ${result.modifiedCount} students in group ${group.groupCode}`);

      return {
        updated: result.modifiedCount,
        evaluations: updatedEvaluations
      };

    } catch (error) {
      logger.error('Error assigning external evaluator to students:', error);
      throw error;
    }
  }

  /**
   * Get student's own evaluation
   */
  static async getStudentOwnEvaluation(studentId: mongoose.Types.ObjectId): Promise<any[]> {
    try {
      const evaluations = await StudentEvaluation.find({
        studentId: studentId
        // Remove isPublished filter to show all evaluations (including graded but not released)
      })
        .populate('groupId', 'groupCode')
        .populate('projectId', 'title type')
        .populate('facultyId', 'name email')
        .populate('externalFacultyId', 'name email')
        .sort({ createdAt: -1 });

      return evaluations.map(evaluation => ({
        evaluationId: evaluation._id,
        groupCode: (evaluation.groupId as any).groupCode,
        projectTitle: (evaluation.projectId as any).title,
        projectType: (evaluation.projectId as any).type,
        evaluation: evaluation
      }));
    } catch (error) {
      logger.error('Error getting student own evaluation:', error);
      throw error;
    }
  }
}