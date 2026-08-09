import BaseApi from "@/lib/api/_base.api";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveNotificationMessage(notification) {
  const baseMessage = String(notification?.message || "").trim();
  const note = String(notification?.metadata?.note || "").trim();
  if (!note) return baseMessage;

  const messageHasReason =
    baseMessage.toLowerCase().includes("reason:") ||
    baseMessage.toLowerCase().includes(note.toLowerCase());

  return messageHasReason
    ? baseMessage
    : `${baseMessage}\nReason: ${note}`;
}

function isPendingFriendRequest(notification) {
  return (
    notification?.metadata?.notificationKind === "FRIEND_REQUEST" &&
    notification?.metadata?.requestStatus === "PENDING" &&
    Boolean(notification?.metadata?.friendRequestId)
  );
}

export default function NotificationDetailPage() {
  const router = useRouter();
  const { notifId } = router.query;
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (!notifId || Array.isArray(notifId)) return;

    const fetchNotification = async () => {
      setIsLoading(true);
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/notifications/${notifId}`,
        );
        const row = response?.data?.data || null;
        setNotification(row);
        if (row?.id && !row?.readAt) {
          await BaseApi.post(
            `${process.env.NEXT_PUBLIC_API_URL}/notifications/${row.id}/read`,
          );
          setNotification((prev) =>
            prev ? { ...prev, readAt: new Date().toISOString() } : prev,
          );
        }
      } catch (_error) {
        setNotification(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotification();
  }, [notifId]);

  const handleFriendRequestAction = async (action) => {
    const requestId = notification?.metadata?.friendRequestId;
    if (!requestId || isActionLoading) return;

    setIsActionLoading(true);
    try {
      await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/friend-requests/respond/${requestId}`,
        { action },
      );
      setNotification((prev) =>
        prev
          ? {
              ...prev,
              metadata: {
                ...(prev.metadata || {}),
                requestStatus: action === "ACCEPT" ? "ACCEPTED" : "DECLINED",
              },
            }
          : prev,
      );
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
      setIsActionLoading(false);
    }
  };

  return (
    <main className="mt-16 px-4 pt-4 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/notifications" className="text-sm text-primary hover:underline">
          ← Back to notifications
        </Link>
      </div>

      {isLoading ? (
        <div className="border border-[#e2e8f0] rounded-lg p-6 animate-pulse">
          <div className="h-5 w-64 bg-gray-200 rounded mb-3" />
          <div className="h-4 w-40 bg-gray-200 rounded mb-6" />
          <div className="h-4 w-full bg-gray-200 rounded mb-2" />
          <div className="h-4 w-full bg-gray-200 rounded mb-2" />
          <div className="h-4 w-4/5 bg-gray-200 rounded" />
        </div>
      ) : !notification ? (
        <div className="border border-[#e2e8f0] rounded-lg p-6 text-[#64748b]">
          Notification not found.
        </div>
      ) : (
        <article className="border border-[#e2e8f0] rounded-lg p-6 bg-white">
          <h1 className="text-2xl font-bold text-on-surface">{notification.title}</h1>
          <p className="text-xs text-[#64748b] mt-2">{formatDate(notification.createdAt)}</p>
          <div className="mt-5 text-[15px] leading-relaxed text-[#334155] whitespace-pre-wrap">
            {resolveNotificationMessage(notification)}
          </div>
          {isPendingFriendRequest(notification) ? (
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleFriendRequestAction("ACCEPT")}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-md bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => handleFriendRequestAction("DECLINE")}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-md border border-[#cbd5e1] text-[#334155] text-sm font-semibold hover:bg-[#f8fafc] disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          ) : null}
        </article>
      )}
    </main>
  );
}
