import React from 'react';
import { MessageSquare } from 'lucide-react';
import Header from '../Common/Header';
import MessageView from './MessagesView';
import MessageInput from './MessageInput';

const ChatWindow = ({
  selectedChat,
  messages,
  loading,
  messageText,
  messageFiles,
  sending,
  currentUserId,
  userAvatar,
  typingUsers,
  isMobileView,
  onBack,
  onMessageChange,
  onKeyPress,
  onSend,
  onFileSelect,
  onFileRemove,
  onRetryMessage,
}) => {
  if (!selectedChat) {
    return (
      <section className="lg:col-span-8 bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden flex flex-col h-[calc(100vh-160px)] backdrop-blur-sm">
        <div className="flex-1 flex flex-col justify-center items-center text-slate-400 bg-gradient-to-br from-slate-50 to-white">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-3xl opacity-20 animate-pulse" />
            <MessageSquare size={80} className="relative mb-4 text-slate-300" />
          </div>
          <p className="text-lg font-semibold text-slate-500">
            Select a conversation
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Choose a conversation to start messaging
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="lg:col-span-8 bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden flex flex-col h-[calc(100vh-160px)] backdrop-blur-sm">
      <Header
        selectedChat={selectedChat}
        typingUsers={typingUsers}
        onBack={onBack}
        isMobileView={isMobileView}
      />

      <MessageView
        messages={messages}
        loading={loading}
        currentUserId={currentUserId}
        selectedChat={selectedChat}
        typingUsers={typingUsers}
        userAvatar={userAvatar}
        onRetryMessage={onRetryMessage}
      />

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

export default ChatWindow;