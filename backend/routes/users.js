/*
 * FILE: backend/routes/users.js
 * PURPOSE: User management routes + profile image upload via Cloudinary
 */

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const User = require('../models/User');
const Notification = require('../models/Notification');
const multer = require('multer');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup
const upload = multer({ dest: 'uploads/' });

// -------------------- GET ALL USERS --------------------
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------- GET USER BY ID --------------------
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password')
      .populate('followers', 'name avatar')
      .populate('following', 'name avatar');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------- FOLLOW USER --------------------
router.post('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) return res.status(404).json({ error: 'User not found' });
    if (userToFollow.followers.includes(req.user.id)) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    userToFollow.followers.push(req.user.id);
    currentUser.following.push(req.params.id);

    await userToFollow.save();
    await currentUser.save();

    const notification = new Notification({
      userId: req.params.id,
      type: 'follow',
      fromUser: req.user.id,
      message: `${currentUser.name} started following you`,
    });
    await notification.save();

    const io = req.app.get('io');
    if (io) io.to(req.params.id).emit('notification', notification);

    res.json({ message: 'Followed successfully' });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------- UNFOLLOW USER --------------------
router.post('/:id/unfollow', authenticateToken, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow) return res.status(404).json({ error: 'User not found' });

    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== req.user.id
    );
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== req.params.id
    );

    await userToUnfollow.save();
    await currentUser.save();

    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------- UPLOAD PROFILE / COVER IMAGE --------------------
router.post(
  '/upload',
  authenticateToken,
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const updateData = {};

      // Avatar upload
      if (req.files.avatar) {
        const avatarPath = req.files.avatar[0].path;
        const avatarResult = await cloudinary.uploader.upload(avatarPath, {
          folder: 'collegehub/avatars',
        });
        fs.unlinkSync(avatarPath);
        updateData.avatar = avatarResult.secure_url;
      }

      // Cover upload
      if (req.files.cover) {
        const coverPath = req.files.cover[0].path;
        const coverResult = await cloudinary.uploader.upload(coverPath, {
          folder: 'collegehub/covers',
        });
        fs.unlinkSync(coverPath);
        updateData.cover = coverResult.secure_url;
      }

      // Name update
      if (req.body.name) {
        updateData.name = req.body.name;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true, select: '-password' }
      );

      if (!updatedUser) return res.status(404).json({ error: 'User not found' });

      res.json({
        message: '✅ Profile updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({ error: 'Image upload failed. Please try again.' });
    }
  }
);

module.exports = router;
