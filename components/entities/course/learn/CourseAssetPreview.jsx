import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Spinner from "@/components/icons/Spinner";
import VideoPreview from "./components/VideoPreview";
import ArticlePreview from "./components/ArticlePreview";

export default function CourseAssetPreview({ lecture }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Determine which component to render
  let component = null;
  switch (lecture?.curriculum_resource_type) {
    case "video":
      component = <VideoPreview lecture={lecture} />;
      break;
    case "article":
      component = <ArticlePreview lecture={lecture} />;
      break;
    default:
      component = null;
  }

  useEffect(() => {
    // Set loading true until router is ready
    if (router.isReady) {
      setIsLoading(false);
    }

    const handleStart = () => setIsLoading(true);
    const handleStop = () => setIsLoading(false);

    // Listen to route change events
    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);

    // Cleanup
    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);

  return (
    <div className="w-full h-[500px] bg-[#16161D] relative">
      {isLoading ? (
        <span className="preloader absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Spinner className="w-10 h-10 text-white animate-spin" />
        </span>
      ) : (
        <>{component}</>
      )}
    </div>
  );
}
