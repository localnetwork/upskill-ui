import { useRef } from "react";
import FeaturedCourses from "@/components/entities/course/FeaturedCourses";
import useSectionReveal from "@/components/home/useSectionReveal";

export default function FeaturedCoursesSection() {
  const sectionRef = useRef(null);
  useSectionReveal(sectionRef, { stagger: 0.06 });

  return (
    <section
      id="featured-courses"
      ref={sectionRef}
      data-home-section=""
      className="bg-white py-18 md:py-22"
    >
      <div className="container">
        <div data-reveal="" className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Featured courses with production-level outcomes.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Pick from high-impact programs built around practical exercises,
            clear milestones, and portfolio-ready projects.
          </p>
        </div>
        <div data-reveal="">
          <FeaturedCourses />
        </div>
      </div>
    </section>
  );
}
