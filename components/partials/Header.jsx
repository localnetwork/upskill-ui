import Link from "next/link";
import Logo from "../icons/Logo";
// import Cart from "../icons/Cart";
import { useRef, useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import persistentStore from "@/lib/store/persistentStore";
import globalStore from "@/lib/store/globalStore";
import UserNav from "../entities/user/UserNav";
import UserResendNotif from "../entities/user/UserResendNotif";
import UserNotifications from "../entities/user/UserNotifications";
import Image from "next/image";
import {
  Bell,
  ChevronDown,
  Search,
  ShoppingCart,
} from "lucide-react";
import ExploreDropdown from "../dropdowns/ExploreDropdown";
import BaseApi from "@/lib/api/_base.api";
import { io } from "socket.io-client";
import { parseCookies } from "nookies";
import { getAuthTokenFromCookieMap } from "@/lib/services/authToken";

const UserCartCount = dynamic(() => import("../entities/user/UserCartCount"), {
  ssr: false,
});

const CartDrawer = dynamic(() => import("../entities/cart/CartDrawer"), {
  ssr: false,
});

export default function Header() {
  const profile = persistentStore((state) => state.profile);
  const roleList = Array.isArray(profile?.roles) ? profile.roles : [];
  const isLearner = roleList.includes("LEARNER");
  const cartDrawerOpen = globalStore((state) => state.cartDrawerOpen);
  const setCartDrawerOpen = (val) =>
    globalStore.setState({ cartDrawerOpen: val });

  const drawerRef = useRef(null);
  const notificationRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const socketRef = useRef(null);

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
      const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
      setNotifications(rows);
      setUnreadCount(rows.filter((item) => !item.readAt).length);
    } catch (_error) {}
  }, [profile]);

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

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [profile?.id, refreshNotifications]);

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

  const handleNotificationClick = async (notification) => {
    if (!notification?.id) return;
    if (!notification?.readAt) {
      try {
        await BaseApi.post(
          `${process.env.NEXT_PUBLIC_API_URL}/notifications/${notification.id}/read`,
        );
      } catch (_error) {}
    }
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
                  src="/logo.png"
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
              <div className="hidden md:flex relative w-48 lg:w-64">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg"
                  size={15}
                />
                <input
                  className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Search..."
                  type="text"
                />
              </div>

              {profile && (
                <div className="relative" ref={notificationRef}>
                  <button
                    type="button"
                    className="relative cursor-pointer"
                    onClick={() => setIsNotificationOpen((prev) => !prev)}
                  >
                    <Bell />
                    {unreadCount > 0 ? (
                      <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    ) : null}
                  </button>
                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-4 w-[330px] bg-white rounded shadow-lg z-50 p-3 max-h-[420px] overflow-y-auto">
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
                  <div>
                    <Link
                      href="/register?mode=instructor"
                      className="text-sm font-bold text-slate-700 px-4 py-2 hover:bg-gray-100 rounded-lg"
                    >
                      Become an Instructor
                    </Link>
                  </div>
                )}
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                {!profile ? (
                  <nav>
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
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
