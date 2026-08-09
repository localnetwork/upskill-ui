import persistentStore from "@/lib/store/persistentStore";
import BaseApi from "@/lib/api/_base.api";
import UserAvatar from "../UserAvatar";
import { useRouter } from "next/router";
import Link from "next/link";
import Pencil from "@/components/icons/Pencil";
import toast from "react-hot-toast";
import {
  Facebook,
  Github,
  Instagram,
  Link2,
  Linkedin,
  Twitter,
  Youtube,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Tiktok from "@/components/icons/Tiktok";

function getErrorMessage(error, fallback) {
  return error?.data?.message || error?.response?.data?.message || fallback;
}

export default function UserProfileBanner({ profile }) {
  const currentProfile = persistentStore((state) => state.profile);
  const router = useRouter();
  const { slug } = router.query;
  const safeSlug = typeof slug === "string" ? slug.replace(/ /g, "-") : "";
  const [friendship, setFriendship] = useState({
    relationship: "NONE",
    requestId: null,
  });
  const [isFriendshipLoading, setIsFriendshipLoading] = useState(false);
  const [isFriendActionLoading, setIsFriendActionLoading] = useState(false);

  const isOwnProfile = useMemo(() => {
    if (currentProfile?.id && profile?.id) {
      return currentProfile.id === profile.id;
    }
    return safeSlug === currentProfile?.username;
  }, [currentProfile?.id, currentProfile?.username, profile?.id, safeSlug]);

  const canManageFriendship = Boolean(
    currentProfile?.id && profile?.id && !isOwnProfile,
  );

  useEffect(() => {
    if (!canManageFriendship) return;

    let active = true;
    const fetchStatus = async () => {
      setIsFriendshipLoading(true);
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/users/friend-requests/status/${profile.id}`,
        );
        if (!active) return;
        setFriendship(
          response?.data?.data || {
            relationship: "NONE",
            requestId: null,
          },
        );
      } catch (_error) {
        if (!active) return;
        setFriendship({ relationship: "NONE", requestId: null });
      } finally {
        if (active) setIsFriendshipLoading(false);
      }
    };

    fetchStatus();
    return () => {
      active = false;
    };
  }, [canManageFriendship, profile?.id]);

  const extractedRoleNames =
    profile?.roles || [] ? profile?.roles.map((role) => role.role_name) : [];

  const sendFriendRequest = async () => {
    if (!profile?.id || isFriendActionLoading) return;
    setIsFriendActionLoading(true);
    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/friend-requests/send/${profile.id}`,
      );
      setFriendship(response?.data?.data || { relationship: "REQUEST_SENT" });
      toast.success("Friend request sent.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send friend request."));
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const cancelFriendRequest = async () => {
    if (!profile?.id || isFriendActionLoading) return;
    setIsFriendActionLoading(true);
    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/friend-requests/cancel/${profile.id}`,
      );
      setFriendship(response?.data?.data || { relationship: "NONE" });
      toast.success("Friend request canceled.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to cancel friend request."));
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const respondToFriendRequest = async (action) => {
    if (!friendship?.requestId || isFriendActionLoading) return;
    setIsFriendActionLoading(true);
    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/friend-requests/respond/${friendship.requestId}`,
        { action },
      );
      setFriendship(response?.data?.data || { relationship: "NONE" });
      toast.success(
        action === "ACCEPT"
          ? "Friend request accepted."
          : "Friend request declined.",
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update friend request."));
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  return (
    <div className="bg-[#F0F6FF] px-[50px] pt-[30px] pb-[50px]">
      <div className="container relative">
        <div className="flex justify-between items-center">
          <div>
            <div className="roles uppercase font-bold text-[15px]">
              {extractedRoleNames?.join(", ")}
            </div>
            <div className="name text-[35px] mt-[5px] font-semibold">
              {profile?.firstname} {profile?.lastname}
            </div>
            {profile?.headline && (
              <div className="headline text-[18px] font-semibold mt-[5px] text-gray-600">
                {profile?.headline}
              </div>
            )}
          </div>
          <div className="absolute flex flex-col items-center justify-center top-0 right-0 card test bg-white shadow-md max-w-[450px] min-w-[350px] p-[30px] rounded-lg min-h-[250px]">
            <UserAvatar
              className="w-[130px] h-[128px] text-[40px]"
              profile={profile}
            />

            <div className="flex mt-[30px] justify-center flex-wrap">
              {profile?.link_website && (
                <div className="social-item px-[5px]">
                  <Link
                    href={profile.link_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0056D2] hover:bg-[#F0F6FF] border px-[12px] min-h-[50px]  flex items-center justify-center py-[8px] rounded-md hover:underline mb-2"
                  >
                    <Link2 className="inline-block" size={23} />
                  </Link>
                </div>
              )}
              {profile?.link_x && (
                <div className="social-item px-[5px]">
                  <Link
                    href={`https://www.x.com/` + profile.link_x}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0056D2] hover:bg-[#F0F6FF] border px-[12px] min-h-[50px]  flex items-center justify-center py-[8px] rounded-md hover:underline mb-2"
                  >
                    <Twitter className="inline-block" size={23} />
                  </Link>
                </div>
              )}
              {profile?.link_linkedin && (
                <div className="social-item px-[5px]">
                  <Link
                    href={
                      `https://www.linkedin.com/in/` + profile.link_linkedin
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0056D2] hover:bg-[#F0F6FF] border px-[12px] min-h-[50px]  flex items-center justify-center py-[8px] rounded-md hover:underline mb-2"
                  >
                    <Linkedin className="inline-block" size={23} />
                  </Link>
                </div>
              )}
              {profile?.link_instagram && (
                <div className="social-item px-[5px]">
                  <Link
                    href={`https://www.instagram.com/` + profile.link_instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0056D2] hover:bg-[#F0F6FF] border px-[12px] min-h-[50px]  flex items-center justify-center py-[8px] rounded-md hover:underline mb-2"
                  >
                    <Instagram className="inline-block" size={23} />
                  </Link>
                </div>
              )}
              {profile?.link_facebook && (
                <div className="social-item px-[5px]">
                  <Link
                    href={`https://www.facebook.com/` + profile.link_facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0056D2] hover:bg-[#F0F6FF] border px-[12px] min-h-[50px]  flex items-center justify-center py-[8px] rounded-md hover:underline mb-2"
                  >
                    <Facebook className="inline-block" size={23} />
                  </Link>
                </div>
              )}
              {profile?.link_tiktok && (
                <div className="social-item px-[5px]">
                  <Link
                    href={`https://www.tiktok.com/@` + profile.link_tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0056D2] hover:bg-[#F0F6FF] border px-[12px] min-h-[50px]  flex items-center justify-center py-[8px] rounded-md hover:underline mb-2"
                  >
                    <Tiktok />
                  </Link>
                </div>
              )}
              {profile?.link_youtube && (
                <div className="social-item px-[5px]">
                  <Link
                    href={`https://www.youtube.com/@` + profile.link_youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0056D2] hover:bg-[#F0F6FF] border px-[12px] min-h-[50px]  flex items-center justify-center py-[8px] rounded-md hover:underline mb-2"
                  >
                    <Youtube className="inline-block" size={23} />
                  </Link>
                </div>
              )}
              {profile?.link_github && (
                <div className="social-item px-[5px]">
                  <Link
                    href={`https://www.github.com/` + profile.link_github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0056D2] hover:bg-[#F0F6FF] border px-[12px] min-h-[50px]  flex items-center justify-center py-[8px] rounded-md hover:underline mb-2"
                  >
                    <Github className="inline-block" size={23} />
                  </Link>
                </div>
              )}
            </div>

            {isOwnProfile && (
              <div className="mt-[30px] w-full">
                <Link
                  href={"/profile/basic-information"}
                  className="py-[10px] border-[#3588FC] hover:bg-[#F0F6FF] font-bold text-[#3588FC] flex items-center justify-center px-[30px] text-center border w-full rounded-[10px]"
                >
                  <Pencil className="w-[30px] h-[30px] inline-block mr-[5px]" />
                  Edit Profile
                </Link>
              </div>
            )}

            {!currentProfile?.id && !isOwnProfile ? (
              <div className="mt-[30px] w-full">
                <Link
                  href="/login"
                  className="py-[10px] border-[#3588FC] hover:bg-[#F0F6FF] font-bold text-[#3588FC] flex items-center justify-center px-[30px] text-center border w-full rounded-[10px]"
                >
                  Login to Add Friend
                </Link>
              </div>
            ) : null}

            {canManageFriendship ? (
              <div className="mt-[16px] w-full">
                {friendship.relationship === "FRIENDS" ? (
                  <button
                    type="button"
                    disabled
                    className="py-[10px] border border-[#94a3b8] text-[#475569] bg-[#f8fafc] font-bold w-full rounded-[10px]"
                  >
                    Friends
                  </button>
                ) : friendship.relationship === "REQUEST_SENT" ? (
                  <button
                    type="button"
                    disabled={isFriendActionLoading || isFriendshipLoading}
                    onClick={cancelFriendRequest}
                    className="py-[10px] border border-[#3588FC] hover:bg-[#F0F6FF] font-bold text-[#3588FC] w-full rounded-[10px] disabled:opacity-60"
                  >
                    {isFriendActionLoading ? "Processing..." : "Cancel Friend Request"}
                  </button>
                ) : friendship.relationship === "REQUEST_RECEIVED" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={isFriendActionLoading || isFriendshipLoading}
                      onClick={() => respondToFriendRequest("ACCEPT")}
                      className="py-[10px] bg-[#0056D2] hover:opacity-90 text-white font-bold rounded-[10px] disabled:opacity-60"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      disabled={isFriendActionLoading || isFriendshipLoading}
                      onClick={() => respondToFriendRequest("DECLINE")}
                      className="py-[10px] border border-[#cbd5e1] hover:bg-[#f8fafc] text-[#475569] font-bold rounded-[10px] disabled:opacity-60"
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isFriendActionLoading || isFriendshipLoading}
                    onClick={sendFriendRequest}
                    className="py-[10px] bg-[#0056D2] hover:opacity-90 text-white font-bold w-full rounded-[10px] disabled:opacity-60"
                  >
                    {isFriendActionLoading || isFriendshipLoading
                      ? "Processing..."
                      : "Add Friend"}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
