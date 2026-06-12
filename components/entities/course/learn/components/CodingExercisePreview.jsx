import { useMemo, useState } from "react";
import BaseApi from "@/lib/api/_base.api";

export default function CodingExercisePreview({ lecture, course, setCourse }) {
  const [activeLanguage, setActiveLanguage] = useState(
    lecture?.asset?.languages?.[0] || "javascript",
  );
  const [submitting, setSubmitting] = useState(false);

  const starterCode = useMemo(
    () => lecture?.asset?.starter_code?.[activeLanguage] || "",
    [lecture?.asset?.starter_code, activeLanguage],
  );
  const expectedOutput = useMemo(
    () => lecture?.asset?.expected_output?.[activeLanguage] || "",
    [lecture?.asset?.expected_output, activeLanguage],
  );

  const markCompleted = async () => {
    if (!lecture?.id || !course?.id) return;

    try {
      setSubmitting(true);
      await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums/add-progress`,
        {
          course_id: course.id,
          curriculum_id: lecture.id,
        },
      );

      setCourse((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((section) => ({
            ...section,
            curriculums: section.curriculums.map((curriculum) =>
              curriculum.id === lecture.id
                ? { ...curriculum, is_taken: true, completed: true, progress_pct: 100 }
                : curriculum,
            ),
          })),
        };
      });
    } catch (error) {
      console.error("Error submitting coding exercise progress:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white overflow-y-auto w-full h-[500px] shadow-md absolute top-0 left-0 p-6">
      <div className="max-w-[920px] mx-auto space-y-5">
        <h3 className="text-2xl font-semibold">{lecture?.title || "Coding Exercise"}</h3>
        <p className="text-gray-600">{lecture?.asset?.instructions || ""}</p>

        <div className="flex flex-wrap gap-2">
          {(lecture?.asset?.languages || []).map((language) => (
            <button
              key={language}
              onClick={() => setActiveLanguage(language)}
              className={`px-3 py-1 border rounded text-sm ${activeLanguage === language ? "bg-black text-white" : "bg-white text-gray-700"}`}
            >
              {language}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold mb-2">Starter Code ({activeLanguage})</p>
            <pre className="bg-[#111827] text-[#e5e7eb] rounded p-3 text-xs overflow-auto min-h-[240px]">
              {starterCode || "// No starter code provided"}
            </pre>
          </div>

          <div>
            <p className="font-semibold mb-2">Expected Output ({activeLanguage})</p>
            <pre className="bg-[#0b1020] text-[#93c5fd] rounded p-3 text-xs overflow-auto min-h-[240px]">
              {expectedOutput || "// No expected output provided"}
            </pre>
          </div>
        </div>

        <button
          onClick={markCompleted}
          disabled={submitting || Boolean(lecture?.is_taken)}
          className="px-5 py-2 rounded bg-[#0056D2] text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {lecture?.is_taken ? "Completed" : submitting ? "Submitting..." : "Mark as Completed"}
        </button>
      </div>
    </div>
  );
}
