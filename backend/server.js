require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');
const cloudinaryConfig = require('./config/cloudinary');
const initializeSocket = require('./config/socket');
const { verifyToken } = require('./utils/jwt');
const { startIssueEscalationJob } = require('./utils/issueEscalationJob');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const issueRoutes = require('./routes/issues');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0'; // ✅ important for Render

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://college-hub-pi.vercel.app',
    ],
    credentials: true,
  })
);

// ✅ Start the server immediately so Render detects open port
server.listen(PORT, HOST, () => {
  console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
});

// ✅ Initialize everything async after the port is open
(async () => {
  try {
    await connectDB();
    cloudinaryConfig();

    const io = new Server(server, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:5173',
          'https://college-hub-pi.vercel.app',
        ],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) return next();
      try {
        const payload = verifyToken(token);
        if (payload?.id) socket.userId = payload.id;
      } catch {}
      next();
    });

    initializeSocket(io);
    app.set('io', io);

    startIssueEscalationJob(io);

    console.log('✅ MongoDB Connected');
    console.log('✅ Cloudinary Configured');
    console.log('✅ Socket.IO Initialized');
    console.log('✅ Issue Escalation Job Scheduled');
  } catch (err) {
    console.error('❌ Initialization error:', err);
  }
})();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/issues', issueRoutes);

// Health route
app.get('/api/health', (req, res) => {
  const io = app.get('io');
  res.json({
    status: 'OK',
    socketConnections: io ? io.engine.clientsCount : 0,
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => res.json({ message: 'College Hub API Running ✅' }));

// Error handlers
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => res.status(500).json({ error: 'Internal server error' }));

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => process.exit(0));
});
