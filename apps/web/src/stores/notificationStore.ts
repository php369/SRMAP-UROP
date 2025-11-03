import { create } from 'zustand';

export interface NotificationData {
  id: string;
  type: 'submission' | 'grade' | 'assessment' | 'system';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'normal' | 'high';
  timestamp: string;
  read?: boolean;
}

interface NotificationStore {
  notifications: NotificationData[];
  addNotification: (notification: Omit<NotificationData, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const newNotification: NotificationData = {
      ...notification,
      id: generateNotificationId(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }));

    // Auto-remove notification after duration
    const duration = getDurationByType(notification.type);
    setTimeout(() => {
      get().removeNotification(newNotification.id);
    }, duration);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },
}));

// Helper functions
function generateNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getDurationByType(type: NotificationData['type']): number {
  switch (type) {
    case 'system':
      return 6000; // Longer for system messages
    case 'grade':
      return 4000;
    case 'assessment':
      return 4000;
    case 'submission':
      return 4000;
    default:
      return 4000;
  }
}