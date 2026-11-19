"use client";

import { useState } from "react";
import { instructorNavLinks } from "@/lib/menu/instructorDashboardLinks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const SIDEBAR_COLLAPSED_WIDTH = 88;
export const SIDEBAR_EXPANDED_WIDTH = 280;

// Fixed sidebar. `pinned` keeps it open; otherwise it expands on hover and hides when the pointer leaves.
export default function InstructorSidebar({ pinned, onToggle, onHoverChange }) {
  const pathname = usePathname();
  const [hovered, setHoveredState] = useState(false);
  const setHovered = (value) => {
    setHoveredState(value);
    onHoverChange?.(value);
  };
  const expanded = pinned || hovered;
  const collapsed = !expanded;

  return (
    <>
    <nav className="sticky top-0 z-40 flex gap-1 overflow-x-auto border-b border-zinc-200 bg-white px-2 py-2 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {instructorNavLinks.map((item) => {
        const isActive =
          pathname === item.link || pathname.startsWith(`${item.link}/`);
        return (
          <Link
            key={item.name}
            href={item.link}
            aria-current={isActive ? "page" : undefined}
            className={[
              "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold",
              isActive
                ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100"
                : "text-zinc-700 hover:bg-zinc-50",
            ].join(" ")}
          >
            <span className="[&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
              {item.icon}
            </span>
            {item.name}
          </Link>
        );
      })}
    </nav>
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: expanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
      }}
      className={[
        "fixed left-0 top-[100px] z-40 hidden md:block h-[calc(100dvh-100px)] border-r border-zinc-200 bg-white",
        "transition-[width,box-shadow] duration-200 ease-in-out",
        hovered && !pinned ? "shadow-xl" : "",
      ].join(" ")}
    >
      <nav className="h-full overflow-y-auto overflow-x-hidden px-2 py-4 sm:px-3 sm:py-5">
        {/* SIDEBAR HEADER */}
        <div
          className={[
            "mb-4 flex min-h-9 items-center",
            collapsed ? "justify-center" : "justify-between gap-2 px-1 sm:px-2",
          ].join(" ")}
        >
          {!collapsed && (
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Instructor
            </p>
          )}

          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-label={pinned ? "Unpin sidebar" : "Pin sidebar open"}
            aria-pressed={pinned}
            title={pinned ? "Unpin sidebar" : "Pin sidebar open"}
          >
            {pinned ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <ul className="space-y-1">
          {instructorNavLinks.map((item) => {
            const isActive =
              pathname === item.link || pathname.startsWith(`${item.link}/`);

            return (
              <li key={item.name}>
                <Link
                  href={item.link}
                  title={collapsed ? item.name : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "group relative flex min-h-11 min-w-0 items-center rounded-xl",
                    "transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
                    collapsed
                      ? "justify-center px-2 py-3"
                      : "gap-2 px-2 py-3 sm:gap-3 sm:px-3",
                    isActive
                      ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100"
                      : "text-zinc-700 hover:bg-zinc-50",
                  ].join(" ")}
                >
                  {!collapsed && (
                    <span
                      className={[
                        "h-6 w-1 shrink-0 rounded-full transition-colors",
                        isActive
                          ? "bg-blue-600"
                          : "bg-transparent group-hover:bg-zinc-200",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  )}

                  <span
                    className={[
                      "flex shrink-0 items-center justify-center",
                      "[&>svg]:h-5 [&>svg]:w-5",
                      isActive
                        ? "text-primary"
                        : "text-zinc-500 group-hover:text-zinc-700",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <span className="min-w-0 whitespace-nowrap text-xs font-semibold leading-snug sm:text-sm">
                      {item.name}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {!collapsed && (
          <div className="mt-6 border-t border-zinc-100 px-2 pt-4">
            <p className="text-xs leading-relaxed text-zinc-400">
              Quick access to your instructor tools and settings.
            </p>
          </div>
        )}
      </nav>
    </aside>
    </>
  );
}
