import User from '../models/User.js';
import Assignment from '../models/Assignment.js';
import Branch from '../models/Branch.js';

async function formatUser(user, { includeAssignments = false } = {}) {
  if (!user) return null;

  const obj = user.toObject ? user.toObject() : { ...user };

  const formatted = {
    id: obj._id,
    _id: obj._id,
    name: obj.name,
    email: obj.email,
    phone: obj.phone,
    role: obj.role,
    collegeId: obj.collegeId,
    courseId: obj.courseId,
    branchId: obj.branchId,
    year: obj.year,
    sectionId: obj.sectionId,
    rollNumber: obj.rollNumber,
    designation: obj.designation,
    employeeId: obj.employeeId,
    isActive: obj.isActive !== false,
    department: obj.department,
    bio: obj.bio,
    avatar: obj.avatar,
    followers: Array.isArray(obj.followers) ? obj.followers.length : obj.followers || 0,
    following: Array.isArray(obj.following) ? obj.following.length : obj.following || 0,
    createdAt: obj.createdAt,
  };

  if (includeAssignments && obj._id) {
    formatted.assignments = await Assignment.find({ userId: obj._id })
      .populate('sectionId', 'name year')
      .populate('branchId', 'name code')
      .populate('problemCategoryId', 'name')
      .lean();
  }

  return formatted;
}

async function setDepartmentFromBranch(userData) {
  if (userData.branchId && !userData.department) {
    const branch = await Branch.findById(userData.branchId);
    if (branch) userData.department = branch.name;
  }
  return userData;
}

function isAdminRole(role) {
  return ['SuperAdmin', 'Owner', 'Admin'].includes(role);
}

async function getCollegeScope(req) {
  const user = await User.findById(req.user.id);
  if (!user) return null;

  if (user.role === 'SuperAdmin') {
    return req.query.collegeId || req.body.collegeId || req.headers['x-college-id'] || null;
  }

  return user.collegeId ? user.collegeId.toString() : null;
}

export {
  formatUser,
  setDepartmentFromBranch,
  isAdminRole,
  getCollegeScope,
};
