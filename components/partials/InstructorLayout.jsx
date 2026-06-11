"use client";

import { useEffect, useMemo, useState } from "react";
import InstructorSidebar from "../entities/instructor/InstructorSidebar";
import persistentStore from "@/lib/store/persistentStore";
import { parseCookies } from "nookies";
import { useRouter } from "next/router";
import BaseApi from "@/lib/api/_base.api";
import { getAuthTokenFromCookieMap } from "@/lib/services/authToken";

const STORAGE_KEY = "instructor_sidebar_collapsed";

// Small hook to detect breakpoints without extra libs
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);

    // set initial
    setMatches(media.matches);

    // subscribe
    if (media.addEventListener) media.addEventListener("change", onChange);
    else media.addListener(onChange);

    return () => {
      if (media.removeEventListener)
        media.removeEventListener("change", onChange);
      else media.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

export default function InstructorLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [canAccess, setCanAccess] = useState(false);
  const [accessResolved, setAccessResolved] = useState(false);
  const profile = persistentStore((state) => state.profile);
  const router = useRouter();

  // Breakpoints (adjust if you want)
  const isSm = useMediaQuery("(max-width: 639px)"); // <640
  const isMd = useMediaQuery("(min-width: 640px) and (max-width: 1023px)"); // 640-1023
  const isLgUp = useMediaQuery("(min-width: 1024px)"); // >=1024

  // Load persisted collapse state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) setCollapsed(saved === "true");
    } catch {}
  }, []);

  useEffect(() => {
    let mounted = true;
    const verifyAccess = async () => {
      const cookies = parseCookies();
      const token = getAuthTokenFromCookieMap(cookies);
      if (!token) {
        router.replace("/login");
        if (mounted) {
          setCanAccess(false);
          setAccessResolved(true);
        }
        return;
      }

      const currentRoles = Array.isArray(profile?.roles) ? profile.roles : [];
      const hasEducatorRole = currentRoles.includes("EDUCATOR");
      if (hasEducatorRole) {
        if (mounted) {
          setCanAccess(true);
          setAccessResolved(true);
        }
        return;
      }

      try {
        const meRes = await BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`);
        const me = meRes?.data?.data;
        const meRoles = Array.isArray(me?.roles) ? me.roles : [];
        persistentStore.setState({
          profile: {
            ...(profile || {}),
            ...(me || {}),
            roles: meRoles,
          },
        });

        if (mounted) {
          setCanAccess(meRoles.includes("EDUCATOR"));
          setAccessResolved(true);
        }
        if (!meRoles.includes("EDUCATOR")) {
          router.replace("/register?mode=instructor");
        }
      } catch (_error) {
        if (mounted) {
          setCanAccess(false);
          setAccessResolved(true);
        }
        router.replace("/login");
      }
    };

    verifyAccess();
    return () => {
      mounted = false;
    };
  }, [profile, router]);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  };

  // Responsive widths
  const { expandedWidth, collapsedWidth } = useMemo(() => {
    // You can tweak these numbers to your taste
    if (isSm) return { expandedWidth: 240, collapsedWidth: 64 }; // small screens
    if (isMd) return { expandedWidth: 280, collapsedWidth: 72 }; // tablets
    if (isLgUp) return { expandedWidth: 325, collapsedWidth: 88 }; // desktop
    return { expandedWidth: 280, collapsedWidth: 72 };
  }, [isSm, isMd, isLgUp]);

  const sidebarWidth = collapsed ? collapsedWidth : expandedWidth;

  if (!accessResolved || !canAccess) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="!px-0">
        <div
          className="grid min-h-screen"
          style={{
            gridTemplateColumns: `${sidebarWidth}px 1fr`,
          }}
        >
          <InstructorSidebar collapsed={collapsed} onToggle={toggleSidebar} />

          <main className="p-6 sm:p-8 lg:p-[50px] relative overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
