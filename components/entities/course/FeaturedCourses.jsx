import { useEffect, useState } from "react";
import BaseApi from "@/lib/api/_base.api";
import CourseCard from "./CourseCard";
import usePrefersReducedMotion from "@/components/home/usePrefersReducedMotion";

export default function FeaturedCourses() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await BaseApi.get(
        process.env.NEXT_PUBLIC_API_URL + "/courses",
      );
      setCourses(response?.data?.data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !courses.length) return;
    let ctx;

    const init = async () => {
      const gsapModule = await import("gsap");
      const scrollTriggerModule = await import("gsap/ScrollTrigger");
      const gsap = gsapModule.gsap || gsapModule.default || gsapModule;
      const ScrollTrigger =
        scrollTriggerModule.ScrollTrigger ||
        scrollTriggerModule.default ||
        scrollTriggerModule;

      gsap.registerPlugin(ScrollTrigger);
      const cards = gsap.utils.toArray(".course-entry");
      if (!cards.length) return;

      ctx = gsap.context(() => {
        ScrollTrigger.batch(cards, {
          start: "top 84%",
          once: true,
          onEnter: (batch) => {
            gsap.fromTo(
              batch,
              { opacity: 0, y: 20 },
              {
                opacity: 1,
                y: 0,
                duration: 0.52,
                stagger: 0.08,
                ease: "power2.out",
              },
            );
          },
        });
      });
    };

    init();

    return () => ctx && ctx.revert();
  }, [courses, prefersReducedMotion]);

  if (isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (!courses.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-slate-700">
        No featured courses available yet. Please check back shortly.
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {courses.map((course) => (
        <div key={course.id} className="course-entry">
          <CourseCard course={course} />
        </div>
      ))}
    </div>
  );
}
