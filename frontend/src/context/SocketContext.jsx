/* 
 * FILE: frontend/src/context/SocketContext.jsx
 * PURPOSE: Socket.IO context provider for real-time features
 */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/hooks';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    // Only connect if user is authenticated
    if (!isAuthenticated || !user) {
      // Disconnect socket if user logs out
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket - user not authenticated');
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
        setIsInitialized(false);
      }
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('⚠️  No token found - skipping socket connection');
      return;
    }

    // Prevent duplicate connections
    if (socketRef.current?.connected) {
      console.log('✅ Socket already connected');
      return;
    }

    // Initialize Socket.IO client
    console.log('🔌 Initializing socket connection...');
    
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:10000';
    
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    setIsInitialized(true);

    const socket = socketRef.current;

    // Handle successful connection
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      console.log('   Transport:', socket.io.engine.transport.name);
      setConnected(true);

      // Join the user's private room
      if (user._id || user.id) {
        const userId = user._id || user.id;
        socket.emit('join', userId);
        console.log('👤 Joining room for user:', userId);
      }
    });

    // Monitor transport upgrades
    socket.io.engine.on('upgrade', (transport) => {
      console.log('⬆️  Transport upgraded to:', transport.name);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setConnected(false);

      // Reconnect if server disconnected
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    // Handle reconnection
    socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setConnected(true);

      // Re-join user's room
      if (user._id || user.id) {
        const userId = user._id || user.id;
        socket.emit('join', userId);
      }
    });

    // Handle connection errors
    socket.on('connect_error', (err) => {
      if (isAuthenticated && user) {
        console.error('⚠️  Socket connection error:', err.message);
      }
      setConnected(false);
    });

    // Handle join confirmation
    socket.on('join:success', (data) => {
      console.log('✅ Join confirmation:', data);
    });

    // Online/Offline users tracking
    socket.on('user:online', ({ userId }) => {
      console.log('👤 User online:', userId);
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    socket.on('user:offline', ({ userId }) => {
      console.log('👤 User offline:', userId);
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    // Cleanup on unmount or when user/token changes
    return () => {
      if (socket && socket.connected) {
        console.log('🧹 Cleaning up socket connection');
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, isAuthenticated]);

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