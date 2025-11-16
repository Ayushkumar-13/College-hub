/*
 * FILE: backend/utils/issueEscalationJob.js
 * PURPOSE: AUTO ESCALATION using ISSUE.ESCALATEDAT (CORRECT WAY)
 */

const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Message = require('../models/Message');

// YOUR DELAYS
const DIRECTOR_DELAY = 60000; // 1 min
const OWNER_DELAY = 120000;   // 2 min (FROM START, NOT TOTAL)

// Cached roles
let DIRECTOR = null;
let OWNER = null;

async function loadHeads() {
  DIRECTOR = await User.findOne({ role: "Director" });
  OWNER = await User.findOne({ role: "Owner" });

  console.log("Director:", DIRECTOR?.name || "❌ NOT FOUND");
  console.log("Owner:", OWNER?.name || "❌ NOT FOUND");
}

const escalateIssues = async (io) => {
  try {
    const issues = await Issue.find({
      status: { $ne: "Resolved" },
      escalationLevel: { $in: ["assigned", "Director"] }
    });

    const now = Date.now();

    for (const issue of issues) {

      // 1️⃣ Get original issue message
      const originalMsg = await Message.findOne({
        issueId: issue._id,
        isOriginalIssueMessage: true
      });

      if (!originalMsg) continue;

      // 2️⃣ KEY FIX — Use issue.escalatedAt (NOT message.createdAt)
      const timeSinceLastEscalation = now - new Date(issue.escalatedAt).getTime();

      // ============= ASSIGNED → DIRECTOR =============
      if (issue.escalationLevel === "assigned" && timeSinceLastEscalation >= DIRECTOR_DELAY) {

        if (!DIRECTOR) continue;

        const already = await Message.exists({
          originalMessageId: originalMsg._id,
          receiverId: DIRECTOR._id,
          autoForwarded: true
        });

        if (!already) {
          const forwarded = await Message.create({
            senderId: originalMsg.senderId,
            receiverId: DIRECTOR._id,
            text: originalMsg.text,
            issueId: issue._id,
            autoForwarded: true,
            originalMessageId: originalMsg._id,
            status: "sent"
          });

          io.to(DIRECTOR._id.toString()).emit("message", forwarded);

          const noti = await Notification.create({
            userId: DIRECTOR._id,
            type: "issue",
            fromUser: issue.userId,
            message: `📌 Issue auto-escalated to Director: ${issue.title}`
          });
          io.to(DIRECTOR._id.toString()).emit("notification", noti);

          // Update for next level
          issue.escalationLevel = "Director";
          issue.assignedTo = DIRECTOR._id;
          issue.escalatedAt = new Date();
          issue.escalationHistory.push({
            role: "Director",
            userId: DIRECTOR._id,
            escalatedAt: new Date()
          });

          await issue.save();

          console.log("✔ Escalated to DIRECTOR:", issue.title);
        }
      }

      // ============= DIRECTOR → OWNER =============
      if (issue.escalationLevel === "Director" && timeSinceLastEscalation >= DIRECTOR_DELAY) {

        if (!OWNER) continue;

        const alreadyOwner = await Message.exists({
          originalMessageId: originalMsg._id,
          receiverId: OWNER._id,
          autoForwarded: true
        });

        if (!alreadyOwner) {
          const forwarded = await Message.create({
            senderId: originalMsg.senderId,
            receiverId: OWNER._id,
            text: originalMsg.text,
            issueId: issue._id,
            autoForwarded: true,
            originalMessageId: originalMsg._id,
            status: "sent"
          });

          io.to(OWNER._id.toString()).emit("message", forwarded);

          const noti = await Notification.create({
            userId: OWNER._id,
            type: "issue",
            fromUser: issue.userId,
            message: `🚨 Issue auto-escalated to OWNER: ${issue.title}`
          });
          io.to(OWNER._id.toString()).emit("notification", noti);

          issue.escalationLevel = "Owner";
          issue.assignedTo = OWNER._id;
          issue.escalatedAt = new Date();
          issue.escalationHistory.push({
            role: "Owner",
            userId: OWNER._id,
            escalatedAt: new Date()
          });

          await issue.save();

          console.log("✔ Escalated to OWNER:", issue.title);
        }
      }
    }

  } catch (err) {
    console.log("Escalation Error:", err);
  }
};

const startIssueEscalationJob = (io) => {
  loadHeads();
  setInterval(loadHeads, 5 * 60 * 1000);
  setInterval(() => escalateIssues(io), 1000);
  console.log("⏳ Auto Escalation running...");
};

module.exports = { startIssueEscalationJob };
