/*
 * FILE: frontend/src/api/messageApi.js
 * PURPOSE: Message API - FIXED VERSION
 */
import axiosInstance from "@/api/axios";

export const messageApi = {
  /**
   * Get conversation messages with a specific user
   * @param {string} userId - The user ID to get messages with
   * @returns {Promise<Array>} Array of messages
   */
  getMessages: async (userId) => {
    try {
      const response = await axiosInstance.get(`/messages/${userId}`);
      return response.data; // Backend returns array directly
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      throw error;
    }
  },  

  /**
   * Send a message with optional media files
   * @param {string} receiverId - Recipient user ID
   * @param {string} text - Message text content
   * @param {Array} files - Array of File objects
   * @returns {Promise<Object>} Sent message object
   */
  sendMessage: async (receiverId, text, files = []) => {
    try {
      const formData = new FormData();
      
      // Backend expects: receiverId, text
      formData.append("receiverId", receiverId);
      formData.append("text", text || ""); // Changed from "message" to "text"

      // Attach media files - backend expects "media" field
      if (Array.isArray(files) && files.length > 0) {
        files.forEach((file) => {
          formData.append("media", file); // Changed from "files" to "media"
        });
      }

      // POST to /messages (not /messages/send)
      const response = await axiosInstance.post("/messages", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data; // Returns the message object
    } catch (error) {
      console.error("❌ Error sending message:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Mark a message as read
   * @param {string} messageId - Message ID to mark as read
   * @returns {Promise<Object>} Response data
   */
  markAsRead: async (messageId) => {
    try {
      const response = await axiosInstance.patch(`/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      console.error("❌ Error marking message as read:", error);
      throw error;
    }
  },

  /**
   * Get chat list (latest conversations)
   * @returns {Promise<Array>} Array of chat objects
   */
  getChatList: async () => {
    try {
      const response = await axiosInstance.get("/messages/chats/list");
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching chat list:", error);
      throw error;
    }
  },

  /**
   * Search messages
   * @param {string} query - Search query string
   * @returns {Promise<Array>} Array of matching messages
   */
  searchMessages: async (query) => {
    try {
      const response = await axiosInstance.get(`/messages/search/query?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error("❌ Error searching messages:", error);
      throw error;
    }
  },
};