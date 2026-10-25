"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  PlyrLayout,
  plyrLayoutIcons,
} from "@vidstack/react/player/layouts/plyr";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/plyr/theme.css";
import BaseApi from "@/lib/api/_base.api";
import { postOrQueue } from "@/lib/offline/queue";
import {
  buildStreamEmbedUrlFromPlaybackUrl,
  extractStreamVideoIdFromPlaybackUrl,
  isAbsoluteHttpUrl,
  isBunnyEmbedUrl,
  resolveVideoSource,
} from "@/lib/services/videoSource";

const STREAM_SDK_SRC =
  "https://embed.videodelivery.net/embed/sdk.latest.js";
let streamSdkLoaderPromise = null;

function loadStreamPlayerSdk() {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (typeof window.Stream === "function") {
    return Promise.resolve(window.Stream);
  }

  if (streamSdkLoaderPromise) {
    return streamSdkLoaderPromise;
  }

  streamSdkLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      `script[src="${STREAM_SDK_SRC}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.Stream), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load stream player SDK")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = STREAM_SDK_SRC;
    script.async = true;
    script.onload = () => resolve(window.Stream);
    script.onerror = () =>
      reject(new Error("Failed to load stream player SDK"));
    document.head.appendChild(script);
  });

  return streamSdkLoaderPromise;
}

export default function VideoPreview({
  course,
  lecture,
  prevLecture,
  nextLecture,
  setCourse,
}) {
  const [mediaSrc, setMediaSrc] = useState(null);
  const [iframeSrc, setIframeSrc] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const playerRef = useRef(null);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const completedLectureRef = useRef("");
  const router = useRouter();

  useEffect(() => {
    if (!course || !lecture) return;

    const directVideoUrl = resolveVideoSource(
      lecture?.asset?.path || lecture?.videoUrl || "",
    );
    const isStreamVideo = Boolean(
      extractStreamVideoIdFromPlaybackUrl(directVideoUrl),
    );
    let isMounted = true;

    async function loadVideo() {
      try {
        setLoading(true);
        setIframeSrc("");
        setMediaSrc(null);

        if (lecture?.id) {
          try {
            const response = await BaseApi.get(
              `${process.env.NEXT_PUBLIC_API_URL}/stream-token`,
              {
                params: {
                  id: lecture.id,
                },
                headers: {
                  "x-upskill-stream-intent": "playback",
                },
              },
            );
            const signedEmbedUrl = String(
              response?.data?.data?.embed_url || "",
            ).trim();
            if (signedEmbedUrl) {
              if (isMounted) {
                setIframeSrc(signedEmbedUrl);
                setMediaSrc(null);
              }
              return;
            }
          } catch (streamError) {
            if (isStreamVideo) {
              throw streamError;
            }
          }
        }

        const streamIframeUrl =
          buildStreamEmbedUrlFromPlaybackUrl(directVideoUrl);
        if (streamIframeUrl) {
          if (isMounted) {
            setIframeSrc(streamIframeUrl);
            setMediaSrc(null);
          }
          return;
        }

        if (isStreamVideo) {
          throw new Error("Missing secure stream embed URL");
        }

        if (!isAbsoluteHttpUrl(directVideoUrl)) {
          throw new Error("Missing video URL");
        }

        if (isMounted) {
          setIframeSrc("");
          setMediaSrc([{ src: directVideoUrl, type: "video/mp4" }]);
        }
      } catch (err) {
        console.error("Error loading video:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadVideo();

    return () => {
      isMounted = false;
    };
  }, [course?.id, lecture?.id, lecture?.asset?.path, lecture?.videoUrl]);

  useEffect(() => {
    setCountdown(null);
    completedLectureRef.current = "";
  }, [lecture?.id]);

  // Picture-in-Picture when scrolled out of view
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        const videoEl = playerRef.current?.el?.querySelector("video");
        if (!videoEl) return;

        try {
          if (!entry.isIntersecting && !videoEl.paused) {
            if (
              document.pictureInPictureEnabled &&
              !document.pictureInPictureElement
            ) {
              await videoEl.requestPictureInPicture();
            }
          } else if (
            entry.isIntersecting &&
            document.pictureInPictureElement === videoEl
          ) {
            await document.exitPictureInPicture();
          }
        } catch (err) {
          console.log("PiP error:", err);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [mediaSrc]);

  const addProgress = async () => {
    try {
      await postOrQueue(
        process.env.NEXT_PUBLIC_API_URL + "/course-curriculums/add-progress",
        { course_id: course.id, curriculum_id: lecture.id },
      );
      return true;
    } catch (error) {
      console.error("Error adding progress:", error);
      return false;
    }
  };

  const markLectureCompleted = async () => {
    if (completedLectureRef.current === lecture?.id) {
      return;
    }

    completedLectureRef.current = lecture?.id || "";
    const saved = await addProgress();
    if (!saved) {
      completedLectureRef.current = "";
      return;
    }

    setCourse((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((section) => ({
          ...section,
          curriculums: section.curriculums.map((c) =>
            c.id === lecture.id ? { ...c, is_taken: true } : c,
          ),
        })),
      };
    });

    if (nextLecture) setCountdown(5);
  };

  const markCompletedRef = useRef(null);
  markCompletedRef.current = markLectureCompleted;

  const handleEnded = async () => {
    const videoEl = playerRef.current?.el?.querySelector("video");
    if (videoEl) {
      const duration = Number(videoEl.duration);
      const currentTime = Number(videoEl.currentTime || 0);
      const hasKnownDuration = Number.isFinite(duration) && duration > 0;
      const reachedEndByTime =
        hasKnownDuration && currentTime >= duration - 0.35;
      if (!videoEl.ended && !reachedEndByTime) {
        return;
      }
    }

    await markLectureCompleted();
  };

  useEffect(() => {
    if (!iframeSrc || !lecture?.id) return;

    let activePlayer = null;
    let endedHandler = null;
    let cancelled = false;

    if (loading) return;

    const attachIframePlaybackEvents = async () => {
      if (isBunnyEmbedUrl(iframeSrc)) return;
      try {
        const Stream = await loadStreamPlayerSdk();
        if (
          cancelled ||
          typeof Stream !== "function" ||
          !iframeRef.current ||
          !iframeRef.current.contentWindow
        ) {
          return;
        }

        activePlayer = Stream(iframeRef.current);
        endedHandler = () => {
          markCompletedRef.current?.();
        };
        // Attach immediately; "ready" may already have fired before we subscribed.
        if (activePlayer?.addEventListener) {
          activePlayer.addEventListener("ended", endedHandler);
        }
      } catch (error) {
        console.error("Unable to attach stream iframe playback events:", error);
      }
    };

    attachIframePlaybackEvents();

    return () => {
      cancelled = true;
      if (activePlayer?.removeEventListener && endedHandler) {
        try {
          activePlayer.removeEventListener("ended", endedHandler);
        } catch (_error) {
          // no-op
        }
      }
    };
  }, [iframeSrc, lecture?.id, loading]);

  // Bunny's iframe player speaks the player.js protocol over postMessage.
  useEffect(() => {
    if (!isBunnyEmbedUrl(iframeSrc) || !lecture?.id || loading) return;

    const post = (message) =>
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ context: "player.js", version: "0.0.11", ...message }),
        "*",
      );

    const onMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      let data = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (_error) {
          return;
        }
      }
      if (data?.context !== "player.js") return;
      if (data.event === "ready") {
        post({ method: "addEventListener", value: "ended" });
      } else if (data.event === "ended") {
        markCompletedRef.current?.();
      }
    };

    window.addEventListener("message", onMessage);
    // "ready" may have fired before we subscribed, so subscribe right away as well.
    post({ method: "addEventListener", value: "ended" });
    return () => window.removeEventListener("message", onMessage);
  }, [iframeSrc, lecture?.id, loading]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      router.push(`/courses/${course.slug}/learn?lecture=${nextLecture.uuid}`);
      return;
    }
    const timer = setTimeout(
      () => setCountdown((p) => (p > 0 ? p - 1 : 0)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [countdown]);

  const cancelNext = () => setCountdown(null);

  return (
    <div
      ref={containerRef}
      className="video-preview w-full h-[500px] rounded-xl overflow-hidden shadow-lg bg-black relative"
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm z-10">
          Loading video...
        </div>
      )}

      {iframeSrc && !loading && (
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="h-full w-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      )}

      {mediaSrc && !loading && !iframeSrc && (
        <>
          <MediaPlayer
            ref={playerRef}
            title={lecture?.title || "Video"}
            src={mediaSrc}
            playsinline
            crossOrigin=""
            className="h-full w-full"
            onContextMenu={(e) => e.preventDefault()}
            autoPlay
            onEnded={handleEnded}
          >
            <MediaProvider>
              <video
                slot="media"
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture={false}
              />
            </MediaProvider>
            <PlyrLayout icons={plyrLayoutIcons} />
          </MediaPlayer>

          {countdown !== null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white z-[2000] backdrop-blur-sm">
              <div className="relative mb-6">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - countdown / 5)}`}
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-bold">{countdown}</span>
                </div>
              </div>

              <p className="text-lg mb-4">
                Next lecture starting in{" "}
                <span className="font-semibold">{countdown}</span> seconds...
              </p>
              <div className="flex gap-4">
                <button
                  onClick={cancelNext}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    router.push(
                      `/courses/${course.slug}/learn?lecture=${nextLecture.uuid}`,
                    )
                  }
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition"
                >
                  Go Now
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
