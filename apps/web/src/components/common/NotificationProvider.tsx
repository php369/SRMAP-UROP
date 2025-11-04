import { useEffect } from 'react';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAuthStore } from '../../stores/authStore';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../../utils/constants';
import { NotificationData } from '../../types';

let socket: Socket | null = null;

export function NotificationProvider() {
  const { addNotification } = useNotificationStore();
  const { token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return;
    }

    // Initialize socket connection
    socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    // Listen for notifications
    socket.on('notification', (notification: NotificationData) => {
      addNotification(notification);
    });

    // Listen for submission events
    socket.on('new-submission', (data) => {
      addNotification({
        type: 'submission',
        title: 'New Submission',
        message: `${data.studentName} submitted work for an assessment`,
        priority: 'normal',
        data,
      });
    });

    // Listen for grade events
    socket.on('grade-received', (data) => {
      addNotification({
        type: 'grade',
        title: 'Grade Received',
        message: `Your submission has been graded`,
        priority: 'normal',
        data,
      });
    });

    // Listen for assessment events
    socket.on('assessment-changed', (data) => {
      addNotification({
        type: 'assessment',
        title: 'Assessment Updated',
        message: `An assessment has been updated`,
        priority: 'normal',
        data,
      });
    });

    // Handle connection events
    socket.on('connect', () => {
      console.log('Connected to notification service');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from notification service');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [isAuthenticated, token, addNotification]);

  return null; // This component doesn't render anything
}
