"use client";

import { useEffect, useState, useRef } from "react";
import { parseCookies } from "nookies";
import { useRouter } from "next/router";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  PlyrLayout,
  plyrLayoutIcons,
} from "@vidstack/react/player/layouts/plyr";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/plyr/theme.css";
import BaseApi from "@/lib/api/_base.api";
import { getAuthTokenFromCookieMap } from "@/lib/services/authToken";

export default function VideoPreview({
  course,
  lecture,
  prevLecture,
  nextLecture,
  setCourse,
}) {
  const [mediaSrc, setMediaSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const blobUrlRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (!course || !lecture) return;

    const cookies = parseCookies();
    const token = getAuthTokenFromCookieMap(cookies);
    const videoUrl = `${process.env.NEXT_PUBLIC_API_URL}/stream.php?id=${encodeURIComponent(lecture.id)}`;

    let isMounted = true;
    let localUrl = null;

    async function loadVideo() {
      try {
        if (!token) {
          throw new Error("Unauthorized");
        }

        setLoading(true);
        setMediaSrc(null);

        const res = await fetch(videoUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`Video request failed (${res.status})`);
        }

        const blob = await res.blob();
        localUrl = URL.createObjectURL(blob);
        blobUrlRef.current = localUrl;

        if (isMounted) {
          setMediaSrc([{ src: localUrl, type: blob.type || "video/mp4" }]);
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
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
      if (blobUrlRef.current === localUrl) {
        blobUrlRef.current = null;
      }
    };
  }, [course?.id, lecture?.id]);

  useEffect(() => {
    if (!mediaSrc) return;
    const videoEl = playerRef.current?.el?.querySelector("video");
    if (!videoEl) return;

    const handleLoadedData = () => {
      const currentUrl = blobUrlRef.current;
      if (!currentUrl) return;
      setTimeout(() => {
        URL.revokeObjectURL(currentUrl);
        if (blobUrlRef.current === currentUrl) {
          blobUrlRef.current = null;
        }
      }, 1500);
    };

    videoEl.addEventListener("loadeddata", handleLoadedData, { once: true });
    return () => {
      videoEl.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [mediaSrc]);

  // Unmute after player mounts
  useEffect(() => {
    if (!playerRef.current || !mediaSrc) return;

    const timer = setTimeout(() => {
      const videoEl = playerRef.current?.el?.querySelector("video");
      if (videoEl) videoEl.muted = false;
    }, 300);

    return () => clearTimeout(timer);
  }, [mediaSrc]);

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
      await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/course-curriculums/add-progress",
        { course_id: course.id, curriculum_id: lecture.id },
      );
      console.log("✅ Progress saved for", lecture.title);
    } catch (error) {
      console.error("❌ Error adding progress:", error);
    }
  };

  const handleEnded = async () => {
    await addProgress();

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

  // Countdown auto-advance
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

      {mediaSrc && !loading && (
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
            muted
            onEnded={handleEnded}
          >
            {/* ✅ Custom <video> element so controlsList reaches the DOM node */}
            <MediaProvider>
              <video
                slot="media"
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture={false}
              />
            </MediaProvider>
            <PlyrLayout icons={plyrLayoutIcons} />
          </MediaPlayer>

          {/* Countdown overlay */}
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
