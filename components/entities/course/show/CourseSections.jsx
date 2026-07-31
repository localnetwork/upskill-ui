"use client";
import { useState, useEffect } from "react";
import {
  ChevronDown,
  Newspaper,
  PlayCircle,
  X,
} from "lucide-react";
import { formatReadTime } from "@/lib/services/readTimeFormatter";
import {
  buildBunnyEmbedUrlFromPlaybackUrl,
  resolveVideoSource,
} from "@/lib/services/videoSource";

const CURRICULUM_ICONS = {
  article: Newspaper,
  video: PlayCircle,
};

export default function CourseSections({ course }) {
  const [openSection, setOpenSection] = useState(null);
  const [openCurriculum, setOpenCurriculum] = useState({});
  const [visibleCount, setVisibleCount] = useState(10);
  const [expandAll, setExpandAll] = useState(false);
  const [previewCurriculum, setPreviewCurriculum] = useState(null);

  // Expand first section by default only on initial load
  useEffect(() => {
    if (course?.sections?.length > 0 && openSection === null && !expandAll) {
      setOpenSection(course.sections[0].id);
    }
  }, [course?.sections]);

  const toggleSection = (id) => {
    if (expandAll) {
      // In expand all mode, track closed sections
      setOpenCurriculum((prev) => {
        const key = `section_${id}`;
        return { ...prev, [key]: prev[key] ? null : "closed" };
      });
    } else {
      setOpenSection(openSection === id ? null : id);
    }
  };

  const handleExpandCollapse = () => {
    const newExpandAll = !expandAll;
    setExpandAll(newExpandAll);

    if (newExpandAll) {
      // Expand all: show all sections and set visible count
      setVisibleCount(course?.sections?.length || 10);
      setOpenSection(null);
    } else {
      // Collapse all: reset everything
      setOpenSection(null);
      setOpenCurriculum({});
      setVisibleCount(10);
    }
  };

  const visibleSections = expandAll
    ? course?.sections || []
    : course?.sections?.slice(0, visibleCount) || [];

  const renderPreviewContent = () => {
    if (!previewCurriculum) return null;

    const type = previewCurriculum.curriculum_resource_type;
    const asset = previewCurriculum.preview_asset || {};

    if (type === "video" && asset.path) {
      const resolvedVideoSource = resolveVideoSource(asset.path);
      const bunnyEmbedUrl = buildBunnyEmbedUrlFromPlaybackUrl(resolvedVideoSource);
      if (bunnyEmbedUrl) {
        return (
          <iframe
            src={bunnyEmbedUrl}
            className="w-full rounded-lg bg-black h-[420px]"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        );
      }

      return (
        <video
          controls
          className="w-full rounded-lg bg-black max-h-[420px]"
          src={resolvedVideoSource}
        />
      );
    }

    if (type === "article") {
      return (
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{
            __html:
              asset.content || previewCurriculum.curriculum_description || "",
          }}
        />
      );
    }

    if (type === "quiz") {
      const questions = Array.isArray(asset.questions) ? asset.questions : [];
      return (
        <div className="text-sm text-slate-700 space-y-2">
          <p>
            Quiz preview available.{" "}
            <strong>{questions.length}</strong> question
            {questions.length === 1 ? "" : "s"}.
          </p>
          <p className="text-slate-500">
            Enroll in this course to take the full quiz.
          </p>
        </div>
      );
    }

    if (type === "coding_exercise") {
      return (
        <div className="text-sm text-slate-700 space-y-2">
          <p>
            {asset.instructions || previewCurriculum.curriculum_description}
          </p>
          <p className="text-slate-500">
            Enroll in this course to access the full coding workspace.
          </p>
        </div>
      );
    }

    return (
      <div className="text-sm text-slate-700">
        {previewCurriculum.curriculum_description || "No preview available."}
      </div>
    );
  };

  return (
    <>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        {/* <div className="flex justify-between items-center mb-3">
          <div className="text-[#a1a4b8]">
            {sectionCount} sections • {curriculumCount} lectures
          </div>
          {course?.sections?.length > 0 && (
            <button
              onClick={handleExpandCollapse}
              className="text-sm text-[#0056D2] cursor-pointer font-bold hover:text-[#0041a8] transition"
            >
              {expandAll ? "Collapse All Sections" : "Expand All Sections"}
            </button>
          )}
        </div> */}

        {/* Sections */}
        {visibleSections.map((section) => {
          const isOpen = expandAll
            ? openCurriculum[`section_${section.id}`] !== "closed"
            : openSection === section.id;

          return (
            <div key={section.id} className="border-b border-gray-200">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className={`${isOpen ? "bg-gray-50" : "bg-white"} w-full flex items-center justify-between p-5 hover:bg-gray-100 transition-colors`}
              >
                <div className="flex items-center">
                  <ChevronDown
                    className={`mr-2 transform transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    size={16}
                  />
                  <span className="font-bold">{section.title}</span>
                </div>
                <span className="text-sm text-slate-500">
                  {section.curriculums?.length || 0} lectures
                </span>
              </button>

              {/* Section Content */}
              {isOpen && (
                <div className="bg-white border-t border-gray-100 p-4 space-y-4">
                  {section.curriculums?.map((curriculum) => {
                    const IconComponent =
                      CURRICULUM_ICONS[curriculum.curriculum_resource_type];

                    return (
                      <div key={curriculum.id}>
                        <div className="flex items-start gap-3 group">
                          {IconComponent ? (
                            <IconComponent
                              size={20}
                              className="text-gray-500 mt-1"
                            />
                          ) : (
                            <div className="w-5" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">
                              {curriculum.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500">
                                {curriculum.curriculum_resource_type === "video"
                                  ? "Video"
                                  : curriculum.curriculum_resource_type ===
                                      "article"
                                    ? "Article"
                                    : curriculum.curriculum_resource_type ===
                                        "quiz"
                                      ? "Quiz"
                                      : curriculum.curriculum_resource_type ===
                                          "coding_exercise"
                                        ? "Coding Exercise"
                                        : "Other"}
                              </span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                              <span className="text-xs text-slate-500">
                                {formatReadTime(curriculum.estimated_duration)}{" "}
                              </span>
                            </div>
                          </div>
                          {curriculum.is_public_preview && (
                            <button
                              type="button"
                              onClick={() => setPreviewCurriculum(curriculum)}
                              className="text-xs px-3 py-1.5 rounded-md border border-[#0056D2] text-[#0056D2] hover:bg-[#0056D2] hover:text-white transition-colors"
                            >
                              Preview
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Load More Button */}
        {!expandAll && course?.sections?.length > visibleCount && (
          <div className="text-center mt-4">
            <button
              onClick={() => setVisibleCount((prev) => prev + 10)}
              className="mt-4 w-full py-3 border border-slate-900 text-slate-900 font-bold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Show more {course.sections.length - visibleCount} sections
            </button>
          </div>
        )}
      </div>

      {previewCurriculum && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setPreviewCurriculum(null)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative z-[121] w-full max-w-4xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-bold">{previewCurriculum.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewCurriculum(null)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">{renderPreviewContent()}</div>
          </div>
        </div>
      )}
    </>
  );
}
