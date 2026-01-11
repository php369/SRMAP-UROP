import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { verifyAccessToken } from './jwtService';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { getRedisClient, initializeRedis } from '../config/redis';

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
  joinedAt: string;
  lastSeen: string;
  currentRoom?: string;
}

// Redis keys
const PRESENCE_KEY_PREFIX = 'user:presence:';
const ROOM_KEY_PREFIX = 'room:members:';

export function setupSocketIO(io: Server): void {
  // Initialize Redis Adapter
  const { pubClient, subClient } = initializeRedis();
  io.adapter(createAdapter(pubClient, subClient));

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

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

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const userName = socket.userName!;
    const userRole = socket.userRole!;

    logger.info(`User connected: ${socket.id} (${userName})`);

    // Join personal room
    await socket.join(`user-${userId}`);

    // Add presence to Redis
    await addUserPresence(userId, userName, userRole, socket.id);

    // Broadcast online status
    socket.broadcast.emit('user-online', {
      userId,
      userName,
      userRole,
      timestamp: new Date().toISOString()
    });

    // Send initial online users list (expensive, maybe limit this)
    const onlineUsers = await getOnlineUsers();
    socket.emit('online-users', onlineUsers);

    // Handle joining rooms
    socket.on('join-room', async (roomId: string) => {
      if (!roomId) return;
      await socket.join(roomId);
      await addUserToRoom(userId, roomId);

      socket.to(roomId).emit('user-joined-room', {
        userId,
        userName,
        roomId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle leaving rooms
    socket.on('leave-room', async (roomId: string) => {
      if (!roomId) return;
      await socket.leave(roomId);
      await removeUserFromRoom(userId, roomId);

      socket.to(roomId).emit('user-left-room', {
        userId,
        userName,
        roomId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      await removeUserPresence(userId, socket.id);
      socket.broadcast.emit('user-offline', {
        userId,
        userName,
        timestamp: new Date().toISOString()
      });
      logger.info(`User disconnected: ${userId}`);
    });
  });

  logger.info('✅ Socket.IO Redis Adapter configured');
}

// Presence Helpers using Redis

async function addUserPresence(userId: string, userName: string, userRole: string, socketId: string) {
  const redis = getRedisClient();
  if (!redis) return;

  const presence: UserPresence = {
    userId,
    userName,
    userRole,
    socketId,
    joinedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString()
  };

  await redis.set(`${PRESENCE_KEY_PREFIX}${userId}`, JSON.stringify(presence), 'EX', 86400); // 24h expiry
}

async function removeUserPresence(userId: string, socketId: string) {
  const redis = getRedisClient();
  if (!redis) return;
  // In a robust app, we might handle multi-device (multiple sockets per user) logic here
  await redis.del(`${PRESENCE_KEY_PREFIX}${userId}`);
}

async function addUserToRoom(userId: string, roomId: string) {
  const redis = getRedisClient();
  if (!redis) return;
  await redis.sadd(`${ROOM_KEY_PREFIX}${roomId}`, userId);
}

async function removeUserFromRoom(userId: string, roomId: string) {
  const redis = getRedisClient();
  if (!redis) return;
  await redis.srem(`${ROOM_KEY_PREFIX}${roomId}`, userId);
}

// Public API

export async function getOnlineUsers(): Promise<UserPresence[]> {
  const redis = getRedisClient();
  if (!redis) return [];

  const keys = await redis.keys(`${PRESENCE_KEY_PREFIX}*`);
  if (keys.length === 0) return [];

  const users = await redis.mget(keys);
  return users.map(u => u ? JSON.parse(u) : null).filter(Boolean);
}

export async function isUserOnline(userId: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;
  const exists = await redis.exists(`${PRESENCE_KEY_PREFIX}${userId}`);
  return exists === 1;
}

export async function getUserCurrentRoom(userId: string): Promise<string | undefined> {
  const redis = getRedisClient();
  if (!redis) return undefined;
  // Note: Since Redis sets don't store "current room" state on the user key easily without extra complexity,
  // we might need to query room members or store it on the user presence.
  // For now, returning undefined as this was legacy logic.
  return undefined;
}

export async function getOnlineUsersInRoom(roomId: string): Promise<UserPresence[]> {
  const redis = getRedisClient();
  if (!redis) return [];

  const userIds = await redis.smembers(`${ROOM_KEY_PREFIX}${roomId}`);
  if (userIds.length === 0) return [];

  // Fetch presence for each user
  const keys = userIds.map(id => `${PRESENCE_KEY_PREFIX}${id}`);
  if (keys.length === 0) return [];

  const users = await redis.mget(keys);
  return users.map(u => u ? JSON.parse(u) : null).filter(Boolean);
}

export async function getPresenceStats(): Promise<{ totalOnline: number; activeRooms: number }> {
  const redis = getRedisClient();
  if (!redis) return { totalOnline: 0, activeRooms: 0 };

  // Note: KEYS command is expensive in production. SCAN should be used in real large scale apps.
  // For this size, it's acceptable.
  const userKeys = await redis.keys(`${PRESENCE_KEY_PREFIX}*`);
  const roomKeys = await redis.keys(`${ROOM_KEY_PREFIX}*`);

  return {
    totalOnline: userKeys.length,
    activeRooms: roomKeys.length
  };
}
