import Link from "next/link";
import BaseApi from "@/lib/api/_base.api";
import { useState } from "react";
import toast from "react-hot-toast";

function toRelativeTime(dateValue) {
  if (!dateValue) return "Just now";
  const now = Date.now();
  const timestamp = new Date(dateValue).getTime();
  const diffInSeconds = Math.max(1, Math.floor((now - timestamp) / 1000));

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function getNotificationTypeLabel(notification) {
  const kind = notification?.metadata?.notificationKind;
  if (kind === "FRIEND_REQUEST") return "Friend Request";
  if (kind === "FRIEND_REQUEST_RESPONSE") return "Friend Request";
  if (kind === "COURSE_WELCOME_MESSAGE") return "Welcome";
  if (kind === "COURSE_CONGRATULATIONS_MESSAGE") return "Congratulations";
  if (kind === "COURSE_NEW_ENROLLMENT") return "New Enrollment";

  const map = {
    SYSTEM: "System",
    ORDER: "Order",
    ENROLLMENT: "Enrollment",
    COURSE_REVIEW: "Review",
    PAYOUT: "Payout",
    COURSE_APPROVAL: "Course",
  };
  return map[notification?.type] || "Notification";
}

export default function UserNotifications({
  notifications = [],
  unreadCount = 0,
  onNotificationClick,
  onFriendRequestActionComplete,
}) {
  const [activeNotificationId, setActiveNotificationId] = useState("");

  const handleFriendRequestAction = async (notification, action) => {
    const requestId = notification?.metadata?.friendRequestId;
    if (!requestId) return;
    setActiveNotificationId(notification.id);
    try {
      await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/friend-requests/respond/${requestId}`,
        { action },
      );
      onFriendRequestActionComplete?.(notification.id, action);
      toast.success(
        action === "ACCEPT"
          ? "Friend request accepted."
          : "Friend request declined.",
      );
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.response?.data?.message ||
          "Failed to update friend request.",
      );
    } finally {
      setActiveNotificationId("");
    }
  };

  return (
    <div className="py-5">
      <p className="font-semibold text-[12px]">
        Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
      </p>

      {notifications.length === 0 ? (
        <p className="text-[12px] text-gray-500 mt-3">No notifications yet.</p>
      ) : (
        notifications.map((notification) => (
          <article
            key={notification.id}
            className={`flex items-center gap-2 py-2 px-1 hover:bg-[#f5f5f5] rounded cursor-pointer ${
              notification?.readAt ? "" : "bg-blue-50/60"
            }`}
          >
            <div className="grid grid-cols-3">
              <div className="col-span-1">
                <span className="rounded-full text-white select-none overflow-hidden w-[30px] h-[30px] bg-[#3588FC] flex items-center justify-center text-[10px] font-bold">
                  {getNotificationTypeLabel(notification).slice(0, 1)}
                </span>
              </div>
              <div className="col-span-2 text-[12px]">
                <Link
                  href={`/notifications/${notification.id}`}
                  className="font-semibold line-clamp-1 block"
                  onClick={() => onNotificationClick?.(notification)}
                >
                  {notification.title}
                </Link>
                <p className="text-[10px] text-gray-700 line-clamp-1">
                  {notification.message}
                </p>
                <p className="text-[10px] text-gray-500">
                  {getNotificationTypeLabel(notification)} •{" "}
                  {toRelativeTime(notification.createdAt)}
                </p>
                {notification?.metadata?.notificationKind === "FRIEND_REQUEST" &&
                notification?.metadata?.requestStatus === "PENDING" &&
                notification?.metadata?.friendRequestId ? (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={activeNotificationId === notification.id}
                      className="px-2 py-1 text-[10px] font-semibold rounded-md bg-primary text-white hover:opacity-90 disabled:opacity-60"
                      onClick={() =>
                        handleFriendRequestAction(notification, "ACCEPT")
                      }
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      disabled={activeNotificationId === notification.id}
                      className="px-2 py-1 text-[10px] font-semibold rounded-md border border-[#cbd5e1] text-[#334155] hover:bg-[#f8fafc] disabled:opacity-60"
                      onClick={() =>
                        handleFriendRequestAction(notification, "DECLINE")
                      }
                    >
                      Decline
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        ))
      )}

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
