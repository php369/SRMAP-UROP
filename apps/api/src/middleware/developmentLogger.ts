import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

/**
 * Development logging and debugging middleware
 * Provides detailed request/response logging and debugging information
 */

interface RequestLog {
  method: string;
  url: string;
  headers: Record<string, any>;
  query: Record<string, any>;
  body: any;
  ip: string;
  userAgent: string;
  timestamp: string;
  requestId: string;
}

interface ResponseLog {
  statusCode: number;
  headers: Record<string, any>;
  responseTime: number;
  contentLength?: number;
  timestamp: string;
  requestId: string;
}

// Store request logs for debugging (in development only)
const requestLogs: Map<string, RequestLog> = new Map();
const responseLogs: Map<string, ResponseLog> = new Map();

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize sensitive data from logs
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password', 'token', 'authorization', 'cookie', 'secret',
    'key', 'auth', 'jwt', 'refresh_token', 'access_token'
  ];

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Development request logger middleware
 */
export function developmentLogger(req: Request, res: Response, next: NextFunction): void {
  // Only enable in development
  if (config.NODE_ENV !== 'development') {
    return next();
  }

  const requestId = generateRequestId();
  const startTime = Date.now();

  // Add request ID to request object
  (req as any).requestId = requestId;

  // Log incoming request
  const requestLog: RequestLog = {
    method: req.method,
    url: req.originalUrl || req.url,
    headers: sanitizeData(req.headers),
    query: req.query,
    body: sanitizeData(req.body),
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    timestamp: new Date().toISOString(),
    requestId,
  };

  // Store request log
  requestLogs.set(requestId, requestLog);

  // Log request details
  logger.debug('📥 Incoming Request', {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: requestLog.ip,
    userAgent: requestLog.userAgent,
    query: req.query,
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
  });

  // Override res.end to capture response
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any, cb?: any): any {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Log response details
    const responseLog: ResponseLog = {
      statusCode: res.statusCode,
      headers: sanitizeData(res.getHeaders()),
      responseTime,
      contentLength: res.get('Content-Length') ? parseInt(res.get('Content-Length')!) : undefined,
      timestamp: new Date().toISOString(),
      requestId,
    };

    // Store response log
    responseLogs.set(requestId, responseLog);

    // Log response
    const logLevel = res.statusCode >= 400 ? 'error' : res.statusCode >= 300 ? 'warn' : 'info';
    logger[logLevel]('📤 Outgoing Response', {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: responseLog.contentLength,
    });

    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('🐌 Slow Request Detected', {
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode,
      });
    }

    // Log errors with more detail
    if (res.statusCode >= 400) {
      logger.error('❌ Error Response', {
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        requestHeaders: requestLog.headers,
        requestBody: requestLog.body,
        responseHeaders: responseLog.headers,
      });
    }

    // Clean up old logs (keep only last 100 requests)
    if (requestLogs.size > 100) {
      const oldestKey = requestLogs.keys().next().value;
      if (oldestKey) {
        requestLogs.delete(oldestKey);
        responseLogs.delete(oldestKey);
      }
    }

    return originalEnd(chunk, encoding, cb);
  };

  next();
}

/**
 * Get request logs for debugging
 */
export function getRequestLogs(limit: number = 50): Array<{ request: RequestLog; response?: ResponseLog }> {
  const logs: Array<{ request: RequestLog; response?: ResponseLog }> = [];
  
  for (const [requestId, request] of requestLogs) {
    const response = responseLogs.get(requestId);
    logs.push({ request, response });
  }

  return logs.slice(-limit);
}

/**
 * Get specific request log by ID
 */
export function getRequestLog(requestId: string): { request?: RequestLog; response?: ResponseLog } {
  return {
    request: requestLogs.get(requestId),
    response: responseLogs.get(requestId),
  };
}

/**
 * Clear all stored logs
 */
export function clearLogs(): void {
  requestLogs.clear();
  responseLogs.clear();
  logger.info('🧹 Development logs cleared');
}

/**
 * Debug route for viewing logs in development
 */
export function createDebugRoutes() {
  const express = require('express');
  const router = express.Router();

  // Get recent logs
  router.get('/logs', (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = getRequestLogs(limit);
    
    res.json({
      success: true,
      data: {
        logs,
        count: logs.length,
        totalStored: requestLogs.size,
      },
    });
  });

  // Get specific log by request ID
  router.get('/logs/:requestId', (req: Request, res: Response) => {
    const { requestId } = req.params;
    const log = getRequestLog(requestId);
    
    if (!log.request) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LOG_NOT_FOUND',
          message: 'Request log not found',
        },
      });
    }
    
    res.json({
      success: true,
      data: log,
    });
  });

  // Clear logs
  router.delete('/logs', (_req: Request, res: Response) => {
    clearLogs();
    res.json({
      success: true,
      data: {
        message: 'Logs cleared successfully',
      },
    });
  });

  // System info
  router.get('/system', (_req: Request, res: Response) => {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    res.json({
      success: true,
      data: {
        environment: config.NODE_ENV,
        nodeVersion: process.version,
        platform: process.platform,
        uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
        memoryUsage: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
        },
        activeConnections: requestLogs.size,
      },
    });
  });

  return router;
}