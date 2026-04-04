// frontend/src/context/MessageContext.jsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { messageApi } from "@/api/messageApi";
import { AuthContext } from "./AuthContext";
import { useSocket } from "./SocketContext";

export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const { socket, connected } = useSocket();

  // --- PERSISTENCE HELPERS ---
  const isHydrated = useRef(false);
  const getStorageKey = (key) => `college-hub-${user?._id || 'guest'}-v2-${key}`;

  const [conversations, setConversations] = useState({});
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  // 1. Initial Hydration (Load from Storage once User is ready)
  useEffect(() => {
    if (user?._id && !isHydrated.current) {
      console.log("🕵️ Checking localStorage for session:", user._id);
      try {
        const savedConvs = localStorage.getItem(getStorageKey("conversations"));
        const savedSelected = localStorage.getItem(getStorageKey("selected-chat"));
        const savedChatList = localStorage.getItem(getStorageKey("chat-list"));
        
        if (savedConvs) {
          const parsed = JSON.parse(savedConvs);
          if (parsed && typeof parsed === 'object') {
             console.log("💾 Hydrating conversations:", Object.keys(parsed).length);
             setConversations(parsed);
          }
        }
        if (savedSelected) {
          const parsed = JSON.parse(savedSelected);
          console.log("💾 Hydrating selectedChat:", parsed?.name);
          setSelectedChat(parsed);
        }
        if (savedChatList) {
          const parsed = JSON.parse(savedChatList);
          console.log("💾 Hydrating chatList:", parsed.length);
          setChatList(parsed);
        }
      } catch (err) {
        console.error("❌ Hydration error:", err);
      } finally {
        isHydrated.current = true;
        console.log("✅ Hydration sequence complete.");
      }
    }
  }, [user?._id]);

  // 2. Sync Conversations & ChatList to Storage (ONLY after hydration is complete and we HAVE data)
  useEffect(() => {
    if (user?._id && isHydrated.current) {
      const hasConvs = Object.keys(conversations).length > 0;
      const hasList = chatList.length > 0;
      
      try {
        if (hasConvs) localStorage.setItem(getStorageKey("conversations"), JSON.stringify(conversations));
        if (hasList) localStorage.setItem(getStorageKey("chat-list"), JSON.stringify(chatList));
      } catch (e) {
        console.warn("⚠️ LocalStorage quota/access issue");
      }
    }
  }, [conversations, chatList, user?._id]);

  // 3. Sync Selected Chat to Storage
  useEffect(() => {
    if (user?._id && isHydrated.current) {
      if (selectedChat) {
        localStorage.setItem(getStorageKey("selected-chat"), JSON.stringify(selectedChat));
      } else {
        localStorage.removeItem(getStorageKey("selected-chat"));
      }
    }
  }, [selectedChat, user?._id]);
  
  // Search state
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Offline/Retry state
  const [pendingMessages, setPendingMessages] = useState([]);
  
  const mountedRef = useRef(true);

  const toId = (idOrObj) => {
    if (!idOrObj) return "";
    if (typeof idOrObj === "string") return idOrObj;
    return String(idOrObj._id || idOrObj.id || idOrObj);
  };

  const currentUserId = toId(user?._id || user?.id);

  /* -------------------------------------------------
     State Resets (ONLY when definitively logged out)
  --------------------------------------------------*/
  useEffect(() => {
    if (!currentUserId && !authLoading) {
      setConversations({});
      setChatList([]);
      setSelectedChat(null);
      setTypingUsers({});
      setPendingMessages([]);
      setSearchResults([]);
      isHydrated.current = false;
    }
  }, [currentUserId, authLoading]);

  /* -------------------------------------------------
     Fetchers
  --------------------------------------------------*/
  const loadChatList = useCallback(async (allUsersFallback = []) => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      const data = await messageApi.getChatList();
      if (!mountedRef.current) return;
      
      if (Array.isArray(data) && data.length > 0) {
        setChatList(data);
      } else if (chatList.length === 0 && allUsersFallback.length > 0) {
        // Only use fallback if we have NO saved list and NO api list
        console.log('📥 No recent chats, using user-base fallback...');
        const userChats = allUsersFallback.map(u => ({
          user: u,
          latestMessage: null,
          unreadCount: 0
        }));
        setChatList(userChats);
      } else if (chatList.length > 0) {
        console.log('ℹ️ API returned no chat list, keeping hydrated list.');
      } else {
        setChatList([]);
      }
    } catch (err) {
      console.error("❌ Error loading chat list:", err);
      setChatList([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [currentUserId]);

  const loadMessages = useCallback(async (otherUserId) => {
    if (!currentUserId || !otherUserId) return;
    const normalizedId = toId(otherUserId);
    
    // Only show full loader if we have NO messages for this user yet
    const hasCached = conversations[normalizedId] && conversations[normalizedId].length > 0;
    
    try {
      if (!hasCached) setLoading(true);
      const data = await messageApi.getMessages(normalizedId);
      if (!mountedRef.current) return;
      setConversations((prev) => ({ ...prev, [normalizedId]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error("❌ Error loading messages:", err);
      // Fallback: keep cached if exists
    } finally {
       setLoading(false);
       console.log("🏁 Loading finished for messages.");
    }
  }, [currentUserId, conversations]);

  // Handle Initial Fetch for restored SelectedChat
  useEffect(() => {
    if (selectedChat && (!conversations[toId(selectedChat)] || conversations[toId(selectedChat)].length === 0)) {
      loadMessages(toId(selectedChat));
    }
  }, [loadMessages, selectedChat, !!conversations[toId(selectedChat)]]);

  /* -------------------------------------------------
     Search
  --------------------------------------------------*/
  const searchMessages = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const results = await messageApi.searchMessages(query);
      if (mountedRef.current) setSearchResults(results || []);
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults([]);
    } finally {
      if (mountedRef.current) setIsSearching(false);
    }
  }, []);

  /* -------------------------------------------------
     Helpers: Atomic UI updates
  --------------------------------------------------*/
  const upsertChatListWithMessage = useCallback((msg) => {
    if (!msg) return;
    const senderId = toId(msg.senderId);
    const receiverId = toId(msg.receiverId);
    const otherUserId = senderId === currentUserId ? receiverId : senderId;

    setChatList((prev) => {
      const existingIdx = prev.findIndex((c) => toId(c.user?._id) === otherUserId);
      const isIncoming = receiverId === currentUserId;
      const isViewing = toId(selectedChat?._id) === otherUserId;

      const newEntry = {
        user: msg.senderId && typeof msg.senderId === "object" ? (isIncoming ? msg.senderId : msg.receiverId) : (existingIdx >= 0 ? prev[existingIdx].user : { _id: otherUserId }),
        latestMessage: msg,
        unreadCount: (existingIdx >= 0 ? prev[existingIdx].unreadCount : 0) + (isIncoming && !isViewing ? 1 : 0)
      };

      const filtered = prev.filter((c) => toId(c.user?._id) !== otherUserId);
      return [newEntry, ...filtered];
    });
  }, [currentUserId, selectedChat]);

  /* -------------------------------------------------
     Socket Handlers
  --------------------------------------------------*/
  useEffect(() => {
    if (!socket || !connected || !currentUserId) return;

    const handleNewMessage = (msg) => {
      console.log('📩 Incoming socket message:', msg?._id, 'from:', msg?.senderId?._id || msg?.senderId);
      const senderId = toId(msg.senderId);
      const receiverId = toId(msg.receiverId);

      if (senderId !== currentUserId && receiverId !== currentUserId) {
        console.warn('⚠️ Message received for different user. Ignoring.');
        return;
      }
      const otherUserId = senderId === currentUserId ? receiverId : senderId;

      setConversations((prev) => {
        const prevMsgs = prev[otherUserId] || [];
        if (prevMsgs.some((m) => toId(m._id) === toId(msg._id))) return prev;
        return { ...prev, [otherUserId]: [...prevMsgs, msg] };
      });

      upsertChatListWithMessage(msg);
    };

    const handleStatusUpdate = ({ messageId, status }) => {
      setConversations((prev) => {
        const updated = {};
        Object.keys(prev).forEach((id) => {
          updated[id] = prev[id].map(m => toId(m._id) === toId(messageId) ? { ...m, status } : m);
        });
        return updated;
      });
      setChatList(prev => prev.map(c => 
        toId(c.latestMessage?._id) === toId(messageId) ? { ...c, latestMessage: { ...c.latestMessage, status } } : c
      ));
    };

    const handleTyping = ({ from, isTyping }) => {
      setTypingUsers((prev) => ({ ...prev, [toId(from)]: !!isTyping }));
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:status", handleStatusUpdate);
    socket.on("user:typing", handleTyping);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:status", handleStatusUpdate);
      socket.off("user:typing", handleTyping);
    };
  }, [socket, connected, currentUserId, upsertChatListWithMessage]);

  /* -------------------------------------------------
     Actions
  --------------------------------------------------*/
  const sendMessage = useCallback(async (receiverId, text, files = []) => {
    if (!currentUserId) return;
    const normalizedReceiver = toId(receiverId);
    const tempId = `tmp-${Date.now()}`;

    const tempMsg = {
      _id: tempId,
      senderId: currentUserId,
      receiverId: normalizedReceiver,
      text: text || "",
      media: files.map(f => ({ url: f.preview || "", type: "image" })), 
      status: "sending",
      createdAt: new Date().toISOString()
    };

    setConversations(prev => ({ ...prev, [normalizedReceiver]: [...(prev[normalizedReceiver] || []), tempMsg] }));
    upsertChatListWithMessage(tempMsg);

    try {
      const saved = await messageApi.sendMessage(normalizedReceiver, text, files);
      setConversations(prev => ({
        ...prev,
        [normalizedReceiver]: prev[normalizedReceiver].map(m => m._id === tempId ? saved : m)
      }));
      upsertChatListWithMessage(saved);
      return saved;
    } catch (err) {
      console.error("❌ sendMessage error:", err);
      setConversations(prev => ({
        ...prev,
        [normalizedReceiver]: prev[normalizedReceiver].map(m => m._id === tempId ? { ...m, status: "failed" } : m)
      }));
      setPendingMessages(prev => [...prev, { tempId, receiverId, text, files }]);
      throw err;
    }
  }, [currentUserId, upsertChatListWithMessage]);

  const retryMessage = useCallback(async (pending) => {
    const { tempId, receiverId, text, files } = pending;
    try {
      setConversations(prev => ({
        ...prev,
        [receiverId]: prev[receiverId].map(m => m._id === tempId ? { ...m, status: "sending" } : m)
      }));
      const saved = await messageApi.sendMessage(receiverId, text, files);
      setConversations(prev => ({
        ...prev,
        [receiverId]: prev[receiverId].map(m => m._id === tempId ? saved : m)
      }));
      setPendingMessages(prev => prev.filter(p => p.tempId !== tempId));
      upsertChatListWithMessage(saved);
    } catch (err) {
      setConversations(prev => ({
        ...prev,
        [receiverId]: prev[receiverId].map(m => m._id === tempId ? { ...m, status: "failed" } : m)
      }));
    }
  }, [upsertChatListWithMessage]);

  const markAsRead = useCallback(async (messageId) => {
    try {
      await messageApi.markAsRead(messageId);
    } catch (err) {
      console.error("❌ markAsRead error:", err);
    }
  }, []);

  const selectChat = useCallback((targetUser) => {
    if (!targetUser) {
      setSelectedChat(null);
      return;
    }
    
    // Support passing just the user object
    const normalizedId = toId(targetUser);
    
    // Ensure we have the full user object if possible, or at least the ID
    const fullUser = targetUser._id ? targetUser : { _id: normalizedId, name: targetUser.name || 'User' };
    
    setSelectedChat(fullUser);
    
    if (!conversations[normalizedId] || conversations[normalizedId].length === 0) {
      loadMessages(normalizedId);
    }
    
    // Clear unread in chatList
    setChatList(prev => prev.map(c => toId(c.user?._id) === normalizedId ? { ...c, unreadCount: 0 } : c));
  }, [conversations, loadMessages]);

  const value = {
    chatList,
    conversations,
    selectedChat,
    loading,
    typingUsers,
    searchResults,
    isSearching,
    pendingMessages,
    loadChatList,
    loadMessages,
    sendMessage,
    retryMessage,
    markAsRead,
    searchMessages,
    selectChat,
    getMessages: (id) => conversations[toId(id)] || []
  };

  useEffect(() => {
    loadChatList();
  }, [loadChatList]);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
};
