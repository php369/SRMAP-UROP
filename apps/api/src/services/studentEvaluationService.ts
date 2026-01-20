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
    // Use one decimal place precision: 19/20 = 9.5
    return Math.min(10, Math.round(conductScore * 10 / 20 * 10) / 10);
  }

  /**
   * Convert CLA-2 conduct score (0-30) to final grade (0-15)
   */
  static convertCLA2(conductScore: number): number {
    if (conductScore < 0 || conductScore > 30) {
      throw new Error('CLA-2 conduct score must be between 0 and 30');
    }
    // Use one decimal place precision
    return Math.min(15, Math.round(conductScore * 15 / 30 * 10) / 10);
  }

  /**
   * Convert CLA-3 conduct score (0-50) to final grade (0-25)
   */
  static convertCLA3(conductScore: number): number {
    if (conductScore < 0 || conductScore > 50) {
      throw new Error('CLA-3 conduct score must be between 0 and 50');
    }
    // Use one decimal place precision
    return Math.min(25, Math.round(conductScore * 25 / 50 * 10) / 10);
  }

  /**
   * Convert External conduct score (0-100) to final grade (0-50)
   */
  static convertExternal(conductScore: number): number {
    if (conductScore < 0 || conductScore > 100) {
      throw new Error('External conduct score must be between 0 and 100');
    }
    // Use one decimal place precision
    return Math.min(50, Math.round(conductScore * 50 / 100 * 10) / 10);
  }

  /**
   * Update internal assessment score for a student (CLA-1, CLA-2, CLA-3)
   */
  static async updateStudentInternalScore(
    studentId: mongoose.Types.ObjectId,
    groupId: mongoose.Types.ObjectId | null,
    component: 'cla1' | 'cla2' | 'cla3',
    conductScore: number,
    facultyId: mongoose.Types.ObjectId,
    userRole: string,
    assessmentType: 'CLA-1' | 'CLA-2' | 'CLA-3',
    comments?: string
  ): Promise<IStudentEvaluation> {
    try {
      let projectData: any;
      let targetFacultyId: mongoose.Types.ObjectId;

      if (groupId) {
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

        projectData = group.assignedProjectId;
        targetFacultyId = group.assignedFacultyId;
      } else {
        // Solo student - find user directly
        const student = await User.findById(studentId).populate('assignedProjectId');
        if (!student) {
          throw new Error('Student not found');
        }

        if (!student.assignedProjectId || !student.assignedFacultyId) {
          throw new Error('Student must be assigned to a project and faculty before evaluation');
        }

        // Check if faculty is authorized to evaluate this student
        if (userRole === 'faculty' && !student.assignedFacultyId.equals(facultyId)) {
          throw new Error('You are not authorized to evaluate this student');
        }

        // Extract ObjectId from populated project (it could be populated object or ObjectId)
        projectData = (student.assignedProjectId as any)._id || student.assignedProjectId;
        targetFacultyId = student.assignedFacultyId;
      }

      // Validate score ranges based on component
      const maxScores = { cla1: 20, cla2: 30, cla3: 50 };
      const maxScore = maxScores[component];

      if (conductScore < 0 || conductScore > maxScore) {
        throw new Error(`${component.toUpperCase()} conduct score must be between 0 and ${maxScore}`);
      }

      // Find or create student evaluation record for this specific assessment type
      // For solo students (groupId is null), we need to match documents where groupId is null or doesn't exist
      const groupIdQuery = groupId ? groupId : { $in: [null, undefined] };
      let evaluation = await StudentEvaluation.findOne({
        studentId: studentId,
        groupId: groupIdQuery,
        projectId: projectData,
        assessmentType: assessmentType
      });

      if (!evaluation) {
        // Create new evaluation record for this assessment type
        evaluation = new StudentEvaluation({
          studentId: studentId,
          groupId: groupId || undefined,
          projectId: projectData,
          facultyId: targetFacultyId,
          assessmentType: assessmentType,
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

      logger.info(`${component.toUpperCase()} score updated for student ${studentId}${groupId ? ` in group ${groupId}` : ' (Solo)'}: ${conductScore}${comments ? ' with comments' : ''}`);

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
    groupId: mongoose.Types.ObjectId | null,
    conductScore: number,
    facultyId: mongoose.Types.ObjectId,
    userRole: string,
    comments?: string
  ): Promise<IStudentEvaluation> {
    try {
      let projectData: any;
      let targetFacultyId: mongoose.Types.ObjectId;

      if (groupId) {
        // Find the group and validate it exists
        const group = await Group.findById(groupId);
        if (!group) {
          throw new Error('Group not found');
        }

        if (!group.assignedProjectId || !group.assignedFacultyId) {
          throw new Error('Group must be assigned to a project before evaluation');
        }

        projectData = group.assignedProjectId;
        targetFacultyId = group.assignedFacultyId;
      } else {
        // Solo student
        const student = await User.findById(studentId);
        if (!student) {
          throw new Error('Student not found');
        }

        if (!student.assignedProjectId || !student.assignedFacultyId) {
          throw new Error('Student must be assigned to a project and faculty before evaluation');
        }

        projectData = student.assignedProjectId;
        targetFacultyId = student.assignedFacultyId;
      }

      // Validate score range
      if (conductScore < 0 || conductScore > 100) {
        throw new Error('External conduct score must be between 0 and 100');
      }

      // Find evaluation record for External assessment type
      // For solo students (groupId is null), we need to match documents where groupId is null or doesn't exist
      const groupIdQuery = groupId ? groupId : { $in: [null, undefined] };
      const evaluation = await StudentEvaluation.findOne({
        studentId: studentId,
        groupId: groupIdQuery,
        projectId: projectData,
        assessmentType: 'External'
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

      logger.info(`External score updated for student ${studentId}${groupId ? ` in group ${groupId}` : ' (Solo)'}: ${conductScore}${comments ? ' with comments' : ''}`);

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
   * Get student evaluations for faculty grading (both group and solo students)
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

      // If project type is specified, filter by group type for group students
      // and by user role for solo students
      if (projectType) {
        const groups = await Group.find({
          type: projectType,
          status: 'approved',
          assignedProjectId: { $exists: true }
        }).select('_id');

        const groupIds = groups.map(g => g._id);

        // Update match conditions to include both group and solo students
        matchConditions = {
          $and: [
            {
              $or: [
                { facultyId: facultyId },
                { externalFacultyId: facultyId }
              ]
            },
            {
              $or: [
                { groupId: { $in: groupIds } }, // Group students
                { groupId: { $exists: false } } // Solo students (no groupId)
              ]
            }
          ]
        };
      }

      const evaluations = await StudentEvaluation.find(matchConditions)
        .populate('studentId', 'name email studentId')
        .populate('groupId', 'groupCode members assignedProjectId')
        .populate('projectId', 'title type')
        .populate('facultyId', 'name email')
        .populate('externalFacultyId', 'name email')
        .sort({ createdAt: 1 });

      // Group evaluations by group for group students, and handle solo students separately
      const groupedEvaluations: any = {};
      const soloEvaluations: any[] = [];

      evaluations.forEach(evaluation => {
        if (evaluation.groupId) {
          // Group student
          const groupId = evaluation.groupId._id.toString();
          if (!groupedEvaluations[groupId]) {
            groupedEvaluations[groupId] = {
              groupId: groupId,
              groupCode: (evaluation.groupId as any).groupCode,
              projectId: evaluation.projectId._id,
              projectTitle: (evaluation.projectId as any).title,
              projectType: (evaluation.projectId as any).type,
              submissionType: 'group',
              students: []
            };
          }

          groupedEvaluations[groupId].students.push({
            studentId: evaluation.studentId._id,
            studentName: (evaluation.studentId as any).name,
            studentEmail: (evaluation.studentId as any).email,
            evaluation: evaluation
          });
        } else {
          // Solo student
          soloEvaluations.push({
            studentId: evaluation.studentId._id,
            studentName: (evaluation.studentId as any).name,
            studentEmail: (evaluation.studentId as any).email,
            projectId: evaluation.projectId._id,
            projectTitle: (evaluation.projectId as any).title,
            projectType: (evaluation.projectId as any).type,
            submissionType: 'solo',
            students: [{
              studentId: evaluation.studentId._id,
              studentName: (evaluation.studentId as any).name,
              studentEmail: (evaluation.studentId as any).email,
              evaluation: evaluation
            }]
          });
        }
      });

      // Combine group and solo evaluations
      const allEvaluations = [...Object.values(groupedEvaluations), ...soloEvaluations];

      return allEvaluations;
    } catch (error) {
      logger.error('Error getting faculty student evaluations:', error);
      throw error;
    }
  }

  /**
   * Get submissions with student evaluation data for faculty assessment page
   * Includes both group submissions and solo submissions
   * Returns submissions along with counts of assigned groups and solo students
   */
  static async getSubmissionsWithEvaluations(facultyId: mongoose.Types.ObjectId): Promise<{
    submissions: any[];
    assignedGroupCount: number;
    assignedSoloCount: number;
  }> {
    try {
      const submissions: any[] = [];

      // 1. Get GROUP submissions for groups assigned to this faculty
      const facultyGroups = await Group.find({ assignedFacultyId: facultyId })
        .populate('members', 'name email studentId')
        .populate('assignedProjectId', 'title projectId type brief facultyName');

      if (facultyGroups.length > 0) {
        const { GroupSubmission } = await import('../models/GroupSubmission');
        const groupIds = facultyGroups.map(group => group._id);

        // Get group submissions
        const groupSubmissions = await GroupSubmission.find({
          groupId: { $in: groupIds }
        })
          .populate('submittedBy', 'name email')
          .sort({ submittedAt: -1 });

        // Process each group submission
        for (const submission of groupSubmissions) {
          const group = facultyGroups.find(g => g._id.toString() === submission.groupId.toString());
          if (!group) continue;

          // Get student evaluations for this group
          const studentEvaluations = await StudentEvaluation.find({
            groupId: group._id,
            projectId: (group.assignedProjectId as any)._id || group.assignedProjectId
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
            assessmentType: submission.assessmentType || 'CLA-1', // Default for legacy records
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
            projectTitle: (group.assignedProjectId as any)?.title || 'Unknown Project',
            students: studentsWithEvaluations,
            comments: submission.comments
          });
        }
      }

      // 2. Get SOLO submissions for students assigned to this faculty
      const { Submission } = await import('../models/Submission');

      // Find solo submissions in multiple ways:
      // a) Directly by facultyId on the submission
      // b) By finding students whose assignedFacultyId matches this faculty

      // First, get students assigned to this faculty
      const studentsAssignedToFaculty = await User.find({
        assignedFacultyId: facultyId
      }).select('_id');
      const studentIds = studentsAssignedToFaculty.map(s => s._id);

      // Query for solo submissions
      const soloSubmissions = await Submission.find({
        $or: [
          { facultyId: facultyId }, // Direct faculty assignment
          { studentId: { $in: studentIds } } // Students assigned to this faculty
        ]
      })
        .populate('studentId', 'name email studentId assignedFacultyId assignedProjectId')
        .populate({
          path: 'studentId',
          populate: { path: 'assignedProjectId' }
        })
        .populate('projectId', 'title projectId type brief')
        .populate('submittedBy', 'name email')
        .sort({ submittedAt: -1 });

      logger.info(`Found ${soloSubmissions.length} solo submissions for faculty ${facultyId}`);

      // Process each solo submission
      for (const submission of soloSubmissions) {
        if (!submission.studentId) continue;

        // Skip if already added via group submissions
        if (submissions.some(s => s._id.toString() === submission._id.toString())) continue;

        // Get student evaluation for this solo student
        const studentEvaluation = await StudentEvaluation.findOne({
          studentId: submission.studentId._id,
          groupId: { $in: [null, undefined] },
          projectId: (submission.projectId as any)._id || submission.projectId,
          assessmentType: submission.assessmentType
        }).populate('studentId', 'name email studentId');

        // Create student data with evaluation
        const studentWithEvaluation = {
          studentId: (submission.studentId as any)._id,
          studentName: (submission.studentId as any).name,
          studentEmail: (submission.studentId as any).email,
          evaluation: studentEvaluation || null
        };

        submissions.push({
          _id: submission._id,
          submissionType: 'solo',
          assessmentType: submission.assessmentType,
          githubLink: submission.githubLink,
          reportUrl: submission.reportUrl,
          presentationUrl: submission.pptUrl || submission.presentationUrl,
          submittedAt: submission.submittedAt,
          submittedBy: submission.submittedBy,
          studentId: {
            _id: (submission.studentId as any)._id,
            name: (submission.studentId as any).name,
            email: (submission.studentId as any).email,
            assignedProjectId: (submission.studentId as any).assignedProjectId || submission.projectId
          },
          projectId: submission.projectId,
          projectTitle: (submission.studentId as any).assignedProjectId?.title || (submission.projectId as any)?.title || 'Unknown Project',
          students: [studentWithEvaluation], // Solo student as single-item array for consistency
          comments: submission.comments,
          facultyGrade: submission.facultyGrade,
          externalGrade: submission.externalGrade,
          finalGrade: submission.finalGrade,
          facultyComments: submission.facultyComments,
          externalComments: submission.externalComments,
          isGraded: submission.isGraded,
          isGradeReleased: submission.isGradeReleased
        });
      }

      // Sort all submissions by submission date (most recent first)
      submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

      return {
        submissions,
        assignedGroupCount: facultyGroups.length,
        assignedSoloCount: studentsAssignedToFaculty.length
      };
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

  /**
   * Get all external evaluator assignments (groups and solo students)
   */
  static async getExternalEvaluatorAssignments(): Promise<any[]> {
    try {
      // Get group assignments
      const groupAssignments = await Group.find({
        status: 'approved',
        assignedProjectId: { $exists: true },
        assignedFacultyId: { $exists: true }
      })
        .populate('members', 'name email')
        .populate('assignedProjectId', 'title projectId type brief facultyName')
        .populate('assignedFacultyId', 'name email')
        .populate('externalEvaluatorId', 'name email')
        .lean();

      // Get solo student assignments
      const soloStudents = await User.find({
        role: { $in: ['idp-student', 'urop-student', 'capstone-student'] },
        currentGroupId: { $exists: false },
        assignedProjectId: { $exists: true },
        assignedFacultyId: { $exists: true }
      })
        .populate('assignedProjectId', 'title projectId type brief facultyName')
        .populate('assignedFacultyId', 'name email')
        .lean();

      // Get external evaluator assignments for solo students
      const soloEvaluations = await StudentEvaluation.find({
        studentId: { $in: soloStudents.map(s => s._id) },
        externalFacultyId: { $exists: true }
      })
        .populate('externalFacultyId', 'name email')
        .lean();

      const soloEvaluationMap = new Map();
      soloEvaluations.forEach(evaluation => {
        soloEvaluationMap.set(evaluation.studentId.toString(), evaluation.externalFacultyId);
      });

      // Format group assignments
      const formattedGroupAssignments = groupAssignments.map(group => ({
        _id: group._id,
        submissionType: 'group' as const,
        groupId: {
          _id: group._id,
          groupCode: group.groupCode,
          members: group.members,
          assignedProjectId: group.assignedProjectId,
          assignedFacultyId: group.assignedFacultyId,
          externalEvaluatorId: group.externalEvaluatorId
        },
        internalFaculty: group.assignedFacultyId,
        externalEvaluator: group.externalEvaluatorId,
        hasConflict: group.assignedFacultyId && group.externalEvaluatorId &&
          group.assignedFacultyId._id.toString() === group.externalEvaluatorId._id.toString(),
        isAssigned: !!group.externalEvaluatorId
      }));

      // Format solo student assignments
      const formattedSoloAssignments = soloStudents.map(student => ({
        _id: student._id,
        submissionType: 'solo' as const,
        studentId: {
          _id: student._id,
          name: student.name,
          email: student.email,
          assignedProjectId: student.assignedProjectId,
          assignedFacultyId: student.assignedFacultyId
        },
        internalFaculty: student.assignedFacultyId,
        externalEvaluator: soloEvaluationMap.get(student._id.toString()),
        hasConflict: student.assignedFacultyId && soloEvaluationMap.get(student._id.toString()) &&
          student.assignedFacultyId._id.toString() === soloEvaluationMap.get(student._id.toString())._id.toString(),
        isAssigned: !!soloEvaluationMap.get(student._id.toString())
      }));

      return [...formattedGroupAssignments, ...formattedSoloAssignments];
    } catch (error) {
      logger.error('Error getting external evaluator assignments:', error);
      throw error;
    }
  }

  /**
   * Get available external evaluators with assignment counts
   */
  static async getAvailableExternalEvaluators(): Promise<any[]> {
    try {
      // Get all faculty members who can be external evaluators
      const faculty = await User.find({
        role: 'faculty',
        isExternalEvaluator: true
      }).select('name email').lean();

      // Get assignment counts for each faculty
      const evaluatorsWithCounts = await Promise.all(
        faculty.map(async (evaluator) => {
          // Count group assignments
          const groupCount = await Group.countDocuments({
            externalEvaluatorId: evaluator._id
          });

          // Count solo student assignments
          const soloCount = await StudentEvaluation.countDocuments({
            externalFacultyId: evaluator._id
          });

          return {
            _id: evaluator._id,
            name: evaluator.name,
            email: evaluator.email,
            assignmentCount: groupCount + soloCount,
            isExternalEvaluator: true
          };
        })
      );

      return evaluatorsWithCounts.sort((a, b) => a.assignmentCount - b.assignmentCount);
    } catch (error) {
      logger.error('Error getting available external evaluators:', error);
      throw error;
    }
  }

  /**
   * Validate assignment requirements and constraints
   */
  static async validateAssignmentConstraints(): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Get all external evaluators
      const evaluators = await this.getAvailableExternalEvaluators();

      // Get all assignments
      const assignments = await this.getExternalEvaluatorAssignments();
      const totalAssignments = assignments.length;
      const assignedCount = assignments.filter(a => a.isAssigned).length;
      const unassignedCount = totalAssignments - assignedCount;

      // Validation 1: Check if there are enough evaluators
      if (evaluators.length === 0) {
        issues.push('No external evaluators available in the system');
        recommendations.push('Assign external evaluator role to faculty members');
      } else if (evaluators.length < 2 && totalAssignments > 0) {
        issues.push('Insufficient external evaluators for proper distribution');
        recommendations.push('Add more external evaluators to ensure no faculty evaluates their own projects');
      }

      // Validation 2: Check workload distribution
      if (evaluators.length > 0 && assignedCount > 0) {
        const maxAssignments = Math.max(...evaluators.map(e => e.assignmentCount));
        const minAssignments = Math.min(...evaluators.map(e => e.assignmentCount));
        const imbalance = maxAssignments - minAssignments;

        if (imbalance > 2) {
          issues.push(`Workload imbalance detected: ${imbalance} assignment difference between evaluators`);
          recommendations.push('Run auto-assignment to redistribute workload evenly');
        }
      }

      // Validation 3: Check for conflicts
      const conflicts = assignments.filter(a => a.hasConflict);
      if (conflicts.length > 0) {
        issues.push(`${conflicts.length} assignment conflicts detected (internal faculty assigned as external evaluator)`);
        recommendations.push('Reassign conflicting evaluations to different faculty members');
      }

      // Validation 4: Check minimum assignment rule
      const activeEvaluators = evaluators.filter(e => e.assignmentCount > 0);
      const inactiveEvaluators = evaluators.filter(e => e.assignmentCount === 0);

      if (inactiveEvaluators.length > 0 && unassignedCount > 0) {
        recommendations.push(`${inactiveEvaluators.length} evaluators have no assignments while ${unassignedCount} projects remain unassigned`);
      }

      // Validation 5: Check if all evaluators have at least one project (if possible)
      if (totalAssignments >= evaluators.length && activeEvaluators.length < evaluators.length) {
        issues.push('Some evaluators have no assignments despite sufficient projects available');
        recommendations.push('Ensure each evaluator gets at least one project for fair distribution');
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations
      };
    } catch (error) {
      logger.error('Error validating assignment constraints:', error);
      throw error;
    }
  }

  /**
   * Enhanced auto-assign with improved distribution algorithm
   */
  static async autoAssignExternalEvaluators(): Promise<any> {
    try {
      // Validate constraints before assignment
      const validation = await this.validateAssignmentConstraints();
      if (!validation.isValid) {
        throw new Error(`Assignment validation failed: ${validation.issues.join(', ')}`);
      }

      // Get available external evaluators (sorted by current assignment count)
      const evaluators = await this.getAvailableExternalEvaluators();

      if (evaluators.length === 0) {
        throw new Error('No external evaluators available');
      }

      // Get unassigned groups
      const unassignedGroups = await Group.find({
        status: 'approved',
        assignedProjectId: { $exists: true },
        assignedFacultyId: { $exists: true },
        externalEvaluatorId: { $exists: false }
      }).populate('assignedFacultyId', '_id name email');

      // Get unassigned solo students
      const unassignedSoloStudents = await User.find({
        role: { $in: ['idp-student', 'urop-student', 'capstone-student'] },
        currentGroupId: { $exists: false },
        assignedProjectId: { $exists: true },
        assignedFacultyId: { $exists: true }
      }).populate('assignedFacultyId', '_id name email');

      // Filter out solo students who already have external evaluators
      const soloStudentsWithoutExternal = [];
      for (const student of unassignedSoloStudents) {
        const hasExternal = await StudentEvaluation.findOne({
          studentId: student._id,
          externalFacultyId: { $exists: true }
        });
        if (!hasExternal) {
          soloStudentsWithoutExternal.push(student);
        }
      }

      // Define proper types for assignment entities
      interface GroupAssignmentEntity {
        type: 'group';
        entity: {
          _id: any;
          groupCode: string;
          assignedFacultyId: any;
        };
      }

      interface SoloAssignmentEntity {
        type: 'solo';
        entity: {
          _id: any;
          name: string;
          assignedFacultyId: any;
        };
      }

      type AssignmentEntity = GroupAssignmentEntity | SoloAssignmentEntity;

      // Combine all unassigned entities for better distribution
      const allUnassigned: AssignmentEntity[] = [
        ...unassignedGroups.map(g => ({
          type: 'group' as const,
          entity: {
            _id: g._id,
            groupCode: g.groupCode,
            assignedFacultyId: g.assignedFacultyId
          }
        })),
        ...soloStudentsWithoutExternal.map(s => ({
          type: 'solo' as const,
          entity: {
            _id: s._id,
            name: s.name || 'Unknown Student',
            assignedFacultyId: s.assignedFacultyId
          }
        }))
      ];

      // Shuffle for random distribution
      for (let i = allUnassigned.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allUnassigned[i], allUnassigned[j]] = [allUnassigned[j], allUnassigned[i]];
      }

      let groupsAssigned = 0;
      let soloStudentsAssigned = 0;
      const assignmentFailures: string[] = [];

      // Enhanced assignment algorithm with better distribution
      for (const item of allUnassigned) {
        const { type, entity } = item;
        const internalFacultyId = entity.assignedFacultyId?._id?.toString();

        // Find the evaluator with the least assignments who is not the internal faculty
        const availableEvaluators = evaluators
          .filter(evaluator => evaluator._id.toString() !== internalFacultyId)
          .sort((a, b) => a.assignmentCount - b.assignmentCount);

        if (availableEvaluators.length === 0) {
          const entityName = type === 'group' ? entity.groupCode : entity.name;
          const facultyName = entity.assignedFacultyId?.name || 'Unknown';
          assignmentFailures.push(`No suitable external evaluator found for ${type} ${entityName} (internal faculty: ${facultyName})`);
          continue;
        }

        // Assign to the evaluator with the least assignments
        const selectedEvaluator = availableEvaluators[0];

        try {
          if (type === 'group') {
            // Assign to group
            await Group.findByIdAndUpdate(entity._id, {
              externalEvaluatorId: selectedEvaluator._id
            });

            // Update student evaluations
            await this.assignExternalEvaluatorToStudents(
              entity._id,
              selectedEvaluator._id,
              selectedEvaluator._id
            );

            groupsAssigned++;
          } else {
            // Assign to solo student
            await this.assignExternalEvaluatorToSoloStudent(
              entity._id,
              selectedEvaluator._id,
              selectedEvaluator._id
            );

            soloStudentsAssigned++;
          }

          // Update local assignment count for better distribution in this session
          selectedEvaluator.assignmentCount++;

        } catch (error) {
          const entityName = type === 'group' ? entity.groupCode : entity.name;
          assignmentFailures.push(`Failed to assign ${type} ${entityName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          logger.error(`Assignment error for ${type} ${entityName}:`, error);
        }
      }

      // Log assignment summary
      logger.info(`Auto-assignment completed: ${groupsAssigned} groups, ${soloStudentsAssigned} solo students assigned`);

      if (assignmentFailures.length > 0) {
        logger.warn(`Assignment failures: ${assignmentFailures.join('; ')}`);
      }

      // Validate final distribution
      const finalValidation = await this.validateAssignmentConstraints();

      return {
        groupsAssigned,
        soloStudentsAssigned,
        totalAssigned: groupsAssigned + soloStudentsAssigned,
        evaluatorsUsed: evaluators.length,
        failures: assignmentFailures,
        distributionValid: finalValidation.isValid,
        distributionIssues: finalValidation.issues,
        recommendations: finalValidation.recommendations
      };
    } catch (error) {
      logger.error('Error auto-assigning external evaluators:', error);
      throw error;
    }
  }

  /**
   * Assign external evaluator to a solo student
   */
  static async assignExternalEvaluatorToSoloStudent(
    studentId: mongoose.Types.ObjectId,
    externalFacultyId: mongoose.Types.ObjectId,
    _assignedBy: mongoose.Types.ObjectId
  ): Promise<any> {
    try {
      // Validate student exists and is solo
      const student = await User.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      if (student.currentGroupId) {
        throw new Error('Student is not a solo student');
      }

      if (!student.assignedProjectId || !student.assignedFacultyId) {
        throw new Error('Student must be assigned to a project before external evaluator assignment');
      }

      // Validate external faculty exists
      const externalFaculty = await User.findById(externalFacultyId);
      if (!externalFaculty) {
        throw new Error('External faculty not found');
      }

      if (externalFaculty.role !== 'faculty' || !externalFaculty.isExternalEvaluator) {
        throw new Error('User is not a faculty member or external evaluator');
      }

      // Check if external faculty is different from internal faculty
      if (student.assignedFacultyId.equals(externalFacultyId)) {
        throw new Error('External evaluator cannot be the same as internal faculty');
      }

      // Find or create student evaluation record
      let evaluation = await StudentEvaluation.findOne({
        studentId: studentId,
        projectId: student.assignedProjectId,
        assessmentType: 'External'
      });

      if (!evaluation) {
        evaluation = new StudentEvaluation({
          studentId: studentId,
          groupId: null, // Solo student has no group
          projectId: student.assignedProjectId,
          facultyId: student.assignedFacultyId,
          externalFacultyId: externalFacultyId,
          assessmentType: 'External'
        });
      } else {
        evaluation.externalFacultyId = externalFacultyId;
      }

      await evaluation.save();

      logger.info(`External evaluator ${externalFaculty.email} assigned to solo student ${student.name}`);

      return {
        updated: 1,
        evaluation: evaluation
      };
    } catch (error) {
      logger.error('Error assigning external evaluator to solo student:', error);
      throw error;
    }
  }

  /**
   * Remove external evaluator assignment from a group
   */
  static async removeExternalEvaluatorAssignment(
    groupId: mongoose.Types.ObjectId
  ): Promise<any> {
    try {
      // Find the group
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Remove external evaluator from group
      await Group.findByIdAndUpdate(groupId, {
        $unset: { externalEvaluatorId: 1 }
      });

      // Remove external evaluator from all student evaluations in the group
      const result = await StudentEvaluation.updateMany(
        {
          groupId: groupId,
          projectId: group.assignedProjectId
        },
        {
          $unset: { externalFacultyId: 1 }
        }
      );

      logger.info(`External evaluator assignment removed from group ${group.groupCode} and ${result.modifiedCount} student evaluations`);

      return {
        updated: result.modifiedCount,
        groupCode: group.groupCode
      };
    } catch (error) {
      logger.error('Error removing external evaluator assignment:', error);
      throw error;
    }
  }

  /**
   * Validate minimum assignment rule - ensure each evaluator gets at least one project if possible
   */
  static async validateMinimumAssignmentRule(): Promise<{
    isValid: boolean;
    violations: Array<{
      evaluatorId: string;
      evaluatorName: string;
      assignmentCount: number;
      recommendedMinimum: number;
    }>;
  }> {
    try {
      const evaluators = await this.getAvailableExternalEvaluators();
      const assignments = await this.getExternalEvaluatorAssignments();

      const totalAssignments = assignments.filter(a => a.isAssigned).length;

      // Calculate minimum assignments per evaluator
      const minimumPerEvaluator = Math.floor(totalAssignments / evaluators.length);
      const violations = [];

      for (const evaluator of evaluators) {
        if (evaluator.assignmentCount < minimumPerEvaluator && totalAssignments >= evaluators.length) {
          violations.push({
            evaluatorId: evaluator._id,
            evaluatorName: evaluator.name,
            assignmentCount: evaluator.assignmentCount,
            recommendedMinimum: minimumPerEvaluator
          });
        }
      }

      return {
        isValid: violations.length === 0,
        violations
      };
    } catch (error) {
      logger.error('Error validating minimum assignment rule:', error);
      throw error;
    }
  }

  /**
   * Rebalance assignments to ensure fair distribution
   */
  static async rebalanceAssignments(): Promise<{
    success: boolean;
    rebalanced: number;
    message: string;
  }> {
    try {
      // First validate current state
      const validation = await this.validateAssignmentConstraints();
      if (validation.isValid) {
        return {
          success: true,
          rebalanced: 0,
          message: 'Assignments are already balanced'
        };
      }

      // Get current assignments and evaluators
      const evaluators = await this.getAvailableExternalEvaluators();
      const assignments = await this.getExternalEvaluatorAssignments();

      const assignedCount = assignments.filter(a => a.isAssigned).length;

      // Find over-assigned and under-assigned evaluators
      const avgAssignments = assignedCount / evaluators.length;
      const overAssigned = evaluators.filter(e => e.assignmentCount > Math.ceil(avgAssignments));
      const underAssigned = evaluators.filter(e => e.assignmentCount < Math.floor(avgAssignments));

      let rebalanced = 0;

      // Move assignments from over-assigned to under-assigned evaluators
      for (const overEvaluator of overAssigned) {
        if (underAssigned.length === 0) break;

        const excessAssignments = overEvaluator.assignmentCount - Math.ceil(avgAssignments);

        // Find assignments to move
        const evaluatorAssignments = assignments.filter(a =>
          a.isAssigned &&
          ((a.submissionType === 'group' && a.groupId?.externalEvaluatorId?._id === overEvaluator._id) ||
            (a.submissionType === 'solo' && a.externalEvaluator?._id === overEvaluator._id))
        );

        for (let i = 0; i < Math.min(excessAssignments, evaluatorAssignments.length) && underAssigned.length > 0; i++) {
          const assignment = evaluatorAssignments[i];
          const targetEvaluator = underAssigned[0];

          // Check if target evaluator can take this assignment (no conflict)
          const internalFacultyId = assignment.submissionType === 'group'
            ? assignment.groupId?.assignedFacultyId?._id
            : assignment.studentId?.assignedFacultyId?._id;

          if (targetEvaluator._id !== internalFacultyId) {
            // Reassign
            if (assignment.submissionType === 'group' && assignment.groupId) {
              await Group.findByIdAndUpdate(assignment.groupId._id, {
                externalEvaluatorId: targetEvaluator._id
              });

              await this.assignExternalEvaluatorToStudents(
                assignment.groupId._id,
                targetEvaluator._id,
                targetEvaluator._id
              );
            } else if (assignment.submissionType === 'solo' && assignment.studentId) {
              await this.assignExternalEvaluatorToSoloStudent(
                assignment.studentId._id,
                targetEvaluator._id,
                targetEvaluator._id
              );
            }

            rebalanced++;
            targetEvaluator.assignmentCount++;

            // Remove from under-assigned if they now have enough
            if (targetEvaluator.assignmentCount >= Math.floor(avgAssignments)) {
              underAssigned.shift();
            }
          }
        }
      }

      return {
        success: true,
        rebalanced,
        message: `Successfully rebalanced ${rebalanced} assignments`
      };
    } catch (error) {
      logger.error('Error rebalancing assignments:', error);
      throw error;
    }
  }

  /**
   * Get external evaluator assignments for a specific faculty member
   */
  static async getExternalEvaluatorAssignmentsForFaculty(
    facultyId: mongoose.Types.ObjectId
  ): Promise<any[]> {
    try {
      // Get group assignments where this faculty is the external evaluator
      const groupAssignments = await Group.find({
        externalEvaluatorId: facultyId,
        status: 'approved',
        assignedProjectId: { $exists: true }
      })
        .populate('members', 'name email studentId')
        .populate('assignedProjectId', 'title projectId type brief facultyName')
        .populate('assignedFacultyId', 'name email')
        .lean();

      // Get solo student assignments where this faculty is the external evaluator
      const soloAssignments = await StudentEvaluation.find({
        externalFacultyId: facultyId,
        assessmentType: 'External'
      })
        .populate('studentId', 'name email studentId assignedProjectId assignedFacultyId')
        .populate('projectId', 'title projectId type brief facultyName')
        .populate('facultyId', 'name email')
        .lean();

      // Format group assignments
      const formattedGroupAssignments = groupAssignments.map(group => ({
        _id: group._id,
        submissionType: 'group' as const,
        groupId: {
          _id: group._id,
          groupCode: group.groupCode,
          members: group.members
        },
        projectInfo: {
          _id: group.assignedProjectId?._id,
          title: (group.assignedProjectId as any)?.title || 'Unknown Project',
          projectId: (group.assignedProjectId as any)?.projectId || 'N/A',
          type: (group.assignedProjectId as any)?.type || 'Unknown',
          brief: (group.assignedProjectId as any)?.brief || 'No description',
          facultyName: (group.assignedProjectId as any)?.facultyName || 'Unknown Faculty'
        },
        internalFaculty: {
          _id: group.assignedFacultyId?._id,
          name: (group.assignedFacultyId as any)?.name || 'Unknown Faculty',
          email: (group.assignedFacultyId as any)?.email || 'unknown@email.com'
        },
        assessmentType: 'External' as const
      }));

      // Format solo assignments
      const formattedSoloAssignments = soloAssignments.map(assignment => ({
        _id: assignment._id,
        submissionType: 'solo' as const,
        studentInfo: {
          _id: assignment.studentId._id,
          name: (assignment.studentId as any)?.name || 'Unknown Student',
          email: (assignment.studentId as any)?.email || 'unknown@email.com',
          studentId: (assignment.studentId as any)?.studentId || 'N/A'
        },
        projectInfo: {
          _id: assignment.projectId._id,
          title: (assignment.projectId as any)?.title || 'Unknown Project',
          projectId: (assignment.projectId as any)?.projectId || 'N/A',
          type: (assignment.projectId as any)?.type || 'Unknown',
          brief: (assignment.projectId as any)?.brief || 'No description',
          facultyName: (assignment.projectId as any)?.facultyName || 'Unknown Faculty'
        },
        internalFaculty: {
          _id: assignment.facultyId._id,
          name: (assignment.facultyId as any)?.name || 'Unknown Faculty',
          email: (assignment.facultyId as any)?.email || 'unknown@email.com'
        },
        assessmentType: 'External' as const
      }));

      return [...formattedGroupAssignments, ...formattedSoloAssignments];
    } catch (error) {
      logger.error('Error getting external evaluator assignments for faculty:', error);
      throw error;
    }
  }

  static async removeExternalEvaluatorFromSoloStudent(
    studentId: mongoose.Types.ObjectId
  ): Promise<any> {
    try {
      // Validate student exists
      const student = await User.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      // Remove external evaluator from student evaluation
      const result = await StudentEvaluation.updateMany(
        {
          studentId: studentId,
          externalFacultyId: { $exists: true }
        },
        {
          $unset: { externalFacultyId: 1 }
        }
      );

      logger.info(`External evaluator assignment removed from solo student ${student.name}`);

      return {
        updated: result.modifiedCount,
        studentName: student.name
      };
    } catch (error) {
      logger.error('Error removing external evaluator from solo student:', error);
      throw error;
    }
  }
}