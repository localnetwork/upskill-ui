import persistentStore from "@/lib/store/persistentStore";
export default function UserAvatar({ className, profile }) {
  const currentProfile = persistentStore((state) => state.profile);
  const initials =
    [profile?.firstname?.[0] ?? "", profile?.lastname?.[0] ?? ""]
      .join("")
      .toUpperCase() ||
    [currentProfile?.firstname?.[0] ?? "", currentProfile?.lastname?.[0] ?? ""]
      .join("")
      .toUpperCase();
  return (
    <div>
      <span
        className={`${
          className ? className : "w-[50px] h-[48px]"
        } rounded-full text-white border-[#e5e7eb] border-[5px] select-none overflow-hidden  bg-[#3588FC] flex items-center justify-center text-lg font-semibold`}
      >
        {initials || "?"}
      </span>
    </div>
  );
}
