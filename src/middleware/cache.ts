import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
import { logger } from '../utils/logger';

// Create cache instance with default TTL of 10 minutes
const cache = new NodeCache({
  stdTTL: 600, // 10 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Don't clone objects for better performance
});

// Track cache statistics
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Middleware to cache GET requests
 * @param duration - Cache duration in seconds (default: 600 = 10 minutes)
 */
export function cacheMiddleware(duration: number = 600) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if user is authenticated (for personalized data)
    // You can customize this logic based on your needs
    const skipCache = req.headers.authorization && req.originalUrl.includes('/my');
    if (skipCache) {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = `${req.originalUrl || req.url}`;

    // Try to get cached response
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      cacheHits++;
      logger.debug(`Cache HIT for ${cacheKey}`);
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }

    // Cache miss
    cacheMisses++;
    logger.debug(`Cache MISS for ${cacheKey}`);
    res.setHeader('X-Cache', 'MISS');

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache the response
    res.json = function (body: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, body, duration);
        logger.debug(`Cached response for ${cacheKey} (TTL: ${duration}s)`);
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Clear cache for specific pattern
 */
export function clearCache(pattern?: string) {
  if (pattern) {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    matchingKeys.forEach(key => cache.del(key));
    logger.info(`Cleared ${matchingKeys.length} cache entries matching pattern: ${pattern}`);
  } else {
    cache.flushAll();
    logger.info('Cleared all cache entries');
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const stats = cache.getStats();
  const hitRate = cacheHits + cacheMisses > 0 
    ? ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(2) 
    : '0.00';

  return {
    keys: cache.keys().length,
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: `${hitRate}%`,
    ...stats,
  };
}

// Export cache instance for manual operations
export { cache };
