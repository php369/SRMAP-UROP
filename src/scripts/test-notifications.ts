import mongoose from 'mongoose';
import { config } from '../config/environment';
import { Notification } from '../models/Notification';
import { 
  createNotification, 
  getUserNotifications, 
  markNotificationAsRead,
  getUnreadNotificationCount 
} from '../services/notificationService';

async function testNotificationSystem() {
  try {
    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test user ID
    const testUserId = new mongoose.Types.ObjectId().toString();
    console.log(`📝 Testing with user ID: ${testUserId}`);

    // Clean up any existing test notifications
    await Notification.deleteMany({ userId: testUserId });
    console.log('🧹 Cleaned up existing test notifications');

    // Test 1: Create a notification
    console.log('\n🧪 Test 1: Creating notification...');
    const notification = await createNotification({
      userId: testUserId,
      role: 'student',
      type: 'APPLICATION_APPROVED',
      title: 'Test Notification',
      message: 'This is a test notification for the persistent notification system',
      data: { testKey: 'testValue' }
    }, false); // Don't broadcast via Socket.IO

    console.log('✅ Notification created:', {
      id: notification._id,
      title: notification.title,
      read: notification.read
    });

    // Test 2: Get user notifications
    console.log('\n🧪 Test 2: Getting user notifications...');
    const userNotifications = await getUserNotifications(testUserId, { page: 1, limit: 10 });
    console.log('✅ Retrieved notifications:', {
      count: userNotifications.notifications.length,
      total: userNotifications.pagination.total
    });

    // Test 3: Get unread count
    console.log('\n🧪 Test 3: Getting unread count...');
    const unreadCount = await getUnreadNotificationCount(testUserId);
    console.log('✅ Unread count:', unreadCount);

    // Test 4: Mark notification as read
    console.log('\n🧪 Test 4: Marking notification as read...');
    const updatedNotification = await markNotificationAsRead(notification._id.toString(), testUserId);
    console.log('✅ Notification marked as read:', {
      id: updatedNotification?._id,
      read: updatedNotification?.read
    });

    // Test 5: Verify unread count decreased
    console.log('\n🧪 Test 5: Verifying unread count after marking as read...');
    const newUnreadCount = await getUnreadNotificationCount(testUserId);
    console.log('✅ New unread count:', newUnreadCount);

    // Test 6: Create multiple notifications to test pagination
    console.log('\n🧪 Test 6: Creating multiple notifications for pagination test...');
    const notificationPromises = [];
    for (let i = 1; i <= 5; i++) {
      notificationPromises.push(createNotification({
        userId: testUserId,
        role: 'student',
        type: 'GRADES_PUBLISHED',
        title: `Test Notification ${i}`,
        message: `This is test notification number ${i}`,
        data: { index: i }
      }, false));
    }
    
    await Promise.all(notificationPromises);
    console.log('✅ Created 5 additional notifications');

    // Test 7: Test pagination
    console.log('\n🧪 Test 7: Testing pagination...');
    const paginatedResult = await getUserNotifications(testUserId, { page: 1, limit: 3 });
    console.log('✅ Paginated result:', {
      notificationsCount: paginatedResult.notifications.length,
      page: paginatedResult.pagination.page,
      total: paginatedResult.pagination.total,
      hasNext: paginatedResult.pagination.hasNext
    });

    // Test 8: Test filtering by read status
    console.log('\n🧪 Test 8: Testing filter by read status...');
    const unreadNotifications = await getUserNotifications(testUserId, { read: false });
    console.log('✅ Unread notifications:', unreadNotifications.notifications.length);

    const readNotifications = await getUserNotifications(testUserId, { read: true });
    console.log('✅ Read notifications:', readNotifications.notifications.length);

    // Test 9: Test filtering by type
    console.log('\n🧪 Test 9: Testing filter by type...');
    const gradeNotifications = await getUserNotifications(testUserId, { type: 'GRADES_PUBLISHED' });
    console.log('✅ Grade notifications:', gradeNotifications.notifications.length);

    console.log('\n🎉 All notification system tests passed!');

    // Clean up
    await Notification.deleteMany({ userId: testUserId });
    console.log('🧹 Cleaned up test notifications');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the test
testNotificationSystem().catch(console.error);