import 'dotenv/config';
import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import connectDB from './config/database.js';
import cloudinaryConfig from './config/cloudinary.js';
import { initializeCallHandlers } from './socket/callHandlers.js';
import { initializePostHandlers } from './socket/postHandlers.js';
import { startIssueEscalationJob } from './utils/issueEscalationJob.js';

// ROUTES
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import notificationRoutes from './routes/notifications.js';
import messageRoutes from './routes/messages.js';
import issueRoutes from './routes/issues.js';
import adminRoutes from './routes/admin.js';
import collegeRoutes from './routes/colleges.js';
import courseRoutes from './routes/courses.js';
import branchRoutes from './routes/branches.js';
import superadminRoutes from './routes/superadmin.js';
import deviceRoutes from './routes/devices.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5050;
const HOST = "0.0.0.0";

/* ----------------------------------------
   TRUST PROXY
----------------------------------------- */
app.set("trust proxy", 1);

/* ----------------------------------------
   CORS CONFIG
----------------------------------------- */
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "https://college-hub-pi.vercel.app",
    "https://college-hub-eyfi.vercel.app",
    /\.vercel\.app$/,
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-college-id"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ----------------------------------------
   DB READINESS — avoid proxy ECONNREFUSED while MongoDB connects
----------------------------------------- */
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (mongoose.connection.readyState === 1) return next();
  return res.status(503).json({
    success: false,
    error: 'Server is starting. Database not ready — please retry in a few seconds.',
  });
});

/* ----------------------------------------
   SOCKET.IO SETUP
----------------------------------------- */
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 120000,
  pingInterval: 30000,
  transports: ["websocket", "polling"],
});

io.emitToUser = (userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
  return true;
};

io.emitToUsers = (userIds, event, data) => {
  if (!Array.isArray(userIds)) return;
  userIds.forEach(userId => io.to(`user:${userId}`).emit(event, data));
};

io.broadcast = (event, data) => {
  io.emit(event, data);
};

app.set("io", io);

/* ----------------------------------------
   SOCKET AUTH MIDDLEWARE
----------------------------------------- */
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      console.error('❌ Socket rejected: No token');
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'College_hub');

    if (!decoded.id && !decoded.userId) {
      console.error('❌ Socket rejected: Invalid token payload');
      return next(new Error('Authentication error: Invalid token'));
    }

    socket.userId = String(decoded.id || decoded.userId);
    socket.user = decoded;

    process.stdout.write(`✅ Socket authenticated: ${socket.userId}\n`);
    return next();

  } catch (err) {
    console.error('❌ Socket auth failed:', err.message);
    return next(new Error('Authentication error: Invalid token'));
  }
});

/* ----------------------------------------
   SOCKET CONNECTION HANDLER
----------------------------------------- */
io.on("connection", (socket) => {
  const userId = socket.userId;

  if (!userId) {
    console.error('⚠️  Socket without userId!');
    socket.disconnect();
    return;
  }

  console.log(`🔌 User connected: ${userId} (${socket.id})`);
  socket.join(`user:${userId}`);
  socket.broadcast.emit("user:online", { userId });

  // Initialize handlers
  try {
    initializeCallHandlers(socket, io);
    initializePostHandlers(socket, io);
  } catch (err) {
    console.error('❌ Socket handler error:', err);
  }

  socket.on("typing", ({ to, isTyping }) => {
    if (!to) return;
    io.to(`user:${to}`).emit("user:typing", { from: userId, isTyping });
  });

  socket.on("message:send", async (data) => {
    try {
      const { to, message } = data;
      if (!to || !message) return;
      const newMsg = { from: userId, to, text: message, createdAt: new Date() };
      io.to(`user:${to}`).emit("message:new", newMsg);
      socket.emit("message:delivered", { ...newMsg, status: "delivered" });
    } catch (err) {
      console.error('❌ Message error:', err);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`🔌 User disconnected: ${userId} - ${reason}`);
    socket.broadcast.emit("user:offline", { userId });
  });
});

/* ----------------------------------------
   ROUTES
----------------------------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/superadmin", superadminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/devices", deviceRoutes);

/* ----------------------------------------
   HEALTH & ROOT
----------------------------------------- */
app.get("/api/health", (req, res) => {
  const io = req.app.get("io");
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    status: dbReady ? "OK" : "STARTING",
    database: dbReady ? "connected" : "connecting",
    socketConnections: io ? io.engine.clientsCount : 0,
  });
});

app.get("/", (req, res) => {
  res.json({ message: "College Hub API Running ✅" });
});

/* ----------------------------------------
   GLOBAL ERROR HANDLERS
----------------------------------------- */
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err ? (err.stack || err.message) : err);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason ? (reason.stack || reason.message || reason) : reason;
  console.error('❌ UNHANDLED REJECTION:', msg);
});

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err ? (err.stack || err.message) : err);
  res.status(500).json({ error: "Internal server error", message: err?.message || 'Unknown error' });
});

/* ----------------------------------------
   GRACEFUL SHUTDOWN (fixes EADDRINUSE on nodemon restart)
----------------------------------------- */
let shuttingDown = false;

const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} received — closing server...`);

  io.close(() => {
    server.close(() => {
      mongoose.connection.close(false).finally(() => process.exit(0));
    });
  });

  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

/* ----------------------------------------
   INITIALIZE & START
----------------------------------------- */
const startServer = () =>
  new Promise((resolve, reject) => {
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use.`);
        console.error('   Stop the other process, then restart:');
        console.error(`   netstat -ano | findstr :${PORT}`);
        console.error('   taskkill /PID <pid> /F\n');
      }
      reject(err);
    });

    server.listen(PORT, HOST, () => {
      console.log(`\n🚀 Server started on http://localhost:${PORT}\n`);
      resolve();
    });
  });

(async () => {
  try {
    // Listen immediately so Vite/admin proxies never get ECONNREFUSED during DB connect
    await startServer();

    connectDB()
      .then(() => {
        cloudinaryConfig();
        startIssueEscalationJob(io);
        console.log('✅ Backend ready (database connected)\n');
      })
      .catch((err) => {
        console.error('❌ Database connection failed:', err.message);
        console.error('   API requests will return 503 until MongoDB is available.\n');
      });
  } catch (err) {
    console.error('❌ Critical Startup Error:', err.message);
    process.exit(1);
  }
})();