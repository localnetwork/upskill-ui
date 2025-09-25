import InstructorLayout from "@/components/partials/InstructorLayout";
import BaseApi from "@/lib/api/_base.api";

// pages/instructor/courses/[uuid]/curriculum.js
export async function getServerSideProps(context) {
  // Dynamic segment comes from context.params

  const { slug } = context.params;
  console.log("slug:", slug); // => aa873256-d234-4001-8cde-4d09fede003a

  let course = null;
  try {
    const response = await BaseApi.get(
      process.env.NEXT_PUBLIC_API_URL + `/courses/${slug}`
    );
    course = response?.data?.data;
  } catch (error) {
    console.log("Error fetching course:", error);
    return {
      notFound: true,
    };
  }

  return {
    props: {
      course,
    },
  };
}

export default function CurriculumPage({ course }) {
  return (
    <InstructorLayout>
      <div>{course?.title}</div>
    </InstructorLayout>
  );
}
