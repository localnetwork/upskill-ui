import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Check, ChevronLeft, ExternalLink, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";
import RolePlaySetupStep from "@/components/entities/course/role-play/RolePlaySetupStep";
import RolePlayReviewStep from "@/components/entities/course/role-play/RolePlayReviewStep";
import RolePlayPreview from "@/components/entities/course/role-play/RolePlayPreview";

const API = process.env.NEXT_PUBLIC_API_URL;

const emptySetup = {
  skills: "",
  scenario: "",
  additional_context: "",
  lecture_ids: [],
};
const emptyDetails = {
  meeting_title: "",
  scenario: "",
  duration_minutes: 5,
  learner_role: "",
  learner_goals: [],
  ai_character: { name: "", role: "", personality: "", voice: "character-1" },
  ai_instructions: "",
  opening_message: "",
};

function pickDetails(asset = {}) {
  return {
    ...emptyDetails,
    ...Object.fromEntries(
      Object.keys(emptyDetails).map((key) => [
        key,
        asset[key] ?? emptyDetails[key],
      ]),
    ),
    ai_character: {
      ...emptyDetails.ai_character,
      ...(asset.ai_character || {}),
    },
  };
}

function StepBadge({ index, label, state }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-bold ${
          state === "inactive"
            ? "bg-white text-slate-900"
            : "bg-[#3b1a8a] text-white"
        }`}
      >
        {state === "done" ? <Check size={16} /> : index}
      </span>
      <span
        className={
          state === "inactive" ? "text-slate-500" : "font-bold text-slate-900"
        }
      >
        {label}
      </span>
    </div>
  );
}

export default function RolePlayPage() {
  const router = useRouter();
  const { slug, lessonId } = router.query;
  const curriculumUrl = `/instructor/courses/${slug}/curriculum`;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("setup");
  const [setup, setSetup] = useState(emptySetup);
  const [details, setDetails] = useState(emptyDetails);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const hydrate = useCallback((curriculum) => {
    const asset = curriculum?.asset || {};
    setSetup({ ...emptySetup, ...(asset.setup || {}) });
    setDetails(pickDetails(asset));
    setStep(asset.generated ? "review" : "setup");
  }, []);

  useEffect(() => {
    if (!lessonId) return;
    let active = true;
    (async () => {
      try {
        const response = await BaseApi.get(
          `${API}/course-curriculums/${lessonId}/role-play`,
        );
        if (!active) return;
        const payload = response?.data?.data;
        setData(payload);
        hydrate(payload?.curriculum);
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Unable to load this Role Play",
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [lessonId, hydrate]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await BaseApi.post(
        `${API}/course-curriculums/${lessonId}/role-play/generate`,
        setup,
      );
      const curriculum = response?.data?.data;
      setData((prev) => ({ ...prev, curriculum }));
      setDetails(pickDetails(curriculum?.asset));
      setStep("review");
      window.scrollTo({ top: 0 });
      if (response?.data?.used_fallback) {
        toast(
          "AI was unavailable, so a basic draft was created. Please review it carefully.",
        );
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to generate the Role Play",
      );
    } finally {
      setGenerating(false);
    }
  };

  const save = async (publish) => {
    if (
      publish &&
      (!details.meeting_title.trim() ||
        !details.scenario.trim() ||
        !details.learner_role.trim() ||
        !details.learner_goals.some((goal) => goal.trim()))
    ) {
      toast.error(
        "Add a title, scenario, learner role and at least one goal first",
      );
      return;
    }
    setSaving(true);
    try {
      const response = await BaseApi.put(
        `${API}/course-curriculums/${lessonId}/role-play`,
        {
          role_play: {
            ...details,
            learner_goals: details.learner_goals.filter((goal) => goal.trim()),
          },
          ...(publish ? { publish: true } : {}),
        },
      );
      const curriculum = response?.data?.data;
      setData((prev) => ({ ...prev, curriculum }));
      setDetails(pickDetails(curriculum?.asset));
      toast.success(publish ? "Role Play published" : "Role Play saved");
      if (publish) router.push(curriculumUrl);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save the Role Play",
      );
    } finally {
      setSaving(false);
    }
  };

  const isReview = step === "review";
  const title = data?.curriculum?.title || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e3f3f3] via-[#f6f7f9] to-[#fbe9d4]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <Link
            href={curriculumUrl}
            className="inline-flex items-center gap-1 text-[14px] font-bold text-primary"
          >
            <ChevronLeft size={16} /> Back to curriculum
          </Link>
          {isReview && title && (
            <span className="text-[17px] text-slate-900">{title}</span>
          )}
        </div>
        {isReview && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="inline-flex items-center gap-2 rounded border border-primary px-4 py-2 text-[14px] font-bold text-primary"
            >
              <ExternalLink size={14} /> Preview
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => save(false)}
              className="rounded border border-primary px-5 py-2 text-[14px] font-bold text-primary disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => save(true)}
              className="rounded bg-primary px-5 py-2 text-[14px] font-bold text-white disabled:opacity-50"
            >
              {data?.curriculum?.asset?.status === "PUBLISHED"
                ? "Publish changes"
                : "Publish"}
            </button>
          </div>
        )}
      </header>

      <div className="flex justify-center gap-6 px-4 py-8">
        <StepBadge
          index={1}
          label="Role Play setup"
          state={isReview ? "done" : "active"}
        />
        <span className="self-center text-slate-500">→</span>
        <StepBadge
          index={2}
          label="Review details"
          state={isReview ? "active" : "inactive"}
        />
      </div>

      <div className="px-4 pb-28">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : !data ? (
          <p className="text-center text-slate-600">
            This Role Play could not be loaded.
          </p>
        ) : isReview ? (
          <RolePlayReviewStep
            details={details}
            onChange={(patch) => setDetails((prev) => ({ ...prev, ...patch }))}
            onRegenerate={() => setStep("setup")}
          />
        ) : (
          <RolePlaySetupStep
            data={data}
            setup={setup}
            onSetupChange={(patch) =>
              setSetup((prev) => ({ ...prev, ...patch }))
            }
            onGenerate={handleGenerate}
            generating={generating}
          />
        )}
      </div>

      {showPreview && (
        <RolePlayPreview
          details={details}
          lessonId={lessonId}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
