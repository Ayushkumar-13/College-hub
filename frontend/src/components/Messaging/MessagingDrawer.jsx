import React, { useState, useContext, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit, ChevronUp, ChevronDown, Search, ArrowLeft, Send, Image as ImageIcon } from 'lucide-react';
import { MessageContext } from '@/context/MessageContext';
import { getTimeAgo } from '@/utils/helpers';
import { useNavigate } from 'react-router-dom';

const MessagingDrawer = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [msgText, setMsgText] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  
  const { 
    chatList, 
    loading, 
    selectedChat, 
    selectChat, 
    getMessages, 
    sendMessage 
  } = useContext(MessageContext);

  const messages = selectedChat ? getMessages(selectedChat._id) : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && selectedChat) {
      scrollToBottom();
    }
  }, [messages.length, isOpen, !!selectedChat]);

  const handleChatClick = (targetUser) => {
    selectChat(targetUser);
  };

  const handleBack = (e) => {
    e.stopPropagation();
    selectChat(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgText.trim() || !selectedChat) return;
    
    const textToSend = msgText;
    setMsgText('');
    await sendMessage(selectedChat._id, textToSend);
  };

  return (
    <div 
      className={`fixed bottom-0 right-4 w-[300px] bg-white dark:bg-slate-900 shadow-[0_0_10px_rgba(0,0,0,0.15)] rounded-t-xl z-[100] border border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out hidden min-[1200px]:flex flex-col ${
        isOpen ? 'h-[500px]' : 'h-12'
      }`}
    >
      {/* Header section (Clickable to expand/collapse) */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-full flex items-center justify-between px-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition rounded-t-xl border-b border-slate-100 dark:border-slate-800 shrink-0"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {selectedChat && isOpen ? (
            <button 
              onClick={handleBack}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition mr-1"
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0">
              <img 
                src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
            </div>
          )}
          <span className="font-semibold text-[14px] text-slate-800 dark:text-slate-200 truncate">
            {selectedChat && isOpen ? selectedChat.name : 'Messaging'}
          </span>
        </div>
        
        <div className="flex items-center text-slate-500 dark:text-slate-400 gap-1">
          {!selectedChat && (
            <>
              <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal size={16} />
              </button>
              <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition" onClick={(e) => e.stopPropagation()}>
                <Edit size={14} />
              </button>
            </>
          )}
          <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
            {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {/* Body section (Visible only when Open) */}
      {isOpen && (
        <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-slate-900">
          {!selectedChat ? (
            <>
              {/* Search Bar */}
              <div className="px-3 py-2 shrink-0">
                <div className="bg-slate-100 dark:bg-slate-800 w-full rounded-sm flex items-center px-2 py-1.5 border border-transparent focus-within:border-slate-300 dark:focus-within:border-slate-600 transition text-slate-900 dark:text-slate-100">
                  <Search size={14} className="text-slate-500 mr-2" />
                  <input 
                    type="text" 
                    placeholder="Search messages" 
                    className="bg-transparent text-[13px] outline-none w-full placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Contact List */}
              <div className="flex flex-col flex-1 overflow-y-auto hidden-scrollbar">
                {loading ? (
                  <div className="flex justify-center items-center h-20">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                ) : chatList.length > 0 ? (
                  chatList.map((chat, idx) => (
                    <div 
                      key={chat.user?._id || idx} 
                      onClick={(e) => { e.stopPropagation(); handleChatClick(chat.user); }}
                      className="flex items-center px-3 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition gap-3"
                    >
                      <div className="relative shrink-0">
                        <img 
                          src={chat.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.user?.name || 'User'}`} 
                          alt="" 
                          className="w-10 h-10 rounded-full object-cover" 
                        />
                        {chat.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 border-b border-slate-100 dark:border-slate-800/50 pb-2">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="font-semibold text-[14px] text-slate-900 dark:text-slate-100 truncate">{chat.user?.name}</span>
                          <span className="text-[11px] text-slate-500 whitespace-nowrap">
                            {chat.latestMessage ? getTimeAgo(chat.latestMessage.createdAt) : ''}
                          </span>
                        </div>
                        <p className={`text-[12px] truncate ${chat.unreadCount > 0 ? 'text-slate-900 dark:text-slate-100 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                          {chat.latestMessage?.text || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-500 dark:text-slate-400">
                    <p className="text-[13px]">No conversations yet</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Message List (Chat Window) */}
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 hidden-scrollbar bg-slate-50 dark:bg-slate-950/50">
                {messages.map((msg, idx) => {
                  const isMe = String(msg.senderId) === String(user?._id || user?.id);
                  return (
                    <div 
                      key={msg._id || idx} 
                      className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      <div 
                        className={`px-3 py-2 rounded-2xl text-[13px] ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-100 dark:border-slate-700 shadow-sm rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {getTimeAgo(msg.createdAt)}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form 
                onSubmit={handleSendMessage}
                className="p-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button type="button" className="p-1.5 text-slate-400 hover:text-blue-500 transition">
                  <ImageIcon size={18} />
                </button>
                <input 
                  type="text" 
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder="Write a message..." 
                  className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5 text-[13px] outline-none text-slate-900 dark:text-slate-100 focus:ring-1 ring-blue-500/30 transition"
                />
                <button 
                  type="submit" 
                  disabled={!msgText.trim()}
                  className={`p-1.5 rounded-full transition ${
                    msgText.trim() ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'text-slate-300'
                  }`}
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MessagingDrawer;
