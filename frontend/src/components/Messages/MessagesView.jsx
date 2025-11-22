// FILE: frontend/src/components/Messages/MessageView.jsx
/**
 * ✅ UPDATED: Shows date separators (Today, Yesterday, 1/3/25)
 * ✅ UPDATED: Only time shown in message bubbles (not full date)
 * ✅ Fixed: Self-messages show once with blue double-check
 */
import React, { useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import MessageBubble from './MessageBubble';
import Loading from '../Common/Loading';

// ✅ NEW: Helper to check if two dates are the same day
const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

// ✅ NEW: Format date for separator (Today, Yesterday, 1/3/25)
const formatDateSeparator = (timestamp) => {
  if (!timestamp) return '';
  
  const messageDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if today
  if (isSameDay(messageDate, today)) {
    return 'Today';
  }

  // Check if yesterday
  if (isSameDay(messageDate, yesterday)) {
    return 'Yesterday';
  }

  // Format as date (1/3/25)
  const month = messageDate.getMonth() + 1;
  const day = messageDate.getDate();
  const year = messageDate.getFullYear().toString().slice(-2);
  
  return `${month}/${day}/${year}`;
};

// ✅ NEW: Date Separator Component
const DateSeparator = ({ date }) => (
  <div className="flex items-center justify-center my-4">
    <div className="bg-slate-200/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm">
      <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
        {date}
      </span>
    </div>
  </div>
);

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-2 bg-white rounded-2xl rounded-bl-md border border-slate-200 w-fit">
    <div className="flex gap-1">
      <div
        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <div
        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <div
        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  </div>
);

const MessageView = ({
  messages,
  loading,
  currentUserId,
  selectedChat,
  typingUsers,
  userAvatar,
  onRetryMessage,
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full bg-gradient-to-br from-slate-50 to-blue-50/30">
        <Loading size="md" />
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-slate-400 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-2xl opacity-10" />
          <MessageSquare size={64} className="relative mb-3 opacity-20" />
        </div>
        <p className="text-base font-medium text-slate-500">No messages yet</p>
        <p className="text-sm text-slate-400 mt-1">Start the conversation!</p>
      </div>
    );
  }

  // ✅ CRITICAL FIX: Filter out duplicate self-messages
  // If sender and receiver are the same, only show once
  const filteredMessages = messages.reduce((acc, msg, index) => {
    const messageSenderId = msg.senderId?._id || msg.senderId;
    const messageReceiverId = msg.receiverId?._id || msg.receiverId;
    
    // Check if this is a self-message
    const isSelfMessage = String(messageSenderId) === String(messageReceiverId);
    
    if (isSelfMessage) {
      // Check if we already have this message in the accumulator
      const alreadyExists = acc.some(m => {
        // Check by ID or by timestamp + text combination
        if (m._id === msg._id) return true;
        if (m.text === msg.text && 
            Math.abs(new Date(m.createdAt) - new Date(msg.createdAt)) < 1000) {
          return true;
        }
        return false;
      });
      
      if (!alreadyExists) {
        // Mark as read for self-messages
        acc.push({ ...msg, status: 'read', read: true });
      }
    } else {
      acc.push(msg);
    }
    
    return acc;
  }, []);

  // ✅ NEW: Group messages by date
  let lastMessageDate = null;

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-br from-slate-50 to-blue-50/30 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400"
    >
      {filteredMessages.map((msg, index) => {
        const messageSenderId = msg.senderId?._id || msg.senderId;
        const messageReceiverId = msg.receiverId?._id || msg.receiverId;
        const isSender = String(messageSenderId) === String(currentUserId);
        const isSelfMessage = String(messageSenderId) === String(messageReceiverId);

        // ✅ NEW: Check if we need a date separator
        const messageDate = msg.createdAt;
        const showDateSeparator = !lastMessageDate || !isSameDay(lastMessageDate, messageDate);
        lastMessageDate = messageDate;

        return (
          <React.Fragment key={msg._id || index}>
            {/* ✅ NEW: Date Separator */}
            {showDateSeparator && (
              <DateSeparator date={formatDateSeparator(messageDate)} />
            )}

            {/* Message Bubble */}
            <MessageBubble
              message={msg}
              isSender={isSender}
              isSelfMessage={isSelfMessage}
              senderAvatar={
                userAvatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId}`
              }
              receiverAvatar={
                selectedChat?.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat?.name}`
              }
              onRetry={() => onRetryMessage(selectedChat._id, msg._id)}
            />
          </React.Fragment>
        );
      })}

      {/* Typing Indicator */}
      {typingUsers[selectedChat?._id] && (
        <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
          <img
            src={
              selectedChat?.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat?.name}`
            }
            alt={selectedChat?.name}
            className="w-8 h-8 rounded-full object-cover mr-2 mt-auto mb-1 flex-shrink-0 shadow-sm"
          />
          <TypingIndicator />
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageView;