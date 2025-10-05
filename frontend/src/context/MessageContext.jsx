/*
 * FILE: frontend/src/context/MessageContext.jsx
 * LOCATION: college-social-platform/frontend/src/context/MessageContext.jsx
 * PURPOSE: Message management context with Socket.IO (send & receive messages)
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { messageApi } from '@/api/messageApi';
import { AuthContext } from './AuthContext';
import { io } from 'socket.io-client';

export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const { isAuthenticated, user, token } = useContext(AuthContext);
  const [conversations, setConversations] = useState({});
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (isAuthenticated) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token: token || localStorage.getItem('token') },
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        // Join user room for private messages
        newSocket.emit('join', user._id);
      });

      // Listen for incoming messages
      newSocket.on('newMessage', (msg) => {
        const chatId = msg.senderId === user._id ? msg.receiverId : msg.senderId;
        setConversations(prev => {
          const prevMessages = prev[chatId] || [];
          return { ...prev, [chatId]: [...prevMessages, msg] };
        });
      });

      return () => newSocket.disconnect();
    }
  }, [isAuthenticated, user, token]);

  // Load messages for a specific user
  const loadMessages = async (userId) => {
    try {
      setLoading(true);
      const data = await messageApi.getMessages(userId);
      setConversations(prev => ({ ...prev, [userId]: data }));
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async (receiverId, text, files = []) => {
    try {
      const message = await messageApi.sendMessage(receiverId, text, files);

      // Emit via socket for real-time update
      socket?.emit('sendMessage', { ...message, receiverId });

      // Update local conversation immediately
      setConversations(prev => {
        const prevMessages = prev[receiverId] || [];
        return { ...prev, [receiverId]: [...prevMessages, message] };
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.error };
    }
  };

  // Get messages for selected chat
  const getMessages = (userId) => {
    return conversations[userId] || [];
  };

  // Select chat
  const selectChat = (user) => {
    setSelectedChat(user);
    if (user) loadMessages(user._id);
  };

  const value = {
    conversations,
    selectedChat,
    loading,
    loadMessages,
    sendMessage,
    getMessages,
    selectChat,
    socket,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};
