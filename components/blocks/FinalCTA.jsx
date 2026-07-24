import Link from "next/link";
import { useRef } from "react";
import useSectionReveal from "@/components/home/useSectionReveal";

export default function FinalCTA() {
  const sectionRef = useRef(null);
  useSectionReveal(sectionRef, { stagger: 0.08 });

  return (
    <section
      id="cta"
      ref={sectionRef}
      data-home-section=""
      className="bg-slate-50 px-6 py-20 md:px-8 md:py-24"
    >
      <div className="container">
        <div
          data-reveal=""
          className="relative overflow-hidden rounded-[32px] bg-slate-950 px-6 py-14 text-center text-white md:px-12 md:py-20"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(0,82,204,0.35),transparent_45%),radial-gradient(circle_at_80%_90%,rgba(56,189,248,0.24),transparent_40%)]" />
          <div className="relative z-10 mx-auto max-w-3xl">
            <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
              Ready to move faster in your career?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
              Start with a guided path today and ship practical work from your
              first week.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/courses"
                className="rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0"
              >
                Browse courses
              </Link>
              <Link
                href="/register?mode=student"
                className="rounded-xl border border-white/25 bg-white/10 px-8 py-3.5 text-base font-semibold text-white transition-colors duration-300 hover:bg-white/20"
              >
                Create account
              </Link>
            </div>
          </div>

          <div className="relative z-10 mt-10 grid grid-cols-2 gap-4 border-t border-white/10 pt-8 md:grid-cols-4">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-2xl font-semibold">7 days</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-white/60">
                Free access
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-2xl font-semibold">24/7</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-white/60">
                Self-paced learning
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-2xl font-semibold">30 days</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-white/60">
                Money back
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-2xl font-semibold">800+</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-white/60">
                Hiring partners
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
