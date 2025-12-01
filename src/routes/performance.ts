import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { 
  getPerformanceStats, 
  getMetricsInRange, 
  checkPerformanceBudget 
} from '../middleware/performanceMonitoring';
import { asyncHandler } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

// Validation schemas
const metricsRangeSchema = z.object({
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format'),
});

/**
 * @swagger
 * /api/v1/performance/stats:
 *   get:
 *     summary: Get performance statistics
 *     description: Returns performance metrics for the last hour (admin only)
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalRequests:
 *                           type: number
 *                           example: 1250
 *                         averageResponseTime:
 *                           type: number
 *                           example: 245.67
 *                         slowRequests:
 *                           type: number
 *                           example: 12
 *                         errorRate:
 *                           type: number
 *                           example: 2.4
 *                         memoryUsage:
 *                           type: object
 *                           properties:
 *                             rss:
 *                               type: number
 *                             heapTotal:
 *                               type: number
 *                             heapUsed:
 *                               type: number
 *                             external:
 *                               type: number
 *                             arrayBuffers:
 *                               type: number
 *                         topSlowEndpoints:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               url:
 *                                 type: string
 *                                 example: 'POST /api/v1/assessments'
 *                               averageTime:
 *                                 type: number
 *                                 example: 1250.5
 *                               count:
 *                                 type: number
 *                                 example: 45
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', authenticate, authorize('admin'), asyncHandler(async (_req: Request, res: Response) => {
  const stats = getPerformanceStats();

  res.json({
    success: true,
    data: stats,
  });
}));

/**
 * @swagger
 * /api/v1/performance/budget:
 *   get:
 *     summary: Check performance budget compliance
 *     description: Checks if current performance metrics are within defined budgets (admin only)
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance budget check completed
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         withinBudget:
 *                           type: boolean
 *                           example: false
 *                         violations:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ['Average response time (750ms) exceeds budget (500ms)']
 *                         recommendations:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ['Consider optimizing database queries and adding caching']
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/budget', authenticate, authorize('admin'), asyncHandler(async (_req: Request, res: Response) => {
  const budgetCheck = checkPerformanceBudget();

  res.json({
    success: true,
    data: budgetCheck,
  });
}));

/**
 * @swagger
 * /api/v1/performance/metrics:
 *   get:
 *     summary: Get detailed performance metrics for a time range
 *     description: Returns detailed performance metrics for a specified time range (admin only)
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startTime
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start time for metrics range
 *         example: '2024-01-01T00:00:00.000Z'
 *       - in: query
 *         name: endTime
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End time for metrics range
 *         example: '2024-01-01T23:59:59.000Z'
 *     responses:
 *       200:
 *         description: Detailed metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         metrics:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               requestId:
 *                                 type: string
 *                               method:
 *                                 type: string
 *                               url:
 *                                 type: string
 *                               statusCode:
 *                                 type: number
 *                               responseTime:
 *                                 type: number
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                         count:
 *                           type: number
 *       400:
 *         description: Invalid time range parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/metrics', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  // Validate query parameters
  const validationResult = metricsRangeSchema.safeParse(req.query);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid time range parameters',
        details: validationResult.error.errors,
      },
    });
  }

  const { startTime, endTime } = validationResult.data;
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  // Validate time range
  if (startDate >= endDate) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TIME_RANGE',
        message: 'Start time must be before end time',
      },
    });
  }

  // Limit time range to prevent excessive data
  const maxRangeMs = 24 * 60 * 60 * 1000; // 24 hours
  if (endDate.getTime() - startDate.getTime() > maxRangeMs) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'TIME_RANGE_TOO_LARGE',
        message: 'Time range cannot exceed 24 hours',
      },
    });
  }

  const metrics = getMetricsInRange(startDate, endDate);

  res.json({
    success: true,
    data: {
      metrics,
      count: metrics.length,
      timeRange: {
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    },
  });
}));

export default router;