/**
 * Query Result Caching
 * Caches database query results to reduce load
 */

import NodeCache from 'node-cache';
import { logger } from './logger';

interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  hitRate: number;
}

class QueryCache {
  private cache: NodeCache;
  private stats: { hits: number; misses: number };

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes default TTL
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false, // Don't clone objects (better performance)
      deleteOnExpire: true,
      maxKeys: 1000, // Maximum number of keys
    });

    this.stats = {
      hits: 0,
      misses: 0,
    };

    // Log cache events
    this.cache.on('set', (key) => {
      logger.debug(`Cache SET: ${key}`);
    });

    this.cache.on('del', (key) => {
      logger.debug(`Cache DEL: ${key}`);
    });

    this.cache.on('expired', (key) => {
      logger.debug(`Cache EXPIRED: ${key}`);
    });
  }

  /**
   * Get cached value
   */
  get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    
    if (value !== undefined) {
      this.stats.hits++;
      logger.debug(`Cache HIT: ${key}`);
    } else {
      this.stats.misses++;
      logger.debug(`Cache MISS: ${key}`);
    }

    return value;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || 300);
  }

  /**
   * Delete specific key
   */
  delete(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get multiple keys
   */
  mget<T>(keys: string[]): Record<string, T> {
    return this.cache.mget(keys) as Record<string, T>;
  }

  /**
   * Set multiple keys
   */
  mset<T>(keyValuePairs: Array<{ key: string; val: T; ttl?: number }>): boolean {
    return this.cache.mset(keyValuePairs);
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern: string): number {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    if (matchingKeys.length > 0) {
      logger.info(`Invalidating ${matchingKeys.length} keys matching pattern: ${pattern}`);
      return this.cache.del(matchingKeys);
    }

    return 0;
  }

  /**
   * Invalidate multiple patterns
   */
  invalidatePatterns(patterns: string[]): number {
    let totalDeleted = 0;
    patterns.forEach(pattern => {
      totalDeleted += this.invalidatePattern(pattern);
    });
    return totalDeleted;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.flushAll();
    logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const keys = this.cache.keys().length;
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      keys,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return this.cache.keys();
  }

  /**
   * Get TTL for a key
   */
  getTtl(key: string): number | undefined {
    return this.cache.getTtl(key);
  }

  /**
   * Wrap a query function with caching
   */
  async wrap<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Execute query
    try {
      const result = await queryFn();

      // Cache result
      this.set(key, result, ttl);

      return result;
    } catch (error) {
      logger.error(`Query failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Wrap with cache and automatic invalidation
   */
  async wrapWithInvalidation<T>(
    key: string,
    queryFn: () => Promise<T>,
    invalidationPatterns: string[],
    ttl?: number
  ): Promise<T> {
    const result = await this.wrap(key, queryFn, ttl);

    // Store invalidation patterns for this key
    const patternsKey = `${key}:patterns`;
    this.set(patternsKey, invalidationPatterns, ttl);

    return result;
  }

  /**
   * Create cache key from parameters
   */
  createKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');

    return `${prefix}:${sortedParams}`;
  }
}

// Export singleton instance
export const queryCache = new QueryCache();

/**
 * Usage Examples:
 * 
 * // Example 1: Simple caching
 * const project = await queryCache.wrap(
 *   `project:${id}`,
 *   () => Project.findById(id),
 *   600 // 10 minutes
 * );
 * 
 * // Example 2: Invalidate on update
 * const updatedProject = await Project.findByIdAndUpdate(id, data);
 * queryCache.invalidatePattern(`project:${id}`);
 * 
 * // Example 3: Cache with parameters
 * const key = queryCache.createKey('projects', { type: 'IDP', status: 'published' });
 * const projects = await queryCache.wrap(
 *   key,
 *   () => Project.find({ type: 'IDP', status: 'published' }),
 *   300
 * );
 * 
 * // Example 4: Get cache stats
 * const stats = queryCache.getStats();
 * console.log(`Cache hit rate: ${stats.hitRate}%`);
 */
