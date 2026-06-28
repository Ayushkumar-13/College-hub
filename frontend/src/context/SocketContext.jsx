/* 
 * FILE: frontend/src/context/SocketContext.jsx
 * PURPOSE: Socket.IO context provider for real-time features
 */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/hooks';
import { SOCKET_URL } from '@/config';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const connectedUserIdRef = useRef(null); // Track which userId is currently connected
  const [connected, setConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Stable primitives to use as dependency (avoids re-running on every user object reference change)
  const userId = user?._id || user?.id || null;
  const token = isAuthenticated ? localStorage.getItem('token') : null;

  useEffect(() => {
    // Only connect if we have a real userId and token
    if (!userId || !token) {
      // Disconnect if logged out
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket - user not authenticated');
        socketRef.current.disconnect();
        socketRef.current = null;
        connectedUserIdRef.current = null;
        setConnected(false);
        setIsInitialized(false);
      }
      return;
    }

    // ✅ KEY FIX: If already connected for this exact user, do nothing
    if (connectedUserIdRef.current === userId && socketRef.current?.connected) {
      return;
    }

    // If there's an old socket for a *different* user, clean it up first
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      connectedUserIdRef.current = null;
    }

    console.log('🔌 Initializing socket connection for user:', userId, '→', SOCKET_URL);
    connectedUserIdRef.current = userId;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    socketRef.current = socket;
    setIsInitialized(true);

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setConnected(true);
      socket.emit('join', userId);
    });

    socket.io.engine.on('upgrade', (transport) => {
      console.log('⬆️  Transport upgraded to:', transport.name);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setConnected(false);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setConnected(true);
      socket.emit('join', userId);
    });

    socket.on('connect_error', (err) => {
      console.error('⚠️  Socket connection error:', err.message);
      setConnected(false);
    });

    socket.on('join:success', (data) => {
      console.log('✅ Join confirmation:', data);
    });

    socket.on('user:online', ({ userId: onlineId }) => {
      setOnlineUsers(prev => new Set([...prev, onlineId]));
    });

    socket.on('user:offline', ({ userId: offlineId }) => {
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        updated.delete(offlineId);
        return updated;
      });
    });

    // Cleanup: always disconnect the socket this effect created
    return () => {
      console.log('🧹 Cleaning up socket for user:', userId);
      socket.disconnect();
      // Only null out the ref if it's still pointing to this socket
      if (socketRef.current === socket) {
        socketRef.current = null;
        connectedUserIdRef.current = null;
      }
      setConnected(false);
    };
  }, [userId, token]);

  // Helper function to emit events
  const emit = (event, data) => {
    if (socketRef.current && connected) {
      socketRef.current.emit(event, data);
      return true;
    }
    console.warn(`⚠️  Cannot emit '${event}': socket not connected`);
    return false;
  };

  // Helper function to listen to events
  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  // Helper function to remove event listener
  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  const value = {
    socket: socketRef.current,
    connected,
    isInitialized,
    onlineUsers,
    emit,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use Socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export { SocketContext };
