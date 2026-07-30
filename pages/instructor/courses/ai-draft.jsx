import InstructorLayout from "@/components/partials/InstructorLayout";
import BaseApi from "@/lib/api/_base.api";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Spinner from "@/components/icons/Spinner";
import { CheckCircle2, Sparkles } from "lucide-react";

export default function AIDraftCoursePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("English");
  const [instructionalLevel, setInstructionalLevel] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [draftJobId, setDraftJobId] = useState("");
  const [generationProgress, setGenerationProgress] = useState({
    step: "idle",
    message: "",
    progressPercent: 0,
    preview: null,
    draftProgress: null,
  });

  const canSubmit = String(prompt || "").trim().length >= 20 && !isGenerating;

  useEffect(() => {
    if (!isGenerating || !draftJobId) return undefined;

    let stopped = false;
    let inFlight = false;
    const pollJob = async () => {
      if (stopped || inFlight) return;
      inFlight = true;
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/ai-draft/jobs/${draftJobId}`,
        );
        const job = response?.data?.data || {};
        setGenerationProgress({
          step: String(job?.step || ""),
          message: String(job?.message || ""),
          progressPercent: Number(job?.progressPercent || 0),
          preview: job?.preview || null,
          draftProgress: job?.draftProgress || null,
        });

        if (job?.status === "completed") {
          setIsGenerating(false);
          const created = job?.result || {};
          const sectionCount = Number(created?.generated?.sections || 0);
          const lessonCount = Number(created?.generated?.lessons || 0);
          setGenerationResult({
            slug: created.slug,
            sectionCount,
            lessonCount,
          });
          toast.success(
            `Draft generated (${sectionCount} sections, ${lessonCount} lessons).`,
          );
          setTimeout(() => {
            router.push(`/instructor/courses/${created.slug}/curriculum`);
          }, 1200);
        } else if (job?.status === "failed") {
          setIsGenerating(false);
          toast.error(job?.error || "Unable to generate AI draft right now.");
        }
      } catch (error) {
        setIsGenerating(false);
        toast.error(
          error?.data?.message ||
            "Failed to fetch AI draft progress. Please try again.",
        );
      } finally {
        inFlight = false;
      }
    };

    pollJob();
    const timer = setInterval(pollJob, 1200);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [isGenerating, draftJobId, router]);

  const progressPreview = generationProgress.preview || {};
  const previewSections = Array.isArray(progressPreview.sections)
    ? progressPreview.sections
    : [];
  const stepLabel = generationProgress.message || "Preparing draft...";

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) {
      toast.error("Please describe your course with at least 20 characters.");
      return;
    }

    setIsGenerating(true);
    setGenerationResult(null);
    setGenerationProgress({
      step: "queued",
      message: "Queued",
      progressPercent: 0,
      preview: null,
      draftProgress: null,
    });
    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/ai-draft/jobs`,
        {
          prompt: String(prompt || "").trim(),
          language: String(language || "").trim() || undefined,
          instructional_level:
            String(instructionalLevel || "").trim() || undefined,
        },
      );
      const job = response?.data?.data || {};
      const jobId = String(job?.id || "").trim();
      if (!jobId) {
        throw new Error("AI draft job id missing");
      }
      setDraftJobId(jobId);
    } catch (error) {
      setIsGenerating(false);
      toast.error(
        error?.data?.message ||
          "Unable to generate AI draft right now. Please try again.",
      );
    }
  };

  return (
    <InstructorLayout>
      <div className="max-w-4xl">
        <h1 className="text-[40px] font-semibold mb-3">Draft Course with AI</h1>
        <p className="text-[17px] text-slate-600 mb-6">
          Describe the course you want to build. AI will generate a draft title,
          subtitle, description, learning goals, sections, and lessons.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 font-semibold text-[15px]">
              Course brief
            </label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Example: I want a beginner-to-intermediate course on React for Filipino freelancers. Include fundamentals, state management, API integration, project structure, and a final portfolio project."
              className="w-full min-h-[210px] rounded-[12px] border border-slate-300 p-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0056D2]/30"
            />
            <p className="text-[12px] text-slate-500 mt-2">
              {String(prompt || "").trim().length}/4000 characters
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-semibold text-[15px]">
                Preferred language
              </label>
              <input
                type="text"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="w-full rounded-[10px] border border-slate-300 px-3 py-2"
                placeholder="English"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-[15px]">
                Preferred level (optional)
              </label>
              <input
                type="text"
                value={instructionalLevel}
                onChange={(event) => setInstructionalLevel(event.target.value)}
                className="w-full rounded-[10px] border border-slate-300 px-3 py-2"
                placeholder="Beginner, Intermediate, or Expert"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className={`inline-flex items-center gap-2 rounded-[10px] px-5 py-3 font-semibold text-white ${
                canSubmit
                  ? "bg-[#0056D2] hover:opacity-90"
                  : "bg-[#0056D2] opacity-60 cursor-not-allowed"
              }`}
            >
              {isGenerating ? (
                <>
                  <Spinner className="w-4 h-4 text-white animate-spin opacity-40" />
                  Generating draft...
                </>
              ) : (
                <>Generate AI Draft</>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/instructor/courses")}
              className="rounded-[10px] border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>

          {isGenerating && (
            <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] p-4">
              <div className="flex items-center gap-2 text-[#1d4ed8] font-semibold">
                <Sparkles size={16} className="animate-pulse" />
                AI drafting in progress
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#bfdbfe]">
                <div
                  className="h-full rounded-full bg-[#2563eb] transition-all duration-500"
                  style={{
                    width: `${Math.max(
                      8,
                      Math.min(100, Number(generationProgress.progressPercent || 0)),
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[13px] text-slate-600">
                {stepLabel}
              </p>
              {generationProgress?.draftProgress && (
                <p className="text-[12px] text-slate-500 mt-1">
                  Sections: {generationProgress.draftProgress.sectionsCreated}/
                  {generationProgress.draftProgress.totalSections} · Curriculums:{" "}
                  {generationProgress.draftProgress.lessonsCreated}/
                  {generationProgress.draftProgress.totalLessons}
                </p>
              )}
            </div>
          )}

          {(isGenerating || generationResult) && progressPreview?.title && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-900">
                Live draft preview
              </h3>
              <p className="mt-2 text-[18px] font-semibold text-slate-800">
                {progressPreview.title}
              </p>
              {progressPreview.subtitle && (
                <p className="text-[14px] text-slate-600 mt-1">
                  {progressPreview.subtitle}
                </p>
              )}
              {progressPreview.description && (
                <p className="text-[13px] text-slate-600 mt-2 line-clamp-4">
                  {progressPreview.description}
                </p>
              )}
              {!!previewSections.length && (
                <div className="mt-4 space-y-3">
                  {previewSections.slice(0, 3).map((section, sectionIndex) => (
                    <div
                      key={`${section?.title || "section"}-${sectionIndex}`}
                      className="rounded-lg border border-slate-200 p-3"
                    >
                      <p className="font-semibold text-[14px] text-slate-800">
                        {sectionIndex + 1}. {section?.title || "Untitled section"}
                      </p>
                      <p className="text-[12px] text-slate-600 mt-1">
                        {(Array.isArray(section?.lessons)
                          ? section.lessons.length
                          : 0) || 0}{" "}
                        curriculums
                      </p>
                      <div className="mt-2 text-[12px] text-slate-600 space-y-1">
                        {(Array.isArray(section?.lessons) ? section.lessons : [])
                          .slice(0, 2)
                          .map((lesson, lessonIndex) => (
                            <p
                              key={`${lesson?.title || "lesson"}-${lessonIndex}`}
                            >
                              • {lesson?.title || "Untitled curriculum"}
                            </p>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {generationResult && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <CheckCircle2 size={20} />
                Draft created successfully
              </div>
              <p className="mt-2 text-[13px] text-emerald-700/90">
                {generationResult.sectionCount} sections and{" "}
                {generationResult.lessonCount} curriculums generated.
              </p>
            </div>
          )}
        </form>
      </div>
    </InstructorLayout>
  );
}
