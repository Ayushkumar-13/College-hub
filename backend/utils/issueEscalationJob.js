/*
 * FILE: backend/utils/issueEscalationJob.js
 * PURPOSE: AUTO ESCALATION (Assigned → Director → Owner)
 */

const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const User = require('../models/User');

const DIRECTOR_DELAY = 5000; // +5 sec
const OWNER_DELAY = 10000;   // +10 sec total

let DIRECTOR = null;
let OWNER = null;

async function loadHeads() {
  DIRECTOR = await User.findOne({ role: "Director" });
  OWNER = await User.findOne({ role: "Owner" });

  console.log("Director:", DIRECTOR ? DIRECTOR.name : "❌ NOT FOUND");
  console.log("Owner:", OWNER ? OWNER.name : "❌ NOT FOUND");
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

      const notification = await Notification.create({
        userId: DIRECTOR._id,
        type: "issue",
        fromUser: issue.userId._id,
        message: `Issue auto-escalated to Director: ${issue.title}`
      });

      io.to(DIRECTOR._id.toString()).emit("notification", notification);

      console.log("AUTO ESCALATED → DIRECTOR:", issue._id);
    }

    // -------------------------------------------------------------
    // 2) DIRECTOR → OWNER (after total 10 sec)
    // -------------------------------------------------------------
    const step2Issues = await Issue.find({
      status: { $ne: "Resolved" },
      escalationLevel: "Director",
      escalatedAt: { $lte: new Date(now - OWNER_DELAY + DIRECTOR_DELAY) }
    }).populate("userId", "name");

    for (const issue of step2Issues) {
      if (!OWNER) continue;

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

      const notification = await Notification.create({
        userId: OWNER._id,
        type: "issue",
        fromUser: issue.userId._id,
        message: `🚨 Issue escalated to OWNER: ${issue.title}`
      });

      io.to(OWNER._id.toString()).emit("notification", notification);

      console.log("AUTO ESCALATED → OWNER:", issue._id);
    }
  } catch (err) {
    console.log("Escalation Error:", err);
  }
};

const startIssueEscalationJob = (io) => {
  loadHeads(); // Load users once

  setInterval(() => escalateIssues(io), 1000);
  console.log("⏳ Auto-Escalation running every 1 sec...");
};

module.exports = { startIssueEscalationJob };
