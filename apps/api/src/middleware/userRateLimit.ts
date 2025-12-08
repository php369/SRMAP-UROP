import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { logger } from '../utils/logger';

/**
 * Rate limiter that uses user ID instead of IP address
 * This prevents abuse per user account
 */
export const userRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute (shorter window for better UX)
  max: 200, // 200 requests per minute (allows ~3 requests/second)
  
  // Use user ID as key, fallback to IP
  keyGenerator: (req: Request) => {
    // If user is authenticated, use their ID
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    // Otherwise use IP address
    return `ip:${req.ip}`;
  },
  
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    const userId = req.user?.id || 'anonymous';
    const requestId = req.id || 'unknown';
    
    logger.warn('Rate limit exceeded', {
      userId,
      requestId,
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 900),
      },
    });
  },
  
  // Skip rate limiting for certain conditions
  skip: (req) => {
    // Skip for health checks
    if (req.path.startsWith('/health')) {
      return true;
    }
    
    // Skip for admins (optional - be careful with this)
    if (req.user?.role === 'admin' && process.env.SKIP_ADMIN_RATE_LIMIT === 'true') {
      return true;
    }
    
    return false;
  },
  
  // Add rate limit info to response headers
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter rate limiter for sensitive operations
 * Use for login, password reset, etc.
 */
export const strictRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (shorter window)
  max: 20, // 20 requests per 5 minutes (allows retries and multiple auth flows)
  
  keyGenerator: (req: Request) => {
    // For auth endpoints, use email or IP
    const email = req.body?.email || req.query?.email;
    if (email) {
      return `email:${email}`;
    }
    return `ip:${req.ip}`;
  },
  
  handler: (req, res) => {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      email: req.body?.email,
    });
    
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many attempts. Please try again in 15 minutes.',
        retryAfter: 900,
      },
    });
  },
  
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * API-specific rate limiter for expensive operations
 * Use for file uploads, bulk operations, etc.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute (for expensive operations)
  
  keyGenerator: (req: Request) => {
    return req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
  },
  
  handler: (req, res) => {
    logger.warn('API rate limit exceeded', {
      userId: req.user?.id,
      ip: req.ip,
      path: req.path,
    });
    
    res.status(429).json({
      success: false,
      error: {
        code: 'API_RATE_LIMIT_EXCEEDED',
        message: 'Too many API requests. Please slow down.',
        retryAfter: 60,
      },
    });
  },
  
  standardHeaders: true,
  legacyHeaders: false,
});
