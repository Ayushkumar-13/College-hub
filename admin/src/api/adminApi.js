import axiosInstance from './axios';

const withCollege = (collegeId, config = {}) => {
  if (!collegeId) return config;
  return {
    ...config,
    params: { ...config.params, collegeId },
    headers: { ...config.headers, 'x-college-id': collegeId },
  };
};

export const adminApi = {
  getDashboard: (collegeId) =>
    axiosInstance.get('/admin/dashboard', withCollege(collegeId)).then((r) => r.data),

  getColleges: () => axiosInstance.get('/admin/colleges').then((r) => r.data),
  getCollege: (id) => axiosInstance.get(`/admin/colleges/${id}`).then((r) => r.data),
  patchCollege: (id, data) => axiosInstance.patch(`/admin/colleges/${id}`, data).then((r) => r.data),
  createCollege: (data) => axiosInstance.post('/admin/colleges', data).then((r) => r.data),
  updateCollegeOwnerAccount: (id, data) =>
    axiosInstance.patch(`/admin/colleges/${id}/owner-account`, data).then((r) => r.data),
  updateMyOwnerAccount: (data) =>
    axiosInstance.patch('/admin/college/owner-account', data).then((r) => r.data),
  updateCollege: (id, data) => axiosInstance.put(`/admin/colleges/${id}`, data).then((r) => r.data),
  deleteCollege: (id) => axiosInstance.delete(`/admin/colleges/${id}`).then((r) => r.data),

  getCourses: (collegeId) =>
    axiosInstance.get('/admin/courses', withCollege(collegeId)).then((r) => r.data),
  createCourse: (collegeId, data) =>
    axiosInstance.post('/admin/courses', data, withCollege(collegeId)).then((r) => r.data),
  updateCourse: (collegeId, id, data) =>
    axiosInstance.put(`/admin/courses/${id}`, data, withCollege(collegeId)).then((r) => r.data),
  deleteCourse: (collegeId, id) =>
    axiosInstance.delete(`/admin/courses/${id}`, withCollege(collegeId)).then((r) => r.data),

  getBranches: (collegeId, courseId) =>
    axiosInstance
      .get('/admin/branches', withCollege(collegeId, { params: { courseId } }))
      .then((r) => r.data),
  createBranch: (collegeId, data) =>
    axiosInstance.post('/admin/branches', data, withCollege(collegeId)).then((r) => r.data),
  updateBranch: (collegeId, id, data) =>
    axiosInstance.put(`/admin/branches/${id}`, data, withCollege(collegeId)).then((r) => r.data),
  deleteBranch: (collegeId, id) =>
    axiosInstance.delete(`/admin/branches/${id}`, withCollege(collegeId)).then((r) => r.data),

  getSections: (collegeId, filters = {}) =>
    axiosInstance
      .get('/admin/sections', withCollege(collegeId, { params: filters }))
      .then((r) => r.data),
  createSection: (collegeId, data) =>
    axiosInstance.post('/admin/sections', data, withCollege(collegeId)).then((r) => r.data),
  updateSection: (collegeId, id, data) =>
    axiosInstance.put(`/admin/sections/${id}`, data, withCollege(collegeId)).then((r) => r.data),
  assignCoordinator: (collegeId, sectionId, userId) =>
    axiosInstance
      .patch(`/admin/sections/${sectionId}/coordinator`, { userId }, withCollege(collegeId))
      .then((r) => r.data),
  removeCoordinator: (collegeId, sectionId) =>
    axiosInstance
      .delete(`/admin/sections/${sectionId}/coordinator`, withCollege(collegeId))
      .then((r) => r.data),
  deleteSection: (collegeId, id) =>
    axiosInstance.delete(`/admin/sections/${id}`, withCollege(collegeId)).then((r) => r.data),

  getYears: (collegeId) =>
    axiosInstance.get('/admin/years', withCollege(collegeId)).then((r) => r.data),
  getCurrentSession: (collegeId) =>
    axiosInstance.get('/admin/years/current', withCollege(collegeId)).then((r) => r.data),
  createYear: (collegeId, data) =>
    axiosInstance.post('/admin/years', data, withCollege(collegeId)).then((r) => r.data),
  setCurrentSession: (collegeId, sessionId) =>
    axiosInstance.patch(`/admin/years/${sessionId}/set-current`, {}, withCollege(collegeId)).then((r) => r.data),
  promoteStudents: (collegeId, toSessionId, data) =>
    axiosInstance.post(`/admin/years/${toSessionId}/promote-students`, data, withCollege(collegeId)).then((r) => r.data),
  deleteYear: (collegeId, id) =>
    axiosInstance.delete(`/admin/years/${id}`, withCollege(collegeId)).then((r) => r.data),

  getSectionStudents: (collegeId, sectionId) =>
    axiosInstance.get(`/admin/sections/${sectionId}/students`, withCollege(collegeId)).then((r) => r.data),

  getCategories: (collegeId) =>
    axiosInstance.get('/admin/categories', withCollege(collegeId)).then((r) => r.data),
  getProblemCategories: (collegeId) =>
    axiosInstance.get('/admin/categories', withCollege(collegeId)).then((r) => r.data),
  createCategory: (collegeId, data) =>
    axiosInstance.post('/admin/categories', data, withCollege(collegeId)).then((r) => r.data),
  createProblemCategory: (collegeId, data) =>
    axiosInstance.post('/admin/categories', data, withCollege(collegeId)).then((r) => r.data),
  deleteCategory: (collegeId, id) =>
    axiosInstance.delete(`/admin/categories/${id}`, withCollege(collegeId)).then((r) => r.data),

  getStudentCredentials: (collegeId, status) =>
    axiosInstance
      .get('/admin/students', withCollege(collegeId, { params: status ? { status } : {} }))
      .then((r) => r.data),
  createStudentCredential: (collegeId, data) =>
    axiosInstance.post('/admin/students', data, withCollege(collegeId)).then((r) => r.data),
  updateStudentCredential: (collegeId, id, data) =>
    axiosInstance.patch(`/admin/students/${id}`, data, withCollege(collegeId)).then((r) => r.data),
  deactivateStudent: (collegeId, id) =>
    axiosInstance.patch(`/admin/students/${id}/deactivate`, {}, withCollege(collegeId)).then((r) => r.data),
  deleteStudentCredential: (collegeId, id) =>
    axiosInstance.delete(`/admin/students/${id}`, withCollege(collegeId)).then((r) => r.data),

  createUser: (collegeId, data) =>
    axiosInstance.post('/admin/users', data, withCollege(collegeId)).then((r) => r.data),

  getUsers: (collegeId, params = {}) =>
    axiosInstance
      .get('/admin/users', withCollege(collegeId, { params }))
      .then((r) => r.data),
  promoteAdmin: (collegeId, userId) =>
    axiosInstance
      .patch(`/admin/users/${userId}/promote-admin`, {}, withCollege(collegeId))
      .then((r) => r.data),
  demoteAdmin: (collegeId, userId, revertRole) =>
    axiosInstance
      .patch(`/admin/users/${userId}/demote-admin`, { revertRole }, withCollege(collegeId))
      .then((r) => r.data),
  deactivateUser: (collegeId, userId) =>
    axiosInstance
      .patch(`/admin/users/${userId}/deactivate`, {}, withCollege(collegeId))
      .then((r) => r.data),
  deleteUser: (collegeId, userId) =>
    axiosInstance.delete(`/admin/users/${userId}`, withCollege(collegeId)).then((r) => r.data),

  getAssignments: (collegeId) =>
    axiosInstance.get('/admin/assignments', withCollege(collegeId)).then((r) => r.data),
  createAssignment: (collegeId, data) =>
    axiosInstance.post('/admin/assignments', data, withCollege(collegeId)).then((r) => r.data),
  assignHOD: (collegeId, data) =>
    axiosInstance.post('/admin/assignments/hod', data, withCollege(collegeId)).then((r) => r.data),
  removeHOD: (collegeId, branchId) =>
    axiosInstance.delete('/admin/assignments/hod', { ...withCollege(collegeId), data: { branchId } }).then((r) => r.data),
  assignDirector: (collegeId, userId) =>
    axiosInstance.post('/admin/assignments/director', { userId }, withCollege(collegeId)).then((r) => r.data),
  removeDirector: (collegeId) =>
    axiosInstance.delete('/admin/assignments/director', withCollege(collegeId)).then((r) => r.data),
  assignDomainSolver: (collegeId, data) =>
    axiosInstance.post('/admin/assignments/domain', data, withCollege(collegeId)).then((r) => r.data),
  removeDomainSolver: (collegeId, categoryId) =>
    axiosInstance
      .delete('/admin/assignments/domain', { ...withCollege(collegeId), data: { categoryId } })
      .then((r) => r.data),
  deleteAssignment: (collegeId, id) =>
    axiosInstance.delete(`/admin/assignments/${id}`, withCollege(collegeId)).then((r) => r.data),
};
