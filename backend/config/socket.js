/**
 * FILE: backend/src/config/socket.js
 * PURPOSE: Socket.IO server configuration and initialization (Claude-style)
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { initializeCallHandlers } = require('../socket/callHandlers');

let io = null;

/**
 * Initialize Socket.IO server
 * @param {http.Server} server - Node HTTP server
 * @returns {Server} io - Socket.IO server instance
 */
const initializeSocket = (server) => {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware - expects JWT in handshake.auth.token or Authorization header
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split?.(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id || decoded.userId;
      socket.user = decoded;

      console.log(`✅ Socket auth success for user: ${socket.userId}`);
      return next();
    } catch (err) {
      console.error('❌ Socket auth failed:', err.message);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id} (user:${socket.userId})`);

    // Put socket into a personal room for targeted emits
    const personalRoom = `user:${socket.userId}`;
    socket.join(personalRoom);

    // Broadcast presence (others can listen)
    socket.broadcast.emit('user:online', { userId: socket.userId });

    // Initialize call-related handlers (WebRTC signaling)
    try {
      initializeCallHandlers(socket, io);
    } catch (err) {
      console.error('❌ Failed to initialize call handlers:', err);
    }

    // Typing indicator (message typing)
    socket.on('user:typing', ({ to, isTyping }) => {
      if (!to) return;
      io.to(`user:${to}`).emit('user:typing', {
        userId: socket.userId,
        isTyping,
      });
    });

    // Message status: read/delivered etc.
    socket.on('message:status', ({ messageId, status }) => {
      if (!messageId) return;
      // Broadcast status update to all (or do targeted emit)
      socket.broadcast.emit('message:status', { messageId, status });
    });

    // Placeholder for message sending: integrate your message handlers here.
    // Example:
    // socket.on('message:send', (payload) => { messageHandlers.handleSend(io, socket, payload); });
    socket.on('message:send', (payload) => {
      // Keep minimal behavior by default: emit to recipient room if present
      try {
        const { to, message } = payload || {};
        if (!to || !message) {
          return socket.emit('error', { event: 'message:send', message: 'Invalid payload' });
        }
        // emit to recipient
        io.to(`user:${to}`).emit('message:new', {
          from: socket.userId,
          message,
          createdAt: new Date().toISOString(),
        });
        // ack to sender
        socket.emit('message:sent', { to, messageId: payload.messageId || null });
      } catch (err) {
        console.error('❌ message:send error:', err);
        socket.emit('error', { event: 'message:send', message: err.message });
      }
    });

    // Notifications
    socket.on('notification:send', (data) => {
      try {
        const { to, notification } = data || {};
        if (!to || !notification) return;
        io.to(`user:${to}`).emit('notification:new', {
          from: socket.userId,
          notification,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        // ignore errors for noise but log
        console.error('❌ notification:send error:', err);
      }
    });

    // Disconnect handling
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (user:${socket.userId}) - ${reason}`);

      // Notify others user is offline
      socket.broadcast.emit('user:offline', { userId: socket.userId });
      // leave rooms automatically handled by socket.io
    });

    // Socket-level error
    socket.on('error', (err) => {
      console.error(`❌ Socket error [user:${socket.userId}]:`, err);
    });
  });

  // Helpful utility functions attached to io
  const getIO = () => {
    if (!io) throw new Error('Socket.IO not initialized');
    return io;
  };

  const emitToUser = (userId, event, data) => {
    if (!io) return false;
    io.to(`user:${userId}`).emit(event, data);
    return true;
  };

  const emitToUsers = (userIds, event, data) => {
    if (!io || !Array.isArray(userIds)) return;
    userIds.forEach((u) => io.to(`user:${u}`).emit(event, data));
  };

  const broadcast = (event, data) => {
    if (!io) return;
    io.emit(event, data);
  };

  // attach helpers to io instance (optional convenience)
  io.getIO = getIO;
  io.emitToUser = emitToUser;
  io.emitToUsers = emitToUsers;
  io.broadcast = broadcast;

  // engine error handler
  if (io.engine) {
    io.engine.on('connection_error', (err) => {
      console.error('❌ Connection error:', err);
    });
  }

  console.log('✅ Socket.IO initialized (Claude-style)');

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
  // For convenience exports
  emitToUser: (userId, event, data) => {
    if (!io) return false;
    io.to(`user:${userId}`).emit(event, data);
    return true;
  },
  emitToUsers: (userIds, event, data) => {
    if (!io || !Array.isArray(userIds)) return;
    userIds.forEach((u) => io.to(`user:${u}`).emit(event, data));
  },
  broadcast: (event, data) => {
    if (!io) return;
    io.emit(event, data);
  },
};
