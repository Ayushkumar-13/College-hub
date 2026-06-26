/*
 * FILE: backend/utils/issueEscalation.js
 * PURPOSE: Shared escalation logic for issues
 */

import Issue from '../models/Issue.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import ProblemCategory from '../models/ProblemCategory.js';
import { resolveEscalationChain } from './assignmentHelpers.js';

const ESCALATION_CHAIN = ['coordinator', 'hod', 'domainSolver', 'director', 'owner'];

const LEVEL_DELAY_MS = process.env.NODE_ENV === 'production'
  ? (Number(process.env.ESCALATION_DELAY_HOURS) || 24) * 60 * 60 * 1000
  : (Number(process.env.ESCALATION_DELAY_MINUTES) || 2) * 60 * 1000;

function formatFullDate(date) {
  try {
    const optsDate = { month: 'long', day: 'numeric', year: 'numeric' };
    const datePart = new Date(date).toLocaleDateString('en-US', optsDate);
    const timePart = new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${datePart} at ${timePart}`;
  } catch {
    return new Date(date).toString();
  }
}

function buildIssueMessage({ title, description, categoryName, reporterName, date }) {
  const categoryLabel = categoryName ? `*Category:* ${categoryName}\n\n` : '';
  return (
    `📋 *New Issue Assigned to You*\n\n` +
    `*Title:* ${title}\n\n` +
    categoryLabel +
    `*Description:*\n${description}\n\n` +
    `*Status:* Open\n\n` +
    `*Reported by:* ${reporterName}\n\n` +
    `*Date:* ${formatFullDate(date)}\n\n\n` +
    `Please review this issue and take necessary action.`
  );
}

function getNextLevel(currentLevel) {
  const idx = ESCALATION_CHAIN.indexOf(currentLevel);
  if (idx === -1 || idx >= ESCALATION_CHAIN.length - 1) return null;
  return ESCALATION_CHAIN[idx + 1];
}

function getAssigneeForLevel(issue, level) {
  const map = {
    coordinator: issue.coordinatorId,
    hod: issue.hodId,
    domainSolver: issue.domainSolverId,
    director: issue.directorId,
    owner: issue.ownerId,
  };
  return map[level];
}

async function forwardIssueMessage({ io, issue, originalMsg, receiverId, levelLabel }) {
  const forwarded = await Message.create({
    senderId: originalMsg.senderId._id || originalMsg.senderId,
    receiverId,
    text: originalMsg.text,
    media: originalMsg.media || [],
    issueId: issue._id,
    isOriginalIssueMessage: false,
    autoForwarded: true,
    forwardCount: (originalMsg.forwardCount || 0) + 1,
    originalMessageId: originalMsg._id,
    status: 'delivered',
  });

  await forwarded.populate('senderId', 'name avatar email');
  await forwarded.populate('receiverId', 'name avatar email');

  io.to(`user:${receiverId}`).emit('message:new', forwarded.toObject());

  const senderId = originalMsg.senderId._id || originalMsg.senderId;
  io.to(`user:${senderId}`).emit('message:escalated', {
    issueId: issue._id,
    escalatedTo: levelLabel,
    receiverId,
    message: forwarded,
  });

  io.emit('issue:escalated', {
    issueId: issue._id,
    title: issue.title,
    escalatedTo: levelLabel,
  });

  await Notification.create({
    userId: receiverId,
    type: 'issue',
    fromUser: issue.userId,
    message: `Issue escalated to ${levelLabel}: ${issue.title}`,
  });

  io.to(`user:${receiverId}`).emit('notification:new', {
    type: 'issue',
    message: `Issue escalated to ${levelLabel}: ${issue.title}`,
  });

  return forwarded;
}

async function escalateIssueToLevel(issue, level, assignee, io, { action = 'escalated' } = {}) {
  if (!assignee) return false;

  const now = new Date();
  issue.escalationLevel = level;
  issue.currentAssigneeId = assignee._id;
  issue.assignedTo = assignee._id;
  issue.escalatedTo = assignee._id;
  issue.escalatedAt = now;
  issue.escalationHistory = issue.escalationHistory || [];
  issue.escalationHistory.push({
    level,
    role: level,
    userId: assignee._id,
    assignedAt: now,
    escalatedAt: now,
    action,
  });

  await issue.save();

  const originalMsg = await Message.findOne({
    issueId: issue._id,
    isOriginalIssueMessage: true,
  }).sort({ createdAt: 1 });

  if (originalMsg && io) {
    await forwardIssueMessage({
      io,
      issue,
      originalMsg,
      receiverId: assignee._id,
      levelLabel: level,
    });
  }

  return true;
}

async function initializeIssueEscalation(issue, reporter, categoryId, io) {
  const chain = await resolveEscalationChain({
    collegeId: reporter.collegeId,
    branchId: reporter.branchId,
    sectionId: reporter.sectionId,
    categoryId,
  });

  issue.categoryId = categoryId;
  issue.problemCategoryId = categoryId;
  issue.coordinatorId = chain.coordinator?._id || null;
  issue.hodId = chain.hod?._id || null;
  issue.domainSolverId = chain.domainSolver?._id || null;
  issue.directorId = chain.director?._id || null;
  issue.ownerId = chain.owner?._id || null;

  const firstAssignee = chain.coordinator || chain.hod || chain.domainSolver || chain.director || chain.owner;
  if (!firstAssignee) {
    throw new Error('No assignee found in escalation chain. Configure coordinators/HOD/solvers first.');
  }

  const firstLevel = chain.coordinator ? 'coordinator'
    : chain.hod ? 'hod'
    : chain.domainSolver ? 'domainSolver'
    : chain.director ? 'director'
    : 'owner';

  const now = new Date();
  issue.escalationLevel = firstLevel;
  issue.currentAssigneeId = firstAssignee._id;
  issue.assignedTo = firstAssignee._id;
  issue.escalatedTo = firstAssignee._id;
  issue.escalatedAt = now;
  issue.status = 'Open';
  issue.escalationHistory = [{
    level: firstLevel,
    role: firstLevel,
    userId: firstAssignee._id,
    assignedAt: now,
    action: 'created',
  }];

  await issue.save();

  const category = categoryId
    ? await ProblemCategory.findById(categoryId)
    : null;

  const issueText = buildIssueMessage({
    title: issue.title,
    description: issue.description,
    categoryName: category?.name,
    reporterName: reporter.name,
    date: now,
  });

  const createdMessage = await Message.create({
    senderId: reporter._id,
    receiverId: firstAssignee._id,
    text: issueText,
    issueId: issue._id,
    isOriginalIssueMessage: true,
    autoForwarded: false,
    forwardCount: 0,
    status: 'sent',
  });

  if (io) {
    io.to(`user:${firstAssignee._id}`).emit('message:new', createdMessage.toObject());
    const notification = await Notification.create({
      userId: firstAssignee._id,
      type: 'issue',
      fromUser: reporter._id,
      message: `A new issue has been assigned to you: ${issue.title}`,
    });
    io.to(`user:${firstAssignee._id}`).emit('notification:new', notification);
  }

  return { issue, message: createdMessage };
}

async function manualEscalateIssue(issueId, io) {
  const issue = await Issue.findById(issueId);
  if (!issue) throw new Error('Issue not found');
  if (issue.status === 'Resolved' || issue.escalationLevel === 'resolved') {
    throw new Error('Issue is already resolved');
  }

  const nextLevel = getNextLevel(issue.escalationLevel);
  if (!nextLevel) throw new Error('Already at highest escalation level');

  let targetLevel = nextLevel;
  let assignee = getAssigneeForLevel(issue, targetLevel);

  while (!assignee && targetLevel) {
    console.warn(`⚠️ No assignee for level ${targetLevel}, skipping`);
    targetLevel = getNextLevel(targetLevel);
    assignee = targetLevel ? getAssigneeForLevel(issue, targetLevel) : null;
  }

  if (!assignee) throw new Error('No assignee available for further escalation');

  await escalateIssueToLevel(issue, targetLevel, { _id: assignee }, io, { action: 'manual_escalate' });
  return issue;
}

export {
  ESCALATION_CHAIN,
  LEVEL_DELAY_MS,
  buildIssueMessage,
  initializeIssueEscalation,
  manualEscalateIssue,
  escalateIssueToLevel,
  getNextLevel,
  getAssigneeForLevel,
  forwardIssueMessage,
};
