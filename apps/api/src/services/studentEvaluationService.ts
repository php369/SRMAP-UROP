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
    assessmentType: 'CLA-1' | 'CLA-2' | 'CLA-3',
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

      // Find or create student evaluation record for this specific assessment type
      let evaluation = await StudentEvaluation.findOne({
        studentId: studentId,
        groupId: groupId,
        projectId: group.assignedProjectId,
        assessmentType: assessmentType
      });

      if (!evaluation) {
        // Create new evaluation record for this assessment type
        evaluation = new StudentEvaluation({
          studentId: studentId,
          groupId: groupId,
          projectId: group.assignedProjectId,
          facultyId: group.assignedFacultyId,
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

      // Find evaluation record for External assessment type
      const evaluation = await StudentEvaluation.findOne({
        studentId: studentId,
        groupId: groupId,
        projectId: group.assignedProjectId,
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
   */
  static async getSubmissionsWithEvaluations(facultyId: mongoose.Types.ObjectId): Promise<any[]> {
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
            students: studentsWithEvaluations,
            comments: submission.comments
          });
        }
      }

      // 2. Get SOLO submissions for students assigned to this faculty
      const { Submission } = await import('../models/Submission');
      
      // Find solo submissions where faculty is assigned
      const soloSubmissions = await Submission.find({ facultyId })
        .populate('studentId', 'name email studentId')
        .populate('projectId', 'title projectId type brief')
        .populate('submittedBy', 'name email')
        .sort({ submittedAt: -1 });

      // Process each solo submission
      for (const submission of soloSubmissions) {
        if (!submission.studentId) continue;

        // Get student evaluation for this solo student
        const studentEvaluation = await StudentEvaluation.findOne({
          studentId: submission.studentId._id,
          projectId: submission.projectId,
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
            assignedProjectId: submission.projectId
          },
          projectId: submission.projectId,
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
   * Auto-assign external evaluators to all unassigned groups and solo students
   */
  static async autoAssignExternalEvaluators(): Promise<any> {
    try {
      // Get available external evaluators
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
      }).populate('assignedFacultyId', '_id');

      // Get unassigned solo students
      const unassignedSoloStudents = await User.find({
        role: { $in: ['idp-student', 'urop-student', 'capstone-student'] },
        currentGroupId: { $exists: false },
        assignedProjectId: { $exists: true },
        assignedFacultyId: { $exists: true }
      }).populate('assignedFacultyId', '_id');

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

      let groupsAssigned = 0;
      let soloStudentsAssigned = 0;
      let evaluatorIndex = 0;

      // Assign to groups
      for (const group of unassignedGroups) {
        // Find an evaluator who is not the internal faculty
        let attempts = 0;
        while (attempts < evaluators.length) {
          const evaluator = evaluators[evaluatorIndex % evaluators.length];
          
          if (evaluator._id.toString() !== group.assignedFacultyId?._id.toString()) {
            // Assign this evaluator
            await Group.findByIdAndUpdate(group._id, {
              externalEvaluatorId: evaluator._id
            });

            // Update student evaluations
            await this.assignExternalEvaluatorToStudents(
              group._id,
              evaluator._id,
              evaluator._id // Using evaluator as assignedBy for auto-assignment
            );

            // Update evaluator assignment count
            evaluator.assignmentCount++;
            groupsAssigned++;
            break;
          }
          
          evaluatorIndex++;
          attempts++;
        }
        
        if (attempts >= evaluators.length) {
          logger.warn(`Could not find suitable external evaluator for group ${group.groupCode}`);
        }
        
        evaluatorIndex++;
      }

      // Assign to solo students
      for (const student of soloStudentsWithoutExternal) {
        // Find an evaluator who is not the internal faculty
        let attempts = 0;
        while (attempts < evaluators.length) {
          const evaluator = evaluators[evaluatorIndex % evaluators.length];
          
          if (evaluator._id.toString() !== student.assignedFacultyId?._id.toString()) {
            // Assign this evaluator
            await this.assignExternalEvaluatorToSoloStudent(
              student._id,
              evaluator._id,
              evaluator._id // Using evaluator as assignedBy for auto-assignment
            );

            // Update evaluator assignment count
            evaluator.assignmentCount++;
            soloStudentsAssigned++;
            break;
          }
          
          evaluatorIndex++;
          attempts++;
        }
        
        if (attempts >= evaluators.length) {
          logger.warn(`Could not find suitable external evaluator for solo student ${student.name}`);
        }
        
        evaluatorIndex++;
      }

      logger.info(`Auto-assigned external evaluators: ${groupsAssigned} groups, ${soloStudentsAssigned} solo students`);

      return {
        groupsAssigned,
        soloStudentsAssigned,
        totalAssigned: groupsAssigned + soloStudentsAssigned,
        evaluatorsUsed: evaluators.length
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
    assignedBy: mongoose.Types.ObjectId
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
   * Remove external evaluator assignment from a solo student
   */
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