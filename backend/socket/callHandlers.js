// FILE: backend/src/socket/callHandlers.js
/**
 * WebRTC Call Handlers for Socket.IO
 * Manages call signaling, connection states, and user availability
 */

// In-memory storage for active calls (use Redis in production)
const activeCalls = new Map();
const userSocketMap = new Map();

/**
 * Initialize call-related socket handlers
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 */
const initializeCallHandlers = (socket, io) => {
  const userId = socket.userId;

  if (!userId) {
    console.warn('⚠️  Socket connected without userId');
    return;
  }

  // Store user socket mapping
  userSocketMap.set(userId, socket.id);
  console.log(`📞 Call handlers initialized for user: ${userId}`);

  /**
   * CALL USER - Initiate a call
   */
  socket.on('call-user', async ({ userToCall, from, fromUser, signalData, type }) => {
    try {
      console.log(`📞 Call request: ${from} → ${userToCall} (${type})`);

      // Validate inputs
      if (!userToCall || !from || !signalData || !type) {
        console.error('❌ Invalid call-user payload');
        return socket.emit('call-error', { message: 'Invalid call data' });
      }

      // Check if recipient is online
      const recipientSocketId = userSocketMap.get(userToCall);
      if (!recipientSocketId) {
        console.log(`❌ User ${userToCall} is offline`);
        return socket.emit('user-offline', { userId: userToCall });
      }

      // Check if recipient is already in a call
      if (activeCalls.has(userToCall)) {
        console.log(`📵 User ${userToCall} is busy`);
        return socket.emit('user-busy', { userId: userToCall });
      }

      // Check if caller is already in a call
      if (activeCalls.has(from)) {
        console.log(`📵 Caller ${from} is already in a call`);
        return socket.emit('call-error', { message: 'You are already in a call' });
      }

      // Store call information
      const callInfo = {
        caller: from,
        receiver: userToCall,
        type,
        status: 'ringing',
        startTime: Date.now(),
        callerSocketId: socket.id,
        receiverSocketId: recipientSocketId
      };

      activeCalls.set(from, callInfo);
      activeCalls.set(userToCall, callInfo);

      console.log(`📡 Sending incoming-call to ${userToCall}`);

      // Send call notification to recipient
      io.to(recipientSocketId).emit('incoming-call', {
        from,
        fromUser: {
          _id: from,
          name: fromUser?.name || 'Unknown',
          avatar: fromUser?.avatar
        },
        signalData,
        type
      });

    } catch (error) {
      console.error('❌ Error in call-user:', error);
      socket.emit('call-error', { message: 'Failed to initiate call' });
    }
  });

  /**
   * ANSWER CALL - Accept incoming call
   */
  socket.on('answer-call', ({ to, signal }) => {
    try {
      console.log(`✅ Call answered: ${userId} → ${to}`);

      if (!to || !signal) {
        console.error('❌ Invalid answer-call payload');
        return;
      }

      const recipientSocketId = userSocketMap.get(to);
      if (!recipientSocketId) {
        console.log(`❌ User ${to} is offline`);
        return socket.emit('user-offline', { userId: to });
      }

      // Update call status
      const callInfo = activeCalls.get(to);
      if (callInfo) {
        callInfo.status = 'connected';
        callInfo.connectTime = Date.now();
        console.log(`📞 Call connected: ${callInfo.caller} ↔ ${callInfo.receiver}`);
      }

      // Send acceptance signal to caller
      io.to(recipientSocketId).emit('call-accepted', signal);

    } catch (error) {
      console.error('❌ Error in answer-call:', error);
      socket.emit('call-error', { message: 'Failed to answer call' });
    }
  });

  /**
   * REJECT CALL - Decline incoming call
   */
  socket.on('reject-call', ({ to }) => {
    try {
      console.log(`❌ Call rejected: ${userId} rejected call from ${to}`);

      if (!to) return;

      const recipientSocketId = userSocketMap.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call-rejected');
      }

      // Remove call from active calls
      activeCalls.delete(to);
      activeCalls.delete(userId);

    } catch (error) {
      console.error('❌ Error in reject-call:', error);
    }
  });

  /**
   * END CALL - Terminate active call
   */
  socket.on('end-call', ({ to }) => {
    try {
      console.log(`📴 Call ended: ${userId} → ${to}`);

      if (!to) {
        // Clean up caller's side
        activeCalls.delete(userId);
        return;
      }

      const recipientSocketId = userSocketMap.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call-ended');
      }

      // Calculate call duration if it was connected
      const callInfo = activeCalls.get(userId);
      if (callInfo && callInfo.connectTime) {
        const duration = Math.floor((Date.now() - callInfo.connectTime) / 1000);
        console.log(`⏱️  Call duration: ${duration} seconds`);
        
        // TODO: Save call history to database
        // await saveCallHistory({
        //   caller: callInfo.caller,
        //   receiver: callInfo.receiver,
        //   type: callInfo.type,
        //   duration,
        //   startTime: new Date(callInfo.connectTime),
        //   endTime: new Date()
        // });
      }

      // Remove call from active calls
      activeCalls.delete(to);
      activeCalls.delete(userId);

    } catch (error) {
      console.error('❌ Error in end-call:', error);
    }
  });

  /**
   * USER BUSY - Notify caller that recipient is busy
   */
  socket.on('user-busy', ({ to }) => {
    try {
      if (!to) return;
      
      const recipientSocketId = userSocketMap.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('user-busy');
      }
    } catch (error) {
      console.error('❌ Error in user-busy:', error);
    }
  });

  /**
   * DISCONNECT - Handle socket disconnection
   */
  socket.on('disconnect', () => {
    console.log(`🔌 User ${userId} disconnected`);

    // End any active calls
    const callInfo = activeCalls.get(userId);
    if (callInfo) {
      const otherUserId = callInfo.caller === userId ? callInfo.receiver : callInfo.caller;
      const otherSocketId = userSocketMap.get(otherUserId);
      
      if (otherSocketId) {
        console.log(`📴 Notifying ${otherUserId} about disconnection`);
        io.to(otherSocketId).emit('call-ended');
      }

      activeCalls.delete(userId);
      activeCalls.delete(otherUserId);
    }

    // Remove user from socket mapping
    userSocketMap.delete(userId);
  });
};

/**
 * Get active call information for a user
 * @param {string} userId - User ID
 * @returns {Object|null} Call information or null
 */
const getActiveCall = (userId) => {
  return activeCalls.get(userId) || null;
};

/**
 * Check if user is in a call
 * @param {string} userId - User ID
 * @returns {boolean} True if user is in a call
 */
const isUserInCall = (userId) => {
  return activeCalls.has(userId);
};

/**
 * Get all active calls (for monitoring)
 * @returns {Array} Array of active call objects
 */
const getAllActiveCalls = () => {
  const calls = [];
  const processedCalls = new Set();

  for (const [userId, callInfo] of activeCalls.entries()) {
    const callId = `${callInfo.caller}-${callInfo.receiver}`;
    
    if (!processedCalls.has(callId)) {
      calls.push({
        caller: callInfo.caller,
        receiver: callInfo.receiver,
        type: callInfo.type,
        status: callInfo.status,
        duration: callInfo.connectTime 
          ? Math.floor((Date.now() - callInfo.connectTime) / 1000)
          : 0,
        startTime: new Date(callInfo.startTime)
      });
      processedCalls.add(callId);
    }
  }

  return calls;
};

/**
 * Get online users count
 * @returns {number} Number of online users
 */
const getOnlineUsersCount = () => {
  return userSocketMap.size;
};

/**
 * Check if user is online
 * @param {string} userId - User ID
 * @returns {boolean} True if user is online
 */
const isUserOnline = (userId) => {
  return userSocketMap.has(userId);
};

module.exports = {
  initializeCallHandlers,
  getActiveCall,
  isUserInCall,
  getAllActiveCalls,
  getOnlineUsersCount,
  isUserOnline
};