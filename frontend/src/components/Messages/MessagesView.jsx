import React, { useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import MessageBubble from './MessageBubble';
import Loading from '../Common/Loading';

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

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-br from-slate-50 to-blue-50/30 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400"
    >
      {messages.map((msg, index) => {
        const messageSenderId = msg.senderId?._id || msg.senderId;
        const isSender = String(messageSenderId) === String(currentUserId);

        return (
          <MessageBubble
            key={msg._id || index}
            message={msg}
            isSender={isSender}
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