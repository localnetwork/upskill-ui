"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import courseStore from "@/lib/store/courseStore";
import modalState from "@/lib/store/modalState";
import { Sparkles, ChevronLeft, ChevronDown } from "lucide-react";

export default function CourseStripBar({ course }) {
  const courseManagement = courseStore((state) => state.courseManagement);

  const [showPreviewMenu, setShowPreviewMenu] = useState(false);
  const menuRef = useRef(null);

  const previewSlug = courseManagement?.uuid || course?.uuid;

  const courseTitle =
    courseManagement?.title || course?.title || "Course Title";

  const parseDate = (value) => {
    const timestamp = value ? new Date(value).getTime() : 0;
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const activeCourse =
    courseManagement?.uuid === course?.uuid
      ? parseDate(courseManagement?.updatedAt) >= parseDate(course?.updatedAt)
        ? { ...course, ...courseManagement }
        : { ...courseManagement, ...course }
      : course;

  const publishedValue =
    activeCourse?.isPublished !== undefined
      ? activeCourse.isPublished
      : activeCourse?.published;
  const isPublished =
    publishedValue === true ||
    ["1", "true"].includes(String(publishedValue).toLowerCase());

  const workflowStatus = String(
    activeCourse?.workflowStatus || activeCourse?.workflow_status || "",
  ).toUpperCase();
  const statusLabel = isPublished
    ? "Published"
    : {
        PENDING_APPROVAL: "Pending review",
        APPROVED: "Approved (unpublished)",
        REJECTED: "Changes required",
      }[workflowStatus] || "Unpublished";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowPreviewMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowPreviewMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const openAiUpdateModal = () => {
    modalState.setState({
      modalInfo: {
        type: "COURSE_AI_UPDATE",
        title: "Update Course with AI",
        size: "lg",
        data: {
          courseId: activeCourse?.uuid || activeCourse?.id,
          course: activeCourse,
        },
      },
    });
  };

  return (
    <div className="xl:sticky xl:top-[85px] z-30 border-t border-white/10 bg-[#16161D] py-3 text-white sm:py-4 lg:py-5">
      <div className="mx-auto flex w-full min-w-0 max-w-[1800px] flex-col gap-3 px-3 sm:gap-4 sm:px-5 md:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8 xl:px-12">
        {/* COURSE INFORMATION */}
        <div className="flex min-w-0 flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center">
          {/* BACK LINK */}
          <Link
            href="/instructor/courses"
            className="inline-flex w-fit shrink-0 items-center gap-1 rounded-md py-1 text-sm text-zinc-200 transition hover:bg-[#3588FC] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:px-2"
          >
            <ChevronLeft size={20} />
            <span>Back to courses</span>
          </Link>

          {/* TITLE AND STATUS */}
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 lg:border-l lg:border-white/20 lg:pl-4">
            <h1 className="min-w-0 break-words text-base font-bold leading-snug sm:text-lg">
              {courseTitle}
            </h1>

            <span
              className={`inline-flex shrink-0 items-center rounded-md px-2.5 py-1 text-xs font-semibold sm:text-sm ${
                isPublished
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-[#F0F6FF] text-[#16161D]"
              }`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {/* COURSE ACTIONS */}
        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:shrink-0">
          {/* UPDATE WITH AI */}
          <button
            type="button"
            onClick={openAiUpdateModal}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-[#7dd3fc] bg-[#0c4a6e] px-3 py-2 text-sm font-semibold text-[#e0f2fe] transition hover:bg-[#075985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 sm:w-auto sm:px-4"
          >
            <Sparkles size={16} />
            <span>Update with AI</span>
          </button>

          {/* PREVIEW MENU */}
          <div ref={menuRef} className="relative w-full sm:w-auto">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={showPreviewMenu}
              onClick={() => setShowPreviewMenu((prev) => !prev)}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-white/50 px-4 py-2 text-sm font-semibold transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:w-auto sm:min-w-[120px]"
            >
              Preview
              <ChevronDown
                size={18}
                className={`transition-transform ${
                  showPreviewMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {showPreviewMenu && (
              <div className="absolute right-0 top-full z-50 mt-2 w-full min-w-[220px] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-800 shadow-xl sm:w-64">
                {previewSlug ? (
                  <>
                    <Link
                      href={`/instructor/courses/${previewSlug}/course-details`}
                      className="block px-4 py-3 text-sm transition hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
                      onClick={() => setShowPreviewMenu(false)}
                    >
                      Course details preview
                    </Link>

                    <Link
                      href={`/instructor/courses/${previewSlug}/preview`}
                      className="block border-t border-slate-200 px-4 py-3 text-sm transition hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
                      onClick={() => setShowPreviewMenu(false)}
                    >
                      Curriculum preview
                    </Link>
                  </>
                ) : (
                  <p className="px-4 py-3 text-sm text-slate-500">
                    Course preview is unavailable.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
