// FILE: frontend/src/components/Messages/ChatWindow.jsx
// ✅ UPDATED: Removed local CallOverlay (using global now)
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
  const { callUser, callStatus, callAccepted } = useCall();

  // Handle Audio Call
  const handleAudioCall = () => {
    if (callStatus !== "idle") {
      alert("You are already in a call");
      return;
    }
    callUser(selectedChat, "audio");
  };

  // Handle Video Call
  const handleVideoCall = () => {
    if (callStatus !== "idle") {
      alert("You are already in a call");
      return;
    }
    callUser(selectedChat, "video");
  };

  // --- EMPTY CHAT VIEW ---
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

  // --- MAIN CHAT WINDOW ---
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

        {/* CALL BUTTONS */}
        {!callAccepted && (
          <div className="absolute top-1/2 -translate-y-1/2 right-4 flex gap-2 z-50">
            {/* AUDIO CALL */}
            <button
              onClick={handleAudioCall}
              disabled={callStatus !== "idle"}
              className={`group relative p-3 rounded-full transition-all transform hover:scale-110 shadow-lg ${
                callStatus !== "idle"
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              }`}
              title="Audio Call"
            >
              <Phone size={20} className="text-white" />
              <span className="absolute -bottom-8 right-0 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Voice Call
              </span>
            </button>

            {/* VIDEO CALL */}
            <button
              onClick={handleVideoCall}
              disabled={callStatus !== "idle"}
              className={`group relative p-3 rounded-full transition-all transform hover:scale-110 shadow-lg ${
                callStatus !== "idle"
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              }`}
              title="Video Call"
            >
              <Video size={20} className="text-white" />
              <span className="absolute -bottom-8 right-0 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Video Call
              </span>
            </button>
          </div>
        )}
      </div>

      {/* MESSAGE LIST */}
      <MessageView
        messages={messages}
        loading={loading}
        currentUserId={currentUserId}
        selectedChat={selectedChat}
        typingUsers={typingUsers}
        userAvatar={userAvatar}
        onRetryMessage={onRetryMessage}
      />

      {/* MESSAGE INPUT */}
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

      {/* ✅ NO LOCAL OVERLAY - Using global overlay now */}
    </section>
  );
};

export default Chatwindow;