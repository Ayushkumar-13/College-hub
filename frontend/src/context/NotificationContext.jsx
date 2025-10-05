// FILE: frontend/src/context/NotificationContext.jsx
// PURPOSE: Notification management context (uses axios directly, no missing service import)

import React, { createContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/hooks';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  // useAuth should provide at least isAuthenticated; token if available
  const { isAuthenticated, token: authTokenFromHook } = useAuth() || {};

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // API client (uses VITE_API_URL if set, otherwise relative paths)
  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    // withCredentials: true // enable if your backend uses cookies
  });

  // Helper: authorization headers (try hook token, fallback to localStorage)
  const authHeaders = () => {
    const token = authTokenFromHook || localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/notifications', {
        headers: { ...authHeaders() },
      });

      // backend might return { notifications: [...] } or array directly
      const data = Array.isArray(res.data) ? res.data : res.data.notifications ?? res.data ?? [];

      setNotifications(data);
      setUnreadCount(Array.isArray(data) ? data.filter((n) => !n.read).length : 0);
      return { success: true, data };
    } catch (err) {
      console.error('fetchNotifications error', err);
      return { success: false, error: err?.response?.data?.error || err.message };
    } finally {
      setLoading(false);
    }
  };

  // Mark one notification as read
  const markAsRead = async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`, {}, {
        headers: { ...authHeaders() },
      });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      return { success: true };
    } catch (err) {
      console.error('markAsRead error', err);
      return { success: false, error: err?.response?.data?.error || err.message };
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      // Adjust endpoint if your backend uses a different route
      await apiClient.patch('/notifications/read-all', {}, {
        headers: { ...authHeaders() },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      return { success: true };
    } catch (err) {
      console.error('markAllAsRead error', err);
      return { success: false, error: err?.response?.data?.error || err.message };
    }
  };

  // Auto-fetch on auth change, and poll every 30s while authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      // clear notifications when not authenticated
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, authTokenFromHook]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
