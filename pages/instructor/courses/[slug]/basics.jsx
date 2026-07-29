import CourseManagementLayout from "@/components/partials/CourseManagementLayout";
import Select from "@/components/forms/Select";
import InstructorLayout from "@/components/partials/InstructorLayout";
import SlugField from "@/components/forms/SlugField";
import BaseApi from "@/lib/api/_base.api";
import { useCallback, useEffect, useState } from "react";
import courseStore from "@/lib/store/courseStore";
import dynamic from "next/dynamic";
import Image from "next/image";
import Spinner from "@/components/icons/Spinner";
import toast from "react-hot-toast";
import { extractErrors } from "@/lib/services/errorsExtractor";

const TextEditor = dynamic(() => import("@/components/forms/TextEditor"), {
  ssr: false,
});

const ImageUpload = dynamic(() => import("@/components/forms/ImageUpload"), {
  ssr: false,
});

import { setContext } from "@/lib/api/interceptor";
import PromoVideoUpload from "@/components/forms/PromoVideoUpload";
import CategoryPicker, {
  getMergedCategoryIds,
  resolveInitialValue,
} from "@/components/forms/CategoryPicker";

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

export default function CourseBasics({ course }) {
  const courseManagement = courseStore((state) => state.courseManagement);
  const [isLoading, setIsLoading] = useState(false);
  const [levels, setLevels] = useState([]);
  const [languages, setLanguages] = useState([]);

  const normalizeLevelValue = (value) => {
    if (!value) return "";
    if (typeof value === "object") {
      return String(value.id || value.value || "");
    }
    return String(value);
  };

  const initialInstructionalLevel =
    normalizeLevelValue(courseManagement?.instructional_level) ||
    normalizeLevelValue(course?.instructional_level?.id) ||
    normalizeLevelValue(course?.instructional_level);

  const [payload, setPayload] = useState({
    title: courseManagement?.title || course?.title || "",
    slug: courseManagement?.slug || course?.slug || "",
    description: courseManagement?.description || course?.description || "",
    subtitle: courseManagement?.subtitle || course?.subtitle || "",
    language: courseManagement?.language || course?.language || "",
    cover_image: courseManagement?.cover_image || course?.cover_image || "",
    promo_video: courseManagement?.promo_video || course?.promo_video || "",
    instructional_level: initialInstructionalLevel,
    category_ids: resolveInitialValue(
      (courseManagement?.category_ids || course?.category_ids || []).map(
        (cat) => String(cat.category_id ?? cat),
      ),
    ),
  });

  const [errors, setErrors] = useState(null);
  const [slugStatus, setSlugStatus] = useState({
    isChecking: false,
    isAvailable: true,
    isValid: true,
    message: "",
  });

  const normalizeMediaId = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object" && value.id) return String(value.id);
    return "";
  };

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

  const checkCourseSlugAvailability = useCallback(
    async (slugValue) => {
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/slug-availability?slug=${encodeURIComponent(slugValue)}&excludeCourseId=${encodeURIComponent(String(course?.id || course?.uuid || ""))}&nocache=true`,
      );
      return { isAvailable: Boolean(response?.data?.data?.isAvailable) };
    },
    [course?.id, course?.uuid],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!slugStatus.isValid) {
      toast.error(slugStatus.message || "Slug is invalid.");
      return;
    }
    if (slugStatus.isChecking) {
      toast.error("Slug availability is still being checked.");
      return;
    }
    if (!slugStatus.isAvailable) {
      toast.error("Slug already exists.");
      return;
    }

    setIsLoading(true);

    const submitPayload = {
      ...payload,
      slug: String(payload.slug || "").trim(),
      category_ids: getMergedCategoryIds(payload.category_ids),
      cover_image: normalizeMediaId(payload.cover_image),
      promo_video: normalizeMediaId(payload.promo_video),
    };

    courseStore.setState({
      courseManagement: { ...courseManagement, ...payload },
    });

    toast.dismiss();

    try {
      const response = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${course?.uuid}`,
        submitPayload,
      );
      toast.success("Course updated successfully");
      setErrors(null);
    } catch (error) {
      toast.error(
        error?.data?.message || "An error occured. Please try again later.",
      );

      setErrors(error?.data?.details?.issues || null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchCourseBasicsOptions = async () => {
      try {
        const [levelsRes, languagesRes] = await Promise.all([
          BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/course-levels`),
          BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/languages`),
        ]);

        setLevels(
          Array.isArray(levelsRes?.data)
            ? levelsRes.data
            : Array.isArray(levelsRes?.data?.data)
              ? levelsRes.data.data
              : [],
        );

        const languageRows = Array.isArray(languagesRes?.data?.data)
          ? languagesRes.data.data
          : [];

        const groupedLanguages = languageRows.reduce((map, item) => {
          const value = String(item?.value || item?.label || "").trim();
          const label = String(item?.label || item?.value || "").trim();
          if (!value || !label) return map;

          const groupLabel = String(item?.group || "Philippines").trim();
          const groupKey = groupLabel;

          if (!map.has(groupKey)) {
            map.set(groupKey, []);
          }

          const existing = map.get(groupKey);
          if (!existing.some((row) => String(row.value) === value)) {
            existing.push({ value, label });
          }

          return map;
        }, new Map());

        setLanguages(
          Array.from(groupedLanguages.entries()).map(([group, options]) => ({
            group,
            options: options.sort((a, b) =>
              String(a.label).localeCompare(String(b.label)),
            ),
          })),
        );
      } catch (_error) {
        setLevels([]);
        setLanguages([]);
      }
    };

    fetchCourseBasicsOptions();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        const form = document.querySelector("form[data-save-form]");
        if (form) {
          form.requestSubmit();
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
        Your course landing page is crucial to your success on Upskill. If it's
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
                extractErrors(errors, "title")
                  ? "border-red-500"
                  : "border-[oklch(67.22%_0.0355_279.77deg)]"
              } border rounded-[5px] p-[10px] w-full`}
            />
            <span className="text-[12px] absolute top-[15px] right-[15px] text-[oklch(30.98%_0.005_261.63deg)]">
              {payload.title.length}/60
            </span>

            {extractErrors(errors, "title") && (
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
          <SlugField
            label="Course Slug"
            value={payload.slug}
            sourceValue={payload.title}
            placeholder="learn-php-programming-from-scratch"
            maxLength={150}
            resetKey={String(course?.id || course?.uuid || "course")}
            enableCustomizeToggle
            customizeLabel="Customize slug"
            onChange={(slugValue) =>
              setPayload((prev) => ({ ...prev, slug: slugValue }))
            }
            onStatusChange={setSlugStatus}
            checkAvailability={checkCourseSlugAvailability}
          />
          {extractErrors(errors, "slug") && (
            <p className="text-red-500 text-[12px] mt-1 errrr">
              {extractErrors(errors, "slug")}
            </p>
          )}
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
              maxLength={120}
              className={`${
                extractErrors(errors, "subtitle")
                  ? "border-red-500"
                  : "border-[oklch(67.22%_0.0355_279.77deg)]"
              } border rounded-[5px] p-[10px] w-full`}
            />
            {extractErrors(errors, "subtitle") && (
              <p className="text-red-500 text-[12px] mt-1 errrr">
                {extractErrors(errors, "subtitle")}
              </p>
            )}
            <span className="text-[12px] absolute top-[15px] right-[15px] text-[oklch(30.98%_0.005_261.63deg)]">
              {payload.subtitle.length}/120
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
              extractErrors(errors, "description")
                ? "border border-red-500"
                : ""
            }`}
          >
            <TextEditor
              name="description"
              onChange={handleChange}
              value={payload.description || ""}
              initialValue={
                courseManagement?.description || course?.description || ""
              }
            />
          </div>
          {extractErrors(errors, "description") && (
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
            Course Level
          </label>
          <div className="relative">
            <Select
              id="instructional_level"
              name="instructional_level"
              className="border border-[oklch(67.22%_0.0355_279.77deg)] rounded-[5px] p-[10px] w-full"
              value={payload.instructional_level}
              onChange={handleChange}
            >
              <option value="">-- Select level --</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.title}
                </option>
              ))}
              <option value="4">All Levels</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="mb-2 block font-normal" htmlFor="language">
            Course Language
          </label>
          <div className="relative">
            <select
              id="language"
              name="language"
              className="border border-[oklch(67.22%_0.0355_279.77deg)] rounded-[5px] p-[10px] w-full bg-white"
              value={payload.language || ""}
              onChange={handleChange}
            >
              <option value="">-- Select language --</option>
              {languages.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.options.map((language) => (
                    <option key={language.value} value={language.value}>
                      {language.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {extractErrors(errors, "language") && (
              <p className="text-red-500 text-[12px] mt-1 errrr">
                {extractErrors(errors, "language")}
              </p>
            )}
          </div>
        </div>

        <CategoryPicker
          label="Course Category"
          name="category_ids"
          value={payload.category_ids}
          onChange={(selected) =>
            setPayload((prev) => ({ ...prev, category_ids: selected }))
          }
          error={extractErrors(errors, "category_ids")}
        />

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

        <PromoVideoUpload
          onChange={handleChange}
          value={courseManagement?.promo_video || payload?.promo_video || ""}
          title={payload?.title || ""}
          courseManagement={courseManagement}
          name="promo_video"
          label="Promotional Video"
          description="Your promo video is a quick and compelling way for students to preview what they'll learn in your course. Students considering your course are more likely to enroll if your promo video is well-made."
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
