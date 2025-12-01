import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
      error?: string;
    };
    memory: {
      status: 'normal' | 'warning' | 'critical';
      usage: NodeJS.MemoryUsage;
      percentage: number;
    };
    disk?: {
      status: 'normal' | 'warning' | 'critical';
      available?: string;
      used?: string;
    };
  };
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    responseTime?: number;
  }>;
}

/**
 * Check database connectivity and response time
 */
async function checkDatabase(): Promise<{ status: 'connected' | 'disconnected' | 'error'; responseTime?: number; error?: string }> {
  try {
    const startTime = Date.now();
    
    // Simple ping to check connection
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    await mongoose.connection.db.admin().ping();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'connected',
      responseTime,
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): { status: 'normal' | 'warning' | 'critical'; usage: NodeJS.MemoryUsage; percentage: number } {
  const usage = process.memoryUsage();
  const totalMemory = usage.heapTotal;
  const usedMemory = usage.heapUsed;
  const percentage = (usedMemory / totalMemory) * 100;

  let status: 'normal' | 'warning' | 'critical' = 'normal';
  
  if (percentage > 90) {
    status = 'critical';
  } else if (percentage > 75) {
    status = 'warning';
  }

  return {
    status,
    usage,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Run comprehensive health checks
 */
async function runHealthChecks(): Promise<HealthStatus['checks']> {
  const checks: HealthStatus['checks'] = [];

  // Database connectivity check
  try {
    const dbResult = await checkDatabase();
    checks.push({
      name: 'database_connectivity',
      status: dbResult.status === 'connected' ? 'pass' : 'fail',
      message: dbResult.status === 'connected' 
        ? `Database connected (${dbResult.responseTime}ms)` 
        : `Database error: ${dbResult.error}`,
      responseTime: dbResult.responseTime,
    });
  } catch (error) {
    checks.push({
      name: 'database_connectivity',
      status: 'fail',
      message: 'Database check failed',
    });
  }

  // Memory usage check
  const memoryResult = checkMemory();
  checks.push({
    name: 'memory_usage',
    status: memoryResult.status === 'critical' ? 'fail' : memoryResult.status === 'warning' ? 'warn' : 'pass',
    message: `Memory usage: ${memoryResult.percentage}% (${Math.round(memoryResult.usage.heapUsed / 1024 / 1024)}MB used)`,
  });

  // Environment configuration check
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  checks.push({
    name: 'environment_configuration',
    status: missingEnvVars.length === 0 ? 'pass' : 'fail',
    message: missingEnvVars.length === 0 
      ? 'All required environment variables are set'
      : `Missing environment variables: ${missingEnvVars.join(', ')}`,
  });

  // API response time check (self-check)
  const startTime = Date.now();
  // Simulate a quick operation
  await new Promise(resolve => setTimeout(resolve, 1));
  const apiResponseTime = Date.now() - startTime;
  
  checks.push({
    name: 'api_response_time',
    status: apiResponseTime < 100 ? 'pass' : apiResponseTime < 500 ? 'warn' : 'fail',
    message: `API response time: ${apiResponseTime}ms`,
    responseTime: apiResponseTime,
  });

  return checks;
}

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Returns basic health status of the API server
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'healthy'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 environment:
 *                   type: string
 *                   example: 'development'
 *       503:
 *         description: Server is unhealthy
 */
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const checks = await runHealthChecks();
    const dbCheck = await checkDatabase();
    const memoryCheck = checkMemory();
    
    // Determine overall status
    const hasFailures = checks.some(check => check.status === 'fail');
    const hasWarnings = checks.some(check => check.status === 'warn');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (hasFailures) {
      overallStatus = 'unhealthy';
    } else if (hasWarnings) {
      overallStatus = 'degraded';
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      version: '1.0.0',
      services: {
        database: dbCheck,
        memory: memoryCheck,
      },
      checks,
    };

    const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
    const responseTime = Date.now() - startTime;
    
    // Log health check results
    logger.info('Health check completed', {
      status: overallStatus,
      responseTime: `${responseTime}ms`,
      failedChecks: checks.filter(c => c.status === 'fail').length,
      warningChecks: checks.filter(c => c.status === 'warn').length,
    });

    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    logger.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      version: '1.0.0',
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}));

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness check
 *     description: Checks if the service is ready to accept traffic (Kubernetes readiness probe)
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', asyncHandler(async (_req: Request, res: Response) => {
  try {
    // Check critical dependencies
    const dbCheck = await checkDatabase();
    
    if (dbCheck.status !== 'connected') {
      return res.status(503).json({
        ready: false,
        reason: 'Database not connected',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      ready: true,
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
      },
    });
    
  } catch (error) {
    logger.error('Readiness check failed:', error);
    
    res.status(503).json({
      ready: false,
      reason: 'Readiness check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness check
 *     description: Checks if the service is alive (Kubernetes liveness probe)
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/live', (_req: Request, res: Response) => {
  // Simple liveness check - if we can respond, we're alive
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
  });
});

/**
 * @swagger
 * /health/metrics:
 *   get:
 *     summary: System metrics
 *     description: Returns detailed system metrics for monitoring
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System metrics retrieved successfully
 */
router.get('/metrics', asyncHandler(async (_req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers,
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
    },
    process: {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    environment: config.NODE_ENV,
  });
}));

export default router;