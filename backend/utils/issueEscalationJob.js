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

/**
 * NOTE:
 * Forwarding decision is made from the originalMessage.createdAt timestamp.
 * We forward to Director only once, then to Owner only once.
 */

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
    // find all issues that still open/not resolved and were assigned
    const issues = await Issue.find({
      status: { $ne: "Resolved" },
      escalationLevel: { $in: ["assigned", "Director"] } // only these levels need processing
    }).populate("userId assignedTo", "name");

    const now = Date.now();

    for (const issue of issues) {
      // fetch original message sent to assignee
      const originalMessage = await Message.findOne({
        issueId: issue._id,
        isOriginalIssueMessage: true
      }).sort({ createdAt: 1 }); // earliest original

      if (!originalMessage) {
        console.log("❌ No original message found for issue:", issue._id.toString());
        continue;
      }

      const originalCreated = new Date(originalMessage.createdAt).getTime();
      const elapsed = now - originalCreated;

      // ---------- Forward to DIRECTOR (after DIRECTOR_DELAY) ----------
      if (elapsed >= DIRECTOR_DELAY && DIRECTOR) {
        // Check if director already received a forward of this original
        const alreadyToDirector = await Message.exists({
          originalMessageId: originalMessage._id,
          receiverId: DIRECTOR._id,
          autoForwarded: true
        });

        if (!alreadyToDirector) {
          // create forwarded message
          const forwarded = await Message.create({
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

          // realtime push
          io.to(DIRECTOR._id.toString()).emit("message", forwarded);

          // Notification
          const notification = await Notification.create({
            userId: DIRECTOR._id,
            type: "issue",
            fromUser: issue.userId._id,
            message: `📌 Issue auto-escalated to Director: ${issue.title}`
          });
          io.to(DIRECTOR._id.toString()).emit("notification", notification);

          // Update issue escalation details (only if currently 'assigned')
          if (issue.escalationLevel === "assigned") {
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
          }

          console.log("✅ Forwarded ORIGINAL → DIRECTOR for issue:", issue._id.toString());
        }
      }

      // ---------- Forward to OWNER (after OWNER_DELAY) ----------
      if (elapsed >= OWNER_DELAY && OWNER) {
        // Check if owner already received a forward
        const alreadyToOwner = await Message.exists({
          originalMessageId: originalMessage._id,
          receiverId: OWNER._id,
          autoForwarded: true
        });

        if (!alreadyToOwner) {
          // Optionally get last forwardCount to continue incrementing
          const lastForwardedMsg = await Message.findOne({
            originalMessageId: originalMessage._id
          }).sort({ createdAt: -1 });

          const prevCount = lastForwardedMsg?.forwardCount || originalMessage.forwardCount || 0;

          const forwarded = await Message.create({
            senderId: originalMessage.senderId,
            receiverId: OWNER._id,
            text: originalMessage.text,
            issueId: issue._id,
            isOriginalIssueMessage: false,
            autoForwarded: true,
            forwardCount: prevCount + 1,
            originalMessageId: originalMessage._id,
            status: "sent"
          });

          io.to(OWNER._id.toString()).emit("message", forwarded);

          const notification = await Notification.create({
            userId: OWNER._id,
            type: "issue",
            fromUser: issue.userId._id,
            message: `🚨 Issue escalated to OWNER: ${issue.title}`
          });
          io.to(OWNER._id.toString()).emit("notification", notification);

          // update issue escalation details
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

          console.log("✅ Forwarded ORIGINAL → OWNER for issue:", issue._id.toString());
        }
      }
    }
  } catch (err) {
    console.log("❌ Escalation Error:", err);
  }
};

const startIssueEscalationJob = (io) => {
  loadHeads(); // Load roles once

  // keep heads fresh every 5 minutes in background (safe)
  setInterval(loadHeads, 5 * 60 * 1000);

  // run check every 1s (you already had this cadence)
  setInterval(() => escalateIssues(io), 1000);
  console.log("⏳ Auto-Escalation running every 1 sec...");
};

module.exports = { startIssueEscalationJob };
