import BaseApi from "@/lib/api/_base.api";
import { useEffect } from "react";

export default function ArticlePreview({ lecture, course, setCourse }) {
  // ✅ Add progress when finished
  const addProgress = async () => {
    try {
      // ✅ Check if lecture exists before accessing properties
      if (!lecture || !lecture.id) {
        console.warn("⚠️ Lecture is not ready yet");
        return;
      }

      await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/course-curriculums/add-progress",
        {
          course_id: course?.id,
          curriculum_id: lecture.id,
        }
      );
      console.log("✅ Progress saved for", lecture.title);
    } catch (error) {
      console.error("❌ Error adding progress:", error);
    }
  };

  useEffect(() => {
    // ✅ Only call addProgress if lecture exists
    if (lecture?.id) {
      addProgress();

      setCourse((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((section) => ({
            ...section,
            curriculums: section.curriculums.map((c) =>
              c.id === lecture.id ? { ...c, is_taken: true } : c
            ),
          })),
        };
      });
    }
  }, [lecture]);

  console.log("lecture", lecture);

  return (
    <div className="bg-white text-[25px] overflow-y-auto w-full h-[500px] shadow-md absolute top-0 left-0 p-6 prose prose-sm md:prose-base lg:prose-lg xl:prose-xl 2xl:prose-2xl">
      <div
        className="max-w-[500px] article-preview-description mx-auto"
        dangerouslySetInnerHTML={{
          __html: lecture?.asset?.content || "<p>Loading...</p>",
        }}
      />
    </div>
  );
}
