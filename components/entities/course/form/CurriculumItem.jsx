"use client";
import { useState, useEffect } from "react";
import {
  Code,
  MonitorPlay,
  Newspaper,
  NotebookText,
  OctagonAlert,
  Save,
  Trash,
} from "lucide-react"; // icons
import LectureContentSelector from "./LectureContentSelector";
import QuizItem from "./QuizItem";
import CodingExerciseItem from "./CodingExerciseItem";
import BaseApi from "@/lib/api/_base.api";
import Pencil from "@/components/icons/Pencil";
import TagAutocompleteMultiSelect from "@/components/forms/TagAutocompleteMultiSelect";
import { Editor } from "@tinymce/tinymce-react";

export default function CurriculumItem({
  item,
  topics = [],
  onSave,
  onUpdate,
  onDelete,
}) {
  const [mode, setMode] = useState(null); // "edit" | "content" | null
  const [title, setTitle] = useState(item.title || "");
  const [description, setDescription] = useState(
    item.curriculum_description || "",
  );
  const [isPublicPreview, setIsPublicPreview] = useState(
    Boolean(item.is_public_preview || item.is_preview),
  );
  const [error, setError] = useState("");
  const [currentItem, setCurrentItem] = useState(item);
  const [topicIds, setTopicIds] = useState(
    Array.isArray(item.topic_ids)
      ? item.topic_ids.map((topicId) => String(topicId))
      : item.topic_id
        ? [String(item.topic_id)]
        : [],
  );
  const [deleting, setDeleting] = useState(false);
  const [openContentOnSync, setOpenContentOnSync] = useState(false);

  const resourceType = String(currentItem?.curriculum_resource_type || "null");
  const normalizeCurriculumType = (curriculum) => {
    const directType = String(curriculum?.curriculum_type || "")
      .trim()
      .toLowerCase();
    if (directType) return directType;

    const fromResource = String(curriculum?.curriculum_resource_type || "")
      .trim()
      .toLowerCase();
    if (fromResource === "quiz") return "quiz";
    if (fromResource === "coding_exercise") return "coding_exercise";
    if (fromResource === "video" || fromResource === "article")
      return "lecture";
    return "";
  };
  const normalizedCurriculumType = normalizeCurriculumType(currentItem);
  const isLecture = normalizedCurriculumType === "lecture";
  const isQuiz = normalizedCurriculumType === "quiz";
  const isCoding = normalizedCurriculumType === "coding_exercise";
  const quizQuestions = Array.isArray(currentItem?.asset?.questions)
    ? currentItem.asset.questions
    : [];
  const codingStepChallenges =
    currentItem?.asset?.step_challenges &&
    typeof currentItem.asset.step_challenges === "object"
      ? currentItem.asset.step_challenges
      : {};
  const hasCodingSteps = Object.values(codingStepChallenges).some(
    (steps) => Array.isArray(steps) && steps.length > 0,
  );
  const hasVideoContent = Boolean(
    String(currentItem?.asset?.path || "").trim(),
  );
  const hasArticleContent = Boolean(
    String(currentItem?.asset?.content || "").trim(),
  );
  const hasMissingContent =
    resourceType === "video"
      ? !hasVideoContent
      : resourceType === "article"
        ? !hasArticleContent
        : resourceType === "quiz"
          ? quizQuestions.length === 0
          : resourceType === "coding_exercise"
            ? !hasCodingSteps
            : true;

  const isContentCapableCurriculum = (curriculum) => {
    const normalizedType = normalizeCurriculumType(curriculum);
    return (
      normalizedType === "lecture" ||
      normalizedType === "quiz" ||
      normalizedType === "coding_exercise"
    );
  };

  useEffect(() => {
    const shouldAutoOpenContent =
      openContentOnSync && !item.isNew && isContentCapableCurriculum(item);

    setMode(shouldAutoOpenContent ? "content" : item.isNew ? "edit" : null);
    setTitle(item.title || "");
    setDescription(item.curriculum_description || "");
    setIsPublicPreview(Boolean(item.is_public_preview || item.is_preview));
    setCurrentItem(item);
    setTopicIds(
      Array.isArray(item.topic_ids)
        ? item.topic_ids.map((topicId) => String(topicId))
        : item.topic_id
          ? [String(item.topic_id)]
          : [],
    );
    setError("");
    if (shouldAutoOpenContent) {
      setOpenContentOnSync(false);
    }
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
      is_public_preview: isPublicPreview,
      topic_ids: topicIds,
    };

    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums`,
        payload,
      );

      const saved = {
        ...currentItem,
        ...response.data.data,
        isNew: false,
      };

      setCurrentItem(saved);
      setTitle(saved.title);
      setDescription(saved.curriculum_description || saved.description || "");
      setTopicIds(
        Array.isArray(saved.topic_ids)
          ? saved.topic_ids.map((topicId) => String(topicId))
          : saved.topic_id
            ? [String(saved.topic_id)]
            : [],
      );

      const shouldOpenContent = isContentCapableCurriculum(currentItem);
      setOpenContentOnSync(shouldOpenContent);
      onSave?.(saved);

      // open content editor right after saving
      if (shouldOpenContent) {
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
      is_public_preview: isPublicPreview,
      topic_ids: topicIds,
    };

    try {
      const response = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums/${currentItem.id}`,
        payload,
      );

      const updated = response?.data?.data || { ...currentItem, ...payload };

      setCurrentItem(updated);
      setTitle(updated.title);
      setDescription(
        updated.curriculum_description || updated.description || "",
      );
      setTopicIds(
        Array.isArray(updated.topic_ids)
          ? updated.topic_ids.map((topicId) => String(topicId))
          : updated.topic_id
            ? [String(updated.topic_id)]
            : [],
      );

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
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums/${currentItem.id}`,
      );

      onDelete?.(currentItem.id);
    } catch (error) {
      console.error("Error deleting curriculum item:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={`${hasMissingContent ? "border-2 border-dashed border-red-500 bg-red-50/40" : "[border:1px_solid_oklch(67.22%_0.0355_279.77deg)] bg-gray-50"} px-[20px] py-[15px] mb-2 w-full`}
    >
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
                {resourceType === "video" ? (
                  <MonitorPlay size={18} className="inline mr-2" />
                ) : resourceType === "article" ? (
                  <Newspaper size={18} className="inline mr-2" />
                ) : resourceType === "quiz" ? (
                  <NotebookText size={18} className="inline mr-2" />
                ) : resourceType === "coding_exercise" ? (
                  <Code size={18} className="inline mr-2" />
                ) : (
                  <OctagonAlert
                    size={18}
                    className="inline mr-2 text-red-600"
                  />
                )}
                {title || "Untitled"}
              </span>
              {hasMissingContent && (
                <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-red-600">
                  Missing content
                </span>
              )}
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
          {console.log("resourceType", resourceType)}
          {console.log(
            "isLecture:",
            isLecture,
            "isQuiz:",
            isQuiz,
            "isCoding:",
            isCoding,
          )}
          {(isLecture || isQuiz || isCoding) && (
            <button
              onClick={() => setMode(mode === "content" ? null : "content")}
            >
              {mode === "content" ? (
                <span className="text-[12px] px-4 py-2 cursor-pointer flex items-center justify-center font-bold border-[2px] border-[#0056D2] hover:bg-[#0056D2] hover:text-white text-[#0056D2] rounded">
                  Close
                </span>
              ) : (
                <span className="text-[12px] px-4 py-2 cursor-pointer flex items-center justify-center font-bold border-[2px] border-[#0056D2] hover:bg-[#0056D2] hover:text-white text-[#0056D2] rounded">
                  <NotebookText size={16} className="mr-1" /> Content
                </span>
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

            <Editor
              apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
              value={description} // <-- controlled binding
              onEditorChange={(newValue) => setDescription(newValue)} // updates state
              init={{
                height: 300,
                menubar: false,
                plugins: [
                  "advlist",
                  "autolink",
                  "lists",
                  "link",
                  "image",
                  "charmap",
                  "preview",
                  "anchor",
                  "searchreplace",
                  "visualblocks",
                  "code",
                  "fullscreen",
                  "insertdatetime",
                  "media",
                  "table",
                  "help",
                  "wordcount",
                ],
                toolbar:
                  "undo redo | formatselect | " +
                  "bold italic underline | alignleft aligncenter " +
                  "alignright alignjustify | bullist numlist outdent indent | " +
                  "removeformat | help",
                content_style:
                  "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
              }}
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={isPublicPreview}
              onChange={(e) => setIsPublicPreview(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-slate-300"
            />
            Make this curriculum public preview
          </label>

          <div>
            <label className="block font-semibold mb-1">Topic</label>
            <TagAutocompleteMultiSelect
              options={topics}
              value={topicIds}
              onChange={setTopicIds}
              placeholder="Search topics and press Enter..."
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                if (
                  currentItem.isNew &&
                  (!title.trim() || !description.trim())
                ) {
                  // stay in edit mode if nothing is filled
                  setMode("edit");
                } else {
                  // otherwise behave normally
                  setMode(null);
                }
              }}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
            >
              Cancel
            </button>
            {currentItem.isNew ? (
              <button
                onClick={handleSave}
                className="px-4 py-2 cursor-pointer flex items-center justify-center font-bold border-[2px] border-[#0056D2] hover:bg-[#0056D2] hover:text-white text-[#0056D2] rounded"
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
              onSave={(updated) => {
                setCurrentItem((prev) => ({ ...prev, ...updated }));
                onUpdate?.({ ...currentItem, ...updated });
              }}
            />
          )}
          {isCoding && (
            <CodingExerciseItem
              exercise={currentItem}
              onClose={() => setMode(null)}
              onSave={(updated) => {
                setCurrentItem((prev) => ({ ...prev, ...updated }));
                onUpdate?.({ ...currentItem, ...updated });
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
