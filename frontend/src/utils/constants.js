/*
 * FILE: frontend/src/utils/constants.js
 * LOCATION: college-social-platform/frontend/src/utils/constants.js
 * PURPOSE: Application constants
 */

export const USER_ROLES = {
  STUDENT: 'Student',
  FACULTY: 'Faculty',
  STAFF: 'Staff',
  DIRECTOR: 'Director',
  OWNER : 'Owner',
  HOD : 'HOD',
};

export const ISSUE_STATUS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved'
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
  POST: 'post'
};

export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 5
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  MESSAGES: '/messages',
  ISSUES: '/issues',
  CONTACTS: '/contacts',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile'
};