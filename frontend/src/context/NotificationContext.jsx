import React, { createContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/hooks';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, token: authTokenFromHook } = useAuth() || {};

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
  });

  const authHeaders = () => {
    const token = authTokenFromHook || localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/notifications', { headers: { ...authHeaders() } });
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

  const markAsRead = async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`, {}, { headers: { ...authHeaders() } });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      return { success: true };
    } catch (err) {
      console.error('markAsRead error', err);
      return { success: false, error: err?.response?.data?.error || err.message };
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all', {}, { headers: { ...authHeaders() } });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      return { success: true };
    } catch (err) {
      console.error('markAllAsRead error', err);
      return { success: false, error: err?.response?.data?.error || err.message };
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, authTokenFromHook]);

  // ✅ ADD notify function
  const notify = (message, type = "info") => {
    // Simple alert as placeholder
    alert(`${type.toUpperCase()}: ${message}`);

    // For better UX, you can use a toast library like react-hot-toast:
    // toast[type](message);
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    notify, // <-- important
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
