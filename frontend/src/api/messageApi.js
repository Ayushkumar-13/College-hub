/*
 * FILE: frontend/src/api/messageApi.js
 * LOCATION: college-social-platform/frontend/src/api/messageApi.js
 * PURPOSE: Message-related API calls (send, get conversations)
 */

import axiosInstance from './axios';

export const messageApi = {
  // Get messages with specific user
  getMessages: async (userId) => {
    const response = await axiosInstance.get(`/messages/${userId}`);
    return response.data;
  },

  // Send message
  sendMessage: async (receiverId, text, files = []) => {
    const formData = new FormData();
    formData.append('receiverId', receiverId);
    formData.append('text', text || '');
    
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('media', file);
      });
    }

    const response = await axiosInstance.post('/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    const response = await axiosInstance.patch(`/messages/${messageId}/read`);
    return response.data;
  }
};