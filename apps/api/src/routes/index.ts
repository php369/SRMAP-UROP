import { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';
import { logger } from '../utils/logger';

// Import route modules
import authRoutes from './auth';
import projectRoutes from './projects';
import groupRoutes from './groups';
import applicationRoutes from './applications';
import assessmentRoutes from './assessments';
import submissionRoutes from './submissions';
import evaluationRoutes from './evaluations';
import adminRoutes from './admin';
import presenceRoutes from './presence';
import performanceRoutes from './performance';
import healthRoutes from './health';
import statusRoutes from './status';
import notificationRoutes from './notifications';
import meetingLogRoutes from './meetingLogs';
import meetingRoutes from './meetings';
import studentMetaRoutes from './studentMeta';
import windowRoutes from './windows';
import eligibilityRoutes from './eligibility';
import { createDebugRoutes } from '../middleware/developmentLogger';
import userRoutes from './users';
import cohortRoutes from './cohorts';
import controlRoutes from './control';

export function setupRoutes(app: Express): void {
  // API version prefix
  const API_PREFIX = '/api/v1';

  // Health check (already defined in main server file)

  // Authentication routes
  app.use(`${API_PREFIX}/auth`, authRoutes);
  
  // Compatibility route for frontend URL duplication issue
  // Frontend is calling /api/v1/api/v1/auth/* instead of /api/v1/auth/*
  app.use(`${API_PREFIX}${API_PREFIX}/auth`, authRoutes);
  
  // Debug endpoint to test route registration
  app.get(`${API_PREFIX}/debug/routes`, (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Routes are properly registered',
      timestamp: new Date().toISOString(),
      availableRoutes: [
        'GET /api/v1/projects',
        'GET /api/v1/groups', 
        'GET /api/v1/users',
        'GET /api/v1/applications',
        'GET /api/v1/assessments',
        'POST /api/v1/auth/google',
        'POST /api/v1/auth/callback'
      ]
    });
  });

  // Project routes
  app.use(`${API_PREFIX}/projects`, projectRoutes);

  // Group routes
  app.use(`${API_PREFIX}/groups`, groupRoutes);

  // Application routes
  app.use(`${API_PREFIX}/applications`, applicationRoutes);

  // Assessment routes
  app.use(`${API_PREFIX}/assessments`, assessmentRoutes);

  // Submission routes
  app.use(`${API_PREFIX}/submissions`, submissionRoutes);

  // Evaluation routes
  app.use(`${API_PREFIX}/evaluations`, evaluationRoutes);

  // Admin routes
  app.use(`${API_PREFIX}/admin`, adminRoutes);

  // Presence routes
  app.use(`${API_PREFIX}/presence`, presenceRoutes);

  // Performance routes
  app.use(`${API_PREFIX}/performance`, performanceRoutes);

  // Health routes
  app.use('/health', healthRoutes);

  // Status routes
  app.use(`${API_PREFIX}/status`, statusRoutes);

  // Notification routes
  app.use(`${API_PREFIX}/notifications`, notificationRoutes);

  // Meeting log routes
  app.use(`${API_PREFIX}/meeting-logs`, meetingLogRoutes);

  // Meeting routes
  app.use(`${API_PREFIX}/meetings`, meetingRoutes);

  // Student metadata routes
  app.use(`${API_PREFIX}/student-meta`, studentMetaRoutes);

  // Window routes
  app.use(`${API_PREFIX}/windows`, windowRoutes);

  // Eligibility routes
  app.use(`${API_PREFIX}/eligibility`, eligibilityRoutes);

  // Development debug routes (only in development)
  if (process.env.NODE_ENV === 'development') {
    app.use(`${API_PREFIX}/debug`, createDebugRoutes());
  }

  // User routes
  app.use(`${API_PREFIX}/users`, userRoutes);

  // Cohort routes
  app.use(`${API_PREFIX}/cohorts`, cohortRoutes);

  // Control panel routes (Coordinator)
  app.use(`${API_PREFIX}/control`, controlRoutes);

  /**
   * @swagger
   * /api/v1/status:
   *   get:
   *     summary: API status and endpoint information
   *     description: Returns the current API status and available endpoints
   *     tags: [System]
   *     responses:
   *       200:
   *         description: API status information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: 'SRM Project Portal API is running'
   *                 version:
   *                   type: string
   *                   example: '1.0.0'
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: '2024-01-01T12:00:00.000Z'
   *                 endpoints:
   *                   type: object
   *                   properties:
   *                     health:
   *                       type: string
   *                       example: '/health'
   *                     docs:
   *                       type: string
   *                       example: '/docs'
   *                     auth:
   *                       type: string
   *                       example: '/api/v1/auth'
   *                     assessments:
   *                       type: string
   *                       example: '/api/v1/assessments'
   *                     submissions:
   *                       type: string
   *                       example: '/api/v1/submissions'
   *                     users:
   *                       type: string
   *                       example: '/api/v1/users'
   *                     admin:
   *                       type: string
   *                       example: '/api/v1/admin'
   */
  // API status endpoint
  app.get(`${API_PREFIX}/status`, (_req: Request, res: Response) => {
    res.json({
      message: 'SRM Project Portal API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        docs: '/docs',
        auth: `${API_PREFIX}/auth`,
        projects: `${API_PREFIX}/projects`,
        groups: `${API_PREFIX}/groups`,
        applications: `${API_PREFIX}/applications`,
        assessments: `${API_PREFIX}/assessments`,
        submissions: `${API_PREFIX}/submissions`,
        evaluations: `${API_PREFIX}/evaluations`,
        users: `${API_PREFIX}/users`,
        admin: `${API_PREFIX}/admin`,
        notifications: `${API_PREFIX}/notifications`,
        meetingLogs: `${API_PREFIX}/meeting-logs`,
        studentMeta: `${API_PREFIX}/student-meta`,
        performance: `${API_PREFIX}/performance`,
        cohorts: `${API_PREFIX}/cohorts`,
        debug: process.env.NODE_ENV === 'development' ? `${API_PREFIX}/debug` : undefined,
      }
    });
  });

  // API documentation with Swagger UI
  app.use('/docs', swaggerUi.serve);
  app.get('/docs', swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SRM Project Portal API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  }));

  // OpenAPI JSON endpoint
  app.get('/docs/openapi.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // 404 handler for API routes
  app.use(`${API_PREFIX}/*`, (req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
      }
    });
  });

  logger.info('✅ Routes configured successfully');
}