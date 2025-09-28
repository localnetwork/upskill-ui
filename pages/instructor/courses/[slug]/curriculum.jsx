import CourseManagementLayout from "@/components/partials/CourseManagementLayout";
import InstructorLayout from "@/components/partials/InstructorLayout";
import BaseApi from "@/lib/api/_base.api";

import { setContext } from "@/lib/api/interceptor";
export async function getServerSideProps(context) {
  const { slug } = context.params;

  setContext(context);

  let course = null;
  try {
    const response = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/courses/${slug}`
    );
    course = response?.data?.data;
  } catch (error) {
    console.error("Error fetching course:", error);
    return { notFound: true };
  }

  return {
    props: { course },
  };
}

export default function CurriculumPage({ course }) {
  return (
    <CourseManagementLayout
      course={course}
      activeTab="curriculum"
      title="Curriculum"
    >
      <p>
        Start putting together your course by creating sections, lectures and
        practice (quizzes, coding exercises and assignments).
      </p>
    </CourseManagementLayout>
  );
}
