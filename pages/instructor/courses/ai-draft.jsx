import InstructorLayout from "@/components/partials/InstructorLayout";
import BaseApi from "@/lib/api/_base.api";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Spinner from "@/components/icons/Spinner";
import {
  CheckCircle2,
  ChevronDown,
  Info,
  NotebookPen,
  Sparkles,
  ZapIcon,
} from "lucide-react";

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

        <section className="w-full max-w-4xl bg-surface border border-outline rounded-lg shadow-sm p-8 md:p-12 relative overflow-hidden">
          {/* Background Decorative Element */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-container/30 rounded-full blur-3xl pointer-events-none"></div>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
            {/* Step 1: The Brief */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-bold tracking-tight flex items-center gap-2"
                  htmlFor="course_brief"
                >
                  <span className="w-6 h-6 rounded-full bg-[#0f111a] text-white flex items-center justify-center text-[10px]">
                    01
                  </span>
                  Course brief
                </label>

                <span className="text-xs text-on-surface-variant font-medium">
                  Character limit: 5000
                </span>
              </div>

              <div className="relative group">
                <textarea
                  id="course_brief"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  maxLength={5000}
                  rows={6}
                  placeholder="Tell us about your course. What are the key topics? Who is the target audience? What are the main learning outcomes?"
                  className="w-full px-6 py-5 bg-[#f8fafc] border border-outline rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                />

                <div className="absolute bottom-4 right-4 pointer-events-none">
                  <NotebookPen className="text-slate-300 group-focus-within:text-primary/40 transition-colors" />
                </div>
              </div>
              <p className="text-[12px] text-slate-500 mt-2">
                {String(prompt || "").trim().length}/5000 characters
              </p>
            </div>

            {/* Step 2: Configuration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Preferred Language */}
              <div className="space-y-4">
                <label
                  className="text-sm font-bold tracking-tight flex items-center gap-2"
                  htmlFor="language"
                >
                  <span className="w-6 h-6 rounded-full bg-[#0f111a] text-white flex items-center justify-center text-[10px]">
                    02
                  </span>
                  Preferred language
                </label>

                <div className="relative">
                  <select
                    id="language"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="w-full appearance-none px-6 py-4 bg-[#f8fafc] border border-outline rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-on-surface cursor-pointer"
                  >
                    <option value="English">English (United States)</option>
                    <option value="Español">Español</option>
                    <option value="Français">Français</option>
                    <option value="Deutsch">Deutsch</option>
                    <option value="日本語">日本語</option>
                  </select>

                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="text-on-surface-variant" />
                  </div>
                </div>
              </div>

              {/* Preferred Level */}
              <div className="space-y-4">
                <label
                  className="text-sm font-bold tracking-tight flex items-center gap-2"
                  htmlFor="level"
                >
                  <span className="w-6 h-6 rounded-full bg-[#0f111a] text-white flex items-center justify-center text-[10px]">
                    03
                  </span>
                  Preferred level
                </label>

                <div className="relative">
                  <select
                    id="level"
                    value={instructionalLevel}
                    onChange={(event) =>
                      setInstructionalLevel(event.target.value)
                    }
                    className="w-full appearance-none px-6 py-4 bg-[#f8fafc] border border-outline rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-on-surface cursor-pointer"
                  >
                    <option value="">Not specified</option>
                    <option value="Beginner">Beginner (Foundational)</option>
                    <option value="Intermediate">
                      Intermediate (Practitioner)
                    </option>
                    <option value="Advanced">Advanced (Mastery)</option>
                    <option value="Expert">Expert (Leadership)</option>
                  </select>

                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="text-on-surface-variant" />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-8 border-t border-outline flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3 text-on-surface-variant">
                <Info className="text-blue-600" />

                <p className="text-xs font-medium leading-relaxed max-w-sm">
                  Generating a draft typically takes 10-20 seconds. You can edit
                  every aspect of the course after it's created.
                </p>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => router.push("/instructor/courses")}
                  className="flex-1 md:flex-none px-8 py-4 rounded-full font-bold text-sm text-on-surface-variant hover:bg-slate-50 transition-all border border-transparent"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`flex-1 md:flex-none px-10 py-4 text-white rounded-full font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
                    canSubmit
                      ? "bg-primary btn-shadow hover:scale-[1.02] active:scale-95"
                      : "bg-primary/70 cursor-not-allowed"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Spinner className="w-4 h-4 text-white animate-spin opacity-40" />
                      <span>Generating draft...</span>
                    </>
                  ) : (
                    <span>Generate AI Draft</span>
                  )}
                  <ZapIcon className="text-lg" />
                </button>
              </div>
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
                      Math.min(
                        100,
                        Number(generationProgress.progressPercent || 0),
                      ),
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[13px] text-slate-600">{stepLabel}</p>
              {generationProgress?.draftProgress && (
                <p className="text-[12px] text-slate-500 mt-1">
                  Sections: {generationProgress.draftProgress.sectionsCreated}/
                  {generationProgress.draftProgress.totalSections} ·
                  Curriculums: {generationProgress.draftProgress.lessonsCreated}
                  /{generationProgress.draftProgress.totalLessons}
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
                        {sectionIndex + 1}.{" "}
                        {section?.title || "Untitled section"}
                      </p>
                      <p className="text-[12px] text-slate-600 mt-1">
                        {(Array.isArray(section?.lessons)
                          ? section.lessons.length
                          : 0) || 0}{" "}
                        curriculums
                      </p>
                      <div className="mt-2 text-[12px] text-slate-600 space-y-1">
                        {(Array.isArray(section?.lessons)
                          ? section.lessons
                          : []
                        )
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
        </section>
      </div>
    </InstructorLayout>
  );
}
