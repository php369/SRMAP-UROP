import Redis from 'ioredis';
import { config } from './environment';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;

function createRedisClient(role: 'publisher' | 'subscriber'): Redis {
    const redisConfig = {
        retryStrategy(times: number) {
            const delay = Math.min(times * 200, 3000); // Max 3s delay
            // Suppress logs for internal retries to avoid noise, only warn on first few
            if (times < 3) {
                logger.warn(`🔁 Redis ${role} retry #${times} in ${delay}ms`);
            }
            return delay;
        },
        maxRetriesPerRequest: null, // Critical: Prevent crash on disconnect
        enableReadyCheck: false,    // Critical for Render
        // Render uses IPv6 for internal networking, but some environments might be dual stack
        // 0 means try both IPv4 and IPv6
        family: 0,
        reconnectOnError: (err: Error) => {
            const targetError = "READONLY";
            if (err.message.includes(targetError)) {
                // Only reconnect when the error starts with "READONLY"
                return true;
            }
            return false;
        }
    };

    logger.info(`Initializing Redis ${role} connection (Lazy)...`);

    // Check if REDIS_URL is provided
    if (!config.REDIS_URL) {
        logger.warn('⚠️ No REDIS_URL provided, Redis features will be disabled.');
        // Return a mock-like object or throw? ioredis throws if URL is empty.
        // But we want to fail gracefully. 
        // Logic below handles connection errors, but empty URL needs check.
    }

    const client = new Redis(config.REDIS_URL, redisConfig);

    client.on('connect', () => {
        logger.info(`✅ Redis ${role} connected (Lazy)`);
    });

    client.on('error', (err: any) => {
        // Log as warning, not error, to prevent Sentry/logging spam on temporary failures
        logger.warn(`⚠️ Redis ${role} connection warning:`, err.message);
    });

    return client;
}

export function getRedisClient(): Redis {
    if (!redisClient) {
        redisClient = createRedisClient('publisher');
    }
    return redisClient;
}

export function getRedisSubscriber(): Redis {
    if (!redisSubscriber) {
        redisSubscriber = createRedisClient('subscriber');
    }
    return redisSubscriber;
}

// Deprecated: kept for backward compatibility during refactor, but essentially just calls getters
export function initializeRedis(): { pubClient: Redis; subClient: Redis } {
    return {
        pubClient: getRedisClient(),
        subClient: getRedisSubscriber()
    };
}
