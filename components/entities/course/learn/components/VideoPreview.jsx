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

export default function VideoPreview({
  course,
  lecture,
  prevLecture,
  nextLecture,
  setCourse,
}) {
  const [mediaSrc, setMediaSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(null); // ⏱ countdown value
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (!course || !lecture) return;

    const cookies = parseCookies();
    const token = cookies[process.env.NEXT_PUBLIC_TOKEN];
    const videoUrl = `${process.env.NEXT_PUBLIC_API_DOMAIN}/stream.php?course_id=${course.id}&id=${lecture.asset.id}`;

    let isMounted = true;
    let localUrl = null;

    async function loadVideo() {
      try {
        setLoading(true);
        const res = await fetch(videoUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Video request failed");

        const blob = await res.blob();
        localUrl = URL.createObjectURL(blob);
        const type = blob.type || "video/mp4";

        if (isMounted) {
          setMediaSrc({ src: localUrl, type });
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
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [course?.id, lecture?.asset?.id]);

  // ✅ Unmute video after 1 second
  useEffect(() => {
    if (!playerRef.current || !mediaSrc) return;

    const timer = setTimeout(() => {
      const videoElement = playerRef.current?.el?.querySelector("video");
      if (videoElement) {
        videoElement.muted = false;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [mediaSrc]);

  // ✅ Picture-in-Picture when out of view
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        const player = playerRef.current;
        const videoElement = player?.el?.querySelector("video");
        if (!videoElement) return;

        try {
          if (!entry.isIntersecting && !videoElement.paused) {
            if (
              document.pictureInPictureEnabled &&
              !document.pictureInPictureElement
            ) {
              await videoElement.requestPictureInPicture();
            }
          } else if (
            entry.isIntersecting &&
            document.pictureInPictureElement === videoElement
          ) {
            await document.exitPictureInPicture();
          }
        } catch (err) {
          console.log("PiP error:", err);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [mediaSrc]);

  // ✅ Add progress when finished
  const addProgress = async () => {
    try {
      await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/course-curriculums/add-progress",
        {
          course_id: course.id,
          curriculum_id: lecture.id,
        }
      );
      console.log("✅ Progress saved for", lecture.title);
    } catch (error) {
      console.error("❌ Error adding progress:", error);
    }
  };

  // ✅ Handle video ended
  const handleEnded = async () => {
    await addProgress();

    // ✅ Update local course state to mark this lecture as taken
    setCourse((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((section) => ({
          ...section,
          curriculums: section.curriculums.map((c) =>
            c.id === lecture.id ? { ...c, is_taken: true } : c
          ),
        })),
      };
    });

    // ✅ Start countdown if next lecture exists
    if (nextLecture) {
      setCountdown(5);
    }
  };

  // ✅ Countdown timer logic
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      router.push(`/courses/${course.slug}/learn?lecture=${nextLecture.uuid}`);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // ✅ Cancel auto navigation
  const cancelNext = () => {
    setCountdown(null);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg bg-black relative"
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
            title={lecture?.title || "Video Preview"}
            src={mediaSrc}
            playsinline
            crossOrigin=""
            className="h-full w-full"
            onContextMenu={(e) => e.preventDefault()}
            autoPlay
            muted
            onEnded={handleEnded} // ✅ Trigger countdown on video end
          >
            <MediaProvider controlsList="nodownload noremoteplayback" />
            <PlyrLayout icons={plyrLayoutIcons} />
          </MediaPlayer>

          {/* ✅ Countdown Overlay */}
          {/* ✅ Countdown Overlay with Animation */}
          {countdown !== null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white z-[2000] backdrop-blur-sm">
              {/* Circular Progress Ring */}
              <div className="relative mb-6">
                <svg className="w-32 h-32 transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Animated progress circle */}
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
                {/* Countdown number in center */}
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
                      `/courses/${course.slug}/learn?lecture=${nextLecture.uuid}`
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
