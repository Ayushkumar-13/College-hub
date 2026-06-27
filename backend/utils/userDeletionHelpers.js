/**
 * Permanent user account removal for college admin operations.
 * Revokes roles, cleans related records, then deletes the user document.
 */

import User from '../models/User.js';
import StudentCredential from '../models/StudentCredential.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';
import Post from '../models/Post.js';
import Issue from '../models/Issue.js';
import Assignment from '../models/Assignment.js';
import { revokeAllUserAssignments } from './designationHelpers.js';

const PROTECTED_ROLES = ['Owner', 'SuperAdmin'];

export class UserDeletionError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'UserDeletionError';
    this.statusCode = statusCode;
  }
}

export function assertCanDeleteUser(actor, target) {
  if (!actor) throw new UserDeletionError('Unauthorized', 401);
  if (!target) throw new UserDeletionError('User not found', 404);

  if (!['Owner', 'SuperAdmin'].includes(actor.role)) {
    throw new UserDeletionError('Only the college Owner or Super Admin can permanently delete users', 403);
  }

  if (PROTECTED_ROLES.includes(target.role)) {
    throw new UserDeletionError(`Cannot delete a ${target.role} account`, 400);
  }

  if (actor._id.toString() === target._id.toString()) {
    throw new UserDeletionError('You cannot delete your own account from the admin panel', 400);
  }

  if (actor.role !== 'SuperAdmin' && target.collegeId?.toString() !== actor.collegeId?.toString()) {
    throw new UserDeletionError('User does not belong to your college', 403);
  }
}

async function clearUserFromSocialGraph(userId) {
  await User.updateMany(
    { $or: [{ followers: userId }, { following: userId }] },
    { $pull: { followers: userId, following: userId } }
  );
}

async function clearUserCommunication(userId) {
  await Promise.all([
    Notification.deleteMany({ $or: [{ userId }, { fromUser: userId }] }),
    Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }),
    Post.deleteMany({ userId }),
  ]);
}

async function clearUserFromIssues(userId, collegeId) {
  await Issue.deleteMany({ collegeId, userId });

  const assigneeFilter = {
    collegeId,
    $or: [
      { assignedTo: userId },
      { currentAssigneeId: userId },
      { coordinatorId: userId },
      { hodId: userId },
      { domainSolverId: userId },
      { directorId: userId },
      { ownerId: userId },
      { escalatedTo: userId },
    ],
  };

  await Issue.updateMany(assigneeFilter, {
    $set: {
      assignedTo: null,
      currentAssigneeId: null,
      coordinatorId: null,
      hodId: null,
      domainSolverId: null,
      directorId: null,
      ownerId: null,
      escalatedTo: null,
    },
  });
}

async function clearStudentLinks(userId, collegeId) {
  await Promise.all([
    StudentCredential.deleteMany({ collegeId, userId }),
    Assignment.deleteMany({ collegeId, studentId: userId }),
  ]);
}

/**
 * Permanently delete a college user and related personal data.
 */
export async function deleteCollegeUserAccount(userId, collegeId, actor) {
  const target = await User.findOne({ _id: userId, collegeId });
  if (!target) throw new UserDeletionError('User not found', 404);

  assertCanDeleteUser(actor, target);

  await revokeAllUserAssignments(userId, collegeId);
  await clearUserFromSocialGraph(userId);
  await clearUserCommunication(userId);
  await clearUserFromIssues(userId, collegeId);
  await clearStudentLinks(userId, collegeId);

  await User.findByIdAndDelete(userId);

  return {
    message: `${target.name} has been permanently deleted`,
    deletedUserId: userId,
    role: target.role,
  };
}

/**
 * Delete a student credential; removes linked user account when activated.
 */
export async function deleteStudentCredentialRecord(credentialId, collegeId, actor) {
  const credential = await StudentCredential.findOne({ _id: credentialId, collegeId });
  if (!credential) throw new UserDeletionError('Student not found', 404);

  if (!['Owner', 'SuperAdmin'].includes(actor.role)) {
    throw new UserDeletionError('Only the college Owner or Super Admin can permanently delete students', 403);
  }

  const linkedUserId = credential.userId;

  await StudentCredential.findByIdAndDelete(credentialId);

  if (linkedUserId) {
    const linkedUser = await User.findOne({ _id: linkedUserId, collegeId, role: 'Student' });
    if (linkedUser) {
      await deleteCollegeUserAccount(linkedUser._id, collegeId, actor);
    }
  }

  return {
    message: `Student ${credential.name} (${credential.rollNumber}) has been permanently deleted`,
    rollNumber: credential.rollNumber,
  };
}
