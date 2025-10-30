import {
  ChevronDown,
  MonitorPlay,
  Newspaper,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  X,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/router";
export default function CourseLearnSidebar({
  sections,
  setCurrentLecture,
  setPanelStatus,
  panelStatus,
}) {
  const [openSection, setOpenSection] = useState(null);
  const router = useRouter();

  const toggleSection = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="sidebar h-screen flex flex-col relative border-l border-[#d1d2e0] bg-white">
      <div className="nav-tabs flex sticky w-full top-0 left-0 border-b border-[#d1d2e0] px-[15px] shadow-[inset_0_-1px_0_0_#d1d2e0] bg-white z-10">
        <div className="nav-item py-[15px] font-bold text-[20px] relative">
          Course content
          <span className="bg-[#2a2b3f] absolute bottom-0 left-0 h-[2px] inline-block w-full" />
        </div>

        <div className="absolute flex gap-[15px] right-[15px] top-[15px]">
          {panelStatus !== "expanded" ? (
            <div
              onClick={() => setPanelStatus("expanded")}
              className="inline-block"
            >
              <PanelRightOpen className="cursor-pointer" size={20} />
            </div>
          ) : (
            <div
              onClick={() => setPanelStatus("open")}
              className="inline-block"
            >
              <PanelLeftOpen className="cursor-pointer" size={20} />
            </div>
          )}

          <X
            className="cursor-pointer"
            size={20}
            onClick={() => setPanelStatus("closed")}
          />
        </div>
      </div>

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
                  {section?.curriculums.map((curriculum) => {
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
                        className="flex cursor-pointer items-center py-[15px] hover:bg-[#ced9e9] font-light px-[30px] text-[15px] text-[#2a2b3f] hover:text-[#1d1e2e] transition"
                      >
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
