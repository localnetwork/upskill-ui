import { useEffect, useRef } from "react";
import usePrefersReducedMotion from "./usePrefersReducedMotion";

function formatValue(value, suffix) {
  if (suffix === "%") return `${Math.round(value)}%`;
  if (suffix === "k+") return `${Math.round(value)}k+`;
  if (suffix === "M+") return `${(value / 1000000).toFixed(1)}M+`;
  return `${Math.round(value)}${suffix || ""}`;
}

export default function AnimatedCounter({ value, suffix = "", className = "" }) {
  const counterRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!counterRef.current) return;
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

      if (prefersReducedMotion) {
        counterRef.current.textContent = formatValue(value, suffix);
        return;
      }

      const state = { current: 0 };
      trigger = ScrollTrigger.create({
        trigger: counterRef.current,
        start: "top 88%",
        once: true,
        onEnter: () => {
          gsap.to(state, {
            current: value,
            duration: 0.56,
            ease: "power2.out",
            onUpdate: () => {
              if (!counterRef.current) return;
              counterRef.current.textContent = formatValue(state.current, suffix);
            },
          });
        },
      });
    };

    init();

    return () => trigger && trigger.kill();
  }, [prefersReducedMotion, suffix, value]);

  return (
    <span ref={counterRef} className={className}>
      {formatValue(value, suffix)}
    </span>
  );
}
