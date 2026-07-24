import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Briefcase, ChartColumnIncreasing, Users } from "lucide-react";
import useSectionReveal from "@/components/home/useSectionReveal";

const JOURNEY_STEPS = [
  {
    title: "Assess your starting point",
    body: "Take a quick skills diagnostic and get a personalized course sequence.",
    icon: ChartColumnIncreasing,
  },
  {
    title: "Learn with guided projects",
    body: "Each lesson maps to practical tasks that mirror real team workflows.",
    icon: BookOpen,
  },
  {
    title: "Get mentor feedback",
    body: "Receive targeted reviews and improve your solutions with expert coaching.",
    icon: Users,
  },
  {
    title: "Launch career-ready work",
    body: "Ship portfolio pieces, certificates, and interview-ready case studies.",
    icon: Briefcase,
  },
];

export default function LearningJourneySection() {
  const sectionRef = useRef(null);
  useSectionReveal(sectionRef, { stagger: 0.08 });

  return (
    <section
      id="learning-journey"
      ref={sectionRef}
      data-home-section=""
      className="bg-white py-18 md:py-22"
    >
      <div className="container">
        <div data-reveal="" className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              A clear learning journey from beginner to hire-ready.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Upskill blends cohort accountability with flexible learning so you
              can stay consistent and grow faster.
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            Explore learning paths
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {JOURNEY_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={step.title}
                data-reveal=""
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="inline-flex rounded-xl bg-white p-3 text-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium text-slate-400">0{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{step.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
