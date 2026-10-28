import { useEffect, useRef, useState } from "react";
import HomeHeroSection from "./sections/HomeHeroSection";
import HomeWelcomeBanner from "./sections/HomeWelcomeBanner";
import HomeGoalsBar from "./sections/HomeGoalsBar";
import HomeLearnerSections from "./sections/HomeLearnerSections";
import persistentStore from "@/lib/store/persistentStore";
import CompanyLogosSection from "./sections/CompanyLogosSection";
import FeaturedCoursesSection from "./sections/FeaturedCoursesSection";
import PopularSkillsSection from "./sections/PopularSkillsSection";
import StudentSuccessSection from "./sections/StudentSuccessSection";
import CategoriesSection from "./sections/CategoriesSection";
import CertificationPrepSection from "./sections/CertificationPrepSection";
import FinalCTA from "@/components/blocks/FinalCTA";
import usePrefersReducedMotion from "./usePrefersReducedMotion";
import ExploreByCategorySection from "./sections/ExploreByCategorySection";
import PopularSkillsByCategorySection from "./sections/PopularSkillsByCategorySection";
import WhyLearnersChooseSection from "./sections/WhyLearnersChooseSection";
import LearningPathsSection from "./sections/LearningPathsSection";
import FeaturedCoursesCarouselSection from "./sections/FeaturedCoursesCarouselSection";

export default function HomePageExperience() {
  const wrapperRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const profile = persistentStore((state) => state.profile);
  const [mounted, setMounted] = useState(false);
  const showWelcomeBanner = (profile?.roles || []).some(
    (role) => role === "EDUCATOR" || role === "LEARNER",
  );

  useEffect(() => setMounted(true), []);
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
      {mounted && profile && showWelcomeBanner ? (
        <HomeWelcomeBanner profile={profile} />
      ) : (
        <>
          <HomeHeroSection />
          {mounted && !profile && <HomeGoalsBar />}
        </>
      )}

      <LearningPathsSection />
      {mounted && profile && (
        <HomeLearnerSections
          trendingOnly={(profile.roles || []).includes("EDUCATOR")}
        />
      )}
      <ExploreByCategorySection />

      <FeaturedCoursesCarouselSection />
      <PopularSkillsByCategorySection />
      <WhyLearnersChooseSection />
    </div>
  );
}
