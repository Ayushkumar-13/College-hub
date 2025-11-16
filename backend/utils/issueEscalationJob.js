/*
 * FILE: backend/utils/issueEscalationJob.js
 * PURPOSE: Forward ORIGINAL issue message → Director (5s) → Owner (10s)
 */

const Issue = require('../models/Issue');
const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// delays
const DIRECTOR_DELAY = 5000;  // 5 seconds
const OWNER_DELAY = 10000;    // 10 seconds total

let DIRECTOR = null;
let OWNER = null;

// Load Director & Owner once
async function loadHeads() {
  DIRECTOR = await User.findOne({ role: "Director" });
  OWNER = await User.findOne({ role: "Owner" });

  console.log("Director:", DIRECTOR?.name || "❌ Not found");
  console.log("Owner:", OWNER?.name || "❌ Not found");
}

const escalateIssues = async (io) => {
  try {
    const now = Date.now();

    // ======================================================================
    // ⏳ STEP 1: AFTER 5 SEC → FORWARD ORIGINAL MESSAGE → DIRECTOR
    // ======================================================================
    const step1 = await Issue.find({
      status: { $ne: "Resolved" },
      escalationLevel: "assigned",
      escalatedAt: { $lte: new Date(now - DIRECTOR_DELAY) }
    }).populate("userId assignedTo", "name");

    for (const issue of step1) {
      if (!DIRECTOR) continue;

      // -----------------------------------------------------
      // Fetch the ORIGINAL MESSAGE sent to mentioned user
      // -----------------------------------------------------
      const originalMessage = await Message.findOne({
        issueId: issue._id,
        isOriginalIssueMessage: true
      });

      if (!originalMessage) {
        console.log("❌ No original message found for issue:", issue._id);
        continue;
      }

      const textToForward = originalMessage.text;

      // -----------------------------------------------------
      // Forward ORIGINAL MESSAGE → DIRECTOR
      // -----------------------------------------------------
      const forwarded = await Message.create({
        senderId: issue.userId._id,
        receiverId: DIRECTOR._id,
        text: textToForward,
        status: "sent",
        issueId: issue._id,
        autoForwarded: true
      });

      // Real-time
      io.to(DIRECTOR._id.toString()).emit("message", forwarded);

      // Update issue escalation
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

      console.log("FORWARDED ORIGINAL MESSAGE → DIRECTOR:", issue.title);
    }

    // ======================================================================
    // ⏳ STEP 2: AFTER 10 SEC → FORWARD ORIGINAL MESSAGE → OWNER
    // ======================================================================
    const step2 = await Issue.find({
      status: { $ne: "Resolved" },
      escalationLevel: "Director",
      escalatedAt: { $lte: new Date(now - (OWNER_DELAY - DIRECTOR_DELAY)) }
    }).populate("userId", "name");

    for (const issue of step2) {
      if (!OWNER) continue;

      // Retrieve original message again
      const originalMessage = await Message.findOne({
        issueId: issue._id,
        isOriginalIssueMessage: true
      });

      if (!originalMessage) {
        console.log("❌ No original message found for issue:", issue._id);
        continue;
      }

      const textToForward = originalMessage.text;

      // -----------------------------------------------------
      // Forward ORIGINAL MESSAGE → OWNER
      // -----------------------------------------------------
      const forwarded = await Message.create({
        senderId: issue.userId._id,
        receiverId: OWNER._id,
        text: textToForward,
        status: "sent",
        issueId: issue._id,
        autoForwarded: true
      });

      io.to(OWNER._id.toString()).emit("message", forwarded);

      // Update issue escalation
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

      console.log("FORWARDED ORIGINAL MESSAGE → OWNER:", issue.title);
    }

  } catch (err) {
    console.log("Escalation Error:", err);
  }
};

// Run every 1 sec
const startIssueEscalationJob = (io) => {
  loadHeads();
  setInterval(() => escalateIssues(io), 1000);

  console.log("⏳ Auto-escalation job running every 1 sec...");
};

module.exports = { startIssueEscalationJob };
