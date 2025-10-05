/*
 * FILE: frontend/src/api/authApi.js
 * LOCATION: college-social-platform/frontend/src/api/authApi.js
 * PURPOSE: Authentication API calls (login, register, logout)
 */

import axiosInstance from './axios';

export const authApi = {
  // Login user
  login: async (email, password) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Register new user
  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    return Promise.resolve();
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get current token
  getToken: () => {
    return localStorage.getItem('token');
  }
};