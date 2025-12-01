import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from './jwtService';
import { User } from '../models/User';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userName?: string;
  userEmail?: string;
}

interface UserPresence {
  userId: string;
  userName: string;
  userRole: string;
  socketId: string;
  joinedAt: Date;
  lastSeen: Date;
  currentRoom?: string;
}

// Store active user presence
const activeUsers = new Map<string, UserPresence>();
const userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

export function setupSocketIO(io: Server): void {
  // Authentication middleware for Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        logger.warn(`Socket connection rejected: No token provided for ${socket.id}`);
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const payload = verifyAccessToken(token);
      
      // Get user details from database
      const user = await User.findById(payload.userId);
      if (!user) {
        logger.warn(`Socket connection rejected: User not found for ${socket.id}`);
        return next(new Error('User not found'));
      }

      // Attach user info to socket
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userName = user.name;
      socket.userEmail = user.email;

      logger.info(`Socket authenticated: ${socket.id} for user ${user.email}`);
      next();

    } catch (error) {
      logger.error(`Socket authentication failed for ${socket.id}:`, error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const userName = socket.userName!;
    const userRole = socket.userRole!;

    logger.info(`User connected: ${socket.id} (${userName})`);

    // Add user to presence tracking
    addUserPresence(userId, userName, userRole, socket.id);

    // Join user to their personal room for direct notifications
    socket.join(`user-${userId}`);

    // Emit user online status to all connected clients
    socket.broadcast.emit('user-online', {
      userId,
      userName,
      userRole,
      timestamp: new Date().toISOString()
    });

    // Send current online users to the newly connected user
    socket.emit('online-users', Array.from(activeUsers.values()).map(user => ({
      userId: user.userId,
      userName: user.userName,
      userRole: user.userRole,
      joinedAt: user.joinedAt,
      currentRoom: user.currentRoom
    })));

    // Handle user joining a room (assessment, project, etc.)
    socket.on('join-room', (roomId: string) => {
      if (!roomId || typeof roomId !== 'string') {
        socket.emit('error', { message: 'Invalid room ID' });
        return;
      }

      socket.join(roomId);
      updateUserRoom(userId, roomId);

      // Notify others in the room
      socket.to(roomId).emit('user-joined-room', {
        userId,
        userName,
        userRole,
        roomId,
        timestamp: new Date().toISOString()
      });

      // Send current room members to the user
      const roomMembers = getRoomMembers(roomId);
      socket.emit('room-members', { roomId, members: roomMembers });

      logger.info(`User ${userName} joined room: ${roomId}`);
    });

    // Handle user leaving a room
    socket.on('leave-room', (roomId: string) => {
      if (!roomId || typeof roomId !== 'string') {
        socket.emit('error', { message: 'Invalid room ID' });
        return;
      }

      socket.leave(roomId);
      updateUserRoom(userId, undefined);

      socket.to(roomId).emit('user-left-room', {
        userId,
        userName,
        userRole,
        roomId,
        timestamp: new Date().toISOString()
      });

      logger.info(`User ${userName} left room: ${roomId}`);
    });

    // Handle presence updates
    socket.on('presence-update', (data: { status: 'online' | 'away' | 'busy' }) => {
      if (!data.status || !['online', 'away', 'busy'].includes(data.status)) {
        socket.emit('error', { message: 'Invalid presence status' });
        return;
      }

      updateUserPresence(userId);
      
      socket.broadcast.emit('user-presence-changed', {
        userId,
        userName,
        status: data.status,
        timestamp: new Date().toISOString()
      });
    });

    // Handle typing indicators for comments/chat
    socket.on('typing-start', (roomId: string) => {
      if (!roomId || typeof roomId !== 'string') return;

      socket.to(roomId).emit('user-typing', {
        userId,
        userName,
        roomId,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('typing-stop', (roomId: string) => {
      if (!roomId || typeof roomId !== 'string') return;

      socket.to(roomId).emit('user-stopped-typing', {
        userId,
        userName,
        roomId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle real-time submission notifications
    socket.on('submission-created', (data: { assessmentId: string, submissionId: string }) => {
      if (!data.assessmentId || !data.submissionId) {
        socket.emit('error', { message: 'Invalid submission data' });
        return;
      }

      // Notify faculty in the assessment room
      socket.to(`assessment-${data.assessmentId}`).emit('new-submission', {
        submissionId: data.submissionId,
        studentId: userId,
        studentName: userName,
        assessmentId: data.assessmentId,
        timestamp: new Date().toISOString()
      });

      logger.info(`Submission notification sent for assessment ${data.assessmentId}`);
    });

    // Handle real-time grading notifications
    socket.on('grade-updated', (data: { submissionId: string, studentId: string, score?: number }) => {
      if (!data.submissionId || !data.studentId) {
        socket.emit('error', { message: 'Invalid grade data' });
        return;
      }

      // Notify the specific student
      socket.to(`user-${data.studentId}`).emit('grade-received', {
        submissionId: data.submissionId,
        score: data.score,
        gradedBy: userName,
        timestamp: new Date().toISOString()
      });

      logger.info(`Grade notification sent to student ${data.studentId}`);
    });

    // Handle assessment updates
    socket.on('assessment-updated', (data: { assessmentId: string, changes: string[] }) => {
      if (!data.assessmentId || !Array.isArray(data.changes)) {
        socket.emit('error', { message: 'Invalid assessment update data' });
        return;
      }

      // Notify all users in the assessment room
      socket.to(`assessment-${data.assessmentId}`).emit('assessment-changed', {
        assessmentId: data.assessmentId,
        changes: data.changes,
        updatedBy: userName,
        timestamp: new Date().toISOString()
      });
    });

    // Handle heartbeat for presence tracking
    socket.on('heartbeat', () => {
      updateUserPresence(userId);
      socket.emit('heartbeat-ack', { timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${socket.id} (${userName}), reason: ${reason}`);
      
      // Remove user from presence tracking
      removeUserPresence(userId, socket.id);

      // Notify all rooms that this user has disconnected
      socket.broadcast.emit('user-offline', {
        userId,
        userName,
        userRole,
        reason,
        timestamp: new Date().toISOString()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id} (${userName}):`, error);
    });
  });

  logger.info('✅ Socket.IO server configured successfully');
}

// Helper function to emit to specific user
export function emitToUser(io: Server, userId: string, event: string, data: any): void {
  io.to(`user-${userId}`).emit(event, data);
}

// Helper function to emit to specific room
export function emitToRoom(io: Server, roomId: string, event: string, data: any): void {
  io.to(roomId).emit(event, data);
}

// Legacy function - replaced by getOnlineUsersInRoom below

// Presence tracking helper functions
function addUserPresence(userId: string, userName: string, userRole: string, socketId: string): void {
  const now = new Date();
  
  // Add socket to user's socket set
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(socketId);

  // Update or create user presence
  activeUsers.set(userId, {
    userId,
    userName,
    userRole,
    socketId,
    joinedAt: activeUsers.get(userId)?.joinedAt || now,
    lastSeen: now,
    currentRoom: activeUsers.get(userId)?.currentRoom,
  });

  logger.debug(`User presence added: ${userName} (${socketId})`);
}

function removeUserPresence(userId: string, socketId: string): void {
  const userSocketSet = userSockets.get(userId);
  if (userSocketSet) {
    userSocketSet.delete(socketId);
    
    // If user has no more active sockets, remove from active users
    if (userSocketSet.size === 0) {
      userSockets.delete(userId);
      activeUsers.delete(userId);
      logger.debug(`User presence removed: ${userId}`);
    } else {
      // Update socket ID to one of the remaining sockets
      const remainingSocketId = Array.from(userSocketSet)[0];
      const presence = activeUsers.get(userId);
      if (presence) {
        presence.socketId = remainingSocketId;
        presence.lastSeen = new Date();
        activeUsers.set(userId, presence);
      }
    }
  }
}

function updateUserPresence(userId: string): void {
  const presence = activeUsers.get(userId);
  if (presence) {
    presence.lastSeen = new Date();
    activeUsers.set(userId, presence);
  }
}

function updateUserRoom(userId: string, roomId?: string): void {
  const presence = activeUsers.get(userId);
  if (presence) {
    presence.currentRoom = roomId;
    presence.lastSeen = new Date();
    activeUsers.set(userId, presence);
  }
}

function getRoomMembers(roomId: string): UserPresence[] {
  return Array.from(activeUsers.values()).filter(user => user.currentRoom === roomId);
}

/**
 * Get all online users
 * @returns Array of online user presence data
 */
export function getOnlineUsers(): UserPresence[] {
  return Array.from(activeUsers.values());
}

/**
 * Get online users in a specific room
 * @param roomId - Room identifier
 * @returns Array of users in the room
 */
export function getOnlineUsersInRoom(roomId: string): UserPresence[] {
  return getRoomMembers(roomId);
}

/**
 * Check if a user is online
 * @param userId - User identifier
 * @returns true if user is online
 */
export function isUserOnline(userId: string): boolean {
  return activeUsers.has(userId);
}

/**
 * Get user's current room
 * @param userId - User identifier
 * @returns Room ID if user is in a room, undefined otherwise
 */
export function getUserCurrentRoom(userId: string): string | undefined {
  return activeUsers.get(userId)?.currentRoom;
}

/**
 * Clean up inactive users (called periodically)
 * @param maxInactiveMinutes - Maximum minutes of inactivity before cleanup
 */
export function cleanupInactiveUsers(maxInactiveMinutes: number = 30): void {
  const cutoffTime = new Date(Date.now() - maxInactiveMinutes * 60 * 1000);
  const inactiveUsers: string[] = [];

  for (const [userId, presence] of activeUsers.entries()) {
    if (presence.lastSeen < cutoffTime) {
      inactiveUsers.push(userId);
    }
  }

  for (const userId of inactiveUsers) {
    activeUsers.delete(userId);
    userSockets.delete(userId);
    logger.debug(`Cleaned up inactive user: ${userId}`);
  }

  if (inactiveUsers.length > 0) {
    logger.info(`Cleaned up ${inactiveUsers.length} inactive users`);
  }
}

/**
 * Get presence statistics
 * @returns Presence statistics
 */
export function getPresenceStats(): {
  totalOnline: number;
  byRole: { [role: string]: number };
  byRoom: { [room: string]: number };
} {
  const stats = {
    totalOnline: activeUsers.size,
    byRole: {} as { [role: string]: number },
    byRoom: {} as { [room: string]: number },
  };

  for (const presence of activeUsers.values()) {
    // Count by role
    stats.byRole[presence.userRole] = (stats.byRole[presence.userRole] || 0) + 1;
    
    // Count by room
    if (presence.currentRoom) {
      stats.byRoom[presence.currentRoom] = (stats.byRoom[presence.currentRoom] || 0) + 1;
    }
  }

  return stats;
}

// Set up periodic cleanup of inactive users
setInterval(() => {
  cleanupInactiveUsers(30); // Clean up users inactive for 30+ minutes
}, 5 * 60 * 1000); // Run every 5 minutes