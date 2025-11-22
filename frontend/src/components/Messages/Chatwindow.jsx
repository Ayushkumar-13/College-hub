// FILE: frontend/src/components/Messages/ChatWindow.jsx
/**
 * 🔥 CLEAN UI FIX:
 * - Removed ALL colored button backgrounds
 * - Simple monochrome icons only
 * - Professional, clean design
 */
import React from 'react';
import { MessageSquare, Phone, Video } from 'lucide-react';
import Header from '../Common/Header';
import MessageView from './MessagesView';
import MessageInput from './MessageInput';
import { useCall } from '@/context/CallContext';

const Chatwindow = ({
  selectedChat,
  messages = [],
  loading = false,
  messageText = '',
  messageFiles = [],
  sending = false,
  currentUserId,
  userAvatar,
  typingUsers = [],
  isMobileView = false,
  onBack,
  onMessageChange,
  onKeyPress,
  onSend,
  onFileSelect,
  onFileRemove,
  onRetryMessage,
}) => {
  const { callUser, callStatus } = useCall();

  const handleAudioCall = () => {
    if (callStatus !== "idle") {
      alert("You are already in a call");
      return;
    }
    callUser(selectedChat, "audio");
  };

  const handleVideoCall = () => {
    if (callStatus !== "idle") {
      alert("You are already in a call");
      return;
    }
    callUser(selectedChat, "video");
  };

  // --- EMPTY STATE ---
  if (!selectedChat) {
    return (
      <section className="lg:col-span-8 bg-white rounded-2xl shadow-xl border border-slate-200/80 flex flex-col h-[calc(100vh-160px)] backdrop-blur-sm">
        <div className="flex-1 flex flex-col justify-center items-center text-slate-400 bg-gradient-to-br from-slate-50 to-white">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-3xl opacity-20 animate-pulse" />
            <MessageSquare size={80} className="relative mb-4 text-slate-300" />
          </div>
          <p className="text-lg font-semibold text-slate-500">Select a conversation</p>
          <p className="text-sm text-slate-400 mt-2">Choose a conversation to start messaging</p>
        </div>
      </section>
    );
  }

  // --- MAIN CHAT ---
  return (
    <section className="relative lg:col-span-8 bg-white rounded-2xl shadow-xl border border-slate-200/80 flex flex-col h-[calc(100vh-160px)] backdrop-blur-sm">

      {/* HEADER */}
      <div className="relative">
        <Header
          selectedChat={selectedChat}
          typingUsers={typingUsers}
          onBack={onBack}
          isMobileView={isMobileView}
        />

        {/* 🔥 CLEAN CALL BUTTONS - NO COLORS */}
        {callStatus === "idle" && (
          <div className="absolute top-1/2 -translate-y-1/2 right-4 flex gap-2 z-50">
            
            {/* Voice Call Button */}
            <button
              onClick={handleAudioCall}
              className="group relative p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-full transition-all transform hover:scale-105 shadow-sm"
              title="Voice Call"
            >
              <Phone size={18} className="text-slate-600" />
              <span className="absolute -bottom-8 right-0 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Voice Call
              </span>
            </button>

            {/* Video Call Button */}
            <button
              onClick={handleVideoCall}
              className="group relative p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-full transition-all transform hover:scale-105 shadow-sm"
              title="Video Call"
            >
              <Video size={18} className="text-slate-600" />
              <span className="absolute -bottom-8 right-0 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Video Call
              </span>
            </button>
          </div>
        )}
      </div>

      {/* MESSAGES */}
      <MessageView
        messages={messages}
        loading={loading}
        currentUserId={currentUserId}
        selectedChat={selectedChat}
        typingUsers={typingUsers}
        userAvatar={userAvatar}
        onRetryMessage={onRetryMessage}
      />

      {/* INPUT */}
      <MessageInput
        messageText={messageText}
        messageFiles={messageFiles}
        sending={sending}
        onMessageChange={onMessageChange}
        onKeyPress={onKeyPress}
        onSend={onSend}
        onFileSelect={onFileSelect}
        onFileRemove={onFileRemove}
      />
    </section>
  );
};

export default Chatwindow;