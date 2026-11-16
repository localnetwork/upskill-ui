"use client";

import { useEffect, useState } from "react";
import InstructorSidebar, {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
} from "../entities/instructor/InstructorSidebar";
import persistentStore from "@/lib/store/persistentStore";
import { parseCookies } from "nookies";
import { useRouter } from "next/router";
import BaseApi from "@/lib/api/_base.api";
import { getAuthTokenFromCookieMap } from "@/lib/services/authToken";

const STORAGE_KEY = "instructor_sidebar_pinned";

export default function InstructorLayout({ children }) {
  const [pinned, setPinned] = useState(false);
  const [canAccess, setCanAccess] = useState(false);
  const [accessResolved, setAccessResolved] = useState(false);
  const profile = persistentStore((state) => state.profile);
  const router = useRouter();

  useEffect(() => {
    try {
      setPinned(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {}
  }, []);

  const togglePinned = () => {
    setPinned((prev) => {
      try {
        localStorage.setItem(STORAGE_KEY, String(!prev));
      } catch {}
      return !prev;
    });
  };

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
        const meRes = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
        );
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

  if (!accessResolved || !canAccess) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <InstructorSidebar pinned={pinned} onToggle={togglePinned} />
      <main
        style={{
          marginLeft: pinned ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
        }}
        className="relative overflow-hidden transition-[margin] duration-200 p-6 sm:p-8 lg:p-[50px]"
      >
        {children}
      </main>
    </div>
  );
}
