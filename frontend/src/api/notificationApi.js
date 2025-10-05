/*
 * FILE: frontend/src/api/notificationApi.js
 * LOCATION: college-social-platform/frontend/src/api/notificationApi.js
 * PURPOSE: Notification-related API calls (get, mark as read)
 */

import axiosInstance from './axios';

export const notificationApi = {
  // Get all notifications
  getAllNotifications: async () => {
    const response = await axiosInstance.get('/notifications');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await axiosInstance.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await axiosInstance.patch('/notifications/read-all');
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await axiosInstance.get('/notifications/unread/count');
    return response.data;
  }
};