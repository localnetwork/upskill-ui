"use client";
import { useState, useEffect } from "react";
import { ChevronDown, MonitorPlay, Newspaper } from "lucide-react";

const CURRICULUM_ICONS = {
  article: Newspaper,
  video: MonitorPlay,
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
    <div className="">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
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
      </div>

      {/* Sections */}
      {visibleSections.map((section) => {
        const isOpen = expandAll
          ? openCurriculum[`section_${section.id}`] !== "closed"
          : openSection === section.id;

        return (
          <div key={section.id} className="mb-5 border border-gray-200 rounded">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex justify-between items-center font-semibold text-[18px] bg-[#F6F7F9] p-[15px] hover:bg-gray-100 transition"
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
                {section.curriculums?.length || 0} lectures
              </span>
            </button>

            {/* Section Content */}
            {isOpen && (
              <div className="accordion-content px-4 pb-3">
                {section.curriculums?.map((curriculum, index) => {
                  const IconComponent =
                    CURRICULUM_ICONS[curriculum.curriculum_resource_type];
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
                        )}
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
            className="px-4 w-full py-2 cursor-pointer flex items-center justify-center font-bold border-[2px] border-[#0056D2] hover:bg-[#0056D2] hover:text-white text-[#0056D2] rounded"
          >
            Load More Sections
          </button>
        </div>
      )}
    </div>
  );
}
