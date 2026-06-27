/** Shared helpers for the contacts directory. */

export const CONTACT_ROLE_ORDER = ['Faculty', 'Staff', 'Student', 'Admin', 'Owner'];

export const CONTACT_FILTER_ROLES = [
  { value: 'all', label: 'All Roles' },
  { value: 'Faculty', label: 'Faculty' },
  { value: 'Staff', label: 'Staff' },
  { value: 'Student', label: 'Student' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Owner', label: 'Owner' },
];

import { hasUserAvatar } from './avatarHelpers';

export function getContactAvatar(user) {
  return hasUserAvatar(user?.avatar) ? user.avatar : null;
}

export function getContactId(user) {
  return user?._id || user?.id;
}

export function formatContactSubtitle(user) {
  const role = user?.role || 'User';
  const dept = user?.department?.trim();
  return dept ? `${role} • ${dept}` : `${role} • —`;
}
