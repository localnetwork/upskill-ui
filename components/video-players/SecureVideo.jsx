"use client";

import { useEffect, useRef, useState } from "react";
import { parseCookies } from "nookies";
import { getAuthTokenFromCookieMap } from "@/lib/services/authToken";

export default function SecureVideo({ lessonId, className = "w-full h-auto rounded" }) {
  const [blobUrl, setBlobUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const blobUrlRef = useRef("");
  const videoRef = useRef(null);

  useEffect(() => {
    if (!lessonId) return;

    const cookies = parseCookies();
    const token = getAuthTokenFromCookieMap(cookies);
    const streamUrl = `${process.env.NEXT_PUBLIC_API_URL}/stream.php?id=${encodeURIComponent(lessonId)}`;
    let localUrl = "";
    let mounted = true;

    async function loadVideo() {
      try {
        if (!token) {
          throw new Error("Unauthorized");
        }
        setLoading(true);
        setLoadFailed(false);
        setBlobUrl("");

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
        blobUrlRef.current = localUrl;

        if (mounted) {
          setBlobUrl(localUrl);
        }
      } catch (_error) {
        if (mounted) {
          setLoadFailed(true);
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
      if (blobUrlRef.current === localUrl) {
        blobUrlRef.current = "";
      }
    };
  }, [lessonId]);

  useEffect(() => {
    if (!blobUrl || !videoRef.current) return;

    const handleLoadedData = () => {
      const activeUrl = blobUrlRef.current;
      if (!activeUrl) return;
      setTimeout(() => {
        URL.revokeObjectURL(activeUrl);
        if (blobUrlRef.current === activeUrl) {
          blobUrlRef.current = "";
        }
      }, 1500);
    };

    videoRef.current.addEventListener("loadeddata", handleLoadedData, { once: true });
    return () => {
      videoRef.current?.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [blobUrl]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading secure video...</div>;
  }

  if (!blobUrl || loadFailed) {
    return <div className="text-sm text-red-500">Unable to load video preview.</div>;
  }

  return (
    <video
      ref={videoRef}
      src={blobUrl}
      controls
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      onContextMenu={(e) => e.preventDefault()}
      className={className}
    />
  );
}
