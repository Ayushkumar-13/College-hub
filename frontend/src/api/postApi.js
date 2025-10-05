/**
 * FILE: frontend/src/api/postApi.js
 * PURPOSE: Post-related API calls with all features
 */
import axiosInstance from './axios';

export const postApi = {
  // Get all posts with filter
  getPosts: async (filter = 'all') => {
    const response = await axiosInstance.get(`/posts?filter=${filter}`);
    return response.data;
  },

  // Get single post
  getPost: async (postId) => {
    const response = await axiosInstance.get(`/posts/${postId}`);
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

  // Edit post
  editPost: async (postId, content) => {
    const response = await axiosInstance.put(`/posts/${postId}`, { content });
    return response.data;
  },

  // Delete post
  deletePost: async (postId) => {
    const response = await axiosInstance.delete(`/posts/${postId}`);
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

  // Like comment
  likeComment: async (postId, commentId) => {
    const response = await axiosInstance.post(`/posts/${postId}/comments/${commentId}/like`);
    return response.data;
  },

  // Reply to comment
  replyToComment: async (postId, commentId, text) => {
    const response = await axiosInstance.post(`/posts/${postId}/comments/${commentId}/reply`, { text });
    return response.data;
  },

  // Share post (increment count)
  sharePost: async (postId) => {
    const response = await axiosInstance.post(`/posts/${postId}/share`);
    return response.data;
  },

  // Share post to specific users
  sharePostToUsers: async (postId, userIds) => {
    const response = await axiosInstance.post(`/posts/${postId}/share-to-users`, { userIds });
    return response.data;
  },

  // Repost
  repostPost: async (postId, caption) => {
    const response = await axiosInstance.post(`/posts/${postId}/repost`, { caption });
    return response.data;
  }
};