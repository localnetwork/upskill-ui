import FeaturedCourses from "@/components/blocks/FeaturedCourses";
import HomeBanner from "@/components/blocks/HomeBanner";
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
      <FeaturedCourses />
    </>
  );
}
