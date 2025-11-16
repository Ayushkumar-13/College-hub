/*
 * FILE: backend/utils/issueEscalationJob.js
 * PURPOSE: AUTO ESCALATION (Assigned → Director → Owner)
 * FEATURE: Forwards the SAME original message during escalation
 */

const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Message = require('../models/Message');

const DIRECTOR_DELAY = 5000; // 5 sec
const OWNER_DELAY = 10000;   // 10 sec (total)

let DIRECTOR = null;
let OWNER = null;

// Load Director & Owner once
async function loadHeads() {
  DIRECTOR = await User.findOne({ role: "Director" });
  OWNER = await User.findOne({ role: "Owner" });

  console.log("Director:", DIRECTOR?.name || "❌ NOT FOUND");
  console.log("Owner:", OWNER?.name || "❌ NOT FOUND");
}

const escalateIssues = async (io) => {
  try {
    const now = Date.now();

    // -------------------------------------------------------------
    // 1) ASSIGNED → DIRECTOR (after 5 sec)
    // -------------------------------------------------------------
    const step1Issues = await Issue.find({
      status: { $ne: "Resolved" },
      escalationLevel: "assigned",
      escalatedAt: { $lte: new Date(now - DIRECTOR_DELAY) }
    }).populate("userId assignedTo", "name");

    for (const issue of step1Issues) {
      if (!DIRECTOR) continue;

      // Update escalation fields
      issue.escalationLevel = "Director";
      issue.assignedTo = DIRECTOR._id;
      issue.escalatedTo = DIRECTOR._id;
      issue.escalatedAt = new Date();

      issue.escalationHistory.push({
        role: "Director",
        userId: DIRECTOR._id,
        escalatedAt: new Date()
      });

      await issue.save();

      // -----------------------------------------------------
      // 🔥 FIND & FORWARD ORIGINAL MESSAGE TO DIRECTOR
      // -----------------------------------------------------
      const originalMessage = await Message.findOne({
        issueId: issue._id,
        isOriginalIssueMessage: true
      });

      if (originalMessage) {
        // Create forwarded message with incremented count
        const forwardedMessage = await Message.create({
          senderId: originalMessage.senderId,
          receiverId: DIRECTOR._id,
          text: originalMessage.text,
          issueId: issue._id,
          isOriginalIssueMessage: false,
          autoForwarded: true,
          forwardCount: (originalMessage.forwardCount || 0) + 1,
          originalMessageId: originalMessage._id,
          status: "sent"
        });

        // Real-time push
        io.to(DIRECTOR._id.toString()).emit("message", forwardedMessage);
      }

      // Notification
      const notification = await Notification.create({
        userId: DIRECTOR._id,
        type: "issue",
        fromUser: issue.userId._id,
        message: `📌 Issue auto-escalated to Director: ${issue.title}`
      });

      io.to(DIRECTOR._id.toString()).emit("notification", notification);

      console.log("✅ AUTO ESCALATED → DIRECTOR:", issue._id);
    }

    // -------------------------------------------------------------
    // 2) DIRECTOR → OWNER (after 10 sec total)
    // -------------------------------------------------------------
    const step2Issues = await Issue.find({
      status: { $ne: "Resolved" },
      escalationLevel: "Director",
      escalatedAt: { $lte: new Date(now - OWNER_DELAY + DIRECTOR_DELAY) }
    }).populate("userId", "name");

    for (const issue of step2Issues) {
      if (!OWNER) continue;

      // Update escalation to Owner
      issue.escalationLevel = "Owner";
      issue.assignedTo = OWNER._id;
      issue.escalatedTo = OWNER._id;
      issue.escalatedAt = new Date();

      issue.escalationHistory.push({
        role: "Owner",
        userId: OWNER._id,
        escalatedAt: new Date()
      });

      await issue.save();

      // -----------------------------------------------------
      // 🔥 FIND & FORWARD ORIGINAL MESSAGE TO OWNER
      // -----------------------------------------------------
      const originalMessage = await Message.findOne({
        issueId: issue._id,
        isOriginalIssueMessage: true
      });

      if (originalMessage) {
        // Get the last forward count (from Director's message)
        const lastForwardedMsg = await Message.findOne({
          issueId: issue._id,
          autoForwarded: true,
          receiverId: DIRECTOR._id
        }).sort({ createdAt: -1 });

        const currentForwardCount = lastForwardedMsg?.forwardCount || originalMessage.forwardCount || 0;

        // Create forwarded message with incremented count
        const forwardedMessage = await Message.create({
          senderId: originalMessage.senderId,
          receiverId: OWNER._id,
          text: originalMessage.text,
          issueId: issue._id,
          isOriginalIssueMessage: false,
          autoForwarded: true,
          forwardCount: currentForwardCount + 1,
          originalMessageId: originalMessage._id,
          status: "sent"
        });

        // Realtime push
        io.to(OWNER._id.toString()).emit("message", forwardedMessage);
      }

      // Notification
      const notification = await Notification.create({
        userId: OWNER._id,
        type: "issue",
        fromUser: issue.userId._id,
        message: `🚨 Issue escalated to OWNER: ${issue.title}`
      });

      io.to(OWNER._id.toString()).emit("notification", notification);

      console.log("✅ AUTO ESCALATED → OWNER:", issue._id);
    }

  } catch (err) {
    console.log("❌ Escalation Error:", err);
  }
};

const startIssueEscalationJob = (io) => {
  loadHeads(); // Load roles once

  setInterval(() => escalateIssues(io), 1000);
  console.log("⏳ Auto-Escalation running every 1 sec...");
};

module.exports = { startIssueEscalationJob };