import CallToActions from "@/components/blocks/CallToActions";
import FAQsBlock from "@/components/blocks/FAQsBlock";
import FeaturedTabs from "@/components/blocks/FeaturedTabs";
import FeaturedCourses from "@/components/blocks/FeaturedTabs";
import HomeBanner from "@/components/blocks/HomeBanner";
import Testimonials from "@/components/blocks/Testimonials";
import Meta from "@/components/partials/Meta";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <Meta
        title="Upskill UI"
        description="A modern and responsive UI library for building web applications."
      />

      <HomeBanner />

      <CallToActions />

      <FeaturedTabs />

      <Testimonials />
      <FAQsBlock />
    </>
  );
}
