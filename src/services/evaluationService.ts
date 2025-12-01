import mongoose from 'mongoose';
import { IEvaluation, Evaluation } from '../models/Evaluation';
import { Group } from '../models/Group';
import { FacultyRoster } from '../models/FacultyRoster';
import { logger } from '../utils/logger';

export class EvaluationService {
  /**
   * Convert A1 conduct score (0-20) to final grade (0-10)
   */
  static convertA1(conductScore: number): number {
    if (conductScore < 0 || conductScore > 20) {
      throw new Error('A1 conduct score must be between 0 and 20');
    }
    return Math.min(10, Math.round(conductScore * 10 / 20));
  }

  /**
   * Convert A2 conduct score (0-30) to final grade (0-15)
   */
  static convertA2(conductScore: number): number {
    if (conductScore < 0 || conductScore > 30) {
      throw new Error('A2 conduct score must be between 0 and 30');
    }
    return Math.min(15, Math.round(conductScore * 15 / 30));
  }

  /**
   * Convert A3 conduct score (0-50) to final grade (0-25)
   */
  static convertA3(conductScore: number): number {
    if (conductScore < 0 || conductScore > 50) {
      throw new Error('A3 conduct score must be between 0 and 50');
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
   * Calculate all conversions and totals for an evaluation
   */
  static calculateScores(evaluation: Partial<IEvaluation>): {
    internal: {
      a1: { conduct: number; convert: number };
      a2: { conduct: number; convert: number };
      a3: { conduct: number; convert: number };
    };
    external: {
      reportPresentation: { conduct: number; convert: number };
    };
    totalInternal: number;
    totalExternal: number;
    total: number;
  } {
    const internal = evaluation.internal || {
      a1: { conduct: 0, convert: 0 },
      a2: { conduct: 0, convert: 0 },
      a3: { conduct: 0, convert: 0 }
    };

    const external = evaluation.external || {
      reportPresentation: { conduct: 0, convert: 0 }
    };

    // Calculate conversions
    const a1Convert = this.convertA1(internal.a1.conduct);
    const a2Convert = this.convertA2(internal.a2.conduct);
    const a3Convert = this.convertA3(internal.a3.conduct);
    const externalConvert = this.convertExternal(external.reportPresentation.conduct);

    // Calculate totals
    const totalInternal = a1Convert + a2Convert + a3Convert;
    const totalExternal = externalConvert;
    const total = totalInternal + totalExternal;

    return {
      internal: {
        a1: { conduct: internal.a1.conduct, convert: a1Convert },
        a2: { conduct: internal.a2.conduct, convert: a2Convert },
        a3: { conduct: internal.a3.conduct, convert: a3Convert }
      },
      external: {
        reportPresentation: { conduct: external.reportPresentation.conduct, convert: externalConvert }
      },
      totalInternal,
      totalExternal,
      total
    };
  }

  /**
   * Validate that all score conversions are accurate
   */
  static validateConversions(evaluation: IEvaluation): boolean {
    try {
      const calculated = this.calculateScores(evaluation);
      
      // Check A1 conversion accuracy
      if (calculated.internal.a1.convert !== evaluation.internal.a1.convert) {
        return false;
      }
      
      // Check A2 conversion accuracy
      if (calculated.internal.a2.convert !== evaluation.internal.a2.convert) {
        return false;
      }
      
      // Check A3 conversion accuracy
      if (calculated.internal.a3.convert !== evaluation.internal.a3.convert) {
        return false;
      }
      
      // Check External conversion accuracy
      if (calculated.external.reportPresentation.convert !== evaluation.external.reportPresentation.convert) {
        return false;
      }
      
      // Check totals accuracy
      if (calculated.totalInternal !== evaluation.totalInternal ||
          calculated.totalExternal !== evaluation.totalExternal ||
          calculated.total !== evaluation.total) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update internal assessment score (A1, A2, A3)
   */
  static async updateInternalScore(
    groupId: mongoose.Types.ObjectId,
    component: 'a1' | 'a2' | 'a3',
    conductScore: number,
    facultyId: mongoose.Types.ObjectId,
    userRole: string
  ): Promise<IEvaluation> {
    try {
      // Find the group and validate it exists
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      if (!group.projectId || !group.facultyId) {
        throw new Error('Group must be assigned to a project before evaluation');
      }

      // Check if faculty is authorized to evaluate this group
      if (userRole === 'faculty' && !group.facultyId.equals(facultyId)) {
        throw new Error('You are not authorized to evaluate this group');
      }

      // Validate score ranges based on component
      const maxScores = { a1: 20, a2: 30, a3: 50 };
      const maxScore = maxScores[component];
      
      if (conductScore < 0 || conductScore > maxScore) {
        throw new Error(`${component.toUpperCase()} conduct score must be between 0 and ${maxScore}`);
      }

      // Find or create evaluation record
      let evaluation = await Evaluation.findOne({
        groupId: groupId,
        projectId: group.projectId
      });

      if (!evaluation) {
        // Create new evaluation record
        evaluation = new Evaluation({
          groupId: groupId,
          projectId: group.projectId,
          facultyId: group.facultyId,
          internal: {
            a1: { conduct: 0, convert: 0 },
            a2: { conduct: 0, convert: 0 },
            a3: { conduct: 0, convert: 0 }
          },
          external: {
            reportPresentation: { conduct: 0, convert: 0 }
          },
          totalInternal: 0,
          totalExternal: 0,
          total: 0,
          isPublished: false
        });
      }

      // Update the specific component score
      evaluation.internal[component].conduct = conductScore;
      
      // Save will trigger automatic conversion and totals calculation
      await evaluation.save();

      logger.info(`${component.toUpperCase()} score updated for group ${group.code}: ${conductScore}`);

      return await Evaluation.findById(evaluation._id)
        .populate('groupId', 'code type memberIds status')
        .populate('projectId', 'title type department')
        .populate('facultyId', 'name email')
        .populate('externalFacultyId', 'name email') as IEvaluation;

    } catch (error) {
      logger.error('Error updating internal score:', error);
      throw error;
    }
  }

  /**
   * Update external assessment score
   */
  static async updateExternalScore(
    groupId: mongoose.Types.ObjectId,
    conductScore: number,
    facultyId: mongoose.Types.ObjectId,
    userRole: string
  ): Promise<IEvaluation> {
    try {
      // Find the group and validate it exists
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      if (!group.projectId || !group.facultyId) {
        throw new Error('Group must be assigned to a project before evaluation');
      }

      // Validate score range
      if (conductScore < 0 || conductScore > 100) {
        throw new Error('External conduct score must be between 0 and 100');
      }

      // Find evaluation record
      const evaluation = await Evaluation.findOne({
        groupId: groupId,
        projectId: group.projectId
      });

      if (!evaluation) {
        throw new Error('Evaluation record not found');
      }

      // Check if faculty is authorized to evaluate this group as external evaluator
      if (userRole === 'faculty') {
        if (!evaluation.externalFacultyId || !evaluation.externalFacultyId.equals(facultyId)) {
          throw new Error('You are not assigned as external evaluator for this group');
        }
      }

      // Update the external score
      evaluation.external.reportPresentation.conduct = conductScore;
      
      // Save will trigger automatic conversion and totals calculation
      await evaluation.save();

      logger.info(`External score updated for group ${group.code}: ${conductScore}`);

      return await Evaluation.findById(evaluation._id)
        .populate('groupId', 'code type memberIds status')
        .populate('projectId', 'title type department')
        .populate('facultyId', 'name email')
        .populate('externalFacultyId', 'name email') as IEvaluation;

    } catch (error) {
      logger.error('Error updating external score:', error);
      throw error;
    }
  }

  /**
   * Get evaluations assigned to faculty for grading
   */
  static async getFacultyEvaluations(
    facultyId: mongoose.Types.ObjectId,
    projectType?: 'IDP' | 'UROP' | 'CAPSTONE'
  ): Promise<IEvaluation[]> {
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
          projectId: { $exists: true }
        }).select('_id');
        
        const groupIds = groups.map(g => g._id);
        matchConditions.groupId = { $in: groupIds };
      }

      const evaluations = await Evaluation.find(matchConditions)
        .populate('groupId', 'code type memberIds status meetUrl')
        .populate('projectId', 'title type department')
        .populate('facultyId', 'name email')
        .populate('externalFacultyId', 'name email')
        .sort({ createdAt: 1 });

      return evaluations;
    } catch (error) {
      logger.error('Error getting faculty evaluations:', error);
      throw error;
    }
  }

  /**
   * Assign external evaluator to a group and update calendar event
   */
  static async assignExternalEvaluator(
    groupId: mongoose.Types.ObjectId,
    externalFacultyId: mongoose.Types.ObjectId,
    _assignedBy: mongoose.Types.ObjectId
  ): Promise<{ evaluation: IEvaluation; calendarUpdated: boolean }> {
    try {
      // Find the group and validate it exists
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      if (!group.projectId || !group.facultyId) {
        throw new Error('Group must be assigned to a project before external evaluator assignment');
      }

      // Validate external faculty exists and is active
      const externalFaculty = await FacultyRoster.findById(externalFacultyId);
      if (!externalFaculty) {
        throw new Error('External faculty not found');
      }

      if (!externalFaculty.active) {
        throw new Error('External faculty is not active');
      }

      // Check if external faculty is different from internal faculty
      if (group.facultyId.equals(externalFacultyId)) {
        throw new Error('External evaluator cannot be the same as internal faculty');
      }

      // Find or create evaluation record
      let evaluation = await Evaluation.findOne({
        groupId: groupId,
        projectId: group.projectId
      });

      if (!evaluation) {
        // Create new evaluation record
        evaluation = new Evaluation({
          groupId: groupId,
          projectId: group.projectId,
          facultyId: group.facultyId,
          externalFacultyId: externalFacultyId,
          internal: {
            a1: { conduct: 0, convert: 0 },
            a2: { conduct: 0, convert: 0 },
            a3: { conduct: 0, convert: 0 }
          },
          external: {
            reportPresentation: { conduct: 0, convert: 0 }
          },
          totalInternal: 0,
          totalExternal: 0,
          total: 0,
          isPublished: false
        });
      } else {
        // Update existing evaluation with external faculty
        evaluation.externalFacultyId = externalFacultyId;
      }

      await evaluation.save();

      // Update calendar event to include external evaluator
      let calendarUpdated = false;
      if (group.calendarEventId) {
        try {
          const { updateCalendarEvent } = await import('./googleCalendar');
          const { User } = await import('../models/User');
          
          // Get internal faculty details for calendar access
          const internalFaculty = await FacultyRoster.findById(group.facultyId);
          if (internalFaculty) {
            // Get all group members for attendees list
            const groupMembers = await User.find({ _id: { $in: group.memberIds } });
            
            // Update calendar event with external evaluator
            await updateCalendarEvent(
              internalFaculty._id.toString(),
              group.calendarEventId,
              {
                attendees: [
                  // Internal faculty
                  {
                    email: internalFaculty.email,
                    displayName: internalFaculty.name
                  },
                  // External faculty
                  {
                    email: externalFaculty.email,
                    displayName: externalFaculty.name
                  },
                  // All group members
                  ...groupMembers.map(member => ({
                    email: member.email,
                    displayName: member.name
                  }))
                ]
              }
            );

            calendarUpdated = true;
            logger.info(`Calendar event ${group.calendarEventId} updated with external evaluator ${externalFaculty.email}`);
          }
        } catch (calendarError) {
          logger.error('Failed to update calendar event with external evaluator:', calendarError);
          // Don't fail the assignment if calendar update fails
        }
      }

      // Send notifications
      try {
        const { notifyExternalEvaluatorAssignedPersistent } = await import('./notificationService');
        const { User } = await import('../models/User');
        const { Project } = await import('../models/Project');
        
        const project = await Project.findById(group.projectId);
        const groupMembers = await User.find({ _id: { $in: group.memberIds } });
        
        if (project && groupMembers.length > 0) {
          // Notify external evaluator and group members
          const memberIds = groupMembers.map(member => member._id.toString());
          const allRecipients = [externalFaculty._id.toString(), ...memberIds];
          
          await notifyExternalEvaluatorAssignedPersistent(
            allRecipients,
            group.code,
            project.title,
            group.meetUrl,
            evaluation._id.toString(),
            _assignedBy.toString()
          );
        }
      } catch (notificationError) {
        logger.error('Failed to send external evaluator assignment notifications:', notificationError);
        // Don't fail the assignment if notifications fail
      }

      logger.info(`External evaluator ${externalFaculty.email} assigned to group ${group.code}`);

      return {
        evaluation: await Evaluation.findById(evaluation._id)
          .populate('groupId', 'code type memberIds status')
          .populate('projectId', 'title type department')
          .populate('facultyId', 'name email')
          .populate('externalFacultyId', 'name email') as IEvaluation,
        calendarUpdated
      };

    } catch (error) {
      logger.error('Error assigning external evaluator:', error);
      throw error;
    }
  }

  /**
   * Remove external evaluator from a group and update calendar event
   */
  static async removeExternalEvaluator(
    groupId: mongoose.Types.ObjectId,
    _removedBy: mongoose.Types.ObjectId
  ): Promise<{ evaluation: IEvaluation; calendarUpdated: boolean }> {
    try {
      // Find the group and validate it exists
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Find evaluation record
      const evaluation = await Evaluation.findOne({
        groupId: groupId,
        projectId: group.projectId
      });

      if (!evaluation) {
        throw new Error('Evaluation record not found');
      }

      if (!evaluation.externalFacultyId) {
        throw new Error('No external evaluator assigned to this group');
      }

      // Store external faculty info for notifications before removal
      const externalFaculty = await FacultyRoster.findById(evaluation.externalFacultyId);

      // Remove external faculty assignment
      evaluation.externalFacultyId = undefined;
      
      // Reset external scores if any
      evaluation.external.reportPresentation.conduct = 0;
      evaluation.external.reportPresentation.convert = 0;
      
      await evaluation.save();

      // Update calendar event to remove external evaluator
      let calendarUpdated = false;
      if (group.calendarEventId) {
        try {
          const { updateCalendarEvent } = await import('./googleCalendar');
          const { User } = await import('../models/User');
          
          // Get internal faculty details for calendar access
          const internalFaculty = await FacultyRoster.findById(group.facultyId);
          if (internalFaculty) {
            // Get all group members for attendees list
            const groupMembers = await User.find({ _id: { $in: group.memberIds } });
            
            // Update calendar event without external evaluator
            await updateCalendarEvent(
              internalFaculty._id.toString(),
              group.calendarEventId,
              {
                attendees: [
                  // Internal faculty only
                  {
                    email: internalFaculty.email,
                    displayName: internalFaculty.name
                  },
                  // All group members
                  ...groupMembers.map(member => ({
                    email: member.email,
                    displayName: member.name
                  }))
                ]
              }
            );

            calendarUpdated = true;
            logger.info(`Calendar event ${group.calendarEventId} updated - external evaluator removed`);
          }
        } catch (calendarError) {
          logger.error('Failed to update calendar event after external evaluator removal:', calendarError);
          // Don't fail the removal if calendar update fails
        }
      }

      // Send notifications
      try {
        const { notifyExternalEvaluatorRemoved } = await import('./notificationService');
        const { User } = await import('../models/User');
        const { Project } = await import('../models/Project');
        
        const project = await Project.findById(group.projectId);
        const groupMembers = await User.find({ _id: { $in: group.memberIds } });
        
        if (project && groupMembers.length > 0 && externalFaculty) {
          // Notify removed external evaluator
          notifyExternalEvaluatorRemoved(
            externalFaculty._id.toString(),
            group.code,
            project.title,
            evaluation._id.toString()
          );

          // Notify group members
          const memberIds = groupMembers.map(member => member._id.toString());
          notifyExternalEvaluatorRemoved(
            memberIds,
            group.code,
            project.title,
            evaluation._id.toString()
          );
        }
      } catch (notificationError) {
        logger.error('Failed to send external evaluator removal notifications:', notificationError);
        // Don't fail the removal if notifications fail
      }

      logger.info(`External evaluator removed from group ${group.code}`);

      return {
        evaluation: await Evaluation.findById(evaluation._id)
          .populate('groupId', 'code type memberIds status')
          .populate('projectId', 'title type department')
          .populate('facultyId', 'name email')
          .populate('externalFacultyId', 'name email') as IEvaluation,
        calendarUpdated
      };

    } catch (error) {
      logger.error('Error removing external evaluator:', error);
      throw error;
    }
  }

  /**
   * Get evaluations that need external evaluator assignment
   */
  static async getEvaluationsNeedingExternalEvaluator(
    projectType?: 'IDP' | 'UROP' | 'CAPSTONE'
  ): Promise<IEvaluation[]> {
    try {
      let matchConditions: any = {
        externalFacultyId: { $exists: false }
      };

      // If project type is specified, filter by group type
      if (projectType) {
        const groups = await Group.find({ 
          type: projectType,
          status: 'approved',
          projectId: { $exists: true }
        }).select('_id');
        
        const groupIds = groups.map(g => g._id);
        matchConditions.groupId = { $in: groupIds };
      }

      const evaluations = await Evaluation.find(matchConditions)
        .populate('groupId', 'code type memberIds status')
        .populate('projectId', 'title type department')
        .populate('facultyId', 'name email')
        .sort({ createdAt: 1 });

      return evaluations;
    } catch (error) {
      logger.error('Error getting evaluations needing external evaluator:', error);
      throw error;
    }
  }

  /**
   * Get evaluations assigned to external faculty
   */
  static async getExternalEvaluatorAssignments(
    externalFacultyId: mongoose.Types.ObjectId
  ): Promise<IEvaluation[]> {
    try {
      const evaluations = await Evaluation.find({
        externalFacultyId: externalFacultyId
      })
        .populate('groupId', 'code type memberIds status')
        .populate('projectId', 'title type department')
        .populate('facultyId', 'name email')
        .populate('externalFacultyId', 'name email')
        .sort({ createdAt: 1 });

      return evaluations;
    } catch (error) {
      logger.error('Error getting external evaluator assignments:', error);
      throw error;
    }
  }

  /**
   * Get evaluations for student's groups
   */
  static async getStudentEvaluations(userId: string): Promise<any[]> {
    try {
      const { GroupSubmission } = await import('../models/GroupSubmission');

      // Find all groups where user is a member
      const userGroups = await Group.find({ 
        memberIds: new mongoose.Types.ObjectId(userId),
        status: { $in: ['approved', 'frozen'] }
      })
        .populate('projectId', 'title')
        .sort({ createdAt: -1 });

      const evaluationViews = [];

      for (const group of userGroups) {
        // Find evaluation for this group
        const evaluation = await Evaluation.findOne({
          groupId: group._id
        });

        // Check if group has submission
        const submission = await GroupSubmission.findOne({
          groupId: group._id
        });

        // Only show published evaluations to students
        const visibleEvaluation = evaluation?.isPublished ? evaluation : null;

        evaluationViews.push({
          groupId: group._id.toString(),
          groupCode: group.code,
          projectTitle: (group.projectId as any)?.title || 'Unknown Project',
          evaluation: visibleEvaluation,
          hasSubmission: !!submission,
          meetUrl: group.meetUrl
        });
      }

      return evaluationViews;
    } catch (error) {
      logger.error('Error getting student evaluations:', error);
      throw error;
    }
  }

  /**
   * Get evaluation for a specific group (student view)
   */
  static async getGroupEvaluationForStudent(
    groupId: mongoose.Types.ObjectId,
    userId: string,
    userRole: string
  ): Promise<any | null> {
    try {
      const { GroupSubmission } = await import('../models/GroupSubmission');

      // Find the group
      const group = await Group.findById(groupId)
        .populate('projectId', 'title');

      if (!group) {
        return null;
      }

      // Check if user is a member of the group (for students)
      if (userRole === 'student') {
        const isMember = group.memberIds.some(
          memberId => memberId.toString() === userId
        );
        if (!isMember) {
          throw new Error('You are not a member of this group');
        }
      }

      // Find evaluation for this group
      const evaluation = await Evaluation.findOne({
        groupId: group._id
      });

      // Check if group has submission
      const submission = await GroupSubmission.findOne({
        groupId: group._id
      });

      // Only show published evaluations to students, faculty/coordinators can see all
      const visibleEvaluation = (userRole === 'student' && evaluation && !evaluation.isPublished) 
        ? null 
        : evaluation;

      return {
        groupId: group._id.toString(),
        groupCode: group.code,
        projectTitle: (group.projectId as any)?.title || 'Unknown Project',
        evaluation: visibleEvaluation,
        hasSubmission: !!submission,
        meetUrl: group.meetUrl
      };
    } catch (error) {
      logger.error('Error getting group evaluation for student:', error);
      throw error;
    }
  }

  /**
   * Bulk update publication status of evaluations
   */
  static async bulkUpdatePublishStatus(
    evaluationIds: mongoose.Types.ObjectId[],
    isPublished: boolean,
    publishedBy: mongoose.Types.ObjectId
  ): Promise<{ updated: number; evaluations: IEvaluation[] }> {
    try {
      // Find all evaluations to update
      const evaluations = await Evaluation.find({
        _id: { $in: evaluationIds }
      });

      if (evaluations.length === 0) {
        throw new Error('No evaluations found with the provided IDs');
      }

      // Update each evaluation
      const updatePromises = evaluations.map(async (evaluation) => {
        evaluation.isPublished = isPublished;
        
        if (isPublished) {
          evaluation.publishedBy = publishedBy;
          if (!evaluation.publishedAt) {
            evaluation.publishedAt = new Date();
          }
        } else {
          // When unpublishing, keep the publishedBy and publishedAt for audit trail
          // but the isPublished flag controls visibility
        }
        
        return evaluation.save();
      });

      const updatedEvaluations = await Promise.all(updatePromises);

      // Send notifications to students about grade publication
      if (isPublished) {
        try {
          const { notifyGradesPublishedPersistent } = await import('./notificationService');
          const { User } = await import('../models/User');
          
          for (const evaluation of updatedEvaluations) {
            const group = await Group.findById(evaluation.groupId);
            if (group) {
              const groupMembers = await User.find({ _id: { $in: group.memberIds } });
              const memberIds = groupMembers.map(member => member._id.toString());
              
              await notifyGradesPublishedPersistent(
                memberIds,
                group.code,
                evaluation._id.toString(),
                publishedBy.toString()
              );
            }
          }
        } catch (notificationError) {
          logger.error('Failed to send grade publication notifications:', notificationError);
          // Don't fail the publication if notifications fail
        }
      }

      logger.info(`${updatedEvaluations.length} evaluation(s) ${isPublished ? 'published' : 'unpublished'} by ${publishedBy}`);

      return {
        updated: updatedEvaluations.length,
        evaluations: await Evaluation.find({ _id: { $in: evaluationIds } })
          .populate('groupId', 'code type memberIds status')
          .populate('projectId', 'title type department')
          .populate('facultyId', 'name email')
          .populate('externalFacultyId', 'name email')
          .populate('publishedBy', 'name email')
      };

    } catch (error) {
      logger.error('Error bulk updating evaluation publication status:', error);
      throw error;
    }
  }

  /**
   * Get coordinator overview of all evaluations
   */
  static async getCoordinatorOverview(
    projectType?: 'IDP' | 'UROP' | 'CAPSTONE',
    publishedFilter?: boolean
  ): Promise<{
    evaluations: IEvaluation[];
    stats: {
      total: number;
      published: number;
      unpublished: number;
      complete: number;
      incomplete: number;
    };
  }> {
    try {
      let matchConditions: any = {};

      // Filter by project type if specified
      if (projectType) {
        const groups = await Group.find({ 
          type: projectType,
          status: 'approved',
          projectId: { $exists: true }
        }).select('_id');
        
        const groupIds = groups.map(g => g._id);
        matchConditions.groupId = { $in: groupIds };
      }

      // Filter by publication status if specified
      if (publishedFilter !== undefined) {
        matchConditions.isPublished = publishedFilter;
      }

      const evaluations = await Evaluation.find(matchConditions)
        .populate('groupId', 'code type memberIds status')
        .populate('projectId', 'title type department')
        .populate('facultyId', 'name email')
        .populate('externalFacultyId', 'name email')
        .populate('publishedBy', 'name email')
        .sort({ createdAt: -1 });

      // Calculate statistics
      const stats = {
        total: evaluations.length,
        published: evaluations.filter(e => e.isPublished).length,
        unpublished: evaluations.filter(e => !e.isPublished).length,
        complete: evaluations.filter(e => this.isEvaluationComplete(e)).length,
        incomplete: evaluations.filter(e => !this.isEvaluationComplete(e)).length
      };

      return {
        evaluations,
        stats
      };

    } catch (error) {
      logger.error('Error getting coordinator evaluation overview:', error);
      throw error;
    }
  }

  /**
   * Check if evaluation is complete (all components have scores > 0)
   */
  private static isEvaluationComplete(evaluation: IEvaluation): boolean {
    return (
      evaluation.internal.a1.conduct > 0 &&
      evaluation.internal.a2.conduct > 0 &&
      evaluation.internal.a3.conduct > 0 &&
      evaluation.external.reportPresentation.conduct > 0
    );
  }
}