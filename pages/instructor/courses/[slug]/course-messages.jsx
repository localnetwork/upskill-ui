import TextEditor from "@/components/forms/TextEditor";
import CourseManagementLayout from "@/components/partials/CourseManagementLayout";
import BaseApi from "@/lib/api/_base.api";
import { useState } from "react";
import toast from "react-hot-toast";

import { setContext } from "@/lib/api/interceptor";
export async function getServerSideProps(context) {
  const { slug } = context.params;

  setContext(context);

  let course = null;
  try {
    const response = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/courses/${slug}/manage`,
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

export default function CourseMessages({ course }) {
  const [payload, setPayload] = useState({
    welcome_message: course?.welcome_message || course?.welcomeMessage || "",
    congratulations_message:
      course?.congratulations_message || course?.congratulationsMessage || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (eOrPayload) => {
    const target = eOrPayload?.target || eOrPayload;
    if (!target?.name) return;
    setPayload((prev) => ({ ...prev, [target.name]: target.value || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!course?.id || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${course.id}/messages`,
        payload,
      );
      const data = response?.data?.data || {};
      setPayload({
        welcome_message: data.welcome_message || "",
        congratulations_message: data.congratulations_message || "",
      });
      toast.success("Course messages updated.");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update course messages.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CourseManagementLayout
      course={course}
      activeTab="course-messages"
      title="Course Messages"
    >
      <p className="mb-6">
        Write messages to your students (optional) that will be sent
        automatically when they join or complete your course to encourage
        students to engage with course content. If you do not wish to send a
        welcome or congratulations message, leave the text box blank.
      </p>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label>Welcome Message</label>
          <TextEditor
            name="welcome_message"
            onChange={handleChange}
            payload={payload}
            title="Welcome Message"
            placeholder="Welcome message for new students joining the course"
            initialValue={payload.welcome_message}
          />
        </div>

        <div>
          <label>Congratulations Message</label>
          <TextEditor
            name="congratulations_message"
            onChange={handleChange}
            payload={payload}
            title="Congratulations Message"
            placeholder="Congratulations message for students completing the course"
            initialValue={payload.congratulations_message}
          />
        </div>
        <div className="mt-[20px]">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#0056D2] flex items-center justify-center min-w-[200px] font-semibold text-white px-[30px] py-[10px] rounded-[5px] hover:bg-[#1d6de0] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Updating..." : "Update"}
          </button>
        </div>
      </form>
    </CourseManagementLayout>
  );
}
