import persistentStore from "@/lib/store/persistentStore";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import UserNotifications from "./UserNotifications";
import { logout } from "@/lib/services/auth";
import UserAvatar from "./UserAvatar";
import { filteredLinks } from "@/lib/services/filteredLinks";
import userNavLinks from "@/lib/menu/userNavLinks";
export default function UserNav() {
  const profile = persistentStore((state) => state.profile);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  const filteredMenu = filteredLinks(userNavLinks, profile?.roles);

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
        <UserAvatar />
      </div>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-6 w-[250px] bg-white rounded shadow-lg z-50 max-h-[calc(90vh-120px)] overflow-y-auto">
          <Link
            href={`/user/${profile?.username}`}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 justify-between py-2 hover:bg-[#f5f5f5] px-3 rounded cursor-pointer border-b border-[#f5f5f5]"
          >
            <div className="flex items-center gap-2">
              <UserAvatar />
              <div className="flex flex-col">
                {profile?.firstname || profile?.lastname ? (
                  <span className="font-semibold">
                    {profile?.firstname} {profile?.lastname}
                  </span>
                ) : (
                  <span className="font-semibold">?</span>
                )}

                <span className="text-[12px] text-gray-600 truncate max-w-[150px]">
                  {profile.email.trim().length > 15
                    ? profile.email.trim().slice(0, 15) + "…"
                    : profile.email.trim()}
                </span>
              </div>
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
          </Link>

          <div className="px-3 py-2">
            {filteredMenu.map((link) => (
              <Link
                key={link.name}
                href={link?.link || "#"}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="block px-3 py-2 rounded hover:bg-[#f5f5f5] text-[#333]"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* <UserNotifications /> */}

          <div className="border-t border-[#ddd]">
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="cursor-pointer flex items-center px-3 py-5 border-[#f5f5f5] hover:bg-[#f5f5f5] w-full text-left"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-[20px] h-[20px] mr-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
                />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
