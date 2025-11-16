/*
 * FILE: backend/utils/issueEscalationJob.js
 * PURPOSE: AUTO ESCALATION using ISSUE.ESCALATEDAT (CORRECT WAY)
 *
 * Behavior:
 *  - When issue is created & assigned → escalatedAt is set (routes file).
 *  - After DIRECTOR_DELAY from escalatedAt we forward ORIGINAL message to Director,
 *    update escalationLevel → "Director", update escalatedAt to now, save and CONTINUE.
 *  - Next iterations will (after OWNER_DELAY from the *updated* escalatedAt) forward to Owner.
 *
 * Key fix:
 *  - use continue after Director escalation so Owner doesn't run in the same loop iteration
 *  - recompute elapsed time where needed
 */

const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Message = require('../models/Message');

// YOUR DELAYS (adjust as needed)
const DIRECTOR_DELAY = 60000; // 1 minute
const OWNER_DELAY = 120000;   // 2 minutes (from original escalatedAt, not cumulative)

/* Cached role users */
let DIRECTOR = null;
let OWNER = null;

async function loadHeads() {
  try {
    DIRECTOR = await User.findOne({ role: "Director" });
    OWNER = await User.findOne({ role: "Owner" });
    console.log("Director:", DIRECTOR?.name || "❌ NOT FOUND");
    console.log("Owner:", OWNER?.name || "❌ NOT FOUND");
  } catch (err) {
    console.log("Error loading heads:", err);
  }
}

const escalateIssues = async (io) => {
  try {
    // Find issues that still need escalation (assigned → Director → Owner)
    const issues = await Issue.find({
      status: { $ne: "Resolved" },
      escalationLevel: { $in: ["assigned", "Director"] }
    });

    const now = Date.now();

    for (const issue of issues) {
      // Grab original message (the single original message sent to assignee)
      const originalMsg = await Message.findOne({
        issueId: issue._id,
        isOriginalIssueMessage: true
      }).sort({ createdAt: 1 });

      if (!originalMsg) {
        // nothing to forward
        continue;
      }

      // Ensure escalatedAt exists (defensive)
      if (!issue.escalatedAt) {
        // fallback: use issue createdAt if escalatedAt missing
        issue.escalatedAt = issue.createdAt || new Date();
        await issue.save();
      }

      // Compute elapsed since last escalation time
      let elapsed = now - new Date(issue.escalatedAt).getTime();

      // ---------- ASSIGNED -> DIRECTOR ----------
      if (issue.escalationLevel === "assigned" && elapsed >= DIRECTOR_DELAY) {
        if (!DIRECTOR) {
          console.log("No Director configured; skipping director escalation for issue:", issue._id.toString());
        } else {
          // Ensure we didn't already forward this original message to Director
          const alreadyToDirector = await Message.exists({
            originalMessageId: originalMsg._id,
            receiverId: DIRECTOR._id,
            autoForwarded: true
          });

          if (!alreadyToDirector) {
            const forwarded = await Message.create({
              senderId: originalMsg.senderId,
              receiverId: DIRECTOR._id,
              text: originalMsg.text,
              issueId: issue._id,
              isOriginalIssueMessage: false,
              autoForwarded: true,
              forwardCount: (originalMsg.forwardCount || 0) + 1,
              originalMessageId: originalMsg._id,
              status: "sent"
            });

            io.to(DIRECTOR._id.toString()).emit("message", forwarded);

            await Notification.create({
              userId: DIRECTOR._id,
              type: "issue",
              fromUser: issue.userId,
              message: `📌 Issue auto-escalated to Director: ${issue.title}`
            });

            // update escalation metadata and save
            issue.escalationLevel = "Director";
            issue.assignedTo = DIRECTOR._id;
            issue.escalatedAt = new Date();
            issue.escalationHistory = issue.escalationHistory || [];
            issue.escalationHistory.push({
              role: "Director",
              userId: DIRECTOR._id,
              escalatedAt: new Date()
            });

            await issue.save();
            console.log("✔ Escalated to DIRECTOR:", issue.title);
          }
        }

        // IMPORTANT: after escalating to Director, skip the Owner check in this iteration.
        // This guarantees the forwarding is serial (next iteration will consider Owner).
        continue;
      }

      // recompute elapsed from the (possibly updated) escalatedAt
      elapsed = Date.now() - new Date(issue.escalatedAt).getTime();

      // ---------- DIRECTOR -> OWNER ----------
      if (issue.escalationLevel === "Director" && elapsed >= OWNER_DELAY) {
        if (!OWNER) {
          console.log("No Owner configured; skipping owner escalation for issue:", issue._id.toString());
        } else {
          const alreadyToOwner = await Message.exists({
            originalMessageId: originalMsg._id,
            receiverId: OWNER._id,
            autoForwarded: true
          });

          if (!alreadyToOwner) {
            // compute previous forwardCount (optional)
            const lastForward = await Message.findOne({ originalMessageId: originalMsg._id }).sort({ createdAt: -1 });
            const prevCount = lastForward?.forwardCount || originalMsg.forwardCount || 0;

            const forwarded = await Message.create({
              senderId: originalMsg.senderId,
              receiverId: OWNER._id,
              text: originalMsg.text,
              issueId: issue._id,
              isOriginalIssueMessage: false,
              autoForwarded: true,
              forwardCount: prevCount + 1,
              originalMessageId: originalMsg._id,
              status: "sent"
            });

            io.to(OWNER._id.toString()).emit("message", forwarded);

            await Notification.create({
              userId: OWNER._id,
              type: "issue",
              fromUser: issue.userId,
              message: `🚨 Issue auto-escalated to OWNER: ${issue.title}`
            });

            issue.escalationLevel = "Owner";
            issue.assignedTo = OWNER._id;
            issue.escalatedAt = new Date();
            issue.escalationHistory = issue.escalationHistory || [];
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
    }
  } catch (err) {
    console.log("Escalation Error:", err);
  }
};

const startIssueEscalationJob = (io) => {
  loadHeads(); // initial load of Director/Owner
  setInterval(loadHeads, 5 * 60 * 1000); // refresh every 5min

  // run escalation check frequently (1s is OK for quick tests; increase to e.g. 5s in prod)
  setInterval(() => escalateIssues(io), 1000);
  console.log("⏳ Auto Escalation running...");
};

module.exports = { startIssueEscalationJob };
