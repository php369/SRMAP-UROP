/**
 * Backend Monitoring and Performance Tracking
 * Integrates with logging and provides performance metrics
 */

import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  [key: string]: any;
}

class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000;

  /**
   * Track a performance metric
   */
  trackMetric(metric: Omit<PerformanceMetric, 'timestamp'>) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    logger.debug('Performance metric tracked', fullMetric);
  }

  /**
   * Track API response time
   */
  trackResponseTime(endpoint: string, method: string, duration: number) {
    this.trackMetric({
      name: 'api_response_time',
      value: duration,
      unit: 'ms',
      metadata: {
        endpoint,
        method,
      },
    });

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow API request detected', {
        endpoint,
        method,
        duration,
      });
    }
  }

  /**
   * Track database query time
   */
  trackDatabaseQuery(operation: string, collection: string, duration: number) {
    this.trackMetric({
      name: 'database_query_time',
      value: duration,
      unit: 'ms',
      metadata: {
        operation,
        collection,
      },
    });

    // Log slow queries
    if (duration > 500) {
      logger.warn('Slow database query detected', {
        operation,
        collection,
        duration,
      });
    }
  }

  /**
   * Track external API call
   */
  trackExternalApiCall(service: string, endpoint: string, duration: number, success: boolean) {
    this.trackMetric({
      name: 'external_api_call',
      value: duration,
      unit: 'ms',
      metadata: {
        service,
        endpoint,
        success,
      },
    });

    if (!success) {
      logger.error('External API call failed', {
        service,
        endpoint,
        duration,
      });
    }
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage() {
    const usage = process.memoryUsage();

    this.trackMetric({
      name: 'memory_heap_used',
      value: usage.heapUsed,
      unit: 'bytes',
    });

    this.trackMetric({
      name: 'memory_heap_total',
      value: usage.heapTotal,
      unit: 'bytes',
    });

    this.trackMetric({
      name: 'memory_rss',
      value: usage.rss,
      unit: 'bytes',
    });

    // Log high memory usage
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 500) {
      logger.warn('High memory usage detected', {
        heapUsedMB: heapUsedMB.toFixed(2),
        heapTotalMB: (usage.heapTotal / 1024 / 1024).toFixed(2),
        rssMB: (usage.rss / 1024 / 1024).toFixed(2),
      });
    }
  }

  /**
   * Track CPU usage
   */
  trackCpuUsage() {
    const usage = process.cpuUsage();

    this.trackMetric({
      name: 'cpu_user',
      value: usage.user,
      unit: 'microseconds',
    });

    this.trackMetric({
      name: 'cpu_system',
      value: usage.system,
      unit: 'microseconds',
    });
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    const summary: Record<string, any> = {};

    // Group metrics by name
    const groupedMetrics = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate statistics for each metric
    Object.entries(groupedMetrics).forEach(([name, values]) => {
      const sorted = values.sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);

      summary[name] = {
        count: values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: sum / values.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    });

    return summary;
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(limit: number = 100) {
    return this.metrics.slice(-limit);
  }

  /**
   * Clear metrics
   */
  clearMetrics() {
    this.metrics = [];
    logger.info('Metrics cleared');
  }

  /**
   * Track error with context
   */
  trackError(error: Error, context?: ErrorContext) {
    logger.error('Error tracked', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
    });

    this.trackMetric({
      name: 'error_count',
      value: 1,
      unit: 'count',
      metadata: {
        errorName: error.name,
        ...context,
      },
    });
  }

  /**
   * Track user action
   */
  trackUserAction(userId: string, action: string, metadata?: Record<string, any>) {
    logger.info('User action tracked', {
      userId,
      action,
      metadata,
    });

    this.trackMetric({
      name: 'user_action',
      value: 1,
      unit: 'count',
      metadata: {
        userId,
        action,
        ...metadata,
      },
    });
  }

  /**
   * Start monitoring system metrics
   */
  startSystemMonitoring(intervalMs: number = 60000) {
    setInterval(() => {
      this.trackMemoryUsage();
      this.trackCpuUsage();
    }, intervalMs);

    logger.info('System monitoring started', { intervalMs });
  }

  /**
   * Create a timer for measuring duration
   */
  createTimer() {
    const start = Date.now();

    return {
      end: () => Date.now() - start,
    };
  }

  /**
   * Middleware for tracking request metrics
   */
  requestMetricsMiddleware() {
    return (req: any, res: any, next: any) => {
      const timer = this.createTimer();

      // Track when response finishes
      res.on('finish', () => {
        const duration = timer.end();

        this.trackResponseTime(
          req.path || req.url,
          req.method,
          duration
        );

        // Track status code distribution
        this.trackMetric({
          name: 'http_status_code',
          value: res.statusCode,
          unit: 'code',
          metadata: {
            method: req.method,
            path: req.path || req.url,
          },
        });
      });

      next();
    };
  }

  /**
   * Get health metrics
   */
  getHealthMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    return {
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss,
        external: memUsage.external,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptime,
      metrics: this.getMetricsSummary(),
    };
  }
}

// Export singleton instance
export const monitoring = new MonitoringService();

// Export types
export type { PerformanceMetric, ErrorContext };
