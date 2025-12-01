/**
 * Request/Response Logging Middleware
 * Comprehensive logging for all API requests and responses
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RequestLogData {
  requestId: string;
  method: string;
  path: string;
  query: any;
  body?: any;
  headers: {
    userAgent?: string;
    contentType?: string;
    authorization?: string;
  };
  ip: string;
  userId?: string;
  timestamp: string;
}

interface ResponseLogData extends RequestLogData {
  statusCode: number;
  duration: number;
  responseSize?: number;
  error?: any;
}

/**
 * Sanitize sensitive data from logs
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveFields = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'authorization',
  ];

  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });

  return sanitized;
}

/**
 * Request/Response logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = (req as any).id || 'unknown';

  // Prepare request log data
  const requestLogData: RequestLogData = {
    requestId,
    method: req.method,
    path: req.path,
    query: sanitizeData(req.query),
    headers: {
      userAgent: req.get('user-agent'),
      contentType: req.get('content-type'),
      authorization: req.get('authorization') ? '[REDACTED]' : undefined,
    },
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString(),
  };

  // Log request body for POST/PUT/PATCH (sanitized)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    requestLogData.body = sanitizeData(req.body);
  }

  // Log incoming request
  logger.info('Incoming request', requestLogData);

  // Capture response
  const originalSend = res.send;
  const originalJson = res.json;
  let responseBody: any;

  // Override res.send
  res.send = function (data: any) {
    responseBody = data;
    return originalSend.call(this, data);
  };

  // Override res.json
  res.json = function (data: any) {
    responseBody = data;
    return originalJson.call(this, data);
  };

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;

    const responseLogData: ResponseLogData = {
      ...requestLogData,
      statusCode: res.statusCode,
      duration,
      responseSize: res.get('content-length')
        ? parseInt(res.get('content-length')!)
        : undefined,
    };

    // Log response body for errors (sanitized)
    if (res.statusCode >= 400 && responseBody) {
      try {
        const parsed = typeof responseBody === 'string'
          ? JSON.parse(responseBody)
          : responseBody;
        responseLogData.error = sanitizeData(parsed);
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Determine log level based on status code
    if (res.statusCode >= 500) {
      logger.error('Outgoing response (server error)', responseLogData);
    } else if (res.statusCode >= 400) {
      logger.warn('Outgoing response (client error)', responseLogData);
    } else if (duration > 1000) {
      logger.warn('Outgoing response (slow)', responseLogData);
    } else {
      logger.info('Outgoing response', responseLogData);
    }

    // Log slow requests separately
    if (duration > 3000) {
      logger.warn('Slow request detected', {
        requestId,
        method: req.method,
        path: req.path,
        duration,
        threshold: 3000,
      });
    }
  });

  // Log errors
  res.on('error', (error) => {
    logger.error('Response error', {
      requestId,
      method: req.method,
      path: req.path,
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  });

  next();
}

/**
 * Minimal request logger (for high-traffic endpoints)
 */
export function minimalRequestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      requestId: (req as any).id,
    });
  });

  next();
}

/**
 * Error request logger (only logs errors)
 */
export function errorRequestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    if (res.statusCode >= 400) {
      const duration = Date.now() - start;
      
      logger.error('Request error', {
        requestId: (req as any).id,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration,
        query: sanitizeData(req.query),
        body: sanitizeData(req.body),
        userId: (req as any).user?.id,
      });
    }
  });

  next();
}

/**
 * Request logger with custom fields
 */
export function customRequestLogger(
  customFields: (req: Request, res: Response) => Record<string, any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const custom = customFields(req, res);

      logger.info('Request', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration,
        requestId: (req as any).id,
        ...custom,
      });
    });

    next();
  };
}

/**
 * Skip logging for specific paths
 */
export function skipLoggingFor(paths: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (paths.some(path => req.path.startsWith(path))) {
      return next();
    }
    return requestLogger(req, res, next);
  };
}

/**
 * Usage Examples:
 * 
 * // Example 1: Full logging (default)
 * app.use(requestLogger);
 * 
 * // Example 2: Minimal logging for high-traffic endpoints
 * app.use('/api/v1/health', minimalRequestLogger);
 * app.use('/api/v1', requestLogger);
 * 
 * // Example 3: Only log errors
 * app.use(errorRequestLogger);
 * 
 * // Example 4: Skip logging for health checks
 * app.use(skipLoggingFor(['/health', '/metrics']));
 * 
 * // Example 5: Custom fields
 * app.use(customRequestLogger((req, res) => ({
 *   userRole: req.user?.role,
 *   tenantId: req.headers['x-tenant-id'],
 * })));
 */
