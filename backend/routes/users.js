/*
 * FILE: backend/routes/users.js
 * PURPOSE: User management routes + profile image upload via Cloudinary - FIXED
 */

import express from 'express';
const router = express.Router();
import authenticateToken from '../middleware/auth.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { getUserAssignments, getStudentCoordinator, getCoordinatorStudents } from '../utils/assignmentHelpers.js';
import multer from 'multer';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

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
    const currentUser = await User.findById(req.user.id);
    const filter = currentUser?.collegeId ? { collegeId: currentUser.collegeId } : {};
    if (currentUser?.role === 'SuperAdmin' && req.query.collegeId) {
      filter.collegeId = req.query.collegeId;
    }
    const users = await User.find(filter, '-password')
      .populate('branchId', 'name code')
      .populate('sectionId', 'name year')
      .populate('collegeId', 'name code')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------- GET CURRENT USER PROFILE --------------------
// This MUST come before /:id to avoid ID matching conflicts
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, '-password')
      .populate('followers', 'name avatar')
      .populate('following', 'name avatar')
      .populate('collegeId', 'name code city')
      .populate('courseId', 'name code')
      .populate('branchId', 'name code')
      .populate('sectionId', 'name year');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const assignments = await getUserAssignments(user._id);
    const userObj = user.toObject();
    userObj.assignments = assignments;

    if (user.role === 'Student') {
      userObj.coordinator = await getStudentCoordinator(user._id);
    }

    if (user.role === 'Faculty') {
      userObj.coordinatorStudents = await getCoordinatorStudents(user._id);
    }

    res.json(userObj);
  } catch (error) {
    console.error('Get profile error:', error);
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
      console.log('📝 Upload request received');
      console.log('User ID:', req.user.id);
      console.log('Files:', req.files);
      console.log('Body:', req.body);

      const updateData = {};

      // Avatar upload - Check if files exist and avatar is present
      if (req.files && req.files.avatar && req.files.avatar[0]) {
        const avatarPath = req.files.avatar[0].path;
        console.log('📤 Uploading avatar from:', avatarPath);
        
        const avatarResult = await cloudinary.uploader.upload(avatarPath, {
          folder: 'collegehub/avatars',
        });
        
        fs.unlinkSync(avatarPath);
        updateData.avatar = avatarResult.secure_url;
        console.log('✅ Avatar uploaded:', avatarResult.secure_url);
      }

      // Cover upload - Check if files exist and cover is present
      if (req.files && req.files.cover && req.files.cover[0]) {
        const coverPath = req.files.cover[0].path;
        console.log('📤 Uploading cover from:', coverPath);
        
        const coverResult = await cloudinary.uploader.upload(coverPath, {
          folder: 'collegehub/covers',
        });
        
        fs.unlinkSync(coverPath);
        updateData.cover = coverResult.secure_url;
        console.log('✅ Cover uploaded:', coverResult.secure_url);
      }

      // Name and profile fields
      if (req.body.name) {
        updateData.name = req.body.name;
      }
      if (req.body.phone !== undefined) {
        updateData.phone = req.body.phone || null;
      }
      if (req.body.bio !== undefined) {
        updateData.bio = req.body.bio;
      }
      if (req.body.department !== undefined) {
        updateData.department = req.body.department || null;
      }
      if (req.body.year) {
        updateData.year = Number(req.body.year);
      }

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No data to update' });
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true, select: '-password' }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('✅ User updated successfully:', updatedUser._id);

      res.json({
        message: '✅ Profile updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      
      // Clean up any uploaded files on error
      if (req.files) {
        if (req.files.avatar && req.files.avatar[0]) {
          try {
            fs.unlinkSync(req.files.avatar[0].path);
          } catch (e) {}
        }
        if (req.files.cover && req.files.cover[0]) {
          try {
            fs.unlinkSync(req.files.cover[0].path);
          } catch (e) {}
        }
      }
      
      res.status(500).json({ 
        error: 'Image upload failed. Please try again.',
        details: error.message 
      });
    }
  }
);

export default router;