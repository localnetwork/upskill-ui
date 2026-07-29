"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import courseStore from "@/lib/store/courseStore";
import modalState from "@/lib/store/modalState";
import { Sparkles } from "lucide-react";

export default function CourseStripBar({ course }) {
  const courseManagement = courseStore((state) => state.courseManagement);

  const [showPreviewMenu, setShowPreviewMenu] = useState(false);

  const menuRef = useRef(null);

  const previewSlug = courseManagement?.uuid || course?.uuid;

  const courseTitle =
    courseManagement?.title || course?.title || "Course Title";

  const isPublished =
    Number(courseManagement?.published ?? course?.published) === 1;
  const activeCourse = courseManagement?.uuid === course?.uuid ? courseManagement : course;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowPreviewMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-[#16161D] z-10 sticky top-[85px] py-[20px] text-white text-[18px] border-t border-white/10">
      <div className="px-[50px] flex items-center justify-between gap-[20px]">
        <div className="flex items-center gap-[10px]">
          <Link
            href="/instructor/courses"
            className="flex items-center gap-[5px] hover:bg-[#3588FC] px-[10px] py-[5px] rounded-[5px]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
            Back to courses
          </Link>

          <span className="font-bold">{courseTitle}</span>

          <span className="bg-[#F0F6FF] text-[#16161D] px-[10px] py-[5px] rounded-md text-[14px]">
            {isPublished ? "Published" : "Unpublished"}
          </span>
        </div>

        <div ref={menuRef} className="relative pr-[30px]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-[#7dd3fc] bg-[#0c4a6e] px-[12px] py-[6px] text-[14px] font-semibold text-[#e0f2fe] transition hover:bg-[#075985]"
              onClick={() =>
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
                })
              }
            >
              <Sparkles size={16} className="animate-pulse" />
              Update with AI
            </button>
            <button
              type="button"
              className="border flex items-center border-white p-[5px] px-[20px] pr-[8px] rounded-md cursor-pointer"
              onClick={() => setShowPreviewMenu((prev) => !prev)}
            >
              Preview
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={`size-6 ml-1 transition-transform ${
                  showPreviewMenu ? "rotate-180" : ""
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>
          </div>

          {showPreviewMenu && previewSlug && (
            <div className="absolute right-0 mt-2 min-w-[220px] rounded-md border border-slate-300 bg-white text-slate-800 shadow-lg overflow-hidden z-20">
              <Link
                href={`/instructor/courses/${previewSlug}/course-details`}
                className="block px-4 py-2 text-sm hover:bg-slate-100"
                onClick={() => setShowPreviewMenu(false)}
              >
                Course details preview
              </Link>

              <Link
                href={`/instructor/courses/${previewSlug}/preview`}
                className="block px-4 py-2 text-sm hover:bg-slate-100 border-t border-slate-200"
                onClick={() => setShowPreviewMenu(false)}
              >
                Curriculum preview
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
