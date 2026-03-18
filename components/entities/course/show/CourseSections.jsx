"use client";
import { useState, useEffect } from "react";
import {
  ChevronDown,
  MonitorPlay,
  Newspaper,
  Play,
  PlayCircle,
} from "lucide-react";
import { formatReadTime } from "@/lib/services/readTimeFormatter";

const CURRICULUM_ICONS = {
  article: Newspaper,
  video: PlayCircle,
};

export default function CourseSections({ course }) {
  const [openSection, setOpenSection] = useState(null);
  const [openCurriculum, setOpenCurriculum] = useState({});
  const [visibleCount, setVisibleCount] = useState(10);
  const [expandAll, setExpandAll] = useState(false);

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

  const toggleCurriculum = (sectionId, curriculumId) => {
    setOpenCurriculum((prev) => ({
      ...prev,
      [sectionId]: prev[sectionId] === curriculumId ? null : curriculumId,
    }));
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

  const sectionCount = course?.resources_count?.section_count || 0;
  const curriculumCount = course?.resources_count?.curriculum_count || 0;

  return (
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
                {section.curriculums?.map((curriculum, index) => {
                  const IconComponent =
                    CURRICULUM_ICONS[curriculum.curriculum_resource_type];
                  const isCurriculumOpen =
                    openCurriculum[section.id] === curriculum.id;

                  return (
                    <div key={curriculum.id}>
                      <div className="flex items-start gap-3 group cursor-pointer">
                        {IconComponent ? (
                          <IconComponent
                            size={20}
                            className="text-gray-500 mt-1"
                          />
                        ) : (
                          <div className="w-5" /> // Placeholder for alignment
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
                                  : "Other"}
                            </span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="text-xs text-slate-500">
                              {formatReadTime(
                                curriculum.estimated_duration,
                              )}{" "}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* <button
                        onClick={() =>
                          toggleCurriculum(section.id, curriculum.id)
                        }
                        className="w-full flex items-center justify-between text-left hover:opacity-70 transition"
                      >
                        <h4 className="font-semibold flex items-center gap-[15px] text-[16px]">
                          {IconComponent ? (
                            <IconComponent size={25} />
                          ) : (
                            "No Content"
                          )}
                          {curriculum.title}
                          <ChevronDown
                            size={25}
                            className={`bg-[#f9f6f7] p-[5px] rounded-full transition-transform ${
                              isCurriculumOpen ? "rotate-180" : ""
                            }`}
                          />
                        </h4>
                      </button>

                      {isCurriculumOpen &&
                        curriculum?.curriculum_description && (
                          <div
                            className="mt-5 pl-7 text-[15px] font-light"
                            dangerouslySetInnerHTML={{
                              __html: curriculum.curriculum_description,
                            }}
                          />
                        )} */}
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
  );
}
