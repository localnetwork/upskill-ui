import {
  Check,
  ChevronDown,
  MonitorPlay,
  Newspaper,
  PanelLeftOpen,
  PanelRightOpen,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function CourseLearnSidebar({
  sections,
  setCurrentLecture,
  setPanelStatus,
  panelStatus,
}) {
  const [openSection, setOpenSection] = useState(null);
  const router = useRouter();
  const { lecture: activeLectureUuid } = router.query;

  // 🧠 Auto-open section containing active lecture (only once per change)
  useEffect(() => {
    if (!activeLectureUuid || !sections?.length) return;

    const sectionWithLecture = sections.find((section) =>
      section.curriculums.some((c) => c.uuid === activeLectureUuid)
    );

    if (sectionWithLecture) {
      const foundLecture = sectionWithLecture.curriculums.find(
        (c) => c.uuid === activeLectureUuid
      );
      setOpenSection(sectionWithLecture.id);
      setCurrentLecture(foundLecture);
    }
  }, [activeLectureUuid]); // 🔹 only depends on active lecture change

  const toggleSection = (id) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  return (
    <div className="sidebar h-screen flex flex-col relative border-l border-[#d1d2e0] bg-white">
      {/* Header */}
      <div className="nav-tabs flex sticky w-full top-0 left-0 border-b border-[#d1d2e0] px-[15px] shadow-[inset_0_-1px_0_0_#d1d2e0] bg-white z-10">
        <div className="nav-item py-[15px] font-bold text-[20px] relative">
          Course content
          <span className="bg-[#2a2b3f] absolute bottom-0 left-0 h-[2px] inline-block w-full" />
        </div>

        <div className="absolute flex gap-[15px] right-[15px] top-[15px]">
          {panelStatus !== "expanded" ? (
            <div
              onClick={() => setPanelStatus("expanded")}
              className="inline-block cursor-pointer"
            >
              <PanelRightOpen size={20} />
            </div>
          ) : (
            <div
              onClick={() => setPanelStatus("open")}
              className="inline-block cursor-pointer"
            >
              <PanelLeftOpen size={20} />
            </div>
          )}
          <X
            className="cursor-pointer"
            size={20}
            onClick={() => setPanelStatus("closed")}
          />
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto">
        {sections.map((section) => {
          const isOpen = openSection === section.id;

          return (
            <div
              key={section.id}
              className="accordion-item flex flex-col border-b border-[#d1d2e0] bg-[#F6F7F9] overflow-hidden"
            >
              {/* Accordion Header */}
              <div
                className="flex flex-col w-full px-[30px] pt-[20px] pb-[15px] cursor-pointer hover:bg-[#eceef2] transition-colors"
                onClick={() => toggleSection(section.id)}
              >
                <div className="select-none relative font-medium text-[18px] pr-[30px] flex justify-between items-center">
                  {section.title}
                  <span
                    className={`absolute right-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    <ChevronDown size={20} />
                  </span>
                </div>
                <div className="flex text-[14px] font-light mt-1">
                  <span>
                    1<span className="separator px-1">/</span>
                    {section?.curriculums.length}
                  </span>
                  <span className="separator px-2">|</span>
                  <span>1hr and 15 mins</span>
                </div>
              </div>

              {/* Accordion Content */}
              <div
                className={`accordion-content overflow-hidden transition-[max-height] duration-300 ease-in-out bg-white px-[30px] mx-[-30px] ${
                  isOpen ? "" : "max-h-0"
                }`}
              >
                <div className="items flex flex-col">
                  {section.curriculums.map((curriculum) => {
                    const isActive = curriculum.uuid === activeLectureUuid;

                    let icon;
                    switch (curriculum.curriculum_resource_type) {
                      case "video":
                        icon = <MonitorPlay size={15} />;
                        break;
                      case "article":
                        icon = <Newspaper size={15} />;
                        break;
                      case "quiz":
                        icon = "❓";
                        break;
                      default:
                        icon = "📚";
                    }

                    return (
                      <div
                        key={curriculum.id}
                        onClick={() => {
                          setCurrentLecture(curriculum);
                          router.replace({
                            pathname: router.pathname,
                            query: {
                              ...router.query,
                              lecture: curriculum.uuid,
                            },
                          });
                        }}
                        className={`flex relative pl-[50px] group cursor-pointer items-center py-[15px] font-light px-[30px] text-[15px] transition
                          ${
                            isActive
                              ? "bg-[#0056D2]/10 text-[#0056D2] font-medium"
                              : "hover:bg-[#ced9e9] text-[#2a2b3f] hover:text-[#1d1e2e]"
                          }`}
                      >
                        <div
                          className={`${
                            curriculum.is_taken
                              ? "bg-[#0056D2] border-[#0056D2]"
                              : "border-[#000]"
                          } absolute left-[15px] top-[15px] p-[2px] border-[2px] w-[18px] h-[18px] flex items-center justify-center rounded-[5px]`}
                        >
                          <Check
                            className={`group-hover:block hidden text-white ${
                              curriculum.is_taken ? "!block" : ""
                            }`}
                          />
                        </div>
                        <span className="mr-1">{icon}</span>
                        {curriculum.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
