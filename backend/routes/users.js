/*
 * FILE: backend/routes/users.js
 * LOCATION: college-social-platform/backend/routes/users.js
 * PURPOSE: User management routes (get users, follow/unfollow)
 */

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @route   GET /api/users
// @desc    Get all users
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password')
      .populate('followers', 'name avatar')
      .populate('following', 'name avatar');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/users/:id/follow
// @desc    Follow a user
// @access  Private
router.post('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    if (userToFollow.followers.includes(req.user.id)) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Add to followers and following
    userToFollow.followers.push(req.user.id);
    currentUser.following.push(req.params.id);

    await userToFollow.save();
    await currentUser.save();

    // Create notification
    const notification = new Notification({
      userId: req.params.id,
      type: 'follow',
      fromUser: req.user.id,
      message: `${currentUser.name} started following you`
    });
    await notification.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(req.params.id).emit('notification', notification);

    res.json({ message: 'Followed successfully' });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/users/:id/unfollow
// @desc    Unfollow a user
// @access  Private
router.post('/:id/unfollow', authenticateToken, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from followers and following
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== req.user.id
    );
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== req.params.id
    );

    await userToUnfollow.save();
    await currentUser.save();

    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;