import { BookOpenText, BriefcaseBusiness, Users } from "lucide-react";
import { useRef } from "react";
import Image from "next/image";
import AnimatedCounter from "@/components/home/AnimatedCounter";
import useSectionReveal from "@/components/home/useSectionReveal";

export default function CallToActions() {
  const sectionRef = useRef(null);
  useSectionReveal(sectionRef);

  const data = [
    {
      title: "Career-first paths",
      description:
        "Role-based roadmaps help you progress from beginner to interview-ready with structured weekly milestones.",
      icon: <BriefcaseBusiness className="h-6 w-6" />,
      img: "/cta-1.jpg",
    },
    {
      title: "Hands-on project studio",
      description:
        "Build real portfolio work with guided reviews, practical exercises, and production tooling across each module.",
      icon: <BookOpenText className="h-6 w-6" />,
      img: "/cta-2.jpg",
    },
    {
      title: "Mentorship at scale",
      description:
        "Get expert feedback, peer accountability, and progress checks that keep momentum strong every week.",
      icon: <Users className="h-6 w-6" />,
      img: "/cta-3.jpg",
    },
  ];

  return (
    <section ref={sectionRef} className="bg-slate-50 py-20 md:py-24">
      <div className="container">
        <div className="mb-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div data-reveal="">
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
              A premium learning system built for measurable outcomes.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              Structured paths, expert support, and interactive lessons designed
              to help you stay consistent and ship better work.
            </p>
          </div>
          <div data-reveal="" className="grid grid-cols-2 gap-3">
            <div
              className="rounded-2xl border border-slate-200 bg-white px-5 py-4"
            >
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                Learners
              </p>
              <AnimatedCounter
                value={2400000}
                suffix="M+"
                className="text-2xl font-semibold text-slate-900"
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                Hiring partners
              </p>
              <AnimatedCounter
                value={800}
                suffix="+"
                className="text-2xl font-semibold text-slate-900"
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                Course completion
              </p>
              <AnimatedCounter
                value={92}
                suffix="%"
                className="text-2xl font-semibold text-slate-900"
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                Avg. lesson rating
              </p>
              <p className="text-2xl font-semibold text-slate-900">4.9/5</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-12">
          {data.map((item, index) => (
            <article
              key={item.title}
              data-reveal=""
              className={`${index === 0 ? "lg:col-span-7" : "lg:col-span-5"} overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 transition-transform duration-300 hover:-translate-y-1`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex rounded-xl bg-[#E8F0FF] p-3 text-primary">
                  {item.icon}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {index + 1}
                </span>
              </div>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
                {item.description}
              </p>
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
                <Image
                  src={item.img}
                  alt={item.title}
                  width={index === 0 ? 960 : 720}
                  height={420}
                  className="h-52 w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
