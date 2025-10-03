"use client";
import { useState, useEffect } from "react";
import { NotebookText, Save, Trash, Trash2 } from "lucide-react"; // icons
import LectureContentSelector from "./LectureContentSelector";
import QuizItem from "./QuizItem";
import CodingExerciseItem from "./CodingExerciseItem";
import BaseApi from "@/lib/api/_base.api";
import Pencil from "@/components/icons/Pencil";

export default function CurriculumItem({ item, onSave, onUpdate, onDelete }) {
  const [mode, setMode] = useState(null); // "edit" | "content" | null
  const [title, setTitle] = useState(item.title || "");
  const [description, setDescription] = useState(
    item.curriculum_description || ""
  );
  const [error, setError] = useState("");
  const [currentItem, setCurrentItem] = useState(item);
  const [deleting, setDeleting] = useState(false);

  const isLecture = currentItem.curriculum_type === "lecture";
  const isQuiz = currentItem.curriculum_type === "quiz";
  const isCoding = currentItem.curriculum_type === "coding_exercise";

  useEffect(() => {
    setMode(item.isNew ? "edit" : null);
    setTitle(item.title || "");
    setDescription(item.curriculum_description || "");
    setCurrentItem(item);
    setError("");
  }, [item]);

  // --- CREATE
  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setError("");

    const payload = {
      title: title.trim(),
      description: description.trim(),
      curriculum_type: currentItem.curriculum_type,
      course_section_id: currentItem.section_id,
    };

    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums`,
        payload
      );

      const saved = {
        ...currentItem,
        ...response.data.data,
        isNew: false,
      };

      setCurrentItem(saved);
      setTitle(saved.title);
      setDescription(saved.description);

      onSave?.(saved);

      // open content editor right after saving
      if (isLecture || isQuiz || isCoding) {
        setMode("content");
      } else {
        setMode(null);
      }
    } catch (error) {
      console.error("Error saving curriculum item:", error);
    }
  };

  // --- UPDATE
  const handleUpdate = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setError("");

    const payload = {
      title: title.trim(),
      description: description.trim(),
      curriculum_type: currentItem.curriculum_type,
    };

    try {
      const response = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums/${currentItem.id}`,
        payload
      );

      const updated = response?.data?.data || { ...currentItem, ...payload };

      setCurrentItem(updated);
      setTitle(updated.title);
      setDescription(updated.curriculum_description);

      onUpdate?.(updated);
      setMode(null);
    } catch (error) {
      console.error("Error updating curriculum item:", error);
    }
  };

  // --- DELETE
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this curriculum?")) {
      return;
    }

    try {
      setDeleting(true);
      await BaseApi.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums/${currentItem.id}`
      );

      onDelete?.(currentItem.id);
    } catch (error) {
      console.error("Error deleting curriculum item:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="[border:1px_solid_oklch(67.22%_0.0355_279.77deg)] px-[20px] py-[15px] mb-2 bg-gray-50 w-full">
      {/* Header */}
      <div className="flex justify-between items-center w-full">
        <div className="w-full">
          {mode === "edit" ? (
            <div className="relative w-1/2 flex items-center gap-[5px]">
              <label className="flex items-center font-semibold mb-1 nowrap">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
                className="border border-[#3588FC] w-full rounded px-2 pr-[50px] py-1 outline-none focus:border-[#0056D2]  text-lg font-semibold"
              />

              <p
                className={`text-[12px] absolute top-[10px] right-[5px]  ${title.length > 100 ? "text-red-600" : "text-gray-500"}`}
              >
                {title.length}/120
              </p>
            </div>
          ) : (
            <div className="flex items-center">
              <span>
                {currentItem?.curriculum_type?.toUpperCase()} –{" "}
                {title || "Untitled"}
              </span>
              {!currentItem.isNew && (
                <div className="flex text-sm items-center">
                  <button
                    onClick={() => setMode(mode === "edit" ? null : "edit")}
                    className="ml-2 py-[3px] px-[5px] hover:bg-gray-200 rounded-sm flex items-center justify-center cursor-pointer"
                  >
                    {mode === "edit" ? (
                      <span className="text-[12px] px-4 py-2 cursor-pointer flex items-center justify-center font-bold border-[2px] border-[#0056D2] hover:bg-[#0056D2] hover:text-white text-[#0056D2] rounded">
                        Close
                      </span>
                    ) : (
                      <Pencil />
                    )}
                  </button>

                  <button
                    onClick={handleDelete}
                    className={`py-[3px] px-[5px] hover:bg-gray-200 rounded-sm flex items-center justify-center cursor-pointer ${
                      deleting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    title="Delete Curriculum"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <span className="text-xs">Deleting...</span>
                    ) : (
                      <Trash size={16} />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          {(isLecture || isQuiz || isCoding) && (
            <button
              onClick={() => setMode(mode === "content" ? null : "content")}
            >
              {mode === "content" ? (
                <span className="text-[12px] px-4 py-2 cursor-pointer flex items-center justify-center font-bold border-[2px] border-[#0056D2] hover:bg-[#0056D2] hover:text-white text-[#0056D2] rounded">
                  Close
                </span>
              ) : (
                <>
                  {item.title && (
                    <span className="text-[12px] px-4 py-2 cursor-pointer flex items-center justify-center font-bold border-[2px] border-[#0056D2] hover:bg-[#0056D2] hover:text-white text-[#0056D2] rounded">
                      <NotebookText size={16} className="mr-1" /> Content
                    </span>
                  )}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Edit Mode */}
      {mode === "edit" && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="block font-semibold mb-1">
              Description <span className="text-red-500">*</span>
            </label>

            {console.log("description", description)}

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="border border-[#3588FC] w-full rounded px-2 pr-[50px] py-1 outline-none focus:border-[#0056D2]  text-lg font-semibold"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setMode(null)}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
            >
              Cancel
            </button>
            {currentItem.isNew ? (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
                disabled={!title.trim() || !description.trim()}
              >
                Save Curriculum
              </button>
            ) : (
              <button
                onClick={handleUpdate}
                className="px-4 py-2 cursor-pointer flex items-center justify-center font-bold border-[2px] border-[#0056D2] hover:bg-[#0056D2] hover:text-white text-[#0056D2] rounded"
                disabled={!title.trim() || !description.trim()}
              >
                <Save size={16} className="mr-1" />
                Update Curriculum
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content Mode */}
      {mode === "content" && (
        <div className="mt-3">
          {/* {isLecture && (
            <LectureContentSelector
              lecture={currentItem}
              onClose={() => setMode(null)}
              onUpdate={handleUpdate}
            />
          )} */}

          {isLecture && (
            <LectureContentSelector
              lecture={currentItem}
              onClose={() => setMode(null)}
              onUpdate={(updated) => {
                setCurrentItem((prev) => ({ ...prev, ...updated }));
                onUpdate?.({ ...currentItem, ...updated });
              }}
            />
          )}

          {isQuiz && (
            <QuizItem
              quiz={currentItem}
              onClose={() => setMode(null)}
              onUpdate={handleUpdate}
            />
          )}
          {isCoding && (
            <CodingExerciseItem
              exercise={currentItem}
              onClose={() => setMode(null)}
              onUpdate={handleUpdate}
            />
          )}
        </div>
      )}
    </div>
  );
}
