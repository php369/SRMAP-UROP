import Redis from 'ioredis';
import { config } from './environment';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;

export function initializeRedis(): { pubClient: Redis; subClient: Redis } {
    if (redisClient && redisSubscriber) {
        return { pubClient: redisClient, subClient: redisSubscriber };
    }

    const redisConfig = {
        retryStrategy(times: number) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3,
        // Render uses IPv6 for internal networking, but some environments might be dual stack
        // 0 means try both IPv4 and IPv6
        family: 0,
    };

    logger.info(`Connecting to Redis at ${config.REDIS_URL}...`);

    redisClient = new Redis(config.REDIS_URL, redisConfig);
    redisSubscriber = new Redis(config.REDIS_URL, redisConfig);

    redisClient.on('connect', () => {
        logger.info('✅ Redis Publisher connected');
    });

    redisClient.on('error', (err: any) => {
        logger.error('❌ Redis Publisher error:', err);
    });

    redisSubscriber.on('connect', () => {
        logger.info('✅ Redis Subscriber connected');
    });

    redisSubscriber.on('error', (err: any) => {
        logger.error('❌ Redis Subscriber error:', err);
    });

    return { pubClient: redisClient, subClient: redisSubscriber };
}

export function getRedisClient(): Redis | null {
    return redisClient;
}
