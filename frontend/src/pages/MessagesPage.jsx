// FILE: frontend/src/pages/MessagesPage.jsx
/**
 * 🔥 FIXED:
 * - Uses messageApi.getChatList() instead of non-existent /conversations
 * - Proper error handling
 * - No more 404 errors
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth, useUser, useSocket } from '@/hooks';
import { messageApi } from '@/api/messageApi'; // ✅ Use your messageApi
import ChatList from '@/components/Messages/ChatList';
import ChatWindow from '@/components/Messages/Chatwindow';
import Loading from '@/components/Common/Loading';
import {
  getLatestMessage,
  getLatestMessageTime,
  sortConversations,
  createConversation,
  shouldResortConversation,
} from '@/utils/conversationHelpers';

const MessagesPage = () => {
  const { user } = useAuth();
  const { users } = useUser();
  const { socket, connected } = useSocket();

  const currentUserId = user?._id || user?.id;

  const getStorageKey = (key) => `${key}_${currentUserId}`;

  useEffect(() => {
    if (currentUserId) {
      const allKeys = Object.keys(sessionStorage);
      allKeys.forEach(key => {
        if ((key.startsWith('messages_') || 
             key.startsWith('selectedChat_') || 
             key.startsWith('conversationUsers_')) && 
            !key.endsWith(`_${currentUserId}`)) {
          sessionStorage.removeItem(key);
          console.log('🧹 Cleared old user data:', key);
        }
      });
    }
  }, [currentUserId]);

  const [selectedChat, setSelectedChat] = useState(() => {
    try {
      const saved = sessionStorage.getItem(getStorageKey('selectedChat'));
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(getStorageKey('messages'));
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [conversationUsers, setConversationUsers] = useState(() => {
    try {
      const saved = sessionStorage.getItem(getStorageKey('conversationUsers'));
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageFiles, setMessageFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [initializing, setInitializing] = useState(true);
  const [pendingMessages, setPendingMessages] = useState([]);

  const searchTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (connected && pendingMessages.length > 0) {
      console.log(`🔄 Back online! Retrying ${pendingMessages.length} messages`);
      retryPendingMessages();
    }
  }, [connected, pendingMessages.length]);

  const retryPendingMessages = async () => {
    if (pendingMessages.length === 0) return;

    for (const pending of pendingMessages) {
      try {
        console.log('📤 Retrying:', pending.tempId);
        await sendMessageToServer(pending.receiverId, pending.text, pending.files, pending.tempId);
      } catch (err) {
        console.error('Retry failed:', pending.tempId, err);
      }
    }
  };

  // ✅ FIXED: Use messageApi.getMessages() instead of axios directly
  const fetchMessages = async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await messageApi.getMessages(userId);
      setMessages((prev) => ({ ...prev, [userId]: response || [] }));
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      setMessages((prev) => ({ ...prev, [userId]: [] }));
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Use messageApi.getChatList() instead of /conversations
  const fetchConversationsList = async () => {
    try {
      console.log('📥 Fetching chat list...');
      
      // ✅ Use your messageApi.getChatList()
      const chatList = await messageApi.getChatList();
      
      if (Array.isArray(chatList) && chatList.length > 0) {
        const map = {};
        const userMap = {};

        chatList.forEach((chat) => {
          const userId = String(chat.userId || chat.user?._id || chat._id);
          
          if (userId && chat.latestMessage) {
            if (!map[userId]) map[userId] = [];
            map[userId].push(chat.latestMessage);
          }
          
          if (userId && chat.user) {
            userMap[userId] = chat.user;
          }
        });

        setMessages((prev) => ({ ...map, ...prev }));
        setConversationUsers((prev) => ({ ...prev, ...userMap }));
        console.log('✅ Chat list loaded:', Object.keys(userMap).length, 'conversations');
        return;
      }
    } catch (err) {
      console.log('ℹ️ No chat list endpoint, using fallback');
    }

    // ✅ Fallback: Fetch messages from all known users
    if (users && users.length > 0) {
      try {
        console.log('📥 Fetching messages for', users.length, 'users');
        
        const fetches = users.map(async (u) => {
          try {
            const msgs = await messageApi.getMessages(u._id);
            return { userId: u._id, messages: msgs || [], user: u };
          } catch (error) {
            console.warn(`⚠️ Failed to fetch messages for ${u.name}:`, error.message);
            return { userId: u._id, messages: [], user: u };
          }
        });

        const results = await Promise.all(fetches);
        const map = {};
        const userMap = {};

        results.forEach((r) => {
          if (r.messages && r.messages.length > 0) {
            map[r.userId] = r.messages;
          }
          if (r.user) {
            userMap[r.userId] = r.user;
          }
        });

        setMessages((prev) => ({ ...prev, ...map }));
        setConversationUsers((prev) => ({ ...prev, ...userMap }));
        console.log('✅ Loaded conversations:', Object.keys(userMap).length);
      } catch (error) {
        console.error('❌ Fallback fetch failed:', error);
      }
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchConversationsList().finally(() => setInitializing(false));
    }
  }, [currentUserId]);

  useEffect(() => {
    if (users && users.length > 0) {
      const userMap = {};
      users.forEach((u) => {
        if (u && u._id) userMap[u._id] = u;
      });
      setConversationUsers((prev) => ({ ...prev, ...userMap }));
    }
  }, [users]);

  useEffect(() => {
    if (selectedChat && currentUserId) {
      sessionStorage.setItem(getStorageKey('selectedChat'), JSON.stringify(selectedChat));
    } else {
      sessionStorage.removeItem(getStorageKey('selectedChat'));
    }
  }, [selectedChat, currentUserId]);

  useEffect(() => {
    if (Object.keys(messages).length > 0 && currentUserId) {
      sessionStorage.setItem(getStorageKey('messages'), JSON.stringify(messages));
    }
  }, [messages, currentUserId]);

  useEffect(() => {
    if (Object.keys(conversationUsers).length > 0 && currentUserId) {
      sessionStorage.setItem(getStorageKey('conversationUsers'), JSON.stringify(conversationUsers));
    }
  }, [conversationUsers, currentUserId]);

  useEffect(() => {
    const allUsers = { ...conversationUsers };
    if (users) {
      users.forEach((u) => {
        if (u && u._id) allUsers[u._id] = u;
      });
    }

    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');

    if (userId && allUsers[userId]) {
      setSelectedChat(allUsers[userId]);
      setShowListOnMobile(false);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [users, conversationUsers]);

  // ✅ Use messageApi.searchMessages()
  const searchMessages = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const results = await messageApi.searchMessages(query);
      setSearchResults(results || []);
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => searchMessages(searchQuery), 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // ✅ Use messageApi.sendMessage()
  const sendMessageToServer = async (receiverId, text, files = [], tempId = null) => {
    const actualTempId = tempId || `temp-${Date.now()}`;
    
    try {
      const newMessage = await messageApi.sendMessage(receiverId, text, files);

      setMessages((prev) => ({
        ...prev,
        [receiverId]: prev[receiverId].map((m) =>
          m._id === actualTempId ? { ...newMessage, status: 'sent' } : m
        ),
      }));

      setPendingMessages((prev) => prev.filter(p => p.tempId !== actualTempId));

      console.log('✅ Message sent');
      return newMessage;
    } catch (error) {
      console.error('❌ Send failed:', error);
      
      if (!navigator.onLine || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        console.log('📡 Offline - will retry');
        setMessages((prev) => ({
          ...prev,
          [receiverId]: prev[receiverId].map((m) =>
            m._id === actualTempId ? { ...m, status: 'sending' } : m
          ),
        }));
        
        setPendingMessages((prev) => {
          const exists = prev.some(p => p.tempId === actualTempId);
          if (!exists) {
            return [...prev, { tempId: actualTempId, receiverId, text, files }];
          }
          return prev;
        });
      } else {
        setMessages((prev) => ({
          ...prev,
          [receiverId]: prev[receiverId].map((m) =>
            m._id === actualTempId ? { ...m, status: 'failed' } : m
          ),
        }));
      }
      
      throw error;
    }
  };

  const sendMessage = async (receiverId, text, files = []) => {
    const tempId = `temp-${Date.now()}`;
    
    const isSelfMessage = String(receiverId) === String(currentUserId);
    
    const tempMessage = {
      _id: tempId,
      senderId: currentUserId,
      receiverId,
      text: text || '',
      media: [],
      status: connected ? 'sending' : 'sending',
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => ({
      ...prev,
      [receiverId]: [...(prev[receiverId] || []), tempMessage],
    }));

    if (!connected) {
      console.log('📡 Offline - queued');
      setPendingMessages((prev) => [...prev, { tempId, receiverId, text, files }]);
      return tempMessage;
    }

    try {
      await sendMessageToServer(receiverId, text, files, tempId);
    } catch (err) {
      // Error handled
    }

    return tempMessage;
  };

  const retryMessage = async (receiverId, messageId) => {
    const candidate = messages[receiverId]?.find((m) => m._id === messageId);
    if (!candidate) return;

    setMessages((prev) => ({
      ...prev,
      [receiverId]: prev[receiverId].map((m) =>
        m._id === messageId ? { ...m, status: 'sending' } : m
      ),
    }));

    try {
      await sendMessageToServer(receiverId, candidate.text, [], messageId);
    } catch (err) {
      console.error('Retry failed:', err);
    }
  };

  // ✅ Use messageApi.markAsRead()
  const markMessageAsRead = async (messageId) => {
    try {
      await messageApi.markAsRead(messageId);
    } catch (err) {
      console.error('❌ Mark read failed:', err);
    }
  };

  useEffect(() => {
    if (!socket || !currentUserId) return;

    const onReceive = (message) => {
      console.log('📨 New message:', message);
      
      const messageSenderId = message.senderId?._id || message.senderId;
      const messageReceiverId = message.receiverId?._id || message.receiverId;
      
      if (String(messageSenderId) !== String(currentUserId) && 
          String(messageReceiverId) !== String(currentUserId)) {
        console.log('❌ Message not for current user');
        return;
      }
      
      const isSelfMessage = String(messageSenderId) === String(messageReceiverId);
      
      if (isSelfMessage && String(messageSenderId) === String(currentUserId)) {
        console.log('📝 Self-message');
        
        setMessages((prev) => {
          const updated = { ...prev };
          const userMessages = updated[messageSenderId] || [];
          
          updated[messageSenderId] = userMessages.map(m => {
            if (m.text === message.text && 
                Math.abs(new Date(m.createdAt) - new Date(message.createdAt)) < 2000) {
              return { ...m, status: 'read', read: true, _id: message._id };
            }
            return m;
          });
          
          return updated;
        });
        return;
      }
      
      const otherUserId =
        String(messageSenderId) === String(currentUserId)
          ? messageReceiverId
          : messageSenderId;

      setMessages((prev) => {
        const prevList = prev[otherUserId] || [];
        
        const exists = prevList.some(m => m._id === message._id);
        if (exists) return prev;
        
        const messageWithTimestamp = {
          ...message,
          createdAt: message.createdAt || new Date().toISOString(),
          updatedAt: message.updatedAt || new Date().toISOString()
        };
        
        return { ...prev, [otherUserId]: [...prevList, messageWithTimestamp] };
      });

      if (message.senderId && typeof message.senderId === 'object') {
        setConversationUsers((prev) => ({
          ...prev,
          [message.senderId._id]: message.senderId,
        }));
      }
      if (message.receiverId && typeof message.receiverId === 'object') {
        setConversationUsers((prev) => ({
          ...prev,
          [message.receiverId._id]: message.receiverId,
        }));
      }

      if (selectedChat && String(selectedChat._id) === String(otherUserId)) {
        markMessageAsRead(message._id);
      }
    };

    const onStatus = ({ messageId, status }) => {
      console.log('📊 Status update:', messageId, status);
      
      setMessages((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((uid) => {
          updated[uid] = updated[uid].map((m) =>
            m._id === messageId ? { ...m, status } : m
          );
        });
        return updated;
      });
    };

    const onTyping = ({ userId, isTyping }) => {
      setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));
    };

    const onMessageEscalated = async (data) => {
      console.log('🚨 Escalated:', data);
      
      const { issueId, escalatedTo, receiverId, message } = data;
      
      if (message && receiverId) {
        setMessages((prev) => {
          const prevList = prev[receiverId] || [];
          const exists = prevList.some(m => m._id === message._id);
          if (exists) return prev;
          
          const messageWithTimestamp = {
            ...message,
            createdAt: message.createdAt || new Date().toISOString(),
            updatedAt: message.updatedAt || new Date().toISOString()
          };
          
          return { ...prev, [receiverId]: [...prevList, messageWithTimestamp] };
        });

        if (message.receiverId && typeof message.receiverId === 'object') {
          setConversationUsers((prev) => ({
            ...prev,
            [message.receiverId._id]: message.receiverId,
          }));
        }
      }

      if (window.showToast) {
        window.showToast(`🚨 Escalated to ${escalatedTo}`, 'warning');
      }

      await fetchConversationsList();
    };

    const onIssueEscalated = (data) => {
      console.log('📢 Issue escalated:', data);
      
      const { escalatedUser } = data;
      
      if (escalatedUser) {
        setConversationUsers((prev) => ({
          ...prev,
          [escalatedUser._id]: escalatedUser,
        }));
      }
    };

    socket.on('message:receive', onReceive);
    socket.on('message:new', onReceive);
    socket.on('message:status', onStatus);
    socket.on('user:typing', onTyping);
    socket.on('message:escalated', onMessageEscalated);
    socket.on('issue:escalated', onIssueEscalated);

    console.log('✅ Socket listeners registered');

    return () => {
      socket.off('message:receive', onReceive);
      socket.off('message:new', onReceive);
      socket.off('message:status', onStatus);
      socket.off('user:typing', onTyping);
      socket.off('message:escalated', onMessageEscalated);
      socket.off('issue:escalated', onIssueEscalated);
    };
  }, [socket, currentUserId, selectedChat]);

  const handleTyping = () => {
    if (!socket || !selectedChat) return;
    socket.emit('user:typing', { to: selectedChat._id, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('user:typing', { to: selectedChat._id, isTyping: false });
    }, 1000);
  };

  useEffect(() => {
    if (!selectedChat) return;
    const uid = selectedChat._id;

    if (!messages[uid] || messages[uid].length === 0) {
      fetchMessages(uid);
    }

    const chatMsgs = messages[uid] || [];
    chatMsgs.forEach((m) => {
      if (!m.read && String(m.receiverId) === String(currentUserId)) {
        markMessageAsRead(m._id);
      }
    });

    if (window.innerWidth < 1024) setShowListOnMobile(false);
  }, [selectedChat]);

  useEffect(() => {
    return () => {
      messageFiles.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, [messageFiles]);

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

  const handleSendMessage = async () => {
    if (!currentUserId || !selectedChat) return;
    if (!messageText.trim() && messageFiles.length === 0) return;
    if (sending) return;

    const text = messageText;
    const files = [...messageFiles];

    setMessageText('');
    setMessageFiles([]);
    setSending(true);
    try {
      await sendMessage(selectedChat._id, text, files);
    } catch (err) {
      console.error('❌ Send failed', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sending && (messageText.trim() || messageFiles.length > 0))
        handleSendMessage();
    }
  };

  const handleMessageInputChange = (e) => {
    setMessageText(e.target.value);
    handleTyping();
  };

  const conversations = useMemo(() => {
    const list = [];
    const allUsers = { ...conversationUsers };

    if (users) {
      users.forEach((u) => {
        if (u && u._id) allUsers[u._id] = u;
      });
    }

    Object.values(allUsers).forEach((u) => {
      if (!u || !u._id) return;

      const msgs = messages[u._id] || [];
      if (msgs.length === 0) return;

      const conversation = createConversation(msgs, u, currentUserId);
      list.push(conversation);
    });

    return sortConversations(list);
  }, [users, conversationUsers, messages, currentUserId]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;

    if (searchResults.length > 0) {
      const userIds = new Set(
        searchResults.map((msg) => {
          const other =
            String(msg.senderId._id || msg.senderId) === String(currentUserId)
              ? msg.receiverId._id || msg.receiverId
              : msg.senderId._id || msg.senderId;
          return String(other);
        })
      );
      return conversations.filter((c) => userIds.has(String(c.user._id)));
    }

    return conversations.filter((c) => {
      const name = (c.user?.name || '').toLowerCase();
      const email = (c.user?.email || '').toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        (c.latestMessage?.text || '').toLowerCase().includes(q)
      );
    });
  }, [conversations, searchQuery, searchResults, currentUserId]);

  const handleBackToList = () => setShowListOnMobile(true);

  const handleSelectChat = (u) => {
    setSelectedChat(u);
    setSearchQuery('');
    setSearchResults([]);
    setShowListOnMobile(false);

    setConversationUsers((prev) => ({ ...prev, [u._id]: u }));

    if (!messages[u._id] || messages[u._id].length === 0) {
      fetchMessages(u._id);
    }
  };

  const isMobileView =
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />

      {initializing ? (
        <Loading fullScreen size="lg" />
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {(!isMobileView || showListOnMobile) && (
              <ChatList
                conversations={filteredConversations}
                selectedChat={selectedChat}
                searchQuery={searchQuery}
                searchResults={searchResults}
                isSearching={isSearching}
                onSelectChat={handleSelectChat}
                onSearchChange={setSearchQuery}
              />
            )}

            {(!isMobileView || !showListOnMobile) && (
              <ChatWindow
                selectedChat={selectedChat}
                messages={messages[selectedChat?._id] || []}
                loading={loading}
                messageText={messageText}
                messageFiles={messageFiles}
                sending={sending}
                currentUserId={currentUserId}
                userAvatar={user?.avatar}
                typingUsers={typingUsers}
                isMobileView={isMobileView}
                onBack={handleBackToList}
                onMessageChange={handleMessageInputChange}
                onKeyPress={handleKeyPress}
                onSend={handleSendMessage}
                onFileSelect={handleFileSelect}
                onFileRemove={removeFile}
                onRetryMessage={retryMessage}
              />
            )}
          </div>
        </main>
      )}
    </div>
  );
};

export default MessagesPage;