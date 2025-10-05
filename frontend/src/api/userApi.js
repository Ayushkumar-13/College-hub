/*
 * FILE: frontend/src/api/userApi.js
 * LOCATION: college-social-platform/frontend/src/api/userApi.js
 * PURPOSE: User-related API calls (get users, follow/unfollow)
 */

import axiosInstance from './axios';

export const userApi = {
  // Get all users
  getAllUsers: async () => {
    const response = await axiosInstance.get('/users');
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await axiosInstance.get(`/users/${userId}`);
    return response.data;
  },

  // Follow user
  followUser: async (userId) => {
    const response = await axiosInstance.post(`/users/${userId}/follow`);
    return response.data;
  },

  // Unfollow user
  unfollowUser: async (userId) => {
    const response = await axiosInstance.post(`/users/${userId}/unfollow`);
    return response.data;
  }
};