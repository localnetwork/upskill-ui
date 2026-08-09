import Link from "next/link";
import Logo from "../icons/Logo";
// import Cart from "../icons/Cart";
import { useRef, useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import persistentStore from "@/lib/store/persistentStore";
import globalStore from "@/lib/store/globalStore";
import UserNav from "../entities/user/UserNav";
import UserResendNotif from "../entities/user/UserResendNotif";
import UserNotifications from "../entities/user/UserNotifications";
import Image from "next/image";
import {
  Bell,
  ChevronDown,
  Menu,
  MessageCircle,
  Phone,
  PhoneOff,
  ShoppingCart,
} from "lucide-react";
import ExploreDropdown from "../dropdowns/ExploreDropdown";
import BaseApi from "@/lib/api/_base.api";
import { io } from "socket.io-client";
import { parseCookies } from "nookies";
import { getAuthTokenFromCookieMap } from "@/lib/services/authToken";
import HeaderSearchAutocomplete from "./HeaderSearchAutocomplete";
import MobileNav from "./MobileNav";

const UserCartCount = dynamic(() => import("../entities/user/UserCartCount"), {
  ssr: false,
});

const CartDrawer = dynamic(() => import("../entities/cart/CartDrawer"), {
  ssr: false,
});

export default function Header() {
  const router = useRouter();
  const profile = persistentStore((state) => state.profile);
  const roleList = Array.isArray(profile?.roles) ? profile.roles : [];
  const isLearner = roleList.includes("LEARNER");
  const cartDrawerOpen = globalStore((state) => state.cartDrawerOpen);
  const setCartDrawerOpen = (val) =>
    globalStore.setState({ cartDrawerOpen: val });

  const drawerRef = useRef(null);
  const notificationRef = useRef(null);
  const chatRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const burgerRef = useRef(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const socketRef = useRef(null);
  const hideGlobalCallOverlay = String(router.pathname || "").startsWith(
    "/messages",
  );

  const buildVideoCallUrl = useCallback(
    (
      conversationId,
      roomId,
      callId,
      hasVideo = true,
      initializeVideo = true,
      isE2eeMandated = true,
    ) => {
      const convId = String(conversationId || "").trim();
      const room = String(roomId || "").trim();
      const id = String(callId || "").trim();
      if (!convId || !room || !id || typeof window === "undefined") return "";
      const base = window.location.origin;
      const params = new URLSearchParams({
        conversationId: convId,
        call_id: id,
        has_video: hasVideo ? "true" : "false",
        initialize_video: initializeVideo ? "true" : "false",
        is_e2ee_mandated: isE2eeMandated ? "true" : "false",
      });
      return `${base}/messages/call/${encodeURIComponent(room)}?${params.toString()}`;
    },
    [],
  );

  const acceptIncomingCall = useCallback(() => {
    const url = String(incomingCall?.callUrl || "").trim();
    if (!url || typeof window === "undefined") return;
    window.open(url, "_blank", "noopener,noreferrer");
    setIncomingCall(null);
  }, [incomingCall?.callUrl]);

  const rejectIncomingCall = useCallback(() => {
    if (socketRef.current && incomingCall?.conversationId) {
      socketRef.current.emit(
        "chat:call:end",
        {
          conversationId: incomingCall.conversationId,
          roomId: incomingCall.roomId,
          callId: incomingCall.callId,
        },
        () => {},
      );
    }
    setIncomingCall(null);
  }, [incomingCall]);

  const refreshNotifications = useCallback(async () => {
    if (!profile) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications?limit=8&page=1`,
      );
      const rows = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      setNotifications(rows);
      setUnreadCount(rows.filter((item) => !item.readAt).length);
    } catch (_error) {}
  }, [profile]);

  const refreshChatUnread = useCallback(async () => {
    if (!profile) {
      setChatUnreadCount(0);
      return;
    }

    try {
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/unread-count`,
      );
      setChatUnreadCount(Number(response?.data?.data?.totalUnread || 0));
    } catch (_error) {}
  }, [profile]);

  const refreshRecentMessages = useCallback(async () => {
    if (!profile) {
      setRecentMessages([]);
      return;
    }
    try {
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations`,
        { params: { page: 1, limit: 5 } },
      );
      const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
      setRecentMessages(rows);
    } catch (_error) {}
  }, [profile]);

  const playChatNotificationSound = useCallback(() => {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.0001;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
    oscillator.stop(context.currentTime + 0.2);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        !e.composedPath().some((el) => el.classList?.contains("cart-drawer"))
      ) {
        setCartDrawerOpen(false);
      }
    }

    if (cartDrawerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [cartDrawerOpen]);

  useEffect(() => {
    refreshNotifications();
    refreshChatUnread();
    refreshRecentMessages();
    if (!profile?.id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const cookies = parseCookies();
    const token = getAuthTokenFromCookieMap(cookies);
    if (!token) return;

    const socketBaseUrl = String(process.env.NEXT_PUBLIC_API_URL || "").replace(
      /\/api\/?$/,
      "",
    );

    const socket = io(socketBaseUrl, {
      transports: ["websocket"],
      auth: { token },
    });

    socketRef.current = socket;
    socket.on("notification:new", () => {
      refreshNotifications();
    });
    socket.on("chat:new", (payload) => {
      if (payload?.message?.senderId !== profile?.id) {
        playChatNotificationSound();
      }
      refreshChatUnread();
      refreshRecentMessages();
    });
    socket.on("chat:call:incoming", (payload) => {
      const conversationId = String(payload?.conversationId || "").trim();
      if (!conversationId) return;
      const roomId =
        String(payload?.roomId || "").trim() || `ROOM:${conversationId}`;
      const callId =
        String(payload?.callId || "").trim() ||
        String(Math.floor(Date.now() / 1000));
      const hasVideo = Boolean(payload?.hasVideo ?? true);
      const initializeVideo = Boolean(payload?.initializeVideo ?? hasVideo);
      const isE2eeMandated = Boolean(payload?.isE2eeMandated ?? true);
      const fallbackName = payload?.fromUser?.username || "User";
      const callerName =
        [payload?.fromUser?.firstName, payload?.fromUser?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || fallbackName;
      const rawCallerPhotoPath = String(
        payload?.fromUser?.photoPath ||
          payload?.fromUser?.user_picture?.path ||
          "",
      ).trim();
      const callerPhotoPath = rawCallerPhotoPath
        ? rawCallerPhotoPath.startsWith("http://") ||
          rawCallerPhotoPath.startsWith("https://")
          ? rawCallerPhotoPath
          : `${process.env.NEXT_PUBLIC_API_DOMAIN || ""}${rawCallerPhotoPath}`
        : "";
      const callUrl = buildVideoCallUrl(
        conversationId,
        roomId,
        callId,
        hasVideo,
        initializeVideo,
        isE2eeMandated,
      );

      setIncomingCall({
        conversationId,
        roomId,
        callId,
        callUrl,
        callerName,
        callerPhotoPath,
      });
    });

    socket.on("chat:call:ended-notice", (payload) => {
      const conversationId = String(payload?.conversationId || "").trim();
      const callId = String(payload?.callId || "").trim();
      setIncomingCall((previous) => {
        if (!previous) return previous;
        if (
          conversationId &&
          String(previous.conversationId || "") !== conversationId
        ) {
          return previous;
        }
        if (callId && String(previous.callId || "") !== callId) return previous;
        return null;
      });
    });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [playChatNotificationSound, profile?.id, refreshChatUnread, refreshNotifications, refreshRecentMessages]);

  useEffect(() => {
    if (!profile?.id) return;
    const timer = setInterval(() => {
      refreshChatUnread();
      refreshRecentMessages();
    }, 30000);
    return () => clearInterval(timer);
  }, [profile?.id, refreshChatUnread, refreshRecentMessages]);

  useEffect(() => {
    if (!isNotificationOpen) return;
    const handleClickOutside = (e) => {
      if (!notificationRef.current?.contains(e.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen]);

  useEffect(() => {
    if (!isChatOpen) return;
    const handleClickOutside = (e) => {
      if (!chatRef.current?.contains(e.target)) {
        setIsChatOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isChatOpen]);

  // Close mobile nav when Escape is pressed
  useEffect(() => {
    if (!isMobileNavOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileNavOpen]);

  // Restore focus to the burger button after the mobile nav closes
  useEffect(() => {
    if (!isMobileNavOpen && burgerRef.current) {
      burgerRef.current.focus();
    }
  }, [isMobileNavOpen]);

  const handleNotificationClick = async (notification) => {
    if (!notification?.id) return;
    if (!notification?.readAt) {
      try {
        await BaseApi.post(
          `${process.env.NEXT_PUBLIC_API_URL}/notifications/${notification.id}/read`,
        );
      } catch (_error) {}
    }
    setIsNotificationOpen(false);
    refreshNotifications();
  };

  return (
    <>
      {profile && profile.verified === 0 && <UserResendNotif />}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center text-2xl font-bold">
              <Link className="max-w-[180px] mr-5 inline-flex h-auto" href="/">
                {/* <Logo /> */}
                <Image
                  src="/new-logo.png"
                  alt="Upskill Logo"
                  width={150}
                  height={50}
                  className="w-auto min-w-[150px]"
                />
              </Link>

              <div className="mt-1">
                <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
                  <div className="relative group">
                    <div className="flex items-center gap-1 hover:text-primary transition-colors">
                      Explore <ChevronDown size={16} />
                    </div>

                    <ExploreDropdown />
                  </div>
                  <Link
                    className="hover:text-primary transition-colors"
                    href="/courses"
                  >
                    Courses
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex font-light items-center space-x-6 w-full justify-end">
              <div className="hidden md:flex">
                <HeaderSearchAutocomplete />
              </div>

              {profile && (
                <div className="relative" ref={chatRef}>
                  <button
                    type="button"
                    className="relative cursor-pointer"
                    onClick={() => {
                      setIsNotificationOpen(false);
                      setIsChatOpen((previous) => {
                        const next = !previous;
                        if (next) refreshRecentMessages();
                        return next;
                      });
                    }}
                  >
                    <MessageCircle />
                    {chatUnreadCount > 0 ? (
                      <span className="absolute border-[2px] border-white -top-2 -right-2 w-[20px] h-[20px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                      </span>
                    ) : null}
                  </button>
                  {isChatOpen && (
                    <div className="absolute border border-[#f3f3f3] right-0 mt-4 w-[330px] bg-white rounded-lg shadow-[0rem_0.125rem_1rem_rgba(0,0,0,0.15)] z-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                        Recent messages
                      </p>
                      <div className="max-h-[320px] overflow-y-auto space-y-2">
                        {recentMessages.length === 0 ? (
                          <p className="text-sm text-slate-500">No recent messages.</p>
                        ) : (
                          recentMessages.map((conversation) => (
                            <Link
                              key={conversation.id}
                              href={`/messages/t/${encodeURIComponent(conversation.id)}`}
                              onClick={() => setIsChatOpen(false)}
                              className="block rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="line-clamp-1 text-sm font-semibold text-slate-800">
                                  {conversation.title || "Conversation"}
                                </p>
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${
                                    (conversation.otherParticipants || []).some(
                                      (item) => item.isOnline,
                                    )
                                      ? "bg-emerald-500"
                                      : "bg-slate-300"
                                  }`}
                                />
                                {Number(conversation.unreadCount || 0) > 0 ? (
                                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                    {conversation.unreadCount}
                                  </span>
                                ) : null}
                              </div>
                              <p className="line-clamp-1 text-xs text-slate-500">
                                {conversation.lastMessage?.deletedForEveryone
                                  ? "Message deleted"
                                  : conversation.lastMessage?.body ||
                                  (conversation.lastMessage?.mediaPath
                                    ? "[Attachment]"
                                    : "No messages yet")}
                              </p>
                            </Link>
                          ))
                        )}
                      </div>
                      <div className="mt-3 border-t border-slate-100 pt-2 text-right">
                        <Link
                          href="/messages"
                          onClick={() => setIsChatOpen(false)}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          See All Messages
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {profile && (
                <div className="relative" ref={notificationRef}>
                  <button
                    type="button"
                    className="relative cursor-pointer"
                    onClick={() => {
                      setIsChatOpen(false);
                      setIsNotificationOpen((prev) => !prev);
                    }}
                  >
                    <Bell />
                    {unreadCount > 0 ? (
                      <span className="absolute border-[2px] border-white -top-2 -right-2 w-[20px] h-[20px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    ) : null}
                  </button>
                  {isNotificationOpen && (
                    <div className="absolute border border-[#f3f3f3] right-0 mt-4 w-[330px] bg-white rounded-lg shadow-[0rem_0.125rem_1rem_rgba(0,0,0,0.15)] z-50 p-3 max-h-[420px] overflow-y-auto">
                      <UserNotifications
                        notifications={notifications}
                        unreadCount={unreadCount}
                        onNotificationClick={handleNotificationClick}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-4 relative">
                <span className="max-w-[30px] inline-flex h-auto relative">
                  {!profile ? (
                    <>
                      {/* <Cart /> */}
                      <ShoppingCart className="w-6 h-6 text-slate-600" />
                      <span className="absolute -mt-2 ml-3 text-[12px] font-bold bg-red-600 text-white rounded-full px-1">
                        0
                      </span>
                    </>
                  ) : (
                    <>{isLearner ? <UserCartCount /> : null}</>
                  )}
                </span>

                {/* Drawer */}
                {cartDrawerOpen && <CartDrawer />}
                {!profile && (
                  <div className="hidden md:block">
                    <Link
                      href="/register?mode=instructor"
                      className="text-sm font-bold text-slate-700 px-4 py-2 hover:bg-gray-100 rounded-lg"
                    >
                      Become an Instructor
                    </Link>
                  </div>
                )}
                <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                {!profile ? (
                  <nav className="hidden md:flex">
                    <ul className="flex space-x-4 items-center">
                      <li>
                        <Link
                          href="/login"
                          className="text-sm font-bold text-slate-700 px-4 py-2 hover:bg-gray-100 rounded-lg"
                        >
                          Login
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/register?mode=student"
                          className="bg-[#0056D2] text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-slate-800 transition-all"
                        >
                          Register
                        </Link>
                      </li>
                    </ul>
                  </nav>
                ) : (
                  <UserNav />
                )}
              </div>

              <button
                ref={burgerRef}
                type="button"
                onClick={() => setIsMobileNavOpen(true)}
                aria-label="Open menu"
                aria-expanded={isMobileNavOpen}
                aria-controls="mobile-nav"
                className="md:hidden p-1 -mr-1 text-slate-700 hover:text-primary transition-colors cursor-pointer"
              >
                <Menu size={26} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileNav
        open={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {!hideGlobalCallOverlay && incomingCall?.callUrl ? (
        <div className="fixed inset-0 z-[95] overflow-hidden">
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl"
            style={
              incomingCall.callerPhotoPath
                ? { backgroundImage: `url("${incomingCall.callerPhotoPath}")` }
                : undefined
            }
          />
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative flex h-full flex-col items-center justify-between px-6 py-14 text-white">
            <div />
            <div className="text-center">
              {incomingCall.callerPhotoPath ? (
                <img
                  src={incomingCall.callerPhotoPath}
                  alt={incomingCall.callerName || "Caller"}
                  className="mx-auto h-28 w-28 rounded-full border-2 border-white/40 object-cover shadow-2xl"
                />
              ) : (
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 text-3xl font-semibold">
                  {(incomingCall.callerName || "C").slice(0, 1).toUpperCase()}
                </div>
              )}
              <p className="mt-5 text-4xl font-semibold drop-shadow-md">
                {incomingCall.callerName}
              </p>
              <p className="mt-1 text-lg text-slate-200">Incoming video call</p>
            </div>
            <div className="flex items-start justify-center gap-12">
              <button
                type="button"
                onClick={rejectIncomingCall}
                className="flex flex-col items-center gap-2"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-white/20 backdrop-blur">
                  <PhoneOff className="h-7 w-7 text-white" />
                </span>
                <span className="text-base font-medium text-slate-100">Reject</span>
              </button>
              <button
                type="button"
                onClick={acceptIncomingCall}
                className="flex flex-col items-center gap-2"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500 shadow-[0_8px_30px_rgba(16,185,129,0.5)]">
                  <Phone className="h-7 w-7 text-white" />
                </span>
                <span className="text-base font-medium text-slate-100">Accept</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
