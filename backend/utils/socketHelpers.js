/**
 * FILE: backend/utils/socketHelpers.js
 * LOCATION: college-social-platform/backend/utils/socketHelpers.js
 * PURPOSE: Helper functions for using Socket.IO in routes
 */

/**
 * Get Socket.IO instance from request
 */
const getIO = (req) => {
  return req.app.get('io');
};

/**
 * Send real-time message to user
 */
const sendMessageToUser = (req, receiverId, message) => {
  const io = getIO(req);
  if (io && io.emitToUser) {
    return io.emitToUser(receiverId, 'message:receive', message);
  }
  return false;
};

/**
 * Send real-time notification to user
 */
const sendNotificationToUser = (req, userId, notification) => {
  const io = getIO(req);
  if (io && io.emitToUser) {
    return io.emitToUser(userId, 'notification:receive', notification);
  }
  return false;
};

/**
 * Check if user is currently online
 */
const isUserOnline = (req, userId) => {
  const io = getIO(req);
  if (io && io.isUserOnline) {
    return io.isUserOnline(userId);
  }
  return false;
};

/**
 * Get list of online users
 */
const getOnlineUsers = (req) => {
  const io = getIO(req);
  if (io && io.onlineUsers) {
    return Array.from(io.onlineUsers.keys());
  }
  return [];
};

/**
 * Broadcast event to all connected users
 */
const broadcastToAll = (req, event, data) => {
  const io = getIO(req);
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  getIO,
  sendMessageToUser,
  sendNotificationToUser,
  isUserOnline,
  getOnlineUsers,
  broadcastToAll
};