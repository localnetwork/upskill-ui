import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Spinner from "@/components/icons/Spinner";
import VideoPreview from "./components/VideoPreview";
import ArticlePreview from "./components/ArticlePreview";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "react-tooltip/dist/react-tooltip.css";
import { Tooltip } from "react-tooltip";

export default function CourseAssetPreview({
  lecture,
  course,
  setCurrentLecture,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const findNextLecture = () => {
    let foundCurrent = false;
    for (const section of course.sections) {
      for (const curriculum of section.curriculums) {
        if (foundCurrent) {
          return curriculum;
        }
        if (curriculum?.uuid === lecture?.uuid) {
          foundCurrent = true;
        }
      }
    }
    return null;
  };

  const findPreviousLecture = () => {
    let previousLecture = null;
    for (const section of course.sections) {
      for (const curriculum of section.curriculums) {
        if (curriculum?.uuid === lecture?.uuid) {
          return previousLecture;
        }
        previousLecture = curriculum;
      }
    }

    return null;
  };

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

  const prevLecture = findPreviousLecture();
  const nextLecture = findNextLecture();

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
        <>
          {/* PREV LECTURE */}

          {prevLecture && (
            <button
              disabled={!prevLecture}
              onClick={() => {
                setCurrentLecture(prevLecture);
                router.push({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    lecture: prevLecture?.uuid,
                  },
                });
              }}
              data-tooltip-id="prev-tooltip"
              data-tooltip-content={
                prevLecture ? prevLecture.title : "No previous lecture"
              }
              className="bg-black cursor-pointer absolute top-[50%] translate-y-[-50%] bg-opacity-50 hover:bg-opacity-70 z-[5] text-white px-4 py-2"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <Tooltip id="prev-tooltip" />

          {nextLecture && (
            <button
              disabled={!nextLecture}
              onClick={() => {
                setCurrentLecture(nextLecture);
                router.push({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    lecture: nextLecture?.uuid,
                  },
                });
              }}
              data-tooltip-id="next-tooltip"
              data-tooltip-content={
                nextLecture ? nextLecture.title : "No next lecture"
              }
              className="bg-black cursor-pointer absolute top-[50%] right-0 translate-y-[-50%] bg-opacity-50 hover:bg-opacity-70 z-[5] text-white px-4 py-2"
            >
              <ChevronRight size={24} className="" />
              <Tooltip id="next-tooltip" />
            </button>
          )}

          {component}
        </>
      )}
    </div>
  );
}
