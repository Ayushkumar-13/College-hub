import React, { useState, useContext, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, MessageSquare } from 'lucide-react';
import { MessageContext } from '@/context/MessageContext';
import ChatList from '../Messages/ChatList';
import Chatwindow from '../Messages/Chatwindow';

const MessagingDrawer = ({ user }) => {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('college-hub-drawer-open');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('college-hub-drawer-open', isOpen);
  }, [isOpen]);
  
  const { 
    chatList, 
    conversations,
    loading, 
    selectedChat, 
    selectChat, 
    sendMessage,
    searchResults,
    isSearching,
    searchMessages,
    retryMessage,
    typingUsers
  } = useContext(MessageContext);

  // Local state for input (mirrors MessagesPage structure)
  const [messageText, setMessageText] = useState('');
  const [messageFiles, setMessageFiles] = useState([]);
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!selectedChat || (!messageText.trim() && messageFiles.length === 0)) return;
    setSending(true);
    try {
      await sendMessage(selectedChat._id, messageText, messageFiles);
      setMessageText('');
      setMessageFiles([]);
    } catch (err) {
      console.error('❌ Drawer send failed:', err);
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

  return (
    <div 
      className={`fixed bottom-0 right-4 w-[350px] bg-white dark:bg-slate-900 shadow-[0_0_15px_rgba(0,0,0,0.2)] rounded-t-xl z-[100] border border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out hidden min-[1200px]:flex flex-col overflow-hidden ${
        isOpen ? 'h-[550px]' : 'h-12'
      }`}
    >
      {/* Header section (Clickable to expand/collapse) */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-full flex items-center justify-between px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition rounded-t-xl border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-20"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0">
            <img 
              src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
              alt="Avatar" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
          </div>
          <span className="font-bold text-[14px] text-slate-800 dark:text-slate-200 truncate">
            {selectedChat && isOpen ? selectedChat.name : 'Messaging'}
          </span>
        </div>
        
        <div className="flex items-center text-slate-500 dark:text-slate-400">
          <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
            {isOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>
      </div>

      {/* Body section (Using Shared Components) */}
      {isOpen && (
        <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-slate-900">
          {!selectedChat ? (
            <ChatList 
              isDrawer={true}
              conversations={chatList}
              selectedChat={selectedChat}
              searchQuery="" // Can add local state if needed
              searchResults={searchResults}
              isSearching={isSearching}
              onSelectChat={(u) => selectChat(u)}
              onSearchChange={(q) => searchMessages(q)}
            />
          ) : (
            <Chatwindow 
              isDrawer={true}
              selectedChat={selectedChat}
              messages={conversations[selectedChat?._id || selectedChat?.id] || []}
              loading={loading}
              messageText={messageText}
              messageFiles={messageFiles}
              sending={sending}
              currentUserId={user?._id || user?.id}
              userAvatar={user?.avatar}
              typingUsers={typingUsers}
              onBack={() => selectChat(null)}
              onMessageChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              onSend={handleSendMessage}
              onFileSelect={(e) => {
                 const files = Array.from(e.target.files).map(f => {
                   if (f.type.startsWith('image/')) f.preview = URL.createObjectURL(f);
                   return f;
                 });
                 setMessageFiles(prev => [...prev, ...files]);
              }}
              onFileRemove={(i) => setMessageFiles(prev => prev.filter((_, idx) => idx !== i))}
              onRetryMessage={(receiverId, msgId) => retryMessage({ tempId: msgId, receiverId, text: '', files: [] })}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default MessagingDrawer;
