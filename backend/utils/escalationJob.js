/*
 * FILE: backend/utils/escalationJob.js
 * PURPOSE: Multi-level auto-escalation system
 */

const cron = require('node-cron');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Escalate problems through the hierarchy:
 * 1. Manager (immediate on creation)
 * 2. Director (after 24 hours unresolved)
 * 3. Chairman (after 48 hours unresolved)
 */
const escalateProblems = async (io) => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000);

    // ===== STEP 1: Escalate to Director (24 hours) =====
    const postsForDirector = await Post.find({
      type: 'problem',
      problemStatus: 'escalated_manager',
      escalatedAt: { $lt: twentyFourHoursAgo }
    }).populate('userId', 'name department');

    for (const post of postsForDirector) {
      // Find director of the same department
      const director = await User.findOne({
        role: 'director',
        department: post.userId.department
      });

      if (director) {
        // Update post
        post.problemStatus = 'escalated_director';
        post.escalatedTo = director._id;
        post.escalatedAt = new Date();
        post.escalationHistory.push({
          role: 'director',
          userId: director._id,
          escalatedAt: new Date()
        });
        await post.save();

        // Create notification
        const notification = new Notification({
          userId: director._id,
          type: 'problem',
          fromUser: post.userId._id,
          postId: post._id,
          message: `Problem escalated to you: ${post.problemDescription.substring(0, 50)}...`
        });
        await notification.save();

        // Real-time notification
        if (io) {
          io.emitToUser(director._id.toString(), 'notification:new', {
            type: 'problem_escalation',
            message: notification.message,
            post
          });
        }

        console.log(`✅ Escalated post ${post._id} to Director ${director.name}`);
      }
    }

    // ===== STEP 2: Escalate to Chairman (48 hours) =====
    const postsForChairman = await Post.find({
      type: 'problem',
      problemStatus: 'escalated_director',
      escalatedAt: { $lt: fortyEightHoursAgo }
    }).populate('userId', 'name department');

    for (const post of postsForChairman) {
      // Find chairman (there should be only one)
      const chairman = await User.findOne({ role: 'chairman' });

      if (chairman) {
        // Update post
        post.problemStatus = 'escalated_chairman';
        post.escalatedTo = chairman._id;
        post.escalatedAt = new Date();
        post.escalationHistory.push({
          role: 'chairman',
          userId: chairman._id,
          escalatedAt: new Date()
        });
        await post.save();

        // Create notification
        const notification = new Notification({
          userId: chairman._id,
          type: 'problem',
          fromUser: post.userId._id,
          postId: post._id,
          message: `URGENT: Problem escalated to Chairman: ${post.problemDescription.substring(0, 50)}...`
        });
        await notification.save();

        // Real-time notification
        if (io) {
          io.emitToUser(chairman._id.toString(), 'notification:new', {
            type: 'problem_escalation',
            message: notification.message,
            post,
            urgent: true
          });
        }

        console.log(`🚨 URGENT: Escalated post ${post._id} to Chairman ${chairman.name}`);
      }
    }

    console.log(`[Escalation Job] Processed ${postsForDirector.length} director escalations, ${postsForChairman.length} chairman escalations`);
  } catch (err) {
    console.error('❌ Escalation job error:', err);
  }
};

/**
 * Run every hour
 */
const startEscalationJob = (io) => {
  // Run immediately on startup
  escalateProblems(io);
  
  // Then run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[Escalation Job] Running...');
    await escalateProblems(io);
  });
  
  console.log('✅ Escalation job scheduled (runs hourly)');
};

module.exports = { startEscalationJob, escalateProblems };