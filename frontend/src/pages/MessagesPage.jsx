/*
 * FILE: frontend/src/pages/MessagesPage.jsx
 * PURPOSE: Real-time messaging page with unified navbar
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Search, Paperclip, File, X, User, MessageSquare
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth, useMessage, useUser, useSocket } from '@/hooks';
import { USER_ROLES } from '@/utils/constants';

// Format message timestamp
const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday ' + date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const MessagesPage = () => {
  const { user } = useAuth();
  const { users } = useUser();
  const { selectedChat, selectChat, getMessages, sendMessage, loadMessages } = useMessage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageFiles, setMessageFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const messagesContainerRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  useEffect(() => {
    if (selectedChat) {
      setIsInitialLoad(true);
      loadMessages(selectedChat._id);
    }
  }, [selectedChat?._id]);

  useEffect(() => {
    const messages = getMessages(selectedChat?._id);
    if (!messages || messages.length === 0) return;

    const currentMessageCount = messages.length;
    const isNewMessage = currentMessageCount > prevMessageCountRef.current;

    if (isInitialLoad) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      setIsInitialLoad(false);
    } else if (isNewMessage) {
      const container = messagesContainerRef.current;
      if (container) {
        const isScrolledToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isScrolledToBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }

    prevMessageCountRef.current = currentMessageCount;
  }, [getMessages(selectedChat?._id)?.length, selectedChat, isInitialLoad]);

  useEffect(() => {
    return () => {
      messageFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [messageFiles]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).map(file => {
      file.preview = URL.createObjectURL(file);
      return file;
    });
    setMessageFiles([...messageFiles, ...files]);
  };

  const removeFile = (index) => {
    if (messageFiles[index].preview) {
      URL.revokeObjectURL(messageFiles[index].preview);
    }
    setMessageFiles(messageFiles.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    const currentUserId = user?._id || user?.id;
    
    if (!currentUserId || !selectedChat) return;
    if (!messageText.trim() && messageFiles.length === 0) return;
    if (sending) return;

    const textToSend = messageText;
    const filesToSend = [...messageFiles];

    setMessageText('');
    setMessageFiles([]);
    setSending(true);

    try {
      await sendMessage(selectedChat._id, textToSend, filesToSend);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessageText(textToSend);
      setMessageFiles(filesToSend);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      if (!sending && (messageText.trim() || messageFiles.length > 0)) {
        handleSendMessage();
      }
    }
  };

  const currentUserId = user?._id || user?.id;
  const filteredUsers = users
    .filter(u => u._id !== currentUserId)
    .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const groupedUsers = {
    [USER_ROLES.VIP]: filteredUsers.filter(u => u.role === USER_ROLES.VIP),
    [USER_ROLES.FACULTY]: filteredUsers.filter(u => u.role === USER_ROLES.FACULTY),
    [USER_ROLES.STAFF]: filteredUsers.filter(u => u.role === USER_ROLES.STAFF),
    [USER_ROLES.STUDENT]: filteredUsers.filter(u => u.role === USER_ROLES.STUDENT)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      
      {/* Unified Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Users List */}
          <aside className="lg:col-span-4 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 text-sm"
                />
              </div>
            </div>

            <div className="overflow-y-auto h-[calc(100vh-220px)]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {Object.entries(groupedUsers).map(([role, roleUsers]) => (
                roleUsers.length > 0 && (
                  <div key={role} className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-2">
                      {role}
                    </h3>
                    <ul className="space-y-1">
                      {roleUsers.map(u => (
                        <li
                          key={u._id}
                          onClick={() => selectChat(u)}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                            selectedChat?._id === u._id 
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="relative">
                            <img 
                              src={u.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
                              alt={u.name} 
                              className={`w-12 h-12 rounded-full object-cover ring-2 transition-all duration-200 ${
                                selectedChat?._id === u._id 
                                  ? 'ring-blue-400' 
                                  : 'ring-slate-200 group-hover:ring-slate-300'
                              }`}
                            />
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold truncate ${
                              selectedChat?._id === u._id ? 'text-blue-900' : 'text-slate-800'
                            }`}>
                              {u.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{u.role}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              ))}
            </div>
          </aside>

          {/* Chat Window */}
          <section className="lg:col-span-8 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-160px)]">
            {!selectedChat ? (
              <div className="flex-1 flex flex-col justify-center items-center text-slate-400 bg-gradient-to-br from-slate-50 to-white">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-2xl opacity-20"></div>
                  <User size={80} className="relative mb-4 text-slate-300" />
                </div>
                <p className="text-lg font-medium text-slate-500">Select a user to start chatting</p>
                <p className="text-sm text-slate-400 mt-1">Choose from the list to begin a conversation</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                  <img 
                    src={selectedChat.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
                    alt={selectedChat.name} 
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-200"
                  />
                  <div className="flex-1">
                    <h2 className="font-semibold text-slate-900">{selectedChat.name}</h2>
                    <p className="text-xs text-slate-500">{selectedChat.role}</p>
                  </div>
                </div>

                {/* Messages Area */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {getMessages(selectedChat._id)?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <MessageSquare size={48} className="mb-2 opacity-30" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs">Start the conversation!</p>
                    </div>
                  ) : (
                    getMessages(selectedChat._id)?.map((msg, index) => {
                      const messageSenderId = msg.senderId?._id || msg.senderId;
                      const isSender = String(messageSenderId) === String(currentUserId);
                      
                      return (
                        <div 
                          key={msg._id || index} 
                          className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isSender && (
                            <img 
                              src={selectedChat.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
                              alt={selectedChat.name} 
                              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 mr-2 mt-auto mb-1 flex-shrink-0"
                            />
                          )}
                          <div
                            className={`max-w-[70%] px-3 py-2 shadow-sm break-words transition-all duration-200 hover:shadow-md ${
                              isSender
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-md'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-bl-md'
                            }`}
                          >
                            {msg.text && (
                              <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.text}</p>
                            )}
                            {msg.media?.length > 0 && (
                              <div className={`${msg.text ? 'mt-2' : ''} ${msg.media.length === 1 ? 'w-full' : 'grid grid-cols-2 gap-2'}`}>
                                {msg.media.map((file, i) => (
                                  file.type.startsWith('image') ? (
                                    <img key={i} src={file.url} alt="attachment" className="rounded-xl max-h-60 w-full object-cover" />
                                  ) : (
                                    <a key={i} href={file.url} download className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                      <File size={14} /> File
                                    </a>
                                  )
                                ))}
                              </div>
                            )}
                            <p 
                              className={`text-xs mt-1 ${isSender ? 'text-blue-100 text-right' : 'text-slate-400 text-left'}`}
                              title={new Date(msg.createdAt).toLocaleString()}
                            >
                              {formatMessageTime(msg.createdAt)}
                            </p>
                          </div>
                          {isSender && (
                            <img 
                              src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
                              alt={user?.name} 
                              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-200 ml-2 mt-auto mb-1 flex-shrink-0"
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef}></div>
                </div>

                {/* Message Input */}
                <div className="border-t border-slate-200 p-4 bg-white flex items-end gap-2">
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-all duration-200 flex-shrink-0"
                  >
                    <Paperclip size={20} />
                  </button>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div className="flex-1 relative">
                    {messageFiles.length > 0 && (
                      <div className="absolute bottom-full left-0 mb-2 flex gap-2 flex-wrap">
                        {messageFiles.map((file, idx) => (
                          <div key={idx} className="relative">
                            {file.type.startsWith('image') ? (
                              <img src={file.preview} alt="preview" className="w-14 h-14 object-cover rounded-xl" />
                            ) : (
                              <div className="w-14 h-14 flex items-center justify-center bg-slate-100 rounded-xl text-xs truncate p-1">{file.name}</div>
                            )}
                            <button onClick={() => removeFile(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <textarea
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      onKeyDown={handleKeyPress}
                      rows={1}
                      disabled={sending}
                      placeholder="Type a message..."
                      className="w-full resize-none px-3 py-2 rounded-2xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 text-sm disabled:opacity-50"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || (!messageText.trim() && messageFiles.length === 0)}
                    className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;