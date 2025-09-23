import Link from "next/link";
export default function UserNotifications() {
  return (
    <div className="py-5">
      <p className="font-semibold text-[12px]">Notifications</p>
      {Array(3)
        .fill(0)
        .map((_, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 py-2 hover:bg-[#f5f5f5] rounded cursor-pointer"
          >
            <div className="grid grid-cols-3">
              <div className="col-span-1">
                <span className="rounded-full text-white select-none overflow-hidden w-[30px] h-[30px] bg-[#3588FC] flex items-center justify-center text-sm font-semibold" />
              </div>
              <div className="col-span-2 text-[12px]">
                <p className="font-semibold">Notification Title</p>
                <p className="text-[10px] text-gray-500">Just now</p>
              </div>
            </div>
          </div>
        ))}
      <div className="mt-4 flex justify-center">
        <Link
          className="text-[12px] border px-[15px] py-2 rounded-[50px] hover:bg-[#f5f5f5] inline-block text-center"
          href="/notifications"
        >
          All Notifications
        </Link>
      </div>
    </div>
  );
}
