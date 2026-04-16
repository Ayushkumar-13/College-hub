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

export const toId = (idOrObj) => {
  if (!idOrObj) return "";
  if (typeof idOrObj === "string") return idOrObj;
  return String(idOrObj._id || idOrObj.id || idOrObj);
};

export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const { socket, connected } = useSocket();

  // --- PERSISTENCE HELPERS ---
  const isHydrated = useRef(false);
  const getStorageKey = (key) => `college-hub-${user?._id || "guest"}-v2-${key}`;

  const [conversations, setConversations] = useState({});
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingUsers, _setTypingUsers] = useState({});

  // --- RETRY QUEUE ---
  // Stores { tempId, receiverId, text, files } for failed / offline messages
  const retryQueueRef = useRef([]);
  const isRetryingRef = useRef(false);

  const currentUserId = toId(user?._id || user?.id);

  // 1. Initial Hydration
  useEffect(() => {
    if (user?._id && !isHydrated.current) {
      try {
        const savedConvs = localStorage.getItem(getStorageKey("conversations"));
        const savedSelected = localStorage.getItem(getStorageKey("selected-chat"));
        const savedChatList = localStorage.getItem(getStorageKey("chat-list"));

        if (savedConvs) {
          const parsed = JSON.parse(savedConvs);
          if (parsed && typeof parsed === "object") setConversations(parsed);
        }
        if (savedSelected) {
          const parsed = JSON.parse(savedSelected);
          setSelectedChat(parsed);
        }
        if (savedChatList) {
          const parsed = JSON.parse(savedChatList);
          setChatList(parsed);
        }
      } catch (err) {
        console.error("❌ Hydration error:", err);
      } finally {
        isHydrated.current = true;
      }
    }
  }, [user?._id]);

  // 2. Sync to Storage
  useEffect(() => {
    if (user?._id && isHydrated.current) {
      try {
        if (Object.keys(conversations).length > 0)
          localStorage.setItem(
            getStorageKey("conversations"),
            JSON.stringify(conversations)
          );
        if (chatList.length > 0)
          localStorage.setItem(
            getStorageKey("chat-list"),
            JSON.stringify(chatList)
          );
      } catch (_e) {
        console.warn("⚠️ LocalStorage sync issue");
      }
    }
  }, [conversations, chatList, user?._id]);

  useEffect(() => {
    if (user?._id && isHydrated.current) {
      if (selectedChat) {
        localStorage.setItem(
          getStorageKey("selected-chat"),
          JSON.stringify(selectedChat)
        );
      } else {
        localStorage.removeItem(getStorageKey("selected-chat"));
      }
    }
  }, [selectedChat, user?._id]);

  // Search state
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const mountedRef = useRef(true);

  // --- Clear on logout ---
  useEffect(() => {
    if (!currentUserId && !authLoading) {
      setConversations({});
      setChatList([]);
      setSelectedChat(null);
      retryQueueRef.current = [];
      isHydrated.current = false;
    }
  }, [currentUserId, authLoading]);

  const loadChatList = useCallback(
    async (allUsersFallback = []) => {
      if (!currentUserId) return;
      try {
        setLoading(true);
        const data = await messageApi.getChatList();
        if (!mountedRef.current) return;

        if (Array.isArray(data) && data.length > 0) {
          setChatList(data);
        } else if (chatList.length === 0 && allUsersFallback.length > 0) {
          setChatList(
            allUsersFallback.map((u) => ({
              user: u,
              latestMessage: null,
              unreadCount: 0,
            }))
          );
        }
      } catch (err) {
        console.error("❌ loadChatList error:", err);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [currentUserId, chatList.length]
  );

  const loadMessages = useCallback(
    async (otherUserId) => {
      if (!currentUserId || !otherUserId) return;
      const normalizedId = toId(otherUserId);
      const hasCached =
        conversations[normalizedId] &&
        conversations[normalizedId].length > 0;
      try {
        if (!hasCached) setLoading(true);
        const data = await messageApi.getMessages(normalizedId);
        if (!mountedRef.current) return;
        setConversations((prev) => ({
          ...prev,
          [normalizedId]: Array.isArray(data) ? data : [],
        }));
      } catch (err) {
        console.error("❌ loadMessages error:", err);
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, conversations]
  );

  const upsertChatListWithMessage = useCallback(
    (msg) => {
      if (!msg) return;
      const senderId = toId(msg.senderId);
      const receiverId = toId(msg.receiverId);
      const otherUserId =
        senderId === currentUserId ? receiverId : senderId;

      setChatList((prev) => {
        const idx = prev.findIndex(
          (c) => toId(c.user?._id || c.user?.id) === otherUserId
        );
        const isIncoming = receiverId === currentUserId;
        const isViewing =
          toId(selectedChat?._id || selectedChat?.id) === otherUserId;
        const newEntry = {
          user:
            msg.senderId && typeof msg.senderId === "object"
              ? isIncoming
                ? msg.senderId
                : msg.receiverId
              : idx >= 0
              ? prev[idx].user
              : { _id: otherUserId },
          latestMessage: msg,
          unreadCount:
            (idx >= 0 ? prev[idx].unreadCount : 0) +
            (isIncoming && !isViewing ? 1 : 0),
        };
        return [
          newEntry,
          ...prev.filter(
            (c) => toId(c.user?._id || c.user?.id) !== otherUserId
          ),
        ];
      });
    },
    [currentUserId, selectedChat]
  );

  // Socket: incoming messages
  useEffect(() => {
    if (!socket || !connected || !currentUserId) return;
    socket.on("message:new", (msg) => {
      const otherId =
        toId(msg.senderId) === currentUserId
          ? toId(msg.receiverId)
          : toId(msg.senderId);
      setConversations((prev) => ({
        ...prev,
        [otherId]: [...(prev[otherId] || []), msg],
      }));
      upsertChatListWithMessage(msg);
    });
    return () => {
      socket.off("message:new");
    };
  }, [socket, connected, currentUserId, upsertChatListWithMessage]);

  // --- CORE SEND (shared by sendMessage and retry) ---
  const _doSend = useCallback(
    async (tempId, normalizedReceiver, text, files) => {
      try {
        const saved = await messageApi.sendMessage(normalizedReceiver, text, files);
        setConversations((prev) => ({
          ...prev,
          [normalizedReceiver]: (prev[normalizedReceiver] || []).map((m) =>
            m._id === tempId ? saved : m
          ),
        }));
        upsertChatListWithMessage(saved);
        console.log("✅ Message sent:", saved._id);
        return true;
      } catch (err) {
        console.error("❌ Send failed:", err);
        return false;
      }
    },
    [upsertChatListWithMessage]
  );

  // --- AUTO-RETRY when connection is restored ---
  useEffect(() => {
    if (!connected || isRetryingRef.current) return;
    const queue = retryQueueRef.current;
    if (queue.length === 0) return;

    console.log(
      `🔄 Connection restored. Retrying ${queue.length} queued message(s)...`
    );
    isRetryingRef.current = true;

    const processQueue = async () => {
      const toRetry = [...queue];
      retryQueueRef.current = []; // Clear so new failures go back cleanly

      for (const item of toRetry) {
        const { tempId, receiverId, text, files } = item;

        // Show "sending" spinner again
        setConversations((prev) => ({
          ...prev,
          [receiverId]: (prev[receiverId] || []).map((m) =>
            m._id === tempId ? { ...m, status: "sending" } : m
          ),
        }));

        const success = await _doSend(tempId, receiverId, text, files);

        if (!success) {
          // Put back to failed and re-queue
          setConversations((prev) => ({
            ...prev,
            [receiverId]: (prev[receiverId] || []).map((m) =>
              m._id === tempId ? { ...m, status: "failed" } : m
            ),
          }));
          retryQueueRef.current.push(item);
        }
      }

      isRetryingRef.current = false;
      if (retryQueueRef.current.length > 0) {
        console.warn(
          `⚠️ ${retryQueueRef.current.length} message(s) still failed after retry.`
        );
      }
    };

    processQueue();
  }, [connected, _doSend]);

  // --- SEND MESSAGE (with offline queuing) ---
  const sendMessage = useCallback(
    async (receiverId, text, files = []) => {
      if (!currentUserId) return;
      const normalizedReceiver = toId(receiverId);
      const tempId = `tmp-${Date.now()}`;
      const tempMsg = {
        _id: tempId,
        senderId: currentUserId,
        receiverId: normalizedReceiver,
        text,
        status: "sending",
        createdAt: new Date().toISOString(),
      };
      setConversations((prev) => ({
        ...prev,
        [normalizedReceiver]: [
          ...(prev[normalizedReceiver] || []),
          tempMsg,
        ],
      }));

      const success = await _doSend(tempId, normalizedReceiver, text, files);

      if (!success) {
        // Mark failed in UI
        setConversations((prev) => ({
          ...prev,
          [normalizedReceiver]: (prev[normalizedReceiver] || []).map((m) =>
            m._id === tempId ? { ...m, status: "failed" } : m
          ),
        }));
        // Queue for auto-retry when net comes back
        retryQueueRef.current.push({
          tempId,
          receiverId: normalizedReceiver,
          text,
          files,
        });
        console.log(
          `📤 Message queued for retry (queue: ${retryQueueRef.current.length})`
        );
      }
    },
    [currentUserId, _doSend]
  );

  // --- MANUAL RETRY (tap on failed bubble) ---
  const retryMessage = useCallback(
    ({ tempId, receiverId, text, files = [] }) => {
      const normalizedReceiver = toId(receiverId);

      // Avoid duplicate in queue
      retryQueueRef.current = retryQueueRef.current.filter(
        (q) => q.tempId !== tempId
      );

      setConversations((prev) => ({
        ...prev,
        [normalizedReceiver]: (prev[normalizedReceiver] || []).map((m) =>
          m._id === tempId ? { ...m, status: "sending" } : m
        ),
      }));

      _doSend(tempId, normalizedReceiver, text, files).then((success) => {
        if (!success) {
          setConversations((prev) => ({
            ...prev,
            [normalizedReceiver]: (prev[normalizedReceiver] || []).map((m) =>
              m._id === tempId ? { ...m, status: "failed" } : m
            ),
          }));
          retryQueueRef.current.push({
            tempId,
            receiverId: normalizedReceiver,
            text,
            files,
          });
        }
      });
    },
    [_doSend]
  );

  // --- SEARCH MESSAGES ---
  const searchMessages = useCallback(async (query) => {
    if (!query || !query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const data = await messageApi.searchMessages(query.trim());
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ searchMessages error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const selectChat = useCallback(
    (targetUser) => {
      if (!targetUser) {
        setSelectedChat(null);
        return;
      }
      const id = toId(targetUser);
      setSelectedChat(
        targetUser._id
          ? targetUser
          : { _id: id, name: targetUser.name || "User" }
      );
      if (!conversations[id] || conversations[id].length === 0)
        loadMessages(id);
      setChatList((prev) =>
        prev.map((c) =>
          toId(c.user?._id || c.user?.id) === id
            ? { ...c, unreadCount: 0 }
            : c
        )
      );
    },
    [conversations, loadMessages]
  );

  useEffect(() => {
    loadChatList();
  }, [loadChatList]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <MessageContext.Provider
      value={{
        chatList,
        conversations,
        selectedChat,
        loading,
        typingUsers,
        searchResults,
        isSearching,
        loadChatList,
        loadMessages,
        sendMessage,
        retryMessage,
        searchMessages,
        selectChat,
        getMessages: (id) => conversations[toId(id)] || [],
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};
