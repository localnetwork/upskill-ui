import BaseApi from "@/lib/api/_base.api";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import NotificationDetails from "@/components/entities/notification/NotificationDetails";

function resolveNotificationMessage(notification) {
  const baseMessage = String(notification?.message || "").trim();
  const note = String(notification?.metadata?.note || "").trim();
  if (!note) return baseMessage;

  const messageHasReason =
    baseMessage.toLowerCase().includes("reason:") ||
    baseMessage.toLowerCase().includes(note.toLowerCase());

  return messageHasReason ? baseMessage : `${baseMessage}\nReason: ${note}`;
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
          window.dispatchEvent(new Event("notifications:changed"));
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
    <main className="mt-16 px-4 pt-4 pb-10 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/notifications"
          className="text-sm text-primary hover:underline"
        >
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
        <NotificationDetails
          notification={notification}
          message={resolveNotificationMessage(notification)}
          onFriendRequestAction={handleFriendRequestAction}
          isActionLoading={isActionLoading}
        />
      )}
    </main>
  );
}
