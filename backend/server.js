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
   🚀 TRUST PROXY (IMPORTANT FOR RENDER)
----------------------------------------- */
app.set("trust proxy", 1);

/* ----------------------------------------
   🚀 FIXED CORS CONFIG (ONLY ONE VERSION)
----------------------------------------- */
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://college-hub-frontend.onrender.com",
    "https://college-hub.onrender.com",
    "https://college-hub-pi.vercel.app",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ----------------------------------------
   🚀 REQUEST LOGGER
----------------------------------------- */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/* ----------------------------------------
   🚀 API ROUTES
----------------------------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/issues", issueRoutes);

/* ----------------------------------------
   🚀 HEALTH CHECK
----------------------------------------- */
app.get("/api/health", (req, res) => {
  const io = app.get("io");
  res.json({
    status: "OK",
    socketConnections: io ? io.engine.clientsCount : 0,
    timestamp: new Date().toISOString(),
  });
});

/* ----------------------------------------
   🚀 ROOT ROUTE
----------------------------------------- */
app.get("/", (req, res) => {
  res.json({
    message: "College Hub API Running ✅",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      posts: "/api/posts",
      messages: "/api/messages",
      issues: "/api/issues",
      notifications: "/api/notifications",
      health: "/api/health",
    },
  });
});

/* ----------------------------------------
   ❌ 404 HANDLER
----------------------------------------- */
app.use((req, res) => {
  console.log("❌ 404 Not Found:", req.method, req.path);
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
});

/* ----------------------------------------
   ❌ ERROR HANDLER
----------------------------------------- */
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

/* ----------------------------------------
   🚀 SOCKET.IO (CALLS + CHAT + TYPING)
----------------------------------------- */
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

/* ----------------------------------------
   🚀 SOCKET AUTH MIDDLEWARE
----------------------------------------- */
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      console.log("⚠️ Socket connected WITHOUT token");
      return next(); // still allow, but no userId
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id || decoded.userId;
    socket.user = decoded;

    console.log(`✅ Socket authenticated: ${socket.userId}`);
    next();
  } catch (err) {
    console.error("❌ Socket auth error:", err.message);
    next(new Error("Authentication failed"));
  }
});

/* ----------------------------------------
   🚀 SOCKET EVENTS
----------------------------------------- */
io.on("connection", (socket) => {
  const userId = socket.userId;

  if (userId) {
    console.log(`🔌 User connected: ${userId} (${socket.id})`);
    socket.join(`user:${userId}`);
    socket.broadcast.emit("user:online", { userId });

    // Initialize WebRTC Call Handlers
    try {
      initializeCallHandlers(socket, io);
      console.log(`📞 Call handlers ready for ${userId}`);
    } catch (err) {
      console.error("❌ Failed to init call handlers:", err);
    }
  } else {
    console.log(`🔌 Anonymous socket: ${socket.id}`);
  }

  // Typing indicator
  socket.on("user:typing", ({ to, isTyping }) => {
    if (!to || !userId) return;
    io.to(`user:${to}`).emit("user:typing", { userId, isTyping });
  });

  // Message events
  socket.on("message:send", (payload) => {
    try {
      const { to, message } = payload || {};
      if (!to || !message || !userId) return;

      io.to(`user:${to}`).emit("message:new", {
        from: userId,
        message,
        createdAt: new Date().toISOString(),
      });

      socket.emit("message:sent", {
        to,
        messageId: payload.messageId || null,
      });
    } catch (err) {
      socket.emit("error", { event: "message:send", message: err.message });
    }
  });

  // Notifications
  socket.on("notification:send", ({ to, notification }) => {
    if (!to || !notification || !userId) return;
    io.to(`user:${to}`).emit("notification:new", {
      from: userId,
      notification,
      timestamp: new Date().toISOString(),
    });
  });

  // Disconnect
  socket.on("disconnect", (reason) => {
    if (userId) {
      socket.broadcast.emit("user:offline", { userId });
    }
    console.log(`🔌 Socket disconnected: ${userId || socket.id} - ${reason}`);
  });
});

/* ----------------------------------------
   STORE IO INSTANCE
----------------------------------------- */
app.set("io", io);

/* ----------------------------------------
   🚀 START SERVER
----------------------------------------- */
server.listen(PORT, HOST, () => {
  console.log("\n🚀 Server started successfully!");
  console.log(`📍 Address: http://${HOST}:${PORT}`);
  console.log("📡 Socket.IO enabled");
  console.log("📞 WebRTC calling ready\n");
});

/* ----------------------------------------
   🚀 INITIALIZE SERVICES
----------------------------------------- */
(async () => {
  try {
    await connectDB();
  

    cloudinaryConfig();
    

    startIssueEscalationJob(io);
    console.log("✅ Issue Escalation Job Running\n");
  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
})();
