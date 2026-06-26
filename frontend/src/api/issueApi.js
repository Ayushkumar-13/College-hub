import axiosInstance from './axios';

export const issueApi = {
  getAllIssues: async () => {
    const response = await axiosInstance.get('/issues');
    return response.data;
  },

  getIssueCategories: async () => {
    const response = await axiosInstance.get('/issues/categories');
    return response.data;
  },

  getIssueById: async (issueId) => {
    const response = await axiosInstance.get(`/issues/${issueId}`);
    return response.data;
  },

  createIssue: async (title, description, files = [], problemCategoryId = null) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (problemCategoryId) formData.append('problemCategoryId', problemCategoryId);

    if (files?.length > 0) {
      files.forEach((file) => formData.append('media', file));
    }

    const response = await axiosInstance.post('/issues', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateIssueStatus: async (issueId, status) => {
    const response = await axiosInstance.patch(`/issues/${issueId}/status`, { status });
    return response.data;
  },

  escalateIssue: async (issueId) => {
    const response = await axiosInstance.patch(`/issues/${issueId}/escalate`);
    return response.data;
  },
};
