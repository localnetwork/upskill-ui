"use client";

import { instructorNavLinks } from "@/lib/menu/instructorDashboardLinks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function InstructorSidebar({ collapsed, onToggle }) {
  const pathname = usePathname();

  return (
    <aside
      className={[
        "h-full min-h-0 border-r border-zinc-200 bg-white",
        "transition-[width] duration-200 ease-in-out",
        "max-w-full",
      ].join(" ")}
    >
      <nav className="sticky top-[100px] max-h-[calc(100dvh-100px)] overflow-y-auto overflow-x-hidden px-2 py-4 sm:px-3 sm:py-5">
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
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
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
                  {/* ACTIVE INDICATOR */}
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

                  {/* NAVIGATION ICON */}
                  <span
                    className={[
                      "flex shrink-0 items-center justify-center",
                      "[&>svg]:h-5 [&>svg]:w-5",
                      isActive
                        ? "text-blue-600"
                        : "text-zinc-500 group-hover:text-zinc-700",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>

                  {/* NAVIGATION LABEL */}
                  {!collapsed && (
                    <span className="min-w-0 break-words text-xs font-semibold leading-snug sm:text-sm">
                      {item.name}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* SIDEBAR FOOTER */}
        {!collapsed && (
          <div className="mt-6 border-t border-zinc-100 px-2 pt-4">
            <p className="text-xs leading-relaxed text-zinc-400">
              Quick access to your instructor tools and settings.
            </p>
          </div>
        )}
      </nav>
    </aside>
  );
}
