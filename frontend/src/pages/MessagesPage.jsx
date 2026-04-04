// FILE: frontend/src/pages/MessagesPage.jsx
import React, { useState, useEffect, useMemo, useContext } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth, useUser } from '@/hooks';
import { MessageContext } from '@/context/MessageContext';
import ChatList from '@/components/Messages/ChatList';
import ChatWindow from '@/components/Messages/Chatwindow';
import Loading from '@/components/Common/Loading';

const MessagesPage = () => {
  const { user } = useAuth();
  const { users } = useUser();
  const { 
    chatList, 
    conversations, 
    selectedChat, 
    loading, 
    typingUsers, 
    searchResults, 
    isSearching, 
    loadChatList, 
    sendMessage, 
    retryMessage, 
    searchMessages, 
    selectChat 
  } = useContext(MessageContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageFiles, setMessageFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [showListOnMobile, setShowListOnMobile] = useState(true);

  // Sync initial chat list with users from useUser hook
  useEffect(() => {
    if (users && users.length > 0) {
      loadChatList(users);
    }
  }, [users, loadChatList]);

  // Handle URL param for direct chat
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    if (userId && users) {
      const target = users.find(u => String(u._id || u.id) === String(userId));
      if (target) {
        selectChat(target);
        setShowListOnMobile(false);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [users, selectChat]);

  // Messages for the selected chat
  const currentMessages = useMemo(() => {
    if (!selectedChat) return [];
    const chatId = selectedChat._id || selectedChat.id;
    return conversations[chatId] || [];
  }, [selectedChat, conversations]);

  const handleSendMessage = async () => {
    if (!selectedChat || (!messageText.trim() && messageFiles.length === 0)) return;
    setSending(true);
    try {
      await sendMessage(selectedChat._id, messageText, messageFiles);
      setMessageText('');
      setMessageFiles([]);
    } catch (err) {
      console.error('❌ Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).map((f) => {
      if (f.type.startsWith('image/')) f.preview = URL.createObjectURL(f);
      return f;
    });
    setMessageFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (i) => {
    if (messageFiles[i]?.preview) URL.revokeObjectURL(messageFiles[i].preview);
    setMessageFiles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const isMobileView = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;

  return (
    <div className="min-h-screen bg-page">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {(!isMobileView || showListOnMobile) && (
            <ChatList
              conversations={chatList}
              selectedChat={selectedChat}
              searchQuery={searchQuery}
              searchResults={searchResults}
              isSearching={isSearching}
              onSelectChat={(u) => { 
                console.log('📬 Selecting chat:', u?._id || u?.id);
                selectChat(u); 
                setShowListOnMobile(false); 
              }}
              onSearchChange={(q) => { setSearchQuery(q); searchMessages(q); }}
            />
          )}

          {(!isMobileView || !showListOnMobile) && (
            <ChatWindow
              selectedChat={selectedChat}
              messages={currentMessages}
              loading={loading}
              messageText={messageText}
              messageFiles={messageFiles}
              sending={sending}
              currentUserId={user?._id || user?.id}
              userAvatar={user?.avatar}
              typingUsers={typingUsers}
              isMobileView={isMobileView}
              onBack={() => setShowListOnMobile(true)}
              onMessageChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              onSend={handleSendMessage}
              onFileSelect={handleFileSelect}
              onFileRemove={removeFile}
              onRetryMessage={(receiverId, msgId) => retryMessage({ tempId: msgId, receiverId, text: '', files: [] })}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;
