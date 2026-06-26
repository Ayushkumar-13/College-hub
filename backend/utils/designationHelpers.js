import Assignment from '../models/Assignment.js';
import DomainAssignment from '../models/DomainAssignment.js';
import User from '../models/User.js';
import Section from '../models/Section.js';
import Branch from '../models/Branch.js';
import College from '../models/College.js';

export const RESPONSIBILITY_LABELS = {
  Director: 'Director',
  HOD: 'Head of Department',
  SectionCoordinator: 'Section Coordinator',
  DomainSolver: 'Domain Problem Solver',
};

const RESPONSIBILITY_PRIORITY = ['Director', 'HOD', 'SectionCoordinator', 'DomainSolver'];

function isResponsibilityLabel(designation) {
  if (!designation) return false;
  return Object.values(RESPONSIBILITY_LABELS).includes(designation);
}

async function getUserResponsibilities(userId, collegeId) {
  const uid = userId.toString();
  const types = [];

  const college = await College.findById(collegeId).select('directorId');
  if (college?.directorId?.toString() === uid) types.push('Director');

  const [hodCount, coordCount, domainCount] = await Promise.all([
    Branch.countDocuments({ collegeId, hodId: userId }),
    Section.countDocuments({ collegeId, coordinatorId: userId }),
    DomainAssignment.countDocuments({ collegeId, solverId: userId, isActive: true }),
  ]);

  if (hodCount > 0) types.push('HOD');
  if (coordCount > 0) types.push('SectionCoordinator');
  if (domainCount > 0) types.push('DomainSolver');

  return types;
}

export async function syncUserDesignation(userId, collegeId) {
  if (!userId || !collegeId) return null;

  const user = await User.findOne({ _id: userId, collegeId });
  if (!user || user.role === 'Student') return null;

  const responsibilities = await getUserResponsibilities(userId, collegeId);
  const primary = RESPONSIBILITY_PRIORITY.find((type) => responsibilities.includes(type));

  if (primary) {
    if (user.designation && !isResponsibilityLabel(user.designation) && !user.baseDesignation) {
      user.baseDesignation = user.designation;
    }
    user.designation = RESPONSIBILITY_LABELS[primary];
  } else if (user.baseDesignation) {
    user.designation = user.baseDesignation;
    user.baseDesignation = null;
  } else if (isResponsibilityLabel(user.designation)) {
    user.designation = null;
  }

  await user.save();
  return user;
}

export async function assignHODToBranch({ collegeId, branchId, userId, assignedBy }) {
  const branch = await Branch.findOne({ _id: branchId, collegeId });
  if (!branch) throw new Error('Branch not found');

  const faculty = await User.findOne({ _id: userId, collegeId, role: 'Faculty' });
  if (!faculty) throw new Error('HOD must be Faculty');

  const previousHodId = branch.hodId?.toString() || null;
  const newUserId = userId.toString();

  branch.hodId = userId;
  await branch.save();

  await Assignment.findOneAndUpdate(
    { branchId, type: 'HOD' },
    { userId, collegeId, branchId, type: 'HOD', assignedBy },
    { upsert: true, new: true }
  );

  if (previousHodId && previousHodId !== newUserId) {
    await syncUserDesignation(previousHodId, collegeId);
  }
  await syncUserDesignation(newUserId, collegeId);

  return { branch, previousHodId };
}

export async function removeHODFromBranch({ collegeId, branchId }) {
  const branch = await Branch.findOne({ _id: branchId, collegeId });
  if (!branch) throw new Error('Branch not found');

  const previousHodId = branch.hodId?.toString() || null;
  branch.hodId = null;
  await branch.save();
  await Assignment.findOneAndDelete({ branchId, type: 'HOD' });

  if (previousHodId) {
    await syncUserDesignation(previousHodId, collegeId);
  }

  return { previousHodId };
}

export async function assignDirector({ collegeId, userId, assignedBy }) {
  const user = await User.findOne({
    _id: userId,
    collegeId,
    role: { $in: ['Faculty', 'Staff', 'Admin'] },
  });
  if (!user) throw new Error('Director must be Faculty, Staff, or Admin');

  const college = await College.findById(collegeId).select('directorId');
  const previousDirectorId = college?.directorId?.toString() || null;
  const newUserId = userId.toString();

  await College.findByIdAndUpdate(collegeId, { directorId: userId });
  await Assignment.findOneAndUpdate(
    { collegeId, type: 'Director' },
    { userId, collegeId, type: 'Director', assignedBy },
    { upsert: true, new: true }
  );

  if (previousDirectorId && previousDirectorId !== newUserId) {
    await syncUserDesignation(previousDirectorId, collegeId);
  }
  await syncUserDesignation(newUserId, collegeId);

  return { previousDirectorId };
}

export async function removeDirector({ collegeId }) {
  const college = await College.findById(collegeId).select('directorId');
  const previousDirectorId = college?.directorId?.toString() || null;

  await College.findByIdAndUpdate(collegeId, { directorId: null });
  await Assignment.findOneAndDelete({ collegeId, type: 'Director' });

  if (previousDirectorId) {
    await syncUserDesignation(previousDirectorId, collegeId);
  }

  return { previousDirectorId };
}

export async function assignSectionCoordinator({ collegeId, sectionId, userId, assignedBy }) {
  const faculty = await User.findOne({ _id: userId, collegeId, role: 'Faculty' });
  if (!faculty) throw new Error('Coordinator must be Faculty');

  const section = await Section.findOne({ _id: sectionId, collegeId });
  if (!section) throw new Error('Section not found');

  const previousCoordinatorId = section.coordinatorId?.toString() || null;
  const newUserId = userId.toString();

  section.coordinatorId = userId;
  await section.save();

  await Assignment.findOneAndUpdate(
    { sectionId, type: 'SectionCoordinator' },
    {
      userId,
      collegeId,
      type: 'SectionCoordinator',
      sectionId,
      branchId: section.branchId,
      courseId: section.courseId,
      sessionId: section.sessionId,
      year: section.year,
      semester: section.semester,
      assignedBy,
    },
    { upsert: true, new: true }
  );

  if (previousCoordinatorId && previousCoordinatorId !== newUserId) {
    await syncUserDesignation(previousCoordinatorId, collegeId);
  }
  await syncUserDesignation(newUserId, collegeId);

  return { section, previousCoordinatorId };
}

export async function removeSectionCoordinator({ collegeId, sectionId }) {
  const section = await Section.findOne({ _id: sectionId, collegeId });
  if (!section) throw new Error('Section not found');

  const previousCoordinatorId = section.coordinatorId?.toString() || null;
  section.coordinatorId = null;
  await section.save();
  await Assignment.findOneAndDelete({ sectionId, type: 'SectionCoordinator' });

  if (previousCoordinatorId) {
    await syncUserDesignation(previousCoordinatorId, collegeId);
  }

  return { previousCoordinatorId };
}

export async function assignDomainSolver({ collegeId, userId, categoryId, assignedBy }) {
  const user = await User.findOne({
    _id: userId,
    collegeId,
    role: { $in: ['Faculty', 'Staff', 'Admin'] },
  });
  if (!user) throw new Error('Solver must be Faculty, Staff, or Admin');

  const existing = await DomainAssignment.findOne({ collegeId, categoryId }).select('solverId');
  const previousSolverId = existing?.solverId?.toString() || null;
  const newUserId = userId.toString();

  await DomainAssignment.findOneAndUpdate(
    { collegeId, categoryId },
    { solverId: userId, isActive: true },
    { upsert: true, new: true }
  );

  await Assignment.findOneAndUpdate(
    { collegeId, type: 'DomainSolver', problemCategoryId: categoryId },
    {
      userId,
      collegeId,
      type: 'DomainSolver',
      problemCategoryId: categoryId,
      assignedBy,
    },
    { upsert: true, new: true }
  );

  if (previousSolverId && previousSolverId !== newUserId) {
    await syncUserDesignation(previousSolverId, collegeId);
  }
  await syncUserDesignation(newUserId, collegeId);

  return { previousSolverId };
}

export async function removeDomainSolver({ collegeId, categoryId }) {
  const existing = await DomainAssignment.findOne({ collegeId, categoryId }).select('solverId');
  const previousSolverId = existing?.solverId?.toString() || null;

  await DomainAssignment.findOneAndUpdate({ collegeId, categoryId }, { isActive: false });
  await Assignment.findOneAndDelete({
    collegeId,
    type: 'DomainSolver',
    problemCategoryId: categoryId,
  });

  if (previousSolverId) {
    await syncUserDesignation(previousSolverId, collegeId);
  }

  return { previousSolverId };
}

export async function revokeAllUserAssignments(userId, collegeId) {
  await Promise.all([
    Branch.updateMany({ collegeId, hodId: userId }, { hodId: null }),
    Section.updateMany({ collegeId, coordinatorId: userId }, { coordinatorId: null }),
    College.updateMany({ _id: collegeId, directorId: userId }, { directorId: null }),
    DomainAssignment.updateMany({ collegeId, solverId: userId }, { isActive: false }),
    Assignment.deleteMany({ collegeId, userId }),
  ]);

  await syncUserDesignation(userId, collegeId);
}

export async function revokeAssignmentRecord(assignment, collegeId) {
  const { userId, type, branchId, sectionId, problemCategoryId } = assignment;

  if (type === 'HOD' && branchId) {
    await Branch.findOneAndUpdate({ _id: branchId, hodId: userId }, { hodId: null });
  }
  if (type === 'SectionCoordinator' && sectionId) {
    await Section.findOneAndUpdate({ _id: sectionId, coordinatorId: userId }, { coordinatorId: null });
  }
  if (type === 'Director') {
    await College.findByIdAndUpdate(collegeId, { directorId: null });
  }
  if (type === 'DomainSolver' && problemCategoryId) {
    await DomainAssignment.findOneAndUpdate(
      { collegeId, categoryId: problemCategoryId },
      { isActive: false }
    );
  }

  await syncUserDesignation(userId, collegeId);
}
