import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { Notification } from '../../models/Notification';
import { User } from '../../models/User';
import notificationRoutes from '../../routes/notifications';
import { authenticate } from '../../middleware/auth';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = {
      id: req.headers['x-test-user-id'] || 'test-user-id',
      email: 'test@srmap.edu.in',
      name: 'Test User',
      role: 'student'
    };
    next();
  })
}));

describe('Notification Routes', () => {
  let app: express.Application;
  let testUserId: string;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test-notifications-routes';
    await mongoose.connect(mongoUri);
    
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/v1/notifications', notificationRoutes);
    
    testUserId = new mongoose.Types.ObjectId().toString();
  });

  afterAll(async () => {
    await Notification.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Notification.deleteMany({});
  });

  describe('GET /api/v1/notifications', () => {
    beforeEach(async () => {
      // Create test notifications
      const notifications = [
        {
          userId: new mongoose.Types.ObjectId(testUserId),
          role: 'student',
          type: 'APPLICATION_APPROVED',
          title: 'Application Approved',
          message: 'Your application has been approved',
          read: false,
          createdAt: new Date(Date.now() - 1000)
        },
        {
          userId: new mongoose.Types.ObjectId(testUserId),
          role: 'student',
          type: 'GRADES_PUBLISHED',
          title: 'Grades Published',
          message: 'Your grades are now available',
          read: true,
          createdAt: new Date(Date.now() - 2000)
        }
      ];

      await Notification.insertMany(notifications);
    });

    it('should get notifications with default pagination', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('x-test-user-id', testUserId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(20);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should filter by read status', async () => {
      const response = await request(app)
        .get('/api/v1/notifications?read=false')
        .set('x-test-user-id', testUserId)
        .expect(200);

      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.notifications[0].title).toBe('Application Approved');
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get('/api/v1/notifications?type=APPLICATION_APPROVED')
        .set('x-test-user-id', testUserId)
        .expect(200);

      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.notifications[0].type).toBe('APPLICATION_APPROVED');
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/v1/notifications?page=1&limit=1')
        .set('x-test-user-id', testUserId)
        .expect(200);

      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.hasNext).toBe(true);
    });
  });

  describe('GET /api/v1/notifications/unread-count', () => {
    beforeEach(async () => {
      const notifications = [
        {
          userId: new mongoose.Types.ObjectId(testUserId),
          role: 'student',
          type: 'APPLICATION_APPROVED',
          title: 'Unread 1',
          message: 'Message 1',
          read: false
        },
        {
          userId: new mongoose.Types.ObjectId(testUserId),
          role: 'student',
          type: 'GRADES_PUBLISHED',
          title: 'Read 1',
          message: 'Message 2',
          read: true
        }
      ];

      await Notification.insertMany(notifications);
    });

    it('should return unread count', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('x-test-user-id', testUserId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(1);
    });
  });

  describe('POST /api/v1/notifications/:id/read', () => {
    let notificationId: string;

    beforeEach(async () => {
      const notification = await Notification.create({
        userId: new mongoose.Types.ObjectId(testUserId),
        role: 'student',
        type: 'APPLICATION_APPROVED',
        title: 'Test Notification',
        message: 'Test message',
        read: false
      });
      notificationId = notification._id.toString();
    });

    it('should mark notification as read', async () => {
      const response = await request(app)
        .post(`/api/v1/notifications/${notificationId}/read`)
        .set('x-test-user-id', testUserId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.read).toBe(true);

      // Verify in database
      const updated = await Notification.findById(notificationId);
      expect(updated!.read).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      const response = await request(app)
        .post(`/api/v1/notifications/${fakeId}/read`)
        .set('x-test-user-id', testUserId)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
    });

    it('should return 400 for invalid notification ID', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/invalid-id/read')
        .set('x-test-user-id', testUserId)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/notifications/read-all', () => {
    beforeEach(async () => {
      const notifications = [
        {
          userId: new mongoose.Types.ObjectId(testUserId),
          role: 'student',
          type: 'APPLICATION_APPROVED',
          title: 'Notification 1',
          message: 'Message 1',
          read: false
        },
        {
          userId: new mongoose.Types.ObjectId(testUserId),
          role: 'student',
          type: 'GRADES_PUBLISHED',
          title: 'Notification 2',
          message: 'Message 2',
          read: false
        }
      ];

      await Notification.insertMany(notifications);
    });

    it('should mark all notifications as read', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/read-all')
        .set('x-test-user-id', testUserId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updatedCount).toBe(2);

      // Verify all notifications are marked as read
      const notifications = await Notification.find({ userId: testUserId });
      expect(notifications.every(n => n.read)).toBe(true);
    });
  });

  describe('POST /api/v1/notifications', () => {
    it('should create a notification', async () => {
      const targetUserId = new mongoose.Types.ObjectId().toString();
      
      const notificationData = {
        userId: targetUserId,
        role: 'student',
        type: 'APPLICATION_APPROVED',
        title: 'Test Notification',
        message: 'This is a test notification'
      };

      const response = await request(app)
        .post('/api/v1/notifications')
        .set('x-test-user-id', testUserId)
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Notification');
      expect(response.body.data.userId).toBe(targetUserId);
      expect(response.body.data.actorId).toBe(testUserId);

      // Verify in database
      const created = await Notification.findById(response.body.data._id);
      expect(created).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/notifications')
        .set('x-test-user-id', testUserId)
        .send({
          // Missing required fields
          title: 'Test'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate notification type', async () => {
      const response = await request(app)
        .post('/api/v1/notifications')
        .set('x-test-user-id', testUserId)
        .send({
          userId: new mongoose.Types.ObjectId().toString(),
          role: 'student',
          type: 'INVALID_TYPE',
          title: 'Test',
          message: 'Test message'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});