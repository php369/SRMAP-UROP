import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validateRequest, validateQuery, validateParams, commonSchemas } from '../middleware/validation';
import Joi from 'joi';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  createNotification
} from '../services/notificationService';
import { logger } from '../utils/logger';

const router: Router = Router();

// Apply authentication to all notification routes
router.use(authenticate);

// Validation schemas
const notificationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  read: Joi.boolean().optional(),
  type: Joi.string().valid(
    'APPLICATION_SUBMITTED', 'APPLICATION_APPROVED', 'APPLICATION_REJECTED',
    'PROJECT_FROZEN', 'MEETING_APPROVAL_REQUIRED', 'MEETING_APPROVED', 'MEETING_REJECTED',
    'GRADES_PUBLISHED', 'GRADES_UNPUBLISHED', 'EXTERNAL_ASSIGNED', 'GROUP_OVERRIDE',
    'SYSTEM', 'SUBMISSION', 'ASSESSMENT',
    'WINDOW_ACTIVE', 'WINDOW_CLOSED',
    'GROUP_MEMBER_ADD', 'GROUP_MEMBER_REMOVE',
    'MEETING_SCHEDULED'
  ).optional()
});

const notificationParamsSchema = Joi.object({
  id: commonSchemas.objectId.required()
});

const createNotificationSchema = Joi.object({
  userId: commonSchemas.objectId.required(),
  role: Joi.string().valid('student', 'faculty', 'coordinator', 'admin').required(),
  type: Joi.string().valid(
    'APPLICATION_SUBMITTED', 'APPLICATION_APPROVED', 'APPLICATION_REJECTED',
    'PROJECT_FROZEN', 'MEETING_APPROVAL_REQUIRED', 'MEETING_APPROVED', 'MEETING_REJECTED',
    'GRADES_PUBLISHED', 'GRADES_UNPUBLISHED', 'EXTERNAL_ASSIGNED', 'GROUP_OVERRIDE',
    'SYSTEM', 'SUBMISSION', 'ASSESSMENT',
    'WINDOW_ACTIVE', 'WINDOW_CLOSED',
    'GROUP_MEMBER_ADD', 'GROUP_MEMBER_REMOVE',
    'MEETING_SCHEDULED'
  ).required(),
  title: Joi.string().min(1).max(200).required(),
  message: Joi.string().min(1).max(1000).required(),
  data: Joi.object().optional(),
  targetGroupId: commonSchemas.objectId.optional(),
  targetProjectId: commonSchemas.objectId.optional()
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Notification ID
 *         userId:
 *           type: string
 *           description: User ID who receives the notification
 *         role:
 *           type: string
 *           enum: [student, faculty, coordinator, admin]
 *           description: User role
 *         type:
 *           type: string
 *           enum: [APPLICATION_SUBMITTED, APPLICATION_APPROVED, APPLICATION_REJECTED, PROJECT_FROZEN, MEETING_APPROVAL_REQUIRED, MEETING_APPROVED, MEETING_REJECTED, GRADES_PUBLISHED, GRADES_UNPUBLISHED, EXTERNAL_ASSIGNED, GROUP_OVERRIDE, SYSTEM, SUBMISSION, ASSESSMENT]
 *           description: Notification type
 *         title:
 *           type: string
 *           description: Notification title
 *         message:
 *           type: string
 *           description: Notification message
 *         data:
 *           type: object
 *           description: Additional notification data for deep linking
 *         read:
 *           type: boolean
 *           description: Whether notification has been read
 *         targetGroupId:
 *           type: string
 *           description: Related group ID (optional)
 *         targetProjectId:
 *           type: string
 *           description: Related project ID (optional)
 *         actorId:
 *           type: string
 *           description: User who triggered the notification (optional)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When notification was created
 *     
 *     PaginatedNotifications:
 *       type: object
 *       properties:
 *         notifications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Notification'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: number
 *             limit:
 *               type: number
 *             total:
 *               type: number
 *             pages:
 *               type: number
 *             hasNext:
 *               type: boolean
 *             hasPrev:
 *               type: boolean
 */

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications with pagination
 *     description: Retrieve notifications for the authenticated user with optional filtering and pagination
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of notifications per page
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status (true for read, false for unread)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedNotifications'
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', validateQuery(notificationQuerySchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { page, limit, read, type } = req.query as any;

    const options = {
      page: page,
      limit: limit,
      read: read,
      type: type
    };

    const result = await getUserNotifications(userId, options);

    res.json({
      success: true,
      data: result,
      message: result.notifications.length === 0 ? 'No notifications yet. You will receive notifications about your applications, projects, and evaluations here.' : undefined
    });

  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_NOTIFICATIONS_FAILED',
        message: 'Failed to fetch notifications'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     description: Get the count of unread notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *                       description: Number of unread notifications
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const count = await getUnreadNotificationCount(userId);

    res.json({
      success: true,
      data: { count }
    });

  } catch (error) {
    logger.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_UNREAD_COUNT_FAILED',
        message: 'Failed to fetch unread count'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   post:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/read', validateParams(notificationParamsSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const notificationId = req.params.id;

    const notification = await markNotificationAsRead(notificationId, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found or does not belong to user'
        }
      });
    }

    res.json({
      success: true,
      data: notification
    });

  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MARK_READ_FAILED',
        message: 'Failed to mark notification as read'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   post:
 *     summary: Mark all notifications as read
 *     description: Mark all notifications as read for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: number
 *                       description: Number of notifications marked as read
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/read-all', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const updatedCount = await markAllNotificationsAsRead(userId);

    res.json({
      success: true,
      data: { updatedCount }
    });

  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MARK_ALL_READ_FAILED',
        message: 'Failed to mark all notifications as read'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     summary: Create a notification (Admin only)
 *     description: Create a new notification for testing or administrative purposes
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - role
 *               - type
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Target user ID
 *               role:
 *                 type: string
 *                 enum: [student, faculty, coordinator, admin]
 *                 description: User role
 *               type:
 *                 type: string
 *                 enum: [APPLICATION_SUBMITTED, APPLICATION_APPROVED, APPLICATION_REJECTED, PROJECT_FROZEN, MEETING_APPROVAL_REQUIRED, MEETING_APPROVED, MEETING_REJECTED, GRADES_PUBLISHED, GRADES_UNPUBLISHED, EXTERNAL_ASSIGNED, GROUP_OVERRIDE, SYSTEM, SUBMISSION, ASSESSMENT]
 *                 description: Notification type
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 description: Notification title
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Notification message
 *               data:
 *                 type: object
 *                 description: Additional notification data
 *               targetGroupId:
 *                 type: string
 *                 description: Related group ID (optional)
 *               targetProjectId:
 *                 type: string
 *                 description: Related project ID (optional)
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/', validateRequest(createNotificationSchema), async (req: Request, res: Response) => {
  try {
    // Check if user is admin (for now, allow any authenticated user for testing)
    const currentUser = (req as any).user;

    // In production, you might want to restrict this to admin users only
    // if (currentUser.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     error: {
    //       code: 'FORBIDDEN',
    //       message: 'Admin access required'
    //     }
    //   });
    // }

    const notificationData = {
      userId: req.body.userId,
      role: req.body.role as any,
      type: req.body.type as any,
      title: req.body.title,
      message: req.body.message,
      data: req.body.data,
      targetGroupId: req.body.targetGroupId,
      targetProjectId: req.body.targetProjectId,
      actorId: currentUser.id
    };

    const notification = await createNotification(notificationData);

    res.status(201).json({
      success: true,
      data: notification
    });

  } catch (error) {
    logger.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_NOTIFICATION_FAILED',
        message: 'Failed to create notification'
      }
    });
  }
});

export default router;