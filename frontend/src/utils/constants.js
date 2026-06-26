/*
 * FILE: frontend/src/utils/constants.js
 * PURPOSE: Application constants
 */

export const USER_ROLES = {
  STUDENT: 'Student',
  FACULTY: 'Faculty',
  STAFF: 'Staff',
  OWNER: 'Owner',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'SuperAdmin',
};

export const ASSIGNMENT_TYPES = {
  SECTION_COORDINATOR: 'SectionCoordinator',
  HOD: 'HOD',
  DIRECTOR: 'Director',
  DOMAIN_SOLVER: 'DomainSolver',
};

export const ASSIGNMENT_LABELS = {
  SectionCoordinator: 'Student Coordinator',
  HOD: 'HOD',
  Director: 'Director',
  DomainSolver: 'Domain Problem Solver',
};

export const ISSUE_STATUS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

export const POST_FILTERS = {
  ALL: 'all',
};

export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  MESSAGE: 'message',
  ISSUE: 'issue',
  POST: 'post',
};

export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024,
  MAX_FILES: 5,
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  STUDENT_LOGIN: '/login/student',
  MESSAGES: '/messages',
  ISSUES: '/issues',
  CONTACTS: '/contacts',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
};

export const ADMIN_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.OWNER,
  USER_ROLES.ADMIN,
];

export function isAdminUser(user) {
  return user && ADMIN_ROLES.includes(user.role);
}

export const ESCALATION_LEVELS = {
  coordinator: 'Section Coordinator',
  hod: 'HOD',
  domainSolver: 'Domain Solver',
  director: 'Director',
  owner: 'Owner',
  resolved: 'Resolved',
};

export function formatEscalationLevel(level) {
  return ESCALATION_LEVELS[level] || level || 'Unknown';
}

export function canUpdateIssueStatus(user, issue) {
  if (!user || !issue) return false;
  const assigneeId = issue.currentAssigneeId?._id || issue.currentAssigneeId
    || issue.assignedTo?._id || issue.assignedTo;
  const userId = user._id || user.id;
  if (assigneeId && assigneeId.toString() === userId?.toString()) return true;
  return ADMIN_ROLES.includes(user.role);
}

export function canEscalateIssue(user, issue) {
  if (!user || !issue || issue.status === 'Resolved') return false;
  if (issue.escalationLevel === 'owner' || issue.escalationLevel === 'resolved') return false;
  return canUpdateIssueStatus(user, issue);
}

export function semesterOptionsForYear(year) {
  const y = Number(year);
  if (!y || y < 1) return [];
  return [(y - 1) * 2 + 1, (y - 1) * 2 + 2];
}

export function toStoredSemester(year, absoluteSemester) {
  const sem = Number(absoluteSemester);
  const y = Number(year);
  if (!y || !sem) return sem;
  if (sem <= 2 && y === 1) return sem;
  return ((sem - 1) % 2) + 1;
}
