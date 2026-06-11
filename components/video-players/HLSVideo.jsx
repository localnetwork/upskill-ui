import { useRef, useEffect } from "react";
import Hls from "hls.js";

export default function HLSVideo({ src }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);

      return () => {
        hls.destroy();
      };
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS support
      videoRef.current.src = src;
    }
  }, [src]);

  return <video ref={videoRef} controls className="w-full h-auto rounded" />;
}
