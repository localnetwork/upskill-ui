import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
} from "lucide-react";

export const ROLE_PLAY_MIN_CHARS = 100;
const MAX_LINKED_MINUTES = 40;

function TextArea({
  label,
  hint,
  optional,
  value,
  onChange,
  placeholder,
  minChars,
}) {
  const short = minChars && value.trim().length < minChars;
  return (
    <div className="mb-8">
      <h3 className="text-[20px] font-bold text-slate-900">
        {label}
        {optional && (
          <span className="ml-3 text-[13px] font-normal text-slate-500">
            Optional
          </span>
        )}
      </h3>
      <p className="mb-3 mt-1 text-[14px] text-slate-500">{hint}</p>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full resize-y rounded border border-slate-300 bg-white p-4 text-[15px] outline-none focus:border-[#5022c3]"
      />
      {minChars && (
        <p
          className={`mt-1 text-[13px] ${short ? "text-slate-500" : "text-emerald-600"}`}
        >
          {short
            ? `Add at least ${minChars} characters to generate a tailored Role Play. (${value.trim().length}/${minChars})`
            : "Looks good."}
        </p>
      )}
    </div>
  );
}

function LectureLinker({
  sections,
  currentSectionId,
  roleTitle,
  selectedIds,
  onChange,
}) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState({});

  const lectureMap = useMemo(() => {
    const map = new Map();
    sections.forEach((section) =>
      section.lectures.forEach((lecture) => map.set(lecture.id, lecture)),
    );
    return map;
  }, [sections]);

  const secondsOf = (ids) =>
    ids.reduce(
      (total, id) => total + (lectureMap.get(id)?.duration_seconds || 0),
      0,
    );
  const selectedMinutes = Math.round(secondsOf(selectedIds) / 60);

  const toggle = (lecture) => {
    if (!lecture.has_content) return;
    if (selectedIds.includes(lecture.id)) {
      onChange(selectedIds.filter((id) => id !== lecture.id));
      return;
    }
    if (
      (secondsOf(selectedIds) + lecture.duration_seconds) / 60 >
      MAX_LINKED_MINUTES
    )
      return;
    onChange([...selectedIds, lecture.id]);
  };

  const toggleSection = (section) => {
    const eligible = section.lectures.filter((lecture) => lecture.has_content);
    const allSelected =
      eligible.length > 0 &&
      eligible.every((lecture) => selectedIds.includes(lecture.id));
    if (allSelected) {
      onChange(
        selectedIds.filter(
          (id) => !eligible.some((lecture) => lecture.id === id),
        ),
      );
      return;
    }
    let total = secondsOf(selectedIds);
    const next = [...selectedIds];
    eligible.forEach((lecture) => {
      if (next.includes(lecture.id)) return;
      if ((total + lecture.duration_seconds) / 60 > MAX_LINKED_MINUTES) return;
      total += lecture.duration_seconds;
      next.push(lecture.id);
    });
    onChange(next);
  };

  const normalizedQuery = query.trim().toLowerCase();
  const visibleSections = sections
    .map((section) => ({
      ...section,
      lectures: normalizedQuery
        ? section.lectures.filter((lecture) =>
            lecture.title.toLowerCase().includes(normalizedQuery),
          )
        : section.lectures,
    }))
    .filter(
      (section) =>
        section.lectures.length > 0 ||
        (!normalizedQuery && section.id === currentSectionId),
    );

  const progress = Math.min(100, (selectedMinutes / MAX_LINKED_MINUTES) * 100);

  return (
    <div className="mb-8">
      <h3 className="text-[20px] font-bold text-slate-900">
        Link related lectures
        <span className="ml-3 text-[13px] font-normal text-slate-500">
          Optional
        </span>
      </h3>
      <div className="mt-3 flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search lectures"
          className="h-11 w-full rounded border border-slate-300 bg-white px-3 outline-none focus:border-[#5022c3]"
        />
        <span className="flex h-11 w-12 shrink-0 items-center justify-center rounded bg-primary text-white">
          <Search size={18} />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-4 text-[14px] text-slate-600">
        <span className="shrink-0">{selectedIds.length} lectures selected</span>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#e5dcf7]">
          <div
            className="h-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 text-primary">
          {selectedMinutes} / {MAX_LINKED_MINUTES} mins
        </span>
      </div>

      <div className="mt-3 max-h-[360px] overflow-y-auto rounded border border-slate-300 bg-white p-3">
        {visibleSections.length === 0 && (
          <p className="p-3 text-[14px] text-slate-500">No lectures found.</p>
        )}
        {visibleSections.map((section, index) => {
          const eligible = section.lectures.filter(
            (lecture) => lecture.has_content,
          );
          const allSelected =
            eligible.length > 0 &&
            eligible.every((lecture) => selectedIds.includes(lecture.id));
          const isCollapsed = collapsed[section.id];
          return (
            <div
              key={section.id}
              className="mb-2 overflow-hidden rounded border border-slate-200"
            >
              <div className="flex items-center gap-3 bg-slate-100 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={eligible.length === 0}
                  onChange={() => toggleSection(section)}
                  className="h-4 w-4 cursor-pointer"
                />
                <div className="grow">
                  <p className="font-bold text-slate-900">
                    Section {index + 1}: {section.title}
                  </p>
                  <p className="text-[12px] text-slate-500">
                    {section.lectures.length} lecture
                    {section.lectures.length === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((prev) => ({
                      ...prev,
                      [section.id]: !prev[section.id],
                    }))
                  }
                  aria-label="Toggle section"
                >
                  {isCollapsed ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronUp size={16} />
                  )}
                </button>
              </div>
              {!isCollapsed && (
                <>
                  {section.lectures.map((lecture, lectureIndex) => (
                    <label
                      key={lecture.id}
                      className={`flex items-center gap-3 border-t border-slate-200 px-4 py-3 ${
                        lecture.has_content
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-70"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(lecture.id)}
                        disabled={!lecture.has_content}
                        onChange={() => toggle(lecture)}
                        className="h-4 w-4"
                      />
                      <span className="text-[14px] text-slate-800">
                        {lectureIndex + 1}. {lecture.title}
                      </span>
                      {!lecture.has_content && (
                        <span title="This lecture has no content yet">
                          <AlertTriangle size={14} className="text-amber-600" />
                        </span>
                      )}
                    </label>
                  ))}
                  {section.id === currentSectionId && (
                    <div className="flex items-center gap-3 border-t border-[#d9ccf5] bg-[#f1ecfc] px-4 py-3">
                      <Sparkles size={16} className="text-primary" />
                      <span className="grow text-[14px] text-slate-800">
                        Role Play: {roleTitle}
                      </span>
                      <span className="rounded bg-[#d9ccf5] px-3 py-1 text-[12px] font-bold text-[#3b1a8a]">
                        This Role Play
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RolePlaySetupStep({
  data,
  setup,
  onSetupChange,
  onGenerate,
  generating,
}) {
  const canGenerate =
    setup.skills.trim().length >= ROLE_PLAY_MIN_CHARS &&
    setup.scenario.trim().length >= ROLE_PLAY_MIN_CHARS &&
    !generating;

  return (
    <>
      <div className="mx-auto w-full max-w-[1000px] rounded-[32px] bg-white p-8 shadow-sm md:p-12">
        <h1 className="text-[32px] font-bold text-slate-900">
          Set up your Practice Role Play
        </h1>
        <p className="mb-10 mt-2 text-[17px] text-slate-500">
          Role Plays let learners practice soft skills through realistic
          AI-powered conversations. Describe your scenario and we&apos;ll build
          the experience.
        </p>

        <TextArea
          label="Skills to practice"
          hint="The skills you list here are what learners will be assessed on."
          value={setup.skills}
          onChange={(skills) => onSetupChange({ skills })}
          placeholder="e.g. active listening, giving constructive feedback"
          minChars={ROLE_PLAY_MIN_CHARS}
        />
        <TextArea
          label="Scenario"
          hint="Describe who's involved, what's at stake, and the challenge the learner needs to navigate."
          value={setup.scenario}
          onChange={(scenario) => onSetupChange({ scenario })}
          placeholder="e.g. A manager addressing repeated missed deadlines with a high-performing employee"
          minChars={ROLE_PLAY_MIN_CHARS}
        />
        <TextArea
          label="Additional context"
          optional
          hint="Background the AI knows but the learner doesn't — motivations, sensitivities, things to avoid."
          value={setup.additional_context}
          onChange={(additional_context) =>
            onSetupChange({ additional_context })
          }
          placeholder="e.g. The employee recently went through a difficult personal situation. They're not ready to discuss it but it's affecting their focus."
        />
        <LectureLinker
          sections={data?.sections || []}
          currentSectionId={data?.section_id}
          roleTitle={data?.curriculum?.title || ""}
          selectedIds={setup.lecture_ids}
          onChange={(lecture_ids) => onSetupChange({ lecture_ids })}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-end border-t border-slate-200 bg-white px-8 py-4">
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className="inline-flex items-center gap-2 rounded bg-primary px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles size={16} />
          {generating ? "Generating..." : "Generate Role Play"}
        </button>
      </div>
    </>
  );
}
