import { useEffect, useRef } from "react";
import { ChevronRight, GraduationCap } from "lucide-react";
import MagneticButton from "@/components/home/MagneticButton";
import usePrefersReducedMotion from "@/components/home/usePrefersReducedMotion";

export default function HomeHeroSection() {
  const sectionRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!sectionRef.current || prefersReducedMotion) return;
    let ctx;

    const init = async () => {
      const gsapModule = await import("gsap");
      const gsap = gsapModule.gsap || gsapModule.default || gsapModule;

      ctx = gsap.context(() => {
        const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });
        timeline
          .from("[data-hero-reveal='tag']", { y: 16, opacity: 0, duration: 0.42 })
          .from(
            "[data-hero-reveal='title'] .line",
            { yPercent: 120, opacity: 0, duration: 0.56, stagger: 0.07 },
            "-=0.2",
          )
          .from(
            "[data-hero-reveal='body']",
            { y: 14, opacity: 0, duration: 0.42 },
            "-=0.25",
          )
          .from(
            "[data-hero-reveal='cta']",
            { y: 12, opacity: 0, duration: 0.4, stagger: 0.08 },
            "-=0.24",
          )
          .from(
            "[data-hero-reveal='media']",
            { scale: 0.97, opacity: 0, duration: 0.56 },
            "-=0.46",
          );
      }, sectionRef);
    };

    init();
    return () => ctx && ctx.revert();
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!sectionRef.current || prefersReducedMotion) return;
    let trigger;

    const init = async () => {
      const gsapModule = await import("gsap");
      const scrollTriggerModule = await import("gsap/ScrollTrigger");
      const gsap = gsapModule.gsap || gsapModule.default || gsapModule;
      const ScrollTrigger =
        scrollTriggerModule.ScrollTrigger ||
        scrollTriggerModule.default ||
        scrollTriggerModule;

      gsap.registerPlugin(ScrollTrigger);

      trigger = gsap.to("[data-hero-parallax='layer']", {
        yPercent: -16,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    };

    init();
    return () => trigger && trigger.scrollTrigger && trigger.scrollTrigger.kill();
  }, [prefersReducedMotion]);

  return (
    <section
      id="home-hero"
      ref={sectionRef}
      data-home-section=""
      className="relative overflow-hidden bg-slate-50 py-12 md:py-16"
    >
      <div
        data-hero-parallax="layer"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_85%,rgba(30,64,175,0.1),transparent_42%),radial-gradient(circle_at_82%_18%,rgba(15,23,42,0.08),transparent_48%)]"
      />
      <div className="container relative">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-left">
            <div
              data-hero-reveal="tag"
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700"
            >
              <GraduationCap className="h-4 w-4" />
              Academic and career advancement
            </div>
            <h1
              data-hero-reveal="title"
              className="text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 md:text-5xl xl:text-6xl"
            >
              <span className="line block overflow-hidden">
                Structured learning for
              </span>
              <span className="line block overflow-hidden">
                professional excellence.
              </span>
            </h1>
            <p
              data-hero-reveal="body"
              className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-600 lg:mx-0 lg:text-lg"
            >
              Industry-aligned programs, faculty-grade mentoring, and portfolio
              projects that prepare learners for high-impact roles.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <MagneticButton
                href="/courses"
                className="inline-flex items-center justify-center rounded-xl bg-[#0f2747] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(15,39,71,0.24)] transition-transform duration-300 hover:-translate-y-0.5"
                ariaLabel="Browse all courses"
              >
                <span data-hero-reveal="cta">Explore programs</span>
              </MagneticButton>
              <MagneticButton
                href="/register?mode=instructor"
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-slate-800 transition-colors duration-300 hover:bg-slate-100"
                ariaLabel="Become an instructor"
              >
                <span data-hero-reveal="cta">Partner as instructor</span>
                <ChevronRight className="h-4 w-4" />
              </MagneticButton>
            </div>
            <div
              data-hero-reveal="cta"
              className="mt-8 text-sm text-slate-600"
            >
              Trusted by learners, instructors, and organizations building
              practical, workforce-ready capabilities.
            </div>
          </div>

          <div data-hero-reveal="media" className="relative mx-auto w-full max-w-2xl">
            <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_56px_rgba(15,23,42,0.14)]">
              <div className="h-[220px] w-full overflow-hidden md:h-[280px]">
                <img
                  src="https://picsum.photos/seed/upskill-academic-hero/1200/760"
                  alt="Learners participating in a guided classroom session"
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>
              <div className="grid gap-4 p-6 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Curriculum
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">Structured pathways</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Instruction
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">Mentor-led sessions</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Outcomes
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">Portfolio-focused projects</p>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-4 -top-4 hidden rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700 shadow-md md:block">
              Institution-ready curriculum
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
