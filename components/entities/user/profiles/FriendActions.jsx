import persistentStore from "@/lib/store/persistentStore";
import BaseApi from "@/lib/api/_base.api";
import Link from "next/link";
import toast from "react-hot-toast";
import { useCallback, useEffect, useState } from "react";

function getErrorMessage(error, fallback) {
  return error?.data?.message || error?.response?.data?.message || fallback;
}

const API = process.env.NEXT_PUBLIC_API_URL;

export default function FriendActions({ profile, className = "" }) {
  const currentProfile = persistentStore((state) => state.profile);
  const [friendship, setFriendship] = useState({
    relationship: "NONE",
    requestId: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isActing, setIsActing] = useState(false);

  const isOwnProfile = Boolean(
    currentProfile?.id && profile?.id && currentProfile.id === profile.id,
  );
  const canManage = Boolean(currentProfile?.id && profile?.id && !isOwnProfile);

  const fetchStatus = useCallback(async () => {
    if (!canManage) return;
    setIsLoading(true);
    try {
      const response = await BaseApi.get(
        `${API}/users/friend-requests/status/${profile.id}`,
      );
      setFriendship(
        response?.data?.data || { relationship: "NONE", requestId: null },
      );
    } catch (_error) {
      setFriendship({ relationship: "NONE", requestId: null });
    } finally {
      setIsLoading(false);
    }
  }, [canManage, profile?.id]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!canManage) return;
    window.addEventListener("focus", fetchStatus);
    return () => window.removeEventListener("focus", fetchStatus);
  }, [canManage, fetchStatus]);

  const run = async (path, body, fallbackState, success, failure) => {
    if (isActing) return;
    setIsActing(true);
    try {
      const response = await BaseApi.post(`${API}${path}`, body);
      setFriendship(response?.data?.data || fallbackState);
      await fetchStatus();
      toast.success(success);
    } catch (error) {
      toast.error(getErrorMessage(error, failure));
    } finally {
      setIsActing(false);
    }
  };

  const busy = isActing || isLoading;

  if (!currentProfile?.id && !isOwnProfile) {
    return (
      <div className={className}>
        <Link
          href="/login"
          className="flex w-full items-center justify-center rounded-[10px] border border-[#3588FC] px-[30px] py-[10px] text-center font-bold text-[#3588FC] hover:bg-[#F0F6FF]"
        >
          Login to Add Friend
        </Link>
      </div>
    );
  }

  if (!canManage) return null;

  const { relationship, requestId } = friendship;

  return (
    <div className={className}>
      {relationship === "FRIENDS" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run(
              `/users/friend-requests/unfriend/${profile.id}`,
              undefined,
              { relationship: "NONE" },
              "Unfriended successfully.",
              "Failed to unfriend user.",
            )
          }
          className="w-full rounded-[10px] border border-[#ef4444] py-[10px] font-bold text-[#ef4444] hover:bg-[#fff1f2] disabled:opacity-60"
        >
          {isActing ? "Processing..." : "Unfriend"}
        </button>
      ) : relationship === "REQUEST_SENT" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run(
              `/users/friend-requests/cancel/${profile.id}`,
              undefined,
              { relationship: "NONE" },
              "Friend request canceled.",
              "Failed to cancel friend request.",
            )
          }
          className="w-full rounded-[10px] border border-[#3588FC] py-[10px] font-bold text-[#3588FC] hover:bg-[#F0F6FF] disabled:opacity-60"
        >
          {isActing ? "Processing..." : "Cancel Friend Request"}
        </button>
      ) : relationship === "REQUEST_RECEIVED" ? (
        <div className="grid grid-cols-2 gap-3">
          {[
            ["ACCEPT", "Confirm", "Friend request accepted."],
            ["DECLINE", "Decline", "Friend request declined."],
          ].map(([action, label, message]) => (
            <button
              key={action}
              type="button"
              disabled={busy || !requestId}
              onClick={() =>
                run(
                  `/users/friend-requests/respond/${requestId}`,
                  { action },
                  { relationship: "NONE" },
                  message,
                  "Failed to update friend request.",
                )
              }
              className={
                action === "ACCEPT"
                  ? "rounded-[10px] bg-[#0056D2] py-[10px] font-bold text-white hover:opacity-90 disabled:opacity-60"
                  : "rounded-[10px] border border-[#cbd5e1] py-[10px] font-bold text-[#475569] hover:bg-[#f8fafc] disabled:opacity-60"
              }
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run(
              `/users/friend-requests/send/${profile.id}`,
              undefined,
              { relationship: "REQUEST_SENT" },
              "Friend request sent.",
              "Failed to send friend request.",
            )
          }
          className="w-full rounded-[10px] bg-[#0056D2] py-[10px] font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Processing..." : "Add Friend"}
        </button>
      )}
    </div>
  );
}
