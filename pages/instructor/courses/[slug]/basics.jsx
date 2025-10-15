import CourseManagementLayout from "@/components/partials/CourseManagementLayout";
import InstructorLayout from "@/components/partials/InstructorLayout";
import BaseApi from "@/lib/api/_base.api";
import { useEffect, useState } from "react";
import courseStore from "@/lib/store/courseStore";
import dynamic from "next/dynamic";
import Image from "next/image";
// import ImageUpload from "@/components/forms/ImageUpload";
import Spinner from "@/components/icons/Spinner";
import toast from "react-hot-toast";
import { extractErrors } from "@/lib/services/errorsExtractor";
const TextEditor = dynamic(() => import("@/components/forms/TextEditor"), {
  ssr: false, // 👈 disables SSR for this component
});

const ImageUpload = dynamic(() => import("@/components/forms/ImageUpload"), {
  ssr: false, // 👈 disables SSR for this component
});

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

export default function CourseBasics({ course }) {
  const courseManagement = courseStore((state) => state.courseManagement);
  const [isLoading, setIsLoading] = useState(false);

  const [payload, setPayload] = useState({
    title: courseManagement?.title || course?.title || "",
    description: courseManagement?.description || course?.description || "",
    subtitle: courseManagement?.subtitle || course?.subtitle || "",
    cover_image: courseManagement?.cover_image || course?.cover_image || "",
    instructional_level:
      courseManagement?.instructional_level ||
      course?.instructional_level ||
      "",
  });

  const [errors, setErrors] = useState(null);

  const handleChange = (eOrPayload, maybe) => {
    let target = null;

    if (maybe && maybe.target) {
      target = maybe.target;
    } else if (eOrPayload && eOrPayload.target) {
      target = eOrPayload.target;
    } else if (
      eOrPayload &&
      typeof eOrPayload === "object" &&
      "name" in eOrPayload &&
      "value" in eOrPayload
    ) {
      target = eOrPayload;
    }

    if (!target) {
      console.warn("handleChange: no target found", { eOrPayload, maybe });
      return;
    }

    const { name, value } = target;
    if (!name) {
      console.warn("handleChange: target has no name", target);
      return;
    }

    setPayload((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    courseStore.setState({
      courseManagement: { ...courseManagement, ...payload },
    });
    toast.dismiss();
    try {
      const response = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${course?.uuid}`,
        payload
      );
      setIsLoading(false);
      toast.success("Course updated successfully");
      setErrors(null);
    } catch (error) {
      toast.error(
        error?.data?.message || "An error occured. Please try again later."
      );
      setErrors(error?.data.errors || null);
    } finally {
      setIsLoading(false);
    }
  };

  // ⬇️ ADD THIS
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S (Windows/Linux) or Cmd+S (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault(); // stop browser save dialog
        // Manually trigger form submission
        const form = document.querySelector("form[data-save-form]");
        if (form) {
          form.requestSubmit(); // modern way to trigger submit event
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <CourseManagementLayout
      course={course}
      activeTab="basics"
      title="Course Landing Page"
    >
      <p>
        Your course landing page is crucial to your success on Upskill. If it’s
        done right, it can also help you gain visibility in search engines like
        Google. As you complete this section, think about creating a compelling
        Course Landing Page that demonstrates why someone would want to enroll
        in your course.
      </p>

      <form
        className="mt-[30px] flex flex-col gap-y-[15px]"
        onSubmit={handleSubmit}
        data-save-form
      >
        <div>
          <label className="mb-2 block font-normal" htmlFor="title">
            Course Title
          </label>
          <div className="relative">
            <input
              id="title"
              name="title"
              value={payload.title}
              onChange={handleChange}
              placeholder="e.g. Learn PHP Programming from scratch."
              type="text"
              maxLength={60}
              className={`${
                errors?.title
                  ? "border-red-500"
                  : "border-[oklch(67.22%_0.0355_279.77deg)]"
              } border rounded-[5px] p-[10px] w-full`}
            />
            <span className="text-[12px] absolute top-[15px] right-[15px] text-[oklch(30.98%_0.005_261.63deg)]">
              {payload.title.length}/60
            </span>

            {errors?.title && (
              <p className="text-red-500 text-[12px] mt-1 errrr">
                {extractErrors(errors, "title")}
              </p>
            )}
          </div>

          <p className="text-[14px] text-[oklch(30.98%_0.005_261.63deg)] mt-[10px]">
            Your title should be attention-grabbing, informative, and optimized
            for search
          </p>
        </div>
        <div>
          <label className="mb-2 block font-normal" htmlFor="subtitle">
            Course Subtitle
          </label>
          <div className="relative">
            <input
              id="subtitle"
              name="subtitle"
              value={payload.subtitle}
              onChange={handleChange}
              placeholder="Insert your course subtitle"
              type="text"
              maxLength={60}
              className={`${
                errors?.subtitle
                  ? "border-red-500"
                  : "border-[oklch(67.22%_0.0355_279.77deg)]"
              } border rounded-[5px] p-[10px] w-full`}
            />
            {errors?.subtitle && (
              <p className="text-red-500 text-[12px] mt-1 errrr">
                {extractErrors(errors, "subtitle")}
              </p>
            )}
            <span className="text-[12px] absolute top-[15px] right-[15px] text-[oklch(30.98%_0.005_261.63deg)]">
              {payload.title.length}/120
            </span>
          </div>

          <p className="text-[14px] text-[oklch(30.98%_0.005_261.63deg)] mt-[10px]">
            Use 1 or 2 related keywords, and mention 3-4 of the most important
            areas that you've covered during your course.
          </p>
        </div>

        <div>
          <label className="mb-2 block font-normal" htmlFor="description">
            Course Description
          </label>

          <div
            className={`relative z-1 rounded-md ${
              errors?.description ? "border border-red-500" : ""
            }`}
          >
            <TextEditor
              name="description"
              onChange={handleChange}
              payload={payload}
              initialValue={
                courseManagement?.description || course?.description || ""
              }
            />
          </div>
          {errors?.description && (
            <p className="text-red-500 text-[12px] mt-1 errrr">
              {extractErrors(errors, "description")}
            </p>
          )}
          <span className="text-[12px] text-[oklch(30.98%_0.005_261.63deg)]">
            {payload.description.length}/5000
          </span>

          <p className="text-[14px] text-[oklch(30.98%_0.005_261.63deg)] mt-[10px]">
            Description should have minimum 200 words.
          </p>
        </div>

        <div>
          <label
            className="mb-2 block font-normal"
            htmlFor="instructional_level"
          >
            Course
          </label>
          <div className="relative">
            <select
              id="instructional_level"
              name="instructional_level"
              className="border border-[oklch(67.22%_0.0355_279.77deg)] rounded-[5px] p-[10px] w-full"
              value={payload.instructional_level}
              onChange={handleChange}
            >
              <option value="">-- Select level --</option>
              <option value="1">Beginner</option>
              <option value="2">Intermediate</option>
              <option value="3">Advanced</option>
              <option value="4">All Levels</option>
            </select>
          </div>
        </div>

        <ImageUpload
          onChange={handleChange}
          value={courseManagement?.cover_image || payload?.cover_image || ""}
          title={payload?.title || ""}
          name="cover_image"
          label="Course Image"
          description="Upload your course image here. It must meet our course image quality
            standards to be accepted. Important guidelines: 750x422 pixels;
            .jpg, .jpeg,. gif, or .png. no text on the image."
        />

        <div className="mt-[20px]">
          <button
            type="submit"
            className={`bg-[#0056D2] flex items-center justify-center min-w-[200px] font-semibold text-white px-[30px] py-[10px] rounded-[5px] hover:bg-[#1d6de0] ${
              isLoading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {isLoading && (
              <Spinner className="w-5 h-5 text-white animate-spin opacity-30 mr-2" />
            )}
            {isLoading ? "Updating..." : "Update"}
          </button>
        </div>
      </form>
    </CourseManagementLayout>
  );
}
