import { useEffect, useRef } from "react";
import { parseCookies } from "nookies";
export default function VideoPreview({ course, lecture }) {
  const videoRef = useRef();

  useEffect(() => {
    async function loadVideo() {
      const cookies = parseCookies();
      const token = cookies?.[process.env.NEXT_PUBLIC_TOKEN];

      // const token = localStorage.getItem(process.env.NEXT_PUBLIC_TOKEN);

      console.log("token", token);
      const url = `${process.env.NEXT_PUBLIC_API_DOMAIN}/stream.php?id=${lecture.asset.id}&course_id=${course.id}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error("Failed to fetch video", res.status);
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      if (videoRef.current) videoRef.current.src = blobUrl;
    }

    loadVideo();

    return () => {
      if (videoRef.current && videoRef.current.src.startsWith("blob:")) {
        URL.revokeObjectURL(videoRef.current.src);
      }
    };
  }, [course, lecture]);

  return <video ref={videoRef} controls className="w-full h-[500px] ..." />;
}
