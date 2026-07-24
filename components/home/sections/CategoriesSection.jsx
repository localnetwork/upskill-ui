import { useRef } from "react";
import FeaturedCategories from "@/components/entities/categories/FeaturedCategories";
import useSectionReveal from "@/components/home/useSectionReveal";

export default function CategoriesSection() {
  const sectionRef = useRef(null);
  useSectionReveal(sectionRef);

  return (
    <section
      id="categories"
      ref={sectionRef}
      data-home-section=""
      className="bg-slate-50 py-18 md:py-22"
    >
      <div className="container">
        <div data-reveal="" className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Explore curated categories for every stage of growth.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            From full-stack engineering to design systems and AI workflows,
            discover tracks aligned with in-demand career paths.
          </p>
        </div>
        <div data-reveal="">
          <FeaturedCategories />
        </div>
      </div>
    </section>
  );
}
