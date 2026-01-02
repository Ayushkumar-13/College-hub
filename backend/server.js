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
   LOGGER
----------------------------------------- */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/* ----------------------------------------
   SOCKET.IO SETUP - PRODUCTION READY
----------------------------------------- */
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});

// ✅ ADD HELPER FUNCTIONS TO IO INSTANCE
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
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      console.error('❌ Socket rejected: No token');
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.id && !decoded.userId) {
      console.error('❌ Socket rejected: Invalid token payload');
      return next(new Error('Authentication error: Invalid token'));
    }

    socket.userId = decoded.id || decoded.userId;
    socket.user = decoded;
    
    console.log(`✅ Socket authenticated: ${socket.userId}`);
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
  
  // Join personal room
  socket.join(`user:${userId}`);
  
  // Broadcast online status
  socket.broadcast.emit("user:online", { userId });

  // ✅ Initialize handlers
  try {
    initializeCallHandlers(socket, io);
    console.log(`📞 Call handlers ready: ${userId}`);
  } catch (err) {
    console.error('❌ Call handlers failed:', err);
  }

  try {
    initializePostHandlers(socket, io);
    console.log(`📝 Post handlers ready: ${userId}`);
  } catch (err) {
    console.error('❌ Post handlers failed:', err);
  }

  /* -------------------------
      TYPING INDICATOR
  ------------------------- */
  socket.on("typing", ({ to, isTyping }) => {
    if (!to) return;
    io.to(`user:${to}`).emit("user:typing", {
      from: userId,
      isTyping,
    });
  });

  /* -------------------------
      CHAT MESSAGE
  ------------------------- */
  socket.on("message:send", async (data) => {
    try {
      const { to, message } = data;
      if (!to || !message) {
        return socket.emit("error", {
          event: "message:send",
          message: "Invalid message data",
        });
      }

      const newMsg = {
        from: userId,
        to,
        text: message,
        createdAt: new Date(),
      };

      // Send to recipient
      io.to(`user:${to}`).emit("message:new", newMsg);

      // Confirmation to sender
      socket.emit("message:delivered", {
        ...newMsg,
        status: "delivered",
      });
    } catch (err) {
      console.error('❌ Message send error:', err);
      socket.emit("error", {
        event: "message:send",
        message: err.message,
      });
    }
  });

  /* -------------------------
      DISCONNECT
  ------------------------- */
  socket.on("disconnect", (reason) => {
    console.log(`🔌 User disconnected: ${userId} - ${reason}`);
    socket.broadcast.emit("user:offline", { userId });
  });

  /* -------------------------
      ERROR HANDLING
  ------------------------- */
  socket.on("error", (err) => {
    console.error(`❌ Socket error ${userId}:`, err);
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
   HEALTH CHECK
----------------------------------------- */
app.get("/api/health", (req, res) => {
  const io = req.app.get("io");
  res.json({
    status: "OK",
    socketConnections: io ? io.engine.clientsCount : 0,
    timestamp: new Date().toISOString(),
  });
});

/* ----------------------------------------
   ROOT
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
   404 HANDLER
----------------------------------------- */
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
});

/* ----------------------------------------
   ERROR HANDLER
----------------------------------------- */
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

/* ----------------------------------------
   START SERVER
----------------------------------------- */
server.listen(PORT, HOST, () => {
  console.log("\n🚀 Server started successfully!");
  console.log(`📍 Address: http://${HOST}:${PORT}`);
  console.log("📡 Socket.IO: Enabled");
  console.log("📞 WebRTC: Ready");
  console.log("📝 Real-time posts: Ready\n");
});

/* ----------------------------------------
   INITIALIZE SERVICES
----------------------------------------- */
(async () => {
  try {
    await connectDB();
    cloudinaryConfig();
    startIssueEscalationJob(io);
    console.log("✅ All services initialized\n");
  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
})();