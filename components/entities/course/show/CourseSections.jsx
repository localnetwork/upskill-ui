"use client";
import { useState, useEffect } from "react";
import { ChevronDown, Newspaper, PlayCircleIcon } from "lucide-react";

export default function CourseSections({ course }) {
  const [openSection, setOpenSection] = useState(null); // single open section
  const [openCurriculum, setOpenCurriculum] = useState({});
  const [visibleCount, setVisibleCount] = useState(10);
  const [expandAll, setExpandAll] = useState(false);

  // Expand first section by default (only if not expandAll)
  useEffect(() => {
    if (course?.sections?.length > 0 && !expandAll) {
      setOpenSection(course.sections[0].id);
    }
  }, [course, expandAll]);

  const toggleSection = (id) => {
    if (expandAll) return; // ignore clicks when expand all
    setOpenSection(openSection === id ? null : id);
  };

  const toggleCurriculum = (sectionId, curriculumId) => {
    setOpenCurriculum((prev) => ({
      ...prev,
      [sectionId]: prev[sectionId] === curriculumId ? null : curriculumId,
    }));
  };

  // If expand all → show all sections, otherwise limited
  const visibleSections = expandAll
    ? course?.sections || []
    : course?.sections?.slice(0, visibleCount) || [];

  return (
    <div className="mt-5">
      {/* Expand All Button */}
      <div className="flex justify-end mb-3">
        {course?.sections?.length > 0 && (
          <button
            onClick={() => {
              setExpandAll((prev) => !prev);
              setVisibleCount(course.sections.length); // show all when expand all
              setOpenSection(null); // reset single open section
            }}
            className="px-4 py-2 text-sm bg-[#0056D2] text-white rounded hover:bg-[#0041a8] transition"
          >
            {expandAll ? "Collapse All Sections" : "Expand All Sections"}
          </button>
        )}
      </div>

      {visibleSections.map((section) => {
        const isOpen = expandAll || openSection === section.id;

        return (
          <div key={section.id} className="mb-5 border border-gray-200 rounded">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex justify-between items-center font-semibold text-[18px] mb-1 bg-[#F6F7F9] p-[15px]"
            >
              <div className="flex items-center">
                <ChevronDown
                  className={`mr-2 transform transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  size={16}
                />
                {section.title}
              </div>
              <span className="text-[14px] font-light">
                {section.curriculums.length} lectures
              </span>
            </button>

            {/* Section Content */}
            {isOpen && (
              <div className="accordion-content px-4 pb-3">
                {section.curriculums.map((curriculum, index) => {
                  let icon = null;
                  switch (curriculum.curriculum_resource_type) {
                    case "article":
                      icon = <Newspaper size={20} className="text-[#0056D2]" />;
                      break;
                    case "video":
                      icon = (
                        <PlayCircleIcon size={20} className="text-[#0056D2]" />
                      );
                      break;
                  }

                  const isCurriculumOpen =
                    openCurriculum[section.id] === curriculum.id;

                  return (
                    <div
                      key={curriculum.id}
                      className={`border-[#eee] py-3 ${
                        index !== section.curriculums.length - 1
                          ? "border-b"
                          : ""
                      }`}
                    >
                      <button
                        onClick={() =>
                          toggleCurriculum(section.id, curriculum.id)
                        }
                        className="w-full flex items-center justify-between text-left"
                      >
                        <h4 className="font-semibold flex items-center gap-[15px] text-[16px]">
                          {icon} {curriculum.title}
                          <ChevronDown
                            size={18}
                            className={`bg-[#ddd] rounded-full transition-transform ${
                              isCurriculumOpen
                                ? "rotate-180 text-[#0056D2]"
                                : ""
                            }`}
                          />
                        </h4>
                      </button>

                      {isCurriculumOpen && (
                        <div
                          className="mt-2 pl-7 text-[14px] font-light"
                          dangerouslySetInnerHTML={{
                            __html: curriculum?.curriculum_description,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Load More Button (hidden if expandAll is true) */}
      {!expandAll && course?.sections?.length > visibleCount && (
        <div className="text-center mt-4">
          <button
            onClick={() => setVisibleCount((prev) => prev + 10)}
            className="px-4 py-2 text-sm bg-[#0056D2] text-white rounded hover:bg-[#0041a8] transition"
          >
            Load More Sections
          </button>
        </div>
      )}
    </div>
  );
}
