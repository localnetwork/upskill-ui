import CourseAuthor from "@/components/entities/course/show/CourseAuthor";
import CourseDescription from "@/components/entities/course/show/CourseDescription";
import CourseInclusions from "@/components/entities/course/show/CourseInclusions";
import CourseLearnings from "@/components/entities/course/show/CourseLearnings";
import CourseRequirements from "@/components/entities/course/show/CourseRequirements";
import CourseSections from "@/components/entities/course/show/CourseSections";
import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import { ChevronLeft, Eye } from "lucide-react";
import Link from "next/link";

function normalizeRoleNames(roles) {
  if (!Array.isArray(roles)) return [];
  return roles
    .map((role) => {
      if (!role) return "";
      if (typeof role === "string") return role.toUpperCase();
      if (typeof role === "object") {
        if (role.name) return String(role.name).toUpperCase();
        if (role.role_name) return String(role.role_name).toUpperCase();
        if (role.role) return String(role.role).toUpperCase();
      }
      return "";
    })
    .filter(Boolean);
}

function formatWorkflowStatus(status) {
  const normalized = String(status || "DRAFT")
    .toLowerCase()
    .replace(/_/g, " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export async function getServerSideProps(context) {
  const { slug } = context.params;
  setContext(context);

  try {
    const meResponse = await BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`);
    const me = meResponse?.data?.data || {};
    const roles = normalizeRoleNames(me?.roles);
    const isAdmin = roles.includes("ADMIN");
    const isEducator = roles.includes("EDUCATOR");

    if (!isAdmin && !isEducator) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    const courseResponse = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/courses/${slug}/manage`,
    );
    const course = courseResponse?.data?.data || null;
    const authorId =
      course?.educatorId || course?.author?.data?.id || course?.educator?.id || null;
    const isOwner = Boolean(me?.id && authorId && me.id === authorId);

    if (!isAdmin && !isOwner) {
      return {
        redirect: {
          destination: "/instructor/courses",
          permanent: false,
        },
      };
    }

    return {
      props: {
        course,
      },
    };
  } catch (error) {
    if (error?.status === 401) {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }
    if (error?.status === 403) {
      return {
        redirect: {
          destination: "/instructor/courses",
          permanent: false,
        },
      };
    }

    return { notFound: true };
  }
}

export default function CourseDetailsPreviewPage({ course }) {
  const author = course?.author?.data || course?.educator || null;

  return (
    <div className="pb-[50px]">
      <header className="bg-[#0f172a] text-white py-10 lg:py-16 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
            <Link
              href={`/instructor/courses/${course?.uuid}/basics`}
              className="inline-flex items-center gap-2 rounded-md bg-white/10 hover:bg-white/20 px-3 py-2 text-sm font-semibold"
            >
              <ChevronLeft size={18} />
              Back to course management
            </Link>
            <Link
              href={`/instructor/courses/${course?.uuid}/preview`}
              className="inline-flex items-center gap-2 rounded-md bg-[#3588FC] hover:bg-[#1f6fe0] px-3 py-2 text-sm font-semibold"
            >
              <Eye size={18} />
              Open curriculum preview
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center rounded-full bg-[#1e293b] border border-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              Author/Admin Preview
            </span>
            <span className="inline-flex items-center rounded-full bg-[#1e293b] border border-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              {formatWorkflowStatus(course?.workflowStatus || course?.workflow_status)}
            </span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-black font-secondary leading-tight">
            {course?.title || "Course details"}
          </h1>
          <div
            className="text-lg text-slate-300 mt-4 max-w-4xl"
            dangerouslySetInnerHTML={{ __html: course?.subtitle || "" }}
          />
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-8 py-10">
        <div className="grid lg:grid-cols-[1fr_360px] gap-10">
          <div className="space-y-14">
            <section id="about">
              <h2 className="text-3xl font-black font-secondary mb-6">About this course</h2>
              <CourseDescription description={course?.description || ""} />
              <CourseLearnings course={course} />
            </section>

            <section className="content">
              <h2 className="text-3xl font-black font-secondary mb-6">Course content</h2>
              <CourseSections course={course} />
            </section>

            <section id="requirements">
              <h2 className="text-3xl font-black font-secondary mb-6">Requirements</h2>
              <CourseRequirements course={course} />
            </section>

            {author && (
              <section id="instructor">
                <h2 className="text-3xl font-black font-secondary mb-6">Instructor</h2>
                <CourseAuthor author={author} />
              </section>
            )}
          </div>

          <aside className="relative">
            <div className="lg:sticky lg:top-24 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="w-full aspect-video bg-slate-100 overflow-hidden">
                {course?.cover_image?.path ? (
                  <img
                    src={course.cover_image.path}
                    alt={course?.title || "Course cover"}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-3xl font-black">
                    {course?.price_tier?.title?.toLowerCase() === "free"
                      ? "Free"
                      : course?.price_tier?.price || "N/A"}
                  </h3>
                </div>

                <h4 className="font-bold mb-4">This course includes:</h4>
                <CourseInclusions course={course} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
