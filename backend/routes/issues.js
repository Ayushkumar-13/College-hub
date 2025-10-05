/*
 * FILE: backend/routes/issues.js
 * LOCATION: college-social-platform/backend/routes/issues.js
 * PURPOSE: Issue management routes (create, get, update status)
 */

const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const authenticateToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const Issue = require('../models/Issue');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper function to upload to Cloudinary
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: `college-social/${folder}` },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// @route   GET /api/issues
// @desc    Get all issues
// @access  Private
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

// @route   POST /api/issues
// @desc    Create a new issue
// @access  Private
router.post('/', authenticateToken, upload.array('media', 5), async (req, res) => {
  try {
    const { title, description, assignedTo } = req.body;
    const media = [];

    // Upload media files to Cloudinary
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'issues');
        media.push({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    }

    // Create issue
    const issue = new Issue({
      userId: req.user.id,
      title,
      description,
      media,
      assignedTo
    });

    await issue.save();
    await issue.populate('userId', 'name avatar');
    await issue.populate('assignedTo', 'name avatar');

    // Create notification for assigned user
    const user = await User.findById(req.user.id);
    const notification = new Notification({
      userId: assignedTo,
      type: 'issue',
      fromUser: req.user.id,
      message: `${user.name} assigned an issue to you: ${title}`
    });
    await notification.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(assignedTo).emit('notification', notification);

    res.status(201).json(issue);
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH /api/issues/:id/status
// @desc    Update issue status
// @access  Private
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

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Notify issue creator about status change
    const user = await User.findById(req.user.id);
    const notification = new Notification({
      userId: issue.userId._id,
      type: 'issue',
      fromUser: req.user.id,
      message: `${user.name} updated issue status to: ${status}`
    });
    await notification.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(issue.userId._id.toString()).emit('notification', notification);

    res.json(issue);
  } catch (error) {
    console.error('Update issue status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/issues/:id
// @desc    Get single issue by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('userId', 'name avatar role department')
      .populate('assignedTo', 'name avatar role');

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json(issue);
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;