import Assignment from '../models/Assignment.js';
import DomainAssignment from '../models/DomainAssignment.js';
import User from '../models/User.js';
import Section from '../models/Section.js';
import Branch from '../models/Branch.js';
import College from '../models/College.js';

async function getCollegeDirector(collegeId) {
  const college = await College.findById(collegeId);
  if (college?.directorId) {
    return User.findById(college.directorId);
  }
  const assignment = await Assignment.findOne({ collegeId, type: 'Director' }).populate('userId');
  return assignment?.userId || null;
}

async function getCollegeOwner(collegeId) {
  const college = await College.findById(collegeId);
  if (college?.ownerId) {
    return User.findById(college.ownerId);
  }
  return User.findOne({ collegeId, role: 'Owner' });
}

async function getDomainSolver(collegeId, categoryId) {
  if (!categoryId) return null;
  const domain = await DomainAssignment.findOne({
    collegeId,
    categoryId,
    isActive: true,
  }).populate('solverId');
  if (domain?.solverId) return domain.solverId;

  const assignment = await Assignment.findOne({
    collegeId,
    type: 'DomainSolver',
    problemCategoryId: categoryId,
  }).populate('userId');
  return assignment?.userId || null;
}

async function getBranchHOD(branchId) {
  const branch = await Branch.findById(branchId);
  if (branch?.hodId) {
    return User.findById(branch.hodId);
  }
  const assignment = await Assignment.findOne({ branchId, type: 'HOD' }).populate('userId');
  return assignment?.userId || null;
}

async function getSectionCoordinator(sectionId) {
  const section = await Section.findById(sectionId).populate('coordinatorId');
  if (section?.coordinatorId) return section.coordinatorId;

  const assignment = await Assignment.findOne({
    sectionId,
    type: 'SectionCoordinator',
  }).populate('userId');
  return assignment?.userId || null;
}

async function getStudentCoordinator(student) {
  if (!student) return null;
  if (student.sectionId) {
    return getSectionCoordinator(student.sectionId);
  }
  const assignment = await Assignment.findOne({
    studentId: student._id,
    type: 'SectionCoordinator',
  }).populate('userId');
  return assignment?.userId || null;
}

async function getCoordinatorStudents(facultyUserId) {
  const sectionIds = await Section.find({ coordinatorId: facultyUserId }).distinct('_id');
  const studentsFromSections = sectionIds.length
    ? await User.find({ role: 'Student', sectionId: { $in: sectionIds }, isActive: { $ne: false } })
        .populate('branchId', 'name code')
        .populate('sectionId', 'name year')
    : [];

  const assignments = await Assignment.find({
    userId: facultyUserId,
    type: 'SectionCoordinator',
  })
    .populate({
      path: 'studentId',
      select: 'name email avatar rollNumber year',
      populate: [
        { path: 'branchId', select: 'name code' },
        { path: 'sectionId', select: 'name year' },
      ],
    });

  const fromAssignments = assignments.map((a) => a.studentId).filter(Boolean);
  const seen = new Set();
  return [...studentsFromSections, ...fromAssignments].filter((s) => {
    const id = s._id?.toString();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

async function getUserAssignments(userId) {
  const [assignments, coordinatedSections, hodBranches, domains] = await Promise.all([
    Assignment.find({ userId })
      .populate('sectionId', 'name year branchId courseId')
      .populate('branchId', 'name code')
      .populate('problemCategoryId', 'name')
      .populate('studentId', 'name rollNumber email')
      .populate('collegeId', 'name code')
      .lean(),
    Section.find({ coordinatorId: userId }).populate('branchId', 'name code').lean(),
    Branch.find({ hodId: userId }).populate('courseId', 'name code').lean(),
    DomainAssignment.find({ solverId: userId, isActive: true })
      .populate('categoryId', 'name')
      .lean(),
  ]);

  return {
    assignments,
    coordinatedSections,
    hodBranches,
    domainCategories: domains,
  };
}

async function resolveEscalationChain({ collegeId, branchId, sectionId, categoryId }) {
  const [coordinator, hod, domainSolver, director, owner] = await Promise.all([
    sectionId ? getSectionCoordinator(sectionId) : null,
    branchId ? getBranchHOD(branchId) : null,
    categoryId ? getDomainSolver(collegeId, categoryId) : null,
    getCollegeDirector(collegeId),
    getCollegeOwner(collegeId),
  ]);

  return { coordinator, hod, domainSolver, director, owner };
}

export {
  getCollegeDirector,
  getCollegeOwner,
  getDomainSolver,
  getBranchHOD,
  getSectionCoordinator,
  getStudentCoordinator,
  getCoordinatorStudents,
  getUserAssignments,
  resolveEscalationChain,
};
