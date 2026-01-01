/**
 * FILE: backend/src/socket/postHandlers.js
 * PURPOSE: Server-side first post event handlers for real-time updates
 */

const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

const initializePostHandlers = (socket, io) => {
  const userId = socket.userId;
  console.log(`📝 Post handlers initialized for user: ${userId}`);

  /**
   * POST LIKE / UNLIKE
   */
  socket.on('post:like', async ({ postId }) => {
    try {
      const post = await Post.findById(postId);
      if (!post) return;

      const likeIndex = post.likes.indexOf(userId);
      let liked = false;

      if (likeIndex === -1) {
        post.likes.push(userId);
        liked = true;

        // Notify post owner if not self
        if (post.userId.toString() !== userId) {
          const user = await User.findById(userId);
          const notification = new Notification({
            userId: post.userId,
            type: 'like',
            fromUser: userId,
            postId: post._id,
            message: `${user.name} liked your post`,
          });
          await notification.save();

          io.to(`user:${post.userId}`).emit('notification:new', {
            type: 'like',
            postId,
            from: userId,
            message: `${user.name} liked your post`,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        post.likes.splice(likeIndex, 1);
      }

      await post.save();

      // Broadcast updated like info
      io.emit('post:liked', {
        postId,
        userId,
        liked,
        likesCount: post.likes.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('❌ post:like error:', err);
    }
  });

  /**
   * COMMENT ADDED
   */
  socket.on('post:comment', async ({ postId, text }) => {
    try {
      if (!text?.trim()) return;

      const post = await Post.findById(postId);
      if (!post) return;

      const newComment = {
        userId,
        text: text.trim(),
        createdAt: new Date(),
      };

      post.comments.push(newComment);
      await post.save();
      await post.populate('comments.userId', 'name avatar');

      // Notify post owner if not self
      if (post.userId.toString() !== userId) {
        const user = await User.findById(userId);
        const notification = new Notification({
          userId: post.userId,
          type: 'comment',
          fromUser: userId,
          postId: post._id,
          message: `${user.name} commented on your post`,
        });
        await notification.save();

        io.to(`user:${post.userId}`).emit('notification:new', {
          type: 'comment',
          postId,
          from: userId,
          message: `${user.name} commented on your post`,
          timestamp: new Date().toISOString(),
        });
      }

      // Broadcast new comment
      io.emit('post:commented', {
        postId,
        comment: post.comments[post.comments.length - 1],
        commentsCount: post.comments.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('❌ post:comment error:', err);
    }
  });

  /**
   * COMMENT LIKE / UNLIKE
   */
  socket.on('comment:like', async ({ postId, commentId }) => {
    try {
      const post = await Post.findById(postId);
      if (!post) return;

      const comment = post.comments.id(commentId);
      if (!comment) return;

      const likeIndex = comment.likes?.indexOf(userId) ?? -1;
      let liked = false;

      if (likeIndex === -1) {
        comment.likes = comment.likes || [];
        comment.likes.push(userId);
        liked = true;
      } else {
        comment.likes.splice(likeIndex, 1);
      }

      await post.save();

      io.emit('comment:liked', {
        postId,
        commentId,
        userId,
        liked,
        likesCount: comment.likes.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('❌ comment:like error:', err);
    }
  });

  /**
   * POST SHARE
   */
  socket.on('post:share', async ({ postId }) => {
    try {
      const post = await Post.findById(postId);
      if (!post) return;

      post.shares += 1;
      await post.save();

      // Notify post owner
      if (post.userId.toString() !== userId) {
        const user = await User.findById(userId);
        const notification = new Notification({
          userId: post.userId,
          type: 'share',
          fromUser: userId,
          postId: post._id,
          message: `${user.name} shared your post`,
        });
        await notification.save();

        io.to(`user:${post.userId}`).emit('notification:new', {
          type: 'share',
          postId,
          from: userId,
          message: `${user.name} shared your post`,
          timestamp: new Date().toISOString(),
        });
      }

      io.emit('post:shared', {
        postId,
        userId,
        sharesCount: post.shares,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('❌ post:share error:', err);
    }
  });

  /**
   * POST EDITED
   */
  socket.on('post:edit', async ({ postId, content }) => {
    try {
      const post = await Post.findById(postId);
      if (!post) return;
      if (post.userId.toString() !== userId) return;

      post.content = content;
      await post.save();

      io.emit('post:edited', {
        postId,
        content,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('❌ post:edit error:', err);
    }
  });

  /**
   * POST DELETED
   */
  socket.on('post:delete', async ({ postId }) => {
    try {
      const post = await Post.findById(postId);
      if (!post) return;
      if (post.userId.toString() !== userId) return;

      await post.deleteOne();

      io.emit('post:deleted', {
        postId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('❌ post:delete error:', err);
    }
  });
};

module.exports = { initializePostHandlers };
