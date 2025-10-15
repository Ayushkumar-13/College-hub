/*
 * FILE: backend/utils/issueEscalationJob.js
 * PURPOSE: Automated issue escalation system (Manager → Director → Chairman)
 */

const cron = require('node-cron');
const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const User = require('../models/User');

const escalateIssues = async (io) => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000);

    // 1️⃣ Escalate to Director (after 24 hours)
    const issuesForDirector = await Issue.find({
      status: { $ne: 'Resolved' },
      escalationLevel: 'manager',
      escalatedAt: { $lt: twentyFourHoursAgo }
    }).populate('userId', 'name department');

    for (const issue of issuesForDirector) {
      const director = await User.findOne({
        role: 'director',
        department: issue.userId.department
      });
      if (!director) continue;

      issue.escalationLevel = 'director';
      issue.escalatedTo = director._id;
      issue.escalatedAt = new Date();
      issue.escalationHistory.push({
        role: 'director',
        userId: director._id
      });
      await issue.save();

      const notification = new Notification({
        userId: director._id,
        type: 'issue',
        fromUser: issue.userId._id,
        message: `Issue escalated to you: ${issue.title}`
      });
      await notification.save();

      io?.to(director._id.toString()).emit('notification', notification);
      console.log(`📈 Escalated issue ${issue._id} → Director ${director.name}`);
    }

    // 2️⃣ Escalate to Chairman (after 48 hours)
    const issuesForChairman = await Issue.find({
      status: { $ne: 'Resolved' },
      escalationLevel: 'director',
      escalatedAt: { $lt: fortyEightHoursAgo }
    }).populate('userId', 'name department');

    for (const issue of issuesForChairman) {
      const chairman = await User.findOne({ role: 'chairman' });
      if (!chairman) continue;

      issue.escalationLevel = 'chairman';
      issue.escalatedTo = chairman._id;
      issue.escalatedAt = new Date();
      issue.escalationHistory.push({
        role: 'chairman',
        userId: chairman._id
      });
      await issue.save();

      const notification = new Notification({
        userId: chairman._id,
        type: 'issue',
        fromUser: issue.userId._id,
        message: `🚨 URGENT: Issue escalated to Chairman: ${issue.title}`
      });
      await notification.save();

      io?.to(chairman._id.toString()).emit('notification', notification);
      console.log(`🚨 Escalated issue ${issue._id} → Chairman ${chairman.name}`);
    }

  } catch (error) {
    console.error('Escalation job error:', error);
  }
};

const startIssueEscalationJob = (io) => {
  escalateIssues(io); // run immediately
  cron.schedule('0 * * * *', async () => {
    console.log('[Escalation Job] Running hourly...');
    await escalateIssues(io);
  });
  console.log('✅ Issue Escalation Job scheduled (runs hourly)');
};

module.exports = { startIssueEscalationJob };
