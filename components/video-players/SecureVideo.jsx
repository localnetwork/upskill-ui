"use client";

import { useEffect, useState } from "react";
import { parseCookies } from "nookies";

export default function SecureVideo({ lessonId, className = "w-full h-auto rounded" }) {
  const [blobUrl, setBlobUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lessonId) return;

    const cookies = parseCookies();
    const token = cookies[process.env.NEXT_PUBLIC_TOKEN];
    const streamUrl = `${process.env.NEXT_PUBLIC_API_URL}/stream.php?id=${lessonId}`;
    let localUrl = "";
    let mounted = true;

    async function loadVideo() {
      try {
        setLoading(true);
        const response = await fetch(streamUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unable to load secure video");
        }

        const blob = await response.blob();
        localUrl = URL.createObjectURL(blob);
        if (mounted) {
          setBlobUrl(localUrl);
        }
      } catch (error) {
        console.error("Secure video load failed:", error);
        if (mounted) {
          setBlobUrl("");
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
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [lessonId]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading secure video...</div>;
  }

  if (!blobUrl) {
    return <div className="text-sm text-red-500">Unable to load video preview.</div>;
  }

  return <video src={blobUrl} controls className={className} />;
}
