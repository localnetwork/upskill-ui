import { useEffect, useRef } from "react";
import HomeHeroSection from "./sections/HomeHeroSection";
import CompanyLogosSection from "./sections/CompanyLogosSection";
import FeaturedCoursesSection from "./sections/FeaturedCoursesSection";
import PopularSkillsSection from "./sections/PopularSkillsSection";
import StudentSuccessSection from "./sections/StudentSuccessSection";
import CategoriesSection from "./sections/CategoriesSection";
import CertificationPrepSection from "./sections/CertificationPrepSection";
import FinalCTA from "@/components/blocks/FinalCTA";
import usePrefersReducedMotion from "./usePrefersReducedMotion";
import HomePopular from "./sections/HomePopular";
import HomepageSkillsTransform from "./sections/HomepageSkillsTransform";

export default function HomePageExperience() {
  const wrapperRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!wrapperRef.current || prefersReducedMotion) return;

    let sectionAnimations = [];
    let pageTimeline;

    const init = async () => {
      const gsapModule = await import("gsap");
      const scrollTriggerModule = await import("gsap/ScrollTrigger");
      const gsap = gsapModule.gsap || gsapModule.default || gsapModule;
      const ScrollTrigger =
        scrollTriggerModule.ScrollTrigger ||
        scrollTriggerModule.default ||
        scrollTriggerModule;

      gsap.registerPlugin(ScrollTrigger);

      pageTimeline = gsap.timeline();
      pageTimeline.fromTo(
        wrapperRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.48, ease: "power2.out" },
      );

      const sections = wrapperRef.current.querySelectorAll(
        "[data-home-section]",
      );
      sections.forEach((section) => {
        const animation = gsap.fromTo(
          section,
          { opacity: 0.92, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.54,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 86%",
              once: true,
            },
          },
        );
        sectionAnimations.push(animation);
      });
    };

    init();

    return () => {
      sectionAnimations.forEach((animation) => animation && animation.kill());
      sectionAnimations = [];
      if (pageTimeline) pageTimeline.kill();
    };
  }, [prefersReducedMotion]);

  return (
    <div ref={wrapperRef}>
      <HomeHeroSection />
      <HomePopular />
      <HomepageSkillsTransform />
      {/* <CompanyLogosSection />
      <FeaturedCoursesSection />
      <PopularSkillsSection /> 
      <StudentSuccessSection />
      <CategoriesSection />
      <CertificationPrepSection />
      <FinalCTA /> */}
    </div>
  );
}
