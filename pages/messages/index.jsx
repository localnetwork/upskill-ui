"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BaseApi from "@/lib/api/_base.api";
import persistentStore from "@/lib/store/persistentStore";
import { io } from "socket.io-client";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import { getAuthTokenFromCookieMap } from "@/lib/services/authToken";
import {
  ChevronDown,
  ChevronRight,
  CircleEllipsis,
  CircleUserRound,
  EllipsisVertical,
  Flag,
  Image as ImageIcon,
  Info,
  Lock,
  MessageCircleMore,
  Mic,
  Pin,
  Search,
  SendHorizontal,
  Smile,
  Trash2,
  Video,
  X,
} from "lucide-react";

function formatName(user) {
  return (
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    user?.email ||
    "User"
  );
}

function formatTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch (_error) {
    return "";
  }
}

function formatTimeAgo(value) {
  if (!value) return "";
  const now = Date.now();
  const time = new Date(value).getTime();
  const diff = Math.max(0, now - time);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function getFileNameFromPath(path) {
  const raw = String(path || "");
  if (!raw) return "File";
  const clean = raw.split("?")[0];
  const parts = clean.split("/");
  return parts[parts.length - 1] || "File";
}

function groupMediaByMonth(items = []) {
  const grouped = {};
  for (const item of items) {
    const createdAt = item?.createdAt ? new Date(item.createdAt) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) continue;
    const monthKey = createdAt.toLocaleString(undefined, {
      year: "numeric",
      month: "long",
    });
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(item);
  }
  return grouped;
}

function renderMedia(mediaPath, mediaType) {
  if (!mediaPath) return null;
  if (mediaType === "VIDEO") {
    return (
      <video
        src={mediaPath}
        controls
        className="mt-2 max-h-[320px] w-full rounded-2xl border border-slate-200 bg-black"
      />
    );
  }
  return (
    <img
      src={mediaPath}
      alt="Chat attachment"
      className="mt-2 max-h-[420px] w-full rounded-2xl border border-slate-200 object-cover"
    />
  );
}

export default function MessagesPage() {
  const router = useRouter();
  const profile = persistentStore((state) => state.profile);
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const endRef = useRef(null);

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
  const [nicknameDraft, setNicknameDraft] = useState("");
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
  const activePeerLabel = nicknameDraft || formatName(activePeer);
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
    async (conversationId) => {
      if (!conversationId) return;
      try {
        setLoadingMessages(true);
        const response = await BaseApi.get(
          `${apiBase}/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
          { params: { page: 1, limit: 100 } },
        );
        const rows = Array.isArray(response?.data?.data)
          ? response.data.data
          : [];
        setMessages(rows);
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
    loadMessages(activeConversationId);
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    const timer = setTimeout(() => loadUserSearch(), 250);
    return () => clearTimeout(timer);
  }, [loadUserSearch]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length]);

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

  return (
    <div className="bg-[#f0f2f5] min-h-[calc(100vh-72px)] p-2 lg:p-3">
      <div className="grid h-[calc(100vh-96px)] grid-cols-1 gap-2 lg:grid-cols-[460px_1fr_400px]">
        <aside className="rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
              Chats
            </h1>
            <div className="flex items-center gap-2">
              <button className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 hover:bg-slate-200">
                <CircleEllipsis className="h-5 w-5 text-slate-700" />
              </button>
              <button className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 hover:bg-slate-200">
                <MessageCircleMore className="h-5 w-5 text-slate-700" />
              </button>
            </div>
          </div>

          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={conversationSearch}
                onChange={(event) => setConversationSearch(event.target.value)}
                placeholder="Search Messenger"
                className="w-full rounded-full bg-slate-100 py-2.5 pl-10 pr-3 text-base font-medium text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="px-4 pb-3 flex items-center gap-2 text-base font-semibold">
            <button className="rounded-full bg-blue-50 px-4 py-1.5 text-blue-700">
              All
            </button>
            <button className="rounded-full px-4 py-1.5 text-slate-700 hover:bg-slate-100">
              Unread
            </button>
            <button className="rounded-full px-4 py-1.5 text-slate-700 hover:bg-slate-100">
              Groups
            </button>
            <button className="rounded-full px-4 py-1.5 text-slate-700 hover:bg-slate-100">
              Communities
            </button>
          </div>

          <div className="px-4 pb-2">
            <input
              value={userSearch}
              onChange={(event) => {
                setUserSearch(event.target.value);
                setSelectedUserForConversation(null);
              }}
              placeholder="Search people to open room..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            {searchingUsers ? (
              <p className="mt-2 text-xs text-slate-500">Searching...</p>
            ) : userSearchRows.length > 0 ? (
              <div className="mt-2 max-h-36 space-y-1 overflow-y-auto">
                {userSearchRows.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setActiveConversationId("");
                      setMessages([]);
                      setSelectedUserForConversation(user);
                      setPreviewMessages([]);
                    }}
                    className={`w-full rounded-lg border px-2 py-2 text-left ${
                      selectedUserForConversation?.id === user.id
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-800">
                      {formatName(user)}
                    </p>
                    <p className="text-xs text-slate-500">@{user.username}</p>
                  </button>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() =>
                selectedUserForConversation?.id
                  ? createConversation(selectedUserForConversation.id)
                  : null
              }
              disabled={!selectedUserForConversation?.id}
              className="mt-2 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Start conversation (save to DB)
            </button>
          </div>

          <div className="h-[calc(100%-280px)] overflow-y-auto px-2 pb-2">
            {loadingConversations ? (
              <p className="px-2 py-3 text-sm text-slate-500">
                Loading conversations...
              </p>
            ) : conversations.length === 0 ? (
              <p className="px-2 py-3 text-sm text-slate-500">
                No conversations yet.
              </p>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => {
                    setSelectedUserForConversation(null);
                    setPreviewRoomId("");
                    setPreviewMessages([]);
                    setActiveConversationId(conversation.id);
                  }}
                  className={`w-full rounded-xl px-2 py-2 text-left ${
                    activeConversationId === conversation.id
                      ? "bg-slate-100"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <CircleUserRound className="h-14 w-14 text-slate-400" />
                      <span
                        className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                          conversation.otherParticipants?.some(
                            (item) => presenceMap[item.id],
                          )
                            ? "bg-emerald-500"
                            : "bg-slate-300"
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="line-clamp-1 text-lg font-semibold text-slate-900">
                          {conversation.title || "Conversation"}
                        </p>
                        <p className="text-[13px] text-slate-500">
                          {formatTimeAgo(conversation.lastMessageAt)}
                        </p>
                      </div>
                      <p className="line-clamp-1 text-sm text-slate-600">
                        {conversation.lastMessage?.deletedForEveryone
                          ? "Message deleted"
                          : conversation.lastMessage?.body ||
                            (conversation.lastMessage?.mediaPath
                              ? "[Attachment]"
                              : "No messages yet")}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
          {!activeConversationId && !isPreviewMode ? (
            <div className="m-auto text-center px-5">
              <p className="text-lg font-semibold text-slate-700">
                Select or start a conversation
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CircleUserRound className="h-11 w-11 text-slate-400" />
                  <div>
                    <p className="text-xl font-semibold leading-tight text-slate-900">
                      {activeConversationTitle}
                    </p>
                    <p className="text-sm text-slate-500">
                      {activePeerOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                <button className="grid h-9 w-9 place-items-center rounded-full text-[#a21caf] hover:bg-fuchsia-50">
                  <Info className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-white px-4 py-5">
                {loadingMessages && !isPreviewMode ? (
                  <p className="text-sm text-slate-500">Loading messages...</p>
                ) : chatMessages.length === 0 ? (
                  <p className="text-sm text-slate-500">No messages yet.</p>
                ) : (
                  chatMessages.map((message) => {
                    const mine = message.senderId === profile?.id;
                    const deletedByMe =
                      message.deletedForEveryoneById === profile?.id ||
                      (message.deletedForEveryone &&
                        message.senderId === profile?.id);
                    const canDeleteForEveryone =
                      mine &&
                      !message.deletedForEveryone &&
                      Number(message.seenByCount || 0) === 0;

                    return (
                      <div
                        key={message.id}
                        className={`group mb-3 flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div className="relative flex items-start gap-2 max-w-[75%]">
                          {!mine ? (
                            <CircleUserRound className="mt-1 h-8 w-8 text-slate-400" />
                          ) : null}

                          <div
                            className={`rounded-3xl px-4 py-2 ${
                              message.deletedForEveryone
                                ? "bg-slate-100 text-slate-700"
                                : mine
                                  ? themeClass
                                  : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {message.deletedForEveryone ? (
                              <p className="text-sm font-medium text-slate-700">
                                {deletedByMe
                                  ? "You deleted a message"
                                  : `${formatName(message.sender)} deleted a message`}
                              </p>
                            ) : (
                              <>
                                {message.body ? (
                                  <p className="whitespace-pre-wrap text-sm">
                                    {message.body}
                                  </p>
                                ) : null}
                                {renderMedia(
                                  message.mediaPath,
                                  message.mediaType,
                                )}
                              </>
                            )}

                            <div
                              className={`mt-1 flex items-center gap-2 text-[11px] ${
                                message.deletedForEveryone
                                  ? "text-slate-500"
                                  : mine
                                    ? "text-fuchsia-100"
                                    : "text-slate-500"
                              }`}
                            >
                              <span>{formatTime(message.createdAt)}</span>
                              {mine && !message.deletedForEveryone ? (
                                <span>
                                  {Number(message.seenByCount || 0) > 0
                                    ? "Seen"
                                    : "Sent"}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {!isPreviewMode &&
                          !String(message.id).startsWith("tmp-") ? (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setActionMenuMessageId((previous) =>
                                    previous === message.id ? "" : message.id,
                                  )
                                }
                                className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-slate-500 hover:bg-slate-100 transition"
                              >
                                <EllipsisVertical className="h-4 w-4" />
                              </button>
                              {actionMenuMessageId === message.id ? (
                                <div className="absolute right-0 top-7 z-20 w-44 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActionMenuMessageId("");
                                      setRemoveDialogMessage(message);
                                    }}
                                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Remove
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleTogglePin(message.id);
                                      setActionMenuMessageId("");
                                    }}
                                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    <Pin className="h-3.5 w-3.5" />
                                    {pinnedMessageIds.includes(message.id)
                                      ? "Unpin"
                                      : "Pin"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActionMenuMessageId("")}
                                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    <Flag className="h-3.5 w-3.5" />
                                    Report
                                  </button>
                                </div>
                              ) : null}
                              {canDeleteForEveryone ? null : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              <div className="border-t border-slate-200 bg-white px-3 py-2">
                {attachment?.path ? (
                  <div className="mb-2 rounded-xl border border-slate-200 p-2">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-600">
                        Attachment ready
                      </p>
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="text-xs font-bold text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    {attachment.mediaType === "VIDEO" ? (
                      <video
                        src={attachment.path}
                        controls
                        className="max-h-44 w-full rounded border border-slate-200 bg-black"
                      />
                    ) : (
                      <img
                        src={attachment.path}
                        alt="attachment"
                        className="max-h-44 w-full rounded border border-slate-200 object-cover"
                      />
                    )}
                  </div>
                ) : null}

                <div className="flex items-end gap-2 rounded-full bg-slate-100 px-2 py-2">
                  <button className="p-1 text-blue-600 hover:bg-blue-50 rounded-full">
                    <Mic className="h-5 w-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(event) =>
                      uploadAttachment(event.target.files?.[0] || null)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded-full"
                    disabled={uploading}
                  >
                    {uploading ? (
                      "..."
                    ) : (
                      <span className="flex items-center gap-1">
                        <ImageIcon className="h-5 w-5" />
                        <Video className="h-5 w-5" />
                      </span>
                    )}
                  </button>
                  <button className="p-1 text-blue-600 hover:bg-blue-50 rounded-full">
                    <MessageCircleMore className="h-5 w-5" />
                  </button>
                  <div className="px-2">
                    <input
                      value={composerText}
                      onChange={(event) => setComposerText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={`Aa ${defaultEmoji}`}
                      className="w-full min-w-[180px] bg-transparent px-1 py-1 text-base text-slate-800 outline-none"
                    />
                  </div>
                  <button className="p-1 text-blue-600 hover:bg-blue-50 rounded-full">
                    <Smile className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-60"
                    disabled={
                      sending ||
                      (!composerText.trim() && !attachment?.path) ||
                      (!activeConversationId && !isPreviewMode)
                    }
                  >
                    <SendHorizontal className="h-5 w-5" />
                  </button>
                  <button className="p-1 text-blue-600 hover:bg-blue-50 rounded-full">
                    <span className="text-base">{defaultEmoji}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </main>

        <aside className="rounded-xl bg-white shadow-sm p-5 hidden lg:block overflow-y-auto">
          <div className="flex flex-col items-center text-center">
            {chatPhotoUrl ? (
              <img
                src={chatPhotoUrl}
                alt="Chat"
                className="h-24 w-24 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <CircleUserRound className="h-24 w-24 text-slate-400" />
            )}
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {activeConversationTitle}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <Lock className="h-4 w-4" /> End-to-end encrypted
            </div>
            <button className="mt-5 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-700">
              <Search className="h-6 w-6" />
            </button>
            <p className="mt-1 text-sm text-slate-600">Search</p>
          </div>

          <div className="mt-8 space-y-4 text-lg font-semibold text-slate-900">
            <div className="border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() =>
                  setRightPanelExpanded((prev) => ({
                    ...prev,
                    info: !prev.info,
                  }))
                }
                className="flex w-full items-center justify-between text-left"
              >
                <span>Chat info</span>
                {rightPanelExpanded.info ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                )}
              </button>
              {rightPanelExpanded.info ? (
                <div className="mt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsPinnedPopupOpen(true)}
                    className="w-full rounded-md px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    View pinned messages
                  </button>
                </div>
              ) : null}
            </div>

            <div className="border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() =>
                  setRightPanelExpanded((prev) => ({
                    ...prev,
                    customize: !prev.customize,
                  }))
                }
                className="flex w-full items-center justify-between text-left"
              >
                <span>Customize chat</span>
                {rightPanelExpanded.customize ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                )}
              </button>
              {rightPanelExpanded.customize ? (
                <div className="mt-2 space-y-1">
                  {[
                    ["name", "Change chat name"],
                    ["photo", "Change photo (chat photo)"],
                    ["theme", "Change theme"],
                    ["emoji", "Change default emoji"],
                    ["nickname", "Edit nicknames"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCustomizeModal(key)}
                      className="w-full rounded-md px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() =>
                  setRightPanelExpanded((prev) => ({
                    ...prev,
                    mediaFiles: !prev.mediaFiles,
                  }))
                }
                className="flex w-full items-center justify-between text-left"
              >
                <span>Media & files</span>
                {rightPanelExpanded.mediaFiles ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                )}
              </button>
              {rightPanelExpanded.mediaFiles ? (
                <div className="mt-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsMediaPopupOpen(true)}
                    className="w-full rounded-md px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFilesPopupOpen(true)}
                    className="w-full rounded-md px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Files
                  </button>
                </div>
              ) : null}
            </div>

            <div className="border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() =>
                  setRightPanelExpanded((prev) => ({
                    ...prev,
                    privacy: !prev.privacy,
                  }))
                }
                className="flex w-full items-center justify-between text-left"
              >
                <span>Privacy & support</span>
                {rightPanelExpanded.privacy ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                )}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {isPinnedPopupOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Pinned messages
              </h3>
              <button
                type="button"
                onClick={() => setIsPinnedPopupOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {pinnedMessages.length ? (
                pinnedMessages.map((item) => (
                  <div key={item.id} className="rounded-md bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      {formatName(item.sender)} ·{" "}
                      {formatChatTime(item.createdAt)}
                    </p>
                    <p className="mt-1 text-sm text-slate-800">
                      {item.deletedForEveryone
                        ? "Deleted message"
                        : item.body || "Attachment"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No pinned messages yet.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isMediaPopupOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Media</h3>
              <button
                type="button"
                onClick={() => setIsMediaPopupOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[65vh] space-y-4 overflow-y-auto">
              {Object.keys(mediaByMonth).length ? (
                Object.entries(mediaByMonth).map(([month, items]) => (
                  <div key={month}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {month}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="overflow-hidden rounded-md border border-slate-200"
                        >
                          {renderMedia(item.mediaPath, item.mediaType)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No media yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isFilesPopupOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Files</h3>
              <button
                type="button"
                onClick={() => setIsFilesPopupOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[65vh] space-y-2 overflow-y-auto">
              {fileMessages.length ? (
                fileMessages.map((item) => (
                  <a
                    key={item.id}
                    href={item.mediaPath}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      {getFileNameFromPath(item.mediaPath)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatChatTime(item.createdAt)}
                    </p>
                  </a>
                ))
              ) : (
                <p className="text-sm text-slate-500">No files yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {customizeModal ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Customize chat
              </h3>
              <button
                type="button"
                onClick={() => setCustomizeModal(null)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {customizeModal === "name" ? (
              <>
                <input
                  value={chatNameOverride}
                  onChange={(event) => setChatNameOverride(event.target.value)}
                  placeholder="Chat name"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCustomizeModal(null)}
                  className="mt-3 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Save
                </button>
              </>
            ) : null}
            {customizeModal === "photo" ? (
              <>
                <input
                  value={chatPhotoUrl}
                  onChange={(event) => setChatPhotoUrl(event.target.value)}
                  placeholder="Chat photo URL"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCustomizeModal(null)}
                  className="mt-3 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Save
                </button>
              </>
            ) : null}
            {customizeModal === "theme" ? (
              <div className="space-y-2">
                {[
                  ["purple", "Purple"],
                  ["blue", "Blue"],
                  ["green", "Green"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setChatTheme(value);
                      setCustomizeModal(null);
                    }}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            {customizeModal === "emoji" ? (
              <div className="grid grid-cols-6 gap-2">
                {["👍", "❤️", "🔥", "😂", "🎉", "👋"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setDefaultEmoji(emoji);
                      setCustomizeModal(null);
                    }}
                    className="rounded-md border border-slate-200 py-2 text-lg hover:bg-slate-50"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}
            {customizeModal === "nickname" ? (
              <>
                <input
                  value={nicknameDraft}
                  onChange={(event) => setNicknameDraft(event.target.value)}
                  placeholder={`Nickname for ${formatName(activePeer)}`}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Nickname is local for this view.
                </p>
                <button
                  type="button"
                  onClick={() => setCustomizeModal(null)}
                  className="mt-3 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Save
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {removeDialogMessage ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Remove message
              </h3>
              <button
                type="button"
                onClick={() => setRemoveDialogMessage(null)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Choose how to remove this message.
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const target = removeDialogMessage;
                  setRemoveDialogMessage(null);
                  handleDeleteMessage(target, "FOR_ME");
                }}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Remove for you
              </button>
              {removeDialogMessage?.senderId === profile?.id &&
              !removeDialogMessage?.deletedForEveryone &&
              Number(removeDialogMessage?.seenByCount || 0) === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const target = removeDialogMessage;
                    setRemoveDialogMessage(null);
                    handleDeleteMessage(target, "FOR_EVERYONE");
                  }}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Remove for everyone
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
