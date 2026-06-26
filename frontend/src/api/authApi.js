import axiosInstance from './axios';

export const authApi = {
  login: async (email, password) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  studentActivate: async ({ sectionId, rollNumber, password }) => {
    const response = await axiosInstance.post('/auth/student/activate', {
      sectionId,
      rollNumber,
      password,
    });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  studentLogin: async ({ sectionId, rollNumber, password }) => {
    const response = await axiosInstance.post('/auth/student/login', {
      sectionId,
      rollNumber,
      password,
    });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  getStudentsInSection: async (sectionId) => {
    const response = await axiosInstance.get('/auth/students-in-section', {
      params: { sectionId },
    });
    return response.data;
  },

  getRegistrationCollege: async () => {
    const response = await axiosInstance.get('/auth/college');
    return response.data;
  },

  getDemoAccounts: async () => {
    const response = await axiosInstance.get('/auth/demo-accounts');
    return response.data;
  },

  getSessions: async (collegeId) => {
    const response = await axiosInstance.get(`/auth/colleges/${collegeId}/sessions`);
    return response.data;
  },

  getCourses: async (collegeId) => {
    const response = await axiosInstance.get(`/auth/colleges/${collegeId}/courses`);
    return response.data;
  },

  getBranches: async (collegeId, courseId) => {
    const response = await axiosInstance.get(`/auth/colleges/${collegeId}/courses/${courseId}/branches`);
    return response.data;
  },

  getSections: async (collegeId, branchId, { year, sessionId, semester } = {}) => {
    const response = await axiosInstance.get(
      `/auth/colleges/${collegeId}/branches/${branchId}/sections`,
      { params: { year, sessionId, semester } }
    );
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    return Promise.resolve();
  },

  isAuthenticated: () => !!localStorage.getItem('token'),

  getToken: () => localStorage.getItem('token'),
};
