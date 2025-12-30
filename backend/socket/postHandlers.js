/**
 * FILE: backend/src/socket/postHandlers.js
 * PURPOSE: Socket event handlers for posts (likes, comments)
 * Add this file to handle real-time post events
 */

const Post = require('../models/Post');

const initializePostHandlers = (socket, io) => {
  const userId = socket.userId;

  console.log(`📝 Post handlers initialized for user: ${userId}`);

  /**
   * POST LIKED - Broadcast like to all users viewing the post
   */
  socket.on('post:like', async ({ postId, userId: likerId, likesCount }) => {
    try {
      console.log(`❤️ Post ${postId} liked by ${likerId}`);
      
      // Broadcast to all connected clients except sender
      socket.broadcast.emit('post:liked', {
        postId,
        userId: likerId,
        likesCount,
        timestamp: new Date().toISOString()
      });

      // Get post owner and send notification
      const post = await Post.findById(postId).populate('userId');
      if (post && post.userId._id.toString() !== likerId) {
        io.to(`user:${post.userId._id}`).emit('notification:new', {
          type: 'like',
          postId,
          from: likerId,
          message: 'liked your post',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Error in post:like:', error);
    }
  });

  /**
   * POST UNLIKED - Broadcast unlike to all users
   */
  socket.on('post:unlike', async ({ postId, userId: unlikerId, likesCount }) => {
    try {
      console.log(`💔 Post ${postId} unliked by ${unlikerId}`);
      
      socket.broadcast.emit('post:unliked', {
        postId,
        userId: unlikerId,
        likesCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error in post:unlike:', error);
    }
  });

  /**
   * COMMENT ADDED - Broadcast new comment to all users
   */
  socket.on('post:comment', async ({ postId, comment, commentsCount }) => {
    try {
      console.log(`💬 New comment on post ${postId} by ${userId}`);
      
      // Broadcast to all connected clients except sender
      socket.broadcast.emit('post:commented', {
        postId,
        comment,
        commentsCount,
        timestamp: new Date().toISOString()
      });

      // Get post owner and send notification
      const post = await Post.findById(postId).populate('userId');
      if (post && post.userId._id.toString() !== comment.userId) {
        io.to(`user:${post.userId._id}`).emit('notification:new', {
          type: 'comment',
          postId,
          from: comment.userId,
          message: 'commented on your post',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Error in post:comment:', error);
    }
  });

  /**
   * COMMENT LIKED - Broadcast comment like
   */
  socket.on('comment:like', async ({ postId, commentId, userId: likerId, likesCount }) => {
    try {
      console.log(`❤️ Comment ${commentId} liked by ${likerId}`);
      
      socket.broadcast.emit('comment:liked', {
        postId,
        commentId,
        userId: likerId,
        likesCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error in comment:like:', error);
    }
  });

  /**
   * POST SHARED - Broadcast share event
   */
  socket.on('post:share', async ({ postId, userId: sharerId, sharesCount }) => {
    try {
      console.log(`🔄 Post ${postId} shared by ${sharerId}`);
      
      socket.broadcast.emit('post:shared', {
        postId,
        userId: sharerId,
        sharesCount,
        timestamp: new Date().toISOString()
      });

      // Notify post owner
      const post = await Post.findById(postId).populate('userId');
      if (post && post.userId._id.toString() !== sharerId) {
        io.to(`user:${post.userId._id}`).emit('notification:new', {
          type: 'share',
          postId,
          from: sharerId,
          message: 'shared your post',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Error in post:share:', error);
    }
  });

  /**
   * POST DELETED - Broadcast deletion
   */
  socket.on('post:delete', ({ postId }) => {
    try {
      console.log(`🗑️ Post ${postId} deleted`);
      
      socket.broadcast.emit('post:deleted', {
        postId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error in post:delete:', error);
    }
  });

  /**
   * POST EDITED - Broadcast edit
   */
  socket.on('post:edit', ({ postId, content }) => {
    try {
      console.log(`✏️ Post ${postId} edited`);
      
      socket.broadcast.emit('post:edited', {
        postId,
        content,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error in post:edit:', error);
    }
  });
};

module.exports = { initializePostHandlers };

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. Add to backend/src/server.js after initializeCallHandlers:
 * 
 * const { initializePostHandlers } = require('./socket/postHandlers');
 * 
 * // Inside io.on('connection', (socket) => { ... })
 * try {
 *   initializePostHandlers(socket, io);
 *   console.log(`📝 Post handlers ready for user: ${userId}`);
 * } catch (err) {
 *   console.error('❌ Failed to initialize post handlers:', err);
 * }
 */