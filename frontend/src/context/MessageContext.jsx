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
import { useSocket } from "./SocketContext"; // or correct hook path

export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { socket, connected } = useSocket();

  // conversations map: { otherUserId: [messages...] }
  const [conversations, setConversations] = useState({});
  // chatList array that ChatList.jsx expects: [{ user: {...}, latestMessage, unreadCount }]
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const mountedRef = useRef(true);

  // utility: ensure id is string
  const toId = (idOrObj) => {
    if (!idOrObj) return "";
    if (typeof idOrObj === "string") return idOrObj;
    if (idOrObj._id) return String(idOrObj._id);
    if (idOrObj.id) return String(idOrObj.id);
    return String(idOrObj);
  };

  /* -------------------------------------------------
     Reset state whenever the authenticated user changes
     This prevents new users from seeing old user's data
  --------------------------------------------------*/
  useEffect(() => {
    // clear all chat related state on user change (login/logout)
    setConversations({});
    setChatList([]);
    setSelectedChat(null);
    setTypingUsers({});
  }, [toId(user?._id || user?.id)]); // normalize dependency

  // Load chat list for current user
  const loadChatList = useCallback(async () => {
    if (!user || !toId(user._id)) {
      setChatList([]);
      return;
    }
    try {
      const data = await messageApi.getChatList(); // returns array as ChatList expects
      if (!mountedRef.current) return;
      setChatList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error loading chat list:", err);
      setChatList([]);
    }
  }, [user]);

  // Load messages for a specific chat (otherUserId)
  const loadMessages = useCallback(
    async (otherUserId) => {
      if (!user || !otherUserId) return;
      try {
        setLoading(true);
        const normalizedId = toId(otherUserId);
        const data = await messageApi.getMessages(normalizedId);
        if (!mountedRef.current) return;
        setConversations((prev) => ({ ...prev, [normalizedId]: Array.isArray(data) ? data : [] }));
      } catch (err) {
        console.error("❌ Error loading messages:", err);
        setConversations((prev) => ({ ...prev, [toId(otherUserId)]: [] }));
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  // Helper: push message into the correct conversation (prevent duplicates)
  const addMessageToConversation = useCallback((otherUserId, msg) => {
    const normalizedOther = toId(otherUserId);
    const normalizedMsgId = String(msg._id || msg.id || Math.random());

    setConversations((prev) => {
      const prevMsgs = prev[normalizedOther] || [];
      const exists = prevMsgs.some((m) => String(m._id || m.id) === normalizedMsgId);
      if (exists) return prev;
      return { ...prev, [normalizedOther]: [...prevMsgs, msg] };
    });
  }, []);

  // Helper: update chatList with latest message (move to top)
  const upsertChatListWithMessage = useCallback((msg, byCurrentUser) => {
    if (!msg) return;
    // Determine the "other" user in the chat
    const senderId = toId(msg.senderId);
    const receiverId = toId(msg.receiverId);
    // other user is the one that's not the current user
    const otherUserId = String(user && String(user._id) === senderId ? receiverId : senderId);

    setChatList((prev) => {
      // create entry shape expected by ChatList.jsx: { user: { _id, name, avatar }, latestMessage, unreadCount }
      const existingIndex = prev.findIndex((c) => String(c.user?._id) === otherUserId);
      const newEntry = {
        user: msg.senderId && typeof msg.senderId === "object" ? msg.senderId : { _id: otherUserId },
        latestMessage: msg,
        // increment unreadCount only if receiver is the logged in user and they are not viewing the chat
        unreadCount:
          existingIndex >= 0
            ? prev[existingIndex].unreadCount + (user && String(msg.receiverId) === String(user._id) && String(selectedChat?._id) !== otherUserId ? 1 : 0)
            : (user && String(msg.receiverId) === String(user._id) && String(selectedChat?._id) !== otherUserId ? 1 : 0),
      };

      // remove old entry if exists
      const filtered = prev.filter((c) => String(c.user?._id) !== otherUserId);
      // put new entry at top
      return [newEntry, ...filtered];
    });
  }, [user, selectedChat]);

  /* -------------------------------------------
     Socket listeners: new message, status, typing
     Register when socket/user/connected changes,
     cleanup previous handlers to avoid leaks.
  --------------------------------------------*/
  useEffect(() => {
    if (!socket || !connected || !user) return;

    const normalizedUserId = toId(user._id);

    const handleNewMessage = (msg) => {
      try {
        // normalize message fields for safe comparison
        const senderId = toId(msg.senderId);
        const receiverId = toId(msg.receiverId);

        // If this message doesn't belong to current user (neither sender nor receiver) ignore
        if (senderId !== normalizedUserId && receiverId !== normalizedUserId) {
          return;
        }

        // Determine the other user id (the counterparty)
        const otherUserId = senderId === normalizedUserId ? receiverId : senderId;

        // Prevent duplicate: check in conversations
        setConversations((prev) => {
          const prevMsgs = prev[otherUserId] || [];
          const exists = prevMsgs.some((m) => String(m._id || m.id) === String(msg._id || msg.id));
          if (exists) return prev;
          const newPrev = { ...prev, [otherUserId]: [...prevMsgs, msg] };

          return newPrev;
        });

        // Update / upsert chat list with latest message
        upsertChatListWithMessage(msg, senderId === normalizedUserId);

      } catch (err) {
        console.error("❌ handleNewMessage error:", err);
      }
    };

    const handleMessageStatus = ({ messageId, status, message }) => {
      // Update statuses across conversations where that message exists
      setConversations((prev) => {
        const updated = {};
        Object.keys(prev).forEach((chatId) => {
          updated[chatId] = prev[chatId].map((m) =>
            String(m._id || m.id) === String(messageId) ? { ...m, status } : m
          );
        });
        return updated;
      });

      // Also update latestMessage in chatList if it matches
      setChatList((prev) =>
        prev.map((c) => {
          if (String(c.latestMessage?._id || c.latestMessage?.id) === String(messageId)) {
            return { ...c, latestMessage: { ...c.latestMessage, status } };
          }
          return c;
        })
      );
    };

    const handleUserTyping = ({ from, isTyping }) => {
      setTypingUsers((prev) => ({ ...prev, [toId(from)]: Boolean(isTyping) }));
      if (isTyping) {
        setTimeout(() => {
          setTypingUsers((prev) => ({ ...prev, [toId(from)]: false }));
        }, 3000);
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:status", handleMessageStatus);
    socket.on("user:typing", handleUserTyping);

    // cleanup
    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:status", handleMessageStatus);
      socket.off("user:typing", handleUserTyping);
    };
  }, [socket, connected, user, upsertChatListWithMessage]);

  // remove mountedRef on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* -----------------------------------------
     Send message: call API and optimistic update
  ------------------------------------------*/
  const sendMessage = useCallback(
    async (receiverId, text, files = []) => {
      if (!user) return { success: false, error: "Not authenticated" };
      const normalizedReceiver = toId(receiverId);
      try {
        // optimistic: create a temporary message object with queued status
        const tempMsg = {
          _id: `tmp-${Date.now()}`,
          senderId: toId(user._id),
          receiverId: normalizedReceiver,
          text: text || "",
          media: files.map((f) => ({ url: f.preview || "", type: f.type || "document", filename: f.name || "file" })),
          status: "queued",
          createdAt: new Date().toISOString(),
        };

        addMessageToConversation(normalizedReceiver, tempMsg);
        upsertChatListWithMessage(tempMsg, true);

        // call API
        const saved = await messageApi.sendMessage(normalizedReceiver, text, files);
        // Replace queued message with saved message in conversation
        setConversations((prev) => {
          const prevMsgs = prev[normalizedReceiver] || [];
          const replaced = prevMsgs.map((m) => (String(m._id).startsWith("tmp-") ? saved : m));
          return { ...prev, [normalizedReceiver]: replaced };
        });

        // Update chatList latestMessage
        upsertChatListWithMessage(saved, true);

        return { success: true, message: saved };
      } catch (err) {
        console.error("❌ sendMessage error:", err);
        // mark last queued message as failed
        setConversations((prev) => {
          const prevMsgs = prev[normalizedReceiver] || [];
          const idx = prevMsgs.findIndex((m) => String(m._id).startsWith("tmp-"));
          if (idx >= 0) {
            prevMsgs[idx] = { ...prevMsgs[idx], status: "failed" };
          }
          return { ...prev, [normalizedReceiver]: prevMsgs };
        });
        return { success: false, error: err?.response?.data || err.message };
      }
    },
    [user, addMessageToConversation, upsertChatListWithMessage]
  );

  /* -----------------------------------------
     Mark a message as read
  ------------------------------------------*/
  const markAsRead = useCallback(async (messageId) => {
    try {
      await messageApi.markAsRead(messageId);
      setConversations((prev) => {
        const updated = {};
        Object.keys(prev).forEach((chatId) => {
          updated[chatId] = prev[chatId].map((m) =>
            String(m._id || m.id) === String(messageId) ? { ...m, read: true, status: "read" } : m
          );
        });
        return updated;
      });
      setChatList((prev) =>
        prev.map((c) =>
          String(c.latestMessage?._id || c.latestMessage?.id) === String(messageId)
            ? { ...c, latestMessage: { ...c.latestMessage, read: true, status: "read" } }
            : c
        )
      );
    } catch (err) {
      console.error("❌ markAsRead error:", err);
    }
  }, []);

  /* -----------------------------------------
     Select chat helper
  ------------------------------------------*/
  const selectChat = useCallback(
    (targetUser) => {
      if (!targetUser) {
        setSelectedChat(null);
        return;
      }
      const normalizedId = toId(targetUser._id || targetUser.id || targetUser);
      setSelectedChat({ ...targetUser, _id: normalizedId });
      loadMessages(normalizedId);
      // When selecting a chat, clear unread for that chat in chatList
      setChatList((prev) => prev.map((c) => (String(c.user?._id) === normalizedId ? { ...c, unreadCount: 0 } : c)));
    },
    [loadMessages]
  );

  // Public getters
  const getMessages = useCallback((otherUserId) => {
    return conversations[toId(otherUserId)] || [];
  }, [conversations]);

  // Expose minimal API
  const value = {
    chatList,
    conversations,
    selectedChat,
    loading,
    typingUsers,
    loadChatList,
    loadMessages,
    sendMessage,
    getMessages,
    selectChat,
    markAsRead,
  };

  // Load chat list automatically when user changes
  useEffect(() => {
    loadChatList();
  }, [user, loadChatList]);

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
};
