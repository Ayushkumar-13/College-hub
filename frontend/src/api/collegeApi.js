import axiosInstance from './axios';

export const collegeApi = {
  getColleges: async () => {
    const response = await axiosInstance.get('/colleges');
    return response.data;
  },

  getCollegeMeta: async (collegeId) => {
    const response = await axiosInstance.get(`/colleges/${collegeId}/meta`);
    return response.data;
  },

  getCourses: async (collegeId) => {
    const response = await axiosInstance.get(`/colleges/${collegeId}/courses`);
    return response.data;
  },

  getBranches: async (courseId) => {
    const response = await axiosInstance.get(`/courses/${courseId}/branches`);
    return response.data;
  },

  getSections: async (branchId, year) => {
    const response = await axiosInstance.get(`/branches/${branchId}/sections`, {
      params: year ? { year } : {},
    });
    return response.data;
  },

  getCategories: async (collegeId) => {
    const response = await axiosInstance.get(`/colleges/${collegeId}/categories`);
    return response.data;
  },
};
