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
     // ✔️ Allow Vercel preview deployments
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
  const io = app.get("io");
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
   SOCKET.IO (FIXED - STRICT AUTH)
----------------------------------------- */
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});

app.set("io", io);

/* ----------------------------------------
   SOCKET AUTH - FIXED VERSION
----------------------------------------- */
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    // ✅ FIX: Reject connection if no token provided
    if (!token) {
      console.error('❌ Socket connection rejected: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    // ✅ FIX: Verify token and reject if invalid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.id && !decoded.userId) {
      console.error('❌ Socket connection rejected: Invalid token payload');
      return next(new Error('Authentication error: Invalid token payload'));
    }

    socket.userId = decoded.id || decoded.userId;
    socket.user = decoded; // Store full user data
    
    console.log(`✅ Socket authenticated: ${socket.userId} (${socket.id})`);
    return next();
    
  } catch (err) {
    console.error('❌ Socket authentication failed:', err.message);
    return next(new Error('Authentication error: Invalid token'));
  }
});

/* ----------------------------------------
   SOCKET EVENTS
----------------------------------------- */
io.on("connection", (socket) => {
  const userId = socket.userId;

  // ✅ This should ALWAYS be true now due to strict auth
  if (!userId) {
    console.error('⚠️ Socket connected without userId - this should not happen!');
    socket.disconnect();
    return;
  }

  console.log(`🔌 User connected: ${userId} (${socket.id})`);
  
  // Join user's personal room
  socket.join(`user:${userId}`);
  
  // Broadcast online status
  socket.broadcast.emit("user:online", { userId });

  // ✅ Initialize WebRTC call handlers
  try {
    initializeCallHandlers(socket, io);
    console.log(`📞 Call handlers ready for user: ${userId}`);
  } catch (err) {
    console.error('❌ Failed to initialize call handlers:', err);
  }

  /* -------------------------
      TYPING
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
    console.log(`🔌 User disconnected: ${userId} (${socket.id}) - ${reason}`);
    socket.broadcast.emit("user:offline", { userId });
  });

  /* -------------------------
      ERROR HANDLING
  ------------------------- */
  socket.on("error", (err) => {
    console.error(`❌ Socket error for user ${userId}:`, err);
  });
});

/* ----------------------------------------
   START SERVER
----------------------------------------- */
server.listen(PORT, HOST, () => {
  console.log("\n🚀 Server started successfully!");
  console.log(`📍 Address: http://${HOST}:${PORT}`);
  console.log("📡 Socket.IO enabled with strict authentication");
  console.log("📞 WebRTC calling ready\n");
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