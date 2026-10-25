import CourseManagementLayout from "@/components/partials/CourseManagementLayout";
import CommunityView from "@/components/entities/community/CommunityView";
import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";

export async function getServerSideProps(context) {
  const { slug } = context.params;
  setContext(context);

  try {
    const response = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/courses/${slug}/manage`,
    );
    return {
      props: {
        course: response?.data?.data || null,
        courseSlug: slug,
      },
    };
  } catch (_error) {
    return { notFound: true };
  }
}

export default function CourseCommunityManagement({ course, courseSlug }) {
  return (
    <CourseManagementLayout course={course} title="Community" activeTab="community">
      <CommunityView slug={courseSlug} allowSettings />
    </CourseManagementLayout>
  );
}
