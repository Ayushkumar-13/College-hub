import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '@/api/notificationApi';
import { useAuth } from '@/hooks';
import { useSocket } from '@/context/SocketContext';
import {
  getNotificationRoute,
  normalizeNotification,
  requestBrowserNotificationPermission,
  showBrowserNotification,
} from '@/utils/notificationHelpers';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { on, off, connected } = useSocket();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const locationRef = useRef(window.location.pathname);

  useEffect(() => {
    locationRef.current = window.location.pathname;
  });

  const syncUnreadCount = useCallback(async () => {
    try {
      const { count } = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      /* keep local count */
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return { success: false };
    setLoading(true);
    try {
      const data = await notificationApi.getAll();
      const list = Array.isArray(data) ? data.map(normalizeNotification) : [];
      setNotifications(list);
      await syncUnreadCount();
      return { success: true, data: list };
    } catch (err) {
      console.error('fetchNotifications error', err);
      return { success: false, error: err?.error || err.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, syncUnreadCount]);

  const handleIncoming = useCallback((payload) => {
    const notification = normalizeNotification(payload);
    if (!notification?._id) return;

    setNotifications((prev) => {
      const withoutDup = prev.filter((n) => n._id !== notification._id);
      return [notification, ...withoutDup].slice(0, 100);
    });

    const onNotificationsPage = locationRef.current === '/notifications';
    const isMessage = notification.type === 'message';
    const onMessagesPage = locationRef.current.startsWith('/messages');

    if (!onNotificationsPage && !(isMessage && onMessagesPage)) {
      const text = notification.message || notification.title || 'New notification';
      const route = getNotificationRoute(notification);

      if (typeof window.showToast === 'function') {
        window.showToast(text, 'info', 5000, { route });
      }

      showBrowserNotification(notification.title || 'College Social', {
        body: text,
        tag: notification._id,
        onClick: () => navigate(route),
      });
    }
  }, [navigate]);

  const markAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      return { success: true };
    } catch (err) {
      console.error('markAsRead error', err);
      return { success: false, error: err?.error || err.message };
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      return { success: true };
    } catch (err) {
      console.error('markAllAsRead error', err);
      return { success: false, error: err?.error || err.message };
    }
  };

  const notify = (message, type = 'info') => {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    requestBrowserNotificationPermission();
    fetchNotifications();

    const poll = setInterval(() => {
      if (!connected) {
        fetchNotifications();
      } else {
        syncUnreadCount();
      }
    }, 60000);

    return () => clearInterval(poll);
  }, [isAuthenticated, connected, fetchNotifications, syncUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const countHandler = ({ count }) => {
      if (typeof count === 'number') {
        setUnreadCount(count);
        document.title = count > 0 ? `(${count > 99 ? '99+' : count}) College Social` : 'College Social';
      }
    };

    on('notification:new', handleIncoming);
    on('notification:count', countHandler);

    return () => {
      off('notification:new', handleIncoming);
      off('notification:count', countHandler);
      document.title = 'College Social';
    };
  }, [isAuthenticated, on, off, handleIncoming]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    notify,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
