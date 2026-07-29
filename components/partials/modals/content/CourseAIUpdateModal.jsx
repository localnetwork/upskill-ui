import BaseApi from "@/lib/api/_base.api";
import modalState from "@/lib/store/modalState";
import courseStore from "@/lib/store/courseStore";
import { CheckCircle2, Sparkles, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

function resolveCourseContext(modalInfo, courseManagement) {
  if (modalInfo?.data?.course) return modalInfo.data.course;
  if (courseManagement) return courseManagement;
  return null;
}

export default function CourseAIUpdateModal() {
  const modalInfo = modalState((state) => state.modalInfo);
  const courseManagement = courseStore((state) => state.courseManagement);
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | running | success

  const course = useMemo(
    () => resolveCourseContext(modalInfo, courseManagement),
    [modalInfo, courseManagement],
  );
  const courseId = String(
    modalInfo?.data?.courseId || course?.uuid || course?.id || "",
  ).trim();

  const canSubmit =
    courseId &&
    String(prompt || "").trim().length >= 20 &&
    phase !== "running";

  const closeModal = () => {
    modalState.setState({ modalInfo: null });
    document.body.style.overflow = "auto";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setPhase("running");
    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${encodeURIComponent(courseId)}/ai-update`,
        {
          prompt: String(prompt || "").trim(),
        },
      );
      const updatedCourse = response?.data?.data?.course || null;
      if (updatedCourse) {
        courseStore.setState({ courseManagement: updatedCourse });
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("course-ai-updated", {
            detail: {
              courseId: courseId,
            },
          }),
        );
      }
      setPhase("success");
      toast.success("Course updated with AI.");
      setTimeout(() => {
        closeModal();
      }, 1100);
    } catch (error) {
      setPhase("idle");
      toast.error(error?.data?.message || "Unable to update with AI.");
    }
  };

  return (
    <div className="space-y-4">
      {phase === "running" ? (
        <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] p-5">
          <div className="flex items-center gap-3 text-[#1d4ed8] font-semibold">
            <Sparkles className="animate-pulse" size={18} />
            AI is updating your course...
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#bfdbfe]">
              <div className="h-full w-2/3 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-[#2563eb]" />
            </div>
            <p className="text-[12px] text-slate-600">
              Generating content • validating structure • applying updates
            </p>
          </div>
        </div>
      ) : phase === "success" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <div className="relative mx-auto mb-2 w-fit">
            <CheckCircle2 size={32} className="text-emerald-600" />
            <span className="absolute inset-0 rounded-full border border-emerald-400 animate-ping" />
          </div>
          <p className="font-semibold text-emerald-700">Update complete</p>
          <p className="text-[12px] text-emerald-700/80">
            Your course content has been refreshed with AI.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Update instruction</label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Example: Update section 'State Management' with simpler explanations, add one practical exercise curriculum, and improve the course subtitle for beginners."
              className="mt-1 min-h-[160px] w-full rounded-lg border border-slate-300 p-3 text-sm"
            />
            <p className="mt-1 text-[12px] text-slate-500">
              {String(prompt || "").trim().length}/4000 characters
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white font-semibold ${
                canSubmit
                  ? "bg-[#0056D2] hover:opacity-90"
                  : "bg-[#0056D2]/60 cursor-not-allowed"
              }`}
            >
              <Wand2 size={16} />
              Update with AI
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
