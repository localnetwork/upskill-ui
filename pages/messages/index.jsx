"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import BaseApi from "@/lib/api/_base.api";
import persistentStore from "@/lib/store/persistentStore";
import { io } from "socket.io-client";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import { getAuthTokenFromCookieMap } from "@/lib/services/authToken";
import toast from "react-hot-toast";
import MessageOverlays from "@/components/chat/MessageOverlays";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMainPanel from "@/components/chat/ChatMainPanel";
import ChatRightPanel from "@/components/chat/ChatRightPanel";
import { formatName, groupMediaByMonth } from "@/components/chat/messageUtils";

export default function MessagesPage() {
  const router = useRouter();
  const profile = persistentStore((state) => state.profile);
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const endRef = useRef(null);
  const messageContainerRef = useRef(null);
  const sidebarListRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const topSentinelRef = useRef(null);
  const scrollAnchorRef = useRef({ prevHeight: 0, shouldRestore: false });
  const isNearBottomRef = useRef(true);

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userSearchRows, setUserSearchRows] = useState([]);
  const [selectedUserForConversation, setSelectedUserForConversation] =
    useState(null);
  const [previewRoomId, setPreviewRoomId] = useState("");
  const [previewMessages, setPreviewMessages] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [presenceMap, setPresenceMap] = useState({});
  const [actionMenuMessageId, setActionMenuMessageId] = useState("");
  const [removeDialogMessage, setRemoveDialogMessage] = useState(null);
  const [pinnedByScope, setPinnedByScope] = useState({});
  const [chatNameOverride, setChatNameOverride] = useState("");
  const [chatPhotoUrl, setChatPhotoUrl] = useState("");
  const [chatTheme, setChatTheme] = useState("purple");
  const [defaultEmoji, setDefaultEmoji] = useState("👍");
  const [mediaViewerIndex, setMediaViewerIndex] = useState(null);
  const [messagePage, setMessagePage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [messageSearchActive, setMessageSearchActive] = useState(false);
  const [messageSearchIndex, setMessageSearchIndex] = useState(0);
  const [rightPanelExpanded, setRightPanelExpanded] = useState({
    info: true,
    customize: false,
    mediaFiles: false,
    privacy: false,
  });
  const [isPinnedPopupOpen, setIsPinnedPopupOpen] = useState(false);
  const [isMediaPopupOpen, setIsMediaPopupOpen] = useState(false);
  const [isFilesPopupOpen, setIsFilesPopupOpen] = useState(false);
  const [customizeModal, setCustomizeModal] = useState(null);

  const activeConversation = useMemo(
    () =>
      conversations.find((item) => item.id === activeConversationId) || null,
    [activeConversationId, conversations],
  );

  const isPreviewMode =
    !activeConversationId && Boolean(selectedUserForConversation?.id);
  const chatMessages = isPreviewMode ? previewMessages : messages;
  const activePeer = useMemo(() => {
    if (isPreviewMode) return selectedUserForConversation;
    return activeConversation?.otherParticipants?.[0] || null;
  }, [
    activeConversation?.otherParticipants,
    isPreviewMode,
    selectedUserForConversation,
  ]);
  const activePeerLabel = activePeer?.nickname || formatName(activePeer);
  const activePeerOnline = activePeer?.id
    ? Boolean(presenceMap[activePeer.id])
    : false;
  const activeConversationTitle =
    chatNameOverride ||
    (isPreviewMode
      ? activePeerLabel
      : activeConversation?.title || "Conversation");
  const pinScopeKey = activeConversationId || previewRoomId || "draft";
  const pinnedMessageIds = pinnedByScope[pinScopeKey] || [];
  const themeClass =
    chatTheme === "blue"
      ? "bg-blue-600 text-white"
      : chatTheme === "green"
        ? "bg-emerald-600 text-white"
        : "bg-[#9333ea] text-white";
  const pinnedMessages = useMemo(
    () => chatMessages.filter((item) => pinnedMessageIds.includes(item.id)),
    [chatMessages, pinnedMessageIds],
  );
  const mediaMessages = useMemo(
    () =>
      chatMessages
        .filter(
          (item) =>
            item.mediaPath && ["IMAGE", "VIDEO"].includes(item.mediaType),
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [chatMessages],
  );
  const mediaByMonth = useMemo(
    () => groupMediaByMonth(mediaMessages),
    [mediaMessages],
  );
  const fileMessages = useMemo(
    () =>
      chatMessages
        .filter((item) => item.mediaPath)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [chatMessages],
  );
  const matchingMessageIds = useMemo(() => {
    if (!messageSearchQuery.trim()) return [];
    const q = messageSearchQuery.toLowerCase();
    return chatMessages
      .filter(
        (m) =>
          m.body &&
          m.body.toLowerCase().includes(q) &&
          m.messageType !== "SYSTEM",
      )
      .map((m) => m.id);
  }, [chatMessages, messageSearchQuery]);

  const loadConversations = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setLoadingConversations(true);
      const response = await BaseApi.get(`${apiBase}/chat/conversations`, {
        params: {
          q: conversationSearch || undefined,
          page: 1,
          limit: 40,
        },
      });
      const rows = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      setConversations(rows);

      const nextPresence = {};
      for (const row of rows) {
        for (const participant of row?.otherParticipants || []) {
          if (participant?.id) {
            nextPresence[participant.id] = Boolean(participant.isOnline);
          }
        }
      }
      setPresenceMap((previous) => ({ ...previous, ...nextPresence }));

      const requestedConversationId = String(
        router.query?.conversationId || "",
      ).trim();
      if (
        requestedConversationId &&
        rows.some((item) => item.id === requestedConversationId)
      ) {
        setActiveConversationId(requestedConversationId);
      } else if (!activeConversationId && rows[0]?.id) {
        setActiveConversationId(rows[0].id);
      } else if (
        activeConversationId &&
        !rows.some((conversation) => conversation.id === activeConversationId)
      ) {
        setActiveConversationId(rows[0]?.id || "");
      }
    } catch (_error) {
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  }, [
    activeConversationId,
    apiBase,
    conversationSearch,
    profile?.id,
    router.query?.conversationId,
  ]);

  const loadMessages = useCallback(
    async (conversationId, page = 1) => {
      if (!conversationId) return;
      try {
        setLoadingMessages(true);
        const response = await BaseApi.get(
          `${apiBase}/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
          { params: { page, limit: 10 } },
        );
        const rows = Array.isArray(response?.data?.data)
          ? response.data.data
          : [];
        const sortedRows = [...rows].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        const totalPages = response?.data?.meta?.totalPages || 1;
        if (page === 1) {
          setMessages(sortedRows);
          setMessagePage(1);
          setHasMoreMessages(1 < totalPages);
          setTimeout(() => {
            const container = messageContainerRef.current;
            if (container) {
              container.scrollTop = container.scrollHeight;
            }
          }, 50);
        } else {
          setMessages((previous) => [...sortedRows, ...previous]);
          setMessagePage(page);
          setHasMoreMessages(page < totalPages);
        }
        await BaseApi.post(
          `${apiBase}/chat/conversations/${encodeURIComponent(conversationId)}/read`,
        );
        loadConversations();
      } catch (_error) {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [apiBase, loadConversations],
  );

  const loadMoreMessages = useCallback(async () => {
    if (!activeConversationId || loadingMoreMessages || !hasMoreMessages)
      return;
    const nextPage = messagePage + 1;
    isLoadingMoreRef.current = true;
    setLoadingMoreMessages(true);
    try {
      const response = await BaseApi.get(
        `${apiBase}/chat/conversations/${encodeURIComponent(activeConversationId)}/messages`,
        { params: { page: nextPage, limit: 10 } },
      );
      const rows = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      const sortedRows = [...rows].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      const totalPages = response?.data?.meta?.totalPages || 1;
      if (sortedRows.length > 0) {
        const container = messageContainerRef.current;
        scrollAnchorRef.current.prevHeight = container?.scrollHeight || 0;
        scrollAnchorRef.current.shouldRestore = true;
        setMessages((prev) => [...sortedRows, ...prev]);
      }
      setMessagePage(nextPage);
      setHasMoreMessages(nextPage < totalPages);
    } catch (_error) {
      // silently fail
    } finally {
      isLoadingMoreRef.current = false;
      setLoadingMoreMessages(false);
    }
  }, [
    activeConversationId,
    loadingMoreMessages,
    hasMoreMessages,
    messagePage,
    apiBase,
  ]);

  const handleMessageContainerScroll = useCallback(() => {
    const container = messageContainerRef.current;
    if (!container) return;
    const threshold = 150;
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;
    isNearBottomRef.current = isAtBottom;
    setShowScrollToBottom(!isAtBottom && chatMessages.length > 0);
  }, [chatMessages.length]);

  const loadUserSearch = useCallback(async () => {
    const q = String(userSearch || "").trim();
    if (!q || q.length < 2) {
      setUserSearchRows([]);
      return;
    }
    try {
      setSearchingUsers(true);
      const response = await BaseApi.get(`${apiBase}/chat/users/search`, {
        params: { q, limit: 8 },
      });
      setUserSearchRows(
        Array.isArray(response?.data?.data) ? response.data.data : [],
      );
    } catch (_error) {
      setUserSearchRows([]);
    } finally {
      setSearchingUsers(false);
    }
  }, [apiBase, userSearch]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    setSelectedUserForConversation(null);
    setPreviewRoomId("");
    setPreviewMessages([]);
    setMediaViewerIndex(null);
    setMessagePage(1);
    setHasMoreMessages(true);
    setMessageSearchActive(false);
    setMessageSearchQuery("");
    setMessageSearchIndex(0);
    loadMessages(activeConversationId);
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    if (!activeConversationId || !sidebarListRef.current) return;
    const el = sidebarListRef.current.querySelector(
      `[data-conversation-id="${activeConversationId}"]`,
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (
      !conversationSearch.trim() ||
      !sidebarListRef.current ||
      conversations.length === 0
    )
      return;
    const firstEl = sidebarListRef.current.querySelector(
      `[data-conversation-id="${conversations[0].id}"]`,
    );
    if (firstEl) {
      firstEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [conversationSearch, conversations]);

  useEffect(() => {
    const timer = setTimeout(() => loadUserSearch(), 250);
    return () => clearTimeout(timer);
  }, [loadUserSearch]);

  useEffect(() => {
    if (isLoadingMoreRef.current) return;
    const container = messageContainerRef.current;
    if (!container) return;
    const threshold = 150; // px from bottom considered "at bottom"
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;

    if (isAtBottom) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
    isNearBottomRef.current = isAtBottom;
  }, [chatMessages.length]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          hasMoreMessages &&
          !loadingMoreMessages &&
          !loadingMessages
        ) {
          loadMoreMessages();
        }
      },
      { root: messageContainerRef.current, threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreMessages, loadingMoreMessages, loadingMessages, loadMoreMessages]);

  useLayoutEffect(() => {
    if (!scrollAnchorRef.current.shouldRestore) return;
    scrollAnchorRef.current.shouldRestore = false;
    const container = messageContainerRef.current;
    if (!container) return;
    const newHeight = container.scrollHeight;
    const prevHeight = scrollAnchorRef.current.prevHeight;
    if (prevHeight > 0 && newHeight > prevHeight) {
      container.scrollTop = newHeight - prevHeight;
    }
  }, [messages]);

  useEffect(() => {
    setChatPhotoUrl(activePeer?.photoPath || "");
  }, [activePeer?.photoPath]);

  useEffect(() => {
    if (
      !messageSearchActive ||
      !messageSearchQuery.trim() ||
      matchingMessageIds.length === 0
    )
      return;
    const targetId = matchingMessageIds[messageSearchIndex];
    if (!targetId || !messageContainerRef.current) return;
    requestAnimationFrame(() => {
      const container = messageContainerRef.current;
      if (!container) return;
      const el = container.querySelector(`[data-message-id="${targetId}"]`);
      if (!el) return;
      container.scrollTo({
        top: el.offsetTop - container.offsetHeight / 2 + el.offsetHeight / 2,
        behavior: "smooth",
      });
    });
  }, [
    messageSearchIndex,
    messageSearchActive,
    messageSearchQuery,
    matchingMessageIds,
  ]);

  useEffect(() => {
    if (!profile?.id) return;
    const cookies = parseCookies();
    const token = getAuthTokenFromCookieMap(cookies);
    if (!token) return;

    const socketBaseUrl = String(apiBase || "").replace(/\/api\/?$/, "");
    const socket = io(socketBaseUrl, {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => setIsSocketReady(true));
    socket.on("disconnect", () => setIsSocketReady(false));

    socket.on("chat:new", (payload) => {
      // Apply conversation settings (nickname changes) embedded in chat:new
      if (payload?.settings?.targetUserId) {
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id !== payload.conversationId) return conv;
            return {
              ...conv,
              participants: (conv.participants || []).map((p) =>
                String(p.userId) === String(payload.settings.targetUserId)
                  ? {
                      ...p,
                      nickname: payload.settings.nickname ?? p.nickname,
                    }
                  : p,
              ),
              otherParticipants: (conv.otherParticipants || []).map((o) =>
                String(o.id) === String(payload.settings.targetUserId)
                  ? {
                      ...o,
                      nickname: payload.settings.nickname ?? o.nickname,
                    }
                  : o,
              ),
            };
          }),
        );
      }

      if (payload?.seen?.userId && payload?.conversationId) {
        if (String(payload.seen.userId || "") !== String(profile?.id || "")) {
          const seenAt = payload.seen.seenAt
            ? new Date(payload.seen.seenAt)
            : new Date();
          if (payload.conversationId === activeConversationId) {
            setMessages((previous) =>
              previous.map((item) => {
                if (item.senderId !== profile?.id) return item;
                const createdAt = item.createdAt
                  ? new Date(item.createdAt)
                  : null;
                if (!createdAt || createdAt > seenAt) return item;
                return {
                  ...item,
                  seenByCount: Math.max(Number(item.seenByCount || 0), 1),
                };
              }),
            );
          }
        }
      }

      if (payload?.deleted?.messageId) {
        const deletedMessageId = String(payload.deleted.messageId || "");
        if (!deletedMessageId) return;
        setMessages((previous) =>
          previous.map((item) =>
            item.id === deletedMessageId
              ? {
                  ...item,
                  body: "",
                  mediaPath: null,
                  mediaType: null,
                  deletedForEveryone: true,
                  deletedForEveryoneById: payload?.deleted?.deletedById || null,
                  deletedForEveryoneAt:
                    payload?.deleted?.deletedAt || new Date().toISOString(),
                }
              : item,
          ),
        );
      }

      const incomingConversationId = payload?.conversationId;
      const incomingMessage = payload?.message;
      if (!incomingConversationId || !incomingMessage?.id) {
        loadConversations();
        return;
      }

      setConversations((previous) => {
        const exists = previous.some(
          (item) => item.id === incomingConversationId,
        );
        if (!exists) {
          loadConversations();
          return previous;
        }
        return previous.map((item) =>
          item.id === incomingConversationId
            ? {
                ...item,
                lastMessage: incomingMessage,
                lastMessageAt: incomingMessage.createdAt,
                unreadCount:
                  incomingMessage.senderId === profile.id
                    ? 0
                    : activeConversationId === incomingConversationId
                      ? 0
                      : Number(item.unreadCount || 0) + 1,
              }
            : item,
        );
      });

      if (
        incomingConversationId === activeConversationId &&
        String(incomingMessage.senderId || "") !== String(profile?.id || "")
      ) {
        setMessages((previous) => {
          if (previous.some((item) => item.id === incomingMessage.id))
            return previous;
          return [...previous, incomingMessage];
        });
        BaseApi.post(
          `${apiBase}/chat/conversations/${encodeURIComponent(incomingConversationId)}/read`,
        ).catch(() => {});
      }
    });

    socket.on("chat:preview:new", (payload) => {
      const roomId = String(payload?.roomId || "");
      const incomingMessage = payload?.message;
      if (!roomId || !incomingMessage?.id) return;
      if (!previewRoomId || roomId !== previewRoomId) return;
      setPreviewMessages((previous) => {
        if (previous.some((item) => item.id === incomingMessage.id))
          return previous;
        return [...previous, incomingMessage];
      });
    });

    socket.on("chat:presence", (payload) => {
      const userId = String(payload?.userId || "").trim();
      if (!userId) return;
      setPresenceMap((previous) => ({
        ...previous,
        [userId]: Boolean(payload?.isOnline),
      }));
    });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      setIsSocketReady(false);
    };
  }, [
    activeConversationId,
    apiBase,
    loadConversations,
    previewRoomId,
    profile?.id,
  ]);

  useEffect(() => {
    const peerId = String(selectedUserForConversation?.id || "").trim();
    if (!peerId || !socketRef.current || !isSocketReady) return;
    socketRef.current.emit(
      "chat:preview:join",
      { peerUserId: peerId },
      (ack) => {
        if (ack?.ok && ack?.roomId) setPreviewRoomId(ack.roomId);
      },
    );
    return () => {
      if (!socketRef.current) return;
      socketRef.current.emit("chat:preview:leave", { peerUserId: peerId });
    };
  }, [isSocketReady, selectedUserForConversation?.id]);

  const createConversation = async (participantId) => {
    if (!participantId) return;
    try {
      const response = await BaseApi.post(`${apiBase}/chat/conversations`, {
        participantId,
      });
      const conversationId = response?.data?.data?.conversationId;
      setUserSearch("");
      setUserSearchRows([]);
      setSelectedUserForConversation(null);
      setPreviewRoomId("");
      setPreviewMessages([]);
      await loadConversations();
      if (conversationId) setActiveConversationId(conversationId);
    } catch (_error) {}
  };

  const uploadAttachment = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploading(true);
      const response = await BaseApi.post(`${apiBase}/chat/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAttachment(response?.data?.data || null);
    } catch (_error) {
      setAttachment(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteMessage = async (message, mode) => {
    if (!message?.id || isPreviewMode) return;
    const targetId = String(message.id);
    const previousMessages = messages;

    if (mode === "FOR_ME") {
      setMessages((current) => current.filter((item) => item.id !== targetId));
    } else {
      setMessages((current) =>
        current.map((item) =>
          item.id === targetId
            ? {
                ...item,
                body: "",
                mediaPath: null,
                mediaType: null,
                deletedForEveryone: true,
                deletedForEveryoneById: profile?.id || null,
                deletedForEveryoneAt: new Date().toISOString(),
              }
            : item,
        ),
      );
    }

    try {
      await BaseApi.post(
        `${apiBase}/chat/messages/${encodeURIComponent(targetId)}/delete`,
        { mode },
      );
      await loadConversations();
    } catch (_error) {
      setMessages(previousMessages);
    }
  };

  const handleTogglePin = (messageId) => {
    if (!messageId) return;
    setPinnedByScope((previous) => {
      const current = previous[pinScopeKey] || [];
      const next = current.includes(messageId)
        ? current.filter((id) => id !== messageId)
        : [...current, messageId];
      return { ...previous, [pinScopeKey]: next };
    });
  };

  const handleSend = async () => {
    if ((!activeConversationId && !isPreviewMode) || sending) return;
    const body = composerText.trim();
    if (!body && !attachment?.path) return;

    const optimisticId = `tmp-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      conversationId: activeConversationId || null,
      senderId: profile?.id,
      body,
      mediaPath: attachment?.path || null,
      mediaType: attachment?.mediaType || null,
      createdAt: new Date().toISOString(),
      sender: {
        id: profile?.id,
        username: profile?.username || "",
        firstName: profile?.firstName || "",
        lastName: profile?.lastName || "",
      },
      seenByCount: 0,
      deletedForEveryone: false,
    };

    if (!isPreviewMode) {
      setMessages((previous) => [...previous, optimisticMessage]);
    }

    setComposerText("");
    const pendingAttachment = attachment;
    setAttachment(null);

    try {
      setSending(true);
      if (isPreviewMode) {
        if (!socketRef.current || !selectedUserForConversation?.id) {
          throw new Error("Preview room is not ready");
        }
        await new Promise((resolve, reject) => {
          socketRef.current.emit(
            "chat:preview:message",
            {
              peerUserId: selectedUserForConversation.id,
              body: body || undefined,
              mediaPath: pendingAttachment?.path || undefined,
              mediaType: pendingAttachment?.mediaType || undefined,
            },
            (ack) => {
              if (!ack?.ok) {
                reject(
                  new Error(ack?.message || "Failed to send preview message"),
                );
                return;
              }
              resolve(ack);
            },
          );
        });
      } else {
        const response = await BaseApi.post(`${apiBase}/chat/messages`, {
          conversationId: activeConversationId,
          body: body || undefined,
          mediaPath: pendingAttachment?.path || undefined,
          mediaType: pendingAttachment?.mediaType || undefined,
        });
        const saved = response?.data?.data;
        if (saved?.id) {
          setMessages((previous) =>
            previous.map((item) => (item.id === optimisticId ? saved : item)),
          );
        }
        loadConversations();
      }
    } catch (_error) {
      if (!isPreviewMode) {
        setMessages((previous) =>
          previous.filter((item) => item.id !== optimisticId),
        );
      }
      if (pendingAttachment) setAttachment(pendingAttachment);
    } finally {
      setSending(false);
    }
  };

  const updateConversationParticipant = (
    conversationId,
    targetUserId,
    patch,
  ) => {
    setConversations((previous) =>
      previous.map((conv) => {
        if (conv.id !== conversationId) return conv;
        return {
          ...conv,
          participants: (conv.participants || []).map((p) =>
            String(p.userId) === String(targetUserId) ? { ...p, ...patch } : p,
          ),
          otherParticipants: (conv.otherParticipants || []).map((o) =>
            String(o.id) === String(targetUserId) ? { ...o, ...patch } : o,
          ),
        };
      }),
    );
  };

  const getParticipant = (conversationId, targetUserId) => {
    const conv = conversations.find((item) => item.id === conversationId);
    return (
      conv?.participants?.find(
        (p) => String(p.userId) === String(targetUserId),
      ) || null
    );
  };

  const handleSaveNickname = async (targetUserId, newNickname) => {
    if (!activeConversationId || !targetUserId) return;
    const previous = getParticipant(activeConversationId, targetUserId);
    const previousNickname = previous?.nickname;
    updateConversationParticipant(activeConversationId, targetUserId, {
      nickname: newNickname,
    });
    try {
      await BaseApi.put(
        `${apiBase}/chat/conversations/${encodeURIComponent(activeConversationId)}/nicknames/${encodeURIComponent(targetUserId)}`,
        { nickname: newNickname },
      );
    } catch (_error) {
      updateConversationParticipant(activeConversationId, targetUserId, {
        nickname: previousNickname,
      });
      toast.error("Failed to save nickname");
    }
  };

  const handleBackgroundUpload = async (file) => {
    if (!file || !activeConversationId) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setBackgroundUploading(true);
      const response = await BaseApi.post(`${apiBase}/chat/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploaded = response?.data?.data;
      if (!uploaded?.id) throw new Error("Upload failed");
      setConversations((previous) =>
        previous.map((conv) =>
          conv.id === activeConversationId
            ? { ...conv, myBackgroundPath: uploaded.path }
            : conv,
        ),
      );
      await BaseApi.put(
        `${apiBase}/chat/conversations/${encodeURIComponent(activeConversationId)}/background`,
        { mediaId: uploaded.id },
      );
    } catch (_error) {
      toast.error("Failed to upload background");
    } finally {
      setBackgroundUploading(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!activeConversationId) return;
    setConversations((previous) =>
      previous.map((conv) =>
        conv.id === activeConversationId
          ? { ...conv, myBackgroundPath: "" }
          : conv,
      ),
    );
    try {
      await BaseApi.delete(
        `${apiBase}/chat/conversations/${encodeURIComponent(activeConversationId)}/background`,
      );
    } catch (_error) {
      toast.error("Failed to remove background");
    }
  };

  return (
    <div className="bg-[#f0f2f5] min-h-[calc(100vh-72px)] p-2 lg:p-3">
      <div className="grid h-[calc(100vh-96px)] grid-cols-1 gap-2 lg:grid-cols-[460px_1fr_400px]">
        <ChatSidebar
          conversationSearch={conversationSearch}
          setConversationSearch={setConversationSearch}
          conversations={conversations}
          setActiveConversationId={setActiveConversationId}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          setSelectedUserForConversation={setSelectedUserForConversation}
          searchingUsers={searchingUsers}
          userSearchRows={userSearchRows}
          selectedUserForConversation={selectedUserForConversation}
          setMessages={setMessages}
          setPreviewMessages={setPreviewMessages}
          createConversation={createConversation}
          loadingConversations={loadingConversations}
          sidebarListRef={sidebarListRef}
          activeConversationId={activeConversationId}
          setPreviewRoomId={setPreviewRoomId}
          presenceMap={presenceMap}
        />

        <ChatMainPanel
          activeConversationId={activeConversationId}
          isPreviewMode={isPreviewMode}
          activePeer={activePeer}
          activeConversation={activeConversation}
          activePeerLabel={activePeerLabel}
          handleSaveNickname={handleSaveNickname}
          activeConversationTitle={activeConversationTitle}
          activePeerOnline={activePeerOnline}
          messageContainerRef={messageContainerRef}
          topSentinelRef={topSentinelRef}
          endRef={endRef}
          handleMessageContainerScroll={handleMessageContainerScroll}
          loadingMessages={loadingMessages}
          chatMessages={chatMessages}
          profile={profile}
          matchingMessageIds={matchingMessageIds}
          messageSearchIndex={messageSearchIndex}
          messageSearchActive={messageSearchActive}
          themeClass={themeClass}
          mediaMessages={mediaMessages}
          setMediaViewerIndex={setMediaViewerIndex}
          actionMenuMessageId={actionMenuMessageId}
          setActionMenuMessageId={setActionMenuMessageId}
          setRemoveDialogMessage={setRemoveDialogMessage}
          handleTogglePin={handleTogglePin}
          pinnedMessageIds={pinnedMessageIds}
          loadingMoreMessages={loadingMoreMessages}
          showScrollToBottom={showScrollToBottom}
          setShowScrollToBottom={setShowScrollToBottom}
          attachment={attachment}
          setAttachment={setAttachment}
          fileInputRef={fileInputRef}
          uploadAttachment={uploadAttachment}
          uploading={uploading}
          composerText={composerText}
          setComposerText={setComposerText}
          handleSend={handleSend}
          defaultEmoji={defaultEmoji}
          sending={sending}
        />

        <ChatRightPanel
          chatPhotoUrl={chatPhotoUrl}
          activeConversationTitle={activeConversationTitle}
          messageSearchActive={messageSearchActive}
          setMessageSearchActive={setMessageSearchActive}
          setMessageSearchQuery={setMessageSearchQuery}
          setMessageSearchIndex={setMessageSearchIndex}
          messageSearchQuery={messageSearchQuery}
          matchingMessageIds={matchingMessageIds}
          messageSearchIndex={messageSearchIndex}
          rightPanelExpanded={rightPanelExpanded}
          setRightPanelExpanded={setRightPanelExpanded}
          setIsPinnedPopupOpen={setIsPinnedPopupOpen}
          setCustomizeModal={setCustomizeModal}
          setIsMediaPopupOpen={setIsMediaPopupOpen}
          setIsFilesPopupOpen={setIsFilesPopupOpen}
        />
      </div>

      <MessageOverlays
        isPinnedPopupOpen={isPinnedPopupOpen}
        setIsPinnedPopupOpen={setIsPinnedPopupOpen}
        pinnedMessages={pinnedMessages}
        isMediaPopupOpen={isMediaPopupOpen}
        setIsMediaPopupOpen={setIsMediaPopupOpen}
        mediaByMonth={mediaByMonth}
        mediaMessages={mediaMessages}
        setMediaViewerIndex={setMediaViewerIndex}
        isFilesPopupOpen={isFilesPopupOpen}
        setIsFilesPopupOpen={setIsFilesPopupOpen}
        fileMessages={fileMessages}
        customizeModal={customizeModal}
        setCustomizeModal={setCustomizeModal}
        chatNameOverride={chatNameOverride}
        setChatNameOverride={setChatNameOverride}
        setChatTheme={setChatTheme}
        setDefaultEmoji={setDefaultEmoji}
        activeConversation={activeConversation}
        profile={profile}
        handleSaveNickname={handleSaveNickname}
        activeConversationId={activeConversationId}
        isPreviewMode={isPreviewMode}
        handleBackgroundUpload={handleBackgroundUpload}
        backgroundUploading={backgroundUploading}
        handleRemoveBackground={handleRemoveBackground}
        removeDialogMessage={removeDialogMessage}
        setRemoveDialogMessage={setRemoveDialogMessage}
        handleDeleteMessage={handleDeleteMessage}
        mediaViewerIndex={mediaViewerIndex}
      />
    </div>
  );
}
