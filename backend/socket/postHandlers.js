/**
 * FILE: backend/src/socket/postHandlers.js
 * PURPOSE: Socket handlers for BROADCASTING only (no DB updates)
 * DB updates happen in REST routes, socket just broadcasts to other users
 */

const initializePostHandlers = (socket, io) => {
  const userId = socket.userId;
  console.log(`📝 Post handlers initialized for user: ${userId}`);

  /**
   * POST LIKED - Just broadcast, DB already updated by REST API
   */
  socket.on('post:liked', ({ postId, userId: likerId, liked, likesCount }) => {
    try {
      console.log(`❤️ Broadcasting like: ${postId} by ${likerId}`);
      
      // Broadcast to all OTHER users (not sender)
      socket.broadcast.emit('post:liked', {
        postId,
        userId: likerId,
        liked,
        likesCount,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('❌ post:liked broadcast error:', err);
    }
  });

  /**
   * POST UNLIKED - Just broadcast
   */
  socket.on('post:unliked', ({ postId, userId: unlikerId, likesCount }) => {
    try {
      console.log(`💔 Broadcasting unlike: ${postId} by ${unlikerId}`);
      
      socket.broadcast.emit('post:unliked', {
        postId,
        userId: unlikerId,
        likesCount,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('❌ post:unliked broadcast error:', err);
    }
  });

  /**
   * COMMENT ADDED - Just broadcast
   */
  socket.on('post:commented', ({ postId, comment, commentsCount }) => {
    try {
      console.log(`💬 Broadcasting comment on: ${postId}`);
      
      socket.broadcast.emit('post:commented', {
        postId,
        comment,
        commentsCount,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('❌ post:commented broadcast error:', err);
    }
  });

  /**
   * COMMENT LIKED - Just broadcast
   */
  socket.on('comment:liked', ({ postId, commentId, userId: likerId, liked, likesCount }) => {
    try {
      console.log(`❤️ Broadcasting comment like: ${commentId}`);
      
      socket.broadcast.emit('comment:liked', {
        postId,
        commentId,
        userId: likerId,
        liked,
        likesCount,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('❌ comment:liked broadcast error:', err);
    }
  });

  /**
   * POST SHARED - Just broadcast
   */
  socket.on('post:shared', ({ postId, userId: sharerId, sharesCount }) => {
    try {
      console.log(`🔄 Broadcasting share: ${postId}`);
      
      socket.broadcast.emit('post:shared', {
        postId,
        userId: sharerId,
        sharesCount,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('❌ post:shared broadcast error:', err);
    }
  });

  /**
   * POST EDITED - Just broadcast
   */
  socket.on('post:edited', ({ postId, content }) => {
    try {
      console.log(`✏️ Broadcasting edit: ${postId}`);
      
      socket.broadcast.emit('post:edited', {
        postId,
        content,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('❌ post:edited broadcast error:', err);
    }
  });

  /**
   * POST DELETED - Just broadcast
   */
  socket.on('post:deleted', ({ postId }) => {
    try {
      console.log(`🗑️ Broadcasting delete: ${postId}`);
      
      socket.broadcast.emit('post:deleted', {
        postId,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('❌ post:deleted broadcast error:', err);
    }
  });
};

module.exports = { initializePostHandlers };

/**
 * HOW THIS WORKS:
 * 
 * 1. User clicks like → Frontend calls REST API
 * 2. REST API updates database → Returns success
 * 3. Frontend emits socket event with updated data
 * 4. Socket broadcasts to OTHER users only
 * 5. Other users' UIs update in real-time
 * 
 * NO DATABASE UPDATES IN SOCKET HANDLERS!
 */