// FILE: backend/src/server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/database");
const cloudinaryConfig = require("./config/cloudinary");
const { initializeCallHandlers } = require("./socket/callHandlers");
const { initializePostHandlers } = require("./socket/postHandlers");
const { startIssueEscalationJob } = require("./utils/issueEscalationJob");

// ROUTES
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const notificationRoutes = require("./routes/notifications");
const messageRoutes = require("./routes/messages");
const issueRoutes = require("./routes/issues");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 10000;
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
    "http://localhost:5173",
    "https://college-hub-pi.vercel.app",
    /\.vercel\.app$/,
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ----------------------------------------
   DEVICES ENDPOINT
----------------------------------------- */
app.get('/api/devices', (req, res) => res.json({ devices: [] }));

/* ----------------------------------------
   LOGGER
----------------------------------------- */
app.use((req, res, next) => {
  const skipLog = ['/api/devices', '/api/notifications', '/api/health', '/api/messages/chats/list'];
  if (skipLog.includes(req.path)) return next();
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
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
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/issues", issueRoutes);

/* ----------------------------------------
   HEALTH & ROOT
----------------------------------------- */
app.get("/api/health", (req, res) => {
  const io = req.app.get("io");
  res.json({ status: "OK", socketConnections: io ? io.engine.clientsCount : 0 });
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
   INITIALIZE & START
----------------------------------------- */
(async () => {
  try {
    await connectDB();
    cloudinaryConfig();
    startIssueEscalationJob(io);
    server.listen(PORT, HOST, () => {
      console.log(`\n🚀 Server started on http://${HOST}:${PORT}\n`);
    });
  } catch (err) {
    console.error("❌ Critical Startup Error:", err.message);
    process.exit(1);
  }
})();