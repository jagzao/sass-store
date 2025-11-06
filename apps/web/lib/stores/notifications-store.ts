'use client';

import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationsStore {
  notifications: Notification[];

  // Actions
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Computed
  hasNotifications: () => boolean;
  getNotificationCount: () => number;
}

export const useNotifications = create<NotificationsStore>()((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Notification ${newNotification.type}]:`, newNotification.message);
    }

    // TODO: Send to analytics/monitoring
    // analytics.track('notification_shown', {
    //   type: newNotification.type,
    //   title: newNotification.title,
    // });
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  hasNotifications: () => {
    return get().notifications.length > 0;
  },

  getNotificationCount: () => {
    return get().notifications.length;
  },
}));

// Convenience methods for common notification types
export const notify = {
  success: (title: string, message: string, duration?: number) => {
    useNotifications.getState().addNotification({ type: 'success', title, message, duration });
  },

  error: (title: string, message: string, duration?: number) => {
    useNotifications.getState().addNotification({ type: 'error', title, message, duration });
  },

  warning: (title: string, message: string, duration?: number) => {
    useNotifications.getState().addNotification({ type: 'warning', title, message, duration });
  },

  info: (title: string, message: string, duration?: number) => {
    useNotifications.getState().addNotification({ type: 'info', title, message, duration });
  },
};

// Selectors
export const selectNotifications = (state: NotificationsStore) => state.notifications;
export const selectNotificationCount = (state: NotificationsStore) => state.notifications.length;
