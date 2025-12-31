// Suppress punycode deprecation warning
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) {
    return; // Ignore punycode deprecation warnings
  }
  console.warn(warning.name, warning.message);
});

import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateOAuthConfig } from './config/environment';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { setupRoutes } from './routes';
import { setupSocketIO } from './services/socketService';
import { initializeNotificationService } from './services/notificationService';
import { SchedulerService } from './services/schedulerService';
import { performanceMonitoring } from './middleware/performanceMonitoring';
import { developmentLogger } from './middleware/developmentLogger';
import { requestIdMiddleware } from './middleware/requestId';
import { userRateLimiter } from './middleware/userRateLimit';
import { monitoring } from './utils/monitoring';
import { compressionMiddleware } from './middleware/compression';

// Import models to register them with Mongoose
import './models';

async function startServer() {
  try {
    // Validate OAuth configuration
    validateOAuthConfig();
    
    // Connect to database
    await connectDatabase();
    
    // Create Express app
    const app = express();
    const server = createServer(app);
    
    // Parse allowed origins for CORS
    const allowedOrigins = config.ALLOWED_ORIGINS 
      ? config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : [config.FRONTEND_URL];
    
    // Setup Socket.IO
    const io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });
    
    setupSocketIO(io);
    initializeNotificationService(io);
    
    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      frameguard: false, // Disable X-Frame-Options to allow iframe embedding
    }));
    
    // CORS configuration
    app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    
    // Rate limiting (per-user instead of per-IP)
    app.use(userRateLimiter);
    
    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request ID middleware (must be early in the chain)
    app.use(requestIdMiddleware);
    
    // Response compression middleware (add early for maximum benefit)
    app.use(compressionMiddleware);
    
    // Performance monitoring middleware
    app.use(performanceMonitoring);
    
    // Monitoring metrics middleware
    app.use(monitoring.requestMetricsMiddleware());
    
    // Development logging middleware
    app.use(developmentLogger);
    
    // Start system monitoring
    monitoring.startSystemMonitoring(60000); // Every minute
    
    // Initialize scheduler service for automatic tasks
    SchedulerService.initialize();
    
    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Health check endpoint
     *     description: Returns the current health status of the API server
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
     *                   example: '2024-01-01T12:00:00.000Z'
     *                 uptime:
     *                   type: number
     *                   description: Server uptime in seconds
     *                   example: 3600
     *                 environment:
     *                   type: string
     *                   example: 'development'
     */
    // Health check endpoint
    app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
      });
    });
    
    // OAuth debug endpoint (development only)
    if (config.NODE_ENV === 'development') {
      app.get('/debug/oauth', (_req: Request, res: Response) => {
        res.status(200).json({
          clientId: config.GOOGLE_CLIENT_ID.substring(0, 20) + '...',
          redirectUri: config.GOOGLE_REDIRECT_URI,
          frontendUrl: config.FRONTEND_URL,
          expectedRedirectUri: `${config.FRONTEND_URL}/auth/callback`,
          isRedirectUriMatch: config.GOOGLE_REDIRECT_URI === `${config.FRONTEND_URL}/auth/callback`,
          environment: config.NODE_ENV,
        });
      });
    }
    
    // Setup routes
    setupRoutes(app);
    
    // Error handling middleware (must be last)
    app.use(errorHandler);
    
    // Start server - following Render's recommended pattern
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    
    // Debug port configuration
    logger.info(`🔧 Port Configuration: process.env.PORT=${process.env.PORT}, final PORT=${PORT}`);
    logger.info(`🔧 Environment: NODE_ENV=${process.env.NODE_ENV}`);
    
    // Force production behavior on Render (when PORT is set by Render)
    // Render automatically sets PORT, so if it exists, we're likely on Render
    const isOnRender = !!process.env.PORT && process.env.PORT !== '3001';
    const shouldBindToAllInterfaces = process.env.NODE_ENV === 'production' || isOnRender;
    
    logger.info(`🔧 Binding Configuration: isOnRender=${isOnRender}, shouldBindToAllInterfaces=${shouldBindToAllInterfaces}`);
    
    if (shouldBindToAllInterfaces) {
      server.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT} (all interfaces - 0.0.0.0)`);
        logger.info(`📊 Health check: /health`);
        logger.info(`📚 API docs: /docs`);
      });
    } else {
      server.listen(PORT, 'localhost', () => {
        logger.info(`🚀 Server running on localhost:${PORT}`);
        logger.info(`📊 Health check: http://localhost:${PORT}/health`);
        logger.info(`📚 API docs: http://localhost:${PORT}/docs`);
      });
    }
    
    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use`);
      } else {
        logger.error('❌ Server error:', error);
      }
      process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      SchedulerService.shutdown();
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      SchedulerService.shutdown();
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();