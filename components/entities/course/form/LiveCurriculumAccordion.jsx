"use client";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Code2,
  FileText,
  Loader2,
  PlayCircle,
} from "lucide-react";

const TYPE_ICONS = {
  video: PlayCircle,
  article: FileText,
  quiz: CircleHelp,
  coding_exercise: Code2,
  assignment: FileText,
};

export function Typewriter({ text, speed = 22, onDone }) {
  const [length, setLength] = useState(0);
  const value = String(text || "");

  useEffect(() => {
    setLength(0);
    if (!value) return undefined;
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setLength(index);
      if (index >= value.length) {
        clearInterval(timer);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, speed]);

  const typing = length < value.length;
  return (
    <>
      {value.slice(0, length)}
      {typing && (
        <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-current align-[-2px]" />
      )}
    </>
  );
}

function LiveSection({ section, index, lessons, isGenerating }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="overflow-hidden [border:1px_solid_oklch(67.22%_0.0355_279.77deg)]">
      <div
        className="flex cursor-pointer items-center justify-between bg-[#F6F7F9] px-[30px] py-[20px]"
        onClick={() => setOpen((previous) => !previous)}
      >
        <h2 className="flex items-center gap-2 font-semibold">
          <span className="ml-2">
            <span className="mr-1 text-slate-500">Section {index + 1}:</span>
            <Typewriter text={section?.title || "Untitled section"} />
          </span>
        </h2>
        <span>{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </div>

      {open && (
        <div className="space-y-2 px-[30px] py-[20px]">
          {lessons.map((lesson, lessonIndex) => {
            const Icon = TYPE_ICONS[String(lesson?.type || "").toLowerCase()] || FileText;
            return (
              <div
                key={`${index}-${lessonIndex}`}
                className="flex items-center gap-3 rounded border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <Icon size={16} className="shrink-0 text-gray-500" />
                <span className="font-medium text-slate-800">
                  <Typewriter text={lesson?.title || "Untitled curriculum"} speed={18} />
                </span>
              </div>
            );
          })}
          {isGenerating && lessons.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" /> Generating curriculum...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Accordion of sections/curriculum items that reveals the AI-generated plan as the
 * backend creates lessons, typing each title out as it appears.
 */
export default function LiveCurriculumAccordion({
  sections = [],
  lessonsCreated = 0,
  isGenerating = false,
  showAll = false,
}) {
  let remaining = showAll ? Number.MAX_SAFE_INTEGER : Number(lessonsCreated || 0);
  const visible = [];

  for (const section of sections) {
    const planned = Array.isArray(section?.lessons) ? section.lessons : [];
    const shown = planned.slice(0, Math.max(0, remaining));
    remaining -= shown.length;
    if (shown.length === 0 && !showAll) {
      // Next section starts once the previous one has all its lessons.
      if (visible.length === 0 || visible[visible.length - 1].complete) {
        visible.push({ section, lessons: [], complete: false });
      }
      break;
    }
    visible.push({ section, lessons: shown, complete: shown.length === planned.length });
    if (shown.length < planned.length) break;
  }

  if (visible.length === 0) return null;

  return (
    <div className="space-y-4">
      {visible.map(({ section, lessons }, index) => (
        <LiveSection
          key={`${index}-${section?.title || ""}`}
          section={section}
          index={index}
          lessons={lessons}
          isGenerating={isGenerating}
        />
      ))}
    </div>
  );
}
