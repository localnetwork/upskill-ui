import { useRef, useState } from "react";
import FeaturedCourses from "../entities/course/FeaturedCourses";
import FeaturedCategories from "../entities/categories/FeaturedCategories";
import useSectionReveal from "@/components/home/useSectionReveal";

export default function FeaturedTabs() {
  const sectionRef = useRef(null);
  const [currentTab, setCurrentTab] = useState("trending");
  useSectionReveal(sectionRef, { stagger: 0.06 });

  const tabs = [
    { id: "trending", label: "Trending Courses" },
    { id: "categories", label: "Explore Categories" },
    { id: "degrees", label: "Degrees" },
  ];

  const onClickTab = (tabId) => {
    setCurrentTab(tabId);
  };

  return (
    <section ref={sectionRef} className="bg-white py-20 md:py-24">
      <div className="container">
        <div data-reveal="" className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Explore courses built with real production workflows.
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
            Choose a learning lane, compare outcomes, and start with content
            that maps directly to practical projects and hiring expectations.
          </p>
        </div>

        <div
          data-reveal=""
          className="mb-8 flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onClickTab(tab.id)}
              className={`${currentTab === tab.id ? "bg-primary text-white shadow-[0_12px_28px_rgba(0,82,204,0.26)]" : "bg-white text-slate-700"} rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:border-primary/50`}
              aria-pressed={currentTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div data-reveal="">
          {currentTab === "trending" && <FeaturedCourses />}
          {currentTab === "categories" && <FeaturedCategories />}
          {currentTab === "degrees" && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-700">
              Degree pathways are launching soon. Start with trending courses to
              build momentum today.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
