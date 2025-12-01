import { GroupSubmission, IGroupSubmission } from '../models/GroupSubmission';
import { Group } from '../models/Group';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export interface CreateSubmissionData {
  groupId: string;
  githubUrl: string;
  reportFile?: {
    url: string;
    name: string;
    size: number;
    contentType: string;
    cloudinaryId?: string;
  };
  presentationFile?: {
    url: string;
    name: string;
    size: number;
    contentType: string;
    cloudinaryId?: string;
  };
  presentationUrl?: string;
  comments?: string;
  submittedBy: string;
  metadata: {
    ipAddress: string;
    userAgent: string;
  };
}

export class SubmissionService {
  /**
   * Create a new group submission
   */
  static async createSubmission(data: CreateSubmissionData): Promise<IGroupSubmission> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate group exists and user is a member
      const group = await Group.findById(data.groupId).session(session);
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if user is a member of the group
      const isGroupMember = group.memberIds.some(
        memberId => memberId.toString() === data.submittedBy
      );
      if (!isGroupMember) {
        throw new Error('Only group members can submit for the group');
      }

      // Check if group has an approved project
      if (group.status !== 'approved' || !group.projectId) {
        throw new Error('Group must have an approved project to submit');
      }

      // Check if submission already exists
      const existingSubmission = await GroupSubmission.findOne({ groupId: data.groupId }).session(session);
      if (existingSubmission) {
        throw new Error('Group has already submitted. Only one submission per group is allowed.');
      }

      // Validate file sizes
      let totalFileSize = 0;
      if (data.reportFile) {
        if (data.reportFile.size > 50 * 1024 * 1024) {
          throw new Error('Report file must be under 50MB');
        }
        totalFileSize += data.reportFile.size;
      }
      if (data.presentationFile) {
        if (data.presentationFile.size > 50 * 1024 * 1024) {
          throw new Error('Presentation file must be under 50MB');
        }
        totalFileSize += data.presentationFile.size;
      }

      // Create submission
      const submission = new GroupSubmission({
        groupId: data.groupId,
        githubUrl: data.githubUrl,
        reportFile: data.reportFile,
        presentationFile: data.presentationFile,
        presentationUrl: data.presentationUrl,
        comments: data.comments,
        submittedBy: data.submittedBy,
        metadata: {
          ...data.metadata,
          totalFileSize
        }
      });

      await submission.save({ session });

      // Update group status to indicate submission
      await Group.findByIdAndUpdate(
        data.groupId,
        { status: 'frozen' }, // Freeze group after submission
        { session }
      );

      await session.commitTransaction();
      
      logger.info(`Group submission created: ${submission._id} by user ${data.submittedBy}`);
      
      return submission;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error creating group submission:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get submission by group ID
   */
  static async getSubmissionByGroupId(groupId: string): Promise<IGroupSubmission | null> {
    try {
      const submission = await GroupSubmission.findOne({ groupId })
        .populate('submittedBy', 'name email')
        .populate('groupId');
      
      return submission;
    } catch (error) {
      logger.error('Error fetching group submission:', error);
      throw error;
    }
  }

  /**
   * Get all submissions for groups that a user is a member of
   */
  static async getSubmissionsForUser(userId: string): Promise<IGroupSubmission[]> {
    try {
      // Find all groups where user is a member
      const userGroups = await Group.find({ 
        memberIds: userId,
        status: { $in: ['approved', 'frozen'] }
      }).select('_id');

      const groupIds = userGroups.map(group => group._id);

      // Find submissions for these groups
      const submissions = await GroupSubmission.find({ 
        groupId: { $in: groupIds } 
      })
        .populate('submittedBy', 'name email')
        .populate('groupId')
        .sort({ submittedAt: -1 });

      return submissions;
    } catch (error) {
      logger.error('Error fetching user submissions:', error);
      throw error;
    }
  }

  /**
   * Get all submissions for faculty review
   */
  static async getSubmissionsForFaculty(facultyId: string): Promise<IGroupSubmission[]> {
    try {
      // Find all groups assigned to this faculty
      const facultyGroups = await Group.find({ 
        facultyId,
        status: { $in: ['approved', 'frozen'] }
      }).select('_id');

      const groupIds = facultyGroups.map(group => group._id);

      // Find submissions for these groups
      const submissions = await GroupSubmission.find({ 
        groupId: { $in: groupIds } 
      })
        .populate('submittedBy', 'name email')
        .populate({
          path: 'groupId',
          populate: {
            path: 'memberIds',
            select: 'name email'
          }
        })
        .sort({ submittedAt: -1 });

      return submissions;
    } catch (error) {
      logger.error('Error fetching faculty submissions:', error);
      throw error;
    }
  }

  /**
   * Check if user can submit for a group
   */
  static async canUserSubmit(userId: string, groupId: string): Promise<{
    canSubmit: boolean;
    reason?: string;
  }> {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        return { canSubmit: false, reason: 'Group not found' };
      }

      // Check if user is a member
      const isGroupMember = group.memberIds.some(
        memberId => memberId.toString() === userId
      );
      if (!isGroupMember) {
        return { canSubmit: false, reason: 'You are not a member of this group' };
      }

      // Check if group has approved project
      if (group.status !== 'approved' || !group.projectId) {
        return { canSubmit: false, reason: 'Group must have an approved project to submit' };
      }

      // Check if already submitted
      const existingSubmission = await GroupSubmission.findOne({ groupId });
      if (existingSubmission) {
        return { canSubmit: false, reason: 'Group has already submitted' };
      }

      return { canSubmit: true };
    } catch (error) {
      logger.error('Error checking submission eligibility:', error);
      return { canSubmit: false, reason: 'Error checking eligibility' };
    }
  }

  /**
   * Update submission (limited updates allowed)
   */
  static async updateSubmission(
    submissionId: string, 
    userId: string, 
    updates: Partial<Pick<IGroupSubmission, 'comments'>>
  ): Promise<IGroupSubmission> {
    try {
      const submission = await GroupSubmission.findById(submissionId).populate('groupId');
      if (!submission) {
        throw new Error('Submission not found');
      }

      // Check if user is a member of the group
      const group = submission.groupId as any;
      const isGroupMember = group.memberIds.some(
        (memberId: mongoose.Types.ObjectId) => memberId.toString() === userId
      );
      if (!isGroupMember) {
        throw new Error('Only group members can update the submission');
      }

      // Only allow updating comments
      if (updates.comments !== undefined) {
        submission.comments = updates.comments;
      }

      await submission.save();
      
      logger.info(`Submission updated: ${submissionId} by user ${userId}`);
      
      return submission;
    } catch (error) {
      logger.error('Error updating submission:', error);
      throw error;
    }
  }
}