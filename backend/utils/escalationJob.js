/*
 * FILE: backend/utils/escalationJob.js
 * PURPOSE: Automatically escalate unresolved problem posts after a time limit
 */

const cron = require('node-cron');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Escalate unresolved problem posts older than `hoursThreshold` hours
 * Sends notifications to admin users
 */
const escalateProblems = async (io, hoursThreshold = 24) => {
  try {
    const cutoff = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

    // Find unresolved problem posts
    const problemPosts = await Post.find({
      type: 'problem',
      problemStatus: 'open',
      createdAt: { $lt: cutoff }
    });

    if (!problemPosts.length) return;

    // Get all admins
    const admins = await User.find({ role: 'admin' });

    for (const post of problemPosts) {
      post.problemStatus = 'escalated';
      await post.save();

      for (const admin of admins) {
        // Create notification
        const notification = new Notification({
          userId: admin._id,
          type: 'problem_escalation',
          postId: post._id,
          message: `Problem post needs attention: ${post.content.substring(0, 50)}...`
        });
        await notification.save();

        // Emit real-time socket notification
        if (io) {
          io.emitToUser(admin._id.toString(), 'notification:new', {
            type: 'problem_escalation',
            message: notification.message,
            post
          });
        }
      }
    }
  } catch (err) {
    console.error('Escalation job error:', err);
  }
};

/**
 * Schedule the escalation job to run every hour
 */
const startEscalationJob = (io) => {
  cron.schedule('0 * * * *', async () => {
    console.log('[Escalation Job] Running problem post escalation...');
    await escalateProblems(io, 24);
  });
};

module.exports = { startEscalationJob, escalateProblems };
