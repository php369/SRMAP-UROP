import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, validateOAuthConfig } from './config/environment';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { setupRoutes } from './routes';
import { setupSocketIO } from './services/socketService';
import { initializeNotificationService } from './services/notificationService';
import { performanceMonitoring } from './middleware/performanceMonitoring';
import { developmentLogger } from './middleware/developmentLogger';

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
    
    // Setup Socket.IO
    const io = new Server(server, {
      cors: {
        origin: config.FRONTEND_URL,
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
    }));
    
    // CORS configuration
    app.use(cors({
      origin: config.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.',
        },
      },
    });
    app.use(limiter);
    
    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Performance monitoring middleware
    app.use(performanceMonitoring);
    
    // Development logging middleware
    app.use(developmentLogger);
    
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
    
    // Start server
    const PORT = config.PORT || 3001;
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API docs: http://localhost:${PORT}/docs`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
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