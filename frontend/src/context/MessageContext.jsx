/*
 * FILE: frontend/src/context/MessageContext.jsx
 * PURPOSE: Centralized Message State + Socket.IO real-time handler - FIXED
 */
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { messageApi } from "@/api/messageApi";
import { AuthContext } from "./AuthContext";
import { useSocket } from "./SocketContext";

export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const { socket, connected } = useSocket(); // Use existing SocketContext
  const [conversations, setConversations] = useState({});
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  /* -----------------------------------------
     LISTEN FOR INCOMING MESSAGES
  --------------------------------------------*/
  useEffect(() => {
    if (!socket || !connected || !user) return;

    // Listen for new messages from backend
    const handleNewMessage = (msg) => {
      console.log("📨 New message received:", msg);
      
      // Determine which chat this message belongs to
      const chatId = msg.senderId === user._id || msg.senderId === user.id
        ? msg.receiverId 
        : msg.senderId;

      // Update conversations state
      setConversations((prev) => {
        const prevMsgs = prev[chatId] || [];
        // Prevent duplicates
        const exists = prevMsgs.some(m => m._id === msg._id);
        if (exists) return prev;
        
        return { ...prev, [chatId]: [...prevMsgs, msg] };
      });
    };

    // Listen for message status updates
    const handleMessageStatus = ({ messageId, status, message }) => {
      console.log("📊 Message status update:", messageId, status);
      
      setConversations((prev) => {
        const updated = { ...prev };
        
        // Update the message status in all conversations
        Object.keys(updated).forEach((chatId) => {
          updated[chatId] = updated[chatId].map((msg) =>
            msg._id === messageId ? { ...msg, status } : msg
          );
        });
        
        return updated;
      });
    };

    // Listen for typing indicators
    const handleUserTyping = ({ from, isTyping }) => {
      console.log(`✍️ User ${from} is ${isTyping ? 'typing' : 'stopped typing'}`);
      setTypingUsers((prev) => ({
        ...prev,
        [from]: isTyping
      }));

      // Clear typing indicator after 3 seconds
      if (isTyping) {
        setTimeout(() => {
          setTypingUsers((prev) => ({
            ...prev,
            [from]: false
          }));
        }, 3000);
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:status", handleMessageStatus);
    socket.on("user:typing", handleUserTyping);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:status", handleMessageStatus);
      socket.off("user:typing", handleUserTyping);
    };
  }, [socket, connected, user]);

  /* -----------------------------------------
     LOAD ALL MESSAGES FOR A USER
  --------------------------------------------*/
  const loadMessages = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const data = await messageApi.getMessages(userId);
      setConversations((prev) => ({
        ...prev,
        [userId]: data,
      }));
    } catch (err) {
      console.error("❌ Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* -----------------------------------------
     SEND A MESSAGE
  --------------------------------------------*/
  const sendMessage = async (receiverId, text, files = []) => {
    if (!receiverId || (!text && files.length === 0)) {
      return { success: false, error: "Message content required" };
    }

    try {
      console.log("📤 Sending message to:", receiverId);
      
      // Send via API
      const message = await messageApi.sendMessage(receiverId, text, files);
      
      console.log("✅ Message sent successfully:", message);

      // Add to local state immediately (optimistic update)
      setConversations((prev) => {
        const prevMsgs = prev[receiverId] || [];
        return { ...prev, [receiverId]: [...prevMsgs, message] };
      });

      // Socket.IO will handle real-time delivery to recipient
      // Backend emits 'message:new' to the recipient automatically

      return { success: true, message };
    } catch (err) {
      console.error("❌ Error sending message:", err);
      return {
        success: false,
        error: err?.response?.data?.error || "Message sending failed",
      };
    }
  };

  /* -----------------------------------------
     SEND TYPING INDICATOR
  --------------------------------------------*/
  const sendTypingIndicator = useCallback((receiverId, isTyping) => {
    if (socket && connected) {
      socket.emit("typing", { to: receiverId, isTyping });
    }
  }, [socket, connected]);

  /* -----------------------------------------
     GET MESSAGES FOR ONE CHAT
  --------------------------------------------*/
  const getMessages = useCallback((userId) => {
    return conversations[userId] || [];
  }, [conversations]);

  /* -----------------------------------------
     SELECT CHAT
  --------------------------------------------*/
  const selectChat = useCallback((targetUser) => {
    setSelectedChat(targetUser);
    if (targetUser) {
      loadMessages(targetUser._id);
    }
  }, [loadMessages]);

  /* -----------------------------------------
     MARK MESSAGE AS READ
  --------------------------------------------*/
  const markAsRead = useCallback(async (messageId) => {
    try {
      await messageApi.markAsRead(messageId);
      
      // Update local state
      setConversations((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((chatId) => {
          updated[chatId] = updated[chatId].map((msg) =>
            msg._id === messageId ? { ...msg, read: true, status: 'read' } : msg
          );
        });
        return updated;
      });
    } catch (err) {
      console.error("❌ Error marking message as read:", err);
    }
  }, []);

  return (
    <MessageContext.Provider
      value={{
        conversations,
        selectedChat,
        loading,
        typingUsers,
        loadMessages,
        sendMessage,
        getMessages,
        selectChat,
        sendTypingIndicator,
        markAsRead,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};