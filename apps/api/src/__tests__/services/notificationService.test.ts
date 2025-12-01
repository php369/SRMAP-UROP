import mongoose from 'mongoose';
import { Notification } from '../../models/Notification';
import { 
  createNotification, 
  getUserNotifications, 
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount
} from '../../services/notificationService';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('NotificationService', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test-notifications';
    await mongoose.connect(mongoUri);
    
    testUserId = new mongoose.Types.ObjectId().toString();
  });

  afterAll(async () => {
    // Clean up and disconnect
    await Notification.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up notifications before each test
    await Notification.deleteMany({});
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const notificationData = {
        userId: testUserId,
        role: 'student' as const,
        type: 'APPLICATION_APPROVED' as const,
        title: 'Test Notification',
        message: 'This is a test notification',
        data: { testKey: 'testValue' }
      };

      const notification = await createNotification(notificationData, false); // Don't broadcast

      expect(notification).toBeDefined();
      expect(notification.userId.toString()).toBe(testUserId);
      expect(notification.role).toBe('student');
      expect(notification.type).toBe('APPLICATION_APPROVED');
      expect(notification.title).toBe('Test Notification');
      expect(notification.message).toBe('This is a test notification');
      expect(notification.data).toEqual({ testKey: 'testValue' });
      expect(notification.read).toBe(false);
    });

    it('should create notification with optional fields', async () => {
      const actorId = new mongoose.Types.ObjectId().toString();
      const targetGroupId = new mongoose.Types.ObjectId().toString();
      
      const notificationData = {
        userId: testUserId,
        role: 'faculty' as const,
        type: 'EXTERNAL_ASSIGNED' as const,
        title: 'External Evaluator Assigned',
        message: 'You have been assigned as external evaluator',
        actorId,
        targetGroupId
      };

      const notification = await createNotification(notificationData, false);

      expect(notification.actorId?.toString()).toBe(actorId);
      expect(notification.targetGroupId?.toString()).toBe(targetGroupId);
    });
  });

  describe('getUserNotifications', () => {
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
          createdAt: new Date(Date.now() - 1000) // 1 second ago
        },
        {
          userId: new mongoose.Types.ObjectId(testUserId),
          role: 'student',
          type: 'GRADES_PUBLISHED',
          title: 'Grades Published',
          message: 'Your grades are now available',
          read: true,
          createdAt: new Date(Date.now() - 2000) // 2 seconds ago
        }
      ];

      await Notification.insertMany(notifications);
    });

    it('should get paginated notifications', async () => {
      const result = await getUserNotifications(testUserId, { page: 1, limit: 10 });

      expect(result.notifications).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      
      // Should be sorted by createdAt desc (newest first)
      expect(result.notifications[0].title).toBe('Application Approved');
      expect(result.notifications[1].title).toBe('Grades Published');
    });

    it('should filter by read status', async () => {
      const unreadResult = await getUserNotifications(testUserId, { read: false });
      expect(unreadResult.notifications).toHaveLength(1);
      expect(unreadResult.notifications[0].title).toBe('Application Approved');

      const readResult = await getUserNotifications(testUserId, { read: true });
      expect(readResult.notifications).toHaveLength(1);
      expect(readResult.notifications[0].title).toBe('Grades Published');
    });

    it('should filter by type', async () => {
      const result = await getUserNotifications(testUserId, { type: 'APPLICATION_APPROVED' });
      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].type).toBe('APPLICATION_APPROVED');
    });
  });

  describe('markNotificationAsRead', () => {
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
      const result = await markNotificationAsRead(notificationId, testUserId);
      
      expect(result).toBeDefined();
      expect(result!.read).toBe(true);
      
      // Verify in database
      const updated = await Notification.findById(notificationId);
      expect(updated!.read).toBe(true);
    });

    it('should return null for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const result = await markNotificationAsRead(fakeId, testUserId);
      expect(result).toBeNull();
    });

    it('should return null for notification belonging to different user', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();
      const result = await markNotificationAsRead(notificationId, otherUserId);
      expect(result).toBeNull();
    });
  });

  describe('markAllNotificationsAsRead', () => {
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

    it('should mark all user notifications as read', async () => {
      const updatedCount = await markAllNotificationsAsRead(testUserId);
      expect(updatedCount).toBe(2);

      // Verify all notifications are marked as read
      const notifications = await Notification.find({ userId: testUserId });
      expect(notifications.every(n => n.read)).toBe(true);
    });
  });

  describe('getUnreadNotificationCount', () => {
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
        },
        {
          userId: new mongoose.Types.ObjectId(testUserId),
          role: 'student',
          type: 'EXTERNAL_ASSIGNED',
          title: 'Unread 2',
          message: 'Message 3',
          read: false
        }
      ];

      await Notification.insertMany(notifications);
    });

    it('should return correct unread count', async () => {
      const count = await getUnreadNotificationCount(testUserId);
      expect(count).toBe(2);
    });
  });
});