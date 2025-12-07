import { Server } from 'socket.io';
import { logger } from '../utils/logger';
import { Notification, INotification } from '../models/Notification';
import { User } from '../models/User';
import mongoose from 'mongoose';

let io: Server | null = null;

/**
 * Initialize notification service with Socket.IO server
 * @param socketServer - Socket.IO server instance
 */
export function initializeNotificationService(socketServer: Server): void {
  io = socketServer;
  logger.info('Notification service initialized');
}

/**
 * Send notification to a specific user
 * @param userId - Target user ID
 * @param notification - Notification data
 */
export function notifyUser(userId: string, notification: {
  type: 'submission' | 'grade' | 'assessment' | 'system' | 'application';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high';
}): void {
  if (!io) {
    logger.warn('Notification service not initialized');
    return;
  }

  const notificationData = {
    id: generateNotificationId(),
    ...notification,
    timestamp: new Date().toISOString(),
    priority: notification.priority || 'normal',
  };

  io.to(`user-${userId}`).emit('notification', notificationData);
  
  logger.debug(`Notification sent to user ${userId}: ${notification.title}`);
}

/**
 * Send notification to all users in a room
 * @param roomId - Target room ID
 * @param notification - Notification data
 * @param excludeUserId - Optional user ID to exclude from notification
 */
export function notifyRoom(roomId: string, notification: {
  type: 'submission' | 'grade' | 'assessment' | 'system' | 'application';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high';
}, excludeUserId?: string): void {
  if (!io) {
    logger.warn('Notification service not initialized');
    return;
  }

  const notificationData = {
    id: generateNotificationId(),
    ...notification,
    timestamp: new Date().toISOString(),
    priority: notification.priority || 'normal',
  };

  const roomSocket = io.to(roomId);
  if (excludeUserId) {
    roomSocket.except(`user-${excludeUserId}`);
  }
  
  roomSocket.emit('notification', notificationData);
  
  logger.debug(`Notification sent to room ${roomId}: ${notification.title}`);
}

/**
 * Send broadcast notification to all connected users
 * @param notification - Notification data
 * @param roleFilter - Optional role filter
 */
export function notifyAll(notification: {
  type: 'submission' | 'grade' | 'assessment' | 'system' | 'application';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high';
}, roleFilter?: 'student' | 'faculty' | 'admin'): void {
  if (!io) {
    logger.warn('Notification service not initialized');
    return;
  }

  const notificationData = {
    id: generateNotificationId(),
    ...notification,
    timestamp: new Date().toISOString(),
    priority: notification.priority || 'normal',
    roleFilter,
  };

  io.emit('notification', notificationData);
  
  logger.debug(`Broadcast notification sent: ${notification.title}`);
}

/**
 * Notify about new submission
 * @param assessmentId - Assessment ID
 * @param submissionId - Submission ID
 * @param studentName - Student name
 * @param facultyId - Faculty ID to notify
 */
export function notifyNewSubmission(
  assessmentId: string,
  submissionId: string,
  studentName: string,
  facultyId: string
): void {
  notifyUser(facultyId, {
    type: 'submission',
    title: 'New Submission Received',
    message: `${studentName} has submitted work for your assessment`,
    data: {
      assessmentId,
      submissionId,
      studentName,
    },
    priority: 'normal',
  });

  // Also notify users in the assessment room
  notifyRoom(`assessment-${assessmentId}`, {
    type: 'submission',
    title: 'New Submission',
    message: `${studentName} submitted work`,
    data: {
      assessmentId,
      submissionId,
      studentName,
    },
    priority: 'low',
  });
}

/**
 * Notify about grade received
 * @param submissionId - Submission ID
 * @param studentId - Student ID to notify
 * @param facultyName - Faculty name who graded
 * @param score - Grade score (optional)
 */
export function notifyGradeReceived(
  submissionId: string,
  studentId: string,
  facultyName: string,
  score?: number
): void {
  const scoreText = score !== undefined ? ` (Score: ${score})` : '';
  
  notifyUser(studentId, {
    type: 'grade',
    title: 'Grade Received',
    message: `Your submission has been graded by ${facultyName}${scoreText}`,
    data: {
      submissionId,
      facultyName,
      score,
    },
    priority: 'high',
  });
}

/**
 * Notify about assessment updates
 * @param assessmentId - Assessment ID
 * @param title - Assessment title
 * @param changes - List of changes made
 * @param facultyName - Faculty who made changes
 * @param cohortIds - Cohort IDs to notify
 */
export function notifyAssessmentUpdate(
  assessmentId: string,
  title: string,
  changes: string[],
  facultyName: string,
  _cohortIds: string[]
): void {
  const changeText = changes.length > 1 
    ? `${changes.length} changes made`
    : changes[0] || 'Assessment updated';

  // Notify assessment room
  notifyRoom(`assessment-${assessmentId}`, {
    type: 'assessment',
    title: 'Assessment Updated',
    message: `${title}: ${changeText} by ${facultyName}`,
    data: {
      assessmentId,
      title,
      changes,
      facultyName,
    },
    priority: 'normal',
  });

  // Note: In a full implementation, we would also notify students in the cohorts
  // This would require additional logic to map cohorts to users
}

/**
 * Notify about new assessment
 * @param assessmentId - Assessment ID
 * @param title - Assessment title
 * @param dueDate - Due date
 * @param facultyName - Faculty who created it
 * @param cohortIds - Cohort IDs to notify
 */
export function notifyNewAssessment(
  assessmentId: string,
  title: string,
  dueDate: Date,
  facultyName: string,
  cohortIds: string[]
): void {
  const dueDateText = dueDate.toLocaleDateString();
  
  // For now, broadcast to all students (in a full implementation, filter by cohort)
  notifyAll({
    type: 'assessment',
    title: 'New Assessment Available',
    message: `${title} by ${facultyName} (Due: ${dueDateText})`,
    data: {
      assessmentId,
      title,
      dueDate: dueDate.toISOString(),
      facultyName,
      cohortIds,
    },
    priority: 'high',
  }, 'student');
}

/**
 * Send system maintenance notification
 * @param message - Maintenance message
 * @param scheduledTime - Scheduled maintenance time
 */
export function notifySystemMaintenance(message: string, scheduledTime?: Date): void {
  const timeText = scheduledTime ? ` scheduled for ${scheduledTime.toLocaleString()}` : '';
  
  notifyAll({
    type: 'system',
    title: 'System Maintenance',
    message: `${message}${timeText}`,
    data: {
      scheduledTime: scheduledTime?.toISOString(),
    },
    priority: 'high',
  });
}

/**
 * Generate unique notification ID
 * @returns Unique notification ID
 */
function generateNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Notify about application approval
 * @param groupMembers - Array of group member user IDs
 * @param groupCode - Group code
 * @param projectTitle - Project title
 * @param meetUrl - Google Meet URL (optional)
 * @param applicationId - Application ID
 */
export function notifyApplicationApproved(
  groupMembers: string[],
  groupCode: string,
  projectTitle: string,
  meetUrl?: string,
  applicationId?: string
): void {
  const meetText = meetUrl ? ' Your Google Meet link has been created.' : '';
  
  groupMembers.forEach(memberId => {
    notifyUser(memberId, {
      type: 'application',
      title: 'Application Approved! 🎉',
      message: `Your group ${groupCode} has been approved for project: ${projectTitle}.${meetText}`,
      data: {
        applicationId,
        groupCode,
        projectTitle,
        meetUrl,
        status: 'approved'
      },
      priority: 'high',
    });
  });
}

/**
 * Notify about application rejection
 * @param groupMembers - Array of group member user IDs
 * @param groupCode - Group code
 * @param reason - Rejection reason (optional)
 * @param applicationId - Application ID
 */
export function notifyApplicationRejected(
  groupMembers: string[],
  groupCode: string,
  reason?: string,
  applicationId?: string
): void {
  const reasonText = reason ? ` Reason: ${reason}` : '';
  
  groupMembers.forEach(memberId => {
    notifyUser(memberId, {
      type: 'application',
      title: 'Application Update',
      message: `Your group ${groupCode}'s application has been rejected.${reasonText}`,
      data: {
        applicationId,
        groupCode,
        reason,
        status: 'rejected'
      },
      priority: 'normal',
    });
  });
}

/**
 * Notify faculty about group assignment
 * @param facultyId - Faculty user ID
 * @param groupCode - Group code
 * @param projectTitle - Project title
 * @param meetUrl - Google Meet URL (optional)
 * @param applicationId - Application ID
 */
export function notifyFacultyGroupAssigned(
  facultyId: string,
  groupCode: string,
  projectTitle: string,
  meetUrl?: string,
  applicationId?: string
): void {
  const meetText = meetUrl ? ' A Google Meet link has been created for your meetings.' : '';
  
  notifyUser(facultyId, {
    type: 'application',
    title: 'Group Assigned to Your Project',
    message: `Group ${groupCode} has been assigned to your project: ${projectTitle}.${meetText}`,
    data: {
      applicationId,
      groupCode,
      projectTitle,
      meetUrl,
      status: 'assigned'
    },
    priority: 'normal',
  });
}

/**
 * Notify about new application submission
 * @param facultyId - Faculty user ID
 * @param groupCode - Group code
 * @param projectTitle - Project title
 * @param applicationId - Application ID
 */
export function notifyNewApplicationSubmitted(
  facultyId: string,
  groupCode: string,
  projectTitle: string,
  applicationId: string
): void {
  notifyUser(facultyId, {
    type: 'application',
    title: 'New Application Received',
    message: `Group ${groupCode} has applied for your project: ${projectTitle}`,
    data: {
      applicationId,
      groupCode,
      projectTitle,
      status: 'pending'
    },
    priority: 'normal',
  });
}

/**
 * Notify about external evaluator assignment
 * @param userIds - User IDs to notify (can be single string or array)
 * @param groupCode - Group code
 * @param projectTitle - Project title
 * @param meetUrl - Google Meet URL (optional)
 * @param evaluationId - Evaluation ID
 */
export function notifyExternalEvaluatorAssigned(
  userIds: string | string[],
  groupCode: string,
  projectTitle: string,
  meetUrl?: string,
  evaluationId?: string
): void {
  const meetText = meetUrl ? ' The Google Meet link has been updated to include you.' : '';
  const recipients = Array.isArray(userIds) ? userIds : [userIds];
  
  recipients.forEach(userId => {
    notifyUser(userId, {
      type: 'assessment',
      title: 'External Evaluator Assignment',
      message: `You have been assigned as external evaluator for group ${groupCode} (${projectTitle}).${meetText}`,
      data: {
        evaluationId,
        groupCode,
        projectTitle,
        meetUrl,
        role: 'external_evaluator'
      },
      priority: 'high',
    });
  });
}

/**
 * Notify about external evaluator removal
 * @param userIds - User IDs to notify (can be single string or array)
 * @param groupCode - Group code
 * @param projectTitle - Project title
 * @param evaluationId - Evaluation ID
 */
export function notifyExternalEvaluatorRemoved(
  userIds: string | string[],
  groupCode: string,
  projectTitle: string,
  evaluationId?: string
): void {
  const recipients = Array.isArray(userIds) ? userIds : [userIds];
  
  recipients.forEach(userId => {
    notifyUser(userId, {
      type: 'assessment',
      title: 'External Evaluator Assignment Removed',
      message: `External evaluator assignment has been removed for group ${groupCode} (${projectTitle}).`,
      data: {
        evaluationId,
        groupCode,
        projectTitle,
        role: 'external_evaluator_removed'
      },
      priority: 'normal',
    });
  });
}

/**
 * Notify about grades being published
 * @param userIds - User IDs to notify (can be single string or array)
 * @param groupCode - Group code
 * @param evaluationId - Evaluation ID
 */
export function notifyGradesPublished(
  userIds: string | string[],
  groupCode: string,
  evaluationId?: string
): void {
  const recipients = Array.isArray(userIds) ? userIds : [userIds];
  
  recipients.forEach(userId => {
    notifyUser(userId, {
      type: 'grade',
      title: 'Grades Published! 📊',
      message: `Your evaluation results for group ${groupCode} are now available.`,
      data: {
        evaluationId,
        groupCode,
        status: 'published'
      },
      priority: 'high',
    });
  });
}

/**
 * Get Socket.IO server instance (for advanced usage)
 * @returns Socket.IO server instance or null
 */
export function getSocketServer(): Server | null {
  return io;
}

// ============================================================================
// PERSISTENT NOTIFICATION SYSTEM
// ============================================================================

export interface CreateNotificationData {
  userId: string;
  role: 'idp-student' | 'urop-student' | 'capstone-student' | 'faculty' | 'coordinator' | 'admin';
  type: 'APPLICATION_SUBMITTED' | 'APPLICATION_APPROVED' | 'APPLICATION_REJECTED' | 
        'PROJECT_FROZEN' | 'MEETING_APPROVAL_REQUIRED' | 'MEETING_APPROVED' | 
        'MEETING_REJECTED' | 'GRADES_PUBLISHED' | 'GRADES_UNPUBLISHED' |
        'EXTERNAL_ASSIGNED' | 'GROUP_OVERRIDE' | 'SYSTEM' | 'SUBMISSION' | 'ASSESSMENT';
  title: string;
  message: string;
  data?: Record<string, any>;
  targetGroupId?: string;
  targetProjectId?: string;
  actorId?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  read?: boolean;
  type?: string;
}

export interface PaginatedNotifications {
  notifications: INotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Create a persistent notification and optionally broadcast it via Socket.IO
 * @param data - Notification data
 * @param broadcast - Whether to broadcast via Socket.IO (default: true)
 * @returns Created notification
 */
export async function createNotification(
  data: CreateNotificationData, 
  broadcast: boolean = true
): Promise<INotification> {
  try {
    // Create persistent notification
    const notification = new Notification({
      userId: new mongoose.Types.ObjectId(data.userId),
      role: data.role,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
      targetGroupId: data.targetGroupId ? new mongoose.Types.ObjectId(data.targetGroupId) : undefined,
      targetProjectId: data.targetProjectId ? new mongoose.Types.ObjectId(data.targetProjectId) : undefined,
      actorId: data.actorId ? new mongoose.Types.ObjectId(data.actorId) : undefined,
      read: false,
      createdAt: new Date()
    });

    const savedNotification = await notification.save();

    // Broadcast via Socket.IO if enabled
    if (broadcast && io) {
      const socketNotification = {
        id: savedNotification._id.toString(),
        type: mapNotificationTypeToSocket(data.type),
        title: data.title,
        message: data.message,
        data: data.data || {},
        timestamp: savedNotification.createdAt.toISOString(),
        priority: getNotificationPriority(data.type),
        notificationId: savedNotification._id.toString()
      };

      io.to(`user-${data.userId}`).emit('notification', socketNotification);
    }

    logger.debug(`Persistent notification created for user ${data.userId}: ${data.title}`);
    return savedNotification;

  } catch (error) {
    logger.error('Error creating persistent notification:', error);
    throw error;
  }
}

/**
 * Create notification and broadcast to multiple users
 * @param userIds - Array of user IDs
 * @param notificationData - Base notification data (without userId)
 * @param broadcast - Whether to broadcast via Socket.IO
 * @returns Array of created notifications
 */
export async function createNotificationForUsers(
  userIds: string[],
  notificationData: Omit<CreateNotificationData, 'userId'>,
  broadcast: boolean = true
): Promise<INotification[]> {
  const notifications = await Promise.all(
    userIds.map(userId => 
      createNotification({ ...notificationData, userId }, broadcast)
    )
  );

  return notifications;
}

/**
 * Get paginated notifications for a user
 * @param userId - User ID
 * @param options - Pagination and filtering options
 * @returns Paginated notifications
 */
export async function getUserNotifications(
  userId: string, 
  options: PaginationOptions = {}
): Promise<PaginatedNotifications> {
  try {
    return await (Notification as any).getPaginated(userId, options);
  } catch (error) {
    logger.error('Error fetching user notifications:', error);
    throw error;
  }
}

/**
 * Mark a notification as read
 * @param notificationId - Notification ID
 * @param userId - User ID (for security)
 * @returns Updated notification
 */
export async function markNotificationAsRead(
  notificationId: string, 
  userId: string
): Promise<INotification | null> {
  try {
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(notificationId),
        userId: new mongoose.Types.ObjectId(userId)
      },
      { read: true },
      { new: true }
    );

    if (notification) {
      logger.debug(`Notification ${notificationId} marked as read for user ${userId}`);
    }

    return notification;
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 * @param userId - User ID
 * @returns Number of notifications updated
 */
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  try {
    const result = await (Notification as any).markAllAsRead(userId);
    logger.debug(`${result.modifiedCount} notifications marked as read for user ${userId}`);
    return result.modifiedCount;
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Get unread notification count for a user
 * @param userId - User ID
 * @returns Unread count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    return await (Notification as any).getUnreadCount(userId);
  } catch (error) {
    logger.error('Error getting unread notification count:', error);
    throw error;
  }
}

/**
 * Delete old notifications (cleanup)
 * @param olderThanDays - Delete notifications older than this many days
 * @returns Number of deleted notifications
 */
export async function cleanupOldNotifications(olderThanDays: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    logger.info(`Cleaned up ${result.deletedCount} old notifications (older than ${olderThanDays} days)`);
    return result.deletedCount;
  } catch (error) {
    logger.error('Error cleaning up old notifications:', error);
    throw error;
  }
}

// ============================================================================
// ENHANCED NOTIFICATION CREATORS WITH PERSISTENCE
// ============================================================================

/**
 * Notify about application submission (with persistence)
 * @param applicationId - Application ID
 * @param groupCode - Group code
 * @param projectTitle - Project title
 * @param facultyId - Faculty ID to notify
 * @param studentIds - Student IDs in the group
 */
export async function notifyApplicationSubmittedPersistent(
  applicationId: string,
  groupCode: string,
  projectTitle: string,
  facultyId: string,
  studentIds: string[]
): Promise<void> {
  // Get faculty user to determine role
  const facultyUser = await User.findById(facultyId);
  if (!facultyUser) return;

  // Notify faculty
  await createNotification({
    userId: facultyId,
    role: facultyUser.role as any,
    type: 'APPLICATION_SUBMITTED',
    title: 'New Application Received',
    message: `Group ${groupCode} has applied for your project: ${projectTitle}`,
    data: {
      applicationId,
      groupCode,
      projectTitle,
      status: 'pending'
    },
    targetProjectId: undefined, // Could be added if project ID is available
    actorId: studentIds[0] // First student as actor
  });

  // Also send legacy Socket.IO notification
  notifyNewApplicationSubmitted(facultyId, groupCode, projectTitle, applicationId);
}

/**
 * Notify about application approval (with persistence)
 * @param applicationId - Application ID
 * @param groupMembers - Array of group member user IDs
 * @param groupCode - Group code
 * @param projectTitle - Project title
 * @param meetUrl - Google Meet URL (optional)
 * @param facultyId - Faculty who approved
 */
export async function notifyApplicationApprovedPersistent(
  applicationId: string,
  groupMembers: string[],
  groupCode: string,
  projectTitle: string,
  meetUrl?: string,
  facultyId?: string
): Promise<void> {
  const meetText = meetUrl ? ' Your Google Meet link has been created.' : '';

  // Get user roles for each member
  const users = await User.find({ _id: { $in: groupMembers } });
  
  for (const user of users) {
    await createNotification({
      userId: user._id.toString(),
      role: user.role as any,
      type: 'APPLICATION_APPROVED',
      title: 'Application Approved! 🎉',
      message: `Your group ${groupCode} has been approved for project: ${projectTitle}.${meetText}`,
      data: {
        applicationId,
        groupCode,
        projectTitle,
        meetUrl,
        status: 'approved'
      },
      actorId: facultyId
    });
  }

  // Also send legacy Socket.IO notification
  notifyApplicationApproved(groupMembers, groupCode, projectTitle, meetUrl, applicationId);
}

/**
 * Notify about application rejection (with persistence)
 * @param applicationId - Application ID
 * @param groupMembers - Array of group member user IDs
 * @param groupCode - Group code
 * @param reason - Rejection reason (optional)
 * @param facultyId - Faculty who rejected
 */
export async function notifyApplicationRejectedPersistent(
  applicationId: string,
  groupMembers: string[],
  groupCode: string,
  reason?: string,
  facultyId?: string
): Promise<void> {
  const reasonText = reason ? ` Reason: ${reason}` : '';

  // Get user roles for each member
  const users = await User.find({ _id: { $in: groupMembers } });
  
  for (const user of users) {
    await createNotification({
      userId: user._id.toString(),
      role: user.role as any,
      type: 'APPLICATION_REJECTED',
      title: 'Application Update',
      message: `Your group ${groupCode}'s application has been rejected.${reasonText}`,
      data: {
        applicationId,
        groupCode,
        reason,
        status: 'rejected'
      },
      actorId: facultyId
    });
  }

  // Also send legacy Socket.IO notification
  notifyApplicationRejected(groupMembers, groupCode, reason, applicationId);
}

/**
 * Notify about grades being published (with persistence)
 * @param userIds - User IDs to notify
 * @param groupCode - Group code
 * @param evaluationId - Evaluation ID
 * @param facultyId - Faculty who published grades
 */
export async function notifyGradesPublishedPersistent(
  userIds: string | string[],
  groupCode: string,
  evaluationId?: string,
  facultyId?: string
): Promise<void> {
  const recipients = Array.isArray(userIds) ? userIds : [userIds];
  
  // Get user roles for each recipient
  const users = await User.find({ _id: { $in: recipients } });
  
  for (const user of users) {
    await createNotification({
      userId: user._id.toString(),
      role: user.role as any,
      type: 'GRADES_PUBLISHED',
      title: 'Grades Published! 📊',
      message: `Your evaluation results for group ${groupCode} are now available.`,
      data: {
        evaluationId,
        groupCode,
        status: 'published'
      },
      actorId: facultyId
    });
  }

  // Also send legacy Socket.IO notification
  notifyGradesPublished(userIds, groupCode, evaluationId);
}

/**
 * Notify about external evaluator assignment (with persistence)
 * @param userIds - User IDs to notify
 * @param groupCode - Group code
 * @param projectTitle - Project title
 * @param meetUrl - Google Meet URL (optional)
 * @param evaluationId - Evaluation ID
 * @param assignedBy - Who assigned the external evaluator
 */
export async function notifyExternalEvaluatorAssignedPersistent(
  userIds: string | string[],
  groupCode: string,
  projectTitle: string,
  meetUrl?: string,
  evaluationId?: string,
  assignedBy?: string
): Promise<void> {
  const meetText = meetUrl ? ' The Google Meet link has been updated to include you.' : '';
  const recipients = Array.isArray(userIds) ? userIds : [userIds];
  
  // Get user roles for each recipient
  const users = await User.find({ _id: { $in: recipients } });
  
  for (const user of users) {
    await createNotification({
      userId: user._id.toString(),
      role: user.role as any,
      type: 'EXTERNAL_ASSIGNED',
      title: 'External Evaluator Assignment',
      message: `You have been assigned as external evaluator for group ${groupCode} (${projectTitle}).${meetText}`,
      data: {
        evaluationId,
        groupCode,
        projectTitle,
        meetUrl,
        role: 'external_evaluator'
      },
      actorId: assignedBy
    });
  }

  // Also send legacy Socket.IO notification
  notifyExternalEvaluatorAssigned(userIds, groupCode, projectTitle, meetUrl, evaluationId);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map notification type to Socket.IO type for backward compatibility
 */
function mapNotificationTypeToSocket(type: string): string {
  const mapping: { [key: string]: string } = {
    'APPLICATION_SUBMITTED': 'application',
    'APPLICATION_APPROVED': 'application',
    'APPLICATION_REJECTED': 'application',
    'PROJECT_FROZEN': 'system',
    'MEETING_APPROVAL_REQUIRED': 'system',
    'MEETING_APPROVED': 'system',
    'MEETING_REJECTED': 'system',
    'GRADES_PUBLISHED': 'grade',
    'GRADES_UNPUBLISHED': 'grade',
    'EXTERNAL_ASSIGNED': 'assessment',
    'GROUP_OVERRIDE': 'system',
    'SYSTEM': 'system',
    'SUBMISSION': 'submission',
    'ASSESSMENT': 'assessment'
  };
  
  return mapping[type] || 'system';
}

/**
 * Get notification priority based on type
 */
function getNotificationPriority(type: string): 'low' | 'normal' | 'high' {
  const highPriority = [
    'APPLICATION_APPROVED',
    'GRADES_PUBLISHED',
    'EXTERNAL_ASSIGNED'
  ];
  
  const lowPriority = [
    'SUBMISSION',
    'MEETING_APPROVAL_REQUIRED'
  ];
  
  if (highPriority.includes(type)) return 'high';
  if (lowPriority.includes(type)) return 'low';
  return 'normal';
}

/**
 * Notify faculty about meeting log submission (with persistence)
 * @param meetingLogId - Meeting log ID
 * @param groupCode - Group code
 * @param facultyId - Faculty ID to notify
 * @param submittedBy - Student who submitted the log
 */
export async function notifyMeetingLogSubmittedPersistent(
  meetingLogId: string,
  groupCode: string,
  facultyId: string,
  submittedBy: string
): Promise<void> {
  // Get faculty user to determine role
  const facultyUser = await User.findById(facultyId);
  if (!facultyUser) return;

  // Get student name for the message
  const student = await User.findById(submittedBy);
  const studentName = student ? student.name : 'A student';

  await createNotification({
    userId: facultyId,
    role: facultyUser.role as any,
    type: 'MEETING_APPROVAL_REQUIRED',
    title: 'Meeting Log Submitted for Review',
    message: `${studentName} from group ${groupCode} has submitted a meeting log for your review`,
    data: {
      meetingLogId,
      groupCode,
      submittedBy,
      status: 'submitted'
    },
    targetGroupId: undefined, // Could be added if group ID is available
    actorId: submittedBy
  });

  // Also send legacy Socket.IO notification
  notifyUser(facultyId, {
    type: 'assessment',
    title: 'Meeting Log Submitted for Review',
    message: `${studentName} from group ${groupCode} has submitted a meeting log for your review`,
    data: {
      meetingLogId,
      groupCode,
      submittedBy,
      status: 'submitted'
    },
    priority: 'normal'
  });
}

/**
 * Notify group members about meeting log approval (with persistence)
 * @param meetingLogId - Meeting log ID
 * @param groupMembers - Array of group member user IDs
 * @param groupCode - Group code
 * @param facultyId - Faculty who approved
 */
export async function notifyMeetingLogApprovedPersistent(
  meetingLogId: string,
  groupMembers: string[],
  groupCode: string,
  facultyId: string
): Promise<void> {
  // Get faculty name for the message
  const faculty = await User.findById(facultyId);
  const facultyName = faculty ? faculty.name : 'Faculty';

  // Get user roles for each member
  const users = await User.find({ _id: { $in: groupMembers } });
  
  for (const user of users) {
    await createNotification({
      userId: user._id.toString(),
      role: user.role as any,
      type: 'MEETING_APPROVED',
      title: 'Meeting Log Approved ✅',
      message: `Your meeting log for group ${groupCode} has been approved by ${facultyName}`,
      data: {
        meetingLogId,
        groupCode,
        facultyId,
        status: 'approved'
      },
      actorId: facultyId
    });
  }

  // Also send legacy Socket.IO notification
  groupMembers.forEach(memberId => {
    notifyUser(memberId, {
      type: 'assessment',
      title: 'Meeting Log Approved ✅',
      message: `Your meeting log for group ${groupCode} has been approved by ${facultyName}`,
      data: {
        meetingLogId,
        groupCode,
        facultyId,
        status: 'approved'
      },
      priority: 'normal'
    });
  });
}

/**
 * Notify group members about meeting log rejection (with persistence)
 * @param meetingLogId - Meeting log ID
 * @param groupMembers - Array of group member user IDs
 * @param groupCode - Group code
 * @param reason - Rejection reason (optional)
 * @param facultyId - Faculty who rejected
 */
export async function notifyMeetingLogRejectedPersistent(
  meetingLogId: string,
  groupMembers: string[],
  groupCode: string,
  reason?: string,
  facultyId?: string
): Promise<void> {
  // Get faculty name for the message
  const faculty = facultyId ? await User.findById(facultyId) : null;
  const facultyName = faculty ? faculty.name : 'Faculty';
  const reasonText = reason ? ` Reason: ${reason}` : '';

  // Get user roles for each member
  const users = await User.find({ _id: { $in: groupMembers } });
  
  for (const user of users) {
    await createNotification({
      userId: user._id.toString(),
      role: user.role as any,
      type: 'MEETING_REJECTED',
      title: 'Meeting Log Needs Revision',
      message: `Your meeting log for group ${groupCode} has been rejected by ${facultyName}.${reasonText}`,
      data: {
        meetingLogId,
        groupCode,
        reason,
        facultyId,
        status: 'rejected'
      },
      actorId: facultyId
    });
  }

  // Also send legacy Socket.IO notification
  groupMembers.forEach(memberId => {
    notifyUser(memberId, {
      type: 'assessment',
      title: 'Meeting Log Needs Revision',
      message: `Your meeting log for group ${groupCode} has been rejected by ${facultyName}.${reasonText}`,
      data: {
        meetingLogId,
        groupCode,
        reason,
        facultyId,
        status: 'rejected'
      },
      priority: 'normal'
    });
  });
}