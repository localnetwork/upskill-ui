import { useCallback, useEffect, useRef, useState } from "react";
import { FeaturedCard } from "./FeaturedCoursesCarouselSection";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BaseApi from "@/lib/api/_base.api";
import persistentStore from "@/lib/store/persistentStore";
import PreferencesWizard from "../PreferencesWizard";

function Carousel({ courses }) {
  const trackRef = useRef(null);
  const scrollBy = (direction) =>
    {
    const track = trackRef.current;
    if (track) track.scrollBy({ left: direction * (track.clientWidth + 16), behavior: "smooth" });
  };

  return (
    <div className="relative mt-4">
      <button
        type="button"
        aria-label="Previous courses"
        onClick={() => scrollBy(-1)}
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white shadow-md hover:bg-slate-50 md:flex"
      >
        <ChevronLeft size={18} />
      </button>
      <div
        ref={trackRef}
        className="flex snap-x gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {courses.map((course) => (
          <FeaturedCard key={course.id} course={course} />
        ))}
      </div>
      <button
        type="button"
        aria-label="Next courses"
        onClick={() => scrollBy(1)}
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white shadow-md hover:bg-slate-50 md:flex"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

function Block({ eyebrow, title, action, tag, children }) {
  return (
    <section data-home-section="" className="container py-8">
      {eyebrow && <p className="text-sm font-semibold text-slate-500">{eyebrow}</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {action}
        {tag && (
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800">
            {tag}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function TopicTabsBlock({ tabs }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const active = tabs.find((tab) => tab.id === activeId) || tabs[0];

  return (
    <Block title={`What people who learn ${active.name} take next`}>
      <div className="mt-3 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveId(tab.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab.id === active.id
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>
      <Carousel key={active.id} courses={active.courses} />
    </Block>
  );
}

export default function HomeLearnerSections({ trendingOnly = false }) {
  const token = persistentStore((state) => state.token);
  const [data, setData] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const load = useCallback(() => {
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/courses/recommendations`)
      .then((response) => setData(response?.data?.data || null))
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  if (!data) return null;

  const { learn_next, because_viewed, occupation, trending, top_rated, topic_next } = data;

  if (trendingOnly) {
    return trending?.length > 0 ? (
      <Block title="Trending courses">
        <Carousel courses={trending} />
      </Block>
    ) : null;
  }

  return (
    <>
      {learn_next?.length > 0 && (
        <Block eyebrow="What to learn next" title="Recommended for you">
          <Carousel courses={learn_next} />
        </Block>
      )}
      {because_viewed && (
        <Block
          title={
            <>
              Because you viewed{" "}
              <Link
                href={`/courses/${because_viewed.course.slug}`}
                className="text-primary underline underline-offset-4"
              >
                “{because_viewed.course.title}”
              </Link>
            </>
          }
        >
          <Carousel courses={because_viewed.courses} />
        </Block>
      )}
      {occupation?.courses?.length > 0 && (
        <Block
          title={`Popular for ${occupation.name}`}
          tag="New – Inspired by your selections"
          action={
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="text-sm font-bold text-primary underline underline-offset-4"
            >
              Edit occupation
            </button>
          }
        >
          <Carousel courses={occupation.courses} />
        </Block>
      )}
      {trending?.length > 0 && (
        <Block title="Trending courses">
          <Carousel courses={trending} />
        </Block>
      )}
      {top_rated?.length > 0 && (
        <Block title="Recommended to you based on ratings">
          <Carousel courses={top_rated} />
        </Block>
      )}
      {topic_next?.length > 0 && <TopicTabsBlock tabs={topic_next} />}

      <PreferencesWizard
        open={wizardOpen}
        role="learner"
        onClose={() => setWizardOpen(false)}
        onSaved={load}
      />
    </>
  );
}
