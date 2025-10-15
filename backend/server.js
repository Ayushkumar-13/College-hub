// FILE: backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');
const cloudinaryConfig = require('./config/cloudinary');
const initializeSocket = require('./config/socket');
const { verifyToken } = require('./utils/jwt');
// const { startEscalationJob } = require('./utils/escalationJob'); // added
const { startIssueEscalationJob } = require('./utils/issueEscalationJob');

// API routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const issueRoutes = require('./routes/issues');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS setup
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

(async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Configure Cloudinary
    cloudinaryConfig();

    // Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:5173'],
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000,
      maxHttpBufferSize: 1e8,
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true,
      }
    });

    // JWT middleware for sockets
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) return next();
      try {
        const payload = verifyToken(token);
        if (payload?.id) {
          socket.userId = payload.id;
          console.log('Socket authenticated for user:', payload.id);
        }
      } catch (err) {
        console.warn(`JWT verification failed: ${err.message}`);
      }
      next();
    });

    initializeSocket(io);
    app.set('io', io);

    // Start problem escalation job
    // startEscalationJob(io);
    startIssueEscalationJob(io);

    // Mount routes
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/posts', postRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/messages', messageRoutes);
    app.use('/api/issues', issueRoutes);

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        socketConnections: io.engine.clientsCount 
      });
    });

    // 404 handler
    app.use((req, res) => {
      if (req.path.startsWith('/socket.io')) return;
      res.status(404).json({ error: 'Route not found' });
    });

    // Global error handler
    app.use((err, req, res, next) => {
      console.error('Global error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO ready`);
      console.log(`${'='.repeat(50)}\n`);
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
