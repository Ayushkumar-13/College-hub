/*
 * FILE: backend/utils/issueEscalationJob.js
 * PURPOSE: AUTO ESCALATION with REAL-TIME SOCKET UPDATES
 */

const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Message = require('../models/Message');

// Delays
const DIRECTOR_DELAY = 60000; // 1 minute
const OWNER_DELAY = 120000;   // 2 minutes

/* Cached role users */
let DIRECTOR = null;
let OWNER = null;

async function loadHeads() {
  try {
    DIRECTOR = await User.findOne({ role: "Director" });
    OWNER = await User.findOne({ role: "Owner" });
    console.log("✅ Director:", DIRECTOR?.name || "❌ NOT FOUND");
    console.log("✅ Owner:", OWNER?.name || "❌ NOT FOUND");
  } catch (err) {
    console.error("❌ Error loading heads:", err);
  }
}

const escalateIssues = async (io) => {
  try {
    const issues = await Issue.find({
      status: { $ne: "Resolved" },
      escalationLevel: { $in: ["assigned", "Director"] }
    });

    const now = Date.now();

    for (const issue of issues) {
      // Get original message
      const originalMsg = await Message.findOne({
        issueId: issue._id,
        isOriginalIssueMessage: true
      })
        .sort({ createdAt: 1 })
        .populate('senderId', 'name avatar email');

      if (!originalMsg) continue;

      // Ensure escalatedAt exists
      if (!issue.escalatedAt) {
        issue.escalatedAt = issue.createdAt || new Date();
        await issue.save();
      }

      let elapsed = now - new Date(issue.escalatedAt).getTime();

      // ---------- ASSIGNED -> DIRECTOR ----------
      if (issue.escalationLevel === "assigned" && elapsed >= DIRECTOR_DELAY) {
        if (!DIRECTOR) {
          console.log("⚠️ No Director configured; skipping director escalation");
          continue;
        }

        const alreadyToDirector = await Message.exists({
          originalMessageId: originalMsg._id,
          receiverId: DIRECTOR._id,
          autoForwarded: true
        });

        if (!alreadyToDirector) {
          console.log(`📤 Escalating to DIRECTOR: ${issue.title}`);

          // Create forwarded message with explicit timestamps
          const forwarded = await Message.create({
            senderId: originalMsg.senderId,
            receiverId: DIRECTOR._id,
            text: originalMsg.text,
            media: originalMsg.media || [],
            issueId: issue._id,
            isOriginalIssueMessage: false,
            autoForwarded: true,
            forwardCount: (originalMsg.forwardCount || 0) + 1,
            originalMessageId: originalMsg._id,
            status: "delivered",
            createdAt: new Date(),
            updatedAt: new Date()
          });

          // Populate the forwarded message
          await forwarded.populate('senderId', 'name avatar email');
          await forwarded.populate('receiverId', 'name avatar email');

          console.log(`✅ Forwarded message created: ${forwarded._id}`);

          // 🔥 EMIT TO DIRECTOR (Real-time update)
          io.to(`user:${DIRECTOR._id}`).emit('message:new', forwarded);
          console.log(`📨 Emitted 'message:new' to Director: ${DIRECTOR._id}`);

          // 🔥 EMIT TO ORIGINAL SENDER (Chat list update)
          io.to(`user:${originalMsg.senderId._id || originalMsg.senderId}`).emit('message:escalated', {
            issueId: issue._id,
            escalatedTo: 'Director',
            receiverId: DIRECTOR._id,
            message: forwarded
          });
          console.log(`📨 Emitted 'message:escalated' to sender: ${originalMsg.senderId._id || originalMsg.senderId}`);

          // 🔥 EMIT GLOBAL EVENT (For any active users)
          io.emit('issue:escalated', {
            issueId: issue._id,
            title: issue.title,
            escalatedTo: 'Director',
            escalatedUser: {
              _id: DIRECTOR._id,
              name: DIRECTOR.name,
              avatar: DIRECTOR.avatar
            }
          });

          // Create notification
          await Notification.create({
            userId: DIRECTOR._id,
            type: "issue",
            fromUser: issue.userId,
            message: `📌 Issue auto-escalated to Director: ${issue.title}`
          });

          // Update issue
          issue.escalationLevel = "Director";
          issue.assignedTo = DIRECTOR._id;
          issue.escalatedAt = new Date();
          issue.directorEscalated = true;
          issue.escalationHistory = issue.escalationHistory || [];
          issue.escalationHistory.push({
            role: "Director",
            userId: DIRECTOR._id,
            escalatedAt: new Date()
          });

          await issue.save();
          console.log(`✅ Issue escalated to DIRECTOR: ${issue.title}`);
        }

        continue; // Skip owner check in this iteration
      }

      // Recompute elapsed time
      elapsed = Date.now() - new Date(issue.escalatedAt).getTime();

      // ---------- DIRECTOR -> OWNER ----------
      if (issue.escalationLevel === "Director" && elapsed >= OWNER_DELAY) {
        if (!OWNER) {
          console.log("⚠️ No Owner configured; skipping owner escalation");
          continue;
        }

        const alreadyToOwner = await Message.exists({
          originalMessageId: originalMsg._id,
          receiverId: OWNER._id,
          autoForwarded: true
        });

        if (!alreadyToOwner) {
          console.log(`📤 Escalating to OWNER: ${issue.title}`);

          const lastForward = await Message.findOne({ 
            originalMessageId: originalMsg._id 
          }).sort({ createdAt: -1 });
          const prevCount = lastForward?.forwardCount || originalMsg.forwardCount || 0;

          // Create forwarded message with explicit timestamps
          const forwarded = await Message.create({
            senderId: originalMsg.senderId,
            receiverId: OWNER._id,
            text: originalMsg.text,
            media: originalMsg.media || [],
            issueId: issue._id,
            isOriginalIssueMessage: false,
            autoForwarded: true,
            forwardCount: prevCount + 1,
            originalMessageId: originalMsg._id,
            status: "delivered",
            createdAt: new Date(),
            updatedAt: new Date()
          });

          // Populate the forwarded message
          await forwarded.populate('senderId', 'name avatar email');
          await forwarded.populate('receiverId', 'name avatar email');

          console.log(`✅ Forwarded message created: ${forwarded._id}`);

          // 🔥 EMIT TO OWNER (Real-time update)
          io.to(`user:${OWNER._id}`).emit('message:new', forwarded);
          console.log(`📨 Emitted 'message:new' to Owner: ${OWNER._id}`);

          // 🔥 EMIT TO ORIGINAL SENDER (Chat list update)
          io.to(`user:${originalMsg.senderId._id || originalMsg.senderId}`).emit('message:escalated', {
            issueId: issue._id,
            escalatedTo: 'Owner',
            receiverId: OWNER._id,
            message: forwarded
          });
          console.log(`📨 Emitted 'message:escalated' to sender: ${originalMsg.senderId._id || originalMsg.senderId}`);

          // 🔥 EMIT TO DIRECTOR (Notify previous handler)
          io.to(`user:${DIRECTOR._id}`).emit('message:escalated', {
            issueId: issue._id,
            escalatedTo: 'Owner',
            receiverId: OWNER._id,
            message: forwarded,
            fromLevel: 'Director'
          });

          // 🔥 EMIT GLOBAL EVENT
          io.emit('issue:escalated', {
            issueId: issue._id,
            title: issue.title,
            escalatedTo: 'Owner',
            escalatedUser: {
              _id: OWNER._id,
              name: OWNER.name,
              avatar: OWNER.avatar
            }
          });

          // Create notification
          await Notification.create({
            userId: OWNER._id,
            type: "issue",
            fromUser: issue.userId,
            message: `🚨 Issue auto-escalated to OWNER: ${issue.title}`
          });

          // Update issue
          issue.escalationLevel = "Owner";
          issue.assignedTo = OWNER._id;
          issue.escalatedAt = new Date();
          issue.ownerEscalated = true;
          issue.escalationHistory = issue.escalationHistory || [];
          issue.escalationHistory.push({
            role: "Owner",
            userId: OWNER._id,
            escalatedAt: new Date()
          });

          await issue.save();
          console.log(`✅ Issue escalated to OWNER: ${issue.title}`);
        }
      }
    }
  } catch (err) {
    console.error("❌ Escalation Error:", err);
  }
};

const startIssueEscalationJob = (io) => {
  loadHeads();
  setInterval(loadHeads, 5 * 60 * 1000); // Refresh every 5 minutes

  // Run escalation check every second
  setInterval(() => escalateIssues(io), 1000);
  console.log("⏳ Auto Escalation Job Started with Real-time Updates");
};

module.exports = { startIssueEscalationJob };