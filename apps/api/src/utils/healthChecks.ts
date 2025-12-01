/**
 * Enhanced Health Checks
 * Comprehensive health monitoring for all services
 */

import mongoose from 'mongoose';
import { logger } from './logger';

export interface HealthCheckResult {
  healthy: boolean;
  latency?: number;
  error?: string;
  details?: any;
}

export interface SystemHealth {
  overall: boolean;
  timestamp: string;
  checks: {
    database: HealthCheckResult;
    memory: HealthCheckResult;
    cpu: HealthCheckResult;
    disk?: HealthCheckResult;
    uptime: HealthCheckResult;
    environment: HealthCheckResult;
  };
}

/**
 * Check database health
 */
export async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    // Check connection state
    if (mongoose.connection.readyState !== 1) {
      return {
        healthy: false,
        error: 'Database not connected',
      };
    }

    // Ping database
    await mongoose.connection.db.admin().ping();
    
    const latency = Date.now() - start;

    return {
      healthy: latency < 1000, // Healthy if response < 1s
      latency,
      details: {
        state: 'connected',
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      },
    };
  } catch (error: any) {
    logger.error('Database health check failed:', error);
    return {
      healthy: false,
      error: error.message,
    };
  }
}

/**
 * Check memory usage
 */
export function checkMemory(): HealthCheckResult {
  const usage = process.memoryUsage();
  const heapUsedMB = usage.heapUsed / 1024 / 1024;
  const heapTotalMB = usage.heapTotal / 1024 / 1024;
  const rssMB = usage.rss / 1024 / 1024;
  const threshold = 500; // 500MB threshold

  const healthy = heapUsedMB < threshold;

  return {
    healthy,
    details: {
      heapUsed: `${heapUsedMB.toFixed(2)} MB`,
      heapTotal: `${heapTotalMB.toFixed(2)} MB`,
      rss: `${rssMB.toFixed(2)} MB`,
      external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`,
      threshold: `${threshold} MB`,
      percentage: `${((heapUsedMB / heapTotalMB) * 100).toFixed(2)}%`,
    },
  };
}

/**
 * Check CPU usage
 */
export function checkCPU(): HealthCheckResult {
  const usage = process.cpuUsage();
  const userSeconds = usage.user / 1000000; // Convert to seconds
  const systemSeconds = usage.system / 1000000;

  return {
    healthy: true,
    details: {
      user: `${userSeconds.toFixed(2)}s`,
      system: `${systemSeconds.toFixed(2)}s`,
      total: `${(userSeconds + systemSeconds).toFixed(2)}s`,
    },
  };
}

/**
 * Check uptime
 */
export function checkUptime(): HealthCheckResult {
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  return {
    healthy: true,
    details: {
      uptime: `${hours}h ${minutes}m ${seconds}s`,
      seconds: uptimeSeconds,
    },
  };
}

/**
 * Check environment
 */
export function checkEnvironment(): HealthCheckResult {
  return {
    healthy: true,
    details: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV || 'development',
      pid: process.pid,
    },
  };
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<SystemHealth> {
  const checks = {
    database: await checkDatabase(),
    memory: checkMemory(),
    cpu: checkCPU(),
    uptime: checkUptime(),
    environment: checkEnvironment(),
  };

  const overall = Object.values(checks).every(check => check.healthy);

  return {
    overall,
    timestamp: new Date().toISOString(),
    checks,
  };
}

/**
 * Get health status (simple)
 */
export async function getHealthStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
}> {
  const health = await performHealthCheck();

  if (health.overall) {
    return { status: 'healthy', message: 'All systems operational' };
  }

  const unhealthyChecks = Object.entries(health.checks)
    .filter(([_, check]) => !check.healthy)
    .map(([name]) => name);

  if (unhealthyChecks.length === 1) {
    return {
      status: 'degraded',
      message: `${unhealthyChecks[0]} is unhealthy`,
    };
  }

  return {
    status: 'unhealthy',
    message: `Multiple systems unhealthy: ${unhealthyChecks.join(', ')}`,
  };
}

/**
 * Check if system is ready (for Kubernetes readiness probe)
 */
export async function isReady(): Promise<boolean> {
  try {
    // Check critical services only
    const dbCheck = await checkDatabase();
    return dbCheck.healthy;
  } catch (error) {
    return false;
  }
}

/**
 * Check if system is alive (for Kubernetes liveness probe)
 */
export function isAlive(): boolean {
  // Simple check - if we can respond, we're alive
  return true;
}

/**
 * Get system metrics
 */
export function getSystemMetrics() {
  const memory = process.memoryUsage();
  const cpu = process.cpuUsage();

  return {
    memory: {
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      rss: memory.rss,
      external: memory.external,
    },
    cpu: {
      user: cpu.user,
      system: cpu.system,
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Usage in routes:
 * 
 * import {
 *   performHealthCheck,
 *   getHealthStatus,
 *   isReady,
 *   isAlive,
 *   getSystemMetrics,
 * } from '../utils/healthChecks';
 * 
 * // Detailed health check
 * router.get('/health/detailed', async (req, res) => {
 *   const health = await performHealthCheck();
 *   res.status(health.overall ? 200 : 503).json(health);
 * });
 * 
 * // Simple health status
 * router.get('/health/status', async (req, res) => {
 *   const status = await getHealthStatus();
 *   res.json(status);
 * });
 * 
 * // Kubernetes readiness probe
 * router.get('/health/ready', async (req, res) => {
 *   const ready = await isReady();
 *   res.status(ready ? 200 : 503).json({ ready });
 * });
 * 
 * // Kubernetes liveness probe
 * router.get('/health/live', (req, res) => {
 *   const alive = isAlive();
 *   res.status(alive ? 200 : 503).json({ alive });
 * });
 * 
 * // System metrics
 * router.get('/health/metrics', (req, res) => {
 *   const metrics = getSystemMetrics();
 *   res.json(metrics);
 * });
 */
