import Assignment from '../models/Assignment.js';
import DomainAssignment from '../models/DomainAssignment.js';
import Section from '../models/Section.js';
import Branch from '../models/Branch.js';
import User from '../models/User.js';
import { isAdminRole } from './userHelpers.js';

async function buildIssueVisibilityFilter(user) {
  if (!user) return { _id: null };

  if (user.role === 'SuperAdmin') {
    return {};
  }

  if (!user.collegeId) {
    return { _id: null };
  }

  const collegeFilter = { collegeId: user.collegeId };

  if (user.role === 'Student') {
    return { ...collegeFilter, userId: user._id };
  }

  if (isAdminRole(user.role) || user.role === 'Owner') {
    return collegeFilter;
  }

  if (user.role === 'Director') {
    return {
      ...collegeFilter,
      $or: [
        { directorId: user._id },
        { currentAssigneeId: user._id },
        { assignedTo: user._id },
      ],
    };
  }

  const coordinatedSections = await Section.find({ coordinatorId: user._id }).distinct('_id');
  const hodBranches = await Branch.find({ hodId: user._id }).distinct('_id');
  const domainCategories = await DomainAssignment.find({ solverId: user._id, isActive: true }).distinct('categoryId');
  const legacyAssignments = await Assignment.find({ userId: user._id }).lean();

  const orClauses = [
    { currentAssigneeId: user._id },
    { assignedTo: user._id },
    { coordinatorId: user._id },
    { hodId: user._id },
    { domainSolverId: user._id },
  ];

  if (coordinatedSections.length) {
    const studentsInSections = await User.find({
      role: 'Student',
      sectionId: { $in: coordinatedSections },
    }).distinct('_id');
    if (studentsInSections.length) {
      orClauses.push({ userId: { $in: studentsInSections } });
    }
  }

  if (hodBranches.length) {
    const studentsInBranches = await User.find({
      role: 'Student',
      branchId: { $in: hodBranches },
    }).distinct('_id');
    if (studentsInBranches.length) {
      orClauses.push({ userId: { $in: studentsInBranches } });
    }
  }

  if (domainCategories.length) {
    orClauses.push({
      $or: [
        { categoryId: { $in: domainCategories } },
        { problemCategoryId: { $in: domainCategories } },
      ],
    });
  }

  for (const a of legacyAssignments) {
    if (a.type === 'SectionCoordinator' && a.studentId) {
      orClauses.push({ userId: a.studentId });
    }
    if (a.type === 'HOD' && a.branchId) {
      const branchStudents = await User.find({
        role: 'Student',
        branchId: a.branchId,
      }).distinct('_id');
      if (branchStudents.length) orClauses.push({ userId: { $in: branchStudents } });
    }
    if (a.type === 'DomainSolver' && a.problemCategoryId) {
      orClauses.push({ problemCategoryId: a.problemCategoryId });
      orClauses.push({ categoryId: a.problemCategoryId });
    }
  }

  return { ...collegeFilter, $or: orClauses };
}

export { buildIssueVisibilityFilter };
