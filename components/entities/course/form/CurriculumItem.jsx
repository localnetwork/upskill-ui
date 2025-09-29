import { useState, useEffect } from "react";
import LectureContentSelector from "./LectureContentSelector";
import QuizItem from "./QuizItem";
import CodingExerciseItem from "./CodingExerciseItem";
import BaseApi from "@/lib/api/_base.api";

export default function CurriculumItem({ item, onSave }) {
  const [open, setOpen] = useState(true); // ✅ closed by default
  const [title, setTitle] = useState(item.title || "");
  const [description, setDescription] = useState(item.description || "");
  const [error, setError] = useState("");

  const isLecture = item.type === "lecture";
  const isQuiz = item.type === "quiz";
  const isCoding = item.type.replace(" ", "_") === "coding_exercise";

  // ✅ Close and reset when parent sends a new item
  useEffect(() => {
    setOpen(false);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setError("");
  }, [item]);

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setError("");
    if (onSave) {
      onSave({ ...item, title: title.trim(), description: description.trim() });
    }
    setOpen(false);

    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums`,
        {
          title: title.trim(),
          description: description.trim(),
          type: item.type,
          course_section_id: item.section_id, // assuming item has section_id
        }
      );
      console.log("Curriculum item saved:", response.data);
    } catch (error) {
      console.error("Error saving curriculum item:", error);
    }
  };

  const onUpdate = (updatedItem) => {
    if (onSave) {
      onSave({ ...item, ...updatedItem });
    }
  };

  return (
    <div className="border p-2 rounded mb-2 bg-gray-50 w-full">
      {/* Header */}
      <div
        className="flex justify-between cursor-pointer"
        onClick={() => {
          if (isLecture || isQuiz || isCoding) setOpen(!open);
        }}
      >
        <span>
          {item.type.toUpperCase()} – {title || "Untitled"}
        </span>
        {(isLecture || isQuiz || isCoding) && (
          <span className="text-sm text-purple-600">
            {open ? "Close" : "Edit"}
          </span>
        )}
      </div>

      {/* Panel */}
      {open && (
        <div className="mt-3 space-y-3">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          {/* Error Message */}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Content Selector */}
          {isLecture && (
            <LectureContentSelector
              lectureTitle={title}
              onClose={() => setOpen(false)}
              onUpdate={onUpdate}
            />
          )}
          {isQuiz && (
            <QuizItem
              quiz={{ ...item, title, description }}
              onClose={() => setOpen(false)}
              onUpdate={onUpdate}
            />
          )}
          {isCoding && (
            <CodingExerciseItem
              exercise={{ ...item, title, description }}
              onClose={() => setOpen(false)}
              onUpdate={onUpdate}
            />
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
              disabled={!title.trim() || !description.trim()}
            >
              Save Curriculum
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
