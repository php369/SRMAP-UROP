import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/v1/status:
 *   get:
 *     summary: Detailed system status
 *     description: Returns comprehensive system status including database connectivity, environment info, and service health
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'operational'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: '1.0.0'
 *                 environment:
 *                   type: string
 *                   example: 'production'
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: 'connected'
 *                         responseTime:
 *                           type: number
 *                           description: Database response time in milliseconds
 *                     oauth:
 *                       type: object
 *                       properties:
 *                         configured:
 *                           type: boolean
 *                     fileStorage:
 *                       type: object
 *                       properties:
 *                         configured:
 *                           type: boolean
 *       503:
 *         description: Service unavailable
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Check database connectivity
    let dbStatus = 'disconnected';
    let dbResponseTime = 0;
    
    try {
      const dbStart = Date.now();
      await mongoose.connection.db?.admin().ping();
      dbResponseTime = Date.now() - dbStart;
      dbStatus = 'connected';
    } catch (error) {
      logger.error('Database health check failed:', error);
      dbStatus = 'error';
    }
    
    // Check OAuth configuration
    const oauthConfigured = !!(
      config.GOOGLE_CLIENT_ID && 
      config.GOOGLE_CLIENT_SECRET && 
      config.GOOGLE_REDIRECT_URI
    );
    
    // Check file storage configuration
    const fileStorageConfigured = !!(
      config.CLOUDINARY_CLOUD_NAME && 
      config.CLOUDINARY_API_KEY && 
      config.CLOUDINARY_API_SECRET
    );
    
    // Determine overall status
    const isHealthy = dbStatus === 'connected' && oauthConfigured;
    const overallStatus = isHealthy ? 'operational' : 'degraded';
    const statusCode = isHealthy ? 200 : 503;
    
    const statusResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      responseTime: Date.now() - startTime,
      services: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
          host: mongoose.connection.host || 'unknown',
          name: mongoose.connection.name || 'unknown'
        },
        oauth: {
          configured: oauthConfigured,
          provider: 'google',
          clientIdPrefix: config.GOOGLE_CLIENT_ID ? 
            config.GOOGLE_CLIENT_ID.substring(0, 20) + '...' : 'not-configured'
        },
        fileStorage: {
          configured: fileStorageConfigured,
          provider: 'cloudinary',
          cloudName: config.CLOUDINARY_CLOUD_NAME || 'not-configured'
        }
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        },
        cpu: {
          usage: process.cpuUsage()
        }
      }
    };
    
    res.status(statusCode).json(statusResponse);
    
  } catch (error) {
    logger.error('Status check failed:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Status check failed',
      error: config.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/v1/status/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Kubernetes-style readiness probe for deployment health checks
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is ready to accept traffic
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check critical dependencies
    await mongoose.connection.db?.admin().ping();
    
    // Check if required environment variables are set
    const requiredEnvVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      return res.status(503).json({
        ready: false,
        message: 'Missing required environment variables',
        missing: missingEnvVars
      });
    }
    
    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      ready: false,
      message: 'Readiness check failed',
      error: config.NODE_ENV === 'development' ? (error as Error).message : 'Service not ready'
    });
  }
});

/**
 * @swagger
 * /api/v1/status/live:
 *   get:
 *     summary: Liveness probe
 *     description: Kubernetes-style liveness probe for basic health checking
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

export default router;