import { useEffect } from "react";
import CourseSidebar from "../entities/course/CourseSidebar";
import CourseStripBar from "../entities/course/CourseStripbar";
import CourseApprovalReadiness, {
  usePayoutConnected,
} from "../entities/course/CourseApprovalReadiness";
import courseStore from "@/lib/store/courseStore";

export default function CourseManagementLayout({
  children,
  course,
  title,
  activeTab,
}) {
  const courseManagement = courseStore((state) => state.courseManagement);
  const payoutConnected = usePayoutConnected();

  useEffect(() => {
    courseStore.setState({ courseManagement: course });
  }, [course]);

  const parseDate = (value) => {
    const timestamp = value ? new Date(value).getTime() : 0;
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const activeCourse =
    courseManagement?.uuid === course?.uuid
      ? parseDate(courseManagement?.updatedAt) >= parseDate(course?.updatedAt)
        ? { ...course, ...courseManagement }
        : { ...courseManagement, ...course }
      : course;

  const readinessCourse = {
    ...(activeCourse || {}),
    sections: Array.isArray(activeCourse?.sections)
      ? activeCourse.sections
      : Array.isArray(course?.sections)
        ? course.sections
        : [],
    resources_count:
      activeCourse?.resources_count || course?.resources_count || {},
    goals: activeCourse?.goals || course?.goals || {},
    payoutConnected,
  };

  const showReadiness = [
    "basics",
    "curriculum",
    "intended-learners",
    "pricing",
  ].includes(String(activeTab || ""));

  return (
    <div className="flex min-w-0 flex-col text-[15px] font-light sm:text-[16px] lg:text-[17px]">
      <CourseStripBar course={course} />

      <div className="flex min-w-0 flex-col lg:flex-row">
        {/* Course navigation */}
        <div className="w-full min-w-0 lg:w-[260px] lg:shrink-0 xl:w-[300px]">
          <CourseSidebar course={course} />
        </div>

        {/* Main content */}
        <main className="w-full min-w-0 flex-1 p-4 sm:p-6 lg:p-8 xl:p-[50px]">
          <div className="shadow-box min-w-0 p-4 sm:p-6 lg:p-8 xl:p-[50px]">
            {/* Page heading */}
            <div className="mx-[-16px] mt-[-16px] border-b border-bottom px-4 py-5 sm:mx-[-24px] sm:mt-[-24px] sm:px-6 sm:py-6 lg:mx-[-32px] lg:mt-[-32px] lg:px-8 lg:py-7 xl:mx-[-50px] xl:mt-[-50px] xl:px-[50px] xl:py-[30px]">
              <h1 className="break-words text-2xl font-semibold sm:text-3xl">
                {title}
              </h1>
            </div>

            {/* Page content */}
            <div className="mt-6 min-w-0 space-y-6 sm:mt-8 lg:mt-[50px]">
              {showReadiness ? (
                <CourseApprovalReadiness course={readinessCourse} />
              ) : null}

              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
