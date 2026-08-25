"use client";

import { useEffect, useMemo, useState } from "react";
import { parseCookies } from "nookies";
import { getAuthTokenFromCookieMap } from "@/lib/services/authToken";
import {
  buildStreamEmbedUrlFromPlaybackUrl,
  extractStreamVideoIdFromPlaybackUrl,
  isAbsoluteHttpUrl,
  resolveVideoSource,
} from "@/lib/services/videoSource";

export default function SecureVideo({
  lessonId,
  src = "",
  className = "w-full rounded",
}) {
  const [iframeUrl, setIframeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const resolvedSrc = useMemo(() => resolveVideoSource(src), [src]);
  const fallbackEmbedUrl = useMemo(
    () => buildStreamEmbedUrlFromPlaybackUrl(resolvedSrc),
    [resolvedSrc],
  );

  useEffect(() => {
    let mounted = true;

    async function loadSignedEmbedUrl() {
      if (!lessonId) {
        if (mounted) setIframeUrl(fallbackEmbedUrl || "");
        return;
      }

      const cookies = parseCookies();
      const token = getAuthTokenFromCookieMap(cookies);
      if (!token) {
        if (mounted) setIframeUrl("");
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/stream-token?id=${encodeURIComponent(lessonId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "x-upskill-stream-intent": "playback",
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Unable to get secure player URL (${response.status})`,
          );
        }

        const payload = await response.json();
        const signedEmbedUrl = String(payload?.data?.embed_url || "").trim();
        if (mounted) {
          setIframeUrl(signedEmbedUrl || "");
        }
      } catch (_error) {
        if (mounted) {
          setIframeUrl("");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSignedEmbedUrl();

    return () => {
      mounted = false;
    };
  }, [lessonId, fallbackEmbedUrl]);

  const isStreamVideo = Boolean(extractStreamVideoIdFromPlaybackUrl(resolvedSrc));
  const canRenderDirectVideo = isAbsoluteHttpUrl(resolvedSrc);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading secure video...</div>;
  }

  if (!iframeUrl && lessonId && isStreamVideo) {
    return (
      <div className="text-sm text-red-500">
        Unable to load secured video stream.
      </div>
    );
  }

  if (!iframeUrl) {
    if (canRenderDirectVideo) {
      return <video controls className={className} src={resolvedSrc} />;
    }
    return (
      <div className="text-sm text-red-500">
        Unable to load video preview.
      </div>
    );
  }

  return (
    <iframe
      src={iframeUrl}
      loading="lazy"
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
      height={300}
      className={className}
    />
  );
}
