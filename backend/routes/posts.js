/*
 * FILE: backend/routes/posts.js
 * LOCATION: college-social-platform/backend/routes/posts.js
 * PURPOSE: Post management routes (create, get, like, comment, share, repost)
 */

const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const authenticateToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const Post = require('../models/Post');
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

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', authenticateToken, upload.array('media', 5), async (req, res) => {
  try {
    const { content } = req.body;
    const media = [];

    // Upload media files to Cloudinary
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'posts');
        media.push({
          type: file.mimetype.startsWith('image') ? 'image' : 'video',
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    }

    // Create post
    const post = new Post({
      userId: req.user.id,
      content,
      media
    });

    await post.save();
    await post.populate('userId', 'name avatar role department');

    // Notify followers
    const user = await User.findById(req.user.id);
    if (user.followers.length > 0) {
      const notifications = user.followers.map(followerId => ({
        userId: followerId,
        type: 'post',
        fromUser: req.user.id,
        postId: post._id,
        message: `${user.name} created a new post`
      }));

      await Notification.insertMany(notifications);

      // Emit socket events
      const io = req.app.get('io');
      user.followers.forEach(followerId => {
        io.to(followerId.toString()).emit('notification', {
          type: 'post',
          message: `${user.name} created a new post`
        });
      });
    }

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/posts
// @desc    Get all posts with optional filters
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { filter } = req.query;
    let query = {};

    if (filter === 'trending') {
      query.trending = true;
    } else if (filter === 'following') {
      const user = await User.findById(req.user.id);
      query.userId = { $in: user.following };
    } else if (filter && filter !== 'all') {
      const users = await User.find({ department: filter });
      query.userId = { $in: users.map(u => u._id) };
    }

    const posts = await Post.find(query)
      .populate('userId', 'name avatar role department')
      .populate('comments.userId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like/Unlike a post
// @access  Private
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user.id);

    if (likeIndex === -1) {
      // Like the post
      post.likes.push(req.user.id);

      // Create notification (only if not own post)
      if (post.userId.toString() !== req.user.id) {
        const user = await User.findById(req.user.id);
        const notification = new Notification({
          userId: post.userId,
          type: 'like',
          fromUser: req.user.id,
          postId: post._id,
          message: `${user.name} liked your post`
        });
        await notification.save();

        // Emit socket event
        const io = req.app.get('io');
        io.to(post.userId.toString()).emit('notification', notification);
      }
    } else {
      // Unlike the post
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/posts/:id/comment
// @desc    Comment on a post
// @access  Private
router.post('/:id/comment', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.comments.push({
      userId: req.user.id,
      text,
      createdAt: new Date()
    });

    await post.save();
    await post.populate('comments.userId', 'name avatar');

    // Create notification (only if not own post)
    if (post.userId.toString() !== req.user.id) {
      const user = await User.findById(req.user.id);
      const notification = new Notification({
        userId: post.userId,
        type: 'comment',
        fromUser: req.user.id,
        postId: post._id,
        message: `${user.name} commented on your post`
      });
      await notification.save();

      // Emit socket event
      const io = req.app.get('io');
      io.to(post.userId.toString()).emit('notification', notification);
    }

    res.json(post);
  } catch (error) {
    console.error('Comment post error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/posts/:id/share
// @desc    Share a post
// @access  Private
router.post('/:id/share', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.shares += 1;
    await post.save();

    res.json(post);
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/posts/:id/repost
// @desc    Repost a post
// @access  Private
router.post('/:id/repost', authenticateToken, async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);

    if (!originalPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const repost = new Post({
      userId: req.user.id,
      content: originalPost.content,
      media: originalPost.media,
      isRepost: true,
      originalPost: originalPost._id
    });

    await repost.save();
    await repost.populate('userId', 'name avatar role department');

    res.status(201).json(repost);
  } catch (error) {
    console.error('Repost error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;