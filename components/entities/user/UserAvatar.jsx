import persistentStore from "@/lib/store/persistentStore";
import Image from "next/image";

export default function UserAvatar({ className, profile, size = "md" }) {
  const currentProfile = persistentStore((state) => state.profile);

  const initials =
    [profile?.firstname?.[0] ?? "", profile?.lastname?.[0] ?? ""]
      .join("")
      .toUpperCase() ||
    [currentProfile?.firstname?.[0] ?? "", currentProfile?.lastname?.[0] ?? ""]
      .join("")
      .toUpperCase();

  // size mapping
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
    xl: "w-20 h-20 text-2xl",
    xxl: "w-24 h-24 text-3xl",
  };

  const appliedSize =
    typeof size === "string"
      ? sizeClasses[size] || sizeClasses["md"]
      : `w-[${size}px] h-[${size}px] text-[${Math.floor(size / 3)}px]`;

  const profilePic =
    profile?.user_picture || currentProfile?.user_picture || null;

  return (
    <div>
      {profilePic ? (
        <div
          className={`${appliedSize} ${className ?? ""} rounded-full text-white border-[#e5e7eb] border-[5px] 
          select-none overflow-hidden bg-[#3588FC] 
          flex items-center justify-center font-semibold`}
        >
          <Image
            src={process.env.NEXT_PUBLIC_API_DOMAIN + profilePic.path}
            alt="User Avatar"
            width={100}
            height={100}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <span
          className={` 
          ${appliedSize}
          ${className ?? ""}
          rounded-full text-white border-[#e5e7eb] border-[5px] 
          select-none overflow-hidden bg-[#3588FC] 
          flex items-center justify-center font-semibold
        `}
        >
          {initials || "?"}
        </span>
      )}
    </div>
  );
}
