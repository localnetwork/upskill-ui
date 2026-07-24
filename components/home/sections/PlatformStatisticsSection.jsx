import { useRef } from "react";
import AnimatedCounter from "@/components/home/AnimatedCounter";
import useSectionReveal from "@/components/home/useSectionReveal";

const STATS = [
  { label: "Active learners", value: 2400000, suffix: "M+" },
  { label: "Courses available", value: 1250, suffix: "+" },
  { label: "Hiring partners", value: 800, suffix: "+" },
  { label: "Completion rate", value: 92, suffix: "%" },
];

export default function PlatformStatisticsSection() {
  const sectionRef = useRef(null);
  useSectionReveal(sectionRef, { stagger: 0.08 });

  return (
    <section
      id="platform-statistics"
      ref={sectionRef}
      data-home-section=""
      className="bg-slate-950 py-18 text-white md:py-22"
    >
      <div className="container">
        <div data-reveal="" className="mb-10 max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Platform results powered by consistent learning.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            Real outcomes from learners building practical skills through
            structured projects, mentorship, and career-guided roadmaps.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STATS.map((item) => (
            <article
              key={item.label}
              data-reveal=""
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <AnimatedCounter
                value={item.value}
                suffix={item.suffix}
                className="text-4xl font-semibold tracking-tight"
              />
              <p className="mt-3 text-sm font-medium text-white/65">{item.label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
