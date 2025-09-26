import CourseManagementLayout from "@/components/partials/CourseManagementLayout";
import InstructorLayout from "@/components/partials/InstructorLayout";
import BaseApi from "@/lib/api/_base.api";
import { useState } from "react";
import courseStore from "@/lib/store/courseStore";
import dynamic from "next/dynamic";
import Image from "next/image";
import ImageUpload from "@/components/forms/ImageUpload";

const TextEditor = dynamic(() => import("@/components/forms/TextEditor"), {
  ssr: false, // 👈 disables SSR for this component
});
export async function getServerSideProps(context) {
  const { slug } = context.params;

  let course = null;
  try {
    const response = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/courses/${slug}`
    );
    course = response?.data?.data;

    console.log("response", response?.data?.data);
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

  const [payload, setPayload] = useState({
    title: courseManagement?.title || course?.title || "",
    description: courseManagement?.description || course?.description || "",
    subtitle: courseManagement?.subtitle || course?.subtitle || "",
    course_image: courseManagement?.course_image || course?.course_image || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    console.log("submitted!!!");
    e.preventDefault();
    courseStore.setState({
      courseManagement: { ...courseManagement, ...payload },
    });
    console.log("Updated Store:", payload);
  };

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
        className="mt-[30px] flex flex-col gap-y-[10px]"
        onSubmit={handleSubmit}
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
              className="border border-[oklch(67.22%_0.0355_279.77deg)] rounded-[5px] p-[10px] w-full"
            />
            <span className="text-[12px] absolute top-[15px] right-[15px] text-[oklch(30.98%_0.005_261.63deg)]">
              {payload.title.length}/60
            </span>
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
              className="border border-[oklch(67.22%_0.0355_279.77deg)] rounded-[5px] p-[10px] w-full"
            />
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
          <div className="relative z-1">
            <TextEditor
              name="description"
              onChange={handleChange}
              payload={payload}
            />

            <span className="text-[12px] absolute top-[15px] right-[15px] text-[oklch(30.98%_0.005_261.63deg)]">
              {payload.title.length}/500
            </span>
          </div>

          <p className="text-[14px] text-[oklch(30.98%_0.005_261.63deg)] mt-[10px]">
            Description should have minimum 200 words.
          </p>
        </div>

        <div>
          <label
            className="mb-2 block font-normal"
            htmlFor="instructional_level"
          >
            Course Level
          </label>
          <div className="relative">
            <select
              id="instructional_level"
              name="instructional_level"
              className="border border-[oklch(67.22%_0.0355_279.77deg)] rounded-[5px] p-[10px] w-full"
            >
              <option value="1">Beginner</option>
              <option value="2">Intermediate</option>
              <option value="3">Advanced</option>
              <option value="4">All Levels</option>
            </select>
          </div>
        </div>

        <ImageUpload
          onChange={handleChange}
          value={payload.course_image}
          name="course_image"
          label="Course Image"
          description="Upload your course image here. It must meet our course image quality
            standards to be accepted. Important guidelines: 750x422 pixels;
            .jpg, .jpeg,. gif, or .png. no text on the image."
        />

        <div className="mt-[20px]">
          <button
            type="submit"
            className="bg-[#0056D2] min-w-[200px] font-semibold text-white px-[30px] py-[10px] rounded-[5px] hover:bg-[#1d6de0]"
          >
            Update
          </button>
        </div>
      </form>
    </CourseManagementLayout>
  );
}
