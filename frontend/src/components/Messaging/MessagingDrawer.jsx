import React, { useState, useContext, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MessageContext, toId } from '@/context/MessageContext';
import ChatList from '../Messages/ChatList';
import Chatwindow from '../Messages/Chatwindow';

export const MESSAGING_DRAWER_WIDTH = 360;
const DRAWER_OPEN_HEIGHT = 'min(560px, calc(100vh - 5.5rem))';

/**
 * Bottom-anchored messenger widget — lives in a layout column so the feed shrinks instead of overlapping.
 */
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
    typingUsers,
  } = useContext(MessageContext);

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
      console.error('Drawer send failed:', err);
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
      className={`w-full flex flex-col overflow-hidden border border-border-card border-b-0 bg-surface dark:bg-slate-900 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] rounded-t-2xl transition-[height] duration-300 ease-out ${
        isOpen ? '' : 'h-12'
      }`}
      style={isOpen ? { height: DRAWER_OPEN_HEIGHT } : undefined}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="h-12 w-full flex items-center justify-between px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition shrink-0 border-b border-border-card bg-surface dark:bg-slate-900"
      >
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0">
            <img
              src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
          </div>
          <span className="font-semibold text-sm text-text-main truncate">
            {selectedChat && isOpen ? selectedChat.name : 'Messaging'}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-1 text-text-dim hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition shrink-0"
          aria-label={isOpen ? 'Minimize messaging' : 'Open messaging'}
        >
          {isOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      {isOpen && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-surface dark:bg-slate-900">
          {!selectedChat ? (
            <ChatList
              isDrawer
              conversations={chatList}
              selectedChat={selectedChat}
              searchQuery=""
              searchResults={searchResults}
              isSearching={isSearching}
              onSelectChat={(u) => selectChat(u)}
              onSearchChange={(q) => searchMessages(q)}
            />
          ) : (
            <Chatwindow
              isDrawer
              selectedChat={selectedChat}
              messages={conversations[toId(selectedChat)] || []}
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
                const files = Array.from(e.target.files).map((f) => {
                  if (f.type.startsWith('image/')) f.preview = URL.createObjectURL(f);
                  return f;
                });
                setMessageFiles((prev) => [...prev, ...files]);
              }}
              onFileRemove={(i) => setMessageFiles((prev) => prev.filter((_, idx) => idx !== i))}
              onRetryMessage={retryMessage}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default MessagingDrawer;
