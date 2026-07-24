import { useEffect } from "react";
import usePrefersReducedMotion from "./usePrefersReducedMotion";

export default function useSectionReveal(
  sectionRef,
  {
    selector = "[data-reveal]",
    start = "top 82%",
    y = 22,
    stagger = 0.08,
    duration = 0.52,
  } = {},
) {
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!sectionRef.current) return;

    const nodes = sectionRef.current.querySelectorAll(selector);
    if (!nodes.length) return;

    let ctx;

    const init = async () => {
      const gsapModule = await import("gsap");
      const scrollTriggerModule = await import("gsap/ScrollTrigger");
      const gsap = gsapModule.gsap || gsapModule.default || gsapModule;
      const ScrollTrigger =
        scrollTriggerModule.ScrollTrigger ||
        scrollTriggerModule.default ||
        scrollTriggerModule;

      gsap.registerPlugin(ScrollTrigger);

      if (prefersReducedMotion) {
        gsap.set(nodes, { opacity: 1, y: 0, clearProps: "all" });
        return;
      }

      ctx = gsap.context(() => {
        gsap.fromTo(
          nodes,
          { opacity: 0, y },
          {
            opacity: 1,
            y: 0,
            duration: Math.min(duration, 0.58),
            stagger,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start,
              once: true,
            },
          },
        );
      }, sectionRef);
    };

    init();

    return () => ctx && ctx.revert();
  }, [duration, prefersReducedMotion, sectionRef, selector, stagger, start, y]);
}
