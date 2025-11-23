// FILE: backend/src/socket/callHandlers.js
/**
 * 🔥 PERFECT FIX:
 * - Sends call-connected to BOTH users IMMEDIATELY when call accepted
 * - Same timestamp to both = perfect timer sync
 * - No delay between users
 */

const activeCalls = new Map();
const userSocketMap = new Map();

const initializeCallHandlers = (socket, io) => {
  const userId = socket.userId;

  if (!userId) {
    console.warn('⚠️  Socket connected without userId');
    return;
  }

  userSocketMap.set(userId, socket.id);
  console.log(`📞 Call handlers initialized for user: ${userId}`);

  /**
   * CALL USER - Initiate a call
   */
  socket.on('call-user', async ({ userToCall, from, fromUser, signalData, type }) => {
    try {
      console.log(`📞 Call request: ${from} → ${userToCall} (${type})`);

      if (!userToCall || !from || !signalData || !type) {
        console.error('❌ Invalid call-user payload');
        return socket.emit('call-error', { message: 'Invalid call data' });
      }

      const recipientSocketId = userSocketMap.get(userToCall);
      if (!recipientSocketId) {
        console.log(`❌ User ${userToCall} is offline`);
        return socket.emit('user-offline', { userId: userToCall });
      }

      if (activeCalls.has(userToCall)) {
        console.log(`📵 User ${userToCall} is busy`);
        return socket.emit('user-busy', { userId: userToCall });
      }

      if (activeCalls.has(from)) {
        console.log(`📵 Caller ${from} is already in a call`);
        return socket.emit('call-error', { message: 'You are already in a call' });
      }

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

      // Notify caller that recipient received the call
      console.log(`✅ Notifying caller ${from} that recipient received call`);
      socket.emit('call-received', { userId: userToCall });

    } catch (error) {
      console.error('❌ Error in call-user:', error);
      socket.emit('call-error', { message: 'Failed to initiate call' });
    }
  });

  /**
   * 🔥 ANSWER CALL - CRITICAL FIX
   * Sends call-connected to BOTH users with EXACT SAME timestamp
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

      const callInfo = activeCalls.get(to);
      if (callInfo) {
        // 🔥 CRITICAL: Set connect time NOW
        callInfo.status = 'connected';
        callInfo.connectTime = Date.now();
        
        console.log(`📞 Call connected: ${callInfo.caller} ↔ ${callInfo.receiver}`);
        console.log(`⏱️  Connect timestamp: ${callInfo.connectTime}`);

        // 🔥 CRITICAL: Send call-connected to BOTH users with SAME timestamp
        const syncData = { startTime: callInfo.connectTime };
        
        // Send to caller
        io.to(recipientSocketId).emit('call-connected', syncData);
        console.log(`✅ Sent call-connected to CALLER with startTime: ${callInfo.connectTime}`);
        
        // Send to answerer (current socket)
        socket.emit('call-connected', syncData);
        console.log(`✅ Sent call-connected to ANSWERER with startTime: ${callInfo.connectTime}`);
      }

      // Send acceptance signal to caller
      io.to(recipientSocketId).emit('call-accepted', signal);

    } catch (error) {
      console.error('❌ Error in answer-call:', error);
      socket.emit('call-error', { message: 'Failed to answer call' });
    }
  });

  /**
   * REJECT CALL
   */
  socket.on('reject-call', ({ to }) => {
    try {
      console.log(`❌ Call rejected: ${userId} rejected call from ${to}`);

      if (!to) return;

      const recipientSocketId = userSocketMap.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call-rejected');
      }

      activeCalls.delete(to);
      activeCalls.delete(userId);

    } catch (error) {
      console.error('❌ Error in reject-call:', error);
    }
  });

  /**
   * END CALL
   */
  socket.on('end-call', ({ to }) => {
    try {
      console.log(`📴 Call ended: ${userId} → ${to}`);

      if (!to) {
        activeCalls.delete(userId);
        return;
      }

      const recipientSocketId = userSocketMap.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call-ended');
      }

      const callInfo = activeCalls.get(userId);
      if (callInfo && callInfo.connectTime) {
        const duration = Math.floor((Date.now() - callInfo.connectTime) / 1000);
        console.log(`⏱️  Call duration: ${duration} seconds`);
      }

      activeCalls.delete(to);
      activeCalls.delete(userId);

    } catch (error) {
      console.error('❌ Error in end-call:', error);
    }
  });

  /**
   * USER BUSY
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
   * DISCONNECT
   */
  socket.on('disconnect', () => {
    console.log(`🔌 User ${userId} disconnected`);

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

    userSocketMap.delete(userId);
  });
};

const getActiveCall = (userId) => {
  return activeCalls.get(userId) || null;
};

const isUserInCall = (userId) => {
  return activeCalls.has(userId);
};

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

const getOnlineUsersCount = () => {
  return userSocketMap.size;
};

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