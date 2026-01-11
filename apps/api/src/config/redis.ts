import Redis from 'ioredis';
import { config } from './environment';
import { logger } from '../utils/logger';

// Render uses IPv6 for internal networking, but some environments might be dual stack
// 0 means try both IPv4 and IPv6
const FAMILY = 0;

export const redis = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null, // Critical: Prevent crash on disconnect
    enableReadyCheck: false,    // Critical for Render
    family: FAMILY,
    retryStrategy(times: number) {
        const delay = Math.min(times * 200, 3000); // Max 3s delay
        // Suppress logs for internal retries to avoid noise, only warn on first few
        if (times < 3) {
            logger.warn(`🔁 Redis retry #${times} in ${delay}ms`);
        }
        return delay;
    },
    reconnectOnError: (err: Error) => {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
            return true;
        }
        return false;
    }
});

redis.on('connect', () => {
    logger.info('✅ Redis connected (Render internal)');
});

redis.on('error', (err: any) => {
    logger.warn('⚠️ Redis connection issue:', err.message);
});
