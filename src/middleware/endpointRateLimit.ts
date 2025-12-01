/**
 * Endpoint-Specific Rate Limiting
 * Different rate limits for different types of endpoints
 */

import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

/**
 * Rate limiter for authentication endpoints (very strict)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    error: {
      code: 6001,
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: '15 minutes',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      success: false,
      error: {
        code: 6001,
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: '15 minutes',
      },
    });
  },
});

/**
 * Rate limiter for write operations (moderate)
 */
export const writeRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: {
      code: 6002,
      message: 'Too many write requests. Please slow down.',
      retryAfter: '1 minute',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return (req as any).user?.id || req.ip;
  },
});

/**
 * Rate limiter for read operations (lenient)
 */
export const readRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: {
      code: 6002,
      message: 'Too many requests. Please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip;
  },
});

/**
 * Rate limiter for expensive operations (very strict)
 */
export const expensiveRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: {
    success: false,
    error: {
      code: 6002,
      message: 'This operation is rate limited. Please try again later.',
      retryAfter: '1 minute',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.warn('Expensive operation rate limit exceeded', {
      userId: (req as any).user?.id,
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      success: false,
      error: {
        code: 6002,
        message: 'This operation is rate limited. Please try again later.',
        retryAfter: '1 minute',
      },
    });
  },
});

/**
 * Rate limiter for file uploads (strict)
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 uploads per 5 minutes
  message: {
    success: false,
    error: {
      code: 6002,
      message: 'Too many file uploads. Please wait before uploading more files.',
      retryAfter: '5 minutes',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip;
  },
});

/**
 * Rate limiter for search operations
 */
export const searchRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 searches per minute
  message: {
    success: false,
    error: {
      code: 6002,
      message: 'Too many search requests. Please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip;
  },
});

/**
 * Rate limiter for API key generation/refresh
 */
export const apiKeyRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    success: false,
    error: {
      code: 6002,
      message: 'Too many API key requests. Please try again later.',
      retryAfter: '1 hour',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip;
  },
});

/**
 * Create custom rate limiter
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: any) => string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: {
        code: 6002,
        message: options.message || 'Too many requests. Please try again later.',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator || ((req) => (req as any).user?.id || req.ip),
  });
}

/**
 * Skip rate limiting for specific users (e.g., admins)
 */
export function skipRateLimitFor(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    next();
  };
}

/**
 * Usage Examples:
 * 
 * // Example 1: Auth endpoints
 * router.post('/auth/login', authRateLimiter, login);
 * router.post('/auth/register', authRateLimiter, register);
 * 
 * // Example 2: Write operations
 * router.post('/projects', writeRateLimiter, createProject);
 * router.put('/projects/:id', writeRateLimiter, updateProject);
 * router.delete('/projects/:id', writeRateLimiter, deleteProject);
 * 
 * // Example 3: Read operations
 * router.get('/projects', readRateLimiter, getProjects);
 * router.get('/projects/:id', readRateLimiter, getProject);
 * 
 * // Example 4: Expensive operations
 * router.post('/reports/generate', expensiveRateLimiter, generateReport);
 * router.post('/exports/csv', expensiveRateLimiter, exportCSV);
 * 
 * // Example 5: File uploads
 * router.post('/upload', uploadRateLimiter, uploadFile);
 * 
 * // Example 6: Search
 * router.get('/search', searchRateLimiter, search);
 * 
 * // Example 7: Custom rate limiter
 * const customLimiter = createRateLimiter({
 *   windowMs: 10 * 60 * 1000, // 10 minutes
 *   max: 50,
 *   message: 'Custom rate limit message',
 * });
 * router.get('/custom', customLimiter, handler);
 * 
 * // Example 8: Skip for admins
 * router.post('/admin/action',
 *   skipRateLimitFor(['admin']),
 *   expensiveRateLimiter,
 *   adminAction
 * );
 */
