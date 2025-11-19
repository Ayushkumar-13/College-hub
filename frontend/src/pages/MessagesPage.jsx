  import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
  import Navbar from '@/components/Navbar';
  import { useAuth, useUser, useSocket } from '@/hooks';
  import axios from 'axios';
  import ChatList from '@/components/Messages/ChatList';
  import ChatWindow from '@/components/Messages/ChatWindow';
  import Loading from '@/components/Common/Loading';
  import {
    getLatestMessage,
    getLatestMessageTime,
    sortConversations,
    createConversation,
    shouldResortConversation,
  } from '@/utils/conversationHelpers';

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const MessagesPage = () => {
    const { user } = useAuth();
    const { users } = useUser();
    const socket = useSocket();

    // State with sessionStorage persistence
    const [selectedChat, setSelectedChat] = useState(() => {
      try {
        const saved = sessionStorage.getItem('selectedChat');
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    });

    const [messages, setMessages] = useState(() => {
      try {
        const saved = sessionStorage.getItem('messages');
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    });

    const [conversationUsers, setConversationUsers] = useState(() => {
      try {
        const saved = sessionStorage.getItem('conversationUsers');
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

    const searchTimeoutRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const currentUserId = user?._id || user?.id;

    // Fetch messages for a user
    const fetchMessages = async (userId) => {
      if (!userId) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/messages/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages((prev) => ({ ...prev, [userId]: response.data || [] }));
      } catch (error) {
        console.error('❌ Error fetching messages for', userId, error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch conversation summaries
    const fetchConversationsList = async () => {
      try {
        const token = localStorage.getItem('token');
        const convoResp = await axios.get(`${API_BASE_URL}/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(convoResp.data)) {
          const map = {};
          const userMap = {};

          convoResp.data.forEach((c) => {
            const uId = String(c.userId || c.user?._id || c.userId);
            if (!map[uId]) map[uId] = [];
            if (c.latestMessage) map[uId].push(c.latestMessage);
            if (c.user) userMap[uId] = c.user;
          });

          setMessages((prev) => ({ ...map, ...prev }));
          setConversationUsers((prev) => ({ ...prev, ...userMap }));
          return;
        }
      } catch (err) {
        // Fallback
      }

      // Fallback: fetch messages for each known user
      if (users && users.length > 0) {
        try {
          const fetches = users.map(async (u) => {
            try {
              const token = localStorage.getItem('token');
              const res = await axios.get(`${API_BASE_URL}/messages/${u._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              return { userId: u._id, messages: res.data || [], user: u };
            } catch (error) {
              return { userId: u._id, messages: [], user: u };
            }
          });

          const results = await Promise.all(fetches);
          const map = {};
          const userMap = {};

          results.forEach((r) => {
            if (r.messages && r.messages.length > 0) map[r.userId] = r.messages;
            if (r.user) userMap[r.userId] = r.user;
          });

          setMessages((prev) => ({ ...prev, ...map }));
          setConversationUsers((prev) => ({ ...prev, ...userMap }));
        } catch (error) {
          console.error('❌ Fallback conversation fetch failed', error);
        }
      }
    };

    // Run on first mount
    useEffect(() => {
      fetchConversationsList().finally(() => setInitializing(false));
    }, []);

    // Update conversation users when users list changes
    useEffect(() => {
      if (users && users.length > 0) {
        const userMap = {};
        users.forEach((u) => {
          if (u && u._id) userMap[u._id] = u;
        });
        setConversationUsers((prev) => ({ ...prev, ...userMap }));
      }
    }, [users]);

    // Persist to sessionStorage
    useEffect(() => {
      if (selectedChat) {
        sessionStorage.setItem('selectedChat', JSON.stringify(selectedChat));
      } else {
        sessionStorage.removeItem('selectedChat');
      }
    }, [selectedChat]);

    useEffect(() => {
      if (Object.keys(messages).length > 0) {
        sessionStorage.setItem('messages', JSON.stringify(messages));
      }
    }, [messages]);

    useEffect(() => {
      if (Object.keys(conversationUsers).length > 0) {
        sessionStorage.setItem('conversationUsers', JSON.stringify(conversationUsers));
      }
    }, [conversationUsers]);

    // Handle URL params for preselecting user
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

    // Search messages
    const searchMessages = async (query) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const token = localStorage.getItem('token');
        const resp = await axios.get(`${API_BASE_URL}/messages/search/query`, {
          params: { q: query },
          headers: { Authorization: `Bearer ${token}` },
        });
        setSearchResults(resp.data || []);
      } catch (error) {
        console.error('❌ Search error', error);
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

    // Send message with optimistic UI
    const sendMessage = async (receiverId, text, files = []) => {
      const tempId = `temp-${Date.now()}`;
      const tempMessage = {
        _id: tempId,
        senderId: currentUserId,
        receiverId,
        text: text || '',
        media: [],
        status: 'sending',
        createdAt: new Date().toISOString(),
        read: false,
      };

      setMessages((prev) => ({
        ...prev,
        [receiverId]: [...(prev[receiverId] || []), tempMessage],
      }));

      try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('receiverId', receiverId);
        formData.append('text', text || '');
        files.forEach((f) => formData.append('media', f));

        const resp = await axios.post(`${API_BASE_URL}/messages`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        });

        const newMessage = resp.data;

        setMessages((prev) => ({
          ...prev,
          [receiverId]: prev[receiverId].map((m) =>
            m._id === tempId ? newMessage : m
          ),
        }));

        return newMessage;
      } catch (error) {
        console.error('❌ Error sending message', error);
        setMessages((prev) => ({
          ...prev,
          [receiverId]: prev[receiverId].map((m) =>
            m._id === tempId ? { ...m, status: 'failed' } : m
          ),
        }));
        throw error;
      }
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
        await sendMessage(receiverId, candidate.text, []);
        setMessages((prev) => ({
          ...prev,
          [receiverId]: prev[receiverId].filter((m) => m._id !== messageId),
        }));
      } catch (err) {
        // left as failed
      }
    };

    // Mark message as read
    const markMessageAsRead = async (messageId) => {
      try {
        const token = localStorage.getItem('token');
        await axios.patch(
          `${API_BASE_URL}/messages/${messageId}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error('❌ Mark read failed', err);
      }
    };

    // 🔥 SOCKET LISTENERS - INCLUDING ESCALATION EVENTS
    useEffect(() => {
      if (!socket || !currentUserId) return;

      // Regular message received
      const onReceive = (message) => {
        console.log('📨 New message received:', message);
        
        const messageSenderId = message.senderId?._id || message.senderId;
        const messageReceverId = message.receiverId?._id || message.receiverId;
        const otherUserId =
          String(messageSenderId) === String(currentUserId)
            ? messageReceverId
            : messageSenderId;

        setMessages((prev) => {
          const prevList = prev[otherUserId] || [];
          // Prevent duplicates
          const exists = prevList.some(m => m._id === message._id);
          if (exists) return prev;
          
          // Ensure message has timestamp for proper sorting
          const messageWithTimestamp = {
            ...message,
            createdAt: message.createdAt || new Date().toISOString(),
            updatedAt: message.updatedAt || new Date().toISOString()
          };
          
          return { ...prev, [otherUserId]: [...prevList, messageWithTimestamp] };
        });

        // Add users to conversation list
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

        // Mark as read if chat is open
        if (selectedChat && String(selectedChat._id) === String(otherUserId)) {
          markMessageAsRead(message._id);
        }
      };

      // Message status update
      const onStatus = ({ messageId, status }) => {
        console.log('📊 Message status update:', messageId, status);
        
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

      // Typing indicator
      const onTyping = ({ userId, isTyping }) => {
        setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));
      };

      // 🔥 ESCALATION EVENT - Message was escalated to Director/Owner
      const onMessageEscalated = async (data) => {
        console.log('🚨 Message escalated:', data);
        
        const { issueId, escalatedTo, receiverId, message } = data;
        
        // Add escalated message to conversation
        if (message && receiverId) {
          setMessages((prev) => {
            const prevList = prev[receiverId] || [];
            // Prevent duplicates
            const exists = prevList.some(m => m._id === message._id);
            if (exists) return prev;
            
            // Add message with current timestamp to ensure proper sorting
            const messageWithTimestamp = {
              ...message,
              createdAt: message.createdAt || new Date().toISOString(),
              updatedAt: message.updatedAt || new Date().toISOString()
            };
            
            return { ...prev, [receiverId]: [...prevList, messageWithTimestamp] };
          });

          // Add receiver to conversation users if not exists
          if (message.receiverId && typeof message.receiverId === 'object') {
            setConversationUsers((prev) => ({
              ...prev,
              [message.receiverId._id]: message.receiverId,
            }));
          }
        }

        // Show notification toast
        if (window.showToast) {
          window.showToast(`🚨 Issue escalated to ${escalatedTo}`, 'warning');
        }

        // Refresh conversation list to show new chat
        await fetchConversationsList();
      };

      // 🔥 GLOBAL ISSUE ESCALATED EVENT
      const onIssueEscalated = (data) => {
        console.log('📢 Issue escalated globally:', data);
        
        const { issueId, title, escalatedTo, escalatedUser } = data;
        
        // Add escalated user to conversation users
        if (escalatedUser) {
          setConversationUsers((prev) => ({
            ...prev,
            [escalatedUser._id]: escalatedUser,
          }));
        }
      };

      // Register listeners
      socket.on('message:receive', onReceive);
      socket.on('message:new', onReceive); // Alias
      socket.on('message:status', onStatus);
      socket.on('user:typing', onTyping);
      socket.on('message:escalated', onMessageEscalated); // 🔥 NEW
      socket.on('issue:escalated', onIssueEscalated); // 🔥 NEW

      console.log('✅ Socket listeners registered (including escalation)');

      return () => {
        socket.off('message:receive', onReceive);
        socket.off('message:new', onReceive);
        socket.off('message:status', onStatus);
        socket.off('user:typing', onTyping);
        socket.off('message:escalated', onMessageEscalated);
        socket.off('issue:escalated', onIssueEscalated);
      };
    }, [socket, currentUserId, selectedChat]);

    // Emit typing
    const handleTyping = () => {
      if (!socket || !selectedChat) return;
      socket.emit('user:typing', { to: selectedChat._id, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('user:typing', { to: selectedChat._id, isTyping: false });
      }, 1000);
    };

    // Load messages when selecting a chat
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

    // Cleanup previews
    useEffect(() => {
      return () => {
        messageFiles.forEach((file) => {
          if (file.preview) URL.revokeObjectURL(file.preview);
        });
      };
    }, [messageFiles]);

    // File select handlers
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

    // Send message flow
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

    // Build conversation list with enhanced sorting
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

        // Use helper functions for consistent sorting
        const conversation = createConversation(msgs, u, currentUserId);
        list.push(conversation);
      });

      // Sort conversations with priority logic
      return sortConversations(list);
    }, [users, conversationUsers, messages, currentUserId]);

    // Filter conversations by search
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