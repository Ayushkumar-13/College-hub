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
  const { user } = useContext(AuthContext);
  const { socket, connected } = useSocket();

  const [conversations, setConversations] = useState({});
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  
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
     State Resets
  --------------------------------------------------*/
  useEffect(() => {
    if (!currentUserId) {
      setConversations({});
      setChatList([]);
      setSelectedChat(null);
      setTypingUsers({});
      setPendingMessages([]);
      setSearchResults([]);
    }
  }, [currentUserId]);

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
      } else if (allUsersFallback.length > 0) {
        console.log('📥 No recent chats, using user-base fallback...');
        const userChats = allUsersFallback.map(u => ({
          user: u,
          latestMessage: null,
          unreadCount: 0
        }));
        setChatList(userChats);
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
    try {
      setLoading(true);
      const data = await messageApi.getMessages(normalizedId);
      if (!mountedRef.current) return;
      setConversations((prev) => ({ ...prev, [normalizedId]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error("❌ Error loading messages:", err);
      setConversations((prev) => ({ ...prev, [normalizedId]: [] }));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [currentUserId]);

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
      const senderId = toId(msg.senderId);
      const receiverId = toId(msg.receiverId);

      if (senderId !== currentUserId && receiverId !== currentUserId) return;
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
