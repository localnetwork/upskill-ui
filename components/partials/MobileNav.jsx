import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  ChevronRight,
  Compass,
  GraduationCap,
  LogIn,
  LogOut,
  Presentation,
  User,
  UserPlus,
  X,
} from "lucide-react";
import persistentStore from "@/lib/store/persistentStore";
import { logout } from "@/lib/services/auth";
import HeaderSearchAutocomplete from "./HeaderSearchAutocomplete";
import MobileExploreMenu from "./MobileExploreMenu";

export default function MobileNav({ open, onClose }) {
  const profile = persistentStore((state) => state.profile);
  const router = useRouter();
  const [exploreOpen, setExploreOpen] = useState(false);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close the drawer whenever the route changes
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.asPath]);

  // Close the drawer when the viewport grows past the mobile breakpoint
  useEffect(() => {
    if (!open) return;
    const mql = window.matchMedia("(min-width: 768px)");
    const handler = (e) => {
      if (e.matches) onClose();
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [open, onClose]);

  // Derived display values from the profile schema
  // (user_picture.path, firstname, lastname, username, email)
  const avatarPath = profile?.user_picture?.path;
  const avatarSrc = avatarPath
    ? avatarPath.startsWith("http://") || avatarPath.startsWith("https://")
      ? avatarPath
      : `${process.env.NEXT_PUBLIC_API_DOMAIN}${avatarPath}`
    : null;
  const initials =
    [profile?.firstname?.[0] ?? "", profile?.lastname?.[0] ?? ""]
      .join("")
      .toUpperCase() || "?";
  const displayName =
    profile?.firstname || profile?.lastname
      ? `${profile?.firstname || ""} ${profile?.lastname || ""}`.trim()
      : profile?.username || "Member";

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel */}
      <div
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        inert={!open}
        className={`fixed inset-y-0 right-0 z-[80] w-[320px] max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out motion-reduce:transition-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* HEADER: logo + close */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <Image
            src="/new-logo.png"
            alt="Upskill"
            width={120}
            height={40}
            className="w-auto h-8"
          />
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="p-1 hover:text-primary transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* SEARCH */}
        <div className="px-4 py-3">
          <HeaderSearchAutocomplete className="w-full" />
        </div>

        {/* NAV LINKS (scrollable) */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {/* Explore row */}
          <button
            onClick={() => setExploreOpen(true)}
            aria-expanded={exploreOpen}
            aria-controls="mobile-explore"
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <Compass size={20} className="text-slate-500" /> Explore
            </span>
            <ChevronRight size={18} className="text-slate-400" />
          </button>

          {/* Courses link */}
          <Link
            href="/courses"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-slate-700"
          >
            <GraduationCap size={20} className="text-slate-500" /> Courses
          </Link>

          {/* Become an Instructor - logged out only */}
          {!profile && (
            <Link
              href="/register?mode=instructor"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-slate-700"
            >
              <Presentation size={20} className="text-slate-500" /> Become an
              Instructor
            </Link>
          )}
        </nav>

        {/* FOOTER - auth section */}
        <div className="border-t border-gray-100 px-4 py-4">
          {!profile ? (
            <div className="space-y-2">
              <Link
                href="/login"
                onClick={onClose}
                className="flex items-center justify-center bg-slate-100 gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-slate-700"
              >
                <LogIn size={20} className="text-slate-500" /> Login
              </Link>
              <Link
                href="/register?mode=student"
                onClick={onClose}
                className="flex items-center justify-center gap-2 bg-[#0056D2] text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-slate-800 transition-all"
              >
                <UserPlus size={18} /> Register
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-4 py-3">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span className="w-10 h-10 rounded-full bg-[#3588FC] text-white text-sm font-semibold flex items-center justify-center select-none shrink-0">
                    {initials}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {profile.email}
                  </p>
                </div>
              </div>
              <Link
                href={`/user/${profile.username}`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-slate-700"
              >
                <User size={20} className="text-slate-500" /> My Profile
              </Link>
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-red-600 cursor-pointer w-full text-left"
              >
                <LogOut size={20} /> Logout
              </button>
            </div>
          )}
        </div>

        {/* Explore overlay sub-panel */}
        <MobileExploreMenu
          open={exploreOpen}
          onClose={() => setExploreOpen(false)}
          onNavigate={() => {
            setExploreOpen(false);
            onClose();
          }}
        />
      </div>
    </>
  );
}
