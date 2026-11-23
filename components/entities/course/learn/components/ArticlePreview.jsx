import { postOrQueue } from "@/lib/offline/queue";
import { useEffect } from "react";
import LectureResourcesList from "../LectureResourcesList";

export default function ArticlePreview({ lecture, course, setCourse }) {
  // ✅ Add progress when finished
  const addProgress = async () => {
    try {
      // ✅ Check if lecture exists before accessing properties
      if (!lecture || !lecture.id) {
        console.warn("⚠️ Lecture is not ready yet");
        return;
      }

      await postOrQueue(
        process.env.NEXT_PUBLIC_API_URL + "/course-curriculums/add-progress",
        {
          course_id: course?.id,
          curriculum_id: lecture.id,
        },
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
              c.id === lecture.id ? { ...c, is_taken: true } : c,
            ),
          })),
        };
      });
    }
  }, [lecture]);

  return (
    <div className="bg-white overflow-y-auto shadow-md absolute inset-0 p-4 sm:p-6 break-words">
      <div
        className="max-w-[800px] rich-content article-preview-description mx-auto"
        dangerouslySetInnerHTML={{
          __html: lecture?.asset?.content || "<p>Loading...</p>",
        }}
      />
      <div className="max-w-[800px] mx-auto">
        <LectureResourcesList resources={lecture?.resources} />
      </div>
    </div>
  );
}
