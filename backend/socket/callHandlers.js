// FILE: backend/src/socket/callHandlers.js
/**
 * Call signaling + server-side call log messages in chat.
 */

import { saveCallLogMessage } from '../utils/callLogService.js';

const activeCalls = new Map();
const userSocketMap = new Map();

const RING_TIMEOUT_MS = 30_000;

function normalizeCallType(type) {
  return type === 'video' ? 'video' : 'audio';
}

function cleanupCall(callInfo) {
  if (!callInfo) return;
  if (callInfo.ringTimeout) {
    clearTimeout(callInfo.ringTimeout);
    callInfo.ringTimeout = null;
  }
  activeCalls.delete(callInfo.caller);
  activeCalls.delete(callInfo.receiver);
}

async function finalizeCallLog(io, callInfo, callStatus) {
  if (!callInfo || callInfo.callLogSaved) return;

  const duration = callInfo.connectTime
    ? Math.floor((Date.now() - callInfo.connectTime) / 1000)
    : 0;

  if (callStatus === 'completed' && duration <= 0) return;

  callInfo.callLogSaved = true;

  if (callInfo.ringTimeout) {
    clearTimeout(callInfo.ringTimeout);
    callInfo.ringTimeout = null;
  }

  await saveCallLogMessage(io, {
    callerId: callInfo.caller,
    receiverId: callInfo.receiver,
    callType: normalizeCallType(callInfo.type),
    duration,
    callStatus,
    callerName: callInfo.callerName,
  });
}

function scheduleRingTimeout(io, callInfo) {
  if (callInfo.ringTimeout) clearTimeout(callInfo.ringTimeout);

  callInfo.ringTimeout = setTimeout(async () => {
    if (!callInfo || callInfo.callLogSaved || callInfo.connectTime) return;

    console.log(`⏱️  Call timeout: ${callInfo.caller} → ${callInfo.receiver}`);

    await finalizeCallLog(io, callInfo, 'missed');

    if (callInfo.callerSocketId) {
      io.to(callInfo.callerSocketId).emit('call-ended');
    }
    if (callInfo.receiverSocketId) {
      io.to(callInfo.receiverSocketId).emit('call-ended');
    }

    cleanupCall(callInfo);
  }, RING_TIMEOUT_MS);
}

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
        console.log(`❌ User ${userToCall} is offline — logging missed call`);

        await saveCallLogMessage(io, {
          callerId: from,
          receiverId: userToCall,
          callType: normalizeCallType(type),
          duration: 0,
          callStatus: 'missed',
          callerName: fromUser?.name,
          notifyOfflineCallee: true,
        });

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
        type: normalizeCallType(type),
        status: 'ringing',
        startTime: Date.now(),
        callerSocketId: socket.id,
        receiverSocketId: recipientSocketId,
        callerName: fromUser?.name,
        callLogSaved: false,
      };

      activeCalls.set(from, callInfo);
      activeCalls.set(userToCall, callInfo);

      scheduleRingTimeout(io, callInfo);

      console.log(`📡 Sending incoming-call to ${userToCall}`);

      io.to(recipientSocketId).emit('incoming-call', {
        from,
        fromUser: {
          _id: from,
          name: fromUser?.name || 'Unknown',
          avatar: fromUser?.avatar,
        },
        signalData,
        type: callInfo.type,
      });

      console.log(`✅ Notifying caller ${from} that recipient received call`);
      socket.emit('call-received', { userId: userToCall });
    } catch (error) {
      console.error('❌ Error in call-user:', error);
      socket.emit('call-error', { message: 'Failed to initiate call' });
    }
  });

  /**
   * ANSWER CALL
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

      const callInfo = activeCalls.get(to) || activeCalls.get(userId);
      if (callInfo) {
        if (callInfo.ringTimeout) {
          clearTimeout(callInfo.ringTimeout);
          callInfo.ringTimeout = null;
        }

        callInfo.status = 'connected';
        callInfo.connectTime = Date.now();

        console.log(`📞 Call connected: ${callInfo.caller} ↔ ${callInfo.receiver}`);

        const syncData = { startTime: callInfo.connectTime };

        io.to(recipientSocketId).emit('call-connected', syncData);
        socket.emit('call-connected', syncData);
      }

      io.to(recipientSocketId).emit('call-accepted', signal);
    } catch (error) {
      console.error('❌ Error in answer-call:', error);
      socket.emit('call-error', { message: 'Failed to answer call' });
    }
  });

  /**
   * REJECT CALL
   */
  socket.on('reject-call', async ({ to }) => {
    try {
      console.log(`❌ Call rejected: ${userId} rejected call from ${to}`);

      if (!to) return;

      const recipientSocketId = userSocketMap.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call-rejected');
      }

      const callInfo = activeCalls.get(to) || activeCalls.get(userId);
      if (callInfo) {
        await finalizeCallLog(io, callInfo, 'missed');
        cleanupCall(callInfo);
      }
    } catch (error) {
      console.error('❌ Error in reject-call:', error);
    }
  });

  /**
   * END CALL
   */
  socket.on('end-call', async ({ to }) => {
    try {
      console.log(`📴 Call ended: ${userId} → ${to}`);

      if (!to) {
        const soloCall = activeCalls.get(userId);
        if (soloCall) {
          if (soloCall.connectTime) {
            await finalizeCallLog(io, soloCall, 'completed');
          } else if (!soloCall.callLogSaved) {
            const status = userId === soloCall.caller ? 'cancelled' : 'missed';
            await finalizeCallLog(io, soloCall, status);
          }
          cleanupCall(soloCall);
        }
        return;
      }

      const recipientSocketId = userSocketMap.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call-ended');
      }

      const callInfo = activeCalls.get(userId) || activeCalls.get(to);
      if (callInfo) {
        if (callInfo.connectTime) {
          const duration = Math.floor((Date.now() - callInfo.connectTime) / 1000);
          console.log(`⏱️  Call duration: ${duration} seconds`);
          await finalizeCallLog(io, callInfo, 'completed');
        } else if (!callInfo.callLogSaved) {
          const status = userId === callInfo.caller ? 'cancelled' : 'missed';
          await finalizeCallLog(io, callInfo, status);
        }
        cleanupCall(callInfo);
      }
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
  socket.on('disconnect', async () => {
    console.log(`🔌 User ${userId} disconnected`);

    const callInfo = activeCalls.get(userId);
    if (callInfo) {
      const otherUserId = callInfo.caller === userId ? callInfo.receiver : callInfo.caller;
      const otherSocketId = userSocketMap.get(otherUserId);

      if (otherSocketId) {
        console.log(`📴 Notifying ${otherUserId} about disconnection`);
        io.to(otherSocketId).emit('call-ended');
      }

      if (callInfo.connectTime) {
        await finalizeCallLog(io, callInfo, 'completed');
      } else if (!callInfo.callLogSaved) {
        await finalizeCallLog(io, callInfo, 'missed');
      }

      cleanupCall(callInfo);
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

  for (const [, callInfo] of activeCalls.entries()) {
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
        startTime: new Date(callInfo.startTime),
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

export {
  initializeCallHandlers,
  getActiveCall,
  isUserInCall,
  getAllActiveCalls,
  getOnlineUsersCount,
  isUserOnline,
};
