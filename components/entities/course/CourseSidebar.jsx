import CourseAPI from "@/lib/api/course/request";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import courseStore from "@/lib/store/courseStore";
import { useMemo, useState } from "react";
import { getApprovalReadinessSummary } from "./CourseApprovalReadiness";
export default function CourseSidebar({ course }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courseManagement = courseStore((state) => state.courseManagement);

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

  const workflowStatus = String(
    activeCourse?.workflowStatus || activeCourse?.workflow_status || "DRAFT",
  ).toUpperCase();
  const isPublished =
    (activeCourse?.isPublished !== undefined
      ? activeCourse?.isPublished
      : activeCourse?.published) === true ||
    String(activeCourse?.published) === "1";

  const editingLinks = [
    {
      name: "Intended Learners",
      tab: "intended-learners",
      link: `/instructor/courses/${course?.uuid}/intended-learners`,
    },
    {
      name: "Curriculum",
      tab: "curriculum",
      link: `/instructor/courses/${course?.uuid}/curriculum`,
    },
    {
      name: "Basics",
      tab: "basics",
      link: `/instructor/courses/${course?.uuid}/basics`,
    },
    {
      name: "Pricing",
      tab: "pricing",
      link: `/instructor/courses/${course?.uuid}/pricing`,
    },
  ];

  const managementLinks = [
    {
      name: "Promotions",
      tab: "promotions",
      link: `/instructor/courses/${course?.uuid}/promotions`,
    },
    {
      name: "Statistics",
      tab: "statistics",
      link: `/instructor/courses/${course?.uuid}/statistics`,
    },
    {
      name: "Students",
      tab: "students",
      link: `/instructor/courses/${course?.uuid}/students`,
    },
    {
      name: "Reviews",
      tab: "reviews",
      link: `/instructor/courses/${course?.uuid}/reviews`,
    },
    {
      name: "Course Messages",
      tab: "course-messages",
      link: `/instructor/courses/${course?.uuid}/course-messages`,
    },
  ];

  const currentTab = useMemo(() => {
    const path = String(router.pathname || "");
    const parts = path.split("/").filter(Boolean);
    const last = String(parts[parts.length - 1] || "");
    if (last === "[slug]") return "basics";
    return last;
  }, [router.pathname]);

  const normalizeCourseState = (nextCourse = {}) => ({
    ...activeCourse,
    ...nextCourse,
    uuid:
      nextCourse?.uuid || nextCourse?.id || activeCourse?.uuid || course?.uuid,
    published:
      nextCourse?.published !== undefined
        ? String(nextCourse.published)
        : nextCourse?.isPublished
          ? "1"
          : "0",
  });

  const handleRequestForReview = async () => {
    const readiness = getApprovalReadinessSummary(activeCourse);
    if (readiness.score < 100) {
      toast.error(
        `Approval readiness is ${readiness.score}%. Complete all checklist items and check everything before requesting review.`,
      );
      return;
    }

    const confirm = window.confirm(
      "Submitting this course sends it for admin review. You can still edit after review decisions. Continue?",
    );
    if (!confirm) return;

    setIsSubmitting(true);
    try {
      const response = await CourseAPI.submitForReview(
        activeCourse?.uuid || course?.uuid,
      );
      const updatedCourse = response?.data?.data || {};
      toast.success("Course submitted for review");
      courseStore.setState({
        courseManagement: normalizeCourseState(updatedCourse),
      });
    } catch (error) {
      console.error("Error submitting course:", error);
      toast.error(error?.data?.message || "Error submitting course for review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnpublish = async () => {
    const confirm = window.confirm(
      "Drafting this course will remove it from public view but learners who enrolled will still have access to it. Are you sure you want to proceed?",
    );
    if (!confirm) return;

    setIsSubmitting(true);
    try {
      const response = await CourseAPI.unpublish(
        activeCourse?.uuid || course?.uuid,
      );
      const updatedCourse = response?.data?.data || {};
      toast.success("Course drafted successfully");
      courseStore.setState({
        courseManagement: normalizeCourseState(updatedCourse),
      });
    } catch (error) {
      console.error("Error unpublishing course:", error);
      toast.error(error?.data?.message || "Error unpublishing course");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    const confirm = window.confirm(
      "Publishing this course will make it visible to learners. Continue?",
    );
    if (!confirm) return;

    setIsSubmitting(true);
    try {
      const response = await CourseAPI.publish(
        activeCourse?.uuid || course?.uuid,
      );
      const updatedCourse = response?.data?.data || {};
      toast.success("Course published successfully");
      courseStore.setState({
        courseManagement: normalizeCourseState(updatedCourse),
      });
    } catch (error) {
      console.error("Error publishing course:", error);
      toast.error(error?.data?.message || "Error publishing course");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-[30px] pl-[50px] py-[50px] w-[300px] min-h-[calc(100vh-60px)]">
      <div className="sticky top-[190px]">
        <div className="mb-[30px]">
          <h2 className="text-[20px] font-semibold pl-[30px]">
            Course Editing
          </h2>
          <div>
            {editingLinks.map((item, index) => (
              <div key={index} className="">
                {(() => {
                  const isActive = currentTab === item.tab;
                  return (
                <Link
                  href={item.link}
                  className="relative text-[17px] py-[10px] block pl-[30px] hover:bg-[#f5f5f5]"
                >
                  {isActive && (
                    <span className="inline-block absolute left-0 top-0 w-[5px] bg-[#000] h-full" />
                  )}
                  {item.name}
                </Link>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
        <div className="mb-[30px]">
          <h2 className="text-[20px] font-semibold pl-[30px]">
            Course Management
          </h2>
          <div>
            {managementLinks.map((item, index) => (
              <div key={index} className="">
                {(() => {
                  const isActive = currentTab === item.tab;
                  return (
                <Link
                  href={item.link}
                  className="relative text-[17px] py-[10px] block pl-[30px] hover:bg-[#f5f5f5]"
                >
                  {isActive && (
                    <span className="inline-block absolute left-0 top-0 w-[5px] bg-[#000] h-full" />
                  )}
                  {item.name}
                </Link>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>

        <div>
          {isPublished ? (
            <button
              onClick={handleUnpublish}
              disabled={isSubmitting}
              className={`bg-[#0056D2] font-semibold text-white px-[20px] py-[10px] rounded-[5px] w-full hover:bg-[#1d6de0] ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Please wait..." : "Draft this Course"}
            </button>
          ) : ["DRAFT", "REJECTED"].includes(workflowStatus) ? (
            <button
              onClick={handleRequestForReview}
              disabled={isSubmitting}
              className={`bg-[#0056D2] font-semibold text-white px-[20px] py-[10px] rounded-[5px] w-full hover:bg-[#1d6de0] ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting
                ? "Please wait..."
                : workflowStatus === "REJECTED"
                  ? "Resubmit for Review"
                  : "Request for Review"}
            </button>
          ) : workflowStatus === "APPROVED" ? (
            <button
              onClick={handlePublish}
              disabled={isSubmitting}
              className={`bg-[#0056D2] font-semibold text-white px-[20px] py-[10px] rounded-[5px] w-full hover:bg-[#1d6de0] ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Please wait..." : "Publish this Course"}
            </button>
          ) : (
            <button
              disabled
              className="bg-[#0056D2] opacity-70 cursor-not-allowed font-semibold text-white px-[20px] py-[10px] rounded-[5px] w-full"
            >
              {workflowStatus === "PENDING_APPROVAL"
                ? "Pending Review"
                : workflowStatus === "REJECTED"
                  ? "Changes Required"
                  : "Under Review"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
