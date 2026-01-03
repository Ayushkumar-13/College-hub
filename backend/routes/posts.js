/*
 * FILE: backend/routes/posts.js  
 * PURPOSE: Debug version with extensive logging
 */

const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const authenticateToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

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

const getIO = (req) => req.app.get('io');

/* ========================= LIKE / UNLIKE POST ========================= */
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    console.log('👍 LIKE REQUEST:', {
      postId: req.params.id,
      userId: req.user.id
    });

    const post = await Post.findById(req.params.id);
    if (!post) {
      console.log('❌ Post not found:', req.params.id);
      return res.status(404).json({ error: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user.id);
    let liked = false;

    if (likeIndex === -1) {
      post.likes.push(req.user.id);
      liked = true;
      console.log('➕ Added like');
    } else {
      post.likes.splice(likeIndex, 1);
      liked = false;
      console.log('➖ Removed like');
    }

    await post.save();

    const responseData = {
      success: true,
      liked,
      likesCount: post.likes.length,
      userId: req.user.id
    };

    console.log('✅ Like saved to DB:', responseData);

    // Emit socket event
    const io = getIO(req);
    if (io) {
      const socketData = {
        postId: post._id.toString(),
        userId: req.user.id,
        liked,
        likesCount: post.likes.length
      };
      
      console.log('📡 EMITTING post:like:update:', socketData);
      io.emit('post:like:update', socketData);
      console.log('✅ Socket event emitted to all clients');
      
      // Also log connected clients
      console.log('👥 Connected clients:', io.engine.clientsCount);
    } else {
      console.log('⚠️ IO instance not available!');
    }

    res.json(responseData);
  } catch (error) {
    console.error('❌ Like post error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* ========================= COMMENT ON POST ========================= */
router.post('/:id/comment', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    
    console.log('💬 COMMENT REQUEST:', {
      postId: req.params.id,
      userId: req.user.id,
      text: text?.substring(0, 50)
    });

    if (!text?.trim()) {
      return res.status(400).json({ error: 'Comment text required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      console.log('❌ Post not found:', req.params.id);
      return res.status(404).json({ error: 'Post not found' });
    }

    const newComment = { 
      userId: req.user.id, 
      text: text.trim(), 
      createdAt: new Date() 
    };
    
    post.comments.push(newComment);
    await post.save();
    await post.populate('userId', 'name avatar role department');
    await post.populate('comments.userId', 'name avatar');

    const addedComment = post.comments[post.comments.length - 1];

    console.log('✅ Comment saved to DB:', {
      commentId: addedComment._id,
      commentsCount: post.comments.length
    });

    const responseData = {
      success: true,
      comment: addedComment,
      commentsCount: post.comments.length
    };

    // Emit socket event
    const io = getIO(req);
    if (io) {
      const socketData = {
        postId: post._id.toString(),
        comment: addedComment,
        commentsCount: post.comments.length
      };
      
      console.log('📡 EMITTING post:comment:update:', {
        postId: socketData.postId,
        commentId: addedComment._id,
        commentsCount: socketData.commentsCount
      });
      io.emit('post:comment:update', socketData);
      console.log('✅ Socket event emitted');
    } else {
      console.log('⚠️ IO instance not available!');
    }

    res.json(responseData);
  } catch (error) {
    console.error('❌ Comment post error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* ========================= LIKE COMMENT ========================= */
router.post('/:postId/comments/:commentId/like', authenticateToken, async (req, res) => {
  try {
    console.log('❤️ LIKE COMMENT REQUEST:', {
      postId: req.params.postId,
      commentId: req.params.commentId,
      userId: req.user.id
    });

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (!comment.likes) comment.likes = [];
    const likeIndex = comment.likes.indexOf(req.user.id);
    let liked = false;

    if (likeIndex === -1) {
      comment.likes.push(req.user.id);
      liked = true;
      console.log('➕ Added comment like');
    } else {
      comment.likes.splice(likeIndex, 1);
      liked = false;
      console.log('➖ Removed comment like');
    }

    await post.save();

    const responseData = {
      success: true,
      liked,
      likesCount: comment.likes.length,
      userId: req.user.id
    };

    console.log('✅ Comment like saved to DB:', responseData);

    // Emit socket event
    const io = getIO(req);
    if (io) {
      const socketData = {
        postId: post._id.toString(),
        commentId: comment._id.toString(),
        userId: req.user.id,
        liked,
        likesCount: comment.likes.length
      };
      
      console.log('📡 EMITTING comment:like:update:', socketData);
      io.emit('comment:like:update', socketData);
      console.log('✅ Socket event emitted');
    }

    res.json(responseData);
  } catch (error) {
    console.error('❌ Like comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* ========================= SHARE POST ========================= */
router.post('/:id/share', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 SHARE REQUEST:', {
      postId: req.params.id,
      userId: req.user.id
    });

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.shares += 1;
    await post.save();

    console.log('✅ Share saved to DB:', {
      postId: post._id,
      shares: post.shares
    });

    const responseData = {
      success: true,
      sharesCount: post.shares,
      userId: req.user.id
    };

    // Emit socket event
    const io = getIO(req);
    if (io) {
      const socketData = {
        postId: post._id.toString(),
        shares: post.shares
      };
      
      console.log('📡 EMITTING post:share:update:', socketData);
      io.emit('post:share:update', socketData);
      console.log('✅ Socket event emitted');
    }

    res.json(responseData);
  } catch (error) {
    console.error('❌ Share post error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ... (keep other routes unchanged)

module.exports = router;