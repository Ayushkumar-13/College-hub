// FILE: frontend/src/utils/conversationHelpers.js

/**
 * Get the most recent message timestamp from a list of messages
 * @param {Array} messages - Array of message objects
 * @returns {number} Timestamp in milliseconds
 */
export const getLatestMessageTime = (messages) => {
  if (!messages || messages.length === 0) return 0;

  const timestamps = messages
    .map((msg) => {
      const created = msg.createdAt ? new Date(msg.createdAt).getTime() : 0;
      const updated = msg.updatedAt ? new Date(msg.updatedAt).getTime() : 0;
      return Math.max(created, updated);
    })
    .filter((time) => !isNaN(time) && time > 0);

  return timestamps.length > 0 ? Math.max(...timestamps) : 0;
};

/**
 * Get the most recent message from a list
 * @param {Array} messages - Array of message objects
 * @returns {Object|null} Most recent message or null
 */
export const getLatestMessage = (messages) => {
  if (!messages || messages.length === 0) return null;

  return messages.reduce((latest, current) => {
    if (!latest) return current;

    const latestTime = getMessageTime(latest);
    const currentTime = getMessageTime(current);

    return currentTime > latestTime ? current : latest;
  }, null);
};

/**
 * Get timestamp from a single message
 * @param {Object} message - Message object
 * @returns {number} Timestamp in milliseconds
 */
export const getMessageTime = (message) => {
  if (!message) return 0;

  const created = message.createdAt ? new Date(message.createdAt).getTime() : 0;
  const updated = message.updatedAt ? new Date(message.updatedAt).getTime() : 0;

  return Math.max(created, updated, 0);
};

/**
 * Sort conversations by priority:
 * 1. Unread messages first
 * 2. Then by most recent message time
 * @param {Array} conversations - Array of conversation objects
 * @returns {Array} Sorted conversations
 */
export const sortConversations = (conversations) => {
  return [...conversations].sort((a, b) => {
    // Priority 1: Unread messages
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;

    // Priority 2: Escalated messages (if both have same unread status)
    const aEscalated = a.latestMessage?.autoForwarded || false;
    const bEscalated = b.latestMessage?.autoForwarded || false;
    if (aEscalated && !bEscalated) return -1;
    if (!aEscalated && bEscalated) return 1;

    // Priority 3: Most recent message time
    const aTime = a.latestTime || 0;
    const bTime = b.latestTime || 0;
    return bTime - aTime;
  });
};

/**
 * Check if a message should trigger a conversation re-sort
 * @param {Object} message - Message object
 * @returns {boolean}
 */
export const shouldResortConversation = (message) => {
  // Always resort for new messages, escalated messages, or unread messages
  return (
    message &&
    (message.autoForwarded ||
      !message.read ||
      isRecentMessage(message))
  );
};

/**
 * Check if a message was created/updated within the last 5 seconds
 * @param {Object} message - Message object
 * @returns {boolean}
 */
export const isRecentMessage = (message) => {
  if (!message) return false;

  const messageTime = getMessageTime(message);
  const now = Date.now();
  const fiveSecondsAgo = now - 5000;

  return messageTime > fiveSecondsAgo;
};

/**
 * Format relative time (e.g., "2 minutes ago", "1 hour ago")
 * @param {string|Date} timestamp - Timestamp
 * @returns {string} Formatted relative time
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';

  const now = Date.now();
  const messageTime = new Date(timestamp).getTime();
  const diff = now - messageTime;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Create a conversation object from messages and user data
 * @param {Array} messages - Array of messages
 * @param {Object} user - User object
 * @param {string} currentUserId - Current user's ID
 * @returns {Object} Conversation object
 */
export const createConversation = (messages, user, currentUserId) => {
  const latestMessage = getLatestMessage(messages);
  const latestTime = getLatestMessageTime(messages);
  const unreadCount = messages.filter(
    (m) => !m.read && String(m.receiverId) === String(currentUserId)
  ).length;

  return {
    user,
    latestMessage,
    latestTime,
    unreadCount,
    isEscalated: latestMessage?.autoForwarded || false,
    forwardCount: latestMessage?.forwardCount || 0,
  };
};

/**
 * Update conversation list with a new message
 * @param {Array} conversations - Current conversations
 * @param {Object} newMessage - New message
 * @param {string} userId - User ID for the conversation
 * @param {Object} userData - User data object
 * @returns {Array} Updated conversations
 */
export const updateConversationList = (
  conversations,
  newMessage,
  userId,
  userData
) => {
  const existingIndex = conversations.findIndex(
    (c) => String(c.user._id) === String(userId)
  );

  const messageTime = getMessageTime(newMessage);

  if (existingIndex !== -1) {
    // Update existing conversation
    const updated = [...conversations];
    updated[existingIndex] = {
      ...updated[existingIndex],
      latestMessage: newMessage,
      latestTime: messageTime,
    };
    return sortConversations(updated);
  } else if (userData) {
    // Add new conversation
    const newConversation = {
      user: userData,
      latestMessage: newMessage,
      latestTime: messageTime,
      unreadCount: newMessage.read ? 0 : 1,
      isEscalated: newMessage.autoForwarded || false,
      forwardCount: newMessage.forwardCount || 0,
    };
    return sortConversations([...conversations, newConversation]);
  }

  return conversations;
};