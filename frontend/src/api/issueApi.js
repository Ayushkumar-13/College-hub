/*
 * FILE: frontend/src/api/issueApi.js
 * LOCATION: college-social-platform/frontend/src/api/issueApi.js
 * PURPOSE: Issue-related API calls (create, get, update status)
 */

import axiosInstance from './axios';

export const issueApi = {
  // Get all issues
  getAllIssues: async () => {
    const response = await axiosInstance.get('/issues');
    return response.data;
  },

  // Get single issue
  getIssueById: async (issueId) => {
    const response = await axiosInstance.get(`/issues/${issueId}`);
    return response.data;
  },

  // Create new issue
  createIssue: async (title, description, assignedTo, files = []) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('assignedTo', assignedTo);
    
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('media', file);
      });
    }

    const response = await axiosInstance.post('/issues', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Update issue status
  updateIssueStatus: async (issueId, status) => {
    const response = await axiosInstance.patch(`/issues/${issueId}/status`, { status });
    return response.data;
  }
};