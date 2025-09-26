import CourseManagementLayout from "@/components/partials/CourseManagementLayout";
import InstructorLayout from "@/components/partials/InstructorLayout";
import BaseApi from "@/lib/api/_base.api";

export async function getServerSideProps(context) {
  const { slug } = context.params;

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

export default function IntendedLearners({ course }) {
  return (
    <CourseManagementLayout
      course={course}
      activeTab="intended-learners"
      title="Intended Learners"
    >
      Hello World
    </CourseManagementLayout>
  );
}
