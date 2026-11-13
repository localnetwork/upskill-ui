import { useState } from "react";
import { Clock, MessagesSquare } from "lucide-react";
import RolePlayPreview from "@/components/entities/course/role-play/RolePlayPreview";

export default function RolePlayLearn({ lecture, setCourse }) {
  const [open, setOpen] = useState(false);
  const details = lecture?.asset;

  const markCompleted = () => {
    setCourse?.((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((section) => ({
          ...section,
          curriculums: section.curriculums.map((curriculum) =>
            curriculum.id === lecture.id
              ? { ...curriculum, is_taken: true, completed: true, progress_pct: 100 }
              : curriculum,
          ),
        })),
      };
    });
  };

  if (!details?.generated) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center text-white">
        <h3 className="mb-2 text-xl font-semibold">Role play not available yet</h3>
        <p className="max-w-xl text-sm text-slate-300">
          Your instructor hasn&apos;t published this role play yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center text-white">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
        <MessagesSquare size={26} />
      </span>
      <span className="mb-2 rounded bg-white/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide">
        AI Role Play
      </span>
      <h3 className="text-2xl font-bold">{details.meeting_title}</h3>
      <p className="mt-2 flex items-center gap-1 text-sm text-slate-300">
        <Clock size={14} /> {details.duration_minutes} mins with{" "}
        {details.ai_character?.name}
      </p>
      <p className="mt-3 line-clamp-3 max-w-xl text-sm text-slate-300">
        {details.scenario}
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 rounded bg-white px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-100"
      >
        Start Role Play
      </button>

      {open && (
        <RolePlayPreview
          details={details}
          lessonId={lecture.id}
          onClose={() => setOpen(false)}
          onAttemptSaved={markCompleted}
        />
      )}
    </div>
  );
}
