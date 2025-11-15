/*
 * FILE: backend/routes/issues.js
 * PURPOSE: Issue management routes — create, view, update, escalate
 */

const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const authenticateToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const Issue = require('../models/Issue');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Cloudinary upload helper
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: `college-social/${folder}` },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    uploadStream.end(fileBuffer);
  });
};

// ------------------------------------------------------------------------
// GET ALL ISSUES
// ------------------------------------------------------------------------
router.get('/', authenticateToken, async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate('userId', 'name avatar role department')
      .populate('assignedTo', 'name avatar role')
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------------------------------------------------
// GET SINGLE ISSUE
// ------------------------------------------------------------------------
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('userId', 'name avatar role department')
      .populate('assignedTo', 'name avatar role');

    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    res.json(issue);
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------------------------------------------------
// CREATE ISSUE — any user can be assigned except students
// ------------------------------------------------------------------------
// CREATE ISSUE — any user except student can be assigned
router.post('/', authenticateToken, upload.array('media', 5), async (req, res) => {
  try {
    const { title, description, assignedTo } = req.body;
    const media = [];

    // Upload media
    if (req.files?.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'issues');
        media.push({ url: result.secure_url, publicId: result.public_id });
      }
    }

    let assignee = null;

    if (assignedTo) {
      const user = await User.findById(assignedTo);

      if (!user || user.role === "Student") {
        return res.status(400).json({ error: "Cannot assign issue to student" });
      }

      assignee = user._id;
    }

    // IMPORTANT — Auto escalation must work from here
    const now = new Date();

    const issue = new Issue({
      userId: req.user.id,
      title,
      description,
      media,
      assignedTo: assignee,
      escalationLevel: assignee ? "assigned" : null,
      escalatedTo: assignee,
      escalatedAt: assignee ? now : null,
      escalationHistory: assignee
        ? [{ role: "assigned", userId: assignee, escalatedAt: now }]
        : []
    });

    await issue.save();
    await issue.populate("userId assignedTo", "name avatar role");

    // Notify assigned user
    if (assignee) {
      const notification = await Notification.create({
        userId: assignee,
        type: "issue",
        fromUser: req.user.id,
        message: `A new issue has been assigned to you: ${title}`
      });

      const io = req.app.get("io");
      io.to(assignee.toString()).emit("notification", notification);
    }

    res.status(201).json(issue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ------------------------------------------------------------------------
// UPDATE ISSUE STATUS
// ------------------------------------------------------------------------
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Open', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    )
      .populate('userId', 'name avatar')
      .populate('assignedTo', 'name avatar');

    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    // Notify creator
    const user = await User.findById(req.user.id);

    const notification = new Notification({
      userId: issue.userId._id,
      type: 'issue',
      fromUser: req.user.id,
      message: `${user.name} updated issue status to: ${status}`
    });

    await notification.save();

    // Emit notification
    const io = req.app.get('io');
    io.to(issue.userId._id.toString()).emit('notification', notification);

    res.json(issue);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------------------------------------------------
// MANUAL ESCALATION
// ------------------------------------------------------------------------
router.patch('/:id/escalate', authenticateToken, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id).populate('userId', 'name department');
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    let nextUser = null;
    let nextRole = null;

    if (issue.escalationLevel === null || issue.escalationLevel === 'assigned') {
      // Assigned → Director
      nextRole = 'Director';
      nextUser = await User.findOne({
        role: 'Director',
        department: issue.userId.department
      });
    } else if (issue.escalationLevel === 'Director') {
      // Director → Owner
      nextRole = 'Owner';
      nextUser = await User.findOne({ role: 'Owner' });
    } else {
      return res.status(400).json({ message: 'Already at highest escalation (Chairman).' });
    }

    if (!nextUser) {
      return res.status(404).json({ message: 'User for next level not found.' });
    }

    // ✔ Update escalation details
    issue.escalationLevel = nextRole;
    issue.assignedTo = nextUser._id;
    issue.escalatedTo = nextUser._id;
    issue.escalatedAt = new Date();
    issue.escalationHistory.push({
      role: nextRole,
      userId: nextUser._id,
      escalatedAt: new Date()
    });

    await issue.save();

    // ✔ Notify new assignee
    const notification = new Notification({
      userId: nextUser._id,
      type: 'issue',
      fromUser: req.user.id,
      message: `Issue "${issue.title}" has been escalated to you (${nextRole}).`
    });

    await notification.save();

    const io = req.app.get('io');
    io.to(nextUser._id.toString()).emit('notification', notification);

    res.json({ message: `Issue escalated to ${nextRole}`, issue });
  } catch (error) {
    console.error('Manual escalation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
