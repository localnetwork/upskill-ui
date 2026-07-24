import Image from "next/image";
import Link from "next/link";
import persistentStore from "@/lib/store/persistentStore";
import { useEffect, useMemo, useRef } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { gsap } from "gsap";
import usePrefersReducedMotion from "@/components/home/usePrefersReducedMotion";

export default function HomeBanner() {
  const profile = persistentStore((state) => state.profile);
  const sectionRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const isInstructor = useMemo(
    () => profile?.roles?.some((role) => role.role_name === "Instructor"),
    [profile],
  );

  const isLearner = useMemo(
    () => profile?.roles?.some((role) => role.role_name === "Learner"),
    [profile],
  );

  useEffect(() => {
    if (!sectionRef.current || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });

      timeline
        .from("[data-hero='eyebrow']", { y: 16, opacity: 0, duration: 0.45 })
        .from(
          "[data-hero='title']",
          { y: 24, opacity: 0, duration: 0.55 },
          "-=0.25",
        )
        .from(
          "[data-hero='description']",
          { y: 18, opacity: 0, duration: 0.45 },
          "-=0.3",
        )
        .from(
          "[data-hero='cta']",
          { y: 14, opacity: 0, duration: 0.42, stagger: 0.08 },
          "-=0.25",
        )
        .from(
          "[data-hero='media']",
          { scale: 0.96, opacity: 0, duration: 0.55 },
          "-=0.5",
        )
        .from(
          "[data-hero='float']",
          { y: 14, opacity: 0, duration: 0.45, stagger: 0.08 },
          "-=0.35",
        );
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-white py-12 md:py-16 lg:py-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,82,204,0.1),transparent_45%),radial-gradient(circle_at_5%_75%,rgba(14,165,233,0.12),transparent_35%)]" />
      <div className="container relative">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="text-center lg:text-left">
            <div
              data-hero="eyebrow"
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D5E2FF] bg-[#F4F8FF] px-4 py-2 text-xs font-semibold text-[#0048B3]"
            >
              <Sparkles className="h-4 w-4" />
              Trusted learning tracks
            </div>
            <h1
              data-hero="title"
              className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-950 md:text-5xl lg:text-6xl"
            >
              Build practical skills for roles that are hiring now.
            </h1>
            <p
              data-hero="description"
              className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 lg:mx-0 lg:text-lg"
            >
              Learn with guided paths, mentor support, and real projects built
              around modern teams.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <Link
                data-hero="cta"
                href="/courses"
                className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 sm:w-auto"
              >
                Start learning
              </Link>
              <Link
                data-hero="cta"
                href="/register?mode=instructor"
                className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-800 transition-colors duration-300 hover:bg-slate-50 sm:w-auto"
              >
                Teach on Upskill
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div data-hero="media" className="relative mx-auto w-full max-w-2xl">
            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[#EAF1FF] p-3 shadow-[0_22px_60px_rgba(14,31,60,0.16)]">
              <div className="relative aspect-[6/5] overflow-hidden rounded-3xl">
                <Image
                  alt="Students collaborating during an online learning session"
                  className="h-full w-full object-cover"
                  src="/hero-banner.png"
                  width={1100}
                  height={920}
                  priority
                />
              </div>
            </div>

            <div
              data-hero="float"
              className="absolute -left-5 bottom-8 hidden rounded-2xl border border-white/80 bg-white/95 p-4 shadow-lg backdrop-blur sm:block"
            >
              <p className="mb-0 text-xs font-medium uppercase tracking-wide text-slate-500">
                Completion rate
              </p>
              <p className="text-xl font-semibold text-slate-900">92%</p>
            </div>

            <div
              data-hero="float"
              className="absolute -right-4 top-6 hidden rounded-2xl border border-white/80 bg-white/95 p-4 shadow-lg backdrop-blur md:block"
            >
              <p className="mb-0 text-xs font-medium uppercase tracking-wide text-slate-500">
                Live cohorts
              </p>
              <p className="text-xl font-semibold text-slate-900">48 weekly</p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {["Google", "IBM", "Meta", "Notion"].map((partner) => (
                <div
                  key={partner}
                  data-hero="float"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-600"
                >
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </div>

        {(isInstructor || isLearner) && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700">
            {isInstructor
              ? "Welcome back. Your instructor dashboard is ready with student activity and course insights."
              : "Welcome back. Continue your learning path from your latest lessons and saved courses."}
          </div>
        )}
      </div>
    </section>
  );
}
