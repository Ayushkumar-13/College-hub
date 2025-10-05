/*
 * FILE: frontend/src/hooks/index.js
 * LOCATION: college-social-platform/frontend/src/hooks/index.js
 * PURPOSE: Export all custom hooks from one file
 */

import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { UserContext } from '@/context/UserContext';
import { PostContext } from '@/context/PostContext';
import { MessageContext } from '@/context/MessageContext';
import { NotificationContext } from '@/context/NotificationContext';
import { SocketContext } from '@/context/SocketContext'; // ← import SocketContext

// Auth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// User hook
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};

// Post hook
export const usePost = () => {
  const context = useContext(PostContext);
  if (!context) throw new Error('usePost must be used within PostProvider');
  return context;
};

// Message hook
export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) throw new Error('useMessage must be used within MessageProvider');
  return context;
};

// Notification hook
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};

// Socket hook ← ADDED
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
