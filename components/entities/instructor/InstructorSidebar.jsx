"use client";

import { instructorNavLinks } from "@/lib/menu/instructorDashboardLinks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function InstructorSidebar({ collapsed, onToggle }) {
  const pathname = usePathname();

  return (
    <aside className="h-full bg-white border-r border-zinc-200">
      <nav className="sticky top-[100px] px-3 py-5">
        <div className="flex items-center justify-between px-2 mb-4">
          {!collapsed && (
            <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              Instructor
            </p>
          )}

          <button
            type="button"
            onClick={onToggle}
            className="ml-auto inline-flex items-center justify-center w-9 h-9 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        <ul className="space-y-1">
          {instructorNavLinks.map((item) => {
            const isActive =
              pathname === item.link || pathname.startsWith(item.link + "/");

            return (
              <li key={item.name}>
                <Link
                  href={item.link}
                  title={collapsed ? item.name : undefined} // tooltip on collapsed
                  className={[
                    "group flex items-center rounded-xl transition-colors duration-150",
                    collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-3",
                    "hover:bg-zinc-50",
                    isActive
                      ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100"
                      : "text-zinc-700",
                  ].join(" ")}
                >
                  {!collapsed && (
                    <span
                      className={[
                        "h-6 w-1 rounded-full transition-colors",
                        isActive
                          ? "bg-blue-600"
                          : "bg-transparent group-hover:bg-zinc-200",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  )}

                  <span
                    className={[
                      "shrink-0",
                      isActive
                        ? "text-blue-600"
                        : "text-zinc-500 group-hover:text-zinc-700",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <span className="text-sm font-semibold leading-none">
                      {item.name}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {!collapsed && (
          <div className="mt-6 px-2">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Quick access to your instructor tools and settings.
            </p>
          </div>
        )}
      </nav>
    </aside>
  );
}
