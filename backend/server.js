// FILE: backend/src/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/database');
const cloudinaryConfig = require('./config/cloudinary');
const { initializeCallHandlers } = require('./socket/callHandlers');
const { verifyToken } = require('./utils/jwt');
const { startIssueEscalationJob } = require('./utils/issueEscalationJob');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const issueRoutes = require('./routes/issues');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    /\.vercel\.app$/,
    'https://college-hub-pi.vercel.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/issues', issueRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  const io = app.get('io');
  res.json({
    status: 'OK',
    socketConnections: io ? io.engine.clientsCount : 0,
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'College Hub API Running ✅',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      posts: '/api/posts',
      messages: '/api/messages',
      issues: '/api/issues',
      notifications: '/api/notifications',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 Not Found:', req.method, req.path);
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Initialize Socket.IO with call support
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || 
                  socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      console.log('⚠️  Socket connection without token');
      return next(); // Allow connection but without userId
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id || decoded.userId;
    socket.user = decoded;

    console.log(`✅ Socket authenticated: ${socket.userId}`);
    next();
  } catch (err) {
    console.error('❌ Socket auth error:', err.message);
    next(new Error('Authentication failed'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  const userId = socket.userId;
  
  if (userId) {
    console.log(`🔌 User connected: ${userId} (${socket.id})`);
    
    // Join user's personal room
    socket.join(`user:${userId}`);
    
    // Notify others user is online
    socket.broadcast.emit('user:online', { userId });
  } else {
    console.log(`🔌 Anonymous connection: ${socket.id}`);
  }

  // Initialize call handlers (WebRTC signaling)
  if (userId) {
    try {
      initializeCallHandlers(socket, io);
      console.log(`📞 Call handlers ready for user: ${userId}`);
    } catch (err) {
      console.error('❌ Failed to initialize call handlers:', err);
    }
  }

  // Typing indicator
  socket.on('user:typing', ({ to, isTyping }) => {
    if (!to || !userId) return;
    io.to(`user:${to}`).emit('user:typing', {
      userId,
      isTyping,
    });
  });

  // Message status updates
  socket.on('message:status', ({ messageId, status }) => {
    if (!messageId) return;
    socket.broadcast.emit('message:status', { messageId, status });
  });

  // Message sending
  socket.on('message:send', (payload) => {
    try {
      const { to, message } = payload || {};
      if (!to || !message || !userId) {
        return socket.emit('error', {
          event: 'message:send',
          message: 'Invalid payload',
        });
      }

      // Emit to recipient
      io.to(`user:${to}`).emit('message:new', {
        from: userId,
        message,
        createdAt: new Date().toISOString(),
      });

      // Acknowledge to sender
      socket.emit('message:sent', {
        to,
        messageId: payload.messageId || null,
      });
    } catch (err) {
      console.error('❌ message:send error:', err);
      socket.emit('error', {
        event: 'message:send',
        message: err.message,
      });
    }
  });

  // Notification sending
  socket.on('notification:send', (data) => {
    try {
      const { to, notification } = data || {};
      if (!to || !notification || !userId) return;
      
      io.to(`user:${to}`).emit('notification:new', {
        from: userId,
        notification,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('❌ notification:send error:', err);
    }
  });

  // Disconnect handling
  socket.on('disconnect', (reason) => {
    if (userId) {
      console.log(`🔌 User disconnected: ${userId} (${socket.id}) - ${reason}`);
      socket.broadcast.emit('user:offline', { userId });
    } else {
      console.log(`🔌 Anonymous disconnected: ${socket.id} - ${reason}`);
    }
  });

  // Socket-level error
  socket.on('error', (err) => {
    console.error(`❌ Socket error [${userId || socket.id}]:`, err);
  });
});

// Store io instance for route access
app.set('io', io);

// Start server
server.listen(PORT, HOST, () => {
  console.log(`\n🚀 Server started successfully!`);
  console.log(`📍 Address: http://${HOST}:${PORT}`);
  console.log(`📡 Socket.IO enabled`);
  console.log(`📞 WebRTC calling ready\n`);
});

// Initialize async components
(async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB Connected');

    // Configure Cloudinary
    cloudinaryConfig();
    console.log('✅ Cloudinary Configured');

    // Start issue escalation job
    startIssueEscalationJob(io);
    console.log('✅ Issue Escalation Job Started\n');

  } catch (err) {
    console.error('❌ Initialization error:', err);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Unhandled rejection handler
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

module.exports = { app, server, io };