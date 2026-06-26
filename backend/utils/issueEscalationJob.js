/*
 * FILE: backend/utils/issueEscalationJob.js
 * PURPOSE: Auto-escalation: coordinator → HOD → domainSolver → director → owner
 */

import mongoose from 'mongoose';
import Issue from '../models/Issue.js';
import User from '../models/User.js';
import {
  LEVEL_DELAY_MS,
  getNextLevel,
  getAssigneeForLevel,
  escalateIssueToLevel,
} from './issueEscalation.js';

const JOB_INTERVAL = 30000;

const escalateIssues = async (io) => {
  try {
    const issues = await Issue.find({
      status: { $ne: 'Resolved' },
      escalationLevel: { $nin: ['resolved', 'owner', null] },
    });

    const now = Date.now();

    for (const issue of issues) {
      if (!issue.escalatedAt) {
        issue.escalatedAt = issue.createdAt || new Date();
        await issue.save();
      }

      const elapsed = now - new Date(issue.escalatedAt).getTime();
      if (elapsed < LEVEL_DELAY_MS) continue;

      let nextLevel = getNextLevel(issue.escalationLevel);
      if (!nextLevel) continue;

      let assigneeId = getAssigneeForLevel(issue, nextLevel);
      while (!assigneeId && nextLevel) {
        console.warn(`⚠️ No assignee for level ${nextLevel} on issue ${issue._id}, skipping`);
        nextLevel = getNextLevel(nextLevel);
        assigneeId = nextLevel ? getAssigneeForLevel(issue, nextLevel) : null;
      }

      if (!assigneeId || !nextLevel) continue;

      const assignee = await User.findById(assigneeId);
      if (!assignee) continue;

      await escalateIssueToLevel(issue, nextLevel, assignee, io, { action: 'auto_escalate' });
    }
  } catch (err) {
    console.error('❌ Escalation Error:', err.stack || err.message);
  }
};

let isJobRunning = false;

const startIssueEscalationJob = (io) => {
  const runJob = async () => {
    if (isJobRunning) return;
    if (mongoose.connection.readyState !== 1) {
      setTimeout(runJob, JOB_INTERVAL);
      return;
    }

    isJobRunning = true;
    try {
      await escalateIssues(io);
    } catch (err) {
      console.error('❌ Critical Job Error:', err.stack || err.message);
    } finally {
      isJobRunning = false;
      setTimeout(runJob, JOB_INTERVAL);
    }
  };

  setTimeout(runJob, JOB_INTERVAL);
  const delayLabel = process.env.NODE_ENV === 'production' ? '24h default' : '2min dev';
  console.log(`⏳ Auto Escalation Job Started (interval: ${JOB_INTERVAL / 1000}s, delay: ${delayLabel})`);
};

export { startIssueEscalationJob };
