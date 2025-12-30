import mongoose from 'mongoose';
import { MeetingLog, IMeetingLog } from '../models/MeetingLog';
import { Group, IGroup } from '../models/Group';
import { logger } from '../utils/logger';

export interface CreateMeetingLogData {
  attendees: Array<{
    studentId: string;
    present: boolean;
  }>;
  mode: 'in-person' | 'online' | 'physical'; // 'physical' for backward compatibility
  startedAt: Date;
  endedAt?: Date;
  location?: string;
  notes?: string;
  [key: string]: any; // Allow additional properties for flexibility
}

export interface UpdateMeetingLogData {
  attendees?: Array<{
    studentId: string;
    present: boolean;
  }>;
  mode?: 'in-person' | 'online' | 'physical'; // 'physical' for backward compatibility
  startedAt?: Date;
  endedAt?: Date;
  location?: string;
  notes?: string;
  [key: string]: any; // Allow additional properties for flexibility
}

export class MeetingLogService {
  /**
   * Create a new meeting log for a group
   */
  static async createMeetingLog(
    groupId: mongoose.Types.ObjectId,
    createdBy: mongoose.Types.ObjectId,
    data: CreateMeetingLogData
  ): Promise<IMeetingLog> {
    try {
      // Validate input
      if (!data.attendees || data.attendees.length < 1) {
        throw new Error('Meeting log must have at least one attendee');
      }

      if (!data.startedAt) {
        throw new Error('Meeting start time is required');
      }

      if (!data.mode) {
        throw new Error('Meeting mode is required');
      }

      // Find the group and validate access
      const group = await Group.findById(groupId).populate('projectId facultyId');
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if user is a member of the group
      if (!group.memberIds || !group.memberIds.some(id => id.equals(createdBy))) {
        throw new Error('User is not a member of this group');
      }

      // Check if group has an approved project
      if (group.status !== 'approved' || !group.projectId || !group.facultyId) {
        throw new Error('Group must have an approved project to create meeting logs');
      }

      // Validate attendees are group members
      const attendeeIds = data.attendees.map(a => a.studentId);
      const validAttendees = attendeeIds.every(id => 
        group.memberIds && group.memberIds.some(memberId => memberId.toString() === id)
      );

      if (!validAttendees) {
        throw new Error('All attendees must be group members');
      }

      // Validate no duplicate attendees
      const uniqueAttendees = [...new Set(attendeeIds)];
      if (uniqueAttendees.length !== attendeeIds.length) {
        throw new Error('Duplicate attendees are not allowed');
      }

      // Create the meeting log
      const meetingLog = new MeetingLog({
        groupId,
        projectId: group.projectId,
        facultyId: group.facultyId,
        createdBy,
        attendees: data.attendees.map(a => ({
          studentId: new mongoose.Types.ObjectId(a.studentId),
          present: a.present
        })),
        mode: data.mode === 'physical' ? 'in-person' : data.mode,
        startedAt: data.startedAt,
        endedAt: data.endedAt,
        location: data.location,
        minutesOfMeeting: data.notes,
        status: 'scheduled'
      });

      await meetingLog.save();

      logger.info(`Meeting log created for group ${group.code} by user ${createdBy}`);

      // Send notification to faculty
      try {
        const { notifyMeetingLogSubmittedPersistent } = await import('./notificationService');
        await notifyMeetingLogSubmittedPersistent(
          meetingLog._id.toString(),
          group.code || 'Unknown',
          group.facultyId?.toString() || '',
          createdBy.toString()
        );
      } catch (notificationError) {
        logger.error('Failed to send meeting log notification:', notificationError);
        // Don't fail the creation if notifications fail
      }

      // Return populated meeting log
      return await MeetingLog.findById(meetingLog._id)
        .populate('groupId', 'code type memberIds status')
        .populate('projectId', 'title type department')
        .populate('facultyId', 'name email')
        .populate('createdBy', 'name email')
        .populate('attendees.studentId', 'name email')
        .populate('reviewedBy', 'name email') as IMeetingLog;

    } catch (error) {
      logger.error('Error creating meeting log:', error);
      throw error;
    }
  }

  /**
   * Update a meeting log (only allowed if status is submitted or rejected)
   */
  static async updateMeetingLog(
    logId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    data: UpdateMeetingLogData
  ): Promise<IMeetingLog> {
    try {
      const meetingLog = await MeetingLog.findById(logId).populate('groupId');
      if (!meetingLog) {
        throw new Error('Meeting log not found');
      }

      const group = meetingLog.groupId as unknown as IGroup;

      // Check if user is a member of the group
      if (!group.memberIds || !group.memberIds.some(id => id.equals(userId))) {
        throw new Error('User is not a member of this group');
      }

      // Check if meeting log can be edited
      if (meetingLog.status === 'approved') {
        throw new Error('Cannot edit approved meeting log');
      }

      // Validate attendees if provided
      if (data.attendees) {
        if (data.attendees.length < 1) {
          throw new Error('Meeting log must have at least one attendee');
        }

        const attendeeIds = data.attendees.map(a => a.studentId);
        const validAttendees = attendeeIds.every(id => 
          group.memberIds && group.memberIds.some(memberId => memberId.toString() === id)
        );

        if (!validAttendees) {
          throw new Error('All attendees must be group members');
        }

        // Validate no duplicate attendees
        const uniqueAttendees = [...new Set(attendeeIds)];
        if (uniqueAttendees.length !== attendeeIds.length) {
          throw new Error('Duplicate attendees are not allowed');
        }

        meetingLog.attendees = data.attendees.map(a => ({
          studentId: new mongoose.Types.ObjectId(a.studentId),
          present: a.present
        }));
      }

      // Update other fields with type safety
      try {
        if (data.mode !== undefined) {
          // Convert 'physical' to 'in-person' for backward compatibility
          const mode = data.mode === 'physical' ? 'in-person' : data.mode;
          (meetingLog as any).mode = mode;
        }
        if (data.startedAt !== undefined) (meetingLog as any).startedAt = data.startedAt;
        if (data.endedAt !== undefined) (meetingLog as any).endedAt = data.endedAt;
        if (data.location !== undefined) (meetingLog as any).location = data.location;
        if (data.notes !== undefined) (meetingLog as any).minutesOfMeeting = data.notes;
      } catch (typeError) {
        logger.warn('Type casting issue in meeting log update:', typeError);
        // Fallback to direct assignment
        Object.assign(meetingLog, {
          mode: data.mode === 'physical' ? 'in-person' : data.mode,
          startedAt: data.startedAt,
          endedAt: data.endedAt,
          location: data.location,
          minutesOfMeeting: data.notes
        });
      }

      // Reset status to scheduled if it was rejected
      if (meetingLog.status === 'rejected') {
        meetingLog.status = 'scheduled';
        meetingLog.reviewedBy = undefined;
        meetingLog.reviewedAt = undefined;
      }

      await meetingLog.save();

      logger.info(`Meeting log ${logId} updated by user ${userId}`);

      // Return populated meeting log
      return await MeetingLog.findById(meetingLog._id)
        .populate('groupId', 'code type memberIds status')
        .populate('projectId', 'title type department')
        .populate('facultyId', 'name email')
        .populate('createdBy', 'name email')
        .populate('attendees.studentId', 'name email')
        .populate('reviewedBy', 'name email') as IMeetingLog;

    } catch (error) {
      logger.error('Error updating meeting log:', error);
      throw error;
    }
  }

  /**
   * Get meeting logs for a group
   */
  static async getMeetingLogs(groupId: mongoose.Types.ObjectId): Promise<IMeetingLog[]> {
    try {
      const meetingLogs = await MeetingLog.find({ groupId })
        .populate('groupId', 'code type memberIds status')
        .populate('projectId', 'title type department')
        .populate('facultyId', 'name email')
        .populate('createdBy', 'name email')
        .populate('attendees.studentId', 'name email')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 });

      return meetingLogs;
    } catch (error) {
      logger.error('Error getting meeting logs:', error);
      throw error;
    }
  }

  /**
   * Get meeting logs for faculty review
   */
  static async getFacultyMeetingLogs(
    facultyId: mongoose.Types.ObjectId,
    status?: 'scheduled' | 'completed' | 'approved' | 'rejected'
  ): Promise<IMeetingLog[]> {
    try {
      const query: any = { facultyId };
      if (status) {
        query.status = status;
      }

      const meetingLogs = await MeetingLog.find(query)
        .populate('groupId', 'code type memberIds status')
        .populate('projectId', 'title type department')
        .populate('facultyId', 'name email')
        .populate('createdBy', 'name email')
        .populate('attendees.studentId', 'name email')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 });

      return meetingLogs;
    } catch (error) {
      logger.error('Error getting faculty meeting logs:', error);
      throw error;
    }
  }

  /**
   * Approve a meeting log
   */
  static async approveMeetingLog(
    logId: mongoose.Types.ObjectId,
    facultyId: mongoose.Types.ObjectId
  ): Promise<IMeetingLog> {
    try {
      const meetingLog = await MeetingLog.findById(logId).populate('groupId');
      if (!meetingLog) {
        throw new Error('Meeting log not found');
      }

      if (meetingLog.status !== 'completed') {
        throw new Error('Meeting log is not in completed state');
      }

      // Verify faculty has permission to approve this meeting log
      if (!meetingLog.facultyId.equals(facultyId)) {
        throw new Error('Faculty can only approve meeting logs for their own projects');
      }

      // Update meeting log
      meetingLog.status = 'approved';
      meetingLog.reviewedBy = facultyId;
      meetingLog.reviewedAt = new Date();
      await meetingLog.save();

      logger.info(`Meeting log ${logId} approved by faculty ${facultyId}`);

      // Send notification to group members
      try {
        const { notifyMeetingLogApprovedPersistent } = await import('./notificationService');
        const group = meetingLog.groupId as unknown as IGroup;
        const memberIds = group.memberIds ? group.memberIds.map(id => id.toString()) : [];
        
        await notifyMeetingLogApprovedPersistent(
          meetingLog._id.toString(),
          memberIds,
          group.code || 'Unknown',
          facultyId.toString()
        );
      } catch (notificationError) {
        logger.error('Failed to send meeting log approval notification:', notificationError);
        // Don't fail the approval if notifications fail
      }

      // Return populated meeting log
      return await MeetingLog.findById(meetingLog._id)
        .populate('groupId', 'code type memberIds status')
        .populate('projectId', 'title type department')
        .populate('facultyId', 'name email')
        .populate('createdBy', 'name email')
        .populate('attendees.studentId', 'name email')
        .populate('reviewedBy', 'name email') as IMeetingLog;

    } catch (error) {
      logger.error('Error approving meeting log:', error);
      throw error;
    }
  }

  /**
   * Reject a meeting log
   */
  static async rejectMeetingLog(
    logId: mongoose.Types.ObjectId,
    facultyId: mongoose.Types.ObjectId,
    reason?: string
  ): Promise<IMeetingLog> {
    try {
      const meetingLog = await MeetingLog.findById(logId).populate('groupId');
      if (!meetingLog) {
        throw new Error('Meeting log not found');
      }

      if (meetingLog.status !== 'completed') {
        throw new Error('Meeting log is not in completed state');
      }

      // Verify faculty has permission to reject this meeting log
      if (!meetingLog.facultyId.equals(facultyId)) {
        throw new Error('Faculty can only reject meeting logs for their own projects');
      }

      // Update meeting log
      meetingLog.status = 'rejected';
      meetingLog.reviewedBy = facultyId;
      meetingLog.reviewedAt = new Date();
      if (reason) {
        const currentNotes = (meetingLog as any).minutesOfMeeting || (meetingLog as any).notes || '';
        meetingLog.minutesOfMeeting = currentNotes + `\n\nRejection reason: ${reason}`;
      }
      await meetingLog.save();

      logger.info(`Meeting log ${logId} rejected by faculty ${facultyId}`);

      // Send notification to group members
      try {
        const { notifyMeetingLogRejectedPersistent } = await import('./notificationService');
        const group = meetingLog.groupId as unknown as IGroup;
        const memberIds = group.memberIds ? group.memberIds.map(id => id.toString()) : [];
        
        await notifyMeetingLogRejectedPersistent(
          meetingLog._id.toString(),
          memberIds,
          group.code || 'Unknown',
          reason,
          facultyId.toString()
        );
      } catch (notificationError) {
        logger.error('Failed to send meeting log rejection notification:', notificationError);
        // Don't fail the rejection if notifications fail
      }

      // Return populated meeting log
      return await MeetingLog.findById(meetingLog._id)
        .populate('groupId', 'code type memberIds status')
        .populate('projectId', 'title type department')
        .populate('facultyId', 'name email')
        .populate('createdBy', 'name email')
        .populate('attendees.studentId', 'name email')
        .populate('reviewedBy', 'name email') as IMeetingLog;

    } catch (error) {
      logger.error('Error rejecting meeting log:', error);
      throw error;
    }
  }

  /**
   * Validate if a user can access a meeting log
   */
  static async validateMeetingLogAccess(
    logId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    userRole: string
  ): Promise<{ canAccess: boolean; reason?: string; meetingLog?: IMeetingLog }> {
    try {
      const meetingLog = await MeetingLog.findById(logId)
        .populate('groupId', 'code type memberIds status')
        .populate('facultyId', '_id');

      if (!meetingLog) {
        return { canAccess: false, reason: 'Meeting log not found' };
      }

      const group = meetingLog.groupId as unknown as IGroup;

      // Coordinators and admins can access any meeting log
      if (userRole === 'coordinator' || userRole === 'admin') {
        return { canAccess: true, meetingLog };
      }

      // Faculty can access meeting logs for their projects
      if (userRole === 'faculty' && meetingLog.facultyId._id.equals(userId)) {
        return { canAccess: true, meetingLog };
      }

      // Students can access meeting logs for their groups
      if (userRole.endsWith('-student') && group.memberIds && group.memberIds.some(id => id.equals(userId))) {
        return { canAccess: true, meetingLog };
      }

      return { canAccess: false, reason: 'Insufficient permissions', meetingLog };

    } catch (error) {
      logger.error('Error validating meeting log access:', error);
      throw error;
    }
  }

  /**
   * Check if a meeting log can be edited
   */
  static async canEditMeetingLog(logId: mongoose.Types.ObjectId): Promise<boolean> {
    try {
      const meetingLog = await MeetingLog.findById(logId);
      if (!meetingLog) {
        return false;
      }

      // Can only edit if status is scheduled or rejected
      return meetingLog.status === 'scheduled' || meetingLog.status === 'rejected';
    } catch (error) {
      logger.error('Error checking meeting log edit permission:', error);
      return false;
    }
  }

  /**
   * Get meeting log by ID
   */
  static async getMeetingLogById(logId: mongoose.Types.ObjectId): Promise<IMeetingLog | null> {
    try {
      const meetingLog = await MeetingLog.findById(logId)
        .populate('groupId', 'code type memberIds status')
        .populate('projectId', 'title type department')
        .populate('facultyId', 'name email')
        .populate('createdBy', 'name email')
        .populate('attendees.studentId', 'name email')
        .populate('reviewedBy', 'name email');

      return meetingLog;
    } catch (error) {
      logger.error('Error getting meeting log by ID:', error);
      throw error;
    }
  }

  /**
   * Get user's meeting logs (through their groups)
   */
  static async getUserMeetingLogs(userId: mongoose.Types.ObjectId): Promise<IMeetingLog[]> {
    try {
      // Find all groups the user belongs to
      const userGroups = await Group.find({ memberIds: userId }).select('_id');
      const groupIds = userGroups.map(g => g._id);

      // Find meeting logs for these groups
      const meetingLogs = await MeetingLog.find({ groupId: { $in: groupIds } })
        .populate('groupId', 'code type memberIds status')
        .populate('projectId', 'title type department')
        .populate('facultyId', 'name email')
        .populate('createdBy', 'name email')
        .populate('attendees.studentId', 'name email')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 });

      return meetingLogs;
    } catch (error) {
      logger.error('Error getting user meeting logs:', error);
      throw error;
    }
  }
}

export default MeetingLogService;