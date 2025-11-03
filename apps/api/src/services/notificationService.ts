import { Server } from 'socket.io';
import { logger } from '../utils/logger';

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
  type: 'submission' | 'grade' | 'assessment' | 'system';
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
  type: 'submission' | 'grade' | 'assessment' | 'system';
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
  type: 'submission' | 'grade' | 'assessment' | 'system';
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
 * Get Socket.IO server instance (for advanced usage)
 * @returns Socket.IO server instance or null
 */
export function getSocketServer(): Server | null {
  return io;
}