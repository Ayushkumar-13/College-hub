/*
 * FILE: backend/routes/issues.js
 * PURPOSE: College-scoped issue management with full escalation chain
 */

import express from 'express';
const router = express.Router();
import { v2 as cloudinary } from 'cloudinary';

import authenticateToken from '../middleware/auth.js';
import upload from '../middleware/upload.js';

import Issue from '../models/Issue.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import ProblemCategory from '../models/ProblemCategory.js';
import { isAdminRole } from '../utils/userHelpers.js';
import { buildIssueVisibilityFilter } from '../utils/issueVisibility.js';
import { initializeIssueEscalation, manualEscalateIssue } from '../utils/issueEscalation.js';

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: `college-social/${folder}` },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    uploadStream.end(fileBuffer);
  });
};

router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const reporter = await User.findById(req.user.id);
    if (!reporter?.collegeId) return res.json([]);
    const categories = await ProblemCategory.find({
      collegeId: reporter.collegeId,
      isActive: true,
    }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const filter = await buildIssueVisibilityFilter(currentUser);

    const issues = await Issue.find(filter)
      .populate('userId', 'name avatar role rollNumber year')
      .populate('assignedTo', 'name avatar role')
      .populate('currentAssigneeId', 'name avatar role')
      .populate('problemCategoryId', 'name')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const filter = await buildIssueVisibilityFilter(currentUser);

    const issue = await Issue.findOne({ _id: req.params.id, ...filter })
      .populate('userId', 'name avatar role rollNumber')
      .populate('assignedTo', 'name avatar role')
      .populate('currentAssigneeId', 'name avatar role')
      .populate('coordinatorId', 'name avatar role')
      .populate('hodId', 'name avatar role')
      .populate('domainSolverId', 'name avatar role')
      .populate('directorId', 'name avatar role')
      .populate('ownerId', 'name avatar role')
      .populate('problemCategoryId', 'name')
      .populate('escalationHistory.userId', 'name avatar role');

    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json(issue);
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateToken, upload.array('media', 5), async (req, res) => {
  try {
    const { title, description, problemCategoryId, categoryId } = req.body;
    const catId = categoryId || problemCategoryId;

    const reporter = await User.findById(req.user.id);
    if (!reporter?.collegeId) {
      return res.status(400).json({ error: 'You must belong to a college to report issues' });
    }

    if (!catId) {
      return res.status(400).json({ error: 'Problem category is required' });
    }

    const category = await ProblemCategory.findOne({
      _id: catId,
      collegeId: reporter.collegeId,
      isActive: true,
    });
    if (!category) {
      return res.status(400).json({ error: 'Invalid problem category' });
    }

    const media = [];
    if (req.files?.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'issues');
        media.push({ url: result.secure_url, publicId: result.public_id });
      }
    }

    const issue = new Issue({
      userId: req.user.id,
      collegeId: reporter.collegeId,
      title,
      description,
      media,
    });

    const io = req.app.get('io');
    const { issue: savedIssue, message } = await initializeIssueEscalation(
      issue,
      reporter,
      catId,
      io
    );

    await savedIssue.populate([
      { path: 'userId', select: 'name avatar role' },
      { path: 'currentAssigneeId', select: 'name avatar role' },
      { path: 'problemCategoryId', select: 'name' },
    ]);

    res.status(201).json({ success: true, issue: savedIssue, message });
  } catch (err) {
    console.error('Create Issue Error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Open', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const currentUser = await User.findById(req.user.id);
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const canUpdate =
      isAdminRole(currentUser.role) ||
      issue.currentAssigneeId?.toString() === currentUser._id.toString() ||
      issue.assignedTo?.toString() === currentUser._id.toString();

    if (!canUpdate) {
      return res.status(403).json({ error: 'Not authorized to update this issue' });
    }

    issue.status = status;
    issue.updatedAt = new Date();
    if (status === 'Resolved') {
      issue.escalationLevel = 'resolved';
    }
    await issue.save();

    await issue.populate('userId', 'name avatar');

    const notification = await Notification.create({
      userId: issue.userId._id,
      type: 'issue',
      fromUser: req.user.id,
      message: `${currentUser.name} updated issue status to: ${status}`,
    });

    const io = req.app.get('io');
    io.to(`user:${issue.userId._id}`).emit('notification:new', notification);

    res.json(issue);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/escalate', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const canEscalate =
      isAdminRole(currentUser.role) ||
      issue.currentAssigneeId?.toString() === currentUser._id.toString() ||
      issue.assignedTo?.toString() === currentUser._id.toString();

    if (!canEscalate) {
      return res.status(403).json({ error: 'Not authorized to escalate this issue' });
    }

    const io = req.app.get('io');
    const updated = await manualEscalateIssue(req.params.id, io);
    res.json({ message: `Issue escalated to ${updated.escalationLevel}`, issue: updated });
  } catch (error) {
    console.error('Manual escalation error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
