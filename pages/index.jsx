import HomePageExperience from "@/components/home/HomePageExperience";
import Meta from "@/components/partials/Meta";

export default function Home() {
  return (
    <>
      <Meta
        title="Upskill Learning"
        description="Premium online learning with project-based paths, expert mentorship, and career-focused courses."
        keywords="online learning, career upskilling, tech courses, project based learning, certification"
      />
      <HomePageExperience />
    </>
  );
}
