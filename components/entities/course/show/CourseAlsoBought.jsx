import BaseApi from "@/lib/api/_base.api";
import CourseCard from "@/components/entities/course/CourseCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function CourseAlsoBought({ slug }) {
  const trackRef = useRef(null);
  const [courses, setCourses] = useState([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!slug) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${encodeURIComponent(slug)}/also-bought?limit=12`,
        );
        if (!cancelled) {
          setCourses(Array.isArray(response?.data?.data) ? response.data.data : []);
        }
      } catch (_error) {
        if (!cancelled) setCourses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollPrev(track.scrollLeft > 4);
    setCanScrollNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [courses, updateScrollState]);

  const scrollByPage = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: "smooth" });
  };

  if (!courses.length) return null;

  return (
    <section id="also-bought" className="py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 lg:text-3xl font-secondary">
          Students also bought
        </h2>
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            aria-label="Previous courses"
            onClick={() => scrollByPage(-1)}
            disabled={!canScrollPrev}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next courses"
            onClick={() => scrollByPage(1)}
            disabled={!canScrollNext}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={updateScrollState}
        className="-mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {courses.map((course) => (
          <div
            key={course.id}
            className="flex w-[85%] shrink-0 snap-start flex-col sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
          >
            <CourseCard course={course} />
          </div>
        ))}
      </div>
    </section>
  );
}
