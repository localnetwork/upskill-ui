import { useEffect, useRef } from "react";
import Link from "next/link";
import usePrefersReducedMotion from "./usePrefersReducedMotion";

export default function MagneticButton({
  href,
  children,
  className = "",
  as = "link",
  type = "button",
  onClick,
  ariaLabel,
}) {
  const ref = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!ref.current || prefersReducedMotion) return;

    let cleanup = () => {};

    const init = async () => {
      const gsapModule = await import("gsap");
      const gsap = gsapModule.gsap || gsapModule.default || gsapModule;
      if (!ref.current) return;

      const button = ref.current;
      const moveX = gsap.quickTo(button, "x", {
        duration: 0.35,
        ease: "power3.out",
      });
      const moveY = gsap.quickTo(button, "y", {
        duration: 0.35,
        ease: "power3.out",
      });

      const onMove = (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        moveX(x * 0.18);
        moveY(y * 0.18);
      };

      const reset = () => {
        moveX(0);
        moveY(0);
      };

      button.addEventListener("mousemove", onMove);
      button.addEventListener("mouseleave", reset);

      cleanup = () => {
        button.removeEventListener("mousemove", onMove);
        button.removeEventListener("mouseleave", reset);
      };
    };

    init();

    return () => cleanup();
  }, [prefersReducedMotion]);

  const sharedProps = {
    ref,
    className,
    "aria-label": ariaLabel,
  };

  if (as === "button") {
    return (
      <button {...sharedProps} type={type} onClick={onClick}>
        {children}
      </button>
    );
  }

  return (
    <Link {...sharedProps} href={href || "#"}>
      {children}
    </Link>
  );
}
