/**
 * FILE: backend/utils/socketHandlers.js
 * LOCATION: college-social-platform/backend/utils/socketHandlers.js
 * PURPOSE: Socket.IO event handler functions
 */

/**
 * Handle message send event
 */
const handleMessageSend = (io, socket, data, onlineUsers) => {
  const { receiverId, message } = data;
  
  console.log(`💬 Message from ${socket.userId} to ${receiverId}`);
  
  // Send to receiver if they're online
  const receiverSocketId = onlineUsers.get(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit('message:receive', {
      ...message,
      senderId: socket.userId
    });
  }
  
  // Send confirmation back to sender
  socket.emit('message:sent', {
    messageId: message._id,
    status: receiverSocketId ? 'delivered' : 'sent'
  });
};

/**
 * Handle typing indicator
 */
const handleTyping = (io, socket, data, onlineUsers) => {
  const { receiverId, isTyping } = data;
  
  const receiverSocketId = onlineUsers.get(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit('message:typing', {
      senderId: socket.userId,
      isTyping
    });
  }
};

/**
 * Handle notification send
 */
const handleNotification = (io, data, onlineUsers) => {
  const { userId, notification } = data;
  
  const userSocketId = onlineUsers.get(userId);
  if (userSocketId) {
    io.to(userSocketId).emit('notification:receive', notification);
  }
};

/**
 * Emit event to specific user
 */
const emitToUser = (io, userId, event, data) => {
  if (io.emitToUser) {
    return io.emitToUser(userId, event, data);
  }
  return false;
};

/**
 * Check if user is online
 */
const isUserOnline = (io, userId) => {
  if (io.isUserOnline) {
    return io.isUserOnline(userId);
  }
  return false;
};

/**
 * Get online users
 */
const getOnlineUsers = (io) => {
  if (io.onlineUsers) {
    return Array.from(io.onlineUsers.keys());
  }
  return [];
};

module.exports = {
  handleMessageSend,
  handleTyping,
  handleNotification,
  emitToUser,
  isUserOnline,
  getOnlineUsers
};