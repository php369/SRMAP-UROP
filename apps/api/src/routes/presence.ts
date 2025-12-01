import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  getOnlineUsers, 
  getOnlineUsersInRoom, 
  isUserOnline, 
  getUserCurrentRoom,
  getPresenceStats
} from '../services/socketService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /presence/online
 * Get all currently online users
 */
router.get('/online', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const onlineUsers = getOnlineUsers();
    
    // Filter sensitive information based on user role
    const user = req.user!;
    const filteredUsers = onlineUsers.map(presence => ({
      userId: presence.userId,
      userName: presence.userName,
      userRole: presence.userRole,
      joinedAt: presence.joinedAt,
      currentRoom: user.role === 'admin' ? presence.currentRoom : undefined, // Only admins see room info
    }));

    res.json({
      success: true,
      data: {
        onlineUsers: filteredUsers,
        count: filteredUsers.length,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error('Failed to get online users:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'PRESENCE_FETCH_FAILED',
        message: 'Failed to retrieve online users',
      },
    });
  }
}));

/**
 * GET /presence/room/:roomId
 * Get users currently in a specific room
 */
router.get('/room/:roomId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { roomId } = req.params;

  if (!roomId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ROOM_ID',
        message: 'Room ID is required',
      },
    });
  }

  try {
    const roomUsers = getOnlineUsersInRoom(roomId);
    
    const filteredUsers = roomUsers.map(presence => ({
      userId: presence.userId,
      userName: presence.userName,
      userRole: presence.userRole,
      joinedAt: presence.joinedAt,
      lastSeen: presence.lastSeen,
    }));

    res.json({
      success: true,
      data: {
        roomId,
        users: filteredUsers,
        count: filteredUsers.length,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error(`Failed to get users in room ${roomId}:`, error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'ROOM_PRESENCE_FETCH_FAILED',
        message: 'Failed to retrieve room users',
      },
    });
  }
}));

/**
 * GET /presence/user/:userId
 * Check if a specific user is online and get their current room
 */
router.get('/user/:userId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentUser = req.user!;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_USER_ID',
        message: 'User ID is required',
      },
    });
  }

  // Users can only check their own presence unless they're admin
  if (currentUser.role !== 'admin' && userId !== currentUser.id) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You can only check your own presence status',
      },
    });
  }

  try {
    const isOnline = isUserOnline(userId);
    const currentRoom = getUserCurrentRoom(userId);

    res.json({
      success: true,
      data: {
        userId,
        isOnline,
        currentRoom: currentUser.role === 'admin' ? currentRoom : undefined,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error(`Failed to get presence for user ${userId}:`, error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'USER_PRESENCE_FETCH_FAILED',
        message: 'Failed to retrieve user presence',
      },
    });
  }
}));

/**
 * GET /presence/stats
 * Get presence statistics (admin only)
 */
router.get('/stats', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;

  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only administrators can view presence statistics',
      },
    });
  }

  try {
    const stats = getPresenceStats();

    res.json({
      success: true,
      data: {
        statistics: stats,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error('Failed to get presence statistics:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'PRESENCE_STATS_FAILED',
        message: 'Failed to retrieve presence statistics',
      },
    });
  }
}));

/**
 * GET /presence/me
 * Get current user's presence information
 */
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    const isOnline = isUserOnline(userId);
    const currentRoom = getUserCurrentRoom(userId);

    res.json({
      success: true,
      data: {
        userId,
        isOnline,
        currentRoom,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error(`Failed to get own presence for user ${userId}:`, error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'OWN_PRESENCE_FETCH_FAILED',
        message: 'Failed to retrieve your presence information',
      },
    });
  }
}));

export default router;