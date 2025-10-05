/*
 * FILE: frontend/src/api/postApi.js
 * LOCATION: college-social-platform/frontend/src/api/postApi.js
 * PURPOSE: Post-related API calls (CRUD, like, comment, share)
 */

import axiosInstance from './axios';

export const postApi = {
  // Get all posts with filter
  getPosts: async (filter = 'all') => {
    const response = await axiosInstance.get(`/posts?filter=${filter}`);
    return response.data;
  },

  // Create new post
  createPost: async (content, files) => {
    const formData = new FormData();
    formData.append('content', content);
    
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('media', file);
      });
    }

    const response = await axiosInstance.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Like/Unlike post
  likePost: async (postId) => {
    const response = await axiosInstance.post(`/posts/${postId}/like`);
    return response.data;
  },

  // Comment on post
  commentOnPost: async (postId, text) => {
    const response = await axiosInstance.post(`/posts/${postId}/comment`, { text });
    return response.data;
  },

  // Share post
  sharePost: async (postId) => {
    const response = await axiosInstance.post(`/posts/${postId}/share`);
    return response.data;
  },

  // Repost
  repostPost: async (postId) => {
    const response = await axiosInstance.post(`/posts/${postId}/repost`);
    return response.data;
  }
};