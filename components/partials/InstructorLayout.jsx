"use client";

import { useEffect, useMemo, useState } from "react";
import InstructorSidebar from "../entities/instructor/InstructorSidebar";

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
