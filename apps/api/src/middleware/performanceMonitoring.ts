import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

// Store performance metrics in memory (in production, use Redis or database)
const performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS_STORED = 1000;

/**
 * Performance monitoring middleware
 * Tracks response times, memory usage, and request patterns
 */
export function performanceMonitoring(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime.bigint();
  const requestId = generateRequestId();
  
  // Add request ID to request object for tracing
  (req as any).requestId = requestId;

  // Override res.end to capture metrics when response is sent
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any, cb?: any): any {
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    const metrics: PerformanceMetrics = {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date(),
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
    };

    // Store metrics
    storeMetrics(metrics);

    // Log slow requests (> 1 second)
    if (responseTime > 1000) {
      logger.warn(`Slow request detected: ${req.method} ${req.url} - ${responseTime.toFixed(2)}ms`, {
        requestId,
        responseTime,
        statusCode: res.statusCode,
      });
    }

    // Log errors
    if (res.statusCode >= 400) {
      logger.error(`Error response: ${req.method} ${req.url} - ${res.statusCode}`, {
        requestId,
        responseTime,
        statusCode: res.statusCode,
      });
    }

    // Call original end method
    return originalEnd(chunk, encoding, cb);
  };

  next();
}

/**
 * Store performance metrics with rotation
 */
function storeMetrics(metrics: PerformanceMetrics): void {
  performanceMetrics.push(metrics);
  
  // Rotate metrics to prevent memory leaks
  if (performanceMetrics.length > MAX_METRICS_STORED) {
    performanceMetrics.shift();
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(): {
  totalRequests: number;
  averageResponseTime: number;
  slowRequests: number;
  errorRate: number;
  memoryUsage: NodeJS.MemoryUsage;
  topSlowEndpoints: Array<{ url: string; averageTime: number; count: number }>;
} {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  
  // Filter metrics from last hour
  const recentMetrics = performanceMetrics.filter(
    m => m.timestamp.getTime() > oneHourAgo
  );

  if (recentMetrics.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      errorRate: 0,
      memoryUsage: process.memoryUsage(),
      topSlowEndpoints: [],
    };
  }

  const totalRequests = recentMetrics.length;
  const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
  const slowRequests = recentMetrics.filter(m => m.responseTime > 1000).length;
  const errorRequests = recentMetrics.filter(m => m.statusCode >= 400).length;
  const errorRate = (errorRequests / totalRequests) * 100;

  // Calculate top slow endpoints
  const endpointStats = new Map<string, { totalTime: number; count: number }>();
  
  recentMetrics.forEach(metric => {
    const endpoint = `${metric.method} ${metric.url.split('?')[0]}`; // Remove query params
    const existing = endpointStats.get(endpoint) || { totalTime: 0, count: 0 };
    endpointStats.set(endpoint, {
      totalTime: existing.totalTime + metric.responseTime,
      count: existing.count + 1,
    });
  });

  const topSlowEndpoints = Array.from(endpointStats.entries())
    .map(([url, stats]) => ({
      url,
      averageTime: stats.totalTime / stats.count,
      count: stats.count,
    }))
    .sort((a, b) => b.averageTime - a.averageTime)
    .slice(0, 10);

  return {
    totalRequests,
    averageResponseTime,
    slowRequests,
    errorRate,
    memoryUsage: process.memoryUsage(),
    topSlowEndpoints,
  };
}

/**
 * Get detailed metrics for a specific time range
 */
export function getMetricsInRange(startTime: Date, endTime: Date): PerformanceMetrics[] {
  return performanceMetrics.filter(
    m => m.timestamp >= startTime && m.timestamp <= endTime
  );
}

/**
 * Clear stored metrics (useful for testing)
 */
export function clearMetrics(): void {
  performanceMetrics.length = 0;
}

/**
 * Performance budget checker
 * Alerts when performance thresholds are exceeded
 */
export function checkPerformanceBudget(): {
  withinBudget: boolean;
  violations: string[];
  recommendations: string[];
} {
  const stats = getPerformanceStats();
  const violations: string[] = [];
  const recommendations: string[] = [];

  // Performance budget thresholds
  const BUDGET = {
    averageResponseTime: 500, // 500ms
    slowRequestThreshold: 5, // Max 5% slow requests
    errorRateThreshold: 1, // Max 1% error rate
    memoryUsageThreshold: 512 * 1024 * 1024, // 512MB
  };

  // Check average response time
  if (stats.averageResponseTime > BUDGET.averageResponseTime) {
    violations.push(`Average response time (${stats.averageResponseTime.toFixed(2)}ms) exceeds budget (${BUDGET.averageResponseTime}ms)`);
    recommendations.push('Consider optimizing database queries and adding caching');
  }

  // Check slow request percentage
  const slowRequestPercentage = (stats.slowRequests / stats.totalRequests) * 100;
  if (slowRequestPercentage > BUDGET.slowRequestThreshold) {
    violations.push(`Slow requests (${slowRequestPercentage.toFixed(2)}%) exceed budget (${BUDGET.slowRequestThreshold}%)`);
    recommendations.push('Identify and optimize slow endpoints');
  }

  // Check error rate
  if (stats.errorRate > BUDGET.errorRateThreshold) {
    violations.push(`Error rate (${stats.errorRate.toFixed(2)}%) exceeds budget (${BUDGET.errorRateThreshold}%)`);
    recommendations.push('Review error logs and fix recurring issues');
  }

  // Check memory usage
  if (stats.memoryUsage.heapUsed > BUDGET.memoryUsageThreshold) {
    violations.push(`Memory usage (${(stats.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB) exceeds budget (${BUDGET.memoryUsageThreshold / 1024 / 1024}MB)`);
    recommendations.push('Check for memory leaks and optimize data structures');
  }

  return {
    withinBudget: violations.length === 0,
    violations,
    recommendations,
  };
}