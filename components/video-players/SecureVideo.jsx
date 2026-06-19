"use client";

import { useEffect, useState } from "react";
import { parseCookies } from "nookies";
import { getAuthTokenFromCookieMap } from "@/lib/services/authToken";

export default function SecureVideo({ lessonId, className = "w-full h-auto rounded" }) {
  const [streamUrl, setStreamUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!lessonId) return;

    const cookies = parseCookies();
    const token = getAuthTokenFromCookieMap(cookies);
    const streamTokenUrl = `${process.env.NEXT_PUBLIC_API_URL}/stream-token.php?id=${encodeURIComponent(lessonId)}`;
    let mounted = true;

    async function loadVideo() {
      try {
        if (!token) {
          throw new Error("Unauthorized");
        }
        setLoading(true);
        setLoadFailed(false);
        setStreamUrl("");

        const response = await fetch(streamTokenUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-upskill-stream-intent": "playback",
          },
        });

        if (!response.ok) {
          throw new Error("Unable to load secure video");
        }

        const payload = await response.json();
        const playbackToken = payload?.data?.token;
        if (!playbackToken) {
          throw new Error("Missing playback token");
        }
        const nextStreamUrl =
          `${process.env.NEXT_PUBLIC_API_URL}/stream.php?id=${encodeURIComponent(lessonId)}` +
          `&st=${encodeURIComponent(playbackToken)}`;

        if (mounted) {
          setStreamUrl(nextStreamUrl);
        }
      } catch (_error) {
        if (mounted) {
          setLoadFailed(true);
          setStreamUrl("");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadVideo();

    return () => {
      mounted = false;
    };
  }, [lessonId]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading secure video...</div>;
  }

  if (!streamUrl || loadFailed) {
    return <div className="text-sm text-red-500">Unable to load video preview.</div>;
  }

  return (
    <video
      src={streamUrl}
      controls
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      onContextMenu={(e) => e.preventDefault()}
      className={className}
    />
  );
}
