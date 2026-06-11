import CourseAPI from "@/lib/api/course/request";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import courseStore from "@/lib/store/courseStore";
import { useState } from "react";
export default function CourseSidebar({ course }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courseManagement = courseStore((state) => state.courseManagement);
  const activeCourse = courseManagement?.uuid === course?.uuid ? courseManagement : course;
  const workflowStatus = activeCourse?.workflowStatus || activeCourse?.workflow_status || "DRAFT";
  const isPublished =
    String(activeCourse?.published) === "1" || activeCourse?.isPublished === true;

  const editingLinks = [
    {
      name: "Intended Learners",
      link: `/instructor/courses/${course?.uuid}/intended-learners`,
    },
    {
      name: "Curriculum",
      link: `/instructor/courses/${course?.uuid}/curriculum`,
    },
    {
      name: "Basics",
      link: `/instructor/courses/${course?.uuid}/basics`,
    },
    {
      name: "Pricing",
      link: `/instructor/courses/${course?.uuid}/pricing`,
    },
  ];

  const managementLinks = [
    {
      name: "Students",
      link: `/instructor/courses/${course?.uuid}/students`,
    },
  ];

  const normalizeCourseState = (nextCourse = {}) => ({
    ...activeCourse,
    ...nextCourse,
    uuid: nextCourse?.uuid || nextCourse?.id || activeCourse?.uuid || course?.uuid,
    published:
      nextCourse?.published !== undefined
        ? String(nextCourse.published)
        : nextCourse?.isPublished
          ? "1"
          : "0",
  });

  const handleRequestForReview = async () => {
    const confirm = window.confirm(
      "Submitting this course sends it for admin review. You can still edit after review decisions. Continue?",
    );
    if (!confirm) return;

    setIsSubmitting(true);
    try {
      const response = await CourseAPI.submitForReview(activeCourse?.uuid || course?.uuid);
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
      const response = await CourseAPI.unpublish(activeCourse?.uuid || course?.uuid);
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
                <Link
                  href={item.link}
                  className={`${
                    router.asPath === item.link ? "" : ""
                  } relative text-[17px] py-[10px] block pl-[30px] hover:bg-[#f5f5f5]`}
                >
                  {router.asPath === item.link && (
                    <span className="inline-block absolute left-0 top-0 w-[5px] bg-[#000] h-full" />
                  )}
                  {item.name}
                </Link>
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
                <Link
                  href={item.link}
                  className={`${
                    router.asPath === item.link ? "" : ""
                  } relative text-[17px] py-[10px] block pl-[30px] hover:bg-[#f5f5f5]`}
                >
                  {router.asPath === item.link && (
                    <span className="inline-block absolute left-0 top-0 w-[5px] bg-[#000] h-full" />
                  )}
                  {item.name}
                </Link>
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
          ) : workflowStatus === "DRAFT" ? (
            <button
              onClick={handleRequestForReview}
              disabled={isSubmitting}
              className={`bg-[#0056D2] font-semibold text-white px-[20px] py-[10px] rounded-[5px] w-full hover:bg-[#1d6de0] ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Please wait..." : "Request for Review"}
            </button>
          ) : (
            <button
              disabled
              className="bg-[#0056D2] opacity-70 cursor-not-allowed font-semibold text-white px-[20px] py-[10px] rounded-[5px] w-full"
            >
              {workflowStatus === "PENDING_APPROVAL" ? "Pending Review" : "Under Review"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
