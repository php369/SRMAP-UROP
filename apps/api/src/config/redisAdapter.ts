import { createAdapter } from '@socket.io/redis-adapter';
import { Server } from 'socket.io';
import { redis } from './redis';
import { logger } from '../utils/logger';

// Create a SINGLE duplicate for subscription
// This ensures we have exactly 2 connections total:
// 1. 'redis' (Publisher + General Commands)
// 2. 'redisSub' (Subscriber for Socket.IO Adapter)
export const redisSub = redis.duplicate();

redisSub.on('error', (err) => {
    logger.warn('⚠️ Redis Subscriber connection issue:', err.message);
});

export function attachRedisAdapter(io: Server) {
    try {
        io.adapter(createAdapter(redis, redisSub));
        logger.info('✅ Socket.IO Redis adapter attached');
    } catch (error) {
        logger.warn('⚠️ Redis adapter attachment failed:', error);
    }
}
