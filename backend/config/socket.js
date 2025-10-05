/**
 * FILE: backend/config/socket.js
 * LOCATION: college-social-platform/backend/config/socket.js
 * PURPOSE: Socket.IO configuration and event handlers - PRODUCTION READY
 */
const socketHandlers = require('../utils/socketHandlers');

// Store online users: { userId: socketId }
const onlineUsers = new Map();

/**
 * Initialize Socket.IO
 * @param {Object} io - Socket.IO instance
 */
const initializeSocket = (io) => {
  console.log('🔌 Initializing Socket.IO...');
  
  io.on('connection', (socket) => {
    console.log('✅ New connection:', socket.id);
    console.log('   Transport:', socket.conn.transport.name);
    console.log('   Authenticated userId:', socket.userId || 'pending');
    
    // Monitor transport upgrades
    socket.conn.on('upgrade', (transport) => {
      console.log(`⬆️  Socket ${socket.id} upgraded to:`, transport.name);
    });
    
    // User joins with their ID
    socket.on('join', (userId) => {
      if (!userId) {
        console.warn('⚠️  Join event received without userId from', socket.id);
        socket.emit('error', { message: 'UserId is required to join' });
        return;
      }
     
      // Remove any existing socket for this user (handle multiple tabs/devices)
      const existingSocketId = onlineUsers.get(userId);
      if (existingSocketId && existingSocketId !== socket.id) {
        console.log(`🔄 User ${userId} reconnecting (replacing socket ${existingSocketId})`);
        // Notify old socket that it's being replaced
        io.to(existingSocketId).emit('session:replaced');
      }
      
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(userId);
     
      console.log(`👤 User ${userId} joined (Socket: ${socket.id})`);
      console.log(`📊 Online users: ${onlineUsers.size}`);
     
      // Broadcast user online status to others
      socket.broadcast.emit('user:online', userId);
      
      // Send confirmation back to user
      socket.emit('join:success', { 
        userId, 
        socketId: socket.id,
        onlineCount: onlineUsers.size,
        transport: socket.conn.transport.name
      });
    });
    
    // Handle real-time messaging
    socket.on('message:send', (data) => {
      try {
        socketHandlers.handleMessageSend(io, socket, data, onlineUsers);
      } catch (error) {
        console.error('❌ Error handling message:send:', error);
        socket.emit('error', { event: 'message:send', message: error.message });
      }
    });
    
    socket.on('message:typing', (data) => {
      try {
        socketHandlers.handleTyping(io, socket, data, onlineUsers);
      } catch (error) {
        console.error('❌ Error handling message:typing:', error);
      }
    });
    
    // Handle notifications
    socket.on('notification:send', (data) => {
      try {
        socketHandlers.handleNotification(io, data, onlineUsers);
      } catch (error) {
        console.error('❌ Error handling notification:send:', error);
      }
    });
    
    // Handle connection errors
    socket.on('error', (error) => {
      console.error('❌ Socket error on', socket.id, ':', error);
    });
    
    // Handle disconnecting (before full disconnect)
    socket.on('disconnecting', (reason) => {
      console.log('⚠️  Socket disconnecting:', socket.id, 'Reason:', reason);
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', socket.id);
      console.log('   Reason:', reason);
     
      if (socket.userId) {
        // Only remove if this is still the active socket for this user
        const currentSocketId = onlineUsers.get(socket.userId);
        if (currentSocketId === socket.id) {
          onlineUsers.delete(socket.userId);
          socket.broadcast.emit('user:offline', socket.userId);
          console.log(`👋 User ${socket.userId} went offline`);
        } else {
          console.log(`ℹ️  Old socket for user ${socket.userId} disconnected (already replaced)`);
        }
        console.log(`📊 Online users: ${onlineUsers.size}`);
      }
    });
  });
  
  // Handle io-level errors
  io.engine.on('connection_error', (err) => {
    console.error('❌ Connection error:', {
      code: err.code,
      message: err.message,
      context: err.context
    });
  });
  
  // Attach helper functions to io instance
  io.onlineUsers = onlineUsers;
  
  io.emitToUser = (userId, event, data) => {
    const socketId = onlineUsers.get(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
      console.log(`📤 Emitted '${event}' to user ${userId}`);
      return true;
    }
    console.log(`ℹ️  User ${userId} not online, cannot emit '${event}'`);
    return false;
  };
  
  io.isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };
  
  io.getOnlineUsersCount = () => {
    return onlineUsers.size;
  };
  
  io.getOnlineUsersList = () => {
    return Array.from(onlineUsers.keys());
  };
  
  io.broadcastToAll = (event, data) => {
    io.emit(event, data);
    console.log(`📢 Broadcasted '${event}' to all users`);
  };
  
  console.log('✅ Socket.IO initialized successfully');
  console.log('📊 Monitoring connections...\n');
};

module.exports = initializeSocket;