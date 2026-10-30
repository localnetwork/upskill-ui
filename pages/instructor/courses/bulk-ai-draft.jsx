import InstructorLayout from "@/components/partials/InstructorLayout";
import BaseApi from "@/lib/api/_base.api";
import Spinner from "@/components/icons/Spinner";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import PayoutAccountTour from "@/components/entities/instructor/payout/PayoutAccountTour";
import useHasNoCourses from "@/lib/hooks/useHasNoCourses";

const BULK_TOUR_STEPS = [
  {
    target: "tour-bulk-topics",
    title: "1. Add course topics",
    body: "Enter one course topic or brief per field. Press Enter to add another row.",
  },
  {
    target: "tour-bulk-add",
    title: "2. Add more courses",
    body: "Use this to add more topics, up to the allowed maximum.",
  },
  {
    target: "tour-bulk-language",
    title: "3. Pick a language",
    body: "Choose the language for all generated drafts.",
  },
  {
    target: "tour-bulk-generate",
    title: "4. Generate drafts",
    body: "A draft with sections and lessons is created for each topic. Drafts are unpublished and editable.",
  },
];
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import useCourseLanguages from "@/lib/hooks/useCourseLanguages";

const MAX_COURSES = 10;

const STATUS_STYLES = {
  pending: "bg-slate-100 text-slate-600",
  running: "bg-blue-100 text-blue-700",
  done: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-amber-100 text-amber-700",
};

export default function Page() {
  const languageOptions = useCourseLanguages();
  const [topicRows, setTopicRows] = useState([""]);
  const [showTour, setShowTour] = useHasNoCourses();
  const [language, setLanguage] = useState("English");
  const [items, setItems] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const cancelRef = useRef(false);

  // Keep the selected language valid once the course language list loads.
  useEffect(() => {
    if (!languageOptions.some((option) => option.value === language)) {
      const english = languageOptions.find((option) =>
        option.value.toLowerCase().startsWith("english"),
      );
      setLanguage((english || languageOptions[0]).value);
    }
  }, [languageOptions]);

  const topics = Array.from(
    new Set(topicRows.map((row) => row.trim()).filter(Boolean)),
  );
  const canAddRow = topicRows.length < MAX_COURSES;
  const doneCount = items.filter((item) => item.status === "done").length;

  const updateRow = (index, value) =>
    setTopicRows((prev) => prev.map((row, i) => (i === index ? value : row)));
  const addRow = () =>
    setTopicRows((prev) => (prev.length < MAX_COURSES ? [...prev, ""] : prev));
  const removeRow = (index) =>
    setTopicRows((prev) =>
      prev.length === 1 ? [""] : prev.filter((_, i) => i !== index),
    );

  const patchItem = (index, patch) =>
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );

  const startGeneration = async () => {
    if (!topics.length || isRunning) return;
    const queue = topics.slice(0, MAX_COURSES);
    cancelRef.current = false;
    setIsRunning(true);
    setItems(queue.map((topic) => ({ topic, status: "pending" })));

    // Sequential on purpose: each draft is a long AI call, and parallel calls hit provider limits.
    for (let index = 0; index < queue.length; index += 1) {
      if (cancelRef.current) {
        setItems((prev) =>
          prev.map((item) =>
            item.status === "pending" ? { ...item, status: "cancelled" } : item,
          ),
        );
        break;
      }
      patchItem(index, { status: "running" });
      try {
        const response = await BaseApi.post(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/ai-draft`,
          {
            prompt: `Create a complete course about: ${queue[index]}`,
            language: String(language || "").trim() || undefined,
          },
        );
        const course = response?.data?.data || {};
        patchItem(index, {
          status: "done",
          title: course.title,
          slug: course.slug,
          generated: course.generated,
        });
      } catch (error) {
        patchItem(index, {
          status: "failed",
          error:
            error?.data?.message ||
            error?.response?.data?.message ||
            "Generation failed",
        });
      }
    }

    setIsRunning(false);
    toast.success("Bulk draft generation finished.");
  };

  return (
    <InstructorLayout>
      {showTour ? (
        <PayoutAccountTour
          steps={BULK_TOUR_STEPS}
          onClose={() => setShowTour(false)}
        />
      ) : null}
      <div className="max-w-3xl">
        <Link
          href="/instructor/courses"
          className="text-sm text-[#0056D2] hover:underline"
        >
          ← Back to courses
        </Link>
        <h1 className="text-[32px] font-semibold mt-2 mb-1">
          Bulk draft courses with AI
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Add one course topic or brief per field (up to {MAX_COURSES}). A
          draft course with sections and lessons is created for each one.
          Drafts are unpublished and can be edited afterwards.
        </p>

        <div className="mb-4">
          <span className="text-sm font-medium">Course topics</span>
          <div id="tour-bulk-topics" className="mt-1 space-y-2">
            {topicRows.map((row, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-6 text-sm text-slate-400 text-right">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={row}
                  maxLength={300}
                  onChange={(e) => updateRow(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRow();
                    }
                  }}
                  disabled={isRunning}
                  placeholder={
                    index === 0
                      ? "e.g. HTML & CSS for absolute beginners"
                      : "Another course topic"
                  }
                  className="flex-1 border border-gray-300 rounded-md p-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  disabled={isRunning || (topicRows.length === 1 && !row)}
                  title="Remove"
                  className="p-2.5 rounded-md border border-gray-300 text-slate-500 hover:text-red-600 disabled:opacity-40"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            id="tour-bulk-add"
            type="button"
            onClick={addRow}
            disabled={!canAddRow || isRunning}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0056D2] disabled:opacity-40"
          >
            <Plus size={16} /> Add another course
          </button>
          <p className="text-xs text-slate-500 mt-1">
            {topics.length} of {MAX_COURSES} topics filled in
          </p>
        </div>

        <label className="block mb-6">
          <span className="text-sm font-medium">Preferred language</span>
          <select
            id="tour-bulk-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isRunning}
            className="mt-1 w-full max-w-xs border border-gray-300 rounded-md p-3 text-sm bg-white"
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <button
            id="tour-bulk-generate"
            type="button"
            onClick={startGeneration}
            disabled={!topics.length || isRunning}
            className="flex items-center gap-2 bg-[#0f172a] text-white font-semibold px-5 py-2.5 rounded-[10px] hover:opacity-90 disabled:opacity-50"
          >
            {isRunning && <Spinner className="w-4 h-4 animate-spin" />}
            {isRunning
              ? `Generating ${Math.min(doneCount + 1, items.length)} of ${items.length}...`
              : `✨ Generate ${topics.length || ""} draft${topics.length === 1 ? "" : "s"}`}
          </button>
          {isRunning && (
            <button
              type="button"
              onClick={() => {
                cancelRef.current = true;
              }}
              className="px-4 py-2.5 rounded-[10px] border border-gray-300 text-sm hover:bg-gray-50"
            >
              Stop after current
            </button>
          )}
        </div>

        {items.length > 0 && (
          <ul className="mt-8 space-y-2">
            {items.map((item, index) => (
              <li
                key={`${index}-${item.topic}`}
                className="flex items-start justify-between gap-4 border rounded-lg p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium break-words">
                    {item.title || item.topic}
                  </p>
                  {item.status === "done" && (
                    <p className="text-xs text-slate-500">
                      {item.generated?.sections || 0} sections,{" "}
                      {item.generated?.lessons || 0} lessons -{" "}
                      <Link
                        href={`/instructor/courses/${item.slug}/curriculum`}
                        className="text-[#0056D2] hover:underline"
                      >
                        Open draft
                      </Link>
                    </p>
                  )}
                  {item.status === "failed" && (
                    <p className="text-xs text-red-600">{item.error}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 px-2 py-1 rounded text-xs font-semibold ${STATUS_STYLES[item.status]}`}
                >
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        )}

        {!isRunning && doneCount > 0 && (
          <Link
            href="/instructor/courses"
            className="inline-block mt-6 text-sm font-semibold text-[#0056D2] hover:underline"
          >
            View all courses →
          </Link>
        )}
      </div>
    </InstructorLayout>
  );
}
