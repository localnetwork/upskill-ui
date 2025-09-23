import persistentStore from "@/lib/store/persistentStore";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import UserNotifications from "./UserNotifications";
import { logout } from "@/lib/services/auth";
export default function UserNav() {
  const profile = persistentStore((state) => state.profile);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  const initials = [profile?.firstname?.[0] ?? "", profile?.lastname?.[0] ?? ""]
    .join("")
    .toUpperCase();

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="rounded-full text-white border-[#e5e7eb] hover:border-[#ddd] border-[5px] select-none overflow-hidden w-[50px] h-[48px] bg-[#3588FC] flex items-center justify-center text-lg font-semibold cursor-pointer"
        onClick={() => setIsDropdownOpen((prev) => !prev)}
      >
        <span>{initials || "?"}</span>
      </div>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-6 w-[250px] p-[15px] bg-white rounded shadow-lg z-50 max-h-[calc(90vh-120px)] overflow-y-auto">
          <div className="flex items-center gap-2 justify-between py-2 hover:bg-[#f5f5f5] px-3 rounded cursor-pointer border-b border-[#f5f5f5]">
            <div className="flex items-center gap-2">
              <span className="rounded-full text-white border-[#e5e7eb] border-[5px] select-none overflow-hidden w-[50px] h-[48px] bg-[#3588FC] flex items-center justify-center text-lg font-semibold">
                {initials || "?"}
              </span>
              My Profile
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>

          <UserNotifications />

          <div className="border-t border-[#f5f5f5] pt-3 flex items-center justify-between text-[#666]">
            <Link
              className="text-[12px] hover:underline"
              href="/settings/profile"
            >
              Settings
            </Link>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="text-[12px] hover:underline float-right"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
