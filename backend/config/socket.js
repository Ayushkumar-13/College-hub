const socketHandlers = require('../utils/socketHandlers');

// Store online users: { userId: socketId }
const onlineUsers = new Map();

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

    // --- USER JOIN ---
    socket.on('join', (userId) => {
      if (!userId) return socket.emit('error', { message: 'UserId required' });

      const existingSocketId = onlineUsers.get(userId);
      if (existingSocketId && existingSocketId !== socket.id) {
        io.to(existingSocketId).emit('session:replaced');
      }

      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(userId);

      console.log(`👤 User ${userId} joined (Socket: ${socket.id})`);
      socket.broadcast.emit('user:online', userId);

      socket.emit('join:success', {
        userId,
        socketId: socket.id,
        onlineCount: onlineUsers.size,
        transport: socket.conn.transport.name,
      });
    });

    // --- MESSAGING ---
    socket.on('message:send', (data) => {
      try {
        socketHandlers.handleMessageSend(io, socket, data, onlineUsers);
      } catch (error) {
        console.error('❌ message:send error:', error);
        socket.emit('error', { event: 'message:send', message: error.message });
      }
    });

    socket.on('message:typing', (data) => {
      try {
        socketHandlers.handleTyping(io, socket, data, onlineUsers);
      } catch {}
    });

    // --- NOTIFICATIONS ---
    socket.on('notification:send', (data) => {
      try {
        socketHandlers.handleNotification(io, data, onlineUsers);
      } catch {}
    });

    // --- AUDIO/VIDEO CALL EVENTS (WebRTC signaling) ---
    // User A calls User B
    socket.on('call-user', ({ userToCall, from, name, signalData, type }) => {
      const receiverSocketId = onlineUsers.get(userToCall);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('incoming-call', { from, name, signalData, type });
        console.log(`📞 ${from} calling ${userToCall} (${type})`);
      }
    });

    // User B answers the call
    socket.on('answer-call', ({ to, signal }) => {
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('call-accepted', signal);
        console.log(`✅ Call accepted by ${socket.userId} for ${to}`);
      }
    });

    // Exchange ICE candidates for better peer-to-peer connection
    socket.on('ice-candidate', ({ to, candidate }) => {
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('ice-candidate', candidate);
      }
    });

    // End call
    socket.on('end-call', ({ to }) => {
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('call-ended');
        console.log(`❌ Call ended by ${socket.userId} for ${to}`);
      }
    });

    // --- DISCONNECT ---
    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', socket.id, 'Reason:', reason);

      if (socket.userId) {
        const currentSocketId = onlineUsers.get(socket.userId);
        if (currentSocketId === socket.id) {
          onlineUsers.delete(socket.userId);
          socket.broadcast.emit('user:offline', socket.userId);
          console.log(`👋 User ${socket.userId} went offline`);
        }
      }
    });

    // Handle socket-level errors
    socket.on('error', (error) => {
      console.error('❌ Socket error on', socket.id, ':', error);
    });
  });

  // --- IO HELPERS ---
  io.onlineUsers = onlineUsers;

  io.emitToUser = (userId, event, data) => {
    const socketId = onlineUsers.get(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  };

  io.isUserOnline = (userId) => onlineUsers.has(userId);
  io.getOnlineUsersCount = () => onlineUsers.size;
  io.getOnlineUsersList = () => Array.from(onlineUsers.keys());
  io.broadcastToAll = (event, data) => io.emit(event, data);

  io.engine.on('connection_error', (err) => {
    console.error('❌ Connection error:', err);
  });

  console.log('✅ Socket.IO initialized with real-time audio/video call support');
};

module.exports = initializeSocket;
