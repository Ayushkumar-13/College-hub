/*
 * FILE: backend/routes/posts.js
 * PURPOSE: Post routes - Production ready with full real-time socket support
 */

const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const authenticateToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper to upload to Cloudinary
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

// Helper to get IO instance
const getIO = (req) => req.app.get('io');

/* ========================= CREATE POST ========================= */
router.post('/', authenticateToken, upload.array('media', 5), async (req, res) => {
  try {
    const { content, type, problemDescription } = req.body;
    const media = [];

    if (req.files?.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'posts');
        media.push({
          type: file.mimetype.startsWith('image') ? 'image' : 'video',
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    }

    if (!content?.trim() && media.length === 0 && type !== 'problem') {
      return res.status(400).json({ error: 'Post must have content or media' });
    }
    if (type === 'problem' && !problemDescription?.trim()) {
      return res.status(400).json({ error: 'Problem description required' });
    }

    const post = new Post({
      userId: req.user.id,
      content: content || '',
      type: type || 'feed',
      problemDescription: type === 'problem' ? problemDescription : undefined,
      media
    });

    await post.save();
    await post.populate('userId', 'name avatar role department');

    const io = getIO(req);
    if (io) io.emit('post:create', post); // real-time: all users

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* ========================= GET POSTS ========================= */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { filter } = req.query;
    let query = {};

    if (filter === 'trending') query.trending = true;
    else if (filter === 'following') {
      const user = await User.findById(req.user.id);
      query.userId = { $in: [...user.following, req.user.id] };
    } else if (filter && filter !== 'all') {
      const users = await User.find({ department: filter });
      query.userId = { $in: users.map(u => u._id) };
    }

    const posts = await Post.find(query)
      .populate('userId', 'name avatar role department')
      .populate('comments.userId', 'name avatar')
      .populate('comments.replies.userId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* ========================= GET SINGLE POST ========================= */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'name avatar role department')
      .populate('comments.userId', 'name avatar')
      .populate('comments.replies.userId', 'name avatar');

    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* ========================= EDIT POST ========================= */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.userId.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    if (content !== undefined) post.content = content.trim();
    await post.save();
    await post.populate('userId', 'name avatar role department');
    await post.populate('comments.userId', 'name avatar');

    const io = getIO(req);
    if (io) io.emit('post:edit:update', { postId: post._id.toString(), updatedData: { content: post.content } });

    res.json(post);
  } catch (error) {
    console.error('Edit post error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* ========================= DELETE POST ========================= */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.userId.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    if (post.media?.length > 0) {
      for (const media of post.media) {
        if (media.publicId) await cloudinary.uploader.destroy(media.publicId);
      }
    }

    await post.deleteOne();

    const io = getIO(req);
    if (io) io.emit('post:delete', { postId: post._id.toString() });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* ========================= LIKE / UNLIKE POST ========================= */
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const likeIndex = post.likes.indexOf(req.user.id);
    let liked = false;

    if (likeIndex === -1) {
      post.likes.push(req.user.id);
      liked = true;
    } else {
      post.likes.splice(likeIndex, 1);
      liked = false;
    }

    await post.save();

    const io = getIO(req);
    if (io) io.emit('post:like:update', {
      postId: post._id.toString(),
      userId: req.user.id,
      liked,
      likesCount: post.likes.length
    });

    res.json({ success: true, liked, likesCount: post.likes.length, userId: req.user.id });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* ========================= COMMENT ON POST ========================= */
router.post('/:id/comment', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Comment text required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const newComment = { userId: req.user.id, text: text.trim(), createdAt: new Date() };
    post.comments.push(newComment);
    await post.save();
    await post.populate('userId', 'name avatar role department');
    await post.populate('comments.userId', 'name avatar');

    const io = getIO(req);
    if (io) io.emit('post:comment:update', {
      postId: post._id.toString(),
      comment: post.comments[post.comments.length - 1],
      commentsCount: post.comments.length
    });

    res.json({ success: true, comment: post.comments[post.comments.length - 1], commentsCount: post.comments.length });
  } catch (error) {
    console.error('Comment post error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* ========================= LIKE COMMENT ========================= */
router.post('/:postId/comments/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (!comment.likes) comment.likes = [];
    const likeIndex = comment.likes.indexOf(req.user.id);
    let liked = false;

    if (likeIndex === -1) {
      comment.likes.push(req.user.id);
      liked = true;
    } else {
      comment.likes.splice(likeIndex, 1);
      liked = false;
    }

    await post.save();

    const io = getIO(req);
    if (io) io.emit('comment:like:update', {
      postId: post._id.toString(),
      commentId: comment._id.toString(),
      userId: req.user.id,
      liked,
      likesCount: comment.likes.length
    });

    res.json({ success: true, liked, likesCount: comment.likes.length, userId: req.user.id });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* ========================= SHARE POST ========================= */
router.post('/:id/share', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.shares += 1;
    await post.save();

    const io = getIO(req);
    if (io) io.emit('post:share:update', {
      postId: post._id.toString(),
      shares: post.shares
    });

    res.json({ success: true, sharesCount: post.shares, userId: req.user.id });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
